import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SubmitTimeConfirmationModal from 'src/js/widgets/qbtOrchestrator/features/approvals/components/SubmitTimePanel/SubmitTimeConfirmationModal';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: (message: { defaultMessage: string }) =>
      message.defaultMessage,
  }),
}));

jest.mock('@ids-ts/button', () => {
  const MockButton = ({
    children,
    onClick,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
  }) => (
    <button data-testid={dataTestId} onClick={onClick}>
      {children}
    </button>
  );
  return MockButton;
});

jest.mock('@ids-ts/typography', () => {
  const MockTypography = ({
    children,
    id,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    id?: string;
    'data-testid'?: string;
  }) => (
    <div id={id} data-testid={dataTestId}>
      {children}
    </div>
  );
  return {
    __esModule: true,
    B2: MockTypography,
    H5: MockTypography,
  };
});

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({
    children,
    open,
    restoreFocus,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    open?: boolean;
    restoreFocus?: boolean;
    'data-testid'?: string;
  }) =>
    open ? (
      <div
        data-testid={dataTestId}
        data-restore-focus={restoreFocus ? 'true' : 'false'}
      >
        {children}
      </div>
    ) : null,
  ModalHeader: ({
    children,
    onClose,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId}>
      {children}
      <button data-testid="header-close" onClick={onClose}>
        x
      </button>
    </div>
  ),
  ModalContent: ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>,
  ModalActions: ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>,
}));

describe('SubmitTimeConfirmationModal', () => {
  it('does not render when closed', () => {
    render(
      <SubmitTimeConfirmationModal
        open={false}
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('submit-time-confirmation-modal')).toBeNull();
  });

  it('renders title and default fallback message', () => {
    render(
      <SubmitTimeConfirmationModal
        open
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        message="   "
      />,
    );
    expect(
      screen.getByTestId('submit-time-confirmation-modal-title'),
    ).toHaveTextContent('Before you submit');
    expect(
      screen.getByTestId('submit-time-confirmation-modal-message'),
    ).toHaveTextContent(
      'By submitting your timesheets you agree that they are complete and accurate.',
    );
  });

  it('renders custom message and invokes action handlers', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(
      <SubmitTimeConfirmationModal
        open
        onCancel={onCancel}
        onConfirm={onConfirm}
        message="Please verify before submitting."
      />,
    );
    expect(
      screen.getByTestId('submit-time-confirmation-modal-message'),
    ).toHaveTextContent('Please verify before submitting.');

    fireEvent.click(
      screen.getByTestId('submit-time-confirmation-modal-cancel'),
    );
    fireEvent.click(screen.getByTestId('header-close'));
    fireEvent.click(
      screen.getByTestId('submit-time-confirmation-modal-confirm'),
    );

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('wires aria-labelledby to a matching title id and enables focus restore', () => {
    render(
      <SubmitTimeConfirmationModal
        open
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    const title = screen.getByTestId('submit-time-confirmation-modal-title');
    expect(title).toHaveAttribute('id', 'submit-time-confirmation-title');
    expect(
      screen.getByTestId('submit-time-confirmation-modal'),
    ).toHaveAttribute('data-restore-focus', 'true');
  });
});
