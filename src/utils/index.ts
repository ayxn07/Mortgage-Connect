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
  checkEligibility,
  calculateDownPaymentPercent,
  calculateLTV,
} from './helpers';
