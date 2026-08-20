import { useEffect, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useGetEffectiveUserSettings } from 'src/js/service/hooks/userLevelSettings/useGetEffectiveUserSettings';
import {
  TimeTracking_TimeForType,
  TimeTrackingEffectiveUserSettingsQuery,
} from 'src/__generated__/timeTracking/graphql';
import { useAppDispatch } from '../store';
import {
  resetState,
  setNotificationsLoading,
  setNotificationsError,
} from '../store/slices/notificationsSlice';

export interface SettingsForInput {
  id: string;
  timeForType: TimeTracking_TimeForType;
}

/**
 * Hook to fetch and sync notifications data for the NotificationsCard component
 *
 * This is a "Card-Specific Hook" that:
 * 1. Uses the common/reusable useGetEffectiveUserSettings hook for data fetching
 * 2. Syncs the fetched data to Redux for the card's VIEW/EDIT modes
 *
 * Benefits:
 * - Encapsulates all notifications-related data fetching logic
 * - Keeps UserSettingsPage clean (one line per card)
 * - Easy to test in isolation
 * - Follows the same pattern as useBreaksCardData
 *
 * @param settingsFor - The worker settings context (id and timeForType)
 */
export const useNotificationsCardData = (
  settingsFor: SettingsForInput | undefined,
) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();

  // Callbacks passed at hook initialization (following useManageCustomFieldAssignment pattern)
  const handleSuccess = useCallback(
    (data: TimeTrackingEffectiveUserSettingsQuery) => {
      sandbox.logger.info(
        `Hook=useNotificationsCardData Event=Successfully fetched notifications data for workerId=${settingsFor?.id} and workerType=${settingsFor?.timeForType}`,
      );
      dispatch(resetState(data));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, settingsFor?.id, settingsFor?.timeForType],
  );

  const handleError = useCallback(
    (error: string) => {
      sandbox.logger.error(
        `Hook=useNotificationsCardData Event=Failed to fetch notifications data for workerId=${settingsFor?.id} and workerType=${settingsFor?.timeForType}`,
        { error },
      );
      dispatch(setNotificationsError(error));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, settingsFor?.id, settingsFor?.timeForType],
  );

  const { loading, loadEffectiveUserSettings } = useGetEffectiveUserSettings({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  useEffect(() => {
    // early exit if settingsFor data is not available
    if (!settingsFor?.id || !settingsFor?.timeForType) return;

    sandbox.logger.info(
      `Hook=useNotificationsCardData Event=Fetching notifications data for workerId=${settingsFor.id} and workerType=${settingsFor.timeForType}`,
    );

    // Dispatch loading state before fetch
    dispatch(setNotificationsLoading(true));

    // Fetch notifications - callbacks are already set at hook initialization
    loadEffectiveUserSettings({
      settingsFor: {
        id: settingsFor.id,
        timeForType: settingsFor.timeForType,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settingsFor?.id,
    settingsFor?.timeForType,
    loadEffectiveUserSettings,
    dispatch,
  ]);

  // Return loading state if the consumer needs it
  return { loading };
};

export default useNotificationsCardData;
