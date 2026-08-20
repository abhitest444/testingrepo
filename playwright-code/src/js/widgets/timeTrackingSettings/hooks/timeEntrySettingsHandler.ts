import { timezoneConversions } from 'src/js/widgets/common/addTimeFormComponents/TimeZoneField';
import {
  ICancelTimeEntrySettingsForm,
  ISuccessUpdateCompanySettings,
  IUpdateTimeEntrySettingsForm,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  updateNotificationFields,
  updateTimeSheetFields,
  updateTimeTrackingFields,
} from 'src/js/widgets/timeTrackingSettings/hooks/mapTimeTrackingSettings';
import {
  mapGetQlSettingsData,
  updateTimeSheetFieldsSelectedFields,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeEntrySettingsForm';
import { TimeEntriesFormType } from '../constants';

export const successUpdateCompanySettings = ({
  result,
  updatedFields,
  updatedTimeEntryFormValue,
  setUpdatedTimeEntryFormValue,
  setUpdatedFields,
  isFormEdit,
  timeTrackingFields,
  setFormFieldValue,
  intl,
  isFieldsVisible,
  setTimeTrackingFields,
  setEditTimeSheetFields,
  setNotificationFields,
  updateVisibleFields,
  notificationFields,
  editTimeSheetFields,
  isTimeSheetEditing,
  updateErrorMessage,
  timeEntryFormOpenToUpdate,
  removeTimeEntryDirtyFields,
  setIsConfirmationModalOpen,
  onFormUpdate,
  setTimeEntryFormOpenToUpdate,
  isUKLocale,
}: ISuccessUpdateCompanySettings) => {
  const updatedQlSettingsData: any = mapGetQlSettingsData(
    result,
    updatedFields,
    updatedTimeEntryFormValue,
  );

  if (updatedQlSettingsData) {
    setUpdatedTimeEntryFormValue(updatedQlSettingsData);
    setUpdatedFields([]);

    if (isFormEdit.isTimeTrackingEditing) {
      const newTimeTrackingFields = updateTimeTrackingFields({
        timeTrackingFields,
        updatedQlSettingsData,
        setFormFieldValue,
        timezoneConversions,
        intl,
        isFieldsVisible,
        setNotificationFields,
        updateVisibleFields,
        notificationFields,
      });

      setTimeTrackingFields({ ...newTimeTrackingFields });
    }

    if (isFormEdit.isTimeSheetFieldsEditing && isTimeSheetEditing) {
      const newEditTimeSheetFields = updateTimeSheetFields({
        editTimeSheetFields,
        updatedQlSettingsData,
        setFormFieldValue,
        notificationFields,
        isFieldsVisible,
        setNotificationFields,
        updateVisibleFields,
      });

      setEditTimeSheetFields([...newEditTimeSheetFields]);
    }

    if (isFormEdit.isNotificationEditing) {
      const newNotificationFields = updateNotificationFields({
        notificationFields,
        updatedQlSettingsData,
        intl,
        setFormFieldValue,
        isFieldsVisible,
        updateVisibleFields,
        isUKLocale,
      });

      setNotificationFields({ ...newNotificationFields });
    }

    updateErrorMessage('');

    setTimeout(() => {
      if (timeEntryFormOpenToUpdate) {
        removeTimeEntryDirtyFields(updatedQlSettingsData);
        setIsConfirmationModalOpen(false);
        onFormUpdate(timeEntryFormOpenToUpdate);
        setTimeEntryFormOpenToUpdate('');
      } else {
        removeTimeEntryDirtyFields(updatedQlSettingsData);
        onFormUpdate('');
      }
    }, 500);
  }
};

export const updateTimeEntrySettingsForm = ({
  formType,
  isFormEdit,
  isFormContainingDirtyFields,
  setTimeEntryFormOpenToUpdate,
  setIsConfirmationModalOpen,
  setIsTimeSheetEditing,
  handleCustomFieldsClick,
  isTimeSheetEditing,
  setIsFormEdit,
  reRenderTimeEntrySetting,
  errorMessage,
}: IUpdateTimeEntrySettingsForm) => {
  if (formType === TimeEntriesFormType.TIMETRACKING) {
    if (
      isFormEdit.isTimeSheetFieldsEditing ||
      isFormEdit.isNotificationEditing ||
      isFormEdit.isApprovalEditing
    ) {
      if (isFormContainingDirtyFields()) {
        setTimeEntryFormOpenToUpdate(formType);
        setIsConfirmationModalOpen(true);
      } else {
        isFormEdit.isTimeTrackingEditing = true;
        isFormEdit.isNotificationEditing = false;
        isFormEdit.isTimeSheetFieldsEditing = false;
        isFormEdit.isApprovalEditing = false;
      }
    } else {
      isFormEdit.isTimeTrackingEditing = !isFormEdit.isTimeTrackingEditing;
    }
  }

  if (formType === TimeEntriesFormType.TIMESHEET) {
    if (
      isFormEdit.isTimeTrackingEditing ||
      isFormEdit.isNotificationEditing ||
      isFormEdit.isApprovalEditing
    ) {
      if (isFormContainingDirtyFields()) {
        setTimeEntryFormOpenToUpdate(formType);
        setIsConfirmationModalOpen(true);
      } else {
        reRenderTimeEntrySetting(errorMessage);
        isFormEdit.isTimeSheetFieldsEditing = true;
        isFormEdit.isNotificationEditing = false;
        isFormEdit.isTimeTrackingEditing = false;
        isFormEdit.isApprovalEditing = false;
        setIsTimeSheetEditing(true);
      }
    } else {
      const isTimeSheetFieldValue = !isFormEdit.isTimeSheetFieldsEditing;
      if (isTimeSheetFieldValue) {
        reRenderTimeEntrySetting(errorMessage);
      }
      isFormEdit.isTimeSheetFieldsEditing = isTimeSheetFieldValue;
      setIsTimeSheetEditing(isTimeSheetFieldValue);
    }
  }

  if (formType === TimeEntriesFormType.NOTIFICATION) {
    if (
      isFormEdit.isTimeTrackingEditing ||
      isFormEdit.isTimeSheetFieldsEditing ||
      isFormEdit.isApprovalEditing
    ) {
      if (isFormContainingDirtyFields()) {
        setTimeEntryFormOpenToUpdate(formType);
        setIsConfirmationModalOpen(true);
      } else {
        isFormEdit.isNotificationEditing = true;
        isFormEdit.isTimeTrackingEditing = false;
        isFormEdit.isTimeSheetFieldsEditing = false;
        isFormEdit.isApprovalEditing = false;
      }
    } else {
      isFormEdit.isNotificationEditing = !isFormEdit.isNotificationEditing;
    }
  }

  if (formType === TimeEntriesFormType.APPROVALS) {
    if (
      isFormEdit.isTimeTrackingEditing ||
      isFormEdit.isTimeSheetFieldsEditing ||
      isFormEdit.isNotificationEditing
    ) {
      if (isFormContainingDirtyFields()) {
        setTimeEntryFormOpenToUpdate(formType);
        setIsConfirmationModalOpen(true);
      } else {
        isFormEdit.isApprovalEditing = true;
        isFormEdit.isTimeTrackingEditing = false;
        isFormEdit.isTimeSheetFieldsEditing = false;
        isFormEdit.isNotificationEditing = false;
      }
    } else {
      isFormEdit.isApprovalEditing = !isFormEdit.isApprovalEditing;
    }
  }

  if (formType === TimeEntriesFormType.CUSTOM_FIELDS) {
    handleCustomFieldsClick();
  }

  if (formType === '') {
    isFormEdit.isNotificationEditing = false;
    isFormEdit.isTimeTrackingEditing = false;
    isFormEdit.isTimeSheetFieldsEditing = false;
    isFormEdit.isApprovalEditing = false;
    if (isTimeSheetEditing) {
      setIsTimeSheetEditing(false);
    }
  }
  setIsFormEdit({ ...isFormEdit });
};

export const cancelTimeEntrySettingsForm = ({
  isFormContainingDirtyFields,
  removeTimeEntryDirtyFields,
  formType,
  updatedTimeEntryFormValue,
  isFormEdit,
  selectedCustomTimeSheetFields,
  setSelectedCustomTimeSheetFields,
  setIsTimeSheetEditing,
  setIsFormEdit,
}: ICancelTimeEntrySettingsForm) => {
  if (isFormContainingDirtyFields()) {
    removeTimeEntryDirtyFields(updatedTimeEntryFormValue);
  }

  if (formType === TimeEntriesFormType.TIMETRACKING) {
    isFormEdit.isTimeTrackingEditing = false;
  }

  if (formType === TimeEntriesFormType.TIMESHEET) {
    isFormEdit.isTimeSheetFieldsEditing = false;
    if (updatedTimeEntryFormValue) {
      updateTimeSheetFieldsSelectedFields(
        updatedTimeEntryFormValue,
        selectedCustomTimeSheetFields,
      );
      setSelectedCustomTimeSheetFields([...selectedCustomTimeSheetFields]);
    }
    setIsTimeSheetEditing(false);
  }

  if (formType === TimeEntriesFormType.NOTIFICATION) {
    isFormEdit.isNotificationEditing = false;
  }

  if (formType === TimeEntriesFormType.APPROVALS) {
    isFormEdit.isApprovalEditing = false;
  }
  setIsFormEdit({ ...isFormEdit });
};
