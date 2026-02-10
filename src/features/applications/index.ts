/**
 * Applications feature module.
 *
 * Re-exports everything related to mortgage applications:
 *
 *   import { useApplicationStore, calculateEMI, MortgageApplication } from '@/src/features/applications';
 */

// Store
export { useApplicationStore } from '../../store/applicationStore';

// Services
export {
  createApplication,
  fetchUserApplications,
  fetchApplicationById,
  updateApplication,
  uploadDocument,
  deleteDocument,
  saveDraft,
  submitApplication,
} from '../../services/applications';

// Utils (mortgage calculations)
export {
  calculateEMI,
  checkEligibility,
  calculateDownPaymentPercent,
  calculateLTV,
} from '../../utils/helpers';

// Types
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
  EMICalculationInput,
  EMICalculationResult,
  EligibilityInput,
  EligibilityResult,
} from '../../types';
