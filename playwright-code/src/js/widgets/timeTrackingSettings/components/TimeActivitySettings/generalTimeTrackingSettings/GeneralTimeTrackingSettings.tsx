import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';

import {
  FormType,
  getWeekDay,
  IFormConfig,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { ViewContent } from 'src/js/widgets/timeTrackingSettings/common/viewContent';
import { useTimeTrackingSettingsContext } from '../../../context/TimeTrackingSettingsContext';
import { EditGeneralTimeTrackingSettings } from './EditGeneralTimeTrackingSettings';

interface IGeneralTimeTrackingSettings {
  onFormUpdate: (formType: string) => void;
  onFormCancel: (formType: string) => void;
  isGeneralTimeTrackingEdit: boolean;
  onSaveTimeTrackingSettings: (trackingPoint?: TrackingPoint) => void;
  id: string;
  isDataUpdating: boolean;
  generalFieldSettingSection: string;
  generalFields: IFormConfig;
  setGeneralFields: (generalFields: IFormConfig) => void;
}

export const GeneralTimeTrackingSettings: React.FC<
  IGeneralTimeTrackingSettings
> = ({
  onFormUpdate,
  onFormCancel,
  isGeneralTimeTrackingEdit,
  onSaveTimeTrackingSettings,
  id,
  isDataUpdating,
  generalFieldSettingSection,
  generalFields,
  setGeneralFields,
}) => {
  const { QLData, QLSettingsError, isQLSettingsLoading, isFormEditable } =
    useTimeTrackingSettingsContext();
  const intl = useIntl();
  const { setValue } = useFormContext();

  useEffect(() => {
    if (QLData && generalFields && !isQLSettingsLoading) {
      const weekDay = getWeekDay(QLData.firstDayOfWeek.value) || 'sunday';

      Object.keys(generalFields).forEach((key) => {
        const formField = generalFields[key];
        const firstDayOfWeekField = formField.find(
          (field) =>
            intl.formatMessage({ id: field.title }) ===
            intl.formatMessage({
              id: 'location-settings.fields.general-settings',
            }),
        );

        if (firstDayOfWeekField) {
          firstDayOfWeekField.value = weekDay;
        }
      });

      setGeneralFields({ ...generalFields });
      setValue(
        'firstDayOfWeek',
        Number.isInteger(QLData.firstDayOfWeek.value)
          ? JSON.stringify(QLData.firstDayOfWeek.value)
          : QLData.firstDayOfWeek.value,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLData, isQLSettingsLoading]);

  useEffect(() => {
    if (!isQLSettingsLoading && QLSettingsError && QLSettingsError !== '') {
      Object.keys(generalFields).forEach((key) => {
        const formField = generalFields[key];
        const firstDayOfWeekField = formField.find(
          (field) =>
            intl.formatMessage({ id: field.title }) ===
            intl.formatMessage({
              id: 'location-settings.fields.general-settings',
            }),
        );

        if (firstDayOfWeekField) {
          firstDayOfWeekField.value = 'sunday';
        }
      });

      setGeneralFields({ ...generalFields });
      setValue('firstDayOfWeek', 'sunday');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [QLSettingsError, isQLSettingsLoading]);

  return (
    <GeneralSettingSection
      ViewContent={
        <ViewContent
          formFields={generalFields}
          isErrorInView={!!(QLSettingsError && QLSettingsError !== '')}
        />
      }
      EditContent={<EditGeneralTimeTrackingSettings />}
      Title={intl.formatMessage({ id: generalFieldSettingSection })}
      onFormUpdate={onFormUpdate}
      onFormCancel={onFormCancel}
      isFormEdit={isGeneralTimeTrackingEdit}
      onSaveTimeTrackingSettings={onSaveTimeTrackingSettings}
      id={id}
      isFormEditable={isFormEditable && !QLSettingsError}
      isDataUpdating={isDataUpdating}
      formEditType={FormType.GENERAL}
    />
  );
};
