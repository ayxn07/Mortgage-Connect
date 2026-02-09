import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Star,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Heart,
  Share,
  CheckCircle,
} from '@/components/Icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 320;

// Mock agent data
const AGENT = {
  id: '1',
  name: 'Sarah Mitchell',
  photo:
    'https://images.unsplash.com/photo-1517340073101-289191978ae8?w=900&auto=format&fit=crop&q=60',
  rating: 4.9,
  totalReviews: 127,
  location: 'New York, NY',
  skills: ['Corporate', 'Weddings', 'Editorial', 'Fashion', 'Portrait'],
  hourlyRate: 250,
  available: true,
  bio: "Professional photographer with over 10 years of experience capturing life's most precious moments. Specializing in corporate events, weddings, and editorial photography. My approach combines technical excellence with creative storytelling to deliver stunning visual narratives.",
  email: 'sarah.mitchell@example.com',
  phone: '+1 (555) 123-4567',
  completedProjects: 342,
  responseTime: '2 hours',
  services: [
    { name: 'Corporate Events', price: 250, duration: 'per hour' },
    { name: 'Wedding Photography', price: 2500, duration: 'full day' },
    { name: 'Portrait Sessions', price: 350, duration: '2 hours' },
    { name: 'Editorial Shoots', price: 400, duration: 'per hour' },
  ],
  reviews: [
    {
      id: '1',
      author: 'John Davis',
      rating: 5,
      date: '2 weeks ago',
      text: 'Absolutely phenomenal work! Sarah captured our corporate event perfectly. Professional, creative, and delivered ahead of schedule.',
    },
    {
      id: '2',
      author: 'Emily Rodriguez',
      rating: 5,
      date: '1 month ago',
      text: 'Our wedding photos are beyond amazing! Sarah has an incredible eye for detail and made us feel so comfortable throughout the day.',
    },
    {
      id: '3',
      author: 'Michael Chen',
      rating: 4,
      date: '2 months ago',
      text: 'Great experience working with Sarah. Very professional and the final photos exceeded our expectations.',
    },
  ],
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function AgentDetailScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Parallax header animation
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT * 0.4],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0, HEADER_HEIGHT],
      [1.2, 1, 0.9],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  // Header overlay fade
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.5],
      [0, 0.7],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View className="flex-1 bg-black">
      {/* Fixed Header with Back Button */}
      <SafeAreaView className="absolute left-0 right-0 top-0 z-50">
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/60"
            activeOpacity={0.7}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/60"
              activeOpacity={0.7}>
              <Heart color="#fff" size={22} fill={isFavorite ? '#fff' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-black/60"
              activeOpacity={0.7}>
              <Share color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 128 }}>
        {/* Parallax Header Image */}
        <View style={{ height: HEADER_HEIGHT, overflow: 'hidden' }}>
          <Animated.View style={[{ height: HEADER_HEIGHT }, headerAnimatedStyle]}>
            <Image
              source={{ uri: AGENT.photo }}
              style={{ width: '100%', height: HEADER_HEIGHT }}
              resizeMode="cover"
            />
            {/* Dark overlay */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#000',
                },
                overlayAnimatedStyle,
              ]}
            />
          </Animated.View>
        </View>

        {/* Profile Info Card */}
        <View className="mt-[-40px] px-6">
          <View className="rounded-[20px] bg-white p-6">
            <View className="mb-4 flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-black">{AGENT.name}</Text>
                <View className="mt-2 flex-row items-center">
                  <MapPin color="#666" size={16} />
                  <Text className="ml-1 text-[#666]">{AGENT.location}</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Star color="#000" size={18} fill="#000" />
                  <Text className="ml-1 text-lg font-bold text-black">{AGENT.rating}</Text>
                </View>
                <Text className="mt-1 text-sm text-[#666]">({AGENT.totalReviews} reviews)</Text>
              </View>
            </View>

            {/* Skills */}
            <View className="mb-4 flex-row flex-wrap gap-2">
              {AGENT.skills.map((skill) => (
                <View key={skill} className="rounded-full bg-[#f5f5f5] px-3 py-2">
                  <Text className="text-sm font-medium text-black">{skill}</Text>
                </View>
              ))}
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-4 border-t border-[#eee] pt-4">
              <View className="flex-1">
                <Text className="text-xl font-bold text-black">{AGENT.completedProjects}</Text>
                <Text className="text-sm text-[#666]">Projects</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-black">{AGENT.responseTime}</Text>
                <Text className="text-sm text-[#666]">Response</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-black">${AGENT.hourlyRate}</Text>
                <Text className="text-sm text-[#666]">Per Hour</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View className="mt-6 px-6">
          <View className="rounded-[20px] bg-white p-6">
            <Text className="mb-3 text-xl font-bold text-black">About</Text>
            <Text className="leading-6 text-[#333]">{AGENT.bio}</Text>
          </View>
        </View>

        {/* Services Section */}
        <View className="mt-6 px-6">
          <View className="rounded-[20px] bg-white p-6">
            <Text className="mb-4 text-xl font-bold text-black">Services</Text>
            <View className="gap-4">
              {AGENT.services.map((service, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between border-b border-[#eee] pb-4 last:border-b-0">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black">{service.name}</Text>
                    <Text className="mt-1 text-sm text-[#666]">{service.duration}</Text>
                  </View>
                  <Text className="text-lg font-bold text-black">${service.price}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View className="mt-6 px-6">
          <View className="rounded-[20px] bg-white p-6">
            <Text className="mb-4 text-xl font-bold text-black">Contact</Text>
            <View className="gap-4">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]">
                  <Mail color="#000" size={20} />
                </View>
                <Text className="ml-3 flex-1 text-[#333]">{AGENT.email}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]">
                  <Phone color="#000" size={20} />
                </View>
                <Text className="ml-3 flex-1 text-[#333]">{AGENT.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reviews Carousel */}
        <View className="mt-6">
          <Text className="mb-4 px-6 text-xl font-bold text-white">Client Reviews</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 48}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {AGENT.reviews.map((review) => (
              <View
                key={review.id}
                className="rounded-[20px] bg-white p-6"
                style={{ width: width - 80 }}>
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-lg font-bold text-black">{review.author}</Text>
                  <View className="flex-row items-center">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} color="#000" size={16} fill="#000" />
                    ))}
                  </View>
                </View>
                <Text className="mb-3 text-sm text-[#666]">{review.date}</Text>
                <Text className="leading-6 text-[#333]">{review.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Availability Badge */}
        {AGENT.available && (
          <View className="mt-6 px-6">
            <View className="flex-row items-center rounded-[20px] border border-[#333] bg-[#111] p-4">
              <CheckCircle color="#fff" size={24} />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-white">Available Now</Text>
                <Text className="text-sm text-[#999]">Ready to take on new projects</Text>
              </View>
            </View>
          </View>
        )}
      </AnimatedScrollView>

      {/* Fixed Bottom CTA */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute bottom-0 left-0 right-0 border-t border-[#333] bg-black">
        <View className="flex-row gap-3 px-6 py-4">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full border border-[#333] bg-[#111] py-4"
            activeOpacity={0.7}>
            <View className="flex-row items-center">
              <Calendar color="#fff" size={20} />
              <Text className="ml-2 font-bold text-white">Schedule Call</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-white py-4"
            activeOpacity={0.7}>
            <Text className="font-bold text-black">Book Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
