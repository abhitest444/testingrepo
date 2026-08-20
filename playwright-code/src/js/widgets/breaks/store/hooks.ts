import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from './index';
import {
  selectBreakRules,
  selectBreakRuleById,
  selectBreakRulesLoading,
  selectBreakRulesError,
  selectBreakRulesCreateLoading,
  selectBreakRulesCreateError,
  selectBreakRulesUpdateLoading,
  selectBreakRulesUpdateError,
  selectBreakRulesDeleteLoading,
  selectBreakRulesDeleteError,
  addRule,
  updateRule,
  removeRule,
} from './breakRulesSlice';
import {
  selectTeamMembers,
  selectTotalTeamMembersCount,
  setTeamMembers,
} from './workerSlice';

import {
  selectFormData,
  selectIsFormOpen,
  selectIsEditing,
  selectEditingId,
  selectFormLoading,
  selectFormError,
  selectShowAssignTeamMembers,
  selectFormIsDirty,
  selectFormIsValid,
  selectValidationErrors,
  selectHasValidationErrors,
  setFormData,
  resetFormData,
  initializeFormData,
  setFormValid,
  setValidationErrors,
  clearValidationErrors,
  setFieldValidationError,
  openForm,
  closeForm,
  setLoading,
  setError,
  setShowAssignTeamMembers,
  updateBreakName,
  updateBreakDuration,
  updateDurationUnit,
  updateBreakType,
  updateAllowAuto,
  updateAllowManual,
  updateNoSetDuration,
  resetDuration,
} from './breakPolicyFormSlice';
import {
  selectBreaksByAssignee,
  selectBreaksForAssignee,
  selectFilteredBreaksForAssignee,
  selectBreaksByAssigneeLoading,
  selectBreaksByAssigneeError,
  setFilteredBreaksByAssignee,
} from './quickfillsSlice';
import { BreakRule, TeamMember } from '../types';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useBreaks = () => {
  const dispatch = useAppDispatch();

  // Memoize selectors
  const breakRules = useAppSelector(selectBreakRules);
  const loading = useAppSelector(selectBreakRulesLoading);
  const error = useAppSelector(selectBreakRulesError);
  const createLoading = useAppSelector(selectBreakRulesCreateLoading);
  const createError = useAppSelector(selectBreakRulesCreateError);
  const updateLoading = useAppSelector(selectBreakRulesUpdateLoading);
  const updateError = useAppSelector(selectBreakRulesUpdateError);
  const deleteLoading = useAppSelector(selectBreakRulesDeleteLoading);
  const deleteError = useAppSelector(selectBreakRulesDeleteError);
  const assignments: Record<string, string[]> = {};
  const teamMembers = useAppSelector(selectTeamMembers);
  const totalTeamMembersCount = useAppSelector(selectTotalTeamMembersCount);

  // Memoize actions
  const addBreakRule = useCallback(
    (rule: BreakRule) => dispatch(addRule(rule)),
    [dispatch],
  );
  const updateBreakRule = useCallback(
    (rule: BreakRule) => dispatch(updateRule(rule)),
    [dispatch],
  );
  const removeBreakRule = useCallback(
    (id: string) => dispatch(removeRule(id)),
    [dispatch],
  );

  const setTeamMembersAction = useCallback(
    (members: TeamMember[]) => dispatch(setTeamMembers(members)),
    [dispatch],
  );

  // Memoize getters
  const getBreakRules = useCallback(() => breakRules, [breakRules]);
  const getBreakRuleById = useCallback(
    (id: string) => breakRules.find((rule) => rule.id === id),
    [breakRules],
  );

  // Create memoized selectors for each break rule ID
  const getAssignments = useCallback(
    (breakRuleId: string) => {
      const memberIds =
        (assignments as Record<string, string[]>)[breakRuleId] || [];
      return teamMembers.filter((member) => memberIds.includes(member.id));
    },
    [assignments, teamMembers],
  );

  const getSelectedCount = useCallback(
    (breakRuleId: string) => {
      const assignedMembers =
        (assignments as Record<string, string[]>)[breakRuleId] || [];
      return assignedMembers.length > 0
        ? assignedMembers.length
        : totalTeamMembersCount;
    },
    [assignments, totalTeamMembersCount],
  );

  return {
    breakRules,
    loading,
    error,
    createLoading,
    createError,
    updateLoading,
    updateError,
    deleteLoading,
    deleteError,
    assignments,
    teamMembers,
    totalTeamMembersCount,
    addBreakRule,
    updateBreakRule,
    removeBreakRule,
    setTeamMembers: setTeamMembersAction,
    getBreakRules,
    getBreakRuleById,
    getAssignments,
    getSelectedCount,
  };
};

export const useBreakPolicyForm = () => {
  const dispatch = useAppDispatch();

  // Memoize selectors
  const formData = useAppSelector(selectFormData);
  const isFormOpen = useAppSelector(selectIsFormOpen);
  const isEditing = useAppSelector(selectIsEditing);
  const editingId = useAppSelector(selectEditingId);
  const loading = useAppSelector(selectFormLoading);
  const error = useAppSelector(selectFormError);
  const showAssignTeamMembers = useAppSelector(selectShowAssignTeamMembers);
  const isDirty = useAppSelector(selectFormIsDirty);
  const isValid = useAppSelector(selectFormIsValid);
  const validationErrors = useAppSelector(selectValidationErrors);
  const hasValidationErrors = useAppSelector(selectHasValidationErrors);

  // Memoize actions
  const setFormDataAction = useCallback(
    (data: Partial<any>) => dispatch(setFormData(data)),
    [dispatch],
  );
  const resetFormDataAction = useCallback(
    () => dispatch(resetFormData()),
    [dispatch],
  );
  const initializeFormDataAction = useCallback(
    (data: Partial<any>) => dispatch(initializeFormData(data)),
    [dispatch],
  );
  const setFormValidAction = useCallback(
    (valid: boolean) => dispatch(setFormValid(valid)),
    [dispatch],
  );
  const openFormAction = useCallback(
    (options: { isEditing?: boolean; editingId?: string }) =>
      dispatch(openForm(options)),
    [dispatch],
  );
  const closeFormAction = useCallback(() => dispatch(closeForm()), [dispatch]);
  const setLoadingAction = useCallback(
    (loading: boolean) => dispatch(setLoading(loading)),
    [dispatch],
  );
  const setErrorAction = useCallback(
    (error: string | null) => dispatch(setError(error)),
    [dispatch],
  );
  const setShowAssignTeamMembersAction = useCallback(
    (show: boolean) => dispatch(setShowAssignTeamMembers(show)),
    [dispatch],
  );
  const setValidationErrorsAction = useCallback(
    (errors: Record<string, string>) => dispatch(setValidationErrors(errors)),
    [dispatch],
  );
  const clearValidationErrorsAction = useCallback(
    () => dispatch(clearValidationErrors()),
    [dispatch],
  );
  const setFieldValidationErrorAction = useCallback(
    (field: string, error: string) =>
      dispatch(setFieldValidationError({ field: field as any, error })),
    [dispatch],
  );

  // Field update actions
  const updateBreakNameAction = useCallback(
    (name: string) => dispatch(updateBreakName(name)),
    [dispatch],
  );
  const updateBreakDurationAction = useCallback(
    (duration: number) => dispatch(updateBreakDuration(duration)),
    [dispatch],
  );
  const updateDurationUnitAction = useCallback(
    (unit: any) => dispatch(updateDurationUnit(unit)),
    [dispatch],
  );
  const updateBreakTypeAction = useCallback(
    (type: any) => dispatch(updateBreakType(type)),
    [dispatch],
  );
  const updateAllowAutoAction = useCallback(
    (allow: boolean) => dispatch(updateAllowAuto(allow)),
    [dispatch],
  );
  const updateAllowManualAction = useCallback(
    (allow: boolean) => dispatch(updateAllowManual(allow)),
    [dispatch],
  );
  const updateNoSetDurationAction = useCallback(
    (noSet: boolean) => dispatch(updateNoSetDuration(noSet)),
    [dispatch],
  );
  const resetDurationAction = useCallback(
    () => dispatch(resetDuration()),
    [dispatch],
  );

  return {
    formData,
    isFormOpen,
    isEditing,
    editingId,
    loading,
    error,
    showAssignTeamMembers,
    isDirty,
    isValid,
    validationErrors,
    hasValidationErrors,
    setFormData: setFormDataAction,
    resetFormData: resetFormDataAction,
    initializeFormData: initializeFormDataAction,
    setFormValid: setFormValidAction,
    openForm: openFormAction,
    closeForm: closeFormAction,
    setLoading: setLoadingAction,
    setError: setErrorAction,
    setShowAssignTeamMembers: setShowAssignTeamMembersAction,
    updateBreakName: updateBreakNameAction,
    updateBreakDuration: updateBreakDurationAction,
    updateDurationUnit: updateDurationUnitAction,
    updateBreakType: updateBreakTypeAction,
    updateAllowAuto: updateAllowAutoAction,
    updateAllowManual: updateAllowManualAction,
    updateNoSetDuration: updateNoSetDurationAction,
    resetDuration: resetDurationAction,
    setValidationErrors: setValidationErrorsAction,
    clearValidationErrors: clearValidationErrorsAction,
    setFieldValidationError: setFieldValidationErrorAction,
  };
};

export const useQuickfills = () => {
  const dispatch = useAppDispatch();

  // Memoize selectors
  const breaksByAssignee = useAppSelector(selectBreaksByAssignee);

  // Memoize getters
  const getBreaksForAssignee = useCallback(
    (assigneeId: string) => {
      const state = { quickfills: { breaksByAssignee } };
      return selectBreaksForAssignee(state, assigneeId);
    },
    [breaksByAssignee],
  );

  const getFilteredBreaksForAssignee = useCallback(
    (assigneeId: string) => {
      const state = { quickfills: { breaksByAssignee } };
      return selectFilteredBreaksForAssignee(state, assigneeId);
    },
    [breaksByAssignee],
  );

  const getBreaksByAssigneeLoading = useCallback(
    (assigneeId: string) => {
      const state = { quickfills: { breaksByAssignee } };
      return selectBreaksByAssigneeLoading(state, assigneeId);
    },
    [breaksByAssignee],
  );

  const getBreaksByAssigneeError = useCallback(
    (assigneeId: string) => {
      const state = { quickfills: { breaksByAssignee } };
      return selectBreaksByAssigneeError(state, assigneeId);
    },
    [breaksByAssignee],
  );

  // Memoize actions
  const setFilteredBreaksByAssigneeAction = useCallback(
    (assigneeId: string, filteredBreaks?: BreakRule[]) =>
      dispatch(
        setFilteredBreaksByAssignee({
          assigneeId,
          filteredBreaks: filteredBreaks || [],
        }),
      ),
    [dispatch],
  );

  return {
    breaksByAssignee,
    getBreaksForAssignee,
    getFilteredBreaksForAssignee,
    getBreaksByAssigneeLoading,
    getBreaksByAssigneeError,
    setFilteredBreaksByAssignee: setFilteredBreaksByAssigneeAction,
  };
};
