import React from 'react';
import {
  Popover,
  PopoverActions,
  PopoverContent,
  PopoverHeader,
} from '@ids-ts/popover';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useWeeklyTimeTrackingPoints } from '../../hooks/useWeeklyTimeTrackingPoints';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectCompanySettings,
  selectHideWeekdays,
  selectTimeEntrySettingsLoading,
  selectTimeEntrySettingsError,
} from '../../store/selectors';
import { WeeklyTimeEntrySettingsForm } from './WeeklyTimeEntrySettingsForm';
import {
  setTimeEntrySettingsLoading,
  setUxPreferences,
  setVisibleDays,
  resetPanelValues,
  setTimeEntrySettingsError,
} from '../../store/timeEntrySettingsSlice';
import { useWeeklyTimeEntrySettings } from '../../hooks/useWeeklyTimeEntrySettings';
import {
  getVisibleDaysFromPreferences,
  hasAtLeastOneWeekdaySelected,
} from '../../utils/helpers';
import CommonErrorMessage from '../errors/CommonErrorMessage';

export interface WeeklyTimeEntrySettingsPanelProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSaveSuccess?: () => void;
  targetElement: HTMLElement | null;
}

export const WeeklyTimeEntrySettingsPanel: React.FC<
  WeeklyTimeEntrySettingsPanelProps
> = ({ open, setOpen, onSaveSuccess, targetElement }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWeeklyTimeTrackingPoints();
  const sandbox = useSandbox();

  // Redux state
  const companySettings = useAppSelector(selectCompanySettings);
  const hideWeekdays = useAppSelector(selectHideWeekdays);
  const loading = useAppSelector(selectTimeEntrySettingsLoading);
  const uxPreferencesError = useAppSelector(selectTimeEntrySettingsError);

  // UX Preferences hook for saving to service
  const { setPreference } = useUxPreferences();

  // Custom settings hook for weekdays settings only
  const { settingsState, updateWeekday, getFormData, isDirty } =
    useWeeklyTimeEntrySettings(hideWeekdays);

  // Check if at least one weekday is selected
  const hasWeekdaysSelected = hasAtLeastOneWeekdaySelected(
    settingsState.weekdays,
  );

  // TODO: As part of instrumentation, track opening of weekly time entry settings panel
  // useEffect(() => {
  //   //Track opening of weekly time entry settings panel
  //   track(WEEKLY_TIME_TRACKING_POINTS.CLOSE_SETTINGS);
  // }, []);

  const handleError = (error: string) => {
    sandbox.logger.error(error);
    dispatch(
      setTimeEntrySettingsError(
        intl.formatMessage({
          id: 'settings.general.error',
        }),
      ),
    );
  };

  const handleClose = () => {
    dispatch(setTimeEntrySettingsError(null));
    dispatch(resetPanelValues());
    setOpen(false);
  };

  const handleSaveClick = async () => {
    track(trackingPoints.SAVE_SETTINGS);

    // Clear any previous settings errors
    dispatch(setTimeEntrySettingsError(null));

    // Validate that at least one weekday is selected
    if (!hasWeekdaysSelected) {
      dispatch(
        setTimeEntrySettingsError(
          intl.formatMessage({
            id: 'weekly.time.entry.settings.at.least.one.required',
          }),
        ),
      );
      return;
    }

    dispatch(setTimeEntrySettingsLoading({ loading: true }));

    try {
      const formData = getFormData;

      // Save weekday preferences to UX preferences service
      await setPreference(
        UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        formData.hideWeekdays,
      );

      // If UX preferences save is successful, save to the redux store
      dispatch(
        setUxPreferences({
          hideWeekdays: formData.hideWeekdays,
        }),
      );

      // Update visible days immediately based on the new settings
      if (companySettings?.firstDayOfWeek !== undefined) {
        const visibleDays = getVisibleDaysFromPreferences(
          formData.hideWeekdays,
          companySettings.firstDayOfWeek,
        );
        // Set the visible days in the redux store
        dispatch(setVisibleDays({ visibleIndices: visibleDays }));
      }

      // Log successful save
      sandbox.logger.info(
        'WeeklyTimeEntrySettingsPanel: Settings changes saved successfully',
      );

      // Close panel and call success callback
      handleClose();
      onSaveSuccess?.();
    } catch (error) {
      sandbox.logger.error(
        'WeeklyTimeEntrySettingsPanel: Failed to save settings changes',
      );
      handleError(error as string);
    } finally {
      dispatch(setTimeEntrySettingsLoading({ loading: false }));
    }
  };

  return (
    <Popover
      dismissible
      open={open}
      animationOn
      targetElement={targetElement}
      position="bottom"
      alignment="left"
      variant="popover"
      onClose={handleClose}
      popoverOffsetSkidding={-15}
      popoverOffsetDistance={0}
    >
      <PopoverHeader
        title={intl.formatMessage({
          id: 'weekly.time.entry.settings.popover.title',
        })}
      />
      <PopoverContent>
        {uxPreferencesError && (
          <CommonErrorMessage
            titleText={uxPreferencesError}
            type="error"
            dismissable
            onClose={() => dispatch(setTimeEntrySettingsError(null))}
          />
        )}
        <WeeklyTimeEntrySettingsForm
          hideWeekdays={hideWeekdays}
          trackingPoints={trackingPoints}
          settingsState={settingsState}
          updateWeekday={updateWeekday}
        />
      </PopoverContent>

      <PopoverActions>
        <Button
          priority="primary"
          onClick={handleSaveClick}
          isLoading={loading}
          disabled={loading || !isDirty}
          loadingComponent={<Activity shape="dots" size="small" />}
        >
          {intl.formatMessage({
            id: 'weekly.time.entry.settings.popover.button.label',
          })}
        </Button>
      </PopoverActions>
    </Popover>
  );
};
