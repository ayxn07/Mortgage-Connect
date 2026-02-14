import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ApplicantIdentity,
  ContactResidency,
  EmploymentIncome,
  FinancialObligations,
  PropertyDetails,
  MortgagePreferences,
  EligibilityResults,
  DocumentUploads,
  ConsentDeclarations,
} from '../types';

const DRAFTS_KEY = '@mortgage_app_drafts';

export interface ApplicationDraft {
  id: string;
  userId: string;
  currentStep: number;
  lastSaved: string;
  identity: ApplicantIdentity;
  contact: ContactResidency;
  employment: EmploymentIncome;
  financial: FinancialObligations;
  property: PropertyDetails;
  mortgage: MortgagePreferences;
  eligibility: EligibilityResults;
  documents: DocumentUploads;
  consent: ConsentDeclarations;
}

/**
 * Get all drafts from storage
 */
async function getAllDrafts(): Promise<ApplicationDraft[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(DRAFTS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading drafts:', error);
    return [];
  }
}

/**
 * Save all drafts to storage
 */
async function saveAllDrafts(drafts: ApplicationDraft[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(drafts);
    await AsyncStorage.setItem(DRAFTS_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving drafts:', error);
    throw error;
  }
}

/**
 * Save application draft to local storage
 * Each draft is unique and won't overwrite existing drafts
 */
export async function saveDraftLocally(draft: ApplicationDraft): Promise<void> {
  try {
    const drafts = await getAllDrafts();
    
    // Check if draft with this ID already exists
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    if (existingIndex >= 0) {
      // Update existing draft
      drafts[existingIndex] = draft;
    } else {
      // Add new draft
      drafts.push(draft);
    }
    
    await saveAllDrafts(drafts);
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Load all application drafts for a user from local storage
 */
export async function loadDraftsLocally(userId: string): Promise<ApplicationDraft[]> {
  try {
    const drafts = await getAllDrafts();
    return drafts.filter(d => d.userId === userId);
  } catch (error) {
    console.error('Error loading drafts:', error);
    return [];
  }
}

/**
 * Load a specific draft by ID
 */
export async function loadDraftById(draftId: string): Promise<ApplicationDraft | null> {
  try {
    const drafts = await getAllDrafts();
    return drafts.find(d => d.id === draftId) || null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Load application draft from local storage (legacy - returns first draft for user)
 * @deprecated Use loadDraftsLocally instead
 */
export async function loadDraftLocally(): Promise<ApplicationDraft | null> {
  try {
    const drafts = await getAllDrafts();
    return drafts.length > 0 ? drafts[0] : null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

/**
 * Delete a specific application draft from local storage
 */
export async function deleteDraftLocally(draftId?: string): Promise<void> {
  try {
    if (!draftId) {
      // Legacy behavior - clear all drafts
      await AsyncStorage.removeItem(DRAFTS_KEY);
      return;
    }
    
    const drafts = await getAllDrafts();
    const filteredDrafts = drafts.filter(d => d.id !== draftId);
    await saveAllDrafts(filteredDrafts);
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

/**
 * Check if any drafts exist
 */
export async function hasDraft(): Promise<boolean> {
  try {
    const drafts = await getAllDrafts();
    return drafts.length > 0;
  } catch (error) {
    return false;
  }
}
