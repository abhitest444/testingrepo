import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProvider,
} from 'test/unit/testUtils';
import OvertimeRuleCard from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRuleCard';
import type { OvertimeRule } from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';
import {
  OVERTIME_RULES_BASIC_TRACKING_POINTS,
  OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTrackingPoints';

// Mock useTracking to allow tracking code to execute without errors
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useTracking: () => mockTrack,
  };
});

// Mock IDS components
jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  default: ({
    children,
    checked,
    disabled,
    onChange,
    'data-testid': testId,
  }: any) => (
    <label data-testid={testId}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        data-testid={`${testId}-input`}
      />
      {children}
    </label>
  ),
}));

jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    disabled,
    onChange,
    'data-testid': testId,
  }: any) => {
    const inputId = `${testId}-input`;
    return (
      <div data-testid={testId}>
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          type="text"
          value={value}
          disabled={disabled}
          onChange={onChange}
          data-testid={inputId}
        />
      </div>
    );
  },
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

// Mock DaysOfWeekDropdown
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/DaysOfWeekDropdown',
  () => ({
    __esModule: true,
    default: ({ value, disabled, preventDeselection, onChange }: any) => (
      <select
        data-testid="days-of-week-dropdown"
        value={value}
        disabled={disabled}
        data-prevent-deselection={preventDeselection}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="1111111">All Days</option>
        <option value="1000000">Sunday</option>
      </select>
    ),
  }),
);

// Mock styled components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/styles/PolicySetupWizard.styled',
  () => ({
    RuleCardWrapper: ({ children, ...props }: any) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <div {...props}>{children}</div>
    ),
    RuleInputsColumn: ({ children }: any) => <div>{children}</div>,
    RuleInputFieldsContainer: ({ children }: any) => <div>{children}</div>,
    RuleInputField: ({ children }: any) => <div>{children}</div>,
    RuleErrorText: ({ children }: any) => (
      <span className="error-text">{children}</span>
    ),
  }),
);

describe('OvertimeRuleCard', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnSelectedChange = jest.fn();
  const mockOnConditionChange = jest.fn();

  const createRule = (overrides: Partial<OvertimeRule> = {}): OvertimeRule => ({
    type: 'daily',
    name: 'Daily Overtime',
    frequency: 'DAILY',
    multiplier: 1.5,
    conditions: [
      { field: 'threshold', value: '8' },
      { field: 'day_of_week', value: '1111111' },
    ],
    ...overrides,
  });

  const defaultProps = {
    rule: createRule(),
    selected: false,
    readOnly: false,
    checkboxDisabled: false,
    trackingPoints: OVERTIME_RULES_BASIC_TRACKING_POINTS,
    onSelectedChange: mockOnSelectedChange,
    onConditionChange: mockOnConditionChange,
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <OvertimeRuleCard {...defaultProps} {...props} />,
      mockSandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the rule card with correct test id', () => {
      renderComponent();
      expect(screen.getByTestId('overtime-rule-daily')).toBeInTheDocument();
    });

    it('should render the checkbox', () => {
      renderComponent();
      expect(
        screen.getByTestId('overtime-rule-checkbox-daily'),
      ).toBeInTheDocument();
    });

    it('should not render inputs when rule is not selected', () => {
      renderComponent({ selected: false });
      expect(
        screen.queryByTestId('overtime-rule-threshold-daily'),
      ).not.toBeInTheDocument();
    });

    it('should render inputs when rule is selected', () => {
      renderComponent({ selected: true });
      expect(
        screen.getByTestId('overtime-rule-threshold-daily'),
      ).toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    it('should call onSelectedChange when checkbox is clicked', () => {
      renderComponent();
      const checkbox = screen.getByTestId('overtime-rule-checkbox-daily-input');
      fireEvent.click(checkbox);
      expect(mockOnSelectedChange).toHaveBeenCalled();
    });

    it('should disable checkbox when checkboxDisabled is true', () => {
      renderComponent({ checkboxDisabled: true });
      const checkbox = screen.getByTestId('overtime-rule-checkbox-daily-input');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Daily Rule Type', () => {
    it('should render days of week dropdown for daily rule', () => {
      renderComponent({ selected: true, rule: createRule({ type: 'daily' }) });
      expect(screen.getByTestId('days-of-week-dropdown')).toBeInTheDocument();
    });

    it('should render days of week dropdown for double_daily rule', () => {
      renderComponent({
        selected: true,
        rule: createRule({ type: 'double_daily' }),
      });
      expect(screen.getByTestId('days-of-week-dropdown')).toBeInTheDocument();
    });
  });

  describe('Consecutive Rule Type', () => {
    it('should render days in a row field for consecutive_daily rule', () => {
      const rule = createRule({
        type: 'consecutive_daily',
        conditions: [
          { field: 'threshold', value: '8' },
          { field: 'days_in_a_row', value: '7' },
        ],
      });
      renderComponent({ selected: true, rule });
      expect(
        screen.getByTestId('overtime-rule-days-in-a-row-consecutive_daily'),
      ).toBeInTheDocument();
    });

    it('should render days in a row field for consecutive_double_daily rule', () => {
      const rule = createRule({
        type: 'consecutive_double_daily',
        conditions: [
          { field: 'threshold', value: '8' },
          { field: 'days_in_a_row', value: '7' },
        ],
      });
      renderComponent({ selected: true, rule });
      expect(
        screen.getByTestId(
          'overtime-rule-days-in-a-row-consecutive_double_daily',
        ),
      ).toBeInTheDocument();
    });

    it('should not render days of week dropdown for consecutive rules', () => {
      const rule = createRule({ type: 'consecutive_daily' });
      renderComponent({ selected: true, rule });
      expect(
        screen.queryByTestId('days-of-week-dropdown'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Input Changes', () => {
    it('should call onConditionChange when threshold is changed', () => {
      renderComponent({ selected: true });
      const input = screen.getByTestId('overtime-rule-threshold-daily-input');
      fireEvent.change(input, { target: { value: '10' } });
      expect(mockOnConditionChange).toHaveBeenCalledWith('threshold', '10');
    });

    it('should call onConditionChange when days in a row is changed', () => {
      const rule = createRule({
        type: 'consecutive_daily',
        conditions: [
          { field: 'threshold', value: '8' },
          { field: 'days_in_a_row', value: '7' },
        ],
      });
      renderComponent({ selected: true, rule });
      const input = screen.getByTestId(
        'overtime-rule-days-in-a-row-consecutive_daily-input',
      );
      fireEvent.change(input, { target: { value: '5' } });
      expect(mockOnConditionChange).toHaveBeenCalledWith('days_in_a_row', '5');
    });

    it('should call onConditionChange when day of week is changed', () => {
      renderComponent({ selected: true });
      const dropdown = screen.getByTestId('days-of-week-dropdown');
      fireEvent.change(dropdown, { target: { value: '1000000' } });
      expect(mockOnConditionChange).toHaveBeenCalledWith(
        'day_of_week',
        '1000000',
      );
    });
  });

  describe('Read Only State', () => {
    it('should disable threshold input when readOnly is true', () => {
      renderComponent({ selected: true, readOnly: true });
      const input = screen.getByTestId('overtime-rule-threshold-daily-input');
      expect(input).toBeDisabled();
    });

    it('should disable days of week dropdown when readOnly is true', () => {
      renderComponent({ selected: true, readOnly: true });
      const dropdown = screen.getByTestId('days-of-week-dropdown');
      expect(dropdown).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should display threshold error when provided', () => {
      renderComponent({
        selected: true,
        fieldErrors: { threshold: 'Threshold is required' },
      });
      expect(screen.getByText('Threshold is required')).toBeInTheDocument();
    });

    it('should display day_of_week error when provided', () => {
      renderComponent({
        selected: true,
        fieldErrors: { day_of_week: 'Days of week is required' },
      });
      expect(screen.getByText('Days of week is required')).toBeInTheDocument();
    });

    it('should display days_in_a_row error when provided', () => {
      const rule = createRule({
        type: 'consecutive_daily',
        conditions: [
          { field: 'threshold', value: '8' },
          { field: 'days_in_a_row', value: '7' },
        ],
      });
      renderComponent({
        selected: true,
        rule,
        fieldErrors: { days_in_a_row: 'Days in a row is required' },
      });
      expect(screen.getByText('Days in a row is required')).toBeInTheDocument();
    });
  });

  describe('Multiplier Label', () => {
    it('should display 1.5x multiplier label', () => {
      renderComponent({
        selected: true,
        rule: createRule({ multiplier: 1.5 }),
      });
      expect(
        screen.getByText(/NLS overtime.wizard.rules.multiplier.1.5/i),
      ).toBeInTheDocument();
    });

    it('should display 2x multiplier label', () => {
      renderComponent({ selected: true, rule: createRule({ multiplier: 2 }) });
      expect(
        screen.getByText(/NLS overtime.wizard.rules.multiplier.2/i),
      ).toBeInTheDocument();
    });
  });

  describe('Prevent Deselection Feature', () => {
    it('should pass shouldPreventDeselection to DaysOfWeekDropdown when true', () => {
      renderComponent({
        selected: true,
        rule: createRule({ type: 'daily' }),
        shouldPreventDeselection: true,
      });
      const dropdown = screen.getByTestId('days-of-week-dropdown');
      expect(dropdown.getAttribute('data-prevent-deselection')).toBe('true');
    });

    it('should pass shouldPreventDeselection to DaysOfWeekDropdown when false', () => {
      renderComponent({
        selected: true,
        rule: createRule({ type: 'daily' }),
        shouldPreventDeselection: false,
      });
      const dropdown = screen.getByTestId('days-of-week-dropdown');
      expect(dropdown.getAttribute('data-prevent-deselection')).toBe('false');
    });

    it('should default shouldPreventDeselection to false when not provided', () => {
      renderComponent({
        selected: true,
        rule: createRule({ type: 'daily' }),
      });
      const dropdown = screen.getByTestId('days-of-week-dropdown');
      expect(dropdown.getAttribute('data-prevent-deselection')).toBe('false');
    });

    it('should not pass shouldPreventDeselection for non-daily rules', () => {
      renderComponent({
        selected: true,
        rule: createRule({ type: 'weekly' }),
        shouldPreventDeselection: true,
      });
      expect(
        screen.queryByTestId('days-of-week-dropdown'),
      ).not.toBeInTheDocument();
    });
  });
});
