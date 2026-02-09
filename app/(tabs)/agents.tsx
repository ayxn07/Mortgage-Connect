import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Search, Star, MapPin, ChevronDown, ChevronUp, Heart } from '@/components/Icons';
import { useRouter } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useColorScheme } from 'nativewind';

// Mock agent data
const AGENTS = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    photo:
      'https://images.unsplash.com/photo-1517340073101-289191978ae8?w=900&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviews: 127,
    location: 'New York, NY',
    skills: ['Corporate', 'Weddings', 'Editorial'],
    hourlyRate: 250,
    available: true,
  },
  {
    id: '2',
    name: 'Marcus Chen',
    photo:
      'https://images.unsplash.com/photo-1635099404457-91c3d0dade3b?w=900&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviews: 94,
    location: 'Los Angeles, CA',
    skills: ['Fashion', 'Portrait', 'Commercial'],
    hourlyRate: 300,
    available: false,
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    photo:
      'https://images.unsplash.com/photo-1629216509258-4dbd7880e605?w=900&auto=format&fit=crop&q=60',
    rating: 5.0,
    reviews: 156,
    location: 'Miami, FL',
    skills: ['Events', 'Lifestyle', 'Brand'],
    hourlyRate: 275,
    available: true,
  },
  {
    id: '4',
    name: 'James Thompson',
    photo:
      'https://images.unsplash.com/photo-1600675608140-991fcf38cc6e?w=900&auto=format&fit=crop&q=60',
    rating: 4.7,
    reviews: 83,
    location: 'Chicago, IL',
    skills: ['Product', 'Architecture', 'Food'],
    hourlyRate: 225,
    available: true,
  },
  {
    id: '5',
    name: 'Aisha Patel',
    photo:
      'https://images.unsplash.com/photo-1748885286888-8440967ae5f0?w=900&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviews: 112,
    location: 'San Francisco, CA',
    skills: ['Tech', 'Startup', 'Corporate'],
    hourlyRate: 350,
    available: true,
  },
];

const CATEGORIES = ['All', 'Corporate', 'Weddings', 'Fashion', 'Events', 'Product'];

// Agent Card Component
function AgentCard({
  agent,
  index,
  favorites,
  onToggleFavorite,
}: {
  agent: (typeof AGENTS)[0];
  index: number;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <View>
      <TouchableOpacity 
        className="overflow-hidden rounded-2xl bg-white" 
        activeOpacity={0.95}
        onPress={() => router.push('/agent-detail')}>
        {/* Agent Photo */}
        <View className="relative">
          <Image source={{ uri: agent.photo }} className="h-48 w-full" resizeMode="cover" />
          {/* Favorite Button */}
          <TouchableOpacity
            onPress={() => onToggleFavorite(agent.id)}
            className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/60"
            activeOpacity={0.7}>
            <Heart color="#fff" size={20} fill={favorites.has(agent.id) ? '#fff' : 'transparent'} />
          </TouchableOpacity>
          {/* Availability Badge */}
          {agent.available && (
            <View className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1">
              <Text className="text-xs font-medium text-black">Available</Text>
            </View>
          )}
        </View>

        {/* Agent Info */}
        <View className="p-4">
          <View className="mb-2 flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-black">{agent.name}</Text>
              <View className="mt-1 flex-row items-center">
                <MapPin color="#666" size={14} />
                <Text className="ml-1 text-sm text-[#666]">{agent.location}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Star color="#000" size={16} fill="#000" />
              <Text className="ml-1 font-bold text-black">{agent.rating}</Text>
              <Text className="ml-1 text-sm text-[#666]">({agent.reviews})</Text>
            </View>
          </View>

          {/* Skills */}
          <View className="mb-3 flex-row flex-wrap gap-2">
            {agent.skills.map((skill) => (
              <View key={skill} className="rounded-full bg-[#f5f5f5] px-3 py-1">
                <Text className="text-xs text-black">{skill}</Text>
              </View>
            ))}
          </View>

          {/* Rate & Actions */}
          <View className="flex-row items-center justify-between border-t border-[#eee] pt-3">
            <View>
              <Text className="text-xs text-[#666]">Starting at</Text>
              <Text className="text-lg font-bold text-black">${agent.hourlyRate}/hr</Text>
            </View>
            <TouchableOpacity className="rounded-full bg-black px-6 py-3" activeOpacity={0.8}>
              <Text className="font-medium text-white">View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function AgentsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Animation values
  const filterHeight = useSharedValue(0);

  useEffect(() => {
    filterHeight.value = withSpring(filterExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 150,
    });
  }, [filterExpanded, filterHeight]);

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(filterHeight.value, [0, 1], [0, 180]),
    opacity: filterHeight.value,
  }));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Explore professionals
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Find Agents
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </View>

      <View className="px-6 pb-3">
        {/* Search Bar */}
        <View className={`mb-3 flex-row items-center rounded-2xl px-4 py-3 ${
          isDark ? 'bg-[#111] border border-[#222]' : 'bg-white border border-gray-200'
        }`}>
          <Search color={isDark ? '#666' : '#999'} size={20} />
          <TextInput
            placeholder="Search by name, skill, or location..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`ml-3 flex-1 ${isDark ? 'text-white' : 'text-black'}`}
          />
        </View>

        {/* Filter Toggle */}
        <TouchableOpacity
          onPress={() => setFilterExpanded(!filterExpanded)}
          className="flex-row items-center justify-between rounded-2xl border border-[#333] bg-[#111] px-4 py-3"
          activeOpacity={0.7}>
          <Text className="font-medium text-white">Filters</Text>
          {filterExpanded ? (
            <ChevronUp color="#fff" size={20} />
          ) : (
            <ChevronDown color="#fff" size={20} />
          )}
        </TouchableOpacity>

        {/* Collapsible Filter Section */}
        <Animated.View style={filterAnimatedStyle} className="overflow-hidden">
          <View className="pt-3">
            <Text className="mb-2 text-sm text-[#999]">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 ${
                    selectedCategory === category
                      ? 'border-white bg-white'
                      : 'border-[#333] bg-transparent'
                  }`}
                  activeOpacity={0.7}>
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === category ? 'text-black' : 'text-white'
                    }`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="mt-4 flex-row items-center justify-between">
              <Text className="text-sm text-[#999]">Availability</Text>
              <TouchableOpacity className="rounded-full border border-[#333] bg-[#111] px-4 py-2">
                <Text className="text-sm text-white">Available Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Agent Cards */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 16 }}>
        {AGENTS.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            index={index}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
