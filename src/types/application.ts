import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// =====================================================================
// Enums & Literals
// =====================================================================

/** Application status flow matching UAE mortgage process */
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'pre_approval'
  | 'property_valuation'
  | 'bank_approval'
  | 'offer_letter'
  | 'disbursement'
  | 'rejected'
  | 'completed';

export type Gender = 'male' | 'female';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type ResidentialStatus = 'rent' | 'own' | 'company_provided';
export type EmirateType = 'dubai' | 'abu_dhabi' | 'sharjah' | 'other';

export type EmploymentType = 'salaried' | 'self_employed' | 'business_owner' | 'freelancer';
export type SalariedEmploymentType = 'permanent' | 'contract';
export type OfficeLocationType = 'freezone' | 'mainland';

export type PropertyType = 'apartment' | 'villa' | 'townhouse';
export type PropertyReadiness = 'ready' | 'off_plan';
export type InterestType = 'fixed' | 'variable' | 'fixed_to_variable';

export type DocumentCategory =
  | 'emirates_id_front'
  | 'emirates_id_back'
  | 'passport'
  | 'visa'
  | 'salary_certificate'
  | 'bank_statements'
  | 'labour_contract'
  | 'trade_license'
  | 'moa'
  | 'audited_financials'
  | 'property_mou'
  | 'title_deed'
  | 'spa'
  | 'other';

// =====================================================================
// Step 1: Applicant Identity (KYC)
// =====================================================================
export interface ApplicantIdentity {
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  gender: Gender | '';
  maritalStatus: MaritalStatus | '';
  numberOfDependents: number;
  emiratesIdNumber: string;
  emiratesIdExpiry: string;
  passportNumber: string;
  passportExpiry: string;
}

// =====================================================================
// Step 2: Contact & Residency
// =====================================================================
export interface ContactResidency {
  mobileNumber: string;
  email: string;
  currentAddress: string;
  emirate: EmirateType | '';
  residentialStatus: ResidentialStatus | '';
  yearsInUAE: number;
}

// =====================================================================
// Step 3: Employment & Income
// =====================================================================
export interface SalariedDetails {
  employerName: string;
  employerIndustry: string;
  jobTitle: string;
  salariedEmploymentType: SalariedEmploymentType | '';
  monthlyGrossSalary: number;
  monthlyNetSalary: number;
  salaryTransferBank: string;
  lengthOfServiceMonths: number;
}

export interface SelfEmployedDetails {
  companyName: string;
  tradeLicenseNumber: string;
  companyAgeYears: number;
  ownershipPercentage: number;
  monthlyAverageIncome: number;
  officeLocation: OfficeLocationType | '';
}

export interface EmploymentIncome {
  employmentType: EmploymentType | '';
  salaried: SalariedDetails;
  selfEmployed: SelfEmployedDetails;
}

// =====================================================================
// Step 4: Financial Obligations
// =====================================================================
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
  totalMonthlyEMI: number; // auto-calculated
}

// =====================================================================
// Step 5: Property Details
// =====================================================================
export interface PropertyDetails {
  propertyIdentified: boolean;
  propertyType: PropertyType | '';
  propertyStatus: PropertyReadiness | '';
  developerName: string;
  projectName: string;
  locationArea: string;
  purchasePrice: number;
  expectedCompletionDate: string;
  unitSizeSqft: number;
  numberOfBedrooms: number;
  parkingIncluded: boolean;
}

// =====================================================================
// Step 6: Mortgage Preferences
// =====================================================================
export interface MortgagePreferences {
  propertyValue: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  preferredLoanAmount: number; // auto-calculated
  loanTenureYears: number;
  interestType: InterestType | '';
  isFirstTimeBuyer: boolean;
}

// =====================================================================
// Step 7: Eligibility Results (auto-calculated)
// =====================================================================
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

// =====================================================================
// Step 8: Document Uploads
// =====================================================================
export interface UploadedDocument {
  id: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadURL: string;
  uploadedAt: string; // ISO date
}

export interface DocumentUploads {
  documents: UploadedDocument[];
}

// =====================================================================
// Step 9: Consent & Declarations
// =====================================================================
export interface ConsentDeclarations {
  aecbConsent: boolean;
  bankContactConsent: boolean;
  dataProcessingConsent: boolean;
  accuracyConfirmation: boolean;
}

// =====================================================================
// Master Application Document
// =====================================================================
export interface MortgageApplication {
  applicationId: string;
  userId: string;
  agentId?: string;
  status: ApplicationStatus;
  currentStep: number;

  // Step data
  applicantIdentity: ApplicantIdentity;
  contactResidency: ContactResidency;
  employmentIncome: EmploymentIncome;
  financialObligations: FinancialObligations;
  propertyDetails: PropertyDetails;
  mortgagePreferences: MortgagePreferences;
  eligibilityResults: EligibilityResults;
  documentUploads: DocumentUploads;
  consentDeclarations: ConsentDeclarations;

  // Metadata
  notes?: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

// =====================================================================
// Calculator types (unchanged – used by calculator screens)
// =====================================================================

/** EMI calculation input */
export interface EMICalculationInput {
  principal: number;
  annualRate: number;
  years: number;
}

/** EMI calculation result */
export interface EMICalculationResult {
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
}

/** Eligibility check input */
export interface EligibilityInput {
  monthlySalary: number;
  totalLiabilities: number;
}

/** Eligibility check result */
export interface EligibilityResult {
  eligible: boolean;
  ratio: number;
  message: string;
  maxLoanAmount: number;
}
