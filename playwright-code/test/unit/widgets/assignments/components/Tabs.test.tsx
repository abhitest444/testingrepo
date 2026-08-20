import React from 'react';
import { render, screen, act } from '@testing-library/react';
import AssignmentTabs from 'src/js/widgets/assignments/components/Tabs';
import { TabPersistence } from 'src/js/widgets/assignments/utils/tabPersistence';
import {
  CUSTOMER_ASSIGNMENTS_TRACKING_POINTS,
  WORKER_ASSIGNMENTS_TRACKING_POINTS,
} from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import { AssignmentsMainTabs } from 'src/js/widgets/assignments/types';

// --- Mocks ---

const mockTrack = jest.fn();
const mockFormatMessage = jest.fn(({ id }: { id: string }) => id);
const mockSandbox = { id: 'test-sandbox' };
const mockUseIXPFeatureFlag = jest.fn();

jest.mock('src/js/widgets/qbtOrchestrator/features/overview/hooks', () => ({
  useInitializeItmTasks: jest.fn(),
}));

jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: (opts: unknown) => mockUseIXPFeatureFlag(opts),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: mockFormatMessage }),
  useSandbox: () => mockSandbox,
  useTracking: () => mockTrack,
}));

jest.mock('src/js/widgets/assignments/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
  },
}));

let capturedOnChange: ((id: string) => void) | undefined;
let capturedSelected: string | undefined;

jest.mock('@ids-ts/tabs', () => ({
  Tabs: ({
    children,
    onChange,
    selected,
  }: {
    children: React.ReactNode;
    onChange: (id: string) => void;
    selected: string;
    isHorizontalRuleVisible?: boolean;
  }) => {
    capturedOnChange = onChange;
    capturedSelected = selected;
    return (
      <div data-testid="tabs-container" data-selected={selected}>
        {children}
      </div>
    );
  },
  Tab: ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`tab-${id}`} role="tab" id={`tab-id-${id}`}>
      <span>{title}</span>
      <div data-testid={`tab-content-${id}`}>{children}</div>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/CustomerAssignmentsTab',
  () =>
    function MockCustomerAssignmentsTab() {
      return <div data-testid="customer-assignments-tab" />;
    },
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkerAssignmentsTab',
  () =>
    function MockWorkerAssignmentsTab() {
      return <div data-testid="worker-assignments-tab" />;
    },
);

jest.mock('src/js/widgets/assignments/components/styles/Tabs.styled', () => ({
  TabsGlobalStyles: () => <style data-testid="tabs-global-styles" />,
}));

jest.mock('src/js/widgets/assignments/utils/tabPersistence', () => ({
  TabPersistence: {
    getMainTab: jest.fn(() => AssignmentsMainTabs.CUSTOMERS),
    clearMainTab: jest.fn(),
  },
}));

// --- Test Suite ---

describe('AssignmentTabs', () => {
  beforeEach(() => {
    capturedOnChange = undefined;
    capturedSelected = undefined;
    jest.clearAllMocks();
    (TabPersistence.getMainTab as jest.Mock).mockReturnValue(
      AssignmentsMainTabs.CUSTOMERS,
    );
    mockUseIXPFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
    });
  });

  // =====================================================================
  // RENDERING
  // =====================================================================

  describe('Rendering', () => {
    it('renders the Tabs container', () => {
      render(<AssignmentTabs />);
      expect(screen.getByTestId('tabs-container')).toBeInTheDocument();
    });

    it('renders both Customers and Workers tabs', () => {
      render(<AssignmentTabs />);
      expect(screen.getByTestId('tab-CUSTOMERS')).toBeInTheDocument();
      expect(screen.getByTestId('tab-WORKERS')).toBeInTheDocument();
    });

    it('renders CustomerAssignmentsTab inside Customers tab', () => {
      render(<AssignmentTabs />);
      const content = screen.getByTestId('tab-content-CUSTOMERS');
      expect(content).toContainElement(
        screen.getByTestId('customer-assignments-tab'),
      );
    });

    it('renders WorkerAssignmentsTab inside Workers tab', () => {
      render(<AssignmentTabs />);
      const content = screen.getByTestId('tab-content-WORKERS');
      expect(content).toContainElement(
        screen.getByTestId('worker-assignments-tab'),
      );
    });

    it('renders TabsGlobalStyles', () => {
      render(<AssignmentTabs />);
      expect(screen.getByTestId('tabs-global-styles')).toBeInTheDocument();
    });

    it('formats tab titles via intl', () => {
      render(<AssignmentTabs />);
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'assignments.tab.title.customers',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'assignments.tab.title.workers',
      });
    });
  });

  // =====================================================================
  // TEAM MEMBERS FEATURE FLAG
  // =====================================================================

  describe('Team members feature flag', () => {
    it('renders nothing while the feature flag is loading', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: true,
      });
      const { container } = render(<AssignmentTabs />);
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render the Tabs container while the feature flag is loading', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: true,
      });
      render(<AssignmentTabs />);
      expect(screen.queryByTestId('tabs-container')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('customer-assignments-tab'),
      ).not.toBeInTheDocument();
    });

    it('renders only CustomerAssignmentsTab when the flag is enabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
      });
      render(<AssignmentTabs />);
      expect(
        screen.getByTestId('customer-assignments-tab'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('tabs-container')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('worker-assignments-tab'),
      ).not.toBeInTheDocument();
    });

    it('renders both tabs when the flag is disabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        isLoading: false,
      });
      render(<AssignmentTabs />);
      expect(screen.getByTestId('tab-CUSTOMERS')).toBeInTheDocument();
      expect(screen.getByTestId('tab-WORKERS')).toBeInTheDocument();
    });

    it('does not render TabsGlobalStyles when the flag is enabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
      });
      render(<AssignmentTabs />);
      expect(
        screen.queryByTestId('tabs-global-styles'),
      ).not.toBeInTheDocument();
    });

    it('does not load or clear persisted tab when the flag is enabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: true,
        isLoading: false,
      });
      render(<AssignmentTabs />);
      expect(TabPersistence.getMainTab).not.toHaveBeenCalled();
      expect(TabPersistence.clearMainTab).not.toHaveBeenCalled();
    });

    it('passes the correct flag name to useIXPFeatureFlag', () => {
      render(<AssignmentTabs />);
      expect(mockUseIXPFeatureFlag).toHaveBeenCalledWith(
        expect.objectContaining({
          flagName: 'SBSEG-QBO-Enable-Time-Tab-Team-Members',
          defaultValue: false,
        }),
      );
    });
  });

  // =====================================================================
  // DEFAULT TAB INITIALIZATION
  // =====================================================================

  describe('Default tab initialization', () => {
    it('defaults to CUSTOMERS when no initialTab or persisted tab', () => {
      (TabPersistence.getMainTab as jest.Mock).mockReturnValue(
        AssignmentsMainTabs.CUSTOMERS,
      );
      render(<AssignmentTabs />);
      expect(capturedSelected).toBe(AssignmentsMainTabs.CUSTOMERS);
    });

    it('uses initialTab prop when provided', () => {
      render(<AssignmentTabs initialTab={AssignmentsMainTabs.WORKERS} />);
      expect(capturedSelected).toBe(AssignmentsMainTabs.WORKERS);
    });

    it('prefers initialTab over persisted value', () => {
      (TabPersistence.getMainTab as jest.Mock).mockReturnValue(
        AssignmentsMainTabs.WORKERS,
      );
      render(<AssignmentTabs initialTab={AssignmentsMainTabs.CUSTOMERS} />);
      expect(capturedSelected).toBe(AssignmentsMainTabs.CUSTOMERS);
    });
  });

  // =====================================================================
  // TAB PERSISTENCE
  // =====================================================================

  describe('Tab persistence', () => {
    it('loads persisted tab from storage when no initialTab is provided', () => {
      (TabPersistence.getMainTab as jest.Mock).mockReturnValue(
        AssignmentsMainTabs.WORKERS,
      );
      render(<AssignmentTabs />);
      expect(TabPersistence.getMainTab).toHaveBeenCalledWith(mockSandbox);
      expect(capturedSelected).toBe(AssignmentsMainTabs.WORKERS);
    });

    it('clears persisted tab after loading when no initialTab', () => {
      render(<AssignmentTabs />);
      expect(TabPersistence.clearMainTab).toHaveBeenCalledWith(mockSandbox);
    });

    it('does NOT load or clear persisted tab when initialTab is provided', () => {
      render(<AssignmentTabs initialTab={AssignmentsMainTabs.WORKERS} />);
      expect(TabPersistence.getMainTab).not.toHaveBeenCalled();
      expect(TabPersistence.clearMainTab).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // TAB SWITCHING & TRACKING
  // =====================================================================

  describe('Tab switching and tracking', () => {
    it('updates selected tab when onChange is called with CUSTOMERS', () => {
      render(<AssignmentTabs initialTab={AssignmentsMainTabs.WORKERS} />);
      act(() => {
        capturedOnChange!('CUSTOMERS');
      });
      expect(capturedSelected).toBe('CUSTOMERS');
    });

    it('updates selected tab when onChange is called with WORKERS', () => {
      render(<AssignmentTabs />);
      act(() => {
        capturedOnChange!('WORKERS');
      });
      expect(capturedSelected).toBe('WORKERS');
    });

    it('fires correct tracking events when switching to CUSTOMERS tab', () => {
      render(<AssignmentTabs initialTab={AssignmentsMainTabs.WORKERS} />);
      act(() => {
        capturedOnChange!('CUSTOMERS');
      });
      expect(mockTrack).toHaveBeenCalledWith(
        CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGNMENTS_TAB_CLICKED,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.CUSTOMER_TAB_VIEWED,
      );
    });

    it('fires correct tracking events when switching to WORKERS tab', () => {
      render(<AssignmentTabs />);
      act(() => {
        capturedOnChange!('WORKERS');
      });
      expect(mockTrack).toHaveBeenCalledWith(
        CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGNMENTS_TAB_CLICKED,
      );
      expect(mockTrack).toHaveBeenCalledWith(
        WORKER_ASSIGNMENTS_TRACKING_POINTS.WORKER_TAB_VIEWED,
      );
    });

    it('does not fire any tracking events for an unknown tab value', () => {
      render(<AssignmentTabs />);
      act(() => {
        capturedOnChange!('UNKNOWN_TAB');
      });
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('handles multiple sequential tab switches', () => {
      render(<AssignmentTabs />);

      act(() => {
        capturedOnChange!('WORKERS');
      });
      expect(capturedSelected).toBe('WORKERS');
      expect(mockTrack).toHaveBeenCalledTimes(2);

      mockTrack.mockClear();

      act(() => {
        capturedOnChange!('CUSTOMERS');
      });
      expect(capturedSelected).toBe('CUSTOMERS');
      expect(mockTrack).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================================
  // REDUX PROVIDER
  // =====================================================================

  describe('Redux Provider wrapping', () => {
    it('renders without crashing (Provider wraps children)', () => {
      const { container } = render(<AssignmentTabs />);
      expect(container).toBeInTheDocument();
    });

    it('renders child content within Provider', () => {
      render(<AssignmentTabs />);
      expect(
        screen.getByTestId('customer-assignments-tab'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('worker-assignments-tab')).toBeInTheDocument();
    });
  });
});
