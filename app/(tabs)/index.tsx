import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Calendar, Star, ChevronRight, TrendingUp, Award, Users } from '@/components/Icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Link } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');

// Quick actions with theme-aware colors
const quickActions = [
  { id: 1, icon: Search, label: 'Find Agents', description: 'Browse all' },
  { id: 2, icon: MapPin, label: 'Near Me', description: 'Local pros' },
  { id: 3, icon: Calendar, label: 'Book Now', description: 'Instant booking' },
  { id: 4, icon: TrendingUp, label: 'Top Rated', description: 'Best reviews' },
];

// Featured agents with better data
const featuredAgents = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    specialty: 'Luxury Real Estate',
    rating: 4.9,
    reviews: 127,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    tag: 'Top Agent',
    bookings: '2.5k+',
  },
  {
    id: 2,
    name: 'James Chen',
    specialty: 'Commercial Properties',
    rating: 4.8,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400',
    tag: 'Expert',
    bookings: '1.8k+',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    specialty: 'Investment Consulting',
    rating: 5.0,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    tag: 'Premium',
    bookings: '3.2k+',
  },
];

// Stats data
const platformStats = [
  { label: 'Active Agents', value: '500+', icon: Users },
  { label: 'Happy Clients', value: '12K+', icon: Award },
  { label: 'Avg Rating', value: '4.9', icon: Star },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Quick Action Card Component
function QuickActionCard({ item, index }: { item: (typeof quickActions)[0]; index: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Icon = item.icon;

  return (
    <AnimatedPressable
      style={[animatedStyle, { width: '48%' }]}
      className={`rounded-3xl border-2 p-4 shadow-sm overflow-hidden relative ${
        isDark 
          ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
          : 'bg-white border-gray-200'
      }`}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 150 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}>
      
      {/* Decorative Circle Overlay */}
      <View className={`absolute -right-8 -top-8 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.08]'}`}>
        <View className={`w-28 h-28 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
      </View>

      <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 shadow-lg ${
        isDark ? 'bg-white' : 'bg-black'
      }`}>
        <Icon color={isDark ? '#000' : '#fff'} size={24} strokeWidth={2.5} />
      </View>
      <Text className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
        {item.label}
      </Text>
      <Text className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {item.description}
      </Text>
    </AnimatedPressable>
  );
}

// Featured Agent Card Component - Redesigned
function FeaturedAgentCard({ agent, index }: { agent: (typeof featuredAgents)[0]; index: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Link href="/agent-detail" asChild>
      <AnimatedPressable
        style={animatedStyle}
        className={`mr-4 w-[180px] rounded-2xl overflow-hidden ${
          isDark 
            ? 'bg-[#111] border border-[#222]' 
            : 'bg-white border border-gray-100'
        }`}
        onPressIn={() => {
          scale.value = withTiming(0.96, { duration: 150 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150 });
        }}>
        
        {/* Agent Photo with Gradient Overlay */}
        <View className="relative h-52">
          <Image 
            source={{ uri: agent.image }} 
            className="w-full h-full"
            resizeMode="cover" 
          />
          
          {/* Full Dark Overlay for better text contrast */}
          <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/30" />
          
          {/* Top Badge */}
          <View className="absolute top-2 left-2">
            <View className="px-2.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg overflow-hidden">
              <Text className="text-[10px] font-bold text-white">
                ⭐ {agent.tag}
              </Text>
            </View>
          </View>

          {/* Gradient Overlay at Bottom */}
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/95 via-black/70 to-transparent" />
          
          {/* Agent Info Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-3">
            <Text className="text-base font-bold mb-0.5 text-white" numberOfLines={1}>
              {agent.name}
            </Text>
            <Text className="text-[10px] mb-2 text-white/90" numberOfLines={1}>
              {agent.specialty}
            </Text>
            
            {/* Stats Row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center px-2.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg overflow-hidden">
                <Star color="#fff" size={10} fill="#fff" />
                <Text className="ml-1 text-[10px] font-bold text-white">
                  {agent.rating}
                </Text>
              </View>
              
              <View className="flex-row items-center px-2.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg overflow-hidden">
                <Users color="#fff" size={10} />
                <Text className="ml-1 text-[10px] font-semibold text-white">
                  {agent.bookings}
                </Text>
              </View>
            </View>
          </View>
        </View>

      </AnimatedPressable>
    </Link>
  );
}

// Stat Card Component
function StatCard({ stat, index }: { stat: (typeof platformStats)[0]; index: number }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const Icon = stat.icon;

  return (
    <View 
      className={`flex-1 rounded-3xl border-2 p-4 items-center shadow-sm ${
        isDark 
          ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
          : 'bg-white border-gray-200'
      }`}>
      <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 shadow-lg ${
        isDark ? 'bg-white' : 'bg-black'
      }`}>
        <Icon color={isDark ? '#000' : '#fff'} size={20} strokeWidth={2.5} />
      </View>
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        {stat.value}
      </Text>
      <Text className={`text-xs mt-1 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {stat.label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Welcome back,
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              John Doe
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        
        {/* Quick Actions Grid */}
        <View className="px-6 mb-8">
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {quickActions.map((item, index) => (
              <QuickActionCard key={item.id} item={item} index={index} />
            ))}
          </View>
        </View>

        {/* Featured Agents Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-6 mb-4">
            <View>
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Featured Agents
              </Text>
              <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Top-rated professionals
              </Text>
            </View>
            <Link href="/agents" asChild>
              <Pressable className="flex-row items-center px-3 py-2 rounded-full bg-transparent">
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  See All
                </Text>
                <ChevronRight color={isDark ? '#666' : '#999'} size={16} />
              </Pressable>
            </Link>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
            decelerationRate="fast"
            snapToInterval={196}>
            {featuredAgents.map((agent, index) => (
              <FeaturedAgentCard key={agent.id} agent={agent} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Platform Stats */}
        <View className="px-6">
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            Platform Stats
          </Text>
          <View className="flex-row gap-3">
            {platformStats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </View>
        </View>

        {/* CTA Banner */}
        <View className="px-6 mt-8">
          <View className={`rounded-3xl p-6 ${isDark ? 'bg-white' : 'bg-black'}`}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className={`text-xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  Become an Agent
                </Text>
                <Text className={`text-sm mt-2 leading-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                  Join our network of professionals and grow your business
                </Text>
              </View>
              <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                isDark ? 'bg-black' : 'bg-white'
              }`}>
                <Award color={isDark ? '#fff' : '#000'} size={24} />
              </View>
            </View>
            <Pressable className={`mt-5 rounded-xl py-3.5 items-center ${
              isDark ? 'bg-black' : 'bg-white'
            }`}>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Apply Now
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
