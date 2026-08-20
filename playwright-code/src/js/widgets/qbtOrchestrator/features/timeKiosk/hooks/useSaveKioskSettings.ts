/**
 * useSaveKioskSettings — persist company kiosk settings via employer settings mutation.
 * =============================================================================
 * Uses the shared `useSetQLSettings` hook to update `kioskSettings.inactivityTimeout`.
 * On success, commits the returned value/version to Redux directly — no QL
 * refetch is needed since the mutation returns the updated setting.
 */
import { useCallback, useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import { TimeTracking_EmployerSettings } from 'src/__generated__/timeTracking/graphql';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectInactivityTimeoutVersion,
  setInactivityTimeoutSeconds,
} from '../store';

export interface UseSaveKioskSettingsArgs {
  onSaveSuccess?: () => void;
}

const mapInactivityTimeoutFromEmployerSettings = (
  employerSettings: TimeTracking_EmployerSettings,
) => {
  const setting = employerSettings?.kioskSettings?.inactivityTimeout;
  if (setting?.value == null) {
    return null;
  }
  return {
    value: setting.value,
    version: setting.meta?.version,
  };
};

export const useSaveKioskSettings = ({
  onSaveSuccess,
}: UseSaveKioskSettingsArgs = {}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const inactivityTimeoutVersion = useAppSelector(
    selectInactivityTimeoutVersion,
  );

  // Save-flow error: local to this hook instance, not shared Redux state —
  // only the caller of this hook ever needs to read/clear it.
  const [error, setError] = useState<string | null>(null);

  const [updateSettings, { loading: saving }] = useSetQLSettings({
    onSuccess: (employerSettings) => {
      const updated = mapInactivityTimeoutFromEmployerSettings(
        employerSettings as TimeTracking_EmployerSettings,
      );
      if (updated) {
        dispatch(setInactivityTimeoutSeconds(updated));
      }
      onSaveSuccess?.();
    },
    onError: (mutationError) => {
      setError(
        mutationError || intl.formatMessage({ id: 'catch.all.error.content' }),
      );
    },
  });

  const saveInactivityTimeout = useCallback(
    async (value: number) => {
      setError(null);
      await updateSettings({
        kioskSettings: {
          inactivityTimeout: {
            value,
            version: inactivityTimeoutVersion,
          },
        },
      });
    },
    [inactivityTimeoutVersion, updateSettings],
  );

  // Clears a previously surfaced save error (e.g. when the modal opens/closes)
  // so a stale banner never lingers into a fresh editing session.
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { saveInactivityTimeout, saving, error, clearError };
};
