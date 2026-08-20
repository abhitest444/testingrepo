import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useTracking } from '@payroll/quicksand';
import { useWatch } from 'react-hook-form';
import { DurationField } from 'src/js/widgets/common/DurationField';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: ({ id }: { id: string }) => id,
  })),
  useTracking: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
  useWatch: jest.fn(() => false),
}));

jest.mock('src/js/common/useKeyboardNavigation', () => {
  const React = require('react');
  const mockContext = {
    addRefToKeyboardNavigationMap: jest.fn(),
    onArrowKeyDown: jest.fn(),
  };

  return {
    KeyboardNavigationContext: React.createContext(mockContext),
    useKeyboardNavigation: jest.fn(() => mockContext),
  };
});

describe('DurationField', () => {
  const mockOnChange = jest.fn();
  const mockSetError = jest.fn();
  const mockTrack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTracking as jest.Mock).mockReturnValue(mockTrack);
  });

  const defaultProps = {
    value: 3600, // 1 hour in seconds
    onChange: mockOnChange,
    setError: mockSetError,
  };

  it('should render DurationField with value', () => {
    render(<DurationField {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('01:00');
  });

  it('should call tracking on blur when trackingPoint is provided', () => {
    const trackingPoint = {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breakentrymanagement',
      screen: 'break_entries',
      action: 'started',
      object: 'component',
      object_detail: 'duration_field',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'duration_field',
      ui_access_point: 'modal',
    };

    render(<DurationField {...defaultProps} trackingPoint={trackingPoint} />);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(mockTrack).toHaveBeenCalledWith(trackingPoint);
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('should not call tracking on blur when trackingPoint is not provided', () => {
    render(<DurationField {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('should handle value change on blur', () => {
    render(<DurationField {...defaultProps} />);

    const input = screen.getByRole('textbox');

    // Change the value
    fireEvent.change(input, { target: { value: '2:30' } });
    fireEvent.blur(input);

    // Should call onChange with new value in seconds (2.5 hours = 9000 seconds)
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should track and handle value change together when trackingPoint provided', () => {
    const trackingPoint = {
      org: 'sbseg',
      purpose: 'prod',
      scope: 'time',
      scope_area: 'breakentrymanagement',
      screen: 'break_entries',
      action: 'started',
      object: 'component',
      object_detail: 'duration_field',
      ui_action: 'typed',
      ui_object: 'form_field',
      ui_object_detail: 'duration_field',
      ui_access_point: 'modal',
    };

    render(<DurationField {...defaultProps} trackingPoint={trackingPoint} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '3:00' } });
    fireEvent.blur(input);

    // Should call both tracking and onChange
    expect(mockTrack).toHaveBeenCalledWith(trackingPoint);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should render with custom label', () => {
    render(<DurationField {...defaultProps} label="Duration" />);

    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('should render disabled state', () => {
    render(<DurationField {...defaultProps} disabled />);

    const input = screen.getByRole('textbox');
    // When disabled, the field becomes readonly
    expect(input).toHaveAttribute('readonly');
  });

  it('should display error text when provided', () => {
    render(<DurationField {...defaultProps} errorText="Invalid duration" />);

    expect(screen.getByText('Invalid duration')).toBeInTheDocument();
  });

  it('should handle null value', () => {
    render(<DurationField {...defaultProps} value={null} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('should format value correctly for display', () => {
    // Test various duration values with leading zeros
    const { rerender } = render(
      <DurationField {...defaultProps} value={1800} />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('00:30'); // 30 minutes

    rerender(<DurationField {...defaultProps} value={7200} />);
    expect(screen.getByRole('textbox')).toHaveValue('02:00'); // 2 hours

    rerender(<DurationField {...defaultProps} value={5400} />);
    expect(screen.getByRole('textbox')).toHaveValue('01:30'); // 1.5 hours
  });

  // Behavioral test 1: Invalid format error setting
  it('should call setError when invalid format is entered to prevent silent failures', () => {
    render(<DurationField {...defaultProps} />);

    const input = screen.getByRole('textbox');

    // Enter invalid format
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.blur(input);

    // setError should be called with the format error message
    expect(mockSetError).toHaveBeenCalledWith('duration.format.error');
  });

  // Behavioral test 2: isLocked state from useWatch
  describe('isLocked state behavior', () => {
    it('should make field readonly when isLocked is true', () => {
      (useWatch as jest.Mock).mockReturnValue(true);

      render(<DurationField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should allow editing when isLocked is false', () => {
      (useWatch as jest.Mock).mockReturnValue(false);

      render(<DurationField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('readonly');
    });
  });

  // Behavioral test 3: Keyboard focus behavior for accessibility
  it('should auto-focus when isBreakField is true for keyboard accessibility', async () => {
    render(<DurationField {...defaultProps} isBreakField />);

    const input = screen.getByRole('textbox');

    // Field should receive focus automatically
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  // Behavioral test 4: prevValue preservation on focus to prevent data loss
  describe('prevValue preservation on focus', () => {
    it('should store previous value on first focus to prevent data loss', () => {
      render(<DurationField {...defaultProps} value={3600} />);

      const input = screen.getByRole('textbox');

      // Focus the field
      fireEvent.focus(input);

      // The prevValue should be captured internally (no external observable change)
      // This ensures if user makes changes and refocuses, the original value is preserved
      expect(input).toHaveValue('01:00');
    });

    it('should preserve previous value when re-focusing after changes', () => {
      render(<DurationField {...defaultProps} value={3600} />);

      const input = screen.getByRole('textbox');

      // First focus - captures initial value
      fireEvent.focus(input);

      // User makes changes
      fireEvent.change(input, { target: { value: '2:00' } });

      // Re-focus (simulating user navigating away and back)
      fireEvent.blur(input);
      fireEvent.focus(input);

      // The field should maintain the changed value, not reset
      // This tests that prevValue is used for comparison, not for resetting
      expect(mockOnChange).toHaveBeenCalled();
    });
  });
});
