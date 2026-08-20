import { useEffect, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import {
  GetUserPermissionsResponse,
  useGetUserPermissions,
} from '../service/permissions/useGetUserPermissions';
import { useAppDispatch } from '../store';
import {
  setPermissions,
  setPermissionsError,
  setPermissionsLoading,
} from '../store/slices/permissionsSlice';

export interface SettingsForInput {
  id: string;
  timeForType: TimeTracking_TimeForType;
}

/** Card-specific hook for PermissionsCard; fetches via useGetUserPermissions + syncs to slice. */
export const usePermissionsCardData = (
  settingsFor: SettingsForInput | undefined,
) => {
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();

  const handleSuccess = useCallback(
    (data: GetUserPermissionsResponse) => {
      sandbox.logger.info(
        `Hook=usePermissionsCardData Event=Successfully fetched permissions for workerId=${settingsFor?.id} workerType=${settingsFor?.timeForType}`,
      );
      dispatch(setPermissions(data.permissions));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, settingsFor?.id, settingsFor?.timeForType],
  );

  const handleError = useCallback(
    (error: string) => {
      sandbox.logger.error(
        `Hook=usePermissionsCardData Event=Failed to fetch permissions for workerId=${settingsFor?.id} workerType=${settingsFor?.timeForType}`,
        { error },
      );
      dispatch(setPermissionsError(error));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, settingsFor?.id, settingsFor?.timeForType],
  );

  const { loading, loadUserPermissions } = useGetUserPermissions({
    onSuccess: handleSuccess,
    onError: handleError,
  });

  useEffect(() => {
    if (!settingsFor?.id || !settingsFor?.timeForType) return;

    sandbox.logger.info(
      `Hook=usePermissionsCardData Event=Fetching permissions for workerId=${settingsFor.id} workerType=${settingsFor.timeForType}`,
    );

    dispatch(setPermissionsLoading(true));

    loadUserPermissions({
      settingsFor: {
        id: settingsFor.id,
        timeForType: settingsFor.timeForType,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settingsFor?.id,
    settingsFor?.timeForType,
    loadUserPermissions,
    dispatch,
  ]);

  return { loading };
};

export default usePermissionsCardData;
