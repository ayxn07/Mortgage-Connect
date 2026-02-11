import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Linking, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Phone, Mail, MessageCircle, MapPin, ChevronDown, Send, ArrowLeft, RefreshCw } from '@/components/Icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useSupportStore } from '@/src/store/supportStore';
import type { FAQ } from '@/src/types';

function FAQItem({ faq, isDark }: { faq: FAQ; isDark: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const heightValue = useSharedValue(0);
  const rotateValue = useSharedValue(0);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    heightValue.value = withTiming(!isExpanded ? 1 : 0, {
      duration: 300,
    });
    rotateValue.value = withTiming(!isExpanded ? 1 : 0, { 
      duration: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value * 100,
    opacity: heightValue.value,
    overflow: 'hidden',
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

  // Auth store — pre-fill name & email
  const { userDoc, firebaseUser } = useAuthStore();

  // Support store — FAQs + form submission
  const { faqs, submitting, submitQuery, lastSubmittedId, clearLastSubmitted, queries, fetchQueries, loading, error } = useSupportStore();

  const [name, setName] = useState(userDoc?.displayName ?? firebaseUser?.displayName ?? '');
  const [email, setEmail] = useState(userDoc?.email ?? firebaseUser?.email ?? '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pre-fill fields when userDoc loads
  useEffect(() => {
    if (userDoc) {
      if (!name) setName(userDoc.displayName ?? '');
      if (!email) setEmail(userDoc.email ?? '');
    }
  }, [userDoc]);

  // Fetch user's support queries
  useEffect(() => {
    if (firebaseUser?.uid) {
      console.log('Fetching queries for user:', firebaseUser.uid);
      fetchQueries(firebaseUser.uid);
    } else {
      console.log('No firebase user found');
    }
  }, [firebaseUser?.uid, fetchQueries]);

  // Debug: Log queries when they change
  useEffect(() => {
    console.log('Support queries loaded:', queries);
    console.log('Loading state:', loading);
    console.log('Error state:', error);
  }, [queries, loading, error]);

  const handleRefresh = async () => {
    if (!firebaseUser?.uid) {
      Alert.alert('Error', 'You must be logged in to refresh tickets');
      return;
    }
    setRefreshing(true);
    try {
      await fetchQueries(firebaseUser.uid);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@mortgageconnect.ae');
  };

  const handleChat = () => {
    Alert.alert('Live Chat', 'Opening live chat...');
  };

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const uid = firebaseUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'You must be logged in to submit feedback.');
      return;
    }

    try {
      await submitQuery(uid, {
        category: 'feedback',
        name,
        email,
        subject: 'App Feedback',
        message,
      });
      setSubmitted(true);
      setMessage('');
      // Refresh tickets after submission
      setTimeout(() => {
        fetchQueries(uid);
      }, 1000);
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
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

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        enableOnAndroid={true}
        enableAutomaticScroll={true}>
        
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

        {/* Feedback Form */}
        <View className="mb-6">
          <Text className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Send Feedback
          </Text>

          {submitted ? (
            <View className={`items-center gap-4 rounded-2xl border p-8 ${
              isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
            }`}>
              <View className="w-16 h-16 rounded-full bg-green-500/10 items-center justify-center">
                <Text className="text-3xl">✓</Text>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Feedback Submitted
              </Text>
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Thank you! We'll get back to you soon.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSubmitted(false);
                  clearLastSubmitted();
                }}
                activeOpacity={0.8}
                className={`mt-2 rounded-xl px-6 py-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
                <Text className={`font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                  Send Another
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
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
              disabled={submitting}
              activeOpacity={0.8}
              className={`flex-row items-center justify-center gap-2 rounded-xl p-4 ${
                submitting ? 'opacity-60' : ''
              } ${isDark ? 'bg-white' : 'bg-black'}`}>
              {submitting ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" />
              ) : (
                <Send color={isDark ? '#000' : '#fff'} size={20} />
              )}
              <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* FAQ Section */}
        <View className="mb-6">
          <Text className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Frequently Asked Questions
          </Text>
          {faqs.map((faq: FAQ) => (
            <FAQItem key={faq.id} faq={faq} isDark={isDark} />
          ))}
        </View>

        {/* My Tickets Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              My Tickets
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              activeOpacity={0.7}
              className={`flex-row items-center gap-2 px-3 py-2 rounded-xl ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-white'
              } border ${isDark ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
              {refreshing ? (
                <ActivityIndicator color={isDark ? '#fff' : '#000'} size="small" />
              ) : (
                <RefreshCw color={isDark ? '#fff' : '#000'} size={16} />
              )}
              <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <View className={`mb-3 p-4 rounded-2xl border ${
              isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'
            }`}>
              <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                Error loading tickets: {error}
              </Text>
              <TouchableOpacity onPress={handleRefresh} className="mt-2">
                <Text className={`text-xs font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                  Tap to retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {loading ? (
            <View className={`p-8 rounded-2xl border ${
              isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
            }`}>
              <ActivityIndicator color={isDark ? '#fff' : '#000'} size="large" />
              <Text className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading your tickets...
              </Text>
            </View>
          ) : queries.length === 0 ? (
            <View className={`p-8 rounded-2xl border ${
              isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
            }`}>
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No support tickets yet. Submit feedback above to get started!
              </Text>
            </View>
          ) : (
            queries.map((ticket) => {
              const isExpanded = expandedTicket === ticket.queryId;
              const statusColors = {
                open: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
                in_progress: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
                resolved: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
                closed: isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700',
              };
              const statusColor = statusColors[ticket.status as keyof typeof statusColors] || statusColors.open;

              return (
                <View
                  key={ticket.queryId}
                  className={`mb-3 overflow-hidden rounded-2xl border ${
                    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
                  }`}>
                  <TouchableOpacity
                    onPress={() => setExpandedTicket(isExpanded ? null : ticket.queryId)}
                    activeOpacity={0.7}
                    className="p-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <Text className={`flex-1 pr-4 font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        {ticket.subject}
                      </Text>
                      <View className={`px-2 py-1 rounded-full ${statusColor}`}>
                        <Text className="text-xs font-medium capitalize">
                          {ticket.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {ticket.createdAt?.toDate?.() 
                        ? new Date(ticket.createdAt.toDate()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently'}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                      <View className="pt-4">
                        <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Your Message
                        </Text>
                        <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {ticket.message}
                        </Text>
                      </View>

                      {ticket.adminResponse && (
                        <View className={`mt-4 p-3 rounded-xl ${
                          isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                        }`}>
                          <View className="flex-row items-center mb-2">
                            <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${
                              isDark ? 'bg-blue-500/20' : 'bg-blue-200'
                            }`}>
                              <Text className="text-xs">👤</Text>
                            </View>
                            <Text className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                              Admin Response
                            </Text>
                          </View>
                          <Text className={`text-sm leading-6 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                            {ticket.adminResponse}
                          </Text>
                        </View>
                      )}

                      {!ticket.adminResponse && ticket.status !== 'closed' && (
                        <View className={`mt-4 p-3 rounded-xl ${
                          isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'
                        }`}>
                          <Text className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            ⏳ Waiting for admin response...
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
