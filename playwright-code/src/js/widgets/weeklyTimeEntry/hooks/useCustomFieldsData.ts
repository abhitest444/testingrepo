import { useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectCustomFields,
  selectCustomFieldsLoading,
  selectCustomFieldsError,
} from '../store/selectors';
import {
  setCustomFields,
  setCustomFieldsLoading,
  setCustomFieldsError,
} from '../store/customFieldsSlice';
import {
  setTimeEntriesError,
  clearTimeEntriesError,
} from '../store/validationSlice';
import { useGetCustomFields } from '../../../service/hooks/timeEntries/useGetCustomFields';

/**
 * Hook to manage custom fields data fetching and Redux state
 * Handles loading, error states, and data transformation
 * Follows the same pattern as other data fetching hooks to prevent infinite renders
 */
export const useCustomFieldsData = () => {
  const dispatch = useAppDispatch();
  const hasInitializedRef = useRef(false);

  // Get custom fields from Redux store
  const customFields = useAppSelector(selectCustomFields);
  const loading = useAppSelector(selectCustomFieldsLoading);
  const error = useAppSelector(selectCustomFieldsError);

  // Fetch custom fields using the service hook
  const {
    customFields: rawCustomFields,
    loading: fetchLoading,
    error: fetchError,
    query: getCustomFields,
  } = useGetCustomFields();

  // Fetch custom fields when component mounts
  useEffect(() => {
    getCustomFields({
      variables: {
        filter: { deleted: false },
      },
    });
  }, [getCustomFields]);

  // Sync loading state to Redux - only when it changes
  useEffect(() => {
    dispatch(setCustomFieldsLoading(fetchLoading));
  }, [fetchLoading, dispatch]);

  // Sync error state to Redux - only when it changes
  useEffect(() => {
    if (fetchError) {
      dispatch(setCustomFieldsError(fetchError));
      dispatch(setTimeEntriesError(fetchError));
    } else {
      dispatch(setCustomFieldsError(''));
      dispatch(clearTimeEntriesError());
    }
  }, [fetchError, dispatch]);

  // Transform and store custom fields in Redux when they change
  // Only run once when data is first loaded to prevent infinite renders
  useEffect(() => {
    if (
      rawCustomFields &&
      rawCustomFields.length > 0 &&
      !hasInitializedRef.current
    ) {
      // Map GraphQL types to our custom field types
      const mappedCustomFields = rawCustomFields.map((field: any) => ({
        id: field.id,
        name: field.name.trim(),
        type: field.type,
        deleted: field.deleted,
        required: field.required,
        options: field.options || [],
      }));
      dispatch(setCustomFields(mappedCustomFields));
      hasInitializedRef.current = true;
    }
  }, [rawCustomFields, dispatch]);

  // Memoize active custom fields to prevent unnecessary re-renders
  const activeCustomFields = useMemo(
    () => ((customFields as any[]) || []).filter((field) => !field.deleted),
    [customFields],
  );

  return {
    customFields: activeCustomFields,
    loading,
    error,
    getCustomFields,
  };
};
