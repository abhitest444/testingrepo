import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl, useSandbox } from '@payroll/quicksand';
import {
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
  FEATURE_FLAGS,
} from 'src/js/common/constants';

import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { timezoneConversions } from 'src/js/widgets/common/addTimeFormComponents/TimeZoneField';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import {
  getWeekDay,
  uppercaseToPascalcase,
} from 'src/js/widgets/timeTrackingSettings/utils';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/types';
import {
  CLOCK_ROUNDING_SETTINGS,
  TIME_TRACKING_SETTINGS,
  TimeEntriesFormType,
  TWENTY_FOUR_HOUR_FORMAT,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { EditTimeTrackingTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeTrackingTimeEntrySettings/EditTimeTrackingTimeEntrySettings';
import { timeEntrySettingsDefaultState } from 'src/js/service/hooks/settings/useGetQLSettings';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  computeHasTimeElite,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';

export interface ITimeTrackingTimeEntrySettings {
  timeTrackingFields: IFormConfig;
  setTimeTrackingFields: (timeTrackingFields: IFormConfig) => void;
  isTimeTrackingEditing: boolean;
  onSaveTimeEntrySettings: (trackingPoint?: TrackingPoint) => void;
  timeTrackingFieldSettingSection: string;
  id: string;
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  isDataUpdating: boolean;
}

export const TimeTrackingTimeEntrySettings: React.FC<
  ITimeTrackingTimeEntrySettings
> = ({
  timeTrackingFields,
  setTimeTrackingFields,
  isTimeTrackingEditing,
  onSaveTimeEntrySettings,
  timeTrackingFieldSettingSection,
  id,
  onFormUpdate,
  onFormCancel,
  isDataUpdating,
}) => {
  const { QLData, isQLSettingsLoading, QLSettingsError, isFormEditable } =
    useTimeTrackingSettingsContext(false);
  const intl = useIntl();
  const { setValue } = useFormContext();
  const sandbox = useSandbox();

  const { isEnabled: isFitAndFinishSettingsEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_FIT_AND_FINISH_ADMIN_SETTINGS,
    defaultValue: false,
  });

  // Check if user has Elite SKU (required for signature capture)
  // Default to false if entitlements are not yet loaded or fail to load
  const { data: entitlements, loading: entitlementsLoading } =
    useGetEntitlements();
  const isTimeElite =
    entitlements && !entitlementsLoading
      ? computeHasTimeElite(entitlements)
      : false;

  // Publish section ready event when data loads (transition from loading to loaded)
  const sectionReadyPublishedRef = useRef(false);
  const wasLoadingRef = useRef(isQLSettingsLoading);
  const fieldsInitializedRef = useRef(false);
  useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = isQLSettingsLoading;

    const justLoaded = wasLoading && !isQLSettingsLoading;
    if (justLoaded && !sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=TimeTrackingTimeEntrySettings Event=SECTION_READY section=TIME_TRACKING',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.TIME_TRACKING,
      });
    }
  }, [isQLSettingsLoading, sandbox]);

  // Note: in the below useEffect the mapping which is done is on the basis of the featureFlag provided in api and in that we have provided the fake data.
  useEffect(() => {
    // Only initialize fields once when feature flag is enabled
    // This prevents double-initialization when flag loads asynchronously
    if (fieldsInitializedRef.current && isFitAndFinishSettingsEnabled) return;

    if (QLData && !isQLSettingsLoading && timeTrackingFields) {
      Object.keys(timeTrackingFields).forEach((key) => {
        const formField = timeTrackingFields[key];

        formField.forEach((field) => {
          switch (field.key) {
            case TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK:
              {
                const weekDay =
                  getWeekDay(
                    QLData.firstDayOfWeek && QLData.firstDayOfWeek.value,
                  ) || 'sunday';

                field.value = weekDay;

                setValue(
                  TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK,
                  Number.isInteger(QLData.firstDayOfWeek.value)
                    ? JSON.stringify(QLData.firstDayOfWeek.value)
                    : QLData.firstDayOfWeek.value,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.TIME_ZONE:
              {
                const timeZone =
                  QLData.timeZone && QLData.timeZone.value
                    ? QLData.timeZone.value
                    : timeEntrySettingsDefaultState.timeZone.value;

                const conversion = timezoneConversions.find(
                  (item) => item.name === timeZone,
                );

                field.value = conversion ? conversion.longFormName : timeZone;
                setValue(TIME_TRACKING_SETTINGS.TIME_ZONE, timeZone);
              }
              break;

            case TIME_TRACKING_SETTINGS.TIME_FORMAT:
              {
                const timeFormat =
                  QLData.timeFormat && QLData.timeFormat.value
                    ? QLData.timeFormat.value
                    : timeEntrySettingsDefaultState.timeFormat.value;

                field.value =
                  timeFormat === TWENTY_FOUR_HOUR_FORMAT
                    ? intl.formatMessage({ id: 'twentyFourHourFormat' })
                    : intl.formatMessage({ id: 'twelveHourFormat' });

                setValue(TIME_TRACKING_SETTINGS.TIME_FORMAT, timeFormat);
              }
              break;

            case TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED:
              {
                const isSplitTimeSheet = QLData.splitTimeSheetAtMidnightEnabled
                  ? QLData.splitTimeSheetAtMidnightEnabled.value
                  : timeEntrySettingsDefaultState
                      .splitTimeSheetAtMidnightEnabled.value;

                field.value = !isSplitTimeSheet
                  ? intl.formatMessage({ id: 'off' })
                  : intl.formatMessage({ id: 'on' });
                setValue(
                  TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
                  isSplitTimeSheet,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED:
              {
                const isAllowTeamMemberToAddEditTimeSheets =
                  QLData.manageOwnTimeSheetsEnabled
                    ? QLData.manageOwnTimeSheetsEnabled.value
                    : timeEntrySettingsDefaultState.manageOwnTimeSheetsEnabled
                        .value;

                field.value = !isAllowTeamMemberToAddEditTimeSheets
                  ? intl.formatMessage({ id: 'off' })
                  : intl.formatMessage({ id: 'on' });
                setValue(
                  TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
                  isAllowTeamMemberToAddEditTimeSheets,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED:
              {
                // Use API value directly, not forced override
                const isMobileTimeTrackingEnabled =
                  QLData.mobileTimeTrackingEnabled
                    ? QLData.mobileTimeTrackingEnabled.value
                    : timeEntrySettingsDefaultState.mobileTimeTrackingEnabled
                        .value;

                field.value = !isMobileTimeTrackingEnabled
                  ? intl.formatMessage({ id: 'off' })
                  : intl.formatMessage({ id: 'on' });
                setValue(
                  TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
                  isMobileTimeTrackingEnabled,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED:
              {
                const isSignatureCaptureEnabled = QLData.signatureCaptureEnabled
                  ? QLData.signatureCaptureEnabled.value
                  : timeEntrySettingsDefaultState.signatureCaptureEnabled.value;

                field.value = !isSignatureCaptureEnabled
                  ? intl.formatMessage({ id: 'off' })
                  : intl.formatMessage({ id: 'on' });
                setValue(
                  TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
                  isSignatureCaptureEnabled,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED:
              {
                const allowTeamMemberToEditClockOutTime =
                  QLData.editClockOutTimeEnabled
                    ? QLData.editClockOutTimeEnabled.value
                    : timeEntrySettingsDefaultState.editClockOutTimeEnabled
                        .value;

                const clockOutOverrideHours = QLData.clockOutOverrideHours
                  ? QLData.clockOutOverrideHours.value
                  : timeEntrySettingsDefaultState.clockOutOverrideHours.value;

                field.value = allowTeamMemberToEditClockOutTime
                  ? `${intl.formatMessage({ id: 'on' })}, ${intl.formatMessage({
                      id: 'after',
                    })} ${clockOutOverrideHours} ${intl.formatMessage({
                      id: 'hours',
                    })}`
                  : intl.formatMessage({ id: 'off' });
                setValue(
                  TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
                  allowTeamMemberToEditClockOutTime,
                );
                setValue(
                  TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
                  clockOutOverrideHours,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME:
              {
                const roundClockInTimeDirection =
                  QLData.clockInRoundDirection &&
                  QLData.clockInRoundDirection.value
                    ? QLData.clockInRoundDirection.value
                    : intl.formatMessage({ id: 'nearest' });
                const roundClockInTimeDuration =
                  QLData.clockInRoundInMin && QLData.clockInRoundInMin.value
                    ? QLData.clockInRoundInMin.value
                    : timeEntrySettingsDefaultState.clockInRoundInMin.value;

                field.value = `${uppercaseToPascalcase(
                  roundClockInTimeDirection,
                )}, ${roundClockInTimeDuration} ${intl.formatMessage({
                  id: 'minute',
                })}`;

                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
                  roundClockInTimeDirection,
                );
                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
                  roundClockInTimeDuration,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME:
              {
                const roundClockOutTimeDirection =
                  QLData.clockOutRoundDirection &&
                  QLData.clockOutRoundDirection.value
                    ? QLData.clockOutRoundDirection.value
                    : intl.formatMessage({ id: 'nearest' });
                const roundClockOutTimeDuration =
                  QLData.clockOutRoundInMin && QLData.clockOutRoundInMin.value
                    ? QLData.clockOutRoundInMin.value
                    : timeEntrySettingsDefaultState.clockOutRoundInMin.value;

                field.value = `${uppercaseToPascalcase(
                  roundClockOutTimeDirection,
                )}, ${roundClockOutTimeDuration} ${intl.formatMessage({
                  id: 'minute',
                })}`;

                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
                  roundClockOutTimeDirection,
                );
                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
                  roundClockOutTimeDuration,
                );
              }
              break;

            default:
              break;
          }
        });
      });

      setTimeTrackingFields({ ...timeTrackingFields });

      // Mark fields as initialized when feature flag is enabled
      if (isFitAndFinishSettingsEnabled) {
        fieldsInitializedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLData, isQLSettingsLoading, isFitAndFinishSettingsEnabled]);

  useEffect(() => {
    if (
      !isQLSettingsLoading &&
      QLSettingsError &&
      QLSettingsError !== '' &&
      timeTrackingFields
    ) {
      Object.keys(timeTrackingFields).forEach((key) => {
        const formField = timeTrackingFields[key];

        formField.forEach((field) => {
          switch (field.key) {
            case TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK:
              {
                const weekDay = 'sunday';

                field.value = weekDay;
                setValue(TIME_TRACKING_SETTINGS.FIRST_DAY_OF_WEEK, weekDay);
              }
              break;

            case TIME_TRACKING_SETTINGS.TIME_ZONE:
              {
                const timeZone = timeEntrySettingsDefaultState.timeZone.value;

                const conversion = timezoneConversions.find(
                  (item) => item.name === timeZone,
                );

                field.value = conversion ? conversion.longFormName : timeZone;
                setValue(TIME_TRACKING_SETTINGS.TIME_ZONE, timeZone);
              }
              break;

            case TIME_TRACKING_SETTINGS.TIME_FORMAT:
              field.value = intl.formatMessage({ id: 'twentyFourHourFormat' });

              setValue(
                TIME_TRACKING_SETTINGS.TIME_FORMAT,
                timeEntrySettingsDefaultState.timeFormat.value,
              );
              break;

            case TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                TIME_TRACKING_SETTINGS.SPLIT_TIME_SHEET_AT_MIDNIGET_ENABLED,
                timeEntrySettingsDefaultState.splitTimeSheetAtMidnightEnabled
                  .value,
              );
              break;

            case TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                TIME_TRACKING_SETTINGS.MANAGE_OWN_TIME_SHEETS_ENABLED,
                timeEntrySettingsDefaultState.manageOwnTimeSheetsEnabled.value,
              );
              break;

            case TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED,
                timeEntrySettingsDefaultState.mobileTimeTrackingEnabled.value,
              );
              break;

            case TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED,
                timeEntrySettingsDefaultState.signatureCaptureEnabled.value,
              );
              break;

            case TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED:
              field.value = intl.formatMessage({ id: 'off' });

              setValue(
                TIME_TRACKING_SETTINGS.EDIT_CLOCK_OUT_TIME_ENABLED,
                timeEntrySettingsDefaultState.editClockOutTimeEnabled.value,
              );
              setValue(
                TIME_TRACKING_SETTINGS.CLOCK_OUT_OVERRIDE_HOURS,
                timeEntrySettingsDefaultState.clockOutOverrideHours.value,
              );
              break;

            case TIME_TRACKING_SETTINGS.ROUND_CLOCK_IN_TIME:
              {
                const roundClockInTimeDirection = 'NEAREST';
                const roundClockInTimeDuration =
                  timeEntrySettingsDefaultState.clockInRoundInMin.value;

                field.value = `${uppercaseToPascalcase(
                  roundClockInTimeDirection,
                )}, ${roundClockInTimeDuration} ${intl.formatMessage({
                  id: 'minute',
                })}`;

                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_DIRECTION,
                  roundClockInTimeDirection,
                );
                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_IN_ROUND_IN_MINUTE,
                  roundClockInTimeDuration,
                );
              }
              break;

            case TIME_TRACKING_SETTINGS.ROUND_CLOCK_OUT_TIME:
              {
                const roundClockOutTimeDirection = 'NEAREST';
                const roundClockOutTimeDuration =
                  timeEntrySettingsDefaultState.clockOutRoundInMin.value;

                field.value = `${uppercaseToPascalcase(
                  roundClockOutTimeDirection,
                )}, ${roundClockOutTimeDuration} ${intl.formatMessage({
                  id: 'minute',
                })}`;

                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_DIRECTION,
                  roundClockOutTimeDirection,
                );
                setValue(
                  CLOCK_ROUNDING_SETTINGS.CLOCK_OUT_ROUND_IN_MINUTE,
                  roundClockOutTimeDuration,
                );
              }
              break;

            default:
              break;
          }
        });
      });

      setTimeTrackingFields({ ...timeTrackingFields });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLSettingsError, isQLSettingsLoading]);

  // Filter out new settings if feature flag is disabled
  // Also filter out signature capture if user doesn't have Elite SKU
  const filteredTimeTrackingFields = React.useMemo(() => {
    if (!timeTrackingFields) {
      return timeTrackingFields;
    }

    const filtered: IFormConfig = {};
    Object.keys(timeTrackingFields).forEach((sectionKey) => {
      filtered[sectionKey] = timeTrackingFields[sectionKey].filter((field) => {
        const fieldKey = field.key as string;

        // Filter out new settings if feature flag is disabled
        if (!isFitAndFinishSettingsEnabled) {
          if (
            fieldKey === TIME_TRACKING_SETTINGS.MOBILE_TIME_TRACKING_ENABLED ||
            fieldKey === TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED
          ) {
            return false;
          }
        }

        // Filter out signature capture if user doesn't have Elite SKU
        if (
          fieldKey === TIME_TRACKING_SETTINGS.SIGNATURE_CAPTURE_ENABLED &&
          !isTimeElite
        ) {
          return false;
        }

        return true;
      });
    });
    return filtered;
  }, [timeTrackingFields, isFitAndFinishSettingsEnabled, isTimeElite]);

  return (
    <>
      <GeneralSettingSection
        ViewContent={
          <ViewContent
            formFields={filteredTimeTrackingFields}
            isErrorInView={!!(QLSettingsError && QLSettingsError !== '')}
          />
        }
        EditContent={
          <EditTimeTrackingTimeEntrySettings
            isFitAndFinishSettingsEnabled={isFitAndFinishSettingsEnabled}
            isTimeElite={isTimeElite}
          />
        }
        Title={timeTrackingFieldSettingSection}
        onFormUpdate={onFormUpdate}
        onFormCancel={onFormCancel}
        isFormEdit={isTimeTrackingEditing}
        onSaveTimeTrackingSettings={onSaveTimeEntrySettings}
        id={id}
        isFormEditable={isFormEditable && !QLSettingsError}
        isDataUpdating={isDataUpdating}
        formEditType={TimeEntriesFormType.TIMETRACKING}
      />
    </>
  );
};
