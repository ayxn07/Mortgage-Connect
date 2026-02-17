/**
 * Input sanitization and security utilities.
 *
 * Provides functions to sanitize user input before storing in Firestore,
 * rate limiting for API calls, and XSS prevention.
 */

// ─── Text Sanitization ──────────────────────────────────────────────────────

/**
 * Strip HTML tags from a string to prevent XSS.
 * Preserves plain text content.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Escape HTML special characters to prevent injection.
 */
export function escapeHtml(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Sanitize a text input field. Removes HTML tags, trims whitespace,
 * and normalizes multiple spaces to single spaces.
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input).replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize an email address. Lowercases and trims.
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.toLowerCase().trim();
}

/**
 * Sanitize a phone number. Removes non-numeric characters except + prefix.
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.replace(/[^\d+]/g, '');
  // Ensure only one + at the start
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\+/g, '');
  }
  return cleaned;
}

/**
 * Sanitize a numeric input. Returns 0 for invalid values.
 */
export function sanitizeNumber(input: string | number, min = 0, max = Infinity): number {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num) || !isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize a chat message. Strips HTML, trims, and enforces max length.
 */
export function sanitizeMessage(input: string, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  const sanitized = stripHtml(input).trim();
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
}

/**
 * Sanitize an object by applying sanitizeText to all string fields.
 * Useful for sanitizing form data before Firestore writes.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    emailFields?: string[];
    phoneFields?: string[];
    numericFields?: string[];
    skipFields?: string[];
  } = {}
): T {
  const result = { ...obj };
  const { emailFields = [], phoneFields = [], numericFields = [], skipFields = [] } = options;

  for (const key of Object.keys(result)) {
    if (skipFields.includes(key)) continue;

    const value = result[key];
    if (typeof value !== 'string') continue;

    if (emailFields.includes(key)) {
      (result as Record<string, unknown>)[key] = sanitizeEmail(value);
    } else if (phoneFields.includes(key)) {
      (result as Record<string, unknown>)[key] = sanitizePhone(value);
    } else if (numericFields.includes(key)) {
      (result as Record<string, unknown>)[key] = sanitizeNumber(value);
    } else {
      (result as Record<string, unknown>)[key] = sanitizeText(value);
    }
  }

  return result;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  firstRequestTime: number;
}

/** In-memory rate limit tracker */
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiter. Returns true if the action is allowed,
 * false if rate limit is exceeded.
 *
 * @param key - Unique key for the action (e.g., 'send_message', 'submit_review')
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs = 60000
): { allowed: boolean; remainingRequests: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstRequestTime > windowMs) {
    // Window expired or first request, reset
    rateLimitMap.set(key, { count: 1, firstRequestTime: now });
    return { allowed: true, remainingRequests: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - entry.firstRequestTime);
    return { allowed: false, remainingRequests: 0, retryAfterMs };
  }

  entry.count++;
  return { allowed: true, remainingRequests: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Reset rate limit for a specific key.
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Clear all rate limits (useful for logout/cleanup).
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear();
}

// ─── Profanity Filter (basic) ───────────────────────────────────────────────

/**
 * Basic profanity words list. In production, use a comprehensive library.
 * This is intentionally minimal and covers common patterns.
 */
const PROFANITY_PATTERNS = [
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bd+a+m+n+\b/i,
  /\bba+sta+rd\b/i,
];

/**
 * Check if text contains profanity. Returns true if profanity is detected.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Replace profanity in text with asterisks.
 */
export function filterProfanity(text: string): string {
  if (!text) return '';
  let filtered = text;
  for (const pattern of PROFANITY_PATTERNS) {
    filtered = filtered.replace(pattern, (match) => '*'.repeat(match.length));
  }
  return filtered;
}
