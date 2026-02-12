import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft } from '@/components/Icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { verifyOTP, resendOTP } from '@/src/services/otp';
import { useAuthStore } from '@/src/store/authStore';
import * as Haptics from 'expo-haptics';

export default function VerifyOTPScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ email: string; type: 'login' | 'signup' }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const completeSignIn = useAuthStore((s) => s.completeSignIn);
    const completeSignUp = useAuthStore((s) => s.completeSignUp);

    useEffect(() => {
        if (!params.email) {
            router.replace('/auth/login');
        }
    }, [params.email]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (index: number, key: string) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter all 6 digits');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setLoading(true);

        try {
            await verifyOTP(params.email!, otpCode);

            // Complete the sign-in or sign-up process
            if (params.type === 'signup') {
                await completeSignUp();
            } else {
                await completeSignIn(params.email!);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(tabs)');
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = err.message || 'Invalid OTP. Please try again.';
            Alert.alert('Verification Failed', message);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setResending(true);

        try {
            await resendOTP(params.email!);
            setCountdown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = err.message || 'Failed to resend OTP. Please try again.';
            Alert.alert('Resend Failed', message);
        } finally {
            setResending(false);
        }
    };

    if (!params.email) return null;

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

            <View className="flex-1 px-6 justify-center">
                {/* Header Text */}
                <Animated.View entering={FadeInUp.duration(600)} className="mb-10">
                    <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        Verify Your Email
                    </Text>
                    <Text className={`mt-3 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        We've sent a 6-digit code to
                    </Text>
                    <Text className={`mt-1 text-base font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                        {params.email}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    {/* OTP Input */}
                    <View className="flex-row justify-between mb-8">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                value={digit}
                                onChangeText={(value) => handleChange(index, value)}
                                onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!loading}
                                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 ${digit
                                    ? isDark
                                        ? 'border-white bg-[#1a1a1a] text-white'
                                        : 'border-black bg-white text-black'
                                    : isDark
                                        ? 'border-[#333] bg-[#1a1a1a] text-white'
                                        : 'border-gray-200 bg-white text-black'
                                    }`}
                            />
                        ))}
                    </View>

                    {/* Resend Section */}
                    <View className="mb-8">
                        {countdown > 0 ? (
                            <Text className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Resend code in {countdown}s
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                <Text
                                    className={`text-center text-sm font-medium ${resending
                                        ? isDark
                                            ? 'text-gray-600'
                                            : 'text-gray-300'
                                        : isDark
                                            ? 'text-white'
                                            : 'text-black'
                                        }`}>
                                    {resending ? 'Sending...' : 'Resend code'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading || otp.some((d) => !d)}
                        activeOpacity={0.8}
                        className={`rounded-xl p-4 items-center justify-center ${isDark ? 'bg-white' : 'bg-black'
                            } ${loading || otp.some((d) => !d) ? 'opacity-50' : ''}`}>
                        {loading ? (
                            <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                        ) : (
                            <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                                Verify & Continue
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Help Text */}
                    <Text className={`mt-6 text-center text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        Didn't receive the code? Check your spam folder or request a new one.
                    </Text>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}
