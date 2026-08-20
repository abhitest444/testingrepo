import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from 'src/js/widgets/timeProject/store/projectsSlice';
import filtersReducer from 'src/js/widgets/timeProject/store/filtersSlice';
import uiReducer from 'src/js/widgets/timeProject/store/uiSlice';
import settingsReducer from 'src/js/widgets/timeProject/store/settingsSlice';
import estimateDrawerReducer, {
  setServiceItems,
} from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import { useCreateEstimate } from 'src/js/widgets/timeProject/hooks/useCreateEstimate';
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

describe('useCreateEstimate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBeNull();
    expect(result.current.saveSuccess).toBe(false);
    expect(result.current.hoursValue).toBe('');
    expect(result.current.inputError).toBeNull();
    expect(result.current.estimateType).toBe('TOTAL_HOURS');
    expect(result.current.serviceItemRows).toEqual([]);
  });

  it('should update hours value via Redux', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('25');
    });

    expect(result.current.hoursValue).toBe('25');
    expect(store.getState().estimateDrawer.hoursValue).toBe('25');
  });

  it('should set validation error for empty value', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      result.current.saveEstimate('proj-1');
    });

    // All hours validation failures collapse to a single user-facing key
    // ("Enter valid hours") so the UI stays consistent regardless of the
    // underlying reason (empty, non-numeric, negative, or above the cap).
    expect(result.current.inputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should set validation error for non-numeric value', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('abc');
    });

    expect(result.current.inputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );
  });

  it('should set validation error for negative value', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('-5');
    });

    expect(result.current.inputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );
  });

  it('should set validation error when value exceeds MAX_ESTIMATE_HOURS', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('1193046.48');
    });

    expect(result.current.inputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );
  });

  it('should accept exactly MAX_ESTIMATE_HOURS as valid', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('1193046.47');
    });

    expect(result.current.inputError).toBeNull();
  });

  it('should clear input error for valid value', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('-5');
    });
    expect(result.current.inputError).not.toBeNull();

    act(() => {
      result.current.updateHoursValue('10');
    });
    expect(result.current.inputError).toBeNull();
  });

  it('should call mutation with correct variables on save (TOTAL_HOURS)', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingCreateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: {
            id: '1',
            projectId: 'proj-1',
            projectEstimateType: 'TOTAL_HOURS',
            totalEstimatedSeconds: 72000,
          },
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('20');
    });

    await act(async () => {
      await result.current.saveEstimate('proj-1');
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            projectEstimateType: 'TOTAL_HOURS',
            totalEstimatedSeconds: 72000,
          },
        },
      }),
    );
    expect(result.current.saveSuccess).toBe(true);
    expect(result.current.saving).toBe(false);
  });

  it('should set save error on API error response', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingCreateProjectEstimate: {
          errorCode: 'INVALID_INPUT',
          message: 'Some API error',
          details: null,
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('20');
    });

    await act(async () => {
      await result.current.saveEstimate('proj-1');
    });

    // Backend error messages are intentionally swallowed in favor of a
    // generic, user-friendly key.
    expect(result.current.saveError).toBe('timeProject.estimate.error.generic');
    expect(result.current.saving).toBe(false);
  });

  it('should set generic error on mutation exception', async () => {
    mockMutate.mockRejectedValue(new Error('Network failure'));

    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('20');
    });

    await act(async () => {
      await result.current.saveEstimate('proj-1');
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBe('timeProject.estimate.error.generic');
  });

  it('should set generic error on unexpected response shape', async () => {
    mockMutate.mockResolvedValue({ data: {} });

    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('20');
    });

    await act(async () => {
      const success = await result.current.saveEstimate('proj-1');
      expect(success).toBe(false);
    });

    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBe('timeProject.estimate.error.generic');
  });

  it('should reset state', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('20');
    });
    expect(result.current.hoursValue).toBe('20');

    act(() => {
      result.current.reset();
    });
    expect(result.current.hoursValue).toBe('');
    expect(result.current.saving).toBe(false);
    expect(result.current.saveError).toBeNull();
  });

  it('should convert hours to seconds correctly (decimal)', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingCreateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: { id: '1', projectId: 'proj-1' },
        },
      },
    });

    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('1.5');
    });

    await act(async () => {
      await result.current.saveEstimate('proj-1');
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            projectEstimateType: 'TOTAL_HOURS',
            totalEstimatedSeconds: 5400,
          },
        },
      }),
    );
  });

  it('should change estimate type', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.changeEstimateType(EstimateType.BY_SERVICE_ITEM);
    });

    expect(result.current.estimateType).toBe(EstimateType.BY_SERVICE_ITEM);
  });

  it('should add service item row', () => {
    const store = createTestStore();
    store.dispatch(
      setServiceItems([
        { id: 'si-1', name: 'Design' },
        { id: 'si-2', name: 'Dev' },
      ]),
    );

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('20');
    });
    act(() => {
      result.current.addServiceItem();
    });

    expect(result.current.serviceItemRows).toHaveLength(1);
    expect(result.current.serviceItemRows[0]).toEqual({
      serviceItemId: 'si-1',
      serviceItemName: 'Design',
      estimatedHours: 20,
    });
    expect(result.current.selectedServiceItemId).toBe('');
    expect(result.current.serviceItemHoursValue).toBe('');
  });

  it('should remove service item row', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('20');
    });
    act(() => {
      result.current.addServiceItem();
    });
    expect(result.current.serviceItemRows).toHaveLength(1);

    act(() => {
      result.current.removeServiceItem('si-1');
    });
    expect(result.current.serviceItemRows).toHaveLength(0);
  });

  it('should save with BY_FIELD_OPTION when estimate type is BY_SERVICE_ITEM', async () => {
    mockMutate.mockResolvedValue({
      data: {
        timeTrackingCreateProjectEstimate: {
          successCode: 'SUCCESS',
          projectEstimate: {
            id: '1',
            projectId: 'proj-1',
            projectEstimateType: 'BY_FIELD_OPTION',
          },
        },
      },
    });

    const store = createTestStore();
    store.dispatch(
      setServiceItems([
        { id: 'si-1', name: 'Design' },
        { id: 'si-2', name: 'Dev' },
      ]),
    );

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.changeEstimateType(EstimateType.BY_SERVICE_ITEM);
    });
    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('10');
    });
    act(() => {
      result.current.addServiceItem();
    });
    act(() => {
      result.current.updateSelectedServiceItem('si-2');
    });
    act(() => {
      result.current.updateServiceItemHours('20');
    });
    act(() => {
      result.current.addServiceItem();
    });

    await act(async () => {
      const success = await result.current.saveEstimate('proj-1');
      expect(success).toBe(true);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            projectId: 'proj-1',
            projectEstimateType: 'BY_FIELD_OPTION',
            fieldType: 'STANDARD_FIELD',
            fieldRef: 'SERVICE_ITEM',
            fieldOptionEstimates: [
              { fieldOptionId: 'si-1', estimatedSeconds: 36000 },
              { fieldOptionId: 'si-2', estimatedSeconds: 72000 },
            ],
          },
        },
      }),
    );
  });

  it('should fail save when BY_SERVICE_ITEM has no rows', async () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.changeEstimateType(EstimateType.BY_SERVICE_ITEM);
    });

    await act(async () => {
      const success = await result.current.saveEstimate('proj-1');
      expect(success).toBe(false);
    });

    expect(result.current.saveError).toBe(
      'timeProject.estimate.validation.serviceItemRequired',
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should validate service item hours input', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    // Service-item hours validation also collapses to the unified
    // "invalidHours" key for every failure mode.
    act(() => {
      result.current.updateServiceItemHours('abc');
    });
    expect(result.current.serviceItemInputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );

    act(() => {
      result.current.updateServiceItemHours('-5');
    });
    expect(result.current.serviceItemInputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );

    act(() => {
      result.current.updateServiceItemHours('1193046.48');
    });
    expect(result.current.serviceItemInputError).toBe(
      'timeProject.estimate.validation.invalidHours',
    );

    act(() => {
      result.current.updateServiceItemHours('10');
    });
    expect(result.current.serviceItemInputError).toBeNull();
  });

  it('should not add service item when hours are invalid', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('abc');
    });
    act(() => {
      result.current.addServiceItem();
    });

    expect(result.current.serviceItemRows).toHaveLength(0);
  });

  it('should not add service item when no item selected', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateServiceItemHours('10');
    });
    act(() => {
      result.current.addServiceItem();
    });

    expect(result.current.serviceItemRows).toHaveLength(0);
  });

  it('should not add service item when item not found in service items list', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSelectedServiceItem('si-999');
    });
    act(() => {
      result.current.updateServiceItemHours('10');
    });
    act(() => {
      result.current.addServiceItem();
    });

    expect(result.current.serviceItemRows).toHaveLength(0);
  });

  it('should edit service item hours via editServiceItemHours', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('10');
    });
    act(() => {
      result.current.addServiceItem();
    });
    expect(result.current.serviceItemRows[0].estimatedHours).toBe(10);

    act(() => {
      result.current.editServiceItemHours('si-1', 25);
    });
    expect(result.current.serviceItemRows[0].estimatedHours).toBe(25);
  });

  it('should prefill with TOTAL_HOURS estimate data', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.prefill({
        budgetHoursTotal: 20,
        budgetHoursRemaining: 10,
        elapsedSeconds: 36000,
        totalEstimatedSeconds: 72000,
        projectEstimateType: 'TOTAL_HOURS',
      });
    });

    expect(result.current.estimateType).toBe(EstimateType.TOTAL_HOURS);
    expect(result.current.hoursValue).toBe('20');
    expect(result.current.serviceItemRows).toEqual([]);
    expect(result.current.originalEstimateType).toBe(EstimateType.TOTAL_HOURS);
  });

  it('should prefill with BY_FIELD_OPTION estimate data', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.prefill({
        budgetHoursTotal: 15,
        budgetHoursRemaining: 5,
        elapsedSeconds: 36000,
        totalEstimatedSeconds: 54000,
        projectEstimateType: 'BY_FIELD_OPTION',
        fieldType: 'STANDARD_FIELD',
        fieldRef: 'SERVICE_ITEM',
        estimateItems: [
          {
            fieldOptionId: 'si-1',
            estimatedHours: 5,
            elapsedSeconds: 0,
            serviceItemName: 'Design',
          },
          {
            fieldOptionId: 'si-2',
            estimatedHours: 10,
            elapsedSeconds: 0,
            serviceItemName: 'Dev',
          },
        ],
      });
    });

    expect(result.current.estimateType).toBe(EstimateType.BY_SERVICE_ITEM);
    expect(result.current.hoursValue).toBe('');
    expect(result.current.serviceItemRows).toEqual([
      { serviceItemId: 'si-1', serviceItemName: 'Design', estimatedHours: 5 },
      { serviceItemId: 'si-2', serviceItemName: 'Dev', estimatedHours: 10 },
    ]);
    expect(result.current.originalEstimateType).toBe(
      EstimateType.BY_SERVICE_ITEM,
    );
  });

  it('omits unestimated service items (estimatedHours: -1) from the drawer rows', () => {
    // Service items with estimatedSeconds: -1 surface in the main summary
    // table as a dash but should NOT seed the create/edit drawer. They are
    // re-addable from the service-item picker if the user wants to set an
    // estimate.
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.prefill({
        budgetHoursTotal: 5,
        budgetHoursRemaining: 5,
        elapsedSeconds: 0,
        totalEstimatedSeconds: 18000,
        projectEstimateType: 'BY_FIELD_OPTION',
        fieldType: 'STANDARD_FIELD',
        fieldRef: 'SERVICE_ITEM',
        estimateItems: [
          {
            fieldOptionId: 'si-est',
            estimatedHours: 5,
            elapsedSeconds: 0,
            serviceItemName: 'Design',
          },
          {
            fieldOptionId: 'si-unest',
            estimatedHours: -1,
            elapsedSeconds: 3600,
            serviceItemName: 'Dev',
          },
        ],
      });
    });

    expect(result.current.serviceItemRows).toEqual([
      { serviceItemId: 'si-est', serviceItemName: 'Design', estimatedHours: 5 },
    ]);
  });

  it('should detect type change with hasTypeChanged', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.hasTypeChanged()).toBe(false);

    act(() => {
      result.current.prefill({
        budgetHoursTotal: 20,
        budgetHoursRemaining: 10,
        elapsedSeconds: 36000,
        totalEstimatedSeconds: 72000,
        projectEstimateType: 'TOTAL_HOURS',
      });
    });

    expect(result.current.hasTypeChanged()).toBe(false);

    act(() => {
      result.current.changeEstimateType(EstimateType.BY_SERVICE_ITEM);
    });

    expect(result.current.hasTypeChanged()).toBe(true);
  });

  it('should clear input error when clearing hours value', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateHoursValue('abc');
    });
    expect(result.current.inputError).not.toBeNull();

    act(() => {
      result.current.updateHoursValue('');
    });
    expect(result.current.inputError).toBeNull();
  });

  it('should clear service item input error when clearing hours', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.updateServiceItemHours('abc');
    });
    expect(result.current.serviceItemInputError).not.toBeNull();

    act(() => {
      result.current.updateServiceItemHours('');
    });
    expect(result.current.serviceItemInputError).toBeNull();
  });

  it('should validate BY_SERVICE_ITEM with rows returns true', () => {
    const store = createTestStore();
    store.dispatch(setServiceItems([{ id: 'si-1', name: 'Design' }]));

    const { result } = renderHook(() => useCreateEstimate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.changeEstimateType(EstimateType.BY_SERVICE_ITEM);
    });
    act(() => {
      result.current.updateSelectedServiceItem('si-1');
    });
    act(() => {
      result.current.updateServiceItemHours('10');
    });
    act(() => {
      result.current.addServiceItem();
    });

    let valid = false;
    act(() => {
      valid = result.current.validateBeforeSave();
    });
    expect(valid).toBe(true);
  });
});
