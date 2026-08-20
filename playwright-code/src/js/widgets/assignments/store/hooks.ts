import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from './index';
import {
  selectAllWorkers,
  selectFilteredWorkers,
  selectActiveWorkers,
  selectInactiveWorkers,
  selectSelectedWorkers,
  selectSelectedWorkerIds,
  selectFilters,
  selectLoading,
  selectError,
  selectShowInactiveWorkers,
  selectWorkersCount,
  selectFilteredWorkersCount,
  selectSelectedWorkersCount,
  setWorkers,
  addWorker,
  updateWorker,
  removeWorker,
  setSelectedWorkers,
  toggleWorkerSelection,
  clearSelectedWorkers,
  setSearchText,
  setWorkerStatus,
  setRoleFilter,
  clearFilters,
  toggleShowInactiveWorkers,
  setShowInactiveWorkers,
  setLoading,
  setError,
  clearError,
  Worker,
} from './workerSlice';
import {
  selectIsAssignmentDrawerOpen,
  selectAssignmentDrawerType,
  selectSelectedAssignmentId,
  selectDeleteModalOpen,
  selectBulkDeleteModalOpen,
  selectConfirmationModalOpen,
  selectIsFilterPanelOpen,
  selectPageMessage,
  selectUnsavedChangesModal,
  selectIsDataGridLoading,
  selectBulkActionMode,
  openAssignmentDrawer,
  closeAssignmentDrawer,
  setDeleteModalOpen,
  setBulkDeleteModalOpen,
  setConfirmationModalOpen,
  toggleFilterPanel,
  setFilterPanelOpen,
  setPageMessage,
  clearPageMessage,
  showSuccessMessage,
  showErrorMessage,
  showWarningMessage,
  openUnsavedChangesModal,
  closeUnsavedChangesModal,
  setDataGridLoading,
  setBulkActionMode,
  toggleBulkActionMode,
  resetUIState,
  AssignmentDrawerType,
  PageMessage,
} from './uiSlice';
import {
  selectAllGroups,
  selectGroupsLoading,
  selectGroupsError,
  selectGroupsCount,
  selectGroupsTotalCount,
  selectGroupsCursor,
  selectHasMoreGroups,
  selectIsLoadingMoreGroups,
  selectWorkersByGroup,
  selectExpandedGroupIds,
} from './groupViewSelectors';

/**
 * Typed hooks for Redux store
 * Use throughout the assignments widget instead of plain `useDispatch` and `useSelector`
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook for managing workers state
 */
export const useWorkers = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const allWorkers = useAppSelector(selectAllWorkers);
  const filteredWorkers = useAppSelector(selectFilteredWorkers);
  const activeWorkers = useAppSelector(selectActiveWorkers);
  const inactiveWorkers = useAppSelector(selectInactiveWorkers);
  const selectedWorkers = useAppSelector(selectSelectedWorkers);
  const selectedWorkerIds = useAppSelector(selectSelectedWorkerIds);
  const filters = useAppSelector(selectFilters);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const showInactiveWorkers = useAppSelector(selectShowInactiveWorkers);
  const workersCount = useAppSelector(selectWorkersCount);
  const filteredWorkersCount = useAppSelector(selectFilteredWorkersCount);
  const selectedWorkersCount = useAppSelector(selectSelectedWorkersCount);

  // Actions
  const setWorkersAction = useCallback(
    (workers: Worker[]) => dispatch(setWorkers(workers)),
    [dispatch],
  );

  const addWorkerAction = useCallback(
    (worker: Worker) => dispatch(addWorker(worker)),
    [dispatch],
  );

  const updateWorkerAction = useCallback(
    (id: string, changes: Partial<Worker>) =>
      dispatch(updateWorker({ id, changes })),
    [dispatch],
  );

  const removeWorkerAction = useCallback(
    (id: string) => dispatch(removeWorker(id)),
    [dispatch],
  );

  const setSelectedWorkersAction = useCallback(
    (workerIds: string[]) => dispatch(setSelectedWorkers(workerIds)),
    [dispatch],
  );

  const toggleWorkerSelectionAction = useCallback(
    (workerId: string) => dispatch(toggleWorkerSelection(workerId)),
    [dispatch],
  );

  const clearSelectedWorkersAction = useCallback(
    () => dispatch(clearSelectedWorkers()),
    [dispatch],
  );

  const setSearchTextAction = useCallback(
    (text: string) => dispatch(setSearchText(text)),
    [dispatch],
  );

  const setWorkerStatusAction = useCallback(
    (status: 'all' | 'active' | 'inactive') =>
      dispatch(setWorkerStatus(status)),
    [dispatch],
  );

  const setRoleFilterAction = useCallback(
    (roles: string[]) => dispatch(setRoleFilter(roles)),
    [dispatch],
  );

  const clearFiltersAction = useCallback(
    () => dispatch(clearFilters()),
    [dispatch],
  );

  const toggleShowInactiveWorkersAction = useCallback(
    () => dispatch(toggleShowInactiveWorkers()),
    [dispatch],
  );

  const setShowInactiveWorkersAction = useCallback(
    (show: boolean) => dispatch(setShowInactiveWorkers(show)),
    [dispatch],
  );

  const setLoadingAction = useCallback(
    (isLoading: boolean) => dispatch(setLoading(isLoading)),
    [dispatch],
  );

  const setErrorAction = useCallback(
    (errorMessage: string | null) => dispatch(setError(errorMessage)),
    [dispatch],
  );

  const clearErrorAction = useCallback(
    () => dispatch(clearError()),
    [dispatch],
  );

  return {
    // State
    allWorkers,
    filteredWorkers,
    activeWorkers,
    inactiveWorkers,
    selectedWorkers,
    selectedWorkerIds,
    filters,
    loading,
    error,
    showInactiveWorkers,
    workersCount,
    filteredWorkersCount,
    selectedWorkersCount,

    // Actions
    setWorkers: setWorkersAction,
    addWorker: addWorkerAction,
    updateWorker: updateWorkerAction,
    removeWorker: removeWorkerAction,
    setSelectedWorkers: setSelectedWorkersAction,
    toggleWorkerSelection: toggleWorkerSelectionAction,
    clearSelectedWorkers: clearSelectedWorkersAction,
    setSearchText: setSearchTextAction,
    setWorkerStatus: setWorkerStatusAction,
    setRoleFilter: setRoleFilterAction,
    clearFilters: clearFiltersAction,
    toggleShowInactiveWorkers: toggleShowInactiveWorkersAction,
    setShowInactiveWorkers: setShowInactiveWorkersAction,
    setLoading: setLoadingAction,
    setError: setErrorAction,
    clearError: clearErrorAction,
  };
};

/**
 * Hook for managing UI state
 */
export const useAssignmentsUI = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const isAssignmentDrawerOpen = useAppSelector(selectIsAssignmentDrawerOpen);
  const assignmentDrawerType = useAppSelector(selectAssignmentDrawerType);
  const selectedAssignmentId = useAppSelector(selectSelectedAssignmentId);
  const deleteModalOpen = useAppSelector(selectDeleteModalOpen);
  const bulkDeleteModalOpen = useAppSelector(selectBulkDeleteModalOpen);
  const confirmationModalOpen = useAppSelector(selectConfirmationModalOpen);
  const isFilterPanelOpen = useAppSelector(selectIsFilterPanelOpen);
  const pageMessage = useAppSelector(selectPageMessage);
  const unsavedChangesModal = useAppSelector(selectUnsavedChangesModal);
  const isDataGridLoading = useAppSelector(selectIsDataGridLoading);
  const bulkActionMode = useAppSelector(selectBulkActionMode);

  // Actions
  const openAssignmentDrawerAction = useCallback(
    (type: AssignmentDrawerType, assignmentId?: string) =>
      dispatch(openAssignmentDrawer({ type, assignmentId })),
    [dispatch],
  );

  const closeAssignmentDrawerAction = useCallback(
    () => dispatch(closeAssignmentDrawer()),
    [dispatch],
  );

  const setDeleteModalOpenAction = useCallback(
    (open: boolean) => dispatch(setDeleteModalOpen(open)),
    [dispatch],
  );

  const setBulkDeleteModalOpenAction = useCallback(
    (open: boolean) => dispatch(setBulkDeleteModalOpen(open)),
    [dispatch],
  );

  const setConfirmationModalOpenAction = useCallback(
    (open: boolean) => dispatch(setConfirmationModalOpen(open)),
    [dispatch],
  );

  const toggleFilterPanelAction = useCallback(
    () => dispatch(toggleFilterPanel()),
    [dispatch],
  );

  const setFilterPanelOpenAction = useCallback(
    (open: boolean) => dispatch(setFilterPanelOpen(open)),
    [dispatch],
  );

  const setPageMessageAction = useCallback(
    (message: PageMessage) => dispatch(setPageMessage(message)),
    [dispatch],
  );

  const clearPageMessageAction = useCallback(
    () => dispatch(clearPageMessage()),
    [dispatch],
  );

  const showSuccessMessageAction = useCallback(
    (message: string, title?: string, titleNlsKey?: string) =>
      dispatch(showSuccessMessage({ message, title, titleNlsKey })),
    [dispatch],
  );

  const showErrorMessageAction = useCallback(
    (message: string, title?: string, titleNlsKey?: string, code?: string) =>
      dispatch(showErrorMessage({ message, title, titleNlsKey, code })),
    [dispatch],
  );

  const showWarningMessageAction = useCallback(
    (message: string, title?: string, titleNlsKey?: string) =>
      dispatch(showWarningMessage({ message, title, titleNlsKey })),
    [dispatch],
  );

  const openUnsavedChangesModalAction = useCallback(
    (actionType: string) => dispatch(openUnsavedChangesModal(actionType)),
    [dispatch],
  );

  const closeUnsavedChangesModalAction = useCallback(
    () => dispatch(closeUnsavedChangesModal()),
    [dispatch],
  );

  const setDataGridLoadingAction = useCallback(
    (loading: boolean) => dispatch(setDataGridLoading(loading)),
    [dispatch],
  );

  const setBulkActionModeAction = useCallback(
    (mode: boolean) => dispatch(setBulkActionMode(mode)),
    [dispatch],
  );

  const toggleBulkActionModeAction = useCallback(
    () => dispatch(toggleBulkActionMode()),
    [dispatch],
  );

  const resetUIStateAction = useCallback(
    () => dispatch(resetUIState()),
    [dispatch],
  );

  return {
    // State
    isAssignmentDrawerOpen,
    assignmentDrawerType,
    selectedAssignmentId,
    deleteModalOpen,
    bulkDeleteModalOpen,
    confirmationModalOpen,
    isFilterPanelOpen,
    pageMessage,
    unsavedChangesModal,
    isDataGridLoading,
    bulkActionMode,

    // Actions
    openAssignmentDrawer: openAssignmentDrawerAction,
    closeAssignmentDrawer: closeAssignmentDrawerAction,
    setDeleteModalOpen: setDeleteModalOpenAction,
    setBulkDeleteModalOpen: setBulkDeleteModalOpenAction,
    setConfirmationModalOpen: setConfirmationModalOpenAction,
    toggleFilterPanel: toggleFilterPanelAction,
    setFilterPanelOpen: setFilterPanelOpenAction,
    setPageMessage: setPageMessageAction,
    clearPageMessage: clearPageMessageAction,
    showSuccessMessage: showSuccessMessageAction,
    showErrorMessage: showErrorMessageAction,
    showWarningMessage: showWarningMessageAction,
    openUnsavedChangesModal: openUnsavedChangesModalAction,
    closeUnsavedChangesModal: closeUnsavedChangesModalAction,
    setDataGridLoading: setDataGridLoadingAction,
    setBulkActionMode: setBulkActionModeAction,
    toggleBulkActionMode: toggleBulkActionModeAction,
    resetUIState: resetUIStateAction,
  };
};

/**
 * Hook for accessing workers group view state
 * SLICE 3: Added workers and expansion state
 */
export const useWorkersGroupView = () => {
  const groups = useAppSelector(selectAllGroups);
  const groupsLoading = useAppSelector(selectGroupsLoading);
  const groupsError = useAppSelector(selectGroupsError);
  const groupsCount = useAppSelector(selectGroupsCount); // Header count
  const groupsTotalCount = useAppSelector(selectGroupsTotalCount); // Total count for pagination
  const groupsCursor = useAppSelector(selectGroupsCursor);
  const hasMoreGroups = useAppSelector(selectHasMoreGroups);
  const isLoadingMoreGroups = useAppSelector(selectIsLoadingMoreGroups);

  // SLICE 3: Workers state
  const workersByGroup = useAppSelector(selectWorkersByGroup);
  const expandedGroupIds = useAppSelector(selectExpandedGroupIds);

  return {
    groups,
    groupsLoading,
    groupsError,
    groupsCount,
    groupsTotalCount,
    groupsCursor,
    hasMoreGroups,
    isLoadingMoreGroups,
    // SLICE 3: Workers
    workersByGroup,
    expandedGroupIds,
  };
};

/**
 * Hook for managing workers list state (flat list view)
 */
export const useWorkersListState = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const workers = useAppSelector((state) => state.workersList.workers);
  const pageInfo = useAppSelector((state) => state.workersList.pageInfo);
  const loading = useAppSelector((state) => state.workersList.loading);
  const error = useAppSelector((state) => state.workersList.error);
  const workersCount = useAppSelector(
    (state) => state.workersList.workers.length,
  );
  const currentPage = useAppSelector((state) => state.workersList.currentPage);

  return {
    workers,
    pageInfo,
    loading,
    error,
    workersCount,
    currentPage,
    dispatch,
  };
};
