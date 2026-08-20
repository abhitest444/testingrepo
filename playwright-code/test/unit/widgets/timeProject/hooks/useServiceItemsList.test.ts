import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import estimateDrawerReducer from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import { useServiceItemsList } from 'src/js/widgets/timeProject/hooks/useServiceItemsList';

const mockLoadSfo = jest.fn();
let mockSfoData: any = null;
let mockSfoLoading = false;
let mockPageInfo: any = null;

jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldOptionAssignments',
  () => ({
    useStandardFieldOptionAssignments: () => ({
      loading: mockSfoLoading,
      data: mockSfoData,
      error: null,
      loadStandardFieldOptionAssignments: mockLoadSfo,
      pageInfo: mockPageInfo,
    }),
  }),
);

const createTestStore = () =>
  configureStore({
    reducer: {
      projects: projectsReducer,
      filters: filtersReducer,
      ui: uiReducer,
      settings: settingsReducer,
      estimateDrawer: estimateDrawerReducer,
    },
  });

const createWrapper =
  (store: ReturnType<typeof createTestStore>): React.FC =>
  ({ children }) =>
    React.createElement(Provider, { store } as any, children);

describe('useServiceItemsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSfoData = null;
    mockSfoLoading = false;
    mockPageInfo = null;
  });

  it('should call SFO on initial mount with assigned true', () => {
    const store = createTestStore();
    renderHook(() => useServiceItemsList('cust-1'), {
      wrapper: createWrapper(store),
    });

    expect(mockLoadSfo).toHaveBeenCalledWith({
      first: 200,
      after: undefined,
      input: {
        standardFieldLabel: 'SERVICE_ITEM',
        customerId: 'cust-1',
      },
      filter: {
        assigned: true,
        active: true,
        searchText: null,
      },
    });
  });

  it('should call SFO without customerId when not provided', () => {
    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    expect(mockLoadSfo).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          standardFieldLabel: 'SERVICE_ITEM',
          customerId: undefined,
        },
      }),
    );
  });

  it('should map SFO data to service items on response', () => {
    mockSfoData = [
      {
        id: 'si-1',
        name: 'Design',
        fullName: 'Design Services',
        assigned: true,
        active: true,
        standardFieldLabel: 'SERVICE_ITEM',
      },
      {
        id: 'si-2',
        name: '',
        fullName: 'Development',
        assigned: true,
        active: true,
        standardFieldLabel: 'SERVICE_ITEM',
      },
    ];
    mockPageInfo = { hasNextPage: false, endCursor: null };

    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    const state = store.getState().estimateDrawer;
    expect(state.serviceItems).toHaveLength(2);
    expect(state.serviceItems[0]).toEqual({
      id: 'si-1',
      name: 'Design',
      fullName: 'Design Services',
    });
    expect(state.serviceItems[1]).toEqual({
      id: 'si-2',
      name: 'Development',
      fullName: 'Development',
    });
    expect(state.serviceItemsHasMore).toBe(false);
  });

  it('should set hasMore and endCursor from pageInfo', () => {
    mockSfoData = [
      {
        id: 'si-1',
        name: 'Design',
        fullName: 'Design',
        assigned: true,
        active: true,
        standardFieldLabel: 'SERVICE_ITEM',
      },
    ];
    mockPageInfo = { hasNextPage: true, endCursor: 'cursor-abc' };

    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    const state = store.getState().estimateDrawer;
    expect(state.serviceItemsHasMore).toBe(true);
    expect(state.serviceItemsEndCursor).toBe('cursor-abc');
  });

  it('should search and dispatch search text', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useServiceItemsList('cust-1'), {
      wrapper: createWrapper(store),
    });

    mockLoadSfo.mockClear();

    act(() => {
      result.current.searchServiceItems('consulting');
    });

    expect(store.getState().estimateDrawer.serviceItemsSearchText).toBe(
      'consulting',
    );
    expect(mockLoadSfo).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          searchText: 'consulting',
        }),
      }),
    );
  });

  it('should pass null searchText when search is empty', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    mockLoadSfo.mockClear();

    act(() => {
      result.current.searchServiceItems('');
    });

    expect(mockLoadSfo).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          searchText: null,
        }),
      }),
    );
  });

  it('should not load more when hasMore is false', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    mockLoadSfo.mockClear();

    act(() => {
      result.current.loadMoreServiceItems();
    });

    expect(mockLoadSfo).not.toHaveBeenCalled();
  });

  it('should return serviceItemsHasMore from state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.serviceItemsHasMore).toBe(false);
  });

  it('should not re-fetch on subsequent renders', () => {
    const store = createTestStore();
    const { rerender } = renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    expect(mockLoadSfo).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockLoadSfo).toHaveBeenCalledTimes(1);
  });

  it('should skip mapping when sfoData is null', () => {
    mockSfoData = null;

    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    expect(store.getState().estimateDrawer.serviceItems).toEqual([]);
  });

  it('should handle item with empty name falling back to fullName', () => {
    mockSfoData = [
      {
        id: 'si-1',
        name: null,
        fullName: 'Design Full',
        assigned: true,
        active: true,
        standardFieldLabel: 'SERVICE_ITEM',
      },
    ];
    mockPageInfo = { hasNextPage: false, endCursor: null };

    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    const state = store.getState().estimateDrawer;
    expect(state.serviceItems[0].name).toBe('Design Full');
  });

  it('should handle pageInfo with null values', () => {
    mockSfoData = [
      {
        id: 'si-1',
        name: 'Test',
        fullName: 'Test',
        assigned: true,
        active: true,
        standardFieldLabel: 'SERVICE_ITEM',
      },
    ];
    mockPageInfo = { hasNextPage: null, endCursor: null };

    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    const state = store.getState().estimateDrawer;
    expect(state.serviceItemsHasMore).toBe(false);
  });

  it('should dispatch loading state from sfoLoading', () => {
    mockSfoLoading = true;
    const store = createTestStore();
    renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    const state = store.getState().estimateDrawer;
    expect(state.serviceItemsLoading).toBe(true);
  });

  it('should handle loadMoreServiceItems when sfoLoading prevents load', () => {
    mockSfoData = [{ id: 'si-1', name: 'Test', fullName: 'Test' }];
    mockPageInfo = { hasNextPage: true, endCursor: 'c1' };
    mockSfoLoading = true;

    const store = createTestStore();
    const { result } = renderHook(() => useServiceItemsList(), {
      wrapper: createWrapper(store),
    });

    mockLoadSfo.mockClear();

    act(() => {
      result.current.loadMoreServiceItems();
    });

    expect(mockLoadSfo).not.toHaveBeenCalled();
  });
});
