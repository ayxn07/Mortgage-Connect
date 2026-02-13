import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,

} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/src/store/authStore';
import { useApplicationStore } from '@/src/store/applicationStore';
import { calculateEMI, getMinDownPaymentPercent } from '@/src/utils/helpers';
import type {
  ApplicantIdentity,
  ContactResidency,
  EmploymentIncome,
  SalariedDetails,
  SelfEmployedDetails,
  FinancialObligations,
  LoanObligation,
  PropertyDetails,
  MortgagePreferences,
  EligibilityResults,
  DocumentUploads,
  UploadedDocument,
  ConsentDeclarations,
  EmploymentType,
  Gender,
  MaritalStatus,
  ResidentialStatus,
  EmirateType,
  SalariedEmploymentType,
  OfficeLocationType,
  PropertyType,
  PropertyReadiness,
  InterestType,
  DocumentCategory,
} from '@/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// =====================================================================
// Step definitions
// =====================================================================
const STEPS = [
  { key: 'identity', label: 'Identity', icon: 'user', short: 'KYC', heading: 'Applicant Identity', subtitle: 'Tell us who you are — your personal and ID details.' },
  { key: 'contact', label: 'Contact', icon: 'phone', short: 'Contact', heading: 'Contact & Residency', subtitle: 'Your contact details and where you live in the UAE.' },
  { key: 'employment', label: 'Employment', icon: 'briefcase', short: 'Work', heading: 'Employment & Income', subtitle: 'Details about your job and how much you earn.' },
  { key: 'financial', label: 'Obligations', icon: 'credit-card', short: 'Debts', heading: 'Financial Obligations', subtitle: 'Any existing loans, EMIs, or credit card debts.' },
  { key: 'property', label: 'Property', icon: 'home', short: 'Property', heading: 'Property Details', subtitle: 'Tell us about the property you want to buy.' },
  { key: 'mortgage', label: 'Preferences', icon: 'sliders', short: 'Mortgage', heading: 'Mortgage Preferences', subtitle: 'Your preferred loan terms and down payment.' },
  { key: 'eligibility', label: 'Eligibility', icon: 'bar-chart-2', short: 'Results', heading: 'Eligibility Results', subtitle: 'Your estimated mortgage eligibility and monthly payment.' },
  { key: 'documents', label: 'Documents', icon: 'upload', short: 'Docs', heading: 'Upload Documents', subtitle: 'Supporting documents to strengthen your application.' },
  { key: 'consent', label: 'Consent', icon: 'shield', short: 'Legal', heading: 'Consent & Declarations', subtitle: 'Review and accept the required legal consents.' },
  { key: 'submit', label: 'Submit', icon: 'send', short: 'Submit', heading: 'Review & Submit', subtitle: 'Review your application before final submission.' },
] as const;

// =====================================================================
// Default state factories
// =====================================================================
function defaultIdentity(): ApplicantIdentity {
  return {
    fullName: '', nationality: '', dateOfBirth: '', gender: '',
    maritalStatus: '', numberOfDependents: 0, emiratesIdNumber: '',
    emiratesIdExpiry: '', passportNumber: '', passportExpiry: '',
  };
}

function defaultContact(): ContactResidency {
  return {
    mobileNumber: '', email: '', currentAddress: '',
    emirate: '', residentialStatus: '', yearsInUAE: 0,
  };
}

function defaultSalaried(): SalariedDetails {
  return {
    employerName: '', employerIndustry: '', jobTitle: '',
    salariedEmploymentType: '', monthlyGrossSalary: 0,
    monthlyNetSalary: 0, salaryTransferBank: '', lengthOfServiceMonths: 0,
  };
}

function defaultSelfEmployed(): SelfEmployedDetails {
  return {
    companyName: '', tradeLicenseNumber: '', companyAgeYears: 0,
    ownershipPercentage: 0, monthlyAverageIncome: 0, officeLocation: '',
  };
}

function defaultEmployment(): EmploymentIncome {
  return {
    employmentType: '',
    salaried: defaultSalaried(),
    selfEmployed: defaultSelfEmployed(),
  };
}

function defaultFinancial(): FinancialObligations {
  return {
    hasExistingLoans: false, loans: [],
    creditCardsCount: 0, totalCreditCardLimit: 0, totalMonthlyEMI: 0,
  };
}

function defaultProperty(): PropertyDetails {
  return {
    propertyIdentified: false, propertyType: '', propertyStatus: '',
    developerName: '', projectName: '', locationArea: '',
    purchasePrice: 0, expectedCompletionDate: '', unitSizeSqft: 0,
    numberOfBedrooms: 0, parkingIncluded: false,
  };
}

function defaultMortgage(): MortgagePreferences {
  return {
    propertyValue: 0, downPaymentAmount: 0, downPaymentPercent: 20,
    preferredLoanAmount: 0, loanTenureYears: 25,
    interestType: '', isFirstTimeBuyer: true,
  };
}

function defaultEligibility(): EligibilityResults {
  return {
    eligibleLoanAmount: 0, estimatedEMI: 0, dbrPercent: 0,
    ltvPercent: 0, approxRateMin: 3.99, approxRateMax: 5.49,
    eligibleBanksCount: 0, additionalDownPaymentRequired: 0,
  };
}

function defaultDocuments(): DocumentUploads {
  return { documents: [] };
}

function defaultConsent(): ConsentDeclarations {
  return {
    aecbConsent: false, bankContactConsent: false,
    dataProcessingConsent: false, accuracyConfirmation: false,
  };
}

// =====================================================================
// Format helpers
// =====================================================================
function fmtAED(v: number): string {
  return v > 0 ? `AED ${v.toLocaleString('en-US')}` : '—';
}
function fmtShort(v: number): string {
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v.toLocaleString('en-US')}`;
}
function fmtFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

// =====================================================================
// Reusable: Step Header (Wizard-style heading for each step)
// =====================================================================
function StepHeader({ heading, subtitle, isDark }: { heading: string; subtitle: string; isDark: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(50).duration(400)} className="mb-6">
      <Text className={`text-3xl font-bold leading-10 ${isDark ? 'text-white' : 'text-black'}`}>
        {heading}
      </Text>
      <Text className={`text-base mt-2 leading-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {subtitle}
      </Text>
    </Animated.View>
  );
}

// =====================================================================
// Reusable: FormField
// =====================================================================
function FormField({
  label, value, onChangeText, placeholder, keyboardType, isDark,
  required, error, multiline, prefix, suffix, hint,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  isDark: boolean; required?: boolean; error?: string; multiline?: boolean;
  prefix?: string; suffix?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
        {required && <Text className="text-red-500 ml-1 text-xs">*</Text>}
      </View>
      <View
        className={`flex-row items-center rounded-2xl border px-4 ${
          error ? 'border-red-500/50' :
          focused
            ? isDark ? 'border-white/30 bg-[#1a1a1a]' : 'border-black/20 bg-white'
            : isDark ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-200 bg-white'
        }`}>
        {prefix && <Text className={`text-sm mr-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#444' : '#bbb'}
          keyboardType={keyboardType}
          multiline={multiline}
          className={`flex-1 py-3.5 text-base font-medium ${
            multiline ? 'min-h-[80px]' : ''
          } ${isDark ? 'text-white' : 'text-black'}`}
          style={multiline ? { textAlignVertical: 'top' } : undefined}
        />
        {suffix && <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{suffix}</Text>}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
      {hint && !error && (
        <Text className={`text-[11px] mt-1.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{hint}</Text>
      )}
    </View>
  );
}

// =====================================================================
// Reusable: ChipSelect
// =====================================================================
function ChipSelect<T extends string>({
  label, options, selected, onSelect, isDark, required,
}: {
  label: string; options: { value: T; label: string }[];
  selected: T | ''; onSelect: (v: T) => void; isDark: boolean; required?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</Text>
        {required && <Text className="text-red-500 ml-1 text-xs">*</Text>}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className={`px-4 py-2.5 rounded-xl border ${
                active
                  ? isDark ? 'bg-white border-white' : 'bg-black border-black'
                  : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
              }`}>
              <Text className={`text-sm font-semibold ${
                active
                  ? isDark ? 'text-black' : 'text-white'
                  : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// =====================================================================
// Reusable: Toggle
// =====================================================================
function ToggleSwitch({
  label, value, onToggle, isDark, description,
}: {
  label: string; value: boolean; onToggle: (v: boolean) => void;
  isDark: boolean; description?: string;
}) {
  return (
    <Pressable onPress={() => onToggle(!value)} className="flex-row items-center justify-between mb-4">
      <View className="flex-1 mr-4">
        <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
        {description && (
          <Text className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{description}</Text>
        )}
      </View>
      <View className={`w-12 h-7 rounded-full justify-center px-1 ${
        value
          ? isDark ? 'bg-white' : 'bg-black'
          : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-300'
      }`}>
        <View className={`w-5 h-5 rounded-full ${
          value
            ? isDark ? 'bg-black self-end' : 'bg-white self-end'
            : isDark ? 'bg-gray-600 self-start' : 'bg-white self-start'
        }`} />
      </View>
    </Pressable>
  );
}

// =====================================================================
// Reusable: Section Card
// =====================================================================
function SectionCard({
  icon, title, children, isDark, delay = 0,
}: {
  icon: string; title: string; children: React.ReactNode;
  isDark: boolean; delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      className={`rounded-3xl p-5 mb-4 border ${
        isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
      }`}>
      <View className="flex-row items-center mb-4">
        <View className={`w-8 h-8 rounded-xl items-center justify-center mr-2.5 ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'
        }`}>
          <Feather name={icon as any} size={15} color={isDark ? '#fff' : '#000'} />
        </View>
        <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

// =====================================================================
// Document Upload Card
// =====================================================================
function DocUploadCard({
  label, category, documents, onPick, onRemove, isDark, required, hint,
}: {
  label: string; category: DocumentCategory;
  documents: UploadedDocument[];
  onPick: (category: DocumentCategory) => void;
  onRemove: (docId: string) => void;
  isDark: boolean; required?: boolean; hint?: string;
}) {
  const uploaded = documents.filter((d) => d.category === category);
  const hasDoc = uploaded.length > 0;
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  const handlePreview = (doc: UploadedDocument) => {
    const isImage = doc.mimeType?.startsWith('image/');
    if (isImage) {
      setPreviewDoc(doc);
    } else {
      // For PDFs and other files, try to open with system viewer
      Linking.openURL(doc.downloadURL).catch(() => {
        Alert.alert('Cannot Open', 'Unable to preview this file type.');
      });
    }
  };

  return (
    <View className="mb-3">
      <Pressable
        onPress={() => onPick(category)}
        className={`flex-row items-center p-4 rounded-2xl border ${
          hasDoc
            ? 'border-green-500/30 bg-green-500/5'
            : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
        }`}>
        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
          hasDoc ? 'bg-green-500/10' : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
        }`}>
          <Feather
            name={hasDoc ? 'check-circle' : 'upload'}
            size={18}
            color={hasDoc ? '#22c55e' : isDark ? '#888' : '#666'}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{label}</Text>
            {required && <Text className="text-red-500 ml-1 text-xs">*</Text>}
            {!required && (
              <Text className={`text-[10px] ml-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>(Optional)</Text>
            )}
          </View>
          <Text className={`text-xs mt-0.5 ${hasDoc ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {hasDoc ? `${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded` : 'Tap to upload'}
          </Text>
        </View>
        <Feather name={hasDoc ? 'plus' : 'chevron-right'} size={16} color={isDark ? '#555' : '#aaa'} />
      </Pressable>
      {hint && !hasDoc && (
        <Text className={`text-[10px] mt-1 ml-1 ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>{hint}</Text>
      )}
      {/* Uploaded files list */}
      {uploaded.map((doc) => {
        const isImage = doc.mimeType?.startsWith('image/');
        return (
          <View
            key={doc.id}
            className={`flex-row items-center mt-2 ml-2 p-3 rounded-xl ${
              isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'
            }`}>
            {isImage && doc.downloadURL ? (
              <Image
                source={{ uri: doc.downloadURL }}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <Feather name="file" size={14} color="#22c55e" />
            )}
            <View className="flex-1 ml-2">
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={1}>
                {doc.fileName}
              </Text>
              <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {fmtFileSize(doc.fileSize)}
              </Text>
            </View>
            <Pressable onPress={() => handlePreview(doc)} className="p-1 mr-2">
              <Feather name="eye" size={14} color={isDark ? '#888' : '#666'} />
            </Pressable>
            <Pressable onPress={() => onRemove(doc.id)} className="p-1">
              <Feather name="x" size={14} color={isDark ? '#555' : '#aaa'} />
            </Pressable>
          </View>
        );
      })}

      {/* Image Preview Modal */}
      {previewDoc && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewDoc(null)}>
          <View className="flex-1 bg-black/90 justify-center items-center">
            <Pressable
              onPress={() => setPreviewDoc(null)}
              className="absolute top-12 right-6 w-10 h-10 rounded-full bg-white/10 items-center justify-center z-10">
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
            <Image
              source={{ uri: previewDoc.downloadURL }}
              className="w-full h-full"
              resizeMode="contain"
            />
            <View className="absolute bottom-12 left-0 right-0 items-center">
              <View className="bg-black/70 px-6 py-3 rounded-2xl">
                <Text className="text-white text-sm font-medium">{previewDoc.fileName}</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// =====================================================================
// Consent Checkbox
// =====================================================================
function ConsentCheck({
  label, checked, onToggle, isDark, required,
}: {
  label: string; checked: boolean; onToggle: () => void;
  isDark: boolean; required?: boolean;
}) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-start mb-4">
      <View className={`w-6 h-6 rounded-lg border items-center justify-center mr-3 mt-0.5 ${
        checked
          ? isDark ? 'bg-white border-white' : 'bg-black border-black'
          : isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-300'
      }`}>
        {checked && <Feather name="check" size={14} color={isDark ? '#000' : '#fff'} />}
      </View>
      <View className="flex-1">
        <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</Text>
        {required && <Text className="text-red-500 text-[10px] mt-0.5">Required</Text>}
      </View>
    </Pressable>
  );
}

// =====================================================================
// Review Row
// =====================================================================
function ReviewRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <View className="flex-row items-start justify-between py-2.5">
      <Text className={`text-xs flex-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</Text>
      <Text className={`text-xs font-semibold text-right flex-1 ${isDark ? 'text-white' : 'text-black'}`}>
        {value || '—'}
      </Text>
    </View>
  );
}

// =====================================================================
// Metric Card (for eligibility)
// =====================================================================
function MetricCard({
  label, value, icon, isDark, color, large,
}: {
  label: string; value: string; icon: string;
  isDark: boolean; color?: string; large?: boolean;
}) {
  return (
    <View className={`${large ? 'flex-1' : ''} rounded-2xl p-4 border ${
      isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
    }`}>
      <View className="flex-row items-center mb-2">
        <View className={`w-7 h-7 rounded-lg items-center justify-center ${
          isDark ? 'bg-[#222]' : 'bg-gray-100'
        }`}>
          <Feather name={icon as any} size={13} color={color || (isDark ? '#fff' : '#000')} />
        </View>
      </View>
      <Text className={`${large ? 'text-xl' : 'text-base'} font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        {value}
      </Text>
      <Text className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{label}</Text>
    </View>
  );
}

// =====================================================================
// Loan Obligation Card
// =====================================================================
function LoanCard({
  loan, isDark, onUpdate, onRemove,
}: {
  loan: LoanObligation; isDark: boolean;
  onUpdate: (l: LoanObligation) => void; onRemove: () => void;
}) {
  return (
    <View className={`rounded-2xl p-4 mb-3 border ${
      isDark ? 'bg-[#0d0d0d] border-[#1e1e1e]' : 'bg-gray-50 border-gray-100'
    }`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {loan.label || 'Obligation'}
        </Text>
        <Pressable onPress={onRemove} className="p-1">
          <Feather name="trash-2" size={14} color="#ef4444" />
        </Pressable>
      </View>
      <ChipSelect<LoanObligation['type']>
        label="Type"
        options={[
          { value: 'personal', label: 'Personal Loan' },
          { value: 'auto', label: 'Auto Loan' },
          { value: 'credit_card', label: 'Credit Card' },
          { value: 'other', label: 'Other' },
        ]}
        selected={loan.type}
        onSelect={(v) => {
          const labels: Record<string, string> = {
            personal: 'Personal Loan', auto: 'Auto Loan',
            credit_card: 'Credit Card', other: 'Other Obligation',
          };
          onUpdate({ ...loan, type: v, label: labels[v] || loan.label });
        }}
        isDark={isDark}
      />
      <FormField
        label="Monthly EMI (AED)"
        value={loan.emiAmount > 0 ? String(loan.emiAmount) : ''}
        onChangeText={(t) => onUpdate({ ...loan, emiAmount: parseInt(t) || 0 })}
        placeholder="0"
        keyboardType="numeric"
        isDark={isDark}
        prefix="AED"
      />
    </View>
  );
}

// =====================================================================
// MAIN SCREEN
// =====================================================================
export default function ApplicationScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // Auth
  const { userDoc, firebaseUser } = useAuthStore();
  const { create: createApp, loading, uploading } = useApplicationStore();

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  // Form data
  const [identity, setIdentity] = useState<ApplicantIdentity>(() => ({
    ...defaultIdentity(),
    fullName: userDoc?.displayName || '',
  }));
  const [contact, setContact] = useState<ContactResidency>(() => ({
    ...defaultContact(),
    email: userDoc?.email || firebaseUser?.email || '',
    mobileNumber: userDoc?.phone || '',
  }));
  const [employment, setEmployment] = useState<EmploymentIncome>(defaultEmployment);
  const [financial, setFinancial] = useState<FinancialObligations>(defaultFinancial);
  const [property, setProperty] = useState<PropertyDetails>(defaultProperty);
  const [mortgage, setMortgage] = useState<MortgagePreferences>(defaultMortgage);
  const [eligibility, setEligibility] = useState<EligibilityResults>(defaultEligibility);
  const [documents, setDocuments] = useState<DocumentUploads>(defaultDocuments);
  const [consent, setConsent] = useState<ConsentDeclarations>(defaultConsent);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step progress for header
  const progress = useMemo(() => {
    return Math.round(((currentStep) / (STEPS.length - 1)) * 100);
  }, [currentStep]);

  // ---- Auto-calculations ----
  // Financial obligations total EMI
  React.useEffect(() => {
    const total = financial.loans.reduce((sum, l) => sum + l.emiAmount, 0);
    if (total !== financial.totalMonthlyEMI) {
      setFinancial((f) => ({ ...f, totalMonthlyEMI: total }));
    }
  }, [financial.loans]);

  // Mortgage preferences auto loan amount
  React.useEffect(() => {
    const loan = Math.max(0, mortgage.propertyValue - mortgage.downPaymentAmount);
    if (loan !== mortgage.preferredLoanAmount) {
      setMortgage((m) => ({ ...m, preferredLoanAmount: loan }));
    }
  }, [mortgage.propertyValue, mortgage.downPaymentAmount]);

  // DP percent sync
  React.useEffect(() => {
    if (mortgage.propertyValue > 0) {
      const pct = Math.round((mortgage.downPaymentAmount / mortgage.propertyValue) * 100);
      if (pct !== mortgage.downPaymentPercent) {
        setMortgage((m) => ({ ...m, downPaymentPercent: pct }));
      }
    }
  }, [mortgage.downPaymentAmount, mortgage.propertyValue]);

  // Sync property price to mortgage preferences
  React.useEffect(() => {
    if (property.propertyIdentified && property.purchasePrice > 0 && property.purchasePrice !== mortgage.propertyValue) {
      setMortgage((m) => ({ ...m, propertyValue: property.purchasePrice }));
    }
  }, [property.purchasePrice, property.propertyIdentified]);

  // Auto-calculate eligibility when entering step 6
  const computeEligibility = useCallback(() => {
    const salary = employment.employmentType === 'salaried' || employment.employmentType === ''
      ? employment.salaried.monthlyNetSalary
      : employment.selfEmployed.monthlyAverageIncome;

    if (salary <= 0) return;

    const totalEMIs = financial.totalMonthlyEMI;
    const loanAmount = mortgage.preferredLoanAmount;
    const rate = 4.5; // avg UAE rate for estimation

    const emiResult = loanAmount > 0 ? calculateEMI({
      principal: loanAmount,
      annualRate: rate,
      years: mortgage.loanTenureYears,
    }) : { monthlyInstallment: 0, totalPayment: 0, totalInterest: 0, principal: 0 };

    const newEMI = emiResult.monthlyInstallment;
    const dbr = salary > 0 ? Math.round(((totalEMIs + newEMI) / salary) * 100) : 0;
    const ltv = mortgage.propertyValue > 0
      ? Math.round(((mortgage.propertyValue - mortgage.downPaymentAmount) / mortgage.propertyValue) * 100) : 0;

    // Max eligible based on 50% DBR
    const maxEMI = Math.max(0, Math.floor(salary * 0.5) - totalEMIs);
    const maxLoan = maxEMI > 0 ? Math.round(maxEMI * ((Math.pow(1 + rate / 1200, mortgage.loanTenureYears * 12) - 1) / ((rate / 1200) * Math.pow(1 + rate / 1200, mortgage.loanTenureYears * 12)))) : 0;

    const minDPPct = getMinDownPaymentPercent(true, mortgage.isFirstTimeBuyer, mortgage.propertyValue);
    const minDP = Math.round(mortgage.propertyValue * minDPPct / 100);
    const additionalDP = Math.max(0, minDP - mortgage.downPaymentAmount);

    // Bank count estimate based on DBR
    let bankCount = 0;
    if (dbr <= 35) bankCount = 8;
    else if (dbr <= 40) bankCount = 6;
    else if (dbr <= 45) bankCount = 4;
    else if (dbr <= 50) bankCount = 2;

    setEligibility({
      eligibleLoanAmount: Math.min(maxLoan, loanAmount > 0 ? loanAmount : maxLoan),
      estimatedEMI: newEMI,
      dbrPercent: dbr,
      ltvPercent: ltv,
      approxRateMin: 3.99,
      approxRateMax: 5.49,
      eligibleBanksCount: bankCount,
      additionalDownPaymentRequired: additionalDP,
    });
  }, [employment, financial, mortgage]);

  // ---- Validation ----
  const validateStep = (step: number): boolean => {
    const e: Record<string, string> = {};

    switch (step) {
      case 0: // Identity
        if (!identity.fullName.trim()) e.fullName = 'Required';
        if (!identity.nationality.trim()) e.nationality = 'Required';
        if (!identity.emiratesIdNumber.trim()) e.emiratesIdNumber = 'Required';
        if (!identity.passportNumber.trim()) e.passportNumber = 'Required';
        break;
      case 1: // Contact
        if (!contact.mobileNumber.trim()) e.mobileNumber = 'Required';
        if (!contact.email.trim()) e.email = 'Required';
        if (!contact.emirate) e.emirate = 'Select an emirate';
        break;
      case 2: // Employment
        if (!employment.employmentType) e.employmentType = 'Select employment type';
        if (employment.employmentType === 'salaried') {
          if (!employment.salaried.employerName.trim()) e.employerName = 'Required';
          if (employment.salaried.monthlyNetSalary <= 0) e.monthlyNetSalary = 'Required';
        } else if (employment.employmentType === 'self_employed' || employment.employmentType === 'business_owner') {
          if (!employment.selfEmployed.companyName.trim()) e.companyName = 'Required';
          if (employment.selfEmployed.monthlyAverageIncome <= 0) e.monthlyAverageIncome = 'Required';
        }
        break;
      case 5: // Mortgage
        if (mortgage.propertyValue <= 0) e.propertyValue = 'Required';
        if (mortgage.downPaymentAmount <= 0) e.downPaymentAmount = 'Required';
        if (!mortgage.interestType) e.interestType = 'Select interest type';
        break;
      case 8: // Consent
        if (!consent.aecbConsent) e.aecbConsent = 'Required';
        if (!consent.bankContactConsent) e.bankContactConsent = 'Required';
        if (!consent.dataProcessingConsent) e.dataProcessingConsent = 'Required';
        if (!consent.accuracyConfirmation) e.accuracyConfirmation = 'Required';
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---- Navigation ----
  const goNext = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Missing Information', 'Please fill in all required fields before continuing.');
      return;
    }
    if (currentStep === 6) computeEligibility();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // ---- Document picker ----
  const handlePickDocument = async (category: DocumentCategory) => {
    if (!firebaseUser) {
      Alert.alert('Error', 'You must be logged in to upload documents.');
      return;
    }

    try {
      // Save draft first if not already saved to get an application ID
      let applicationId = appId;
      if (!applicationId) {
        try {
          applicationId = await useApplicationStore.getState().saveDraft({
            userId: firebaseUser.uid,
            status: 'draft',
            currentStep,
            applicantIdentity: identity,
            contactResidency: contact,
            employmentIncome: employment,
            financialObligations: financial,
            propertyDetails: property,
            mortgagePreferences: mortgage,
            eligibilityResults: eligibility,
            documentUploads: documents,
            consentDeclarations: consent,
          });
          setAppId(applicationId);
          setDraftSaved(true);
        } catch (err: any) {
          Alert.alert('Error', 'Failed to save draft. Please try again.');
          return;
        }
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
               'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      // Show uploading indicator
      const tempId = `${category}_${Date.now()}`;
      const tempDoc: UploadedDocument = {
        id: tempId,
        category,
        fileName: file.name,
        fileSize: file.size || 0,
        mimeType: file.mimeType || 'application/octet-stream',
        downloadURL: file.uri, // temporary local URI
        uploadedAt: new Date().toISOString(),
      };

      // Add temp doc to show in UI
      setDocuments((prev) => ({
        documents: [...prev.documents, tempDoc],
      }));

      // Upload to Firebase Storage
      try {
        const uploadedDoc = await useApplicationStore.getState().uploadDoc(
          firebaseUser.uid,
          applicationId,
          category,
          file.uri,
          file.name,
          file.size || 0,
          file.mimeType || 'application/octet-stream'
        );

        // Replace temp doc with uploaded doc
        setDocuments((prev) => ({
          documents: prev.documents.map((d) => 
            d.id === tempId ? uploadedDoc : d
          ),
        }));

        // Update draft with new document
        await useApplicationStore.getState().update(applicationId, {
          documentUploads: {
            documents: documents.documents.map((d) => 
              d.id === tempId ? uploadedDoc : d
            ),
          },
        });
      } catch (uploadErr: any) {
        // Remove temp doc on upload failure
        setDocuments((prev) => ({
          documents: prev.documents.filter((d) => d.id !== tempId),
        }));
        Alert.alert('Upload Failed', uploadErr.message || 'Failed to upload document to storage.');
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveDocument = async (docId: string) => {
    const doc = documents.documents.find((d) => d.id === docId);
    if (!doc) return;

    // If document has a Firebase Storage URL, delete it
    if (doc.downloadURL && doc.downloadURL.startsWith('https://')) {
      try {
        await useApplicationStore.getState().deleteDoc(doc.downloadURL);
      } catch (err) {
        console.warn('Failed to delete document from storage:', err);
      }
    }

    setDocuments((prev) => ({
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!firebaseUser) {
      Alert.alert('Error', 'You must be logged in to submit an application.');
      return;
    }

    if (!validateStep(8)) {
      Alert.alert('Consent Required', 'Please accept all required consents before submitting.');
      return;
    }

    try {
      const id = await createApp({
        userId: firebaseUser.uid,
        status: 'submitted',
        currentStep: 9,
        applicantIdentity: identity,
        contactResidency: contact,
        employmentIncome: employment,
        financialObligations: financial,
        propertyDetails: property,
        mortgagePreferences: mortgage,
        eligibilityResults: eligibility,
        documentUploads: documents,
        consentDeclarations: consent,
      });
      setAppId(id);
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit application.');
    }
  };

  // =====================================================================
  // SUCCESS SCREEN (after submit)
  // =====================================================================
  if (submitted) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Animated.View entering={FadeIn.duration(500)} className="flex-1 items-center justify-center px-8">
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              isDark ? 'bg-green-500/10' : 'bg-green-50'
            }`}>
            <Feather name="check-circle" size={48} color="#22c55e" />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(400)}
            className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-black'}`}>
            Application Submitted!
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(400).duration(400)}
            className={`text-sm text-center mb-2 leading-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your mortgage application has been submitted successfully. We'll review it and get back to you shortly.
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.delay(500).duration(400)}
            className={`px-5 py-3 rounded-xl mt-2 mb-8 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
            <Text className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Application ID</Text>
            <Text className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-black'}`}>{appId}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(400)} className="w-full">
            <Pressable
              onPress={() => router.push('/my-applications' as any)}
              className={`w-full rounded-2xl py-3.5 items-center mb-3 ${isDark ? 'bg-white' : 'bg-black'}`}>
              <Text className={`text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>Track Application</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className={`w-full rounded-2xl py-3.5 items-center border ${
                isDark ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
              <Text className={`text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Back to Home</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // =====================================================================
  // RENDER
  // =====================================================================
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      {/* ---- Wizard Header ---- */}
      <Animated.View entering={FadeIn.duration(300)} className="px-6 pt-3 pb-2">
        {/* Back button + Progress bar row */}
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => { currentStep > 0 ? goBack() : router.back(); }}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isDark ? 'bg-white' : 'bg-black'
            }`}
            style={{
              shadowColor: isDark ? '#fff' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}>
            <Feather name="arrow-left" size={22} color={isDark ? '#000' : '#fff'} />
          </Pressable>
          <View className="flex-1">
            {/* Progress bar */}
            <View className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
              <Animated.View
                className="h-full rounded-full"
                style={{
                  width: `${progress}%` as any,
                  backgroundColor: isDark ? '#fff' : '#000',
                }}
              />
            </View>
          </View>
          {/* Step counter badge */}
          <View className={`px-3.5 py-2 rounded-xl ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
            <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {currentStep + 1}/{STEPS.length}
            </Text>
          </View>
        </View>

        {/* Step tabs - horizontally scrollable */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 4, gap: 8 }}>
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <Pressable
                key={step.key}
                onPress={() => goToStep(index)}
                className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                  isCurrent
                    ? isDark ? 'bg-white border-white' : 'bg-black border-black'
                    : isCompleted
                      ? 'bg-green-500/10 border-green-500/30'
                      : isDark ? 'bg-[#111] border-[#2a2a2a]' : 'bg-white border-gray-200'
                }`}>
                {isCompleted ? (
                  <View className="w-5 h-5 rounded-full bg-green-500 items-center justify-center mr-2">
                    <Feather name="check" size={11} color="#fff" />
                  </View>
                ) : (
                  <View className={`w-5 h-5 rounded-full items-center justify-center mr-2 ${
                    isCurrent
                      ? isDark ? 'bg-black/10' : 'bg-white/20'
                      : isDark ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                    <Feather
                      name={step.icon as any} size={11}
                      color={isCurrent ? (isDark ? '#000' : '#fff') : isDark ? '#666' : '#999'}
                    />
                  </View>
                )}
                <Text className={`text-sm font-semibold ${
                  isCurrent
                    ? isDark ? 'text-black' : 'text-white'
                    : isCompleted
                      ? 'text-green-500'
                      : isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>{step.short}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ---- Form Content ---- */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ===== STEP 1: Applicant Identity ===== */}
          {currentStep === 0 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-0">
              <StepHeader heading={STEPS[0].heading} subtitle={STEPS[0].subtitle} isDark={isDark} />
              <SectionCard icon="user" title="Applicant Identity (KYC)" isDark={isDark} delay={100}>
                <FormField label="Full Name (as per Emirates ID)" value={identity.fullName}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, fullName: t }))}
                  placeholder="Enter full legal name" isDark={isDark} required error={errors.fullName} />
                <FormField label="Nationality" value={identity.nationality}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, nationality: t }))}
                  placeholder="e.g., UAE, Indian, British" isDark={isDark} required error={errors.nationality} />
                <FormField label="Date of Birth" value={identity.dateOfBirth}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, dateOfBirth: t }))}
                  placeholder="DD/MM/YYYY" isDark={isDark} />
                <ChipSelect<Gender>
                  label="Gender" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]}
                  selected={identity.gender} onSelect={(v) => setIdentity((s) => ({ ...s, gender: v }))} isDark={isDark} />
                <ChipSelect<MaritalStatus>
                  label="Marital Status" options={[
                    { value: 'single', label: 'Single' }, { value: 'married', label: 'Married' },
                    { value: 'divorced', label: 'Divorced' }, { value: 'widowed', label: 'Widowed' },
                  ]}
                  selected={identity.maritalStatus}
                  onSelect={(v) => setIdentity((s) => ({ ...s, maritalStatus: v }))} isDark={isDark} />
                <FormField label="Number of Dependents" value={identity.numberOfDependents > 0 ? String(identity.numberOfDependents) : ''}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, numberOfDependents: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} />
              </SectionCard>

              <SectionCard icon="credit-card" title="ID Documents" isDark={isDark} delay={200}>
                <FormField label="Emirates ID Number" value={identity.emiratesIdNumber}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, emiratesIdNumber: t }))}
                  placeholder="784-XXXX-XXXXXXX-X" isDark={isDark} required error={errors.emiratesIdNumber} />
                <FormField label="Emirates ID Expiry" value={identity.emiratesIdExpiry}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, emiratesIdExpiry: t }))}
                  placeholder="DD/MM/YYYY" isDark={isDark} />
                <FormField label="Passport Number" value={identity.passportNumber}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, passportNumber: t }))}
                  placeholder="Enter passport number" isDark={isDark} required error={errors.passportNumber} />
                <FormField label="Passport Expiry" value={identity.passportExpiry}
                  onChangeText={(t) => setIdentity((s) => ({ ...s, passportExpiry: t }))}
                  placeholder="DD/MM/YYYY" isDark={isDark} />
              </SectionCard>

              <SectionCard icon="upload" title="Upload KYC Documents" isDark={isDark} delay={300}>
                <DocUploadCard label="Emirates ID (Front)" category="emirates_id_front"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />
                <DocUploadCard label="Emirates ID (Back)" category="emirates_id_back"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />
                <DocUploadCard label="Passport Copy" category="passport"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />
                <DocUploadCard label="Visa Page" category="visa"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark}
                  hint="Required if not a UAE national" />
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 2: Contact & Residency ===== */}
          {currentStep === 1 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-1">
              <StepHeader heading={STEPS[1].heading} subtitle={STEPS[1].subtitle} isDark={isDark} />
              <SectionCard icon="phone" title="Contact Details" isDark={isDark} delay={100}>
                <FormField label="Mobile Number (UAE)" value={contact.mobileNumber}
                  onChangeText={(t) => setContact((s) => ({ ...s, mobileNumber: t }))}
                  placeholder="+971 50 123 4567" keyboardType="phone-pad" isDark={isDark}
                  required error={errors.mobileNumber} />
                <FormField label="Email Address" value={contact.email}
                  onChangeText={(t) => setContact((s) => ({ ...s, email: t }))}
                  placeholder="name@example.com" keyboardType="email-address" isDark={isDark}
                  required error={errors.email} />
              </SectionCard>

              <SectionCard icon="map-pin" title="Residency Details" isDark={isDark} delay={200}>
                <FormField label="Current UAE Address" value={contact.currentAddress}
                  onChangeText={(t) => setContact((s) => ({ ...s, currentAddress: t }))}
                  placeholder="Building, Street, Area" isDark={isDark} multiline />
                <ChipSelect<EmirateType>
                  label="Emirate" required
                  options={[
                    { value: 'dubai', label: 'Dubai' }, { value: 'abu_dhabi', label: 'Abu Dhabi' },
                    { value: 'sharjah', label: 'Sharjah' }, { value: 'other', label: 'Other' },
                  ]}
                  selected={contact.emirate}
                  onSelect={(v) => setContact((s) => ({ ...s, emirate: v }))} isDark={isDark} />
                <ChipSelect<ResidentialStatus>
                  label="Residential Status"
                  options={[
                    { value: 'rent', label: 'Rent' }, { value: 'own', label: 'Own' },
                    { value: 'company_provided', label: 'Company Provided' },
                  ]}
                  selected={contact.residentialStatus}
                  onSelect={(v) => setContact((s) => ({ ...s, residentialStatus: v }))} isDark={isDark} />
                <FormField label="Years Living in UAE" value={contact.yearsInUAE > 0 ? String(contact.yearsInUAE) : ''}
                  onChangeText={(t) => setContact((s) => ({ ...s, yearsInUAE: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} />
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 3: Employment & Income ===== */}
          {currentStep === 2 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-2">
              <StepHeader heading={STEPS[2].heading} subtitle={STEPS[2].subtitle} isDark={isDark} />
              <SectionCard icon="briefcase" title="Employment Type" isDark={isDark} delay={100}>
                <ChipSelect<EmploymentType>
                  label="Select your employment type" required
                  options={[
                    { value: 'salaried', label: 'Salaried' },
                    { value: 'self_employed', label: 'Self-Employed' },
                    { value: 'business_owner', label: 'Business Owner' },
                    { value: 'freelancer', label: 'Freelancer' },
                  ]}
                  selected={employment.employmentType}
                  onSelect={(v) => setEmployment((s) => ({ ...s, employmentType: v }))} isDark={isDark} />
              </SectionCard>

              {/* Salaried fields */}
              {(employment.employmentType === 'salaried' || employment.employmentType === 'freelancer') && (
                <SectionCard icon="user" title="Salaried Details" isDark={isDark} delay={200}>
                  <FormField label="Employer Name" value={employment.salaried.employerName}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, employerName: t } }))}
                    placeholder="Company name" isDark={isDark} required error={errors.employerName} />
                  <FormField label="Employer Industry" value={employment.salaried.employerIndustry}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, employerIndustry: t } }))}
                    placeholder="e.g., Banking, Real Estate, IT" isDark={isDark} />
                  <FormField label="Job Title" value={employment.salaried.jobTitle}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, jobTitle: t } }))}
                    placeholder="Your position" isDark={isDark} />
                  <ChipSelect<SalariedEmploymentType>
                    label="Employment Type"
                    options={[{ value: 'permanent', label: 'Permanent' }, { value: 'contract', label: 'Contract' }]}
                    selected={employment.salaried.salariedEmploymentType}
                    onSelect={(v) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, salariedEmploymentType: v } }))}
                    isDark={isDark} />
                  <FormField label="Monthly Gross Salary" value={employment.salaried.monthlyGrossSalary > 0 ? String(employment.salaried.monthlyGrossSalary) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, monthlyGrossSalary: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" />
                  <FormField label="Monthly Net Salary" value={employment.salaried.monthlyNetSalary > 0 ? String(employment.salaried.monthlyNetSalary) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, monthlyNetSalary: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" required error={errors.monthlyNetSalary} />
                  <FormField label="Salary Transfer Bank" value={employment.salaried.salaryTransferBank}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, salaryTransferBank: t } }))}
                    placeholder="e.g., ENBD, ADCB, FAB" isDark={isDark} />
                  <FormField label="Length of Service (months)" value={employment.salaried.lengthOfServiceMonths > 0 ? String(employment.salaried.lengthOfServiceMonths) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, salaried: { ...s.salaried, lengthOfServiceMonths: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} />
                </SectionCard>
              )}

              {/* Self-employed / Business owner fields */}
              {(employment.employmentType === 'self_employed' || employment.employmentType === 'business_owner') && (
                <SectionCard icon="briefcase" title="Business Details" isDark={isDark} delay={200}>
                  <FormField label="Company Name" value={employment.selfEmployed.companyName}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, companyName: t } }))}
                    placeholder="Company name" isDark={isDark} required error={errors.companyName} />
                  <FormField label="Trade License Number" value={employment.selfEmployed.tradeLicenseNumber}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, tradeLicenseNumber: t } }))}
                    placeholder="License number" isDark={isDark} />
                  <FormField label="Company Age (Years)" value={employment.selfEmployed.companyAgeYears > 0 ? String(employment.selfEmployed.companyAgeYears) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, companyAgeYears: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} />
                  <FormField label="Ownership Percentage" value={employment.selfEmployed.ownershipPercentage > 0 ? String(employment.selfEmployed.ownershipPercentage) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, ownershipPercentage: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} suffix="%" />
                  <FormField label="Monthly Average Income" value={employment.selfEmployed.monthlyAverageIncome > 0 ? String(employment.selfEmployed.monthlyAverageIncome) : ''}
                    onChangeText={(t) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, monthlyAverageIncome: parseInt(t) || 0 } }))}
                    placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" required error={errors.monthlyAverageIncome} />
                  <ChipSelect<OfficeLocationType>
                    label="Office Location"
                    options={[{ value: 'freezone', label: 'Freezone' }, { value: 'mainland', label: 'Mainland' }]}
                    selected={employment.selfEmployed.officeLocation}
                    onSelect={(v) => setEmployment((s) => ({ ...s, selfEmployed: { ...s.selfEmployed, officeLocation: v } }))}
                    isDark={isDark} />
                </SectionCard>
              )}

              {/* Employment documents */}
              <SectionCard icon="upload" title="Employment Documents" isDark={isDark} delay={300}>
                {(employment.employmentType === 'salaried' || employment.employmentType === 'freelancer') ? (
                  <>
                    <DocUploadCard label="Salary Certificate" category="salary_certificate"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} required />
                    <DocUploadCard label="Bank Statements (3-6 months)" category="bank_statements"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} required
                      hint="Last 3-6 months statements from salary transfer bank" />
                    <DocUploadCard label="Labour Contract" category="labour_contract"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} />
                  </>
                ) : (
                  <>
                    <DocUploadCard label="Trade License" category="trade_license"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} required />
                    <DocUploadCard label="Memorandum of Association (MOA)" category="moa"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} />
                    <DocUploadCard label="Bank Statements (6-12 months)" category="bank_statements"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} required
                      hint="Last 6-12 months business bank statements" />
                    <DocUploadCard label="Audited Financials" category="audited_financials"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark}
                      hint="If available — strengthens your application" />
                  </>
                )}
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 4: Financial Obligations ===== */}
          {currentStep === 3 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-3">
              <StepHeader heading={STEPS[3].heading} subtitle={STEPS[3].subtitle} isDark={isDark} />
              <SectionCard icon="credit-card" title="Financial Obligations" isDark={isDark} delay={100}>
                <View className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-[#0d0d0d]' : 'bg-amber-50'}`}>
                  <View className="flex-row items-center mb-1">
                    <Feather name="alert-triangle" size={14} color="#f59e0b" />
                    <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Important for Eligibility
                    </Text>
                  </View>
                  <Text className={`text-[11px] leading-4 ${isDark ? 'text-gray-500' : 'text-amber-600'}`}>
                    UAE banks calculate your Debt Burden Ratio (DBR). Total EMIs must be below 50% of income.
                  </Text>
                </View>

                <ToggleSwitch
                  label="Do you have existing loans?"
                  value={financial.hasExistingLoans}
                  onToggle={(v) => setFinancial((s) => ({ ...s, hasExistingLoans: v, loans: v ? s.loans : [] }))}
                  isDark={isDark} />

                {financial.hasExistingLoans && (
                  <>
                    {financial.loans.map((loan, i) => (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        isDark={isDark}
                        onUpdate={(updated) => setFinancial((s) => ({
                          ...s, loans: s.loans.map((l) => l.id === updated.id ? updated : l),
                        }))}
                        onRemove={() => setFinancial((s) => ({
                          ...s, loans: s.loans.filter((l) => l.id !== loan.id),
                        }))}
                      />
                    ))}

                    <Pressable
                      onPress={() => setFinancial((s) => ({
                        ...s,
                        loans: [...s.loans, {
                          id: `loan_${Date.now()}`,
                          type: 'personal',
                          label: 'Personal Loan',
                          emiAmount: 0,
                        }],
                      }))}
                      className={`flex-row items-center justify-center p-3 rounded-xl border border-dashed mb-4 ${
                        isDark ? 'border-[#333]' : 'border-gray-300'
                      }`}>
                      <Feather name="plus" size={16} color={isDark ? '#666' : '#999'} />
                      <Text className={`ml-2 text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Add Obligation
                      </Text>
                    </Pressable>
                  </>
                )}

                <FormField label="Number of Credit Cards" value={financial.creditCardsCount > 0 ? String(financial.creditCardsCount) : ''}
                  onChangeText={(t) => setFinancial((s) => ({ ...s, creditCardsCount: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} />
                <FormField label="Total Credit Card Limit" value={financial.totalCreditCardLimit > 0 ? String(financial.totalCreditCardLimit) : ''}
                  onChangeText={(t) => setFinancial((s) => ({ ...s, totalCreditCardLimit: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED"
                  hint="Combined limit across all cards" />

                {/* Auto-calculated total */}
                <View className={`mt-2 p-4 rounded-2xl ${isDark ? 'bg-white' : 'bg-black'}`}>
                  <Text className={`text-[10px] ${isDark ? 'text-black/50' : 'text-white/50'}`}>
                    Total Monthly EMI (Auto-calculated)
                  </Text>
                  <Text className={`text-xl font-bold mt-0.5 ${isDark ? 'text-black' : 'text-white'}`}>
                    {fmtAED(financial.totalMonthlyEMI)}
                  </Text>
                </View>
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 5: Property Details ===== */}
          {currentStep === 4 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-4">
              <StepHeader heading={STEPS[4].heading} subtitle={STEPS[4].subtitle} isDark={isDark} />
              <SectionCard icon="home" title="Property Details" isDark={isDark} delay={100}>
                <ToggleSwitch
                  label="Have you identified a property?"
                  value={property.propertyIdentified}
                  onToggle={(v) => setProperty((s) => ({ ...s, propertyIdentified: v }))}
                  isDark={isDark}
                  description="Select No if you want pre-approval first" />

                {property.propertyIdentified ? (
                  <>
                    <ChipSelect<PropertyType>
                      label="Property Type" required
                      options={[
                        { value: 'apartment', label: 'Apartment' },
                        { value: 'villa', label: 'Villa' },
                        { value: 'townhouse', label: 'Townhouse' },
                      ]}
                      selected={property.propertyType}
                      onSelect={(v) => setProperty((s) => ({ ...s, propertyType: v }))} isDark={isDark} />
                    <ChipSelect<PropertyReadiness>
                      label="Property Status"
                      options={[{ value: 'ready', label: 'Ready' }, { value: 'off_plan', label: 'Off-Plan' }]}
                      selected={property.propertyStatus}
                      onSelect={(v) => setProperty((s) => ({ ...s, propertyStatus: v }))} isDark={isDark} />
                    <FormField label="Developer Name" value={property.developerName}
                      onChangeText={(t) => setProperty((s) => ({ ...s, developerName: t }))}
                      placeholder="e.g., Emaar, Damac, Nakheel" isDark={isDark} />
                    <FormField label="Project Name" value={property.projectName}
                      onChangeText={(t) => setProperty((s) => ({ ...s, projectName: t }))}
                      placeholder="e.g., Downtown Views, Marina Gate" isDark={isDark} />
                    <FormField label="Location / Area" value={property.locationArea}
                      onChangeText={(t) => setProperty((s) => ({ ...s, locationArea: t }))}
                      placeholder="e.g., Dubai Marina, JBR" isDark={isDark} />
                    <FormField label="Purchase Price" value={property.purchasePrice > 0 ? String(property.purchasePrice) : ''}
                      onChangeText={(t) => setProperty((s) => ({ ...s, purchasePrice: parseInt(t) || 0 }))}
                      placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" required />
                    {property.propertyStatus === 'off_plan' && (
                      <FormField label="Expected Completion Date" value={property.expectedCompletionDate}
                        onChangeText={(t) => setProperty((s) => ({ ...s, expectedCompletionDate: t }))}
                        placeholder="MM/YYYY" isDark={isDark} />
                    )}
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <FormField label="Unit Size" value={property.unitSizeSqft > 0 ? String(property.unitSizeSqft) : ''}
                          onChangeText={(t) => setProperty((s) => ({ ...s, unitSizeSqft: parseInt(t) || 0 }))}
                          placeholder="0" keyboardType="numeric" isDark={isDark} suffix="sqft" />
                      </View>
                      <View className="flex-1">
                        <FormField label="Bedrooms" value={property.numberOfBedrooms > 0 ? String(property.numberOfBedrooms) : ''}
                          onChangeText={(t) => setProperty((s) => ({ ...s, numberOfBedrooms: parseInt(t) || 0 }))}
                          placeholder="0" keyboardType="numeric" isDark={isDark} />
                      </View>
                    </View>
                    <ToggleSwitch label="Parking Included?" value={property.parkingIncluded}
                      onToggle={(v) => setProperty((s) => ({ ...s, parkingIncluded: v }))} isDark={isDark} />
                  </>
                ) : (
                  <View className={`p-5 rounded-2xl items-center ${isDark ? 'bg-[#0d0d0d]' : 'bg-blue-50'}`}>
                    <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 ${
                      isDark ? 'bg-[#1a1a1a]' : 'bg-blue-100'
                    }`}>
                      <Feather name="search" size={24} color={isDark ? '#6366f1' : '#3b82f6'} />
                    </View>
                    <Text className={`text-sm font-semibold text-center ${isDark ? 'text-white' : 'text-black'}`}>
                      No property yet? No problem!
                    </Text>
                    <Text className={`text-xs text-center mt-1 leading-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      We'll help you find a suitable property after pre-approval. You can proceed with the application.
                    </Text>
                  </View>
                )}
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 6: Mortgage Preferences ===== */}
          {currentStep === 5 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-5">
              <StepHeader heading={STEPS[5].heading} subtitle={STEPS[5].subtitle} isDark={isDark} />
              <SectionCard icon="sliders" title="Mortgage Preferences" isDark={isDark} delay={100}>
                <FormField label="Property Value" value={mortgage.propertyValue > 0 ? String(mortgage.propertyValue) : ''}
                  onChangeText={(t) => setMortgage((s) => ({ ...s, propertyValue: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" required error={errors.propertyValue} />
                <FormField label="Down Payment Available" value={mortgage.downPaymentAmount > 0 ? String(mortgage.downPaymentAmount) : ''}
                  onChangeText={(t) => setMortgage((s) => ({ ...s, downPaymentAmount: parseInt(t) || 0 }))}
                  placeholder="0" keyboardType="numeric" isDark={isDark} prefix="AED" required error={errors.downPaymentAmount} />

                {mortgage.propertyValue > 0 && mortgage.downPaymentAmount > 0 && (
                  <View className={`flex-row gap-3 mb-4`}>
                    <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Down Payment</Text>
                      <Text className={`text-sm font-bold ${
                        mortgage.downPaymentPercent >= 20 ? 'text-green-500' : 'text-amber-500'
                      }`}>{mortgage.downPaymentPercent}%</Text>
                    </View>
                    <View className={`flex-1 p-3 rounded-xl ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
                      <Text className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Loan Amount</Text>
                      <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {fmtShort(mortgage.preferredLoanAmount)}
                      </Text>
                    </View>
                  </View>
                )}

                <FormField label="Loan Tenure" value={mortgage.loanTenureYears > 0 ? String(mortgage.loanTenureYears) : ''}
                  onChangeText={(t) => setMortgage((s) => ({ ...s, loanTenureYears: Math.min(25, parseInt(t) || 0) }))}
                  placeholder="25" keyboardType="numeric" isDark={isDark} suffix="years"
                  hint="Maximum 25 years in UAE" />

                <ChipSelect<InterestType>
                  label="Interest Type" required
                  options={[
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'variable', label: 'Variable' },
                    { value: 'fixed_to_variable', label: 'Fixed → Variable' },
                  ]}
                  selected={mortgage.interestType}
                  onSelect={(v) => setMortgage((s) => ({ ...s, interestType: v }))} isDark={isDark} />

                <ToggleSwitch label="First-Time Buyer?"
                  value={mortgage.isFirstTimeBuyer}
                  onToggle={(v) => setMortgage((s) => ({ ...s, isFirstTimeBuyer: v }))} isDark={isDark}
                  description="First-time buyers get lower down payment requirements (20% vs 25%)" />
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 7: Eligibility & Calculations ===== */}
          {currentStep === 6 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-6">
              <StepHeader heading={STEPS[6].heading} subtitle={STEPS[6].subtitle} isDark={isDark} />
              {/* Hero Eligibility Card */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                className={`rounded-3xl p-6 mb-4 ${isDark ? 'bg-white' : 'bg-black'}`}>
                <View className="flex-row items-center mb-3">
                  <Feather name="bar-chart-2" size={18} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    Eligibility Summary
                  </Text>
                </View>
                <Text className={`text-3xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  {fmtAED(eligibility.estimatedEMI)}
                  <Text className={`text-base font-normal ${isDark ? 'text-black/50' : 'text-white/50'}`}> /mo</Text>
                </Text>
                <Text className={`text-xs mt-1 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                  Estimated monthly installment
                </Text>

                {eligibility.eligibleBanksCount > 0 && (
                  <View className="flex-row items-center mt-3">
                    <View className="px-3 py-1.5 rounded-full bg-emerald-500/20">
                      <Text className="text-xs font-bold text-emerald-500">
                        Eligible with ~{eligibility.eligibleBanksCount} banks
                      </Text>
                    </View>
                  </View>
                )}
                {eligibility.dbrPercent > 50 && (
                  <View className="flex-row items-center mt-3">
                    <View className="px-3 py-1.5 rounded-full bg-red-500/20">
                      <Text className="text-xs font-bold text-red-500">
                        DBR exceeds 50% — may need adjustment
                      </Text>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* Metrics Grid */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} className="flex-row gap-3 mb-3">
                <MetricCard label="Eligible Loan" value={fmtShort(eligibility.eligibleLoanAmount)}
                  icon="dollar-sign" isDark={isDark} large />
                <MetricCard label="DBR" value={`${eligibility.dbrPercent}%`}
                  icon="percent" isDark={isDark} color={eligibility.dbrPercent <= 50 ? '#22c55e' : '#ef4444'} large />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300).duration(400)} className="flex-row gap-3 mb-3">
                <MetricCard label="LTV" value={`${eligibility.ltvPercent}%`}
                  icon="trending-up" isDark={isDark} large />
                <MetricCard label="Rate Range" value={`${eligibility.approxRateMin}–${eligibility.approxRateMax}%`}
                  icon="percent" isDark={isDark} large />
              </Animated.View>

              {eligibility.additionalDownPaymentRequired > 0 && (
                <Animated.View entering={FadeInDown.delay(400).duration(400)}
                  className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <View className="flex-row items-center">
                    <Feather name="alert-circle" size={16} color="#f59e0b" />
                    <Text className={`ml-2 text-sm font-semibold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                      Additional Down Payment Required
                    </Text>
                  </View>
                  <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-amber-600'}`}>
                    You need {fmtAED(eligibility.additionalDownPaymentRequired)} more to meet the minimum down payment requirement.
                  </Text>
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown.delay(500).duration(400)}
                className={`rounded-2xl p-4 ${isDark ? 'bg-[#111] border border-[#1e1e1e]' : 'bg-white border border-gray-100'}`}>
                <View className="flex-row items-start">
                  <Feather name="info" size={12} color={isDark ? '#444' : '#bbb'} style={{ marginTop: 2 }} />
                  <Text className={`ml-2 text-[11px] leading-4 flex-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    These calculations are estimates based on standard UAE banking guidelines with an average rate of 4.5%.
                    Actual eligibility depends on your bank, credit history, and AECB score.
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          )}

          {/* ===== STEP 8: Supporting Documents ===== */}
          {currentStep === 7 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-7">
              <StepHeader heading={STEPS[7].heading} subtitle={STEPS[7].subtitle} isDark={isDark} />
              <SectionCard icon="upload" title="Supporting Documents" isDark={isDark} delay={100}>
                <Text className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Upload any additional documents. Documents can also be added later.
                </Text>

                <Text className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                  Identity Documents
                </Text>
                <DocUploadCard label="Emirates ID (Front & Back)" category="emirates_id_front"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />
                <DocUploadCard label="Passport + Visa" category="passport"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />

                <Text className={`text-sm font-bold mb-3 mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
                  Income Documents
                </Text>
                <DocUploadCard label="Salary Certificate / Trade License" category="salary_certificate"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />
                <DocUploadCard label="Bank Statements" category="bank_statements"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} required />

                {property.propertyIdentified && (
                  <>
                    <Text className={`text-sm font-bold mb-3 mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
                      Property Documents
                    </Text>
                    <DocUploadCard label="MOU (Memorandum of Understanding)" category="property_mou"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} />
                    <DocUploadCard label="Title Deed" category="title_deed"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} />
                    <DocUploadCard label="SPA (Sale Purchase Agreement)" category="spa"
                      documents={documents.documents} onPick={handlePickDocument}
                      onRemove={handleRemoveDocument} isDark={isDark} />
                  </>
                )}

                <DocUploadCard label="Other Documents" category="other"
                  documents={documents.documents} onPick={handlePickDocument}
                  onRemove={handleRemoveDocument} isDark={isDark} />
              </SectionCard>

              <View className={`flex-row items-start p-4 rounded-xl ${isDark ? 'bg-[#111]' : 'bg-blue-50'}`}>
                <Feather name="info" size={14} color="#3b82f6" style={{ marginTop: 2 }} />
                <Text className={`ml-2 text-[11px] flex-1 leading-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Supported formats: PDF, JPG, PNG, DOCX. Max file size: 10MB per file.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ===== STEP 9: Consent & Declarations ===== */}
          {currentStep === 8 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-8">
              <StepHeader heading={STEPS[8].heading} subtitle={STEPS[8].subtitle} isDark={isDark} />
              <SectionCard icon="shield" title="Consent & Declarations" isDark={isDark} delay={100}>
                <View className={`p-4 rounded-2xl mb-5 ${isDark ? 'bg-[#0d0d0d]' : 'bg-blue-50'}`}>
                  <View className="flex-row items-center mb-1">
                    <Feather name="lock" size={14} color={isDark ? '#6366f1' : '#3b82f6'} />
                    <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-indigo-400' : 'text-blue-700'}`}>
                      Compliance & Privacy
                    </Text>
                  </View>
                  <Text className={`text-[11px] leading-4 ${isDark ? 'text-gray-500' : 'text-blue-600'}`}>
                    Your data is protected under UAE PDPL (Personal Data Protection Law) and processed only for mortgage evaluation purposes.
                  </Text>
                </View>

                <ConsentCheck
                  label="I authorize MortgageConnect to access my credit report from Al Etihad Credit Bureau (AECB) for mortgage evaluation purposes."
                  checked={consent.aecbConsent}
                  onToggle={() => setConsent((s) => ({ ...s, aecbConsent: !s.aecbConsent }))}
                  isDark={isDark} required />

                <ConsentCheck
                  label="I consent to being contacted by partner banks and financial institutions regarding my mortgage application."
                  checked={consent.bankContactConsent}
                  onToggle={() => setConsent((s) => ({ ...s, bankContactConsent: !s.bankContactConsent }))}
                  isDark={isDark} required />

                <ConsentCheck
                  label="I consent to the processing and storage of my personal data in accordance with UAE PDPL for the purpose of this application."
                  checked={consent.dataProcessingConsent}
                  onToggle={() => setConsent((s) => ({ ...s, dataProcessingConsent: !s.dataProcessingConsent }))}
                  isDark={isDark} required />

                <ConsentCheck
                  label="I confirm that all information provided in this application is true and accurate to the best of my knowledge."
                  checked={consent.accuracyConfirmation}
                  onToggle={() => setConsent((s) => ({ ...s, accuracyConfirmation: !s.accuracyConfirmation }))}
                  isDark={isDark} required />
              </SectionCard>
            </Animated.View>
          )}

          {/* ===== STEP 10: Review & Submit ===== */}
          {currentStep === 9 && (
            <Animated.View entering={FadeInRight.duration(300)} key="step-9">
              <StepHeader heading={STEPS[9].heading} subtitle={STEPS[9].subtitle} isDark={isDark} />
              {/* Identity Review */}
              <SectionCard icon="user" title="Applicant Identity" isDark={isDark} delay={100}>
                <Pressable onPress={() => goToStep(0)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Full Name" value={identity.fullName} isDark={isDark} />
                <ReviewRow label="Nationality" value={identity.nationality} isDark={isDark} />
                <ReviewRow label="Date of Birth" value={identity.dateOfBirth} isDark={isDark} />
                <ReviewRow label="Gender" value={identity.gender || '—'} isDark={isDark} />
                <ReviewRow label="Emirates ID" value={identity.emiratesIdNumber} isDark={isDark} />
                <ReviewRow label="Passport" value={identity.passportNumber} isDark={isDark} />
              </SectionCard>

              {/* Contact Review */}
              <SectionCard icon="phone" title="Contact & Residency" isDark={isDark} delay={150}>
                <Pressable onPress={() => goToStep(1)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Mobile" value={contact.mobileNumber} isDark={isDark} />
                <ReviewRow label="Email" value={contact.email} isDark={isDark} />
                <ReviewRow label="Emirate" value={contact.emirate || '—'} isDark={isDark} />
                <ReviewRow label="Years in UAE" value={contact.yearsInUAE > 0 ? String(contact.yearsInUAE) : '—'} isDark={isDark} />
              </SectionCard>

              {/* Employment Review */}
              <SectionCard icon="briefcase" title="Employment" isDark={isDark} delay={200}>
                <Pressable onPress={() => goToStep(2)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Type" value={employment.employmentType || '—'} isDark={isDark} />
                {(employment.employmentType === 'salaried' || employment.employmentType === 'freelancer') ? (
                  <>
                    <ReviewRow label="Employer" value={employment.salaried.employerName} isDark={isDark} />
                    <ReviewRow label="Job Title" value={employment.salaried.jobTitle} isDark={isDark} />
                    <ReviewRow label="Net Salary" value={fmtAED(employment.salaried.monthlyNetSalary)} isDark={isDark} />
                  </>
                ) : (
                  <>
                    <ReviewRow label="Company" value={employment.selfEmployed.companyName} isDark={isDark} />
                    <ReviewRow label="Avg Income" value={fmtAED(employment.selfEmployed.monthlyAverageIncome)} isDark={isDark} />
                  </>
                )}
              </SectionCard>

              {/* Financial Review */}
              <SectionCard icon="credit-card" title="Financial Obligations" isDark={isDark} delay={250}>
                <Pressable onPress={() => goToStep(3)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Existing Loans" value={financial.hasExistingLoans ? 'Yes' : 'No'} isDark={isDark} />
                <ReviewRow label="Total Monthly EMI" value={fmtAED(financial.totalMonthlyEMI)} isDark={isDark} />
                <ReviewRow label="Credit Cards" value={String(financial.creditCardsCount)} isDark={isDark} />
              </SectionCard>

              {/* Property Review */}
              <SectionCard icon="home" title="Property" isDark={isDark} delay={300}>
                <Pressable onPress={() => goToStep(4)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Identified" value={property.propertyIdentified ? 'Yes' : 'No'} isDark={isDark} />
                {property.propertyIdentified && (
                  <>
                    <ReviewRow label="Type" value={property.propertyType || '—'} isDark={isDark} />
                    <ReviewRow label="Location" value={property.locationArea} isDark={isDark} />
                    <ReviewRow label="Price" value={fmtAED(property.purchasePrice)} isDark={isDark} />
                  </>
                )}
              </SectionCard>

              {/* Mortgage Review */}
              <SectionCard icon="sliders" title="Mortgage Preferences" isDark={isDark} delay={350}>
                <Pressable onPress={() => goToStep(5)} className="absolute top-5 right-5">
                  <Text className="text-xs text-blue-500 font-semibold">Edit</Text>
                </Pressable>
                <ReviewRow label="Property Value" value={fmtAED(mortgage.propertyValue)} isDark={isDark} />
                <ReviewRow label="Down Payment" value={`${fmtAED(mortgage.downPaymentAmount)} (${mortgage.downPaymentPercent}%)`} isDark={isDark} />
                <ReviewRow label="Loan Amount" value={fmtAED(mortgage.preferredLoanAmount)} isDark={isDark} />
                <ReviewRow label="Tenure" value={`${mortgage.loanTenureYears} years`} isDark={isDark} />
                <ReviewRow label="Interest Type" value={mortgage.interestType || '—'} isDark={isDark} />
                <ReviewRow label="First-Time Buyer" value={mortgage.isFirstTimeBuyer ? 'Yes' : 'No'} isDark={isDark} />
              </SectionCard>

              {/* Eligibility Summary */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                className={`rounded-3xl p-5 mb-4 ${isDark ? 'bg-white' : 'bg-black'}`}>
                <View className="flex-row items-center mb-2">
                  <Feather name="bar-chart-2" size={16} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-sm font-bold ${isDark ? 'text-black' : 'text-white'}`}>Eligibility</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className={`text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    {fmtAED(eligibility.estimatedEMI)}
                  </Text>
                  <Text className={`text-xs ml-1 ${isDark ? 'text-black/50' : 'text-white/50'}`}>/mo</Text>
                </View>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-black/40' : 'text-white/40'}`}>
                  DBR: {eligibility.dbrPercent}% · LTV: {eligibility.ltvPercent}% · ~{eligibility.eligibleBanksCount} banks
                </Text>
              </Animated.View>

              {/* Documents count */}
              <Animated.View
                entering={FadeInDown.delay(450).duration(400)}
                className={`rounded-2xl p-4 mb-4 border ${isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'}`}>
                <View className="flex-row items-center">
                  <Feather name="file" size={16} color={isDark ? '#fff' : '#000'} />
                  <Text className={`ml-2 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    Documents Uploaded
                  </Text>
                  <View className={`ml-auto px-2.5 py-1 rounded-full ${
                    documents.documents.length > 0 ? 'bg-green-500/10' : isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      documents.documents.length > 0 ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>{documents.documents.length}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Consent status */}
              <Animated.View
                entering={FadeInDown.delay(500).duration(400)}
                className={`rounded-2xl p-4 mb-4 border ${
                  consent.aecbConsent && consent.bankContactConsent && consent.dataProcessingConsent && consent.accuracyConfirmation
                    ? 'border-green-500/30 bg-green-500/5'
                    : isDark ? 'bg-[#111] border-[#1e1e1e]' : 'bg-white border-gray-100'
                }`}>
                <View className="flex-row items-center">
                  <Feather name="shield" size={16} color={
                    consent.aecbConsent && consent.bankContactConsent && consent.dataProcessingConsent && consent.accuracyConfirmation
                      ? '#22c55e' : isDark ? '#fff' : '#000'
                  } />
                  <Text className={`ml-2 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    Consents
                  </Text>
                  <View className="ml-auto">
                    <Text className={`text-xs font-semibold ${
                      consent.aecbConsent && consent.bankContactConsent && consent.dataProcessingConsent && consent.accuracyConfirmation
                        ? 'text-green-500' : 'text-amber-500'
                    }`}>
                      {[consent.aecbConsent, consent.bankContactConsent, consent.dataProcessingConsent, consent.accuracyConfirmation].filter(Boolean).length}/4 accepted
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---- Bottom Navigation ---- */}
      <View className={`absolute bottom-0 left-0 right-0 px-6 pt-5 pb-10 ${
        isDark ? 'bg-black/95 border-t border-[#1a1a1a]' : 'bg-gray-50/95 border-t border-gray-200'
      }`}
        style={{
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
        <View className="flex-row gap-3">
          {currentStep > 0 && (
            <Pressable
              onPress={goBack}
              className={`flex-1 rounded-2xl py-3.5 items-center border ${
                isDark ? 'border-[#2a2a2a]' : 'border-gray-300'
              }`}>
              <Text className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Back</Text>
            </Pressable>
          )}

          {currentStep < STEPS.length - 1 ? (
            <Pressable
              onPress={goNext}
              className={`${currentStep === 0 ? 'w-full' : 'flex-1'} rounded-2xl py-3.5 items-center ${isDark ? 'bg-white' : 'bg-black'}`}
              style={{
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <Text className={`text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>Continue</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className={`flex-1 rounded-2xl py-3.5 items-center flex-row justify-center ${
                loading ? 'opacity-50' : ''
              } ${isDark ? 'bg-white' : 'bg-black'}`}
              style={{
                shadowColor: isDark ? '#fff' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}>
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <>
                  <Feather name="send" size={18} color={isDark ? '#000' : '#fff'} />
                  <Text className={`ml-2 text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                    Submit Application
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
