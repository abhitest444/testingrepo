import React from 'react';
import { render, screen } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';
import { TimeSheetTimeTrackingSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/timeSheetTimeTrackingSettings/TimeSheetTimeTrackingSettings';
import { useTimeTrackingSettingsContext } from 'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';

// Mock dependencies
jest.mock('react-hook-form', () => ({
  useFormContext: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection',
  () => ({
    GeneralSettingSection: jest.fn(() => <div>GeneralSettingSection</div>),
  }),
);

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent', () => ({
  ViewContent: jest.fn(() => <div>ViewContent</div>),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeActivitySettings/timeSheetTimeTrackingSettings/EditTimeSheetTimeTrackingSettings',
  () => ({
    EditTimeSheetTimeTrackingSettings: jest.fn(() => (
      <div>EditTimeSheetTimeTrackingSettings</div>
    )),
  }),
);

describe('TimeSheetTimeTrackingSettings Component', () => {
  const mockSetValue = jest.fn();
  const mockSetTimeSheetFields = jest.fn();
  const mockIntl = {
    formatMessage: jest.fn(({ id }) => id),
  };

  const mockContextValue = {
    QLData: {
      isServiceFieldEnabled: { version: '1', value: true },
      isBillingFieldEnabled: { version: '1', value: true },
      firstDayOfWeek: { version: '1', value: 1 },
      billingRateForTimeEnabled: { version: '1', value: true },
      timeTrackingSupported: { version: '1', value: true },
      transactionBillingForTimeEnabled: { version: '1', value: true },
      transactionTimeTrackingEnabled: { version: '1', value: true },
      useItemForTime: { version: '1', value: true },
    },
    isQLSettingsLoading: false,
    QLSettingsError: '',
  };

  beforeEach(() => {
    (useFormContext as jest.Mock).mockReturnValue({ setValue: mockSetValue });
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      mockContextValue,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onFormUpdate: jest.fn(),
    onFormCancel: jest.fn(),
    isTimeSheetTimeTrackingEdit: false,
    onSaveTimeTrackingSettings: () => jest.fn(),
    updateQLSettingsLoading: false,
    id: 'test-id',
    isFormEditable: true,
    isDataUpdating: false,
    timeSheetFieldSettingSection: 'time-settings.section.title.timesheet',
    timeSheetFields: {
      'time-settings.section.title.timesheet': [
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
        {
          id: 'timeTrackingTimeSheetBillable',
          key: 'timesheetTrackingBillable',
          title: 'location-settings.fields.timesheet-settings-billable',
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
    },
    setTimeSheetFields: mockSetTimeSheetFields,
    text: jest.fn(),
  };

  test('renders without crashing', () => {
    render(<TimeSheetTimeTrackingSettings {...defaultProps} />);
    expect(screen.getByText('GeneralSettingSection')).toBeInTheDocument();
  });

  test('updates fields and calls setValue on useEffect', () => {
    render(<TimeSheetTimeTrackingSettings {...defaultProps} />);
    expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', true);
    expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', true);
    expect(mockSetValue).toHaveBeenCalledWith(
      'billingRateForTimeEnabled',
      true,
    );
  });

  test('handles isQLSettingsLoading state', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      isQLSettingsLoading: true,
    });
    render(<TimeSheetTimeTrackingSettings {...defaultProps} />);
    expect(screen.getByText('GeneralSettingSection')).toBeInTheDocument();
  });

  test('sets billingRateForTimeEnabled to false when value is falsy', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        ...mockContextValue.QLData,
        billingRateForTimeEnabled: { version: '1', value: false },
      },
    });

    render(<TimeSheetTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith(
      'billingRateForTimeEnabled',
      false,
    );
    expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', true);
    expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', true);
  });

  test('defaults service and billable fields to false when their values are falsy', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        ...mockContextValue.QLData,
        isServiceFieldEnabled: { version: '1', value: false },
        isBillingFieldEnabled: { version: '1', value: false },
      },
    });

    render(<TimeSheetTimeTrackingSettings {...defaultProps} />);

    expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', false);
    expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', false);

    expect(mockSetTimeSheetFields).toHaveBeenCalled();
    const updatedFields =
      defaultProps.timeSheetFields['time-settings.section.title.timesheet'];
    const serviceField = updatedFields.find(
      (field) =>
        mockIntl.formatMessage({ id: field.title }) ===
        mockIntl.formatMessage({
          id: 'location-settings.fields.timesheet-settings-service',
        }),
    );
    const billableField = updatedFields.find(
      (field) =>
        mockIntl.formatMessage({ id: field.title }) ===
        mockIntl.formatMessage({
          id: 'location-settings.fields.timesheet-settings-billable',
        }),
    );
    expect(serviceField?.value).toBe('Off');
    expect(billableField?.value).toBe('Off');
  });

  test('handles QLSettingsError and resets field values', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Some error occurred',
      isQLSettingsLoading: false,
    });

    const propsWithError = {
      ...defaultProps,
      timeSheetFields: {
        'time-settings.section.title.timesheet': [
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
            value: 'On',
            subFields: [],
          },
          {
            id: 'timeTrackingTimeSheetBillable',
            key: 'timesheetTrackingBillable',
            title: 'location-settings.fields.timesheet-settings-billable',
            ariaLabel: '',
            tooltipText: '',
            detail: {
              title: '',
              subtitle: '',
              ariaLabel: '',
            },
            disabled: false,
            value: 'On',
            subFields: [],
          },
        ],
      },
    };

    render(<TimeSheetTimeTrackingSettings {...propsWithError} />);

    expect(mockSetValue).toHaveBeenCalledWith('isServiceFieldEnabled', false);
    expect(mockSetValue).toHaveBeenCalledWith('isBillingFieldEnabled', false);
    expect(mockSetValue).toHaveBeenCalledWith(
      'billingRateForTimeEnabled',
      false,
    );

    expect(mockSetTimeSheetFields).toHaveBeenCalled();
    const updatedFields =
      propsWithError.timeSheetFields['time-settings.section.title.timesheet'];
    expect(updatedFields[0].value).toBe('Off');
    expect(updatedFields[1].value).toBe('Off');
  });
});
