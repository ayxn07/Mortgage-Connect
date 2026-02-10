import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  /** Set of favorited agent IDs */
  favoriteIds: string[];

  // --- Actions ---
  /** Toggle favorite status for an agent */
  toggleFavorite: (agentId: string) => void;
  /** Check if an agent is favorited */
  isFavorite: (agentId: string) => boolean;
  /** Clear all favorites */
  clearFavorites: () => void;
}

/**
 * Favorites store with AsyncStorage persistence.
 * Favorites survive app restarts without requiring auth.
 */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (agentId) => {
        set((state) => {
          const exists = state.favoriteIds.includes(agentId);
          return {
            favoriteIds: exists
              ? state.favoriteIds.filter((id) => id !== agentId)
              : [...state.favoriteIds, agentId],
          };
        });
      },

      isFavorite: (agentId) => {
        return get().favoriteIds.includes(agentId);
      },

      clearFavorites: () => {
        set({ favoriteIds: [] });
      },
    }),
    {
      name: 'mortgage-connect-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
