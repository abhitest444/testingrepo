import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';

import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import {
  FormType,
  IFormConfig,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { EditTimeSheetTimeTrackingSettings } from './EditTimeSheetTimeTrackingSettings';
import { useTimeTrackingSettingsContext } from '../../../context/TimeTrackingSettingsContext';

interface ITimeSheetTimeTrackingSettings {
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  isTimeSheetTimeTrackingEdit: boolean;
  onSaveTimeTrackingSettings: () => void;
  updateQLSettingsLoading: boolean;
  id: string;
  isDataUpdating: boolean;
  timeSheetFieldSettingSection: string;
  timeSheetFields: IFormConfig;
  setTimeSheetFields: (timeSheetFields: IFormConfig) => void;
}

export const TimeSheetTimeTrackingSettings: React.FC<
  ITimeSheetTimeTrackingSettings
> = ({
  onFormUpdate,
  onFormCancel,
  isTimeSheetTimeTrackingEdit,
  onSaveTimeTrackingSettings,
  updateQLSettingsLoading,
  id,
  isDataUpdating,
  timeSheetFieldSettingSection,
  timeSheetFields,
  setTimeSheetFields,
}) => {
  const { setValue } = useFormContext();
  const { QLData, QLSettingsError, isQLSettingsLoading, isFormEditable } =
    useTimeTrackingSettingsContext();
  const intl = useIntl();
  useEffect(() => {
    if (
      QLData &&
      timeSheetFields &&
      !isQLSettingsLoading &&
      !updateQLSettingsLoading
    ) {
      const {
        isServiceFieldEnabled,
        isBillingFieldEnabled,
        billingRateForTimeEnabled,
      } = QLData;

      if (
        isServiceFieldEnabled &&
        isBillingFieldEnabled &&
        billingRateForTimeEnabled
      ) {
        const serviceField = isServiceFieldEnabled.value
          ? isServiceFieldEnabled.value
          : false;
        const billableField = isBillingFieldEnabled.value
          ? isBillingFieldEnabled.value
          : false;
        const billRateTimeEnabled = billingRateForTimeEnabled.value
          ? billingRateForTimeEnabled.value
          : false;

        Object.keys(timeSheetFields).forEach((key) => {
          const formField = timeSheetFields[key];
          const isServiceFieldVisible = formField.find(
            (field) =>
              intl.formatMessage({ id: field.title }) ===
              intl.formatMessage({
                id: 'location-settings.fields.timesheet-settings-service',
              }),
          );

          const isBillableFieldVisible = formField.find(
            (field) =>
              intl.formatMessage({ id: field.title }) ===
              intl.formatMessage({
                id: 'location-settings.fields.timesheet-settings-billable',
              }),
          );

          if (isServiceFieldVisible) {
            isServiceFieldVisible.value = !serviceField ? 'Off' : 'On';
          }

          if (isBillableFieldVisible) {
            isBillableFieldVisible.value = !billableField ? 'Off' : 'On';
          }
        });

        setTimeSheetFields({ ...timeSheetFields });

        setValue('isServiceFieldEnabled', serviceField);
        setValue('isBillingFieldEnabled', billableField);
        setValue('billingRateForTimeEnabled', billRateTimeEnabled || false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLData, isQLSettingsLoading]);

  useEffect(() => {
    if (!isQLSettingsLoading && QLSettingsError && QLSettingsError !== '') {
      Object.keys(timeSheetFields).forEach((key) => {
        const formField = timeSheetFields[key];
        const isServiceFieldVisible = formField.find(
          (field) =>
            intl.formatMessage({ id: field.title }) ===
            intl.formatMessage({
              id: 'location-settings.fields.timesheet-settings-service',
            }),
        );

        const isBillableField = formField.find(
          (field) =>
            intl.formatMessage({ id: field.title }) ===
            intl.formatMessage({
              id: 'location-settings.fields.timesheet-settings-billable',
            }),
        );

        if (isServiceFieldVisible) {
          isServiceFieldVisible.value = 'Off';
        }

        if (isBillableField) {
          isBillableField.value = 'Off';
        }
      });

      setValue('isServiceFieldEnabled', false);
      setValue('isBillingFieldEnabled', false);
      setValue('billingRateForTimeEnabled', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLSettingsError, isQLSettingsLoading]);

  return (
    <GeneralSettingSection
      ViewContent={
        <ViewContent
          formFields={timeSheetFields}
          isErrorInView={!!(QLSettingsError && QLSettingsError !== '')}
        />
      }
      EditContent={<EditTimeSheetTimeTrackingSettings />}
      Title={timeSheetFieldSettingSection}
      onFormUpdate={onFormUpdate}
      onFormCancel={onFormCancel}
      isFormEdit={isTimeSheetTimeTrackingEdit}
      onSaveTimeTrackingSettings={onSaveTimeTrackingSettings}
      id={id}
      isFormEditable={isFormEditable && !QLSettingsError}
      isDataUpdating={isDataUpdating}
      formEditType={FormType.TIMESHEET}
    />
  );
};
