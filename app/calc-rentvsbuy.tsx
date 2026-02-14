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
import { calculateRentVsBuy } from '@/src/utils/helpers';
import type { Emirate, RentVsBuyResult } from '@/src/utils/helpers';

const ACCENT = '#0ea5e9'; // sky blue

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
function Chips<T extends string | number>({
  items,
  selected,
  onSelect,
  isDark,
}: {
  items: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
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
export default function CalcRentVsBuyScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // --- Inputs ---
  const [propertyPrice, setPropertyPrice] = useState(1_500_000);
  const [dpPercent, setDpPercent] = useState(20);
  const [annualRate, setAnnualRate] = useState(4.5);
  const [loanTenure, setLoanTenure] = useState(25);
  const [monthlyRent, setMonthlyRent] = useState(8_000);
  const [annualRentIncrease, setAnnualRentIncrease] = useState(5);
  const [annualAppreciation, setAnnualAppreciation] = useState(3);
  const [annualMaintenance, setAnnualMaintenance] = useState(15_000);
  const [yearsToCompare, setYearsToCompare] = useState(10);
  const [emirate, setEmirate] = useState<Emirate>('dubai');
  const [isResident, setIsResident] = useState(true);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);

  // --- Compute ---
  const result: RentVsBuyResult = useMemo(() => {
    return calculateRentVsBuy({
      propertyPrice,
      downPaymentPercent: dpPercent,
      annualRate,
      loanTenureYears: loanTenure,
      monthlyRent,
      annualRentIncrease,
      annualPropertyAppreciation: annualAppreciation,
      annualMaintenanceCost: annualMaintenance,
      yearsToCompare,
      emirate,
      isResident,
      isFirstTimeBuyer,
    });
  }, [propertyPrice, dpPercent, annualRate, loanTenure, monthlyRent, annualRentIncrease, annualAppreciation, annualMaintenance, yearsToCompare, emirate, isResident, isFirstTimeBuyer]);

  const buyingIsBetter = result.totalBuyCostNet < result.totalRentCost;
  const savingsAmount = Math.abs(result.totalRentCost - result.totalBuyCostNet);
  const hasBreakEven = result.breakEvenYear > 0 && result.breakEvenYear <= yearsToCompare;

  // Yearly snapshot table (show first few + last)
  const snapshots = result.yearlySnapshots;
  const [showAllYears, setShowAllYears] = useState(false);
  const displaySnapshots = showAllYears
    ? snapshots
    : snapshots.length <= 5
      ? snapshots
      : [...snapshots.slice(0, 3), ...snapshots.slice(-2)];

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
              Rent vs Buy
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Which option saves more?
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${ACCENT}20` }}>
            <Feather name="home" size={18} color={ACCENT} />
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

            {/* Buy Details */}
            <Section icon="home" title="Property (Buy)" isDark={isDark} delay={100}>
              <NumInput
                label="Property Price"
                value={propertyPrice}
                onChange={(v) => setPropertyPrice(Math.max(0, v))}
                isDark={isDark}
                prefix="AED"
              />
              <Chips
                items={[
                  { label: '1M', value: 1_000_000 },
                  { label: '1.5M', value: 1_500_000 },
                  { label: '2M', value: 2_000_000 },
                  { label: '3M', value: 3_000_000 },
                ]}
                selected={propertyPrice}
                onSelect={setPropertyPrice}
                isDark={isDark}
              />

              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <NumInput
                    label="Down Payment"
                    value={dpPercent}
                    onChange={(v) => setDpPercent(Math.max(0, Math.min(99, v)))}
                    isDark={isDark}
                    suffix="%"
                  />
                </View>
                <View className="flex-1">
                  <NumInput
                    label="Interest Rate"
                    value={annualRate}
                    onChange={(v) => setAnnualRate(Math.max(0, v))}
                    isDark={isDark}
                    suffix="%"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <NumInput
                    label="Loan Tenure"
                    value={loanTenure}
                    onChange={(v) => setLoanTenure(Math.min(25, Math.max(1, Math.round(v))))}
                    isDark={isDark}
                    suffix="years"
                  />
                </View>
                <View className="flex-1">
                  <NumInput
                    label="Appreciation"
                    value={annualAppreciation}
                    onChange={(v) => setAnnualAppreciation(Math.max(0, v))}
                    isDark={isDark}
                    suffix="%/yr"
                    hint="Annual property value growth"
                  />
                </View>
              </View>

              <NumInput
                label="Annual Maintenance / Service Charge"
                value={annualMaintenance}
                onChange={(v) => setAnnualMaintenance(Math.max(0, v))}
                isDark={isDark}
                prefix="AED"
                hint="HOA, service charges, insurance"
              />

              <View className="mb-2">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Emirate
                </Text>
                <Chips
                  items={[
                    { label: 'Dubai', value: 'dubai' as Emirate },
                    { label: 'Abu Dhabi', value: 'abu_dhabi' as Emirate },
                    { label: 'Other', value: 'other' as Emirate },
                  ]}
                  selected={emirate}
                  onSelect={(v) => setEmirate(v as Emirate)}
                  isDark={isDark}
                />
              </View>

              <Toggle
                label="UAE Resident"
                value={isResident}
                onToggle={() => setIsResident(!isResident)}
                isDark={isDark}
              />
              {isResident && (
                <Toggle
                  label="First-time buyer"
                  value={isFirstTimeBuyer}
                  onToggle={() => setIsFirstTimeBuyer(!isFirstTimeBuyer)}
                  isDark={isDark}
                />
              )}
            </Section>

            {/* Rent Details */}
            <Section icon="key" title="Rent" isDark={isDark} delay={200}>
              <NumInput
                label="Monthly Rent"
                value={monthlyRent}
                onChange={(v) => setMonthlyRent(Math.max(0, v))}
                isDark={isDark}
                prefix="AED"
              />
              <Chips
                items={[
                  { label: '5K', value: 5_000 },
                  { label: '8K', value: 8_000 },
                  { label: '12K', value: 12_000 },
                  { label: '15K', value: 15_000 },
                ]}
                selected={monthlyRent}
                onSelect={setMonthlyRent}
                isDark={isDark}
              />

              <View className="mt-4">
                <NumInput
                  label="Annual Rent Increase"
                  value={annualRentIncrease}
                  onChange={(v) => setAnnualRentIncrease(Math.max(0, Math.min(20, v)))}
                  isDark={isDark}
                  suffix="%"
                  hint="Typical Dubai: 5-10% per year"
                />
              </View>
            </Section>

            {/* Comparison Period */}
            <Section icon="calendar" title="Comparison Period" isDark={isDark} delay={300}>
              <NumInput
                label="Years to Compare"
                value={yearsToCompare}
                onChange={(v) => setYearsToCompare(Math.max(1, Math.min(30, Math.round(v))))}
                isDark={isDark}
                suffix="years"
              />
              <Chips
                items={[
                  { label: '5 yr', value: 5 },
                  { label: '10 yr', value: 10 },
                  { label: '15 yr', value: 15 },
                  { label: '20 yr', value: 20 },
                ]}
                selected={yearsToCompare}
                onSelect={setYearsToCompare}
                isDark={isDark}
              />
            </Section>

            {/* Results */}
            <Animated.View entering={FadeInUp.delay(400).duration(400)}>
              <View className="mb-3">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Results ({yearsToCompare}-Year Outlook)
                </Text>
              </View>

              {/* Hero: Verdict */}
              <View
                className={`rounded-2xl p-5 mb-4 border ${
                  isDark ? 'bg-white border-white' : 'bg-black border-black'
                }`}>
                <View className="flex-row items-center mb-2">
                  <Feather
                    name={buyingIsBetter ? 'home' : 'key'}
                    size={16}
                    color={isDark ? '#000' : '#fff'}
                  />
                  <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-black/60' : 'text-white/60'}`}>
                    {buyingIsBetter ? 'Buying is better' : 'Renting is better'} over {yearsToCompare} years
                  </Text>
                </View>
                <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  Save {fmtShort(savingsAmount)}
                </Text>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                  {buyingIsBetter
                    ? `Net buy cost ${fmtShort(result.totalBuyCostNet)} vs rent ${fmtShort(result.totalRentCost)}`
                    : `Rent ${fmtShort(result.totalRentCost)} vs net buy cost ${fmtShort(result.totalBuyCostNet)}`}
                </Text>

                {hasBreakEven && (
                  <View className="flex-row items-center mt-3">
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)' }}>
                      <Text className="text-xs font-bold text-emerald-500">
                        Break-even: Year {result.breakEvenYear}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Key Stats */}
              <View className="flex-row gap-3 mb-3">
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Monthly EMI</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtAED(result.monthlyEMI)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    vs rent {fmtAED(monthlyRent)}
                  </Text>
                </View>
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Final Property Value</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtShort(result.finalPropertyValue)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {annualAppreciation}% annual appreciation
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3 mb-3">
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Equity Built</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtShort(result.finalEquity)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Property value - remaining loan
                  </Text>
                </View>
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Rent Paid</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtShort(result.totalRentCost)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Over {yearsToCompare} years (no equity)
                  </Text>
                </View>
              </View>

              {/* Year-by-Year Table */}
              {snapshots.length > 0 && (
                <Animated.View entering={FadeInUp.delay(450).duration(400)}>
                  <View
                    className={`rounded-3xl p-5 mb-4 border ${
                      isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                    }`}>
                    <View className="flex-row items-center mb-4">
                      <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                        <Feather name="calendar" size={15} color={isDark ? '#fff' : '#000'} />
                      </View>
                      <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        Year-by-Year
                      </Text>
                    </View>

                    {/* Table Header */}
                    <View className="flex-row items-center pb-2 mb-1">
                      <View style={{ width: 40 }}>
                        <Text className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Year</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Rent</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Net Buy</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Better</Text>
                      </View>
                    </View>
                    <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                    {displaySnapshots.map((snap, idx) => {
                      const rentIsCheaper = snap.rentAdvantage < 0;
                      // Show ellipsis row if we're skipping years
                      const showEllipsis = !showAllYears && snapshots.length > 5 && idx === 3 && snap.year !== 4;

                      return (
                        <React.Fragment key={snap.year}>
                          {showEllipsis && idx === 3 && (
                            <View className="flex-row items-center py-2 justify-center">
                              <Text className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                ...
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center py-2.5">
                            <View style={{ width: 40 }}>
                              <Text className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {snap.year}
                              </Text>
                            </View>
                            <View className="flex-1 items-center">
                              <Text className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {fmtShort(snap.cumulativeRent)}
                              </Text>
                            </View>
                            <View className="flex-1 items-center">
                              <Text className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {fmtShort(snap.netBuyCost)}
                              </Text>
                            </View>
                            <View className="flex-1 items-center">
                              <View
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: rentIsCheaper
                                    ? 'rgba(16,185,129,0.15)'
                                    : 'rgba(239,68,68,0.1)',
                                }}>
                                <Text className={`text-[9px] font-bold ${
                                  rentIsCheaper ? 'text-emerald-500' : 'text-red-400'
                                }`}>
                                  {rentIsCheaper ? 'Buy' : 'Rent'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View className={`h-px ${isDark ? 'bg-[#0f0f0f]' : 'bg-gray-50'}`} />
                        </React.Fragment>
                      );
                    })}

                    {snapshots.length > 5 && (
                      <Pressable onPress={() => setShowAllYears(!showAllYears)} className="mt-3 items-center">
                        <Text className="text-xs font-semibold" style={{ color: ACCENT }}>
                          {showAllYears ? 'Show Less' : `Show All ${snapshots.length} Years`}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Visual Comparison */}
              <Animated.View entering={FadeInUp.delay(500).duration(400)}>
                <View
                  className={`rounded-3xl p-5 mb-4 border ${
                    isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                  }`}>
                  <View className="flex-row items-center mb-4">
                    <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                      <Feather name="bar-chart" size={15} color={isDark ? '#fff' : '#000'} />
                    </View>
                    <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      Cost Comparison
                    </Text>
                  </View>

                  {/* Rent bar */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Total Rent Cost
                      </Text>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {fmtShort(result.totalRentCost)}
                      </Text>
                    </View>
                    <View
                      className={`h-3 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                      }`}>
                      <View
                        className="h-full rounded-full bg-red-400"
                        style={{
                          width: `${Math.min(100, Math.max(0,
                            result.totalRentCost > 0 && result.totalBuyCostNet > 0
                              ? (result.totalRentCost / Math.max(result.totalRentCost, result.totalBuyCostNet)) * 100
                              : 0
                          ))}%` as any,
                        }}
                      />
                    </View>
                  </View>

                  {/* Net Buy bar */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Net Buy Cost
                      </Text>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {fmtShort(result.totalBuyCostNet)}
                      </Text>
                    </View>
                    <View
                      className={`h-3 rounded-full overflow-hidden ${
                        isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                      }`}>
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0,
                            result.totalRentCost > 0 && result.totalBuyCostNet > 0
                              ? (result.totalBuyCostNet / Math.max(result.totalRentCost, result.totalBuyCostNet)) * 100
                              : 0
                          ))}%` as any,
                          backgroundColor: '#10b981',
                        }}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center mt-1 gap-4">
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-sm mr-1.5 bg-red-400" />
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Rent</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: '#10b981' }} />
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Buy (net of equity)</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* CTAs */}
              <Animated.View entering={FadeInUp.delay(600).duration(400)} className="mt-1">
                <Pressable
                  onPress={() => router.push('/calc-costs' as any)}
                  className={`rounded-2xl py-4 items-center flex-row justify-center ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  <Feather name="file-text" size={16} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    View Upfront Costs
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
                  This comparison is simplified and does not account for opportunity cost of the down payment,
                  tax implications, or market volatility. Property appreciation and rent increases are estimates.
                  Consult a financial advisor for personalized advice.
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
