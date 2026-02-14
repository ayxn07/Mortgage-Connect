/**
 * AI Chat Store — Zustand state management for the AI Mortgage Assistant.
 *
 * Manages messages, active calculator flows, loading states,
 * and orchestrates the interaction between user input and the AI service.
 */
import { create } from 'zustand';
import type { AIMessage, AICalculatorFlow, CalculatorType } from '../types/aiChat';
import {
  createWelcomeMessages,
  detectCalculatorIntent,
  startCalculatorFlow,
  continueCalculatorFlow,
  callAIModel,
  processTextForQuickActions,
  generateMessageId,
} from '../services/aiChat';

interface AIChatState {
  /** All messages in the conversation */
  messages: AIMessage[];
  /** Currently active calculator flow (null if in general chat mode) */
  activeFlow: AICalculatorFlow | null;
  /** Loading state for AI responses */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Conversation history for AI context (text messages only) */
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Initialize with welcome messages */
  initialize: () => void;
  /** Send a text message from the user */
  sendMessage: (text: string, userId?: string) => Promise<void>;
  /** Start a specific calculator flow */
  startCalculator: (type: CalculatorType) => void;
  /** Submit a value for the current calculator step */
  submitInput: (key: string, value: number | string) => void;
  /** Select an option (from option buttons or calculator menu) */
  selectOption: (value: string | number) => void;
  /** Handle result card actions (recalculate, start another calculator) */
  handleResultAction: (actionValue: string) => void;
  /** Cancel the active flow and return to general chat */
  cancelFlow: () => void;
  /** Clear all messages and reset */
  clearChat: () => void;
  /** Clear error */
  clearError: () => void;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  messages: [],
  activeFlow: null,
  loading: false,
  error: null,
  conversationHistory: [],

  initialize: () => {
    const { messages } = get();
    if (messages.length > 0) return; // Already initialized
    const welcomeMessages = createWelcomeMessages();
    set({ messages: welcomeMessages });
  },

  sendMessage: async (text: string, userId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { activeFlow, messages, conversationHistory } = get();

    // Create user message
    const userMessage: AIMessage = {
      id: generateMessageId(),
      senderId: 'user',
      type: 'text',
      text: trimmed,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMessage], error: null });

    // If there's an active flow, the text input might be for a calculator step
    if (activeFlow && !activeFlow.isComplete) {
      const steps = getStepsForFlow(activeFlow);
      if (steps && activeFlow.currentStep < steps.length) {
        const currentStepKey = steps[activeFlow.currentStep];
        const numValue = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
        if (!isNaN(numValue) && numValue > 0) {
          get().submitInput(currentStepKey, numValue);
          return;
        }
      }
    }

    // Check for quick actions (menu, calculators)
    const quickActionMessages = processTextForQuickActions(trimmed);
    if (quickActionMessages) {
      set((state) => ({
        messages: [...state.messages, ...quickActionMessages],
        activeFlow: null,
      }));
      return;
    }

    // Check for calculator intent
    const intent = detectCalculatorIntent(trimmed);
    if (intent) {
      get().startCalculator(intent);
      return;
    }

    // General conversation — call AI
    set({ loading: true });

    try {
      const reply = await callAIModel(trimmed, conversationHistory, userId);

      const aiMessage: AIMessage = {
        id: generateMessageId(),
        senderId: 'ai',
        type: 'text',
        text: reply,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, aiMessage],
        loading: false,
        conversationHistory: [
          ...state.conversationHistory,
          { role: 'user' as const, content: trimmed },
          { role: 'assistant' as const, content: reply },
        ].slice(-20), // Keep last 20 messages for context
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      set({ loading: false, error: errorMessage });
    }
  },

  startCalculator: (type: CalculatorType) => {
    const { flow, messages: flowMessages } = startCalculatorFlow(type);

    set((state) => ({
      messages: [...state.messages, ...flowMessages],
      activeFlow: flow,
      error: null,
    }));
  },

  submitInput: (key: string, value: number | string) => {
    const { activeFlow } = get();
    if (!activeFlow || activeFlow.isComplete) return;

    // Add user's response as a message
    const displayValue =
      typeof value === 'number'
        ? key.includes('Percent') || key.includes('Rate') || key === 'interestRate'
          ? `${value}%`
          : `AED ${value.toLocaleString('en-US')}`
        : String(value);

    const userEchoMessage: AIMessage = {
      id: generateMessageId(),
      senderId: 'user',
      type: 'text',
      text: displayValue,
      timestamp: Date.now(),
    };

    const { flow: updatedFlow, messages: nextMessages } = continueCalculatorFlow(
      activeFlow,
      key,
      value
    );

    set((state) => ({
      messages: [...state.messages, userEchoMessage, ...nextMessages],
      activeFlow: updatedFlow.isComplete ? null : updatedFlow,
    }));
  },

  selectOption: (value: string | number) => {
    const { activeFlow } = get();

    // If no active flow, this might be a calculator menu selection
    if (!activeFlow) {
      const calcType = String(value) as CalculatorType;
      const validTypes: CalculatorType[] = [
        'emi',
        'affordability',
        'upfront_costs',
        'rate_comparison',
        'prepayment',
        'rent_vs_buy',
      ];
      if (validTypes.includes(calcType)) {
        // Add user selection message
        const labelMap: Record<CalculatorType, string> = {
          emi: 'EMI Calculator',
          affordability: 'Affordability',
          upfront_costs: 'Upfront Costs',
          rate_comparison: 'Rate Comparison',
          prepayment: 'Prepayment',
          rent_vs_buy: 'Rent vs Buy',
        };

        const userMessage: AIMessage = {
          id: generateMessageId(),
          senderId: 'user',
          type: 'text',
          text: labelMap[calcType] || calcType,
          timestamp: Date.now(),
        };

        set((state) => ({ messages: [...state.messages, userMessage] }));
        get().startCalculator(calcType);
      }
      return;
    }

    // Active flow — submit the selected option
    if (!activeFlow.isComplete) {
      const steps = getStepsForFlow(activeFlow);
      if (steps && activeFlow.currentStep < steps.length) {
        const currentStepKey = steps[activeFlow.currentStep];
        get().submitInput(currentStepKey, value);
      }
    }
  },

  handleResultAction: (actionValue: string) => {
    // Handle actions from result cards
    if (actionValue.startsWith('recalculate_')) {
      const calcType = actionValue.replace('recalculate_', '') as CalculatorType;
      const userMessage: AIMessage = {
        id: generateMessageId(),
        senderId: 'user',
        type: 'text',
        text: 'Recalculate',
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, userMessage] }));
      get().startCalculator(calcType);
    } else if (actionValue.startsWith('start_')) {
      const calcType = actionValue.replace('start_', '') as CalculatorType;
      const userMessage: AIMessage = {
        id: generateMessageId(),
        senderId: 'user',
        type: 'text',
        text: `Open ${calcType.replace(/_/g, ' ')}`,
        timestamp: Date.now(),
      };
      set((state) => ({ messages: [...state.messages, userMessage] }));
      get().startCalculator(calcType);
    }
  },

  cancelFlow: () => {
    const cancelMessage: AIMessage = {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'text',
      text: 'No problem! Feel free to ask me anything about UAE mortgages or select a calculator from the menu.',
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, cancelMessage],
      activeFlow: null,
    }));
  },

  clearChat: () => {
    const welcomeMessages = createWelcomeMessages();
    set({
      messages: welcomeMessages,
      activeFlow: null,
      loading: false,
      error: null,
      conversationHistory: [],
    });
  },

  clearError: () => set({ error: null }),
}));

// =====================================================================
// Helper: get step keys for a flow type
// =====================================================================

function getStepsForFlow(flow: AICalculatorFlow): string[] | null {
  const stepKeys: Record<CalculatorType, string[]> = {
    emi: ['propertyPrice', 'downPaymentPercent', 'interestRate', 'years'],
    affordability: ['monthlySalary', 'existingEMIs', 'creditCardLimits'],
    upfront_costs: ['propertyPrice', 'downPaymentPercent', 'emirate', 'propertyReadiness'],
    rate_comparison: ['propertyPrice', 'downPaymentPercent', 'years'],
    prepayment: ['loanAmount', 'interestRate', 'remainingYears', 'lumpSumAmount', 'extraMonthly'],
    rent_vs_buy: [
      'propertyPrice',
      'monthlyRent',
      'downPaymentPercent',
      'interestRate',
      'yearsToCompare',
    ],
  };

  return stepKeys[flow.calculatorType] || null;
}
