import { useEffect } from 'react';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCompanyTimezone,
  setSettingsLoading,
  setSettingsError,
} from '../store/settingsSlice';

export const useCompanyTimezone = () => {
  const dispatch = useAppDispatch();
  const { settingsReady, settingsLoading, settingsError, timezone } =
    useAppSelector((state) => state.settings);

  const {
    settingsData,
    loading: companySettingsLoading,
    error: companySettingsError,
  } = useCompanySettings();

  useEffect(() => {
    dispatch(setSettingsLoading(companySettingsLoading));
  }, [dispatch, companySettingsLoading]);

  useEffect(() => {
    if (!companySettingsError) return;
    dispatch(setSettingsError(companySettingsError));
    // Even on settings failure, flip `settingsReady` to true with safe
    // defaults so the widget renders the error state instead of hanging
    // on the spinner.
    if (!settingsReady) {
      dispatch(
        setCompanyTimezone({
          timezone: '',
          qboTimezone: '',
          firstDayOfWeek: 0,
        }),
      );
    }
  }, [dispatch, companySettingsError, settingsReady]);

  // Once company settings finish loading, mark the widget as ready EVEN
  // when the response didn't include a timezone. Some deep-link entry
  // points (e.g. `?jobId=time` cold-loads from outside QBO) return an empty
  // timezone, and the original code gated `settingsReady` behind a truthy
  // timezone, which left the page stuck on the loading spinner forever.
  // We fall back to an empty string here; downstream date helpers
  // (`mapQBTimezoneToDayjsTimezone`) handle that gracefully by using the
  // browser's local zone.
  useEffect(() => {
    if (companySettingsLoading || settingsReady) return;
    dispatch(
      setCompanyTimezone({
        timezone: settingsData.timezone || '',
        qboTimezone: settingsData.qboTimezone || settingsData.timezone || '',
        firstDayOfWeek: settingsData.firstDayOfWeek ?? 0,
      }),
    );
  }, [dispatch, companySettingsLoading, settingsData, settingsReady]);

  return {
    timezone,
    settingsReady,
    settingsLoading,
    settingsError,
  };
};
