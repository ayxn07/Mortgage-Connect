import { create } from 'zustand';
import type { Agent, AgentFilters, AgentCategory } from '../types';
import {
  fetchAgents as fetchAgentsService,
  fetchAgentById as fetchAgentByIdService,
  fetchFeaturedAgents as fetchFeaturedAgentsService,
  subscribeToAgents,
} from '../services/agents';

interface AgentState {
  /** All agents list */
  agents: Agent[];
  /** Featured agents for home screen */
  featuredAgents: Agent[];
  /** Currently viewed agent */
  selectedAgent: Agent | null;
  /** Loading states */
  loading: boolean;
  featuredLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current filters */
  filters: AgentFilters;

  // --- Actions ---
  /** Fetch all agents with optional filters */
  fetchAgents: (filters?: Partial<AgentFilters>) => Promise<void>;
  /** Fetch featured agents for home screen */
  fetchFeaturedAgents: (limit?: number) => Promise<void>;
  /** Fetch a single agent by ID */
  fetchAgentById: (agentId: string) => Promise<void>;
  /** Set search/filter criteria */
  setFilters: (filters: Partial<AgentFilters>) => void;
  /** Reset filters to defaults */
  resetFilters: () => void;
  /** Set selected agent (for navigation) */
  setSelectedAgent: (agent: Agent | null) => void;
  /** Subscribe to real-time updates */
  subscribe: () => () => void;
  /** Clear error */
  clearError: () => void;
}

const DEFAULT_FILTERS: AgentFilters = {
  category: 'All',
  searchQuery: '',
  availableOnly: false,
};

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  featuredAgents: [],
  selectedAgent: null,
  loading: false,
  featuredLoading: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },

  fetchAgents: async (filters) => {
    set({ loading: true, error: null });
    try {
      const merged = { ...get().filters, ...filters };
      const agents = await fetchAgentsService(merged);
      set({ agents, loading: false, filters: merged });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchFeaturedAgents: async (limit = 5) => {
    set({ featuredLoading: true, error: null });
    try {
      const featuredAgents = await fetchFeaturedAgentsService(limit);
      set({ featuredAgents, featuredLoading: false });
    } catch (err: any) {
      set({ error: err.message, featuredLoading: false });
    }
  },

  fetchAgentById: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const agent = await fetchAgentByIdService(agentId);
      set({ selectedAgent: agent, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  setSelectedAgent: (agent) => {
    set({ selectedAgent: agent });
  },

  subscribe: () => {
    return subscribeToAgents(
      (agents) => set({ agents }),
      (error) => set({ error: error.message })
    );
  },

  clearError: () => set({ error: null }),
}));
