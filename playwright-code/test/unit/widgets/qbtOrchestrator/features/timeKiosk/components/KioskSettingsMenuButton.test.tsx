import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
} from 'test/unit/testUtils';
import timeKioskReducer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import { setKioskSettingsLoading } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store/kioskSettingsSlice';
import KioskSettingsMenuButton from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingsMenuButton';
import { KioskModalType } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/types/TimeKiosk.types';
import { TIME_KIOSK_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/constants/timeKioskLoggingConstants';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any) => defaultMessage ?? id,
  }),
}));

jest.mock('@ids-ts/dropdown-button', () => ({
  __esModule: true,
  default: ({
    children,
    label,
    disabled,
    onSelect,
    'data-testid': testId,
  }: any) => (
    <div data-testid={testId}>
      <span data-testid={`${testId}-label`}>{label}</span>
      <select
        data-testid={`${testId}-select`}
        disabled={disabled}
        onChange={onSelect}
      >
        <option value="">--</option>
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
}));

const renderMenu = () => {
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  const sandbox = getDefaultSandbox();
  renderWithQuicksandReduxAndLogging(
    <KioskSettingsMenuButton />,
    store,
    sandbox,
  );
  return { store, sandbox };
};

const renderMenuLoading = () => {
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  store.dispatch(setKioskSettingsLoading(true));
  const sandbox = getDefaultSandbox();
  renderWithQuicksandReduxAndLogging(
    <KioskSettingsMenuButton />,
    store,
    sandbox,
  );
  return { store, sandbox };
};

describe('KioskSettingsMenuButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dropdown trigger with the inactivity timeout menu item', () => {
    renderMenu();
    expect(
      screen.getByTestId('kiosk-settings-menu-button'),
    ).toBeInTheDocument();
    expect(screen.getByText('Edit inactivity timeout')).toBeInTheDocument();
  });

  it('renders the location recording menu item', () => {
    renderMenu();
    expect(screen.getByText('Edit location recording')).toBeInTheDocument();
  });

  it('opens the inactivity modal and logs when the item is selected', () => {
    const { store, sandbox } = renderMenu();

    fireEvent.change(screen.getByTestId('kiosk-settings-menu-button-select'), {
      target: { value: 'inactivity-timeout' },
    });

    expect(store.getState().timeKiosk.ui.activeModal).toBe(
      KioskModalType.INACTIVITY_TIMEOUT,
    );
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        TIME_KIOSK_LOGGING.EDIT_INACTIVITY_TIMEOUT_BUTTON_CLICKED,
      ),
      undefined,
    );
  });

  it('opens the location recording modal and logs when the item is selected', () => {
    const { store, sandbox } = renderMenu();

    fireEvent.change(screen.getByTestId('kiosk-settings-menu-button-select'), {
      target: { value: 'location-recording' },
    });

    expect(store.getState().timeKiosk.ui.activeModal).toBe(
      KioskModalType.LOCATION_RECORDING,
    );
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        TIME_KIOSK_LOGGING.EDIT_LOCATION_RECORDING_BUTTON_CLICKED,
      ),
      undefined,
    );
  });

  it('ignores unrelated selections', () => {
    const { store } = renderMenu();

    fireEvent.change(screen.getByTestId('kiosk-settings-menu-button-select'), {
      target: { value: '' },
    });

    expect(store.getState().timeKiosk.ui.activeModal).toBe(KioskModalType.NONE);
  });

  it('disables the menu while kiosk settings are still loading', () => {
    renderMenuLoading();

    expect(
      screen.getByTestId('kiosk-settings-menu-button-select'),
    ).toBeDisabled();
  });

  it('enables the menu once kiosk settings finish loading', () => {
    renderMenu();

    expect(
      screen.getByTestId('kiosk-settings-menu-button-select'),
    ).not.toBeDisabled();
  });
});
