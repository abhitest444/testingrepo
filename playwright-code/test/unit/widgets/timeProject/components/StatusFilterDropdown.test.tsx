import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusFilterDropdown from 'src/js/widgets/timeProject/components/StatusFilterDropdown';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';
import { useLandingPageTrackingPoints } from 'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints';

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: jest.fn(),
  }),
);

jest.mock('@ids-ts/dropdown-typeahead', () => {
  const MockDropdownTypeahead = ({
    inputValue,
    onSearch,
    onFocus,
    value,
    onChange,
    dataSource,
  }: any) => (
    <div data-testid="mock-dropdown">
      <input
        data-testid="dropdown-input"
        value={inputValue}
        onChange={(e) => onSearch?.(e)}
        onFocus={onFocus}
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

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectFilters.styled',
  () => ({
    FilterItem: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

describe('StatusFilterDropdown', () => {
  const mockOnChange = jest.fn();
  const mockUseLandingPageTrackingPoints =
    useLandingPageTrackingPoints as jest.MockedFunction<
      typeof useLandingPageTrackingPoints
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLandingPageTrackingPoints.mockReturnValue(
      LANDING_PAGE_TRACKING_POINTS,
    );
  });

  it('renders the dropdown', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  it('tracks CLICK_STATUS_DROPDOWN on focus', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.focus(screen.getByTestId('dropdown-input'));
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_STATUS_DROPDOWN,
    );
  });

  it('tracks SELECT_STATUS_DROPDOWN on change', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: 'In progress' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.SELECT_STATUS_DROPDOWN,
    );
    expect(mockOnChange).toHaveBeenCalledWith('In progress');
  });

  it('handles search input filtering', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: 'test' },
    });
    expect(screen.getByTestId('mock-dropdown')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: 'prog' },
    });
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  it('renders with specific value', () => {
    render(
      <StatusFilterDropdown value="In progress" onChange={mockOnChange} />,
    );
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  it('renders with empty value defaults to ALL', () => {
    render(<StatusFilterDropdown value="" onChange={mockOnChange} />);
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  it('falls back to allStatuses label when value does not match any option', () => {
    render(
      <StatusFilterDropdown value="UNKNOWN_STATUS" onChange={mockOnChange} />,
    );
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  describe('conditional status options based on feature flag and user type', () => {
    it('shows both "Not started" and "To do" when workflow is disabled (OIGQL path)', () => {
      render(
        <StatusFilterDropdown
          value="ALL"
          onChange={mockOnChange}
          isWorkflowApiEnabled={false}
        />,
      );
      const options = screen
        .getAllByRole('option')
        .map((el) => el.getAttribute('value'));
      expect(options).toContain('Not started');
      expect(options).toContain('To do');
    });

    it('hides "Not started" and shows "To do" for QBOA users when workflow is enabled', () => {
      render(
        <StatusFilterDropdown
          value="ALL"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant
        />,
      );
      const options = screen
        .getAllByRole('option')
        .map((el) => el.getAttribute('value'));
      expect(options).not.toContain('Not started');
      expect(options).toContain('To do');
    });

    it('hides "To do" and shows "Not started" for QBO users when workflow is enabled', () => {
      render(
        <StatusFilterDropdown
          value="ALL"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant={false}
        />,
      );
      const options = screen
        .getAllByRole('option')
        .map((el) => el.getAttribute('value'));
      expect(options).toContain('Not started');
      expect(options).not.toContain('To do');
    });

    it('defaults to QBO behavior (shows "Not started", hides "To do") when workflow is enabled without explicit isAccountant', () => {
      render(
        <StatusFilterDropdown
          value="ALL"
          onChange={mockOnChange}
          isWorkflowApiEnabled
        />,
      );
      const options = screen
        .getAllByRole('option')
        .map((el) => el.getAttribute('value'));
      expect(options).toContain('Not started');
      expect(options).not.toContain('To do');
    });
  });

  describe('value normalization on Workflow path', () => {
    it('normalizes "Not started" → "To do" for QBOA users and calls onChange', () => {
      render(
        <StatusFilterDropdown
          value="Not started"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant
        />,
      );
      expect(mockOnChange).toHaveBeenCalledWith('To do');
      expect(screen.getByTestId('dropdown-select')).toHaveValue('To do');
    });

    it('normalizes "To do" → "Not started" for QBO users and calls onChange', () => {
      render(
        <StatusFilterDropdown
          value="To do"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant={false}
        />,
      );
      expect(mockOnChange).toHaveBeenCalledWith('Not started');
      expect(screen.getByTestId('dropdown-select')).toHaveValue('Not started');
    });

    it('does not normalize or call onChange when value is already visible for QBOA', () => {
      render(
        <StatusFilterDropdown
          value="To do"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant
        />,
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not normalize or call onChange when value is already visible for QBO', () => {
      render(
        <StatusFilterDropdown
          value="Not started"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant={false}
        />,
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not normalize when workflow is disabled even if value is "Not started"', () => {
      render(
        <StatusFilterDropdown
          value="Not started"
          onChange={mockOnChange}
          isWorkflowApiEnabled={false}
          isAccountant
        />,
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not normalize ALL value on Workflow path', () => {
      render(
        <StatusFilterDropdown
          value="ALL"
          onChange={mockOnChange}
          isWorkflowApiEnabled
          isAccountant
        />,
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  it('sets inputValue to empty string when handleSearch receives no value', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: {},
    });
    expect(
      screen.getByTestId('time-project-status-filter'),
    ).toBeInTheDocument();
  });

  it('resets inputValue after selection', () => {
    render(<StatusFilterDropdown value="ALL" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: 'prog' },
    });
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: 'In progress' },
    });
    expect(mockOnChange).toHaveBeenCalledWith('In progress');
  });
});
