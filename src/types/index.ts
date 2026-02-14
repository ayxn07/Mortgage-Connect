/**
 * Central type exports for MortgageConnect.
 *
 * Usage:
 *   import type { User, Agent, MortgageApplication } from '@/src/types';
 */

// User & Auth
export type {
  User,
  UserRole,
  NotificationPreferences,
  UserSettings,
  CreateUserInput,
  SignInInput,
} from './user';

// Agent
export type {
  Agent,
  AgentService,
  FeaturedAgent,
  AgentCard,
  AgentFilters,
  AgentCategory,
} from './agent';
export { AGENT_CATEGORIES } from './agent';

// Mortgage Application
export type {
  MortgageApplication,
  ApplicationStatus,
  PropertyType,
  PropertyReadiness,
  EmploymentType,
  ApplicantIdentity,
  ContactResidency,
  EmploymentIncome,
  SalariedDetails,
  SelfEmployedDetails,
  FinancialObligations,
  LoanObligation,
  PropertyDetails,
  MortgagePreferences,
  EligibilityResults,
  UploadedDocument,
  DocumentUploads,
  ConsentDeclarations,
  DocumentCategory,
  Gender,
  MaritalStatus,
  ResidentialStatus,
  EmirateType,
  SalariedEmploymentType,
  OfficeLocationType,
  InterestType,
  EMICalculationInput,
  EMICalculationResult,
  EligibilityInput,
  EligibilityResult,
} from './application';

// Review
export type { Review, CreateReviewInput } from './review';

// Support
export type {
  SupportQuery,
  SupportCategory,
  SupportStatus,
  CreateSupportQueryInput,
  FAQ,
} from './support';

// Chat
export type {
  Chat,
  ChatType,
  ChatParticipant,
  Message,
  MessageType,
  MessageContent,
  UserPresence,
  SendMessageInput,
  CreateChatInput,
  ChatListItem,
} from './chat';

// AI Chat
export type {
  CalculatorType,
  AIInteractionType,
  AIOptionItem,
  AIInputConfig,
  AIResultBreakdownItem,
  AIResultData,
  AIInteraction,
  AIMessageSender,
  AIMessageType,
  AIMessage,
  AICalculatorFlow,
  CalculatorStepDef,
  AIConversation,
  AIChatRequest,
  AIChatResponse,
  FeatureFlags,
} from './aiChat';
