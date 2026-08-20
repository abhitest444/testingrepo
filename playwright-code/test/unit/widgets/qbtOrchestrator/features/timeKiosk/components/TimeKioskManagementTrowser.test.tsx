import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
} from 'test/unit/testUtils';
import timeKioskReducer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import { TimeKioskManagementTrowser } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/TimeKioskManagementTrowser';
import { TIME_KIOSK_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/constants/timeKioskLoggingConstants';

// Stub the heavy kiosk children — they are covered by their own suites.
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskDevicesToolbar',
  () => ({
    __esModule: true,
    default: () => <div data-testid="kiosk-devices-toolbar-mock" />,
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingsModalsContainer',
  () => ({
    __esModule: true,
    default: () => <div data-testid="kiosk-modals-container-mock" />,
  }),
);

jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ open, message }: { open?: boolean; message?: string }) =>
    open ? <div data-testid="kiosk-success-toast">{message}</div> : null,
}));

jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({
    children,
    open,
    onClose,
    title,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onClose?: () => void;
    title?: string;
    'data-testid'?: string;
  }) =>
    open ? (
      <div data-testid={dataTestId ?? 'trowser'}>
        <div data-testid="trowser-title">{title}</div>
        <button type="button" data-testid="trowser-close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

describe('TimeKioskManagementTrowser', () => {
  const mockSandbox = getDefaultSandbox();

  const renderTrowser = (ui: React.ReactElement) => {
    const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
    renderWithQuicksandReduxAndLogging(ui, store, mockSandbox);
    return store;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title when open', async () => {
    renderTrowser(<TimeKioskManagementTrowser open />);

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-management-trowser'),
      ).toBeInTheDocument();
    });
    const titleEl = screen.getByTestId('trowser-title');
    expect(titleEl.textContent).toMatch(/Kiosk management|timeKiosk\.title/);
  });

  it('should not render trowser shell when open is false', () => {
    renderTrowser(<TimeKioskManagementTrowser open={false} />);

    expect(
      screen.queryByTestId('time-kiosk-management-trowser'),
    ).not.toBeInTheDocument();
  });

  it('should log close and invoke onClose when trowser closes', async () => {
    const onClose = jest.fn();
    renderTrowser(<TimeKioskManagementTrowser open onClose={onClose} />);

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-management-trowser'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('trowser-close'));

    await waitFor(() => {
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(TIME_KIOSK_LOGGING.FEATURE_CLOSED),
        { surface: 'kiosk-management-trowser' },
      );
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hydrates seconds + version from the mapped QL field', async () => {
    const store = renderTrowser(
      <TimeKioskManagementTrowser
        open
        inactivityTimeout={{ value: 45, version: '3' } as any}
      />,
    );

    await waitFor(() => {
      const { settings } = store.getState().timeKiosk;
      expect(settings.inactivityTimeoutSeconds).toBe(45);
      expect(settings.inactivityTimeoutVersion).toBe('3');
    });
    expect(store.getState().timeKiosk.settings.loading).toBe(false);
  });

  it('does not hydrate while QL settings are loading', async () => {
    const store = renderTrowser(
      <TimeKioskManagementTrowser
        open
        inactivityTimeout={{ value: 45, version: '3' } as any}
        isQLSettingsLoading
      />,
    );

    await waitFor(() => {
      expect(store.getState().timeKiosk.settings.loading).toBe(true);
    });
    // Stays at the default seed while loading.
    expect(store.getState().timeKiosk.settings.inactivityTimeoutSeconds).toBe(
      20,
    );
  });

  it('does not hydrate when no inactivity field is provided', async () => {
    const store = renderTrowser(<TimeKioskManagementTrowser open />);

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-management-trowser'),
      ).toBeInTheDocument();
    });
    expect(store.getState().timeKiosk.settings.inactivityTimeoutSeconds).toBe(
      20,
    );
  });

  it('falls back to the default seconds when the field value is missing', async () => {
    const store = renderTrowser(
      <TimeKioskManagementTrowser
        open
        inactivityTimeout={{ value: null, version: '4' } as any}
      />,
    );

    await waitFor(() => {
      expect(store.getState().timeKiosk.settings.inactivityTimeoutVersion).toBe(
        '4',
      );
    });
    expect(store.getState().timeKiosk.settings.inactivityTimeoutSeconds).toBe(
      20,
    );
  });
});
