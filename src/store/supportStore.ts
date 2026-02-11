import { create } from 'zustand';
import type { SupportQuery, CreateSupportQueryInput, FAQ } from '../types';
import {
  createSupportQuery as createSupportQueryService,
  fetchUserSupportQueries,
} from '../services/support';

/** Default FAQ data used on the support screen */
export const DEFAULT_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'How do I book an agent?',
    answer:
      'Browse our agents, select your preferred professional, and click "Book Now" on their profile. Choose your service, date, and time to complete the booking.',
  },
  {
    id: '2',
    question: 'What is your cancellation policy?',
    answer:
      'You can cancel up to 24 hours before your appointment for a full refund. Cancellations within 24 hours are subject to a 50% fee.',
  },
  {
    id: '3',
    question: 'How do I contact my agent?',
    answer:
      'Once booked, you can message your agent directly through the app. Their contact information will also be available in your booking confirmation.',
  },
  {
    id: '4',
    question: 'Are agents verified?',
    answer:
      'Yes, all agents undergo a thorough verification process including background checks, credential verification, and skills assessment.',
  },
  {
    id: '5',
    question: 'How do payments work?',
    answer:
      'Payments are processed securely through the app. Your card is charged after the service is completed. We support all major credit cards and digital wallets.',
  },
];

interface SupportState {
  /** User's support queries */
  queries: SupportQuery[];
  /** FAQ list */
  faqs: FAQ[];
  /** Loading state */
  loading: boolean;
  /** Submission in progress */
  submitting: boolean;
  /** Error message */
  error: string | null;
  /** Last successful submission */
  lastSubmittedId: string | null;

  // --- Actions ---
  /** Submit a new support query */
  submitQuery: (uid: string, input: CreateSupportQueryInput) => Promise<void>;
  /** Fetch all queries for current user */
  fetchQueries: (uid: string) => Promise<void>;
  /** Clear error */
  clearError: () => void;
  /** Clear last submitted ID */
  clearLastSubmitted: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  queries: [],
  faqs: DEFAULT_FAQS,
  loading: false,
  submitting: false,
  error: null,
  lastSubmittedId: null,

  submitQuery: async (uid, input) => {
    set({ submitting: true, error: null });
    try {
      const queryId = await createSupportQueryService(uid, input);
      set({ submitting: false, lastSubmittedId: queryId });
    } catch (err: any) {
      set({ error: err.message, submitting: false });
      throw err;
    }
  },

  fetchQueries: async (uid) => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching support queries for uid:', uid);
      const queries = await fetchUserSupportQueries(uid);
      console.log('Fetched queries:', queries);
      set({ queries, loading: false });
    } catch (err: any) {
      console.error('Error fetching support queries:', err);
      set({ error: err.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
  clearLastSubmitted: () => set({ lastSubmittedId: null }),
}));
