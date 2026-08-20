import React from 'react';
import { render, screen } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { buildSandbox, useSandbox } from '@payroll/quicksand';
import { canEditPreference } from 'src/js/service/utils/sandboxUtils';

import * as TimeTrackingSettingsContext from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import * as useTimeTrackingSettingsForm from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { GeneralTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/generalTimeTrackingSettings/GeneralTimeTrackingSettings';

// Mock @payroll/quicksand's useIntl and useSandbox hooks
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: jest.fn(),
}));

// Mock dependencies
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection',
  () => ({
    GeneralSettingSection: jest.fn(({ ViewContent }) => ViewContent),
  }),
);

// Mock the canEditPreference utility
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  canEditPreference: jest.fn(),
}));

// Mock sandbox
const mockSandbox = buildSandbox();

// Add required mock implementations
mockSandbox.extensions.qbo.context.getCompanyL10nInfo = jest
  .fn()
  .mockReturnValue({
    region: 'US',
  });
mockSandbox.appContext.getAppInfo = jest
  .fn()
  .mockReturnValue({ appName: 'quickbooks' });
mockSandbox.featureFlags.isFeatureEnabled = jest.fn().mockReturnValue(true);

// Mock context values
const mockQLData = {
  isServiceFieldEnabled: { version: '1', value: false },
  isBillingFieldEnabled: { version: '1', value: false },
  firstDayOfWeek: { version: '1', value: 0 },
  billingRateForTimeEnabled: { version: '0', value: false },
  timeTrackingSupported: { version: '0', value: false },
  transactionBillingForTimeEnabled: { version: '0', value: false },
  transactionTimeTrackingEnabled: { version: '0', value: false },
  useItemForTime: { version: '0', value: false },
};

const mockContextValue = {
  QLData: mockQLData,
  isQLSettingsLoading: false,
  QLSettingsError: undefined,
  v3PreferencesData: {},
  v3PreferencesLoading: false,
  v3PreferencesError: false,
  QLSettingsRefetch: jest.fn(),
  refetchQlSettings: jest.fn(),
  text: (id: string) => id,
  entitlements: [],
  entitlementsLoading: false,
  sandbox: mockSandbox,
  isFormEditable: true,
  errorMessage: '',
  isRenderTimeEntry: false,
  reRenderTimeEntrySetting: jest.fn(),
  updateErrorMessage: jest.fn(),
  timeEntryNewBadgeVisibleFor: {
    timeTrackingVisibilityEndDate: '',
    timeSheetVisibilityEndDate: '',
    notificationVisibilityEndDate: '',
    breaksVisibilityEndDate: '',
    customFieldsVisibilityEndDate: '',
    overtimeVisibilityEndDate: '',
    geoLocationsVisibilityEndDate: '',
    approvalsVisibilityEndDate: '',
    geofenceVisibilityEndDate: '',
    newTimesheetVisibilityEndDate: '',
    newCustomFieldsVisibilityEndDate: '',
    schedulesVisibilityEndDate: '',
  },
  uxPreferenceLoading: false,
  isUKLocale: false,
  urlParams: null,
  isExported: false,
  isR4AssignmentsEnabled: false,
  isR4AssignmentsFlagLoading: false,
  sectionPath: {
    segments: [],
    section: null,
    subsection: null,
    entityId: null,
    extraParam: null,
  },
};

describe('GeneralTimeTrackingSettings Component', () => {
  const mockSetValue = jest.fn();
  const mockGeneralFields = {
    section1: [
      {
        id: 'firstDayOfWeek',
        key: 'firstDayOfWeek',
        title: 'location-settings.fields.general-settings',
        ariaLabel: 'First day of week',
        tooltipText: 'Select first day of week',
        detail: {
          title: 'First Day of Week',
          subtitle: 'Select the first day of the week',
          ariaLabel: 'First day of week selection',
        },
        disabled: false,
        value: 'monday',
        subFields: [],
        isEditable: true,
        isVisible: true,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue({
      setValue: mockSetValue,
    });
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (canEditPreference as jest.Mock).mockReturnValue(true);
    jest
      .spyOn(TimeTrackingSettingsContext, 'useTimeTrackingSettingsContext')
      .mockReturnValue(mockContextValue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onFormUpdate: jest.fn(),
    onFormCancel: jest.fn(),
    isGeneralTimeTrackingEdit: false,
    onSaveTimeTrackingSettings: jest.fn(),
    id: 'general-settings',
    isFormEditable: true,
    isDataUpdating: false,
    generalFieldSettingSection: 'General Settings',
    generalFields: mockGeneralFields,
    setGeneralFields: jest.fn(),
  };

  test('renders without crashing', () => {
    render(<GeneralTimeTrackingSettings {...defaultProps} />);
    expect(
      screen.getByText('location-settings.fields.general-settings'),
    ).toBeInTheDocument();
  });

  test('handles QL settings error by resetting first day of week to sunday', () => {
    const contextWithError = {
      ...mockContextValue,
      QLSettingsError: 'Error loading settings',
      isQLSettingsLoading: false,
      isExported: false,
    };

    jest
      .spyOn(TimeTrackingSettingsContext, 'useTimeTrackingSettingsContext')
      .mockReturnValue(contextWithError);

    render(<GeneralTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', 'sunday');
    expect(defaultProps.setGeneralFields).toHaveBeenCalledWith({
      section1: [
        {
          ...mockGeneralFields.section1[0],
          value: 'sunday',
        },
      ],
    });
  });

  test('initializes form with integer QL data value', () => {
    render(<GeneralTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '0');
    expect(defaultProps.setGeneralFields).toHaveBeenCalledWith({
      section1: [
        {
          ...mockGeneralFields.section1[0],
          value: 'sunday',
        },
      ],
    });
  });

  test('initializes form with string QL data value', () => {
    const contextWithStringValue = {
      ...mockContextValue,
      QLData: {
        ...mockQLData,
        firstDayOfWeek: { version: '1', value: 0 },
      },
      isExported: false,
    };

    jest
      .spyOn(TimeTrackingSettingsContext, 'useTimeTrackingSettingsContext')
      .mockReturnValue(contextWithStringValue);

    render(<GeneralTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '0');
    expect(defaultProps.setGeneralFields).toHaveBeenCalledWith({
      section1: [
        {
          ...mockGeneralFields.section1[0],
          value: 'sunday',
        },
      ],
    });
  });

  test('handles non-integer firstDayOfWeek value', () => {
    const contextWithNonIntegerValue = {
      ...mockContextValue,
      QLData: {
        ...mockQLData,
        firstDayOfWeek: { version: '1', value: 1.5 },
      },
      isExported: false,
    };

    jest
      .spyOn(TimeTrackingSettingsContext, 'useTimeTrackingSettingsContext')
      .mockReturnValue(contextWithNonIntegerValue);

    render(<GeneralTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', 1.5);
    expect(defaultProps.setGeneralFields).toHaveBeenCalledWith({
      section1: [
        {
          ...mockGeneralFields.section1[0],
          value: 'sunday',
        },
      ],
    });
  });

  test('falls back to sunday when getWeekDay returns undefined', () => {
    jest
      .spyOn(useTimeTrackingSettingsForm, 'getWeekDay')
      .mockReturnValue(undefined);

    const contextWithInvalidValue = {
      ...mockContextValue,
      QLData: {
        ...mockQLData,
        firstDayOfWeek: { version: '1', value: 999 },
      },
      isExported: false,
    };

    jest
      .spyOn(TimeTrackingSettingsContext, 'useTimeTrackingSettingsContext')
      .mockReturnValue(contextWithInvalidValue);

    render(<GeneralTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('firstDayOfWeek', '999');
    expect(defaultProps.setGeneralFields).toHaveBeenCalledWith({
      section1: [
        {
          ...mockGeneralFields.section1[0],
          value: 'sunday',
        },
      ],
    });
  });
});
