import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchField } from 'src/js/widgets/common/SearchField';

jest.mock('src/js/service/utils/debounce', () => ({
  debounce: (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },
}));

describe('SearchField', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders as icon when collapsed', () => {
      render(<SearchField value="" onChange={mockOnChange} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('expands to text field when icon is clicked', () => {
      render(<SearchField value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders expanded by default when value exists', () => {
      render(<SearchField value="test" onChange={mockOnChange} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('test');
    });

    it('renders expanded when alwaysExpanded is true', () => {
      render(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('uses custom label when provided', () => {
      render(
        <SearchField value="" onChange={mockOnChange} label="Custom Search" />,
      );

      expect(screen.getByLabelText('Custom Search')).toBeInTheDocument();
    });
  });

  describe('Debounced Input', () => {
    it('debounces onChange callback', async () => {
      render(<SearchField value="" onChange={mockOnChange} debounceMs={300} />);

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 't' } });
      expect(mockOnChange).not.toHaveBeenCalled();

      fireEvent.change(input, { target: { value: 'te' } });
      expect(mockOnChange).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('te');
      });
    });

    it('updates UI immediately while debouncing callback', () => {
      render(<SearchField value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(input).toHaveValue('test');
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('uses custom debounce delay', async () => {
      render(<SearchField value="" onChange={mockOnChange} debounceMs={500} />);

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test' } });

      jest.advanceTimersByTime(300);
      expect(mockOnChange).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Clear Functionality', () => {
    test.each([
      {
        value: 'test',
        alwaysExpanded: false,
        description: 'shows clear button when value exists',
        expectClearBtn: true,
      },
      {
        value: '',
        alwaysExpanded: true,
        description: 'does not show clear button when value is empty',
        expectClearBtn: false,
      },
    ])('$description', ({ value, alwaysExpanded, expectClearBtn }) => {
      render(
        <SearchField
          value={value}
          onChange={mockOnChange}
          alwaysExpanded={alwaysExpanded || undefined}
        />,
      );

      if (expectClearBtn) {
        expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
      } else {
        expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
      }
    });

    it('clears value immediately without debounce', () => {
      render(<SearchField value="test" onChange={mockOnChange} />);

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('uses defaultValue when clearing', () => {
      render(
        <SearchField
          value="test"
          onChange={mockOnChange}
          defaultValue="default"
        />,
      );

      const clearButton = screen.getByLabelText('Clear search');
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('default');
    });
  });

  describe('Collapse Behavior', () => {
    it('collapses when empty and loses focus', () => {
      render(<SearchField value="" onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not collapse when value exists', () => {
      render(<SearchField value="test" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not collapse when alwaysExpanded is true', () => {
      render(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('syncs internal value with external value prop', () => {
      const { rerender } = render(
        <SearchField value="initial" onChange={mockOnChange} />,
      );

      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<SearchField value="updated" onChange={mockOnChange} />);

      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });

    it('maintains internal state during typing', () => {
      render(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(input).toHaveValue('test');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for search icon', () => {
      render(<SearchField value="" onChange={mockOnChange} label="Search" />);

      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('has proper aria-label for clear button', () => {
      render(<SearchField value="test" onChange={mockOnChange} />);

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(input).toHaveFocus();
    });
  });

  describe('External Value Reset', () => {
    it('should collapse when external value is cleared to empty', () => {
      const { rerender } = render(
        <SearchField value="test" onChange={mockOnChange} />,
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();

      // Clear value externally
      rerender(<SearchField value="" onChange={mockOnChange} />);

      // Should immediately collapse to icon when external value is cleared
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not collapse when alwaysExpanded and value cleared', () => {
      const { rerender } = render(
        <SearchField value="test" onChange={mockOnChange} alwaysExpanded />,
      );

      rerender(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      // Should stay expanded
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid input changes correctly', async () => {
      render(<SearchField value="" onChange={mockOnChange} debounceMs={300} />);

      fireEvent.click(screen.getByRole('button'));
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'ab' } });
      jest.advanceTimersByTime(100);

      fireEvent.change(input, { target: { value: 'abc' } });
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('abc');
      });
    });

    it('handles empty string input', () => {
      render(<SearchField value="test" onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });

      expect(input).toHaveValue('');
    });

    it('handles special characters in search', () => {
      render(<SearchField value="" onChange={mockOnChange} alwaysExpanded />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '@#$%' } });

      expect(input).toHaveValue('@#$%');
    });
  });
});
