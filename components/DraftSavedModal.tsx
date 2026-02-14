import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DraftSavedModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function DraftSavedModal({ visible, onClose, isDark }: DraftSavedModalProps) {
  const router = useRouter();

  const handleGoToApplications = () => {
    onClose();
    router.push('/my-applications' as any);
  };

  const handleGoHome = () => {
    onClose();
    router.push('/(tabs)/' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        className="flex-1 bg-black/60 justify-center items-center px-6">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
        />
        
        <Animated.View
          entering={FadeInDown.duration(300)}
          className={`w-full max-w-sm rounded-3xl p-6 ${
            isDark ? 'bg-[#111]' : 'bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}>
          {/* Success Icon */}
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-3">
              <Feather name="check-circle" size={32} color="#22c55e" />
            </View>
            <Text className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-black'}`}>
              Draft Saved!
            </Text>
          </View>

          {/* Message */}
          <Text className={`text-sm text-center mb-6 leading-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your application has been saved as a draft. You can continue it anytime from "My Applications".
          </Text>

          {/* Buttons */}
          <View className="gap-3">
            {/* Go to My Applications */}
            <Pressable
              onPress={handleGoToApplications}
              className={`rounded-2xl py-3.5 items-center ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Text className={`text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                Go to My Applications
              </Text>
            </Pressable>

            {/* Go Home */}
            <Pressable
              onPress={handleGoHome}
              className={`rounded-2xl py-3.5 items-center border ${
                isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Text className={`text-base font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Back to Home
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
