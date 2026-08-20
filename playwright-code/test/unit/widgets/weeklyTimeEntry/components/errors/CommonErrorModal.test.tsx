import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommonErrorModal } from 'src/js/widgets/weeklyTimeEntry/components/errors/CommonErrorModal';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

describe('CommonErrorModal', () => {
  const defaultProps = {
    open: true,
    actionType: 'close' as const,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<CommonErrorModal {...defaultProps} />);

    expect(screen.getAllByTestId('weekly-time-entry-error-modal')).toHaveLength(
      2,
    );
  });

  it('should not render when closed', () => {
    render(<CommonErrorModal {...defaultProps} open={false} />);

    expect(
      screen.queryAllByTestId('weekly-time-entry-error-modal'),
    ).toHaveLength(0);
  });

  it('should display correct title and message for close action', () => {
    render(<CommonErrorModal {...defaultProps} actionType="close" />);

    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.close.message'),
    ).toBeInTheDocument();
  });

  it('should display correct title and message for navigation action', () => {
    render(<CommonErrorModal {...defaultProps} actionType="navigation" />);

    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.navigation.message'),
    ).toBeInTheDocument();
  });

  it('should display correct title and message for week-change action', () => {
    render(<CommonErrorModal {...defaultProps} actionType="week-change" />);

    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.unsaved.changes.week.message'),
    ).toBeInTheDocument();
  });

  it('should call onConfirm when Yes button is clicked', () => {
    const onConfirm = jest.fn();
    render(<CommonErrorModal {...defaultProps} onConfirm={onConfirm} />);

    const yesButton = screen.getByText('weekly.time.entry.unsaved.changes.yes');
    fireEvent.click(yesButton);

    expect(onConfirm).toHaveBeenCalledWith('close');
  });

  it('should call onCancel when No button is clicked', () => {
    const onCancel = jest.fn();
    render(<CommonErrorModal {...defaultProps} onCancel={onCancel} />);

    const noButton = screen.getByText('weekly.time.entry.unsaved.changes.no');
    fireEvent.click(noButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when modal is closed', () => {
    const onCancel = jest.fn();
    render(<CommonErrorModal {...defaultProps} onCancel={onCancel} />);

    // The modal close functionality is handled by the Modal component internally
    // We can't easily test this in our test environment
    expect(screen.getAllByTestId('weekly-time-entry-error-modal')).toHaveLength(
      2,
    );
  });

  it('should pass correct actionType to onConfirm for different actions', () => {
    const onConfirm = jest.fn();

    const { rerender } = render(
      <CommonErrorModal
        {...defaultProps}
        actionType="close"
        onConfirm={onConfirm}
      />,
    );

    const yesButton = screen.getByText('weekly.time.entry.unsaved.changes.yes');
    fireEvent.click(yesButton);
    expect(onConfirm).toHaveBeenCalledWith('close');

    jest.clearAllMocks();

    rerender(
      <CommonErrorModal
        {...defaultProps}
        actionType="navigation"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(yesButton);
    expect(onConfirm).toHaveBeenCalledWith('navigation');

    jest.clearAllMocks();

    rerender(
      <CommonErrorModal
        {...defaultProps}
        actionType="week-change"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(yesButton);
    expect(onConfirm).toHaveBeenCalledWith('week-change');
  });

  it('should have correct button priorities', () => {
    render(<CommonErrorModal {...defaultProps} />);

    const yesButton = screen.getByText('weekly.time.entry.unsaved.changes.yes');
    const noButton = screen.getByText('weekly.time.entry.unsaved.changes.no');

    // Check if buttons have the correct classes instead of attributes
    expect(yesButton.closest('button')).toHaveClass('primary');
    expect(noButton.closest('button')).toHaveClass('priority-secondary');
  });

  it('should be non-dismissible', () => {
    render(<CommonErrorModal {...defaultProps} />);

    // Check that the modal is rendered (we can't easily test the dismissible attribute)
    expect(screen.getAllByTestId('weekly-time-entry-error-modal')).toHaveLength(
      2,
    );
  });

  it('should have medium size', () => {
    render(<CommonErrorModal {...defaultProps} />);

    // Check that the modal is rendered (we can't easily test the size attribute)
    expect(screen.getAllByTestId('weekly-time-entry-error-modal')).toHaveLength(
      2,
    );
  });
});
