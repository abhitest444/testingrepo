import { renderHook } from '@testing-library/react-hooks';
import { useForm } from 'react-hook-form';

import {
  useTimeTrackingSettings,
  ITimeTrackingSettingsFormState,
  IUpdateQLResponse,
  comparingTheTimeTrackingSettings_toTimeTrackingSettings,
  mapTimeTrackingSettings_forSettingsMutation,
  removeDirtyFieldUtil,
  handleUpdateCompanySettings,
  handleUpdateError,
  sanitize,
  getWeekDay,
} from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}));

describe('useTimeTrackingSettings', () => {
  it('should call useForm with correct initial mode', () => {
    renderHook(() => useTimeTrackingSettings());
    expect(useForm).toHaveBeenCalledWith({ mode: 'onSubmit' });
  });
});

describe('comparingTheTimeTrackingSettings_toTimeTrackingSettings', () => {
  const mockFormState: ITimeTrackingSettingsFormState = {
    firstDayOfWeek: '1',
    isServiceFieldEnabled: true,
    isBillingFieldEnabled: true,
    billingRateForTimeEnabled: true,
  };

  const mockSettings: IUpdateQLResponse = {
    firstDayOfWeek: { value: 1, version: '1' },
    isServiceFieldEnabled: { value: true, version: '1' },
    isBillingFieldEnabled: { value: true, version: '1' },
    billingRateForTimeEnabled: { value: true, version: '1' },
  };

  it('should return false when settings are the same', () => {
    expect(
      comparingTheTimeTrackingSettings_toTimeTrackingSettings(
        mockFormState,
        mockSettings,
      ),
    ).toBe(false);
  });

  it('should return true when settings are different', () => {
    const differentFormState = { ...mockFormState, firstDayOfWeek: '2' };
    expect(
      comparingTheTimeTrackingSettings_toTimeTrackingSettings(
        differentFormState,
        mockSettings,
      ),
    ).toBe(true);
  });
});

describe('mapTimeTrackingSettings_forSettingsMutation', () => {
  const mockFormState: ITimeTrackingSettingsFormState = {
    firstDayOfWeek: '1',
    isServiceFieldEnabled: true,
    isBillingFieldEnabled: true,
    billingRateForTimeEnabled: true,
  };

  const mockSettings: IUpdateQLResponse = {
    firstDayOfWeek: { value: 1, version: '1' },
    isServiceFieldEnabled: { value: true, version: '1' },
    isBillingFieldEnabled: { value: true, version: '1' },
    billingRateForTimeEnabled: { value: true, version: '1' },
  };

  it('should map form state to mutation args correctly', () => {
    const result = mapTimeTrackingSettings_forSettingsMutation(
      mockFormState,
      mockSettings,
    );
    expect(result).toEqual({
      timeTrackingUseItemForTimeEnabled: {
        version: '1',
        value: true,
      },
      timeTrackingBillingEnabled: {
        version: '1',
        value: true,
      },
      timeTrackingBillingRateForTimeEnabled: {
        version: '1',
        value: true,
      },
      timeTrackingStartWorkWeek: {
        version: '1',
        value: 1,
      },
    });
  });
});

describe('removeDirtyFieldUtil', () => {
  it('should remove dirty fields and update form values', () => {
    const mockFormMethods = {
      formState: {
        dirtyFields: {
          firstDayOfWeek: true,
          isServiceFieldEnabled: true,
        },
      },
      setValue: jest.fn(),
    };

    const mockUpdatedFormValue: IUpdateQLResponse = {
      firstDayOfWeek: { value: 1, version: '1' },
      isServiceFieldEnabled: { value: true, version: '1' },
      isBillingFieldEnabled: { value: true, version: '1' },
      billingRateForTimeEnabled: { value: true, version: '1' },
    };

    removeDirtyFieldUtil(mockFormMethods, mockUpdatedFormValue);

    expect(mockFormMethods.setValue).toHaveBeenCalledTimes(2);
    expect(mockFormMethods.setValue).toHaveBeenCalledWith(
      'firstDayOfWeek',
      '1',
      { shouldDirty: false },
    );
    expect(mockFormMethods.setValue).toHaveBeenCalledWith(
      'isServiceFieldEnabled',
      true,
      { shouldDirty: false },
    );
  });
});

describe('sanitize', () => {
  it('should sanitize HTML special characters', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
    expect(sanitize("text with 'quotes'")).toBe('text with &#x27;quotes&#x27;');
  });

  it('should handle null or undefined input', () => {
    expect(sanitize(null)).toBe('');
    expect(sanitize(undefined)).toBe('');
  });
});

describe('getWeekDay', () => {
  it('should return correct day name for index', () => {
    expect(getWeekDay(0)).toBe('sunday');
    expect(getWeekDay(1)).toBe('monday');
    expect(getWeekDay(6)).toBe('saturday');
  });

  it('should return undefined for invalid index', () => {
    expect(getWeekDay(7)).toBeUndefined();
    expect(getWeekDay(-1)).toBeUndefined();
  });
});

describe('handleUpdateCompanySettings', () => {
  const mockSetUpdatedFormValue = jest.fn();
  const mockSetIsConfirmationModalOpen = jest.fn();
  const mockSetFormToOpenForUpdate = jest.fn();
  const mockOnFormUpdate = jest.fn();
  const mockSetGeneralFields = jest.fn();
  const mockSetTimeSheetFields = jest.fn();
  const mockRemoveDirtyField = jest.fn();
  const mockText = jest.fn((id) => id);

  const mockResult = {
    billingRateForTimeEnabled: { meta: { version: '1' }, value: true },
    startWorkWeek: { meta: { version: '1' }, value: 1 },
    useItemForTime: { meta: { version: '1' }, value: true },
    billingForTimeEnabled: { meta: { version: '1' }, value: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle successful update', () => {
    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResult,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: true, isTimeSheetFieldEditing: false },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    expect(mockSetUpdatedFormValue).toHaveBeenCalled();
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalled();
  });

  it('should handle missing meta version data', () => {
    const mockResultWithoutMeta = {
      billingRateForTimeEnabled: { value: true },
      startWorkWeek: { value: 1 },
      useItemForTime: { value: true },
      billingForTimeEnabled: { value: true },
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResultWithoutMeta,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: true },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    expect(mockSetUpdatedFormValue).toHaveBeenCalledWith(
      expect.objectContaining({
        billingRateForTimeEnabled: expect.objectContaining({ version: '' }),
      }),
    );
  });

  it('should handle missing or falsy values for all fields', () => {
    const mockResultWithMissingValues = {
      billingRateForTimeEnabled: null,
      startWorkWeek: undefined,
      useItemForTime: { value: false },
      billingForTimeEnabled: { value: null },
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResultWithMissingValues,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: true },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    expect(mockSetUpdatedFormValue).toHaveBeenCalledWith({
      billingRateForTimeEnabled: { version: '', value: false },
      firstDayOfWeek: { version: '', value: 0 },
      isServiceFieldEnabled: { version: '', value: false },
      isBillingFieldEnabled: { version: '', value: false },
    });
  });

  it('should update general settings field when found', () => {
    const mockGeneralFields = {
      'general-settings': [
        {
          id: 'first-day',
          key: 'firstDay',
          title: 'location-settings.fields.general-settings',
          ariaLabel: 'First Day',
          tooltipText: 'Select first day',
          disabled: false,
          detail: {
            title: 'First Day',
            subtitle: 'Select the first day of week',
            ariaLabel: 'First day settings',
          },
          value: 'sunday',
        },
      ],
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResult,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: true, isTimeSheetFieldEditing: false },
      mockGeneralFields,
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    expect(mockSetGeneralFields).toHaveBeenCalledWith({
      'general-settings': [
        {
          id: 'first-day',
          key: 'firstDay',
          title: 'location-settings.fields.general-settings',
          ariaLabel: 'First Day',
          tooltipText: 'Select first day',
          disabled: false,
          detail: {
            title: 'First Day',
            subtitle: 'Select the first day of week',
            ariaLabel: 'First day settings',
          },
          value: 'sunday',
        },
      ],
    });
  });

  it('should handle when general settings field is not found', () => {
    const mockGeneralFields = {
      'general-settings': [
        {
          id: 'other-setting',
          key: 'otherSetting',
          title: 'some-other-setting',
          ariaLabel: 'Other Setting',
          tooltipText: 'Other setting',
          disabled: false,
          detail: {
            title: 'Other Setting',
            subtitle: 'Some other setting',
            ariaLabel: 'Other settings',
          },
          value: 'value',
        },
      ],
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResult,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: true, isTimeSheetFieldEditing: false },
      mockGeneralFields,
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    // The field wasn't found, so setGeneralFields should be called with unchanged fields
    expect(mockSetGeneralFields).toHaveBeenCalledWith(mockGeneralFields);
  });

  it('should update timesheet settings fields when found', () => {
    const mockTimeSheetFields = {
      'timesheet-settings': [
        {
          id: 'service-field',
          key: 'serviceField',
          title: 'location-settings.fields.timesheet-settings-service',
          ariaLabel: 'Service Field',
          tooltipText: 'Service field setting',
          disabled: false,
          detail: {
            title: 'Service Field',
            subtitle: 'Service field settings',
            ariaLabel: 'Service field settings',
          },
          value: 'Off',
        },
        {
          id: 'billable-field',
          key: 'billableField',
          title: 'location-settings.fields.timesheet-settings-billable',
          ariaLabel: 'Billable Field',
          tooltipText: 'Billable field setting',
          disabled: false,
          detail: {
            title: 'Billable Field',
            subtitle: 'Billable field settings',
            ariaLabel: 'Billable field settings',
          },
          value: 'Off',
        },
      ],
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    const mockResultWithAllEnabled = {
      billingRateForTimeEnabled: { meta: { version: '1' }, value: true },
      startWorkWeek: { meta: { version: '1' }, value: 1 },
      useItemForTime: { meta: { version: '1' }, value: true },
      billingForTimeEnabled: { meta: { version: '1' }, value: true },
    };

    handleUpdateCompanySettings(
      mockResultWithAllEnabled,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: true },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      mockTimeSheetFields,
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    // Verify timesheet fields are updated
    expect(mockSetTimeSheetFields).toHaveBeenCalledWith({
      'timesheet-settings': [
        {
          id: 'service-field',
          key: 'serviceField',
          title: 'location-settings.fields.timesheet-settings-service',
          ariaLabel: 'Service Field',
          tooltipText: 'Service field setting',
          disabled: false,
          detail: {
            title: 'Service Field',
            subtitle: 'Service field settings',
            ariaLabel: 'Service field settings',
          },
          value: 'On',
        },
        {
          id: 'billable-field',
          key: 'billableField',
          title: 'location-settings.fields.timesheet-settings-billable',
          ariaLabel: 'Billable Field',
          tooltipText: 'Billable field setting',
          disabled: false,
          detail: {
            title: 'Billable Field',
            subtitle: 'Billable field settings',
            ariaLabel: 'Billable field settings',
          },
          value: 'On',
        },
      ],
    });

    // Verify form values are updated
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'isServiceFieldEnabled',
      true,
      { shouldDirty: false },
    );
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'isBillingFieldEnabled',
      true,
      { shouldDirty: false },
    );
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'billingRateForTimeEnabled',
      true,
      { shouldDirty: false },
    );
  });

  it('should update timesheet settings fields to Off when fields are disabled', () => {
    const mockTimeSheetFields = {
      'timesheet-settings': [
        {
          id: 'service-field',
          key: 'serviceField',
          title: 'location-settings.fields.timesheet-settings-service',
          ariaLabel: 'Service Field',
          tooltipText: 'Service field setting',
          disabled: false,
          detail: {
            title: 'Service Field',
            subtitle: 'Service field settings',
            ariaLabel: 'Service field settings',
          },
          value: 'On',
        },
        {
          id: 'billable-field',
          key: 'billableField',
          title: 'location-settings.fields.timesheet-settings-billable',
          ariaLabel: 'Billable Field',
          tooltipText: 'Billable field setting',
          disabled: false,
          detail: {
            title: 'Billable Field',
            subtitle: 'Billable field settings',
            ariaLabel: 'Billable field settings',
          },
          value: 'On',
        },
      ],
    };

    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    const mockResultWithAllDisabled = {
      billingRateForTimeEnabled: { meta: { version: '1' }, value: true },
      startWorkWeek: { meta: { version: '1' }, value: 1 },
      useItemForTime: { meta: { version: '1' }, value: false },
      billingForTimeEnabled: { meta: { version: '1' }, value: false },
    };

    handleUpdateCompanySettings(
      mockResultWithAllDisabled,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: true },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      mockTimeSheetFields,
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    // Verify timesheet fields are updated to 'Off'
    expect(mockSetTimeSheetFields).toHaveBeenCalledWith({
      'timesheet-settings': [
        {
          id: 'service-field',
          key: 'serviceField',
          title: 'location-settings.fields.timesheet-settings-service',
          ariaLabel: 'Service Field',
          tooltipText: 'Service field setting',
          disabled: false,
          detail: {
            title: 'Service Field',
            subtitle: 'Service field settings',
            ariaLabel: 'Service field settings',
          },
          value: 'Off',
        },
        {
          id: 'billable-field',
          key: 'billableField',
          title: 'location-settings.fields.timesheet-settings-billable',
          ariaLabel: 'Billable Field',
          tooltipText: 'Billable field setting',
          disabled: false,
          detail: {
            title: 'Billable Field',
            subtitle: 'Billable field settings',
            ariaLabel: 'Billable field settings',
          },
          value: 'Off',
        },
      ],
    });

    // Verify form values are updated to false
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'isServiceFieldEnabled',
      false,
      { shouldDirty: false },
    );
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'isBillingFieldEnabled',
      false,
      { shouldDirty: false },
    );
    expect(mockTimeTrackingSettingsFormMethods.setValue).toHaveBeenCalledWith(
      'billingRateForTimeEnabled',
      true,
      { shouldDirty: false },
    );
  });

  it('should handle form update with timeout when formToOpenForUpdate is provided', () => {
    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    const formToOpenForUpdate = 'GENERAL';

    handleUpdateCompanySettings(
      mockResult,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: false },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      formToOpenForUpdate,
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    // Before timeout
    expect(mockRemoveDirtyField).not.toHaveBeenCalled();
    expect(mockSetIsConfirmationModalOpen).not.toHaveBeenCalled();
    expect(mockOnFormUpdate).not.toHaveBeenCalled();
    expect(mockSetFormToOpenForUpdate).not.toHaveBeenCalled();

    // Fast-forward setTimeout
    jest.advanceTimersByTime(500);

    // After timeout
    expect(mockRemoveDirtyField).toHaveBeenCalledWith(
      expect.objectContaining({
        billingRateForTimeEnabled: expect.any(Object),
        firstDayOfWeek: expect.any(Object),
        isServiceFieldEnabled: expect.any(Object),
        isBillingFieldEnabled: expect.any(Object),
      }),
    );
    expect(mockSetIsConfirmationModalOpen).toHaveBeenCalledWith(false);
    expect(mockOnFormUpdate).toHaveBeenCalledWith(formToOpenForUpdate);
    expect(mockSetFormToOpenForUpdate).toHaveBeenCalledWith('');
  });

  it('should handle form update with timeout when formToOpenForUpdate is empty', () => {
    const mockTimeTrackingSettingsFormMethods = {
      formState: { dirtyFields: {} },
      setValue: jest.fn(),
    };

    handleUpdateCompanySettings(
      mockResult,
      mockSetUpdatedFormValue,
      { isGeneralFieldEditing: false, isTimeSheetFieldEditing: false },
      { 'general-settings': [] },
      mockSetGeneralFields,
      mockTimeTrackingSettingsFormMethods,
      { 'timesheet-settings': [] },
      mockSetTimeSheetFields,
      '',
      mockSetIsConfirmationModalOpen,
      mockOnFormUpdate,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockText,
    );

    // Before timeout
    expect(mockRemoveDirtyField).not.toHaveBeenCalled();
    expect(mockOnFormUpdate).not.toHaveBeenCalled();

    // Fast-forward setTimeout
    jest.advanceTimersByTime(500);

    // After timeout
    expect(mockRemoveDirtyField).toHaveBeenCalledWith(
      expect.objectContaining({
        billingRateForTimeEnabled: expect.any(Object),
        firstDayOfWeek: expect.any(Object),
        isServiceFieldEnabled: expect.any(Object),
        isBillingFieldEnabled: expect.any(Object),
      }),
    );
    expect(mockOnFormUpdate).toHaveBeenCalledWith('');
  });
});

describe('handleUpdateError', () => {
  it('should handle error when form to open exists', () => {
    const mockSetIsConfirmationModalOpen = jest.fn();
    const mockSetFormToOpenForUpdate = jest.fn();
    const mockRemoveDirtyField = jest.fn();
    const mockOnFormUpdate = jest.fn();

    handleUpdateError(
      'GENERAL',
      mockSetIsConfirmationModalOpen,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockOnFormUpdate,
    );

    expect(mockSetIsConfirmationModalOpen).toHaveBeenCalledWith(false);
    expect(mockSetFormToOpenForUpdate).toHaveBeenCalledWith('');
  });

  it('should handle error when no form to open exists', () => {
    const mockSetIsConfirmationModalOpen = jest.fn();
    const mockSetFormToOpenForUpdate = jest.fn();
    const mockRemoveDirtyField = jest.fn();
    const mockOnFormUpdate = jest.fn();
    const mockUpdatedFormValue: IUpdateQLResponse = {
      isServiceFieldEnabled: { value: false, version: '1' },
      isBillingFieldEnabled: { value: false, version: '1' },
      firstDayOfWeek: { value: 1, version: '1' },
      billingRateForTimeEnabled: { value: false, version: '1' },
    };

    handleUpdateError(
      '',
      mockSetIsConfirmationModalOpen,
      mockSetFormToOpenForUpdate,
      mockRemoveDirtyField,
      mockOnFormUpdate,
      mockUpdatedFormValue,
    );

    expect(mockRemoveDirtyField).toHaveBeenCalledWith(mockUpdatedFormValue);
    expect(mockOnFormUpdate).toHaveBeenCalledWith('');
  });
});
