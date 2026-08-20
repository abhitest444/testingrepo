import { useForm } from 'react-hook-form';

import {
  mapDaysOfWeekValueToNumber,
  TimeEntryBooleanField,
  TimeEntryNumberField,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import { SetQLSettingsArgs } from 'src/js/service/hooks/settings/useSetQLSettings';
import {
  IconSize,
  MenuButtonPriority,
  MenuButtonPurpose,
} from 'src/js/widgets/timeTrackingSettings/constants';

export interface ITimeSettingsEditFormSection {
  isGeneralFieldEditing: boolean;
  isTimeSheetFieldEditing: boolean;
}

export interface IFormConfig {
  [key: string]: FieldOption[];
}

export interface ITimeTrackingSettingsFormState {
  firstDayOfWeek: string;
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
  billingRateForTimeEnabled: boolean;
}

export interface IUpdateQLResponse {
  isServiceFieldEnabled: TimeEntryBooleanField;
  isBillingFieldEnabled: TimeEntryBooleanField;
  firstDayOfWeek: TimeEntryNumberField;
  billingRateForTimeEnabled: TimeEntryBooleanField;
}

export type FieldOption = {
  id: string; // this is the name of the query
  key: string; // this is the field key
  title: string; // this is the name of the fields
  ariaLabel: string;
  tooltipText: string;
  disabled: boolean;
  detail: {
    // let us replace the accordion with details
    title: string;
    subtitle: string;
    ariaLabel: string;
  };
  subFields?: FieldOption[];
  isCustom?: boolean;
  value: string | boolean;
  isEditable?: boolean;
  isVisible?: boolean;
  automationId?: string;
  menuButton?: {
    label: string;
    onClick: () => void;
    automationId?: string;
    icon?: string;
    iconSize?: IconSize;
    priority: MenuButtonPriority;
    purpose: MenuButtonPurpose;
    size: IconSize;
  };
};

export type ERROR_STATES_TYPE = keyof typeof ERROR_STATES;

export enum FormType {
  GENERAL = 'General',
  TIMESHEET = 'Timesheet',
}

export const IS_FORM_EDITING: ITimeSettingsEditFormSection = {
  isGeneralFieldEditing: false,
  isTimeSheetFieldEditing: false,
};

export const ERROR_STATES = {
  BLOCKER: 'BLOCKER',
  ERROR: 'ERROR',
};

export const DAYS_OF_WEEK: { [key: string]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const getWeekDay = (dayIndex: number) =>
  Object.keys(DAYS_OF_WEEK).find((key) => DAYS_OF_WEEK[key] === dayIndex);

export const useTimeTrackingSettings = () =>
  useForm<ITimeTrackingSettingsFormState>({ mode: 'onSubmit' });

export const comparingTheTimeTrackingSettings_toTimeTrackingSettings = (
  formState: ITimeTrackingSettingsFormState,
  settings: IUpdateQLResponse,
) =>
  formState.isBillingFieldEnabled !== settings.isBillingFieldEnabled.value ||
  formState.isServiceFieldEnabled !== settings.isServiceFieldEnabled.value ||
  parseInt(formState.firstDayOfWeek, 10) !== settings.firstDayOfWeek.value ||
  formState.billingRateForTimeEnabled !==
    settings.billingRateForTimeEnabled.value;

export const mapTimeTrackingSettings_forSettingsMutation = (
  formState: ITimeTrackingSettingsFormState,
  settings: IUpdateQLResponse,
): SetQLSettingsArgs => ({
  timeTrackingUseItemForTimeEnabled: {
    version: settings.isServiceFieldEnabled.version,
    value: formState.isServiceFieldEnabled,
  },
  timeTrackingBillingEnabled: {
    version: settings.isBillingFieldEnabled.version,
    value: formState.isBillingFieldEnabled,
  },
  timeTrackingBillingRateForTimeEnabled: {
    version: settings.billingRateForTimeEnabled.version,
    value: formState.billingRateForTimeEnabled,
  },
  timeTrackingStartWorkWeek: {
    version: settings.firstDayOfWeek.version,
    value: parseInt(formState.firstDayOfWeek, 10),
  },
});

export const sanitize = (input: string | boolean | undefined | null) => {
  if (input === null || input === undefined) return '';
  const stringInput = typeof input === 'boolean' ? String(input) : input;
  const map: { [key: string]: string } = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  const reg = /[<>"']/gi;
  return stringInput.replace(reg, (match) => map[match]);
};

export const removeDirtyFieldUtil = (
  timeTrackingSettingsFormMethods: any,
  updatedFormValue?: IUpdateQLResponse,
) => {
  if (updatedFormValue) {
    Object.keys(timeTrackingSettingsFormMethods.formState.dirtyFields).forEach(
      (field: any) => {
        if (updatedFormValue) {
          timeTrackingSettingsFormMethods.setValue(
            field,
            field === 'firstDayOfWeek'
              ? JSON.stringify(updatedFormValue.firstDayOfWeek.value)
              : updatedFormValue[field as keyof IUpdateQLResponse].value,
            {
              shouldDirty: false,
            },
          );

          // @ts-ignore
          delete timeTrackingSettingsFormMethods.formState.dirtyFields[field];
        }
      },
    );
  }
};

export const handleUpdateCompanySettings = (
  result: any,
  setUpdatedFormValue: (updatedFormValue: IUpdateQLResponse) => void,
  isFormEdit: ITimeSettingsEditFormSection,
  generalFields: any,
  setGeneralFields: (generalFields: IFormConfig) => void,
  timeTrackingSettingsFormMethods: any,
  timeSheetFields: IFormConfig,
  setTimeSheetFields: (timeSheetFields: IFormConfig) => void,
  formToOpenForUpdate: string,
  setIsConfirmationModalOpen: (isConfirmationModalOpen: boolean) => void,
  onFormUpdate: (formType: string) => void,
  setFormToOpenForUpdate: (formToOpenForUpdate: string) => void,
  removeDirtyField: (updatedFormValue?: IUpdateQLResponse) => void,
  text: (id: string) => string,
) => {
  if (result) {
    const updatedQLSettingsData: IUpdateQLResponse = {
      billingRateForTimeEnabled: {
        version:
          result.billingRateForTimeEnabled &&
          result.billingRateForTimeEnabled.meta &&
          result.billingRateForTimeEnabled.meta.version
            ? result.billingRateForTimeEnabled.meta.version
            : '',
        value:
          result.billingRateForTimeEnabled &&
          result.billingRateForTimeEnabled.value
            ? result.billingRateForTimeEnabled.value
            : false,
      },
      firstDayOfWeek: {
        version:
          result.startWorkWeek &&
          result.startWorkWeek.meta &&
          result.startWorkWeek.meta.version
            ? result.startWorkWeek.meta.version
            : '',
        value:
          result.startWorkWeek && result.startWorkWeek.value
            ? mapDaysOfWeekValueToNumber(result.startWorkWeek.value)
            : 0,
      },
      isServiceFieldEnabled: {
        version:
          result.useItemForTime &&
          result.useItemForTime.meta &&
          result.useItemForTime.meta.version
            ? result.useItemForTime.meta.version
            : '',
        value:
          result.useItemForTime && result.useItemForTime.value
            ? result.useItemForTime.value
            : false,
      },
      isBillingFieldEnabled: {
        version:
          result.billingForTimeEnabled &&
          result.billingForTimeEnabled.meta &&
          result.billingForTimeEnabled.meta.version
            ? result.billingForTimeEnabled.meta.version
            : '',
        value:
          result.billingForTimeEnabled && result.billingForTimeEnabled.value
            ? result.billingForTimeEnabled.value
            : false,
      },
    };

    setUpdatedFormValue({
      billingRateForTimeEnabled:
        updatedQLSettingsData.billingRateForTimeEnabled,
      isBillingFieldEnabled: updatedQLSettingsData.isBillingFieldEnabled,
      firstDayOfWeek: updatedQLSettingsData.firstDayOfWeek,
      isServiceFieldEnabled: updatedQLSettingsData.isServiceFieldEnabled,
    });

    if (isFormEdit.isGeneralFieldEditing) {
      const weekDay = getWeekDay(
        Number(updatedQLSettingsData.firstDayOfWeek.value),
      );

      Object.keys(generalFields).forEach((key) => {
        const formField = generalFields[key];
        const firstDayOfWeekField = formField.find(
          (field: FieldOption) =>
            text(field.title) ===
            text('location-settings.fields.general-settings'),
        );

        if (firstDayOfWeekField) {
          firstDayOfWeekField.value = weekDay;
        }
      });

      setGeneralFields({ ...generalFields });

      timeTrackingSettingsFormMethods.setValue(
        'firstDayOfWeek',
        JSON.stringify(updatedQLSettingsData.firstDayOfWeek.value),
        {
          shouldDirty: false,
        },
      );
    }

    if (isFormEdit.isTimeSheetFieldEditing) {
      const {
        isServiceFieldEnabled,
        isBillingFieldEnabled,
        billingRateForTimeEnabled,
      } = updatedQLSettingsData;

      if (
        isServiceFieldEnabled &&
        isBillingFieldEnabled &&
        billingRateForTimeEnabled
      ) {
        Object.keys(timeSheetFields).forEach((key) => {
          const formField = timeSheetFields[key];
          const isServiceFieldVisible = formField.find(
            (field: FieldOption) =>
              text(field.title) ===
              text('location-settings.fields.timesheet-settings-service'),
          );

          const isBillableFieldVisible = formField.find(
            (field: FieldOption) =>
              text(field.title) ===
              text('location-settings.fields.timesheet-settings-billable'),
          );

          if (isServiceFieldVisible) {
            isServiceFieldVisible.value = !isServiceFieldEnabled.value
              ? 'Off'
              : 'On';
          }

          if (isBillableFieldVisible) {
            isBillableFieldVisible.value = !isBillingFieldEnabled.value
              ? 'Off'
              : 'On';
          }
        });

        setTimeSheetFields({ ...timeSheetFields });

        timeTrackingSettingsFormMethods.setValue(
          'isServiceFieldEnabled',
          isServiceFieldEnabled.value,
          {
            shouldDirty: false,
          },
        );
        timeTrackingSettingsFormMethods.setValue(
          'isBillingFieldEnabled',
          isBillingFieldEnabled.value,
          {
            shouldDirty: false,
          },
        );
        timeTrackingSettingsFormMethods.setValue(
          'billingRateForTimeEnabled',
          billingRateForTimeEnabled.value || false,
          {
            shouldDirty: false,
          },
        );
      }
    }

    if (formToOpenForUpdate) {
      setTimeout(() => {
        removeDirtyField(updatedQLSettingsData);
        setIsConfirmationModalOpen(false);
        onFormUpdate(formToOpenForUpdate);
        setFormToOpenForUpdate('');
      }, 500);
    } else {
      setTimeout(() => {
        removeDirtyField(updatedQLSettingsData);
        onFormUpdate('');
      }, 500);
    }
  }
};

export const handleUpdateError = (
  formToOpenForUpdate: string,
  setIsConfirmationModalOpen: (isConfirmationModalOpen: boolean) => void,
  setFormToOpenForUpdate: (formToOpenForUpdate: string) => void,
  removeDirtyField: (updatedFormValue?: IUpdateQLResponse) => void,
  onFormUpdate: (formType: string) => void,
  updatedFormValue?: IUpdateQLResponse,
) => {
  if (formToOpenForUpdate) {
    setIsConfirmationModalOpen(false);
    setFormToOpenForUpdate('');
  } else {
    removeDirtyField(updatedFormValue);
    onFormUpdate('');
  }
};
