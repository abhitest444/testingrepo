import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { populateRowDates } from '../store/timeEntryGridSlice';
import { selectDateRange } from '../store/selectors';
import { useBreaksDataFetching } from './useBreaksDataFetching';
import { useCustomFieldsData } from './useCustomFieldsData';

/**
 * Grid initialization hook for breaks data and custom fields.
 * Customer data is fetched on demand via GraphQL in WeeklySuperSearch.
 * This hook should be called after useCombinedDataFetching has completed.
 */
export const useGridInitialization = () => {
  const dispatch = useAppDispatch();
  const dateRange = useAppSelector(selectDateRange);
  const hasInitializedRef = useRef(false);

  const { loading: breaksDataLoading } = useBreaksDataFetching();

  // Initialize custom fields data
  const { loading: customFieldsLoading } = useCustomFieldsData();

  // Combined loading state
  const isLoading = breaksDataLoading || customFieldsLoading;

  // Handle grid initialization
  useEffect(() => {
    // Only run initialization once
    if (hasInitializedRef.current) return;

    const initializeGrid = () => {
      // Populate row dates when date range is available
      if (dateRange.start) {
        dispatch(populateRowDates({ startDate: dateRange.start }));
      }

      hasInitializedRef.current = true;
    };

    initializeGrid();
  }, [dateRange.start, dispatch]);

  // Handle date range changes after initial load
  useEffect(() => {
    if (hasInitializedRef.current && dateRange.start) {
      dispatch(populateRowDates({ startDate: dateRange.start }));
    }
  }, [dateRange.start, dispatch]);

  return {
    // Initialization state
    isInitialized: hasInitializedRef.current,

    // Loading states
    isLoading,

    // Individual loading states for debugging
    breaksDataLoading,
  };
};
