import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QuicksandProvider } from '@payroll/quicksand';
import TimeActionButton from 'src/js/widgets/timeClock/components/TimeActionButton';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';

// Mock the company settings hook
jest.mock('src/js/service/hooks/settings/useCompanySettings');

// Mock Quicksand's useIntl hook
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id || 'translated text',
  }),
}));

// Mock sandbox functionality
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  performance: {
    createCustomerInteraction: jest.fn(),
    getCustomerInteraction: jest.fn(),
  },
  appContext: {
    getUserAuthInfo: jest.fn().mockReturnValue({ authId: 'test-user-id' }),
    getRealm: jest.fn().mockResolvedValue({ realmId: 'test-realm-id' }),
  },
  extensions: {},
  analytics: { track: jest.fn() },
  experiments: { isEnabled: jest.fn() },
  navigation: { navigate: jest.fn() },
  storage: { get: jest.fn(), set: jest.fn() },
  network: { get: jest.fn(), post: jest.fn() },
  ui: { showToast: jest.fn() },
  config: {},
  i18n: { translate: jest.fn() },
  auth: { getToken: jest.fn() },
  messaging: { subscribe: jest.fn(), unsubscribe: jest.fn() },
  telemetry: { track: jest.fn() },
  intl: { formatMessage: jest.fn() },
} as any; // Using type assertion since we're mocking a complex type

const renderWithQuicksand = (ui: React.ReactElement) =>
  render(<QuicksandProvider sandbox={mockSandbox}>{ui}</QuicksandProvider>);

describe('TimeActionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCompanySettings as jest.Mock).mockReturnValue({
      settingsData: { timezone: 'America/Los_Angeles' },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with default props', () => {
    renderWithQuicksand(<TimeActionButton />);

    expect(screen.getByText('Clock in')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('purpose-standard');
    expect(screen.getByRole('button')).toHaveClass('priority-secondary');
  });

  it('renders with custom text and purpose', () => {
    renderWithQuicksand(
      <TimeActionButton
        text="Custom Text"
        purpose="destructive"
        priority="primary"
      />,
    );

    expect(screen.getByText('Custom Text')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('purpose-destructive');
    expect(screen.getByRole('button')).toHaveClass('priority-primary');
  });

  it('handles disabled state', () => {
    renderWithQuicksand(<TimeActionButton disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders with circle-clock variant', () => {
    renderWithQuicksand(<TimeActionButton variant="circle-clock" />);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with clock-in variant', () => {
    renderWithQuicksand(<TimeActionButton variant="clock-in" />);

    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // CircleClockFill has a unique path that fills the entire circle
    expect(svg?.querySelector('path[fill="currentColor"]')).toBeInTheDocument();
  });

  it('renders with circle-stopwatch variant and shows elapsed time', () => {
    const mockDate = new Date(2024, 2, 20, 10, 0, 0);
    jest.setSystemTime(mockDate);

    renderWithQuicksand(
      <TimeActionButton
        variant="circle-stopwatch"
        startTime={mockDate.toISOString() as any}
        text="timeclock.clockOut"
      />,
    );

    // Initially shows 00:00:00
    expect(screen.getByText('00:00:00')).toBeInTheDocument();

    // Advance 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(screen.getByText('00:00:30')).toBeInTheDocument();
  });

  it('renders text when circle-stopwatch has no startTime', () => {
    renderWithQuicksand(
      <TimeActionButton variant="circle-stopwatch" text="timeclock.clockOut" />,
    );

    expect(screen.getByText('timeclock.clockOut')).toBeInTheDocument();
  });

  it('renders with text-only variant', () => {
    renderWithQuicksand(
      <TimeActionButton variant="text-only" text="Text Only" />,
    );

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByText('Text Only')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    renderWithQuicksand(<TimeActionButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('handles company timezone changes', () => {
    (useCompanySettings as jest.Mock).mockReturnValue({
      settingsData: { timezone: 'Europe/London' },
    });

    const mockDate = new Date(2024, 2, 20, 10, 0, 0);

    renderWithQuicksand(
      <TimeActionButton
        variant="circle-stopwatch"
        startTime={mockDate.toISOString() as any}
      />,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const mockDate = new Date();
    const { unmount } = renderWithQuicksand(
      <TimeActionButton
        variant="circle-stopwatch"
        startTime={mockDate.toISOString() as any}
      />,
    );

    unmount();

    // Advance time to ensure no memory leaks
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });
  describe('getButtonText', () => {
    it('shows elapsed time for circle-stopwatch with valid startTime', () => {
      const mockDate = new Date(2024, 2, 20, 10, 0, 0);
      jest.setSystemTime(mockDate);

      renderWithQuicksand(
        <TimeActionButton
          variant="circle-stopwatch"
          startTime={mockDate.toISOString() as any}
          text="Clock Out"
        />,
      );

      expect(screen.getByText('00:00:00')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3661000); // 1 hour, 1 minute, 1 second
      });

      expect(screen.getByText('01:01:01')).toBeInTheDocument();
    });

    it('shows default text when not circle-stopwatch variant', () => {
      renderWithQuicksand(
        <TimeActionButton
          variant="circle-clock"
          startTime={new Date().toISOString() as any}
          text="Clock In"
        />,
      );

      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });

    it('shows default text when circle-stopwatch but no startTime', () => {
      renderWithQuicksand(
        <TimeActionButton variant="circle-stopwatch" text="Clock In" />,
      );

      expect(screen.getByText('Clock In')).toBeInTheDocument();
    });
  });
});
