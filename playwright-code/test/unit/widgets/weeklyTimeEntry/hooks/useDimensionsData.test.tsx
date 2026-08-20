import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDimensionsData } from 'src/js/widgets/weeklyTimeEntry/hooks/useDimensionsData';
import dimensionsReducer from 'src/js/widgets/weeklyTimeEntry/store/dimensionsSlice';
import timeEntrySettingsReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice';
import timeEntryGridReducer from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';

jest.mock('src/js/common/useDimensionVisibility', () => ({
  useDimensionVisibility: jest.fn(),
}));

jest.mock('src/js/service/hooks/dimensions/useGetDimensions', () => ({
  useGetDimensions: jest.fn(),
}));

const mockUseDimensionVisibility =
  require('src/js/common/useDimensionVisibility').useDimensionVisibility;
const mockUseGetDimensions =
  require('src/js/service/hooks/dimensions/useGetDimensions').useGetDimensions;

const mockDefinitions = [
  {
    id: 'dim-1',
    name: 'Department',
    active: true,
    enabledForTimeTracking: true,
    required: false,
  },
];

const createTestStore = () =>
  configureStore({
    reducer: {
      dimensions: dimensionsReducer,
      timeEntrySettings: timeEntrySettingsReducer,
      // The hook now reads the selected worker from timeEntryGrid.teamMember
      // (preferred over the seeded timeEntrySettings.timeEntryTimeFor).
      timeEntryGrid: timeEntryGridReducer,
    },
  });

const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createTestStore>;
}) => <Provider store={store}>{children}</Provider>;

describe('useDimensionsData', () => {
  let store: ReturnType<typeof createTestStore>;
  let queryDefinitions: jest.Mock;

  beforeEach(() => {
    store = createTestStore();
    queryDefinitions = jest.fn().mockResolvedValue(undefined);

    jest.clearAllMocks();

    mockUseDimensionVisibility.mockReturnValue({
      isVisible: true,
      loading: false,
    });
    mockUseGetDimensions.mockReturnValue({
      dimensions: [],
      loading: false,
      error: null,
      query: queryDefinitions,
    });
  });

  it('fetches definitions once when dimensions are visible', () => {
    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(queryDefinitions).toHaveBeenCalledTimes(1);
    expect(queryDefinitions).toHaveBeenCalledWith({ timeForId: null });
  });

  it('does not fetch when dimensions are not visible', () => {
    mockUseDimensionVisibility.mockReturnValue({
      isVisible: false,
      loading: false,
    });

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(queryDefinitions).not.toHaveBeenCalled();
  });

  it('persists fetched definitions to Redux', () => {
    mockUseGetDimensions.mockReturnValue({
      dimensions: mockDefinitions,
      loading: false,
      error: null,
      query: queryDefinitions,
    });

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().dimensions.dimensions).toEqual(mockDefinitions);
    expect(store.getState().dimensions.enabled).toBe(true);
  });

  it('syncs loading state to Redux', () => {
    mockUseGetDimensions.mockReturnValue({
      dimensions: [],
      loading: true,
      error: null,
      query: queryDefinitions,
    });

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().dimensions.loading).toBe(true);
  });

  it('syncs error state to Redux', () => {
    mockUseGetDimensions.mockReturnValue({
      dimensions: [],
      loading: false,
      error: 'Definitions failed',
      query: queryDefinitions,
    });

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(store.getState().dimensions.error).toBe('Definitions failed');
    expect(store.getState().dimensions.loading).toBe(false);
  });

  it('resets query guard when fetch fails', async () => {
    queryDefinitions.mockRejectedValueOnce(new Error('network'));

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    await Promise.resolve();

    renderHook(() => useDimensionsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(queryDefinitions).toHaveBeenCalledTimes(2);
  });
});
