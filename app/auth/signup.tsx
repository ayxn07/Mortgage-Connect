import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Mail, Lock, User, Phone, ArrowLeft } from '@/components/Icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/src/store/authStore';
import { isValidEmail, isValidPassword, getPasswordStrength } from '@/src/utils/validators';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Haptics from 'expo-haptics';

export default function SignupScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const clearError = useAuthStore((s) => s.clearError);

  const passwordStrength = getPasswordStrength(password);

  const strengthColors: Record<string, string> = {
    Weak: '#ef4444',
    Fair: '#f59e0b',
    Good: '#3b82f6',
    Strong: '#10b981',
    'Very Strong': '#10b981',
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    clearError();
    if (!validate()) return;

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
      });
      // Redirect to OTP verification
      router.push({
        pathname: '/auth/verify-otp',
        params: { email: email.trim(), type: 'signup' }
      });
    } catch (err: any) {
      let message = 'Signup failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      Alert.alert('Signup Failed', message);
    }
  };

  const clearFieldError = (field: string) => {
    setErrors((e) => {
      const copy = { ...e };
      delete copy[field];
      return copy;
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
          <ArrowLeft color={isDark ? '#fff' : '#000'} size={20} />
        </TouchableOpacity>
        <View />
        <ThemeToggle />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={20}
        enableOnAndroid={true}
        style={{ flex: 1 }}>

        {/* Header Text */}
        <Animated.View entering={FadeInUp.duration(600)} className="mb-8 mt-4">
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Create Account
          </Text>
          <Text className={`mt-2 text-base ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Join the premium mortgage platform
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          {/* Full Name */}
          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Full Name
            </Text>
            <View className={`flex-row items-center rounded-xl border-2 px-4 ${errors.displayName
              ? 'border-red-500'
              : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
              <User color={isDark ? '#666' : '#999'} size={18} />
              <TextInput
                value={displayName}
                onChangeText={(t) => { setDisplayName(t); clearFieldError('displayName'); }}
                placeholder="John Doe"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                autoCapitalize="words"
                className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
              />
            </View>
            {errors.displayName && (
              <Text className="mt-1 text-xs text-red-500">{errors.displayName}</Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </Text>
            <View className={`flex-row items-center rounded-xl border-2 px-4 ${errors.email
              ? 'border-red-500'
              : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
              <Mail color={isDark ? '#666' : '#999'} size={18} />
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
                placeholder="your@email.com"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
              />
            </View>
            {errors.email && (
              <Text className="mt-1 text-xs text-red-500">{errors.email}</Text>
            )}
          </View>

          {/* Phone (optional) */}
          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Phone{' '}
              <Text className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>(optional)</Text>
            </Text>
            <View className={`flex-row items-center rounded-xl border-2 px-4 ${isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
              <Phone color={isDark ? '#666' : '#999'} size={18} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+971 50 123 4567"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                keyboardType="phone-pad"
                className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </Text>
            <View className={`flex-row items-center rounded-xl border-2 px-4 ${errors.password
              ? 'border-red-500'
              : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
              <Lock color={isDark ? '#666' : '#999'} size={18} />
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
                placeholder="Create a password"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                secureTextEntry={!showPassword}
                className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="mt-1 text-xs text-red-500">{errors.password}</Text>
            )}
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View className="mt-2">
                <View className="flex-row gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      className="flex-1 h-1 rounded-full"
                      style={{
                        backgroundColor:
                          i <= passwordStrength.score
                            ? strengthColors[passwordStrength.label]
                            : isDark ? '#333' : '#e5e5e5',
                      }}
                    />
                  ))}
                </View>
                <Text
                  className="mt-1 text-xs"
                  style={{ color: strengthColors[passwordStrength.label] }}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirm Password
            </Text>
            <View className={`flex-row items-center rounded-xl border-2 px-4 ${errors.confirmPassword
              ? 'border-red-500'
              : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
              <Lock color={isDark ? '#666' : '#999'} size={18} />
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                placeholder="Re-enter your password"
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                secureTextEntry={!showPassword}
                className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-white' : 'text-black'}`}
              />
            </View>
            {errors.confirmPassword && (
              <Text className="mt-1 text-xs text-red-500">{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
            className={`rounded-xl p-4 items-center justify-center ${isDark ? 'bg-white' : 'bg-black'
              } ${loading ? 'opacity-70' : ''}`}>
            {loading ? (
              <ActivityIndicator color={isDark ? '#000' : '#fff'} />
            ) : (
              <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Terms text */}
          <Text className={`mt-4 text-center text-xs leading-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            By signing up, you agree to our{' '}
            <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Terms of Service</Text>
            {' '}and{' '}
            <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Privacy Policy</Text>
          </Text>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className={`flex-1 h-px ${isDark ? 'bg-[#333]' : 'bg-gray-200'}`} />
            <Text className={`mx-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              or
            </Text>
            <View className={`flex-1 h-px ${isDark ? 'bg-[#333]' : 'bg-gray-200'}`} />
          </View>

          {/* Sign In Link */}
          <View className="flex-row items-center justify-center">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
