/**
 * AI Chat Service — Core logic for the AI Mortgage Assistant.
 *
 * Handles:
 * - Calculator intent detection from user text
 * - Multi-step calculator flows with interactive UI elements
 * - Calculator completion using helpers.ts functions
 * - Cloud Function proxy calls for general conversation
 */
import type {
  AIMessage,
  AIInteraction,
  AICalculatorFlow,
  AIResultData,
  AIResultBreakdownItem,
  CalculatorType,
  CalculatorStepDef,
  AIChatResponse,
} from '../types/aiChat';
import {
  calculateEMI,
  calculateUpfrontCosts,
  calculateDBR,
  calculatePrepaymentSavings,
  calculateRentVsBuy,
  reverseEMIToLoan,
} from '../utils/helpers';
import type { Emirate, UpfrontCostInput, PrepaymentInput, RentVsBuyInput } from '../utils/helpers';

// =====================================================================
// Constants
// =====================================================================

// Update this URL after deploying the cloud function
const AI_CHAT_FUNCTION_URL = 'https://us-central1-mortgage-connect-5b774.cloudfunctions.net/aiChat';

// =====================================================================
// Helpers
// =====================================================================

let _messageIdCounter = 0;

export function generateMessageId(): string {
  _messageIdCounter++;
  return `msg_${Date.now()}_${_messageIdCounter}`;
}

export function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatAED(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `AED ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2)}M`;
  }
  return `AED ${amount.toLocaleString('en-US')}`;
}

function formatPercent(value: number): string {
  return `${value}%`;
}

// =====================================================================
// Calculator Menu
// =====================================================================

export function getCalculatorMenuInteraction(): AIInteraction {
  return {
    type: 'calculator_menu',
    gridColumns: 2,
    options: [
      {
        label: 'EMI Calculator',
        value: 'emi',
        description: 'Monthly payment',
        icon: 'credit-card',
        color: '#6366f1',
      },
      {
        label: 'Affordability',
        value: 'affordability',
        description: 'How much can you borrow?',
        icon: 'trending-up',
        color: '#10b981',
      },
      {
        label: 'Upfront Costs',
        value: 'upfront_costs',
        description: 'UAE fees breakdown',
        icon: 'file-text',
        color: '#f59e0b',
      },
      {
        label: 'Rate Comparison',
        value: 'rate_comparison',
        description: 'Compare scenarios',
        icon: 'bar-chart-2',
        color: '#ec4899',
      },
      {
        label: 'Prepayment',
        value: 'prepayment',
        description: 'Early settlement savings',
        icon: 'zap',
        color: '#8b5cf6',
      },
      {
        label: 'Rent vs Buy',
        value: 'rent_vs_buy',
        description: 'Which saves more?',
        icon: 'home',
        color: '#0ea5e9',
      },
    ],
  };
}

export function createWelcomeMessages(): AIMessage[] {
  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'text',
      text: "Hi! I'm your AI mortgage assistant. I can answer questions about UAE mortgages or help you with calculations. What would you like to do?",
      timestamp: Date.now(),
    },
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: getCalculatorMenuInteraction(),
      timestamp: Date.now() + 1,
    },
  ];
}

// =====================================================================
// Intent Detection
// =====================================================================

const INTENT_PATTERNS: { type: CalculatorType; patterns: RegExp[] }[] = [
  {
    type: 'emi',
    patterns: [
      /\bemi\b/i,
      /monthly\s*(payment|installment)/i,
      /mortgage\s*payment/i,
      /how\s*much\s*(will|would)\s*i\s*pay\s*(monthly|per\s*month)/i,
    ],
  },
  {
    type: 'affordability',
    patterns: [
      /\bafford/i,
      /how\s*much\s*can\s*i\s*(borrow|get|loan)/i,
      /max(imum)?\s*(loan|mortgage|borrow)/i,
      /\beligib/i,
      /\bdbr\b/i,
      /debt\s*burden/i,
    ],
  },
  {
    type: 'upfront_costs',
    patterns: [
      /upfront\s*cost/i,
      /\bdld\b/i,
      /transfer\s*fee/i,
      /closing\s*cost/i,
      /\bfees?\b.*\b(buy|purchase|mortgage)/i,
      /how\s*much\s*(do|does|will)\s*(i|it)\s*(need|cost)\s*(to\s*buy)?/i,
    ],
  },
  {
    type: 'rate_comparison',
    patterns: [
      /compare\s*(rate|interest)/i,
      /rate\s*comparison/i,
      /which\s*rate/i,
      /different\s*rate/i,
      /best\s*rate/i,
    ],
  },
  {
    type: 'prepayment',
    patterns: [
      /prepay/i,
      /early\s*(settle|pay|repay)/i,
      /lump\s*sum/i,
      /extra\s*payment/i,
      /pay\s*(off|down)\s*(early|faster|sooner)/i,
    ],
  },
  {
    type: 'rent_vs_buy',
    patterns: [
      /rent\s*(vs|versus|or)\s*buy/i,
      /buy\s*(vs|versus|or)\s*rent/i,
      /should\s*i\s*(rent|buy)/i,
      /better\s*to\s*(rent|buy)/i,
      /renting\s*(vs|or)\s*buying/i,
    ],
  },
];

export function detectCalculatorIntent(text: string): CalculatorType | null {
  for (const { type, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type;
      }
    }
  }
  return null;
}

// =====================================================================
// Calculator Flow Definitions
// =====================================================================

function getEMISteps(): CalculatorStepDef[] {
  return [
    {
      key: 'propertyPrice',
      message: "What's the property value you're looking at?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 4,
        inputConfig: {
          key: 'propertyPrice',
          label: 'Property Price',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 100_000,
          max: 50_000_000,
          quickValues: [
            { label: '500K', value: 500_000 },
            { label: '1M', value: 1_000_000 },
            { label: '2M', value: 2_000_000 },
            { label: '5M', value: 5_000_000 },
          ],
          helperText: 'Enter the total property purchase price in AED',
        },
      },
    },
    {
      key: 'downPaymentPercent',
      message: 'What down payment percentage are you planning? UAE minimum is 20% for residents.',
      interaction: {
        type: 'slider_input',
        step: 2,
        totalSteps: 4,
        inputConfig: {
          key: 'downPaymentPercent',
          label: 'Down Payment',
          suffix: '%',
          min: 20,
          max: 80,
          step: 5,
          defaultValue: 20,
          quickValues: [
            { label: '20%', value: 20 },
            { label: '25%', value: 25 },
            { label: '30%', value: 30 },
            { label: '40%', value: 40 },
          ],
          helperText: 'UAE minimum: 20% for residents, 40% for non-residents',
        },
      },
    },
    {
      key: 'interestRate',
      message:
        'What interest rate would you like to calculate with? Current UAE rates are typically 4-7%.',
      interaction: {
        type: 'option_buttons',
        step: 3,
        totalSteps: 4,
        options: [
          { label: '4.5%', value: 4.5 },
          { label: '5%', value: 5 },
          { label: '5.5%', value: 5.5 },
          { label: '6%', value: 6 },
          { label: '6.5%', value: 6.5 },
          { label: '7%', value: 7 },
        ],
        inputConfig: {
          key: 'interestRate',
          label: 'Interest Rate',
          suffix: '%',
          min: 1,
          max: 15,
          step: 0.25,
          defaultValue: 5,
          helperText: 'Select a rate or enter a custom one',
        },
      },
    },
    {
      key: 'years',
      message: 'What loan duration? Maximum in UAE is 25 years.',
      interaction: {
        type: 'slider_input',
        step: 4,
        totalSteps: 4,
        inputConfig: {
          key: 'years',
          label: 'Loan Duration',
          suffix: 'years',
          min: 5,
          max: 25,
          step: 1,
          defaultValue: 25,
          quickValues: [
            { label: '10 yrs', value: 10 },
            { label: '15 yrs', value: 15 },
            { label: '20 yrs', value: 20 },
            { label: '25 yrs', value: 25 },
          ],
          helperText: 'UAE maximum mortgage tenure is 25 years',
        },
      },
    },
  ];
}

function getAffordabilitySteps(): CalculatorStepDef[] {
  return [
    {
      key: 'monthlySalary',
      message: "What's your net monthly salary?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 3,
        inputConfig: {
          key: 'monthlySalary',
          label: 'Monthly Salary',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 5_000,
          max: 500_000,
          quickValues: [
            { label: '15K', value: 15_000 },
            { label: '25K', value: 25_000 },
            { label: '40K', value: 40_000 },
            { label: '60K', value: 60_000 },
          ],
          helperText: 'Your net (take-home) monthly salary in AED',
        },
      },
    },
    {
      key: 'existingEMIs',
      message: 'Do you have any existing monthly loan payments (car loan, personal loan, etc.)?',
      interaction: {
        type: 'parameter_input',
        step: 2,
        totalSteps: 3,
        inputConfig: {
          key: 'existingEMIs',
          label: 'Existing EMIs',
          prefix: 'AED',
          placeholder: 'Enter amount or 0',
          min: 0,
          max: 200_000,
          defaultValue: 0,
          quickValues: [
            { label: 'None', value: 0 },
            { label: '2K', value: 2_000 },
            { label: '5K', value: 5_000 },
            { label: '10K', value: 10_000 },
          ],
          helperText: 'Total of all existing monthly loan obligations',
        },
      },
    },
    {
      key: 'creditCardLimits',
      message:
        "What's your total credit card limit? Banks assume 5% of the limit as a monthly obligation.",
      interaction: {
        type: 'parameter_input',
        step: 3,
        totalSteps: 3,
        inputConfig: {
          key: 'creditCardLimits',
          label: 'Credit Card Limits',
          prefix: 'AED',
          placeholder: 'Enter total limit or 0',
          min: 0,
          max: 1_000_000,
          defaultValue: 0,
          quickValues: [
            { label: 'None', value: 0 },
            { label: '20K', value: 20_000 },
            { label: '50K', value: 50_000 },
            { label: '100K', value: 100_000 },
          ],
          helperText: 'Banks count 5% of your card limit as a monthly liability',
        },
      },
    },
  ];
}

function getUpfrontCostsSteps(): CalculatorStepDef[] {
  return [
    {
      key: 'propertyPrice',
      message: "What's the property price?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 4,
        inputConfig: {
          key: 'propertyPrice',
          label: 'Property Price',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 100_000,
          max: 50_000_000,
          quickValues: [
            { label: '500K', value: 500_000 },
            { label: '1M', value: 1_000_000 },
            { label: '2M', value: 2_000_000 },
            { label: '5M', value: 5_000_000 },
          ],
        },
      },
    },
    {
      key: 'downPaymentPercent',
      message: 'What down payment percentage?',
      interaction: {
        type: 'slider_input',
        step: 2,
        totalSteps: 4,
        inputConfig: {
          key: 'downPaymentPercent',
          label: 'Down Payment',
          suffix: '%',
          min: 20,
          max: 80,
          step: 5,
          defaultValue: 20,
          quickValues: [
            { label: '20%', value: 20 },
            { label: '25%', value: 25 },
            { label: '30%', value: 30 },
          ],
        },
      },
    },
    {
      key: 'emirate',
      message: 'Which emirate is the property in?',
      interaction: {
        type: 'option_buttons',
        step: 3,
        totalSteps: 4,
        options: [
          { label: 'Dubai', value: 'dubai' },
          { label: 'Abu Dhabi', value: 'abu_dhabi' },
          { label: 'Sharjah', value: 'sharjah' },
          { label: 'Other', value: 'other' },
        ],
      },
    },
    {
      key: 'propertyReadiness',
      message: 'Is the property ready or off-plan?',
      interaction: {
        type: 'option_buttons',
        step: 4,
        totalSteps: 4,
        options: [
          { label: 'Ready', value: 'ready', description: 'Completed property' },
          { label: 'Off-Plan', value: 'off_plan', description: 'Under construction' },
        ],
      },
    },
  ];
}

function getRateComparisonSteps(): CalculatorStepDef[] {
  return [
    {
      key: 'propertyPrice',
      message: "Let's compare different rate scenarios. What's the property price?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 3,
        inputConfig: {
          key: 'propertyPrice',
          label: 'Property Price',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 100_000,
          max: 50_000_000,
          quickValues: [
            { label: '1M', value: 1_000_000 },
            { label: '2M', value: 2_000_000 },
            { label: '3M', value: 3_000_000 },
            { label: '5M', value: 5_000_000 },
          ],
        },
      },
    },
    {
      key: 'downPaymentPercent',
      message: 'Down payment percentage?',
      interaction: {
        type: 'slider_input',
        step: 2,
        totalSteps: 3,
        inputConfig: {
          key: 'downPaymentPercent',
          label: 'Down Payment',
          suffix: '%',
          min: 20,
          max: 80,
          step: 5,
          defaultValue: 20,
        },
      },
    },
    {
      key: 'years',
      message: 'Loan duration?',
      interaction: {
        type: 'slider_input',
        step: 3,
        totalSteps: 3,
        inputConfig: {
          key: 'years',
          label: 'Loan Duration',
          suffix: 'years',
          min: 5,
          max: 25,
          step: 1,
          defaultValue: 25,
          quickValues: [
            { label: '15 yrs', value: 15 },
            { label: '20 yrs', value: 20 },
            { label: '25 yrs', value: 25 },
          ],
        },
      },
    },
  ];
}

function getPrepaymentSteps(): CalculatorStepDef[] {
  return [
    {
      key: 'loanAmount',
      message: "What's your current outstanding loan amount?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 5,
        inputConfig: {
          key: 'loanAmount',
          label: 'Loan Amount',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 50_000,
          max: 30_000_000,
          quickValues: [
            { label: '500K', value: 500_000 },
            { label: '1M', value: 1_000_000 },
            { label: '2M', value: 2_000_000 },
          ],
        },
      },
    },
    {
      key: 'interestRate',
      message: "What's your current interest rate?",
      interaction: {
        type: 'option_buttons',
        step: 2,
        totalSteps: 5,
        options: [
          { label: '4.5%', value: 4.5 },
          { label: '5%', value: 5 },
          { label: '5.5%', value: 5.5 },
          { label: '6%', value: 6 },
          { label: '7%', value: 7 },
        ],
        inputConfig: {
          key: 'interestRate',
          label: 'Interest Rate',
          suffix: '%',
          min: 1,
          max: 15,
          step: 0.25,
        },
      },
    },
    {
      key: 'remainingYears',
      message: 'How many years remaining on your mortgage?',
      interaction: {
        type: 'slider_input',
        step: 3,
        totalSteps: 5,
        inputConfig: {
          key: 'remainingYears',
          label: 'Remaining Years',
          suffix: 'years',
          min: 1,
          max: 25,
          step: 1,
          defaultValue: 20,
        },
      },
    },
    {
      key: 'lumpSumAmount',
      message: 'How much would you like to prepay as a lump sum? (Enter 0 to skip)',
      interaction: {
        type: 'parameter_input',
        step: 4,
        totalSteps: 5,
        inputConfig: {
          key: 'lumpSumAmount',
          label: 'Lump Sum',
          prefix: 'AED',
          placeholder: 'Enter amount or 0',
          min: 0,
          max: 30_000_000,
          defaultValue: 0,
          quickValues: [
            { label: 'None', value: 0 },
            { label: '50K', value: 50_000 },
            { label: '100K', value: 100_000 },
            { label: '200K', value: 200_000 },
          ],
        },
      },
    },
    {
      key: 'extraMonthly',
      message: 'Any extra monthly payment you can make? (Enter 0 to skip)',
      interaction: {
        type: 'parameter_input',
        step: 5,
        totalSteps: 5,
        inputConfig: {
          key: 'extraMonthly',
          label: 'Extra Monthly',
          prefix: 'AED',
          placeholder: 'Enter amount or 0',
          min: 0,
          max: 100_000,
          defaultValue: 0,
          quickValues: [
            { label: 'None', value: 0 },
            { label: '1K', value: 1_000 },
            { label: '2K', value: 2_000 },
            { label: '5K', value: 5_000 },
          ],
        },
      },
    },
  ];
}

function getRentVsBuySteps(): CalculatorStepDef[] {
  return [
    {
      key: 'propertyPrice',
      message: "Let's compare renting vs buying. What's the property price?",
      interaction: {
        type: 'parameter_input',
        step: 1,
        totalSteps: 5,
        inputConfig: {
          key: 'propertyPrice',
          label: 'Property Price',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 100_000,
          max: 50_000_000,
          quickValues: [
            { label: '1M', value: 1_000_000 },
            { label: '2M', value: 2_000_000 },
            { label: '3M', value: 3_000_000 },
          ],
        },
      },
    },
    {
      key: 'monthlyRent',
      message: 'How much is the monthly rent for a comparable property?',
      interaction: {
        type: 'parameter_input',
        step: 2,
        totalSteps: 5,
        inputConfig: {
          key: 'monthlyRent',
          label: 'Monthly Rent',
          prefix: 'AED',
          placeholder: 'Enter amount',
          min: 1_000,
          max: 100_000,
          quickValues: [
            { label: '5K', value: 5_000 },
            { label: '8K', value: 8_000 },
            { label: '12K', value: 12_000 },
            { label: '20K', value: 20_000 },
          ],
        },
      },
    },
    {
      key: 'downPaymentPercent',
      message: 'Down payment percentage if buying?',
      interaction: {
        type: 'slider_input',
        step: 3,
        totalSteps: 5,
        inputConfig: {
          key: 'downPaymentPercent',
          label: 'Down Payment',
          suffix: '%',
          min: 20,
          max: 80,
          step: 5,
          defaultValue: 20,
        },
      },
    },
    {
      key: 'interestRate',
      message: 'Expected mortgage interest rate?',
      interaction: {
        type: 'option_buttons',
        step: 4,
        totalSteps: 5,
        options: [
          { label: '4.5%', value: 4.5 },
          { label: '5%', value: 5 },
          { label: '5.5%', value: 5.5 },
          { label: '6%', value: 6 },
        ],
        inputConfig: {
          key: 'interestRate',
          label: 'Interest Rate',
          suffix: '%',
          min: 1,
          max: 15,
          step: 0.25,
        },
      },
    },
    {
      key: 'yearsToCompare',
      message: 'How many years do you want to compare over?',
      interaction: {
        type: 'slider_input',
        step: 5,
        totalSteps: 5,
        inputConfig: {
          key: 'yearsToCompare',
          label: 'Comparison Period',
          suffix: 'years',
          min: 3,
          max: 30,
          step: 1,
          defaultValue: 10,
          quickValues: [
            { label: '5 yrs', value: 5 },
            { label: '10 yrs', value: 10 },
            { label: '15 yrs', value: 15 },
            { label: '20 yrs', value: 20 },
          ],
        },
      },
    },
  ];
}

function getStepsForCalculator(type: CalculatorType): CalculatorStepDef[] {
  switch (type) {
    case 'emi':
      return getEMISteps();
    case 'affordability':
      return getAffordabilitySteps();
    case 'upfront_costs':
      return getUpfrontCostsSteps();
    case 'rate_comparison':
      return getRateComparisonSteps();
    case 'prepayment':
      return getPrepaymentSteps();
    case 'rent_vs_buy':
      return getRentVsBuySteps();
    default:
      return [];
  }
}

// =====================================================================
// Start Calculator Flow
// =====================================================================

export function startCalculatorFlow(type: CalculatorType): {
  flow: AICalculatorFlow;
  messages: AIMessage[];
} {
  const steps = getStepsForCalculator(type);
  if (steps.length === 0) {
    return {
      flow: {
        flowId: generateFlowId(),
        calculatorType: type,
        currentStep: 0,
        totalSteps: 0,
        collectedData: {},
        isComplete: true,
      },
      messages: [
        {
          id: generateMessageId(),
          senderId: 'ai',
          type: 'text',
          text: 'Sorry, this calculator is not available yet.',
          timestamp: Date.now(),
        },
      ],
    };
  }

  const firstStep = steps[0];
  const flow: AICalculatorFlow = {
    flowId: generateFlowId(),
    calculatorType: type,
    currentStep: 0,
    totalSteps: steps.length,
    collectedData: {},
    isComplete: false,
  };

  const messages: AIMessage[] = [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'text',
      text: firstStep.message,
      timestamp: Date.now(),
    },
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: firstStep.interaction,
      timestamp: Date.now() + 1,
    },
  ];

  return { flow, messages };
}

// =====================================================================
// Continue Calculator Flow
// =====================================================================

export function continueCalculatorFlow(
  flow: AICalculatorFlow,
  key: string,
  value: number | string
): {
  flow: AICalculatorFlow;
  messages: AIMessage[];
} {
  const steps = getStepsForCalculator(flow.calculatorType);

  // Update collected data
  const updatedData = { ...flow.collectedData, [key]: value };
  const nextStepIndex = flow.currentStep + 1;

  // Check if we're done
  if (nextStepIndex >= steps.length) {
    // Complete the flow
    const completedFlow: AICalculatorFlow = {
      ...flow,
      currentStep: nextStepIndex,
      collectedData: updatedData,
      isComplete: true,
    };

    const resultMessages = completeCalculatorFlow(completedFlow);
    return { flow: completedFlow, messages: resultMessages };
  }

  // Next step
  const nextStep = steps[nextStepIndex];
  const updatedFlow: AICalculatorFlow = {
    ...flow,
    currentStep: nextStepIndex,
    collectedData: updatedData,
    isComplete: false,
  };

  const messages: AIMessage[] = [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'text',
      text: nextStep.message,
      timestamp: Date.now(),
    },
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: nextStep.interaction,
      timestamp: Date.now() + 1,
    },
  ];

  return { flow: updatedFlow, messages };
}

// =====================================================================
// Complete Calculator Flow (run calculations)
// =====================================================================

function completeCalculatorFlow(flow: AICalculatorFlow): AIMessage[] {
  const data = flow.collectedData;

  switch (flow.calculatorType) {
    case 'emi':
      return completeEMI(data);
    case 'affordability':
      return completeAffordability(data);
    case 'upfront_costs':
      return completeUpfrontCosts(data);
    case 'rate_comparison':
      return completeRateComparison(data);
    case 'prepayment':
      return completePrepayment(data);
    case 'rent_vs_buy':
      return completeRentVsBuy(data);
    default:
      return [
        {
          id: generateMessageId(),
          senderId: 'ai',
          type: 'text',
          text: 'Calculator completed but no result handler found.',
          timestamp: Date.now(),
        },
      ];
  }
}

// ---- EMI Result ----
function completeEMI(data: Record<string, number | string>): AIMessage[] {
  const propertyPrice = Number(data.propertyPrice);
  const downPaymentPercent = Number(data.downPaymentPercent);
  const interestRate = Number(data.interestRate);
  const years = Number(data.years);

  const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
  const principal = propertyPrice - downPayment;

  const result = calculateEMI({ principal, annualRate: interestRate, years });

  const resultData: AIResultData = {
    title: 'EMI Calculation Result',
    primaryLabel: 'Monthly EMI',
    primaryValue: formatAED(result.monthlyInstallment),
    breakdown: [
      { label: 'Property Price', value: formatAED(propertyPrice) },
      { label: 'Down Payment', value: `${formatAED(downPayment)} (${downPaymentPercent}%)` },
      { label: 'Loan Amount', value: formatAED(principal) },
      { label: 'Interest Rate', value: formatPercent(interestRate) },
      { label: 'Tenure', value: `${years} years` },
      { label: 'Total Interest', value: formatAED(result.totalInterest), highlight: true },
      { label: 'Total Payment', value: formatAED(result.totalPayment) },
    ],
    insights: [
      `Your monthly EMI would be ${formatAED(result.monthlyInstallment)} for ${years} years.`,
      `You'll pay ${formatAED(result.totalInterest)} in total interest over the loan period.`,
      result.totalInterest > principal
        ? 'The total interest exceeds the loan amount — consider a shorter tenure to save on interest.'
        : 'The interest-to-loan ratio is reasonable for this tenure.',
    ],
    actions: [
      { label: 'Recalculate', value: 'recalculate_emi', icon: 'refresh-cw' },
      { label: 'Check Affordability', value: 'start_affordability', icon: 'trending-up' },
      { label: 'Upfront Costs', value: 'start_upfront_costs', icon: 'file-text' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// ---- Affordability Result ----
function completeAffordability(data: Record<string, number | string>): AIMessage[] {
  const monthlySalary = Number(data.monthlySalary);
  const existingEMIs = Number(data.existingEMIs);
  const creditCardLimits = Number(data.creditCardLimits);

  // Calculate DBR with a hypothetical EMI of 0 to see available capacity
  const dbrResult = calculateDBR({
    monthlySalary,
    existingEMIs,
    newEMI: 0,
    creditCardLimits,
  });

  // Max loan from available EMI capacity at 4.5%, 25 years
  const maxLoan = reverseEMIToLoan(dbrResult.availableEMI, 4.5, 25);

  // Estimate max property price (assuming 20% down payment)
  const maxPropertyPrice = Math.round(maxLoan / 0.8);

  const resultData: AIResultData = {
    title: 'Affordability Analysis',
    primaryLabel: 'Max Loan Amount',
    primaryValue: formatAED(maxLoan),
    breakdown: [
      { label: 'Monthly Salary', value: formatAED(monthlySalary) },
      { label: 'Existing EMIs', value: formatAED(existingEMIs) },
      {
        label: 'Credit Card Obligation',
        value: formatAED(Math.round(creditCardLimits * 0.05)),
      },
      {
        label: 'Available EMI Capacity',
        value: formatAED(dbrResult.availableEMI),
        highlight: true,
      },
      { label: 'Current DBR', value: formatPercent(dbrResult.dbrPercent) },
      { label: 'Max Property Price', value: formatAED(maxPropertyPrice) },
    ],
    insights: [
      dbrResult.message,
      `Based on a 4.5% rate and 25-year tenure, you could borrow up to ${formatAED(maxLoan)}.`,
      `With 20% down payment, you could afford a property up to ${formatAED(maxPropertyPrice)}.`,
      dbrResult.availableEMI < 3000
        ? 'Your EMI capacity is limited. Consider reducing existing liabilities.'
        : 'You have good borrowing capacity within UAE Central Bank guidelines.',
    ],
    actions: [
      { label: 'Recalculate', value: 'recalculate_affordability', icon: 'refresh-cw' },
      { label: 'EMI Calculator', value: 'start_emi', icon: 'credit-card' },
      { label: 'Upfront Costs', value: 'start_upfront_costs', icon: 'file-text' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// ---- Upfront Costs Result ----
function completeUpfrontCosts(data: Record<string, number | string>): AIMessage[] {
  const propertyPrice = Number(data.propertyPrice);
  const downPaymentPercent = Number(data.downPaymentPercent);
  const emirate = String(data.emirate) as Emirate;
  const propertyReadiness = String(data.propertyReadiness) as 'ready' | 'off_plan';

  const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
  const loanAmount = propertyPrice - downPayment;

  const input: UpfrontCostInput = {
    propertyPrice,
    loanAmount,
    emirate,
    agentCommissionPercent: 2,
    includeVAT: true,
    valuationFee: 3_000,
    propertyReadiness,
  };

  const result = calculateUpfrontCosts(input, downPayment);

  const breakdown: AIResultBreakdownItem[] = [
    { label: 'Down Payment', value: `${formatAED(downPayment)} (${downPaymentPercent}%)` },
  ];

  if (result.dldFee > 0) {
    breakdown.push({ label: 'DLD Transfer Fee', value: formatAED(result.dldFee) });
  }
  if (result.oqoodFee > 0) {
    breakdown.push({ label: 'Oqood Fee (Off-Plan)', value: formatAED(result.oqoodFee) });
  }
  if (result.adminFee > 0) {
    breakdown.push({ label: 'DLD Admin Fee', value: formatAED(result.adminFee) });
  }
  breakdown.push(
    { label: 'Mortgage Registration', value: formatAED(result.mortgageRegistration) },
    { label: 'Bank Processing Fee', value: formatAED(result.bankProcessingFee) },
    { label: 'Valuation Fee', value: formatAED(result.valuationFee) },
    { label: 'Agent Commission (2%)', value: formatAED(result.agentCommission) }
  );
  if (result.trusteeFee > 0) {
    breakdown.push({ label: 'Trustee Fee', value: formatAED(result.trusteeFee) });
  }
  breakdown.push(
    { label: 'VAT (5%)', value: formatAED(result.vat) },
    { label: 'Total Fees', value: formatAED(result.totalFees), highlight: true }
  );

  const resultData: AIResultData = {
    title: `Upfront Costs — ${emirate.charAt(0).toUpperCase() + emirate.slice(1).replace('_', ' ')}`,
    primaryLabel: 'Total Cash Required',
    primaryValue: formatAED(result.totalUpfrontCash),
    breakdown,
    insights: [
      `You'll need ${formatAED(result.totalUpfrontCash)} total upfront cash to complete this purchase.`,
      `This includes ${formatAED(downPayment)} down payment and ${formatAED(result.totalFees)} in fees.`,
      propertyReadiness === 'off_plan' && emirate === 'dubai'
        ? 'Off-plan properties in Dubai use Oqood fees instead of DLD transfer fees.'
        : `The DLD transfer fee of ${formatAED(result.dldFee)} is the largest fee component.`,
    ],
    actions: [
      { label: 'Recalculate', value: 'recalculate_upfront_costs', icon: 'refresh-cw' },
      { label: 'EMI Calculator', value: 'start_emi', icon: 'credit-card' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// ---- Rate Comparison Result ----
function completeRateComparison(data: Record<string, number | string>): AIMessage[] {
  const propertyPrice = Number(data.propertyPrice);
  const downPaymentPercent = Number(data.downPaymentPercent);
  const years = Number(data.years);

  const downPayment = Math.round(propertyPrice * (downPaymentPercent / 100));
  const principal = propertyPrice - downPayment;

  // Compare 4 common rates
  const rates = [4.5, 5, 5.5, 6, 6.5, 7];
  const comparisons = rates.map((rate) => {
    const result = calculateEMI({ principal, annualRate: rate, years });
    return { rate, ...result };
  });

  const lowestEMI = comparisons[0];
  const highestEMI = comparisons[comparisons.length - 1];

  const resultData: AIResultData = {
    title: 'Rate Comparison',
    primaryLabel: 'Loan Amount',
    primaryValue: formatAED(principal),
    breakdown: comparisons.map((c) => ({
      label: `${c.rate}% rate`,
      value: `${formatAED(c.monthlyInstallment)}/mo — ${formatAED(c.totalInterest)} interest`,
      highlight: c.rate === rates[0],
    })),
    insights: [
      `Comparing ${rates.length} rates for a ${formatAED(principal)} loan over ${years} years.`,
      `Lowest EMI: ${formatAED(lowestEMI.monthlyInstallment)}/mo at ${lowestEMI.rate}%`,
      `Highest EMI: ${formatAED(highestEMI.monthlyInstallment)}/mo at ${highestEMI.rate}%`,
      `Difference: ${formatAED(highestEMI.monthlyInstallment - lowestEMI.monthlyInstallment)}/mo (${formatAED(highestEMI.totalInterest - lowestEMI.totalInterest)} total interest)`,
    ],
    actions: [
      { label: 'Recalculate', value: 'recalculate_rate_comparison', icon: 'refresh-cw' },
      { label: 'EMI Calculator', value: 'start_emi', icon: 'credit-card' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// ---- Prepayment Result ----
function completePrepayment(data: Record<string, number | string>): AIMessage[] {
  const principal = Number(data.loanAmount);
  const annualRate = Number(data.interestRate);
  const years = Number(data.remainingYears);
  const lumpSumAmount = Number(data.lumpSumAmount);
  const extraMonthlyPayment = Number(data.extraMonthly);

  const input: PrepaymentInput = {
    principal,
    annualRate,
    years,
    lumpSumAmount: lumpSumAmount > 0 ? lumpSumAmount : undefined,
    lumpSumAfterMonth: lumpSumAmount > 0 ? 1 : undefined, // Apply immediately
    extraMonthlyPayment: extraMonthlyPayment > 0 ? extraMonthlyPayment : undefined,
  };

  const result = calculatePrepaymentSavings(input);

  const yearsSaved = Math.floor(result.monthsSaved / 12);
  const monthsSaved = result.monthsSaved % 12;
  const tenureSavedStr =
    yearsSaved > 0
      ? `${yearsSaved} year${yearsSaved > 1 ? 's' : ''} ${monthsSaved > 0 ? `${monthsSaved} month${monthsSaved > 1 ? 's' : ''}` : ''}`
      : `${monthsSaved} month${monthsSaved > 1 ? 's' : ''}`;

  const resultData: AIResultData = {
    title: 'Prepayment Savings',
    primaryLabel: 'Interest Saved',
    primaryValue: formatAED(result.interestSaved),
    breakdown: [
      { label: 'Loan Amount', value: formatAED(principal) },
      { label: 'Interest Rate', value: formatPercent(annualRate) },
      { label: 'Original Tenure', value: `${years} years (${result.originalTenureMonths} months)` },
      { label: 'New Tenure', value: `${result.newTenureMonths} months` },
      { label: 'Tenure Saved', value: tenureSavedStr, highlight: true },
      { label: 'Original Total Interest', value: formatAED(result.originalTotalInterest) },
      { label: 'New Total Interest', value: formatAED(result.newTotalInterest) },
      { label: 'Interest Saved', value: formatAED(result.interestSaved), highlight: true },
    ],
    insights: [
      result.interestSaved > 0
        ? `You could save ${formatAED(result.interestSaved)} in interest and reduce your tenure by ${tenureSavedStr}!`
        : 'No prepayment was specified. Enter a lump sum or extra monthly amount to see savings.',
      lumpSumAmount > 0
        ? `A lump sum of ${formatAED(lumpSumAmount)} applied immediately makes a significant difference.`
        : '',
      extraMonthlyPayment > 0
        ? `An extra ${formatAED(extraMonthlyPayment)}/month accelerates your payoff considerably.`
        : '',
      'Note: UAE banks typically charge 1% early settlement fee on outstanding principal.',
    ].filter(Boolean),
    actions: [
      { label: 'Recalculate', value: 'recalculate_prepayment', icon: 'refresh-cw' },
      { label: 'EMI Calculator', value: 'start_emi', icon: 'credit-card' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// ---- Rent vs Buy Result ----
function completeRentVsBuy(data: Record<string, number | string>): AIMessage[] {
  const propertyPrice = Number(data.propertyPrice);
  const monthlyRent = Number(data.monthlyRent);
  const downPaymentPercent = Number(data.downPaymentPercent);
  const interestRate = Number(data.interestRate);
  const yearsToCompare = Number(data.yearsToCompare);

  const input: RentVsBuyInput = {
    propertyPrice,
    downPaymentPercent,
    annualRate: interestRate,
    loanTenureYears: 25,
    monthlyRent,
    annualRentIncrease: 5,
    annualPropertyAppreciation: 3,
    annualMaintenanceCost: Math.round(propertyPrice * 0.015), // 1.5% of property price
    yearsToCompare,
    emirate: 'dubai',
    isResident: true,
    isFirstTimeBuyer: true,
  };

  const result = calculateRentVsBuy(input);

  const resultData: AIResultData = {
    title: `Rent vs Buy — ${yearsToCompare} Year Comparison`,
    primaryLabel: result.breakEvenYear > 0 ? 'Break-Even Year' : 'Comparison',
    primaryValue: result.breakEvenYear > 0 ? `Year ${result.breakEvenYear}` : 'No break-even',
    breakdown: [
      { label: 'Total Rent Cost', value: formatAED(result.totalRentCost) },
      { label: 'Total Buy Cost', value: formatAED(result.totalBuyCost) },
      { label: 'Final Property Value', value: formatAED(result.finalPropertyValue) },
      { label: 'Final Equity', value: formatAED(result.finalEquity), highlight: true },
      { label: 'Net Buy Cost', value: formatAED(result.totalBuyCostNet) },
      { label: 'Monthly EMI', value: formatAED(result.monthlyEMI) },
    ],
    insights: [
      result.breakEvenYear > 0
        ? `Buying becomes cheaper than renting after year ${result.breakEvenYear}.`
        : `Renting remains cheaper over the ${yearsToCompare}-year period.`,
      `After ${yearsToCompare} years of buying, you'd have ${formatAED(result.finalEquity)} in equity.`,
      `Your property would be worth ${formatAED(result.finalPropertyValue)} (assuming 3% annual appreciation).`,
      `Assumptions: 5% annual rent increase, 3% property appreciation, 1.5% maintenance costs.`,
    ],
    actions: [
      { label: 'Recalculate', value: 'recalculate_rent_vs_buy', icon: 'refresh-cw' },
      { label: 'EMI Calculator', value: 'start_emi', icon: 'credit-card' },
      { label: 'Upfront Costs', value: 'start_upfront_costs', icon: 'file-text' },
    ],
  };

  return [
    {
      id: generateMessageId(),
      senderId: 'ai',
      type: 'ai_interaction',
      interaction: { type: 'calculator_result', resultData },
      timestamp: Date.now(),
    },
  ];
}

// =====================================================================
// Call AI Model (via Cloud Function)
// =====================================================================

export async function callAIModel(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userId?: string
): Promise<string> {
  try {
    const response = await fetch(AI_CHAT_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: AIChatResponse = await response.json();

    if (data.error && !data.reply) {
      throw new Error(data.error);
    }

    return data.reply;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[AIChat] Error calling AI model:', errorMessage);
    return (
      "I'm having trouble connecting right now. In the meantime, " +
      'you can use the calculators above for quick mortgage calculations!'
    );
  }
}

// =====================================================================
// Process User Message (main entry point)
// =====================================================================

export function processTextForQuickActions(text: string): AIMessage[] | null {
  const lowerText = text.toLowerCase().trim();

  // Check if user wants calculators
  if (
    lowerText === 'calculators' ||
    lowerText === 'calculator' ||
    lowerText === 'menu' ||
    lowerText === 'tools'
  ) {
    return [
      {
        id: generateMessageId(),
        senderId: 'ai',
        type: 'text',
        text: 'Here are the available calculators:',
        timestamp: Date.now(),
      },
      {
        id: generateMessageId(),
        senderId: 'ai',
        type: 'ai_interaction',
        interaction: getCalculatorMenuInteraction(),
        timestamp: Date.now() + 1,
      },
    ];
  }

  return null;
}
