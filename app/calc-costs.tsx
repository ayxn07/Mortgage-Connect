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
import { calculateUpfrontCosts, getMinDownPaymentPercent } from '@/src/utils/helpers';
import type { Emirate, PropertyReadinessType } from '@/src/utils/helpers';

// =====================================================================
// Formatters
// =====================================================================
function fmtAED(v: number): string {
  if (!isFinite(v) || isNaN(v)) return 'AED 0';
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
    // Prevent multiple decimal points
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
// Fee Row
// =====================================================================
function FeeRow({
  label,
  value,
  note,
  isDark,
  bold,
}: {
  label: string;
  value: number;
  note?: string;
  isDark: boolean;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 mr-3">
        <Text className={`text-sm ${bold ? 'font-bold' : ''} ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </Text>
        {note && (
          <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{note}</Text>
        )}
      </View>
      <Text className={`text-sm ${bold ? 'font-bold' : 'font-semibold'} ${isDark ? 'text-white' : 'text-black'}`}>
        {fmtAED(value)}
      </Text>
    </View>
  );
}

// =====================================================================
// Divider
// =====================================================================
function Divider({ isDark }: { isDark: boolean }) {
  return <View className={`h-px ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`} />;
}

// =====================================================================
// MAIN
// =====================================================================
export default function CalcCostsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // --- Inputs ---
  const [propertyPrice, setPropertyPrice] = useState(1_500_000);
  const [dpPercent, setDpPercent] = useState(20);
  const [emirate, setEmirate] = useState<Emirate>('dubai');
  const [propertyReadiness, setPropertyReadiness] = useState<PropertyReadinessType>('ready');
  const [agentCommPct, setAgentCommPct] = useState(2);
  const [includeVAT, setIncludeVAT] = useState(true);
  const [valuationFee, setValuationFee] = useState(3_000);
  const [isResident, setIsResident] = useState(true);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);

  // --- Derived values ---
  const minDP = getMinDownPaymentPercent(isResident, isFirstTimeBuyer, propertyPrice);
  const effectiveDpPercent = Math.max(dpPercent, minDP);
  const downPayment = Math.round((propertyPrice * effectiveDpPercent) / 100);
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  const costs = useMemo(() => {
    if (propertyPrice <= 0) {
      return {
        dldFee: 0, mortgageRegistration: 0, valuationFee: 0,
        bankProcessingFee: 0, agentCommission: 0, trusteeFee: 0,
        adminFee: 0, oqoodFee: 0, vat: 0, totalFees: 0, totalUpfrontCash: 0,
      };
    }
    return calculateUpfrontCosts(
      {
        propertyPrice,
        loanAmount,
        emirate,
        agentCommissionPercent: agentCommPct,
        includeVAT,
        valuationFee,
        propertyReadiness,
      },
      downPayment
    );
  }, [propertyPrice, loanAmount, emirate, agentCommPct, includeVAT, valuationFee, downPayment, propertyReadiness]);

  // --- Labels ---
  const transferLabel = emirate === 'abu_dhabi'
    ? 'Transfer Fee (2%)'
    : 'DLD Transfer Fee (4%)';
  const mortgageRegLabel = emirate === 'abu_dhabi'
    ? 'Mortgage Registration (0.1%)'
    : `Mortgage Registration (0.25%)${emirate === 'dubai' ? ' + AED 290' : ''}`;

  const isOffPlanDubai = emirate === 'dubai' && propertyReadiness === 'off_plan';

  // Fees as % of property price
  const feesPercent = propertyPrice > 0
    ? ((costs.totalFees / propertyPrice) * 100).toFixed(1)
    : '0.0';

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
              Upfront Costs
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              UAE purchase fees & charges
            </Text>
          </View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#f59e0b20' }}>
            <Feather name="file-text" size={18} color="#f59e0b" />
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

            {/* Property Info */}
            <Section icon="home" title="Property Info" isDark={isDark} delay={100}>
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
                  onChange={(v) => setDpPercent(Math.max(0, Math.min(99, v)))}
                  isDark={isDark}
                  suffix="%"
                  hint={
                    dpPercent < minDP
                      ? `Min ${minDP}% required for ${isResident ? 'resident' : 'non-resident'} — auto-adjusted`
                      : `Down payment: ${fmtAED(downPayment)}`
                  }
                />
              </View>

              {/* Buyer Type */}
              <View className="mb-3">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Buyer Type
                </Text>
                <Chips
                  items={[
                    { label: 'Resident', value: 'resident' },
                    { label: 'Non-Resident', value: 'non_resident' },
                  ]}
                  selected={isResident ? 'resident' : 'non_resident'}
                  onSelect={(v) => setIsResident(v === 'resident')}
                  isDark={isDark}
                />
              </View>

              {isResident && (
                <Toggle
                  label="First-time buyer"
                  value={isFirstTimeBuyer}
                  onToggle={() => setIsFirstTimeBuyer(!isFirstTimeBuyer)}
                  isDark={isDark}
                  hint="First property in UAE (lower DP required)"
                />
              )}

              {/* Emirate */}
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Emirate
              </Text>
              <Chips
                items={[
                  { label: 'Dubai', value: 'dubai' as Emirate },
                  { label: 'Abu Dhabi', value: 'abu_dhabi' as Emirate },
                  { label: 'Sharjah', value: 'sharjah' as Emirate },
                  { label: 'Other', value: 'other' as Emirate },
                ]}
                selected={emirate}
                onSelect={(v) => setEmirate(v as Emirate)}
                isDark={isDark}
              />

              {/* Property Readiness (Dubai only) */}
              {emirate === 'dubai' && (
                <View className="mt-3">
                  <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Property Status
                  </Text>
                  <Chips
                    items={[
                      { label: 'Ready', value: 'ready' as PropertyReadinessType },
                      { label: 'Off-Plan', value: 'off_plan' as PropertyReadinessType },
                    ]}
                    selected={propertyReadiness}
                    onSelect={(v) => setPropertyReadiness(v as PropertyReadinessType)}
                    isDark={isDark}
                  />
                  {propertyReadiness === 'off_plan' && (
                    <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      Off-plan: Oqood registration fee (4%) replaces DLD transfer fee
                    </Text>
                  )}
                </View>
              )}
            </Section>

            {/* Fee Options */}
            <Section icon="settings" title="Fee Options" isDark={isDark} delay={200}>
              <NumInput
                label="Agent Commission"
                value={agentCommPct}
                onChange={(v) => setAgentCommPct(Math.max(0, Math.min(10, v)))}
                isDark={isDark}
                suffix="%"
                hint="Typically 2% of property price"
              />
              <NumInput
                label="Valuation Fee"
                value={valuationFee}
                onChange={setValuationFee}
                isDark={isDark}
                prefix="AED"
                hint="Typically AED 2,500 - 3,500"
              />

              {/* VAT Toggle */}
              <Toggle
                label="Include 5% VAT on fees"
                value={includeVAT}
                onToggle={() => setIncludeVAT(!includeVAT)}
                isDark={isDark}
                hint="VAT on bank processing, valuation, commission & trustee"
              />
            </Section>

            {/* Results: Fee Breakdown */}
            <Animated.View entering={FadeInUp.delay(300).duration(400)}>
              <View className="mb-3">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Cost Breakdown
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Total fees are ~{feesPercent}% of property price
                </Text>
              </View>

              <View
                className={`rounded-3xl p-5 mb-4 border ${
                  isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                }`}>

                {/* Government Fees Section */}
                <Text className={`text-xs font-bold mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  GOVERNMENT FEES
                </Text>

                {/* DLD Transfer Fee or Oqood */}
                {isOffPlanDubai ? (
                  <FeeRow
                    label="Oqood Fee (4%)"
                    value={costs.oqoodFee}
                    note="Off-plan registration — Dubai Land Department"
                    isDark={isDark}
                  />
                ) : (
                  <FeeRow
                    label={transferLabel}
                    value={costs.dldFee}
                    note="Paid to land department"
                    isDark={isDark}
                  />
                )}
                <Divider isDark={isDark} />

                <FeeRow
                  label={mortgageRegLabel}
                  value={costs.mortgageRegistration}
                  note="Paid to land department"
                  isDark={isDark}
                />

                {/* Admin Fee (Dubai) */}
                {costs.adminFee > 0 && (
                  <>
                    <Divider isDark={isDark} />
                    <FeeRow
                      label="DLD Admin / Knowledge Fee"
                      value={costs.adminFee}
                      note="Fixed AED 580 (Dubai)"
                      isDark={isDark}
                    />
                  </>
                )}

                {/* Trustee Fee (Dubai) */}
                {costs.trusteeFee > 0 && (
                  <>
                    <Divider isDark={isDark} />
                    <FeeRow
                      label="Trustee / Conveyancer Fee"
                      value={costs.trusteeFee}
                      note={`${propertyPrice <= 500_000 ? 'AED 2,000' : 'AED 4,000'} (Dubai) + VAT if applicable`}
                      isDark={isDark}
                    />
                  </>
                )}

                {/* Bank & Service Fees Section */}
                <View className="mt-3 mb-2">
                  <Text className={`text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    BANK & SERVICE FEES
                  </Text>
                </View>

                <FeeRow
                  label="Bank Processing Fee (1%)"
                  value={costs.bankProcessingFee}
                  note={loanAmount > 0 && costs.bankProcessingFee === 5_000
                    ? 'Min AED 5,000 applied'
                    : 'Min AED 5,000 in practice'}
                  isDark={isDark}
                />
                <Divider isDark={isDark} />

                <FeeRow
                  label="Valuation Fee"
                  value={costs.valuationFee}
                  isDark={isDark}
                />
                <Divider isDark={isDark} />

                <FeeRow
                  label={`Agent Commission (${agentCommPct}%)`}
                  value={costs.agentCommission}
                  isDark={isDark}
                />

                {/* VAT */}
                {includeVAT && costs.vat > 0 && (
                  <>
                    <Divider isDark={isDark} />
                    <FeeRow
                      label="VAT (5%)"
                      value={costs.vat}
                      note="On bank processing, valuation, commission & trustee"
                      isDark={isDark}
                    />
                  </>
                )}

                {/* Totals */}
                <View className={`h-px mt-1 ${isDark ? 'bg-[#333]' : 'bg-gray-300'}`} />
                <FeeRow label="Total Fees" value={costs.totalFees} isDark={isDark} bold />
              </View>

              {/* Hero: Total Upfront Cash */}
              <View
                className={`rounded-2xl p-5 border ${
                  isDark ? 'bg-white border-white' : 'bg-black border-black'
                }`}>
                <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-black/50' : 'text-white/50'}`}>
                  Total Upfront Cash Needed
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  {fmtAED(costs.totalUpfrontCash)}
                </Text>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                  Down Payment ({fmtAED(downPayment)}) + Fees ({fmtAED(costs.totalFees)})
                </Text>
              </View>

              {/* Summary row */}
              <View className="flex-row gap-3 mt-3">
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Down Payment</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtAED(downPayment)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {effectiveDpPercent}% of property
                  </Text>
                </View>
                <View
                  className={`flex-1 rounded-2xl p-4 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loan Amount</Text>
                  <Text className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                    {fmtAED(loanAmount)}
                  </Text>
                  <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {100 - effectiveDpPercent}% financed
                  </Text>
                </View>
              </View>

              {/* Min DP Info */}
              <Animated.View entering={FadeInUp.delay(350).duration(400)}>
                <View
                  className={`rounded-2xl p-4 mt-3 border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'
                  }`}>
                  <View className="flex-row items-center mb-1">
                    <Feather name="shield" size={12} color={isDark ? '#888' : '#666'} />
                    <Text className={`ml-1.5 text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Minimum Down Payment
                    </Text>
                  </View>
                  <Text className={`text-[11px] leading-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {isResident ? 'UAE Resident' : 'Non-Resident'}
                    {isResident ? (isFirstTimeBuyer ? ', first-time buyer' : ', not first-time') : ''}
                    {' — '}
                    Min {minDP}% ({fmtAED(Math.round(propertyPrice * minDP / 100))})
                    {propertyPrice > 5_000_000 ? ' (property > AED 5M)' : ''}
                  </Text>
                </View>
              </Animated.View>

              {/* CTA */}
              <Animated.View entering={FadeInUp.delay(400).duration(400)} className="mt-5">
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
                  Fees vary by emirate, bank, and property type. Trustee fees and admin fees apply primarily
                  in Dubai. Contact your bank for exact charges. Off-plan Oqood fee replaces DLD transfer fee.
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
