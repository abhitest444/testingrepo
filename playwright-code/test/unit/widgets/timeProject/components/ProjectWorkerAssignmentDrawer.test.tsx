import React from 'react';
import { render, act } from '@testing-library/react';
import ProjectWorkerAssignmentDrawer from 'src/js/widgets/timeProject/components/ProjectWorkerAssignmentDrawer';
import { ASSIGN_WORKERS_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
const mockDispatch = jest.fn();
const mockLoadTimeForAssignments = jest.fn();
const mockManageAssignment = jest.fn().mockResolvedValue({});

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
  useSandbox: () => ({
    logger: {
      info: mockLoggerInfo,
      error: mockLoggerError,
      warn: mockLoggerWarn,
    },
  }),
}));

let capturedConfig: any = null;
let capturedOnClose: any = null;
let capturedProps: any = null;

jest.mock(
  'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer',
  () => (props: any) => {
    capturedConfig = props.config;
    capturedOnClose = props.onClose;
    capturedProps = props;
    return <div data-testid="assignment-drawer">AssignmentDrawer</div>;
  },
);

jest.mock('src/js/widgets/common/AssignmentDrawer/assignmentUtils', () => ({
  processAssignmentChanges: jest.fn(() => ({
    workersToAssign: ['w1'],
    workersToUnassign: [],
    groupIdsToAssign: [],
    groupIdsToUnassign: [],
  })),
}));

let mockApiData: any[] = [];
let mockApiPageInfo: any = null;
let mockTotalTimeForCount: number | null = null;

jest.mock('src/js/service/hooks/assignments/useTimeForAssignments', () => ({
  useTimeForAssignments: () => ({
    loadTimeForAssignments: mockLoadTimeForAssignments,
    data: mockApiData,
    pageInfo: mockApiPageInfo,
    totalTimeForCount: mockTotalTimeForCount,
  }),
}));

let capturedMutationCallbacks: any = {};

jest.mock(
  'src/js/service/hooks/assignments/useManageTimeAgainstTimeForAssignment',
  () => ({
    useManageTimeAgainstTimeForAssignment: (callbacks: any) => {
      capturedMutationCallbacks = callbacks;
      return [mockManageAssignment, { loading: false }];
    },
  }),
);

let mockReduxState: any = {
  customerWorkerAssignments: {
    allItems: [] as any[],
    totalCount: 0,
    loading: false,
    endCursor: null as string | null,
    hasMore: false,
  },
  // Drawer reads two contacts-derived maps from the projects slice:
  //   - `projectRefs`     -> the project's own contact id (used as
  //                          `customerId` on save / read payloads)
  //   - `projectParents`  -> the project's parent customer contact id
  //                          (appended to `timeAgainstList` on save
  //                          to match the assignments widget shape)
  // Both default to empty so existing tests fall back to the row's
  // inline customerId and produce the single-entry timeAgainstList.
  projects: {
    projectRefs: {} as Record<
      string,
      { projectId: string; customerId: string }
    >,
    projectParents: {} as Record<string, string>,
  },
};

jest.mock('src/js/widgets/timeProject/store', () => ({
  useAppSelector: jest.fn((selector: any) => {
    // Tests reassign `mockReduxState` to a fresh object per scenario,
    // and most of those scenarios only stub `customerWorkerAssignments`
    // — so always layer in safe `projects.projectRefs` /
    // `projects.projectParents` defaults so the contacts-derived
    // selectors don't blow up.
    const stateWithDefaults = {
      ...mockReduxState,
      projects: {
        projectRefs: {},
        projectParents: {},
        ...(mockReduxState.projects || {}),
      },
    };
    return selector(stateWithDefaults);
  }),
  useAppDispatch: () => mockDispatch,
}));

jest.mock(
  'src/js/widgets/assignments/store/customerWorkerAssignmentsSlice',
  () => ({
    resetCustomerWorkerAssignmentsState: jest.fn(() => ({ type: 'reset' })),
    setLoading: jest.fn((val: boolean) => ({
      type: 'setLoading',
      payload: val,
    })),
    appendData: jest.fn((data: any) => ({
      type: 'appendData',
      payload: data,
    })),
    WORKER_ASSIGNMENT_PAGE_SIZE: 25,
  }),
);

jest.mock('@ids-ts/page-message', () => (props: any) => (
  <div data-testid="page-message">{props.children}</div>
));

jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

const mockProject = {
  rowIndex: 0,
  uniqueId: '1',
  projectId: 'p1',
  projectName: 'Test Project',
  customerId: 'c1',
  customerName: 'Test Customer',
  status: 'IN_PROGRESS' as const,
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

describe('ProjectWorkerAssignmentDrawer', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedConfig = null;
    capturedOnClose = null;
    capturedProps = null;
    mockApiData = [];
    mockApiPageInfo = null;
    mockTotalTimeForCount = null;
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [],
        totalCount: 0,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
  });

  it('renders the assignment drawer', () => {
    const { getByTestId } = render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(getByTestId('assignment-drawer')).toBeInTheDocument();
  });

  it('dispatches resetCustomerWorkerAssignmentsState on mount', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'reset' });
  });

  it('tracks CLOSE_ASSIGN_WORKER and calls onClose when close is triggered', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    capturedOnClose();
    expect(mockTrack).toHaveBeenCalledWith(
      ASSIGN_WORKERS_TRACKING_POINTS.CLOSE_ASSIGN_WORKER,
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('tracks TYPE_SEARCH_ASSIGN_WORKERS on search with non-empty value', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    capturedConfig.callbacks.onSearch('test search');
    expect(mockTrack).toHaveBeenCalledWith(
      ASSIGN_WORKERS_TRACKING_POINTS.TYPE_SEARCH_ASSIGN_WORKERS,
    );
  });

  it('does not track search on empty/whitespace string', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    capturedConfig.callbacks.onSearch('   ');
    expect(mockTrack).not.toHaveBeenCalledWith(
      ASSIGN_WORKERS_TRACKING_POINTS.TYPE_SEARCH_ASSIGN_WORKERS,
    );
  });

  it('tracks SAVE_ASSIGN_WORKER and calls manageAssignment on save', async () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: false,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: true,
      changeCount: 1,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    expect(mockTrack).toHaveBeenCalledWith(
      ASSIGN_WORKERS_TRACKING_POINTS.SAVE_ASSIGN_WORKER,
    );
    expect(mockManageAssignment).toHaveBeenCalled();
  });

  it('sends customerId-only timeAgainst / timeAgainstList — never projectId — when no parent customer is known', async () => {
    // Falls back to the single-entry list when the contacts lookup
    // hasn't surfaced a parent customer for this project. Mirrors the
    // assignments widget's behaviour when the parent edge is missing.
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: false,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: true,
      changeCount: 1,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    const { variables } = mockManageAssignment.mock.calls[0][0];
    expect(variables.input.timeAgainst).toEqual({ customerId: 'c1' });
    expect(variables.input.timeAgainstList).toEqual([{ customerId: 'c1' }]);
  });

  it('appends the parent customer entry to timeAgainstList when contacts lookup resolved a parent', async () => {
    // When the OIGQL contacts lookup gives us a parent customer id
    // for this project, the save payload should match the
    // assignments widget's hierarchical shape: project entry first,
    // ancestor customer entry second.
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [],
        totalCount: 0,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
      projects: {
        projectRefs: {
          p1: { projectId: 'p1', customerId: '5' },
        },
        projectParents: {
          p1: '1',
        },
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: false,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: true,
      changeCount: 1,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    const { variables } = mockManageAssignment.mock.calls[0][0];
    // `timeAgainst` stays single-entry — the project's own contact id.
    expect(variables.input.timeAgainst).toEqual({ customerId: '5' });
    // `timeAgainstList` is the chain: project, then ancestor customer.
    expect(variables.input.timeAgainstList).toEqual([
      { customerId: '5' },
      { customerId: '1' },
    ]);
  });

  it('does not duplicate the parent entry when projectParents incorrectly self-references the project id', async () => {
    // Defensive: a self-loop in the contacts data shouldn't produce a
    // duplicate `timeAgainstList` entry. The save logic skips appending
    // when parent id equals the project's own customer id.
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [],
        totalCount: 0,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
      projects: {
        projectRefs: {
          p1: { projectId: 'p1', customerId: '5' },
        },
        projectParents: {
          p1: '5',
        },
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: false,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: true,
      changeCount: 1,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    const { variables } = mockManageAssignment.mock.calls[0][0];
    expect(variables.input.timeAgainstList).toEqual([{ customerId: '5' }]);
  });

  it('passes assignToAll when isSelectAll is true', async () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: true,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: true,
      changeCount: 1,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    expect(mockManageAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({ assignToAll: true }),
        }),
      }),
    );
  });

  it('builds hierarchical items with grouped and ungrouped workers', () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: true,
            parentId: 'group-g1',
            metadata: { groupName: 'Group A' },
          },
          {
            id: 'w2',
            name: 'Worker 2',
            level: 1,
            hasChildren: false,
            isSelected: false,
            parentId: 'no-group',
          },
        ],
        totalCount: 2,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(capturedProps.initialSelections.has('w1')).toBe(true);
    expect(capturedProps.initialSelections.has('w2')).toBe(false);
  });

  it('passes correct config structure', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(capturedConfig.assignmentType).toBe('WorkerAssignment');
    expect(capturedConfig.ui.fieldName).toBe('Test Project');
    expect(capturedConfig.ui.searchSupported).toBe(true);
    expect(capturedConfig.table.hierarchicalSelection).toBe(true);
    expect(capturedConfig.pagination.enabled).toBe(true);
  });

  it('calls loadTimeForAssignments during fetchData when items are empty', async () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    await act(async () => {
      await capturedConfig.dataSource.fetchData({ page: 1 });
    });
    expect(mockLoadTimeForAssignments).toHaveBeenCalled();
  });

  it('handles mutation success callback', () => {
    const mockOnSuccessProp = jest.fn();
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
        onSuccess={mockOnSuccessProp}
      />,
    );
    act(() => {
      capturedMutationCallbacks.onSuccess();
    });
    expect(mockLoggerInfo).toHaveBeenCalled();
    expect(mockOnSuccessProp).toHaveBeenCalled();
  });

  it('handles mutation error callback', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    act(() => {
      capturedMutationCallbacks.onError('assignment failed');
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('handles mutation partial success callback', () => {
    const mockOnErrorProp = jest.fn();
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
        onError={mockOnErrorProp}
      />,
    );
    act(() => {
      capturedMutationCallbacks.onPartialSuccess({
        workers: { successCount: 2, failedItems: [] },
        groups: { successCount: 1, failedItems: [] },
      });
    });
    expect(mockLoggerWarn).toHaveBeenCalled();
    expect(mockOnErrorProp).toHaveBeenCalled();
  });

  it('returns items for page when allItems has data', async () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: true,
            parentId: 'group-g1',
            metadata: { groupName: 'Group A' },
          },
          {
            id: 'w2',
            name: 'Worker 2',
            level: 1,
            hasChildren: false,
            isSelected: false,
            parentId: 'group-g1',
            metadata: { groupName: 'Group A' },
          },
        ],
        totalCount: 2,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const result = await capturedConfig.dataSource.fetchData({ page: 1 });
    expect(result.totalCount).toBe(2);
  });

  it('handles fetchData when allItems loaded but requesting beyond range', async () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: true,
            parentId: 'no-group',
          },
        ],
        totalCount: 1,
        loading: false,
        endCursor: 'cursor123',
        hasMore: true,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const result = await capturedConfig.dataSource.fetchData({ page: 100 });
    expect(mockLoadTimeForAssignments).toHaveBeenCalled();
  });

  it('computes isUngrouped for various falsy values', () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: false,
            parentId: 'no-group',
          },
        ],
        totalCount: 1,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const ungroupedResult = capturedProps.initialSelections;
    expect(ungroupedResult.size).toBe(0);
  });

  it('renders error message component when drawer error is set', () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    act(() => {
      capturedMutationCallbacks.onError('some error');
    });
    expect(capturedProps.errorMessage).toBeDefined();
  });

  it('processes apiData with grouped workers and dispatches appendData', () => {
    mockApiData = [
      {
        timeForContactDAS: { id: 'w1' },
        displayName: 'Worker One',
        fullName: 'Worker One Full',
        assigned: true,
        groupId: 'g1',
        groupName: 'Group Alpha',
        timeForType: 'Employee',
      },
    ];
    mockTotalTimeForCount = 1;
    mockApiPageInfo = { hasNextPage: false, endCursor: null };

    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appendData' }),
    );
  });

  it('processes apiData with ungrouped worker (null groupId)', () => {
    mockApiData = [
      {
        timeForContactDAS: { id: 'w1' },
        displayName: '',
        fullName: 'Fallback Name',
        assigned: false,
        groupId: null,
        groupName: null,
        timeForType: null,
      },
    ];
    mockTotalTimeForCount = 1;
    mockApiPageInfo = { hasNextPage: true, endCursor: 'c1' };

    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appendData' }),
    );
  });

  it('processes apiData with groupId 0 as ungrouped', () => {
    mockApiData = [
      {
        timeForContactDAS: { id: 'w2' },
        displayName: 'Worker Two',
        fullName: '',
        assigned: true,
        groupId: '0',
        groupName: '',
        timeForType: 'Contractor',
      },
    ];
    mockTotalTimeForCount = 1;
    mockApiPageInfo = { hasNextPage: false, endCursor: null };

    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appendData' }),
    );
  });

  it('processes apiData with empty groupId as ungrouped', () => {
    mockApiData = [
      {
        timeForContactDAS: { id: 'w3' },
        displayName: 'Worker Three',
        fullName: 'W3',
        assigned: false,
        groupId: '',
        groupName: null,
        timeForType: 'Employee',
      },
    ];
    mockTotalTimeForCount = 1;
    mockApiPageInfo = { hasNextPage: false, endCursor: null };

    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appendData' }),
    );
  });

  it('dispatches setLoading(false) when apiData is empty but totalTimeForCount is not null', () => {
    mockApiData = [];
    mockTotalTimeForCount = 0;
    mockApiPageInfo = null;

    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setLoading', payload: false }),
    );
  });

  it('builds hierarchical items filtering out non-level-1 items', () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'group-g1',
            name: 'Group A',
            level: 0,
            hasChildren: true,
            isSelected: false,
            parentId: null,
          },
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: true,
            parentId: 'group-g1',
            metadata: { groupName: 'Group A' },
          },
        ],
        totalCount: 2,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(capturedProps.initialSelections.has('w1')).toBe(true);
  });

  it('builds hierarchical items with group that has no metadata groupName', () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: false,
            parentId: 'group-g2',
          },
        ],
        totalCount: 1,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(capturedProps).toBeDefined();
  });

  it('handles fetchData returning empty when no more data and not loading', async () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [
          {
            id: 'w1',
            name: 'Worker 1',
            level: 1,
            hasChildren: false,
            isSelected: true,
            parentId: 'no-group',
          },
        ],
        totalCount: 1,
        loading: false,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const result = await capturedConfig.dataSource.fetchData({ page: 100 });
    expect(result).toEqual({ items: [], totalCount: 1 });
  });

  it('handles save with processAssignmentChanges returning empty arrays', async () => {
    const {
      processAssignmentChanges,
    } = require('src/js/widgets/common/AssignmentDrawer/assignmentUtils');
    processAssignmentChanges.mockReturnValueOnce({
      workersToAssign: [],
      workersToUnassign: [],
      groupIdsToAssign: [],
      groupIdsToUnassign: [],
    });
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const changes = {
      currentSelections: new Set<string>(),
      totalItems: 0,
      isSelectAll: false,
      newlyAssigned: new Set<string>(),
      newlyUnassigned: new Set<string>(),
      finalAssigned: new Set<string>(),
      finalUnassigned: new Set<string>(),
      hasChanges: false,
      changeCount: 0,
    };
    await act(async () => {
      await capturedConfig.callbacks.onSave(changes);
    });
    expect(mockManageAssignment).toHaveBeenCalled();
  });

  it('passes reduxLoading or mutationLoading as loading prop', () => {
    mockReduxState = {
      customerWorkerAssignments: {
        allItems: [],
        totalCount: 0,
        loading: true,
        endCursor: null,
        hasMore: false,
      },
    };
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    expect(capturedProps.loading).toBe(true);
  });

  it('handles fetchData without page param defaulting to page 1', async () => {
    render(
      <ProjectWorkerAssignmentDrawer
        project={mockProject}
        onClose={mockOnClose}
      />,
    );
    const result = await capturedConfig.dataSource.fetchData({});
    expect(result).toEqual({ items: [], totalCount: 0 });
  });
});
