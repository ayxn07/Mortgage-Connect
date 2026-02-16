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
  isFeatured?: boolean;
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
  numberOfDependents: number;
  emiratesIdNumber: string;
  emiratesIdExpiry: string;
  passportNumber: string;
  passportExpiry: string;
}

export interface ContactResidency {
  mobileNumber: string;
  email: string;
  currentAddress: string;
  emirate: string;
  residentialStatus: string;
  yearsInUAE: number;
}

export interface SalariedDetails {
  employerName: string;
  employerIndustry: string;
  jobTitle: string;
  lengthOfServiceMonths: number;
  monthlyGrossSalary: number;
  monthlyNetSalary: number;
  salariedEmploymentType: string;
  salaryTransferBank: string;
}

export interface SelfEmployedDetails {
  companyName: string;
  tradeLicenseNumber: string;
  companyAgeYears: number;
  monthlyAverageIncome: number;
  officeLocation: string;
  ownershipPercentage: number;
}

export interface EmploymentIncome {
  employmentType: string;
  salaried?: SalariedDetails;
  selfEmployed?: SelfEmployedDetails;
}

export interface LoanObligation {
  id: string;
  type: 'personal' | 'auto' | 'credit_card' | 'other';
  label: string;
  emiAmount: number;
}

export interface FinancialObligations {
  hasExistingLoans: boolean;
  loans: LoanObligation[];
  creditCardsCount: number;
  totalCreditCardLimit: number;
  totalMonthlyEMI: number;
}

export interface PropertyDetails {
  propertyIdentified: boolean;
  propertyType: string;
  propertyStatus: string;
  developerName: string;
  projectName: string;
  locationArea: string;
  purchasePrice: number;
  expectedCompletionDate: string;
  unitSizeSqft: number;
  numberOfBedrooms: number;
  parkingIncluded: boolean;
}

export interface MortgagePreferences {
  propertyValue: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  preferredLoanAmount: number;
  loanTenureYears: number;
  interestType: string;
  isFirstTimeBuyer: boolean;
}

export interface EligibilityResults {
  eligibleLoanAmount: number;
  estimatedEMI: number;
  dbrPercent: number;
  ltvPercent: number;
  approxRateMin: number;
  approxRateMax: number;
  eligibleBanksCount: number;
  additionalDownPaymentRequired: number;
}

export interface UploadedDocument {
  id: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadURL: string;
  uploadedAt: string | Timestamp;
}

export interface DocumentUploads {
  documents: UploadedDocument[];
}

export interface ConsentDeclarations {
  aecbConsent: boolean;
  bankContactConsent: boolean;
  dataProcessingConsent: boolean;
  accuracyConfirmation: boolean;
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
