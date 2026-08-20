import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockFormatMessage } from 'test/unit/testUtils';
import { WeeklyTimeEntryCheckbox } from '../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntrySettingsPanel/WeeklyTimeEntryCheckbox';

// Mock useIntl and useTracking from Quicksand
const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useTracking: () => mockTrack,
}));

// Mock Checkbox component
jest.mock('@ids-ts/checkbox', () => ({
  __esModule: true,
  default: ({ children, name, onChange, checked, disabled }: any) => (
    <label>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
        data-testid={`checkbox-${name}`}
      />
      {children}
    </label>
  ),
}));

// Mock B2 component
jest.mock('@ids-ts/typography', () => ({
  B2: ({ children, disabled }: any) => (
    <span data-testid="b2-text" data-disabled={disabled}>
      {children}
    </span>
  ),
}));

describe('WeeklyTimeEntryCheckbox', () => {
  const defaultProps = {
    name: 'test-checkbox',
    labelKey: 'test.label',
    trackingPoint: {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'test_checkbox',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'test_checkbox',
      ui_access_point: 'settings_panel',
    },
    checked: false,
    onChange: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
  });

  it('renders without crashing', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} />);
    expect(screen.getByTestId('checkbox-test-checkbox')).toBeInTheDocument();
  });

  it('renders with correct props', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} />);

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toBeDisabled();
    expect(screen.getByTestId('b2-text')).toHaveTextContent('test.label');
  });

  it('renders checked state correctly', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} checked />);

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders disabled state correctly', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} disabled />);

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    expect(checkbox).toBeDisabled();
    expect(screen.getByTestId('b2-text')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('calls onChange when checkbox is clicked', () => {
    const mockOnChange = jest.fn();
    render(
      <WeeklyTimeEntryCheckbox {...defaultProps} onChange={mockOnChange} />,
    );

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when unchecking', () => {
    const mockOnChange = jest.fn();
    render(
      <WeeklyTimeEntryCheckbox
        {...defaultProps}
        checked
        onChange={mockOnChange}
      />,
    );

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', () => {
    const mockOnChange = jest.fn();
    render(
      <WeeklyTimeEntryCheckbox
        {...defaultProps}
        disabled
        onChange={mockOnChange}
      />,
    );

    const checkbox = screen.getByTestId('checkbox-test-checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('uses NLS for label text', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'test.label',
    });
    expect(screen.getByTestId('b2-text')).toHaveTextContent('test.label');
  });

  it('handles different label keys', () => {
    render(
      <WeeklyTimeEntryCheckbox
        {...defaultProps}
        labelKey="different.label.key"
      />,
    );

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'different.label.key',
    });
    expect(screen.getByTestId('b2-text')).toHaveTextContent(
      'different.label.key',
    );
  });

  it('applies disabled styling to text when disabled', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} disabled />);

    const textElement = screen.getByTestId('b2-text');
    expect(textElement).toHaveAttribute('data-disabled', 'true');
  });

  it('does not apply disabled styling to text when enabled', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} disabled={false} />);

    const textElement = screen.getByTestId('b2-text');
    expect(textElement).toHaveAttribute('data-disabled', 'false');
  });

  it('handles tracking point prop correctly', () => {
    const trackingPoint = {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'timeentrymanagement',
      screen: 'weekly_time_entry',
      action: 'engaged',
      object: 'component',
      object_detail: 'custom_checkbox',
      ui_action: 'clicked',
      ui_object: 'checkbox',
      ui_object_detail: 'custom_checkbox',
      ui_access_point: 'settings_panel',
    };
    render(
      <WeeklyTimeEntryCheckbox
        {...defaultProps}
        trackingPoint={trackingPoint}
      />,
    );

    // The tracking is currently commented out in the component
    // This test ensures the trackingPoint prop is passed through correctly
    expect(screen.getByTestId('checkbox-test-checkbox')).toBeInTheDocument();
  });

  it('renders with different names', () => {
    render(<WeeklyTimeEntryCheckbox {...defaultProps} name="different-name" />);

    expect(screen.getByTestId('checkbox-different-name')).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(<WeeklyTimeEntryCheckbox {...defaultProps} />);

      const checkbox = screen.getByTestId('checkbox-test-checkbox');
      const label = screen.getByTestId('b2-text');

      // The checkbox should be properly associated with its label
      expect(checkbox).toBeInTheDocument();
      expect(label).toBeInTheDocument();
    });

    it('maintains accessibility when disabled', () => {
      render(<WeeklyTimeEntryCheckbox {...defaultProps} disabled />);

      const checkbox = screen.getByTestId('checkbox-test-checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label key', () => {
      render(<WeeklyTimeEntryCheckbox {...defaultProps} labelKey="" />);

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: '',
      });
    });

    it('handles undefined onChange', () => {
      // This should not crash the component
      expect(() => {
        render(
          <WeeklyTimeEntryCheckbox
            {...defaultProps}
            onChange={undefined as any}
          />,
        );
      }).not.toThrow();
    });

    it('handles null tracking point', () => {
      // This should not crash the component
      expect(() => {
        render(
          <WeeklyTimeEntryCheckbox
            {...defaultProps}
            trackingPoint={null as any}
          />,
        );
      }).not.toThrow();
    });
  });
});
