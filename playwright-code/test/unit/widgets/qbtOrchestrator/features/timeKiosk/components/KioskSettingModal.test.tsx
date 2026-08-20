import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KioskSettingModal from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingModal';
import { KioskModalField } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({ children, open, 'data-testid': testId }: any) =>
    open ? <div data-testid={testId}>{children}</div> : null,
  ModalHeader: ({ children, onClose, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      {children}
      <button type="button" data-testid={`${testId}-close`} onClick={onClose}>
        X
      </button>
    </div>
  ),
  ModalContent: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalActions: ({ children, 'data-testid': testId }: any) => (
    <div data-testid={testId}>{children}</div>
  ),
  ModalTitle: ({ title }: any) => <div data-testid="modal-title">{title}</div>,
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, 'data-testid': testId }: any) => (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    min,
    'aria-label': ariaLabel,
    'data-testid': testId,
  }: any) => (
    <input
      data-testid={testId}
      aria-label={ariaLabel}
      min={min}
      value={value}
      onChange={onChange}
    />
  ),
}));

jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({ children, checked, onChange, 'data-testid': testId }: any) => (
    <span>
      <input
        type="checkbox"
        aria-label={typeof children === 'string' ? children : undefined}
        data-testid={testId}
        checked={checked}
        onChange={onChange}
      />
      {children}
    </span>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <span data-testid="activity-loader" />,
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ title, type, 'data-testid': testId }: any) => (
    <div data-testid={testId} data-type={type}>
      {title}
    </div>
  ),
}));

const numberField = (
  overrides: Partial<Extract<KioskModalField, { kind: 'number' }>> = {},
) =>
  ({
    kind: 'number',
    value: '20',
    onChange: jest.fn(),
    suffixLabel: 'Seconds',
    ariaLabel: 'Inactivity timeout in seconds',
    min: 1,
    ...overrides,
  } as KioskModalField);

const renderModal = (
  props: Partial<React.ComponentProps<typeof KioskSettingModal>> = {},
) => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const field = props.field ?? numberField();
  render(
    <KioskSettingModal
      open
      title="Edit inactivity timeout"
      description="This applies to all kiosks."
      field={field}
      onSave={onSave}
      onClose={onClose}
      saveLabel="Save"
      cancelLabel="Cancel"
      {...props}
    />,
  );
  return { onSave, onClose, field };
};

describe('KioskSettingModal', () => {
  it('renders nothing when closed', () => {
    renderModal({ open: false });
    expect(screen.queryByTestId('kiosk-setting-modal')).not.toBeInTheDocument();
  });

  it('renders title, description and the number field with suffix', () => {
    renderModal();
    expect(screen.getByTestId('kiosk-setting-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Edit inactivity timeout',
    );
    expect(screen.getByText('This applies to all kiosks.')).toBeInTheDocument();
    expect(
      screen.getByTestId('kiosk-setting-modal-number-field'),
    ).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });

  it('calls onClose from the cancel button and header close', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByTestId('kiosk-setting-modal-cancel'));
    fireEvent.click(screen.getByTestId('kiosk-setting-modal-header-close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onSave from the save button', () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByTestId('kiosk-setting-modal-save'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('forwards number field changes', () => {
    const onChange = jest.fn();
    renderModal({ field: numberField({ onChange }) });
    fireEvent.change(screen.getByTestId('kiosk-setting-modal-number-field'), {
      target: { value: '35' },
    });
    expect(onChange).toHaveBeenCalledWith('35');
  });

  it('disables both actions while saving', () => {
    renderModal({ isSaving: true });
    expect(screen.getByTestId('kiosk-setting-modal-cancel')).toBeDisabled();
    expect(screen.getByTestId('kiosk-setting-modal-save')).toBeDisabled();
  });

  it('ignores header close while saving', () => {
    const { onClose } = renderModal({ isSaving: true });
    fireEvent.click(screen.getByTestId('kiosk-setting-modal-header-close'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('allows header close once saving finishes', () => {
    const { onClose } = renderModal({ isSaving: false });
    fireEvent.click(screen.getByTestId('kiosk-setting-modal-header-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables save when saveDisabled is set', () => {
    renderModal({ saveDisabled: true });
    expect(screen.getByTestId('kiosk-setting-modal-save')).toBeDisabled();
    expect(screen.getByTestId('kiosk-setting-modal-cancel')).not.toBeDisabled();
  });

  it('renders a checkbox field and forwards its change', () => {
    const onChange = jest.fn();
    renderModal({
      field: {
        kind: 'checkbox',
        checked: false,
        onChange,
        label: 'Record location',
      },
    });
    const checkbox = screen.getByTestId('kiosk-setting-modal-checkbox');
    expect(screen.getByText('Record location')).toBeInTheDocument();
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('honours a custom dataTestId', () => {
    renderModal({ dataTestId: 'kiosk-inactivity-timeout-modal' });
    expect(
      screen.getByTestId('kiosk-inactivity-timeout-modal'),
    ).toBeInTheDocument();
  });

  it('does not render the error banner without an errorMessage', () => {
    renderModal();
    expect(
      screen.queryByTestId('kiosk-setting-modal-error'),
    ).not.toBeInTheDocument();
  });

  it('renders an error banner when errorMessage is provided', () => {
    renderModal({ errorMessage: 'Something went wrong. Try again.' });
    const banner = screen.getByTestId('kiosk-setting-modal-error');
    expect(banner).toHaveTextContent('Something went wrong. Try again.');
    expect(banner).toHaveAttribute('data-type', 'error');
  });
});
