import React from 'react';
import dayjs from 'dayjs';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeekNavigator } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryHeader/WeekNavigator';
import {
  useAppDispatch,
  useAppSelector,
} from '../../../../../../src/js/widgets/weeklyTimeEntry/store';

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
    get: jest.fn(),
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
  }),
}));

// Mock the store hooks
jest.mock('../../../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock the store actions
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice',
  () => ({
    setDateRange: jest.fn((payload) => ({ type: 'setDateRange', payload })),
  }),
);

// Mock the store selectors
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/store/selectors',
  () => ({
    selectDateRange: jest.fn(),
  }),
);

// Mock the design system components
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: any) => <div data-testid="b2-text">{children}</div>,
  Demi: ({ children }: any) => <span data-testid="demi-text">{children}</span>,
}));

jest.mock('@ids-ts/date-picker', () => ({
  __esModule: true,
  default: ({ onChange, id, 'aria-hidden': ariaHidden }: any) => (
    <input
      data-testid="date-picker"
      id={id}
      aria-hidden={ariaHidden}
      onChange={(e) => onChange(e)}
    />
  ),
}));

describe('WeekNavigator', () => {
  const mockDispatch = jest.fn();
  const mockDateRange = {
    start: '2024-01-01',
    end: '2024-01-07',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);

    (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useAppSelector as jest.Mock).mockReturnValue(mockDateRange);
  });

  it('should render the week navigator with formatted date range', () => {
    render(<WeekNavigator />);

    expect(
      screen.getByLabelText('weekly.time.entry.previous.week'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('weekly.time.entry.next.week'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();

    // Check formatted date range
    expect(screen.getByText('Jan 1 - 7, 2024')).toBeInTheDocument();
  });

  it('should display "Select a date range" when no dates are provided', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ start: null, end: null });

    render(<WeekNavigator />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.select.date.range',
    });
    expect(
      screen.getByText('weekly.time.entry.select.date.range'),
    ).toBeInTheDocument();
  });

  it('should navigate to previous week when previous button is clicked', () => {
    const mockOnWeekChange = jest.fn();

    render(<WeekNavigator onWeekChange={mockOnWeekChange} />);

    fireEvent.click(screen.getByLabelText('weekly.time.entry.previous.week'));

    const expectedStart = dayjs('2024-01-01')
      .subtract(1, 'week')
      .startOf('week')
      .format('YYYY-MM-DD');
    const expectedEnd = dayjs('2024-01-01')
      .subtract(1, 'week')
      .endOf('week')
      .format('YYYY-MM-DD');

    expect(mockOnWeekChange).toHaveBeenCalledWith({
      start: expectedStart,
      end: expectedEnd,
    });
  });

  it('should navigate to next week when next button is clicked', () => {
    const mockOnWeekChange = jest.fn();

    render(<WeekNavigator onWeekChange={mockOnWeekChange} />);

    fireEvent.click(screen.getByLabelText('weekly.time.entry.next.week'));

    const expectedStart = dayjs('2024-01-01')
      .add(1, 'week')
      .startOf('week')
      .format('YYYY-MM-DD');
    const expectedEnd = dayjs('2024-01-01')
      .add(1, 'week')
      .endOf('week')
      .format('YYYY-MM-DD');

    expect(mockOnWeekChange).toHaveBeenCalledWith({
      start: expectedStart,
      end: expectedEnd,
    });
  });

  it('should handle date change from date picker', () => {
    const mockOnWeekChange = jest.fn();

    render(<WeekNavigator onWeekChange={mockOnWeekChange} />);

    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, {
      target: { value: '2024-02-15' } as HTMLInputElement,
    });

    const expectedStart = dayjs('2024-02-15')
      .startOf('week')
      .format('YYYY-MM-DD');
    const expectedEnd = dayjs('2024-02-15').endOf('week').format('YYYY-MM-DD');

    expect(mockOnWeekChange).toHaveBeenCalledWith({
      start: expectedStart,
      end: expectedEnd,
    });
  });

  it('should not dispatch action when date picker value is empty', () => {
    const {
      setDateRange,
    } = require('../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice');
    const mockOnWeekChange = jest.fn();

    render(<WeekNavigator onWeekChange={mockOnWeekChange} />);

    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, {
      target: { value: '' } as HTMLInputElement,
    });

    expect(setDateRange).not.toHaveBeenCalled();
    expect(mockOnWeekChange).not.toHaveBeenCalled();
  });

  it('should format date range correctly for different months', () => {
    (useAppSelector as jest.Mock).mockReturnValue({
      start: '2024-12-30',
      end: '2025-01-05',
    });

    render(<WeekNavigator />);

    expect(screen.getByText('Dec 30 - Jan 5, 2025')).toBeInTheDocument();
  });

  it('should format date range correctly for same month', () => {
    (useAppSelector as jest.Mock).mockReturnValue({
      start: '2024-01-01',
      end: '2024-01-07',
    });

    render(<WeekNavigator />);

    expect(screen.getByText('Jan 1 - 7, 2024')).toBeInTheDocument();
  });

  it('should use NLS for aria labels', () => {
    render(<WeekNavigator />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.previous.week',
    });
    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.next.week',
    });
  });

  it('should use NLS for select date range message', () => {
    (useAppSelector as jest.Mock).mockReturnValue({ start: null, end: null });

    render(<WeekNavigator />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'weekly.time.entry.select.date.range',
    });
  });

  it('should work without onWeekChange prop', () => {
    const {
      setDateRange,
    } = require('../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice');

    render(<WeekNavigator />);

    fireEvent.click(screen.getByLabelText('weekly.time.entry.previous.week'));

    const expectedStart = dayjs('2024-01-01')
      .subtract(1, 'week')
      .startOf('week')
      .format('YYYY-MM-DD');
    const expectedEnd = dayjs('2024-01-01')
      .subtract(1, 'week')
      .endOf('week')
      .format('YYYY-MM-DD');

    expect(setDateRange).toHaveBeenCalledWith({
      start: expectedStart,
      end: expectedEnd,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setDateRange',
      payload: {
        start: expectedStart,
        end: expectedEnd,
      },
    });

    // Verify that all validation clearing actions were called
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearValidationError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearSaveError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearTimeEntriesError',
    });
  });

  it('clears validation errors when navigating to next week', () => {
    render(<WeekNavigator />);

    const nextWeekButton = screen.getByLabelText('weekly.time.entry.next.week');
    fireEvent.click(nextWeekButton);

    // Verify that setDateRange was called with the correct dates
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setDateRange',
      payload: {
        start: '2024-01-07',
        end: '2024-01-13',
      },
    });

    // Verify that all validation clearing actions were called
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearValidationError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearSaveError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearTimeEntriesError',
    });
  });

  it('clears validation errors when navigating to previous week', () => {
    render(<WeekNavigator />);

    const prevWeekButton = screen.getByLabelText(
      'weekly.time.entry.previous.week',
    );
    fireEvent.click(prevWeekButton);

    // Verify that setDateRange was called with the correct dates
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setDateRange',
      payload: {
        start: '2023-12-24',
        end: '2023-12-30',
      },
    });

    // Verify that all validation clearing actions were called
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearValidationError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearSaveError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearTimeEntriesError',
    });
  });

  it('clears validation errors when date picker changes', () => {
    render(<WeekNavigator />);

    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2024-02-15' } });

    // Verify that setDateRange was called with the correct dates
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setDateRange',
      payload: {
        start: '2024-02-11',
        end: '2024-02-17',
      },
    });

    // Verify that all validation clearing actions were called
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearValidationError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearSaveError',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'validation/clearTimeEntriesError',
    });
  });
});
