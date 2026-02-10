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
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { calculateEMI } from '@/src/utils/helpers';

// =====================================================================
// Helpers
// =====================================================================
function fmtAED(v: number): string {
  return `AED ${v.toLocaleString('en-US')}`;
}
function fmtShort(v: number): string {
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
    setText(cleaned);
    const p = parseFloat(cleaned);
    if (!isNaN(p)) onChange(p);
    else if (cleaned === '') onChange(0);
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
            ? isDark ? 'border-white/30 bg-[#1a1a1a]' : 'border-black/20 bg-white'
            : isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
        }`}>
        {prefix && (
          <Text className={`text-sm mr-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{prefix}</Text>
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
        <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{hint}</Text>
      )}
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
        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
          <Feather name={icon as any} size={15} color={isDark ? '#fff' : '#000'} />
        </View>
        <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</Text>
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
          ? isDark ? 'bg-white border-white' : 'bg-black border-black'
          : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
      }`}>
      <Text
        className={`text-xs font-medium mb-1.5 ${
          big
            ? isDark ? 'text-black/50' : 'text-white/50'
            : isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
        {label}
      </Text>
      <Text
        className={`${big ? 'text-2xl' : 'text-lg'} font-bold`}
        style={{
          color: color
            ? color
            : big
            ? isDark ? '#000' : '#fff'
            : isDark ? '#fff' : '#000',
        }}>
        {value}
      </Text>
      {sub && (
        <Text
          className={`text-[10px] mt-1 ${
            big
              ? isDark ? 'text-black/40' : 'text-white/40'
              : isDark ? 'text-gray-600' : 'text-gray-400'
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
  const [interestRate, setInterestRate] = useState(4.25);
  const [tenure, setTenure] = useState(25);
  const [dpPercent, setDpPercent] = useState(20);

  // Affordability calculation
  // Max EMI = (salary * 0.5) - existingEMIs
  // From max EMI, reverse-calculate max loan using EMI formula
  const result = useMemo(() => {
    if (salary <= 0) return null;

    const maxDBR = 0.5; // 50%
    const maxMonthlyEMI = Math.max(0, salary * maxDBR - existingEMIs);

    if (maxMonthlyEMI <= 0) return { maxEMI: 0, maxLoan: 0, maxProperty: 0, dbr: Math.round((existingEMIs / salary) * 100), verifiedEMI: 0, totalPayment: 0, totalInterest: 0 };

    // Reverse EMI: Loan = EMI * [(1+r)^n - 1] / [r * (1+r)^n]
    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    let maxLoan: number;
    if (r === 0) {
      maxLoan = maxMonthlyEMI * n;
    } else {
      const factor = (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
      maxLoan = Math.round(maxMonthlyEMI * factor);
    }

    // Max property = maxLoan / (1 - dpPercent/100)
    const maxProperty = dpPercent < 100 ? Math.round(maxLoan / (1 - dpPercent / 100)) : 0;

    const dbr = Math.round(((existingEMIs + maxMonthlyEMI) / salary) * 100);

    // Verify with forward calculation
    const emi = calculateEMI({ principal: maxLoan, annualRate: interestRate, years: tenure });

    return {
      maxEMI: maxMonthlyEMI,
      maxLoan,
      maxProperty,
      dbr,
      verifiedEMI: emi.monthlyInstallment,
      totalPayment: emi.totalPayment,
      totalInterest: emi.totalInterest,
    };
  }, [salary, existingEMIs, interestRate, tenure, dpPercent]);

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
                hint="Car loan, credit cards, personal loans, etc."
              />
            </Section>

            {/* Loan Assumptions */}
            <Section icon="settings" title="Assumptions" isDark={isDark} delay={200}>
              <NumInput
                label="Interest Rate"
                value={interestRate}
                onChange={setInterestRate}
                isDark={isDark}
                suffix="% p.a."
              />
              <NumInput
                label="Loan Tenure"
                value={tenure}
                onChange={setTenure}
                isDark={isDark}
                suffix="years"
              />
              <NumInput
                label="Down Payment"
                value={dpPercent}
                onChange={setDpPercent}
                isDark={isDark}
                suffix="%"
                hint="Typically 20-25% for UAE residents"
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

                {/* Hero: Max Property Price */}
                <Metric
                  label="Maximum Property Price"
                  value={result.maxProperty > 0 ? fmtAED(result.maxProperty) : 'N/A'}
                  sub={result.maxProperty > 0 ? `With ${dpPercent}% down payment` : 'Reduce liabilities to qualify'}
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
                      value={result.maxEMI > 0 ? fmtAED(Math.round(result.maxEMI)) : 'N/A'}
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
                      value={result.maxProperty > 0 ? fmtShort(Math.round(result.maxProperty * dpPercent / 100)) : 'N/A'}
                      sub={`${dpPercent}% of property`}
                      isDark={isDark}
                    />
                  </View>
                </View>

                {result.totalPayment > 0 && (
                  <View className="mt-3">
                    <Metric
                      label="Total Repayment"
                      value={fmtShort(result.totalPayment)}
                      sub={`Including ${fmtShort(result.totalInterest || 0)} interest over ${tenure} years`}
                      isDark={isDark}
                    />
                  </View>
                )}

                {/* Info banner */}
                <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                  <View
                    className={`rounded-2xl p-4 mt-4 border ${
                      isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                    }`}>
                    <View className="flex-row items-center mb-2">
                      <Feather name="shield" size={14} color={isDark ? '#fff' : '#000'} />
                      <Text className={`ml-2 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        UAE DBR Guidelines
                      </Text>
                    </View>
                    {[
                      'Max DBR: 50% of net monthly salary',
                      'Includes all loan EMIs (new + existing)',
                      'Banks may apply stricter limits for higher salaries',
                      'Max loan typically 60x monthly salary',
                    ].map((tip, i) => (
                      <View key={i} className="flex-row items-start mb-1.5">
                        <Feather name="check" size={12} color="#22c55e" style={{ marginTop: 2 }} />
                        <Text className={`ml-2 text-xs flex-1 leading-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                    <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      Calculate EMI
                    </Text>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
