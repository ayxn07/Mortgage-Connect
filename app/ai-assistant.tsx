/**
 * AI Mortgage Assistant Screen
 *
 * A hybrid conversational + calculator interface that provides
 * UAE-specific mortgage guidance with interactive calculator flows.
 *
 * This is an experimental feature gated behind a feature flag.
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAIChatStore } from '@/src/store/aiChatStore';
import { useAuthStore } from '@/src/store/authStore';
import { MessageRenderer, TypingIndicator } from '@/components/AIChatComponents';
import type { AIMessage } from '@/src/types/aiChat';

export default function AIAssistantScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<AIMessage>>(null);
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Calculate conditional bottom padding
  // When keyboard is open: use reduced inset (40% of original or min 8px)
  // When keyboard is closed: use full bottom inset
  const bottomPadding = isKeyboardVisible
    ? Math.max(insets.bottom * 0.4, 8)
    : insets.bottom;

  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  // Store state
  const messages = useAIChatStore((s) => s.messages);
  const loading = useAIChatStore((s) => s.loading);
  const activeFlow = useAIChatStore((s) => s.activeFlow);
  const error = useAIChatStore((s) => s.error);
  const initialize = useAIChatStore((s) => s.initialize);
  const sendMessage = useAIChatStore((s) => s.sendMessage);
  const selectOption = useAIChatStore((s) => s.selectOption);
  const submitInput = useAIChatStore((s) => s.submitInput);
  const handleResultAction = useAIChatStore((s) => s.handleResultAction);
  const cancelFlow = useAIChatStore((s) => s.cancelFlow);
  const clearChat = useAIChatStore((s) => s.clearChat);
  const clearError = useAIChatStore((s) => s.clearError);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text, firebaseUser?.uid);
  }, [inputText, sendMessage, firebaseUser?.uid]);

  const handleSelectOption = useCallback(
    (value: string | number) => {
      selectOption(value);
    },
    [selectOption]
  );

  const handleSubmitInput = useCallback(
    (key: string, value: number | string) => {
      submitInput(key, value);
    },
    [submitInput]
  );

  const handleResultActionPress = useCallback(
    (actionValue: string) => {
      handleResultAction(actionValue);
    },
    [handleResultAction]
  );

  // ─── Render Message ──────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: AIMessage }) => (
      <MessageRenderer
        message={item}
        isDark={isDark}
        onSelectOption={handleSelectOption}
        onSubmitInput={handleSubmitInput}
        onResultAction={handleResultActionPress}
      />
    ),
    [isDark, handleSelectOption, handleSubmitInput, handleResultActionPress]
  );

  const keyExtractor = useCallback((item: AIMessage) => item.id, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}>
          <View style={{ flex: 1 }}>
          {/* ── Header ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(300)}>
          <View
            className={`flex-row items-center border-b px-4 py-3 ${
              isDark ? 'border-[#1a1a1a]' : 'border-gray-100'
            }`}>
            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
              }`}>
              <Feather name="arrow-left" size={20} color={isDark ? '#fff' : '#000'} />
            </Pressable>

            {/* AI avatar + title */}
            <View
              className={`mr-2.5 h-9 w-9 items-center justify-center rounded-full ${
                isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
              }`}>
              <Feather name="cpu" size={16} color={isDark ? '#8b5cf6' : '#6366f1'} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  AI Assistant
                </Text>
                <View
                  className={`rounded px-1.5 py-0.5 ${
                    isDark ? 'bg-[#6366f1]/20' : 'bg-indigo-50'
                  }`}>
                  <Text className="text-[9px] font-bold text-[#6366f1]">BETA</Text>
                </View>
              </View>
              <Text className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                UAE mortgage expert &amp; calculator
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row gap-1">
              {/* Cancel flow button */}
              {activeFlow && (
                <Pressable
                  onPress={cancelFlow}
                  className={`h-9 w-9 items-center justify-center rounded-full ${
                    isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                  }`}>
                  <Feather name="x" size={16} color={isDark ? '#ef4444' : '#dc2626'} />
                </Pressable>
              )}
              {/* Clear chat */}
              <Pressable
                onPress={clearChat}
                className={`h-9 w-9 items-center justify-center rounded-full ${
                  isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                }`}>
                <Feather name="trash-2" size={15} color={isDark ? '#666' : '#999'} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ── Experimental Banner ───────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <View
            className={`mx-4 mb-1 mt-3 flex-row items-center rounded-xl px-3 py-2 ${
              isDark ? 'bg-[#6366f1]/10' : 'bg-indigo-50'
            }`}>
            <Feather name="zap" size={12} color="#6366f1" style={{ marginRight: 6 }} />
            <Text className="flex-1 text-[11px] font-medium text-[#6366f1]">
              Experimental feature — AI responses may not always be accurate. Always verify
              important information.
            </Text>
          </View>
        </Animated.View>

        {/* ── Message List ──────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            <>
              {loading && <TypingIndicator isDark={isDark} />}
              {error && (
                <Animated.View entering={FadeIn.duration(200)} className="mb-2 px-4">
                  <Pressable
                    onPress={clearError}
                    className={`flex-row items-center rounded-xl px-3 py-2 ${
                      isDark ? 'bg-red-500/10' : 'bg-red-50'
                    }`}>
                    <Feather
                      name="alert-circle"
                      size={12}
                      color="#ef4444"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="flex-1 text-[11px] text-red-500">{error}</Text>
                    <Feather name="x" size={12} color="#ef4444" />
                  </Pressable>
                </Animated.View>
              )}
            </>
          }
        />

        {/* ── Input Bar ─────────────────────────────────────────────── */}
        <View
          className={`border-t px-4 pt-3 ${
            isDark ? 'border-[#1a1a1a] bg-black' : 'border-gray-100 bg-gray-50'
          }`}
          style={{ paddingBottom: bottomPadding }}>
          <View className="flex-row items-end gap-2">
            <View
              className={`flex-1 flex-row items-end rounded-2xl border px-3 py-2 ${
                isDark ? 'border-[#222] bg-[#111]' : 'border-gray-200 bg-white'
              }`}
              style={{ minHeight: 44, maxHeight: 120 }}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  activeFlow
                    ? 'Type a value or pick an option above...'
                    : 'Ask about UAE mortgages...'
                }
                placeholderTextColor={isDark ? '#555' : '#aaa'}
                multiline
                returnKeyType="default"
                blurOnSubmit={false}
                className={`flex-1 text-[15px] ${isDark ? 'text-white' : 'text-black'}`}
                style={{
                  padding: 0,
                  paddingTop: Platform.OS === 'ios' ? 2 : 0,
                  maxHeight: 100,
                }}
              />
            </View>

            {/* Send button */}
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                inputText.trim() && !loading
                  ? isDark
                    ? 'bg-white'
                    : 'bg-black'
                  : isDark
                    ? 'bg-[#1a1a1a]'
                    : 'bg-gray-200'
              }`}>
              <Feather
                name="arrow-up"
                size={18}
                color={
                  inputText.trim() && !loading
                    ? isDark
                      ? '#000'
                      : '#fff'
                    : isDark
                      ? '#555'
                      : '#aaa'
                }
              />
            </Pressable>
          </View>
        </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}
