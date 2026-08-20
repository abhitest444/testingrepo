import React from 'react';
import { render, act } from '@testing-library/react';
import TimeProjectTour from 'src/js/widgets/timeProject/components/TimeProjectTour';

// --- Mock NLS / sandbox surface --------------------------------------------
// The tour pulls intl + sandbox from `@payroll/quicksand`. We give it a
// pass-through `formatMessage` (so we can spy on which keys were
// requested) and a fully stubbed sandbox.logger so the warn-on-persist-
// failure branch is observable.
const sandboxLoggerWarn = jest.fn();
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      warn: sandboxLoggerWarn,
      error: jest.fn(),
      debug: jest.fn(),
    },
  }),
}));

// --- Mock useTourStorage ---------------------------------------------------
const tourStorageState: {
  isTourCompleted: boolean;
  isLoading: boolean;
  initializeTourStatus: jest.Mock;
  markTourCompleted: jest.Mock;
} = {
  isTourCompleted: false,
  isLoading: false,
  initializeTourStatus: jest.fn(),
  markTourCompleted: jest.fn().mockResolvedValue(undefined),
};
jest.mock('src/js/widgets/common/TourFramework/hooks/useTourStorage', () => ({
  useTourStorage: () => tourStorageState,
}));

// --- Mock the federated TourFramework Widget (intro modal) -----------------
let capturedWidgetProps: any = null;
jest.mock('web-shell-core/widgets/HOCWidget', () => {
  const ReactLib = require('react');
  const MockWidget = (props: any) => {
    capturedWidgetProps = props;
    return ReactLib.createElement('div', {
      'data-testid': props['data-testid'] || 'guided-modal-widget',
    });
  };
  return { __esModule: true, default: MockWidget };
});

// --- Mock the shared GuidedTooltip used for steps 2 + 3 --------------------
// The tour now renders two GuidedTooltip instances. The first step's
// tour content is anchored on the manage-projects ref; the second on
// the estimate-drawer ref. We capture each tooltip's props so tests can
// verify which is open and fire its onClose / onComplete callbacks.
let capturedManageTooltipProps: any = null;
let capturedEstimateTooltipProps: any = null;
jest.mock(
  'src/js/widgets/common/TourFramework/components/GuidedTooltip',
  () => {
    const ReactLib = require('react');
    const MockTooltip = (props: any) => {
      const stepId = props.steps?.[0]?.id;
      if (stepId === 'time-project-tour-manage') {
        capturedManageTooltipProps = props;
      } else if (stepId === 'time-project-tour-estimate') {
        capturedEstimateTooltipProps = props;
      }
      if (!props.open) return null;
      return ReactLib.createElement('div', {
        'data-testid': `tooltip-${stepId}`,
      });
    };
    return { __esModule: true, default: MockTooltip };
  },
);

// --- Mock the styled overrides ---------------------------------------------
jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectTour.styled',
  () => {
    const ReactLib = require('react');
    const passthrough = ({ children }: any) =>
      ReactLib.createElement('div', null, children);
    return {
      IntroBulletList: passthrough,
      IntroBullet: passthrough,
      IntroModalOverrides: () => null,
    };
  },
);

const makeAnchorRef = (
  node: HTMLElement | null = null,
): React.MutableRefObject<HTMLElement | null> => ({ current: node });

const baseProps = {
  enabled: true,
  hasProjects: true,
  anchorVersion: 0,
  manageProjectsAnchorRef: makeAnchorRef(),
  estimateDrawerAnchorRef: makeAnchorRef(),
  estimateDrawerOpen: false,
  onRequestOpenEstimateDrawer: jest.fn(),
  onComplete: jest.fn(),
};

const flushAsync = async () => {
  // The intro->advance + finishTour paths await
  // `markTourCompleted()`. A microtask flush is enough to settle them.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await act(async () => {});
};

describe('TimeProjectTour', () => {
  beforeEach(() => {
    capturedWidgetProps = null;
    capturedManageTooltipProps = null;
    capturedEstimateTooltipProps = null;
    sandboxLoggerWarn.mockClear();
    tourStorageState.isTourCompleted = false;
    tourStorageState.isLoading = false;
    tourStorageState.initializeTourStatus = jest.fn();
    tourStorageState.markTourCompleted = jest.fn().mockResolvedValue(undefined);
  });

  it('renders nothing while disabled', () => {
    render(<TimeProjectTour {...baseProps} enabled={false} />);
    expect(capturedWidgetProps).toBeNull();
    // Tooltips are mounted at all stages but they should be `open: false`.
    expect(capturedManageTooltipProps?.open).toBe(false);
    expect(capturedEstimateTooltipProps?.open).toBe(false);
  });

  it('renders nothing while the storage check is still pending', () => {
    tourStorageState.isLoading = true;
    render(<TimeProjectTour {...baseProps} />);
    expect(capturedWidgetProps).toBeNull();
    expect(capturedManageTooltipProps?.open).toBe(false);
  });

  it('skips the tour entirely when storage says it has already been completed', () => {
    tourStorageState.isTourCompleted = true;
    render(<TimeProjectTour {...baseProps} />);
    expect(capturedWidgetProps).toBeNull();
    expect(capturedManageTooltipProps?.open).toBe(false);
  });

  it('renders the intro Widget when enabled and not yet completed', () => {
    render(<TimeProjectTour {...baseProps} />);
    expect(capturedWidgetProps).not.toBeNull();
    expect(capturedWidgetProps.mode).toBe('modal');
    expect(capturedWidgetProps.steps).toHaveLength(1);
    expect(capturedWidgetProps.steps[0].id).toBe('time-project-intro');
  });

  it('starts the tour even when there are no projects (intro modal is still meaningful)', () => {
    render(<TimeProjectTour {...baseProps} hasProjects={false} />);
    expect(capturedWidgetProps).not.toBeNull();
    expect(capturedWidgetProps.steps[0].id).toBe('time-project-intro');
  });

  it('initializeTourStatus is called once when the tour becomes eligible', () => {
    render(<TimeProjectTour {...baseProps} />);
    expect(tourStorageState.initializeTourStatus).toHaveBeenCalled();
  });

  it('intro "Got it" advances to the manageProjects step (and ignores the framework ghost-close)', async () => {
    const manageRef = makeAnchorRef(document.createElement('span'));
    render(
      <TimeProjectTour {...baseProps} manageProjectsAnchorRef={manageRef} />,
    );

    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();

    expect(capturedManageTooltipProps.open).toBe(true);
    expect(capturedManageTooltipProps.steps[0].targetRef).toBe(manageRef);
    expect(tourStorageState.markTourCompleted).not.toHaveBeenCalled();
  });

  it('clicking the X on the intro modal finishes (and persists) the tour', async () => {
    const onComplete = jest.fn();
    render(<TimeProjectTour {...baseProps} onComplete={onComplete} />);
    act(() => {
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    expect(tourStorageState.markTourCompleted).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('manageProjects "Got it" asks the parent to open the estimate drawer when projects exist (and ignores the framework ghost-close)', async () => {
    const onRequestOpenEstimateDrawer = jest.fn();
    const manageRef = makeAnchorRef(document.createElement('span'));
    render(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        onRequestOpenEstimateDrawer={onRequestOpenEstimateDrawer}
      />,
    );

    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();

    // Mirror GuidedTooltip's single-step Done click: it fires both
    // onComplete AND onClose back-to-back. The tour MUST swallow the
    // ghost close so the third (estimate-drawer) step is reachable.
    act(() => {
      capturedManageTooltipProps.onComplete();
      capturedManageTooltipProps.onClose();
    });
    await flushAsync();
    expect(onRequestOpenEstimateDrawer).toHaveBeenCalledTimes(1);
    // Tour must NOT have been finished by the ghost close.
    expect(tourStorageState.markTourCompleted).not.toHaveBeenCalled();
  });

  it('manageProjects "Got it" finishes the tour when there are no projects (no third step to anchor)', async () => {
    const onRequestOpenEstimateDrawer = jest.fn();
    const onComplete = jest.fn();
    const manageRef = makeAnchorRef(document.createElement('span'));
    render(
      <TimeProjectTour
        {...baseProps}
        hasProjects={false}
        manageProjectsAnchorRef={manageRef}
        onRequestOpenEstimateDrawer={onRequestOpenEstimateDrawer}
        onComplete={onComplete}
      />,
    );

    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();

    act(() => {
      capturedManageTooltipProps.onComplete();
    });
    await flushAsync();
    expect(onRequestOpenEstimateDrawer).not.toHaveBeenCalled();
    expect(tourStorageState.markTourCompleted).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('auto-advances to the estimate-drawer step once the drawer mounts and registers an anchor', async () => {
    const manageNode = document.createElement('span');
    const manageRef = makeAnchorRef(manageNode);
    const estimateRef = makeAnchorRef(null);
    const { rerender } = render(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
      />,
    );

    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    expect(capturedManageTooltipProps.open).toBe(true);

    // Parent reports a fresh DOM node by mutating the ref + bumping
    // `anchorVersion` (mirrors the production setEstimateDrawerAnchor).
    estimateRef.current = document.createElement('div');
    rerender(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        estimateDrawerOpen
        anchorVersion={1}
      />,
    );

    expect(capturedEstimateTooltipProps.open).toBe(true);
    expect(capturedEstimateTooltipProps.steps[0].targetRef).toBe(estimateRef);
    expect(capturedManageTooltipProps.open).toBe(false);
  });

  it('estimate-drawer "Got it" finishes the tour', async () => {
    const onComplete = jest.fn();
    const manageRef = makeAnchorRef(document.createElement('span'));
    const estimateRef = makeAnchorRef(null);
    const { rerender } = render(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        onComplete={onComplete}
      />,
    );
    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    estimateRef.current = document.createElement('div');
    rerender(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        estimateDrawerOpen
        anchorVersion={1}
        onComplete={onComplete}
      />,
    );

    act(() => {
      capturedEstimateTooltipProps.onComplete();
    });
    await flushAsync();
    expect(tourStorageState.markTourCompleted).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('recovers from a closed drawer mid-step by finishing the tour', async () => {
    const onComplete = jest.fn();
    const manageRef = makeAnchorRef(document.createElement('span'));
    const estimateRef = makeAnchorRef(null);
    const { rerender } = render(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        onComplete={onComplete}
      />,
    );
    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    estimateRef.current = document.createElement('div');
    rerender(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        estimateDrawerOpen
        anchorVersion={1}
        onComplete={onComplete}
      />,
    );
    expect(capturedEstimateTooltipProps.open).toBe(true);

    // Drawer goes away.
    estimateRef.current = null;
    rerender(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        estimateDrawerAnchorRef={estimateRef}
        estimateDrawerOpen={false}
        anchorVersion={2}
        onComplete={onComplete}
      />,
    );
    await flushAsync();

    expect(tourStorageState.markTourCompleted).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('resets back to idle (without persisting) when `enabled` flips false mid-tour', async () => {
    const manageRef = makeAnchorRef(document.createElement('span'));
    const { rerender } = render(
      <TimeProjectTour {...baseProps} manageProjectsAnchorRef={manageRef} />,
    );
    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    expect(capturedManageTooltipProps.open).toBe(true);

    rerender(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        enabled={false}
      />,
    );
    await flushAsync();

    expect(capturedManageTooltipProps.open).toBe(false);
    expect(capturedEstimateTooltipProps?.open).toBe(false);
    expect(tourStorageState.markTourCompleted).not.toHaveBeenCalled();
  });

  it('clicking X on the manageProjects tooltip finishes the tour', async () => {
    const onComplete = jest.fn();
    const manageRef = makeAnchorRef(document.createElement('span'));
    render(
      <TimeProjectTour
        {...baseProps}
        manageProjectsAnchorRef={manageRef}
        onComplete={onComplete}
      />,
    );
    act(() => {
      capturedWidgetProps.steps[0].onNext();
      capturedWidgetProps.onClose();
    });
    await flushAsync();

    act(() => {
      capturedManageTooltipProps.onClose();
    });
    await flushAsync();
    expect(tourStorageState.markTourCompleted).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('logs a warning when persisting tour completion fails', async () => {
    tourStorageState.markTourCompleted = jest
      .fn()
      .mockRejectedValue(new Error('quota exceeded'));
    render(<TimeProjectTour {...baseProps} />);
    act(() => {
      capturedWidgetProps.onClose();
    });
    await flushAsync();
    expect(sandboxLoggerWarn).toHaveBeenCalledWith(
      '[TimeProjectTour] Failed to persist tour completion',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
