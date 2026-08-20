import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import { TimeClockError } from 'src/js/widgets/timeClock/components/TimeClockError';

// Mock the useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
}));

describe('TimeClockError', () => {
  const mockOnClose = jest.fn();

  const mockIntl = {
    formatMessage: jest.fn((props: { id: string }) => {
      const messages: Record<string, string> = {
        'timeclock.header': 'Time Clock',
        'timeclock.error.billing.field.not.enabled.header':
          'Billing Field Not Enabled',
        'timeclock.error.billing.field.not.enabled.details':
          'Please enable billing field',
        'timeclock.error.generic.error.header': 'Error Occurred',
        'timeclock.error.generic.error.details': 'Generic error message',
      };
      return messages[props.id] || props.id;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
  });

  it('renders with default props', () => {
    render(<TimeClockError />);

    // Check if drawer header is rendered
    expect(screen.getByText('Time Clock')).toBeInTheDocument();

    // Check if generic error message is shown by default
    expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    expect(screen.getByText('Generic error message')).toBeInTheDocument();
  });

  it('renders generic error message for unknown error code', () => {
    render(
      <TimeClockError messageId="timeclock.error.generic.error.details" />,
    );

    expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    expect(screen.getByText('Generic error message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<TimeClockError onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('respects isOpen prop', () => {
    const { rerender } = render(<TimeClockError isOpen={false} />);

    // When isOpen is false, the drawer should not be in the document
    expect(screen.queryByText('Time Clock')).not.toBeInTheDocument();

    // Rerender with isOpen true
    rerender(<TimeClockError isOpen />);

    // When isOpen is true, the drawer should be in the document
    expect(screen.getByText('Time Clock')).toBeInTheDocument();
  });

  it('renders with styled components correctly', () => {
    render(<TimeClockError />);

    // Check if the icon is rendered
    expect(document.querySelector('svg')).toBeInTheDocument();

    // Check if error container has the correct styling
    const errorContainer = screen.getByText('Error Occurred').parentElement;
    expect(errorContainer).toHaveStyle({
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
    });
  });
});
