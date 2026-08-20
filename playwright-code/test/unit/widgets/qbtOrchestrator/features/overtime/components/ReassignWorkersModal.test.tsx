import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReassignWorkersModal from 'src/js/widgets/qbtOrchestrator/features/overtime/components/ReassignWorkersModal';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ defaultMessage, id }: any) => defaultMessage || id,
  }),
}));

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open }: any) =>
    open ? <div data-testid="modal">{children}</div> : null,
  ModalHeader: ({ onClose, children }: any) => (
    <div data-testid="modal-header">
      {children}
      <button data-testid="modal-header-close" onClick={onClose}>
        X
      </button>
    </div>
  ),
  ModalTitle: ({ title }: any) => <h2 data-testid="modal-title">{title}</h2>,
  ModalContent: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalActions: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    isLoading,
    'data-testid': testId,
  }: any) => (
    <button data-testid={testId} onClick={onClick} disabled={disabled}>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="activity-loader" />,
}));

describe('ReassignWorkersModal', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  const defaultProps = {
    open: true,
    onCancel: mockOnCancel,
    onConfirm: mockOnConfirm,
    title: 'Reassign workers',
    message:
      "Workers are already assigned to a different overtime policy. If you move forward, they'll be reassigned to this one.",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when open is false', () => {
    render(<ReassignWorkersModal {...defaultProps} open={false} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render modal when open is true', () => {
    render(<ReassignWorkersModal {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Reassign workers',
    );
  });

  it('should display the reassignment message', () => {
    render(<ReassignWorkersModal {...defaultProps} />);

    expect(
      screen.getByTestId('reassign-workers-modal-message'),
    ).toHaveTextContent(
      "Workers are already assigned to a different overtime policy. If you move forward, they'll be reassigned to this one.",
    );
  });

  it('should display custom title when provided', () => {
    render(
      <ReassignWorkersModal
        {...defaultProps}
        title="Reassign default policy"
      />,
    );

    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Reassign default policy',
    );
  });

  it('should display custom message when provided', () => {
    const customMessage =
      'A default overtime policy already exists. If you move forward, it will be replaced with this one.';

    render(<ReassignWorkersModal {...defaultProps} message={customMessage} />);

    expect(
      screen.getByTestId('reassign-workers-modal-message'),
    ).toHaveTextContent(customMessage);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ReassignWorkersModal {...defaultProps} />);

    const cancelButton = screen.getByTestId('reassign-workers-modal-cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when save button is clicked', () => {
    render(<ReassignWorkersModal {...defaultProps} />);

    const saveButton = screen.getByTestId('reassign-workers-modal-save');
    fireEvent.click(saveButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when isLoading is true', () => {
    render(<ReassignWorkersModal {...defaultProps} isLoading />);

    const cancelButton = screen.getByTestId('reassign-workers-modal-cancel');
    const saveButton = screen.getByTestId('reassign-workers-modal-save');

    expect(cancelButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('should show loading state on save button when isLoading is true', () => {
    render(<ReassignWorkersModal {...defaultProps} isLoading />);

    const saveButton = screen.getByTestId('reassign-workers-modal-save');
    expect(saveButton).toHaveTextContent('Loading...');
  });

  it('should enable buttons when isLoading is false', () => {
    render(<ReassignWorkersModal {...defaultProps} isLoading={false} />);

    const cancelButton = screen.getByTestId('reassign-workers-modal-cancel');
    const saveButton = screen.getByTestId('reassign-workers-modal-save');

    expect(cancelButton).not.toBeDisabled();
    expect(saveButton).not.toBeDisabled();
  });

  it('should call onCancel when modal header close button is clicked', () => {
    render(<ReassignWorkersModal {...defaultProps} />);

    const headerCloseButton = screen.getByTestId('modal-header-close');
    fireEvent.click(headerCloseButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
