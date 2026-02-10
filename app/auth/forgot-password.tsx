import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Mail, ArrowLeft, CheckCircle } from '@/components/Icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/src/store/authStore';
import { isValidEmail } from '@/src/utils/validators';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);
  const clearError = useAuthStore((s) => s.clearError);

  const handleReset = async () => {
    clearError();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      let message = 'Failed to send reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      Alert.alert('Error', message);
    }
  };

  if (sent) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
          </TouchableOpacity>
          <View />
          <ThemeToggle />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeInUp.duration(600)} className="items-center">
            <View className={`h-20 w-20 items-center justify-center rounded-full mb-6 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
            }`}>
              <CheckCircle color={isDark ? '#10b981' : '#10b981'} size={40} />
            </View>
            <Text className={`text-2xl font-bold text-center mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
              Check Your Email
            </Text>
            <Text className={`text-center text-base leading-6 mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              We've sent a password reset link to{'\n'}
              <Text className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{email}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              className={`rounded-xl px-8 py-4 ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setSent(false); }}
              className="mt-4">
              <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Didn't receive it? Try again
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-white'
          }`}>
          <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
        </TouchableOpacity>
        <View />
        <ThemeToggle />
      </View>

      <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          extraScrollHeight={20}
          enableOnAndroid={true}
          style={{ flex: 1 }}>

          {/* Header Text */}
          <Animated.View entering={FadeInUp.duration(600)} className="mb-8">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Reset Password
            </Text>
            <Text className={`mt-3 text-base leading-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            {/* Email */}
            <View className="mb-6">
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address
              </Text>
              <View className={`flex-row items-center rounded-xl border-2 px-4 ${
                emailError
                  ? 'border-red-500'
                  : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
                <Mail color={isDark ? '#666' : '#999'} size={18} />
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#555' : '#aaa'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
                />
              </View>
              {emailError && (
                <Text className="mt-1 text-xs text-red-500">{emailError}</Text>
              )}
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
              className={`rounded-xl p-4 items-center justify-center ${
                isDark ? 'bg-white' : 'bg-black'
              } ${loading ? 'opacity-70' : ''}`}>
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 items-center">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Remember your password?{' '}
                <Text className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
