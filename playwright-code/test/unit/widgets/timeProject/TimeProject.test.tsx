import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import TimeProject from 'src/js/widgets/timeProject/TimeProject';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import estimateDrawerReducer from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import customerWorkerAssignmentsReducer from 'src/js/widgets/assignments/store/customerWorkerAssignmentsSlice';
import {
  DEFAULT_PAGE_SIZE,
  PROJECT_SORT_ORDER,
} from 'src/js/widgets/timeProject/constants';
import { TimeProjectRow } from 'src/js/widgets/timeProject/types';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn().mockReturnValue({ isEnabled: true }),
}));

const mockUseTimeProjectsFetching = jest.fn();
jest.mock('src/js/widgets/timeProject/hooks/useTimeProjectsFetching', () => ({
  useTimeProjectsFetching: (...args: any[]) =>
    mockUseTimeProjectsFetching(...args),
}));

const mockFetchProjectById = jest.fn().mockResolvedValue(null);
jest.mock('src/js/widgets/timeProject/hooks/useFetchProjectById', () => ({
  useFetchProjectById: () => ({ fetchProjectById: mockFetchProjectById }),
}));

// Stable logger mock so tests can assert on `logger.error(...)` calls
// (e.g. the post-estimate-save refetch failure path). Using a top-level
// `jest.mock` of the logging module - rather than relying on the
// `useSandbox` mock's nested `logger` - guarantees both the production
// code path and the test reference the same `jest.fn`.
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  fatal: jest.fn(),
};
jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  __esModule: true,
  useTimeProjectLogger: () => mockLogger,
  useTimeProjectSandbox: () => undefined,
  logNavigationEvent: jest.fn(),
  withLoggedOperation: jest.fn(),
}));

jest.mock('src/js/widgets/timeProject/hooks/useCustomerFilter', () => ({
  useCustomerFilter: () => ({
    customers: [],
    loading: false,
    hasMore: false,
    loadCustomers: jest.fn(),
    loadMore: jest.fn(),
  }),
}));

const mockUseCompanyTimezone = jest.fn();
jest.mock('src/js/widgets/timeProject/hooks/useCompanyTimezone', () => ({
  useCompanyTimezone: () => mockUseCompanyTimezone(),
}));

let capturedSummaryProps: any = {};
jest.mock('src/js/widgets/timeProject/components/ProjectSummary', () => {
  const MockProjectSummary = ({
    project,
    onBack,
    onAssignWorkers,
    ...rest
  }: any) => {
    capturedSummaryProps = { project, onBack, onAssignWorkers, ...rest };
    return (
      <div data-testid="project-summary">
        <span data-testid="summary-project-name">{project.projectName}</span>
        <button
          data-testid="summary-back-btn"
          onClick={onBack}
          aria-label="back"
        />
        <button
          data-testid="summary-assign-btn"
          onClick={() => onAssignWorkers(project)}
          aria-label="assign"
        />
      </div>
    );
  };
  return { __esModule: true, default: MockProjectSummary };
});

jest.mock(
  'src/js/widgets/timeProject/components/ProjectWorkerAssignmentDrawer',
  () => {
    const MockDrawer = ({ onClose, onSuccess }: any) => (
      <div data-testid="assign-drawer">
        <button
          data-testid="assign-drawer-close"
          onClick={onClose}
          aria-label="close"
        />
        <button
          data-testid="assign-drawer-success"
          onClick={onSuccess}
          aria-label="success"
        />
      </div>
    );
    return { __esModule: true, default: MockDrawer };
  },
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

let capturedTableProps: any = {};
jest.mock('src/js/widgets/timeProject/components/TimeProjectTable', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSelector } = require('react-redux');
  const MockTable = (props: any) => {
    capturedTableProps = props;
    const rows = useSelector((s: any) => s.projects.filteredRows) || [];
    return (
      <div data-testid="time-project-table">
        <div data-testid="time-project-zero-state" />
        {rows.map((row: any) => (
          <div
            key={row.projectId}
            data-testid={`time-project-row-${row.projectId}`}
            onClick={() => props.onRowClick && props.onRowClick(row)}
            role="button"
            tabIndex={0}
            aria-label={`open-project-${row.projectId}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                if (props.onRowClick) {
                  props.onRowClick(row);
                }
              }
            }}
          />
        ))}
      </div>
    );
  };
  MockTable.displayName = 'TimeProjectTable';
  return MockTable;
});

let capturedFiltersProps: any = {};
jest.mock('src/js/widgets/timeProject/components/TimeProjectFilters', () => {
  const MockFilters = (props: any) => {
    capturedFiltersProps = props;
    return <div data-testid="time-project-filters" />;
  };
  MockFilters.displayName = 'TimeProjectFilters';
  return { __esModule: true, default: MockFilters };
});

let capturedEstimateDrawerProps: any = {};
jest.mock('src/js/widgets/timeProject/components/CreateEstimateDrawer', () => {
  const MockDrawer = (props: any) => {
    capturedEstimateDrawerProps = props;
    return <div data-testid="estimate-drawer" />;
  };
  MockDrawer.displayName = 'CreateEstimateDrawer';
  return MockDrawer;
});

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, any>) => {
      let msg = nlsMessages[id] || id;
      if (values) {
        Object.entries(values).forEach(([key, val]) => {
          msg = msg.replace(`{${key}}`, String(val));
        });
      }
      return msg;
    },
  }),
  useSandbox: () => ({
    navigation: { navigate: jest.fn() },
    // The Time Projects walkthrough (TimeProjectTour) routes through
    // useTourStorage, which logs at info/warn/error. Provide stubs for
    // all three so a missing method doesn't blow up unrelated tests.
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    extensions: {
      qbo: {
        webStorage: {
          persistent: () => ({
            // Default: tour has not been completed. Tests that need
            // tour-completed behavior can override this mock per-test.
            getItemByPersonaIdAsync: jest.fn().mockResolvedValue(false),
            getItemByPersonaId: jest.fn().mockReturnValue(false),
            setItemByPersonaId: jest.fn(),
            removeItemByPersonaId: jest.fn(),
          }),
        },
      },
    },
  }),
  useTracking: () => jest.fn(),
}));

// `TimeProjectTour` mounts a federated TourFramework widget for the
// intro modal step. The test suite already mocks `web-shell-core/widgets/HOCWidget`
// globally (see __mocks__), but we additionally mock the tour component
// itself so the unit tests can drive its callbacks (open estimate
// drawer for first row, tour-completion cleanup) directly without
// pulling in the real widget federation surface. The walkthrough's
// own internals are covered by `TimeProjectTour.test.tsx`.
let capturedTourProps: any = {};
jest.mock('src/js/widgets/timeProject/components/TimeProjectTour', () => {
  const MockTour = (props: any) => {
    capturedTourProps = props;
    return null;
  };
  MockTour.displayName = 'TimeProjectTour';
  return { __esModule: true, default: MockTour };
});

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(),
}));

const defaultHookReturn = {
  rows: [],
  pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    hasNextPage: false,
    endCursor: null,
  },
  loading: false,
  loadingMore: false,
  error: null,
  filters: {
    searchText: '',
    statusFilter: '',
    customerFilter: '',
    sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
    searchProjectIds: null,
  },
  uniqueCustomers: [],
  handlePageChange: jest.fn(),
  handleStatusChange: jest.fn(),
  handleCustomerChange: jest.fn(),
  handleSearchChange: jest.fn(),
  handleFilterByProjectIds: jest.fn(),
  handleSortChange: jest.fn(),
  handleClearFilters: jest.fn(),
  refetchProjects: jest.fn(),
};

const createTestStore = (projectsOverrides = {}) =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
      estimateDrawer: estimateDrawerReducer,
      customerWorkerAssignments: customerWorkerAssignmentsReducer,
    },
    preloadedState: {
      projects: {
        rows: [],
        filteredRows: [],
        pagination: {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          totalCount: 0,
          hasNextPage: false,
          endCursor: null,
        },
        cachedResults: {},
        uniqueCustomers: [],
        estimatesMap: {},
        estimatesLoading: false,
        estimatesError: null,
        projectRefs: {},
        projectParents: {},
        ...projectsOverrides,
      },
      filters: {
        searchText: '',
        statusFilter: '',
        customerFilter: '',
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        searchProjectIds: null,
        dueDateRange: null,
      },
      ui: { loading: false, error: null },
      settings: {
        timezone: '(UTC-08:00) Pacific Time (US & Canada)',
        qboTimezone: '(UTC-08:00) Pacific Time (US & Canada)',
        firstDayOfWeek: 0,
        settingsLoading: false,
        settingsReady: true,
        settingsError: null,
      },
    },
  });

const renderWithHookState = (
  hookOverrides: Record<string, any> = {},
  props: Record<string, any> = {},
) => {
  mockUseTimeProjectsFetching.mockReturnValue({
    ...defaultHookReturn,
    ...hookOverrides,
  });
  return render(
    <Provider store={createTestStore()}>
      <TimeProject {...props} />
    </Provider>,
  );
};

describe('TimeProject', () => {
  const mockUseQbTimeSdk = useQbTimeSdk as jest.MockedFunction<
    typeof useQbTimeSdk
  >;

  beforeEach(() => {
    mockUseTimeProjectsFetching.mockReturnValue(defaultHookReturn);
    mockUseCompanyTimezone.mockReturnValue({
      timezone: '(UTC-08:00) Pacific Time (US & Canada)',
      settingsReady: true,
      settingsLoading: false,
      settingsError: null,
    });
    mockUseQbTimeSdk.mockReturnValue({
      data: {
        isProjectsManageProjectsEnabled: true,
        isProjectsAssignWorkersEnabled: true,
        isProjectsEditEstimatesEnabled: true,
        isProjectsEditDateEnabled: true,
      },
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    });
    mockFetchProjectById.mockReset();
    mockFetchProjectById.mockResolvedValue(null);
    capturedFiltersProps = {};
  });

  it('should render without crashing', () => {
    const { container } = renderWithHookState();
    expect(container).toBeTruthy();
  });

  it('should always render the header', () => {
    renderWithHookState();
    expect(screen.getByText('Manage projects')).toBeInTheDocument();
  });

  it('should show loader when loading is true', () => {
    renderWithHookState({ loading: true });
    expect(screen.getByTestId('time-project-loader')).toBeInTheDocument();
  });

  it('should not show table or error while loading', () => {
    renderWithHookState({ loading: true });
    expect(
      screen.queryByTestId('time-project-zero-state'),
    ).not.toBeInTheDocument();
  });

  it('should show error message when error exists and not loading', () => {
    renderWithHookState({ loading: false, error: 'Some error' });
    // Error copy was rephrased: the page-level message is now the
    // shorter "Something went wrong, please try again." paired with
    // a "Something went wrong" H5 above it.
    expect(
      screen.getByText('Something went wrong, please try again.'),
    ).toBeInTheDocument();
  });

  it('should not show loader when error is displayed', () => {
    renderWithHookState({ loading: false, error: 'Some error' });
    expect(screen.queryByTestId('time-project-loader')).not.toBeInTheDocument();
  });

  it('should show zero state when not loading, no error, and no data', () => {
    renderWithHookState({ loading: false, error: null });
    expect(screen.getByTestId('time-project-zero-state')).toBeInTheDocument();
  });

  it('should always show header even during loading', () => {
    renderWithHookState({ loading: true });
    expect(screen.getByText('Manage projects')).toBeInTheDocument();
  });

  it('should always show header even during error', () => {
    renderWithHookState({ loading: false, error: 'fail' });
    expect(screen.getByText('Manage projects')).toBeInTheDocument();
  });

  it('should show spinner while settings are loading', () => {
    mockUseCompanyTimezone.mockReturnValue({
      settingsReady: false,
      settingsLoading: true,
      settingsError: null,
      timezone: '',
    });
    renderWithHookState();
    expect(screen.getByTestId('time-project-loader')).toBeInTheDocument();
  });

  it('should not show filters while settings are loading', () => {
    mockUseCompanyTimezone.mockReturnValue({
      settingsReady: false,
      settingsLoading: true,
      settingsError: null,
      timezone: '',
    });
    renderWithHookState();
    expect(
      screen.queryByTestId('time-project-filters'),
    ).not.toBeInTheDocument();
  });

  it('should NOT show the load error when only settings fail', () => {
    // Mirrors the real-world `useCompanyTimezone` behavior: on a
    // settings failure the hook still flips `settingsReady=true` (with
    // safe timezone fallbacks) so the rest of the widget can render.
    // Per product, a settings failure alone shouldn't block the user
    // from seeing their projects list — only a projects API failure
    // should surface the generic "something went wrong" message.
    mockUseCompanyTimezone.mockReturnValue({
      settingsReady: true,
      settingsLoading: false,
      settingsError: 'Settings failed',
      timezone: '',
    });
    renderWithHookState();
    expect(
      screen.queryByText('Something went wrong, please try again.'),
    ).not.toBeInTheDocument();
  });

  it('should still render filters and table when only settings fail', () => {
    mockUseCompanyTimezone.mockReturnValue({
      settingsReady: true,
      settingsLoading: false,
      settingsError: 'Settings failed',
      timezone: '',
    });
    renderWithHookState();
    expect(screen.getByTestId('time-project-table')).toBeInTheDocument();
    expect(screen.getByTestId('time-project-filters')).toBeInTheDocument();
  });

  it('should show page loader when loadingMore is true', () => {
    renderWithHookState({ loading: false, loadingMore: true });
    expect(screen.getByTestId('time-project-page-loader')).toBeInTheDocument();
  });

  it('should not show table when loadingMore is true', () => {
    renderWithHookState({ loading: false, loadingMore: true });
    expect(screen.queryByTestId('time-project-table')).not.toBeInTheDocument();
  });

  describe('callbacks', () => {
    const mockRow: TimeProjectRow = {
      rowIndex: 0,
      uniqueId: 'proj-1',
      projectId: 'proj-1',
      projectName: 'Test',
      customerId: 'c-1',
      customerName: 'Customer',
      status: 'IN_PROGRESS',
      deadline: '',
      deadlineLabel: '',
      budget: '',
      budgetHoursTotal: 0,
      budgetHoursRemaining: 0,
      startDate: '',
      completedDate: '',
      active: true,
      description: '',
      customer: null,
    };

    beforeEach(() => {
      capturedTableProps = {};
      capturedEstimateDrawerProps = {};
      capturedSummaryProps = {};
    });

    it('should open estimate drawer in create mode', () => {
      renderWithHookState();
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();

      act(() => {
        capturedTableProps.onCreateEstimate(mockRow);
      });
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
      expect(capturedEstimateDrawerProps.isEdit).toBe(false);
    });

    it('should open estimate drawer in edit mode', () => {
      renderWithHookState();

      act(() => {
        capturedTableProps.onEditEstimate(mockRow);
      });
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
      expect(capturedEstimateDrawerProps.isEdit).toBe(true);
    });

    it('should close estimate drawer and refetch on success', async () => {
      const mockRefetch = jest.fn().mockResolvedValue(undefined);
      renderWithHookState({ refetchProjects: mockRefetch });

      act(() => {
        capturedTableProps.onCreateEstimate(mockRow);
      });
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      // `handleEstimateSuccess` is async - it now awaits the refetch
      // before closing the drawer so the saving spinner stays up while
      // the project list rebuilds. Wrap in `act` and await the returned
      // promise so React flushes the post-await close.
      await act(async () => {
        await capturedEstimateDrawerProps.onSuccess();
      });
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('still closes the drawer (and logs) when the post-save refetch rejects', async () => {
      // Refetch failures must NOT bubble out as unhandled rejections - the
      // estimate save itself already succeeded server-side, so the user
      // needs the drawer to close cleanly. Internally we still want a
      // structured Splunk line so support can spot a degraded refetch
      // path even though the UI looks fine to the user.
      mockLogger.error.mockClear();
      const refetchError = new Error('network');
      const mockRefetch = jest.fn().mockRejectedValue(refetchError);

      renderWithHookState({ refetchProjects: mockRefetch });

      act(() => {
        capturedTableProps.onCreateEstimate(mockRow);
      });
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      await act(async () => {
        await expect(
          capturedEstimateDrawerProps.onSuccess(),
        ).resolves.toBeUndefined();
      });

      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=TimeProject Error=Post Estimate Save Refetch Failure',
        expect.objectContaining({
          projectId: mockRow.projectId,
          isEdit: false,
          errorMessage: 'network',
          errorName: 'Error',
        }),
      );
    });

    it('should close estimate drawer and reset edit state on close', () => {
      renderWithHookState();

      act(() => {
        capturedTableProps.onEditEstimate(mockRow);
      });
      expect(capturedEstimateDrawerProps.isEdit).toBe(true);

      act(() => {
        capturedEstimateDrawerProps.onClose();
      });
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();
    });
  });

  describe('Project Summary navigation', () => {
    const sampleRow: TimeProjectRow = {
      rowIndex: 0,
      uniqueId: 'proj-1',
      projectId: 'p1',
      projectName: 'Sample Project',
      customerId: 'c1',
      customerName: 'Acme',
      status: 'IN_PROGRESS',
      deadline: '3/31/26',
      deadlineLabel: '15 days left',
      budget: '100h',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 80,
      startDate: '1/1/26',
      completedDate: '',
      active: true,
      description: '',
      customer: null,
    };

    it('should render ProjectSummary when a row is selected', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      const row = screen.getByTestId(`time-project-row-${sampleRow.projectId}`);
      fireEvent.click(row);
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('project-summary')).toBeInTheDocument();
      expect(screen.getByTestId('summary-project-name')).toHaveTextContent(
        'Sample Project',
      );
    });

    it('passes workerId through to ProjectSummary in details mode', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject workerId="emp-local-1" />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject workerId="emp-local-1" />
        </Provider>,
      );
      expect(capturedSummaryProps.workerId).toBe('emp-local-1');
    });

    it('should return to list view when back is clicked from summary', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('project-summary')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('summary-back-btn'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('project-summary')).not.toBeInTheDocument();
    });

    it('should open assign drawer when assign is clicked from summary', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(screen.getByTestId('summary-assign-btn'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('assign-drawer')).toBeInTheDocument();
    });

    it('should close assign drawer on drawer close', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(screen.getByTestId('summary-assign-btn'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('assign-drawer')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('assign-drawer-close'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('assign-drawer')).not.toBeInTheDocument();
    });

    it.each([['CANCELLED' as const], ['COMPLETED' as const]])(
      'parent handleAssignWorkers refuses to open the drawer when project status is %s',
      (status) => {
        // Defensive backstop — the listing combo-link and the
        // summary header both already hide the assign affordance for
        // these statuses, but the page-level handler is still wired
        // through `onAssignWorkers` on the summary mock and a stale
        // child could synthesize the call. The parent must drop it.
        const cancelledRow: TimeProjectRow = { ...sampleRow, status };
        const store = createTestStore({ filteredRows: [cancelledRow] });
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [cancelledRow],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );
        fireEvent.click(
          screen.getByTestId(`time-project-row-${cancelledRow.projectId}`),
        );
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );
        // Force the synthetic assign click — the summary mock still
        // exposes `onAssignWorkers` so we exercise the parent guard.
        fireEvent.click(screen.getByTestId('summary-assign-btn'));
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );
        expect(screen.queryByTestId('assign-drawer')).not.toBeInTheDocument();
      },
    );

    it('should close drawer and refetch on assign success', () => {
      const mockRefetch = jest.fn();
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
        refetchProjects: mockRefetch,
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(screen.getByTestId('summary-assign-btn'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(screen.getByTestId('assign-drawer-success'));
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('assign-drawer')).not.toBeInTheDocument();
    });

    it('bumps assignmentRefreshKey on ProjectSummary after a successful assignment save', () => {
      const store = createTestStore({
        filteredRows: [sampleRow],
      });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
        refetchProjects: jest.fn(),
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      const initialKey = capturedSummaryProps.assignmentRefreshKey ?? 0;

      fireEvent.click(screen.getByTestId('summary-assign-btn'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(screen.getByTestId('assign-drawer-success'));
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      expect(capturedSummaryProps.assignmentRefreshKey).toBe(initialKey + 1);
    });

    it('passes isProjectPostsEnabled=true when IXP flag is on and user is not workforce', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
      const store = createTestStore({ filteredRows: [sampleRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(capturedSummaryProps.isProjectPostsEnabled).toBe(true);
    });

    it('passes isProjectPostsEnabled=false when user is a workforce user', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: true });
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      const store = createTestStore({ filteredRows: [sampleRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(capturedSummaryProps.isProjectPostsEnabled).toBe(false);
    });

    it('passes isProjectPostsEnabled=false when IXP flag is off', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({ isEnabled: false });
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
      const store = createTestStore({ filteredRows: [sampleRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [sampleRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      fireEvent.click(
        screen.getByTestId(`time-project-row-${sampleRow.projectId}`),
      );
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(capturedSummaryProps.isProjectPostsEnabled).toBe(false);
    });
  });

  describe('tour orchestration', () => {
    const tourRow: TimeProjectRow = {
      rowIndex: 0,
      uniqueId: 'tour-1',
      projectId: 'tour-1',
      projectName: 'Tour Project',
      customerId: 'tour-c-1',
      customerName: 'Tour Customer',
      status: 'IN_PROGRESS',
      deadline: '',
      deadlineLabel: '',
      budget: '',
      budgetHoursTotal: 0,
      budgetHoursRemaining: 0,
      startDate: '',
      completedDate: '',
      active: true,
      description: '',
      customer: null,
    };

    beforeEach(() => {
      capturedTourProps = {};
      capturedTableProps = {};
      capturedEstimateDrawerProps = {};
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    });

    it('exposes the manageProjectsAnchor + estimateDrawerAnchor refs to the tour', () => {
      // The tour anchors its popovers to live DOM nodes from the
      // header button and the Create Estimate drawer. The parent
      // hands them down as RefObjects (the GuidedTooltip framework
      // reads `targetRef.current` at render time), paired with an
      // `anchorVersion` counter so refs that arrive after mount still
      // trigger a re-render.
      renderWithHookState();
      expect(typeof capturedTourProps.manageProjectsAnchorRef).not.toBe(
        'undefined',
      );
      expect(typeof capturedTourProps.estimateDrawerAnchorRef).not.toBe(
        'undefined',
      );
      // estimateDrawerAnchor starts null because the drawer isn't
      // mounted yet; manageProjectsAnchor should resolve to the
      // <span> wrapping the "Manage projects" button.
      expect(capturedTourProps.estimateDrawerAnchorRef.current).toBeNull();
      expect(capturedTourProps.manageProjectsAnchorRef.current).not.toBeNull();
      // anchorVersion is bumped each time an anchor's underlying node
      // changes — required to coax GuidedTooltip into re-evaluating
      // step readiness.
      expect(typeof capturedTourProps.anchorVersion).toBe('number');
    });

    it('keeps the tour disabled while loading or in error state', () => {
      renderWithHookState({ loading: true });
      expect(capturedTourProps.enabled).toBe(false);

      renderWithHookState({ loading: false, error: 'boom' });
      expect(capturedTourProps.enabled).toBe(false);
    });

    it('disables the tour for Workforce (WFS) users', () => {
      // Workforce users never see the "Manage projects" button —
      // TimeProjectHeader returns null for them, so manageProjectsAnchorRef
      // is never populated. Without this guard the tour would reach the
      // manageProjects stage, render an invisible GuidedTooltip, and
      // stall forever without persisting completion.
      //
      // Use mockReturnValue (not mockReturnValueOnce) so that ALL calls to
      // isWorkforceEnvironment — including those from TimeProjectHeader (which
      // is not mocked) and any re-renders triggered by the anchor-ref callback
      // bumping anchorVersion state — consistently return true. The beforeEach
      // above resets the mock back to false after this test.
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
      renderWithHookState();
      expect(capturedTourProps.enabled).toBe(false);
    });

    it('still enables the tour with hasProjects=false when there are no rows', () => {
      // The intro modal + manage-projects tooltip are valid even for
      // an empty list. The tour itself decides to skip the third
      // (estimate-drawer) step when `hasProjects` is false.
      renderWithHookState({ rows: [] });
      expect(capturedTourProps.enabled).toBe(true);
      expect(capturedTourProps.hasProjects).toBe(false);
    });

    it('enables the tour once data has loaded with at least one row', () => {
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
      });
      render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(capturedTourProps.enabled).toBe(true);
    });

    it('opens the estimate drawer for the first row when the tour requests it', () => {
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();

      act(() => {
        capturedTourProps.onRequestOpenEstimateDrawer();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
      expect(capturedEstimateDrawerProps.project.projectId).toBe(
        tourRow.projectId,
      );
      // Tour-driven open is always create mode, regardless of whether
      // the row already has an estimate — it's a demo entry point.
      expect(capturedEstimateDrawerProps.isEdit).toBe(false);
    });

    it('does nothing when the tour requests a drawer but rows is empty', () => {
      // Defensive guard: the tour shouldn't even fire this with no
      // rows (it gates on `enabled`), but if it does, opening a
      // drawer with no project would crash CreateEstimateDrawer.
      renderWithHookState({ rows: [] });
      act(() => {
        capturedTourProps.onRequestOpenEstimateDrawer();
      });
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();
    });

    it('closes a tour-opened drawer when the tour completes', () => {
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      act(() => {
        capturedTourProps.onRequestOpenEstimateDrawer();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      act(() => {
        capturedTourProps.onComplete();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();
    });

    it('does NOT close the drawer on tour completion if the user opened it manually', () => {
      // User-driven opens clear the tour-ownership marker. When the
      // tour later finishes, it must NOT touch a drawer the user
      // currently has open for their own purposes.
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      act(() => {
        capturedTableProps.onCreateEstimate(tourRow);
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      act(() => {
        capturedTourProps.onComplete();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
    });

    it('a user-driven open after a tour-driven open clears the tour-ownership marker', () => {
      // Sequence: tour opens drawer → user closes it → user reopens
      // it manually. A subsequent tour completion must NOT close the
      // user's manually-reopened drawer.
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      act(() => {
        capturedTourProps.onRequestOpenEstimateDrawer();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      // User closes the tour-opened drawer themselves.
      act(() => {
        capturedEstimateDrawerProps.onClose();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();

      // User reopens it on their own.
      act(() => {
        capturedTableProps.onCreateEstimate(tourRow);
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      // Tour finishes — must leave the user's drawer alone.
      act(() => {
        capturedTourProps.onComplete();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
    });

    it('handleEstimateSuccess clears the tour-ownership marker before closing', async () => {
      // Save-driven close path: the post-save refetch resolves and
      // we dispatch `closeEstimateDrawer` in the finally block. The
      // marker must be cleared so a subsequent reopen by the user
      // isn't treated as tour-owned.
      const mockRefetch = jest.fn().mockResolvedValue(undefined);
      const store = createTestStore({ filteredRows: [tourRow] });
      mockUseTimeProjectsFetching.mockReturnValue({
        ...defaultHookReturn,
        rows: [tourRow],
        refetchProjects: mockRefetch,
      });
      const { rerender } = render(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );

      act(() => {
        capturedTourProps.onRequestOpenEstimateDrawer();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();

      await act(async () => {
        await capturedEstimateDrawerProps.onSuccess();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.queryByTestId('estimate-drawer')).not.toBeInTheDocument();

      // Reopen + finish tour. Drawer should remain because save-path
      // cleared the marker.
      act(() => {
        capturedTableProps.onCreateEstimate(tourRow);
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      act(() => {
        capturedTourProps.onComplete();
      });
      rerender(
        <Provider store={store}>
          <TimeProject />
        </Provider>,
      );
      expect(screen.getByTestId('estimate-drawer')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Workflow API callbacks: handleProjectSelect / handleSearchSubmit /
  // handleSearchClear and the derived UI states they produce.
  // ─────────────────────────────────────────────────────────────────────────
  describe('Workflow API callbacks', () => {
    const workflowRow: TimeProjectRow = {
      rowIndex: 0,
      uniqueId: 'wf-proj-1',
      projectId: 'wf-proj-1',
      projectName: 'Workflow Project',
      customerId: 'cust-wf',
      customerName: 'Workflow Customer',
      status: 'IN_PROGRESS',
      deadline: '',
      deadlineLabel: '',
      budget: '',
      budgetHoursTotal: -1,
      budgetHoursRemaining: -1,
      startDate: '',
      completedDate: '',
      active: true,
      description: '',
      customer: null,
    };

    beforeEach(() => {
      capturedFiltersProps = {};
      capturedSummaryProps = {};
    });

    it('passes isWorkflowApiEnabled from the hook through to TimeProjectFilters', () => {
      renderWithHookState({ isWorkflowApiEnabled: true });
      expect(capturedFiltersProps.isWorkflowApiEnabled).toBe(true);
    });

    it('passes isWorkflowApiEnabled=false when the workflow flag is off', () => {
      renderWithHookState({ isWorkflowApiEnabled: false });
      expect(capturedFiltersProps.isWorkflowApiEnabled).toBe(false);
    });

    describe('handleProjectSelect', () => {
      it('fast path: opens the summary immediately when the project is already on the current page', () => {
        // extractQboLocalId('djQuMTo5:wf-proj-1') → 'wf-proj-1', which
        // matches workflowRow.projectId — no fetch is needed.
        const store = createTestStore({ filteredRows: [workflowRow] });
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [workflowRow],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onProjectSelect('djQuMTo5:wf-proj-1');
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(screen.getByTestId('project-summary')).toBeInTheDocument();
        expect(screen.getByTestId('summary-project-name')).toHaveTextContent(
          'Workflow Project',
        );
        expect(mockFetchProjectById).not.toHaveBeenCalled();
      });

      it('slow path: fetches the project and opens the summary when not on the current page', async () => {
        mockFetchProjectById.mockResolvedValueOnce(workflowRow);

        const store = createTestStore();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [], // project is NOT on this page
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        await act(async () => {
          await capturedFiltersProps.onProjectSelect('djQuMTo5:wf-proj-1');
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(mockFetchProjectById).toHaveBeenCalledWith('djQuMTo5:wf-proj-1');
        expect(screen.getByTestId('project-summary')).toBeInTheDocument();
      });

      it('null return: shows the search error UI when fetchProjectById returns null', async () => {
        mockFetchProjectById.mockResolvedValueOnce(null);

        const store = createTestStore();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        await act(async () => {
          await capturedFiltersProps.onProjectSelect('djQuMTo5:unknown');
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(screen.queryByTestId('project-summary')).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('time-project-search-error'),
        ).toBeInTheDocument();
      });

      it('error path: shows the search error UI when fetchProjectById throws', async () => {
        mockFetchProjectById.mockRejectedValueOnce(new Error('network error'));

        const store = createTestStore();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        await act(async () => {
          await capturedFiltersProps.onProjectSelect('djQuMTo5:bad-id');
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(
          screen.getByTestId('time-project-search-error'),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('project-summary')).not.toBeInTheDocument();
      });

      it('shows the search loader while fetchProjectById is in-flight and hides the table', async () => {
        let resolveFetch!: (val: null) => void;
        mockFetchProjectById.mockReturnValueOnce(
          new Promise<null>((resolve) => {
            resolveFetch = resolve;
          }),
        );

        const store = createTestStore();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        // Fire without awaiting so isFetchingProject=true is the observable state.
        act(() => {
          capturedFiltersProps.onProjectSelect('djQuMTo5:in-flight');
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(
          screen.getByTestId('time-project-search-loader'),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId('time-project-table'),
        ).not.toBeInTheDocument();

        // Resolve so the component's finally block runs cleanly.
        await act(async () => {
          resolveFetch(null);
        });
      });
    });

    describe('handleSearchSubmit', () => {
      it('single result with exact name match navigates to that project via fast path', () => {
        // Put the matching row in `rows` so handleProjectSelect takes the
        // fast path (no fetch) — the unit test stays synchronous.
        const store = createTestStore({ filteredRows: [workflowRow] });
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [workflowRow],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onSearchSubmit('Workflow Project', [
            { projectId: 'wf-proj-1', displayName: 'Workflow Project' },
          ]);
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(screen.getByTestId('project-summary')).toBeInTheDocument();
        expect(mockFetchProjectById).not.toHaveBeenCalled();
      });

      it('single result with exact match is case-insensitive', () => {
        const store = createTestStore({ filteredRows: [workflowRow] });
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          rows: [workflowRow],
        });
        const { rerender } = render(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          // User typed mixed-case; displayName has different capitalisation.
          capturedFiltersProps.onSearchSubmit('workflow project', [
            { projectId: 'wf-proj-1', displayName: 'Workflow Project' },
          ]);
        });
        rerender(
          <Provider store={store}>
            <TimeProject />
          </Provider>,
        );

        expect(screen.getByTestId('project-summary')).toBeInTheDocument();
      });

      it('multiple results calls handleFilterByProjectIds with their IDs and the search text', () => {
        const mockHandleFilterByProjectIds = jest.fn();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          handleFilterByProjectIds: mockHandleFilterByProjectIds,
        });
        render(
          <Provider store={createTestStore()}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onSearchSubmit('kitchen', [
            { projectId: 'id-1', displayName: 'Kitchen Remodel' },
            { projectId: 'id-2', displayName: 'Kitchen Design' },
          ]);
        });

        expect(mockHandleFilterByProjectIds).toHaveBeenCalledWith(
          ['id-1', 'id-2'],
          'kitchen',
        );
      });

      it('single result that does NOT exactly match calls handleFilterByProjectIds', () => {
        // 'kit' !== 'Kitchen Remodel' → filter-list path
        const mockHandleFilterByProjectIds = jest.fn();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          handleFilterByProjectIds: mockHandleFilterByProjectIds,
        });
        render(
          <Provider store={createTestStore()}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onSearchSubmit('kit', [
            { projectId: 'id-1', displayName: 'Kitchen Remodel' },
          ]);
        });

        expect(mockHandleFilterByProjectIds).toHaveBeenCalledWith(
          ['id-1'],
          'kit',
        );
      });

      it('zero results does nothing', () => {
        const mockHandleFilterByProjectIds = jest.fn();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          handleFilterByProjectIds: mockHandleFilterByProjectIds,
        });
        render(
          <Provider store={createTestStore()}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onSearchSubmit('xyz', []);
        });

        expect(mockHandleFilterByProjectIds).not.toHaveBeenCalled();
        expect(mockFetchProjectById).not.toHaveBeenCalled();
      });
    });

    describe('handleSearchClear', () => {
      it('calls handleSearchChange with an empty string to reset the project list', () => {
        const mockHandleSearchChange = jest.fn();
        mockUseTimeProjectsFetching.mockReturnValue({
          ...defaultHookReturn,
          handleSearchChange: mockHandleSearchChange,
        });
        render(
          <Provider store={createTestStore()}>
            <TimeProject />
          </Provider>,
        );

        act(() => {
          capturedFiltersProps.onSearchClear();
        });

        expect(mockHandleSearchChange).toHaveBeenCalledWith('');
      });
    });
  });
});
