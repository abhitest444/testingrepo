import React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { render, screen, fireEvent } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import TimeProjectTable from 'src/js/widgets/timeProject/components/TimeProjectTable';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import customerWorkerAssignmentsReducer from 'src/js/widgets/assignments/store/customerWorkerAssignmentsSlice';
import { TimeProjectRow } from 'src/js/widgets/timeProject/types';
import {
  DEFAULT_PAGE_SIZE,
  PROJECT_SORT_ORDER,
} from 'src/js/widgets/timeProject/constants';
import { useProjectsSdkFlags } from 'src/js/widgets/timeProject/hooks/useProjectsSdkFlags';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

dayjs.extend(utc);
dayjs.extend(timezone);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

const mockUseLandingPageTrackingPoints = jest.fn();

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
  useTracking: () => jest.fn(),
}));

jest.mock('src/js/widgets/timeProject/hooks/useProjectsSdkFlags', () => ({
  useProjectsSdkFlags: jest.fn(),
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: () => mockUseLandingPageTrackingPoints(),
  }),
);

const mockRow: TimeProjectRow = {
  rowIndex: 0,
  uniqueId: 'proj-1',
  projectId: 'proj-1',
  projectName: 'Melrose Construction',
  customerId: 'cust-1',
  customerName: 'Ann Smith',
  status: 'IN_PROGRESS',
  deadline: '2027-02-03',
  deadlineLabel: '2 days left',
  budget: '80h',
  budgetHoursTotal: 80,
  budgetHoursRemaining: 47,
  startDate: '2026-01-01',
  completedDate: '',
  active: true,
  description: '',
  customer: null,
};

jest.mock('src/js/common/DateAndTimeUtils', () => ({
  mapQBTimezoneToDayjsTimezone: () => 'America/Los_Angeles',
}));

const mockOnAssignWorkers = jest.fn();
const mockOnCreateEstimate = jest.fn();
const mockOnEditEstimate = jest.fn();
const mockOnSortChange = jest.fn();

const createTestStore = (rows: TimeProjectRow[] = []) =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
      customerWorkerAssignments: customerWorkerAssignmentsReducer,
    },
    preloadedState: {
      projects: {
        rows,
        filteredRows: rows,
        pagination: {
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          totalCount: rows.length,
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

const renderWithStore = (
  rows: TimeProjectRow[] = [],
  sortProps: {
    sortOrder?:
      | typeof PROJECT_SORT_ORDER.NAME_ASC
      | typeof PROJECT_SORT_ORDER.NAME_DESC;
    onSortChange?: () => void;
  } = {},
) =>
  render(
    <Provider store={createTestStore(rows)}>
      <TimeProjectTable
        onAssignWorkers={mockOnAssignWorkers}
        onCreateEstimate={mockOnCreateEstimate}
        onEditEstimate={mockOnEditEstimate}
        sortOrder={sortProps.sortOrder}
        onSortChange={sortProps.onSortChange}
      />
    </Provider>,
  );

describe('TimeProjectTable', () => {
  const mockUseProjectsSdkFlags = useProjectsSdkFlags as jest.MockedFunction<
    typeof useProjectsSdkFlags
  >;

  beforeEach(() => {
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: true,
      isProjectsAssignWorkersEnabled: true,
      isProjectsEditEstimatesEnabled: true,
      isProjectsEditDateEnabled: true,
      loading: false,
      error: undefined,
    });
    mockUseLandingPageTrackingPoints.mockReturnValue(
      LANDING_PAGE_TRACKING_POINTS,
    );
    mockOnSortChange.mockClear();
  });

  it('should render without crashing', () => {
    const { container } = renderWithStore();
    expect(container).toBeTruthy();
  });

  it('should render zero state when there are no rows', () => {
    renderWithStore([]);
    expect(screen.getByTestId('time-project-zero-state')).toBeInTheDocument();
  });

  it('should render table with column headers when rows exist', () => {
    renderWithStore([mockRow]);
    expect(screen.getByText('Project / Customer')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Deadline')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render "Project" header when manage-projects flag is disabled', () => {
    mockUseProjectsSdkFlags.mockReturnValue({
      isProjectsManageProjectsEnabled: false,
      isProjectsAssignWorkersEnabled: true,
      isProjectsEditEstimatesEnabled: true,
      isProjectsEditDateEnabled: true,
      loading: false,
      error: undefined,
    });

    renderWithStore([mockRow]);
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.queryByText('Project / Customer')).not.toBeInTheDocument();
  });

  it('should render project name and customer name', () => {
    renderWithStore([mockRow]);
    expect(screen.getByText('Melrose Construction')).toBeInTheDocument();
    expect(screen.getByText('Ann Smith')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    renderWithStore([mockRow]);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should render budget info for projects with budget', () => {
    renderWithStore([mockRow]);
    expect(screen.getByText('80h')).toBeInTheDocument();
    expect(screen.getByText('47h remaining')).toBeInTheDocument();
  });

  it('should render dash for projects without an estimate (-1 sentinel)', () => {
    // The supergraph reports `totalEstimatedSeconds: -1` for projects
    // with no estimate set yet. `useProjectEstimates` preserves that
    // through to `budgetHoursTotal: -1`, and `mapResponseToRows` uses
    // the same sentinel for the row's pre-fetch fallback. Per product,
    // a `0`-hour estimate is now a real estimate (renders as "0h"),
    // so only `-1` collapses to "—".
    const noBudgetRow = {
      ...mockRow,
      budget: '',
      budgetHoursTotal: -1,
      budgetHoursRemaining: -1,
    };
    renderWithStore([noBudgetRow]);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('should render action dropdown for each row', () => {
    renderWithStore([mockRow]);
    expect(
      screen.getByTestId(`action-combo-link-${mockRow.projectId}`),
    ).toBeInTheDocument();
  });

  it('should render multiple rows', () => {
    const rows = [
      mockRow,
      {
        ...mockRow,
        rowIndex: 1,
        uniqueId: 'proj-2',
        projectId: 'proj-2',
        projectName: 'Harbor View',
      },
    ];
    renderWithStore(rows);
    expect(screen.getByText('Melrose Construction')).toBeInTheDocument();
    expect(screen.getByText('Harbor View')).toBeInTheDocument();
  });

  describe('project header sort', () => {
    it('renders the sort control with ascending aria-sort by default', () => {
      renderWithStore([mockRow]);
      const sortControl = screen.getByTestId('time-project-table-sort-project');
      expect(sortControl).toBeInTheDocument();
      // The @ids-ts Table mock renders every Table.Cell as a <td>, so
      // walk up to the nearest cell (td or th) instead of a header role.
      const cell = sortControl.closest('td, th');
      expect(cell?.getAttribute('aria-sort')).toBe('ascending');
    });

    it('flips aria-sort to descending when sortOrder is NAME_DESC', () => {
      renderWithStore([mockRow], {
        sortOrder: PROJECT_SORT_ORDER.NAME_DESC,
      });
      const sortControl = screen.getByTestId('time-project-table-sort-project');
      const cell = sortControl.closest('td, th');
      expect(cell?.getAttribute('aria-sort')).toBe('descending');
    });

    it('calls onSortChange when the project header sort control is clicked', () => {
      renderWithStore([mockRow], {
        sortOrder: PROJECT_SORT_ORDER.NAME_ASC,
        onSortChange: mockOnSortChange,
      });
      fireEvent.click(screen.getByTestId('time-project-table-sort-project'));
      expect(mockOnSortChange).toHaveBeenCalledTimes(1);
    });

    it('uses an i18n message for the sort aria-label', () => {
      renderWithStore([mockRow]);
      // The English catalog resolves "Sort by {column}" with column =
      // "Project / Customer" once the manage-projects flag is on.
      expect(
        screen.getByLabelText('Sort by Project / Customer'),
      ).toBeInTheDocument();
    });
  });
});
