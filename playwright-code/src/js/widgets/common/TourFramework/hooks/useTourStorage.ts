import { useCallback, useState } from 'react';
import { Sandbox } from 'src/js/common/sandbox';
import { getTourSessionKey, getTourStorageKey } from '../constants';
import {
  getItemByPersonaIdAsync,
  setItemByPersonaId,
} from '../utils/webStorageUtil';

/**
 * Tour storage state interface
 */
export interface TourStorageState {
  isLoading: boolean;
  isCompleted: boolean;
  error: Error | null;
}

/**
 * Tour storage hook return type
 */
export interface UseTourStorageReturn {
  /** Whether the tour has been completed by this user */
  isTourCompleted: boolean;
  /** Whether we're still checking completion status */
  isLoading: boolean;
  /** Any error that occurred during storage operations */
  error: Error | null;
  /** Initialize and check tour completion status - call this when ready to check */
  initializeTourStatus: () => Promise<void>;
  /** Mark the tour as completed (persistent) */
  markTourCompleted: () => Promise<void>;
}

/**
 * Hook for managing tour completion state with persistent storage
 *
 * Features:
 * - Persistent storage by personaId (user-specific)
 * - Session storage fallback on persistent storage failure
 * - Error handling with logging
 * - Loading state management
 * - Consumer-controlled initialization (no automatic checking on mount)
 *
 * @param sandbox - The AppFabric sandbox instance
 * @param tourId - Unique identifier for the tour
 * @returns Tour storage utilities and state
 *
 * @see docs/useTourStorage.md for usage examples and implementation guide
 */
export const useTourStorage = (
  sandbox: Sandbox,
  tourId: string,
): UseTourStorageReturn => {
  const [state, setState] = useState<TourStorageState>({
    isLoading: true,
    isCompleted: false,
    error: null,
  });

  const storageKey = getTourStorageKey(tourId);
  const sessionKey = getTourSessionKey(tourId);

  /**
   * Check if tour is completed (async)
   * Attempts persistent storage first, falls back to session storage
   */
  const checkTourCompleted = useCallback(async (): Promise<boolean> => {
    try {
      // Try persistent storage first
      const result = await getItemByPersonaIdAsync(sandbox, storageKey);

      sandbox.logger.info(
        `[TourStorage] Read from persistent storage for tour: ${tourId}`,
        { result },
      );
      return result === true;
    } catch (error) {
      sandbox.logger.warn(
        `[TourStorage] Failed to read from persistent storage for tour: ${tourId}`,
        { error },
      );

      // Fallback to session storage
      try {
        const fallback = sessionStorage.getItem(sessionKey);
        sandbox.logger.info(
          `[TourStorage] Read from session storage for tour: ${tourId}`,
          { fallback },
        );
        return fallback === 'true';
      } catch (sessionError) {
        sandbox.logger.error(
          `[TourStorage] Failed to read from session storage for tour: ${tourId}`,
          { error: sessionError },
        );
        return false;
      }
    }
  }, [sandbox, storageKey, sessionKey, tourId]);

  /**
   * Mark tour as completed
   * Writes to both persistent and session storage for reliability
   */
  const markTourCompleted = useCallback(async (): Promise<void> => {
    try {
      // Write to persistent storage (primary)
      setItemByPersonaId(sandbox, storageKey, true);

      // Also write to session storage (backup)
      sessionStorage.setItem(sessionKey, 'true');

      // Update local state
      setState((prev) => ({ ...prev, isCompleted: true, error: null }));
      sandbox.logger.info(
        `[TourStorage] Tour marked as completed  : ${tourId}`,
      );
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : new Error(String(error));
      sandbox.logger.error(
        `[TourStorage] Failed to mark tour as completed: ${tourId}`,
        { error: errorInstance },
      );

      // Fallback: at least save to session storage
      try {
        sessionStorage.setItem(sessionKey, 'true');
        setState((prev) => ({
          ...prev,
          isCompleted: true,
          error: errorInstance,
        }));

        sandbox.logger.info(
          `[TourStorage] Tour completion saved to session storage (fallback): ${tourId}`,
        );
      } catch (sessionError) {
        setState((prev) => ({ ...prev, error: errorInstance }));
        sandbox.logger.error(
          `[TourStorage] Failed to mark tour as completed in session storage: ${tourId}`,
          { error: sessionError },
        );
        throw errorInstance;
      }
    }
  }, [sandbox, storageKey, sessionKey, tourId]);

  /**
   * Initialize tour status by checking completion from storage
   * Consumer should call this when ready (e.g., after feature flags loaded, component ready, etc.)
   */
  const initializeTourStatus = useCallback(async (): Promise<void> => {
    try {
      const isCompleted = await checkTourCompleted();
      setState({
        isLoading: false,
        isCompleted,
        error: null,
      });
    } catch (error) {
      setState({
        isLoading: false,
        isCompleted: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [checkTourCompleted, tourId]);

  return {
    isTourCompleted: state.isCompleted,
    isLoading: state.isLoading,
    error: state.error,
    initializeTourStatus,
    markTourCompleted,
  };
};

export default useTourStorage;
