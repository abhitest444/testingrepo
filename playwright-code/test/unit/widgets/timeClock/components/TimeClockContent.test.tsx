import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TIME_CLOCK_FEATURE,
  TIME_CLOCK_FUNCTIONALITY,
} from '../../../../../src/js/widgets/timeClock/Widget';
import { TimeTracking_TimeForType } from '../../../../../src/__generated__/timeTracking/graphql';
import TimeClockContent from '../../../../../src/js/widgets/timeClock/components/TimeClockContent';

// Mock the lazy-loaded HOCs so we can assert what props they receive without
// pulling in the full HOC trees.
const mockTimeActionView = jest.fn();
const mockTimeClockView = jest.fn();

jest.mock(
  '../../../../../src/js/widgets/timeClock/components/TimeActionViewHOC',
  () => ({
    __esModule: true,
    default: (props: any) => {
      const { employeeId } = props;
      mockTimeActionView(props);
      return (
        <div data-testid="time-action-view" data-employee-id={employeeId}>
          Time Action View Mock
        </div>
      );
    },
  }),
);

jest.mock(
  '../../../../../src/js/widgets/timeClock/components/TimeClockHOC',
  () => ({
    __esModule: true,
    default: (props: any) => {
      const { employeeId, timeForType } = props;
      mockTimeClockView(props);
      return (
        <div
          data-testid="time-clock-view"
          data-employee-id={employeeId}
          data-time-for-type={timeForType}
        >
          Time Clock View Mock
        </div>
      );
    },
  }),
);

const mockUseIXPFeatureFlag = jest.fn();
jest.mock('../../../../../src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: (...args: any[]) => mockUseIXPFeatureFlag(...args),
}));

const mockLoadWorkers = jest.fn();
const mockUseTimeTrackingWorkers = jest.fn();
jest.mock(
  '../../../../../src/js/service/hooks/groups/useTimeTrackingWorkers',
  () => ({
    useTimeTrackingWorkers: (...args: any[]) =>
      mockUseTimeTrackingWorkers(...args),
  }),
);

const mockIsWorkforceEnvironment = jest.fn();
jest.mock('../../../../../src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: (...args: any[]) =>
    mockIsWorkforceEnvironment(...args),
}));

const buildSandbox = (authId?: string) =>
  ({
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    },
    appContext: {
      getUserAuthInfo: jest.fn(() => (authId ? { authId } : undefined)),
    },
  } as any);

const setFlag = (isEnabled: boolean) => {
  mockUseIXPFeatureFlag.mockReturnValue({ isEnabled, settled: true });
};

const setResolvedWorker = (
  worker?: { id: string; type: TimeTracking_TimeForType } | undefined,
) => {
  mockUseTimeTrackingWorkers.mockReturnValue({
    workers: worker ? [worker] : [],
    loading: false,
    error: null,
    loadWorkers: mockLoadWorkers,
    pageInfo: null,
    totalCount: null,
    fetchNextPage: jest.fn(),
    fetchPreviousPage: jest.fn(),
    refetch: jest.fn(),
  });
};

describe('TimeClockContent', () => {
  const mockSetOpen = jest.fn();
  const mockOnClick = jest.fn();
  const mockSetHasError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setFlag(false);
    setResolvedWorker(undefined);
    mockIsWorkforceEnvironment.mockReturnValue(false);
  });

  describe('Component rendering with different features', () => {
    it('should render with time-action feature and action-button functionality', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'time-action' as TIME_CLOCK_FEATURE,
            functionality: 'action-button' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          onClick={mockOnClick}
          setHasError={mockSetHasError}
          sandbox={buildSandbox()}
          employeeId="emp-123"
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });

    it('should render with time-clock feature and clock-form functionality when open', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox()}
          employeeId="emp-456"
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });

    it('should render when feature is time-clock but open is false', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open={false}
          setOpen={mockSetOpen}
          sandbox={buildSandbox()}
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });

    it('should render when feature is time-clock but functionality is not clock-form', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'action-button' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          sandbox={buildSandbox()}
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });
  });

  describe('FF gating: legacy-QBO-user FF OFF (default)', () => {
    it('passes the legacy employeeId prop through to TimeClockHOC and forces EMPLOYEE timeForType', async () => {
      setFlag(false);
      setResolvedWorker(undefined);

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-ignored')}
          employeeId="emp-prop"
        />,
      );

      const node = await screen.findByTestId('time-clock-view');
      expect(node).toHaveAttribute('data-employee-id', 'emp-prop');
      expect(node).toHaveAttribute(
        'data-time-for-type',
        TimeTracking_TimeForType.Employee,
      );
    });

    it('does not invoke the worker resolver with a real authId when FF is OFF', () => {
      setFlag(false);

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-ignored')}
          employeeId="emp-prop"
        />,
      );

      // authId derivation short-circuits to '' when FF is off, so loadWorkers
      // is never called.
      expect(mockLoadWorkers).not.toHaveBeenCalled();
    });
  });

  describe('FF gating: legacy-QBO-user FF ON', () => {
    it('resolves authId from sandbox and passes worker.id as employeeId', async () => {
      setFlag(true);
      setResolvedWorker({
        id: 'worker-id-1',
        type: TimeTracking_TimeForType.Employee,
      });

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-1')}
          employeeId="emp-prop-should-be-ignored"
        />,
      );

      expect(mockLoadWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            identityAuthIds: ['auth-1'],
          }),
        }),
      );

      const node = await screen.findByTestId('time-clock-view');
      expect(node).toHaveAttribute('data-employee-id', 'worker-id-1');
      expect(node).toHaveAttribute(
        'data-time-for-type',
        TimeTracking_TimeForType.Employee,
      );
    });

    it('forwards LEGACY_QBO_USER timeForType when the resolved worker is a legacy QBO user', async () => {
      setFlag(true);
      setResolvedWorker({
        id: 'worker-legacy-1',
        type: TimeTracking_TimeForType.LegacyQboUser,
      });

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-legacy')}
        />,
      );

      const node = await screen.findByTestId('time-clock-view');
      expect(node).toHaveAttribute('data-employee-id', 'worker-legacy-1');
      expect(node).toHaveAttribute(
        'data-time-for-type',
        TimeTracking_TimeForType.LegacyQboUser,
      );
    });

    it('falls back to empty employeeId and EMPLOYEE timeForType while the worker is unresolved', async () => {
      setFlag(true);
      setResolvedWorker(undefined);

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-1')}
          employeeId="emp-prop-should-be-ignored"
        />,
      );

      const node = await screen.findByTestId('time-clock-view');
      expect(node).toHaveAttribute('data-employee-id', '');
      expect(node).toHaveAttribute(
        'data-time-for-type',
        TimeTracking_TimeForType.Employee,
      );
    });

    it('uses employeeId prop in Workforce even while worker is unresolved', async () => {
      setFlag(true);
      setResolvedWorker(undefined);
      mockIsWorkforceEnvironment.mockReturnValue(true);

      render(
        <TimeClockContent
          options={{
            feature: 'time-clock' as TIME_CLOCK_FEATURE,
            functionality: 'clock-form' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          setOpen={mockSetOpen}
          sandbox={buildSandbox('auth-1')}
          employeeId="workforce-employee-id"
        />,
      );

      const node = await screen.findByTestId('time-clock-view');
      expect(node).toHaveAttribute('data-employee-id', 'workforce-employee-id');
      expect(node).toHaveAttribute(
        'data-time-for-type',
        TimeTracking_TimeForType.Employee,
      );
    });

    it('also resolves employeeId for the time-action button surface', async () => {
      setFlag(true);
      setResolvedWorker({
        id: 'worker-id-2',
        type: TimeTracking_TimeForType.Employee,
      });

      render(
        <TimeClockContent
          options={{
            feature: 'time-action' as TIME_CLOCK_FEATURE,
            functionality: 'action-button' as TIME_CLOCK_FUNCTIONALITY,
          }}
          open
          onClick={mockOnClick}
          setHasError={mockSetHasError}
          sandbox={buildSandbox('auth-2')}
        />,
      );

      const node = await screen.findByTestId('time-action-view');
      expect(node).toHaveAttribute('data-employee-id', 'worker-id-2');
    });
  });

  describe('default props and edge cases', () => {
    it('should use default props when optional props are not provided', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'time-action' as TIME_CLOCK_FEATURE,
            functionality: 'action-button' as TIME_CLOCK_FUNCTIONALITY,
          }}
          sandbox={buildSandbox()}
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });

    it('should render for unknown feature', () => {
      const { container } = render(
        <TimeClockContent
          options={{
            feature: 'unknown-feature' as TIME_CLOCK_FEATURE,
            functionality: 'action-button' as TIME_CLOCK_FUNCTIONALITY,
          }}
          sandbox={buildSandbox()}
        />,
      );

      expect(container.querySelector('.time-clock-widget')).toBeInTheDocument();
    });
  });
});
