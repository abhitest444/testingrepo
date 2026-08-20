import React, { useEffect, useState } from 'react';
import { FormProvider, SubmitHandler } from 'react-hook-form';

import {
  Popover,
  PopoverActions,
  PopoverContent,
  PopoverHeader,
} from '@ids-ts/popover';
import Button from '@ids-ts/button';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import { Activity } from '@ids-ts/loader';
import styled from 'styled-components';
import { TimeSettingsPopoverForm } from 'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverForm';
import { useSetSettings } from 'src/js/service/hooks/settings/useSetSettings';
import {
  atLeastOneWeekdaySelected,
  attemptingToHideFieldAlreadyWithData,
  attemptingToHideWeekdayAlreadyWithData,
  compareTimeSettingsPopoverFormState_toTimeTrackingSettings,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData,
  compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData,
  mapTimeSettingsPopoverFormState,
  mapTimeSettingsPopoverFormState_forCompanySettingsMutation,
  mapTimeSettingsPopoverFormState_forSettingsMutation,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields,
  mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays,
  TimeSettingsPopoverFormState,
  TimeSettingsPopulatedState,
  useTimeSettingsPopoverForm,
} from 'src/js/widgets/common/timeSettingsPopover/useTimeSettingsPopoverForm';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import { computeCanEditSettings } from 'src/js/service/utils/useTimeTrackingAuthorization';
import {
  computeHasPayroll,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import { computeIsPayTypeEnabled } from 'src/js/service/hooks/paytypes/payTypeUtils';
import { getRegion } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useFeatureFlag,
  useHasAdminAccess,
} from 'src/js/service/utils/sandboxUtils';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import { UpdateCompanySettingsResponse } from 'src/js/service/queries/settingsQueries';
import { TimeTracking_UpdateEmployerSettingsPayload } from 'src/__generated__/timeTracking/graphql';
import { TrackingPoints } from '../../../common/useClickTracking';

const StyledPageMessage = styled(PageMessage)`
  margin-bottom: 15px;
`;

const ActivityContainer = styled.div`
  display: flex;
  justify-content: center;
`;

export interface TimeSettingsPopoverHOCProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSaveSuccess: () => void;
  targetElement: any;
  fieldsWithData: TimeSettingsPopulatedState;
  isSettingsAccessible: boolean;
  weekdaysWithDurations?: number[];
  showDaysOfWeekPreferences?: boolean;
  trackingPoints: TrackingPoints;
  isTimeEntry?: boolean;
}

export const TimeSettingsPopoverHOC = ({
  open,
  setOpen,
  onSaveSuccess,
  targetElement,
  fieldsWithData,
  isSettingsAccessible = false,
  weekdaysWithDurations = [],
  showDaysOfWeekPreferences = false,
  trackingPoints,
  isTimeEntry = false,
}: TimeSettingsPopoverHOCProps) => {
  // -------------------------------- context hooks
  const intl = useIntl();
  const track = useTracking();
  const sandbox = useSandbox();

  // -------------------------------- component state hooks
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [consolidatedPageLoading, setConsolidatedPageLoading] = useState(true);
  const timeSettingsPopoverFormMethods = useTimeSettingsPopoverForm();

  // -------------------------------- network hooks
  const {
    settingsData: settings,
    refetch: refetchSettings,
    loading: settingsLoading,
    qboSettings,
    qlSettings,
  } = useCompanySettings({ isExported: !isTimeEntry });

  const isEmployerSettingsEnabled = useFeatureFlag(
    FEATURE_FLAGS.QB_TIME_TRACKING_UI_EMPLOYER_SETTING,
  );

  const {
    data: uxPreferenceData,
    getPreference,
    setPreference,
    loading: uxPreferencesLoading,
    error: uxPreferencesError,
  } = useUxPreferences({
    onSaveSuccess: () => {
      if (
        !uxPreferencesLoading &&
        !setCompanySettingsLoading &&
        !setSettingsLoading
      ) {
        handleClose();
        onSaveSuccess();
      }
    },
  });

  const [canEditSettings, setCanEditSettings] = useState(false);

  const {
    data: entitlements,
    loading: entitlementsLoading,
    error: hasPayrollError,
  } = useGetEntitlements();

  const hasPayroll = computeHasPayroll(entitlements);
  const isPayTypeEnabled = computeIsPayTypeEnabled(getRegion(sandbox));
  const hasAdminAccess = useHasAdminAccess();
  const hasProjects = useHasProjects();

  useEffect(() => {
    computeCanEditSettings(sandbox).then((result) => {
      setCanEditSettings(result);
    });
  }, [sandbox]);

  // -------------------------------- component render hooks
  // when popover opens
  useEffect(() => {
    if (open) {
      track(trackingPoints.SETTINGS_GEAR);
      refetchSettings();
      getPreference(UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE);
      getPreference(UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS);
    } else {
      setConsolidatedPageLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // when both new settings or preferences data received
  useEffect(() => {
    if (settings && uxPreferenceData) {
      timeSettingsPopoverFormMethods.reset(
        mapTimeSettingsPopoverFormState(settings, uxPreferenceData),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, uxPreferenceData]);

  // -------------------------------- component interaction handlers

  const handleError = (error: string) => {
    setErrorMessage(error);
  };

  const handleClose = () => {
    setErrorMessage(null);
    setOpen(false);
  };

  const onSubmit: SubmitHandler<TimeSettingsPopoverFormState> = (
    formState: TimeSettingsPopoverFormState,
  ) => {
    // This condition is use to validate that at least one weekday is selected
    if (!atLeastOneWeekdaySelected(formState)) {
      setErrorMessage(
        intl.formatMessage({
          id: 'settings.daysofweek.at.least.one.required',
        }),
      );
      return;
    }

    // This condition is use to validate that the user is not attempting to hide a weekday that has data
    if (
      attemptingToHideWeekdayAlreadyWithData(formState, weekdaysWithDurations)
    ) {
      setErrorMessage(
        intl.formatMessage({
          id: 'weekdays.can.not.hide',
        }),
      );
      return;
    }

    // This condition is use to validate that the user is not attempting to hide a field that has data
    if (
      isSettingsAccessible &&
      attemptingToHideFieldAlreadyWithData(formState, fieldsWithData)
    ) {
      setErrorMessage(
        intl.formatMessage({
          id: 'fields.can.not.hide',
        }),
      );
      return;
    }

    // This condition is use to validate that the preference value for the last saved settings for the
    // time tracking settings is different from the current form state time tracking settings
    if (
      compareTimeSettingsPopoverFormState_toTimeTrackingSettings(
        formState,
        settings,
      )
    ) {
      isEmployerSettingsEnabled
        ? updateCompanySettings(
            mapTimeSettingsPopoverFormState_forCompanySettingsMutation(
              qlSettings,
              formState,
            ),
          )
        : setSettings(
            mapTimeSettingsPopoverFormState_forSettingsMutation(
              qboSettings.entityVersion,
              formState,
            ),
          );
    }

    // This condition is use to validate that the preference value for the last saved settings for the
    // weekdays is different from the current form state weekdays
    if (
      showDaysOfWeekPreferences &&
      compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData(
        formState,
        uxPreferenceData[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE],
      )
    ) {
      setPreference(
        UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE,
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays(
          formState,
        ),
      );
    }

    // This condition is use to validate that the preference value for the last saved settings for the
    // time entry fields is different from the current form state time entry fields
    if (
      compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData(
        settings,
        formState,
        uxPreferenceData[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
      )
    ) {
      setPreference(
        UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS,
        mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields(
          formState,
        ),
      );
    }
  };

  const handleSaveClick = () => {
    track(trackingPoints.SAVE_SETTINGS);
    timeSettingsPopoverFormMethods.handleSubmit(onSubmit)();
  };

  const handleErrorDismiss = () => {
    setErrorMessage(null);
  };

  // ----------------------------------- component mutation hooks

  const [setSettings, { loading: setSettingsLoading }] = useSetSettings({
    onCompleted: (result: UpdateCompanySettingsResponse) => {
      if (result && !uxPreferencesLoading && !setCompanySettingsLoading) {
        handleClose();
        onSaveSuccess();
      }
    },
    onError: handleError,
  });

  const [updateCompanySettings, { loading: setCompanySettingsLoading }] =
    useSetQLSettings({
      onSuccess: (result: TimeTracking_UpdateEmployerSettingsPayload) => {
        if (result && !uxPreferencesLoading && !setSettingsLoading) {
          handleClose();
          onSaveSuccess();
        }
      },
      onError: handleError,
    });
  // ----------------------------------- consolidate component state
  const consolidatedButtonLoading =
    settingsLoading ||
    setSettingsLoading ||
    uxPreferencesLoading ||
    setCompanySettingsLoading;

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadingStates = [settingsLoading, entitlementsLoading];
    if (loadingStates.some((isLoading) => isLoading)) {
      setConsolidatedPageLoading(true);
    } else if (loadingStates.every((isLoading) => !isLoading)) {
      setConsolidatedPageLoading(false);
    }
  }, [open, settingsLoading, entitlementsLoading]);

  return (
    <Popover
      dismissible
      open={open}
      targetElement={targetElement}
      position="bottom"
      alignment="left"
      variant="popover"
      onClose={handleClose}
    >
      <PopoverHeader
        title={intl.formatMessage({
          id: 'singletime.settings.popover.title',
        })}
      />
      {consolidatedPageLoading ? (
        <ActivityContainer>
          <Activity shape="dots" size="large" />
        </ActivityContainer>
      ) : (
        <PopoverContent>
          {errorMessage && (
            <StyledPageMessage
              open
              dismissible
              type="warn"
              automationId="TimeSettingsPopoverHOCErrorPageMessage"
              onClose={handleErrorDismiss}
            >
              {errorMessage}
            </StyledPageMessage>
          )}
          <FormProvider {...timeSettingsPopoverFormMethods}>
            <TimeSettingsPopoverForm
              settings={settings}
              isSettingsAccessible={isSettingsAccessible}
              showDaysOfWeekPreferences={showDaysOfWeekPreferences}
              hasPayroll={hasPayroll}
              isPayTypeEnabled={isPayTypeEnabled}
              hasAdminAccess={hasAdminAccess}
              hasProjects={hasProjects}
              canEditSettings={canEditSettings}
              trackingPoints={trackingPoints}
              isTimeEntry={isTimeEntry}
            />
          </FormProvider>
        </PopoverContent>
      )}

      <PopoverActions>
        <Button
          priority="primary"
          onClick={handleSaveClick}
          isLoading={consolidatedButtonLoading}
          disabled={consolidatedPageLoading}
          loadingComponent={<Activity shape="dots" size="small" />}
        >
          {intl.formatMessage({
            id: 'singletime.settings.popover.button.label',
          })}
        </Button>
      </PopoverActions>
    </Popover>
  );
};
