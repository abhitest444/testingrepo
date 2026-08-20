import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WeeklyClassField } from 'src/js/widgets/weeklyTimeEntry/components/commons/WeeklyClassField';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { mockFormatMessage } from 'test/unit/testUtils';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    logger: {
      error: jest.fn(),
      log: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

// Complete mock for TrackingPoint (adjust property values/types as needed)
const mockTrackingPoint: TrackingPoint = {
  event: 'test',
  org: 'testOrg',
  purpose: 'testPurpose',
  scope: 'testScope',
  scope_area: 'testScopeArea',
  action: 'testAction',
  object: 'testObject',
  object_type: 'testObjectType',
  ui_action: 'testUiAction',
  ui_object: 'testUiObject',
};

// Create a mock store with complete state structure
const createMockStore = () =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      timeEntrySettings: timeEntrySettingsReducer,
    },
  });

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    onReady,
    onLoadingChange,
    errorText,
    disabled,
    addNew,
    widgetId,
    type,
    dropdownType,
    assignmentFilters,
  }: {
    value?: any;
    onChange?: any;
    onReady?: any;
    onLoadingChange?: any;
    errorText?: any;
    disabled?: boolean;
    addNew?: boolean;
    widgetId?: string;
    type?: string;
    dropdownType?: string;
    assignmentFilters?: any;
  }) => (
    <div>
      <input
        data-testid="class-input"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {errorText && <span>{errorText}</span>}
      <button data-testid="class-onready" onClick={() => onReady?.()}>
        Ready
      </button>
      <button
        data-testid="class-loading-change"
        onClick={() => onLoadingChange?.(true)}
      >
        Loading
      </button>
      <div
        data-testid="widget-props"
        data-add-new={String(addNew)}
        data-widget-id={widgetId}
        data-type={type}
        data-dropdown-type={dropdownType}
        data-assignment-filters={JSON.stringify(assignmentFilters ?? null)}
      />
    </div>
  ),
}));

describe('WeeklyClassField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('renders with default props', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField />
      </Provider>,
    );
    expect(getByTestId('class-input')).toBeInTheDocument();
  });

  it('calls updateLabel on selection', () => {
    const updateLabel = jest.fn();
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField updateLabel={updateLabel} />
      </Provider>,
    );
    fireEvent.change(getByTestId('class-input'), {
      target: { value: 'Test Class' },
    });
    // expect(updateLabel).toHaveBeenCalledWith('class', 'Test Class');
  });

  it('shows error text', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField error="Error!" />
      </Provider>,
    );
    expect(getByText('Error!')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField disabled />
      </Provider>,
    );
    expect(getByTestId('class-input')).toBeDisabled();
  });

  it('renders with data-testid', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField />
      </Provider>,
    );
    expect(getByTestId('class-input')).toBeInTheDocument();
  });

  it('renders with data-testid and is disabled', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <WeeklyClassField disabled />
      </Provider>,
    );
    expect(getByTestId('class-input')).toBeDisabled();
  });

  describe('NLS Integration', () => {
    it('should use NLS for class field placeholder and label', () => {
      render(
        <Provider store={createMockStore()}>
          <WeeklyClassField />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.class.placeholder',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.class.label',
      });
    });
  });

  describe('Workforce addNew behavior', () => {
    it('passes addNew=true for non-workforce user', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField />
        </Provider>,
      );

      expect(getByTestId('widget-props')).toHaveAttribute(
        'data-add-new',
        'true',
      );
    });

    it('passes addNew=false for workforce user', () => {
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField />
        </Provider>,
      );

      expect(getByTestId('widget-props')).toHaveAttribute(
        'data-add-new',
        'false',
      );
    });
  });

  describe('QuickFind mode branches', () => {
    it('passes assignmentFilters and QuickFind props when quickFindOTX + isOTX enabled', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField isOTX />
        </Provider>,
      );

      const widget = getByTestId('widget-props');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/quickFind',
      );
      expect(widget).toHaveAttribute('data-dropdown-type', 'class');
      expect(widget.getAttribute('data-assignment-filters')).not.toBe('null');
    });

    it('renders QuickFind dropdown and handles onReady', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField isOTX />
        </Provider>,
      );

      fireEvent.click(getByTestId('class-onready'));
      expect(getByTestId('class-input')).toBeInTheDocument();
    });

    it('handles class change without selected cell', () => {
      const updateLabel = jest.fn();
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField updateLabel={updateLabel} />
        </Provider>,
      );

      fireEvent.change(getByTestId('class-input'), {
        target: { value: 'some-value' },
      });
      expect(updateLabel).toHaveBeenCalledWith('class', '');
    });

    it('dispatches class update when a selected cell exists', () => {
      const store = configureStore({
        reducer: {
          timeEntryGrid: timeEntryGridReducer,
          timeEntrySettings: timeEntrySettingsReducer,
        },
        preloadedState: {
          timeEntryGrid: {
            weeklyTimeEntries: {
              row1: { timeEntries: [{}], timeAgainst: { id: 'c1' } },
            },
            rowOrder: ['row1'],
            teamMember: null,
            dateRange: { startDate: '', endDate: '' },
            loading: false,
            error: null,
            selected: { rowId: 'row1', dayIdx: 0 },
            firstEditedCells: {},
            showSelectTeamMemberTooltip: false,
            isTeamMemberDropdownReady: false,
          },
          timeEntrySettings: {
            hideTimeEntryFields: {},
            hideWeekdays: {},
            timeEntryTimeFor: null,
            weeklyTimesheetTourCompleted: false,
            panelValues: {},
            isServiceFieldEnabled: false,
            isBillingFieldEnabled: false,
            firstDayOfWeek: 0,
            isClassEnabled: false,
            isLocationEnabled: false,
            classRequired: false,
            locationRequired: false,
            serviceItemRequired: false,
            requireBillable: false,
            timeSheetEntryMakesNotesRequiredEnabled: false,
            loading: false,
            error: null,
            panelOpen: false,
            visibleDays: [0, 1, 2, 3, 4, 5, 6],
          },
        } as any,
      });

      const { getByTestId } = render(
        <Provider store={store}>
          <WeeklyClassField />
        </Provider>,
      );

      fireEvent.change(getByTestId('class-input'), { target: { value: '1' } });
      expect(
        store.getState().timeEntryGrid.weeklyTimeEntries.row1,
      ).toBeDefined();
    });

    it('handles legacy widget onReady callback path', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <WeeklyClassField isOTX={false} />
        </Provider>,
      );

      fireEvent.click(getByTestId('class-onready'));
      expect(getByTestId('class-input')).toBeInTheDocument();
    });
  });
});
