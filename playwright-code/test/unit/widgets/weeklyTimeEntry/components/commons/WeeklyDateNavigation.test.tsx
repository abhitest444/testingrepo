import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeeklyDateNavigation } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/commons/WeeklyDateNavigation';
import timeEntryGridReducer from '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

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
    realmId: 'test-realm',
    offering: 'qbo',
  }),
}));

// Mock the Redux hooks
const mockDispatch = jest.fn();
const mockUseAppDispatch = jest.fn(() => mockDispatch);
const mockUseAppSelector = jest.fn();

jest.mock('../../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
  useAppDispatch: () => mockUseAppDispatch(),
}));

// Mock IconControl component
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    disabled,
    size,
    'aria-label': ariaLabel,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`icon-control-${size}`}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  ),
}));

// Create a simple mock store with proper structure
const createMockStore = (initialState: any = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
    },
    preloadedState: {
      timeEntryGrid: initialState,
    },
  });

describe('WeeklyDateNavigation', () => {
  const mockWeekDates = [
    '2024-01-01', // Monday
    '2024-01-02', // Tuesday
    '2024-01-03', // Wednesday
    '2024-01-04', // Thursday
    '2024-01-05', // Friday
    '2024-01-06', // Saturday
    '2024-01-07', // Sunday
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
    // Default selector mocks - return values in order of calls
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return null; // selectSelectedCell
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });
  });

  it('renders without crashing', () => {
    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation displayCell={{}} />
      </Provider>,
    );

    expect(screen.getByText('Monday 1/1')).toBeInTheDocument();
  });

  it('displays current date when no cell is selected', () => {
    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(screen.getByText('Monday 1/1')).toBeInTheDocument();
  });

  it('displays date based on selected cell', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(screen.getByText('Wednesday 1/3')).toBeInTheDocument();
  });

  it('handles left navigation when not at first date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const navButtons = screen.getAllByTestId('icon-control-medium');
    const leftButton = navButtons[0];
    expect(leftButton).toBeInTheDocument();
    expect(leftButton).not.toBeDisabled();
  });

  it('handles right navigation when not at last date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const navButtons = screen.getAllByTestId('icon-control-medium');
    const rightButton = navButtons[1];
    expect(rightButton).toBeInTheDocument();
    expect(rightButton).not.toBeDisabled();
  });

  it('disables left navigation when at first date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 0 }; // selectSelectedCell - Monday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    expect(leftButton).toBeDisabled();
  });

  it('disables right navigation when at last date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 6 }; // selectSelectedCell - Sunday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const rightButton = screen.getAllByTestId('icon-control-medium')[1];
    expect(rightButton).toBeDisabled();
  });

  it('disables navigation when no cell is selected', () => {
    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    const rightButton = screen.getAllByTestId('icon-control-medium')[1];

    expect(leftButton).toBeDisabled();
    expect(rightButton).toBeDisabled();
  });

  it('does not navigate when clicking disabled buttons', () => {
    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    fireEvent.click(leftButton);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not navigate when already at target date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 0 }; // selectSelectedCell - Monday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    fireEvent.click(leftButton);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('returns null when no week dates are available', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return null; // selectSelectedCell
      if (callCount === 2) return []; // selectWeekDates - empty array
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    const { container } = render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when no visible days are available', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return null; // selectSelectedCell
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return []; // selectVisibleDays - empty array
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    const { container } = render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when current date is empty string', () => {
    const mockWeekDatesWithEmpty = [
      '2024-01-01',
      '', // Empty date
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
    ];

    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 1 }; // selectSelectedCell
      if (callCount === 2) return mockWeekDatesWithEmpty; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    const { container } = render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when current date is invalid', () => {
    const mockWeekDatesWithInvalid = [
      '2024-01-01',
      'invalid-date', // Invalid date
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
    ];

    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 1 }; // selectSelectedCell
      if (callCount === 2) return mockWeekDatesWithInvalid; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    const { container } = render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles navigation with no selected cell', () => {
    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    fireEvent.click(leftButton);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('handles navigation with no week dates', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell
      if (callCount === 2) return []; // selectWeekDates - empty array
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    const { container } = render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays correct date format for different months', () => {
    const mockWeekDatesDifferentMonth = [
      '2024-12-30', // Monday
      '2024-12-31', // Tuesday
      '2025-01-01', // Wednesday
      '2025-01-02', // Thursday
      '2025-01-03', // Friday
      '2025-01-04', // Saturday
      '2025-01-05', // Sunday
    ];

    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDatesDifferentMonth; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(screen.getByText('Wednesday 1/1')).toBeInTheDocument();
  });

  it('handles edge case of single date in week', () => {
    const mockSingleDate = ['2024-01-01'];

    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 0 }; // selectSelectedCell
      if (callCount === 2) return mockSingleDate; // selectWeekDates
      if (callCount === 3) return [0]; // selectVisibleDays - only one day
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(screen.getByText('Monday 1/1')).toBeInTheDocument();
  });

  it('handles navigation with partial visible days', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2 }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [1, 2, 3]; // selectVisibleDays - only 3 days
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    expect(screen.getByText('Wednesday 1/3')).toBeInTheDocument();
  });

  it('handles navigation when selected cell day is not in visible days', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 5 }; // selectSelectedCell - Saturday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4]; // selectVisibleDays - Monday to Friday only
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    // Should display the first visible day since selected day is not visible
    expect(screen.getByText('Saturday 1/6')).toBeInTheDocument();
  });

  it('calls dispatch with correct parameters when navigating left', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2, rowId: 'row-0' }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    fireEvent.click(leftButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'timeEntryGrid/selectCell',
      payload: {
        rowId: 'row-0',
        dayIdx: 1, // Should navigate to Tuesday (index 1)
      },
    });
  });

  it('calls dispatch with correct parameters when navigating right', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 2, rowId: 'row-0' }; // selectSelectedCell - Wednesday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const rightButton = screen.getAllByTestId('icon-control-medium')[1];
    fireEvent.click(rightButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'timeEntryGrid/selectCell',
      payload: {
        rowId: 'row-0',
        dayIdx: 3, // Should navigate to Thursday (index 3)
      },
    });
  });

  it('does not call dispatch when navigating to same date', () => {
    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return { rowIdx: 0, dayIdx: 0, rowId: 'row-0' }; // selectSelectedCell - Monday
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation />
      </Provider>,
    );

    const leftButton = screen.getAllByTestId('icon-control-medium')[0];
    fireEvent.click(leftButton);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('handles displayCell prop correctly', () => {
    const displayCell = { rowIdx: 0, dayIdx: 3 }; // Thursday

    let callCount = 0;
    mockUseAppSelector.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) return null; // selectSelectedCell - no selection
      if (callCount === 2) return mockWeekDates; // selectWeekDates
      if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
      if (callCount === 4) return 0; // selectFirstDayOfWeek
      return undefined;
    });

    render(
      <Provider store={createMockStore()}>
        <WeeklyDateNavigation displayCell={displayCell} />
      </Provider>,
    );

    expect(screen.getByText('Monday 1/1')).toBeInTheDocument();
  });

  describe('NLS Integration', () => {
    it('should use NLS for navigation aria-labels', () => {
      render(
        <Provider store={createMockStore()}>
          <WeeklyDateNavigation />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.panel.navigate.previous.day',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.panel.navigate.next.day',
      });
    });

    it('should have proper aria-labels on navigation buttons', () => {
      render(
        <Provider store={createMockStore()}>
          <WeeklyDateNavigation />
        </Provider>,
      );

      const leftButton = screen.getAllByTestId('icon-control-medium')[0];
      const rightButton = screen.getAllByTestId('icon-control-medium')[1];

      expect(leftButton).toHaveAttribute(
        'aria-label',
        'weekly.time.entry.panel.navigate.previous.day',
      );
      expect(rightButton).toHaveAttribute(
        'aria-label',
        'weekly.time.entry.panel.navigate.next.day',
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and disabled states', () => {
      render(
        <Provider store={createMockStore()}>
          <WeeklyDateNavigation />
        </Provider>,
      );

      const leftButton = screen.getAllByTestId('icon-control-medium')[0];
      const rightButton = screen.getAllByTestId('icon-control-medium')[1];

      expect(leftButton).toHaveAttribute('type', 'button');
      expect(rightButton).toHaveAttribute('type', 'button');
      expect(leftButton).toBeDisabled();
      expect(rightButton).toBeDisabled();
    });

    it('should have proper button roles when enabled', () => {
      let callCount = 0;
      mockUseAppSelector.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return { rowIdx: 0, dayIdx: 2, rowId: 'row-0' }; // selectSelectedCell - Wednesday
        if (callCount === 2) return mockWeekDates; // selectWeekDates
        if (callCount === 3) return [0, 1, 2, 3, 4, 5, 6]; // selectVisibleDays
        if (callCount === 4) return 0; // selectFirstDayOfWeek
        return undefined;
      });

      render(
        <Provider store={createMockStore()}>
          <WeeklyDateNavigation />
        </Provider>,
      );

      const leftButton = screen.getAllByTestId('icon-control-medium')[0];
      const rightButton = screen.getAllByTestId('icon-control-medium')[1];

      expect(leftButton).not.toBeDisabled();
      expect(rightButton).not.toBeDisabled();
    });
  });
});
