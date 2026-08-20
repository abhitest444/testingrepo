import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WorkersGroupViewDataProvider } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersGroupViewDataProvider';
import { useCombinedGroupsDataFetching } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/hooks/useCombinedGroupsDataFetching';
import { GROUPS_PAGE_SIZE } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';

// Mock the combined data fetching hook
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/hooks/useCombinedGroupsDataFetching',
  () => ({
    useCombinedGroupsDataFetching: jest.fn(),
  }),
);

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersTableByGroupsViewContent',
  () => ({
    WorkersTableByGroupsViewContent: ({
      groups,
      groupsCount,
      isLoading,
      error,
      currentPage,
      pageSize,
      totalCount,
      onPageChange,
    }: any) => (
      <div data-testid="workers-table-content">
        <div data-testid="groups-count">{groupsCount}</div>
        <div data-testid="is-loading">{isLoading?.toString() ?? 'false'}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="groups-length">{groups?.length ?? 0}</div>
        <div data-testid="current-page">{currentPage}</div>
        <div data-testid="page-size">{pageSize?.toString() ?? '0'}</div>
        <div data-testid="total-count">{totalCount ?? 0}</div>
        <button
          data-testid="page-change-button"
          onClick={() => onPageChange(2)}
        >
          Go to Page 2
        </button>
        <button data-testid="page-1-button" onClick={() => onPageChange(1)}>
          Go to Page 1
        </button>
      </div>
    ),
  }),
);

describe('WorkersGroupViewDataProvider', () => {
  // Store helper function
  const createMockStore = () =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
    });

  // Create stable mock functions
  const mockLoadGroups = jest.fn();
  const mockFetchNextPage = jest.fn();
  const mockFetchPreviousPage = jest.fn();
  const mockRefetchHeaderCounts = jest.fn();

  const mockGroups = [
    { id: 'group-1', name: 'Engineering', stats: { memberCount: 10 } },
    { id: 'group-2', name: 'Design', stats: { memberCount: 5 } },
  ];

  const defaultHookReturn = {
    groups: mockGroups,
    groupsCount: 100,
    groupsTotalCount: 100,
    groupsLoading: false,
    groupsError: null,
    totalActiveWorkerCount: 150,
    totalActiveGroupCount: 100,
    headerCountsLoading: false,
    headerCountsError: null,
    loading: false,
    error: null,
    loadGroups: mockLoadGroups,
    fetchNextPage: mockFetchNextPage,
    fetchPreviousPage: mockFetchPreviousPage,
    refetchHeaderCounts: mockRefetchHeaderCounts,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue(
      defaultHookReturn,
    );
  });

  it('should render WorkersTableByGroupsViewContent with correct props', () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('workers-table-content')).toBeInTheDocument();
    expect(getByTestId('groups-count')).toHaveTextContent('100');
    expect(getByTestId('is-loading')).toHaveTextContent('false');
    expect(getByTestId('error')).toHaveTextContent('no-error');
    expect(getByTestId('groups-length')).toHaveTextContent('2');
    expect(getByTestId('current-page')).toHaveTextContent('1');
    expect(getByTestId('page-size')).toHaveTextContent(
      GROUPS_PAGE_SIZE.toString(),
    );
    expect(getByTestId('total-count')).toHaveTextContent('100');
  });

  it('should call useCombinedGroupsDataFetching with searchText', () => {
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider searchText="Engineering" />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(useCombinedGroupsDataFetching).toHaveBeenCalledWith('Engineering');
  });

  it('should call useCombinedGroupsDataFetching with empty string by default', () => {
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(useCombinedGroupsDataFetching).toHaveBeenCalledWith('');
  });

  it('should call onLoadingChange when loading state is available', () => {
    const onLoadingChange = jest.fn();
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider onLoadingChange={onLoadingChange} />
      </Provider>,
      getDefaultSandbox(),
    );
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });

  it('should call onLoadingChange with true when hook returns loading true', () => {
    const onLoadingChange = jest.fn();
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      loading: true,
    });
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider onLoadingChange={onLoadingChange} />
      </Provider>,
      getDefaultSandbox(),
    );
    expect(onLoadingChange).toHaveBeenCalledWith(true);
  });

  it('should load groups on mount without search text', () => {
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true },
    });
  });

  it('should load groups on mount with search text', () => {
    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider searchText="Engineering" />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true, searchText: 'Engineering' },
    });
  });

  it('should navigate to next page when page 2 is clicked', () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    const pageChangeButton = getByTestId('page-change-button');
    pageChangeButton.click();

    expect(mockFetchNextPage).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true },
    });
  });

  it('should not navigate when clicking same page', () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    const page1Button = getByTestId('page-1-button');
    page1Button.click();

    // Should not call any pagination functions since we're already on page 1
    expect(mockFetchNextPage).not.toHaveBeenCalled();
    expect(mockFetchPreviousPage).not.toHaveBeenCalled();
  });

  it('should reload groups when search text changes', () => {
    const { rerender } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    // Initial load
    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true },
    });

    // Change search text
    rerender(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider searchText="Design" />
      </Provider>,
    );

    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true, searchText: 'Design' },
    });
  });

  it('should reset to page 1 when search text changes', () => {
    const { rerender, getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    // Navigate to page 2
    const pageChangeButton = getByTestId('page-change-button');
    pageChangeButton.click();

    // Change search text
    rerender(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider searchText="Engineering" />
      </Provider>,
    );

    // Should be back on page 1
    expect(getByTestId('current-page')).toHaveTextContent('1');
  });

  it('should include search text in pagination requests', () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider searchText="Sales" />
      </Provider>,
      getDefaultSandbox(),
    );

    const pageChangeButton = getByTestId('page-change-button');
    pageChangeButton.click();

    expect(mockFetchNextPage).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true, searchText: 'Sales' },
    });
  });

  it('should handle error state correctly', () => {
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to load groups',
      loading: false,
    });

    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('error')).toHaveTextContent('Failed to load groups');
  });

  it('should handle loading state correctly', () => {
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      loading: true,
    });

    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('should handle empty groups correctly', () => {
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      groups: [],
      groupsCount: 0,
      groupsTotalCount: 0,
    });

    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('groups-length')).toHaveTextContent('0');
    expect(getByTestId('groups-count')).toHaveTextContent('0');
    expect(getByTestId('total-count')).toHaveTextContent('0');
  });

  it('should handle pagination with different page sizes', () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('page-size')).toHaveTextContent(
      GROUPS_PAGE_SIZE.toString(),
    );
  });

  it('should handle total count for pagination', () => {
    (useCombinedGroupsDataFetching as jest.Mock).mockReturnValue({
      ...defaultHookReturn,
      groupsCount: 500,
      groupsTotalCount: 500,
    });

    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    expect(getByTestId('total-count')).toHaveTextContent('500');
  });

  it('should expose refetchGroups function to parent via onRefetchAvailable', async () => {
    const mockOnRefetchAvailable = jest.fn();

    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider
          onRefetchAvailable={mockOnRefetchAvailable}
        />
      </Provider>,
      getDefaultSandbox(),
    );

    await waitFor(() => {
      expect(mockOnRefetchAvailable).toHaveBeenCalled();
    });

    const refetchFunction = mockOnRefetchAvailable.mock.calls[0][0];
    expect(typeof refetchFunction).toBe('function');

    // Call the refetch function
    refetchFunction();

    // Should reset to page 1 and reload groups
    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true },
    });
    expect(mockRefetchHeaderCounts).toHaveBeenCalled();
  });

  it('should call refetchGroups with searchText when provided', async () => {
    const mockOnRefetchAvailable = jest.fn();

    renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider
          searchText="Engineering"
          onRefetchAvailable={mockOnRefetchAvailable}
        />
      </Provider>,
      getDefaultSandbox(),
    );

    await waitFor(() => {
      expect(mockOnRefetchAvailable).toHaveBeenCalled();
    });

    const refetchFunction = mockOnRefetchAvailable.mock.calls[0][0];
    refetchFunction();

    expect(mockLoadGroups).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true, searchText: 'Engineering' },
    });
  });

  it('should navigate to previous page when going backward', async () => {
    const { getByTestId } = renderWithQuicksandProvider(
      <Provider store={createMockStore()}>
        <WorkersGroupViewDataProvider />
      </Provider>,
      getDefaultSandbox(),
    );

    // First navigate to page 2
    const pageChangeButton = getByTestId('page-change-button');
    pageChangeButton.click();

    await waitFor(() => {
      expect(getByTestId('current-page')).toHaveTextContent('2');
    });

    // Now navigate back to page 1
    const page1Button = getByTestId('page-1-button');
    page1Button.click();

    expect(mockFetchPreviousPage).toHaveBeenCalledWith({
      first: GROUPS_PAGE_SIZE,
      filter: { isActive: true },
    });
  });
});
