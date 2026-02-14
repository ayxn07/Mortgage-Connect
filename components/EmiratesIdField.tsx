import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

interface EmiratesIdFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isDark: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
}

/**
 * Formats Emirates ID with hyphens: 784-XXXX-XXXXXXX-X
 */
function formatEmiratesId(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply formatting: 784-XXXX-XXXXXXX-X
  let formatted = '';
  
  if (digits.length > 0) {
    formatted = digits.substring(0, 3);
  }
  if (digits.length > 3) {
    formatted += '-' + digits.substring(3, 7);
  }
  if (digits.length > 7) {
    formatted += '-' + digits.substring(7, 14);
  }
  if (digits.length > 14) {
    formatted += '-' + digits.substring(14, 15);
  }
  
  return formatted;
}

/**
 * Removes formatting from Emirates ID
 */
function unformatEmiratesId(value: string): string {
  return value.replace(/\D/g, '');
}

export function EmiratesIdField({
  label,
  value,
  onChangeText,
  placeholder = '784-XXXX-XXXXXXX-X',
  isDark,
  required,
  error,
  hint,
}: EmiratesIdFieldProps) {
  const [focused, setFocused] = useState(false);
  
  // Display value with formatting
  const displayValue = formatEmiratesId(value);

  const handleChangeText = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // Limit to 15 digits (Emirates ID format)
    const limited = digits.substring(0, 15);
    
    // Store unformatted value
    onChangeText(limited);
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </Text>
        {required && <Text className="text-red-500 ml-1 text-xs">*</Text>}
      </View>
      <View
        className={`flex-row items-center rounded-2xl border px-4 ${
          error
            ? 'border-red-500/50'
            : focused
            ? isDark
              ? 'border-white/30 bg-[#1a1a1a]'
              : 'border-black/20 bg-white'
            : isDark
            ? 'border-[#2a2a2a] bg-[#1a1a1a]'
            : 'border-gray-200 bg-white'
        }`}>
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#444' : '#bbb'}
          keyboardType="numeric"
          maxLength={18} // 15 digits + 3 hyphens
          className={`flex-1 py-3.5 text-base font-medium ${
            isDark ? 'text-white' : 'text-black'
          }`}
        />
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      {hint && !error && (
        <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {hint}
        </Text>
      )}
    </View>
  );
}
