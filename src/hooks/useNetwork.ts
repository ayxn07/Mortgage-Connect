/**
 * Network connectivity hook and offline action queue.
 *
 * Monitors network state using React Native's NetInfo-compatible API
 * and provides an action queue for retrying failed operations when
 * connectivity is restored.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NetworkState {
  /** Whether the device has internet connectivity */
  isConnected: boolean;
  /** Whether the initial connectivity check has completed */
  isChecking: boolean;
}

interface QueuedAction {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = '@offline_action_queue';
const CONNECTIVITY_CHECK_URL = 'https://clients3.google.com/generate_204';

// ─── Network State Hook ─────────────────────────────────────────────────────

/**
 * Hook to monitor network connectivity state.
 * Uses a lightweight connectivity check (HTTP 204) to detect actual
 * internet access, not just WiFi/cellular connection.
 */
export function useNetworkState(): NetworkState & {
  checkConnectivity: () => Promise<boolean>;
} {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isChecking: true,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Perform a lightweight connectivity check.
   * Fetches a known URL that returns 204 No Content.
   */
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(CONNECTIVITY_CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      const connected = response.status === 204 || response.ok;
      setState({ isConnected: connected, isChecking: false });
      return connected;
    } catch {
      setState({ isConnected: false, isChecking: false });
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Periodic check every 15 seconds
    intervalRef.current = setInterval(checkConnectivity, 15000);

    // Check on app foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        checkConnectivity();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkConnectivity]);

  return { ...state, checkConnectivity };
}

// ─── Offline Action Queue ───────────────────────────────────────────────────

/**
 * Hook for managing an offline action queue.
 * Actions are persisted to AsyncStorage and retried when connectivity
 * is restored.
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);

  // Load queue from storage on mount
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[OfflineQueue] Failed to load queue:', message);
    }
  };

  const saveQueue = async (newQueue: QueuedAction[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[OfflineQueue] Failed to save queue:', message);
    }
  };

  /**
   * Add an action to the offline queue.
   */
  const enqueue = useCallback(
    async (action: string, payload: Record<string, unknown>): Promise<string> => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newAction: QueuedAction = {
        id,
        action,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
      };
      const newQueue = [...queue, newAction];
      await saveQueue(newQueue);
      console.log(`[OfflineQueue] Enqueued action: ${action} (${id})`);
      return id;
    },
    [queue]
  );

  /**
   * Remove a completed action from the queue.
   */
  const dequeue = useCallback(
    async (id: string): Promise<void> => {
      const newQueue = queue.filter((item) => item.id !== id);
      await saveQueue(newQueue);
      console.log(`[OfflineQueue] Dequeued action: ${id}`);
    },
    [queue]
  );

  /**
   * Clear the entire queue.
   */
  const clearQueue = useCallback(async (): Promise<void> => {
    await saveQueue([]);
    console.log('[OfflineQueue] Queue cleared');
  }, []);

  /**
   * Process queued actions with a handler map.
   * Called when connectivity is restored.
   */
  const processQueue = useCallback(
    async (
      handlers: Record<string, (payload: Record<string, unknown>) => Promise<void>>
    ): Promise<{ succeeded: number; failed: number }> => {
      let succeeded = 0;
      let failed = 0;
      const remainingQueue: QueuedAction[] = [];

      for (const item of queue) {
        const handler = handlers[item.action];
        if (!handler) {
          console.warn(`[OfflineQueue] No handler for action: ${item.action}`);
          remainingQueue.push(item);
          continue;
        }

        try {
          await handler(item.payload);
          succeeded++;
          console.log(`[OfflineQueue] Processed: ${item.action} (${item.id})`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[OfflineQueue] Failed to process ${item.action}:`, message);
          failed++;

          // Keep in queue if under retry limit (max 3 retries)
          if (item.retryCount < 3) {
            remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
          } else {
            console.warn(`[OfflineQueue] Max retries exceeded for ${item.id}, dropping`);
          }
        }
      }

      await saveQueue(remainingQueue);
      return { succeeded, failed };
    },
    [queue]
  );

  return {
    queue,
    queueLength: queue.length,
    enqueue,
    dequeue,
    clearQueue,
    processQueue,
  };
}
