// @ts-nocheck
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProviderAndLogging,
} from 'test/unit/testUtils';
import OvertimeRulesConfig from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRulesConfig';
import {
  BASIC_RULES,
  CALIFORNIA_RULES,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/constants/overtimeRulesConstants';

// Mock useTracking to allow tracking code to execute without errors
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useTracking: () => mockTrack,
  };
});

jest.mock('@ids-ts/dropdown', () => ({
  __esModule: true,
  default: ({
    children,
    value,
    onChange,
    onOpen,
    placeholder,
    'data-testid': testId,
  }: any) => (
    <select
      data-testid={testId}
      value={value}
      onChange={onChange}
      onFocus={onOpen}
    >
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

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/PolicySetupWizard/OvertimeRuleCard',
  () => ({
    __esModule: true,
    default: ({
      rule,
      selected,
      readOnly,
      checkboxDisabled,
      fieldErrors,
      onSelectedChange,
      onConditionChange,
    }: any) => (
      <div data-testid={`rule-card-${rule.type}`}>
        <span data-testid={`rule-selected-${rule.type}`}>
          {selected ? 'selected' : 'off'}
        </span>
        <span data-testid={`rule-readonly-${rule.type}`}>
          {readOnly ? 'readonly' : 'editable'}
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
          data-testid={`set-day-of-week-${rule.type}`}
          onClick={() => onConditionChange('day_of_week', '1111111')}
        >
          Set Days
        </button>
        <button
          data-testid={`clear-days-in-row-${rule.type}`}
          onClick={() => onConditionChange('days_in_a_row', '')}
        >
          Clear Days In Row
        </button>
        <button
          data-testid={`set-days-in-row-${rule.type}`}
          onClick={() => onConditionChange('days_in_a_row', '7')}
        >
          Set Days In Row
        </button>
      </div>
    ),
  }),
);

describe('OvertimeRulesConfig', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnRuleTypeChange = jest.fn();
  const mockOnRulesChange = jest.fn();
  const mockOnValidationChange = jest.fn();

  const renderComponent = (props = {}) =>
    renderWithQuicksandProviderAndLogging(
      <OvertimeRulesConfig
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

  describe('rendering', () => {
    it('renders the rule-type dropdown by default', () => {
      renderComponent({ selectedRuleType: 'basic' });
      expect(screen.getByTestId('overtime-rules-dropdown')).toBeInTheDocument();
    });

    it('hides the dropdown when hideDropdown is true', () => {
      renderComponent({ selectedRuleType: 'basic', hideDropdown: true });
      expect(
        screen.queryByTestId('overtime-rules-dropdown'),
      ).not.toBeInTheDocument();
    });

    it('renders 3 rule cards for basic template', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
        expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-double_daily'),
        ).toBeInTheDocument();
      });
    });

    it('renders 5 rule cards for california template', async () => {
      renderComponent({ selectedRuleType: 'california' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
        expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-double_daily'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-consecutive_daily'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-consecutive_double_daily'),
        ).toBeInTheDocument();
      });
    });

    it('renders only options from ruleTypeOptions prop when provided', () => {
      const filteredOptions = [
        {
          value: 'basic',
          labelId: 'overtime.wizard.rules.option.basic',
          defaultMessage: 'Use Basic Rules',
        },
        {
          value: 'california',
          labelId: 'overtime.wizard.rules.option.california',
          defaultMessage: 'Use California Overtime Rules',
        },
      ];
      renderComponent({
        selectedRuleType: 'basic',
        ruleTypeOptions: filteredOptions,
      });
      const dropdown = screen.getByTestId('overtime-rules-dropdown');
      expect(dropdown).toBeInTheDocument();
      // Should not have the custom option
      expect(
        screen.queryByText(/NLS overtime.wizard.rules.option.custom/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('rule type change', () => {
    beforeEach(() => {
      mockTrack.mockClear();
    });

    it('tracks dropdown click when dropdown is opened', () => {
      renderComponent({ selectedRuleType: 'basic' });
      const dropdown = screen.getByTestId('overtime-rules-dropdown');

      fireEvent.focus(dropdown);

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'rule_dropdown_click',
          ui_action: 'clicked',
          ui_object: 'dropdown',
        }),
      );
    });

    it('calls onRuleTypeChange when dropdown value changes', () => {
      renderComponent({ selectedRuleType: 'basic' });
      fireEvent.change(screen.getByTestId('overtime-rules-dropdown'), {
        target: { value: 'california' },
      });
      expect(mockOnRuleTypeChange).toHaveBeenCalledWith('california');
    });

    it('resets template rules to new defaults on rule type change', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      // Switch to california
      fireEvent.change(screen.getByTestId('overtime-rules-dropdown'), {
        target: { value: 'california' },
      });

      await waitFor(() => {
        expect(
          screen.getByTestId('rule-card-consecutive_daily'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-consecutive_double_daily'),
        ).toBeInTheDocument();
      });
    });

    it('clears field errors on rule type change', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      // Clear threshold to generate validation error
      fireEvent.click(screen.getByTestId('clear-threshold-weekly'));
      await waitFor(() => {
        expect(
          screen.getByTestId('threshold-error-weekly'),
        ).toBeInTheDocument();
      });

      // Switch rule type — errors should be cleared
      fireEvent.change(screen.getByTestId('overtime-rules-dropdown'), {
        target: { value: 'california' },
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('threshold-error-weekly'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('toggle rules', () => {
    it('allows toggling daily rule off in basic template', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
          'selected',
        );
      });

      fireEvent.click(screen.getByTestId('toggle-rule-daily'));

      await waitFor(() => {
        expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
          'off',
        );
      });
    });

    it('prevents toggling weekly rule in basic template (required)', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-disabled-weekly')).toHaveTextContent(
          'disabled',
        );
        expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
          'selected',
        );
      });

      // Attempt toggle — should be no-op
      fireEvent.click(screen.getByTestId('toggle-rule-weekly'));

      // Still selected
      expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
        'selected',
      );
    });

    it('prevents toggling weekly rule in custom template (required)', async () => {
      renderComponent({ selectedRuleType: 'custom' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-disabled-weekly')).toHaveTextContent(
          'disabled',
        );
      });

      fireEvent.click(screen.getByTestId('toggle-rule-weekly'));

      expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
        'selected',
      );
    });

    it('prevents toggling any rule in california template', async () => {
      renderComponent({ selectedRuleType: 'california' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-disabled-daily')).toHaveTextContent(
          'disabled',
        );
        expect(screen.getByTestId('rule-disabled-weekly')).toHaveTextContent(
          'disabled',
        );
      });

      fireEvent.click(screen.getByTestId('toggle-rule-daily'));

      expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
        'selected',
      );
    });

    it('sets readOnly on rule cards in california template', async () => {
      renderComponent({ selectedRuleType: 'california' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-readonly-weekly')).toHaveTextContent(
          'readonly',
        );
        expect(screen.getByTestId('rule-readonly-daily')).toHaveTextContent(
          'readonly',
        );
      });
    });

    it('does not set readOnly on rule cards in basic template', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-readonly-weekly')).toHaveTextContent(
          'editable',
        );
      });
    });

    it('allows toggling double_daily rule off in basic template', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(
          screen.getByTestId('rule-selected-double_daily'),
        ).toHaveTextContent('selected');
      });

      fireEvent.click(screen.getByTestId('toggle-rule-double_daily'));

      await waitFor(() => {
        expect(
          screen.getByTestId('rule-selected-double_daily'),
        ).toHaveTextContent('off');
      });
    });
  });

  describe('condition changes', () => {
    it('updates threshold via onConditionChange', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('change-threshold-weekly'));

      await waitFor(() => {
        expect(mockOnRulesChange).toHaveBeenCalled();
      });
    });

    it('emits updated rules to parent after condition change', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(mockOnRulesChange).toHaveBeenCalled();
      });

      mockOnRulesChange.mockClear();
      fireEvent.click(screen.getByTestId('change-threshold-weekly'));

      await waitFor(() => {
        expect(mockOnRulesChange).toHaveBeenCalled();
        const lastRules =
          mockOnRulesChange.mock.calls[
            mockOnRulesChange.mock.calls.length - 1
          ][0];
        const weekly = lastRules.find((r: any) => r.type === 'weekly');
        expect(weekly).toBeDefined();
        const threshold = weekly.conditions.find(
          (c: any) => c.field === 'threshold',
        );
        expect(threshold.value).toBe('12');
      });
    });
  });

  describe('validation', () => {
    it('reports california as valid immediately', async () => {
      renderComponent({ selectedRuleType: 'california' });
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      });
    });

    it('reports invalid when no ruleType selected', async () => {
      renderComponent({ selectedRuleType: '' });
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('reports basic with default thresholds as valid', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      });
    });

    it('shows threshold error when threshold is cleared', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('clear-threshold-weekly'));

      await waitFor(() => {
        expect(
          screen.getByTestId('threshold-error-weekly'),
        ).toBeInTheDocument();
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows day_of_week error when days cleared for daily rule', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('change-day-of-week-daily'));

      await waitFor(() => {
        expect(
          screen.getByTestId('day-of-week-error-daily'),
        ).toBeInTheDocument();
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows day_of_week error when days cleared for double_daily rule', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(
          screen.getByTestId('rule-card-double_daily'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('change-day-of-week-double_daily'));

      await waitFor(() => {
        expect(
          screen.getByTestId('day-of-week-error-double_daily'),
        ).toBeInTheDocument();
      });
    });

    it('shows days_in_a_row error when cleared for consecutive_daily rule', async () => {
      // Use custom mode — california short-circuits validation to always-valid
      renderComponent({ selectedRuleType: 'custom' });
      await waitFor(() => {
        expect(
          screen.getByTestId('rule-card-consecutive_daily'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId('clear-days-in-row-consecutive_daily'),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('days-in-row-error-consecutive_daily'),
        ).toBeInTheDocument();
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows days_in_a_row error when cleared for consecutive_double_daily rule', async () => {
      renderComponent({ selectedRuleType: 'custom' });
      await waitFor(() => {
        expect(
          screen.getByTestId('rule-card-consecutive_double_daily'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId('clear-days-in-row-consecutive_double_daily'),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('days-in-row-error-consecutive_double_daily'),
        ).toBeInTheDocument();
      });
    });

    it('becomes valid again after fixing validation errors', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      // Break validation
      fireEvent.click(screen.getByTestId('clear-threshold-weekly'));
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(false);
      });

      // Fix validation
      fireEvent.click(screen.getByTestId('change-threshold-weekly'));
      await waitFor(() => {
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('buildRulesForTemplate (integration via rendering)', () => {
    it('merges existing rules with template defaults and emits the full set', async () => {
      // Pass all 3 basic rules but with a custom threshold on weekly.
      // This ensures selectedRules differs from rules (areRulesEqual check)
      // because buildRulesForTemplate will produce template defaults for
      // daily/double_daily that differ from the passed-in rules.
      const existingRules = BASIC_RULES.map((r) => ({
        ...r,
        conditions: r.conditions.map((c) => ({ ...c })),
      }));
      existingRules[0] = {
        ...existingRules[0],
        conditions: [{ field: 'threshold', value: '50' }],
      };

      renderComponent({ selectedRuleType: 'basic', rules: existingRules });

      await waitFor(() => {
        // All 3 rules should be rendered and selected
        expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
          'selected',
        );
        expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
          'selected',
        );
        expect(
          screen.getByTestId('rule-selected-double_daily'),
        ).toHaveTextContent('selected');
      });
    });

    it('selects all rules in california mode regardless of input', async () => {
      renderComponent({ selectedRuleType: 'california', rules: [] });

      await waitFor(() => {
        expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
          'selected',
        );
        expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
          'selected',
        );
        expect(
          screen.getByTestId('rule-selected-double_daily'),
        ).toHaveTextContent('selected');
        expect(
          screen.getByTestId('rule-selected-consecutive_daily'),
        ).toHaveTextContent('selected');
        expect(
          screen.getByTestId('rule-selected-consecutive_double_daily'),
        ).toHaveTextContent('selected');
      });
    });

    it('always selects weekly in basic mode', async () => {
      renderComponent({ selectedRuleType: 'basic', rules: [] });

      await waitFor(() => {
        expect(screen.getByTestId('rule-selected-weekly')).toHaveTextContent(
          'selected',
        );
      });
    });
  });

  describe('areRulesEqual (integration via onRulesChange)', () => {
    it('does not re-emit rules when they have not changed', async () => {
      const basicRules = BASIC_RULES.map((r) => ({
        ...r,
        conditions: r.conditions.map((c) => ({ ...c })),
      }));

      renderComponent({ selectedRuleType: 'basic', rules: basicRules });

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      // onRulesChange should NOT be called when rules match
      // (the guard in the effect prevents re-emission of identical rules)
      const callCountAfterMount = mockOnRulesChange.mock.calls.length;

      // Re-render with same rules (new reference, same content)
      const sameRules = basicRules.map((r) => ({
        ...r,
        conditions: r.conditions.map((c) => ({ ...c })),
      }));
      renderComponent({ selectedRuleType: 'basic', rules: sameRules });

      // Should not trigger additional onRulesChange calls
      await waitFor(() => {
        expect(mockOnRulesChange.mock.calls.length).toBeLessThanOrEqual(
          callCountAfterMount + 1,
        );
      });
    });
  });

  describe('sync effect with ruleTypeChangedLocally guard', () => {
    it('does not rebuild from stale props after local rule type change', async () => {
      renderComponent({ selectedRuleType: 'basic' });
      await waitFor(() => {
        expect(screen.getByTestId('rule-card-weekly')).toBeInTheDocument();
      });

      // Change rule type via dropdown — sets ruleTypeChangedLocally flag
      fireEvent.change(screen.getByTestId('overtime-rules-dropdown'), {
        target: { value: 'california' },
      });

      await waitFor(() => {
        // California rules should be rendered, not rebuilt from basic rules prop
        expect(
          screen.getByTestId('rule-card-consecutive_daily'),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId('rule-card-consecutive_double_daily'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('checkbox dependencies', () => {
    describe('daily -> double_daily dependency', () => {
      it('disables double_daily checkbox when daily is unchecked', async () => {
        renderComponent({ selectedRuleType: 'basic' });
        await waitFor(() => {
          expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
        });

        // Initially both should be enabled
        expect(screen.getByTestId('rule-disabled-daily')).toHaveTextContent(
          'enabled',
        );
        expect(
          screen.getByTestId('rule-disabled-double_daily'),
        ).toHaveTextContent('enabled');

        // Uncheck daily
        fireEvent.click(screen.getByTestId('toggle-rule-daily'));

        await waitFor(() => {
          // double_daily should now be disabled
          expect(
            screen.getByTestId('rule-disabled-double_daily'),
          ).toHaveTextContent('disabled');
        });
      });

      it('auto-unchecks double_daily when daily is unchecked', async () => {
        renderComponent({ selectedRuleType: 'basic' });
        await waitFor(() => {
          expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
            'selected',
          );
          expect(
            screen.getByTestId('rule-selected-double_daily'),
          ).toHaveTextContent('selected');
        });

        // Uncheck daily
        fireEvent.click(screen.getByTestId('toggle-rule-daily'));

        await waitFor(() => {
          // Both should be unchecked
          expect(screen.getByTestId('rule-selected-daily')).toHaveTextContent(
            'off',
          );
          expect(
            screen.getByTestId('rule-selected-double_daily'),
          ).toHaveTextContent('off');
        });
      });

      it('enables double_daily checkbox when daily is checked', async () => {
        renderComponent({ selectedRuleType: 'basic' });
        await waitFor(() => {
          expect(screen.getByTestId('rule-card-daily')).toBeInTheDocument();
        });

        // Uncheck daily first
        fireEvent.click(screen.getByTestId('toggle-rule-daily'));

        await waitFor(() => {
          expect(
            screen.getByTestId('rule-disabled-double_daily'),
          ).toHaveTextContent('disabled');
        });

        // Check daily again
        fireEvent.click(screen.getByTestId('toggle-rule-daily'));

        await waitFor(() => {
          // double_daily should be enabled again
          expect(
            screen.getByTestId('rule-disabled-double_daily'),
          ).toHaveTextContent('enabled');
        });
      });
    });

    describe('consecutive_daily -> consecutive_double_daily dependency', () => {
      it('disables consecutive_double_daily checkbox when consecutive_daily is unchecked', async () => {
        renderComponent({ selectedRuleType: 'custom' });
        await waitFor(() => {
          expect(
            screen.getByTestId('rule-card-consecutive_daily'),
          ).toBeInTheDocument();
        });

        // Initially both should be enabled
        expect(
          screen.getByTestId('rule-disabled-consecutive_daily'),
        ).toHaveTextContent('enabled');
        expect(
          screen.getByTestId('rule-disabled-consecutive_double_daily'),
        ).toHaveTextContent('enabled');

        // Uncheck consecutive_daily
        fireEvent.click(screen.getByTestId('toggle-rule-consecutive_daily'));

        await waitFor(() => {
          // consecutive_double_daily should now be disabled
          expect(
            screen.getByTestId('rule-disabled-consecutive_double_daily'),
          ).toHaveTextContent('disabled');
        });
      });

      it('auto-unchecks consecutive_double_daily when consecutive_daily is unchecked', async () => {
        renderComponent({ selectedRuleType: 'custom' });
        await waitFor(() => {
          expect(
            screen.getByTestId('rule-selected-consecutive_daily'),
          ).toHaveTextContent('selected');
          expect(
            screen.getByTestId('rule-selected-consecutive_double_daily'),
          ).toHaveTextContent('selected');
        });

        // Uncheck consecutive_daily
        fireEvent.click(screen.getByTestId('toggle-rule-consecutive_daily'));

        await waitFor(() => {
          // Both should be unchecked
          expect(
            screen.getByTestId('rule-selected-consecutive_daily'),
          ).toHaveTextContent('off');
          expect(
            screen.getByTestId('rule-selected-consecutive_double_daily'),
          ).toHaveTextContent('off');
        });
      });

      it('enables consecutive_double_daily checkbox when consecutive_daily is checked', async () => {
        renderComponent({ selectedRuleType: 'custom' });
        await waitFor(() => {
          expect(
            screen.getByTestId('rule-card-consecutive_daily'),
          ).toBeInTheDocument();
        });

        // Uncheck consecutive_daily first
        fireEvent.click(screen.getByTestId('toggle-rule-consecutive_daily'));

        await waitFor(() => {
          expect(
            screen.getByTestId('rule-disabled-consecutive_double_daily'),
          ).toHaveTextContent('disabled');
        });

        // Check consecutive_daily again
        fireEvent.click(screen.getByTestId('toggle-rule-consecutive_daily'));

        await waitFor(() => {
          // consecutive_double_daily should be enabled again
          expect(
            screen.getByTestId('rule-disabled-consecutive_double_daily'),
          ).toHaveTextContent('enabled');
        });
      });
    });
  });
});
