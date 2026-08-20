import React, { PropsWithChildren } from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import { useSandbox } from '@payroll/quicksand';
import {
  CustomDimensionSetting,
  MappedQLSettings,
  timeEntrySettingsDefaultState,
} from 'src/js/service/hooks/settings/useGetQLSettings';
import type { DimensionDefinition } from 'src/js/widgets/common/dimensions/types';
import {
  mapDimensionDefinitionsToPreviewFields,
  mapDimensionPreviewFieldsToFormValues,
} from 'src/js/widgets/timeTrackingSettings/utils';
import { IFormConfig } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import {
  TimeSheetFields,
  ITimeSheetFields,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/TimeSheetFields';
import { GeneralSettingSection } from 'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { EditTimeSheetField } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/EditTimesheetField';

// Import the mocked function
import { useFeatureFlag } from 'src/js/service/utils/sandboxUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';

// Mock the TimeTrackingSettingsContext
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock the useIXPFeatureFlag hook
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useForm: jest.fn(),
  useFormContext: jest.fn(),
  useWatch: jest.fn(),
}));

// Mock the feature flag utility
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  ...jest.requireActual('src/js/service/utils/sandboxUtils'),
  useFeatureFlag: jest.fn(),
}));

const mockQueryDimensions = jest.fn().mockResolvedValue(undefined);
const mockUseGetDimensions = jest.fn<
  {
    dimensions: DimensionDefinition[];
    loading: boolean;
    error: string | null;
    query: typeof mockQueryDimensions;
  },
  []
>(() => ({
  dimensions: [],
  loading: false,
  error: null,
  query: mockQueryDimensions,
}));

jest.mock('src/js/service/hooks/dimensions/useGetDimensions', () => ({
  useGetDimensions: () => mockUseGetDimensions(),
}));

const mockUseDimensionVisibility = jest.fn(() => ({
  isVisible: false,
  loading: false,
}));

jest.mock('src/js/common/useDimensionVisibility', () => ({
  useDimensionVisibility: () => mockUseDimensionVisibility(),
}));

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>;

const mockUseIXPFeatureFlag = useIXPFeatureFlag as jest.MockedFunction<
  typeof useIXPFeatureFlag
>;

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    pubsub: {
      publish: jest.fn(),
      subscribe: jest.fn(),
    },
    appContext: {
      getEnvironment: jest.fn().mockReturnValue('e2e'),
      getRealmInfo: jest.fn().mockReturnValue({
        realmId: 'exampleRealmId',
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId',
      }),
    },
    pluginConfig: {
      extendedProperties: {
        appSecret: 'exampleAppSecret',
      },
    },
    featureFlags: {
      isFeatureEnabled: jest.fn(),
    },
    authorization: {
      isAuthorized: jest.fn(),
    },
  }),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }) => id),
  })),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection.tsx',
  () => ({
    GeneralSettingSection: jest.fn(() => <div>GeneralSettingSection</div>),
  }),
);

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent.tsx', () => ({
  ViewContent: jest.fn(() => <div>ViewContent</div>),
}));

// Mock useGetPreferences at the top level
const mockUseGetPreferences = jest.fn();
jest.mock('src/js/service/hooks/preferenceces/useGetPreferences', () => ({
  __esModule: true,
  default: () => mockUseGetPreferences(),
}));

// Add mock for EditTimeSheetField component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/timeSheetFields/EditTimesheetField.tsx',
  () => ({
    EditTimeSheetField: jest.fn(() => (
      <div data-testid="edit-time-sheet-field">EditTimeSheetField</div>
    )),
  }),
);

describe('TimeSheetFields Component', () => {
  let mockSetValue: jest.Mock;
  let mockUpdateSelectedCustomTimeSheetField: jest.Mock;
  let mockControl: any;

  const mockQLData: MappedQLSettings = {
    isServiceFieldEnabled: { version: '1.0', value: true },
    isBillingFieldEnabled: { version: '1.0', value: true },
    firstDayOfWeek: { version: '1.0', value: 1 },
    billingRateForTimeEnabled: { version: '1.0', value: true },
    timeTrackingSupported: { version: '1.0', value: true },
    transactionBillingForTimeEnabled: { version: '1.0', value: true },
    transactionTimeTrackingEnabled: { version: '1.0', value: true },
    useItemForTime: { version: '1.0', value: true },
    customersForTimeSheetEnabled: { version: '1.0', value: true },
    classForTimeSheetEnabled: { version: '1.0', value: true },
    locationForTimeSheetEnabled: { version: '1.0', value: true },
    timeSheetEntryNotesEnabled: { version: '1.0', value: true },
    timeSheetEntryEditNotesEnabled: { version: '1.0', value: true },
    timeSheetEntryMakesNotesRequiredEnabled: { version: '1.0', value: true },
    requireBillable: { version: '1.0', value: true },
    scheduleManagePreference: { version: '1.0', value: 'company' },
    scheduleViewPreference: { version: '1.0', value: 'company' },
  };

  const mockTimeSheetFields: IFormConfig = {
    'time-entries.section.title.time-sheet': [
      {
        id: 'timeTrackingTimeSheetService',
        key: 'timesheetTrackingService',
        title: 'location-settings.fields.timesheet-settings-service',
        ariaLabel: '',
        tooltipText: '',
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
        disabled: false,
        value: '',
        subFields: [],
      },
    ],
  };

  const mockEditTimeSheetField: ITimeSheetFieldOption[] = [
    {
      id: 'service',
      key: 'isServiceFieldEnabled',
      title: 'Service',
      ariaLabel: 'Service field',
      tooltipText: 'Enable service field',
      disabled: false,
      value: false,
      detail: {
        title: 'Service',
        subtitle: 'Enable service field',
        ariaLabel: 'Service field details',
      },
    },
  ];

  beforeEach(() => {
    mockSetValue = jest.fn();
    mockUpdateSelectedCustomTimeSheetField = jest.fn();
    mockControl = {
      _subjects: {
        watch: new Set(),
        state: new Set(),
      },
      _getWatch: jest.fn(),
      register: jest.fn(),
      unregister: jest.fn(),
      getValues: jest.fn(),
      setValue: mockSetValue,
      watch: jest.fn(),
    };

    (useForm as jest.Mock).mockReturnValue({
      control: mockControl,
      setValue: mockSetValue,
    });

    (useFormContext as jest.Mock).mockReturnValue({
      control: mockControl,
      setValue: mockSetValue,
    });

    (useWatch as jest.Mock).mockReturnValue(true);

    // Default feature flag behavior - disabled by default
    mockUseFeatureFlag.mockReturnValue(false);

    // Default IXP feature flag behavior - disabled by default, loading initially
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: true,
      error: null,
      settled: false,
    });

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: mockQLData,
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => {
        if (id === 'time-entries.section.title.time-sheet.location') {
          return 'Department';
        }
        return id;
      },
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    jest.clearAllMocks();
  });

  const getDefaultProps = (): ITimeSheetFields => ({
    timeSheetFields: mockTimeSheetFields,
    isTimeSheetEditing: false,
    timeSheetFieldSettingSection: 'time-entries.section.title.time-sheet',
    id: 'test-id',
    onFormUpdate: jest.fn(),
    onFormCancel: jest.fn(),
    editTimeSheetFields: mockEditTimeSheetField,
    setEditTimeSheetFields: jest.fn(),
    selectedCustomTimeSheetFields: [],
    updateSelectedCustomTimeSheetField: mockUpdateSelectedCustomTimeSheetField,
    onSaveTimeEntrySettings: jest.fn(),
    isDataUpdating: false,
  });

  type TimeSheetFieldsPropsWithOptionalUpdate = Omit<
    ITimeSheetFields,
    'updateSelectedCustomTimeSheetField'
  > & {
    updateSelectedCustomTimeSheetField?: (
      selectedCustomTimeSheetField: string,
    ) => void;
  };

  const TestWrapper: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const methods = useForm();
    return (
      <FormProvider {...methods}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              updateSelectedCustomTimeSheetField:
                mockUpdateSelectedCustomTimeSheetField,
              ...child.props,
            });
          }
          return child;
        })}
      </FormProvider>
    );
  };

  const renderTimeSheetFields = (props: Partial<ITimeSheetFields>) => {
    const defaultProps = getDefaultProps();
    const mergedProps = {
      ...defaultProps,
      ...props,
    };

    const mockFormMethods = {
      control: mockControl,
      setValue: mockSetValue,
      getValues: jest.fn(),
      handleSubmit: jest.fn((onValid: any) => jest.fn()),
      reset: jest.fn((formValues: any) => {}),
      register: jest.fn(),
      unregister: jest.fn(),
      watch: jest.fn(),
      formState: {
        errors: {},
        isDirty: false,
        isSubmitting: false,
        isValid: true,
        dirtyFields: {},
        touchedFields: {},
        isSubmitted: false,
        isSubmitSuccessful: false,
        submitCount: 0,
        isLoading: false,
        isValidating: false,
        disabled: false,
        validatingFields: new Set(),
      },
      clearErrors: jest.fn(),
      setError: jest.fn(),
      trigger: jest.fn(),
      getFieldState: jest.fn(),
      resetField: jest.fn(),
      setFocus: jest.fn(),
    } as any;

    return render(
      <FormProvider {...mockFormMethods}>
        <TimeSheetFields {...mergedProps} />
      </FormProvider>,
    );
  };

  test('testTimeSheetFieldsRendersWithProvidedData', () => {
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsInitializesFieldsFromQLDataCorrectly', async () => {
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'billingRate',
            key: 'billingRateForTimeEnabled',
            title: 'Billing Rate',
            value: false,
            ariaLabel: 'Billing rate field',
            tooltipText: 'Enable billing rate',
            disabled: false,
            detail: {
              title: 'Billing Rate',
              subtitle: 'Enable billing rate',
              ariaLabel: 'Billing rate field details',
            },
          },
          {
            id: 'requireBillable',
            key: 'requireBillable',
            title: 'Require Billable',
            value: false,
            ariaLabel: 'Require billable field',
            tooltipText: 'Make billable required',
            disabled: false,
            detail: {
              title: 'Require Billable',
              subtitle: 'Make billable required',
              ariaLabel: 'Require billable field details',
            },
          },
        ],
      },
      {
        id: 'service',
        key: 'isServiceFieldEnabled',
        title: 'Service',
        value: false,
        ariaLabel: 'Service field',
        tooltipText: 'Enable service field',
        disabled: false,
        detail: {
          title: 'Service',
          subtitle: 'Enable service field',
          ariaLabel: 'Service field details',
        },
      },
      {
        id: 'class',
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        value: false,
        ariaLabel: 'Class field',
        tooltipText: 'Enable class field',
        disabled: false,
        detail: {
          title: 'Class',
          subtitle: 'Enable class field',
          ariaLabel: 'Class field details',
        },
      },
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Location',
        value: false,
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        detail: {
          title: 'Location',
          subtitle: 'Enable location field',
          ariaLabel: 'Location field details',
        },
      },
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        value: false,
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        detail: {
          title: 'Notes',
          subtitle: 'Enable notes field',
          ariaLabel: 'Notes field details',
        },
        subFields: [
          {
            id: 'editNotes',
            key: 'timeSheetEntryEditNotesEnabled',
            title: 'Edit Notes',
            value: false,
            ariaLabel: 'Edit notes field',
            tooltipText: 'Enable notes editing',
            disabled: false,
            detail: {
              title: 'Edit Notes',
              subtitle: 'Enable notes editing',
              ariaLabel: 'Edit notes field details',
            },
          },
          {
            id: 'requiredNotes',
            key: 'timeSheetEntryMakesNotesRequiredEnabled',
            title: 'Required Notes',
            value: false,
            ariaLabel: 'Required notes field',
            tooltipText: 'Make notes required',
            disabled: false,
            detail: {
              title: 'Required Notes',
              subtitle: 'Make notes required',
              ariaLabel: 'Required notes field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify all fields were set correctly from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', true);
      expect(mockSetValue).toHaveBeenCalledWith(
        'billingRateForTimeEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith('requireBillable', true);
      expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', true);
      expect(mockSetValue).toHaveBeenCalledWith(
        'classForTimeSheetEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'locationForTimeSheetEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryNotesEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryEditNotesEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryMakesNotesRequiredEnabled',
        true,
      );
    });

    // Verify the fields were updated in the editTimeSheetFields array
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Verify main fields were updated
    expect(
      updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
      )?.value,
    ).toBe(true);
    expect(
      updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'isServiceFieldEnabled',
      )?.value,
    ).toBe(true);
    expect(
      updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      )?.value,
    ).toBe(true);

    // Verify fields with subfields were updated
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );
    expect(billingField?.value).toBe(true);
    expect(
      billingField?.subFields?.find(
        (sf: ITimeSheetFieldOption) => sf.key === 'billingRateForTimeEnabled',
      )?.value,
    ).toBe(true);
    expect(
      billingField?.subFields?.find(
        (sf: ITimeSheetFieldOption) => sf.key === 'requireBillable',
      )?.value,
    ).toBe(true);

    const notesField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'timeSheetEntryNotesEnabled',
    );
    expect(notesField?.value).toBe(true);
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryEditNotesEnabled',
      )?.value,
    ).toBe(true);
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
      )?.value,
    ).toBe(true);

    // Verify location field title was updated based on preferences
    const locationField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
    );
    expect(locationField?.title).toBe('Department');
  });

  test('testTimeSheetFieldsNoEditContentWhenNotEditing', () => {
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalledWith(
      expect.objectContaining({ isFormEdit: false }),
      {},
    );
  });

  test('testTimeSheetFieldsHandlesEmptyQLData', async () => {
    // Mock the context with empty QLData
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsHandlesLoadingStates', async () => {
    // Mock the context with loading states
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: true,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: true,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsHandlesErrorStates', async () => {
    // Mock the context with error states
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: true,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsHandlesPreferencesLoading', async () => {
    // Mock the context with preferences loading
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: true,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsHandlesPreferencesError', async () => {
    // Mock the context with preferences error
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: true,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    renderTimeSheetFields({});
    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  test('testTimeSheetFieldsHandlesPreferencesWithoutAccountingInfoPrefs', async () => {
    // Mock the context without AccountingInfoPrefs
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        locationForTimeSheetEnabled: { version: '1.0', value: true },
        isServiceFieldEnabled: { version: '1.0', value: false },
        customersForTimeSheetEnabled: { version: '1.0', value: false },
        isBillingFieldEnabled: { version: '1.0', value: false },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {},
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    const mockEditTimeSheetFieldsWithLocation: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Location',
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        value: true,
        detail: {
          title: 'Location',
          subtitle: 'Enable location field',
          ariaLabel: 'Location field details',
        },
      },
    ];

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFieldsWithLocation,
      selectedCustomTimeSheetFields: ['locationForTimeSheetEnabled'],
    });

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'locationForTimeSheetEnabled',
        true,
      );
    });
  });

  test('testTimeSheetFieldsHandlesNullQLData', async () => {
    // Mock the context with null QLData
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: null,
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetField,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });

    await waitFor(() => {
      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  test('testTimeSheetFieldsHandlesGeneralSettingSectionCallbacks', () => {
    const mockOnSaveTimeTrackingSettings = jest.fn();
    const mockOnFormUpdate = jest.fn();
    const mockOnFormCancel = jest.fn();

    renderTimeSheetFields({
      onFormUpdate: mockOnFormUpdate,
      onFormCancel: mockOnFormCancel,
      onSaveTimeEntrySettings: mockOnSaveTimeTrackingSettings,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });

    // Get the GeneralSettingSection props
    const generalSettingSectionProps = (GeneralSettingSection as jest.Mock).mock
      .calls[0][0];

    // Test onFormUpdate callback
    generalSettingSectionProps.onFormUpdate('test');
    expect(mockOnFormUpdate).toHaveBeenCalledWith('test');

    // Test onFormCancel callback
    generalSettingSectionProps.onFormCancel('test');
    expect(mockOnFormCancel).toHaveBeenCalledWith('test');

    // Test onSaveTimeTrackingSettings callback
    generalSettingSectionProps.onSaveTimeTrackingSettings();
    // This should be a no-op function that doesn't throw
    expect(() =>
      generalSettingSectionProps.onSaveTimeTrackingSettings(),
    ).not.toThrow();
  });

  test('testTimeSheetFieldsRendersEditComponentWhenEditing', async () => {
    // Reset mocks
    mockSetValue.mockClear();

    const onFormCancel = jest.fn();
    const onSaveTimeEntrySettings = jest.fn();
    const updateSelectedCustomTimeSheetField = jest.fn();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: true,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];

    const selectedCustomTimeSheetFields = ['customersForTimeSheetEnabled'];

    const { queryByTestId, rerender } = render(
      <FormProvider {...useForm()}>
        <TimeSheetFields
          timeSheetFields={mockTimeSheetFields}
          isTimeSheetEditing={false}
          timeSheetFieldSettingSection="time-entries.section.title.time-sheet"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={onFormCancel}
          editTimeSheetFields={mockEditTimeSheetFields}
          setEditTimeSheetFields={jest.fn()}
          selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
          updateSelectedCustomTimeSheetField={
            updateSelectedCustomTimeSheetField
          }
          onSaveTimeEntrySettings={onSaveTimeEntrySettings}
          isDataUpdating={false}
        />
      </FormProvider>,
    );

    // Initially EditTimeSheetField should not be rendered
    expect(queryByTestId('edit-time-sheet-field')).not.toBeInTheDocument();

    // Rerender with isTimeSheetEditing set to true
    rerender(
      <FormProvider {...useForm()}>
        <TimeSheetFields
          timeSheetFields={mockTimeSheetFields}
          isTimeSheetEditing
          timeSheetFieldSettingSection="time-entries.section.title.time-sheet"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={onFormCancel}
          editTimeSheetFields={mockEditTimeSheetFields}
          setEditTimeSheetFields={jest.fn()}
          selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
          updateSelectedCustomTimeSheetField={
            updateSelectedCustomTimeSheetField
          }
          onSaveTimeEntrySettings={onSaveTimeEntrySettings}
          isDataUpdating={false}
        />
      </FormProvider>,
    );

    // Now EditTimeSheetField should be rendered
    const editComponent = queryByTestId('edit-time-sheet-field');
    expect(editComponent).toBeInTheDocument();

    // Verify EditTimeSheetField is rendered with correct props
    expect(EditTimeSheetField).toHaveBeenCalledWith(
      {
        isTimeSheetEditing: true,
        onFormCancel,
        onSaveTimeEntrySettings,
        isDataUpdating: false,
        editTimeSheetFields: mockEditTimeSheetFields,
        updateSelectedCustomTimeSheetField,
        selectedCustomTimeSheetFields,
        isIXPFlagLoading: true,
        featureFlagForRequiredTimeSheetFields: false,
      },
      expect.any(Object),
    );

    // Verify the component is not rendered when isTimeSheetEditing is false
    rerender(
      <FormProvider {...useForm()}>
        <TimeSheetFields
          timeSheetFields={mockTimeSheetFields}
          isTimeSheetEditing={false}
          timeSheetFieldSettingSection="time-entries.section.title.time-sheet"
          id="test-id"
          onFormUpdate={jest.fn()}
          onFormCancel={onFormCancel}
          editTimeSheetFields={mockEditTimeSheetFields}
          setEditTimeSheetFields={jest.fn()}
          selectedCustomTimeSheetFields={selectedCustomTimeSheetFields}
          updateSelectedCustomTimeSheetField={
            updateSelectedCustomTimeSheetField
          }
          onSaveTimeEntrySettings={onSaveTimeEntrySettings}
          isDataUpdating={false}
        />
      </FormProvider>,
    );

    expect(queryByTestId('edit-time-sheet-field')).not.toBeInTheDocument();
  });

  test('should handle error state and reset fields to default values', async () => {
    // Mock the context with error state
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        locationForTimeSheetEnabled: { version: '1.0', value: false },
        isServiceFieldEnabled: { version: '1.0', value: false },
        customersForTimeSheetEnabled: { version: '1.0', value: false },
        isBillingFieldEnabled: { version: '1.0', value: false },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: true,
      isFormEditable: true,
      text: (id: string) => {
        if (id === 'time-entries.section.title.time-sheet.location') {
          return 'Department';
        }
        return id;
      },
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Department',
        value: true,
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        detail: {
          title: 'Department',
          subtitle: 'Enable location field',
          ariaLabel: 'Location field details',
        },
      },
    ];

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['locationForTimeSheetEnabled'],
    });

    await waitFor(() => {
      const locationField = mockEditTimeSheetFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
      );
      expect(locationField?.title).toBe(
        'time-entries.section.title.time-sheet.location',
      );
      expect(locationField?.value).toBe(false);
    });
  });

  test('should handle class field updates in error state', async () => {
    // Mock the context with error state
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: true,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'class',
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        value: true, // Initially true
        ariaLabel: 'Class field',
        tooltipText: 'Enable class field',
        disabled: false,
        detail: {
          title: 'Class',
          subtitle: 'Enable class field',
          ariaLabel: 'Class field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [], // Ensure no fields are pre-selected
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify class field is reset to its default value
      expect(mockSetValue).toHaveBeenCalledWith(
        'classForTimeSheetEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Verify class field was reset to false
    const classField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
    );
    expect(classField?.value).toBe(false);
    expect(classField?.title).toBe('Class');
  });

  test('should handle notes fields updates in error state', async () => {
    // Mock the context with error state
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {},
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: true,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        value: true, // Initially true
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        detail: {
          title: 'Notes',
          subtitle: 'Enable notes field',
          ariaLabel: 'Notes field details',
        },
        subFields: [
          {
            id: 'editNotes',
            key: 'timeSheetEntryEditNotesEnabled',
            title: 'Edit Notes',
            value: true, // Initially true
            ariaLabel: 'Edit notes field',
            tooltipText: 'Enable notes editing',
            disabled: false,
            detail: {
              title: 'Edit Notes',
              subtitle: 'Enable notes editing',
              ariaLabel: 'Edit notes field details',
            },
          },
          {
            id: 'requiredNotes',
            key: 'timeSheetEntryMakesNotesRequiredEnabled',
            title: 'Required Notes',
            value: true, // Initially true
            ariaLabel: 'Required notes field',
            tooltipText: 'Make notes required',
            disabled: false,
            detail: {
              title: 'Required Notes',
              subtitle: 'Make notes required',
              ariaLabel: 'Required notes field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [], // Ensure no fields are pre-selected
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify main notes field is reset to its default value
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryNotesEnabled',
        false,
      );

      // Verify notes subfields are reset to their default values
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryEditNotesEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryMakesNotesRequiredEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the notes field and verify its state
    const notesField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'timeSheetEntryNotesEnabled',
    );
    expect(notesField?.value).toBe(false);

    // Verify subfields were reset to false
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryEditNotesEnabled',
      )?.value,
    ).toBe(false);
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
      )?.value,
    ).toBe(false);

    // Verify field titles remain unchanged
    expect(notesField?.title).toBe('Notes');
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryEditNotesEnabled',
      )?.title,
    ).toBe('Edit Notes');
    expect(
      notesField?.subFields?.find(
        (sf: ITimeSheetFieldOption) =>
          sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
      )?.title,
    ).toBe('Required Notes');
  });

  test('should handle missing customersForTimeSheetEnabled in QLData', async () => {
    // Mock the context with missing customersForTimeSheetEnabled
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        // Include other fields but omit customersForTimeSheetEnabled
        isServiceFieldEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify customer field is set to default value when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Verify customer field was set to default value
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.value).toBe(true);
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('should handle missing isBillingFieldEnabled in QLData', async () => {
    // Mock the context with QLData but missing isBillingFieldEnabled
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        // Include other fields but omit isBillingFieldEnabled
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'billingRate',
            key: 'billingRateForTimeEnabled',
            title: 'Billing Rate',
            value: false,
            ariaLabel: 'Billing rate field',
            tooltipText: 'Enable billing rate',
            disabled: false,
            detail: {
              title: 'Billing Rate',
              subtitle: 'Enable billing rate',
              ariaLabel: 'Billing rate field details',
            },
          },
          {
            id: 'requireBillable',
            key: 'requireBillable',
            title: 'Require Billable',
            value: false,
            ariaLabel: 'Require billable field',
            tooltipText: 'Make billable required',
            disabled: false,
            detail: {
              title: 'Require Billable',
              subtitle: 'Make billable required',
              ariaLabel: 'Require billable field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify billing field and its subfields are set to default values when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', false);
      expect(mockSetValue).toHaveBeenCalledWith(
        'billingRateForTimeEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith('requireBillable', false);
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Verify billing field and its subfields were set to default values
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );
    expect(billingField?.value).toBe(false);
    expect(billingField?.title).toBe('Billing');

    // Verify subfields
    expect(
      billingField?.subFields?.find(
        (sf: ITimeSheetFieldOption) => sf.key === 'billingRateForTimeEnabled',
      )?.value,
    ).toBe(false);
    expect(
      billingField?.subFields?.find(
        (sf: ITimeSheetFieldOption) => sf.key === 'requireBillable',
      )?.value,
    ).toBe(false);
  });

  test('should handle missing classForTimeSheetEnabled in QLData', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        // Include other fields but omit classForTimeSheetEnabled
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
        isBillingFieldEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'class',
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        value: false, // Start with false to verify it changes
        ariaLabel: 'Class field',
        tooltipText: 'Enable class field',
        disabled: false,
        detail: {
          title: 'Class',
          subtitle: 'Enable class field',
          ariaLabel: 'Class field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify class field is set to default value when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'classForTimeSheetEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Verify class field was set to default value
    const classField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
    );
    expect(classField?.value).toBe(false);
    expect(classField?.title).toBe('Class');

    // Verify the value matches the default value from timeEntrySettingsDefaultState
    expect(classField?.value).toBe(
      timeEntrySettingsDefaultState.classForTimeSheetEnabled.value,
    );
  });

  test('should handle location field with positive values when present in QLData', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        // Include locationForTimeSheetEnabled with positive value
        locationForTimeSheetEnabled: { version: '1.0', value: true },
        // Include other fields
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Custom Department Name',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Location', // This should be updated to 'Custom Department Name'
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        detail: {
          title: 'Location',
          subtitle: 'Enable location field',
          ariaLabel: 'Location field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify location field is set to true from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'locationForTimeSheetEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the location field and verify its state
    const locationField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
    );

    // Verify the positive value from QLData is used
    expect(locationField?.value).toBe(true);

    // Verify the title is updated to use the custom department terminology
    expect(locationField?.title).toBe('Custom Department Name');

    // Verify the value matches locationForTimeSheetEnabled's value from stored context
    expect(locationField?.value).toBe(
      mockContext.QLData.locationForTimeSheetEnabled.value,
    );
  });

  test('should handle missing notes-related fields in QLData', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        // Include other fields but omit all notes-related fields
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
        locationForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        value: true, // Start with true to verify it changes to default value
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        detail: {
          title: 'Notes',
          subtitle: 'Enable notes field',
          ariaLabel: 'Notes field details',
        },
        subFields: [
          {
            id: 'editNotes',
            key: 'timeSheetEntryEditNotesEnabled',
            title: 'Edit Notes',
            value: true, // Start with true to verify it changes to default value
            ariaLabel: 'Edit notes field',
            tooltipText: 'Enable notes editing',
            disabled: false,
            detail: {
              title: 'Edit Notes',
              subtitle: 'Enable notes editing',
              ariaLabel: 'Edit notes field details',
            },
          },
          {
            id: 'requiredNotes',
            key: 'timeSheetEntryMakesNotesRequiredEnabled',
            title: 'Required Notes',
            value: true, // Start with true to verify it changes to default value
            ariaLabel: 'Required notes field',
            tooltipText: 'Make notes required',
            disabled: false,
            detail: {
              title: 'Required Notes',
              subtitle: 'Make notes required',
              ariaLabel: 'Required notes field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify all notes-related fields are set to their default values when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryNotesEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryEditNotesEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryMakesNotesRequiredEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the notes field and verify its state
    const notesField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'timeSheetEntryNotesEnabled',
    );

    // Verify main notes field defaulted to false
    expect(notesField?.value).toBe(false);
    expect(notesField?.title).toBe('Notes');

    // Verify subfields defaulted to false
    const editNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryEditNotesEnabled',
    );
    expect(editNotesField?.value).toBe(false);
    expect(editNotesField?.title).toBe('Edit Notes');

    const requiredNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
    );
    expect(requiredNotesField?.value).toBe(false);
    expect(requiredNotesField?.title).toBe('Required Notes');
  });

  test('should handle missing locationForTimeSheetEnabled in QLData', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        // Include other fields but omit locationForTimeSheetEnabled
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
        timeSheetEntryNotesEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Custom Department Name',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'location',
        key: 'locationForTimeSheetEnabled',
        title: 'Location', // Should be updated to Custom Department Name
        value: true, // Start with true to verify it changes to default value
        ariaLabel: 'Location field',
        tooltipText: 'Enable location field',
        disabled: false,
        detail: {
          title: 'Location',
          subtitle: 'Enable location field',
          ariaLabel: 'Location field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify location field is set to default value when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'locationForTimeSheetEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the location field and verify its state
    const locationField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
    );

    // Verify the field defaulted to false
    expect(locationField?.value).toBe(false);

    // Verify the title is still updated to use the custom department terminology
    expect(locationField?.title).toBe('Custom Department Name');

    // Verify the field structure remains intact
    expect(locationField?.detail).toEqual({
      title: 'Location',
      subtitle: 'Enable location field',
      ariaLabel: 'Location field details',
    });
  });

  test('should handle missing notes-related fields in QLData', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        // Include other fields but omit all notes-related fields
        isServiceFieldEnabled: { version: '1.0', value: true },
        customersForTimeSheetEnabled: { version: '1.0', value: true },
        locationForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        value: true, // Start with true to verify it changes to default value
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        detail: {
          title: 'Notes',
          subtitle: 'Enable notes field',
          ariaLabel: 'Notes field details',
        },
        subFields: [
          {
            id: 'editNotes',
            key: 'timeSheetEntryEditNotesEnabled',
            title: 'Edit Notes',
            value: true, // Start with true to verify it changes to default value
            ariaLabel: 'Edit notes field',
            tooltipText: 'Enable notes editing',
            disabled: false,
            detail: {
              title: 'Edit Notes',
              subtitle: 'Enable notes editing',
              ariaLabel: 'Edit notes field details',
            },
          },
          {
            id: 'requiredNotes',
            key: 'timeSheetEntryMakesNotesRequiredEnabled',
            title: 'Required Notes',
            value: true, // Start with true to verify it changes to default value
            ariaLabel: 'Required notes field',
            tooltipText: 'Make notes required',
            disabled: false,
            detail: {
              title: 'Required Notes',
              subtitle: 'Make notes required',
              ariaLabel: 'Required notes field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify all notes-related fields are set to their default values when missing from QLData
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryNotesEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryEditNotesEnabled',
        false,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryMakesNotesRequiredEnabled',
        false,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the notes field and verify its state
    const notesField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'timeSheetEntryNotesEnabled',
    );

    // Verify main notes field defaulted to false
    expect(notesField?.value).toBe(false);
    expect(notesField?.title).toBe('Notes');

    // Verify subfields defaulted to false
    const editNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryEditNotesEnabled',
    );
    expect(editNotesField?.value).toBe(false);
    expect(editNotesField?.title).toBe('Edit Notes');

    const requiredNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
    );
    expect(requiredNotesField?.value).toBe(false);
    expect(requiredNotesField?.title).toBe('Required Notes');
  });

  test('should handle billing rate and require billable fields updates', async () => {
    // Mock the context with billing-related fields
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        isBillingFieldEnabled: { version: '1.0', value: true },
        billingRateForTimeEnabled: { version: '1.0', value: true },
        requireBillable: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'billingRate',
            key: 'billingRateForTimeEnabled',
            title: 'Billing Rate',
            value: false,
            ariaLabel: 'Billing rate field',
            tooltipText: 'Enable billing rate',
            disabled: false,
            detail: {
              title: 'Billing Rate',
              subtitle: 'Enable billing rate',
              ariaLabel: 'Billing rate field details',
            },
          },
          {
            id: 'requireBillable',
            key: 'requireBillable',
            title: 'Require Billable',
            value: false,
            ariaLabel: 'Require billable field',
            tooltipText: 'Make billable required',
            disabled: false,
            detail: {
              title: 'Require Billable',
              subtitle: 'Make billable required',
              ariaLabel: 'Require billable field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [
        'isBillingFieldEnabled',
        'billingRateForTimeEnabled',
        'requireBillable',
      ],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify billing field and its subfields are set correctly
      expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', true);
      expect(mockSetValue).toHaveBeenCalledWith(
        'billingRateForTimeEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith('requireBillable', true);
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the billing field and verify its state
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );

    // Verify main billing field
    expect(billingField?.value).toBe(true);
    expect(billingField?.title).toBe('Billing');

    // Verify subfields
    const billingRateField = billingField?.subFields?.find(
      (sf: ITimeSheetFieldOption) => sf.key === 'billingRateForTimeEnabled',
    );
    expect(billingRateField?.value).toBe(true);
    expect(billingRateField?.title).toBe('Billing Rate');

    const requireBillableField = billingField?.subFields?.find(
      (sf: ITimeSheetFieldOption) => sf.key === 'requireBillable',
    );
    expect(requireBillableField?.value).toBe(true);
    expect(requireBillableField?.title).toBe('Require Billable');
  });

  test('should handle customer field updates correctly', async () => {
    // Mock the context with customer field
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify customer field is set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the customer field and verify its state
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );

    // Verify customer field
    expect(customerField?.value).toBe(true);
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
    expect(customerField?.detail).toEqual({
      title: 'Customer',
      subtitle: 'Enable customer field',
      ariaLabel: 'Customer field details',
    });
  });

  test('should handle require billable field updates correctly', async () => {
    // Mock the context with require billable field
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        isBillingFieldEnabled: { version: '1.0', value: true },
        requireBillable: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: true,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'requireBillable',
            key: 'requireBillable',
            title: 'Require Billable',
            value: false, // Start with false to verify it changes to true
            ariaLabel: 'Require billable field',
            tooltipText: 'Make billable required',
            disabled: false,
            detail: {
              title: 'Require Billable',
              subtitle: 'Make billable required',
              ariaLabel: 'Require billable field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [
        'isBillingFieldEnabled',
        'requireBillable',
      ],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify require billable field is set correctly
      expect(mockSetValue).toHaveBeenCalledWith('requireBillable', true);
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the billing field and verify its state
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );

    // Verify main billing field remains unchanged
    expect(billingField?.value).toBe(true);
    expect(billingField?.title).toBe('Billing');

    // Get and verify require billable subfield
    const requireBillableField = billingField?.subFields?.find(
      (sf: ITimeSheetFieldOption) => sf.key === 'requireBillable',
    );

    // Verify require billable field
    expect(requireBillableField?.value).toBe(true);
    expect(requireBillableField?.title).toBe('Require Billable');
    expect(requireBillableField?.detail).toEqual({
      title: 'Require Billable',
      subtitle: 'Make billable required',
      ariaLabel: 'Require billable field details',
    });

    // Verify the parent-child relationship is maintained
    expect(billingField?.subFields).toContainEqual(requireBillableField);
  });

  test('should handle service field updates correctly', async () => {
    // Mock the context with service field
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        useItemForTime: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'service',
        key: 'isServiceFieldEnabled',
        title: 'Service',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Service field',
        tooltipText: 'Enable service field',
        disabled: false,
        detail: {
          title: 'Service',
          subtitle: 'Enable service field',
          ariaLabel: 'Service field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['isServiceFieldEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify service field is set correctly
      expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', true);
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the service field and verify its state
    const serviceField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isServiceFieldEnabled',
    );

    // Verify service field
    expect(serviceField?.value).toBe(true);
    expect(serviceField?.title).toBe('Service');
    expect(serviceField?.detail).toEqual({
      title: 'Service',
      subtitle: 'Enable service field',
      ariaLabel: 'Service field details',
    });
  });

  test('should handle class field updates correctly', async () => {
    // Mock the context with class field
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        classForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'class',
        key: 'classForTimeSheetEnabled',
        title: 'Class',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Class field',
        tooltipText: 'Enable class field',
        disabled: false,
        detail: {
          title: 'Class',
          subtitle: 'Enable class field',
          ariaLabel: 'Class field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['classForTimeSheetEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify class field is set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'classForTimeSheetEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the class field and verify its state
    const classField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
    );

    // Verify class field
    expect(classField?.value).toBe(true);
    expect(classField?.title).toBe('Class');
    expect(classField?.detail).toEqual({
      title: 'Class',
      subtitle: 'Enable class field',
      ariaLabel: 'Class field details',
    });
  });

  test('should handle notes fields updates correctly', async () => {
    // Mock the context with notes-related fields
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        timeSheetEntryNotesEnabled: { version: '1.0', value: true },
        timeSheetEntryEditNotesEnabled: { version: '1.0', value: true },
        timeSheetEntryMakesNotesRequiredEnabled: {
          version: '1.0',
          value: true,
        },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'notes',
        key: 'timeSheetEntryNotesEnabled',
        title: 'Notes',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Notes field',
        tooltipText: 'Enable notes field',
        disabled: false,
        detail: {
          title: 'Notes',
          subtitle: 'Enable notes field',
          ariaLabel: 'Notes field details',
        },
        subFields: [
          {
            id: 'editNotes',
            key: 'timeSheetEntryEditNotesEnabled',
            title: 'Edit Notes',
            value: false, // Start with false to verify it changes to true
            ariaLabel: 'Edit notes field',
            tooltipText: 'Enable notes editing',
            disabled: false,
            detail: {
              title: 'Edit Notes',
              subtitle: 'Enable notes editing',
              ariaLabel: 'Edit notes field details',
            },
          },
          {
            id: 'requiredNotes',
            key: 'timeSheetEntryMakesNotesRequiredEnabled',
            title: 'Required Notes',
            value: false, // Start with false to verify it changes to true
            ariaLabel: 'Required notes field',
            tooltipText: 'Make notes required',
            disabled: false,
            detail: {
              title: 'Required Notes',
              subtitle: 'Make notes required',
              ariaLabel: 'Required notes field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: [
        'timeSheetEntryNotesEnabled',
        'timeSheetEntryEditNotesEnabled',
        'timeSheetEntryMakesNotesRequiredEnabled',
      ],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify all notes-related fields are set correctly
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryNotesEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryEditNotesEnabled',
        true,
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'timeSheetEntryMakesNotesRequiredEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the notes field and verify its state
    const notesField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'timeSheetEntryNotesEnabled',
    );

    // Verify main notes field
    expect(notesField?.value).toBe(true);
    expect(notesField?.title).toBe('Notes');
    expect(notesField?.detail).toEqual({
      title: 'Notes',
      subtitle: 'Enable notes field',
      ariaLabel: 'Notes field details',
    });

    // Verify subfields
    const editNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryEditNotesEnabled',
    );
    expect(editNotesField?.value).toBe(true);
    expect(editNotesField?.title).toBe('Edit Notes');

    const requiredNotesField = notesField?.subFields?.find(
      (sf: ITimeSheetFieldOption) =>
        sf.key === 'timeSheetEntryMakesNotesRequiredEnabled',
    );
    expect(requiredNotesField?.value).toBe(true);
    expect(requiredNotesField?.title).toBe('Required Notes');

    // Verify the parent-child relationship is maintained
    expect(notesField?.subFields).toContainEqual(editNotesField);
    expect(notesField?.subFields).toContainEqual(requiredNotesField);
  });

  test('should handle customer field updates in useEffect correctly', async () => {
    // Mock the context with customer field and error state to trigger useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings', // This triggers the useEffect
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify customer field is set correctly in useEffect
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the customer field and verify its state
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );

    // Verify customer field
    expect(customerField?.value).toBe(true);
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
    expect(customerField?.detail).toEqual({
      title: 'Customer',
      subtitle: 'Enable customer field',
      ariaLabel: 'Customer field details',
    });

    // Verify the field was updated in the array
    expect(updatedFields).toContainEqual(customerField);
  });

  test('should handle billing field updates in useEffect correctly', async () => {
    // Mock the context with billing field and error state to trigger useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        isBillingFieldEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings', // This triggers the useEffect
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false, // Start with false to verify it changes to true
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['isBillingFieldEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify billing field is set correctly in useEffect - when there's an error, it uses default value
      expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', false);
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the billing field and verify its state
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );

    // Verify billing field
    expect(billingField?.value).toBe(
      timeEntrySettingsDefaultState.isBillingFieldEnabled.value,
    );
    expect(billingField?.title).toBe('Billing');
    expect(billingField?.detail).toEqual({
      title: 'Billing',
      subtitle: 'Enable billing field',
      ariaLabel: 'Billing field details',
    });

    // Verify the field was updated in the array
    expect(updatedFields).toContainEqual(billingField);
  });

  test('should handle billing rate field updates in useEffect correctly', async () => {
    // Mock the context with billing rate field and error state to trigger useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        billingRateForTimeEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings', // This triggers the useEffect
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'billingRate',
            key: 'billingRateForTimeEnabled',
            title: 'Billing Rate',
            value: false, // Start with false to verify it changes to true
            ariaLabel: 'Billing rate field',
            tooltipText: 'Enable billing rate field',
            disabled: false,
            detail: {
              title: 'Billing Rate',
              subtitle: 'Enable billing rate field',
              ariaLabel: 'Billing rate field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['billingRateForTimeEnabled'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify billing rate field is set correctly in useEffect
      expect(mockSetValue).toHaveBeenCalledWith(
        'billingRateForTimeEnabled',
        timeEntrySettingsDefaultState.billingRateForTimeEnabled.value,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the billing field and its subfield
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );
    const billingRateField = billingField?.subFields?.find(
      (f: ITimeSheetFieldOption) => f.key === 'billingRateForTimeEnabled',
    );

    // Verify billing rate field
    expect(billingRateField?.value).toBe(
      timeEntrySettingsDefaultState.billingRateForTimeEnabled.value,
    );
    expect(billingRateField?.title).toBe('Billing Rate');
    expect(billingRateField?.detail).toEqual({
      title: 'Billing Rate',
      subtitle: 'Enable billing rate field',
      ariaLabel: 'Billing rate field details',
    });

    // Verify the field was updated in the array
    expect(billingField?.subFields).toContainEqual(billingRateField);
  });

  test('should handle require billable field updates in useEffect correctly', async () => {
    // Mock the context with require billable field and error state to trigger useEffect
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        requireBillable: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings', // This triggers the useEffect
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'billing',
        key: 'isBillingFieldEnabled',
        title: 'Billing',
        value: false,
        ariaLabel: 'Billing field',
        tooltipText: 'Enable billing field',
        disabled: false,
        detail: {
          title: 'Billing',
          subtitle: 'Enable billing field',
          ariaLabel: 'Billing field details',
        },
        subFields: [
          {
            id: 'requireBillable',
            key: 'requireBillable',
            title: 'Require Billable',
            value: false, // Start with false to verify it changes to true
            ariaLabel: 'Require billable field',
            tooltipText: 'Enable require billable field',
            disabled: false,
            detail: {
              title: 'Require Billable',
              subtitle: 'Enable require billable field',
              ariaLabel: 'Require billable field details',
            },
          },
        ],
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['requireBillable'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify require billable field is set correctly in useEffect
      expect(mockSetValue).toHaveBeenCalledWith(
        'requireBillable',
        timeEntrySettingsDefaultState.requireBillable.value,
      );
    });

    // Verify the fields were updated in editTimeSheetFields
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

    // Get the billing field and its subfield
    const billingField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'isBillingFieldEnabled',
    );
    const requireBillableField = billingField?.subFields?.find(
      (f: ITimeSheetFieldOption) => f.key === 'requireBillable',
    );

    // Verify require billable field
    expect(requireBillableField?.value).toBe(
      timeEntrySettingsDefaultState.requireBillable.value,
    );
    expect(requireBillableField?.title).toBe('Require Billable');
    expect(requireBillableField?.detail).toEqual({
      title: 'Require Billable',
      subtitle: 'Enable require billable field',
      ariaLabel: 'Require billable field details',
    });

    // Verify the field was updated in the array
    expect(billingField?.subFields).toContainEqual(requireBillableField);
  });

  test('should handle unknown field type gracefully in useEffect', async () => {
    // Store the mock context for later verification
    const mockContext = {
      QLData: {
        unknownField: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: 'Error loading settings', // This triggers the useEffect
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            DepartmentTerminology: 'Department',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    };

    // Mock the context with stored value
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(mockContext);

    // Reset mock before test
    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'unknown',
        key: 'unknownField',
        title: 'Unknown Field',
        value: false,
        ariaLabel: 'Unknown field',
        tooltipText: 'Enable unknown field',
        disabled: false,
        detail: {
          title: 'Unknown Field',
          subtitle: 'Enable unknown field',
          ariaLabel: 'Unknown field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['unknownField'],
    });

    // Wait for all updates to complete
    await waitFor(() => {
      // Verify that no setValue was called for unknown field
      expect(mockSetValue).not.toHaveBeenCalledWith(
        'unknownField',
        expect.anything(),
      );
    });

    // Verify the fields were updated in editTimeSheetFields but with no changes
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const unknownField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'unknownField',
    );

    // Verify unknown field remains in its original state
    expect(unknownField?.value).toBe(false);
    expect(unknownField?.title).toBe('Unknown Field');
    expect(unknownField?.detail).toEqual({
      title: 'Unknown Field',
      subtitle: 'Enable unknown field',
      ariaLabel: 'Unknown field details',
    });

    // Verify the field array remains unchanged
    expect(updatedFields).toEqual(mockEditTimeSheetFields);
  });

  // Tests for required field functionality
  describe('Required field functionality', () => {
    test('should process required fields when feature flag is enabled', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with required field data
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classRequired: { version: '1.0', value: true },
          classForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          true,
        );
        // Verify required field is processed when feature flag is enabled
        expect(mockSetValue).toHaveBeenCalledWith('classRequired', true);
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.value).toBe(true);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      // The required field processing happens separately in the switch statement
      expect(classField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should ignore required fields when feature flag is disabled', async () => {
      // Feature flag is disabled by default (set in beforeEach)

      // Mock the context with required field data
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classRequired: { version: '1.0', value: true },
          locationRequired: { version: '1.0', value: true },
          serviceItemRequired: { version: '1.0', value: true },
          requireBillable: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: true,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed but required field is not
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          false,
        );
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify required field remains in its original state
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.requiredField?.value).toBe(false);
    });

    test('should handle required fields with missing keys', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classRequired: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: true,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: '', // Empty key
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          false,
        );
        // Verify required field with empty key is not processed
        expect(mockSetValue).not.toHaveBeenCalledWith('', expect.anything());
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify required field remains in its original state
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.requiredField?.value).toBe(false);
    });

    test('should handle fields without required field property', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          // No requiredField property
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          true,
        );
        // Verify no required field processing occurs
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify field structure remains intact
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.value).toBe(true);
      expect(classField?.requiredField).toBeUndefined();
    });

    test('should handle required fields with null requiredField property', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: undefined, // Undefined requiredField
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          true,
        );
        // Verify no required field processing occurs
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify field structure remains intact
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.value).toBe(true);
      expect(classField?.requiredField).toBeUndefined();
    });

    test('should handle missing required field data in QLData', async () => {
      // Mock the context without required field data
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classForTimeSheetEnabled: { version: '1.0', value: true },
          // Missing classRequired - this should default to false
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          true,
        );
        // Required field should not be processed since feature flag is disabled
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify required field remains in original state
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.requiredField?.value).toBe(false);
    });

    test('should handle required fields in error state', async () => {
      // Mock the context with error state
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: 'Error loading settings',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: true,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: true,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is set to default value in error state
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          false,
        );
        // Required field should not be processed since feature flag is disabled
        expect(mockSetValue).not.toHaveBeenCalledWith(
          'classRequired',
          expect.anything(),
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // Verify required field remains in original state
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.requiredField?.value).toBe(true);
    });

    test('should process require service item when feature flag is enabled', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with require service item data
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          serviceItemRequired: { version: '1.0', value: true },
          useItemForTime: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'service',
          key: 'isServiceFieldEnabled',
          title: 'Service',
          value: false,
          ariaLabel: 'Service field',
          tooltipText: 'Enable service field',
          disabled: false,
          detail: {
            title: 'Service',
            subtitle: 'Enable service field',
            ariaLabel: 'Service field details',
          },
          requiredField: {
            id: 'serviceItemRequired',
            key: 'serviceItemRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main service field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'isServiceFieldEnabled',
          true,
        );
        // Verify required service item field is processed when feature flag is enabled
        expect(mockSetValue).toHaveBeenCalledWith('serviceItemRequired', true);
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const serviceField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'isServiceFieldEnabled',
      );
      expect(serviceField?.value).toBe(true);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(serviceField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require service item when QLData is missing', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context WITHOUT serviceItemRequired in QLData to test the else condition
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          useItemForTime: { version: '1.0', value: true },
          // Missing serviceItemRequired - should use default value
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'service',
          key: 'isServiceFieldEnabled',
          title: 'Service',
          value: false,
          ariaLabel: 'Service field',
          tooltipText: 'Enable service field',
          disabled: false,
          detail: {
            title: 'Service',
            subtitle: 'Enable service field',
            ariaLabel: 'Service field details',
          },
          requiredField: {
            id: 'serviceItemRequired',
            key: 'serviceItemRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main service field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'isServiceFieldEnabled',
          true,
        );
        // Verify required service item field uses default value when missing from QLData
        expect(mockSetValue).toHaveBeenCalledWith(
          'serviceItemRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const serviceField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'isServiceFieldEnabled',
      );
      expect(serviceField?.value).toBe(true);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(serviceField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require service item when QLData is in error state', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with error state - settingData will be null
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          serviceItemRequired: { version: '1.0', value: true },
          useItemForTime: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: 'Error loading settings', // This makes settingData null
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'service',
          key: 'isServiceFieldEnabled',
          title: 'Service',
          value: false,
          ariaLabel: 'Service field',
          tooltipText: 'Enable service field',
          disabled: false,
          detail: {
            title: 'Service',
            subtitle: 'Enable service field',
            ariaLabel: 'Service field details',
          },
          requiredField: {
            id: 'serviceItemRequired',
            key: 'serviceItemRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main service field uses default value in error state
        expect(mockSetValue).toHaveBeenCalledWith(
          'isServiceFieldEnabled',
          false,
        );
        // Verify required service item field uses default value when settingData is null
        expect(mockSetValue).toHaveBeenCalledWith(
          'serviceItemRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should use default value
      const serviceField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'isServiceFieldEnabled',
      );
      expect(serviceField?.value).toBe(false);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(serviceField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require class when QLData is missing', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context WITHOUT classRequired in QLData to test the else condition
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classForTimeSheetEnabled: { version: '1.0', value: true },
          // Missing classRequired - should use default value
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main class field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          true,
        );
        // Verify required class field uses default value when missing from QLData
        expect(mockSetValue).toHaveBeenCalledWith(
          'classRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.value).toBe(true);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(classField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require class when QLData is in error state', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with error state - settingData will be null
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          classRequired: { version: '1.0', value: true },
          classForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: 'Error loading settings', // This makes settingData null
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'class',
          key: 'classForTimeSheetEnabled',
          title: 'Class',
          value: false,
          ariaLabel: 'Class field',
          tooltipText: 'Enable class field',
          disabled: false,
          detail: {
            title: 'Class',
            subtitle: 'Enable class field',
            ariaLabel: 'Class field details',
          },
          requiredField: {
            id: 'classRequired',
            key: 'classRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main class field uses default value in error state
        expect(mockSetValue).toHaveBeenCalledWith(
          'classForTimeSheetEnabled',
          false,
        );
        // Verify required class field uses default value when settingData is null
        expect(mockSetValue).toHaveBeenCalledWith(
          'classRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should use default value
      const classField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'classForTimeSheetEnabled',
      );
      expect(classField?.value).toBe(false);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(classField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require location when QLData is missing', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context WITHOUT locationRequired in QLData to test the else condition
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          locationForTimeSheetEnabled: { version: '1.0', value: true },
          // Missing locationRequired - should use default value
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'location',
          key: 'locationForTimeSheetEnabled',
          title: 'Location',
          value: false,
          ariaLabel: 'Location field',
          tooltipText: 'Enable location field',
          disabled: false,
          detail: {
            title: 'Location',
            subtitle: 'Enable location field',
            ariaLabel: 'Location field details',
          },
          requiredField: {
            id: 'locationRequired',
            key: 'locationRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main location field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'locationForTimeSheetEnabled',
          true,
        );
        // Verify required location field uses default value when missing from QLData
        expect(mockSetValue).toHaveBeenCalledWith(
          'locationRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const locationField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
      );
      expect(locationField?.value).toBe(true);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(locationField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should use default value for require location when QLData is in error state', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with error state - settingData will be null
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          locationRequired: { version: '1.0', value: true },
          locationForTimeSheetEnabled: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: 'Error loading settings', // This makes settingData null
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'location',
          key: 'locationForTimeSheetEnabled',
          title: 'Location',
          value: false,
          ariaLabel: 'Location field',
          tooltipText: 'Enable location field',
          disabled: false,
          detail: {
            title: 'Location',
            subtitle: 'Enable location field',
            ariaLabel: 'Location field details',
          },
          requiredField: {
            id: 'locationRequired',
            key: 'locationRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main location field uses default value in error state
        expect(mockSetValue).toHaveBeenCalledWith(
          'locationForTimeSheetEnabled',
          false,
        );
        // Verify required location field uses default value when settingData is null
        expect(mockSetValue).toHaveBeenCalledWith(
          'locationRequired',
          false, // Default value from timeEntrySettingsDefaultState
        );
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should use default value
      const locationField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
      );
      expect(locationField?.value).toBe(false);

      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(locationField?.requiredField?.value).toBe(false);

      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });

    test('should process require location when feature flag is enabled', async () => {
      // Enable the IXP feature flag for this test
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
        settled: true,
      });

      // Mock the context with required field data
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: {
          locationForTimeSheetEnabled: { version: '1.0', value: true },
          locationRequired: { version: '1.0', value: true },
        },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
        },
      });

      // Reset mock before test
      mockSetValue.mockClear();

      const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
        {
          id: 'location',
          key: 'locationForTimeSheetEnabled',
          title: 'Location',
          value: false,
          ariaLabel: 'Location field',
          tooltipText: 'Enable location field',
          disabled: false,
          detail: {
            title: 'Location',
            subtitle: 'Enable location field',
            ariaLabel: 'Location field details',
          },
          requiredField: {
            id: 'locationRequired',
            key: 'locationRequired',
            disabled: false,
            value: false,
          },
        },
      ];

      const setEditTimeSheetFields = jest.fn();

      renderTimeSheetFields({
        editTimeSheetFields: mockEditTimeSheetFields,
        setEditTimeSheetFields,
        selectedCustomTimeSheetFields: [],
      });

      // Wait for all updates to complete
      await waitFor(() => {
        // Verify main field is processed
        expect(mockSetValue).toHaveBeenCalledWith(
          'locationForTimeSheetEnabled',
          true,
        );
        // Verify required location field is processed when feature flag is enabled
        expect(mockSetValue).toHaveBeenCalledWith('locationRequired', true);
      });

      // Verify the fields were updated in editTimeSheetFields
      expect(setEditTimeSheetFields).toHaveBeenCalled();
      const updatedFields = setEditTimeSheetFields.mock.calls[0][0];

      // The main field should be updated
      const locationField = updatedFields.find(
        (f: ITimeSheetFieldOption) => f.key === 'locationForTimeSheetEnabled',
      );
      expect(locationField?.value).toBe(true);
      // The requiredField.value in the original structure is not updated by updateTimeSheetField
      expect(locationField?.requiredField?.value).toBe(false);
      // Verify that both main field and required field keys were processed
      expect(mockSetValue).toHaveBeenCalledTimes(2);
    });
  });

  test('should use CustomerTerminology from v3PreferencesData.Preferences.AccountingInfoPrefs for customer field label', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {
        Preferences: {
          AccountingInfoPrefs: {
            CustomerTerminology: 'Client',
          },
        },
      },
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });

    mockSetValue.mockClear();

    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];

    const setEditTimeSheetFields = jest.fn();

    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });

    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe('Client');
  });

  test('should fallback to default label if v3PreferencesData.Preferences is missing', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: {}, // Preferences missing
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('should fallback to default label if v3PreferencesData.Preferences.AccountingInfoPrefs is missing', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: { Preferences: {} }, // AccountingInfoPrefs missing
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('should fallback to default label if v3PreferencesData.Preferences.AccountingInfoPrefs.CustomerTerminology is missing', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: { Preferences: { AccountingInfoPrefs: {} } }, // CustomerTerminology missing
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('should fallback to default label if v3PreferencesData is missing', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: undefined, // v3PreferencesData missing
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    // setValue should NOT be called
    expect(mockSetValue).not.toHaveBeenCalled();
    // setEditTimeSheetFields should also NOT be called
    expect(setEditTimeSheetFields).not.toHaveBeenCalled();
  });

  test('should fallback to default label if v3PreferencesData.Preferences is undefined', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: { Preferences: undefined }, // Preferences is undefined
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('should fallback to default label if v3PreferencesData.Preferences.AccountingInfoPrefs is undefined', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      QLData: {
        customersForTimeSheetEnabled: { version: '1.0', value: true },
      },
      isQLSettingsLoading: false,
      QLSettingsError: '',
      v3PreferencesData: { Preferences: { AccountingInfoPrefs: undefined } }, // AccountingInfoPrefs is undefined
      v3PreferencesLoading: false,
      v3PreferencesError: false,
      isFormEditable: true,
      text: (id: string) => id,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
        newTimesheetVisibilityEndDate: '',
        newCustomFieldsVisibilityEndDate: '',
      },
      isR4AssignmentsEnabled: false,
    });
    mockSetValue.mockClear();
    const mockEditTimeSheetFields: ITimeSheetFieldOption[] = [
      {
        id: 'customer',
        key: 'customersForTimeSheetEnabled',
        title: 'Customer',
        value: false,
        ariaLabel: 'Customer field',
        tooltipText: 'Enable customer field',
        disabled: false,
        detail: {
          title: 'Customer',
          subtitle: 'Enable customer field',
          ariaLabel: 'Customer field details',
        },
      },
    ];
    const setEditTimeSheetFields = jest.fn();
    renderTimeSheetFields({
      editTimeSheetFields: mockEditTimeSheetFields,
      setEditTimeSheetFields,
      selectedCustomTimeSheetFields: ['customersForTimeSheetEnabled'],
    });
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith(
        'customersForTimeSheetEnabled',
        true,
      );
    });
    expect(setEditTimeSheetFields).toHaveBeenCalled();
    const updatedFields = setEditTimeSheetFields.mock.calls[0][0];
    const customerField = updatedFields.find(
      (f: ITimeSheetFieldOption) => f.key === 'customersForTimeSheetEnabled',
    );
    expect(customerField?.title).toBe(
      'time-entries.section.title.time-sheet.customer-and-sub-customer',
    );
  });

  test('handles missing time-sheet section key without crashing', () => {
    renderTimeSheetFields({
      timeSheetFields: {} as any,
      editTimeSheetFields: [],
      setEditTimeSheetFields: jest.fn(),
    });

    expect(GeneralSettingSection).toHaveBeenCalled();
  });

  describe('custom dimensions', () => {
    const customDimensions: CustomDimensionSetting[] = [
      {
        dimensionDefinitionId: '1000000023',
        enabledForTimeTracking: { version: '1', value: true },
        required: { version: '1', value: false },
      },
    ];

    const dimensionDefinitionsFromApi: DimensionDefinition[] = [
      {
        id: '1000000023',
        name: 'Department',
        active: true,
        enabledForTimeTracking: true,
        required: false,
      },
    ];

    const dimensionFormDefinitions = [
      { id: '1000000023', label: 'Department', active: true },
    ];

    const previewFields = mapDimensionDefinitionsToPreviewFields(
      dimensionFormDefinitions,
      customDimensions,
    );

    const enableDimensionsSection = () => {
      mockUseDimensionVisibility.mockReturnValue({
        isVisible: true,
        loading: false,
      });
      mockUseGetDimensions.mockReturnValue({
        dimensions: dimensionDefinitionsFromApi,
        loading: false,
        error: null,
        query: mockQueryDimensions,
      });
    };

    beforeEach(() => {
      mockQueryDimensions.mockReset();
      mockQueryDimensions.mockResolvedValue(undefined);
      mockUseDimensionVisibility.mockReturnValue({
        isVisible: false,
        loading: false,
      });
      mockUseGetDimensions.mockReturnValue({
        dimensions: [],
        loading: false,
        error: null,
        query: mockQueryDimensions,
      });
    });

    test('does not query dimensions when the section is hidden', () => {
      renderTimeSheetFields({});

      expect(mockQueryDimensions).not.toHaveBeenCalled();
    });

    test('queries dimensions once when the section becomes visible', () => {
      enableDimensionsSection();
      renderTimeSheetFields({});

      expect(mockQueryDimensions).toHaveBeenCalledTimes(1);
    });

    test('does not query dimensions again on re-render', () => {
      enableDimensionsSection();

      const props = getDefaultProps();
      const mockFormMethods = {
        control: mockControl,
        setValue: mockSetValue,
        getValues: jest.fn(),
        handleSubmit: jest.fn((onValid: any) => jest.fn()),
        reset: jest.fn(),
        register: jest.fn(),
        unregister: jest.fn(),
        watch: jest.fn(),
        formState: {
          errors: {},
          isDirty: false,
          isSubmitting: false,
          isValid: true,
          dirtyFields: {},
          touchedFields: {},
          isSubmitted: false,
          isSubmitSuccessful: false,
          submitCount: 0,
          isLoading: false,
          isValidating: false,
          disabled: false,
          validatingFields: new Set(),
        },
        clearErrors: jest.fn(),
        setError: jest.fn(),
        trigger: jest.fn(),
        getFieldState: jest.fn(),
        resetField: jest.fn(),
        setFocus: jest.fn(),
      } as any;

      const { rerender } = render(
        <FormProvider {...mockFormMethods}>
          <TimeSheetFields {...props} />
        </FormProvider>,
      );

      expect(mockQueryDimensions).toHaveBeenCalledTimes(1);

      rerender(
        <FormProvider {...mockFormMethods}>
          <TimeSheetFields {...props} />
        </FormProvider>,
      );

      expect(mockQueryDimensions).toHaveBeenCalledTimes(1);
    });

    test('logs an error when the dimensions query fails', async () => {
      enableDimensionsSection();
      mockQueryDimensions.mockRejectedValueOnce(new Error('network fail'));

      renderTimeSheetFields({});

      await waitFor(() => {
        expect((useSandbox as jest.Mock)().logger.error).toHaveBeenCalledWith(
          'Component=TimeSheetFields Event=FetchDimensionsFailed',
          { error: 'network fail' },
        );
      });
    });

    test('seeds dimension form state when QL settings and definitions finish loading', async () => {
      enableDimensionsSection();
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: { ...mockQLData, customDimensions },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
          breaksVisibilityEndDate: '',
          customFieldsVisibilityEndDate: '',
          geoLocationsVisibilityEndDate: '',
          approvalsVisibilityEndDate: '',
          newTimesheetVisibilityEndDate: '',
          newCustomFieldsVisibilityEndDate: '',
        },
        isR4AssignmentsEnabled: false,
      });
      mockSetValue.mockClear();

      renderTimeSheetFields({});

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith(
          'customDimensions',
          customDimensions,
          { shouldDirty: false, shouldTouch: false },
        );
      });

      expect(mockSetValue).toHaveBeenCalledWith(
        'dimensionDefinitions',
        dimensionFormDefinitions,
        { shouldDirty: false, shouldTouch: false },
      );
      expect(mockSetValue).toHaveBeenCalledWith(
        'dimensions',
        mapDimensionPreviewFieldsToFormValues(previewFields),
        { shouldDirty: false, shouldTouch: false },
      );
    });

    test('does not seed dimensions form values when no active preview fields exist', async () => {
      enableDimensionsSection();
      mockUseGetDimensions.mockReturnValue({
        dimensions: [
          {
            id: '1000000025',
            name: 'Inactive',
            active: false,
            enabledForTimeTracking: false,
            required: false,
          },
        ],
        loading: false,
        error: null,
        query: mockQueryDimensions,
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        QLData: { ...mockQLData, customDimensions: [] },
        isQLSettingsLoading: false,
        QLSettingsError: '',
        v3PreferencesData: {
          Preferences: {
            AccountingInfoPrefs: {
              DepartmentTerminology: 'Department',
            },
          },
        },
        v3PreferencesLoading: false,
        v3PreferencesError: false,
        isFormEditable: true,
        text: (id: string) => id,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
          breaksVisibilityEndDate: '',
          customFieldsVisibilityEndDate: '',
          geoLocationsVisibilityEndDate: '',
          approvalsVisibilityEndDate: '',
          newTimesheetVisibilityEndDate: '',
          newCustomFieldsVisibilityEndDate: '',
        },
        isR4AssignmentsEnabled: false,
      });
      mockSetValue.mockClear();

      renderTimeSheetFields({});

      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith('customDimensions', [], {
          shouldDirty: false,
          shouldTouch: false,
        });
      });

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'dimensions',
        expect.anything(),
        expect.anything(),
      );
    });

    test('waits for dimension definitions to finish loading before seeding form state', () => {
      enableDimensionsSection();
      mockUseGetDimensions.mockReturnValue({
        dimensions: dimensionDefinitionsFromApi,
        loading: true,
        error: null,
        query: mockQueryDimensions,
      });
      mockSetValue.mockClear();

      renderTimeSheetFields({});

      expect(mockSetValue).not.toHaveBeenCalledWith(
        'customDimensions',
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('hideViewSection (standalone timesheet trowser)', () => {
    test('renders the collapsed view/summary section by default', () => {
      renderTimeSheetFields({ hideViewSection: false });

      expect(GeneralSettingSection).toHaveBeenCalled();
    });

    test('renders the view/summary section when hideViewSection is omitted', () => {
      renderTimeSheetFields({});

      expect(GeneralSettingSection).toHaveBeenCalled();
    });

    test('hides the view/summary section when hideViewSection is true', () => {
      renderTimeSheetFields({ hideViewSection: true });

      expect(GeneralSettingSection).not.toHaveBeenCalled();
    });

    test('still renders the edit trowser when hideViewSection is true and editing', () => {
      const { queryByTestId } = renderTimeSheetFields({
        hideViewSection: true,
        isTimeSheetEditing: true,
      });

      expect(GeneralSettingSection).not.toHaveBeenCalled();
      expect(queryByTestId('edit-time-sheet-field')).toBeInTheDocument();
    });

    test('renders neither section when hideViewSection is true and not editing', () => {
      const { queryByTestId } = renderTimeSheetFields({
        hideViewSection: true,
        isTimeSheetEditing: false,
      });

      expect(GeneralSettingSection).not.toHaveBeenCalled();
      expect(queryByTestId('edit-time-sheet-field')).not.toBeInTheDocument();
    });
  });
});
