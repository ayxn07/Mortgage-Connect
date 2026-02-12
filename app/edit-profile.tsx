import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/authStore';
import {
  ChevronLeft,
  Camera,
  User,
  Phone,
  Mail,
  Save,
  Image as ImageIcon,
} from '@/components/Icons';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  uploadAndUpdateProfilePhoto,
  updateUserProfile,
} from '@/src/services/profileService';

export default function EditUserProfileScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userDoc, firebaseUser, refreshUserDoc } = useAuthStore();

  // Form state
  const [displayName, setDisplayName] = useState(
    userDoc?.displayName ?? firebaseUser?.displayName ?? ''
  );
  const [phone, setPhone] = useState(userDoc?.phone ?? '');
  const [photoURL, setPhotoURL] = useState<string | null>(
    userDoc?.photoURL ?? firebaseUser?.photoURL ?? null
  );
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uid = userDoc?.uid ?? firebaseUser?.uid;
  const email = userDoc?.email ?? firebaseUser?.email ?? '';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ---- Photo picker ----
  const handlePickPhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const uri = await pickImageFromCamera();
            if (uri) {
              setLocalPhotoUri(uri);
              setPhotoURL(uri); // show preview immediately
            }
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          try {
            const uri = await pickImageFromGallery();
            if (uri) {
              setLocalPhotoUri(uri);
              setPhotoURL(uri);
            }
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!uid) return;
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoURL = userDoc?.photoURL ?? null;

      // Upload new photo if changed
      if (localPhotoUri) {
        setUploadingPhoto(true);
        finalPhotoURL = await uploadAndUpdateProfilePhoto(uid, localPhotoUri);
        setUploadingPhoto(false);
      }

      // Update profile fields
      await updateUserProfile(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        ...(localPhotoUri ? { photoURL: finalPhotoURL } : {}),
      });

      // Refresh auth store so the rest of the app sees changes
      await refreshUserDoc();

      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('[EditProfile] Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  // ---- UI helpers ----
  const inputClass = `rounded-2xl border p-4 text-base ${
    isDark
      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white'
      : 'bg-white border-gray-200 text-black'
  }`;

  const labelClass = `text-sm font-semibold mb-2 px-1 ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
            isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
          }`}>
          <ChevronLeft color={isDark ? '#fff' : '#000'} size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Edit Profile
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`h-10 flex-row items-center justify-center rounded-full px-5 ${
            isDark ? 'bg-white' : 'bg-black'
          }`}>
          {saving ? (
            <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
          ) : (
            <>
              <Save color={isDark ? '#000' : '#fff'} size={16} />
              <Text
                className={`ml-2 font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Save
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View className="items-center mb-8 mt-4">
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
            <View
              className={`h-28 w-28 rounded-full items-center justify-center overflow-hidden ${
                isDark ? 'bg-[#1a1a1a] border-2 border-[#2a2a2a]' : 'bg-gray-100 border-2 border-gray-200'
              }`}>
              {photoURL ? (
                <Image
                  source={{ uri: photoURL }}
                  className="h-28 w-28 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {initials}
                </Text>
              )}
            </View>
            {/* Camera badge */}
            <View
              className={`absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Camera color={isDark ? '#000' : '#fff'} size={16} />
            </View>
          </TouchableOpacity>
          {uploadingPhoto && (
            <View className="flex-row items-center mt-2">
              <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Uploading photo...
              </Text>
            </View>
          )}
          <Text className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tap to change photo
          </Text>
        </View>

        {/* Name */}
        <View className="mb-5">
          <Text className={labelClass}>Full Name</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <User color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your full name"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Email (read-only) */}
        <View className="mb-5">
          <Text className={labelClass}>Email</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Mail color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={email}
              editable={false}
              className={`${inputClass} pl-12 opacity-50`}
            />
          </View>
          <Text className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Email cannot be changed
          </Text>
        </View>

        {/* Phone */}
        <View className="mb-5">
          <Text className={labelClass}>Phone Number</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Phone color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+971 XX XXX XXXX"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              keyboardType="phone-pad"
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Role badge */}
        <View className="mb-5">
          <Text className={labelClass}>Role</Text>
          <View
            className={`rounded-2xl border p-4 ${
              isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
            }`}>
            <View className="flex-row items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isDark ? 'bg-white' : 'bg-black'
                }`}>
                <User color={isDark ? '#000' : '#fff'} size={14} />
              </View>
              <Text
                className={`ml-3 font-semibold capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                {userDoc?.role ?? 'user'}
              </Text>
            </View>
          </View>
          <Text className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            Role can only be changed by an admin
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
