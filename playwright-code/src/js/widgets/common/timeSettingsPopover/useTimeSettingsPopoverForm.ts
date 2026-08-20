import { useForm } from 'react-hook-form';
import { SetSettingsMutationArgs } from 'src/js/service/hooks/settings/useSetSettings';
import {
  UxPreferenceData,
  UxPreferenceHideTimeEntryFieldsData,
  UxPreferenceHideWeekdaysData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { SetQLSettingsArgs } from 'src/js/service/hooks/settings/useSetQLSettings';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';

export interface TimeSettingsPopulatedState {
  hasServiceFieldData: boolean;
  hasBillingFieldData: boolean;
  hasClassFieldData: boolean;
  // hasProjectFieldData: boolean;
  hasLocationFieldData: boolean;
  hasPayTypeFieldData: boolean;
  hasCostRateFieldData: boolean;
  hasTaxableFieldData: boolean;
}

export interface TimeSettingsPopoverFormState {
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  isClassFieldEnabled: boolean;
  isProjectFieldEnabled: boolean;
  isLocationFieldEnabled: boolean;
  isPayTypeFieldEnabled: boolean;
  isCostRateFieldEnabled: boolean;
  isTaxableFieldEnabled: boolean;

  isSundayEnabled: boolean;
  isMondayEnabled: boolean;
  isTuesdayEnabled: boolean;
  isWednesdayEnabled: boolean;
  isThursdayEnabled: boolean;
  isFridayEnabled: boolean;
  isSaturdayEnabled: boolean;
}

export const useTimeSettingsPopoverForm = () =>
  useForm<TimeSettingsPopoverFormState>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
      isSundayEnabled: true,
      isMondayEnabled: true,
      isTuesdayEnabled: true,
      isWednesdayEnabled: true,
      isThursdayEnabled: true,
      isFridayEnabled: true,
      isSaturdayEnabled: true,
    },
  });

export const mapTimeSettingsPopoverFormState = (
  settingsData: TimeTrackingCompanySettings,
  uxPreferences: UxPreferenceData,
): TimeSettingsPopoverFormState => ({
  isServiceFieldEnabled: settingsData.isServiceFieldEnabled,
  isBillingFieldEnabled: settingsData.isBillingFieldEnabled,
  isClassFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isClassFieldEnabled,
  isProjectFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isProjectFieldEnabled,
  isLocationFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
      .isLocationFieldEnabled,
  isPayTypeFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isPayTypeFieldEnabled,
  isCostRateFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]
      .isCostRateFieldEnabled,
  isTaxableFieldEnabled:
    uxPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS].isTaxableFieldEnabled,
  isSundayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]?.isSundayHidden,
  isMondayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]?.isMondayHidden,
  isTuesdayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]
      ?.isTuesdayHidden,
  isWednesdayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]
      ?.isWednesdayHidden,
  isThursdayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]
      ?.isThursdayHidden,
  isFridayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]?.isFridayHidden,
  isSaturdayEnabled:
    !uxPreferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]
      ?.isSaturdayHidden,
});

// return true if TimeSettingsPopoverFormState is different from TimeTrackingSettings
export const compareTimeSettingsPopoverFormState_toTimeTrackingSettings = (
  formState: TimeSettingsPopoverFormState,
  settings: TimeTrackingCompanySettings,
) =>
  formState.isServiceFieldEnabled !== settings.isServiceFieldEnabled ||
  formState.isBillingFieldEnabled !== settings.isBillingFieldEnabled;

export const mapTimeSettingsPopoverFormState_forCompanySettingsMutation = (
  companySettingsData: MappedQLSettings,
  formState: TimeSettingsPopoverFormState,
): SetQLSettingsArgs => ({
  timeTrackingBillingEnabled: {
    version: companySettingsData.isBillingFieldEnabled.version,
    value: formState.isBillingFieldEnabled,
  },
  timeTrackingUseItemForTimeEnabled: {
    // UseItemForTime changes maps to service item changes
    version: companySettingsData.useItemForTime.version,
    value: formState.isServiceFieldEnabled,
  },
});
export const mapTimeSettingsPopoverFormState_forSettingsMutation = (
  entityVersion: string,
  formState: TimeSettingsPopoverFormState,
): SetSettingsMutationArgs => ({
  entityVersion,
  isServiceFieldEnabled: formState.isServiceFieldEnabled,
  isBillingFieldEnabled: formState.isBillingFieldEnabled,
});

// return true if TimeSettingsPopoverFormState is different from UxPreferenceHideWeekdaysData
export const compareTimeSettingsPopoverFormState_toUxPreferenceHideWeekdaysData =
  (
    formState: TimeSettingsPopoverFormState,
    uxPreferenceHideWeekdaysData: UxPreferenceHideWeekdaysData,
  ) => {
    const enabledValues = [
      formState.isSundayEnabled,
      formState.isMondayEnabled,
      formState.isTuesdayEnabled,
      formState.isWednesdayEnabled,
      formState.isThursdayEnabled,
      formState.isFridayEnabled,
      formState.isSaturdayEnabled,
    ];

    const hiddenValues = [
      uxPreferenceHideWeekdaysData.isSundayHidden,
      uxPreferenceHideWeekdaysData.isMondayHidden,
      uxPreferenceHideWeekdaysData.isTuesdayHidden,
      uxPreferenceHideWeekdaysData.isWednesdayHidden,
      uxPreferenceHideWeekdaysData.isThursdayHidden,
      uxPreferenceHideWeekdaysData.isFridayHidden,
      uxPreferenceHideWeekdaysData.isSaturdayHidden,
    ];

    return enabledValues.some(
      (enabled, index) => enabled === hiddenValues[index],
    );
  };

export const mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideWeekdays =
  (formState: TimeSettingsPopoverFormState): UxPreferenceHideWeekdaysData => ({
    isSundayHidden: !formState.isSundayEnabled,
    isMondayHidden: !formState.isMondayEnabled,
    isTuesdayHidden: !formState.isTuesdayEnabled,
    isWednesdayHidden: !formState.isWednesdayEnabled,
    isThursdayHidden: !formState.isThursdayEnabled,
    isFridayHidden: !formState.isFridayEnabled,
    isSaturdayHidden: !formState.isSaturdayEnabled,
  });

export const compareTimeSettingsPopoverFormState_toUxPreferenceHideTimeEntryFieldsData =
  (
    settings: TimeTrackingCompanySettings,
    formState: TimeSettingsPopoverFormState,
    uxPreferenceHideTimeEntryFieldsData: UxPreferenceHideTimeEntryFieldsData,
  ) =>
    (settings.isClassEnabled &&
      formState.isClassFieldEnabled !==
        uxPreferenceHideTimeEntryFieldsData.isClassFieldEnabled) ||
    formState.isProjectFieldEnabled !==
      uxPreferenceHideTimeEntryFieldsData.isProjectFieldEnabled ||
    formState.isLocationFieldEnabled !==
      uxPreferenceHideTimeEntryFieldsData.isLocationFieldEnabled ||
    formState.isPayTypeFieldEnabled !==
      uxPreferenceHideTimeEntryFieldsData.isPayTypeFieldEnabled ||
    formState.isCostRateFieldEnabled !==
      uxPreferenceHideTimeEntryFieldsData.isCostRateFieldEnabled ||
    formState.isTaxableFieldEnabled !==
      uxPreferenceHideTimeEntryFieldsData.isTaxableFieldEnabled;

export const mapTimeSettingsPopoverFormState_forUxPreferencesMutation_hideTimeEntryFields =
  (
    formState: TimeSettingsPopoverFormState,
  ): UxPreferenceHideTimeEntryFieldsData => ({
    isClassFieldEnabled: formState.isClassFieldEnabled,
    isProjectFieldEnabled: formState.isProjectFieldEnabled,
    isLocationFieldEnabled: formState.isLocationFieldEnabled,
    isPayTypeFieldEnabled: formState.isPayTypeFieldEnabled,
    isCostRateFieldEnabled: formState.isCostRateFieldEnabled,
    isTaxableFieldEnabled: formState.isTaxableFieldEnabled,
  });

export const atLeastOneWeekdaySelected = (
  formState: TimeSettingsPopoverFormState,
): boolean =>
  formState.isSundayEnabled ||
  formState.isMondayEnabled ||
  formState.isTuesdayEnabled ||
  formState.isWednesdayEnabled ||
  formState.isThursdayEnabled ||
  formState.isFridayEnabled ||
  formState.isSaturdayEnabled;

export const attemptingToHideWeekdayAlreadyWithData = (
  formState: TimeSettingsPopoverFormState,
  weekdaysWithDurations: number[],
): boolean =>
  [
    formState.isSundayEnabled,
    formState.isMondayEnabled,
    formState.isTuesdayEnabled,
    formState.isWednesdayEnabled,
    formState.isThursdayEnabled,
    formState.isFridayEnabled,
    formState.isSaturdayEnabled,
  ].some(
    (isEnabled, index) => !isEnabled && weekdaysWithDurations.includes(index),
  );

export const attemptingToHideFieldAlreadyWithData = (
  formState: TimeSettingsPopoverFormState,
  fieldsWithData: TimeSettingsPopulatedState,
): boolean =>
  (!formState.isServiceFieldEnabled && fieldsWithData.hasServiceFieldData) ||
  (!formState.isClassFieldEnabled && fieldsWithData.hasClassFieldData) ||
  // (!formState.isProjectFieldEnabled && fieldsWithData.hasProjectFieldData) ||
  (!formState.isLocationFieldEnabled && fieldsWithData.hasLocationFieldData) ||
  (!formState.isPayTypeFieldEnabled && fieldsWithData.hasPayTypeFieldData) ||
  (!formState.isCostRateFieldEnabled && fieldsWithData.hasCostRateFieldData) ||
  (!formState.isTaxableFieldEnabled && fieldsWithData.hasTaxableFieldData);
