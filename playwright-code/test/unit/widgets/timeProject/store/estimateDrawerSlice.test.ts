import reducer, {
  openEstimateDrawer,
  closeEstimateDrawer,
  setHoursValue,
  setInputError,
  setEstimateType,
  setSaving,
  setSaveError,
  setSaveSuccess,
  setServiceItems,
  appendServiceItems,
  setServiceItemsPageInfo,
  setServiceItemsSearchText,
  setServiceItemsLoading,
  setSelectedServiceItemId,
  setServiceItemHoursValue,
  setServiceItemInputError,
  addServiceItemRow,
  removeServiceItemRow,
  updateServiceItemRowHours,
  prefillEstimateDrawer,
  resetEstimateDrawer,
  selectIsEstimateDrawerDirty,
} from 'src/js/widgets/timeProject/store/estimateDrawerSlice';
import {
  EstimateDrawerSliceState,
  EstimateType,
  TimeProjectRow,
} from 'src/js/widgets/timeProject/types';

const mockProject: TimeProjectRow = {
  rowIndex: 0,
  uniqueId: 'proj-1',
  projectId: 'p1',
  projectName: 'Test Project',
  customerId: 'c1',
  customerName: 'Acme',
  status: 'IN_PROGRESS',
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

const initialState: EstimateDrawerSliceState = {
  drawerOpen: false,
  drawerProject: null,
  isEdit: false,
  saving: false,
  saveError: null,
  saveSuccess: false,
  hoursValue: '',
  inputError: null,
  estimateType: EstimateType.TOTAL_HOURS,
  originalEstimateType: null,
  originalHoursValue: '',
  originalServiceItemRows: [],
  serviceItemRows: [],
  selectedServiceItemId: '',
  serviceItemHoursValue: '',
  serviceItemInputError: null,
  serviceItems: [],
  serviceItemsLoading: false,
  serviceItemsHasMore: false,
  serviceItemsEndCursor: null,
  serviceItemsSearchText: '',
};

describe('estimateDrawerSlice', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('should open estimate drawer in create mode', () => {
    const state = reducer(
      initialState,
      openEstimateDrawer({ project: mockProject, isEdit: false }),
    );
    expect(state.drawerOpen).toBe(true);
    expect(state.drawerProject).toEqual(mockProject);
    expect(state.isEdit).toBe(false);
  });

  it('should open estimate drawer in edit mode', () => {
    const state = reducer(
      initialState,
      openEstimateDrawer({ project: mockProject, isEdit: true }),
    );
    expect(state.drawerOpen).toBe(true);
    expect(state.drawerProject).toEqual(mockProject);
    expect(state.isEdit).toBe(true);
  });

  it('should close estimate drawer and reset project/mode', () => {
    const openState = {
      ...initialState,
      drawerOpen: true,
      drawerProject: mockProject,
      isEdit: true,
    };
    const state = reducer(openState, closeEstimateDrawer());
    expect(state.drawerOpen).toBe(false);
    expect(state.drawerProject).toBeNull();
    expect(state.isEdit).toBe(false);
  });

  it('should set hours value and clear saveError', () => {
    const stateWithError = { ...initialState, saveError: 'Some error' };
    const state = reducer(stateWithError, setHoursValue('20'));
    expect(state.hoursValue).toBe('20');
    expect(state.saveError).toBeNull();
  });

  it('should set input error', () => {
    const state = reducer(initialState, setInputError('Required'));
    expect(state.inputError).toBe('Required');
  });

  it('should clear input error', () => {
    const stateWithError = { ...initialState, inputError: 'Required' };
    const state = reducer(stateWithError, setInputError(null));
    expect(state.inputError).toBeNull();
  });

  it('should set estimate type', () => {
    const state = reducer(
      initialState,
      setEstimateType(EstimateType.BY_SERVICE_ITEM),
    );
    expect(state.estimateType).toBe('BY_SERVICE_ITEM');
  });

  it('should set saving', () => {
    const state = reducer(initialState, setSaving(true));
    expect(state.saving).toBe(true);
  });

  it('should set save error and clear saving', () => {
    const savingState = { ...initialState, saving: true };
    const state = reducer(savingState, setSaveError('API error'));
    expect(state.saveError).toBe('API error');
    expect(state.saving).toBe(false);
  });

  it('should set save success and clear saving', () => {
    const savingState = { ...initialState, saving: true };
    const state = reducer(savingState, setSaveSuccess(true));
    expect(state.saveSuccess).toBe(true);
    expect(state.saving).toBe(false);
  });

  it('should set service items and clear loading', () => {
    const loadingState = { ...initialState, serviceItemsLoading: true };
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];
    const state = reducer(loadingState, setServiceItems(items));
    expect(state.serviceItems).toEqual(items);
    expect(state.serviceItemsLoading).toBe(false);
  });

  it('should set service items loading', () => {
    const state = reducer(initialState, setServiceItemsLoading(true));
    expect(state.serviceItemsLoading).toBe(true);
  });

  it('should set selected service item id', () => {
    const state = reducer(initialState, setSelectedServiceItemId('item-1'));
    expect(state.selectedServiceItemId).toBe('item-1');
  });

  it('should set service item hours value and clear error', () => {
    const stateWithError = {
      ...initialState,
      serviceItemInputError: 'some error',
    };
    const state = reducer(stateWithError, setServiceItemHoursValue('10'));
    expect(state.serviceItemHoursValue).toBe('10');
    expect(state.serviceItemInputError).toBeNull();
  });

  it('should set service item input error', () => {
    const state = reducer(initialState, setServiceItemInputError('Not valid'));
    expect(state.serviceItemInputError).toBe('Not valid');
  });

  it('should add service item row and clear input fields', () => {
    const stateWithInput = {
      ...initialState,
      selectedServiceItemId: 'item-1',
      serviceItemHoursValue: '20',
    };
    const row = {
      serviceItemId: 'item-1',
      serviceItemName: 'Design',
      estimatedHours: 20,
    };
    const state = reducer(stateWithInput, addServiceItemRow(row));
    expect(state.serviceItemRows).toHaveLength(1);
    expect(state.serviceItemRows[0]).toEqual(row);
    expect(state.selectedServiceItemId).toBe('');
    expect(state.serviceItemHoursValue).toBe('');
    expect(state.serviceItemInputError).toBeNull();
  });

  it('should remove service item row by id', () => {
    const stateWithRows = {
      ...initialState,
      serviceItemRows: [
        {
          serviceItemId: 'item-1',
          serviceItemName: 'Design',
          estimatedHours: 20,
        },
        {
          serviceItemId: 'item-2',
          serviceItemName: 'Dev',
          estimatedHours: 40,
        },
      ],
    };
    const state = reducer(stateWithRows, removeServiceItemRow('item-1'));
    expect(state.serviceItemRows).toHaveLength(1);
    expect(state.serviceItemRows[0].serviceItemId).toBe('item-2');
  });

  it('should update hours for an existing service item row', () => {
    const stateWithRows = {
      ...initialState,
      serviceItemRows: [
        {
          serviceItemId: 'item-1',
          serviceItemName: 'Design',
          estimatedHours: 20,
        },
        {
          serviceItemId: 'item-2',
          serviceItemName: 'Dev',
          estimatedHours: 40,
        },
      ],
    };
    const state = reducer(
      stateWithRows,
      updateServiceItemRowHours({
        serviceItemId: 'item-1',
        estimatedHours: 35,
      }),
    );
    expect(state.serviceItemRows[0].estimatedHours).toBe(35);
    expect(state.serviceItemRows[1].estimatedHours).toBe(40);
  });

  it('should not change state when updating hours for non-existent row', () => {
    const stateWithRows = {
      ...initialState,
      serviceItemRows: [
        {
          serviceItemId: 'item-1',
          serviceItemName: 'Design',
          estimatedHours: 20,
        },
      ],
    };
    const state = reducer(
      stateWithRows,
      updateServiceItemRowHours({
        serviceItemId: 'item-999',
        estimatedHours: 50,
      }),
    );
    expect(state.serviceItemRows[0].estimatedHours).toBe(20);
  });

  it('should not clear saving when setSaveSuccess is false', () => {
    const savingState = { ...initialState, saving: true };
    const state = reducer(savingState, setSaveSuccess(false));
    expect(state.saveSuccess).toBe(false);
    expect(state.saving).toBe(true);
  });

  it('should append service items without duplicates', () => {
    const stateWithItems = {
      ...initialState,
      serviceItems: [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ],
      serviceItemsLoading: true,
    };
    const state = reducer(
      stateWithItems,
      appendServiceItems([
        { id: '2', name: 'Item 2 dup' },
        { id: '3', name: 'Item 3' },
      ]),
    );
    expect(state.serviceItems).toHaveLength(3);
    expect(state.serviceItems[2]).toEqual({ id: '3', name: 'Item 3' });
    expect(state.serviceItemsLoading).toBe(false);
  });

  it('should set service items page info', () => {
    const state = reducer(
      initialState,
      setServiceItemsPageInfo({ hasMore: true, endCursor: 'cursor-xyz' }),
    );
    expect(state.serviceItemsHasMore).toBe(true);
    expect(state.serviceItemsEndCursor).toBe('cursor-xyz');
  });

  it('should set service items search text', () => {
    const state = reducer(initialState, setServiceItemsSearchText('design'));
    expect(state.serviceItemsSearchText).toBe('design');
  });

  it('should prefill and preserve SFO pagination state', () => {
    const stateWithPagination = {
      ...initialState,
      serviceItems: [{ id: '1', name: 'Item 1' }],
      serviceItemsHasMore: true,
      serviceItemsEndCursor: 'cursor-abc',
      serviceItemsSearchText: 'test',
    };
    const state = reducer(
      stateWithPagination,
      prefillEstimateDrawer({
        estimateType: EstimateType.TOTAL_HOURS,
        hoursValue: '10',
        serviceItemRows: [],
      }),
    );
    expect(state.serviceItemsHasMore).toBe(true);
    expect(state.serviceItemsEndCursor).toBe('cursor-abc');
    expect(state.serviceItemsSearchText).toBe('test');
  });

  it('should reset and preserve SFO pagination state', () => {
    const stateWithPagination: EstimateDrawerSliceState = {
      ...initialState,
      saving: true,
      hoursValue: '50',
      serviceItems: [{ id: '1', name: 'Item 1' }],
      serviceItemsHasMore: true,
      serviceItemsEndCursor: 'cursor-abc',
      serviceItemsSearchText: 'search',
    };
    const state = reducer(stateWithPagination, resetEstimateDrawer());
    expect(state.saving).toBe(false);
    expect(state.hoursValue).toBe('');
    expect(state.serviceItemsHasMore).toBe(true);
    expect(state.serviceItemsEndCursor).toBe('cursor-abc');
    expect(state.serviceItemsSearchText).toBe('search');
  });

  it('should prefill estimate drawer and set originalEstimateType', () => {
    const stateWithItems = {
      ...initialState,
      serviceItems: [{ id: '1', name: 'Item 1' }],
      serviceItemsLoading: false,
    };
    const rows = [
      {
        serviceItemId: 'si-1',
        serviceItemName: 'Design',
        estimatedHours: 10,
      },
    ];
    const state = reducer(
      stateWithItems,
      prefillEstimateDrawer({
        estimateType: EstimateType.BY_SERVICE_ITEM,
        hoursValue: '',
        serviceItemRows: rows,
      }),
    );
    expect(state.estimateType).toBe(EstimateType.BY_SERVICE_ITEM);
    expect(state.originalEstimateType).toBe(EstimateType.BY_SERVICE_ITEM);
    expect(state.hoursValue).toBe('');
    expect(state.serviceItemRows).toEqual(rows);
    expect(state.serviceItems).toEqual([{ id: '1', name: 'Item 1' }]);
    expect(state.saving).toBe(false);
    expect(state.saveError).toBeNull();
  });

  it('should prefill with TOTAL_HOURS and preserve service items', () => {
    const stateWithItems = {
      ...initialState,
      serviceItems: [{ id: '1', name: 'Item 1' }],
    };
    const state = reducer(
      stateWithItems,
      prefillEstimateDrawer({
        estimateType: EstimateType.TOTAL_HOURS,
        hoursValue: '50',
        serviceItemRows: [],
      }),
    );
    expect(state.estimateType).toBe(EstimateType.TOTAL_HOURS);
    expect(state.originalEstimateType).toBe(EstimateType.TOTAL_HOURS);
    expect(state.hoursValue).toBe('50');
    expect(state.serviceItemRows).toEqual([]);
    expect(state.serviceItems).toEqual([{ id: '1', name: 'Item 1' }]);
  });

  it('should reset form state but preserve drawer visibility and service items', () => {
    const cachedItems = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];
    const modifiedState: EstimateDrawerSliceState = {
      drawerOpen: true,
      drawerProject: mockProject,
      isEdit: true,
      saving: true,
      saveError: 'error',
      saveSuccess: true,
      hoursValue: '50',
      inputError: 'bad',
      estimateType: EstimateType.BY_SERVICE_ITEM,
      originalEstimateType: EstimateType.TOTAL_HOURS,
      originalHoursValue: '',
      originalServiceItemRows: [],
      serviceItemRows: [
        {
          serviceItemId: '1',
          serviceItemName: 'Design',
          estimatedHours: 20,
        },
      ],
      selectedServiceItemId: '2',
      serviceItemHoursValue: '30',
      serviceItemInputError: 'err',
      serviceItems: cachedItems,
      serviceItemsLoading: false,
      serviceItemsHasMore: true,
      serviceItemsEndCursor: 'cursor-abc',
      serviceItemsSearchText: 'design',
    };
    const state = reducer(modifiedState, resetEstimateDrawer());
    // Form state is cleared
    expect(state.saving).toBe(false);
    expect(state.hoursValue).toBe('');
    expect(state.serviceItemRows).toEqual([]);
    expect(state.selectedServiceItemId).toBe('');
    expect(state.saveError).toBeNull();
    expect(state.saveSuccess).toBe(false);
    // Drawer visibility is preserved — reset must NOT close the drawer
    expect(state.drawerOpen).toBe(true);
    expect(state.drawerProject).toEqual(mockProject);
    expect(state.isEdit).toBe(true);
    // Service item cache is preserved
    expect(state.serviceItems).toEqual(cachedItems);
    expect(state.serviceItemsLoading).toBe(false);
  });

  it('should prefill and capture originalHoursValue and originalServiceItemRows', () => {
    const rows = [
      { serviceItemId: 'si-1', serviceItemName: 'Design', estimatedHours: 10 },
      { serviceItemId: 'si-2', serviceItemName: 'Dev', estimatedHours: 25 },
    ];
    const state = reducer(
      initialState,
      prefillEstimateDrawer({
        estimateType: EstimateType.BY_SERVICE_ITEM,
        hoursValue: '35',
        serviceItemRows: rows,
      }),
    );
    expect(state.originalHoursValue).toBe('35');
    expect(state.originalServiceItemRows).toEqual(rows);
    expect(state.originalServiceItemRows).not.toBe(rows);
  });

  describe('selectIsEstimateDrawerDirty', () => {
    const baseDrawer = (overrides: Partial<EstimateDrawerSliceState> = {}) => ({
      estimateDrawer: { ...initialState, ...overrides },
    });

    it('returns false on create flow with no input', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({ originalEstimateType: null, hoursValue: '' }),
        ),
      ).toBe(false);
    });

    it('returns true on create flow when hours have value', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({ originalEstimateType: null, hoursValue: '5' }),
        ),
      ).toBe(true);
    });

    it('returns true on create flow when service item rows exist', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: null,
            estimateType: EstimateType.BY_SERVICE_ITEM,
            serviceItemRows: [
              { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 1 },
            ],
          }),
        ),
      ).toBe(true);
    });

    it('returns false in edit flow when nothing changed (TOTAL_HOURS)', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.TOTAL_HOURS,
            estimateType: EstimateType.TOTAL_HOURS,
            originalHoursValue: '10',
            hoursValue: '10',
          }),
        ),
      ).toBe(false);
    });

    it('returns true when hours value changed', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.TOTAL_HOURS,
            estimateType: EstimateType.TOTAL_HOURS,
            originalHoursValue: '10',
            hoursValue: '15',
          }),
        ),
      ).toBe(true);
    });

    it('returns true when estimate type changed', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.TOTAL_HOURS,
            estimateType: EstimateType.BY_SERVICE_ITEM,
          }),
        ),
      ).toBe(true);
    });

    it('returns false when service item rows are unchanged', () => {
      const rows = [
        { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 5 },
      ];
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.BY_SERVICE_ITEM,
            estimateType: EstimateType.BY_SERVICE_ITEM,
            originalServiceItemRows: rows,
            serviceItemRows: rows.map((r) => ({ ...r })),
          }),
        ),
      ).toBe(false);
    });

    it('returns true when a service item row hours value changes', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.BY_SERVICE_ITEM,
            estimateType: EstimateType.BY_SERVICE_ITEM,
            originalServiceItemRows: [
              { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 5 },
            ],
            serviceItemRows: [
              { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 10 },
            ],
          }),
        ),
      ).toBe(true);
    });

    it('returns true when service item row count changes', () => {
      expect(
        selectIsEstimateDrawerDirty(
          baseDrawer({
            originalEstimateType: EstimateType.BY_SERVICE_ITEM,
            estimateType: EstimateType.BY_SERVICE_ITEM,
            originalServiceItemRows: [
              { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 5 },
            ],
            serviceItemRows: [
              { serviceItemId: 'a', serviceItemName: 'A', estimatedHours: 5 },
              { serviceItemId: 'b', serviceItemName: 'B', estimatedHours: 2 },
            ],
          }),
        ),
      ).toBe(true);
    });
  });

  it('should preserve drawer visibility when prefilling estimate drawer', () => {
    const stateWithOpenDrawer = {
      ...initialState,
      drawerOpen: true,
      drawerProject: mockProject,
      isEdit: true,
      serviceItems: [{ id: '1', name: 'Item 1' }],
    };
    const state = reducer(
      stateWithOpenDrawer,
      prefillEstimateDrawer({
        estimateType: EstimateType.TOTAL_HOURS,
        hoursValue: '40',
        serviceItemRows: [],
      }),
    );
    expect(state.drawerOpen).toBe(true);
    expect(state.drawerProject).toEqual(mockProject);
    expect(state.isEdit).toBe(true);
    expect(state.hoursValue).toBe('40');
  });
});
