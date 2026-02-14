/**
 * AI Chat types for the AI Mortgage Assistant feature.
 *
 * The AI assistant is a hybrid conversational + calculator interface
 * that provides UAE-specific mortgage guidance and interactive
 * calculator flows with rich UI elements.
 */

// =====================================================================
// Calculator Types
// =====================================================================

export type CalculatorType =
  | 'emi'
  | 'affordability'
  | 'upfront_costs'
  | 'rate_comparison'
  | 'prepayment'
  | 'rent_vs_buy';

// =====================================================================
// AI Interaction Types (rich UI elements in chat)
// =====================================================================

export type AIInteractionType =
  | 'calculator_menu'
  | 'parameter_input'
  | 'option_buttons'
  | 'option_grid'
  | 'calculator_result'
  | 'slider_input'
  | 'quick_actions';

export interface AIOptionItem {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AIInputConfig {
  key: string;
  label: string;
  placeholder?: string;
  prefix?: string; // e.g. 'AED' or '%'
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  quickValues?: { label: string; value: number }[];
  helperText?: string;
}

export interface AIResultBreakdownItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface AIResultData {
  title: string;
  primaryLabel: string;
  primaryValue: string;
  breakdown: AIResultBreakdownItem[];
  insights: string[];
  actions: AIOptionItem[];
}

export interface AIInteraction {
  type: AIInteractionType;
  options?: AIOptionItem[];
  inputConfig?: AIInputConfig;
  resultData?: AIResultData;
  step?: number;
  totalSteps?: number;
  gridColumns?: number; // for option_grid layout (default 2)
}

// =====================================================================
// AI Message
// =====================================================================

export type AIMessageSender = 'user' | 'ai';
export type AIMessageType = 'text' | 'ai_interaction';

export interface AIMessage {
  id: string;
  senderId: AIMessageSender;
  type: AIMessageType;
  text?: string;
  interaction?: AIInteraction;
  timestamp: number;
}

// =====================================================================
// Calculator Flow State
// =====================================================================

export interface AICalculatorFlow {
  flowId: string;
  calculatorType: CalculatorType;
  currentStep: number;
  totalSteps: number;
  collectedData: Record<string, number | string>;
  isComplete: boolean;
}

// =====================================================================
// Calculator Step Definition (used internally by the service)
// =====================================================================

export interface CalculatorStepDef {
  key: string;
  message: string;
  interaction: AIInteraction;
}

// =====================================================================
// AI Conversation (top-level container)
// =====================================================================

export interface AIConversation {
  messages: AIMessage[];
  activeFlow: AICalculatorFlow | null;
}

// =====================================================================
// Cloud Function request/response
// =====================================================================

export interface AIChatRequest {
  message: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

export interface AIChatResponse {
  reply: string;
  error?: string;
}

// =====================================================================
// Feature Flags
// =====================================================================

export interface FeatureFlags {
  aiAssistantEnabled: boolean;
}
