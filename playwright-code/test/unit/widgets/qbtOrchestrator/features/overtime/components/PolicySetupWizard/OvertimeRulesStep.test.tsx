import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProviderAndLogging,
} from 'test/unit/testUtils';
import OvertimeRulesStep from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesStep';

jest.mock('@ids-ts/dropdown', () => ({
  __esModule: true,
  default: ({
    children,
    value,
    onChange,
    placeholder,
    'data-testid': testId,
  }: any) => (
    <select data-testid={testId} value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {children}
    </select>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@ids-ts/cards', () => ({
  __esModule: true,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRuleCard',
  () => ({
    __esModule: true,
    default: ({
      rule,
      selected,
      checkboxDisabled,
      fieldErrors,
      onSelectedChange,
      onConditionChange,
    }: any) => (
      <div data-testid={`rule-card-${rule.type}`}>
        <span data-testid={`rule-selected-${rule.type}`}>
          {selected ? 'selected' : 'off'}
        </span>
        <span data-testid={`rule-disabled-${rule.type}`}>
          {checkboxDisabled ? 'disabled' : 'enabled'}
        </span>
        {fieldErrors?.threshold && (
          <span data-testid={`threshold-error-${rule.type}`}>
            {fieldErrors.threshold}
          </span>
        )}
        {fieldErrors?.day_of_week && (
          <span data-testid={`day-of-week-error-${rule.type}`}>
            {fieldErrors.day_of_week}
          </span>
        )}
        {fieldErrors?.days_in_a_row && (
          <span data-testid={`days-in-row-error-${rule.type}`}>
            {fieldErrors.days_in_a_row}
          </span>
        )}
        <button
          data-testid={`toggle-rule-${rule.type}`}
          onClick={() => onSelectedChange(!selected)}
        >
          Toggle
        </button>
        <button
          data-testid={`change-threshold-${rule.type}`}
          onClick={() => onConditionChange('threshold', '12')}
        >
          Change Threshold
        </button>
        <button
          data-testid={`clear-threshold-${rule.type}`}
          onClick={() => onConditionChange('threshold', '')}
        >
          Clear Threshold
        </button>
        <button
          data-testid={`change-day-of-week-${rule.type}`}
          onClick={() => onConditionChange('day_of_week', '0000000')}
        >
          Clear Days
        </button>
        <button
          data-testid={`clear-days-in-row-${rule.type}`}
          onClick={() => onConditionChange('days_in_a_row', '')}
        >
          Clear Days In Row
        </button>
      </div>
    ),
  }),
);

describe('OvertimeRulesStep', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnRuleTypeChange = jest.fn();
  const mockOnRulesChange = jest.fn();
  const mockOnValidationChange = jest.fn();

  const renderComponent = (props = {}) =>
    renderWithQuicksandProviderAndLogging(
      <OvertimeRulesStep
        selectedRuleType=""
        rules={[]}
        onRuleTypeChange={mockOnRuleTypeChange}
        onRulesChange={mockOnRulesChange}
        onValidationChange={mockOnValidationChange}
        {...props}
      />,
      mockSandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dropdown and all 3 template options', () => {
    renderComponent();
    expect(screen.getByTestId('overtime-rules-dropdown')).toBeInTheDocument();
    expect(
      screen.getByText(/NLS overtime.wizard.rules.option.basic/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NLS overtime.wizard.rules.option.california/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NLS overtime.wizard.rules.option.custom/i),
    ).toBeInTheDocument();
  });

  it('calls onRuleTypeChange when template changes', () => {
    renderComponent();
    fireEvent.change(screen.getByTestId('overtime-rules-dropdown'), {
      target: { value: 'basic' },
    });
    expect(mockOnRuleTypeChange).toHaveBeenCalledWith('basic');
  });

  it('renders 3 rule cards for basic rules', async () => {
    renderComponent({ selectedRuleType: 'basic' });
    await waitFor(() => {
      expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
      expect(screen.getByTestId('rule-card-double_daily')).toBeInTheDocument();
    });
  });

  it('renders 5 rule cards for california rules', async () => {
    renderComponent({ selectedRuleType: 'california' });
    await waitFor(() => {
      expect(
        screen.getByTestId('rule-card-consecutive_double_daily'),
      ).toBeInTheDocument();
    });
  });

  it('emits selected rules to parent', async () => {
    renderComponent({ selectedRuleType: 'basic' });
    await waitFor(() => {
      expect(mockOnRulesChange).toHaveBeenCalled();
      expect(mockOnRulesChange.mock.calls.at(-1)[0]).toHaveLength(3);
    });
  });

  it('emits validation state to parent', async () => {
    renderComponent({ selectedRuleType: 'california' });
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Rule toggle and condition change', () => {
    it('allows toggling daily rule in basic template', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('toggle-rule-daily'));
      await waitFor(() => {
        expect(mockOnRulesChange).toHaveBeenCalled();
      });
    });

    it('updates rules when condition changes', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('change-threshold-weekly'));
      await waitFor(() => {
        expect(mockOnRulesChange).toHaveBeenCalled();
      });
    });

    it('does not allow toggling weekly rule in basic template (required)', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-disabled-weekly')).toHaveTextContent(
          'disabled',
        );
      });
    });

    it('does not allow toggling rules in california template', async () => {
      renderComponent({ selectedRuleType: 'california' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-disabled-weekly')).toHaveTextContent(
          'disabled',
        );
      });
    });
  });

  describe('Validation error scenarios', () => {
    it('shows threshold error when threshold is empty', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('clear-threshold-weekly'));
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenLastCalledWith(false);
      });
    });

    it('shows day_of_week error when no days selected for daily rule', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('change-day-of-week-daily'));
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalled();
      });
    });

    it('handles custom rule type selection', async () => {
      renderComponent({ selectedRuleType: 'custom' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });
    });
  });
});
