import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import {
  calculateEMI,
  reverseEMIToLoan,
  getMinDownPaymentPercent,
} from '@/src/utils/helpers';

// =====================================================================
// Helpers
// =====================================================================
function fmtAED(v: number): string {
  if (!isFinite(v) || isNaN(v)) return 'AED 0';
  return `AED ${v.toLocaleString('en-US')}`;
}
function fmtShort(v: number): string {
  if (!isFinite(v) || isNaN(v)) return 'AED 0';
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v.toLocaleString('en-US')}`;
}

// =====================================================================
// NumInput
// =====================================================================
function NumInput({
  label,
  value,
  onChange,
  isDark,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  isDark: boolean;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : '');
  const [focused, setFocused] = useState(false);

  const handleChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setText(sanitized);
    const p = parseFloat(sanitized);
    if (!isNaN(p)) onChange(p);
    else if (sanitized === '') onChange(0);
  };

  React.useEffect(() => {
    if (!focused) setText(value > 0 ? String(value) : '');
  }, [value, focused]);

  return (
    <View className="mb-4">
      <Text className={`text-sm font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-2xl border px-4 ${
          focused
            ? isDark
              ? 'border-white/30 bg-[#1a1a1a]'
              : 'border-black/20 bg-white'
            : isDark
              ? 'border-[#2a2a2a] bg-[#1a1a1a]'
              : 'border-gray-200 bg-white'
        }`}>
        {prefix && (
          <Text className={`text-sm mr-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={isDark ? '#444' : '#ccc'}
          className={`flex-1 py-3.5 text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}
        />
        {suffix && (
          <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{suffix}</Text>
        )}
      </View>
      {hint && (
        <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// =====================================================================
// Toggle
// =====================================================================
function Toggle({
  options,
  selected,
  onSelect,
  isDark,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  isDark: boolean;
}) {
  return (
    <View className={`flex-row rounded-2xl p-1 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              active ? (isDark ? 'bg-white' : 'bg-black') : ''
            }`}>
            <Text
              className={`text-sm font-semibold ${
                active
                  ? isDark
                    ? 'text-black'
                    : 'text-white'
                  : isDark
                    ? 'text-gray-500'
                    : 'text-gray-500'
              }`}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// =====================================================================
// Section
// =====================================================================
function Section({
  icon,
  title,
  children,
  isDark,
  delay = 0,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className={`rounded-3xl p-5 mb-4 border ${
        isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
      }`}>
      <View className="flex-row items-center mb-4">
        <View
          className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
          <Feather name={icon as any} size={15} color={isDark ? '#fff' : '#000'} />
        </View>
        <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </Text>
      </View>
      {children}
    </Animated.View>
  );
}

// =====================================================================
// Metric
// =====================================================================
function Metric({
  label,
  value,
  sub,
  big,
  isDark,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  isDark: boolean;
  color?: string;
}) {
  return (
    <View
      className={`rounded-2xl p-4 border ${
        big
          ? isDark
            ? 'bg-white border-white'
            : 'bg-black border-black'
          : isDark
            ? 'bg-[#1a1a1a] border-[#2a2a2a]'
            : 'bg-white border-gray-200'
      }`}>
      <Text
        className={`text-xs font-medium mb-1.5 ${
          big
            ? isDark
              ? 'text-black/50'
              : 'text-white/50'
            : isDark
              ? 'text-gray-500'
              : 'text-gray-400'
        }`}>
        {label}
      </Text>
      <Text
        className={`${big ? 'text-2xl' : 'text-lg'} font-bold`}
        style={{
          color: color
            ? color
            : big
              ? isDark
                ? '#000'
                : '#fff'
              : isDark
                ? '#fff'
                : '#000',
        }}>
        {value}
      </Text>
      {sub && (
        <Text
          className={`text-[10px] mt-1 ${
            big
              ? isDark
                ? 'text-black/40'
                : 'text-white/40'
              : isDark
                ? 'text-gray-600'
                : 'text-gray-400'
          }`}>
          {sub}
        </Text>
      )}
    </View>
  );
}

// =====================================================================
// MAIN
// =====================================================================
export default function CalcAffordScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [salary, setSalary] = useState(25_000);
  const [existingEMIs, setExistingEMIs] = useState(3_000);
  const [creditCardLimits, setCreditCardLimits] = useState(0);
  const [interestRate, setInterestRate] = useState(4.25);
  const [tenure, setTenure] = useState(25);
  const [dpPercent, setDpPercent] = useState(20);
  const [buyerType, setBuyerType] = useState<'resident' | 'non-resident'>('resident');
  const [firstTime, setFirstTime] = useState(true);

  // Clamp tenure to UAE max 25 years
  const effectiveTenure = Math.min(25, Math.max(1, tenure));
  // Clamp dp to valid range
  const effectiveDpPercent = Math.min(99, Math.max(0, dpPercent));

  // Affordability calculation
  const result = useMemo(() => {
    if (salary <= 0) return null;

    // UAE Central Bank: max DBR is 50%
    const maxDBR = 0.5;

    // Credit card obligation: banks count 5% of total limit
    const creditCardObligation = creditCardLimits * 0.05;
    const totalExistingObligations = existingEMIs + creditCardObligation;

    // Max EMI = (salary * 50%) - existing obligations
    const maxMonthlyEMI = Math.max(0, salary * maxDBR - totalExistingObligations);

    if (maxMonthlyEMI <= 0) {
      return {
        maxEMI: 0,
        maxLoan: 0,
        maxProperty: 0,
        dbr: Math.round((totalExistingObligations / salary) * 100 * 100) / 100,
        verifiedEMI: 0,
        totalPayment: 0,
        totalInterest: 0,
        downPaymentAmount: 0,
        minDPPercent: getMinDownPaymentPercent(
          buyerType === 'resident',
          firstTime,
          0
        ),
        warning:
          'Your existing obligations already consume 50%+ of salary. Reduce debt to qualify.',
      };
    }

    // Reverse-calculate max loan from max EMI
    const maxLoan = reverseEMIToLoan(maxMonthlyEMI, interestRate, effectiveTenure);

    // Max property = maxLoan / (1 - dpPercent/100)
    // Guard against division by zero or >= 100%
    const loanFraction = 1 - effectiveDpPercent / 100;
    const maxProperty = loanFraction > 0 ? Math.round(maxLoan / loanFraction) : 0;

    // Get the actual minimum DP for this property price & buyer type
    const minDPPercent = getMinDownPaymentPercent(
      buyerType === 'resident',
      firstTime,
      maxProperty
    );

    // If user's DP% is below minimum, recalculate with minimum DP
    let adjustedMaxProperty = maxProperty;
    let adjustedMaxLoan = maxLoan;
    let adjustedDpPercent = effectiveDpPercent;
    let warning = '';

    if (effectiveDpPercent < minDPPercent) {
      adjustedDpPercent = minDPPercent;
      const adjustedLoanFraction = 1 - minDPPercent / 100;
      adjustedMaxProperty = adjustedLoanFraction > 0
        ? Math.round(maxLoan / adjustedLoanFraction)
        : 0;
      adjustedMaxLoan = maxLoan;
      warning = `Down payment adjusted to minimum ${minDPPercent}% for ${buyerType === 'resident' ? 'residents' : 'non-residents'}`;
    }

    const downPaymentAmount = Math.round(adjustedMaxProperty * (adjustedDpPercent / 100));

    // DBR at maximum borrowing
    const dbr =
      Math.round(((totalExistingObligations + maxMonthlyEMI) / salary) * 100 * 100) / 100;

    // Verify with forward EMI calculation
    const emi = calculateEMI({
      principal: adjustedMaxLoan,
      annualRate: interestRate,
      years: effectiveTenure,
    });

    return {
      maxEMI: maxMonthlyEMI,
      maxLoan: adjustedMaxLoan,
      maxProperty: adjustedMaxProperty,
      dbr,
      verifiedEMI: emi.monthlyInstallment,
      totalPayment: emi.totalPayment,
      totalInterest: emi.totalInterest,
      downPaymentAmount,
      minDPPercent,
      warning,
    };
  }, [salary, existingEMIs, creditCardLimits, interestRate, effectiveTenure, effectiveDpPercent, buyerType, firstTime]);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} className="px-6 pt-2 pb-3">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
            }`}>
            <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <View className="flex-1">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Affordability
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              How much mortgage can you afford?
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#10b98120' }}>
            <Feather name="trending-up" size={18} color="#10b981" />
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="px-6">
            {/* Income Section */}
            <Section icon="user" title="Your Income" isDark={isDark} delay={100}>
              <NumInput
                label="Monthly Net Salary"
                value={salary}
                onChange={setSalary}
                isDark={isDark}
                prefix="AED"
                hint="After tax / deductions"
              />
              <NumInput
                label="Existing Monthly EMIs"
                value={existingEMIs}
                onChange={setExistingEMIs}
                isDark={isDark}
                prefix="AED"
                hint="Car loan, personal loans, etc."
              />
              <NumInput
                label="Total Credit Card Limits"
                value={creditCardLimits}
                onChange={setCreditCardLimits}
                isDark={isDark}
                prefix="AED"
                hint="Banks count 5% of total limit as monthly obligation"
              />
            </Section>

            {/* Buyer Profile */}
            <Section icon="user-check" title="Buyer Profile" isDark={isDark} delay={150}>
              <Text
                className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Buyer Type
              </Text>
              <Toggle
                options={[
                  { label: 'UAE Resident', value: 'resident' },
                  { label: 'Non-Resident', value: 'non-resident' },
                ]}
                selected={buyerType}
                onSelect={(v) => setBuyerType(v as 'resident' | 'non-resident')}
                isDark={isDark}
              />
              <View className="mt-4">
                <Text
                  className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  First-Time Buyer?
                </Text>
                <Toggle
                  options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                  ]}
                  selected={firstTime ? 'yes' : 'no'}
                  onSelect={(v) => setFirstTime(v === 'yes')}
                  isDark={isDark}
                />
              </View>
            </Section>

            {/* Loan Assumptions */}
            <Section icon="settings" title="Assumptions" isDark={isDark} delay={200}>
              <NumInput
                label="Interest Rate"
                value={interestRate}
                onChange={(v) => setInterestRate(Math.max(0, v))}
                isDark={isDark}
                suffix="% p.a."
                hint={interestRate === 0 ? 'Islamic / interest-free finance' : undefined}
              />
              <NumInput
                label="Loan Tenure"
                value={tenure}
                onChange={setTenure}
                isDark={isDark}
                suffix="years"
                hint="UAE max is 25 years"
              />
              {tenure > 25 && (
                <View className="flex-row items-center mb-2">
                  <Feather name="alert-triangle" size={11} color="#f59e0b" />
                  <Text className="ml-1.5 text-[11px] text-amber-500">
                    Capped at 25 years (UAE maximum)
                  </Text>
                </View>
              )}
              <NumInput
                label="Down Payment"
                value={dpPercent}
                onChange={setDpPercent}
                isDark={isDark}
                suffix="%"
                hint="Typically 20-25% for UAE residents, 40%+ for non-residents"
              />
            </Section>

            {/* Results */}
            {result && (
              <Animated.View entering={FadeInUp.delay(300).duration(400)}>
                <View className="mb-3">
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    You Can Afford
                  </Text>
                </View>

                {/* Warning if exists */}
                {result.warning ? (
                  <View className="flex-row items-start mb-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Feather
                      name="alert-triangle"
                      size={12}
                      color="#f59e0b"
                      style={{ marginTop: 2 }}
                    />
                    <Text className="ml-2 text-[11px] text-amber-500 flex-1">
                      {result.warning}
                    </Text>
                  </View>
                ) : null}

                {/* Hero: Max Property Price */}
                <Metric
                  label="Maximum Property Price"
                  value={result.maxProperty > 0 ? fmtAED(result.maxProperty) : 'N/A'}
                  sub={
                    result.maxProperty > 0
                      ? `With ${effectiveDpPercent}% down payment`
                      : 'Reduce liabilities to qualify'
                  }
                  big
                  isDark={isDark}
                />

                <View className="flex-row gap-3 mt-3">
                  <View className="flex-1">
                    <Metric
                      label="Max Loan"
                      value={result.maxLoan > 0 ? fmtShort(result.maxLoan) : 'N/A'}
                      isDark={isDark}
                    />
                  </View>
                  <View className="flex-1">
                    <Metric
                      label="Max Monthly EMI"
                      value={
                        result.maxEMI > 0 ? fmtAED(Math.round(result.maxEMI)) : 'N/A'
                      }
                      isDark={isDark}
                    />
                  </View>
                </View>

                <View className="flex-row gap-3 mt-3">
                  <View className="flex-1">
                    <Metric
                      label="DBR at Max"
                      value={`${result.dbr}%`}
                      sub={result.dbr <= 50 ? 'Within guideline' : 'Over limit'}
                      isDark={isDark}
                      color={result.dbr <= 50 ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                  <View className="flex-1">
                    <Metric
                      label="Down Payment"
                      value={
                        result.downPaymentAmount > 0
                          ? fmtShort(result.downPaymentAmount)
                          : 'N/A'
                      }
                      sub={`${effectiveDpPercent}% of property`}
                      isDark={isDark}
                    />
                  </View>
                </View>

                {/* Verified EMI */}
                {result.verifiedEMI > 0 && (
                  <View className="flex-row gap-3 mt-3">
                    <View className="flex-1">
                      <Metric
                        label="Verified EMI"
                        value={fmtAED(result.verifiedEMI)}
                        sub="Forward-calculated from max loan"
                        isDark={isDark}
                      />
                    </View>
                    <View className="flex-1">
                      <Metric
                        label="Min Down Payment"
                        value={`${result.minDPPercent}%`}
                        sub={`For ${buyerType === 'resident' ? 'residents' : 'non-residents'}`}
                        isDark={isDark}
                      />
                    </View>
                  </View>
                )}

                {result.totalPayment > 0 && (
                  <View className="mt-3">
                    <Metric
                      label="Total Repayment"
                      value={fmtShort(result.totalPayment)}
                      sub={`Including ${fmtShort(result.totalInterest || 0)} interest over ${effectiveTenure} years`}
                      isDark={isDark}
                    />
                  </View>
                )}

                {/* Salary utilization breakdown */}
                {salary > 0 && result.maxEMI > 0 && (
                  <Animated.View entering={FadeInUp.delay(350).duration(400)}>
                    <View
                      className={`rounded-2xl p-4 mt-3 border ${
                        isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                      }`}>
                      <Text
                        className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Salary Allocation at Max Borrowing
                      </Text>
                      <View className="h-4 rounded-full overflow-hidden flex-row">
                        <View
                          className="h-full bg-emerald-500"
                          style={
                            {
                              width: `${Math.min(100, Math.round((result.maxEMI / salary) * 100))}%`,
                            } as any
                          }
                        />
                        {existingEMIs > 0 && (
                          <View
                            className="h-full bg-amber-500"
                            style={
                              {
                                width: `${Math.min(100, Math.round((existingEMIs / salary) * 100))}%`,
                              } as any
                            }
                          />
                        )}
                        {creditCardLimits > 0 && (
                          <View
                            className="h-full bg-orange-400"
                            style={
                              {
                                width: `${Math.min(100, Math.round(((creditCardLimits * 0.05) / salary) * 100))}%`,
                              } as any
                            }
                          />
                        )}
                      </View>
                      <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-2.5">
                        <View className="flex-row items-center">
                          <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-emerald-500" />
                          <Text
                            className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            New EMI {Math.round((result.maxEMI / salary) * 100)}%
                          </Text>
                        </View>
                        {existingEMIs > 0 && (
                          <View className="flex-row items-center">
                            <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-amber-500" />
                            <Text
                              className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Existing EMIs {Math.round((existingEMIs / salary) * 100)}%
                            </Text>
                          </View>
                        )}
                        {creditCardLimits > 0 && (
                          <View className="flex-row items-center">
                            <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-orange-400" />
                            <Text
                              className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Cards {Math.round(((creditCardLimits * 0.05) / salary) * 100)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Info banner */}
                <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                  <View
                    className={`rounded-2xl p-4 mt-4 border ${
                      isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                    }`}>
                    <View className="flex-row items-center mb-2">
                      <Feather name="shield" size={14} color={isDark ? '#fff' : '#000'} />
                      <Text
                        className={`ml-2 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        UAE DBR Guidelines
                      </Text>
                    </View>
                    {[
                      'Max DBR: 50% of net monthly salary',
                      'Includes all loan EMIs + 5% of credit card limits',
                      'Residents: 20% min down payment (first home, <= AED 5M)',
                      'Non-residents: 40-50% min down payment',
                      'Max mortgage tenure: 25 years',
                    ].map((tip, i) => (
                      <View key={i} className="flex-row items-start mb-1.5">
                        <Feather
                          name="check"
                          size={12}
                          color="#22c55e"
                          style={{ marginTop: 2 }}
                        />
                        <Text
                          className={`ml-2 text-xs flex-1 leading-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {tip}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>

                {/* CTA */}
                <Animated.View entering={FadeInUp.delay(500).duration(400)} className="mt-5">
                  <Pressable
                    onPress={() => router.push('/calc-emi' as any)}
                    className={`rounded-2xl py-4 items-center flex-row justify-center ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}>
                    <Feather name="credit-card" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text
                      className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      Calculate EMI
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/application' as any)}
                    className={`rounded-2xl py-3.5 mt-3 items-center flex-row justify-center border ${
                      isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
                    }`}>
                    <Feather name="file-text" size={14} color={isDark ? '#fff' : '#000'} />
                    <Text
                      className={`ml-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      Start Application
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Disclaimer */}
                <View className="flex-row items-start mt-5 mb-2">
                  <Feather
                    name="info"
                    size={11}
                    color={isDark ? '#444' : '#bbb'}
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                    This is an estimate based on UAE Central Bank guidelines. Actual affordability
                    depends on your bank, credit score, employment type, and other factors.
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
