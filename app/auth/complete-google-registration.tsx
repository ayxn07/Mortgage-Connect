import React, { useState, useEffect } from 'react';
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
import { Phone, User } from '@/components/Icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/src/store/authStore';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function CompleteGoogleRegistrationScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [phone, setPhone] = useState('');
    const firebaseUser = useAuthStore((s) => s.firebaseUser);
    const userDoc = useAuthStore((s) => s.userDoc);
    const pendingGoogleRegistration = useAuthStore((s) => s.pendingGoogleRegistration);
    const completeGoogleRegistration = useAuthStore((s) => s.completeGoogleRegistration);
    const loading = useAuthStore((s) => s.loading);
    const clearError = useAuthStore((s) => s.clearError);

    // Redirect if user already has a complete profile
    useEffect(() => {
        console.log('[CompleteRegistration] userDoc:', userDoc ? 'exists' : 'null');
        if (userDoc) {
            // User already has a Firestore document, redirect to home
            console.log('[CompleteRegistration] User doc exists, redirecting to home');
            router.replace('/(tabs)');
        }
    }, [userDoc, router]);

    const handleComplete = async () => {
        clearError();

        try {
            await completeGoogleRegistration(phone.trim() || undefined);
            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('Registration Failed', 'Failed to complete registration. Please try again.');
        }
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                <View className="w-10" />
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
                        Complete Your Profile
                    </Text>
                    <Text className={`mt-2 text-base ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Just a few more details to get started
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    {/* Display Name (read-only) */}
                    <View className="mb-4">
                        <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Full Name
                        </Text>
                        <View className={`flex-row items-center rounded-xl border-2 px-4 ${isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
                            }`}>
                            <User color={isDark ? '#666' : '#999'} size={18} />
                            <Text className={`flex-1 ml-3 py-3.5 text-base ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {firebaseUser?.displayName || 'User'}
                            </Text>
                        </View>
                    </View>

                    {/* Email (read-only) */}
                    <View className="mb-4">
                        <Text className={`mb-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Email
                        </Text>
                        <View className={`flex-row items-center rounded-xl border-2 px-4 ${isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
                            }`}>
                            <Text className={`flex-1 py-3.5 text-base ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {firebaseUser?.email}
                            </Text>
                        </View>
                    </View>

                    {/* Phone (optional) */}
                    <View className="mb-6">
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

                    {/* Complete Button */}
                    <TouchableOpacity
                        onPress={handleComplete}
                        disabled={loading}
                        activeOpacity={0.8}
                        className={`rounded-xl p-4 items-center justify-center ${isDark ? 'bg-white' : 'bg-black'
                            } ${loading ? 'opacity-70' : ''}`}>
                        {loading ? (
                            <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                        ) : (
                            <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                                Complete Registration
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Terms text */}
                    <Text className={`mt-4 text-center text-xs leading-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        By continuing, you agree to our{' '}
                        <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Terms of Service</Text>
                        {' '}and{' '}
                        <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Privacy Policy</Text>
                    </Text>
                </Animated.View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
