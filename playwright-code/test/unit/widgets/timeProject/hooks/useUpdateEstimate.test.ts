import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import estimateDrawerReducer, {
  setHoursValue,
  setEstimateType,
  addServiceItemRow,
} from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import { useUpdateEstimate } from 'src/js/widgets/timeProject/hooks/useUpdateEstimate';
import { EstimateType } from 'src/js/widgets/timeProject/types';

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

describe('useUpdateEstimate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update with TOTAL_HOURS input', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingUpdateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: { id: '1', projectId: 'proj-1' },
        },
      },
    });

    const store = createTestStore();
    store.dispatch(setHoursValue('20'));

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(success).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            totalEstimatedSeconds: 72000,
          },
        },
      }),
    );
    expect(store.getState().estimateDrawer.saveSuccess).toBe(true);
    expect(store.getState().estimateDrawer.saving).toBe(false);
  });

  it('should update with BY_SERVICE_ITEM using Redux rows', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingUpdateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: { id: '1', projectId: 'proj-1' },
        },
      },
    });

    const store = createTestStore();
    store.dispatch(setEstimateType(EstimateType.BY_SERVICE_ITEM));
    store.dispatch(
      addServiceItemRow({
        serviceItemId: 'si-1',
        serviceItemName: 'Design',
        estimatedHours: 10,
      }),
    );

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(success).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            fieldOptionEstimates: [
              { fieldOptionId: 'si-1', estimatedSeconds: 36000 },
            ],
          },
        },
      }),
    );
  });

  it('should use explicit rows over Redux rows when provided', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingUpdateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: { id: '1', projectId: 'proj-1' },
        },
      },
    });

    const store = createTestStore();
    store.dispatch(setEstimateType(EstimateType.BY_SERVICE_ITEM));
    store.dispatch(
      addServiceItemRow({
        serviceItemId: 'si-1',
        serviceItemName: 'Design',
        estimatedHours: 10,
      }),
    );

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    const explicitRows = [
      { serviceItemId: 'si-1', serviceItemName: 'Design', estimatedHours: 25 },
      { serviceItemId: 'si-2', serviceItemName: 'Dev', estimatedHours: 15 },
    ];

    await act(async () => {
      await result.current.updateEstimate({
        projectId: 'proj-1',
        rows: explicitRows,
      });
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            fieldOptionEstimates: [
              { fieldOptionId: 'si-1', estimatedSeconds: 90000 },
              { fieldOptionId: 'si-2', estimatedSeconds: 54000 },
            ],
          },
        },
      }),
    );
  });

  it('should handle API error response', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingUpdateProjectEstimate: {
          errorCode: 'INVALID_INPUT',
          message: 'Invalid project',
          details: null,
        },
      },
    });

    const store = createTestStore();
    store.dispatch(setHoursValue('20'));

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(success).toBe(false);
    // Backend error messages are intentionally swallowed in favor of a
    // generic, user-friendly key.
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
    expect(store.getState().estimateDrawer.saving).toBe(false);
  });

  it('should use generic error when API error has no message', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingUpdateProjectEstimate: {
          errorCode: 'UNKNOWN',
        },
      },
    });

    const store = createTestStore();
    store.dispatch(setHoursValue('20'));

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });

  it('should handle unexpected response shape', async () => {
    mockMutate.mockResolvedValue({ data: {} });

    const store = createTestStore();
    store.dispatch(setHoursValue('20'));

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(success).toBe(false);
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
  });

  it('should handle mutation exception', async () => {
    mockMutate.mockRejectedValue(new Error('Network failure'));

    const store = createTestStore();
    store.dispatch(setHoursValue('20'));

    const { result } = renderHook(() => useUpdateEstimate(), {
      wrapper: createWrapper(store),
    });

    let success = false;
    await act(async () => {
      success = await result.current.updateEstimate({ projectId: 'proj-1' });
    });

    expect(success).toBe(false);
    expect(store.getState().estimateDrawer.saveError).toBe(
      'timeProject.estimate.error.generic',
    );
    expect(store.getState().estimateDrawer.saving).toBe(false);
  });
});
