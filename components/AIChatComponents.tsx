/**
 * AI Chat UI Components — Interactive cards, inputs, results, and chat bubbles
 * for the AI Mortgage Assistant.
 *
 * Matches the app's premium design scheme with dark/light mode support.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import type { AIMessage, AIInteraction } from '@/src/types/aiChat';

// =====================================================================
// Chat Bubble
// =====================================================================

interface ChatBubbleProps {
  message: AIMessage;
  isDark: boolean;
}

// Helper function to parse **bold** markdown syntax
function parseMarkdownBold(text: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    // Add the bold part
    parts.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length > 0 ? parts : [{ text, bold: false }];
}

export function ChatBubble({ message, isDark }: ChatBubbleProps): React.ReactElement {
  const isUser = message.senderId === 'user';
  const textParts = parseMarkdownBold(message.text || '');

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
      {!isUser && (
        <View
          className={`mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
          }`}>
          <Feather name="cpu" size={14} color={isDark ? '#8b5cf6' : '#6366f1'} />
        </View>
      )}
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? isDark
              ? 'bg-white'
              : 'bg-black'
            : isDark
              ? 'border border-[#2a2a2a] bg-[#1a1a1a]'
              : 'border border-gray-100 bg-white'
        }`}
        style={isUser ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }}>
        <Text
          className={`text-[15px] leading-[22px] ${
            isUser
              ? isDark
                ? 'text-black'
                : 'text-white'
              : isDark
                ? 'text-gray-200'
                : 'text-gray-800'
          }`}>
          {textParts.map((part, index) => (
            <Text
              key={index}
              style={part.bold ? { fontWeight: '700' } : undefined}>
              {part.text}
            </Text>
          ))}
        </Text>
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Typing Indicator
// =====================================================================

export function TypingIndicator({ isDark }: { isDark: boolean }): React.ReactElement {
  return (
    <Animated.View entering={FadeIn.duration(300)} className={`mb-2 flex-row items-center px-4`}>
      <View
        className={`mr-2 h-8 w-8 items-center justify-center rounded-full ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
        }`}>
        <Feather name="cpu" size={14} color={isDark ? '#8b5cf6' : '#6366f1'} />
      </View>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isDark ? 'border border-[#2a2a2a] bg-[#1a1a1a]' : 'border border-gray-100 bg-white'
        }`}
        style={{ borderBottomLeftRadius: 6 }}>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Thinking...
        </Text>
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Calculator Menu Card (2x3 grid)
// =====================================================================

interface CalculatorMenuProps {
  interaction: AIInteraction;
  onSelect: (value: string | number) => void;
  isDark: boolean;
}

export function CalculatorMenu({
  interaction,
  onSelect,
  isDark,
}: CalculatorMenuProps): React.ReactElement {
  const options = interaction.options || [];

  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-2 ml-10 px-4">
      <View className="flex-row flex-wrap gap-2">
        {options.map((option, index) => (
          <Pressable
            key={String(option.value)}
            onPress={() => onSelect(option.value)}
            className={`rounded-2xl border p-3.5 ${
              isDark ? 'border-[#222] bg-[#111]' : 'border-gray-100 bg-white'
            }`}
            style={{ width: '48%' }}>
            <View
              className="mb-2.5 h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${option.color || '#6366f1'}15` }}>
              <Feather
                name={(option.icon || 'grid') as any}
                size={18}
                color={option.color || '#6366f1'}
              />
            </View>
            <Text
              className={`mb-0.5 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              {option.label}
            </Text>
            {option.description && (
              <Text className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {option.description}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Parameter Input Card
// =====================================================================

interface ParameterInputProps {
  interaction: AIInteraction;
  onSubmit: (key: string, value: number) => void;
  isDark: boolean;
}

export function ParameterInput({
  interaction,
  onSubmit,
  isDark,
}: ParameterInputProps): React.ReactElement {
  const config = interaction.inputConfig!;
  const [value, setValue] = useState(config.defaultValue ? String(config.defaultValue) : '');

  const handleSubmit = useCallback(() => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue) && numValue >= (config.min || 0)) {
      onSubmit(config.key, numValue);
    }
  }, [value, config, onSubmit]);

  const handleQuickValue = useCallback(
    (quickValue: number) => {
      onSubmit(config.key, quickValue);
    },
    [config.key, onSubmit]
  );

  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-2 ml-10 px-4">
      <View
        className={`rounded-2xl border p-4 ${
          isDark ? 'border-[#222] bg-[#111]' : 'border-gray-100 bg-white'
        }`}>
        {/* Progress */}
        {interaction.step && interaction.totalSteps && (
          <View className="mb-3">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text
                className={`text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Step {interaction.step} of {interaction.totalSteps}
              </Text>
            </View>
            <View className={`h-1 rounded-full ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
              <View
                className="h-1 rounded-full bg-[#6366f1]"
                style={{
                  width: `${(interaction.step / interaction.totalSteps) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Label */}
        <Text className={`mb-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {config.label}
        </Text>

        {/* Input */}
        <View
          className={`mb-3 flex-row items-center rounded-xl border px-3 py-2.5 ${
            isDark ? 'border-[#333] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'
          }`}>
          {config.prefix && (
            <Text
              className={`mr-2 text-sm font-semibold ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {config.prefix}
            </Text>
          )}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={config.placeholder || 'Enter value'}
            placeholderTextColor={isDark ? '#555' : '#aaa'}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            className={`flex-1 text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}
            style={{ padding: 0 }}
          />
          {config.suffix && (
            <Text
              className={`ml-2 text-sm font-semibold ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {config.suffix}
            </Text>
          )}
        </View>

        {/* Quick Values */}
        {config.quickValues && config.quickValues.length > 0 && (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {config.quickValues.map((qv) => (
              <Pressable
                key={qv.value}
                onPress={() => handleQuickValue(qv.value)}
                className={`rounded-lg border px-3 py-2 ${
                  isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                }`}>
                <Text
                  className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {qv.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Helper Text */}
        {config.helperText && (
          <Text className={`mb-3 text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {config.helperText}
          </Text>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          className={`items-center rounded-xl py-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
          <Text className={`text-sm font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Slider Input Card
// =====================================================================

interface SliderInputProps {
  interaction: AIInteraction;
  onSubmit: (key: string, value: number) => void;
  isDark: boolean;
}

export function SliderInput({
  interaction,
  onSubmit,
  isDark,
}: SliderInputProps): React.ReactElement {
  const config = interaction.inputConfig!;
  const [value, setValue] = useState(config.defaultValue || config.min || 0);

  const handleSubmit = useCallback(() => {
    onSubmit(config.key, value);
  }, [value, config.key, onSubmit]);

  const handleQuickValue = useCallback(
    (quickValue: number) => {
      onSubmit(config.key, quickValue);
    },
    [config.key, onSubmit]
  );

  const increment = () => {
    const step = config.step || 1;
    const newVal = Math.min(value + step, config.max || 100);
    setValue(newVal);
  };

  const decrement = () => {
    const step = config.step || 1;
    const newVal = Math.max(value - step, config.min || 0);
    setValue(newVal);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-2 ml-10 px-4">
      <View
        className={`rounded-2xl border p-4 ${
          isDark ? 'border-[#222] bg-[#111]' : 'border-gray-100 bg-white'
        }`}>
        {/* Progress */}
        {interaction.step && interaction.totalSteps && (
          <View className="mb-3">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text
                className={`text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Step {interaction.step} of {interaction.totalSteps}
              </Text>
            </View>
            <View className={`h-1 rounded-full ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
              <View
                className="h-1 rounded-full bg-[#6366f1]"
                style={{
                  width: `${(interaction.step / interaction.totalSteps) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Label */}
        <Text className={`mb-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {config.label}
        </Text>

        {/* Value display with +/- controls */}
        <View className="mb-4 flex-row items-center justify-center gap-4">
          <Pressable
            onPress={decrement}
            className={`h-10 w-10 items-center justify-center rounded-full border ${
              isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
            }`}>
            <Feather name="minus" size={16} color={isDark ? '#fff' : '#000'} />
          </Pressable>

          <View className="min-w-[100px] items-center">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {value}
            </Text>
            {config.suffix && (
              <Text className={`mt-0.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {config.suffix}
              </Text>
            )}
          </View>

          <Pressable
            onPress={increment}
            className={`h-10 w-10 items-center justify-center rounded-full border ${
              isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
            }`}>
            <Feather name="plus" size={16} color={isDark ? '#fff' : '#000'} />
          </Pressable>
        </View>

        {/* Quick Values */}
        {config.quickValues && config.quickValues.length > 0 && (
          <View className="mb-3 flex-row flex-wrap justify-center gap-2">
            {config.quickValues.map((qv) => (
              <Pressable
                key={qv.value}
                onPress={() => handleQuickValue(qv.value)}
                className={`rounded-lg border px-3 py-2 ${
                  isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                }`}>
                <Text
                  className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {qv.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Helper Text */}
        {config.helperText && (
          <Text
            className={`mb-3 text-center text-[11px] ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>
            {config.helperText}
          </Text>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          className={`items-center rounded-xl py-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
          <Text className={`text-sm font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Option Buttons
// =====================================================================

interface OptionButtonsProps {
  interaction: AIInteraction;
  onSelect: (key: string, value: string | number) => void;
  isDark: boolean;
}

export function OptionButtons({
  interaction,
  onSelect,
  isDark,
}: OptionButtonsProps): React.ReactElement {
  const options = interaction.options || [];
  const config = interaction.inputConfig;
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelect = useCallback(
    (value: string | number) => {
      const key = config?.key || 'selection';
      onSelect(key, value);
    },
    [config, onSelect]
  );

  const handleCustomSubmit = useCallback(() => {
    const numValue = parseFloat(customValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue)) {
      const key = config?.key || 'selection';
      onSelect(key, numValue);
    }
  }, [customValue, config, onSelect]);

  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-2 ml-10 px-4">
      <View
        className={`rounded-2xl border p-4 ${
          isDark ? 'border-[#222] bg-[#111]' : 'border-gray-100 bg-white'
        }`}>
        {/* Progress */}
        {interaction.step && interaction.totalSteps && (
          <View className="mb-3">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text
                className={`text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Step {interaction.step} of {interaction.totalSteps}
              </Text>
            </View>
            <View className={`h-1 rounded-full ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
              <View
                className="h-1 rounded-full bg-[#6366f1]"
                style={{
                  width: `${(interaction.step / interaction.totalSteps) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Options */}
        <View className="mb-2 flex-row flex-wrap gap-2">
          {options.map((option) => (
            <Pressable
              key={String(option.value)}
              onPress={() => handleSelect(option.value)}
              className={`rounded-xl border px-4 py-2.5 ${
                isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
              }`}>
              <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {option.label}
              </Text>
              {option.description && (
                <Text
                  className={`mt-0.5 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {option.description}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Custom value toggle (for numeric options like interest rate) */}
        {config && (
          <View>
            {!showCustom ? (
              <Pressable onPress={() => setShowCustom(true)}>
                <Text className="mt-1 text-xs font-medium text-[#6366f1]">Enter custom value</Text>
              </Pressable>
            ) : (
              <View className="mt-2">
                <View
                  className={`mb-2 flex-row items-center rounded-xl border px-3 py-2 ${
                    isDark ? 'border-[#333] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'
                  }`}>
                  {config.prefix && (
                    <Text
                      className={`mr-2 text-sm font-semibold ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {config.prefix}
                    </Text>
                  )}
                  <TextInput
                    value={customValue}
                    onChangeText={setCustomValue}
                    placeholder="Custom"
                    placeholderTextColor={isDark ? '#555' : '#aaa'}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleCustomSubmit}
                    className={`flex-1 text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
                    style={{ padding: 0 }}
                    autoFocus
                  />
                  {config.suffix && (
                    <Text
                      className={`ml-2 text-sm font-semibold ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {config.suffix}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={handleCustomSubmit}
                  className={`items-center rounded-xl py-2.5 ${isDark ? 'bg-white' : 'bg-black'}`}>
                  <Text className={`text-sm font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                    Continue
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Calculator Result Card
// =====================================================================

interface CalculatorResultProps {
  interaction: AIInteraction;
  onAction: (actionValue: string) => void;
  isDark: boolean;
}

export function CalculatorResult({
  interaction,
  onAction,
  isDark,
}: CalculatorResultProps): React.ReactElement {
  const result = interaction.resultData!;

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="mb-2 ml-10 px-4">
      <View
        className={`overflow-hidden rounded-2xl border ${
          isDark ? 'border-[#222] bg-[#111]' : 'border-gray-100 bg-white'
        }`}>
        {/* Header */}
        <View className={`p-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
          <Text
            className={`mb-1 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {result.title}
          </Text>
          <Text className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            {result.primaryLabel}
          </Text>
          <Text className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {result.primaryValue}
          </Text>
        </View>

        {/* Breakdown */}
        <View className="p-4">
          {result.breakdown.map((item, index) => (
            <View
              key={index}
              className={`flex-row items-center justify-between py-2 ${
                index < result.breakdown.length - 1
                  ? `border-b ${isDark ? 'border-[#222]' : 'border-gray-100'}`
                  : ''
              }`}>
              <Text
                className={`flex-1 text-[13px] ${
                  item.highlight
                    ? isDark
                      ? 'font-semibold text-white'
                      : 'font-semibold text-black'
                    : isDark
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}>
                {item.label}
              </Text>
              <Text
                className={`text-[13px] font-medium ${
                  item.highlight
                    ? 'font-bold text-[#6366f1]'
                    : isDark
                      ? 'text-gray-200'
                      : 'text-gray-800'
                }`}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Insights */}
        {result.insights.length > 0 && (
          <View
            className={`mx-4 mb-4 rounded-xl p-3 ${isDark ? 'bg-[#6366f1]/10' : 'bg-indigo-50'}`}>
            <View className="mb-1.5 flex-row items-center">
              <Feather name="zap" size={12} color="#6366f1" />
              <Text className="ml-1 text-[11px] font-semibold text-[#6366f1]">AI INSIGHTS</Text>
            </View>
            {result.insights.map((insight, index) => (
              <Text
                key={index}
                className={`text-[12px] leading-[18px] ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                } ${index > 0 ? 'mt-1.5' : ''}`}>
                {insight}
              </Text>
            ))}
          </View>
        )}

        {/* Actions */}
        {result.actions.length > 0 && (
          <View
            className={`flex-row gap-2 border-t p-4 ${
              isDark ? 'border-[#222]' : 'border-gray-100'
            }`}>
            {result.actions.map((action) => (
              <Pressable
                key={String(action.value)}
                onPress={() => onAction(String(action.value))}
                className={`flex-1 flex-row items-center justify-center rounded-xl border py-2.5 ${
                  isDark ? 'border-[#333] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
                }`}>
                {action.icon && (
                  <Feather
                    name={action.icon as any}
                    size={12}
                    color={isDark ? '#ccc' : '#666'}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  className={`text-[11px] font-semibold ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// =====================================================================
// Message Renderer — dispatches to the correct component
// =====================================================================

interface MessageRendererProps {
  message: AIMessage;
  isDark: boolean;
  onSelectOption: (value: string | number) => void;
  onSubmitInput: (key: string, value: number | string) => void;
  onResultAction: (actionValue: string) => void;
}

export function MessageRenderer({
  message,
  isDark,
  onSelectOption,
  onSubmitInput,
  onResultAction,
}: MessageRendererProps): React.ReactElement | null {
  // Text message
  if (message.type === 'text') {
    return <ChatBubble message={message} isDark={isDark} />;
  }

  // Interaction message
  if (message.type === 'ai_interaction' && message.interaction) {
    const interaction = message.interaction;

    switch (interaction.type) {
      case 'calculator_menu':
        return (
          <CalculatorMenu interaction={interaction} onSelect={onSelectOption} isDark={isDark} />
        );

      case 'parameter_input':
        return (
          <ParameterInput interaction={interaction} onSubmit={onSubmitInput} isDark={isDark} />
        );

      case 'slider_input':
        return <SliderInput interaction={interaction} onSubmit={onSubmitInput} isDark={isDark} />;

      case 'option_buttons':
        return <OptionButtons interaction={interaction} onSelect={onSubmitInput} isDark={isDark} />;

      case 'calculator_result':
        return (
          <CalculatorResult interaction={interaction} onAction={onResultAction} isDark={isDark} />
        );

      default:
        return null;
    }
  }

  return null;
}
