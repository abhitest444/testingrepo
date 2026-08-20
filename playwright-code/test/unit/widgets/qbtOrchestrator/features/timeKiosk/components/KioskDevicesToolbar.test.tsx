import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
} from 'test/unit/testUtils';
import timeKioskReducer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import KioskDevicesToolbar from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskDevicesToolbar';
import { TIME_KIOSK_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/constants/timeKioskLoggingConstants';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage?: string }) =>
      defaultMessage ?? '',
  }),
}));

jest.mock('@design-systems/icons', () => ({
  Plus: () => <span data-testid="plus-icon" />,
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/KioskSettingsMenuButton',
  () => ({
    __esModule: true,
    default: () => <div data-testid="kiosk-settings-menu-button-mock" />,
  }),
);

jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="kiosk-devices-search-field"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const renderToolbar = () => {
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  const sandbox = getDefaultSandbox();
  renderWithQuicksandReduxAndLogging(<KioskDevicesToolbar />, store, sandbox);
  return { sandbox };
};

describe('KioskDevicesToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders stub action buttons, settings menu, and search field', () => {
    renderToolbar();

    expect(screen.getByTestId('kiosk-devices-toolbar')).toBeInTheDocument();
    expect(
      screen.getByTestId('kiosk-use-this-computer-button'),
    ).toHaveTextContent('Use this computer');
    expect(screen.getByTestId('kiosk-add-device-button')).toHaveTextContent(
      'Add a device',
    );
    expect(
      screen.getByTestId('kiosk-settings-menu-button-mock'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('kiosk-devices-search-field')).toHaveAttribute(
      'placeholder',
      'Search',
    );
  });

  it('logs when stub action buttons are clicked', () => {
    const { sandbox } = renderToolbar();

    fireEvent.click(screen.getByTestId('kiosk-use-this-computer-button'));
    fireEvent.click(screen.getByTestId('kiosk-add-device-button'));

    expect(sandbox.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        TIME_KIOSK_LOGGING.USE_THIS_COMPUTER_BUTTON_CLICKED,
      ),
      undefined,
    );
    expect(sandbox.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(TIME_KIOSK_LOGGING.ADD_DEVICE_BUTTON_CLICKED),
      undefined,
    );
  });

  it('stores search input locally until device filtering is wired', () => {
    renderToolbar();

    fireEvent.change(screen.getByTestId('kiosk-devices-search-field'), {
      target: { value: 'front' },
    });

    expect(screen.getByTestId('kiosk-devices-search-field')).toHaveValue(
      'front',
    );
  });
});
