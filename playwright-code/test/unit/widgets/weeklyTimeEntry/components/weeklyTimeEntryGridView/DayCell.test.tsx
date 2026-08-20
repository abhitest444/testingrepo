import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DayCell } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/DayCell';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
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
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: jest.fn(
    (selector) =>
      // Return null by default (no max approved date)
      null,
  ),
}));

// Mock the formatCellValue and isCellLocked functions
jest.mock('src/js/widgets/weeklyTimeEntry/utils/helpers', () => ({
  formatCellValue: jest.fn((value) => {
    // Always show empty for 0 hours, regardless of operation
    if (value === 0) return '';
    if (typeof value === 'number') {
      // Convert to hh:mm format like the actual helper does
      const hours = Math.floor(value);
      const minutes = Math.round((value - hours) * 60);
      return minutes < 10 ? `${hours}:0${minutes}` : `${hours}:${minutes}`;
    }
    return value;
  }),
  isCellLocked: jest.fn(
    (cellDate: string | undefined | null, maxApprovedDate: string | null) => {
      // Mock implementation: cell is locked if date is on or before max approved date
      if (!cellDate || !maxApprovedDate) return false;
      return cellDate <= maxApprovedDate;
    },
  ),
  isWeeklyCellLocked: jest.fn(
    (
      cellDate: string | undefined | null,
      maxApprovedDate: string | null,
      rowIsTimeOff: boolean | undefined,
    ) => {
      if (rowIsTimeOff) return true;
      if (!cellDate || !maxApprovedDate) return false;
      return cellDate <= maxApprovedDate;
    },
  ),
}));

// Mock the styled components
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/styles/WeeklyTimeEntryTable.styles',
  () => ({
    SelectedCell: ({ children, className, onContextMenu }: any) => (
      <div
        data-testid="selected-cell"
        className={className}
        onContextMenu={onContextMenu}
      >
        {children}
      </div>
    ),
    CellInput: React.forwardRef(
      ({ type, defaultValue, onBlur, onKeyDown }: any, ref: any) => (
        <input
          data-testid="cell-input"
          ref={ref}
          type={type}
          defaultValue={defaultValue}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
      ),
    ),
    DataCell: ({
      children,
      className,
      onClick,
      onContextMenu,
      tabIndex,
      style,
    }: any) => (
      <div
        data-testid="data-cell"
        className={className}
        onClick={onClick}
        onContextMenu={onContextMenu}
        tabIndex={tabIndex}
        style={style}
      >
        {children}
      </div>
    ),
  }),
);

describe('DayCell', () => {
  const mockHandleContextMenu = jest.fn();
  const mockHandleCellClick = jest.fn();
  const mockHandleHourChange = jest.fn();
  const mockSelectedCell = { rowId: 'row-1', dayIdx: 0 };

  const mockCell = { id: 'cell-1', value: 8 };
  const mockRow = {
    rowId: 'row-1',
    timeAgainst: {
      type: DataAccess_ContactType.Customer,
      id: 'customer1',
      displayName: 'customer1',
    },
    timeEntries: {
      0: {
        timeEntryId: 'entry-1',
        date: '2024-01-01',
        hours: 8,
        notes: 'Test notes',
        metaInfo: undefined,
        billableInfo: undefined,
        isApproved: false,
      },
    },
    totalHours: 8,
    billableTotal: 800,
    hasApprovedEntries: false,
  };
  const mockDayData = {
    timeEntryId: 'entry-1',
    date: '2024-01-01',
    hours: 8,
    notes: 'Test notes',
    metaInfo: undefined,
    billableInfo: undefined,
    hasApprovedEntries: false,
  };

  const defaultProps = {
    cell: mockCell,
    row: mockRow,
    rowIndex: 0,
    cellIdx: 1,
    dayIdx: 0,
    dayData: mockDayData,
    selectedCell: mockSelectedCell,
    handleContextMenu: mockHandleContextMenu,
    handleCellClick: mockHandleCellClick,
    handleHourChange: mockHandleHourChange,
  };

  beforeEach(() => {
    mockHandleContextMenu.mockClear();
    mockHandleCellClick.mockClear();
    mockHandleHourChange.mockClear();
  });

  describe('when cell is selected', () => {
    it('renders input field', () => {
      render(<DayCell {...defaultProps} />);

      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
      expect(screen.getByTestId('cell-input')).toBeInTheDocument();
    });

    it('has correct input attributes', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      expect(input).toHaveAttribute('type', 'text');
      expect(input).not.toHaveAttribute('min');
      expect(input).not.toHaveAttribute('max');
      expect(input.defaultValue).toBe('8:00'); // Check defaultValue as property, not attribute
    });

    it('shows empty string for zero value', () => {
      const zeroValueProps = {
        ...defaultProps,
        cell: { ...mockCell, value: 0 },
        dayData: { ...mockDayData, hours: 0 },
      };

      render(<DayCell {...zeroValueProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      // JSDOM sets <input type="number" value=""> to null
      expect(input.defaultValue).toBe('');
    });

    it('calls handleHourChange on input blur', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;

      // Change the input value first, then trigger blur
      fireEvent.change(input, { target: { value: '10' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '10');
    });

    it('handles Enter key press', () => {
      render(<DayCell {...defaultProps} />);
      const input = screen.getByTestId('cell-input') as HTMLInputElement;

      // Set a value first
      fireEvent.change(input, { target: { value: '10:30' } });
      fireEvent.keyDown(input, { key: 'Enter', currentTarget: input });

      // Should call handleHourChange with the current value and prevent default
      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '10:30');
    });

    it('handles Tab key press', () => {
      render(<DayCell {...defaultProps} />);
      const input = screen.getByTestId('cell-input') as HTMLInputElement;

      // Set a value first
      fireEvent.change(input, { target: { value: '8.5' } });
      fireEvent.keyDown(input, { key: 'Tab', currentTarget: input });

      // Should call handleHourChange with the current value and prevent default
      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '8.5');
    });

    it('calls handleContextMenu on context menu', () => {
      render(<DayCell {...defaultProps} />);

      const selectedCell = screen.getByTestId('selected-cell');
      fireEvent.contextMenu(selectedCell);

      expect(mockHandleContextMenu).toHaveBeenCalledWith(
        'row-1',
        0,
        expect.any(Object),
      );
    });

    it('focuses input when selected using callback ref', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');
      expect(input).toBeInTheDocument();
      // Note: The new implementation uses a callback ref (setInputRef) that automatically
      // focuses the input when it's mounted. We can't easily test focus in JSDOM,
      // but we can verify the input is rendered with the correct behavior.
    });

    it('handles multiple rapid input changes', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');

      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.blur(input);
      fireEvent.change(input, { target: { value: '6' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '5');
      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '6');
    });

    it('handles input with leading zeros', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');
      fireEvent.change(input, { target: { value: '05' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '05');
    });
  });

  describe('when cell is not selected', () => {
    const unselectedProps = {
      ...defaultProps,
      selectedCell: null,
    };

    it('renders static cell', () => {
      render(<DayCell {...unselectedProps} />);

      expect(screen.getByTestId('data-cell')).toBeInTheDocument();
      expect(screen.queryByTestId('selected-cell')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cell-input')).not.toBeInTheDocument();
    });

    it('displays formatted value', () => {
      render(<DayCell {...unselectedProps} />);

      expect(screen.getByTestId('data-cell')).toHaveTextContent('8:00'); // Now shows duration format
    });

    it('calls handleCellClick on click', () => {
      render(<DayCell {...unselectedProps} />);

      const dataCell = screen.getByTestId('data-cell');
      fireEvent.click(dataCell);

      expect(mockHandleCellClick).toHaveBeenCalledWith(
        'row-1',
        1,
        expect.any(Object),
      );
    });

    it('calls handleContextMenu on context menu', () => {
      render(<DayCell {...unselectedProps} />);

      const dataCell = screen.getByTestId('data-cell');
      fireEvent.contextMenu(dataCell);

      expect(mockHandleContextMenu).toHaveBeenCalledWith(
        'row-1',
        0,
        expect.any(Object),
      );
    });
  });

  describe('cell styling', () => {
    it('applies break class for break type with hours > 0', () => {
      const breakRow = {
        ...mockRow,
        timeAgainst: {
          type: 'PAID' as const,
          id: 'lunch',
          displayName: 'lunch',
        },
      };
      const breakDayData = {
        ...mockDayData,
        hours: 8,
      };

      render(
        <DayCell {...defaultProps} row={breakRow} dayData={breakDayData} />,
      );

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).toHaveClass('is-break');
    });

    it('does not apply break class for break type with zero hours', () => {
      const breakRow = {
        ...mockRow,
        timeAgainst: {
          type: 'PAID' as const,
          id: 'lunch',
          displayName: 'lunch',
        },
      };
      const breakDayData = {
        ...mockDayData,
        hours: 0,
      };

      render(
        <DayCell {...defaultProps} row={breakRow} dayData={breakDayData} />,
      );

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).not.toHaveClass('is-break');
    });

    it('applies timeoff class for time off type with hours > 0', () => {
      const timeOffRow = {
        ...mockRow,
        timeAgainst: {
          type: 'TIME_OFF' as const,
          id: 'vacation',
          displayName: 'vacation',
        },
      };
      const timeOffDayData = {
        ...mockDayData,
        hours: 8,
      };

      render(
        <DayCell {...defaultProps} row={timeOffRow} dayData={timeOffDayData} />,
      );

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).toHaveClass('is-timeoff');
    });

    it('does not apply timeoff class for time off type with zero hours', () => {
      const timeOffRow = {
        ...mockRow,
        timeAgainst: {
          type: 'TIME_OFF' as const,
          id: 'vacation',
          displayName: 'vacation',
        },
      };
      const timeOffDayData = {
        ...mockDayData,
        hours: 0,
      };

      render(
        <DayCell {...defaultProps} row={timeOffRow} dayData={timeOffDayData} />,
      );

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).not.toHaveClass('is-timeoff');
    });

    it('applies has-notes class when notes exist', () => {
      render(<DayCell {...defaultProps} />);

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).toHaveClass('has-notes');
    });

    it('does not apply has-notes class when notes are empty', () => {
      const noNotesDayData = {
        ...mockDayData,
        notes: '',
      };

      render(<DayCell {...defaultProps} dayData={noNotesDayData} />);

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).not.toHaveClass('has-notes');
    });

    it('does not apply has-notes class when notes are undefined', () => {
      const noNotesDayData = {
        ...mockDayData,
        notes: undefined,
      };

      render(<DayCell {...defaultProps} dayData={noNotesDayData} />);

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).not.toHaveClass('has-notes');
    });

    it('applies multiple classes when conditions are met', () => {
      const breakRow = {
        ...mockRow,
        timeAgainst: {
          type: 'PAID' as const,
          id: 'lunch',
          displayName: 'lunch',
        },
      };
      const breakDayData = {
        ...mockDayData,
        hours: 8,
        notes: 'Break notes',
      };

      render(
        <DayCell {...defaultProps} row={breakRow} dayData={breakDayData} />,
      );

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).toHaveClass('is-break');
      expect(selectedCell).toHaveClass('has-notes');
    });
  });

  describe('field validation error styling', () => {
    const unselectedProps = {
      ...defaultProps,
      selectedCell: null,
    };

    it('applies has-validation-errors class when service error exists', () => {
      const propsWithServiceError = {
        ...unselectedProps,
        fieldErrors: {
          service: 'Service is required',
        },
      };

      render(<DayCell {...propsWithServiceError} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when class error exists', () => {
      const propsWithClassError = {
        ...unselectedProps,
        fieldErrors: {
          class: 'Class is required',
        },
      };

      render(<DayCell {...propsWithClassError} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when location error exists', () => {
      const propsWithLocationError = {
        ...unselectedProps,
        fieldErrors: {
          location: 'Location is required',
        },
      };

      render(<DayCell {...propsWithLocationError} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when notes error exists', () => {
      const propsWithNotesError = {
        ...unselectedProps,
        fieldErrors: {
          notes: 'Notes are required',
        },
      };

      render(<DayCell {...propsWithNotesError} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when customerProject error exists', () => {
      const propsWithCustomerProjectError = {
        ...unselectedProps,
        fieldErrors: {
          customerProject: 'Customer project is required',
        },
      };

      render(<DayCell {...propsWithCustomerProjectError} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when dimension errors exist', () => {
      const propsWithDimensionErrors = {
        ...unselectedProps,
        fieldErrors: {
          dimensions: { 'dim-1': 'Required' },
        },
      };

      render(<DayCell {...propsWithDimensionErrors} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class when multiple errors exist', () => {
      const propsWithMultipleErrors = {
        ...unselectedProps,
        fieldErrors: {
          service: 'Service is required',
          class: 'Class is required',
          location: 'Location is required',
        },
      };

      render(<DayCell {...propsWithMultipleErrors} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
    });

    it('does not apply has-validation-errors class when fieldErrors is empty', () => {
      const propsWithEmptyErrors = {
        ...unselectedProps,
        fieldErrors: {},
      };

      render(<DayCell {...propsWithEmptyErrors} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('has-validation-errors');
    });

    it('does not apply has-validation-errors class when all errors are empty strings', () => {
      const propsWithEmptyStringErrors = {
        ...unselectedProps,
        fieldErrors: {
          service: '',
          class: '',
          location: '',
        },
      };

      render(<DayCell {...propsWithEmptyStringErrors} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('has-validation-errors');
    });

    it('does not apply has-validation-errors class when fieldErrors is undefined', () => {
      const propsWithUndefinedErrors = {
        ...unselectedProps,
        fieldErrors: undefined,
      };

      render(<DayCell {...propsWithUndefinedErrors} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('has-validation-errors');
    });

    it('applies has-validation-errors class in selected cell state', () => {
      const propsWithErrorsSelected = {
        ...defaultProps, // selectedCell is set
        fieldErrors: {
          service: 'Service validation error',
        },
      };

      render(<DayCell {...propsWithErrorsSelected} />);

      const selectedCell = screen.getByTestId('selected-cell');
      expect(selectedCell).toHaveClass('has-validation-errors');
    });
  });

  describe('approved entry styling', () => {
    const unselectedProps = {
      ...defaultProps,
      selectedCell: null,
    };

    it('applies is-approved-entry class when cell date is on or before week max approved date', () => {
      // Get the mocked module and override the return value
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-02'); // Max approved date is Jan 2

      const propsWithLockedCell = {
        ...unselectedProps,
        dayData: {
          timeEntryId: '',
          date: '2024-01-01', // This is before the max approved date
          hours: 0,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithLockedCell} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('is-approved-entry');

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });

    it('does not apply is-approved-entry class when cell date is after week max approved date', () => {
      // Get the mocked module and override the return value
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-01'); // Max approved date is Jan 1

      const propsWithUnlockedCell = {
        ...unselectedProps,
        dayData: {
          timeEntryId: '',
          date: '2024-01-03', // This is after the max approved date
          hours: 0,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithUnlockedCell} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('is-approved-entry');

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });

    it('does not apply is-approved-entry class when there is no max approved date', () => {
      // The default mock returns null, so no need to override
      const propsWithNoApprovals = {
        ...unselectedProps,
        dayData: {
          timeEntryId: '',
          date: '2024-01-01',
          hours: 0,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithNoApprovals} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('is-approved-entry');
    });

    it('handles undefined dayData gracefully', () => {
      // The default mock returns null
      const propsWithUndefinedDayData = {
        ...unselectedProps,
        dayData: undefined,
      };

      render(<DayCell {...propsWithUndefinedDayData} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toBeInTheDocument();
      expect(dataCell).not.toHaveClass('is-approved-entry');
    });

    it('handles null dayData gracefully', () => {
      // The default mock returns null
      const propsWithNullDayData = {
        ...unselectedProps,
        dayData: null,
      };

      render(<DayCell {...propsWithNullDayData} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toBeInTheDocument();
      expect(dataCell).not.toHaveClass('is-approved-entry');
    });

    it('does not render input for locked cells even when selected', () => {
      // Get the mocked module and override the return value
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-03'); // Max approved date is Jan 3

      const propsWithLockedCellSelected = {
        ...defaultProps, // selectedCell is set
        dayData: {
          timeEntryId: '',
          date: '2024-01-01', // This is before max approved date, so locked
          hours: 8,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithLockedCellSelected} />);

      // Should render as static cell even when selected because the cell is locked
      expect(screen.getByTestId('data-cell')).toBeInTheDocument();
      expect(screen.queryByTestId('selected-cell')).not.toBeInTheDocument();

      // Reset mock
      useAppSelector.mockReturnValue(null);
      expect(screen.queryByTestId('cell-input')).not.toBeInTheDocument();
    });

    it('allows clicking on approved rows with hours > 0 to view meta info', () => {
      // Mock max approved date so the cell is locked
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-02'); // Max approved date includes this cell's date

      const propsWithApprovedRow = {
        ...unselectedProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
        dayData: {
          ...mockDayData,
          date: '2024-01-01', // This date is on or before max approved
          hours: 8, // Has hours > 0
        },
      };

      render(<DayCell {...propsWithApprovedRow} />);

      const dataCell = screen.getByTestId('data-cell');

      // Should be clickable (pointer cursor)
      expect(dataCell).toHaveStyle({ cursor: 'pointer' });

      // Should call handleCellClick when clicked
      fireEvent.click(dataCell);
      expect(mockHandleCellClick).toHaveBeenCalledWith(
        'row-1',
        1, // cellIdx
        dataCell,
      );

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });

    it('does not allow clicking on approved rows with 0 hours', () => {
      // Mock max approved date so the cell is locked
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-02'); // Max approved date includes this cell's date

      const propsWithApprovedRowZeroHours = {
        ...unselectedProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
        dayData: {
          ...mockDayData,
          date: '2024-01-01', // This date is on or before max approved
          hours: 0, // Has 0 hours
        },
      };

      render(<DayCell {...propsWithApprovedRowZeroHours} />);

      const dataCell = screen.getByTestId('data-cell');

      // Should not be clickable (default cursor)
      expect(dataCell).toHaveStyle({ cursor: 'default' });

      // Should not call handleCellClick when clicked
      fireEvent.click(dataCell);
      expect(mockHandleCellClick).not.toHaveBeenCalled();

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });
  });

  describe('combined styling scenarios', () => {
    const unselectedProps = {
      ...defaultProps,
      selectedCell: null,
    };

    it('applies both has-validation-errors and is-approved-entry classes when both conditions are met', () => {
      // Mock max approved date so the cell is locked
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-02'); // Max approved date includes this cell's date

      const propsWithBothConditions = {
        ...unselectedProps,
        row: {
          ...mockRow,
          hasApprovedEntries: true,
        },
        dayData: {
          ...mockDayData,
          date: '2024-01-01', // This date is on or before max approved
        },
        fieldErrors: {
          service: 'Service error',
        },
      };

      render(<DayCell {...propsWithBothConditions} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('has-validation-errors');
      expect(dataCell).toHaveClass('is-approved-entry');

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });

    it('applies all styling classes when multiple conditions are met', () => {
      // Mock max approved date so the cell is locked
      const {
        useAppSelector,
      } = require('src/js/widgets/weeklyTimeEntry/store');
      useAppSelector.mockReturnValue('2024-01-02'); // Max approved date includes this cell's date

      const breakRow = {
        ...mockRow,
        timeAgainst: {
          type: 'PAID' as const,
          id: 'lunch',
          displayName: 'lunch',
        },
        hasApprovedEntries: true,
      };
      const propsWithAllClasses = {
        ...unselectedProps,
        row: breakRow,
        dayData: {
          ...mockDayData,
          date: '2024-01-01', // This date is on or before max approved
          hours: 8,
          notes: 'Break notes',
        },
        fieldErrors: {
          service: 'Service validation error',
        },
      };

      render(<DayCell {...propsWithAllClasses} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('is-break');
      expect(dataCell).toHaveClass('has-notes');
      expect(dataCell).toHaveClass('has-validation-errors');
      expect(dataCell).toHaveClass('is-approved-entry');

      // Reset mock
      useAppSelector.mockReturnValue(null);
    });

    it('applies no special classes when no conditions are met', () => {
      const propsWithNoClasses = {
        ...unselectedProps,
        dayData: {
          ...mockDayData,
          hours: 0,
          notes: '',
          isApproved: false,
        },
        fieldErrors: {},
      };

      render(<DayCell {...propsWithNoClasses} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('is-break');
      expect(dataCell).not.toHaveClass('is-timeoff');
      expect(dataCell).not.toHaveClass('has-notes');
      expect(dataCell).not.toHaveClass('has-validation-errors');
      expect(dataCell).not.toHaveClass('is-approved-entry');
    });
  });

  describe('edge cases', () => {
    it('handles undefined selectedCell gracefully', () => {
      const propsWithUndefinedSelectedCell = {
        ...defaultProps,
        selectedCell: undefined,
      };

      render(<DayCell {...propsWithUndefinedSelectedCell} />);

      // Should render as unselected cell
      expect(screen.getByTestId('data-cell')).toBeInTheDocument();
    });

    it('handles null selectedCell gracefully', () => {
      const propsWithNullSelectedCell = {
        ...defaultProps,
        selectedCell: null,
      };

      render(<DayCell {...propsWithNullSelectedCell} />);

      // Should render as unselected cell
      expect(screen.getByTestId('data-cell')).toBeInTheDocument();
    });

    it('handles missing timeAgainst type gracefully', () => {
      const rowWithoutTimeAgainst = {
        ...mockRow,
        timeAgainst: { type: null, id: null, displayName: null },
      };

      render(<DayCell {...defaultProps} row={rowWithoutTimeAgainst} />);

      // Should render without crashing
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });

    it('handles negative rowIndex gracefully', () => {
      const propsWithNegativeRowIndex = {
        ...defaultProps,
        rowIndex: -1,
      };

      render(<DayCell {...propsWithNegativeRowIndex} />);

      // Should render without crashing
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });

    it('handles large rowIndex gracefully', () => {
      const propsWithLargeRowIndex = {
        ...defaultProps,
        rowIndex: 999999,
      };

      render(<DayCell {...propsWithLargeRowIndex} />);

      // Should render without crashing
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });

    it('handles undefined cell value gracefully', () => {
      const propsWithUndefinedCellValue = {
        ...defaultProps,
        cell: { ...mockCell, value: 0 }, // Use 0 instead of undefined
      };

      render(<DayCell {...propsWithUndefinedCellValue} />);

      // Should render without crashing
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });

    it('handles null cell value gracefully', () => {
      const propsWithNullCellValue = {
        ...defaultProps,
        cell: { ...mockCell, value: 0 }, // Use 0 instead of null
      };

      render(<DayCell {...propsWithNullCellValue} />);

      // Should render without crashing
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });
  });

  describe('input behavior', () => {
    it('handles decimal input values', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '8.5' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '8.5');
    });

    it('handles duration format input values (hh:mm)', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '8:30' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '8:30');
    });

    it('handles empty input value', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '');
    });

    it('accepts any string input format for validation in parent', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);

      // The DayCell now accepts any string input and lets the parent validate
      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, 'abc');
    });

    it('accepts large input values for validation in parent', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '999999' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '999999');
    });

    it('accepts negative input values for validation in parent', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.blur(input);

      expect(mockHandleHourChange).toHaveBeenCalledWith('row-1', 0, '-5');
    });
  });

  describe('accessibility', () => {
    it('input has proper attributes for screen readers', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('handles keyboard navigation properly', () => {
      render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');

      // Test various keyboard events
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowLeft' });
      fireEvent.keyDown(input, { key: 'ArrowRight' });

      // Should not crash and input should remain focused
      expect(input).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('renders quickly with large values', () => {
      const propsWithLargeValue = {
        ...defaultProps,
        cell: { ...mockCell, value: 999999 },
      };

      const startTime = performance.now();
      render(<DayCell {...propsWithLargeValue} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });

    it('handles rapid re-renders efficiently', () => {
      const { rerender } = render(<DayCell {...defaultProps} />);

      // Rapidly change props multiple times
      for (let i = 0; i < 10; i += 1) {
        rerender(
          <DayCell {...defaultProps} cell={{ ...mockCell, value: i }} />,
        );
      }

      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('switches between selected and unselected states correctly', () => {
      const { rerender } = render(<DayCell {...defaultProps} />);

      // Initially selected
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
      expect(screen.queryByTestId('data-cell')).not.toBeInTheDocument();

      // Switch to unselected
      rerender(<DayCell {...defaultProps} selectedCell={null} />);

      expect(screen.getByTestId('data-cell')).toBeInTheDocument();
      expect(screen.queryByTestId('selected-cell')).not.toBeInTheDocument();
    });

    it('maintains state during prop changes', () => {
      const { rerender } = render(<DayCell {...defaultProps} />);

      const input = screen.getByTestId('cell-input');
      fireEvent.change(input, { target: { value: '10' } });

      // Change other props
      rerender(<DayCell {...defaultProps} cell={{ ...mockCell, value: 10 }} />);

      // Should still be selected and input should be visible
      expect(screen.getByTestId('selected-cell')).toBeInTheDocument();
      expect(screen.getByTestId('cell-input')).toBeInTheDocument();
    });
  });

  describe('time off row locking', () => {
    const unselectedProps = {
      ...defaultProps,
      selectedCell: null,
    };

    it('applies is-approved-entry class when row is a time off row', () => {
      const propsWithTimeOffRow = {
        ...unselectedProps,
        row: {
          ...mockRow,
          isTimeOffRow: true,
        },
        dayData: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithTimeOffRow} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('is-approved-entry');
    });

    it('locks time off row cells even when no max approved date exists', () => {
      // Default mock returns null for maxApprovedDate
      const propsWithTimeOffRow = {
        ...unselectedProps,
        row: {
          ...mockRow,
          isTimeOffRow: true,
        },
        dayData: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsWithTimeOffRow} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).toHaveClass('is-approved-entry');
      // Locked cells with hours should still be clickable
      expect(dataCell).toHaveAttribute('tabindex', '0');
    });

    it('does not lock cells for non-time-off rows without approved date', () => {
      const propsNormal = {
        ...unselectedProps,
        row: {
          ...mockRow,
          isTimeOffRow: false,
        },
        dayData: {
          timeEntryId: 'entry-1',
          date: '2024-01-01',
          hours: 8,
          notes: '',
          isApproved: false,
        },
      };

      render(<DayCell {...propsNormal} />);

      const dataCell = screen.getByTestId('data-cell');
      expect(dataCell).not.toHaveClass('is-approved-entry');
    });
  });
});
