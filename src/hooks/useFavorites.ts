import { useCallback } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';

/**
 * Hook for managing agent favorites.
 *
 * Favorites are persisted in AsyncStorage and survive app restarts.
 *
 * @example
 * ```tsx
 * const { isFavorite, toggleFavorite, favoriteIds } = useFavorites();
 * ```
 */
export function useFavorites() {
  const store = useFavoritesStore();

  const isFavorite = useCallback(
    (agentId: string) => store.favoriteIds.includes(agentId),
    [store.favoriteIds]
  );

  return {
    /** Array of favorited agent IDs */
    favoriteIds: store.favoriteIds,
    /** Check if a specific agent is favorited */
    isFavorite,
    /** Toggle favorite status */
    toggleFavorite: store.toggleFavorite,
    /** Clear all favorites */
    clearFavorites: store.clearFavorites,
  };
}
