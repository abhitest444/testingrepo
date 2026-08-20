import { useEffect, useCallback, useRef } from 'react';
import {
  useGetUserOvertimeNotifications,
  type GetUserOvertimeNotificationsQuery,
} from 'src/js/service/hooks/userLevelSettings/useGetUserOvertimeNotifications';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { USER_SETTINGS_OVERTIME_NOTIFICATIONS_LOGGING } from '../constants/loggingConstants';
import { useAppDispatch } from '../store';
import {
  resetOvertimeNotificationsState,
  setOvertimeNotificationsLoading,
  setOvertimeNotificationsError,
} from '../store/slices/overtimeNotificationsSlice';

export interface SettingsForInput {
  id: string;
  timeForType: TimeTracking_TimeForType;
}

/**
 * Fetches overtime notification rules ({@link GET_USER_OVERTIME_NOTIFICATIONS}) and syncs Redux.
 */
export const useOvertimeNotificationsCardData = (
  settingsFor: SettingsForInput | undefined,
) => {
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();

  const handleSuccess = useCallback(
    (data: GetUserOvertimeNotificationsQuery) => {
      logger.info(
        USER_SETTINGS_OVERTIME_NOTIFICATIONS_LOGGING.FETCH_RULES_SUCCESS,
        {
          rulesCount:
            data?.timeTrackingUnifiedUserSettings?.overtimeNotifications?.rules
              ?.length ?? 0,
        },
      );
      dispatch(resetOvertimeNotificationsState(data));
    },
    [dispatch, logger],
  );

  const handleError = useCallback(
    (error: string) => {
      logger.error(
        USER_SETTINGS_OVERTIME_NOTIFICATIONS_LOGGING.FETCH_RULES_FAILED,
        { error },
      );
      dispatch(setOvertimeNotificationsError(error));
    },
    [dispatch, logger],
  );

  const { loading, loadUserOvertimeNotifications } =
    useGetUserOvertimeNotifications({
      onSuccess: handleSuccess,
      onError: handleError,
      customerInteraction:
        TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_READ,
    });

  const loadRef = useRef(loadUserOvertimeNotifications);
  loadRef.current = loadUserOvertimeNotifications;

  useEffect(() => {
    if (!settingsFor?.id || !settingsFor?.timeForType) {
      // No fetch: mark slice as idle so view does not flash empty copy before a real load.
      dispatch(resetOvertimeNotificationsState(undefined));
      return;
    }

    dispatch(setOvertimeNotificationsLoading(true));

    // Avoid Apollo cache merge showing stale overtime rules when the network returns none.
    // Ref avoids re-fetch when lazy query callback identity changes (e.g. after save / VIEW switch).
    loadRef.current(
      {
        settingsFor: {
          id: settingsFor.id,
          timeForType: settingsFor.timeForType,
        },
      },
      { fetchPolicy: 'no-cache' },
    );
    // Intentionally omit loadUserOvertimeNotifications — use loadRef to prevent spurious refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable fetch keyed by settingsFor only
  }, [settingsFor?.id, settingsFor?.timeForType, dispatch]);

  return { loading };
};

export default useOvertimeNotificationsCardData;
