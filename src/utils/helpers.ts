import type {
  EMICalculationInput,
  EMICalculationResult,
  EligibilityInput,
  EligibilityResult,
} from '../types';

// =====================================================================
// Upfront Cost Types
// =====================================================================
export type Emirate = 'dubai' | 'abu_dhabi' | 'sharjah' | 'other';
export type PropertyReadinessType = 'ready' | 'off_plan';

export interface UpfrontCostInput {
  propertyPrice: number;
  loanAmount: number;
  emirate: Emirate;
  agentCommissionPercent: number; // e.g. 2
  includeVAT: boolean;
  valuationFee?: number; // default 3000
  propertyReadiness?: PropertyReadinessType; // ready or off-plan
}

export interface UpfrontCostResult {
  dldFee: number;
  mortgageRegistration: number;
  valuationFee: number;
  bankProcessingFee: number;
  agentCommission: number;
  trusteeFee: number;
  adminFee: number;
  oqoodFee: number; // off-plan only (Dubai)
  vat: number;
  totalFees: number;
  totalUpfrontCash: number; // downPayment + totalFees
}

export interface DBRInput {
  monthlySalary: number;
  existingEMIs: number;
  newEMI: number;
  creditCardLimits?: number; // total credit card limits — banks assume 5% as monthly obligation
}

export interface DBRResult {
  dbrPercent: number;
  withinGuideline: boolean;
  message: string;
  availableEMI: number; // how much monthly EMI room is left within 50%
}

// =====================================================================
// Amortization Types
// =====================================================================
export interface AmortizationEntry {
  month: number;
  year: number;
  openingBalance: number;
  emi: number;
  principalPortion: number;
  interestPortion: number;
  closingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationYearlySummary {
  year: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPayment: number;
  closingBalance: number;
}

// =====================================================================
// Prepayment Types
// =====================================================================
export interface PrepaymentInput {
  principal: number;
  annualRate: number;
  years: number;
  lumpSumAmount?: number; // one-time extra payment
  lumpSumAfterMonth?: number; // when to make the lump sum (month #)
  extraMonthlyPayment?: number; // additional amount paid each month
}

export interface PrepaymentResult {
  originalTenureMonths: number;
  newTenureMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  originalTotalPayment: number;
  newTotalPayment: number;
  originalEMI: number;
  newEffectiveMonthlyPayment: number;
}

// =====================================================================
// Rent vs Buy Types
// =====================================================================
export interface RentVsBuyInput {
  propertyPrice: number;
  downPaymentPercent: number;
  annualRate: number;
  loanTenureYears: number;
  monthlyRent: number;
  annualRentIncrease: number; // e.g. 5 for 5%
  annualPropertyAppreciation: number; // e.g. 3 for 3%
  annualMaintenanceCost: number; // annual maintenance/service charge
  yearsToCompare: number;
  emirate: Emirate;
  isResident: boolean;
  isFirstTimeBuyer: boolean;
}

export interface RentVsBuyYearlySnapshot {
  year: number;
  cumulativeRent: number;
  cumulativeBuyCost: number; // EMI + maintenance + upfront (amortized year 1)
  propertyValue: number;
  equity: number; // propertyValue - remainingLoan
  netBuyCost: number; // cumulativeBuyCost - equity
  rentAdvantage: number; // positive = renting is cheaper
}

export interface RentVsBuyResult {
  breakEvenYear: number; // year when buying becomes cheaper than renting (0 if never)
  totalRentCost: number;
  totalBuyCost: number;
  totalBuyCostNet: number; // totalBuyCost - finalEquity
  finalPropertyValue: number;
  finalEquity: number;
  monthlyEMI: number;
  yearlySnapshots: RentVsBuyYearlySnapshot[];
}

// =====================================================================
// EMI Calculation
// =====================================================================

/**
 * Calculate monthly EMI (Equated Monthly Installment).
 *
 * Formula: EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 * Where:
 *   P = Principal loan amount
 *   R = Monthly interest rate (annual rate / 12 / 100)
 *   N = Number of monthly installments (years x 12)
 *
 * Edge cases handled:
 *   - Zero interest rate: simple division P / N
 *   - Zero principal: all zeros
 *   - Negative/invalid inputs: returns zero result
 */
export function calculateEMI(input: EMICalculationInput): EMICalculationResult {
  const { principal, annualRate, years } = input;

  // Guard: invalid inputs
  if (principal <= 0 || years <= 0 || annualRate < 0) {
    return { monthlyInstallment: 0, totalPayment: 0, totalInterest: 0, principal: 0 };
  }

  const months = years * 12;

  // Zero interest case
  if (annualRate === 0) {
    const monthlyInstallment = Math.round(principal / months);
    return {
      monthlyInstallment,
      totalPayment: principal,
      totalInterest: 0,
      principal,
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, months);

  const emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);

  // Use precise EMI (not rounded) for total calculation to minimize rounding drift
  const monthlyInstallment = Math.round(emi);
  // Total payment based on precise EMI, then round
  const totalPayment = Math.round(emi * months);
  const totalInterest = totalPayment - principal;

  return {
    monthlyInstallment,
    totalPayment,
    totalInterest,
    principal,
  };
}

/**
 * Calculate precise (unrounded) EMI for internal use by other calculators.
 * Returns the raw floating-point EMI value.
 */
export function calculatePreciseEMI(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0 || annualRate < 0) return 0;
  const months = years * 12;
  if (annualRate === 0) return principal / months;
  const monthlyRate = annualRate / 12 / 100;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
}

// =====================================================================
// Amortization Schedule
// =====================================================================

/**
 * Generate a full month-by-month amortization schedule.
 *
 * For each month:
 *   interestPortion = openingBalance × monthlyRate
 *   principalPortion = EMI - interestPortion
 *   closingBalance = openingBalance - principalPortion
 *
 * The final month is adjusted to zero out the balance exactly.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): AmortizationEntry[] {
  if (principal <= 0 || years <= 0 || annualRate < 0) return [];

  const months = years * 12;
  const emi = calculatePreciseEMI(principal, annualRate, years);
  if (emi <= 0) return [];

  const monthlyRate = annualRate / 12 / 100;
  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let m = 1; m <= months; m++) {
    const interestPortion = annualRate === 0 ? 0 : balance * monthlyRate;
    let principalPortion = emi - interestPortion;

    // Last month adjustment: zero out balance exactly
    if (m === months) {
      principalPortion = balance;
    }

    const closingBalance = Math.max(0, balance - principalPortion);
    cumulativeInterest += interestPortion;
    cumulativePrincipal += principalPortion;

    schedule.push({
      month: m,
      year: Math.ceil(m / 12),
      openingBalance: Math.round(balance),
      emi: Math.round(emi),
      principalPortion: Math.round(principalPortion),
      interestPortion: Math.round(interestPortion),
      closingBalance: Math.round(closingBalance),
      cumulativeInterest: Math.round(cumulativeInterest),
      cumulativePrincipal: Math.round(cumulativePrincipal),
    });

    balance = closingBalance;
  }

  return schedule;
}

/**
 * Summarize the amortization schedule by year.
 */
export function getYearlySummary(
  principal: number,
  annualRate: number,
  years: number
): AmortizationYearlySummary[] {
  const schedule = generateAmortizationSchedule(principal, annualRate, years);
  if (schedule.length === 0) return [];

  const summaryMap = new Map<number, AmortizationYearlySummary>();

  for (const entry of schedule) {
    const existing = summaryMap.get(entry.year);
    if (existing) {
      existing.totalPrincipal += entry.principalPortion;
      existing.totalInterest += entry.interestPortion;
      existing.totalPayment += entry.emi;
      existing.closingBalance = entry.closingBalance;
    } else {
      summaryMap.set(entry.year, {
        year: entry.year,
        totalPrincipal: entry.principalPortion,
        totalInterest: entry.interestPortion,
        totalPayment: entry.emi,
        closingBalance: entry.closingBalance,
      });
    }
  }

  return Array.from(summaryMap.values());
}

// =====================================================================
// Eligibility Check
// =====================================================================

/**
 * Check mortgage eligibility based on debt-to-income ratio.
 *
 * Rule: Total liabilities must be less than 50% of salary (UAE Central Bank).
 * Max loan amount is reverse-calculated from available EMI capacity
 * using standard EMI formula (more accurate than flat 60x multiplier).
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

  // Calculate max loan from remaining EMI capacity at typical UAE rate 4.5%, 25 years
  const availableForEMI = Math.max(0, monthlySalary * 0.5 - totalLiabilities);
  const maxLoan = eligible ? reverseEMIToLoan(availableForEMI, 4.5, 25) : 0;

  return {
    eligible,
    ratio: Math.round(ratio * 100),
    message: eligible
      ? 'You are eligible for a mortgage!'
      : 'Your liabilities are too high. Reduce debt to qualify.',
    maxLoanAmount: maxLoan,
  };
}

// =====================================================================
// Down Payment & LTV
// =====================================================================

/**
 * Calculate down payment percentage.
 */
export function calculateDownPaymentPercent(propertyPrice: number, downPayment: number): number {
  if (propertyPrice <= 0) return 0;
  return Math.round((downPayment / propertyPrice) * 100 * 100) / 100; // 2 decimal precision
}

/**
 * Calculate loan-to-value ratio.
 */
export function calculateLTV(propertyPrice: number, downPayment: number): number {
  if (propertyPrice <= 0) return 0;
  return Math.round(((propertyPrice - downPayment) / propertyPrice) * 100 * 100) / 100;
}

/**
 * Get minimum down payment percentage based on UAE Central Bank guidelines.
 *
 * UAE Resident, first-time buyer:
 *   - Property <= AED 5M: 20% down (80% LTV)
 *   - Property > AED 5M: 30% down (70% LTV)
 * UAE Resident, not first-time buyer:
 *   - Property <= AED 5M: 25% down (75% LTV)
 *   - Property > AED 5M: 35% down (65% LTV)
 * Non-Resident:
 *   - Any property: 40-50% down (varies by bank, we use 40% as minimum)
 *   - Property > AED 5M: 50% down
 */
export function getMinDownPaymentPercent(
  isResident: boolean,
  isFirstTimeBuyer: boolean,
  propertyPrice: number
): number {
  if (!isResident) {
    return propertyPrice <= 5_000_000 ? 40 : 50;
  }
  if (isFirstTimeBuyer) {
    return propertyPrice <= 5_000_000 ? 20 : 30;
  }
  return propertyPrice <= 5_000_000 ? 25 : 35;
}

// =====================================================================
// Upfront Costs (UAE-specific)
// =====================================================================

/**
 * Calculate UAE upfront costs for a mortgage transaction.
 *
 * Comprehensive fee breakdown:
 *
 * 1. DLD / Transfer Fee:
 *    - Dubai: 4% of property price + AED 580 admin fee
 *    - Abu Dhabi: 2% of property price
 *    - Sharjah: 4% of property price
 *    - Other: 4% (default)
 *
 * 2. Mortgage Registration Fee:
 *    - Dubai: 0.25% of loan amount + AED 290
 *    - Abu Dhabi: 0.1% of loan amount
 *    - Sharjah: 0.25% of loan amount
 *    - Other: 0.25%
 *
 * 3. Trustee / Conveyancer Fee (Dubai):
 *    - Property <= AED 500K: AED 2,000 + VAT
 *    - Property > AED 500K: AED 4,000 + VAT
 *    - (Other emirates: typically included in transfer fee)
 *
 * 4. Oqood Fee (Dubai off-plan only): 4% of purchase price
 *    (replaces DLD transfer fee for off-plan)
 *
 * 5. Bank Processing Fee: 1% of loan amount (min AED 5,000)
 *
 * 6. Valuation Fee: typically AED 2,500–3,500
 *
 * 7. Agent Commission: typically 2% of property price
 *
 * 8. VAT: 5% on bank processing, valuation, agent commission, trustee fee
 */
export function calculateUpfrontCosts(
  input: UpfrontCostInput,
  downPayment: number
): UpfrontCostResult {
  const {
    propertyPrice,
    loanAmount,
    emirate,
    agentCommissionPercent,
    includeVAT,
    valuationFee = 3_000,
    propertyReadiness = 'ready',
  } = input;

  // Guard against invalid inputs
  if (propertyPrice <= 0) {
    return {
      dldFee: 0,
      mortgageRegistration: 0,
      valuationFee: 0,
      bankProcessingFee: 0,
      agentCommission: 0,
      trusteeFee: 0,
      adminFee: 0,
      oqoodFee: 0,
      vat: 0,
      totalFees: 0,
      totalUpfrontCash: 0,
    };
  }

  // ---- DLD / Transfer Fee ----
  let dldFeeRate = 0.04; // 4% default
  if (emirate === 'abu_dhabi') dldFeeRate = 0.02;
  // For Dubai off-plan: Oqood replaces DLD (both are 4% but tracked separately)
  const isOffPlanDubai = emirate === 'dubai' && propertyReadiness === 'off_plan';
  const dldFee = isOffPlanDubai ? 0 : Math.round(propertyPrice * dldFeeRate);

  // ---- Oqood Fee (Dubai off-plan only) ----
  const oqoodFee = isOffPlanDubai ? Math.round(propertyPrice * 0.04) : 0;

  // ---- DLD Admin Fee ----
  let adminFee = 0;
  if (emirate === 'dubai') {
    adminFee = 580; // DLD admin/knowledge fee
  }

  // ---- Mortgage Registration Fee ----
  let mortgageRegistration: number;
  if (emirate === 'abu_dhabi') {
    mortgageRegistration = Math.round(loanAmount * 0.001); // 0.1%
  } else {
    mortgageRegistration = Math.round(loanAmount * 0.0025); // 0.25%
    if (emirate === 'dubai') {
      mortgageRegistration += 290; // Dubai mortgage registration admin
    }
  }

  // ---- Trustee / Conveyancer Fee (Dubai) ----
  let trusteeFee = 0;
  if (emirate === 'dubai') {
    trusteeFee = propertyPrice <= 500_000 ? 2_000 : 4_000;
  }

  // ---- Bank Processing Fee (1% of loan, min AED 5,000 in practice) ----
  let bankProcessingFee = Math.round(loanAmount * 0.01);
  if (loanAmount > 0 && bankProcessingFee < 5_000) {
    bankProcessingFee = 5_000; // typical bank minimum
  }
  if (loanAmount === 0) bankProcessingFee = 0;

  // ---- Agent Commission ----
  const agentCommission = Math.round(propertyPrice * (agentCommissionPercent / 100));

  // ---- VAT (5% on applicable fees) ----
  // VAT applies to: bank processing fee, valuation fee, agent commission, trustee fee
  const vatableAmount = bankProcessingFee + valuationFee + agentCommission + trusteeFee;
  const vat = includeVAT ? Math.round(vatableAmount * 0.05) : 0;

  // ---- Totals ----
  const totalFees =
    dldFee +
    oqoodFee +
    adminFee +
    mortgageRegistration +
    valuationFee +
    bankProcessingFee +
    agentCommission +
    trusteeFee +
    vat;

  const totalUpfrontCash = downPayment + totalFees;

  return {
    dldFee,
    mortgageRegistration,
    valuationFee,
    bankProcessingFee,
    agentCommission,
    trusteeFee,
    adminFee,
    oqoodFee,
    vat,
    totalFees,
    totalUpfrontCash,
  };
}

// =====================================================================
// Debt Burden Ratio (DBR)
// =====================================================================

/**
 * Calculate Debt Burden Ratio (DBR) per UAE Central Bank guidelines.
 *
 * DBR = (Existing EMIs + Credit Card Min Payments + New EMI) / Net Monthly Salary × 100
 *
 * Important UAE banking practices:
 *   - Credit cards: banks assume 5% of total limit as monthly obligation
 *   - Guideline: should be <= 50%
 *   - Some banks use stricter 45% for higher-risk profiles
 */
export function calculateDBR(input: DBRInput): DBRResult {
  const { monthlySalary, existingEMIs, newEMI, creditCardLimits = 0 } = input;

  if (monthlySalary <= 0) {
    return {
      dbrPercent: 0,
      withinGuideline: false,
      message: 'Enter salary to check DBR',
      availableEMI: 0,
    };
  }

  // Banks assume 5% of total credit card limit as monthly obligation
  const creditCardObligation = creditCardLimits * 0.05;
  const totalObligations = existingEMIs + creditCardObligation + newEMI;

  // Use 2-decimal precision for DBR
  const dbrPercent = Math.round((totalObligations / monthlySalary) * 10000) / 100;
  const withinGuideline = dbrPercent <= 50;

  // Calculate remaining EMI capacity
  const maxAllowableObligations = monthlySalary * 0.5;
  const existingObligations = existingEMIs + creditCardObligation;
  const availableEMI = Math.max(0, maxAllowableObligations - existingObligations);

  let message: string;
  if (dbrPercent <= 40) {
    message = 'Excellent — well within UAE Central Bank guideline (<=50%)';
  } else if (dbrPercent <= 50) {
    message = 'Within guideline but near limit — banks may apply conditions';
  } else if (dbrPercent <= 60) {
    message = 'Above guideline — most banks will decline without adjustments';
  } else {
    message = 'Significantly above guideline — reduce liabilities before applying';
  }

  return {
    dbrPercent,
    withinGuideline,
    message,
    availableEMI: Math.round(availableEMI),
  };
}

// =====================================================================
// Reverse EMI (from EMI to Loan Amount)
// =====================================================================

/**
 * Reverse-calculate max loan amount from a given max EMI.
 *
 * Loan = EMI × [(1+R)^N - 1] / [R × (1+R)^N]
 *
 * This is the algebraic inverse of the EMI formula.
 */
export function reverseEMIToLoan(
  maxEMI: number,
  annualRate: number,
  years: number
): number {
  if (maxEMI <= 0 || years <= 0 || annualRate < 0) return 0;

  const months = years * 12;

  if (annualRate === 0) {
    return Math.round(maxEMI * months);
  }

  const r = annualRate / 12 / 100;
  const compoundFactor = Math.pow(1 + r, months);
  const loan = maxEMI * (compoundFactor - 1) / (r * compoundFactor);

  return Math.round(loan);
}

// =====================================================================
// Prepayment / Early Settlement Calculator
// =====================================================================

/**
 * Calculate the impact of prepayments on a mortgage.
 *
 * Supports:
 *   1. Lump-sum one-time payment at a specific month
 *   2. Extra monthly payments throughout the loan
 *   3. Both combined
 *
 * UAE Note: Most UAE banks charge 1% early settlement fee on the
 * outstanding principal (capped at 3 months' interest by some banks).
 * This calculator shows gross savings; actual net savings would be
 * slightly less after the early settlement fee.
 *
 * Algorithm:
 *   - Simulate month-by-month amortization with extra payments
 *   - At each month, calculate interest on remaining balance
 *   - Apply regular EMI + extra payment to reduce balance
 *   - Track when balance reaches zero for new tenure
 */
export function calculatePrepaymentSavings(input: PrepaymentInput): PrepaymentResult {
  const {
    principal,
    annualRate,
    years,
    lumpSumAmount = 0,
    lumpSumAfterMonth = 12,
    extraMonthlyPayment = 0,
  } = input;

  // Original loan details
  const originalEMI = calculatePreciseEMI(principal, annualRate, years);
  const originalMonths = years * 12;
  const originalTotalPayment = Math.round(originalEMI * originalMonths);
  const originalTotalInterest = originalTotalPayment - principal;

  if (principal <= 0 || years <= 0 || annualRate < 0 || originalEMI <= 0) {
    return {
      originalTenureMonths: 0,
      newTenureMonths: 0,
      monthsSaved: 0,
      originalTotalInterest: 0,
      newTotalInterest: 0,
      interestSaved: 0,
      originalTotalPayment: 0,
      newTotalPayment: 0,
      originalEMI: 0,
      newEffectiveMonthlyPayment: 0,
    };
  }

  // No prepayment? Return original values
  if (lumpSumAmount <= 0 && extraMonthlyPayment <= 0) {
    return {
      originalTenureMonths: originalMonths,
      newTenureMonths: originalMonths,
      monthsSaved: 0,
      originalTotalInterest,
      newTotalInterest: originalTotalInterest,
      interestSaved: 0,
      originalTotalPayment,
      newTotalPayment: originalTotalPayment,
      originalEMI: Math.round(originalEMI),
      newEffectiveMonthlyPayment: Math.round(originalEMI),
    };
  }

  const monthlyRate = annualRate === 0 ? 0 : annualRate / 12 / 100;
  let balance = principal;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = originalMonths * 2; // safety cap

  while (balance > 0.01 && month < maxMonths) {
    month++;

    // Interest for this month
    const interestThisMonth = balance * monthlyRate;
    totalInterestPaid += interestThisMonth;

    // Regular EMI payment
    let payment = Math.min(originalEMI, balance + interestThisMonth);
    let principalPaid = payment - interestThisMonth;

    // Extra monthly payment
    if (extraMonthlyPayment > 0) {
      const extraPrincipal = Math.min(extraMonthlyPayment, balance - principalPaid);
      if (extraPrincipal > 0) {
        principalPaid += extraPrincipal;
        payment += extraPrincipal;
      }
    }

    // Lump sum payment
    if (lumpSumAmount > 0 && month === lumpSumAfterMonth) {
      const lumpPrincipal = Math.min(lumpSumAmount, balance - principalPaid);
      if (lumpPrincipal > 0) {
        principalPaid += lumpPrincipal;
        payment += lumpPrincipal;
      }
    }

    balance = Math.max(0, balance - principalPaid);
    totalPaid += payment;
  }

  const newTotalInterest = Math.round(totalInterestPaid);
  const newTotalPayment = Math.round(totalPaid);
  const newTenureMonths = month;

  return {
    originalTenureMonths: originalMonths,
    newTenureMonths,
    monthsSaved: Math.max(0, originalMonths - newTenureMonths),
    originalTotalInterest,
    newTotalInterest,
    interestSaved: Math.max(0, originalTotalInterest - newTotalInterest),
    originalTotalPayment,
    newTotalPayment,
    originalEMI: Math.round(originalEMI),
    newEffectiveMonthlyPayment: newTenureMonths > 0 ? Math.round(newTotalPayment / newTenureMonths) : 0,
  };
}

// =====================================================================
// Rent vs Buy Calculator
// =====================================================================

/**
 * Compare the total cost of renting vs buying over a given period.
 *
 * Buy side includes:
 *   - Upfront costs (down payment + fees)
 *   - Monthly EMI payments
 *   - Annual maintenance / service charges
 *   - Property appreciation (builds equity)
 *
 * Rent side includes:
 *   - Monthly rent with annual escalation
 *
 * Break-even: the year when net buy cost < cumulative rent cost.
 * Net buy cost = total cash spent - equity built.
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const {
    propertyPrice,
    downPaymentPercent,
    annualRate,
    loanTenureYears,
    monthlyRent,
    annualRentIncrease,
    annualPropertyAppreciation,
    annualMaintenanceCost,
    yearsToCompare,
    emirate,
    // isResident and isFirstTimeBuyer are part of the input contract
    // but not used in this function (DP% is provided explicitly)
  } = input;

  const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  // Calculate EMI
  const emi = calculatePreciseEMI(loanAmount, annualRate, loanTenureYears);
  const monthlyEMI = Math.round(emi);

  // Calculate upfront costs
  const upfrontCosts = calculateUpfrontCosts(
    {
      propertyPrice,
      loanAmount,
      emirate,
      agentCommissionPercent: 2,
      includeVAT: true,
    },
    downPayment
  );

  // Amortization for tracking remaining balance year by year
  const monthlyRate = annualRate === 0 ? 0 : annualRate / 12 / 100;
  let loanBalance = loanAmount;

  const yearlySnapshots: RentVsBuyYearlySnapshot[] = [];
  let cumulativeRent = 0;
  let cumulativeBuyCost = upfrontCosts.totalUpfrontCash; // starts with upfront
  let breakEvenYear = 0;
  let currentMonthlyRent = monthlyRent;

  for (let year = 1; year <= yearsToCompare; year++) {
    // Rent for this year
    const yearRent = currentMonthlyRent * 12;
    cumulativeRent += yearRent;

    // Buy costs for this year: EMI + maintenance
    const yearEMI = year <= loanTenureYears ? monthlyEMI * 12 : 0;
    const yearMaintenance = annualMaintenanceCost;
    cumulativeBuyCost += yearEMI + yearMaintenance;

    // Reduce loan balance (simplified year-end)
    if (year <= loanTenureYears && loanBalance > 0) {
      for (let m = 0; m < 12; m++) {
        if (loanBalance <= 0) break;
        const interest = loanBalance * monthlyRate;
        const principalPaid = Math.min(emi - interest, loanBalance);
        loanBalance = Math.max(0, loanBalance - principalPaid);
      }
    }

    // Property appreciation
    const propertyValue = Math.round(
      propertyPrice * Math.pow(1 + annualPropertyAppreciation / 100, year)
    );

    // Equity = property value - remaining loan
    const equity = propertyValue - Math.round(loanBalance);

    // Net buy cost = total cash spent - equity
    const netBuyCost = cumulativeBuyCost - equity;

    // Rent advantage: positive means renting is cheaper
    const rentAdvantage = netBuyCost - cumulativeRent;

    yearlySnapshots.push({
      year,
      cumulativeRent: Math.round(cumulativeRent),
      cumulativeBuyCost: Math.round(cumulativeBuyCost),
      propertyValue,
      equity: Math.round(equity),
      netBuyCost: Math.round(netBuyCost),
      rentAdvantage: Math.round(rentAdvantage),
    });

    // Break-even: first year when buying becomes cheaper
    if (breakEvenYear === 0 && rentAdvantage <= 0) {
      breakEvenYear = year;
    }

    // Increase rent for next year
    currentMonthlyRent = Math.round(currentMonthlyRent * (1 + annualRentIncrease / 100));
  }

  const lastSnapshot = yearlySnapshots[yearlySnapshots.length - 1];

  return {
    breakEvenYear,
    totalRentCost: lastSnapshot?.cumulativeRent ?? 0,
    totalBuyCost: lastSnapshot?.cumulativeBuyCost ?? 0,
    totalBuyCostNet: lastSnapshot?.netBuyCost ?? 0,
    finalPropertyValue: lastSnapshot?.propertyValue ?? propertyPrice,
    finalEquity: lastSnapshot?.equity ?? 0,
    monthlyEMI,
    yearlySnapshots,
  };
}
