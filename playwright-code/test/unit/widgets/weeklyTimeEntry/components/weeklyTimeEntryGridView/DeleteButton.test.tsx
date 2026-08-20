import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteButton } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/DeleteButton';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }: any) => (
    <div data-testid="mock-quicksand-provider">{children}</div>
  ),
  useTracking: () =>
    jest.fn().mockImplementation((event) => {
      // Mock tracking event
    }),
  useSandbox: () => ({
    realmId: 'test-realm',
    offering: 'qbo',
  }),
}));

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
  Delete: () => <span data-testid="delete-icon">Delete</span>,
}));

describe('DeleteButton', () => {
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
  });

  it('renders without crashing', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);

    expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);

    const button = screen.getByTestId('icon-control');
    expect(button).toHaveAttribute('aria-label', 'weekly.deleterow');
    expect(button).toHaveAttribute('data-size', 'medium');
  });

  it('calls onDelete when clicked', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);

    const button = screen.getByTestId('icon-control');
    fireEvent.click(button);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('prevents event propagation on click', () => {
    render(<DeleteButton onDelete={mockOnDelete} />);

    const button = screen.getByTestId('icon-control');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'stopPropagation', { value: jest.fn() });
    button.dispatchEvent(event);

    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
