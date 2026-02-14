import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useFeatureFlags } from '@/src/hooks/useFeatureFlags';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// =====================================================================
// Tool Card Data
// =====================================================================
interface ToolItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  route: string;
  gradient: string; // accent color for the icon bg
  badge?: string;
}

const tools: ToolItem[] = [
  {
    id: 'emi',
    title: 'EMI Calculator',
    subtitle: 'Monthly payment estimator',
    description: 'Calculate your monthly mortgage installment based on loan amount, interest rate, and tenure with real-time results.',
    icon: 'credit-card',
    route: '/calc-emi',
    gradient: '#6366f1', // indigo
    badge: 'Popular',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    subtitle: 'Talk to AI mortgage expert',
    description: 'Get instant answers about UAE mortgages, eligibility, and personalized advice from our AI-powered assistant.',
    icon: 'cpu',
    route: '/ai-assistant',
    gradient: '#8b5cf6', // violet
    badge: 'BETA',
  },
  {
    id: 'afford',
    title: 'Affordability',
    subtitle: 'How much can you borrow?',
    description: 'Enter your salary and expenses to find out the maximum mortgage amount UAE banks will approve for you.',
    icon: 'trending-up',
    route: '/calc-afford',
    gradient: '#10b981', // emerald
  },
  {
    id: 'costs',
    title: 'Upfront Costs',
    subtitle: 'UAE fees breakdown',
    description: 'Estimate DLD fees, mortgage registration, bank charges, agent commission, and VAT for your property purchase.',
    icon: 'file-text',
    route: '/calc-costs',
    gradient: '#f59e0b', // amber
  },
  {
    id: 'compare',
    title: 'Rate Comparison',
    subtitle: 'Compare rate scenarios',
    description: 'Compare different interest rates and tenures side by side to find the best mortgage deal for you.',
    icon: 'bar-chart-2',
    route: '/calc-compare',
    gradient: '#ec4899', // pink
  },
  {
    id: 'prepay',
    title: 'Prepayment',
    subtitle: 'Early settlement savings',
    description: 'See how lump-sum or extra monthly payments reduce your tenure and total interest paid.',
    icon: 'zap',
    route: '/calc-prepay',
    gradient: '#0ea5e9', // sky blue
    badge: 'New',
  },
  {
    id: 'rentvsbuy',
    title: 'Rent vs Buy',
    subtitle: 'Which option saves more?',
    description: 'Compare the total cost of renting vs buying over time, factoring in equity, appreciation, and fees.',
    icon: 'home',
    route: '/calc-rentvsbuy',
    gradient: '#14b8a6', // teal
    badge: 'New',
  },
];

// =====================================================================
// Quick Stat Pill
// =====================================================================
function QuickStat({
  icon,
  label,
  value,
  isDark,
}: {
  icon: string;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-2xl p-4 border ${
        isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-100'
      }`}>
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mb-2.5 ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'
        }`}>
        <Feather name={icon as any} size={16} color={isDark ? '#fff' : '#000'} />
      </View>
      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{value}</Text>
      <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
        {label}
      </Text>
    </View>
  );
}

// =====================================================================
// Tool Card Component
// =====================================================================
function ToolCard({
  tool,
  index,
  isDark,
}: {
  tool: ToolItem;
  index: number;
  isDark: boolean;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // All cards should be full-width
  const isHero = index === 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * 100).duration(400)}
      style={{ width: '100%' }}>
      <Animated.View style={animStyle}>
        <AnimatedPressable
          onPress={() => router.push(tool.route as any)}
          onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
          className={`rounded-3xl border overflow-hidden p-6 ${
            isDark ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-100'
          }`}>

        {/* Decorative corner circle */}
        <View className="absolute -right-12 -top-12 opacity-[0.04]">
          <View
            className="w-48 h-48 rounded-full"
            style={{ backgroundColor: tool.gradient }}
          />
        </View>

        {/* Badge */}
        {tool.badge && (
          <View className="absolute top-4 right-4">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${tool.gradient}20` }}>
              <Text style={{ color: tool.gradient }} className="text-[10px] font-bold">
                {tool.badge}
              </Text>
            </View>
          </View>
        )}

        {/* Icon */}
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mb-4"
          style={{ backgroundColor: `${tool.gradient}15` }}>
          <Feather name={tool.icon as any} size={22} color={tool.gradient} />
        </View>

        {/* Text */}
        <Text
          className={`text-xl font-bold mb-1 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
          {tool.title}
        </Text>
        <Text
          className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {tool.subtitle}
        </Text>

        {isHero && (
          <Text
            className={`text-sm leading-5 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {tool.description}
          </Text>
        )}

        {/* Arrow CTA */}
        <View className="flex-row items-center mt-1">
          <Text
            className="text-xs font-semibold mr-1"
            style={{ color: tool.gradient }}>
            {isHero ? 'Calculate Now' : 'Open'}
          </Text>
          <Feather name="arrow-right" size={12} color={tool.gradient} />
        </View>
      </AnimatedPressable>
      </Animated.View>
    </Animated.View>
  );
}

// =====================================================================
// Main Screen
// =====================================================================
export default function CalculatorScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { flags } = useFeatureFlags();

  // Filter tools based on feature flags
  const visibleTools = tools.filter((tool) => {
    if (tool.id === 'ai-assistant') {
      return flags.aiAssistantEnabled;
    }
    return true;
  });

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} className="px-6 pt-2 pb-2">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
            }`}>
            <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Mortgage Tools
            </Text>
            <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Everything you need to plan your mortgage
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Quick Stats Row */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          className="flex-row gap-3 px-6 mt-4 mb-6">
          <QuickStat icon="percent" label="Avg UAE Rate" value="4.25%" isDark={isDark} />
          <QuickStat icon="home" label="Max LTV" value="80%" isDark={isDark} />
          <QuickStat icon="shield" label="Max DBR" value="50%" isDark={isDark} />
        </Animated.View>

        {/* Section Title */}
        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          className="px-6 mb-4">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Calculators
          </Text>
          <Text className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Select a tool to get started
          </Text>
        </Animated.View>

        {/* Hero Card (EMI Calculator - full width) */}
        <View className="px-6 mb-3">
          <ToolCard tool={visibleTools[0]} index={0} isDark={isDark} />
        </View>

        {/* All other cards - full width */}
        <View className="px-6">
          {visibleTools.slice(1).map((tool, i) => (
            <View key={tool.id} className="mb-3">
              <ToolCard tool={tool} index={i + 1} isDark={isDark} />
            </View>
          ))}
        </View>

        {/* Bottom CTA */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          className="px-6 mt-6">
          <View
            className={`rounded-3xl p-6 ${isDark ? 'bg-white' : 'bg-black'}`}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className={`text-lg font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  Ready to Apply?
                </Text>
                <Text
                  className={`text-sm mt-1.5 leading-5 ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                  Done calculating? Start your mortgage application now.
                </Text>
              </View>
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  isDark ? 'bg-black' : 'bg-white'
                }`}>
                <Feather name="file-text" size={22} color={isDark ? '#fff' : '#000'} />
              </View>
            </View>
            <Pressable
              onPress={() => router.push('/application' as any)}
              className={`mt-4 rounded-xl py-3.5 items-center ${
                isDark ? 'bg-black' : 'bg-white'
              }`}>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Start Application
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Info footer */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(400)}
          className="px-6 mt-4">
          <View className="flex-row items-start">
            <Feather name="info" size={12} color={isDark ? '#444' : '#bbb'} style={{ marginTop: 2 }} />
            <Text className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
              All calculations are estimates based on standard UAE banking guidelines. Actual rates and
              eligibility depend on the bank and your credit profile.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
