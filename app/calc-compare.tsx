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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { calculateEMI } from '@/src/utils/helpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ACCENT = '#ec4899'; // pink — matches hub card

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
// Chips
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
// Scenario interface
// =====================================================================
interface Scenario {
  id: string;
  label: string;
  rate: number;
  tenure: number;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  { id: 'a', label: 'Scenario A', rate: 3.99, tenure: 25 },
  { id: 'b', label: 'Scenario B', rate: 4.49, tenure: 25 },
  { id: 'c', label: 'Scenario C', rate: 4.99, tenure: 20 },
];

// =====================================================================
// Scenario Card (editable)
// =====================================================================
function ScenarioCard({
  scenario,
  index,
  isDark,
  onUpdate,
  onRemove,
  canRemove,
}: {
  scenario: Scenario;
  index: number;
  isDark: boolean;
  onUpdate: (s: Scenario) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 80).duration(400)}
      style={animStyle}
      className={`rounded-2xl p-4 mb-3 border ${
        isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
      }`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="w-7 h-7 rounded-lg items-center justify-center mr-2"
            style={{ backgroundColor: `${color}20` }}>
            <Text style={{ color, fontSize: 12, fontWeight: '800' }}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {scenario.label}
          </Text>
        </View>
        {canRemove && (
          <Pressable onPress={onRemove} className="p-1.5">
            <Feather name="x" size={16} color={isDark ? '#555' : '#aaa'} />
          </Pressable>
        )}
      </View>

      {/* Rate & Tenure inputs side by side */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Rate (%)
          </Text>
          <ScenarioInput
            value={scenario.rate}
            onChange={(v) => onUpdate({ ...scenario, rate: v })}
            isDark={isDark}
            suffix="%"
          />
        </View>
        <View className="flex-1">
          <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Tenure (years)
          </Text>
          <ScenarioInput
            value={scenario.tenure}
            onChange={(v) => onUpdate({ ...scenario, tenure: Math.min(30, Math.max(1, Math.round(v))) })}
            isDark={isDark}
            suffix="yr"
          />
        </View>
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Compact input for scenario cards
// =====================================================================
function ScenarioInput({
  value,
  onChange,
  isDark,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  isDark: boolean;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  const handleChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, '');
    setText(cleaned);
    const p = parseFloat(cleaned);
    if (!isNaN(p)) onChange(p);
    else if (cleaned === '') onChange(0);
  };

  React.useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  return (
    <View
      className={`flex-row items-center rounded-xl border px-3 ${
        focused
          ? isDark ? 'border-white/30 bg-[#1a1a1a]' : 'border-black/20 bg-white'
          : isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
      }`}>
      <TextInput
        value={text}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={isDark ? '#444' : '#ccc'}
        className={`flex-1 py-2.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}
      />
      {suffix && (
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{suffix}</Text>
      )}
    </View>
  );
}

// =====================================================================
// Result Row for comparison table
// =====================================================================
function CompareRow({
  label,
  values,
  isDark,
  highlight,
  isCurrency,
}: {
  label: string;
  values: string[];
  isDark: boolean;
  highlight?: number; // index of the best value
  isCurrency?: boolean;
}) {
  return (
    <View className="flex-row items-center py-3">
      <View style={{ width: 100 }}>
        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</Text>
      </View>
      {values.map((val, i) => (
        <View key={i} className="flex-1 items-center">
          <Text
            className={`text-xs font-bold ${
              highlight === i
                ? 'text-emerald-500'
                : isDark ? 'text-white' : 'text-black'
            }`}>
            {val}
          </Text>
        </View>
      ))}
    </View>
  );
}

// =====================================================================
// MAIN
// =====================================================================
export default function CalcCompareScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Loan details
  const [propertyPrice, setPropertyPrice] = useState(1_500_000);
  const [dpPercent, setDpPercent] = useState(20);

  // Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);

  const downPayment = Math.round((propertyPrice * dpPercent) / 100);
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  // Calculate EMI for each scenario
  const results = useMemo(() => {
    return scenarios.map((s) => {
      const emi = calculateEMI({
        principal: loanAmount,
        annualRate: s.rate,
        years: s.tenure,
      });
      return {
        ...s,
        emi: emi.monthlyInstallment,
        totalPayment: emi.totalPayment,
        totalInterest: emi.totalInterest,
        interestPercent: loanAmount > 0 ? Math.round((emi.totalInterest / loanAmount) * 100) : 0,
      };
    });
  }, [scenarios, loanAmount]);

  // Find best (lowest) values
  const bestEMI = results.length > 0 ? Math.min(...results.map((r) => r.emi)) : 0;
  const bestTotal = results.length > 0 ? Math.min(...results.map((r) => r.totalPayment)) : 0;
  const bestInterest = results.length > 0 ? Math.min(...results.map((r) => r.totalInterest)) : 0;

  const bestEMIIdx = results.findIndex((r) => r.emi === bestEMI);
  const bestTotalIdx = results.findIndex((r) => r.totalPayment === bestTotal);
  const bestInterestIdx = results.findIndex((r) => r.totalInterest === bestInterest);

  // Add scenario
  const addScenario = () => {
    if (scenarios.length >= 5) return;
    const nextIdx = scenarios.length;
    const letter = String.fromCharCode(65 + nextIdx);
    setScenarios([
      ...scenarios,
      { id: String(Date.now()), label: `Scenario ${letter}`, rate: 5.0, tenure: 25 },
    ]);
  };

  // Remove scenario
  const removeScenario = (id: string) => {
    setScenarios((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Re-label
      return filtered.map((s, i) => ({
        ...s,
        label: `Scenario ${String.fromCharCode(65 + i)}`,
      }));
    });
  };

  // Update scenario
  const updateScenario = (updated: Scenario) => {
    setScenarios((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Savings compared to worst
  const worstTotal = results.length > 0 ? Math.max(...results.map((r) => r.totalPayment)) : 0;
  const maxSavings = worstTotal - bestTotal;

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
              Rate Comparison
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Compare mortgage scenarios
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${ACCENT}20` }}>
            <Feather name="bar-chart-2" size={18} color={ACCENT} />
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
                label="Property Price"
                value={propertyPrice}
                onChange={setPropertyPrice}
                isDark={isDark}
                prefix="AED"
              />
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

              <View className="mt-4">
                <NumInput
                  label="Down Payment"
                  value={dpPercent}
                  onChange={(v) => setDpPercent(Math.min(80, Math.max(0, v)))}
                  isDark={isDark}
                  suffix="%"
                  hint={`Loan amount: ${fmtShort(loanAmount)}`}
                />
              </View>
            </Section>

            {/* Scenarios */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                    <Feather name="layers" size={15} color={isDark ? '#fff' : '#000'} />
                  </View>
                  <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    Scenarios
                  </Text>
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${ACCENT}15` }}>
                    <Text style={{ color: ACCENT }} className="text-[10px] font-bold">
                      {scenarios.length}/5
                    </Text>
                  </View>
                </View>
                {scenarios.length < 5 && (
                  <Pressable
                    onPress={addScenario}
                    className={`flex-row items-center px-3 py-2 rounded-xl border ${
                      isDark ? 'border-[#2a2a2a] bg-[#111]' : 'border-gray-200 bg-white'
                    }`}>
                    <Feather name="plus" size={14} color={ACCENT} />
                    <Text className="text-xs font-semibold ml-1" style={{ color: ACCENT }}>
                      Add
                    </Text>
                  </Pressable>
                )}
              </View>

              {scenarios.map((s, i) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  index={i}
                  isDark={isDark}
                  onUpdate={updateScenario}
                  onRemove={() => removeScenario(s.id)}
                  canRemove={scenarios.length > 2}
                />
              ))}
            </Animated.View>

            {/* Results */}
            {results.length >= 2 && (
              <Animated.View entering={FadeInUp.delay(300).duration(400)}>
                <View className="mb-3 mt-2">
                  <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    Comparison Results
                  </Text>
                </View>

                {/* Best Deal Hero */}
                <View
                  className={`rounded-2xl p-5 mb-4 border ${
                    isDark ? 'bg-white border-white' : 'bg-black border-black'
                  }`}>
                  <View className="flex-row items-center mb-2">
                    <Feather name="award" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-black/60' : 'text-white/60'}`}>
                      Best Deal — {results[bestTotalIdx]?.label}
                    </Text>
                  </View>
                  <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    {fmtAED(results[bestTotalIdx]?.emi ?? 0)}/mo
                  </Text>
                  <Text className={`text-[10px] mt-1 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                    {results[bestTotalIdx]?.rate}% rate · {results[bestTotalIdx]?.tenure} years · Total: {fmtShort(results[bestTotalIdx]?.totalPayment ?? 0)}
                  </Text>
                  {maxSavings > 0 && (
                    <View className="flex-row items-center mt-3">
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)' }}>
                        <Text className="text-xs font-bold text-emerald-500">
                          Save {fmtShort(maxSavings)}
                        </Text>
                      </View>
                      <Text className={`text-[10px] ml-2 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                        vs most expensive option
                      </Text>
                    </View>
                  )}
                </View>

                {/* Comparison Table */}
                <View
                  className={`rounded-3xl p-5 mb-4 border ${
                    isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                  }`}>
                  {/* Table Header */}
                  <View className="flex-row items-center pb-3 mb-1">
                    <View style={{ width: 100 }}>
                      <Text className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Metric
                      </Text>
                    </View>
                    {results.map((r, i) => {
                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                      return (
                        <View key={r.id} className="flex-1 items-center">
                          <View
                            className="w-6 h-6 rounded-md items-center justify-center mb-1"
                            style={{ backgroundColor: `${colors[i % colors.length]}20` }}>
                            <Text style={{ color: colors[i % colors.length], fontSize: 10, fontWeight: '800' }}>
                              {String.fromCharCode(65 + i)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Rate */}
                  <CompareRow
                    label="Rate"
                    values={results.map((r) => `${r.rate}%`)}
                    isDark={isDark}
                  />
                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Tenure */}
                  <CompareRow
                    label="Tenure"
                    values={results.map((r) => `${r.tenure} yrs`)}
                    isDark={isDark}
                  />
                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Monthly EMI */}
                  <CompareRow
                    label="Monthly EMI"
                    values={results.map((r) => fmtShort(r.emi))}
                    isDark={isDark}
                    highlight={bestEMIIdx}
                    isCurrency
                  />
                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Total Interest */}
                  <CompareRow
                    label="Total Interest"
                    values={results.map((r) => fmtShort(r.totalInterest))}
                    isDark={isDark}
                    highlight={bestInterestIdx}
                    isCurrency
                  />
                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Total Payment */}
                  <CompareRow
                    label="Total Payment"
                    values={results.map((r) => fmtShort(r.totalPayment))}
                    isDark={isDark}
                    highlight={bestTotalIdx}
                    isCurrency
                  />
                  <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />

                  {/* Interest % of Loan */}
                  <CompareRow
                    label="Interest/Loan"
                    values={results.map((r) => `${r.interestPercent}%`)}
                    isDark={isDark}
                    highlight={bestInterestIdx}
                  />
                </View>

                {/* Per-scenario detail cards */}
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {results.map((r, i) => {
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                    const color = colors[i % colors.length];
                    const isBest = i === bestTotalIdx;

                    return (
                      <Animated.View
                        key={r.id}
                        entering={FadeInUp.delay(400 + i * 80).duration(400)}
                        style={{ width: results.length <= 3 ? '100%' as any : (('48%') as any) }}
                      >
                        <View
                          className={`rounded-2xl p-4 border ${
                            isBest
                              ? isDark ? 'bg-white border-white' : 'bg-black border-black'
                              : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                          }`}>
                          <View className="flex-row items-center mb-2">
                            <View
                              className="w-6 h-6 rounded-md items-center justify-center mr-2"
                              style={{ backgroundColor: isBest ? (isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)') : `${color}20` }}>
                              <Text style={{ color: isBest ? (isDark ? '#000' : '#fff') : color, fontSize: 10, fontWeight: '800' }}>
                                {String.fromCharCode(65 + i)}
                              </Text>
                            </View>
                            <Text className={`text-xs font-bold ${
                              isBest
                                ? isDark ? 'text-black' : 'text-white'
                                : isDark ? 'text-white' : 'text-black'
                            }`}>
                              {r.label}
                            </Text>
                            {isBest && (
                              <View className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20">
                                <Text className="text-[9px] font-bold text-emerald-500">BEST</Text>
                              </View>
                            )}
                          </View>

                          <Text className={`text-lg font-bold ${
                            isBest
                              ? isDark ? 'text-black' : 'text-white'
                              : isDark ? 'text-white' : 'text-black'
                          }`}>
                            {fmtAED(r.emi)}
                            <Text className={`text-xs font-normal ${
                              isBest
                                ? isDark ? 'text-black/50' : 'text-white/50'
                                : isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}>/mo</Text>
                          </Text>

                          <View className="flex-row mt-2 gap-3">
                            <View>
                              <Text className={`text-[10px] ${
                                isBest
                                  ? isDark ? 'text-black/40' : 'text-white/40'
                                  : isDark ? 'text-gray-600' : 'text-gray-400'
                              }`}>Interest</Text>
                              <Text className={`text-xs font-semibold ${
                                isBest
                                  ? isDark ? 'text-black/70' : 'text-white/70'
                                  : isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>{fmtShort(r.totalInterest)}</Text>
                            </View>
                            <View>
                              <Text className={`text-[10px] ${
                                isBest
                                  ? isDark ? 'text-black/40' : 'text-white/40'
                                  : isDark ? 'text-gray-600' : 'text-gray-400'
                              }`}>Total</Text>
                              <Text className={`text-xs font-semibold ${
                                isBest
                                  ? isDark ? 'text-black/70' : 'text-white/70'
                                  : isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>{fmtShort(r.totalPayment)}</Text>
                            </View>
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>

                {/* Interest Breakdown Visual Bar */}
                <Animated.View
                  entering={FadeInUp.delay(500).duration(400)}
                  className={`rounded-3xl p-5 mb-4 border ${
                    isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                  }`}>
                  <View className="flex-row items-center mb-4">
                    <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                      <Feather name="percent" size={15} color={isDark ? '#fff' : '#000'} />
                    </View>
                    <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      Interest vs Principal
                    </Text>
                  </View>

                  {results.map((r, i) => {
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                    const color = colors[i % colors.length];
                    const principalPercent = r.totalPayment > 0
                      ? Math.round((loanAmount / r.totalPayment) * 100)
                      : 0;
                    const interestPct = 100 - principalPercent;

                    return (
                      <View key={r.id} className="mb-4">
                        <View className="flex-row items-center justify-between mb-1.5">
                          <Text className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {r.label} ({r.rate}%)
                          </Text>
                          <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {interestPct}% interest
                          </Text>
                        </View>
                        <View
                          className={`h-3 rounded-full overflow-hidden flex-row ${
                            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                          }`}>
                          <View
                            className="h-full rounded-l-full"
                            style={{ width: `${principalPercent}%` as any, backgroundColor: color }}
                          />
                          <View
                            className="h-full rounded-r-full"
                            style={{ width: `${interestPct}%` as any, backgroundColor: `${color}40` }}
                          />
                        </View>
                      </View>
                    );
                  })}

                  <View className="flex-row items-center mt-1 gap-4">
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: '#6366f1' }} />
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Principal</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="w-2.5 h-2.5 rounded-sm mr-1.5" style={{ backgroundColor: '#6366f140' }} />
                      <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Interest</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* CTAs */}
                <Animated.View entering={FadeInUp.delay(600).duration(400)} className="mt-1">
                  <Pressable
                    onPress={() => router.push('/application' as any)}
                    className={`rounded-2xl py-4 items-center flex-row justify-center ${
                      isDark ? 'bg-white' : 'bg-black'
                    }`}>
                    <Feather name="file-text" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                      Start Application
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/calc-emi' as any)}
                    className={`rounded-2xl py-3.5 mt-3 items-center flex-row justify-center border ${
                      isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
                    }`}>
                    <Feather name="credit-card" size={14} color={isDark ? '#fff' : '#000'} />
                    <Text className={`ml-1.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      Detailed EMI Calculator
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Disclaimer */}
                <View className="flex-row items-start mt-5 mb-2">
                  <Feather name="info" size={11} color={isDark ? '#444' : '#bbb'} style={{ marginTop: 2 }} />
                  <Text className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
                    Rates shown are for comparison only. Actual rates depend on your bank, credit profile, and market conditions.
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
