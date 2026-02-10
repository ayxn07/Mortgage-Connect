import { useEffect, useMemo } from 'react';
import { useAgentStore } from '../store/agentStore';
import type { AgentFilters, Agent } from '../types';

/**
 * Hook for fetching and filtering agents.
 *
 * Provides agents list, featured agents, loading states,
 * and filter controls. Supports local text search filtering.
 *
 * @example
 * ```tsx
 * const { agents, filteredAgents, loading, setFilters } = useAgents();
 * ```
 */
export function useAgents() {
  const store = useAgentStore();

  /**
   * Client-side filtering by search query and category.
   * Firestore handles availability/rating filters server-side.
   */
  const filteredAgents = useMemo(() => {
    let result = store.agents;

    // Filter by search query (name, location, skills)
    if (store.filters.searchQuery) {
      const q = store.filters.searchQuery.toLowerCase();
      result = result.filter(
        (agent) =>
          agent.displayName?.toLowerCase().includes(q) ||
          agent.location?.toLowerCase().includes(q) ||
          agent.specialty?.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Filter by category (if not "All")
    if (store.filters.category && store.filters.category !== 'All') {
      result = result.filter((agent) =>
        agent.specialty?.some(
          (s) => s.toLowerCase() === store.filters.category.toLowerCase()
        )
      );
    }

    return result;
  }, [store.agents, store.filters.searchQuery, store.filters.category]);

  return {
    /** All agents from Firestore */
    agents: store.agents,
    /** Agents filtered by current search/category */
    filteredAgents,
    /** Featured agents for home screen */
    featuredAgents: store.featuredAgents,
    /** Currently selected agent */
    selectedAgent: store.selectedAgent,
    /** Loading state */
    loading: store.loading,
    /** Featured agents loading state */
    featuredLoading: store.featuredLoading,
    /** Error message */
    error: store.error,
    /** Current filter values */
    filters: store.filters,
    /** Fetch all agents */
    fetchAgents: store.fetchAgents,
    /** Fetch featured agents */
    fetchFeaturedAgents: store.fetchFeaturedAgents,
    /** Fetch agent by ID */
    fetchAgentById: store.fetchAgentById,
    /** Update filter values */
    setFilters: store.setFilters,
    /** Reset filters to defaults */
    resetFilters: store.resetFilters,
    /** Set selected agent */
    setSelectedAgent: store.setSelectedAgent,
    /** Subscribe to real-time updates */
    subscribe: store.subscribe,
    /** Clear error */
    clearError: store.clearError,
  };
}
