import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';

import {
  TIME_ACTIVITY_SETTINGS_TRACKING_POINTS,
  TrackingPoint,
} from 'src/js/common/useClickTracking';
import { GeneralTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/generalTimeTrackingSettings/GeneralTimeTrackingSettings';
import { TimeSheetTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/timeSheetTimeTrackingSettings/TimeSheetTimeTrackingSettings';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import {
  comparingTheTimeTrackingSettings_toTimeTrackingSettings,
  FormType,
  handleUpdateCompanySettings,
  handleUpdateError,
  IFormConfig,
  IS_FORM_EDITING,
  ITimeSettingsEditFormSection,
  ITimeTrackingSettingsFormState,
  IUpdateQLResponse,
  mapTimeTrackingSettings_forSettingsMutation,
  removeDirtyFieldUtil,
  useTimeTrackingSettings,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import { GENERAL_VIEW_FORM_CONFIG } from 'src/js/widgets/timeTrackingSettings/common/viewForm';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { canEditPreference } from 'src/js/service/utils/sandboxUtils';
import {
  ConfirmationModalContent,
  ErrorOrWarningMessage,
} from 'src/js/widgets/timeTrackingSettings/TimeTrackingSettings.styled';

interface ITimeActivitySettingsForm {
  onIsDirtyTimeForm?: (isDirty: boolean) => boolean;
}

export const TimeActivitySettingsForm: React.FC<ITimeActivitySettingsForm> = ({
  onIsDirtyTimeForm,
}) => {
  const track = useTracking();
  const sandbox = useSandbox();
  const generalFieldSettingSection = 'time-settings.section.title.general';
  const timeSheetFieldSettingSection = 'time-settings.section.title.timesheet';

  const [isFormEdit, setIsFormEdit] =
    useState<ITimeSettingsEditFormSection>(IS_FORM_EDITING);

  const [generalFields, setGeneralFields] = useState<IFormConfig>({
    [generalFieldSettingSection]:
      GENERAL_VIEW_FORM_CONFIG[generalFieldSettingSection],
  });

  const [timeSheetFields, setTimeSheetFields] = useState<IFormConfig>({
    [timeSheetFieldSettingSection]:
      GENERAL_VIEW_FORM_CONFIG[timeSheetFieldSettingSection],
  });

  const [updatedFormValue, setUpdatedFormValue] = useState<IUpdateQLResponse>();

  const [formToOpenForUpdate, setFormToOpenForUpdate] = useState<string>('');

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] =
    useState<boolean>(false);

  const timeTrackingSettingsFormMethods = useTimeTrackingSettings();

  const formStateRef = useRef(
    timeTrackingSettingsFormMethods.formState.dirtyFields,
  );

  const intl = useIntl();

  const { QLData } = useTimeTrackingSettingsContext();

  const text = (id: string) => intl.formatMessage({ id });

  // set settings
  const [updateCompanySettings, { loading: setQLSettingsLoading }] =
    useSetQLSettings({
      onSuccess: (result: any) => {
        handleUpdateCompanySettings(
          result,
          setUpdatedFormValue,
          isFormEdit,
          generalFields,
          setGeneralFields,
          timeTrackingSettingsFormMethods,
          timeSheetFields,
          setTimeSheetFields,
          formToOpenForUpdate,
          setIsConfirmationModalOpen,
          onFormUpdate,
          setFormToOpenForUpdate,
          removeDirtyField,
          text,
        );
      },
      onError: () => {
        handleUpdateError(
          formToOpenForUpdate,
          setIsConfirmationModalOpen,
          setFormToOpenForUpdate,
          removeDirtyField,
          onFormUpdate,
          updatedFormValue,
        );
      },
    });

  const removeDirtyField = (updatedFormValue?: IUpdateQLResponse) => {
    removeDirtyFieldUtil(timeTrackingSettingsFormMethods, updatedFormValue);
    onIsDirtyTimeForm && onIsDirtyTimeForm(false);
  };

  const onFormUpdate = (formType: string) => {
    if (formType === FormType.GENERAL) {
      track(TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.GENERAL_SECTION_EDIT);
      if (isFormEdit.isTimeSheetFieldEditing) {
        if (
          Object.keys(timeTrackingSettingsFormMethods.formState.dirtyFields)
            .length > 0
        ) {
          setFormToOpenForUpdate(formType);
          setIsConfirmationModalOpen(true);
        } else {
          isFormEdit.isGeneralFieldEditing = true;
          isFormEdit.isTimeSheetFieldEditing = false;
        }
      } else {
        isFormEdit.isGeneralFieldEditing = !isFormEdit.isGeneralFieldEditing;
      }
    }

    if (formType === FormType.TIMESHEET) {
      track(TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_EDIT);
      if (isFormEdit.isGeneralFieldEditing) {
        if (
          Object.keys(timeTrackingSettingsFormMethods.formState.dirtyFields)
            .length > 0
        ) {
          setFormToOpenForUpdate(formType);
          setIsConfirmationModalOpen(true);
        } else {
          isFormEdit.isTimeSheetFieldEditing = true;
          isFormEdit.isGeneralFieldEditing = false;
        }
      } else {
        isFormEdit.isTimeSheetFieldEditing =
          !isFormEdit.isTimeSheetFieldEditing;
      }
    }

    if (formType === '') {
      isFormEdit.isGeneralFieldEditing = false;
      isFormEdit.isTimeSheetFieldEditing = false;
    }

    setIsFormEdit({ ...isFormEdit });
  };

  const onFormCancel = (formType: string, trackingPoint: TrackingPoint) => {
    track(trackingPoint);
    if (
      Object.keys(timeTrackingSettingsFormMethods.formState.dirtyFields)
        .length > 0
    ) {
      removeDirtyField(updatedFormValue);
    }

    if (formType === FormType.TIMESHEET) {
      isFormEdit.isTimeSheetFieldEditing = false;
    }

    if (formType === FormType.GENERAL) {
      isFormEdit.isGeneralFieldEditing = false;
    }

    setIsFormEdit({ ...isFormEdit });
  };

  const onSubmit: SubmitHandler<ITimeTrackingSettingsFormState> = (
    formState: ITimeTrackingSettingsFormState,
  ) => {
    if (
      updatedFormValue &&
      comparingTheTimeTrackingSettings_toTimeTrackingSettings(
        formState,
        updatedFormValue,
      )
    ) {
      updateCompanySettings(
        mapTimeTrackingSettings_forSettingsMutation(
          formState,
          updatedFormValue,
        ),
      );
    } else {
      onFormUpdate('');
    }
  };

  const onSaveTimeTrackingSettings = (trackingPoint: TrackingPoint) => {
    track(trackingPoint);
    timeTrackingSettingsFormMethods.handleSubmit(onSubmit)();
  };

  const onYesConfirmationModal = () => {
    timeTrackingSettingsFormMethods.handleSubmit(onSubmit)();
  };

  const onNoConfirmationModal = () => {
    removeDirtyField(updatedFormValue);

    if (formToOpenForUpdate !== '') {
      setIsConfirmationModalOpen(false);
      onFormUpdate(formToOpenForUpdate);
      setFormToOpenForUpdate('');
    }
  };

  useEffect(() => {
    if (
      onIsDirtyTimeForm &&
      Object.keys(timeTrackingSettingsFormMethods.formState.dirtyFields)
        .length > 0
    ) {
      onIsDirtyTimeForm(true);
    }

    formStateRef.current =
      timeTrackingSettingsFormMethods.formState.dirtyFields;
  }, [timeTrackingSettingsFormMethods.formState, onIsDirtyTimeForm]);

  useEffect(() => {
    if (QLData) {
      setUpdatedFormValue({
        isBillingFieldEnabled: {
          version: QLData.isBillingFieldEnabled.version,
          value: QLData.isBillingFieldEnabled.value,
        },
        firstDayOfWeek: {
          version: QLData.firstDayOfWeek.version,
          value: QLData.firstDayOfWeek.value,
        },
        billingRateForTimeEnabled: {
          version: QLData.billingRateForTimeEnabled.version,
          value: QLData.billingRateForTimeEnabled.value,
        },
        isServiceFieldEnabled: {
          version: QLData.useItemForTime.version,
          value: QLData.isServiceFieldEnabled.value,
        },
      });
    }
  }, [QLData]);

  useEffect(() => {
    onFormUpdate('');
    sandbox.logger.info(`Component= Time Activity Settings Event=Mounted`);
    track(TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.ON_MOUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-testid="time-activity-settings-form">
      {!canEditPreference(sandbox) && (
        <ErrorOrWarningMessage
          open
          type="info"
          dismissible={false}
          title={intl.formatMessage({
            id: 'do.not.have.access.rights.to.edit.time.settings',
          })}
          automationId="TimeActivitySettingsWarningPageMessage"
        >
          <Typography variant="body-3" as="span">
            {intl.formatMessage({
              id: 'ask.your.quickbooks.admin.for.access',
            })}
          </Typography>
        </ErrorOrWarningMessage>
      )}

      <FormProvider {...timeTrackingSettingsFormMethods}>
        <GeneralTimeTrackingSettings
          onFormUpdate={onFormUpdate}
          onFormCancel={() =>
            onFormCancel(
              FormType.GENERAL,
              TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.GENERAL_SECTION_CANCEL,
            )
          }
          isGeneralTimeTrackingEdit={isFormEdit.isGeneralFieldEditing}
          onSaveTimeTrackingSettings={() =>
            onSaveTimeTrackingSettings(
              TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.GENERAL_SECTION_SAVE,
            )
          }
          id="general-settings"
          isDataUpdating={setQLSettingsLoading}
          generalFieldSettingSection={generalFieldSettingSection}
          generalFields={generalFields}
          setGeneralFields={setGeneralFields}
        />
        <TimeSheetTimeTrackingSettings
          onFormUpdate={onFormUpdate}
          onFormCancel={() =>
            onFormCancel(
              FormType.TIMESHEET,
              TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_SECTION_CANCEL,
            )
          }
          isTimeSheetTimeTrackingEdit={isFormEdit.isTimeSheetFieldEditing}
          onSaveTimeTrackingSettings={() =>
            onSaveTimeTrackingSettings(
              TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.TIMESHEET_SECTION_SAVE,
            )
          }
          updateQLSettingsLoading={setQLSettingsLoading}
          id="timesheet-settings"
          isDataUpdating={setQLSettingsLoading}
          timeSheetFieldSettingSection={timeSheetFieldSettingSection}
          timeSheetFields={timeSheetFields}
          setTimeSheetFields={setTimeSheetFields}
        />
      </FormProvider>

      <ConfirmationModal
        open={isConfirmationModalOpen}
        setOpen={setIsConfirmationModalOpen}
        onYesClick={onYesConfirmationModal}
        onNoClick={onNoConfirmationModal}
        size="small"
        actionAlignment="center"
        contentAlignment="center"
        headerAlignment="center"
        title={intl.formatMessage({
          id: 'unsaved.changes.confirmation.modal.header',
        })}
      >
        <ConfirmationModalContent variant="body-3">
          {intl.formatMessage({
            id: 'unsaved.changes.confirmation.modal.content',
          })}
        </ConfirmationModalContent>
      </ConfirmationModal>
    </div>
  );
};
