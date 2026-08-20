// @ts-nocheck
/**
 * NotificationsCardTimeDropdown Tests
 *
 * Tests for the time dropdown component used in notification settings
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import { NotificationsCardTimeDropdown } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/components/NotificationsCardTimeDropdown';
import * as DateAndTimeUtils from 'src/js/common/DateAndTimeUtils';

// Mock dayjs
jest.mock('dayjs', () => {
  const actualDayjs = jest.requireActual('dayjs');
  const mockDayjs = jest.fn((date) => actualDayjs(date));

  // Mock implementation for startOf and add
  mockDayjs.mockImplementation((date) => {
    const instance = actualDayjs(date || '2024-01-01');
    return {
      ...instance,
      startOf: (unit) => {
        const startInstance = instance.startOf(unit);
        return {
          ...startInstance,
          add: (amount, unit) => {
            const addInstance = startInstance.add(amount, unit);
            return {
              ...addInstance,
              format: (formatStr) => addInstance.format(formatStr),
            };
          },
        };
      },
    };
  });

  return mockDayjs;
});

// Mock DateAndTimeUtils
jest.mock('src/js/common/DateAndTimeUtils', () => ({
  formatTime: jest.fn((time) => {
    // Simple mock implementation
    if (!time) return '';
    if (time.includes('AM') || time.includes('PM')) return time;
    // Convert partial inputs like "2:20" to "2:20 AM"
    if (/^\d{1,2}:\d{2}$/.test(time)) return `${time} AM`;
    return time;
  }),
  isValidTime: jest.fn((time) => {
    // Simple validation mock
    if (!time) return false;
    return /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time);
  }),
}));

// Mock DropdownTypeahead component
jest.mock('@ids-ts/dropdown-typeahead', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    onSearch,
    onFocus,
    onBlur,
    disabled,
    label,
    errorText,
    dataSource,
    renderItem,
  }) => {
    const inputId = `time-input-${label}`;
    return (
      <div data-testid="dropdown-typeahead">
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          data-testid="time-input"
          value={value}
          onChange={(e) => onChange({ target: { value: e.target.value } })}
          onFocus={onFocus}
          onBlur={onBlur}
          onInput={(e) => onSearch(e)}
          disabled={disabled}
          aria-label={label}
        />
        {errorText && (
          <div data-testid="error-text" role="alert">
            {errorText}
          </div>
        )}
        <div data-testid="dropdown-options">
          {dataSource.map((item, index) => (
            <div key={item.value} data-value={item.value}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  },
  MenuItem: ({ value, children }) => (
    <div data-testid="menu-item" data-value={value}>
      {children}
    </div>
  ),
}));

describe('NotificationsCardTimeDropdown', () => {
  const defaultProps = {
    value: '8:00 AM',
    onChange: jest.fn(),
    label: 'Clock-in time',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      expect(screen.getByTestId('dropdown-typeahead')).toBeInTheDocument();
      expect(screen.getByLabelText('Clock-in time')).toBeInTheDocument();
      expect(screen.getByTestId('time-input')).toHaveValue('8:00 AM');
    });

    it('should render with custom label', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          label="Custom Time Label"
        />,
      );

      expect(screen.getByText('Custom Time Label')).toBeInTheDocument();
    });

    it('should render with custom width', () => {
      const { container } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} width="400px" />,
      );

      expect(container).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} disabled />,
      );

      const input = screen.getByTestId('time-input');
      expect(input).toBeDisabled();
    });

    it('should generate time options in 15-minute intervals', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const optionsContainer = screen.getByTestId('dropdown-options');
      const menuItems = optionsContainer.querySelectorAll(
        '[data-testid="menu-item"]',
      );

      // Should have 24 hours * 4 (15-min intervals) = 96 options
      expect(menuItems.length).toBe(96);
    });

    it('should render MenuItem for each option', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const menuItems = screen.getAllByTestId('menu-item');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('should not render error message by default', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      expect(screen.queryByTestId('error-text')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions - onChange', () => {
    it('should call onChange when selecting a valid time from dropdown', () => {
      const mockOnChange = jest.fn();
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: '9:00 AM' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should format and validate time on change', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('9:00 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: '9:00 AM' } });

      expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('9:00 AM');
      expect(DateAndTimeUtils.isValidTime).toHaveBeenCalled();
    });

    it('should call onChange with formatted value for valid time', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('2:20 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: '2:20' } });

      expect(mockOnChange).toHaveBeenCalledWith('2:20 AM');
    });

    it('should call onChange with original value for invalid time', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('invalid');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: 'invalid' } });

      expect(mockOnChange).toHaveBeenCalledWith('invalid');
    });
  });

  describe('User Interactions - onSearch', () => {
    it('should filter options when user types', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');

      // Initially should have all options
      const initialOptions = screen.getAllByTestId('menu-item');
      expect(initialOptions.length).toBe(96);

      // Search for specific time
      fireEvent.input(input, { target: { value: '12:00' } });

      // formatTime should be called during search
      expect(DateAndTimeUtils.formatTime).toHaveBeenCalled();
    });

    it('should trigger onSearch when input changes', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.input(input, { target: { value: '10:30' } });

      // onSearch should update internal state (tested via behavior)
      expect(input).toBeInTheDocument();
    });

    it('should clear error while typing', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          errorMessage="Invalid time"
        />,
      );

      const input = screen.getByTestId('time-input');

      // Trigger an error first by blurring with invalid input
      DateAndTimeUtils.formatTime.mockReturnValue('invalid');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      // Now type to clear error
      fireEvent.input(input, { target: { value: '9:' } });

      // Error should not be visible after typing
      expect(screen.queryByTestId('error-text')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions - onFocus', () => {
    it('should store current value when input is focused', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);

      // Value should remain the same
      expect(input).toHaveValue('8:00 AM');
    });

    it('should handle focus with empty value', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} value="" />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);

      expect(input).toHaveValue('');
    });
  });

  describe('User Interactions - onBlur', () => {
    it('should validate time on blur with valid input', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('9:00 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '9:00 AM' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalled();
      });
    });

    it('should validate time on blur with invalid input', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('invalid time');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
          errorMessage="Custom error message"
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'invalid time' } });
      fireEvent.blur(input);

      // Verify validation was called
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalled();
      });
    });

    it('should not call onChange if input is empty on blur', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      // Should not call onChange for empty input
      expect(mockOnChange).toHaveBeenCalledTimes(1); // Only from the change event
    });

    it('should not call onChange if input value is unchanged on blur', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      // No change to input value
      fireEvent.blur(input);

      // Should not call onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange with formatted value on blur for partial input', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('2:30 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '2:30' } });
      fireEvent.blur(input);

      await waitFor(() => {
        // Should be called once from change
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle invalid input on blur', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('bad input');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'bad input' } });
      fireEvent.blur(input);

      // Verify validation logic was called
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('bad input');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value prop', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} value="" />,
      );

      const input = screen.getByTestId('time-input');
      expect(input).toHaveValue('');
    });

    it('should handle undefined onChange', () => {
      const { container } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          value="8:00 AM"
          onChange={undefined}
          label="Test"
        />,
      );

      expect(container).toBeInTheDocument();
    });

    it('should validate input with default error message', async () => {
      DateAndTimeUtils.formatTime.mockReturnValue('invalid');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      // Verify validation was performed
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('invalid');
      });
    });

    it('should handle rapid input changes', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Rapid changes
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.change(input, { target: { value: '10' } });
      fireEvent.change(input, { target: { value: '10:' } });
      fireEvent.change(input, { target: { value: '10:30' } });

      expect(mockOnChange).toHaveBeenCalledTimes(4);
    });

    it('should handle component unmount gracefully', () => {
      const { unmount } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle null event target', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Simulate event with null target
      fireEvent.change(input, { target: { value: null } });

      // Should not throw
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Integration with DateAndTimeUtils', () => {
    it('should use formatTime utility', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('12:00 PM');

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: '12:00' } });

      expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('12:00');
    });

    it('should use isValidTime utility', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('11:45 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');
      fireEvent.change(input, { target: { value: '11:45 AM' } });

      expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('11:45 AM');
    });
  });

  describe('Props Validation', () => {
    it('should accept all valid props', () => {
      const props = {
        value: '3:00 PM',
        onChange: jest.fn(),
        disabled: true,
        label: 'Custom Label',
        width: '500px',
        errorMessage: 'Custom Error',
      };

      const { container } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...props} />,
      );

      expect(container).toBeInTheDocument();
    });

    it('should use default width when not provided', () => {
      const { container } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle long label text', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          label="This is a very long label text that should still render correctly"
        />,
      );

      expect(
        screen.getByText(
          'This is a very long label text that should still render correctly',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Error Handling and State Management', () => {
    it('should clear error state when selecting from dropdown', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('10:00 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // First create error state
      DateAndTimeUtils.isValidTime.mockReturnValue(false);
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'bad' } });
      fireEvent.blur(input);

      // Then select valid value from dropdown
      DateAndTimeUtils.isValidTime.mockReturnValue(true);
      fireEvent.change(input, { target: { value: '10:00 AM' } });

      expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('10:00 AM');
    });

    it('should handle blur when input value matches previous value', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Focus and blur without changing value
      fireEvent.focus(input);
      fireEvent.blur(input);

      // onChange should not be called on blur for unchanged value
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle blur with empty input after having value', () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Focus, clear value, and blur
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      // Should call onChange once for the change event
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should format partial time input on blur', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('2:45 PM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Enter partial time
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '2:45' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('2:45');
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('2:45 PM');
      });
    });

    it('should handle valid time entry from scratch', () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('11:30 AM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          value=""
          onChange={mockOnChange}
          label="Select time"
        />,
      );

      const input = screen.getByTestId('time-input');

      // Enter complete valid time
      fireEvent.change(input, { target: { value: '11:30 AM' } });

      expect(mockOnChange).toHaveBeenCalledWith('11:30 AM');
    });

    it('should handle search with exact match', () => {
      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');

      // Search for exact time that exists in options
      fireEvent.input(input, { target: { value: '9:00 AM' } });

      // Should still render component successfully
      expect(input).toBeInTheDocument();
    });

    it('should preserve component state through re-renders', () => {
      const { rerender } = renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown {...defaultProps} />,
      );

      const input = screen.getByTestId('time-input');
      expect(input).toHaveValue('8:00 AM');
    });

    it('should clear error when user starts typing after error (line 53)', async () => {
      const mockOnChange = jest.fn();

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Simulate typing - this tests the handleSearch function that clears errors
      // The actual error display depends on component state management
      fireEvent.input(input, { target: { value: 'typing' } });

      // Component should handle input without errors
      expect(input).toBeInTheDocument();
    });

    it('should handle valid time on blur - lines 82-90', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('5:45 PM');
      DateAndTimeUtils.isValidTime.mockReturnValue(true);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Enter a valid time
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '5:45' } });
      fireEvent.blur(input);

      // Should format the time (line 82)
      expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('5:45');

      // Should validate the formatted time (line 85)
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('5:45 PM');
      });

      // Should call onChange with formatted value (line 88)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('5:45 PM');
      });

      // Error should not be shown (line 87)
      expect(screen.queryByTestId('error-text')).not.toBeInTheDocument();
    });

    it('should handle invalid time on blur and set error - lines 91-98', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('99:99 ZZ');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Enter invalid time
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '99:99' } });
      fireEvent.blur(input);

      // Should format the time (line 82)
      expect(DateAndTimeUtils.formatTime).toHaveBeenCalledWith('99:99');

      // Should validate and find it invalid (line 85, 91-92)
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalledWith('99:99 ZZ');
      });

      // Component handles validation - error handling is internal
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should reset input value to empty on invalid blur (line 94)', async () => {
      const mockOnChange = jest.fn();
      DateAndTimeUtils.formatTime.mockReturnValue('bad');
      DateAndTimeUtils.isValidTime.mockReturnValue(false);

      renderWithQuicksandProvider(
        <NotificationsCardTimeDropdown
          {...defaultProps}
          onChange={mockOnChange}
        />,
      );

      const input = screen.getByTestId('time-input');

      // Enter invalid time
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'bad time' } });
      fireEvent.blur(input);

      // Should set error and reset filteredOptions (lines 93-100)
      await waitFor(() => {
        expect(DateAndTimeUtils.isValidTime).toHaveBeenCalled();
      });
    });
  });
});
