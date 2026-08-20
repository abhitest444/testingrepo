import React, { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSandbox } from '@payroll/quicksand';
import {
  IFormConfig,
  ITimeSheetFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';
import { useGetDimensions } from 'src/js/service/hooks/dimensions/useGetDimensions';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import {
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
  TimeEntriesFormType,
} from 'src/js/widgets/timeTrackingSettings/constants';
import { EditTimeSheetField } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/EditTimesheetField';
import {
  updateTimeSheetField,
  updateTimeSheetFieldTitle,
} from 'src/js/widgets/timeTrackingSettings/hooks/mapTimeTrackingSettings';
import { timeEntrySettingsDefaultState } from 'src/js/service/hooks/settings/useGetQLSettings';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import {
  FEATURE_FLAGS,
  SECTION_READY_EVENT,
  SECTION_READY_KEYS,
} from 'src/js/common/constants';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import {
  filterSubFieldsByIXP,
  mapDimensionDefinitionsToPreviewFields,
  mapDimensionPreviewFieldsToFormValues,
} from 'src/js/widgets/timeTrackingSettings/utils';

export interface ITimeSheetFields {
  timeSheetFields: IFormConfig;
  isTimeSheetEditing: boolean;
  timeSheetFieldSettingSection: string;
  id: string;
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  editTimeSheetFields: ITimeSheetFieldOption[];
  setEditTimeSheetFields: (
    editTimeSheetFields: ITimeSheetFieldOption[],
  ) => void;
  selectedCustomTimeSheetFields: string[];
  updateSelectedCustomTimeSheetField: (
    selectedCustomTimeSheetField: string,
  ) => void;
  onSaveTimeEntrySettings: (trackingPoint?: TrackingPoint) => void;
  isDataUpdating: boolean;
  /**
   * Hide the collapsed view/summary card and render only the edit trowser. Used
   * when the timesheet settings are launched as a standalone trowser from
   * another page.
   */
  hideViewSection?: boolean;
  /**
   * Invoked when "Set defaults" in the Dimensions section is clicked. Returns
   * `true` when it handled the click (closes the standalone timesheet trowser
   * when launched from payroll defaults); `false` to fall back to opening the
   * custom defaults widget.
   */
  onDimensionsSetDefaults?: () => boolean;
}

export const TimeSheetFields: React.FC<ITimeSheetFields> = ({
  timeSheetFields,
  isTimeSheetEditing,
  timeSheetFieldSettingSection,
  id,
  onFormUpdate,
  onFormCancel,
  editTimeSheetFields,
  setEditTimeSheetFields,
  selectedCustomTimeSheetFields,
  updateSelectedCustomTimeSheetField,
  onSaveTimeEntrySettings,
  isDataUpdating,
  hideViewSection = false,
  onDimensionsSetDefaults,
}) => {
  const {
    QLData,
    isQLSettingsLoading,
    QLSettingsError,
    v3PreferencesData,
    v3PreferencesLoading,
    v3PreferencesError,
    isFormEditable,
  } = useTimeTrackingSettingsContext(false);

  const { setValue } = useFormContext();
  const sandbox = useSandbox();

  // Publish section ready event when data loads (transition from loading to loaded)
  const sectionReadyPublishedRef = useRef(false);
  const wasLoadingRef = useRef(isQLSettingsLoading || v3PreferencesLoading);
  useEffect(() => {
    const currentlyLoading = isQLSettingsLoading || v3PreferencesLoading;
    const wasLoading = wasLoadingRef.current;
    wasLoadingRef.current = currentlyLoading;

    const justLoaded = wasLoading && !currentlyLoading;
    if (justLoaded && !sectionReadyPublishedRef.current) {
      sectionReadyPublishedRef.current = true;
      sandbox.logger.info(
        'Component=TimeSheetFields Event=SECTION_READY section=TIMESHEET',
      );
      sandbox.pubsub.publish(SECTION_READY_EVENT, {
        section: SECTION_READY_KEYS.TIMESHEET,
      });
    }
  }, [isQLSettingsLoading, v3PreferencesLoading, sandbox]);
  const {
    isEnabled: featureFlagForRequiredTimeSheetFields,
    isLoading: isIXPFlagLoading,
  } = useIXPFeatureFlag({
    flagName:
      FEATURE_FLAGS.QB_TIME_TRACKING_UI_TE_SETTINGS_REQUIRED_TIME_SHEET_FIELDS,
  });

  const { isVisible: isDimensionsSectionVisible } = useDimensionVisibility();
  const {
    dimensions: dimensionDefinitionsFromApi,
    loading: dimensionsDefinitionsLoading,
    query: queryDimensions,
  } = useGetDimensions();
  const queriedDimensionsRef = useRef(false);

  useEffect(() => {
    if (!isDimensionsSectionVisible) {
      return;
    }
    if (queriedDimensionsRef.current) {
      return;
    }
    queriedDimensionsRef.current = true;
    queryDimensions().catch((err) => {
      sandbox.logger.error(
        'Component=TimeSheetFields Event=FetchDimensionsFailed',
        { error: err instanceof Error ? err.message : String(err) },
      );
    });
  }, [isDimensionsSectionVisible, queryDimensions, sandbox.logger]);

  useEffect(() => {
    if (
      !isDimensionsSectionVisible ||
      isQLSettingsLoading ||
      dimensionsDefinitionsLoading
    ) {
      return;
    }

    const customDimensions = QLData?.customDimensions ?? [];
    const dimensionDefinitions = dimensionDefinitionsFromApi.map(
      ({ id, name, active }) => ({ id, label: name, active }),
    );
    const previewFields = mapDimensionDefinitionsToPreviewFields(
      dimensionDefinitions,
      customDimensions,
    );

    setValue('customDimensions', customDimensions, {
      shouldDirty: false,
      shouldTouch: false,
    });
    setValue('dimensionDefinitions', dimensionDefinitions, {
      shouldDirty: false,
      shouldTouch: false,
    });

    if (previewFields.length > 0) {
      setValue(
        'dimensions',
        mapDimensionPreviewFieldsToFormValues(previewFields),
        { shouldDirty: false, shouldTouch: false },
      );
    }
  }, [
    isDimensionsSectionVisible,
    isQLSettingsLoading,
    dimensionsDefinitionsLoading,
    QLData?.customDimensions,
    dimensionDefinitionsFromApi,
    setValue,
  ]);

  useEffect(() => {
    if (
      !isQLSettingsLoading &&
      editTimeSheetFields &&
      !v3PreferencesLoading &&
      v3PreferencesData &&
      (QLData || (QLSettingsError && QLSettingsError !== ''))
    ) {
      const fieldKeys: string[] = [];
      editTimeSheetFields.forEach((timeSheetFields) => {
        fieldKeys.push(timeSheetFields.key);
        if (timeSheetFields.subFields && timeSheetFields.subFields.length > 0) {
          const filteredSubFields = filterSubFieldsByIXP(
            timeSheetFields.subFields,
            timeSheetFields.key,
            featureFlagForRequiredTimeSheetFields,
          );
          filteredSubFields.forEach((subField) => fieldKeys.push(subField.key));
        }
        if (
          featureFlagForRequiredTimeSheetFields &&
          timeSheetFields.requiredField &&
          timeSheetFields.requiredField.key
        ) {
          fieldKeys.push(timeSheetFields.requiredField.key);
        }
      });
      // Determine if we should use QLData or default values
      const settingData = QLData && !QLSettingsError ? QLData : null;
      fieldKeys.forEach((fieldKey) => {
        switch (fieldKey) {
          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED:
            {
              const isCustomerForTimeSheet =
                settingData && settingData.customersForTimeSheetEnabled
                  ? settingData.customersForTimeSheetEnabled.value
                  : timeEntrySettingsDefaultState.customersForTimeSheetEnabled
                      .value;

              // eslint-disable-next-line no-nested-ternary
              const customerFieldLabel = v3PreferencesError
                ? 'time-entries.section.title.time-sheet.customer-and-sub-customer'
                : v3PreferencesData?.Preferences?.AccountingInfoPrefs
                    ?.CustomerTerminology
                ? v3PreferencesData?.Preferences?.AccountingInfoPrefs
                    ?.CustomerTerminology
                : 'time-entries.section.title.time-sheet.customer-and-sub-customer';

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
                isCustomerForTimeSheet,
                editTimeSheetFields,
              );

              updateTimeSheetFieldTitle(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
                customerFieldLabel,
                editTimeSheetFields,
              );

              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED,
                isCustomerForTimeSheet,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED:
            {
              const isBillingFieldEnabled =
                settingData && settingData.isBillingFieldEnabled
                  ? settingData.isBillingFieldEnabled.value
                  : timeEntrySettingsDefaultState.isBillingFieldEnabled.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
                isBillingFieldEnabled,
                editTimeSheetFields,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
                isBillingFieldEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED:
            {
              const isBillingRateForTimeEnable =
                settingData && settingData.billingRateForTimeEnabled
                  ? settingData.billingRateForTimeEnabled.value
                  : timeEntrySettingsDefaultState.billingRateForTimeEnabled
                      .value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
                isBillingRateForTimeEnable,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.BILLING_RATE_FOR_TIME_ENABLED,
                isBillingRateForTimeEnable,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE:
            {
              const isRequireBillable =
                settingData && settingData.requireBillable
                  ? settingData.requireBillable.value
                  : timeEntrySettingsDefaultState.requireBillable.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_BILLING_FIELD_ENABLED,
                isRequireBillable,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_BILLABLE,
                isRequireBillable,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE:
            {
              const isServiceFieldEnabled =
                settingData && settingData.useItemForTime
                  ? settingData.useItemForTime.value
                  : timeEntrySettingsDefaultState.useItemForTime.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
                isServiceFieldEnabled,
                editTimeSheetFields,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
                isServiceFieldEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM:
            {
              const isRequireServiceItem =
                settingData && settingData.serviceItemRequired
                  ? settingData.serviceItemRequired.value
                  : timeEntrySettingsDefaultState.serviceItemRequired.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE,
                isRequireServiceItem,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_SERVICE_ITEM,
                isRequireServiceItem,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES:
            {
              const isClassForTimeSheetEnabled =
                settingData && settingData.classForTimeSheetEnabled
                  ? settingData.classForTimeSheetEnabled.value
                  : timeEntrySettingsDefaultState.classForTimeSheetEnabled
                      .value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
                isClassForTimeSheetEnabled,
                editTimeSheetFields,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
                isClassForTimeSheetEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS:
            {
              const isRequireClass =
                settingData && settingData.classRequired
                  ? settingData.classRequired.value
                  : timeEntrySettingsDefaultState.classRequired.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CLASS_ENABLES,
                isRequireClass,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_CLASS,
                isRequireClass,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED:
            {
              const isLocationForTimeSheetEnabled =
                settingData && settingData.locationForTimeSheetEnabled
                  ? settingData.locationForTimeSheetEnabled.value
                  : timeEntrySettingsDefaultState.locationForTimeSheetEnabled
                      .value;
              // eslint-disable-next-line no-nested-ternary
              const locationFieldLabel = v3PreferencesError
                ? 'time-entries.section.title.time-sheet.location'
                : v3PreferencesData &&
                  v3PreferencesData.Preferences &&
                  v3PreferencesData.Preferences.AccountingInfoPrefs &&
                  v3PreferencesData.Preferences.AccountingInfoPrefs
                    .DepartmentTerminology
                ? v3PreferencesData.Preferences.AccountingInfoPrefs
                    .DepartmentTerminology
                : 'time-entries.section.title.time-sheet.location';

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
                isLocationForTimeSheetEnabled,
                editTimeSheetFields,
              );
              updateTimeSheetFieldTitle(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
                locationFieldLabel,
                editTimeSheetFields,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
                isLocationForTimeSheetEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION:
            {
              const isRequireLocation =
                settingData && settingData.locationRequired
                  ? settingData.locationRequired.value
                  : timeEntrySettingsDefaultState.locationRequired.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.LOCATION_FOR_TIMESHEET_ENABLED,
                isRequireLocation,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.REQUIRE_LOCATION,
                isRequireLocation,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE:
            {
              const isTimeSheetEntryNotesEnabled =
                settingData && settingData.timeSheetEntryNotesEnabled
                  ? settingData.timeSheetEntryNotesEnabled.value
                  : timeEntrySettingsDefaultState.timeSheetEntryNotesEnabled
                      .value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
                isTimeSheetEntryNotesEnabled,
                editTimeSheetFields,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
                isTimeSheetEntryNotesEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED:
            {
              const isTimeSheetEntryEditNotesEnabled =
                settingData && settingData.timeSheetEntryEditNotesEnabled
                  ? settingData.timeSheetEntryEditNotesEnabled.value
                  : timeEntrySettingsDefaultState.timeSheetEntryEditNotesEnabled
                      .value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
                isTimeSheetEntryEditNotesEnabled,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_EDITS_NOTES_ENABLED,
                isTimeSheetEntryEditNotesEnabled,
              );
            }
            break;

          case TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES:
            {
              const isTimeSheetEntryMakesNotesRequiredEnabled =
                settingData &&
                settingData.timeSheetEntryMakesNotesRequiredEnabled
                  ? settingData.timeSheetEntryMakesNotesRequiredEnabled.value
                  : timeEntrySettingsDefaultState
                      .timeSheetEntryMakesNotesRequiredEnabled.value;

              updateTimeSheetField(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE,
                isTimeSheetEntryMakesNotesRequiredEnabled,
                editTimeSheetFields,
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
              );
              setValue(
                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_ENTRY_MAKES_NOTES_REQUIRES_ENABLES,
                isTimeSheetEntryMakesNotesRequiredEnabled,
              );
            }
            break;

          default:
            break;
        }
      });
      setEditTimeSheetFields([...editTimeSheetFields]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    QLData,
    QLSettingsError,
    isQLSettingsLoading,
    v3PreferencesLoading,
    v3PreferencesData,
    v3PreferencesError,
    featureFlagForRequiredTimeSheetFields,
  ]);

  return (
    <>
      {!hideViewSection && (
        <GeneralSettingSection
          ViewContent={
            <ViewContent
              formFields={timeSheetFields}
              isErrorInView={!!(QLSettingsError && QLSettingsError !== '')}
            />
          }
          EditContent={<></>}
          Title={timeSheetFieldSettingSection}
          onFormUpdate={onFormUpdate}
          onFormCancel={onFormCancel}
          isFormEdit={false}
          onSaveTimeTrackingSettings={() => {}}
          id={id}
          isFormEditable={isFormEditable && !QLSettingsError}
          isDataUpdating={false}
          formEditType={TimeEntriesFormType.TIMESHEET}
        />
      )}

      {isTimeSheetEditing && (
        <EditTimeSheetField
          isTimeSheetEditing={isTimeSheetEditing}
          onFormCancel={onFormCancel}
          onSaveTimeEntrySettings={onSaveTimeEntrySettings}
          isDataUpdating={isDataUpdating || isQLSettingsLoading}
          editTimeSheetFields={editTimeSheetFields}
          updateSelectedCustomTimeSheetField={
            updateSelectedCustomTimeSheetField
          }
          selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
          isIXPFlagLoading={isIXPFlagLoading}
          featureFlagForRequiredTimeSheetFields={
            featureFlagForRequiredTimeSheetFields
          }
          onDimensionsSetDefaults={onDimensionsSetDefaults}
        />
      )}
    </>
  );
};
