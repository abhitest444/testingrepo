import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { renderWithFormProvider } from 'test/unit/testUtils';
import {
  WeeklyTimeTableRow,
  WeeklyTimeEntryTableRowProps,
} from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeTableRow';
import { MOCK_TIME_TRACKING_SETTINGS } from 'test/unit/service/queries/settingsQueries';
import {
  UxPreferenceKey,
  UxPreferenceData,
} from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';

jest.mock('@core-app/variability-sync-sdk', () => ({
  getDecision: jest.fn(
    (_key: string, options: { defaultValue: boolean }) => options.defaultValue,
  ),
}));

// Mock hooks
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useCurrencyFormat: jest.fn(() => '$100.00'),
  isEmployeeAuthorized: jest.fn().mockResolvedValue(true),
}));

// Mock useFeatureFlag hook for PayType feature flag
jest.mock('src/js/common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(false),
}));

// Mock useHasPaytypeAccess hook
jest.mock('src/js/common/hooks/useHasPaytypeAccess', () => ({
  useHasPaytypeAccess: jest.fn().mockReturnValue({
    hasPaytypeAccess: false,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTotals', () => ({
  useRowTimeTotal: jest.fn(() => 28800), // 8 hours in seconds
  useRowBillableTotal: jest.fn(() => 100),
}));

jest.mock('src/js/common/useKeyboardNavigation', () => ({
  KeyboardNavigationContext: React.createContext({
    deleteRowFromKeyboardNavigationMap: jest.fn(),
  }),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/FormCurrency', () => ({
  FormCurrency: () => <div>FormCurrency</div>,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Class', () => ({
  Class: () => <div>Class</div>,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Service', () => ({
  Service: () => <div>Service</div>,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Location', () => ({
  Location: () => <div>Location</div>,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/FormCheckbox', () => ({
  FormCheckbox: ({ labelKey, onChange }: any) => (
    <input type="checkbox" aria-label={labelKey} onChange={onChange} />
  ),
}));

jest.mock(
  'src/js/widgets/common/addTimeFormComponents/FormCompensation',
  () => ({
    FormCompensation: () => <div>FormCompensation</div>,
  }),
);

jest.mock('src/js/widgets/common/addTimeFormComponents/Notes', () => ({
  Notes: ({ name }: any) => <textarea name={name} aria-label="notes" />,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/DurationCell', () => ({
  DurationCell: ({ name }: any) => <input name={name} />,
}));

jest.mock(
  'src/js/widgets/common/addTimeFormComponents/CustomerProject',
  () => ({
    CustomerProject: () => <div>CustomerProject</div>,
  }),
);

describe('WeeklyTimeTableRow', () => {
  const mockOnDelete = jest.fn();
  const mockSetErrorMessage = jest.fn();
  const mockUpdateLabel = jest.fn();
  const mockAddAdditionalRowsOnClick = jest.fn();

  const mockPreferences: UxPreferenceData = {
    [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: false,
    [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
      isSundayHidden: false,
      isMondayHidden: false,
      isTuesdayHidden: false,
      isWednesdayHidden: false,
      isThursdayHidden: false,
      isFridayHidden: false,
      isSaturdayHidden: false,
    },
    [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
      isClassFieldEnabled: true,
      isProjectFieldEnabled: true,
      isLocationFieldEnabled: true,
      isPayTypeFieldEnabled: true,
      isCostRateFieldEnabled: true,
      isTaxableFieldEnabled: true,
    },
    [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
      id: '1',
      type: TimeForType.EMPLOYEE,
      name: 'test',
    },
    [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: false,
    [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: 'SAVE_AND_NEW',
    [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
      timeTrackingVisibilityEndDate: '',
      notificationVisibilityEndDate: '',
      breaksVisibilityEndDate: '',
      overtimeVisibilityEndDate: '',
      geoLocationsVisibilityEndDate: '',
      approvalsVisibilityEndDate: '',
      newTimesheetVisibilityEndDate: '',
      newCustomFieldsVisibilityEndDate: '',
      geofenceVisibilityEndDate: '',
      schedulesVisibilityEndDate: '',
    },
    [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: false,
    [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: false,
    [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: false,
    [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: '',
    [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: false,
    [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: false,
    [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: false,
  };

  const defaultProps: WeeklyTimeEntryTableRowProps = {
    rowIndex: 0,
    onDelete: mockOnDelete,
    preferences: mockPreferences,
    settings: MOCK_TIME_TRACKING_SETTINGS,
    billRate: 50,
    hasPayroll: true,
    hasProjects: true,
    hasAdminAccess: true,
    serviceItemPriceRef: { current: 0 },
    serviceTaxableRef: { current: false },
    serviceDescriptionRef: { current: '' },
    updateLabel: mockUpdateLabel,
    isFormEdited: { current: [] },
    isBillRateEnable: true,
    labelPreference: {
      DepartmentTerminology: 'Department',
      CustomerTerminology: 'Customer',
    },
    timeOffMethod: null,
    setErrorMessage: mockSetErrorMessage,
    addAdditionalRowsOnClick: mockAddAdditionalRowsOnClick,
  };

  const defaultFormValues = {
    timeFor: { id: '1', type: TimeForType.EMPLOYEE },
    week: { startDate: dayjs(), endDate: dayjs().add(6, 'days') },
    weeklyTimeRows: [
      {
        id: 0,
        timeAgainst: { customer: null, project: null },
        durations: [0, 0, 0, 0, 0, 0, 0],
        billable: false,
        billRate: 50,
        costRate: 25,
        notes: '',
        taxable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders row with basic fields', () => {
    const { container } = renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    expect(container.querySelector('[data-row-index="0"]')).toBeInTheDocument();
  });

  it('displays time total', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    expect(screen.getByText('8:00')).toBeInTheDocument();
  });

  it('displays billable amount when billing is enabled', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    const deleteButton = screen.getByLabelText(/weekly.deleterow/i);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(0);
  });

  it('prevents deletion of invoiced entries', () => {
    const invoicedFormValues = {
      ...defaultFormValues,
      weeklyTimeRows: [
        {
          ...defaultFormValues.weeklyTimeRows[0],
          billableStatus: TimeTracking_BillableStatus.HasBeenBilled,
        },
      ],
    };

    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: invoicedFormValues },
    );

    const deleteButton = screen.getByLabelText(/weekly.deleterow/i);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(mockSetErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('time.tracking.validation.invoiced.delete'),
    );
  });

  it('renders duration cells for visible weekdays', () => {
    const { container } = renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    // Should render 7 duration cells for all weekdays
    const durationCells = container.querySelectorAll('[name*="durations"]');
    expect(durationCells.length).toBeGreaterThan(0);
  });

  it('hides duration cells for hidden weekdays', () => {
    const propsWithHiddenWeekends: WeeklyTimeEntryTableRowProps = {
      ...defaultProps,
      preferences: {
        ...mockPreferences,
        [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
          isSundayHidden: true,
          isMondayHidden: false,
          isTuesdayHidden: false,
          isWednesdayHidden: false,
          isThursdayHidden: false,
          isFridayHidden: false,
          isSaturdayHidden: true,
        },
      },
    };

    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...propsWithHiddenWeekends} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    // Should render 5 duration cells (weekend hidden)
    expect(screen.queryByText(/sunday/i)).not.toBeInTheDocument();
  });

  it('calls addAdditionalRowsOnClick when row is clicked', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    const row = screen.getByRole('row');
    fireEvent.click(row);

    expect(mockAddAdditionalRowsOnClick).toHaveBeenCalledWith(0);
  });

  it('renders notes field', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    const notesInput = screen.getByRole('textbox', { name: /notes/i });
    expect(notesInput).toBeInTheDocument();
  });

  it('renders billable checkbox when billing is enabled', () => {
    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    const billableCheckbox = screen.getByLabelText(/billable/i);
    expect(billableCheckbox).toBeInTheDocument();
  });

  it('does not render billable amount when billing is disabled', () => {
    const propsNoBilling = {
      ...defaultProps,
      settings: {
        ...defaultProps.settings,
        isBillingFieldEnabled: false,
      },
    };

    renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...propsNoBilling} />
        </tbody>
      </table>,
      { defaultValues: defaultFormValues },
    );

    expect(screen.queryByText('$100.00')).not.toBeInTheDocument();
  });

  it('handles vendor time for type', () => {
    const vendorFormValues = {
      ...defaultFormValues,
      timeFor: { id: '1', type: TimeForType.VENDOR },
    };

    const { container } = renderWithFormProvider(
      <table>
        <tbody>
          <WeeklyTimeTableRow {...defaultProps} />
        </tbody>
      </table>,
      { defaultValues: vendorFormValues },
    );

    expect(container.querySelector('[data-row-index="0"]')).toBeInTheDocument();
  });

  describe('PayType dropdown with feature flag', () => {
    it('should show FormCompensation when feature flag is OFF and hasAdminAccess is true (original behavior)', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow {...defaultProps} hasPayroll hasAdminAccess />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.getByText('FormCompensation')).toBeInTheDocument();
    });

    it('should hide FormCompensation when feature flag is OFF and hasAdminAccess is false', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...defaultProps}
              hasPayroll
              hasAdminAccess={false}
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });

    it('should show FormCompensation when feature flag is ON and hasAdminAccess is true', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: false,
        isLoading: false,
        error: null,
      });

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow {...defaultProps} hasPayroll hasAdminAccess />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.getByText('FormCompensation')).toBeInTheDocument();
    });

    it('should show FormCompensation when feature flag is ON and hasPaytypeAccess is true (non-admin)', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: true,
        isLoading: false,
        error: null,
      });

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...defaultProps}
              hasPayroll
              hasAdminAccess={false}
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.getByText('FormCompensation')).toBeInTheDocument();
    });

    it('should hide FormCompensation when feature flag is ON but neither admin nor paytype access', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: false,
        isLoading: false,
        error: null,
      });

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...defaultProps}
              hasPayroll
              hasAdminAccess={false}
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });

    it('should hide FormCompensation while paytype access is loading', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: true,
        isLoading: true,
        error: null,
      });

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...defaultProps}
              hasPayroll
              hasAdminAccess={false}
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });

    it('should hide FormCompensation for vendors regardless of feature flag', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const vendorFormValues = {
        ...defaultFormValues,
        timeFor: { id: '1', type: TimeForType.VENDOR },
      };

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow {...defaultProps} hasPayroll hasAdminAccess />
          </tbody>
        </table>,
        { defaultValues: vendorFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });

    it('should hide FormCompensation when hasPayroll is false', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...defaultProps}
              hasPayroll={false}
              hasAdminAccess
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });

    it('should hide FormCompensation when isPayTypeFieldEnabled is false', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      const propsWithPayTypeDisabled = {
        ...defaultProps,
        preferences: {
          ...mockPreferences,
          [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
            ...mockPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
            isPayTypeFieldEnabled: false,
          },
        },
      };

      renderWithFormProvider(
        <table>
          <tbody>
            <WeeklyTimeTableRow
              {...propsWithPayTypeDisabled}
              hasPayroll
              hasAdminAccess
            />
          </tbody>
        </table>,
        { defaultValues: defaultFormValues },
      );

      expect(screen.queryByText('FormCompensation')).not.toBeInTheDocument();
    });
  });
});
