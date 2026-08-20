import React from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
} from 'test/unit/testUtils';
import timeKioskReducer, {
  closeKioskModal,
  openKioskModal,
  setInactivityTimeoutSeconds,
} from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import { KioskModalType } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';
import { useSaveKioskSettings } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/hooks/useSaveKioskSettings';
import KioskSettingsModalsContainer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingsModalsContainer';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any) => defaultMessage ?? id,
  }),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/hooks/useSaveKioskSettings',
  () => ({ useSaveKioskSettings: jest.fn() }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingModal',
  () => ({
    __esModule: true,
    default: ({
      open,
      title,
      field,
      onSave,
      onClose,
      isSaving,
      saveDisabled,
      errorMessage,
      dataTestId,
    }: any) =>
      open ? (
        <div data-testid={dataTestId}>
          <div data-testid="modal-title">{title}</div>
          {errorMessage && <div data-testid="modal-error">{errorMessage}</div>}
          {field.kind === 'number' && (
            <input
              data-testid="modal-input"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
          {field.kind === 'checkbox' && (
            <input
              type="checkbox"
              data-testid="modal-checkbox"
              checked={field.checked}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
          <button
            type="button"
            data-testid="modal-save"
            onClick={onSave}
            disabled={saveDisabled || isSaving}
          >
            save
          </button>
          <button type="button" data-testid="modal-cancel" onClick={onClose}>
            cancel
          </button>
          <span data-testid="modal-save-disabled">{String(saveDisabled)}</span>
        </div>
      ) : null,
  }),
);

const mockedUseSaveKioskSettings = useSaveKioskSettings as jest.Mock;

let mockSaveInactivityTimeout: jest.Mock;
let mockClearError: jest.Mock;
let capturedOnSaveSuccess: (() => void) | undefined;

const setupSave = (saving = false, error: string | null = null) => {
  mockSaveInactivityTimeout = jest.fn().mockResolvedValue(undefined);
  mockClearError = jest.fn();
  mockedUseSaveKioskSettings.mockImplementation(({ onSaveSuccess }: any) => {
    capturedOnSaveSuccess = onSaveSuccess;
    return {
      saveInactivityTimeout: mockSaveInactivityTimeout,
      saving,
      error,
      clearError: mockClearError,
    };
  });
};

const renderContainer = ({
  modalOpen = true,
  seconds = 20,
  saving = false,
  error = null,
}: {
  modalOpen?: boolean;
  seconds?: number;
  saving?: boolean;
  error?: string | null;
} = {}) => {
  setupSave(saving, error);
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  store.dispatch(setInactivityTimeoutSeconds({ value: seconds }));
  if (modalOpen) {
    store.dispatch(openKioskModal(KioskModalType.INACTIVITY_TIMEOUT));
  }
  renderWithQuicksandReduxAndLogging(
    <KioskSettingsModalsContainer />,
    store,
    getDefaultSandbox(),
  );
  return store;
};

describe('KioskSettingsModalsContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSaveSuccess = undefined;
  });

  it('renders nothing when no kiosk modal is active', () => {
    renderContainer({ modalOpen: false });
    expect(
      screen.queryByTestId('kiosk-inactivity-timeout-modal'),
    ).not.toBeInTheDocument();
  });

  it('renders the inactivity modal seeded from Redux when active', () => {
    renderContainer({ seconds: 25 });
    expect(
      screen.getByTestId('kiosk-inactivity-timeout-modal'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('modal-input')).toHaveValue('25');
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Edit inactivity timeout',
    );
  });

  it('saves the parsed value when the entry is valid', () => {
    renderContainer({ seconds: 20 });
    fireEvent.click(screen.getByTestId('modal-save'));
    expect(mockSaveInactivityTimeout).toHaveBeenCalledWith(20);
  });

  it('disables save for a value below the minimum', () => {
    renderContainer({ seconds: 20 });
    fireEvent.change(screen.getByTestId('modal-input'), {
      target: { value: '0' },
    });
    expect(screen.getByTestId('modal-save-disabled')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-save')).toBeDisabled();
  });

  it('disables save for a non-integer value', () => {
    renderContainer({ seconds: 20 });
    fireEvent.change(screen.getByTestId('modal-input'), {
      target: { value: '1.5' },
    });
    expect(screen.getByTestId('modal-save-disabled')).toHaveTextContent('true');
  });

  it('disables save for a value above the maximum', () => {
    renderContainer({ seconds: 20 });
    fireEvent.change(screen.getByTestId('modal-input'), {
      target: { value: '91' },
    });
    expect(screen.getByTestId('modal-save-disabled')).toHaveTextContent('true');
    expect(screen.getByTestId('modal-save')).toBeDisabled();
  });

  it('allows saving the maximum boundary value', () => {
    renderContainer({ seconds: 20 });
    fireEvent.change(screen.getByTestId('modal-input'), {
      target: { value: '90' },
    });
    fireEvent.click(screen.getByTestId('modal-save'));
    expect(mockSaveInactivityTimeout).toHaveBeenCalledWith(90);
  });

  it('closes the modal and shows the shared toast on save success', () => {
    const store = renderContainer({ seconds: 20 });

    act(() => {
      capturedOnSaveSuccess?.();
    });

    const { ui } = store.getState().timeKiosk;
    expect(ui.activeModal).toBe(KioskModalType.NONE);
    expect(ui.toast).toEqual({
      open: true,
      message: 'Inactivity timeout saved',
    });
  });

  it('closes the modal on cancel', () => {
    const store = renderContainer({ seconds: 20 });
    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(store.getState().timeKiosk.ui.activeModal).toBe(KioskModalType.NONE);
  });

  it('does not render an error banner when there is no save error', () => {
    renderContainer({ seconds: 20 });
    expect(screen.queryByTestId('modal-error')).not.toBeInTheDocument();
  });

  it('surfaces the Figma error copy when a save error is present', () => {
    renderContainer({ seconds: 20, error: 'raw mutation failure' });
    expect(screen.getByTestId('modal-error')).toHaveTextContent(
      'Something went wrong. Try again.',
    );
  });

  it('clears the error when the modal opens', () => {
    renderContainer({ seconds: 20 });
    expect(mockClearError).toHaveBeenCalled();
  });

  it('clears the error on cancel', () => {
    renderContainer({ seconds: 20 });
    mockClearError.mockClear();
    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(mockClearError).toHaveBeenCalledTimes(1);
  });
});

const renderLocationRecordingContainer = () => {
  setupSave();
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  store.dispatch(openKioskModal(KioskModalType.LOCATION_RECORDING));
  renderWithQuicksandReduxAndLogging(
    <KioskSettingsModalsContainer />,
    store,
    getDefaultSandbox(),
  );
  return store;
};

describe('KioskSettingsModalsContainer — location recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnSaveSuccess = undefined;
  });

  it('renders the location recording modal seeded unchecked when active', () => {
    renderLocationRecordingContainer();
    expect(
      screen.getByTestId('kiosk-location-recording-modal'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('modal-checkbox')).not.toBeChecked();
    expect(screen.getByTestId('modal-title')).toHaveTextContent(
      'Edit location recording',
    );
  });

  it('does not render the inactivity modal while location recording is open', () => {
    renderLocationRecordingContainer();
    expect(
      screen.queryByTestId('kiosk-inactivity-timeout-modal'),
    ).not.toBeInTheDocument();
  });

  it('shows the "turned on" toast and closes when saved with the checkbox checked', () => {
    const store = renderLocationRecordingContainer();

    fireEvent.click(screen.getByTestId('modal-checkbox'));
    fireEvent.click(screen.getByTestId('modal-save'));

    const { ui } = store.getState().timeKiosk;
    expect(ui.activeModal).toBe(KioskModalType.NONE);
    expect(ui.toast).toEqual({
      open: true,
      message: 'Location recording turned on',
    });
  });

  it('shows the "turned off" toast and closes when saved with the checkbox unchecked', () => {
    const store = renderLocationRecordingContainer();

    fireEvent.click(screen.getByTestId('modal-save'));

    const { ui } = store.getState().timeKiosk;
    expect(ui.activeModal).toBe(KioskModalType.NONE);
    expect(ui.toast).toEqual({
      open: true,
      message: 'Location recording turned off',
    });
  });

  it('closes the modal on cancel without persisting anything', () => {
    const store = renderLocationRecordingContainer();
    fireEvent.click(screen.getByTestId('modal-cancel'));
    expect(store.getState().timeKiosk.ui.activeModal).toBe(KioskModalType.NONE);
    expect(mockSaveInactivityTimeout).not.toHaveBeenCalled();
  });

  it('re-seeds the checkbox to unchecked each time the modal reopens', () => {
    const store = renderLocationRecordingContainer();
    fireEvent.click(screen.getByTestId('modal-checkbox'));
    expect(screen.getByTestId('modal-checkbox')).toBeChecked();

    act(() => {
      store.dispatch(closeKioskModal());
    });
    act(() => {
      store.dispatch(openKioskModal(KioskModalType.LOCATION_RECORDING));
    });

    expect(screen.getByTestId('modal-checkbox')).not.toBeChecked();
  });
});
