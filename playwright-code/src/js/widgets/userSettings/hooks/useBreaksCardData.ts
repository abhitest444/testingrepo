import { useEffect, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useGetWorkerBreaks, BreakRule } from 'src/js/service/hooks/breaks';
import { useAppDispatch } from '../store';
import {
  setBreaks,
  setBreaksLoading,
  setBreaksError,
} from '../store/slices/breaksSlice';

/**
 * Hook to fetch and sync breaks data for the BreaksCard component
 *
 * This is a "Card-Specific Hook" that:
 * 1. Uses the common/reusable useGetWorkerBreaks hook for data fetching
 * 2. Syncs the fetched data to Redux for the card's VIEW/EDIT modes
 *
 * Benefits:
 * - Encapsulates all breaks-related data fetching logic
 * - Keeps UserSettingsPage clean (one line per card)
 * - Easy to test in isolation
 * - Follows the same pattern for all cards (Location, XYZ, etc.)
 *
 * @param assigneeId - The worker ID to fetch breaks for
 */
export const useBreaksCardData = (assigneeId: string | undefined) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();

  const handleSuccess = useCallback(
    (breaks: BreakRule[]) => {
      sandbox.logger.info(
        `Hook=useBreaksCardData Event=Successfully fetched breaks data for workerId=${assigneeId}`,
      );
      dispatch(setBreaks(breaks));
    },
    [dispatch, sandbox.logger, assigneeId],
  );

  const handleError = useCallback(
    (error: string) => {
      sandbox.logger.error(
        `Hook=useBreaksCardData Event=Failed to fetch breaks data for workerId=${assigneeId}`,
        { error },
      );
      dispatch(setBreaksError(error));
    },
    [dispatch, sandbox.logger, assigneeId],
  );

  const { loading, loadWorkerBreaks } = useGetWorkerBreaks({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  useEffect(() => {
    if (!assigneeId) return;

    sandbox.logger.info(
      `Hook=useBreaksCardData Event=Fetching breaks data for workerId=${assigneeId}`,
    );

    // Dispatch loading state before fetch
    dispatch(setBreaksLoading(true));

    // Fetch breaks - callbacks are already set at hook initialization
    loadWorkerBreaks({
      assigneeId,
      isActive: true,
    });
  }, [assigneeId, loadWorkerBreaks, dispatch, sandbox.logger]);

  // Return loading state if the consumer needs it
  return { loading };
};

export default useBreaksCardData;
