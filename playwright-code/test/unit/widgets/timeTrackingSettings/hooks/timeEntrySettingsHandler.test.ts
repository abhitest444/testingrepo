import {
  successUpdateCompanySettings,
  updateTimeEntrySettingsForm,
  cancelTimeEntrySettingsForm,
} from 'src/js/widgets/timeTrackingSettings/hooks/timeEntrySettingsHandler';
import { MappedQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import {
  IFormConfig,
  ITimeSheetFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import { TIME_TRACKING_FORM_CONFIG } from 'src/js/widgets/timeTrackingSettings/common/viewForm';
import { TimeEntriesFormType } from 'src/js/widgets/timeTrackingSettings/constants';

describe('timeEntrySettingsMutationHandler', () => {
  const mockIntl = {
    formatMessage: jest.fn((obj) => obj.defaultMessage || ''),
  };

  const mockMappedQLSettings: MappedQLSettings = {
    timeTrackingSupported: { version: '1', value: true },
    transactionBillingForTimeEnabled: { version: '1', value: true },
    transactionTimeTrackingEnabled: { version: '1', value: true },
    firstDayOfWeek: { version: '1', value: 1 },
    timeZone: { version: '1', value: 'America/New_York' },
    timeFormat: { version: '1', value: 12 },
    isBillingFieldEnabled: { version: '1', value: true },
    billingRateForTimeEnabled: { version: '1', value: true },
    useItemForTime: { version: '1', value: true },
    isServiceFieldEnabled: { version: '1', value: true },
    requireBillable: { version: '1', value: true },
    customersForTimeSheetEnabled: { version: '1', value: true },
    classForTimeSheetEnabled: { version: '1', value: true },
    locationForTimeSheetEnabled: { version: '1', value: true },
    timeSheetEntryNotesEnabled: { version: '1', value: true },
    timeSheetEntryEditNotesEnabled: { version: '1', value: true },
    timeSheetEntryMakesNotesRequiredEnabled: { version: '1', value: true },
    splitTimeSheetAtMidnightEnabled: { version: '1', value: true },
    manageOwnTimeSheetsEnabled: { version: '1', value: true },
    editClockOutTimeEnabled: { version: '1', value: true },
    clockOutOverrideHours: { version: '1', value: 8 },
    clockInRoundDirection: { version: '1', value: 'Nearest' },
    clockInRoundInMin: { version: '1', value: 15 },
    clockOutRoundDirection: { version: '1', value: 'Nearest' },
    clockOutRoundInMin: { version: '1', value: 15 },
    clockInNotificationReminderTime: { version: '1', value: '09:00' },
    clockInNotificationReminderEmail: { version: '1', value: true },
    clockInNotificationReminderMobile: { version: '1', value: true },
    clockOutNotificationReminderTime: { version: '1', value: '17:00' },
    clockOutNotificationReminderEmail: { version: '1', value: true },
    clockOutNotificationReminderMobile: { version: '1', value: true },
    notificationEnabledForDays: { version: '1', value: ['MONDAY', 'TUESDAY'] },
    notifyAdminOnClockOutOverrideEnabled: { version: '1', value: true },
    notifyManagerOnClockOutOverrideEnabled: { version: '1', value: true },
    notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: true },
    notifyGroupManagerOnTimeSheetNotesEditEnabled: {
      version: '1',
      value: true,
    },
    scheduleManagePreference: { version: '1', value: 'company' },
    scheduleViewPreference: { version: '1', value: 'company' },
  };

  const mockTimeTrackingFields: IFormConfig = {
    'time-entries.section.title.time-tracking':
      TIME_TRACKING_FORM_CONFIG['time-entries.section.title.time-tracking'],
  };

  const mockNotificationFields: IFormConfig = {
    'time-entries.section.title.notifications':
      TIME_TRACKING_FORM_CONFIG['time-entries.section.title.notifications'],
  };

  const mockTimeSheetFields: ITimeSheetFieldOption[] = [
    {
      id: 'customer',
      key: 'customersForTimeSheetEnabled',
      title: 'Customer',
      ariaLabel: 'Customer field',
      tooltipText: 'Select customer',
      disabled: false,
      value: true,
      detail: {
        title: 'Customer',
        subtitle: 'Select customer for time entry',
        ariaLabel: 'Customer selection',
      },
    },
    {
      id: 'class',
      key: 'classForTimeSheetEnabled',
      title: 'Class',
      ariaLabel: 'Class field',
      tooltipText: 'Select class',
      disabled: false,
      value: false,
      detail: {
        title: 'Class',
        subtitle: 'Select class for time entry',
        ariaLabel: 'Class selection',
      },
    },
  ];

  const defaultProps = {
    result: {
      data: {
        updateCompanySettings: mockMappedQLSettings,
      },
    },
    updatedFields: ['timeZone', 'timeFormat'],
    updatedTimeEntryFormValue: mockMappedQLSettings,
    setUpdatedTimeEntryFormValue: jest.fn(),
    setUpdatedFields: jest.fn(),
    isFormEdit: {
      isTimeTrackingEditing: true,
      isTimeSheetFieldsEditing: true,
      isNotificationEditing: true,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    },
    timeTrackingFields: mockTimeTrackingFields,
    setFormFieldValue: jest.fn(),
    intl: mockIntl,
    isFieldsVisible: {
      notifyWhenClockInOutTimeAdjusted: true,
      notifyWhenNotesAreAddedOrEdited: true,
    },
    setTimeTrackingFields: jest.fn(),
    setEditTimeSheetFields: jest.fn(),
    setNotificationFields: jest.fn(),
    updateVisibleFields: jest.fn(),
    notificationFields: mockNotificationFields,
    editTimeSheetFields: mockTimeSheetFields,
    isTimeSheetEditing: true,
    updateErrorMessage: jest.fn(),
    timeEntryFormOpenToUpdate: '',
    removeTimeEntryDirtyFields: jest.fn(),
    setIsConfirmationModalOpen: jest.fn(),
    onFormUpdate: jest.fn(),
    setTimeEntryFormOpenToUpdate: jest.fn(),
    isUKLocale: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should update all sections when all editing flags are true', () => {
    // Arrange
    const props = { ...defaultProps };

    // Act
    successUpdateCompanySettings(props);

    // Assert
    expect(props.setUpdatedTimeEntryFormValue).toHaveBeenCalled();
    expect(props.setUpdatedFields).toHaveBeenCalledWith([]);
    expect(props.setTimeTrackingFields).toHaveBeenCalled();
    expect(props.setEditTimeSheetFields).toHaveBeenCalled();
    expect(props.setNotificationFields).toHaveBeenCalled();
    expect(props.updateErrorMessage).toHaveBeenCalledWith('');
  });

  it('should only update time tracking fields when only time tracking is being edited', () => {
    // Arrange
    const props = {
      ...defaultProps,
      isFormEdit: {
        isTimeTrackingEditing: true,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
    };

    // Act
    successUpdateCompanySettings(props);

    // Assert
    expect(props.setTimeTrackingFields).toHaveBeenCalled();
    expect(props.setEditTimeSheetFields).not.toHaveBeenCalled();
    expect(props.setNotificationFields).toHaveBeenCalled();
  });

  it('should only update timesheet fields when only timesheet is being edited', () => {
    // Arrange
    const props = {
      ...defaultProps,
      isFormEdit: {
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: true,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
    };

    // Act
    successUpdateCompanySettings(props);

    // Assert
    expect(props.setTimeTrackingFields).not.toHaveBeenCalled();
    expect(props.setEditTimeSheetFields).toHaveBeenCalled();
    expect(props.setNotificationFields).not.toHaveBeenCalled();
  });

  it('should only update notification fields when only notifications are being edited', () => {
    // Arrange
    const props = {
      ...defaultProps,
      isFormEdit: {
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: true,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
    };

    // Act
    successUpdateCompanySettings(props);

    // Assert
    expect(props.setTimeTrackingFields).not.toHaveBeenCalled();
    expect(props.setEditTimeSheetFields).not.toHaveBeenCalled();
    expect(props.setNotificationFields).toHaveBeenCalled();
  });

  it('should handle form update with timeEntryFormOpenToUpdate', () => {
    // Arrange
    const props = {
      ...defaultProps,
      timeEntryFormOpenToUpdate: 'FORM_1',
    };

    // Act
    successUpdateCompanySettings(props);
    jest.advanceTimersByTime(500);

    // Assert
    expect(props.removeTimeEntryDirtyFields).toHaveBeenCalled();
    expect(props.setIsConfirmationModalOpen).toHaveBeenCalledWith(false);
    expect(props.onFormUpdate).toHaveBeenCalledWith('FORM_1');
    expect(props.setTimeEntryFormOpenToUpdate).toHaveBeenCalledWith('');
  });

  it('should handle empty/default values when company settings are reset', () => {
    // Arrange
    const props = {
      ...defaultProps,
      result: {
        data: {
          updateCompanySettings: null,
        },
      },
      updatedFields: [],
      updatedTimeEntryFormValue: undefined,
    };

    // Act
    successUpdateCompanySettings(props);

    // Assert
    // Verify that default/empty values are set
    expect(props.setUpdatedTimeEntryFormValue).toHaveBeenCalledWith(
      expect.objectContaining({
        timeFormat: { value: 24, version: '' },
        timeZone: { value: '', version: '' },
        firstDayOfWeek: { value: 0, version: '' },
        editClockOutTimeEnabled: { value: false, version: '' },
        clockOutOverrideHours: { value: 8, version: '' },
      }),
    );
    expect(props.setUpdatedFields).toHaveBeenCalledWith([]);
    expect(props.updateErrorMessage).toHaveBeenCalledWith('');
  });

  it('should handle form cleanup after successful update with no timeEntryFormOpenToUpdate', () => {
    // Arrange
    const props = {
      ...defaultProps,
      timeEntryFormOpenToUpdate: '',
      result: {
        data: {
          updateCompanySettings: mockMappedQLSettings,
        },
      },
    };

    // Act
    successUpdateCompanySettings(props);
    jest.advanceTimersByTime(500);

    // Assert
    expect(props.removeTimeEntryDirtyFields).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(props.onFormUpdate).toHaveBeenCalledWith('');

    // Verify the order of operations using mock.calls
    const removeTimeEntryCallIndex =
      props.removeTimeEntryDirtyFields.mock.invocationCallOrder[0];
    const onFormUpdateCallIndex =
      props.onFormUpdate.mock.invocationCallOrder[0];
    expect(removeTimeEntryCallIndex).toBeLessThan(onFormUpdateCallIndex);
  });

  it('should handle form cleanup after successful update with timeEntryFormOpenToUpdate', () => {
    // Arrange
    const formType = 'FORM_1';
    const props = {
      ...defaultProps,
      timeEntryFormOpenToUpdate: formType,
      result: {
        data: {
          updateCompanySettings: mockMappedQLSettings,
        },
      },
    };

    // Act
    successUpdateCompanySettings(props);
    jest.advanceTimersByTime(500);

    // Assert
    expect(props.removeTimeEntryDirtyFields).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(props.setIsConfirmationModalOpen).toHaveBeenCalledWith(false);
    expect(props.onFormUpdate).toHaveBeenCalledWith(formType);
    expect(props.setTimeEntryFormOpenToUpdate).toHaveBeenCalledWith('');

    // Verify the order of operations using mock.calls
    const removeTimeEntryCallIndex =
      props.removeTimeEntryDirtyFields.mock.invocationCallOrder[0];
    const onFormUpdateCallIndex =
      props.onFormUpdate.mock.invocationCallOrder[0];
    const setTimeEntryFormOpenCallIndex =
      props.setTimeEntryFormOpenToUpdate.mock.invocationCallOrder[0];

    expect(removeTimeEntryCallIndex).toBeLessThan(onFormUpdateCallIndex);
    expect(onFormUpdateCallIndex).toBeLessThan(setTimeEntryFormOpenCallIndex);
  });
});

describe('updateTimeEntrySettingsForm', () => {
  const defaultProps = {
    formType: TimeEntriesFormType.TIMETRACKING,
    isFormEdit: {
      isTimeTrackingEditing: false,
      isTimeSheetFieldsEditing: false,
      isNotificationEditing: false,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    },
    isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
    setTimeEntryFormOpenToUpdate: jest.fn(),
    setIsConfirmationModalOpen: jest.fn(),
    setIsTimeSheetEditing: jest.fn(),
    handleCustomFieldsClick: jest.fn(),
    isTimeSheetEditing: false,
    setIsFormEdit: jest.fn(),
    reRenderTimeEntrySetting: jest.fn(),
    errorMessage: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle time tracking form type when no other forms are being edited', () => {
    const props = { ...defaultProps };

    updateTimeEntrySettingsForm(props);

    expect(props.isFormEdit.isTimeTrackingEditing).toBe(true);
    expect(props.setIsFormEdit).toHaveBeenCalledWith({
      isTimeTrackingEditing: true,
      isTimeSheetFieldsEditing: false,
      isNotificationEditing: false,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    });
  });

  it('should handle time sheet form type when no other forms are being edited', () => {
    const props = {
      ...defaultProps,
      formType: TimeEntriesFormType.TIMESHEET,
    };

    updateTimeEntrySettingsForm(props);

    expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(true);
    expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(true);
    expect(props.setIsFormEdit).toHaveBeenCalledWith({
      isTimeTrackingEditing: false,
      isTimeSheetFieldsEditing: true,
      isNotificationEditing: false,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    });
  });

  it('should handle notification form type when no other forms are being edited', () => {
    const props = {
      ...defaultProps,
      formType: TimeEntriesFormType.NOTIFICATION,
    };

    updateTimeEntrySettingsForm(props);

    expect(props.isFormEdit.isNotificationEditing).toBe(true);
    expect(props.setIsFormEdit).toHaveBeenCalledWith({
      isTimeTrackingEditing: false,
      isTimeSheetFieldsEditing: false,
      isNotificationEditing: true,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    });
  });

  it('should handle custom fields form type', () => {
    const props = {
      ...defaultProps,
      formType: TimeEntriesFormType.CUSTOM_FIELDS,
    };

    updateTimeEntrySettingsForm(props);

    expect(props.handleCustomFieldsClick).toHaveBeenCalled();
  });

  it('should handle empty form type', () => {
    const props = {
      ...defaultProps,
      formType: '',
      isTimeSheetEditing: true,
    };

    updateTimeEntrySettingsForm(props);

    expect(props.isFormEdit.isTimeTrackingEditing).toBe(false);
    expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
    expect(props.isFormEdit.isNotificationEditing).toBe(false);
    expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(false);
    expect(props.setIsFormEdit).toHaveBeenCalledWith({
      isTimeTrackingEditing: false,
      isTimeSheetFieldsEditing: false,
      isNotificationEditing: false,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    });
  });

  it('should handle dirty fields when switching to time tracking form', () => {
    const props = {
      ...defaultProps,
      isFormEdit: {
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: true,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
      isFormContainingDirtyFields: jest.fn().mockReturnValue(true),
    };

    updateTimeEntrySettingsForm(props);

    expect(props.setTimeEntryFormOpenToUpdate).toHaveBeenCalledWith(
      TimeEntriesFormType.TIMETRACKING,
    );
    expect(props.setIsConfirmationModalOpen).toHaveBeenCalledWith(true);
  });

  it('should handle dirty fields when switching to time sheet form', () => {
    const props = {
      ...defaultProps,
      formType: TimeEntriesFormType.TIMESHEET,
      isFormEdit: {
        isTimeTrackingEditing: true,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
      isFormContainingDirtyFields: jest.fn().mockReturnValue(true),
    };

    updateTimeEntrySettingsForm(props);

    expect(props.setTimeEntryFormOpenToUpdate).toHaveBeenCalledWith(
      TimeEntriesFormType.TIMESHEET,
    );
    expect(props.setIsConfirmationModalOpen).toHaveBeenCalledWith(true);
  });

  it('should handle dirty fields when switching to notification form', () => {
    const props = {
      ...defaultProps,
      formType: TimeEntriesFormType.NOTIFICATION,
      isFormEdit: {
        isTimeTrackingEditing: true,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      },
      isFormContainingDirtyFields: jest.fn().mockReturnValue(true),
    };

    updateTimeEntrySettingsForm(props);

    expect(props.setTimeEntryFormOpenToUpdate).toHaveBeenCalledWith(
      TimeEntriesFormType.NOTIFICATION,
    );
    expect(props.setIsConfirmationModalOpen).toHaveBeenCalledWith(true);
  });

  describe('editing flag transitions', () => {
    it('should correctly set editing flags when switching to time tracking with no dirty fields', () => {
      const props = {
        ...defaultProps,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: true,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
      };

      updateTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeTrackingEditing).toBe(true);
      expect(props.isFormEdit.isNotificationEditing).toBe(false);
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: true,
        isNotificationEditing: false,
        isTimeSheetFieldsEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should correctly set editing flags when switching to timesheet with no dirty fields', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: true,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: true,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
      };

      updateTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeTrackingEditing).toBe(false);
      expect(props.isFormEdit.isNotificationEditing).toBe(false);
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(true);
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(true);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isNotificationEditing: false,
        isTimeSheetFieldsEditing: true,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should correctly set editing flags when switching to notifications with no dirty fields', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.NOTIFICATION,
        isFormEdit: {
          isTimeTrackingEditing: true,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
      };

      updateTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeTrackingEditing).toBe(false);
      expect(props.isFormEdit.isNotificationEditing).toBe(true);
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isNotificationEditing: true,
        isTimeSheetFieldsEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should toggle time tracking editing flag when no other forms are being edited', () => {
      const props = {
        ...defaultProps,
        isFormEdit: {
          isTimeTrackingEditing: true,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      updateTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeTrackingEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should toggle timesheet editing flag when no other forms are being edited', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      updateTimeEntrySettingsForm(props);

      const timeSheetFieldValue = false;
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(
        timeSheetFieldValue,
      );
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(
        timeSheetFieldValue,
      );
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: timeSheetFieldValue,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should call reRenderTimeEntrySetting when enabling timesheet editing from disabled state', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        errorMessage: 'Test error message',
      };

      updateTimeEntrySettingsForm(props);

      const timeSheetFieldValue = true;
      expect(props.reRenderTimeEntrySetting).toHaveBeenCalledWith(
        'Test error message',
      );
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(
        timeSheetFieldValue,
      );
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(
        timeSheetFieldValue,
      );
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: timeSheetFieldValue,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should not call reRenderTimeEntrySetting when disabling timesheet editing', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        errorMessage: 'Test error message',
      };

      updateTimeEntrySettingsForm(props);

      expect(props.reRenderTimeEntrySetting).not.toHaveBeenCalled();
      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(false);
    });

    it('should toggle notification editing flag when no other forms are being edited', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.NOTIFICATION,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: true,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      updateTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isNotificationEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });
  });
});

describe('cancelTimeEntrySettingsForm', () => {
  const mockUpdatedTimeEntryFormValue: MappedQLSettings = {
    timeTrackingSupported: { version: '1', value: true },
    transactionBillingForTimeEnabled: { version: '1', value: true },
    transactionTimeTrackingEnabled: { version: '1', value: true },
    firstDayOfWeek: { version: '1', value: 1 },
    timeZone: { version: '1', value: 'America/New_York' },
    timeFormat: { version: '1', value: 12 },
    isBillingFieldEnabled: { version: '1', value: true },
    billingRateForTimeEnabled: { version: '1', value: true },
    useItemForTime: { version: '1', value: true },
    isServiceFieldEnabled: { version: '1', value: true },
    requireBillable: { version: '1', value: true },
    customersForTimeSheetEnabled: { version: '1', value: true },
    classForTimeSheetEnabled: { version: '1', value: true },
    locationForTimeSheetEnabled: { version: '1', value: true },
    timeSheetEntryNotesEnabled: { version: '1', value: true },
    timeSheetEntryEditNotesEnabled: { version: '1', value: true },
    timeSheetEntryMakesNotesRequiredEnabled: { version: '1', value: true },
    splitTimeSheetAtMidnightEnabled: { version: '1', value: true },
    manageOwnTimeSheetsEnabled: { version: '1', value: true },
    editClockOutTimeEnabled: { version: '1', value: true },
    clockOutOverrideHours: { version: '1', value: 8 },
    clockInRoundDirection: { version: '1', value: 'Nearest' },
    clockInRoundInMin: { version: '1', value: 15 },
    clockOutRoundDirection: { version: '1', value: 'Nearest' },
    clockOutRoundInMin: { version: '1', value: 15 },
    clockInNotificationReminderTime: { version: '1', value: '09:00' },
    clockInNotificationReminderEmail: { version: '1', value: true },
    clockInNotificationReminderMobile: { version: '1', value: true },
    clockOutNotificationReminderTime: { version: '1', value: '17:00' },
    clockOutNotificationReminderEmail: { version: '1', value: true },
    clockOutNotificationReminderMobile: { version: '1', value: true },
    notificationEnabledForDays: { version: '1', value: ['MONDAY', 'TUESDAY'] },
    notifyAdminOnClockOutOverrideEnabled: { version: '1', value: true },
    notifyManagerOnClockOutOverrideEnabled: { version: '1', value: true },
    notifyAdminOnTimeSheetNotesEditEnabled: { version: '1', value: true },
    notifyGroupManagerOnTimeSheetNotesEditEnabled: {
      version: '1',
      value: true,
    },
    scheduleManagePreference: { version: '1', value: 'company' },
    scheduleViewPreference: { version: '1', value: 'company' },
  };

  const defaultProps = {
    isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
    removeTimeEntryDirtyFields: jest.fn(),
    formType: TimeEntriesFormType.TIMETRACKING,
    updatedTimeEntryFormValue: mockUpdatedTimeEntryFormValue,
    isFormEdit: {
      isTimeTrackingEditing: true,
      isTimeSheetFieldsEditing: false,
      isNotificationEditing: false,
      isApprovalEditing: false,
      isGeoLocationsEditing: false,
    },
    selectedCustomTimeSheetFields: [],
    setSelectedCustomTimeSheetFields: jest.fn(),
    setIsTimeSheetEditing: jest.fn(),
    setIsFormEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('dirty fields handling', () => {
    it('should remove dirty fields when form contains dirty fields', () => {
      const props = {
        ...defaultProps,
        isFormContainingDirtyFields: jest.fn().mockReturnValue(true),
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.removeTimeEntryDirtyFields).toHaveBeenCalledWith(
        mockUpdatedTimeEntryFormValue,
      );
    });

    it('should not remove dirty fields when form has no dirty fields', () => {
      const props = {
        ...defaultProps,
        isFormContainingDirtyFields: jest.fn().mockReturnValue(false),
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.removeTimeEntryDirtyFields).not.toHaveBeenCalled();
    });
  });

  describe('time tracking form cancellation', () => {
    it('should cancel time tracking form editing', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMETRACKING,
        isFormEdit: {
          isTimeTrackingEditing: true,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeTrackingEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });
  });

  describe('timesheet form cancellation', () => {
    it('should cancel timesheet form editing with updated form value', () => {
      const mockSelectedFields = ['customer', 'class'];
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        selectedCustomTimeSheetFields: mockSelectedFields,
        updatedTimeEntryFormValue: mockUpdatedTimeEntryFormValue,
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(false);
      expect(props.setSelectedCustomTimeSheetFields).toHaveBeenCalledWith(
        mockSelectedFields,
      );
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should cancel timesheet form editing without updated form value', () => {
      const mockSelectedFields = ['customer', 'class'];
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        selectedCustomTimeSheetFields: mockSelectedFields,
        updatedTimeEntryFormValue: undefined,
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isTimeSheetFieldsEditing).toBe(false);
      expect(props.setIsTimeSheetEditing).toHaveBeenCalledWith(false);
      expect(props.setSelectedCustomTimeSheetFields).not.toHaveBeenCalled();
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });

    it('should handle empty selectedCustomTimeSheetFields array', () => {
      const expectedFields = [
        'isBillingFieldEnabled',
        'isServiceFieldEnabled',
        'customersForTimeSheetEnabled',
        'classForTimeSheetEnabled',
        'locationForTimeSheetEnabled',
        'timeSheetEntryNotesEnabled',
      ];
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: true,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
        selectedCustomTimeSheetFields: [],
        updatedTimeEntryFormValue: mockUpdatedTimeEntryFormValue,
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.setSelectedCustomTimeSheetFields).toHaveBeenCalledWith(
        expectedFields,
      );
    });
  });

  describe('notification form cancellation', () => {
    it('should cancel notification form editing', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.NOTIFICATION,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: true,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.isFormEdit.isNotificationEditing).toBe(false);
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined updatedTimeEntryFormValue when form has dirty fields', () => {
      const props = {
        ...defaultProps,
        isFormContainingDirtyFields: jest.fn().mockReturnValue(true),
        updatedTimeEntryFormValue: undefined,
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.removeTimeEntryDirtyFields).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty selectedCustomTimeSheetFields array with undefined form value', () => {
      const props = {
        ...defaultProps,
        formType: TimeEntriesFormType.TIMESHEET,
        selectedCustomTimeSheetFields: [],
        updatedTimeEntryFormValue: undefined,
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.setSelectedCustomTimeSheetFields).not.toHaveBeenCalled();
    });

    it('should handle unknown form type', () => {
      const props = {
        ...defaultProps,
        formType: 'UNKNOWN_TYPE' as TimeEntriesFormType,
      };

      cancelTimeEntrySettingsForm(props);

      // For unknown form types, all editing flags should be set to false
      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
      expect(props.setIsTimeSheetEditing).not.toHaveBeenCalled();
      expect(props.setSelectedCustomTimeSheetFields).not.toHaveBeenCalled();
    });

    it('should handle all editing flags being false', () => {
      const props = {
        ...defaultProps,
        isFormEdit: {
          isTimeTrackingEditing: false,
          isTimeSheetFieldsEditing: false,
          isNotificationEditing: false,
          isApprovalEditing: false,
          isGeoLocationsEditing: false,
        },
      };

      cancelTimeEntrySettingsForm(props);

      expect(props.setIsFormEdit).toHaveBeenCalledWith({
        isTimeTrackingEditing: false,
        isTimeSheetFieldsEditing: false,
        isNotificationEditing: false,
        isApprovalEditing: false,
        isGeoLocationsEditing: false,
      });
    });
  });
});
