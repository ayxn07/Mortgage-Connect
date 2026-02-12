import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  Modal,
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
  MapPin,
  Briefcase,
  Clock,
  Globe,
  Star,
  Plus,
  Minus,
  X,
  DollarSign,
  Edit3,
  Check,
} from '@/components/Icons';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  uploadAndUpdateProfilePhoto,
  updateAgentProfile,
} from '@/src/services/profileService';
import { firestore } from '@/src/services/firebase';
import type { Agent, AgentService } from '@/src/types/agent';
import { AGENT_CATEGORIES } from '@/src/types/agent';

export default function EditAgentProfileScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userDoc, firebaseUser, refreshUserDoc } = useAuthStore();

  const uid = userDoc?.uid ?? firebaseUser?.uid ?? '';

  // We need full agent doc from Firestore (userDoc may only have base User fields)
  const [agentDoc, setAgentDoc] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state — basic
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [availability, setAvailability] = useState(true);

  // Form state — arrays
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialty, setSpecialty] = useState<string[]>([]);
  const [services, setServices] = useState<AgentService[]>([]);

  // Modal state for adding items
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const email = userDoc?.email ?? firebaseUser?.email ?? '';

  // Load full agent doc
  useEffect(() => {
    if (!uid) return;
    const loadAgent = async () => {
      try {
        const doc = await firestore().collection('users').doc(uid).get();
        if (doc.exists) {
          const data = doc.data() as Agent;
          setAgentDoc(data);
          setDisplayName(data.displayName ?? '');
          setPhone(data.phone ?? '');
          setPhotoURL(data.photoURL ?? null);
          setBio(data.bio ?? '');
          setExperience(String(data.experience ?? ''));
          setHourlyRate(String(data.hourlyRate ?? ''));
          setLocation(data.location ?? '');
          setResponseTime(data.responseTime ?? '');
          setWhatsapp(data.whatsapp ?? '');
          setAvailability(data.availability ?? true);
          setLanguages(data.languages ?? []);
          setSpecialty(data.specialty ?? []);
          setServices(data.services ?? []);
        }
      } catch (err) {
        console.error('[EditAgentProfile] Failed to load agent doc:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, [uid]);

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
              setPhotoURL(uri);
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

  // ---- Language management ----
  const addLanguage = () => {
    const lang = newLanguage.trim();
    if (!lang) return;
    if (languages.includes(lang)) {
      Alert.alert('Duplicate', 'This language is already added.');
      return;
    }
    setLanguages([...languages, lang]);
    setNewLanguage('');
    setShowLanguageModal(false);
  };

  const removeLanguage = (idx: number) => {
    setLanguages(languages.filter((_, i) => i !== idx));
  };

  // ---- Specialty management ----
  const toggleSpecialty = (cat: string) => {
    if (specialty.includes(cat)) {
      setSpecialty(specialty.filter((s) => s !== cat));
    } else {
      setSpecialty([...specialty, cat]);
    }
  };

  // ---- Service management ----
  const openAddService = () => {
    setEditingServiceIndex(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
    setShowServiceModal(true);
  };

  const openEditService = (idx: number) => {
    const svc = services[idx];
    setEditingServiceIndex(idx);
    setServiceName(svc.name);
    setServicePrice(String(svc.price));
    setServiceDuration(svc.duration);
    setShowServiceModal(true);
  };

  const saveService = () => {
    if (!serviceName.trim() || !servicePrice.trim() || !serviceDuration.trim()) {
      Alert.alert('Validation', 'All service fields are required.');
      return;
    }
    const svc: AgentService = {
      name: serviceName.trim(),
      price: Number(servicePrice),
      duration: serviceDuration.trim(),
    };
    if (editingServiceIndex !== null) {
      const updated = [...services];
      updated[editingServiceIndex] = svc;
      setServices(updated);
    } else {
      setServices([...services, svc]);
    }
    setShowServiceModal(false);
  };

  const removeService = (idx: number) => {
    Alert.alert('Remove Service', `Remove "${services[idx].name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setServices(services.filter((_, i) => i !== idx)),
      },
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
      let finalPhotoURL = agentDoc?.photoURL ?? null;

      if (localPhotoUri) {
        setUploadingPhoto(true);
        finalPhotoURL = await uploadAndUpdateProfilePhoto(uid, localPhotoUri);
        setUploadingPhoto(false);
      }

      await updateAgentProfile(uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim(),
        experience: Number(experience) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        location: location.trim(),
        responseTime: responseTime.trim(),
        whatsapp: whatsapp.trim(),
        availability,
        languages,
        specialty,
        services,
        ...(localPhotoUri ? { photoURL: finalPhotoURL } : {}),
      });

      await refreshUserDoc();

      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('[EditAgentProfile] Save error:', err);
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

  const cardClass = `rounded-2xl border p-4 ${
    isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
  }`;

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </SafeAreaView>
    );
  }

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
            Edit Agent Profile
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
              <Text className={`ml-2 font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
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
                isDark
                  ? 'bg-[#1a1a1a] border-2 border-[#2a2a2a]'
                  : 'bg-gray-100 border-2 border-gray-200'
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

        {/* ================ BASIC INFO ================ */}
        <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
          Basic Information
        </Text>

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
            <TextInput value={email} editable={false} className={`${inputClass} pl-12 opacity-50`} />
          </View>
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

        {/* WhatsApp */}
        <View className="mb-5">
          <Text className={labelClass}>WhatsApp Number</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Phone color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+971XXXXXXXXX"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              keyboardType="phone-pad"
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Location */}
        <View className="mb-5">
          <Text className={labelClass}>Location</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <MapPin color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. DIFC, Dubai"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* ================ PROFESSIONAL INFO ================ */}
        <Text className={`text-lg font-bold mb-4 mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
          Professional Details
        </Text>

        {/* Bio */}
        <View className="mb-5">
          <Text className={labelClass}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell clients about yourself..."
            placeholderTextColor={isDark ? '#555' : '#aaa'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className={`${inputClass} min-h-[120px]`}
          />
        </View>

        {/* Experience */}
        <View className="mb-5">
          <Text className={labelClass}>Years of Experience</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Briefcase color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={experience}
              onChangeText={setExperience}
              placeholder="e.g. 15"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              keyboardType="numeric"
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Hourly Rate */}
        <View className="mb-5">
          <Text className={labelClass}>Hourly Rate (AED)</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <DollarSign color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="e.g. 400"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              keyboardType="numeric"
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Response Time */}
        <View className="mb-5">
          <Text className={labelClass}>Response Time</Text>
          <View className="relative">
            <View className="absolute left-4 top-4 z-10">
              <Clock color={isDark ? '#666' : '#999'} size={18} />
            </View>
            <TextInput
              value={responseTime}
              onChangeText={setResponseTime}
              placeholder="e.g. 2 hours"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className={`${inputClass} pl-12`}
            />
          </View>
        </View>

        {/* Availability Toggle */}
        <View className="mb-5">
          <Text className={labelClass}>Availability</Text>
          <View className={`${cardClass} flex-row items-center justify-between`}>
            <View className="flex-row items-center">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  availability ? 'bg-green-500/20' : (isDark ? 'bg-gray-700' : 'bg-gray-200')
                }`}>
                <View
                  className={`h-3 w-3 rounded-full ${
                    availability ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </View>
              <Text className={`ml-3 font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {availability ? 'Available for new clients' : 'Not available'}
              </Text>
            </View>
            <Switch
              value={availability}
              onValueChange={setAvailability}
              trackColor={{ false: '#444', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ================ LANGUAGES ================ */}
        <Text className={`text-lg font-bold mb-4 mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
          Languages
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-3">
          {languages.map((lang, idx) => (
            <View
              key={idx}
              className={`flex-row items-center rounded-full px-4 py-2 ${
                isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-gray-200'
              }`}>
              <Globe color={isDark ? '#fff' : '#000'} size={14} />
              <Text className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {lang}
              </Text>
              <TouchableOpacity onPress={() => removeLanguage(idx)} className="ml-2">
                <X color="#ef4444" size={14} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setShowLanguageModal(true)}
            className={`flex-row items-center rounded-full px-4 py-2 border border-dashed ${
              isDark ? 'border-[#2a2a2a]' : 'border-gray-300'
            }`}>
            <Plus color={isDark ? '#666' : '#999'} size={14} />
            <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Add Language
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================ SPECIALTIES ================ */}
        <Text className={`text-lg font-bold mb-4 mt-6 ${isDark ? 'text-white' : 'text-black'}`}>
          Specialties
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-3">
          {AGENT_CATEGORIES.filter((c) => c !== 'All').map((cat) => {
            const selected = specialty.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleSpecialty(cat)}
                className={`flex-row items-center rounded-full px-4 py-2 border ${
                  selected
                    ? isDark
                      ? 'bg-white border-white'
                      : 'bg-black border-black'
                    : isDark
                    ? 'bg-[#1a1a1a] border-[#2a2a2a]'
                    : 'bg-white border-gray-200'
                }`}>
                {selected && <Check color={isDark ? '#000' : '#fff'} size={14} />}
                <Text
                  className={`${selected ? 'ml-1' : ''} font-medium ${
                    selected
                      ? isDark
                        ? 'text-black'
                        : 'text-white'
                      : isDark
                      ? 'text-white'
                      : 'text-black'
                  }`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================ SERVICES ================ */}
        <Text className={`text-lg font-bold mb-4 mt-6 ${isDark ? 'text-white' : 'text-black'}`}>
          Services
        </Text>

        {services.map((svc, idx) => (
          <View key={idx} className={`${cardClass} mb-3`}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>
                  {svc.name}
                </Text>
                <View className="flex-row items-center mt-2 gap-4">
                  <View className="flex-row items-center">
                    <DollarSign color={isDark ? '#666' : '#999'} size={14} />
                    <Text className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      AED {svc.price.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock color={isDark ? '#666' : '#999'} size={14} />
                    <Text className={`ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {svc.duration}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => openEditService(idx)}
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                  <Edit3 color={isDark ? '#fff' : '#000'} size={14} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeService(idx)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <Minus color="#ef4444" size={14} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={openAddService}
          className={`${cardClass} mb-6 flex-row items-center justify-center border-dashed`}>
          <Plus color={isDark ? '#666' : '#999'} size={18} />
          <Text className={`ml-2 font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Add Service
          </Text>
        </TouchableOpacity>

        {/* Stats (read-only) */}
        <Text className={`text-lg font-bold mb-4 mt-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Statistics
        </Text>
        <View className={`${cardClass} mb-6`}>
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Average Rating</Text>
            <View className="flex-row items-center">
              <Star color="#f59e0b" size={14} />
              <Text className={`ml-1 font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {agentDoc?.avgRating?.toFixed(1) ?? '0.0'}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Total Reviews</Text>
            <Text className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {agentDoc?.totalReviews ?? 0}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              Completed Projects
            </Text>
            <Text className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {agentDoc?.completedProjects ?? 0}
            </Text>
          </View>
        </View>
        <Text className={`text-xs px-1 mb-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Statistics are updated automatically and cannot be manually edited.
        </Text>
      </ScrollView>

      {/* ========== Language Modal ========== */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View
            className={`w-full rounded-3xl p-6 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Add Language
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <X color={isDark ? '#fff' : '#000'} size={20} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={newLanguage}
              onChangeText={setNewLanguage}
              placeholder="e.g. Arabic"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              autoFocus
              className={inputClass}
            />
            <TouchableOpacity
              onPress={addLanguage}
              className={`mt-4 h-12 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Text className={`font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========== Specialty Modal ========== */}
      <Modal visible={showSpecialtyModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View
            className={`w-full rounded-3xl p-6 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Select Specialties
              </Text>
              <TouchableOpacity onPress={() => setShowSpecialtyModal(false)}>
                <X color={isDark ? '#fff' : '#000'} size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-80">
              {AGENT_CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                const selected = specialty.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleSpecialty(cat)}
                    className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${
                      selected
                        ? isDark
                          ? 'bg-white'
                          : 'bg-black'
                        : isDark
                        ? 'bg-[#222]'
                        : 'bg-gray-100'
                    }`}>
                    <Text
                      className={`font-medium ${
                        selected
                          ? isDark
                            ? 'text-black'
                            : 'text-white'
                          : isDark
                          ? 'text-white'
                          : 'text-black'
                      }`}>
                      {cat}
                    </Text>
                    {selected && <Check color={isDark ? '#000' : '#fff'} size={18} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowSpecialtyModal(false)}
              className={`mt-4 h-12 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Text className={`font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========== Service Modal ========== */}
      <Modal visible={showServiceModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View
            className={`w-full rounded-3xl p-6 ${
              isDark ? 'bg-[#1a1a1a]' : 'bg-white'
            }`}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {editingServiceIndex !== null ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <X color={isDark ? '#fff' : '#000'} size={20} />
              </TouchableOpacity>
            </View>

            <Text className={labelClass}>Service Name</Text>
            <TextInput
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="e.g. Investment Property Analysis"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className={`${inputClass} mb-4`}
            />

            <Text className={labelClass}>Price (AED)</Text>
            <TextInput
              value={servicePrice}
              onChangeText={setServicePrice}
              placeholder="e.g. 3000"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              keyboardType="numeric"
              className={`${inputClass} mb-4`}
            />

            <Text className={labelClass}>Duration</Text>
            <TextInput
              value={serviceDuration}
              onChangeText={setServiceDuration}
              placeholder="e.g. 1 week"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              className={`${inputClass} mb-4`}
            />

            <TouchableOpacity
              onPress={saveService}
              className={`h-12 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white' : 'bg-black'
              }`}>
              <Text className={`font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
                {editingServiceIndex !== null ? 'Update Service' : 'Add Service'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
