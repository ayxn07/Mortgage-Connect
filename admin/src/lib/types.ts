import { Timestamp } from "firebase/firestore";

// ============ User Types ============
export type UserRole = "user" | "agent" | "admin";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  phone?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ Agent Types ============
export interface AgentService {
  name: string;
  price: number;
  duration: string;
}

export interface Agent extends User {
  role: "agent";
  specialty: string[];
  avgRating: number;
  reviewCount: number;
  totalReviews: number;
  bio: string;
  experience: number;
  languages: string[];
  availability: boolean;
  hourlyRate: number;
  completedProjects: number;
  responseTime: string;
  services: AgentService[];
  location: string;
  whatsapp?: string;
}

// ============ Application Types ============
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "pre_approval"
  | "property_valuation"
  | "bank_approval"
  | "offer_letter"
  | "disbursement"
  | "rejected"
  | "completed";

export interface ApplicantIdentity {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  dependents: number;
  emiratesId: string;
  passportNumber: string;
}

export interface ContactResidency {
  mobile: string;
  email: string;
  currentAddress: string;
  emirate: string;
  residentialStatus: string;
  yearsInUAE: number;
}

export interface SalariedDetails {
  companyName: string;
  jobTitle: string;
  monthlyBasicSalary: number;
  monthlyAllowances: number;
  totalMonthlySalary: number;
  employmentDuration: number;
  salaryTransferBank: string;
  salaryCertificateAvailable: boolean;
}

export interface SelfEmployedDetails {
  businessName: string;
  businessType: string;
  tradeLicenseNumber: string;
  annualRevenue: number;
  monthlyNetIncome: number;
  yearsInBusiness: number;
}

export interface EmploymentIncome {
  employmentType: string;
  salariedDetails?: SalariedDetails;
  selfEmployedDetails?: SelfEmployedDetails;
}

export interface LoanObligation {
  type: string;
  monthlyEMI: number;
  outstandingBalance: number;
  remainingTenure: number;
}

export interface FinancialObligations {
  existingLoans: LoanObligation[];
  creditCardLimits: number;
  totalMonthlyEMI: number;
}

export interface PropertyDetails {
  propertyType: string;
  developer: string;
  projectName: string;
  area: string;
  propertyPrice: number;
  propertySize: number;
  bedrooms: number;
  propertyReadiness: string;
}

export interface MortgagePreferences {
  propertyValue: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  loanTenure: number;
  interestType: string;
}

export interface EligibilityResults {
  isEligible: boolean;
  eligibleLoanAmount: number;
  estimatedEMI: number;
  debtBurdenRatio: number;
  ltvRatio: number;
  interestRate: number;
}

export interface UploadedDocument {
  id: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadURL: string;
  uploadedAt: Timestamp;
}

export interface DocumentUploads {
  documents: UploadedDocument[];
}

export interface ConsentDeclarations {
  aecbConsent: boolean;
  bankContactConsent: boolean;
  dataProcessingConsent: boolean;
  accuracyDeclaration: boolean;
  termsAccepted: boolean;
  consentDate?: Timestamp;
}

export interface MortgageApplication {
  applicationId: string;
  userId: string;
  agentId?: string;
  status: ApplicationStatus;
  currentStep: number;
  applicantIdentity: ApplicantIdentity;
  contactResidency: ContactResidency;
  employmentIncome: EmploymentIncome;
  financialObligations: FinancialObligations;
  propertyDetails: PropertyDetails;
  mortgagePreferences: MortgagePreferences;
  eligibilityResults: EligibilityResults;
  documentUploads: DocumentUploads;
  consentDeclarations: ConsentDeclarations;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ Support Types ============
export type SupportCategory = "general" | "technical" | "billing" | "feedback";
export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportQuery {
  queryId: string;
  uid: string;
  category: SupportCategory;
  subject: string;
  message: string;
  name: string;
  email: string;
  attachments?: string[];
  status: SupportStatus;
  adminResponse?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ Review Types ============
export interface Review {
  reviewId: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

// ============ Chat Types ============
export type ChatType = "user_agent" | "user_admin" | "agent_admin";
export type MessageType = "text" | "image" | "document" | "system";

export interface ChatParticipant {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
}

export interface Chat {
  chatId: string;
  type: ChatType;
  participants: Record<string, ChatParticipant>;
  participantIds: string[];
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
    type: MessageType;
  } | null;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived: Record<string, boolean>;
  muted: Record<string, boolean>;
}

export interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  type: MessageType;
  content: {
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
  };
  timestamp: Timestamp;
  readBy: Record<string, Timestamp>;
  edited: boolean;
  editedAt?: Timestamp;
  deleted: boolean;
  deletedAt?: Timestamp;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
  };
}

// ============ Stats Types ============
export interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalApplications: number;
  totalSupportTickets: number;
  pendingApplications: number;
  openTickets: number;
  approvedApplications: number;
  rejectedApplications: number;
}
