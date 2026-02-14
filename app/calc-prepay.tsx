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
import { calculatePrepaymentSavings, calculateEMI } from '@/src/utils/helpers';
import type { PrepaymentResult } from '@/src/utils/helpers';

const ACCENT = '#8b5cf6'; // violet

// =====================================================================
// Formatters
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
function fmtMonths(months: number): string {
  if (months <= 0) return '0 months';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y}y ${m}m`;
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
    let cleaned = t.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
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
// Chips
// =====================================================================
function Chips({
  items,
  selected,
  onSelect,
  isDark,
}: {
  items: { label: string; value: number }[];
  selected: number;
  onSelect: (v: number) => void;
  isDark: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => {
        const active = selected === item.value;
        return (
          <Pressable
            key={String(item.value)}
            onPress={() => onSelect(item.value)}
            className={`px-4 py-2.5 rounded-xl border ${
              active
                ? isDark ? 'bg-white border-white' : 'bg-black border-black'
                : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
            }`}>
            <Text
              className={`text-sm font-semibold ${
                active
                  ? isDark ? 'text-black' : 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {item.label}
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
// Stat Card
// =====================================================================
function StatCard({
  label,
  value,
  sub,
  isDark,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-2xl p-4 border ${
        accent
          ? isDark ? 'bg-white border-white' : 'bg-black border-black'
          : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
      }`}>
      <Text className={`text-xs ${
        accent
          ? isDark ? 'text-black/50' : 'text-white/50'
          : isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>{label}</Text>
      <Text className={`text-lg font-bold mt-1 ${
        accent
          ? isDark ? 'text-black' : 'text-white'
          : isDark ? 'text-white' : 'text-black'
      }`}>{value}</Text>
      {sub && (
        <Text className={`text-[10px] mt-0.5 ${
          accent
            ? isDark ? 'text-black/40' : 'text-white/40'
            : isDark ? 'text-gray-600' : 'text-gray-400'
        }`}>{sub}</Text>
      )}
    </View>
  );
}

// =====================================================================
// Toggle
// =====================================================================
function Toggle({
  label,
  value,
  onToggle,
  isDark,
  hint,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  isDark: boolean;
  hint?: string;
}) {
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
          {hint && (
            <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{hint}</Text>
          )}
        </View>
        <Pressable
          onPress={onToggle}
          className={`w-12 h-7 rounded-full justify-center px-1 ${
            value
              ? isDark ? 'bg-white' : 'bg-black'
              : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'
          }`}>
          <View
            className={`w-5 h-5 rounded-full ${
              value
                ? isDark ? 'bg-black self-end' : 'bg-white self-end'
                : isDark ? 'bg-gray-600 self-start' : 'bg-white self-start'
            }`}
          />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// MAIN
// =====================================================================
export default function CalcPrepayScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // --- Loan inputs ---
  const [loanAmount, setLoanAmount] = useState(1_200_000);
  const [annualRate, setAnnualRate] = useState(4.5);
  const [tenure, setTenure] = useState(25);

  // --- Prepayment inputs ---
  const [enableLumpSum, setEnableLumpSum] = useState(true);
  const [lumpSumAmount, setLumpSumAmount] = useState(200_000);
  const [lumpSumAfterMonth, setLumpSumAfterMonth] = useState(12);
  const [enableExtraMonthly, setEnableExtraMonthly] = useState(false);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(2_000);

  // --- Compute ---
  const currentEMI = useMemo(() => {
    const result = calculateEMI({ principal: loanAmount, annualRate, years: tenure });
    return result.monthlyInstallment;
  }, [loanAmount, annualRate, tenure]);

  const result: PrepaymentResult = useMemo(() => {
    return calculatePrepaymentSavings({
      principal: loanAmount,
      annualRate,
      years: tenure,
      lumpSumAmount: enableLumpSum ? lumpSumAmount : 0,
      lumpSumAfterMonth: enableLumpSum ? lumpSumAfterMonth : 0,
      extraMonthlyPayment: enableExtraMonthly ? extraMonthlyPayment : 0,
    });
  }, [loanAmount, annualRate, tenure, enableLumpSum, lumpSumAmount, lumpSumAfterMonth, enableExtraMonthly, extraMonthlyPayment]);

  const hasSavings = result.interestSaved > 0 || result.monthsSaved > 0;

  // Early settlement fee estimate (1% of outstanding at prepayment time)
  const earlySettlementFee = enableLumpSum && lumpSumAmount > 0
    ? Math.round(lumpSumAmount * 0.01)
    : 0;
  const netSavings = Math.max(0, result.interestSaved - earlySettlementFee);

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
              Prepayment Calculator
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Early settlement savings
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${ACCENT}20` }}>
            <Feather name="zap" size={18} color={ACCENT} />
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

            {/* Loan Details */}
            <Section icon="home" title="Loan Details" isDark={isDark} delay={100}>
              <NumInput
                label="Loan Amount"
                value={loanAmount}
                onChange={(v) => setLoanAmount(Math.max(0, v))}
                isDark={isDark}
                prefix="AED"
              />
              <Chips
                items={[
                  { label: '500K', value: 500_000 },
                  { label: '1M', value: 1_000_000 },
                  { label: '1.5M', value: 1_500_000 },
                  { label: '2M', value: 2_000_000 },
                ]}
                selected={loanAmount}
                onSelect={setLoanAmount}
                isDark={isDark}
              />

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <NumInput
                    label="Interest Rate"
                    value={annualRate}
                    onChange={(v) => setAnnualRate(Math.max(0, v))}
                    isDark={isDark}
                    suffix="%"
                  />
                </View>
                <View className="flex-1">
                  <NumInput
                    label="Tenure"
                    value={tenure}
                    onChange={(v) => setTenure(Math.min(25, Math.max(1, Math.round(v))))}
                    isDark={isDark}
                    suffix="years"
                  />
                </View>
              </View>

              {/* Current EMI display */}
              <View
                className={`rounded-xl p-3 border ${
                  isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'
                }`}>
                <View className="flex-row items-center justify-between">
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Current Monthly EMI
                  </Text>
                  <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtAED(currentEMI)}
                  </Text>
                </View>
              </View>
            </Section>

            {/* Prepayment Options */}
            <Section icon="zap" title="Prepayment Options" isDark={isDark} delay={200}>
              {/* Lump Sum Toggle */}
              <Toggle
                label="One-time lump sum payment"
                value={enableLumpSum}
                onToggle={() => setEnableLumpSum(!enableLumpSum)}
                isDark={isDark}
                hint="Make a single large extra payment"
              />

              {enableLumpSum && (
                <View className="ml-2 mb-3">
                  <NumInput
                    label="Lump Sum Amount"
                    value={lumpSumAmount}
                    onChange={(v) => setLumpSumAmount(Math.max(0, v))}
                    isDark={isDark}
                    prefix="AED"
                  />
                  <Chips
                    items={[
                      { label: '100K', value: 100_000 },
                      { label: '200K', value: 200_000 },
                      { label: '500K', value: 500_000 },
                    ]}
                    selected={lumpSumAmount}
                    onSelect={setLumpSumAmount}
                    isDark={isDark}
                  />
                  <View className="mt-3">
                    <NumInput
                      label="Pay after month #"
                      value={lumpSumAfterMonth}
                      onChange={(v) => setLumpSumAfterMonth(Math.max(1, Math.min(tenure * 12, Math.round(v))))}
                      isDark={isDark}
                      hint={`Month 1 to ${tenure * 12} (${fmtMonths(lumpSumAfterMonth)} into the loan)`}
                    />
                  </View>
                </View>
              )}

              {/* Extra Monthly Toggle */}
              <Toggle
                label="Extra monthly payment"
                value={enableExtraMonthly}
                onToggle={() => setEnableExtraMonthly(!enableExtraMonthly)}
                isDark={isDark}
                hint="Pay additional amount every month"
              />

              {enableExtraMonthly && (
                <View className="ml-2">
                  <NumInput
                    label="Extra Amount Per Month"
                    value={extraMonthlyPayment}
                    onChange={(v) => setExtraMonthlyPayment(Math.max(0, v))}
                    isDark={isDark}
                    prefix="AED"
                    hint={`Total monthly: ${fmtAED(currentEMI + extraMonthlyPayment)}`}
                  />
                  <Chips
                    items={[
                      { label: '1K', value: 1_000 },
                      { label: '2K', value: 2_000 },
                      { label: '5K', value: 5_000 },
                    ]}
                    selected={extraMonthlyPayment}
                    onSelect={setExtraMonthlyPayment}
                    isDark={isDark}
                  />
                </View>
              )}
            </Section>

            {/* Results */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View className="mb-3">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Savings Summary
                </Text>
              </View>

              {/* Hero: Interest Saved */}
              <View
                className={`rounded-2xl p-5 mb-4 border ${
                  isDark ? 'bg-white border-white' : 'bg-black border-black'
                }`}>
                <View className="flex-row items-center mb-2">
                  <Feather name="trending-down" size={16} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-black/60' : 'text-white/60'}`}>
                    {hasSavings ? 'Interest Saved' : 'No Prepayment Selected'}
                  </Text>
                </View>
                <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  {fmtAED(result.interestSaved)}
                </Text>
                {hasSavings && (
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)' }}>
                      <Text className="text-xs font-bold text-emerald-500">
                        {fmtMonths(result.monthsSaved)} saved
                      </Text>
                    </View>
                    {earlySettlementFee > 0 && (
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)' }}>
                        <Text className="text-xs font-bold text-indigo-500">
                          Net: {fmtAED(netSavings)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Detail Stats */}
              <View className="flex-row gap-3 mb-3">
                <StatCard
                  label="Original Tenure"
                  value={fmtMonths(result.originalTenureMonths)}
                  sub={`${result.originalTenureMonths} months`}
                  isDark={isDark}
                />
                <StatCard
                  label="New Tenure"
                  value={fmtMonths(result.newTenureMonths)}
                  sub={hasSavings ? `${result.monthsSaved} months less` : 'No change'}
                  isDark={isDark}
                  accent={hasSavings}
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <StatCard
                  label="Original Interest"
                  value={fmtShort(result.originalTotalInterest)}
                  isDark={isDark}
                />
                <StatCard
                  label="New Interest"
                  value={fmtShort(result.newTotalInterest)}
                  isDark={isDark}
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <StatCard
                  label="Original Total"
                  value={fmtShort(result.originalTotalPayment)}
                  isDark={isDark}
                />
                <StatCard
                  label="New Total"
                  value={fmtShort(result.newTotalPayment)}
                  isDark={isDark}
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <StatCard
                  label="Original EMI"
                  value={fmtAED(result.originalEMI)}
                  sub="per month"
                  isDark={isDark}
                />
                <StatCard
                  label="Eff. Monthly"
                  value={fmtAED(result.newEffectiveMonthlyPayment)}
                  sub="avg over new tenure"
                  isDark={isDark}
                />
              </View>

              {/* Early Settlement Fee Note */}
              {enableLumpSum && lumpSumAmount > 0 && (
                <Animated.View entering={FadeInUp.delay(350).duration(400)}>
                  <View
                    className={`rounded-2xl p-4 mb-4 border ${
                      isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-amber-50 border-amber-200'
                    }`}>
                    <View className="flex-row items-center mb-1">
                      <Feather name="alert-circle" size={13} color="#f59e0b" />
                      <Text className={`ml-1.5 text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        Early Settlement Fee (estimated)
                      </Text>
                    </View>
                    <Text className={`text-[11px] leading-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Most UAE banks charge ~1% of the prepaid amount as early settlement fee ({fmtAED(earlySettlementFee)}).
                      Some banks cap this at 3 months&apos; interest. Net savings after fee: {fmtAED(netSavings)}.
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Savings Visualization */}
              {hasSavings && (
                <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                  <View
                    className={`rounded-3xl p-5 mb-4 border ${
                      isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                    }`}>
                    <View className="flex-row items-center mb-4">
                      <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                        <Feather name="pie-chart" size={15} color={isDark ? '#fff' : '#000'} />
                      </View>
                      <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        Interest Comparison
                      </Text>
                    </View>

                    {/* Original */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Without Prepayment
                        </Text>
                        <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {fmtShort(result.originalTotalInterest)}
                        </Text>
                      </View>
                      <View
                        className={`h-3 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                        }`}>
                        <View className="h-full rounded-full bg-red-400" style={{ width: '100%' }} />
                      </View>
                    </View>

                    {/* New */}
                    <View className="mb-3">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          With Prepayment
                        </Text>
                        <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {fmtShort(result.newTotalInterest)}
                        </Text>
                      </View>
                      <View
                        className={`h-3 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                        }`}>
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: result.originalTotalInterest > 0
                              ? `${Math.round((result.newTotalInterest / result.originalTotalInterest) * 100)}%` as any
                              : '0%',
                            backgroundColor: '#10b981',
                          }}
                        />
                      </View>
                    </View>

                    {/* Saved */}
                    <View
                      className={`rounded-xl p-3 border mt-1 ${
                        isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-semibold text-emerald-600">Interest Saved</Text>
                        <Text className="text-sm font-bold text-emerald-600">{fmtAED(result.interestSaved)}</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* CTAs */}
              <Animated.View entering={FadeInUp.delay(500).duration(400)} className="mt-1">
                <Pressable
                  onPress={() => router.push('/calc-emi' as any)}
                  className={`rounded-2xl py-4 items-center flex-row justify-center ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  <Feather name="credit-card" size={16} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    EMI Calculator
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/application' as any)}
                  className={`rounded-2xl py-3.5 mt-3 items-center flex-row justify-center border ${
                    isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
                  }`}>
                  <Feather name="file-text" size={14} color={isDark ? '#fff' : '#000'} />
                  <Text className={`ml-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    Start Application
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Disclaimer */}
              <View className="flex-row items-start mt-5 mb-2">
                <Feather name="info" size={11} color={isDark ? '#444' : '#bbb'} style={{ marginTop: 2 }} />
                <Text className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                  Calculations assume reduced tenure with same EMI. Early settlement fees vary by bank (typically 1% of prepaid amount). Contact your bank for exact terms and penalties.
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
