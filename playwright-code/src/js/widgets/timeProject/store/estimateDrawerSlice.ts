import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  EstimateDrawerSliceState,
  EstimateType,
  ServiceItem,
  ServiceItemEstimateRow,
  TimeProjectRow,
} from '../types';

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

const estimateDrawerSlice = createSlice({
  name: 'estimateDrawer',
  initialState,
  reducers: {
    openEstimateDrawer(
      state,
      action: PayloadAction<{ project: TimeProjectRow; isEdit: boolean }>,
    ) {
      state.drawerOpen = true;
      state.drawerProject = action.payload.project;
      state.isEdit = action.payload.isEdit;
    },
    closeEstimateDrawer(state) {
      state.drawerOpen = false;
      state.drawerProject = null;
      state.isEdit = false;
    },
    setHoursValue(state, action: PayloadAction<string>) {
      state.hoursValue = action.payload;
      state.saveError = null;
    },
    setInputError(state, action: PayloadAction<string | null>) {
      state.inputError = action.payload;
    },
    setEstimateType(state, action: PayloadAction<EstimateType>) {
      state.estimateType = action.payload;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
    setSaveError(state, action: PayloadAction<string | null>) {
      state.saveError = action.payload;
      // Defensive: when SETTING an error (payload !== null), saving is
      // implicitly done — the mutation has resolved unsuccessfully.
      // CRITICAL: do NOT touch `saving` when the payload is `null`.
      // The mutation hooks call `setSaveError(null)` at the start of
      // `saveEstimate`/`updateEstimate` to clear any stale error
      // BEFORE the mutation runs; if that call also reset `saving`
      // we'd wipe out the `setSaving(true)` that was just dispatched
      // and the `SavingOverlay` spinner would never appear.
      if (action.payload !== null) {
        state.saving = false;
      }
    },
    setSaveSuccess(state, action: PayloadAction<boolean>) {
      state.saveSuccess = action.payload;
      if (action.payload) {
        state.saving = false;
      }
    },
    setServiceItems(state, action: PayloadAction<ServiceItem[]>) {
      state.serviceItems = action.payload;
      state.serviceItemsLoading = false;
    },
    appendServiceItems(state, action: PayloadAction<ServiceItem[]>) {
      const existingIds = new Set(state.serviceItems.map((i) => i.id));
      const newItems = action.payload.filter((i) => !existingIds.has(i.id));
      state.serviceItems = [...state.serviceItems, ...newItems];
      state.serviceItemsLoading = false;
    },
    setServiceItemsPageInfo(
      state,
      action: PayloadAction<{ hasMore: boolean; endCursor: string | null }>,
    ) {
      state.serviceItemsHasMore = action.payload.hasMore;
      state.serviceItemsEndCursor = action.payload.endCursor;
    },
    setServiceItemsSearchText(state, action: PayloadAction<string>) {
      state.serviceItemsSearchText = action.payload;
    },
    setServiceItemsLoading(state, action: PayloadAction<boolean>) {
      state.serviceItemsLoading = action.payload;
    },
    setSelectedServiceItemId(state, action: PayloadAction<string>) {
      state.selectedServiceItemId = action.payload;
    },
    setServiceItemHoursValue(state, action: PayloadAction<string>) {
      state.serviceItemHoursValue = action.payload;
      state.serviceItemInputError = null;
    },
    setServiceItemInputError(state, action: PayloadAction<string | null>) {
      state.serviceItemInputError = action.payload;
    },
    addServiceItemRow(state, action: PayloadAction<ServiceItemEstimateRow>) {
      state.serviceItemRows.push(action.payload);
      state.selectedServiceItemId = '';
      state.serviceItemHoursValue = '';
      state.serviceItemInputError = null;
    },
    removeServiceItemRow(state, action: PayloadAction<string>) {
      state.serviceItemRows = state.serviceItemRows.filter(
        (row) => row.serviceItemId !== action.payload,
      );
    },
    updateServiceItemRowHours(
      state,
      action: PayloadAction<{ serviceItemId: string; estimatedHours: number }>,
    ) {
      const row = state.serviceItemRows.find(
        (r) => r.serviceItemId === action.payload.serviceItemId,
      );
      if (row) {
        row.estimatedHours = action.payload.estimatedHours;
      }
    },
    prefillEstimateDrawer(
      state,
      action: PayloadAction<{
        estimateType: EstimateType;
        hoursValue: string;
        serviceItemRows: ServiceItemEstimateRow[];
      }>,
    ) {
      const {
        serviceItems,
        serviceItemsLoading,
        drawerOpen,
        drawerProject,
        isEdit,
        serviceItemsHasMore,
        serviceItemsEndCursor,
        serviceItemsSearchText,
      } = state;
      return {
        ...initialState,
        drawerOpen,
        drawerProject,
        isEdit,
        serviceItems,
        serviceItemsLoading,
        serviceItemsHasMore,
        serviceItemsEndCursor,
        serviceItemsSearchText,
        estimateType: action.payload.estimateType,
        originalEstimateType: action.payload.estimateType,
        hoursValue: action.payload.hoursValue,
        originalHoursValue: action.payload.hoursValue,
        serviceItemRows: action.payload.serviceItemRows,
        originalServiceItemRows: action.payload.serviceItemRows.map((r) => ({
          ...r,
        })),
      };
    },
    resetEstimateDrawer(state) {
      const {
        serviceItems,
        serviceItemsLoading,
        drawerOpen,
        drawerProject,
        isEdit,
        serviceItemsHasMore,
        serviceItemsEndCursor,
        serviceItemsSearchText,
      } = state;
      return {
        ...initialState,
        drawerOpen,
        drawerProject,
        isEdit,
        serviceItems,
        serviceItemsLoading,
        serviceItemsHasMore,
        serviceItemsEndCursor,
        serviceItemsSearchText,
      };
    },
  },
});

export const {
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
} = estimateDrawerSlice.actions;

export const selectIsEstimateDrawerDirty = (state: {
  estimateDrawer: EstimateDrawerSliceState;
}): boolean => {
  const {
    estimateType,
    originalEstimateType,
    hoursValue,
    originalHoursValue,
    serviceItemRows,
    originalServiceItemRows,
  } = state.estimateDrawer;

  // No prefill yet (create flow): treat any user input as dirty
  if (originalEstimateType === null) {
    if (estimateType === EstimateType.TOTAL_HOURS) {
      return hoursValue.trim().length > 0;
    }
    return serviceItemRows.length > 0;
  }

  if (originalEstimateType !== estimateType) return true;

  if (estimateType === EstimateType.TOTAL_HOURS) {
    return originalHoursValue !== hoursValue;
  }

  if (originalServiceItemRows.length !== serviceItemRows.length) return true;
  return serviceItemRows.some((row, i) => {
    const orig = originalServiceItemRows[i];
    return (
      !orig ||
      orig.serviceItemId !== row.serviceItemId ||
      orig.estimatedHours !== row.estimatedHours
    );
  });
};

export default estimateDrawerSlice.reducer;
