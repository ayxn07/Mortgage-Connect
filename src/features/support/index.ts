/**
 * Support feature module.
 *
 * Re-exports everything related to support & help:
 *
 *   import { useSupportStore, DEFAULT_FAQS, SupportQuery } from '@/src/features/support';
 */

// Store
export { useSupportStore, DEFAULT_FAQS } from '../../store/supportStore';

// Services
export {
  createSupportQuery,
  fetchUserSupportQueries,
  fetchSupportQueryById,
} from '../../services/support';

// Types
export type {
  SupportQuery,
  SupportCategory,
  SupportStatus,
  CreateSupportQueryInput,
  FAQ,
} from '../../types';
