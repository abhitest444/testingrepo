import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LockButton } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/LockButton';

// Mock the IconControl component
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, 'aria-label': ariaLabel, size }: any) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid="icon-control"
      data-size={size}
    >
      {children}
    </button>
  ),
}));

// Mock the Delete icon
jest.mock('@design-systems/icons', () => ({
  Lock: () => <span data-testid="lock-icon">Lock</span>,
}));

describe('LockButton', () => {
  const mockOnLockIconClick = jest.fn();

  beforeEach(() => {
    mockOnLockIconClick.mockClear();
  });

  it('renders without crashing', () => {
    render(<LockButton onLockIconClick={mockOnLockIconClick} />);

    expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<LockButton onLockIconClick={mockOnLockIconClick} />);

    const button = screen.getByTestId('icon-control');
    expect(button).toHaveAttribute('aria-label', 'weekly.lockedrow');
    expect(button).toHaveAttribute('data-size', 'medium');
  });

  it('calls onLockIconClick when clicked', () => {
    render(<LockButton onLockIconClick={mockOnLockIconClick} />);

    const button = screen.getByTestId('icon-control');
    fireEvent.click(button);

    expect(mockOnLockIconClick).toHaveBeenCalledTimes(1);
  });

  it('prevents event propagation on click', () => {
    render(<LockButton onLockIconClick={mockOnLockIconClick} />);

    const button = screen.getByTestId('icon-control');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: jest.fn() });
    button.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
