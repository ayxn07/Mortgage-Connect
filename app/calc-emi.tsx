import React, { useState, useCallback, useMemo } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import {
  calculateEMI,
  calculateLTV,
  calculateDownPaymentPercent,
  getMinDownPaymentPercent,
  calculateDBR,
} from '@/src/utils/helpers';
import type { EMICalculationResult } from '@/src/types';
import type { DBRResult } from '@/src/utils/helpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// =====================================================================
// Formatters
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
// Chip Selector
// =====================================================================
function Chips({
  items,
  selected,
  onSelect,
  isDark,
}: {
  items: { label: string; value: any }[];
  selected: any;
  onSelect: (v: any) => void;
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
// Toggle Pair
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
                  ? isDark ? 'text-black' : 'text-white'
                  : isDark ? 'text-gray-500' : 'text-gray-500'
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
// Numeric Input
// =====================================================================
function NumInput({
  label,
  value,
  onChange,
  isDark,
  prefix,
  suffix,
  hint,
  readOnly,
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  isDark: boolean;
  prefix?: string;
  suffix?: string;
  hint?: string;
  readOnly?: boolean;
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
      {label && (
        <Text className={`text-sm font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center rounded-2xl border px-4 ${
          focused
            ? isDark ? 'border-white/30 bg-[#1a1a1a]' : 'border-black/20 bg-white'
            : isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
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
          editable={!readOnly}
          placeholder="0"
          placeholderTextColor={isDark ? '#444' : '#ccc'}
          className={`flex-1 py-3.5 text-base font-semibold ${
            readOnly
              ? isDark ? 'text-gray-500' : 'text-gray-400'
              : isDark ? 'text-white' : 'text-black'
          }`}
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
// Visual Slider Bar
// =====================================================================
function Slider({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  format,
  isDark,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (v: number) => void;
  format: (v: number) => string;
  isDark: boolean;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </Text>
        <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {format(value)}
        </Text>
      </View>

      {/* Track */}
      <View className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
        <Animated.View
          className={`h-full rounded-full ${isDark ? 'bg-white' : 'bg-black'}`}
          style={{ width: `${pct}%` } as any}
        />
      </View>

      {/* +/- controls */}
      <View className="flex-row items-center justify-between mt-2.5">
        <Pressable
          onPress={() => onValueChange(Math.max(min, value - step))}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
          }`}>
          <Feather name="minus" size={14} color={isDark ? '#888' : '#666'} />
        </Pressable>

        {/* Quick jumps */}
        <View className="flex-row gap-1.5">
          {[0.25, 0.5, 0.75].map((frac) => {
            const v = Math.round((min + (max - min) * frac) / step) * step;
            return (
              <Pressable
                key={frac}
                onPress={() => onValueChange(v)}
                className={`px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                }`}>
                <Text className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {format(v)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => onValueChange(Math.min(max, value + step))}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
          }`}>
          <Feather name="plus" size={14} color={isDark ? '#888' : '#666'} />
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================================
// Section wrapper
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
          className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'
          }`}>
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
// Result Metric
// =====================================================================
function Metric({
  label,
  value,
  sub,
  big,
  isDark,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
  isDark: boolean;
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
        className={`${big ? 'text-2xl' : 'text-lg'} font-bold ${
          big
            ? isDark ? 'text-black' : 'text-white'
            : isDark ? 'text-white' : 'text-black'
        }`}>
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
// MAIN SCREEN
// =====================================================================
export default function CalcEMIScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // --- State ---
  const [propertyPrice, setPropertyPrice] = useState(1_500_000);
  const [buyerType, setBuyerType] = useState<'resident' | 'non-resident'>('resident');
  const [firstTime, setFirstTime] = useState(true);
  const [dpPercent, setDpPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.25);
  const [tenure, setTenure] = useState(25);
  const [rateType, setRateType] = useState<'fixed' | 'variable'>('fixed');
  const [fixedPeriod, setFixedPeriod] = useState(3);

  // Advanced (accordion)
  const [showDBR, setShowDBR] = useState(false);
  const [salary, setSalary] = useState(0);
  const [existingEMIs, setExistingEMIs] = useState(0);

  // --- Derived ---
  const minDP = getMinDownPaymentPercent(buyerType === 'resident', firstTime, propertyPrice);
  const downPayment = Math.round((propertyPrice * dpPercent) / 100);
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const ltv = calculateLTV(propertyPrice, downPayment);

  const emi: EMICalculationResult = useMemo(() => {
    if (propertyPrice <= 0 || tenure <= 0 || interestRate <= 0)
      return { monthlyInstallment: 0, totalPayment: 0, totalInterest: 0, principal: 0 };
    return calculateEMI({ principal: loanAmount, annualRate: interestRate, years: tenure });
  }, [loanAmount, interestRate, tenure, propertyPrice]);

  const dbr: DBRResult = useMemo(() => {
    if (salary <= 0) return { dbrPercent: 0, withinGuideline: false, message: 'Enter salary' };
    return calculateDBR({ monthlySalary: salary, existingEMIs, newEMI: emi.monthlyInstallment });
  }, [salary, existingEMIs, emi.monthlyInstallment]);

  // Validation
  const errors: string[] = useMemo(() => {
    const e: string[] = [];
    if (propertyPrice <= 0) e.push('Property price must be greater than 0');
    if (tenure <= 0) e.push('Tenure must be at least 1 year');
    if (interestRate <= 0) e.push('Interest rate must be greater than 0');
    if (downPayment > propertyPrice) e.push('Down payment exceeds property price');
    return e;
  }, [propertyPrice, tenure, interestRate, downPayment]);

  const valid = errors.length === 0;

  // Principal vs interest percentages
  const principalPct = emi.totalPayment > 0 ? Math.round((emi.principal / emi.totalPayment) * 100) : 0;
  const interestPct = 100 - principalPct;

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
              EMI Calculator
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Estimate your monthly mortgage payment
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#6366f120' }}>
            <Feather name="credit-card" size={18} color="#6366f1" />
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

            {/* ===================== PROPERTY & BUYER ===================== */}
            <Section icon="home" title="Property Details" isDark={isDark} delay={100}>
              <NumInput
                label="Property Price (AED)"
                value={propertyPrice}
                onChange={setPropertyPrice}
                isDark={isDark}
                prefix="AED"
              />
              <Text className={`text-xs mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Quick select
              </Text>
              <Chips
                items={[
                  { label: '500K', value: 500_000 },
                  { label: '1M', value: 1_000_000 },
                  { label: '2M', value: 2_000_000 },
                  { label: '5M', value: 5_000_000 },
                ]}
                selected={propertyPrice}
                onSelect={setPropertyPrice}
                isDark={isDark}
              />

              <View className="mt-5">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Buyer Type
                </Text>
                <Toggle
                  options={[
                    { label: 'UAE Resident', value: 'resident' },
                    { label: 'Non-Resident', value: 'non-resident' },
                  ]}
                  selected={buyerType}
                  onSelect={(v) => setBuyerType(v as any)}
                  isDark={isDark}
                />
              </View>

              <View className="mt-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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

            {/* ===================== DOWN PAYMENT ===================== */}
            <Section icon="dollar-sign" title="Down Payment" isDark={isDark} delay={200}>
              <Slider
                label="Down Payment"
                value={dpPercent}
                min={0}
                max={80}
                step={1}
                onValueChange={setDpPercent}
                format={(v) => `${v}%`}
                isDark={isDark}
              />

              {/* Computed values */}
              <View className="flex-row gap-3 mb-3">
                <View
                  className={`flex-1 rounded-xl px-3 py-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Down Payment
                  </Text>
                  <Text className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtShort(downPayment)}
                  </Text>
                </View>
                <View
                  className={`flex-1 rounded-xl px-3 py-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Loan Amount
                  </Text>
                  <Text className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtShort(loanAmount)}
                  </Text>
                </View>
              </View>

              {/* Min DP hint */}
              <View
                className={`flex-row items-center px-3 py-2.5 rounded-xl ${
                  isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'
                }`}>
                <Feather name="info" size={11} color={isDark ? '#555' : '#aaa'} />
                <Text className={`ml-1.5 text-[11px] flex-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Min. {minDP}% for {buyerType === 'resident' ? 'residents' : 'non-residents'}
                  {firstTime ? ' (first home)' : ''} = {fmtAED(Math.round(propertyPrice * minDP / 100))}
                </Text>
              </View>

              {dpPercent < minDP && dpPercent > 0 && (
                <View className="flex-row items-center mt-2">
                  <Feather name="alert-triangle" size={11} color="#f59e0b" />
                  <Text className="ml-1.5 text-[11px] text-amber-500">
                    Below minimum — banks may not approve
                  </Text>
                </View>
              )}

              {/* LTV */}
              <View
                className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl mt-3 ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'
                }`}>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>LTV</Text>
                <Text className={`text-sm font-bold ${ltv <= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                  {ltv}%
                </Text>
              </View>
            </Section>

            {/* ===================== INTEREST & TENURE ===================== */}
            <Section icon="percent" title="Interest & Tenure" isDark={isDark} delay={300}>
              <NumInput
                label="Interest Rate"
                value={interestRate}
                onChange={setInterestRate}
                isDark={isDark}
                suffix="% p.a."
              />
              <Chips
                items={[
                  { label: '3.99%', value: 3.99 },
                  { label: '4.25%', value: 4.25 },
                  { label: '4.75%', value: 4.75 },
                  { label: '5.25%', value: 5.25 },
                ]}
                selected={interestRate}
                onSelect={setInterestRate}
                isDark={isDark}
              />

              <View className="mt-5">
                <Slider
                  label="Loan Tenure"
                  value={tenure}
                  min={5}
                  max={25}
                  step={1}
                  onValueChange={setTenure}
                  format={(v) => `${v} yrs`}
                  isDark={isDark}
                />
              </View>

              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Rate Type
              </Text>
              <Toggle
                options={[
                  { label: 'Fixed', value: 'fixed' },
                  { label: 'Variable', value: 'variable' },
                ]}
                selected={rateType}
                onSelect={(v) => setRateType(v as any)}
                isDark={isDark}
              />
              {rateType === 'fixed' && (
                <Animated.View entering={FadeInDown.duration(250)} className="mt-3">
                  <Text className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Fixed period
                  </Text>
                  <Chips
                    items={[
                      { label: '1 yr', value: 1 },
                      { label: '2 yrs', value: 2 },
                      { label: '3 yrs', value: 3 },
                      { label: '5 yrs', value: 5 },
                    ]}
                    selected={fixedPeriod}
                    onSelect={setFixedPeriod}
                    isDark={isDark}
                  />
                </Animated.View>
              )}
            </Section>

            {/* ===================== DBR ACCORDION ===================== */}
            <Animated.View entering={FadeInDown.delay(350).duration(400)}>
              <Pressable
                onPress={() => setShowDBR(!showDBR)}
                className={`rounded-3xl px-5 py-4 mb-4 border flex-row items-center justify-between ${
                  isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                }`}>
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                    <Feather name="sliders" size={15} color={isDark ? '#fff' : '#000'} />
                  </View>
                  <View>
                    <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      Income & DBR
                    </Text>
                    <Text className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      Optional — check debt burden ratio
                    </Text>
                  </View>
                </View>
                <Feather
                  name={showDBR ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={isDark ? '#555' : '#999'}
                />
              </Pressable>
            </Animated.View>

            {showDBR && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Section icon="user" title="Income Details" isDark={isDark}>
                  <NumInput
                    label="Monthly Net Salary"
                    value={salary}
                    onChange={setSalary}
                    isDark={isDark}
                    prefix="AED"
                    hint="Used to calculate DBR"
                  />
                  <NumInput
                    label="Existing Monthly EMIs"
                    value={existingEMIs}
                    onChange={setExistingEMIs}
                    isDark={isDark}
                    prefix="AED"
                    hint="Car loans, cards, personal loans, etc."
                  />
                  {salary > 0 && (
                    <Animated.View entering={FadeIn.duration(300)}>
                      <View
                        className={`rounded-xl p-4 ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            DBR
                          </Text>
                          <Text
                            className="text-lg font-bold"
                            style={{ color: dbr.withinGuideline ? '#22c55e' : '#ef4444' }}>
                            {dbr.dbrPercent}%
                          </Text>
                        </View>
                        <View className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, dbr.dbrPercent)}%`,
                              backgroundColor: dbr.withinGuideline ? '#22c55e' : '#ef4444',
                            } as any}
                          />
                        </View>
                        <View className="flex-row items-center mt-2">
                          <Feather
                            name={dbr.withinGuideline ? 'check-circle' : 'alert-triangle'}
                            size={12}
                            color={dbr.withinGuideline ? '#22c55e' : '#ef4444'}
                          />
                          <Text className={`ml-1.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {dbr.message}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </Section>
              </Animated.View>
            )}

            {/* ===================== ERRORS ===================== */}
            {!valid && (
              <Animated.View entering={FadeIn.duration(200)}>
                <View className="rounded-2xl p-4 mb-4 border border-red-500/20 bg-red-500/5">
                  {errors.map((e, i) => (
                    <View key={i} className="flex-row items-center mb-1">
                      <Feather name="x-circle" size={12} color="#ef4444" />
                      <Text className="ml-2 text-xs text-red-500">{e}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* ===================== RESULTS ===================== */}
            {valid && (
              <Animated.View entering={FadeInUp.delay(400).duration(400)}>
                {/* Section label */}
                <View className="mb-3">
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    Your Estimate
                  </Text>
                </View>

                {/* Hero metric */}
                <Metric
                  label="Monthly EMI"
                  value={fmtAED(emi.monthlyInstallment)}
                  sub={`${tenure} years · ${tenure * 12} months`}
                  big
                  isDark={isDark}
                />

                {/* Grid */}
                <View className="flex-row gap-3 mt-3">
                  <View className="flex-1">
                    <Metric label="Loan Amount" value={fmtShort(loanAmount)} isDark={isDark} />
                  </View>
                  <View className="flex-1">
                    <Metric label="Total Interest" value={fmtShort(emi.totalInterest)} isDark={isDark} />
                  </View>
                </View>

                <View className="flex-row gap-3 mt-3">
                  <View className="flex-1">
                    <Metric label="Total Payment" value={fmtShort(emi.totalPayment)} isDark={isDark} />
                  </View>
                  <View className="flex-1">
                    <Metric
                      label="LTV"
                      value={`${ltv}%`}
                      sub={ltv <= 80 ? 'Within guideline' : 'Above 80%'}
                      isDark={isDark}
                    />
                  </View>
                </View>

                {/* DBR metric if available */}
                {salary > 0 && showDBR && (
                  <View className="mt-3">
                    <Metric
                      label="Debt Burden Ratio"
                      value={`${dbr.dbrPercent}%`}
                      sub={dbr.withinGuideline ? 'Within guideline (≤50%)' : 'Above 50% — risky'}
                      isDark={isDark}
                    />
                  </View>
                )}

                {/* Breakdown bar */}
                <Animated.View entering={FadeInUp.delay(500).duration(400)}>
                  <View
                    className={`rounded-2xl p-4 mt-3 border ${
                      isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                    }`}>
                    <Text className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Payment Breakdown
                    </Text>
                    <View className="h-4 rounded-full overflow-hidden flex-row">
                      <View
                        className={`h-full ${isDark ? 'bg-white' : 'bg-black'}`}
                        style={{ width: `${principalPct}%` } as any}
                      />
                      <View
                        className="h-full bg-gray-400"
                        style={{ width: `${interestPct}%` } as any}
                      />
                    </View>
                    <View className="flex-row items-center justify-between mt-2.5">
                      <View className="flex-row items-center">
                        <View className={`w-2.5 h-2.5 rounded-full mr-1.5 ${isDark ? 'bg-white' : 'bg-black'}`} />
                        <Text className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Principal {principalPct}%
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-2.5 h-2.5 rounded-full mr-1.5 bg-gray-400" />
                        <Text className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Interest {interestPct}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                {/* CTAs */}
                <Animated.View entering={FadeInUp.delay(600).duration(400)} className="mt-5">
                  <Pressable
                    onPress={() => router.push('/application' as any)}
                    className={`rounded-2xl py-4 items-center flex-row justify-center ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}>
                    <Feather name="check-circle" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      Start Pre-Approval
                    </Text>
                  </Pressable>

                  <View className="flex-row gap-3 mt-3">
                    <Pressable
                      onPress={() => router.push('/(tabs)/agents' as any)}
                      className={`flex-1 rounded-2xl py-3.5 items-center border flex-row justify-center ${
                        isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
                      }`}>
                      <Feather name="message-circle" size={14} color={isDark ? '#fff' : '#000'} />
                      <Text className={`ml-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        Talk to Advisor
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push('/calc-costs' as any)}
                      className={`flex-1 rounded-2xl py-3.5 items-center border flex-row justify-center ${
                        isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
                      }`}>
                      <Feather name="file-text" size={14} color={isDark ? '#fff' : '#000'} />
                      <Text className={`ml-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        Upfront Costs
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>

                {/* Disclaimer */}
                <View className="flex-row items-start mt-5 mb-2">
                  <Feather name="info" size={11} color={isDark ? '#444' : '#bbb'} style={{ marginTop: 2 }} />
                  <Text className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                    This is an estimate. Actual EMI depends on the bank, your credit score, and property type.
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
