/**
 * Agents feature module.
 *
 * Re-exports everything related to agents so screens
 * can import from a single feature path:
 *
 *   import { useAgents, useFavorites, Agent } from '@/src/features/agents';
 */

// Hooks
export { useAgents } from '../../hooks/useAgents';
export { useFavorites } from '../../hooks/useFavorites';

// Stores
export { useAgentStore } from '../../store/agentStore';
export { useFavoritesStore } from '../../store/favoritesStore';

// Services
export {
  fetchAgents,
  fetchAgentById,
  fetchFeaturedAgents,
  subscribeToAgents,
} from '../../services/agents';

export {
  createReview,
  fetchAgentReviews,
} from '../../services/reviews';

// Types
export type {
  Agent,
  AgentService,
  FeaturedAgent,
  AgentCard,
  AgentFilters,
  AgentCategory,
  Review,
  CreateReviewInput,
} from '../../types';

export { AGENT_CATEGORIES } from '../../types';
