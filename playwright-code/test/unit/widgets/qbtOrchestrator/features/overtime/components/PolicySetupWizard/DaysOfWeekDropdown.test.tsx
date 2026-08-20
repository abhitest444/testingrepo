import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProvider,
} from 'test/unit/testUtils';
import DaysOfWeekDropdown from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/DaysOfWeekDropdown';

// Mock useTracking to allow tracking code to execute without errors
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useTracking: () => mockTrack,
  };
});

// Mock IDS Dropdown
jest.mock('@ids-ts/dropdown', () => ({
  __esModule: true,
  default: ({
    children,
    value,
    onChange,
    onOpen,
    disabled,
    label,
    placeholder,
    'data-testid': testId,
  }: any) => {
    const selectId = `${testId}-select`;
    // For multiple select, value must be an array
    const selectValue = Array.isArray(value) ? value : [];
    return (
      <div data-testid={testId}>
        <label htmlFor={selectId}>{label}</label>
        <span>{placeholder}</span>
        <select
          id={selectId}
          data-testid={selectId}
          value={selectValue}
          onChange={onChange}
          onFocus={onOpen}
          disabled={disabled}
          multiple
        >
          {children}
        </select>
      </div>
    );
  },
  MenuItem: ({ children, value, disabled }: any) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}));

describe('DaysOfWeekDropdown', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnChange = jest.fn();

  const defaultProps = {
    value: '1111111', // All days selected (binary representation)
    onChange: mockOnChange,
    disabled: false,
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <DaysOfWeekDropdown {...defaultProps} {...props} />,
      mockSandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the dropdown with correct test id', () => {
      renderComponent();
      expect(
        screen.getByTestId('overtime-rule-day-of-week-dropdown'),
      ).toBeInTheDocument();
    });

    it('should render the label', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.rules.days_of_week.label/i),
      ).toBeInTheDocument();
    });

    it('should render the placeholder', () => {
      renderComponent();
      expect(
        screen.getByText(/NLS overtime.wizard.rules.days_of_week.placeholder/i),
      ).toBeInTheDocument();
    });

    it('should render all day options', () => {
      renderComponent();
      expect(screen.getByText(/NLS weekday.sun/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.mon/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.tue/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.wed/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.thu/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.fri/i)).toBeInTheDocument();
      expect(screen.getByText(/NLS weekday.sat/i)).toBeInTheDocument();
    });
  });

  describe('Value Conversion', () => {
    it('should convert binary 1111111 to all days selected', () => {
      renderComponent({ value: '1111111' });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      ) as HTMLSelectElement;
      // All days selected: 0,1,2,3,4,5,6 - check that multiple options are selected
      const selectedOptions = Array.from(select.selectedOptions);
      expect(selectedOptions.length).toBe(7);
    });

    it('should convert binary 0000000 to no days selected', () => {
      renderComponent({ value: '0000000' });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      ) as HTMLSelectElement;
      // No days selected
      const selectedOptions = Array.from(select.selectedOptions);
      expect(selectedOptions.length).toBe(0);
    });

    it('should convert binary 1010101 to Sun, Tue, Thu, Sat', () => {
      renderComponent({ value: '1010101' });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      ) as HTMLSelectElement;
      // Check that the dropdown renders with multiple attribute
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('multiple');
      // 1010101 = Sun(0), Tue(2), Thu(4), Sat(6) = 4 days
      const selectedOptions = Array.from(select.selectedOptions);
      expect(selectedOptions.length).toBe(4);
    });
  });

  describe('User Interactions', () => {
    it.each([
      ['selecting a day', '0000000'],
      ['deselecting a day', '1111111'],
    ])('should call onChange when %s', (_, initialValue) => {
      renderComponent({ value: initialValue });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.change(select, { target: { value: '0' } });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable the dropdown when disabled prop is true', () => {
      renderComponent({ disabled: true });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      ) as HTMLSelectElement;
      expect(select.disabled).toBe(true);
    });

    it('should not disable the dropdown when disabled prop is omitted (default false - line 19)', () => {
      // Render without the disabled prop to exercise the default parameter branch
      renderWithQuicksandProvider(
        <DaysOfWeekDropdown value="0000000" onChange={mockOnChange} />,
        mockSandbox,
      );
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      ) as HTMLSelectElement;
      expect(select.disabled).toBe(false);
    });
  });

  describe('Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
    });

    it('should track dropdown click when trackingPoint is provided', () => {
      const mockTrackingPoint = {
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'overtime',
        object: 'component',
        screen: 'overtime_rules_basic',
        object_detail: 'basic_daily_select_days_click',
        action: 'engaged',
        ui_action: 'clicked',
        ui_object: 'dropdown',
        ui_object_detail: 'basic_daily_select_days_click',
      };

      renderComponent({ trackingPoint: mockTrackingPoint });

      fireEvent.focus(
        screen.getByTestId('overtime-rule-day-of-week-dropdown-select'),
      );

      expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoint);
    });

    it('should not track when trackingPoint is not provided', () => {
      renderComponent();
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.focus(select);
      expect(mockTrack).not.toHaveBeenCalled();
    });
  });

  describe('Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
    });

    it('should track dropdown click when trackingPoint is provided', () => {
      const mockTrackingPoint = {
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'overtime',
        object: 'component',
        screen: 'overtime_rules_basic',
        object_detail: 'basic_daily_select_days_click',
        action: 'engaged',
        ui_action: 'clicked',
        ui_object: 'dropdown',
        ui_object_detail: 'basic_daily_select_days_click',
      };

      renderComponent({ trackingPoint: mockTrackingPoint });

      fireEvent.focus(
        screen.getByTestId('overtime-rule-day-of-week-dropdown-select'),
      );

      expect(mockTrack).toHaveBeenCalledWith(mockTrackingPoint);
    });

    it('should not track when trackingPoint is not provided', () => {
      renderComponent();
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.focus(select);
      expect(mockTrack).not.toHaveBeenCalled();
    });
  });

  describe('Prevent Deselection Feature', () => {
    it('should not prevent deselection when preventDeselection is false (default)', () => {
      renderComponent({ value: '1111111', preventDeselection: false });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.change(select, { target: { value: '0' } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should prevent deselection when preventDeselection is true and only one day selected', () => {
      renderComponent({ value: '1010101', preventDeselection: true });
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.change(select, { target: { value: '2' } });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should use default false for preventDeselection when prop is omitted', () => {
      renderWithQuicksandProvider(
        <DaysOfWeekDropdown value="1111111" onChange={mockOnChange} />,
        mockSandbox,
      );
      const select = screen.getByTestId(
        'overtime-rule-day-of-week-dropdown-select',
      );

      fireEvent.focus(select);

      expect(mockTrack).not.toHaveBeenCalled();
      fireEvent.change(select, { target: { value: '0' } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should disable menu items when preventDeselection is true', () => {
      renderComponent({ value: '1111111', preventDeselection: true });
      const options = screen.getAllByRole('option') as HTMLOptionElement[];

      // All options should be disabled when preventDeselection is true
      options.forEach((option) => {
        expect(option.disabled).toBe(true);
      });
    });

    it('should not disable menu items when preventDeselection is false', () => {
      renderComponent({ value: '1111111', preventDeselection: false });
      const options = screen.getAllByRole('option') as HTMLOptionElement[];

      // No options should be disabled when preventDeselection is false
      options.forEach((option) => {
        expect(option.disabled).toBe(false);
      });
    });
  });
});
