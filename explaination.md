# MortgageConnect Calculator Guide

This guide explains how each calculator works in simple terms, along with test inputs you can try. No mortgage knowledge required!

---

## 1. EMI Calculator

**What it calculates:** Your monthly mortgage payment (EMI = Equated Monthly Installment)

**When to use it:** You found a property and want to know what you'll pay every month.

### Key Terms
- **Property Price**: How much the house/apartment costs
- **Down Payment**: Money you pay upfront (rest is the loan)
- **Interest Rate**: The bank charges you extra for borrowing (in % per year)
- **Loan Tenure**: How many years you'll take to repay (UAE max: 25 years)
- **DBR (Debt Burden Ratio)**: What % of your salary goes to debt payments (banks want this under 50%)

### Test Inputs

#### Test Case 1: Basic Dubai Apartment
- Property Price: `1,500,000` AED
- Down Payment %: `20` (minimum for residents)
- Interest Rate: `6.5` %
- Loan Tenure: `25` years
- Monthly Salary: `25,000` AED
- Existing Monthly Debts: `0` AED
- **Expected Result**: EMI around 7,900 AED/month, DBR ~32% (Good!)

#### Test Case 2: Luxury Villa
- Property Price: `5,000,000` AED
- Down Payment %: `25` (minimum for 3-5M properties)
- Interest Rate: `5.99` %
- Loan Tenure: `20` years
- Monthly Salary: `60,000` AED
- Credit Card Limits: `50,000` AED (adds 2,500 to debt calculation)
- **Expected Result**: EMI around 26,600 AED/month, check if DBR stays under 50%

#### Test Case 3: Edge Case (Low Down Payment)
- Property Price: `2,000,000` AED
- Down Payment %: `15` (try going below minimum)
- Interest Rate: `7` %
- **Expected Result**: Calculator should warn about minimum down payment

---

## 2. Affordability Calculator

**What it calculates:** How much property you can afford based on your salary

**When to use it:** Before house hunting — know your budget first!

### Key Terms
- **Maximum EMI Capacity**: 50% of salary minus existing debts
- **Non-Resident**: If you don't live in UAE, down payment minimums are higher
- **First-Time Buyer**: Some banks offer better rates

### Test Inputs

#### Test Case 1: First-Time Buyer (Resident)
- Monthly Salary: `20,000` AED
- Existing Monthly Debts: `3,000` AED
- Interest Rate: `6.5` %
- Preferred Tenure: `25` years
- Buyer Type: `Resident`
- First-Time Buyer: `Yes`
- **Expected Result**: Maximum property price around 1.3M AED, minimum down payment ~260K AED

#### Test Case 2: High Earner
- Monthly Salary: `80,000` AED
- Existing Debts: `10,000` AED
- Interest Rate: `5.5` %
- Tenure: `20` years
- **Expected Result**: Can afford ~7M AED property with ~1.75M down payment

#### Test Case 3: Non-Resident (Higher DP Required)
- Monthly Salary: `50,000` AED
- Interest Rate: `6` %
- Buyer Type: `Non-Resident`
- Property Price: `6,000,000` AED (above 5M)
- **Expected Result**: Should require 50% down payment (3M AED) because property >5M

---

## 3. Upfront Costs Calculator

**What it calculates:** One-time fees you pay when buying (NOT the down payment)

**When to use it:** Budget for the "hidden costs" — these add 6-8% on top of down payment!

### Key Terms
- **DLD Fee**: Dubai Land Department charges 4% of property price
- **Trustee Fee**: Fee for the registration office (AED 2,000-4,000)
- **Oqood Fee**: For off-plan properties (under construction) in Dubai
- **Bank Processing**: Usually 1% of loan amount (min AED 5,000)
- **Property Readiness**: Ready = finished, Off-Plan = still being built

### Test Inputs

#### Test Case 1: Ready Apartment in Dubai
- Property Price: `1,200,000` AED
- Down Payment %: `20`
- Emirate: `Dubai`
- Property Readiness: `Ready`
- Agent Commission: `2` %
- Include VAT: `Yes`
- **Expected Result**: Total upfront around 110K AED (DLD 48K + fees)

#### Test Case 2: Off-Plan Property (Under Construction)
- Property Price: `800,000` AED
- Down Payment %: `24` (non-resident minimum for <1M)
- Emirate: `Dubai`
- Property Readiness: `Off-Plan`
- **Expected Result**: Oqood fee replaces DLD fee, different cost structure

#### Test Case 3: Cash Buyer (No Loan)
- Property Price: `2,000,000` AED
- Down Payment %: `100` (full cash)
- **Expected Result**: No bank fees, only government fees (DLD, registration)

---

## 4. Rate Comparison Calculator

**What it calculates:** Compare 2-3 mortgage offers side-by-side

**When to use it:** Shopping between banks — see which deal saves you money

### Key Terms
- **Effective Interest Rate**: The REAL cost including all fees (APR)
- **Monthly Savings**: Difference between best and worst option

### Test Inputs

#### Test Case 1: Two Bank Offers
**Scenario A (Bank 1):**
- Property Price: `2,500,000` AED
- Down Payment %: `20`
- Interest Rate: `6.5` %
- Tenure: `25` years
- Processing Fee: `10,000` AED

**Scenario B (Bank 2):**
- Property Price: `2,500,000` AED
- Down Payment %: `20`
- Interest Rate: `5.99` %
- Tenure: `25` years
- Processing Fee: `15,000` AED

**Expected Result**: Bank 2 saves ~750 AED/month despite higher fee

#### Test Case 2: Different Tenures
- Scenario A: 6.5% rate, 20 years
- Scenario B: 6.5% rate, 25 years
- **Expected Result**: Longer tenure = lower monthly payment but MORE total interest paid

---

## 5. Prepayment Calculator

**What it calculates:** How much you save by paying extra on your mortgage

**When to use it:** You got a bonus/inheritance and want to pay off mortgage faster

### Key Terms
- **Lump Sum**: One big extra payment (e.g., 100K AED)
- **Extra Monthly**: Small extra amount every month (e.g., 1,000 AED/month)
- **Early Settlement Fee**: Penalty for paying off early (usually 1% of remaining)
- **Net Savings**: Interest saved minus any fees

### Test Inputs

#### Test Case 1: Lump Sum Payment
- Original Loan: `1,500,000` AED
- Interest Rate: `6.5` %
- Remaining Tenure: `20` years
- Lump Sum Amount: `200,000` AED
- Pay In: `Now` (month 1)
- **Expected Result**: Saves ~2-3 years and ~180K AED in interest

#### Test Case 2: Extra Monthly Payments
- Original Loan: `2,000,000` AED
- Interest Rate: `6` %
- Remaining Tenure: `25` years
- Extra Monthly: `2,000` AED
- **Expected Result**: Pay off ~5 years earlier, save ~500K AED interest

#### Test Case 3: Combined Approach
- Lump Sum: `100,000` AED
- Extra Monthly: `1,500` AED
- **Expected Result**: Maximum savings — check if net savings after 1% fee is still positive

---

## 6. Rent vs Buy Calculator

**What it calculates:** Whether renting or buying is cheaper over time

**When to use it:** Deciding if you should buy or keep renting

### Key Terms
- **Break-Even Year**: When buying becomes cheaper than renting
- **Property Appreciation**: How much property value increases yearly
- **Maintenance Costs**: Repairs, service charges (usually 1% of value/year)

### Test Inputs

#### Test Case 1: Long-Term Stay (Buy Wins)
**Property:**
- Price: `1,800,000` AED
- Down Payment: `20` %
- Interest Rate: `6.5` %
- Tenure: `25` years
- Appreciation: `3` %/year
- Maintenance: `1` %/year

**Rent:**
- Monthly Rent: `7,000` AED
- Annual Increase: `3` %

**Comparison:** `10` years

**Expected Result**: Break-even around year 6-7, buying saves ~200K after 10 years

#### Test Case 2: Short-Term Stay (Rent Wins)
- Same property as above
- Comparison: `3` years only
- **Expected Result**: Renting is cheaper (not enough time to recover upfront costs)

#### Test Case 3: High Appreciation Market
- Property Appreciation: `5` %/year (aggressive)
- Rent Increase: `5` %/year
- **Expected Result**: Buying becomes much more attractive, equity builds faster

---

## General Tips for Testing

### 1. Start Simple
Begin with round numbers (1M, 2M AED) and basic rates (6%) to understand the pattern.

### 2. Watch the DBR
- Green (<40%): Very safe
- Yellow (40-50%): Most banks will approve
- Red (>50%): Loan may be rejected or require higher down payment

### 3. Compare Scenarios
Use the Rate Comparison calculator with the SAME property but different bank offers.

### 4. Consider All Costs
Upfront costs add 6-8% to your down payment. Don't forget them in your budget!

### 5. Play with Tenure
Longer tenure = lower monthly payment BUT more total interest. Try 20 vs 25 years to see the difference.

---

## Quick Reference: UAE Mortgage Rules

| Property Price | Min Down Payment (Resident) | Min Down Payment (Non-Resident) |
|---------------|----------------------------|--------------------------------|
| Under 1M AED | 20% | 25% |
| 1M - 5M AED | 20% | 25% |
| Over 5M AED | 30% | 50% |

**Maximum Loan Tenure:** 25 years (or until age 65, whichever comes first)

**Maximum DBR:** 50% of monthly salary

**Common Fees:**
- DLD Fee: 4% of property price
- Agent Commission: 2% of property price
- Bank Processing: 1% of loan (min AED 5,000)
- Trustee Fee: AED 2,000-4,000

---

## Need Help?

All calculators include:
- Validation warnings (e.g., "Down payment too low")
- Visual breakdowns (charts, bars)
- Detailed explanations of results
- Color-coded indicators (green/yellow/red)

Start with the **Affordability Calculator** to know your budget, then use **EMI Calculator** for specific properties!
