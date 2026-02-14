import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isDark: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function DatePickerField({
  label,
  value,
  onChangeText,
  placeholder = 'DD/MM/YYYY',
  isDark,
  required,
  error,
  hint,
}: DatePickerFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Parse DD/MM/YYYY to Date object
  const parseDate = (dateStr: string): Date => {
    if (!dateStr || dateStr.length < 10) return new Date();
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format Date object to DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Auto-format as user types
  const handleTextChange = (text: string) => {
    // Remove non-numeric characters
    const numbers = text.replace(/[^\d]/g, '');
    
    let formatted = '';
    
    // Add day (max 2 digits)
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
    }
    
    // Add slash after day
    if (numbers.length >= 3) {
      formatted += '/' + numbers.substring(2, 4);
    }
    
    // Add slash after month
    if (numbers.length >= 5) {
      formatted += '/' + numbers.substring(4, 8);
    }
    
    onChangeText(formatted);
  };

  const currentDate = value && value.length === 10 ? parseDate(value) : new Date();

  // Custom Date Picker Component
  const CustomDatePicker = () => {
    const [tempDate, setTempDate] = useState(currentDate);
    const lastDayRef = useRef(currentDate.getDate());
    const lastMonthRef = useRef(currentDate.getMonth());
    const lastYearRef = useRef(currentDate.getFullYear());
    
    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    const days = Array.from({ length: getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth()) }, (_, i) => i + 1);

    // Haptic feedback handlers
    const handleDayScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const currentIndex = Math.round((yOffset + 72) / 48); // 72 is paddingVertical, 48 is item height
      const currentDay = days[currentIndex];
      
      if (currentDay && currentDay !== lastDayRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastDayRef.current = currentDay;
      }
    };

    const handleMonthScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const currentIndex = Math.round((yOffset + 72) / 48);
      
      if (currentIndex >= 0 && currentIndex < months.length && currentIndex !== lastMonthRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastMonthRef.current = currentIndex;
      }
    };

    const handleYearScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const currentIndex = Math.round((yOffset + 72) / 48);
      const currentYear = years[currentIndex];
      
      if (currentYear && currentYear !== lastYearRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastYearRef.current = currentYear;
      }
    };

    return (
      <Modal transparent animationType="slide" visible={showPicker}>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setShowPicker(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className={`rounded-t-3xl ${
                isDark ? 'bg-black border-t-2 border-r-2 border-l-2 border-white' : 'bg-white border-t-2 border-r-2 border-l-2 border-black'
              }`}>
              {/* Header */}
              <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
                <Text
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                  Select Date
                </Text>
                <Pressable
                  onPress={() => {
                    onChangeText(formatDate(tempDate));
                    setShowPicker(false);
                  }}
                  className={`px-6 py-3 rounded-xl ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}>
                  <Text
                    className={`text-sm font-bold ${
                      isDark ? 'text-black' : 'text-white'
                    }`}>
                    Done
                  </Text>
                </Pressable>
              </View>

              {/* Column Labels */}
              <View className="flex-row px-6 ">
                <View className="flex-1 items-center">
                  <Text className={`text-s font-semibold mr-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Day
                  </Text>
                </View>
                <View className="flex-[2] items-center">
                  <Text className={`text-s font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Month
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className={`text-s font-semibold ml-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Year
                  </Text>
                </View>
              </View>

              {/* Custom Picker */}
              <View className="flex-row h-64 px-4  pt-0">
                {/* Day Picker */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  snapToInterval={48}
                  decelerationRate="fast"
                  onScroll={handleDayScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: 10 }}>
                  {days.map((day) => {
                    const isSelected = day === tempDate.getDate();
                    return (
                      <Pressable
                        key={day}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          const newDate = new Date(tempDate);
                          newDate.setDate(day);
                          setTempDate(newDate);
                        }}
                        className={`h-12 justify-center items-center rounded-xl mx-1 ${
                          isSelected
                            ? isDark
                              ? 'bg-white'
                              : 'bg-black'
                            : ''
                        }`}>
                        <Text
                          className={`text-lg font-bold ${
                            isSelected
                              ? isDark
                                ? 'text-black'
                                : 'text-white'
                              : isDark
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Month Picker */}
                <ScrollView
                  className="flex-[2]"
                  showsVerticalScrollIndicator={false}
                  snapToInterval={48}
                  decelerationRate="fast"
                  onScroll={handleMonthScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: 10 }}>
                  {months.map((month, index) => {
                    const isSelected = index === tempDate.getMonth();
                    return (
                      <Pressable
                        key={month}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          const newDate = new Date(tempDate);
                          newDate.setMonth(index);
                          setTempDate(newDate);
                        }}
                        className={`h-12 justify-center items-center rounded-xl mx-1 ${
                          isSelected
                            ? isDark
                              ? 'bg-white'
                              : 'bg-black'
                            : ''
                        }`}>
                        <Text
                          className={`text-base font-bold ${
                            isSelected
                              ? isDark
                                ? 'text-black'
                                : 'text-white'
                              : isDark
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}>
                          {month}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Year Picker */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                  snapToInterval={48}
                  decelerationRate="fast"
                  onScroll={handleYearScroll}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ paddingVertical: 10 }}>
                  {years.map((year) => {
                    const isSelected = year === tempDate.getFullYear();
                    return (
                      <Pressable
                        key={year}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          const newDate = new Date(tempDate);
                          newDate.setFullYear(year);
                          setTempDate(newDate);
                        }}
                        className={`h-12 justify-center items-center rounded-xl mx-1 ${
                          isSelected
                            ? isDark
                              ? 'bg-white'
                              : 'bg-black'
                            : ''
                        }`}>
                        <Text
                          className={`text-lg font-bold ${
                            isSelected
                              ? isDark
                                ? 'text-black'
                                : 'text-white'
                              : isDark
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {label}
        </Text>
        {required && <Text className="text-red-500 ml-1 text-xs">*</Text>}
      </View>

      <View className="flex-row items-center gap-2">
        {/* Text Input */}
        <View
          className={`flex-1 flex-row items-center rounded-2xl border px-4 ${
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
            value={value}
            onChangeText={handleTextChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#444' : '#bbb'}
            keyboardType="numeric"
            maxLength={10}
            className={`flex-1 py-3.5 text-base font-medium ${isDark ? 'text-white' : 'text-black'}`}
          />
        </View>

        {/* Calendar Button */}
        <Pressable
          onPress={() => setShowPicker(true)}
          className={`w-12 h-12 rounded-2xl items-center justify-center border ${
            isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
          }`}>
          <Feather name="calendar" size={20} color={isDark ? '#fff' : '#000'} />
        </Pressable>
      </View>

      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      {hint && !error && (
        <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          {hint}
        </Text>
      )}

      {/* Custom Date Picker for both iOS and Android */}
      {showPicker && <CustomDatePicker />}
    </View>
  );
}
