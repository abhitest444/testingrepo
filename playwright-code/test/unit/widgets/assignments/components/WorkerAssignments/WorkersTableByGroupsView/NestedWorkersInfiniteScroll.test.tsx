import React from 'react';
import { render, screen } from '@testing-library/react';
import { NestedWorkersInfiniteScroll } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/NestedWorkersInfiniteScroll';
import type { WorkersForGroupState } from 'src/js/widgets/assignments/store/workersGroupViewSlice';

// Mock dependencies
jest.mock('@ids-ts/table', () => ({
  Table: {
    Row: ({ children, className, onClick, role }: any) => (
      <tr
        className={className}
        onClick={onClick}
        role={onClick ? role || 'button' : role}
        onKeyDown={
          onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
        }
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </tr>
    ),
    Cell: ({ children, className, onClick, role }: any) => (
      <td
        className={className}
        onClick={onClick}
        role={onClick ? role || 'button' : role}
        onKeyDown={
          onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
        }
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </td>
    ),
  },
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ size, shape, className }: any) => (
    <div
      data-testid="activity-loader"
      data-size={size}
      data-shape={shape}
      className={className}
    >
      Loading...
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkerRow',
  () => ({
    WorkerRow: ({ worker }: any) => (
      <tr data-testid={`worker-row-${worker.id}`}>
        <td>{worker.name}</td>
      </tr>
    ),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled',
  () => ({
    LoadingMoreContainer: ({ children, className }: any) => (
      <div data-testid="loading-more-container" className={className}>
        {children}
      </div>
    ),
    EndOfListMessage: ({ children, className }: any) => (
      <div data-testid="end-of-list-message" className={className}>
        {children}
      </div>
    ),
    WorkerCell: ({ children, className, onClick, role }: any) => (
      <td
        data-testid="worker-cell"
        className={className}
        onClick={onClick}
        role={onClick ? role || 'button' : role}
        onKeyDown={
          onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
        }
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </td>
    ),
  }),
);

describe('NestedWorkersInfiniteScroll', () => {
  const mockLoadMoreWorkers = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockWorkersState = (
    overrides?: Partial<WorkersForGroupState>,
  ): WorkersForGroupState => ({
    ids: ['worker-1', 'worker-2'],
    entities: {
      'worker-1': {
        id: 'worker-1',
        name: 'John Doe',
        status: 'Active',
        role: 'Employee',
      },
      'worker-2': {
        id: 'worker-2',
        name: 'Jane Smith',
        status: 'Active',
        role: 'Contractor',
      },
    },
    loading: false,
    error: null,
    cursor: null,
    hasMore: false,
    isLoadingMore: false,
    isSearchResult: false,
    ...overrides,
  });

  it('should render worker rows', () => {
    const workersState = createMockWorkersState();
    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.getByTestId('worker-row-worker-1')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-worker-2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show loading more indicator when isLoadingMore is true', () => {
    const workersState = createMockWorkersState({
      isLoadingMore: true,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.getByTestId('loading-more-container')).toBeInTheDocument();
    expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    expect(screen.getByText(/Loading more workers.../)).toBeInTheDocument();
  });

  it('should show empty message when no workers and not loading', () => {
    const workersState = createMockWorkersState({
      ids: [],
      entities: {},
      isLoadingMore: false,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.getByTestId('end-of-list-message')).toBeInTheDocument();
    expect(screen.getByText(/No workers in this group/)).toBeInTheDocument();
  });

  it('should show end message when all workers loaded', () => {
    const workersState = createMockWorkersState({
      hasMore: false,
      isLoadingMore: false,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.getByTestId('end-of-list-message')).toBeInTheDocument();
    expect(
      screen.getByText(/All workers loaded \(2 total\)/),
    ).toBeInTheDocument();
  });

  it('should not show end message when hasMore is true', () => {
    const workersState = createMockWorkersState({
      hasMore: true,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.queryByText(/All workers loaded/)).not.toBeInTheDocument();
  });

  it('should filter out null/undefined workers', () => {
    const workersState: WorkersForGroupState = {
      ids: ['worker-1', 'worker-2', 'worker-3'],
      entities: {
        'worker-1': {
          id: 'worker-1',
          name: 'John Doe',
          status: 'Active',
          role: 'Employee',
        },
        'worker-2': null as any,
        // worker-3 is missing from entities
      },
      loading: false,
      error: null,
      cursor: null,
      hasMore: false,
      isLoadingMore: false,
      isSearchResult: false,
    };

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    // Should only render the valid worker
    expect(screen.getByTestId('worker-row-worker-1')).toBeInTheDocument();
    expect(screen.queryByTestId('worker-row-worker-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('worker-row-worker-3')).not.toBeInTheDocument();
  });

  it('should render workers and loading indicator together when loading more', () => {
    const workersState = createMockWorkersState({
      isLoadingMore: true,
      hasMore: true,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    // Both workers and loading indicator should be present
    expect(screen.getByTestId('worker-row-worker-1')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-worker-2')).toBeInTheDocument();
    expect(screen.getByTestId('loading-more-container')).toBeInTheDocument();
  });

  it('should use groupId in loading row key', () => {
    const workersState = createMockWorkersState({
      isLoadingMore: true,
    });

    const { container } = render(
      <NestedWorkersInfiniteScroll
        groupId="group-123"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    // The loading row should exist (we can't directly test the key, but we can verify it renders)
    expect(screen.getByTestId('loading-more-container')).toBeInTheDocument();
  });

  it('should render correct number of worker rows', () => {
    const workersState = createMockWorkersState({
      ids: ['w1', 'w2', 'w3', 'w4', 'w5'],
      entities: {
        w1: { id: 'w1', name: 'Worker 1', status: 'Active', role: 'Employee' },
        w2: { id: 'w2', name: 'Worker 2', status: 'Active', role: 'Employee' },
        w3: { id: 'w3', name: 'Worker 3', status: 'Active', role: 'Employee' },
        w4: { id: 'w4', name: 'Worker 4', status: 'Active', role: 'Employee' },
        w5: { id: 'w5', name: 'Worker 5', status: 'Active', role: 'Employee' },
      },
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(screen.getByTestId('worker-row-w1')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-w2')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-w3')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-w4')).toBeInTheDocument();
    expect(screen.getByTestId('worker-row-w5')).toBeInTheDocument();
  });

  it('should not show empty message when loading more', () => {
    const workersState = createMockWorkersState({
      ids: [],
      entities: {},
      isLoadingMore: true,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    expect(
      screen.queryByText(/No workers in this group/),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-more-container')).toBeInTheDocument();
  });

  it('should not show end message when there are no workers', () => {
    const workersState = createMockWorkersState({
      ids: [],
      entities: {},
      hasMore: false,
      isLoadingMore: false,
    });

    render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    // Should show empty message, not end message
    expect(screen.getByText(/No workers in this group/)).toBeInTheDocument();
    expect(screen.queryByText(/All workers loaded/)).not.toBeInTheDocument();
  });

  it('should maintain worker order from ids array', () => {
    const workersState = createMockWorkersState({
      ids: ['worker-2', 'worker-1'], // Reversed order
      entities: {
        'worker-1': {
          id: 'worker-1',
          name: 'John Doe',
          status: 'Active',
          role: 'Employee',
        },
        'worker-2': {
          id: 'worker-2',
          name: 'Jane Smith',
          status: 'Active',
          role: 'Contractor',
        },
      },
    });

    const { container } = render(
      <NestedWorkersInfiniteScroll
        groupId="group-1"
        workersState={workersState}
        loadMoreWorkers={mockLoadMoreWorkers}
      />,
    );

    const rows = container.querySelectorAll('tr[data-testid^="worker-row-"]');
    expect(rows[0]).toHaveAttribute('data-testid', 'worker-row-worker-2');
    expect(rows[1]).toHaveAttribute('data-testid', 'worker-row-worker-1');
  });
});
