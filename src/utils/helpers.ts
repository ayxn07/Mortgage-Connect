import type { EMICalculationInput, EMICalculationResult, EligibilityInput, EligibilityResult } from '../types';

// ---------- Upfront Cost Types ----------
export type Emirate = 'dubai' | 'abu_dhabi' | 'sharjah' | 'other';

export interface UpfrontCostInput {
  propertyPrice: number;
  loanAmount: number;
  emirate: Emirate;
  agentCommissionPercent: number; // e.g. 2
  includeVAT: boolean;
  valuationFee?: number; // default 3000
}

export interface UpfrontCostResult {
  dldFee: number;
  mortgageRegistration: number;
  valuationFee: number;
  bankProcessingFee: number;
  agentCommission: number;
  vat: number;
  totalFees: number;
  totalUpfrontCash: number; // downPayment + totalFees (caller adds downPayment)
}

export interface DBRInput {
  monthlySalary: number;
  existingEMIs: number;
  newEMI: number;
}

export interface DBRResult {
  dbrPercent: number;
  withinGuideline: boolean;
  message: string;
}

/**
 * Calculate monthly EMI (Equated Monthly Installment).
 *
 * Formula: EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * Where:
 *   P = Principal loan amount
 *   R = Monthly interest rate (annual rate / 12 / 100)
 *   N = Number of monthly installments (years x 12)
 */
export function calculateEMI(input: EMICalculationInput): EMICalculationResult {
  const { principal, annualRate, years } = input;
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  if (monthlyRate === 0) {
    // Zero interest case
    const monthlyInstallment = Math.round(principal / months);
    return {
      monthlyInstallment,
      totalPayment: principal,
      totalInterest: 0,
      principal,
    };
  }

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const monthlyInstallment = Math.round(emi);
  const totalPayment = monthlyInstallment * months;
  const totalInterest = totalPayment - principal;

  return {
    monthlyInstallment,
    totalPayment,
    totalInterest,
    principal,
  };
}

/**
 * Check mortgage eligibility based on debt-to-income ratio.
 *
 * Rule: Total liabilities must be less than 50% of salary.
 * Max loan amount: 60x monthly salary (if eligible).
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const { monthlySalary, totalLiabilities } = input;

  if (monthlySalary <= 0) {
    return {
      eligible: false,
      ratio: 0,
      message: 'Monthly salary must be greater than 0.',
      maxLoanAmount: 0,
    };
  }

  const ratio = totalLiabilities / monthlySalary;
  const eligible = ratio < 0.5;

  return {
    eligible,
    ratio: Math.round(ratio * 100),
    message: eligible
      ? 'You are eligible for a mortgage!'
      : 'Your liabilities are too high. Reduce debt to qualify.',
    maxLoanAmount: eligible ? Math.round(monthlySalary * 60) : 0,
  };
}

/**
 * Calculate down payment percentage.
 */
export function calculateDownPaymentPercent(propertyPrice: number, downPayment: number): number {
  if (propertyPrice <= 0) return 0;
  return Math.round((downPayment / propertyPrice) * 100);
}

/**
 * Calculate loan-to-value ratio.
 */
export function calculateLTV(propertyPrice: number, downPayment: number): number {
  if (propertyPrice <= 0) return 0;
  return Math.round(((propertyPrice - downPayment) / propertyPrice) * 100);
}

/**
 * Get minimum down payment percentage based on UAE banking guidelines.
 *
 * - UAE Resident, first-time buyer, property ≤ AED 5M: 20%
 * - UAE Resident, first-time buyer, property > AED 5M: 30%
 * - UAE Resident, not first-time: 25–35%
 * - Non-Resident: 40–50%
 */
export function getMinDownPaymentPercent(
  isResident: boolean,
  isFirstTimeBuyer: boolean,
  propertyPrice: number
): number {
  if (!isResident) return 40;
  if (isFirstTimeBuyer) {
    return propertyPrice <= 5_000_000 ? 20 : 30;
  }
  return propertyPrice <= 5_000_000 ? 25 : 35;
}

/**
 * Calculate UAE upfront costs for a mortgage transaction.
 *
 * Defaults are for Dubai; other emirates have similar but may vary.
 */
export function calculateUpfrontCosts(input: UpfrontCostInput, downPayment: number): UpfrontCostResult {
  const {
    propertyPrice,
    loanAmount,
    emirate,
    agentCommissionPercent,
    includeVAT,
    valuationFee = 3_000,
  } = input;

  // DLD / Transfer Fee
  let dldFeeRate = 0.04; // 4% for Dubai
  if (emirate === 'abu_dhabi') dldFeeRate = 0.02;
  if (emirate === 'sharjah') dldFeeRate = 0.04;
  const dldFee = Math.round(propertyPrice * dldFeeRate);

  // Mortgage registration fee
  let mortgageRegistration = Math.round(loanAmount * 0.0025); // 0.25% of loan
  if (emirate === 'abu_dhabi') mortgageRegistration = Math.round(loanAmount * 0.001); // 0.1%

  // Bank processing fee (1% of loan, typical min AED 5,000, max AED 25,000 in practice)
  const bankProcessingFee = Math.round(loanAmount * 0.01);

  // Agent commission
  const agentCommission = Math.round(propertyPrice * (agentCommissionPercent / 100));

  // VAT (5% on applicable fees — processing, valuation, agent commission)
  const vatableAmount = bankProcessingFee + valuationFee + agentCommission;
  const vat = includeVAT ? Math.round(vatableAmount * 0.05) : 0;

  const totalFees = dldFee + mortgageRegistration + valuationFee + bankProcessingFee + agentCommission + vat;
  const totalUpfrontCash = downPayment + totalFees;

  return {
    dldFee,
    mortgageRegistration,
    valuationFee,
    bankProcessingFee,
    agentCommission,
    vat,
    totalFees,
    totalUpfrontCash,
  };
}

/**
 * Calculate Debt Burden Ratio (DBR) per UAE Central Bank guidelines.
 *
 * DBR = (Existing EMIs + New EMI) / Net Monthly Salary × 100
 * Guideline: should be ≤ 50%
 */
export function calculateDBR(input: DBRInput): DBRResult {
  const { monthlySalary, existingEMIs, newEMI } = input;

  if (monthlySalary <= 0) {
    return { dbrPercent: 0, withinGuideline: false, message: 'Enter salary to check DBR' };
  }

  const dbrPercent = Math.round(((existingEMIs + newEMI) / monthlySalary) * 100);
  const withinGuideline = dbrPercent <= 50;

  return {
    dbrPercent,
    withinGuideline,
    message: withinGuideline
      ? 'Within UAE Central Bank guideline (≤50%)'
      : 'Above guideline — banks may decline or require adjustments',
  };
}
