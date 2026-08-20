import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DueDateFilterDropdown from 'src/js/widgets/timeProject/components/DueDateFilterDropdown';
import {
  DueDateFilterType,
  DueDateRange,
} from 'src/js/widgets/timeProject/utils/dateFilterUtils';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('@ids-ts/dropdown-typeahead', () => {
  const MockDropdownTypeahead = ({
    inputValue,
    onSearch,
    value,
    onChange,
    dataSource,
    label,
  }: any) => (
    <div data-testid="mock-dropdown">
      <label htmlFor="dropdown-input">{label}</label>
      <input
        id="dropdown-input"
        data-testid="dropdown-input"
        value={inputValue}
        onChange={(e) => onSearch?.(e)}
      />
      <select
        data-testid="dropdown-select"
        value={value}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      >
        {dataSource?.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
  return {
    __esModule: true,
    default: MockDropdownTypeahead,
    MenuItem: ({ children, value: val }: any) => (
      <option value={val}>{children}</option>
    ),
  };
});

jest.mock('@ids-ts/popover', () => ({
  Popover: ({ children, open }: any) =>
    open ? <div data-testid="mock-popover">{children}</div> : null,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverActions: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@ids-ts/date-range-picker', () => ({
  __esModule: true,
  default: ({
    startingDate,
    endingDate,
    onStartingDateChange,
    onEndingDateChange,
    errorTextEndDate,
  }: any) => (
    <div data-testid="mock-date-range-picker">
      <input
        data-testid="start-date-input"
        value={startingDate}
        onChange={onStartingDateChange}
      />
      <input
        data-testid="end-date-input"
        value={endingDate}
        onChange={onEndingDateChange}
      />
      {errorTextEndDate && (
        <span data-testid="date-range-error">{errorTextEndDate}</span>
      )}
    </div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: any) => (
    <button data-testid="apply-button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe('DueDateFilterDropdown', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dropdown with the due date label', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    expect(
      screen.getByText('timeProject.filter.dueDate.label'),
    ).toBeInTheDocument();
  });

  it('shows "Custom range" NLS key when dueDateRange is null (CUSTOM_RANGE default)', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    expect(screen.getByTestId('dropdown-input')).toHaveValue(
      'timeProject.filter.dueDate.customRange',
    );
  });

  it('renders exactly 12 options — no "All dates" option (matches projects-plugin QBOA)', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(12);
  });

  it('does not render an "All dates" option in the dropdown', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    const options = screen.getAllByRole('option');
    const hasAllDatesOption = options.some((opt) =>
      opt.textContent?.toLowerCase().includes('all dates'),
    );
    expect(hasAllDatesOption).toBe(false);
  });

  it('calls onChange with a DueDateRange when a preset is selected', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.TODAY },
    });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const arg = mockOnChange.mock.calls[0][0] as DueDateRange;
    expect(arg.filterType).toBe(DueDateFilterType.TODAY);
    expect(arg.fromDate).toBeTruthy();
    expect(arg.toDate).toBeTruthy();
  });

  it('opens the custom range popover when CUSTOM_RANGE is selected without calling onChange', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    expect(screen.queryByTestId('mock-popover')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });

    expect(screen.getByTestId('mock-popover')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows the date range picker inside the popover', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });
    expect(screen.getByTestId('mock-date-range-picker')).toBeInTheDocument();
  });

  it('apply button is disabled when popover opens with empty dates', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });
    expect(screen.getByTestId('apply-button')).toBeDisabled();
  });

  it('calls onChange with CUSTOM_RANGE when valid dates are entered and Apply is clicked', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });

    fireEvent.change(screen.getByTestId('start-date-input'), {
      target: { value: '01/01/2026' },
    });
    fireEvent.change(screen.getByTestId('end-date-input'), {
      target: { value: '06/30/2026' },
    });

    fireEvent.click(screen.getByTestId('apply-button'));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const arg = mockOnChange.mock.calls[0][0] as DueDateRange;
    expect(arg.filterType).toBe(DueDateFilterType.CUSTOM_RANGE);
    expect(arg.fromDate).toBe('2026-01-01');
    expect(arg.toDate).toBe('2026-06-30');
  });

  it('shows error message when custom range exceeds 36 months', () => {
    render(
      <DueDateFilterDropdown dueDateRange={null} onChange={mockOnChange} />,
    );
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });

    fireEvent.change(screen.getByTestId('start-date-input'), {
      target: { value: '01/01/2023' },
    });
    fireEvent.change(screen.getByTestId('end-date-input'), {
      target: { value: '06/01/2026' },
    });

    expect(screen.getByTestId('date-range-error')).toBeInTheDocument();
    expect(screen.getByTestId('apply-button')).toBeDisabled();
  });

  it('displays formatted date range label when CUSTOM_RANGE is active', () => {
    const range: DueDateRange = {
      filterType: DueDateFilterType.CUSTOM_RANGE,
      fromDate: '2026-01-01',
      toDate: '2026-06-30',
    };
    render(
      <DueDateFilterDropdown dueDateRange={range} onChange={mockOnChange} />,
    );
    expect(screen.getByTestId('dropdown-input')).toHaveValue(
      '01/01/2026 - 06/30/2026',
    );
  });

  it('displays the NLS label for a preset filter type when active', () => {
    const range: DueDateRange = {
      filterType: DueDateFilterType.THIS_WEEK,
      fromDate: '2026-06-29',
      toDate: '2026-07-05',
    };
    render(
      <DueDateFilterDropdown dueDateRange={range} onChange={mockOnChange} />,
    );
    expect(screen.getByTestId('dropdown-input')).toHaveValue(
      'timeProject.filter.dueDate.thisWeek',
    );
  });

  // Mirrors projects-plugin's DateFilterPopover behaviour: when the user
  // switches from a named preset to "Custom range", the popover is seeded
  // with the currently-active range dates — not empty fields.
  it('pre-fills popover with the current preset dates when switching to Custom range', () => {
    const todayRange: DueDateRange = {
      filterType: DueDateFilterType.TODAY,
      fromDate: '2026-07-01',
      toDate: '2026-07-01',
    };
    render(
      <DueDateFilterDropdown
        dueDateRange={todayRange}
        onChange={mockOnChange}
      />,
    );

    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });

    expect(screen.getByTestId('start-date-input')).toHaveValue('07/01/2026');
    expect(screen.getByTestId('end-date-input')).toHaveValue('07/01/2026');
  });

  it('pre-fills popover with previous custom range dates when re-opening Custom range', () => {
    const customRange: DueDateRange = {
      filterType: DueDateFilterType.CUSTOM_RANGE,
      fromDate: '2026-03-01',
      toDate: '2026-09-30',
    };
    render(
      <DueDateFilterDropdown
        dueDateRange={customRange}
        onChange={mockOnChange}
      />,
    );

    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: DueDateFilterType.CUSTOM_RANGE },
    });

    expect(screen.getByTestId('start-date-input')).toHaveValue('03/01/2026');
    expect(screen.getByTestId('end-date-input')).toHaveValue('09/30/2026');
  });
});
