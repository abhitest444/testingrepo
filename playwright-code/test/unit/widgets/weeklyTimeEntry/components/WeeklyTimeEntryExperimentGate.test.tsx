/**
 * Tests for WeeklyTimeEntryExperimentGate.
 *
 * Verifies the four key paths:
 *   1. CONTROL user — renders children, no redirect
 *   2. Pricing-treatment user, first visit — redirects + writes IPS pref
 *   3. Pricing-treatment user, returning (pref already set) — renders
 *      children with the import CTA, no redirect
 *   4. IPS hangs — falls through to "first visit" after the 1500ms timeout
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { WeeklyTimeEntryExperimentGate } from 'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryExperimentGate';
import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import {
  UxPreferenceKey,
  useUxPreferences,
} from 'src/js/service/utils/useUXPreferences';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: {
      log: jest.fn(),
      warn: jest.fn(),
    },
    navigation: { navigate: jest.fn() },
  })),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape }: { shape: string }) => (
    <div data-testid="activity-loader" data-shape={shape} />
  ),
}));

jest.mock('src/js/service/hooks/ixp/useIxpExperiment', () => ({
  useIxpExperiment: jest.fn(),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => {
  const actual = jest.requireActual('src/js/service/utils/useUXPreferences');
  return {
    ...actual,
    useUxPreferences: jest.fn(),
  };
});

const mockedUseIxp = useIxpExperiment as jest.Mock;
const mockedUseUxPrefs = useUxPreferences as jest.Mock;

interface SetupOpts {
  isInTreatment?: boolean;
  treatmentKey?: string;
  settled?: boolean;
  manualParam?: boolean;
  redirectShown?: boolean;
  prefsInitialized?: boolean;
}

/**
 * Configures the mocked dependencies for one test case.
 * @param {SetupOpts} opts Test-case knobs
 * @returns {{ navigate: jest.Mock, setUxPreference: jest.Mock }} Captured mocks for assertions
 */
function setup(opts: SetupOpts = {}) {
  const {
    isInTreatment = false,
    treatmentKey = 'IXP2_T_TREATED',
    settled = true,
    manualParam = false,
    redirectShown = false,
    prefsInitialized = true,
  } = opts;

  if (manualParam) {
    window.history.replaceState({}, '', '/?manual=true');
  } else {
    window.history.replaceState({}, '', '/');
  }

  const navigate = jest.fn();
  const setUxPreference = jest.fn(() => Promise.resolve());
  const getUxPreference = jest.fn(() => Promise.resolve());

  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { useSandbox } = require('@payroll/quicksand');
  useSandbox.mockReturnValue({
    logger: { log: jest.fn(), warn: jest.fn() },
    navigation: { navigate },
  });

  mockedUseIxp.mockReturnValue({ isInTreatment, treatmentKey, settled });
  mockedUseUxPrefs.mockReturnValue({
    data: {
      [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: redirectShown,
    },
    getPreference: getUxPreference,
    setPreference: setUxPreference,
    initialized: prefsInitialized,
    loading: false,
  });

  return { navigate, setUxPreference };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('WeeklyTimeEntryExperimentGate', () => {
  it('renders children for CONTROL users (no redirect, no CTA)', () => {
    setup({ isInTreatment: true });
    const setOpen = jest.fn();

    render(
      <WeeklyTimeEntryExperimentGate setOpen={setOpen}>
        <div data-testid="weekly-content">weekly</div>
      </WeeklyTimeEntryExperimentGate>,
    );

    expect(screen.getByTestId('weekly-content')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-loader')).not.toBeInTheDocument();
  });

  it('redirects on first visit and persists weeklyRedirect.shown', async () => {
    const { navigate, setUxPreference } = setup({
      isInTreatment: false,
      redirectShown: false,
    });
    const setOpen = jest.fn();

    render(
      <WeeklyTimeEntryExperimentGate setOpen={setOpen}>
        <div data-testid="weekly-content">weekly</div>
      </WeeklyTimeEntryExperimentGate>,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        expect.stringContaining(
          'app/time-agent-ui-plugin/timeagent?from=payroll_weekly_timesheet&treatment=IXP2_T_TREATED',
        ),
      );
    });
    expect(setUxPreference).toHaveBeenCalledWith(
      UxPreferenceKey.WEEKLY_REDIRECT_SHOWN,
      true,
    );
    expect(setOpen).toHaveBeenCalledWith(false);
    // Spinner should hold while navigation is in flight (R4 fix).
    expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('weekly-content')).not.toBeInTheDocument();
  });

  it('skips redirect and shows children with CTA when pref is already set', async () => {
    const { navigate, setUxPreference } = setup({
      isInTreatment: false,
      redirectShown: true,
    });
    const setOpen = jest.fn();

    render(
      <WeeklyTimeEntryExperimentGate setOpen={setOpen}>
        <div data-testid="weekly-content">weekly</div>
      </WeeklyTimeEntryExperimentGate>,
    );

    // Wait for the async key-load `.finally()` to flush and the gate to
    // commit to its terminal state.
    await waitFor(() => {
      expect(screen.getByTestId('weekly-content')).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(setUxPreference).not.toHaveBeenCalled();
    expect(setOpen).not.toHaveBeenCalled();
  });

  it('shows the spinner while IXP and IPS are settling', () => {
    setup({ settled: false, prefsInitialized: false });
    render(
      <WeeklyTimeEntryExperimentGate setOpen={jest.fn()}>
        <div data-testid="weekly-content">weekly</div>
      </WeeklyTimeEntryExperimentGate>,
    );
    expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('weekly-content')).not.toBeInTheDocument();
  });

  it('falls through after the IPS timeout if prefs never initialize', async () => {
    jest.useFakeTimers();
    try {
      const { navigate } = setup({
        isInTreatment: false,
        prefsInitialized: false,
      });
      render(
        <WeeklyTimeEntryExperimentGate setOpen={jest.fn()}>
          <div data-testid="weekly-content">weekly</div>
        </WeeklyTimeEntryExperimentGate>,
      );

      // Spinner is up while we wait.
      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();

      // Advance past the 1500ms IPS timeout. Wrap in act() so React flushes
      // the resulting state update before assertions.
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      // Once the IPS wait elapses, the gate proceeds as "not yet redirected"
      // and triggers a navigate. waitFor needs real timers to retry.
      jest.useRealTimers();
      await waitFor(() => expect(navigate).toHaveBeenCalled());
    } finally {
      jest.useRealTimers();
    }
  });
});
