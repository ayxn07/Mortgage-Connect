import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Mail, MessageCircle, MapPin, ChevronDown, Send, ArrowLeft } from '@/components/Icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I book an agent?',
    answer:
      'Browse our agents, select your preferred professional, and click "Book Now" on their profile. Choose your service, date, and time to complete the booking.',
  },
  {
    id: '2',
    question: 'What is your cancellation policy?',
    answer:
      'You can cancel up to 24 hours before your appointment for a full refund. Cancellations within 24 hours are subject to a 50% fee.',
  },
  {
    id: '3',
    question: 'How do I contact my agent?',
    answer:
      'Once booked, you can message your agent directly through the app. Their contact information will also be available in your booking confirmation.',
  },
  {
    id: '4',
    question: 'Are agents verified?',
    answer:
      'Yes, all agents undergo a thorough verification process including background checks, credential verification, and skills assessment.',
  },
  {
    id: '5',
    question: 'How do payments work?',
    answer:
      'Payments are processed securely through the app. Your card is charged after the service is completed. We support all major credit cards and digital wallets.',
  },
];

function FAQItem({ faq, isDark }: { faq: FAQ; isDark: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const heightValue = useSharedValue(0);
  const rotateValue = useSharedValue(0);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    heightValue.value = withSpring(!isExpanded ? 1 : 0, {
      damping: 20,
      stiffness: 150,
    });
    rotateValue.value = withTiming(!isExpanded ? 1 : 0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(heightValue.value, [0, 1], [0, 150]),
    opacity: heightValue.value,
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotateValue.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View className={`mb-3 overflow-hidden rounded-2xl border ${
      isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
    }`}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        className="flex-row items-center justify-between p-4">
        <Text className={`flex-1 pr-4 font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {faq.question}
        </Text>
        <Animated.View style={rotateStyle}>
          <ChevronDown color={isDark ? '#666' : '#999'} size={20} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={animatedStyle}>
        <View className="px-4 pb-4">
          <Text className={`leading-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {faq.answer}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default function SupportScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@luxe.com');
  };

  const handleChat = () => {
    Alert.alert('Live Chat', 'Opening live chat...');
  };

  const handleSubmit = () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', "Your feedback has been submitted. We'll get back to you soon!");
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-2 pb-6">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <ArrowLeft color={isDark ? '#fff' : '#000'} size={24} />
          </TouchableOpacity>
          <View>
            <Text className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              We're here to help
            </Text>
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Support
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        
        {/* Quick Contact Buttons */}
        <View className="mb-6">
          <Text className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Quick Contact
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.7}
              className={`flex-1 items-center rounded-2xl border p-4 ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <View className={`mb-2 h-12 w-12 items-center justify-center rounded-full ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
                <Phone color={isDark ? '#000' : '#fff'} size={20} />
              </View>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Call
              </Text>
              <Text className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                24/7 Support
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEmail}
              activeOpacity={0.7}
              className={`flex-1 items-center rounded-2xl border p-4 ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <View className={`mb-2 h-12 w-12 items-center justify-center rounded-full ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
                <Mail color={isDark ? '#000' : '#fff'} size={20} />
              </View>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Email
              </Text>
              <Text className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Reply in 2h
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChat}
              activeOpacity={0.7}
              className={`flex-1 items-center rounded-2xl border p-4 ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <View className={`mb-2 h-12 w-12 items-center justify-center rounded-full ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
                <MessageCircle color={isDark ? '#000' : '#fff'} size={20} />
              </View>
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                Chat
              </Text>
              <Text className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Live Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="mb-6">
          <Text className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Frequently Asked Questions
          </Text>
          {faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} isDark={isDark} />
          ))}
        </View>

        {/* Feedback Form */}
        <View>
          <Text className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Send Feedback
          </Text>
          <View className={`gap-4 rounded-2xl border p-5 ${
            isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
          }`}>
            <View>
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                className={`rounded-xl border-2 px-4 py-3 text-base ${
                  isDark 
                    ? 'border-[#333] bg-[#0a0a0a] text-white' 
                    : 'border-gray-200 bg-gray-50 text-black'
                }`}
              />
            </View>

            <View>
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
                className={`rounded-xl border-2 px-4 py-3 text-base ${
                  isDark 
                    ? 'border-[#333] bg-[#0a0a0a] text-white' 
                    : 'border-gray-200 bg-gray-50 text-black'
                }`}
              />
            </View>

            <View>
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Message
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what you think..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className={`rounded-xl border-2 px-4 py-3 text-base min-h-[100px] ${
                  isDark 
                    ? 'border-[#333] bg-[#0a0a0a] text-white' 
                    : 'border-gray-200 bg-gray-50 text-black'
                }`}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              className={`flex-row items-center justify-center gap-2 rounded-xl p-4 ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Send color={isDark ? '#000' : '#fff'} size={20} />
              <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Submit Feedback
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
