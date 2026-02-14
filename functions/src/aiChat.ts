import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";

// =====================================================================
// Secrets
// =====================================================================

const openRouterApiKey = defineSecret("OPENROUTER_API_KEY");

// =====================================================================
// Types
// =====================================================================

interface AIChatRequestBody {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  userId?: string;
}

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// =====================================================================
// Rate limiting (in-memory, per-instance)
// =====================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// =====================================================================
// System Prompt
// =====================================================================

const SYSTEM_PROMPT = `You are a helpful UAE mortgage assistant for MortgageConnect, a mortgage broker app in the United Arab Emirates.

Your role:
- Answer general mortgage questions with UAE-specific knowledge
- Explain UAE mortgage rules, regulations, fees, and processes
- Be concise, friendly, and professional
- When users ask about calculations, suggest using the in-app calculators (EMI, Affordability, Upfront Costs, Rate Comparison, Prepayment, Rent vs Buy)

Key UAE mortgage facts you should know:
- UAE Central Bank max LTV: 80% for residents (first home ≤AED 5M), 75% for second home, 60-65% for non-residents
- Max debt burden ratio (DBR): 50% of monthly salary
- DLD transfer fee: 4% in Dubai, 2% in Abu Dhabi
- Mortgage registration: 0.25% of loan + AED 290 in Dubai
- Typical bank processing fee: 1% of loan (min AED 5,000)
- Trustee fee: AED 4,000 + VAT for properties > AED 500K in Dubai
- VAT: 5% on bank fees, valuation, agent commission
- Max mortgage tenure: 25 years
- Property valuation fee: ~AED 2,500-3,500
- Agent commission: typically 2% of property price
- Early settlement fee: typically 1% of outstanding principal
- Non-residents can buy in designated freehold areas
- Off-plan properties use Oqood fee (4%) instead of DLD transfer fee

Important guidelines:
- Never provide specific financial advice — always recommend consulting a mortgage advisor
- When numbers or calculations are needed, suggest using the built-in calculators
- Keep responses under 200 words for better mobile readability
- Use AED as the currency
- Be aware that this is an experimental feature — mention it if users ask about accuracy`;

// =====================================================================
// OpenRouter API Configuration
// =====================================================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-v3.2";

// =====================================================================
// Cloud Function
// =====================================================================

export const aiChat = onRequest(
  {
    cors: true,
    invoker: "public",
    // Set longer timeout for AI responses
    timeoutSeconds: 60,
    memory: "256MiB",
    // Bind the secret so it's available at runtime
    secrets: [openRouterApiKey],
  },
  async (request, response) => {
    // Only allow POST
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { message, conversationHistory, userId } = request.body as AIChatRequestBody;

      // Validate input
      if (!message || typeof message !== "string") {
        response.status(400).json({ error: "Missing or invalid 'message' field" });
        return;
      }

      // Rate limiting
      const userKey = userId || request.ip || "anonymous";
      if (!checkRateLimit(userKey)) {
        response.status(429).json({
          error: "Rate limit exceeded. Please wait a moment before sending another message.",
        });
        return;
      }

      // Get API key from Secret Manager
      const apiKey = openRouterApiKey.value();

      if (!apiKey) {
        response.status(500).json({
          error: "AI service is not configured. Please set the OpenRouter API key secret.",
        });
        return;
      }

      // Build messages array
      const messages: OpenRouterMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      // Add conversation history (limit to last 10 messages to save tokens)
      const recentHistory = (conversationHistory || []).slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Add current message
      messages.push({ role: "user", content: message });

      // Call OpenRouter API
      const openRouterResponse = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://mortgageconnect.ae",
          "X-Title": "MortgageConnect AI Assistant",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!openRouterResponse.ok) {
        const errorBody = await openRouterResponse.text();
        console.error("[AIChat] OpenRouter error:", openRouterResponse.status, errorBody);

        // Provide user-friendly fallback
        response.status(200).json({
          reply: "I'm having trouble connecting to my AI service right now. " +
            "In the meantime, you can use the calculators above to get quick answers " +
            "about EMI, affordability, upfront costs, and more!",
          error: "upstream_error",
        });
        return;
      }

      const data = await openRouterResponse.json();
      const reply = data.choices?.[0]?.message?.content || "";

      if (!reply) {
        response.status(200).json({
          reply: "I couldn't generate a response. Please try rephrasing your question, " +
            "or use the calculators for quick mortgage calculations!",
          error: "empty_response",
        });
        return;
      }

      response.status(200).json({ reply });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[AIChat] Error:", message);

      response.status(200).json({
        reply: "Something went wrong on my end. Please try again in a moment, " +
          "or use the built-in calculators for quick answers!",
        error: "internal_error",
      });
    }
  }
);
