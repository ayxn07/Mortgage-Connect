/**
 * Central utils exports for MortgageConnect.
 *
 * Usage:
 *   import { isValidEmail, formatCurrency, calculateEMI } from '@/src/utils';
 */

// Validators
export {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  isValidPhone,
  isRequired,
  isInRange,
  validateSupportForm,
} from './validators';

// Formatters
export {
  formatCurrency,
  formatUSD,
  formatNumber,
  formatRating,
  formatCount,
  formatPhone,
  truncate,
  getInitials,
  formatRelativeTime,
} from './formatters';

// Helpers (mortgage calculations)
export {
  calculateEMI,
  calculatePreciseEMI,
  checkEligibility,
  calculateDownPaymentPercent,
  calculateLTV,
  getMinDownPaymentPercent,
  calculateUpfrontCosts,
  calculateDBR,
  reverseEMIToLoan,
  generateAmortizationSchedule,
  getYearlySummary,
  calculatePrepaymentSavings,
  calculateRentVsBuy,
} from './helpers';

// Helper types (re-export for convenience)
export type {
  Emirate,
  PropertyReadinessType,
  UpfrontCostInput,
  UpfrontCostResult,
  DBRInput,
  DBRResult,
  AmortizationEntry,
  AmortizationYearlySummary,
  PrepaymentInput,
  PrepaymentResult,
  RentVsBuyInput,
  RentVsBuyYearlySnapshot,
  RentVsBuyResult,
} from './helpers';
