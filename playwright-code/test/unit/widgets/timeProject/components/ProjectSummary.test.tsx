import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectSummary from 'src/js/widgets/timeProject/components/ProjectSummary';
import { DETAILS_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';
import { SUMMARY_SEGMENTS } from 'src/js/widgets/timeProject/constants';
import { useProjectsSdkFlags } from 'src/js/widgets/timeProject/hooks/useProjectsSdkFlags';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

const mockTrack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, any>) => id,
  }),
  useTracking: () => mockTrack,
  useSandbox: () => ({
    navigation: { navigate: mockNavigate },
  }),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectsSdkFlags', () => ({
  useProjectsSdkFlags: jest.fn(),
}));

let mockEstimate: any = null;
let mockEstimatesLoading = false;
let mockUnreadCount = 0;

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppSelector: jest.fn((selector: any) =>
    selector({
      projects: {
        estimatesMap: mockEstimate ? { p1: mockEstimate } : {},
        estimatesLoading: mockEstimatesLoading,
        projectRefs: {},
      },
      settings: { timezone: 'America/Los_Angeles' },
      postsUi: { unreadCount: mockUnreadCount },
    }),
  ),
  useAppDispatch: () => jest.fn(),
}));

const mockFetchAssignmentSummary = jest.fn();
let mockAssignmentCounts: any = null;

jest.mock('src/js/widgets/timeProject/hooks/useAssignmentSummary', () => ({
  useAssignmentSummary: () => ({
    counts: mockAssignmentCounts,
    loading: false,
    error: null,
    fetchAssignmentSummary: mockFetchAssignmentSummary,
  }),
}));

const mockFetchWorkerSummary = jest.fn();
const mockUseWorkerTimeSummary = jest.fn();
jest.mock('src/js/widgets/timeProject/hooks/useWorkerTimeSummary', () => ({
  useWorkerTimeSummary: (...args: any[]) => mockUseWorkerTimeSummary(...args),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: () => 'America/Los_Angeles',
}));

jest.mock('@ids-ts/typography', () => ({
  // Forward `data-testid` so tests can target H5/B2 elements directly
  // (e.g. the "summary-hours-actual-value" / "summary-hours-estimated-row"
  // assertions that drive the dash/value rules).
  H5: ({ children, 'data-testid': testId }: any) => (
    <h5 data-testid={testId}>{children}</h5>
  ),
  B2: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
  B3: ({ children, 'data-testid': testId }: any) => (
    <span data-testid={testId}>{children}</span>
  ),
}));

jest.mock('@ids-ts/badge', () => ({ children, 'data-testid': testId }: any) => (
  <span data-testid={testId}>{children}</span>
));

jest.mock(
  '@ids-ts/button',
  () =>
    ({ onClick, 'data-testid': testId, disabled, children }: any) =>
      (
        <button onClick={onClick} data-testid={testId} disabled={disabled}>
          {children}
        </button>
      ),
);

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="loader">Loading</div>,
}));

jest.mock('@ids-ts/tabs', () => ({
  // Render the tab `title` and expose `id` so tests can assert the tab
  // strip and drive `onChange` (the real `Tabs` calls onChange with the
  // selected tab id).
  Tab: ({ id, title, badge, children }: any) => (
    <div data-testid={`tab-${id}`}>
      <span>{title}</span>
      {badge}
      {children}
    </div>
  ),
  Tabs: ({ children, onChange }: any) => (
    <div>
      <button
        type="button"
        data-testid="tabs-onchange-posts"
        onClick={() => onChange?.('posts')}
      >
        select-posts
      </button>
      <button
        type="button"
        data-testid="tabs-onchange-summary"
        onClick={() => onChange?.('summary')}
      >
        select-summary
      </button>
      {children}
    </div>
  ),
}));

jest.mock('@qbds/toggle', () => ({ options, onChange }: any) => (
  <div data-testid="toggle">
    {options?.map((opt: any) => (
      <button
        key={opt.value}
        data-testid={`toggle-${opt.value}`}
        onClick={() => onChange?.(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
));

jest.mock('@accounting-core/templado-asset-libary', () => ({
  MeterBarChart: () => <div data-testid="meter-bar" />,
}));

jest.mock('@design-systems/icons', () => ({
  PersonThree: () => <span>PersonThree</span>,
  Checklist: () => <span>Checklist</span>,
}));

jest.mock('src/js/widgets/timeProject/components/ProjectSummary.styled', () => {
  const createMockComponent = (name: string) => {
    const Component = ({ children, 'data-testid': testId, onClick }: any) =>
      onClick ? (
        <button type="button" data-testid={testId || name} onClick={onClick}>
          {children}
        </button>
      ) : (
        <div data-testid={testId || name}>{children}</div>
      );
    Component.displayName = name;
    return Component;
  };
  return {
    SummaryContainer: createMockComponent('SummaryContainer'),
    BackLink: createMockComponent('BackLink'),
    SummaryHeader: createMockComponent('SummaryHeader'),
    HeaderLeft: createMockComponent('HeaderLeft'),
    HeaderRight: createMockComponent('HeaderRight'),
    MetaRow: createMockComponent('MetaRow'),
    MetaCustomerName: createMockComponent('MetaCustomerName'),
    MetaCustomerNameLink: createMockComponent('MetaCustomerNameLink'),
    MetaDivider: createMockComponent('MetaDivider'),
    SummaryTabContainer: createMockComponent('SummaryTabContainer'),
    SectionHeader: createMockComponent('SectionHeader'),
    SummaryBoxesRow: createMockComponent('SummaryBoxesRow'),
    SummaryBox: createMockComponent('SummaryBox'),
    SummaryBoxTitle: createMockComponent('SummaryBoxTitle'),
    SummaryBoxValue: createMockComponent('SummaryBoxValue'),
    SummaryBoxSubtext: createMockComponent('SummaryBoxSubtext'),
    SummaryBoxRow: createMockComponent('SummaryBoxRow'),
    MeterBarWrapper: createMockComponent('MeterBarWrapper'),
    EditLink: createMockComponent('EditLink'),
    DateProgressRow: createMockComponent('DateProgressRow'),
    AlignRight: createMockComponent('AlignRight'),
    ToggleContainer: createMockComponent('ToggleContainer'),
    AssignmentChipsRow: createMockComponent('AssignmentChipsRow'),
    ZeroStateContainer: createMockComponent('ZeroStateContainer'),
    ZeroStateTitle: createMockComponent('ZeroStateTitle'),
    ZeroStateDescription: createMockComponent('ZeroStateDescription'),
  };
});

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectTable.styled',
  () => ({
    BadgeWrapper: ({ children }: any) => <div>{children}</div>,
    LoaderContainer: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeProject/components/ServiceItemTable',
  () => () => <div data-testid="service-item-table">ServiceItemTable</div>,
);

jest.mock(
  'src/js/widgets/timeProject/components/ServiceItemWorkersView',
  () => () =>
    <div data-testid="service-item-workers-view">ServiceItemWorkersView</div>,
);

jest.mock('src/js/widgets/timeProject/components/WorkerTable', () => () => (
  <div data-testid="worker-table">WorkerTable</div>
));

jest.mock(
  'src/js/widgets/timeProject/components/HoursEstimateTable',
  () =>
    ({ onViewWorkers }: any) =>
      (
        <div data-testid="hours-estimate-table">
          HoursEstimateTable
          <button
            type="button"
            data-testid="hours-estimate-view-workers"
            onClick={onViewWorkers}
          >
            view
          </button>
        </div>
      ),
);

// Mock the Posts feed — its own suite covers it. Mocking here keeps the
// ProjectSummary test from pulling in the real posts hook chain
// (useCurrentWorker -> sandbox/Apollo), which is unrelated to tab routing.
jest.mock('src/js/widgets/timeProject/components/posts/PostsFeed', () => () => (
  <div data-testid="posts-feed">PostsFeed</div>
));

const mockUnreadPostsResult = { unreadCount: 0, fetchUnreadCount: jest.fn() };
jest.mock('src/js/widgets/timeProject/hooks/useUnreadPostsCount', () => ({
  useUnreadPostsCount: () => mockUnreadPostsResult,
}));

jest.mock('src/js/widgets/timeProject/hooks/useCurrentWorker', () => ({
  useCurrentWorker: () => ({
    workerId: 'w1',
    workerType: 'employee',
    loading: false,
    ready: true,
  }),
}));

const mockProject = {
  rowIndex: 0,
  uniqueId: '1',
  projectId: 'p1',
  projectName: 'Test Project',
  customerId: 'c1',
  customerName: 'Test Customer',
  status: 'IN_PROGRESS' as const,
  deadline: '2026-12-31',
  deadlineLabel: '',
  budget: '',
  budgetHoursTotal: 0,
  budgetHoursRemaining: 0,
  startDate: '2026-01-01',
  completedDate: '',
  active: true,
  description: '',
  customer: null,
};

describe('ProjectSummary', () => {
  const mockUseProjectsSdkFlags = useProjectsSdkFlags as jest.MockedFunction<
    typeof useProjectsSdkFlags
  >;
  const mockOnBack = jest.fn();
  const mockOnAssignWorkers = jest.fn();
  const mockOnEditEstimate = jest.fn();
  const mockOnCreateEstimate = jest.fn();

  const defaultProps = {
    project: mockProject,
    onBack: mockOnBack,
    onAssignWorkers: mockOnAssignWorkers,
    onEditEstimate: mockOnEditEstimate,
    onCreateEstimate: mockOnCreateEstimate,
  };

  const buildSdkFlags = ({
    manageProjects = true,
    assignWorkers = true,
    editEstimates = true,
    editDate = true,
  }: {
    manageProjects?: boolean;
    assignWorkers?: boolean;
    editEstimates?: boolean;
    editDate?: boolean;
  } = {}) => ({
    isProjectsManageProjectsEnabled: manageProjects,
    isProjectsAssignWorkersEnabled: assignWorkers,
    isProjectsEditEstimatesEnabled: editEstimates,
    isProjectsEditDateEnabled: editDate,
    loading: false,
    error: undefined,
  });

  const mockSdkFlags = ({
    manageProjects = true,
    assignWorkers = true,
    editEstimates = true,
    editDate = true,
  }: {
    manageProjects?: boolean;
    assignWorkers?: boolean;
    editEstimates?: boolean;
    editDate?: boolean;
  } = {}) => {
    mockUseProjectsSdkFlags.mockReturnValue(
      buildSdkFlags({
        manageProjects,
        assignWorkers,
        editEstimates,
        editDate,
      }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkerTimeSummary.mockImplementation(() => ({
      workers: [],
      loading: false,
      page: 1,
      totalPages: 1,
      fetchWorkerSummary: mockFetchWorkerSummary,
      goToNextPage: jest.fn(),
      goToPrevPage: jest.fn(),
    }));
    mockSdkFlags();
    mockEstimate = null;
    mockEstimatesLoading = false;
    mockAssignmentCounts = null;
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
  });

  it('passes workerId into useWorkerTimeSummary when provided', () => {
    render(<ProjectSummary {...defaultProps} workerId="emp-local-1" />);
    expect(mockUseWorkerTimeSummary).toHaveBeenCalledWith('emp-local-1');
  });

  it('renders project summary with project name', () => {
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('project-summary')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows zero state under the estimate tab when no estimate exists', () => {
    // The zero-state CTA now lives BELOW the summary cards + toggle,
    // inside the Estimates tab body. The hours/date cards still render
    // (with placeholder zeros) so the layout stays stable.
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.getByTestId('project-summary-zero-state'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
  });

  it('shows the zero-state CTA immediately when project has no estimate (even while estimates are still loading)', () => {
    // We intentionally don't gate the zero-state on `estimatesLoading` -
    // that flag is shared across the page-level "fetch all" loop, so blocking
    // on it would leave the user staring at a loader for a project that has
    // no estimate to show in the first place.
    mockEstimatesLoading = true;
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.getByTestId('project-summary-zero-state'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('project-summary-estimate-loader'),
    ).not.toBeInTheDocument();
  });

  it('hides the zero-state CTA on the Users tab even when no estimate exists', () => {
    // Requirement: zero-state lives only inside the Estimates tab body.
    // Toggling to Users must show the worker table without the CTA card,
    // so the user can still browse workers on a project that has no
    // estimate yet.
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.USERS}`));
    expect(
      screen.queryByTestId('project-summary-zero-state'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('worker-table')).toBeInTheDocument();
  });

  it('fetches workers when the Users tab is opened in the zero state', () => {
    // Mirrors the hours-estimate "View workers" path: the worker time
    // summary is queried with just the projectId regardless of whether
    // an estimate exists, so toggling to Users on a project with no
    // estimate still loads the worker list.
    render(<ProjectSummary {...defaultProps} />);
    expect(mockFetchWorkerSummary).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.USERS}`));
    // The hook now takes the (projectId, customerId) tuple — see the
    // worker-time-summary contract change. With no resolved
    // `projectRefs` entry, customerId falls back to the row's inline
    // value (`c1` from `defaultProps`).
    expect(mockFetchWorkerSummary).toHaveBeenCalledWith({
      projectId: 'p1',
      customerId: 'c1',
    });
  });

  it('refetches workers on Users tab when assignmentRefreshKey ticks up', () => {
    // After an assign-workers drawer save the parent bumps
    // `assignmentRefreshKey`. The Users tab should pick that up and
    // re-issue the worker query so the freshly-assigned worker appears
    // without having to leave + return to the page.
    const { rerender } = render(
      <ProjectSummary {...defaultProps} assignmentRefreshKey={0} />,
    );
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.USERS}`));
    const callsAfterToggle = mockFetchWorkerSummary.mock.calls.length;

    rerender(<ProjectSummary {...defaultProps} assignmentRefreshKey={1} />);
    expect(mockFetchWorkerSummary.mock.calls.length).toBe(callsAfterToggle + 1);
    expect(mockFetchWorkerSummary).toHaveBeenLastCalledWith({
      projectId: 'p1',
      customerId: 'c1',
    });
  });

  it('renders a placeholder hours meter bar even when there is no estimate yet', () => {
    // The bar itself stays visible so the card has a "not started" /
    // greyed-out segment instead of empty space below the numbers.
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('hours-meter-bar')).toBeInTheDocument();
  });

  it('renders both summary cards with placeholders and a create-estimate link when no estimate exists', () => {
    // Both cards are now always present so the page never visually
    // collapses (e.g. during a refetch). The hours card swaps its Edit
    // link for a Create-estimate link that fires the same callback as
    // the zero-state button.
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
    const createLink = screen.getByTestId('summary-create-estimate-link');
    expect(createLink).toBeInTheDocument();
    expect(screen.queryByTestId('summary-edit-link')).not.toBeInTheDocument();
    fireEvent.click(createLink);
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CREATE_ESTIMATE,
    );
    expect(mockOnCreateEstimate).toHaveBeenCalledWith(mockProject);
  });

  it('calls onBack when back link is clicked', () => {
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('project-summary-back'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('tracks CLICK_ASSIGN on assign button click', () => {
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('project-summary-assign-btn'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CLICK_ASSIGN,
    );
    expect(mockOnAssignWorkers).toHaveBeenCalledWith(mockProject);
  });

  it.each([['CANCELLED' as const], ['COMPLETED' as const]])(
    'hides the Assign button in the summary header when the project status is %s',
    (status) => {
      // CANCELLED / COMPLETED projects are read-only for
      // assignments — the button is hidden entirely so the user
      // can't kick off a drawer that would only fail downstream.
      render(
        <ProjectSummary
          {...defaultProps}
          project={{ ...mockProject, status }}
        />,
      );
      expect(
        screen.queryByTestId('project-summary-assign-btn'),
      ).not.toBeInTheDocument();
    },
  );

  it('hides Assign button when assign-workers flag is disabled', () => {
    mockSdkFlags({ assignWorkers: false });
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('project-summary-assign-btn'),
    ).not.toBeInTheDocument();
  });

  it('shows a Create estimate primary button next to Assign when no estimate exists', () => {
    // The header always keeps a primary action slot filled; without an
    // estimate it swaps "Edit estimate" for "Create estimate" so the
    // user has a top-level entry point in addition to the in-card link
    // and the zero-state CTA below the toggle.
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('project-summary-edit-estimate-btn'),
    ).not.toBeInTheDocument();
    const createBtn = screen.getByTestId(
      'project-summary-create-estimate-header-btn',
    );
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CREATE_ESTIMATE,
    );
    expect(mockOnCreateEstimate).toHaveBeenCalledWith(mockProject);
  });

  it('shows edit estimate button when estimate exists and tracks SELECT_EDIT_ESTIMATE_DROPDOWN on click', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    const editBtn = screen.getByTestId('project-summary-edit-estimate-btn');
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.SELECT_EDIT_ESTIMATE_DROPDOWN,
    );
    expect(mockOnEditEstimate).toHaveBeenCalledWith(mockProject);
  });

  it('hides edit estimate button when estimate exists but edit-estimates flag is disabled', () => {
    mockSdkFlags({ editEstimates: false });
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('project-summary-edit-estimate-btn'),
    ).not.toBeInTheDocument();
  });

  it('hides estimate actions in Time estimation summary when edit-estimates flag is disabled', () => {
    mockSdkFlags({ editEstimates: false });
    // No estimate => card-level create link + zero-state CTA would normally render.
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('project-summary-create-estimate-header-btn'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-create-estimate-link'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('project-summary-create-estimate-btn'),
    ).not.toBeInTheDocument();

    // Estimate exists => card-level edit link would normally render.
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.queryByTestId('summary-edit-link')).not.toBeInTheDocument();
  });

  it('tracks CREATE_ESTIMATE on create estimate button', () => {
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('project-summary-create-estimate-btn'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CREATE_ESTIMATE,
    );
    expect(mockOnCreateEstimate).toHaveBeenCalledWith(mockProject);
  });

  it('renders estimate data with hours card and date card when estimate exists', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
  });

  it('tracks CLICK_ESTIMATES_TAB when estimates toggle is clicked', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.ESTIMATES}`));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CLICK_ESTIMATES_TAB,
    );
  });

  it('tracks CLICK_USER_TAB when users toggle is clicked', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.USERS}`));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CLICK_USER_TAB,
    );
  });

  it('tracks EDIT_ESTIMATION_SUMMARY on edit link click', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('summary-edit-link'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.EDIT_ESTIMATION_SUMMARY,
    );
    expect(mockOnEditEstimate).toHaveBeenCalledWith(mockProject);
  });

  it('renders service item table for BY_FIELD_OPTION estimate type', () => {
    // A BY_FIELD_OPTION estimate is "real" when it has at least one
    // estimateItems entry - hence the seeded item below. Without items the
    // component now treats it as no-estimate and shows the zero-state CTA.
    mockEstimate = {
      projectEstimateType: 'BY_FIELD_OPTION',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [
        {
          fieldOptionId: 'si-1',
          serviceItemName: 'Design',
          estimatedHours: 10,
          elapsedSeconds: 0,
        },
      ],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('service-item-table')).toBeInTheDocument();
  });

  it('renders single-row hours estimate table for TOTAL_HOURS estimate type', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('hours-estimate-table')).toBeInTheDocument();
    expect(screen.queryByTestId('worker-table')).not.toBeInTheDocument();
  });

  it('switches to Users tab when "View workers" is clicked from hours estimate', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('hours-estimate-view-workers'));
    expect(screen.getByTestId('worker-table')).toBeInTheDocument();
    expect(
      screen.queryByTestId('hours-estimate-table'),
    ).not.toBeInTheDocument();
  });

  it('shows overdue hours when remaining is negative', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: -10,
      elapsedSeconds: 396000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
  });

  it('renders the workers assignment chip when counts are available', () => {
    // Standard-field and custom-field chips were intentionally removed -
    // the summary header only surfaces worker assignment counts now.
    mockAssignmentCounts = {
      assignedTimeForCount: 3,
      totalTimeForAssignments: 5,
      assignedStandardFieldCount: 2,
      totalStandardFieldAssignments: 4,
      assignedCustomFieldCount: 1,
      totalCustomFieldAssignments: 3,
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('assignment-chip-workers')).toBeInTheDocument();
    expect(screen.queryByTestId('assignment-chip-sf')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assignment-chip-cf')).not.toBeInTheDocument();
  });

  it('opens the assignment drawer when the workers assignment IconControl is clicked', () => {
    mockAssignmentCounts = {
      assignedTimeForCount: 3,
      totalTimeForAssignments: 5,
      assignedStandardFieldCount: 0,
      totalStandardFieldAssignments: 0,
      assignedCustomFieldCount: 0,
      totalCustomFieldAssignments: 0,
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId('assignment-chip-workers'));
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CLICK_ASSIGN,
    );
    expect(mockOnAssignWorkers).toHaveBeenCalledWith(mockProject);
  });

  it('still renders the date card when project has no start/end dates (with em-dash placeholders)', () => {
    // Cards are always rendered now so the layout doesn't collapse. The
    // date card just suppresses the meter bar when there's nothing to
    // chart and shows em-dashes for missing dates.
    const projectNoDate = {
      ...mockProject,
      startDate: '',
      deadline: '',
    };
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} project={projectNoDate} />);
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
    // Bar still renders so the card has a visual "not started" placeholder
    // (full-width neutral grey segment) instead of an empty space below
    // the numbers.
    expect(screen.getByTestId('date-meter-bar')).toBeInTheDocument();
  });

  it('shows an "Edit dates" link in the date card and deep-links to QBO project details', () => {
    render(<ProjectSummary {...defaultProps} />);
    const link = screen.getByTestId('summary-edit-dates-link');
    expect(link).toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-add-dates-link'),
    ).not.toBeInTheDocument();

    fireEvent.click(link);
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.EDIT_PROJECT_DATES,
    );
    // `tab=project_details` is appended so the QBO surface lands the
    // user directly on the project details tab instead of its default
    // landing tab.
    expect(mockNavigate).toHaveBeenCalledWith(
      '/app/projects/projectdetails?id=p1&tab=project_details',
    );
  });

  it('hides date edit/add link when edit-date flag is disabled', () => {
    mockSdkFlags({ editDate: false });
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('summary-edit-dates-link'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-add-dates-link'),
    ).not.toBeInTheDocument();
  });

  it('shows an "Add dates" link instead when both start and end dates are missing', () => {
    const projectNoDate = {
      ...mockProject,
      startDate: '',
      deadline: '',
    };
    render(<ProjectSummary {...defaultProps} project={projectNoDate} />);
    const link = screen.getByTestId('summary-add-dates-link');
    expect(link).toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-edit-dates-link'),
    ).not.toBeInTheDocument();

    fireEvent.click(link);
    expect(mockNavigate).toHaveBeenCalledWith(
      '/app/projects/projectdetails?id=p1&tab=project_details',
    );
  });

  it('renders the customer name as a link that deep-links to QBO customer details', () => {
    render(<ProjectSummary {...defaultProps} />);
    const link = screen.getByTestId('project-summary-customer-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Test Customer');
    // The plain (non-link) variant should NOT be rendered when both
    // customer name and id are present.
    expect(
      screen.queryByTestId('project-summary-customer'),
    ).not.toBeInTheDocument();

    fireEvent.click(link);
    expect(mockTrack).toHaveBeenCalledWith(
      DETAILS_PAGE_TRACKING_POINTS.CUSTOMER_NAME,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/app/customerdetail?nameId=c1');
  });

  it('falls back to a non-interactive customer label when the row has no customerId', () => {
    const projectNoCustomerId = { ...mockProject, customerId: '' };
    render(<ProjectSummary {...defaultProps} project={projectNoCustomerId} />);
    expect(
      screen.queryByTestId('project-summary-customer-link'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('project-summary-customer')).toHaveTextContent(
      'Test Customer',
    );
  });

  it('hides customer metadata when sdk flag is false', () => {
    mockUseProjectsSdkFlags.mockReturnValue(
      buildSdkFlags({
        manageProjects: false,
      }),
    );
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('project-summary-customer-link'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('project-summary-customer'),
    ).not.toBeInTheDocument();
  });

  it('calls fetchAssignmentSummary on mount with the customer id', () => {
    render(<ProjectSummary {...defaultProps} />);
    // Hook is cache-free: a single positional arg, no options object.
    expect(mockFetchAssignmentSummary).toHaveBeenCalledWith('c1');
  });

  it('refetches when assignmentRefreshKey ticks up', () => {
    const { rerender } = render(
      <ProjectSummary {...defaultProps} assignmentRefreshKey={0} />,
    );
    const initialCallCount = mockFetchAssignmentSummary.mock.calls.length;
    expect(mockFetchAssignmentSummary).toHaveBeenLastCalledWith('c1');

    rerender(<ProjectSummary {...defaultProps} assignmentRefreshKey={1} />);
    expect(mockFetchAssignmentSummary.mock.calls.length).toBe(
      initialCallCount + 1,
    );
    expect(mockFetchAssignmentSummary).toHaveBeenLastCalledWith('c1');
  });

  it('hides chips (and the chips row) when nothing is assigned', () => {
    mockAssignmentCounts = {
      assignedTimeForCount: 0,
      totalTimeForAssignments: 5,
      assignedStandardFieldCount: 0,
      totalStandardFieldAssignments: 4,
      assignedCustomFieldCount: 0,
      totalCustomFieldAssignments: 3,
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.queryByTestId('assignment-chips-row'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('assignment-chip-workers'),
    ).not.toBeInTheDocument();
  });

  it('shows the workers chip when only worker assignments exist', () => {
    // Field-level chips have been removed; only the worker chip should
    // ever render, even if the assignment-summary payload still contains
    // standard / custom field counts.
    mockAssignmentCounts = {
      assignedTimeForCount: 2,
      totalTimeForAssignments: 5,
      assignedStandardFieldCount: 0,
      totalStandardFieldAssignments: 4,
      assignedCustomFieldCount: 1,
      totalCustomFieldAssignments: 3,
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('assignment-chips-row')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-chip-workers')).toBeInTheDocument();
    expect(screen.queryByTestId('assignment-chip-sf')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assignment-chip-cf')).not.toBeInTheDocument();
  });

  it('renders with no customer name showing dash', () => {
    const projectNoCustomer = { ...mockProject, customerName: '' };
    render(<ProjectSummary {...defaultProps} project={projectNoCustomer} />);
    expect(screen.getByTestId('project-summary')).toBeInTheDocument();
  });

  it('still renders the hours card when the project is unestimated (-1 sentinel)', () => {
    // The hours card always renders. With no real estimate (`-1`
    // sentinel preserved through `useProjectEstimates`) it shows the
    // create-estimate link in place of the edit link instead of
    // disappearing. Note: `budgetHoursTotal: 0` is now a real 0-hour
    // estimate per product, so we use `-1` here to model the
    // "unestimated" case.
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: -1,
      budgetHoursRemaining: -1,
      elapsedSeconds: 0,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(
      screen.getByTestId('summary-create-estimate-link'),
    ).toBeInTheDocument();
  });

  it('renders date card with overdue dates', () => {
    const overdueProject = {
      ...mockProject,
      startDate: '2024-01-01',
      deadline: '2024-06-01',
    };
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} project={overdueProject} />);
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
  });

  it('renders both cards even when start date is missing (date card shows em-dash placeholder)', () => {
    // Both summary boxes are always rendered. When start date is missing
    // the date card simply hides its meter bar and shows an em-dash for
    // the missing label.
    const noStartProject = {
      ...mockProject,
      startDate: '',
      deadline: '2026-12-31',
    };
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} project={noStartProject} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
    expect(screen.getByTestId('date-meter-bar')).toBeInTheDocument();
  });

  it('renders users segment with worker table when toggled', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId(`toggle-${SUMMARY_SEGMENTS.USERS}`));
    expect(screen.getByTestId('worker-table')).toBeInTheDocument();
  });

  it('shows summary cards AND the zero-state CTA when project is unestimated (-1)', () => {
    // When the supergraph reports `totalEstimatedSeconds: -1`
    // (preserved by `useProjectEstimates` as `budgetHoursTotal: -1`),
    // we treat it as "no real estimate". The summary cards still
    // render (with em-dash placeholders + create-estimate link in the
    // hours card) and the zero-state CTA appears in the Estimates tab
    // body below the toggle.
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: -1,
      budgetHoursRemaining: -1,
      elapsedSeconds: 0,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(
      screen.getByTestId('project-summary-zero-state'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('summary-box-date')).toBeInTheDocument();
  });

  it('treats a 0-hour estimate as a real estimate (Edit link, no zero-state)', () => {
    // Per product an estimate of exactly 0 hours IS a real estimate.
    // It must NOT trigger the "no real estimate" zero-state UI — the
    // hours card surfaces the standard Edit link and the Estimates
    // tab body shows the hours table, not the create-estimate CTA.
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 0,
      budgetHoursRemaining: 0,
      elapsedSeconds: 0,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-edit-link')).toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-create-estimate-link'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('project-summary-zero-state'),
    ).not.toBeInTheDocument();
  });

  it('treats a service-item project as estimated when items exist (even all 0 hours)', () => {
    // BY_FIELD_OPTION counts as estimated as soon as one item is
    // configured. The mapper synthesizes a non-negative project total
    // from the items, so the row's "—"/"Create estimate" gating
    // (which keys off `budgetHoursTotal === -1`) leaves it as
    // "View" / Edit even when every item is 0 hours.
    mockEstimate = {
      projectEstimateType: 'BY_FIELD_OPTION',
      budgetHoursTotal: 0,
      budgetHoursRemaining: 0,
      elapsedSeconds: 0,
      estimateItems: [
        {
          fieldOptionId: 'svc-1',
          estimatedHours: 0,
          elapsedSeconds: 0,
          serviceItemName: 'Hours',
        },
      ],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('service-item-table')).toBeInTheDocument();
    expect(
      screen.queryByTestId('project-summary-zero-state'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('summary-edit-link')).toBeInTheDocument();
  });

  describe('hours card subtext + spacer rules', () => {
    it('shows a green "X hrs remaining" line when the user is under budget', () => {
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: 5,
        budgetHoursRemaining: 2,
        elapsedSeconds: 10800, // 3h
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      expect(screen.getByTestId('summary-hours-remaining')).toBeInTheDocument();
      // The invisible spacer should NOT be rendered when the real
      // subtext is visible.
      expect(
        screen.queryByTestId('summary-hours-remaining-spacer'),
      ).not.toBeInTheDocument();
    });

    it('shows the orange overdue line when the user is over budget against a 0-hour estimate', () => {
      // 0-hour estimates suppress the green "0 hrs remaining" copy
      // (it would be misleading), but the orange "X hrs over budget"
      // path is still meaningful and must surface.
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: 0,
        budgetHoursRemaining: -5,
        elapsedSeconds: 18000, // 5h
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      expect(screen.getByTestId('summary-hours-remaining')).toBeInTheDocument();
    });

    it('renders an invisible spacer (not the subtext) when estimate is 0 and worked is 0', () => {
      // Suppressing the subtext entirely would shrink the hours card
      // out of alignment with the date card. The spacer keeps the
      // slot occupied so `SummaryBoxesRow` stays visually balanced.
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: 0,
        budgetHoursRemaining: 0,
        elapsedSeconds: 0,
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      expect(
        screen.getByTestId('summary-hours-remaining-spacer'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('summary-hours-remaining'),
      ).not.toBeInTheDocument();
    });

    it('renders an invisible spacer when the project is unestimated (-1)', () => {
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: -1,
        budgetHoursRemaining: -1,
        elapsedSeconds: 43200, // 12h logged against no estimate
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      expect(
        screen.getByTestId('summary-hours-remaining-spacer'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('summary-hours-remaining'),
      ).not.toBeInTheDocument();
    });
  });

  describe('actual vs estimated hours value rules', () => {
    it('shows the actual logged hours even when the project is unestimated (-1)', () => {
      // From the bug report: a project with `projectElapsedSeconds:
      // 43200` (12h) and `totalEstimatedSeconds: -1` must still surface
      // "12.00 hrs" in the H5 + bottom Actual cell — only the
      // Estimated cell collapses to "—".
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: -1,
        budgetHoursRemaining: -1,
        elapsedSeconds: 43200,
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      const h5 = screen.getByTestId('summary-hours-actual-value');
      expect(h5.textContent).toContain('timeProject.summary.hours');
      const actualRow = screen.getByTestId('summary-hours-actual-row');
      expect(actualRow.textContent).toContain('timeProject.summary.hours');
      // The Estimated cell is the only one that shows the dash.
      const estimatedRow = screen.getByTestId('summary-hours-estimated-row');
      expect(estimatedRow.textContent).toBe('—');
    });

    it('renders 0 (not "—") for an estimate that is a real 0 hours', () => {
      mockEstimate = {
        projectEstimateType: 'TOTAL_HOURS',
        budgetHoursTotal: 0,
        budgetHoursRemaining: 0,
        elapsedSeconds: 0,
        estimateItems: [],
      };
      render(<ProjectSummary {...defaultProps} />);
      const estimatedRow = screen.getByTestId('summary-hours-estimated-row');
      expect(estimatedRow.textContent).toContain('timeProject.summary.hours');
      expect(estimatedRow.textContent).not.toBe('—');
    });
  });

  it('renders the days-remaining subtext when the project has both dates and meaningful remaining time', () => {
    // The date card surfaces the same green/orange "X days
    // remaining" / "X days overdue" chip the hours card has,
    // gated on the project actually having both dates AND a
    // meaningful remaining number (positive remaining or overdue).
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    const projectWithDates = {
      ...mockProject,
      // Far-past dates ensure we land in the overdue branch so the
      // chip surfaces deterministically regardless of when the test
      // is run.
      startDate: '2025-12-01',
      deadline: '2026-04-14',
    };
    render(<ProjectSummary {...defaultProps} project={projectWithDates} />);
    expect(screen.getByTestId('summary-days-remaining')).toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-days-remaining-spacer'),
    ).not.toBeInTheDocument();
  });

  it('falls back to the invisible spacer when the project has no dates', () => {
    // Without dates the remaining count is meaningless — the date
    // card keeps the slot height intact via an invisible spacer
    // (so the hours / date cards stay aligned in the row).
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 100,
      budgetHoursRemaining: 50,
      elapsedSeconds: 180000,
      estimateItems: [],
    };
    const projectWithoutDates = {
      ...mockProject,
      startDate: '',
      deadline: '',
    };
    render(<ProjectSummary {...defaultProps} project={projectWithoutDates} />);
    expect(
      screen.getByTestId('summary-days-remaining-spacer'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('summary-days-remaining'),
    ).not.toBeInTheDocument();
  });

  it('handles overdue hours with correct overdue bar', () => {
    mockEstimate = {
      projectEstimateType: 'TOTAL_HOURS',
      budgetHoursTotal: 10,
      budgetHoursRemaining: -5,
      elapsedSeconds: 54000,
      estimateItems: [],
    };
    render(<ProjectSummary {...defaultProps} />);
    expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
    expect(screen.getByTestId('hours-meter-bar')).toBeInTheDocument();
  });

  describe('Posts tab (isProjectPostsEnabled prop)', () => {
    it('always renders the Summary tab', () => {
      render(<ProjectSummary {...defaultProps} />);
      expect(screen.getByTestId('tab-summary')).toBeInTheDocument();
      expect(
        screen.getByText('timeProject.summary.tab.summary'),
      ).toBeInTheDocument();
    });

    it('hides the Posts tab when the flag prop is false', () => {
      render(
        <ProjectSummary {...defaultProps} isProjectPostsEnabled={false} />,
      );
      expect(screen.queryByTestId('tab-posts')).not.toBeInTheDocument();
      expect(
        screen.queryByText('timeProject.summary.tab.posts'),
      ).not.toBeInTheDocument();
    });

    it('renders the Posts tab next to Summary when the flag prop is true', () => {
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      expect(screen.getByTestId('tab-summary')).toBeInTheDocument();
      expect(screen.getByTestId('tab-posts')).toBeInTheDocument();
      expect(
        screen.getByText('timeProject.summary.tab.posts'),
      ).toBeInTheDocument();
    });

    it('shows the summary body by default and not the posts body', () => {
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      // Summary content is active on first render.
      expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
      expect(screen.queryByTestId('project-posts-tab')).not.toBeInTheDocument();
    });

    it('switches to the posts body when the Posts tab is selected', () => {
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      fireEvent.click(screen.getByTestId('tabs-onchange-posts'));
      // Posts body shows; summary cards are hidden.
      expect(screen.getByTestId('project-posts-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('summary-box-hours')).not.toBeInTheDocument();
    });

    it('renders the Posts feed on the Posts tab', () => {
      // ProjectSummary just delegates to PostsFeed (mocked here). The feed,
      // empty/zero state and cards are covered by PostsFeed/PostsEmptyState
      // tests; here we only assert the tab routes to the feed.
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      fireEvent.click(screen.getByTestId('tabs-onchange-posts'));
      expect(screen.getByTestId('posts-feed')).toBeInTheDocument();
    });

    it('switches back to the summary body when the Summary tab is reselected', () => {
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      fireEvent.click(screen.getByTestId('tabs-onchange-posts'));
      fireEvent.click(screen.getByTestId('tabs-onchange-summary'));
      expect(screen.getByTestId('summary-box-hours')).toBeInTheDocument();
      expect(screen.queryByTestId('project-posts-tab')).not.toBeInTheDocument();
    });

    it('shows unread badge on Posts tab when unreadCount > 0', () => {
      mockUnreadCount = 5;
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      expect(screen.getByTestId('posts-unread-badge')).toBeInTheDocument();
      expect(screen.getByTestId('posts-unread-badge').textContent).toBe('5');
      mockUnreadCount = 0;
    });

    it('hides unread badge on Posts tab when unreadCount is 0', () => {
      mockUnreadCount = 0;
      render(<ProjectSummary {...defaultProps} isProjectPostsEnabled />);
      expect(
        screen.queryByTestId('posts-unread-badge'),
      ).not.toBeInTheDocument();
    });

    it('does not show unread badge when posts flag is off', () => {
      mockUnreadCount = 3;
      render(
        <ProjectSummary {...defaultProps} isProjectPostsEnabled={false} />,
      );
      expect(
        screen.queryByTestId('posts-unread-badge'),
      ).not.toBeInTheDocument();
      mockUnreadCount = 0;
    });
  });

  describe('WFS (Workforce) users', () => {
    beforeEach(() => {
      // All tests in this block simulate a Workforce environment.
      // The outer beforeEach resets this back to false after each test
      // so non-WFS tests are unaffected.
      (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    });

    it('renders customer name as non-interactive text instead of a link', () => {
      // WFS users cannot deep-link into QBO customer details, so
      // MetaCustomerNameLink must not render even when both customerName
      // and customerId are present. The name still surfaces as plain
      // MetaCustomerName text so the meta row remains informative.
      render(<ProjectSummary {...defaultProps} />);
      expect(
        screen.queryByTestId('project-summary-customer-link'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('project-summary-customer')).toHaveTextContent(
        'Test Customer',
      );
    });
  });
});
