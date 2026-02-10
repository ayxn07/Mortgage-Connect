import { create } from 'zustand';
import type {
  MortgageApplication,
  UploadedDocument,
  DocumentCategory,
} from '../types';
import {
  createApplication,
  fetchUserApplications,
  fetchApplicationById,
  updateApplication,
  uploadDocument,
  deleteDocument,
  saveDraft,
  submitApplication,
} from '../services/applications';

interface ApplicationState {
  /** User's applications list */
  applications: MortgageApplication[];
  /** Currently viewed application */
  selectedApplication: MortgageApplication | null;
  /** Loading state */
  loading: boolean;
  /** Upload progress indicator */
  uploading: boolean;
  /** Error message */
  error: string | null;

  // --- Actions ---
  /** Create a new mortgage application */
  create: (
    data: Omit<MortgageApplication, 'applicationId' | 'createdAt' | 'updatedAt'>
  ) => Promise<string>;
  /** Fetch all applications for current user */
  fetchAll: (userId: string) => Promise<void>;
  /** Fetch a single application by ID */
  fetchById: (applicationId: string) => Promise<void>;
  /** Update an existing application */
  update: (applicationId: string, data: Partial<MortgageApplication>) => Promise<void>;
  /** Save application as draft */
  saveDraft: (
    data: Omit<MortgageApplication, 'applicationId' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<string>;
  /** Submit application */
  submit: (applicationId: string) => Promise<void>;
  /** Upload a document */
  uploadDoc: (
    userId: string,
    applicationId: string,
    category: DocumentCategory,
    fileUri: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ) => Promise<UploadedDocument>;
  /** Delete a document */
  deleteDoc: (downloadURL: string) => Promise<void>;
  /** Set selected application */
  setSelected: (application: MortgageApplication | null) => void;
  /** Clear error */
  clearError: () => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  applications: [],
  selectedApplication: null,
  loading: false,
  uploading: false,
  error: null,

  create: async (data) => {
    set({ loading: true, error: null });
    try {
      const id = await createApplication(data);
      set({ loading: false });
      return id;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchAll: async (userId) => {
    set({ loading: true, error: null });
    try {
      const applications = await fetchUserApplications(userId);
      set({ applications, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchById: async (applicationId) => {
    set({ loading: true, error: null });
    try {
      const application = await fetchApplicationById(applicationId);
      set({ selectedApplication: application, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  update: async (applicationId, data) => {
    set({ loading: true, error: null });
    try {
      await updateApplication(applicationId, data);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  saveDraft: async (data, existingId) => {
    set({ loading: true, error: null });
    try {
      const id = await saveDraft(data, existingId);
      set({ loading: false });
      return id;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  submit: async (applicationId) => {
    set({ loading: true, error: null });
    try {
      await submitApplication(applicationId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  uploadDoc: async (userId, applicationId, category, fileUri, fileName, fileSize, mimeType) => {
    set({ uploading: true, error: null });
    try {
      const doc = await uploadDocument(userId, applicationId, category, fileUri, fileName, fileSize, mimeType);
      set({ uploading: false });
      return doc;
    } catch (err: any) {
      set({ error: err.message, uploading: false });
      throw err;
    }
  },

  deleteDoc: async (downloadURL) => {
    set({ uploading: true, error: null });
    try {
      await deleteDocument(downloadURL);
      set({ uploading: false });
    } catch (err: any) {
      set({ error: err.message, uploading: false });
      throw err;
    }
  },

  setSelected: (application) => {
    set({ selectedApplication: application });
  },

  clearError: () => set({ error: null }),
}));
