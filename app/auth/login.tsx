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
import { Mail, Lock } from '@/components/Icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/src/store/authStore';
import { isValidEmail } from '@/src/utils/validators';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function LoginScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const clearError = useAuthStore((s) => s.clearError);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      let message = 'Login failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      }
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header with theme toggle */}
      <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
        <View className="w-10" />
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
          
          {/* Logo */}
          <Animated.View entering={FadeInUp.duration(600)} className="items-center mb-10  ">
            <View >
              <Image 
                source={require('@/assets/images/splash-icon.png')} 
                style={{ width: 220, height: 160 , borderRadius: 30,  backgroundColor: '#000'}}
                resizeMode="contain"
              />
            </View>
           
      
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            {/* Email */}
            <View className="mb-4">
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </Text>
              <View className={`flex-row items-center rounded-xl border-2 px-4 ${
                errors.email
                  ? 'border-red-500'
                  : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
                <Mail color={isDark ? '#666' : '#999'} size={18} />
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
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

            {/* Password */}
            <View className="mb-4">
              <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </Text>
              <View className={`flex-row items-center rounded-xl border-2 px-4 ${
                errors.password
                  ? 'border-red-500'
                  : isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
              }`}>
                <Lock color={isDark ? '#666' : '#999'} size={18} />
                <TextInput
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                  placeholder="Enter your password"
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
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              className="mb-6 self-end">
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              className={`rounded-xl p-4 items-center justify-center ${
                isDark ? 'bg-white' : 'bg-black'
              } ${loading ? 'opacity-70' : ''}`}>
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className={`flex-1 h-px ${isDark ? 'bg-[#333]' : 'bg-gray-200'}`} />
              <Text className={`mx-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                or
              </Text>
              <View className={`flex-1 h-px ${isDark ? 'bg-[#333]' : 'bg-gray-200'}`} />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/signup')}>
                <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
