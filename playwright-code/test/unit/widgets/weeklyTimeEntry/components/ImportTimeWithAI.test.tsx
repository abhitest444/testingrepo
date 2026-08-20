/**
 * Tests for ImportTimeWithAICTA.
 *
 * Exercises the CTA gating, portal-mount lifecycle, fallback selector
 * warning, tip popover behavior, and resize/scroll listeners.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ImportTimeWithAICTA } from 'src/js/widgets/weeklyTimeEntry/components/ImportTimeWithAI';
import { WeeklyImportExperimentProvider } from 'src/js/widgets/weeklyTimeEntry/components/WeeklyImportExperimentContext';

const navigate = jest.fn();
const loggerLog = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    logger: { log: loggerLog },
    navigation: { navigate },
  }),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B2: ({ children }: any) => <span>{children}</span>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('@design-systems/icons', () => ({
  AiSparkles: () => <svg data-testid="ai-sparkles" />,
  Close: () => <svg data-testid="close-icon" />,
}));

const renderCTA = (showImportCTA: boolean, treatmentKey?: string) =>
  render(
    <WeeklyImportExperimentProvider
      showImportCTA={showImportCTA}
      treatmentKey={treatmentKey}
    >
      <ImportTimeWithAICTA />
    </WeeklyImportExperimentProvider>,
  );

describe('ImportTimeWithAICTA', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders nothing when showImportCTA is false', () => {
    const { container } = renderCTA(false);
    expect(container.firstChild).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders nothing when no header target exists in the DOM', () => {
    const { container } = renderCTA(true, 'IXP2_T_TREATED');
    // No data-portal-slot and no fallback class — gate stays "not ready"
    // and the component returns null.
    expect(container.firstChild).toBeNull();
  });

  it('mounts the CTA into the stable data-portal-slot when present', () => {
    const slot = document.createElement('div');
    slot.setAttribute('data-portal-slot', 'trowser-header-actions');
    document.body.appendChild(slot);

    renderCTA(true, 'IXP2_T_TREATED');

    // CTA button is rendered inside the slot.
    expect(slot.querySelector('button')).not.toBeNull();
    expect(slot.textContent).toContain('import.time.with.ai');
    // Stable slot path: no fallback warning.
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('falls back to TrowserHeader-headerRight class and warns once', () => {
    const fallback = document.createElement('div');
    fallback.className = 'foo TrowserHeader-headerRight-abc bar';
    document.body.appendChild(fallback);

    renderCTA(true, 'IXP2_T_TREATED');

    expect(fallback.querySelector('button')).not.toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('TrowserHeader-headerRight');
  });

  it('navigates to time-agent import on CTA click', () => {
    const slot = document.createElement('div');
    slot.setAttribute('data-portal-slot', 'trowser-header-actions');
    document.body.appendChild(slot);

    renderCTA(true, 'IXP2 T+TREATED');

    const button = slot.querySelector('button') as HTMLButtonElement;
    fireEvent.click(button);

    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('Opening time-agent import from CTA'),
    );
    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining(
        'app/time-agent-ui-plugin/timeagent?from=payroll_weekly_timesheet&treatment=IXP2%20T%2BTREATED',
      ),
    );
  });

  it('navigates with empty treatment when treatmentKey is undefined', () => {
    const slot = document.createElement('div');
    slot.setAttribute('data-portal-slot', 'trowser-header-actions');
    document.body.appendChild(slot);

    renderCTA(true);
    fireEvent.click(slot.querySelector('button') as HTMLButtonElement);

    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining(
        'app/time-agent-ui-plugin/timeagent?from=payroll_weekly_timesheet&treatment=',
      ),
    );
  });

  it('shows the tip popover after position is measured and dismisses on close click', () => {
    jest.useFakeTimers();
    try {
      const slot = document.createElement('div');
      slot.setAttribute('data-portal-slot', 'trowser-header-actions');
      document.body.appendChild(slot);

      // Stub getBoundingClientRect so the tip-positioning short-circuit
      // (`rect.width === 0`) doesn't skip the setState.
      const rect = {
        top: 10,
        bottom: 30,
        left: 100,
        right: 220,
        width: 120,
        height: 20,
        x: 100,
        y: 10,
        toJSON: () => '',
      } as DOMRect;
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue(rect);

      renderCTA(true, 'IXP2_T_TREATED');

      // Advance the 400ms tip-position timer.
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // Tip body and dismiss CTA from the popover should be present.
      expect(screen.getByText('try.ai.time.import.title')).toBeInTheDocument();
      const dismissBtn = screen.getByText('try.ai.time.import.dismiss');
      expect(dismissBtn).toBeInTheDocument();

      // Click dismiss — tip hides.
      fireEvent.click(dismissBtn);
      expect(
        screen.queryByText('try.ai.time.import.title'),
      ).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('dismisses the tip via the aria-labeled close button', () => {
    jest.useFakeTimers();
    try {
      const slot = document.createElement('div');
      slot.setAttribute('data-portal-slot', 'trowser-header-actions');
      document.body.appendChild(slot);
      jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          top: 10,
          bottom: 30,
          left: 100,
          right: 220,
          width: 120,
          height: 20,
          x: 100,
          y: 10,
          toJSON: () => '',
        } as DOMRect);

      renderCTA(true, 'IXP2_T_TREATED');
      act(() => {
        jest.advanceTimersByTime(400);
      });

      const close = screen.getByLabelText('Dismiss tip');
      fireEvent.click(close);

      expect(
        screen.queryByText('try.ai.time.import.title'),
      ).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('repositions the tip on window resize and scroll', () => {
    jest.useFakeTimers();
    try {
      const slot = document.createElement('div');
      slot.setAttribute('data-portal-slot', 'trowser-header-actions');
      document.body.appendChild(slot);

      const rectSpy = jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          top: 10,
          bottom: 30,
          left: 100,
          right: 220,
          width: 120,
          height: 20,
          x: 100,
          y: 10,
          toJSON: () => '',
        } as DOMRect);

      renderCTA(true, 'IXP2_T_TREATED');
      act(() => {
        jest.advanceTimersByTime(400);
      });

      const callsBeforeResize = rectSpy.mock.calls.length;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(rectSpy.mock.calls.length).toBeGreaterThan(callsBeforeResize);

      const callsBeforeScroll = rectSpy.mock.calls.length;
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      expect(rectSpy.mock.calls.length).toBeGreaterThan(callsBeforeScroll);
    } finally {
      jest.useRealTimers();
    }
  });

  it('detaches the portal root on unmount', () => {
    const slot = document.createElement('div');
    slot.setAttribute('data-portal-slot', 'trowser-header-actions');
    document.body.appendChild(slot);

    const { unmount } = renderCTA(true, 'IXP2_T_TREATED');
    // Sanity: portal root attached as a child of the slot.
    expect(slot.children.length).toBeGreaterThan(0);

    unmount();
    expect(slot.children.length).toBe(0);
  });
});
