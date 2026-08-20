import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import estimateDrawerReducer from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import { useDeleteEstimate } from 'src/js/widgets/timeProject/hooks/useDeleteEstimate';

const mockMutate = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useMutation: () => [mockMutate, { loading: false }],
}));

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

describe('useDeleteEstimate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete estimate successfully', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingDeleteProjectEstimate: {
          successCode: 'SUCCESS',
          projectId: 'proj-1',
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useDeleteEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteEstimate('proj-1');
    });

    expect(success).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: { projectId: 'proj-1' } },
      }),
    );
  });

  it('should handle API error response', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingDeleteProjectEstimate: {
          errorCode: 'NOT_FOUND',
          message: 'Estimate not found',
          details: null,
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useDeleteEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteEstimate('proj-1');
    });

    expect(success).toBe(false);
    // Backend error messages are intentionally swallowed in favor of a
    // generic, user-friendly key.
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });

  it('should use generic error when API error has no message', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingDeleteProjectEstimate: {
          errorCode: 'UNKNOWN',
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useDeleteEstimate(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.deleteEstimate('proj-1');
    });

    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });

  it('should handle unexpected response shape', async () => {
    mockMutate.mockResolvedValue({ data: {} });

    const store = createTestStore();
    const { result } = renderHook(() => useDeleteEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteEstimate('proj-1');
    });

    expect(success).toBe(false);
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });

  it('should handle mutation exception', async () => {
    mockMutate.mockRejectedValue(new Error('Network failure'));

    const store = createTestStore();
    const { result } = renderHook(() => useDeleteEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.deleteEstimate('proj-1');
    });

    expect(success).toBe(false);
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });
});
