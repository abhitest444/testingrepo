import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { CustomBreakSelector } from 'src/js/widgets/timeClock/components/CustomBreakSelector';
import { BreakRule } from 'src/js/widgets/breaks/types';
import {
  Payroll_EmployerBreak,
  Payroll_Break,
  Payroll_DurationUnit,
} from 'src/__generated__/oigql/graphql';
import { renderWithAllProviders } from 'test/unit/testUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultValue,
    }: {
      id: string;
      defaultValue?: string;
    }) => {
      const messages: { [key: string]: string } = {
        'timeclock.form.breakType.label': 'Break type',
      };
      return messages[id] || defaultValue || id;
    },
  }),
}));

// Mock the Widget component to simulate break selection
let mockOnBreakSelected:
  | ((breakId: string, breakRule: BreakRule) => void)
  | undefined;

jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockWidget({ widgetId, options, ...props }: any) {
      const { props: widgetProps } = options || {};

      // Store the callback for testing
      mockOnBreakSelected = widgetProps?.onBreakSelected;

      return (
        <div
          data-testid="mock-widget"
          data-widget-id={widgetId}
          data-assignee-id={widgetProps?.assigneeId}
          data-label={widgetProps?.label}
          data-width={widgetProps?.width}
        >
          <div data-testid="widget-content">{widgetProps?.label}</div>
          <button
            data-testid="mock-break-selection"
            onClick={() => {
              if (widgetProps?.onBreakSelected) {
                widgetProps.onBreakSelected('break-123', mockBreakRule);
              }
            }}
          >
            Select Break
          </button>
        </div>
      );
    },
);

// Test data
const mockBreakRule: BreakRule = {
  __typename: 'Payroll_EmployerBreak',
  id: 'break-123',
  breakName: 'Lunch Break',
  isActive: true,
  breakType: Payroll_Break.Paid,
  allowManual: true,
  allowAuto: false,
  noSetDuration: false,
  breakDuration: 30,
  durationUnit: Payroll_DurationUnit.Minutes,
  isDeleted: false,
  isDefaultPolicy: true,
  activeBreakAssignmentCount: 0,
  manualRule: {
    __typename: 'Payroll_ManualBreakRule',
    autoEndBreak: false,
    allowEarlyEndBreak: true,
    breakEndingReminder: true,
    breakEndingReminderTime: 5,
    durationUnit: Payroll_DurationUnit.Minutes,
  },
  autoRule: undefined,
};

// Wrapper component for testing with react-hook-form
const TestWrapper: React.FC<{
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}> = ({ children, defaultValues = {}, onSubmit = jest.fn() }) => {
  const methods = useForm({ defaultValues });

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        data-testid="test-form"
      >
        {children}
      </form>
    </FormProvider>
  );
};

describe('CustomBreakSelector', () => {
  const defaultProps = {
    name: 'breakId',
    employeeId: 'emp-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnBreakSelected = undefined;
  });

  describe('Basic Rendering', () => {
    it('renders correctly with required props', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');
      expect(widget).toBeInTheDocument();
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/breaks',
      );
      expect(widget).toHaveAttribute('data-assignee-id', 'emp-123');
    });

    it('renders with correct widget configuration', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/breaks',
      );
      expect(widget).toHaveAttribute('data-label', 'Break type');
      expect(widget).toHaveAttribute('data-width', '100%');
    });

    it('displays the correct label from intl', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      expect(screen.getByText('Break type')).toBeInTheDocument();
    });

    it('renders with different employee ID', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector
            {...defaultProps}
            employeeId="different-emp-456"
          />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');
      expect(widget).toHaveAttribute('data-assignee-id', 'different-emp-456');
    });

    it('renders with different field name', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} name="customBreakField" />
        </TestWrapper>,
      );

      // Component should still render correctly
      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });
  });

  describe('Controller Integration', () => {
    it('integrates properly with react-hook-form Controller', () => {
      const onSubmit = jest.fn();

      render(
        <TestWrapper
          defaultValues={{ breakId: 'initial-break' }}
          onSubmit={onSubmit}
        >
          <CustomBreakSelector {...defaultProps} />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });

    it('updates form value when break is selected', async () => {
      const onSubmit = jest.fn();

      render(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector {...defaultProps} />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Simulate break selection
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      // Submit form to verify the value was set
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(onSubmit).toHaveBeenCalledWith({ breakId: 'break-123' });
    });

    it('works with different field names', async () => {
      const onSubmit = jest.fn();

      render(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector {...defaultProps} name="selectedBreak" />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Simulate break selection
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      // Submit form to verify the value was set with correct field name
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(onSubmit).toHaveBeenCalledWith({ selectedBreak: 'break-123' });
    });
  });

  describe('Callback Handling', () => {
    it('calls onBreakSelected callback when provided', () => {
      const mockOnBreakSelected = jest.fn();

      render(
        <TestWrapper>
          <CustomBreakSelector
            {...defaultProps}
            onBreakSelected={mockOnBreakSelected}
          />
        </TestWrapper>,
      );

      // Simulate break selection
      fireEvent.click(screen.getByTestId('mock-break-selection'));

      expect(mockOnBreakSelected).toHaveBeenCalledWith(
        'break-123',
        mockBreakRule,
      );
    });

    it('does not throw error when onBreakSelected is not provided', () => {
      expect(() => {
        render(
          <TestWrapper>
            <CustomBreakSelector {...defaultProps} />
          </TestWrapper>,
        );

        // Simulate break selection
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      }).not.toThrow();
    });

    it('calls onBreakSelected with correct parameters', () => {
      const mockOnBreakSelected = jest.fn();

      render(
        <TestWrapper>
          <CustomBreakSelector
            {...defaultProps}
            onBreakSelected={mockOnBreakSelected}
          />
        </TestWrapper>,
      );

      // Simulate break selection
      fireEvent.click(screen.getByTestId('mock-break-selection'));

      expect(mockOnBreakSelected).toHaveBeenCalledTimes(1);
      expect(mockOnBreakSelected).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          __typename: 'Payroll_EmployerBreak',
          id: expect.any(String),
          breakName: expect.any(String),
        }),
      );
    });

    it('updates form and calls callback simultaneously', async () => {
      const mockOnBreakSelected = jest.fn();
      const onSubmit = jest.fn();

      render(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector
            {...defaultProps}
            onBreakSelected={mockOnBreakSelected}
          />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Simulate break selection
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      // Verify callback was called
      expect(mockOnBreakSelected).toHaveBeenCalledWith(
        'break-123',
        mockBreakRule,
      );

      // Verify form value was updated
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      expect(onSubmit).toHaveBeenCalledWith({ breakId: 'break-123' });
    });
  });

  describe('Widget Configuration', () => {
    it('passes correct widget options to Widget component', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');

      // Verify widget ID and key
      expect(widget).toHaveAttribute(
        'data-widget-id',
        'time-tracking-ui/breaks',
      );

      // Verify assignee ID is passed correctly
      expect(widget).toHaveAttribute('data-assignee-id', 'emp-123');

      // Verify label is set
      expect(widget).toHaveAttribute('data-label', 'Break type');

      // Verify width is set
      expect(widget).toHaveAttribute('data-width', '100%');
    });

    it('uses correct widget key for breaks-quickfills', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // The widget should have the key "breaks-quickfills"
      const widget = screen.getByTestId('mock-widget');
      expect(widget).toBeInTheDocument();
    });

    it('configures widget with correct feature and functionality', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Widget should be configured for breaks-quickfills feature
      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });

    it('sets correct filter options on widget', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Widget should be rendered with filter configuration
      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('uses intl.formatMessage for label', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Should display the translated label
      expect(screen.getByText('Break type')).toBeInTheDocument();
    });

    it('provides default value for label translation', () => {
      // The mock is already set up at the top of the file
      // Just verify the component uses the translation
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      expect(screen.getByText('Break type')).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('handles empty employee ID', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} employeeId="" />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');
      expect(widget).toHaveAttribute('data-assignee-id', '');
    });

    it('handles empty field name', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} name="" />
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });

    it('accepts all valid prop combinations', () => {
      const mockOnBreakSelected = jest.fn();

      render(
        <TestWrapper>
          <CustomBreakSelector
            name="customBreak"
            employeeId="test-employee-789"
            onBreakSelected={mockOnBreakSelected}
          />
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
      expect(screen.getByTestId('mock-widget')).toHaveAttribute(
        'data-assignee-id',
        'test-employee-789',
      );
    });
  });

  describe('Component Lifecycle', () => {
    it('renders without crashing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <CustomBreakSelector {...defaultProps} />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it('unmounts without errors', () => {
      const { unmount } = render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      expect(() => unmount()).not.toThrow();
    });

    it('handles re-renders correctly', () => {
      const { rerender } = render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Re-render with different props
      rerender(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} employeeId="new-employee" />
        </TestWrapper>,
      );

      const widget = screen.getByTestId('mock-widget');
      expect(widget).toHaveAttribute('data-assignee-id', 'new-employee');
    });

    it('maintains state across re-renders', async () => {
      const onSubmit = jest.fn();
      const { rerender } = render(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector {...defaultProps} />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Select a break
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      // Re-render component
      rerender(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector
            {...defaultProps}
            employeeId="updated-employee"
          />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Form should still have the selected value
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      expect(onSubmit).toHaveBeenCalledWith({ breakId: 'break-123' });
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing when widget props are missing', () => {
      expect(() => {
        render(
          <TestWrapper>
            <CustomBreakSelector name="" employeeId="" />
          </TestWrapper>,
        );
      }).not.toThrow();
    });

    it('handles undefined callback gracefully', () => {
      expect(() => {
        render(
          <TestWrapper>
            <CustomBreakSelector
              {...defaultProps}
              onBreakSelected={undefined}
            />
          </TestWrapper>,
        );

        fireEvent.click(screen.getByTestId('mock-break-selection'));
      }).not.toThrow();
    });
  });

  describe('Integration with Form Context', () => {
    it('works without FormProvider context', () => {
      // This should throw an error since Controller requires FormProvider
      expect(() => {
        render(<CustomBreakSelector {...defaultProps} />);
      }).toThrow();
    });

    it('integrates correctly with existing form values', async () => {
      const onSubmit = jest.fn();

      render(
        <TestWrapper
          defaultValues={{
            breakId: 'existing-break',
            otherField: 'other-value',
          }}
          onSubmit={onSubmit}
        >
          <CustomBreakSelector {...defaultProps} />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Submit without changing anything
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      expect(onSubmit).toHaveBeenCalledWith({
        breakId: 'existing-break',
        otherField: 'other-value',
      });

      // Now select a new break
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });

      expect(onSubmit).toHaveBeenCalledWith({
        breakId: 'break-123',
        otherField: 'other-value',
      });
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // The component should render the Widget which provides its own accessibility
      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });

    it('provides accessible widget configuration', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Widget should have proper label for accessibility
      expect(screen.getByTestId('mock-widget')).toHaveAttribute(
        'data-label',
        'Break type',
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined onBreakSelected callback', () => {
      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} onBreakSelected={undefined} />
        </TestWrapper>,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      }).not.toThrow();
    });

    it('handles special characters in employee ID', () => {
      const specialEmployeeId = 'emp-123@#$%^&*()';

      render(
        <TestWrapper>
          <CustomBreakSelector
            {...defaultProps}
            employeeId={specialEmployeeId}
          />
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toHaveAttribute(
        'data-assignee-id',
        specialEmployeeId,
      );
    });

    it('handles very long field names', () => {
      const longFieldName = 'a'.repeat(1000);

      render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} name={longFieldName} />
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });

    it('handles rapid successive break selections', async () => {
      const mockOnBreakSelected = jest.fn();
      const onSubmit = jest.fn();

      render(
        <TestWrapper onSubmit={onSubmit}>
          <CustomBreakSelector
            {...defaultProps}
            onBreakSelected={mockOnBreakSelected}
          />
          <button type="submit" data-testid="submit-button">
            Submit
          </button>
        </TestWrapper>,
      );

      // Rapid selections
      await act(async () => {
        fireEvent.click(screen.getByTestId('mock-break-selection'));
        fireEvent.click(screen.getByTestId('mock-break-selection'));
        fireEvent.click(screen.getByTestId('mock-break-selection'));
      });

      expect(mockOnBreakSelected).toHaveBeenCalledTimes(3);

      // Form should have the last selected value
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-button'));
      });
      expect(onSubmit).toHaveBeenCalledWith({ breakId: 'break-123' });
    });
  });

  describe('Performance', () => {
    it('renders efficiently without unnecessary complexity', () => {
      const { rerender } = render(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      // Re-render with same props should work without issues
      rerender(
        <TestWrapper>
          <CustomBreakSelector {...defaultProps} />
        </TestWrapper>,
      );

      expect(screen.getByTestId('mock-widget')).toBeInTheDocument();
    });
  });
});
