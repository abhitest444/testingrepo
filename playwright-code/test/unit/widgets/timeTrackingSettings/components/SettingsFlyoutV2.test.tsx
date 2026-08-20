import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsFlyoutV2 } from 'src/js/widgets/timeTrackingSettings/components/SettingsFlyoutV2';
import { SETTINGS_FLYOUT_V2_TRACKING_POINTS } from 'src/js/common/useClickTracking';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockNavigate = jest.fn();
const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useSandbox: () => ({ navigation: { navigate: mockNavigate } }),
  useTracking: () => mockTrack,
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick }: any) => (
    <button data-testid="upgrade-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/cards', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

jest.mock('@ids-ts/typography', () => ({
  Demi: ({ children }: any) => <span data-testid="demi">{children}</span>,
  B2: ({ children }: any) => <span data-testid="b2">{children}</span>,
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tracking tests
// ---------------------------------------------------------------------------

describe('SettingsFlyoutV2 — tracking', () => {
  test('fires CONTENT_VIEWED tracking on mount', () => {
    render(<SettingsFlyoutV2 />);
    expect(mockTrack).toHaveBeenCalledWith(
      SETTINGS_FLYOUT_V2_TRACKING_POINTS.CONTENT_VIEWED,
    );
  });

  test('fires UPGRADE_CLICKED tracking when Upgrade button is clicked', () => {
    render(<SettingsFlyoutV2 />);
    fireEvent.click(screen.getByTestId('upgrade-button'));
    expect(mockTrack).toHaveBeenCalledWith(
      SETTINGS_FLYOUT_V2_TRACKING_POINTS.UPGRADE_CLICKED,
    );
  });

  test('fires UPGRADE_CLICKED before navigating', () => {
    render(<SettingsFlyoutV2 />);
    fireEvent.click(screen.getByTestId('upgrade-button'));
    const trackOrder = mockTrack.mock.invocationCallOrder[1];
    const navigateOrder = mockNavigate.mock.invocationCallOrder[0];
    expect(trackOrder).toBeLessThan(navigateOrder);
  });

  test('does not fire UPGRADE_CLICKED tracking before button is clicked', () => {
    render(<SettingsFlyoutV2 />);
    expect(mockTrack).not.toHaveBeenCalledWith(
      SETTINGS_FLYOUT_V2_TRACKING_POINTS.UPGRADE_CLICKED,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsFlyoutV2', () => {
  test('renders the "Time" title', () => {
    render(<SettingsFlyoutV2 />);
    expect(screen.getByTestId('demi')).toHaveTextContent(
      'settings.flyout.v2.time.title',
    );
  });

  test('renders the description text', () => {
    render(<SettingsFlyoutV2 />);
    expect(screen.getByTestId('b2')).toHaveTextContent(
      'settings.flyout.v2.time.description',
    );
  });

  test('renders the Upgrade button', () => {
    render(<SettingsFlyoutV2 />);
    expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-button')).toHaveTextContent(
      'settings.flyout.v2.upgrade.button',
    );
  });

  test('navigates to learn-more/time-payroll when Upgrade button is clicked', () => {
    render(<SettingsFlyoutV2 />);
    fireEvent.click(screen.getByTestId('upgrade-button'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('learn-more/time-payroll');
  });

  test('does not navigate before the button is clicked', () => {
    render(<SettingsFlyoutV2 />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
