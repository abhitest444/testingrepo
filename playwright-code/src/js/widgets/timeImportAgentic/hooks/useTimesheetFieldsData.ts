import { useCallback, useEffect, useRef } from 'react';
import { useGetTimesheetFieldsData as useGetTimesheetFieldsDataService } from 'src/js/service/hooks/oigql/useGetTimesheetFieldsData';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setTimesheetFieldsData,
  setTimesheetFieldsDataLoading,
  setTimesheetFieldsDataError,
  TimesheetFieldsDataState,
  setTimesheetFieldsDataHasLoaded,
} from '../store/timesheetFieldsDataSlice';

/**
 * Interface for the hook arguments
 */
export interface UseTimesheetFieldsDataArgs {
  first: number;
  offset?: number;
  autoLoad?: boolean; // Whether to automatically load data when hook is called
}

/**
 * Interface for the hook return value
 */
export interface UseTimesheetFieldsDataResult
  extends Omit<TimesheetFieldsDataState, 'hasLoaded'> {
  hasLoaded: boolean;
  loadTimesheetFieldsData: (args?: {
    first: number;
    offset?: number;
  }) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook that integrates the timesheet fields data service with Redux store
 * Manages the fetching, processing, and storing of timesheet fields data
 *
 * @param args - Configuration for the hook
 * @returns Object containing timesheet fields data, loading state, and control functions
 */
export const useTimesheetFieldsData = (
  args?: UseTimesheetFieldsDataArgs,
): UseTimesheetFieldsDataResult => {
  const dispatch = useAppDispatch();
  const timesheetFieldsState = useAppSelector(
    (state) => state.timesheetFieldsData,
  );

  // Use the service hook
  const {
    customers: serviceCustomers,
    products: serviceProducts,
    classes: serviceClasses,
    departments: serviceDepartments,
    loading: serviceLoading,
    error: serviceError,
    loadTimesheetFieldsData: serviceLoadTimesheetFieldsData,
  } = useGetTimesheetFieldsDataService();

  // Track previous values to prevent unnecessary dispatches
  const prevLoadingRef = useRef(serviceLoading);
  const prevErrorRef = useRef<any>(serviceError);
  const prevDataLengthRef = useRef({
    customers: 0,
    products: 0,
    classes: 0,
    departments: 0,
  });

  // Batched update: combine all Redux dispatches into a single effect
  useEffect(() => {
    const loadingChanged = prevLoadingRef.current !== serviceLoading;
    const errorChanged = prevErrorRef.current !== serviceError;
    const dataChanged =
      serviceCustomers.length !== prevDataLengthRef.current.customers ||
      serviceProducts.length !== prevDataLengthRef.current.products ||
      serviceClasses.length !== prevDataLengthRef.current.classes ||
      serviceDepartments.length !== prevDataLengthRef.current.departments;

    if (loadingChanged) {
      dispatch(setTimesheetFieldsDataLoading(serviceLoading));
      prevLoadingRef.current = serviceLoading;
    }

    if (errorChanged) {
      if (serviceError) {
        dispatch(setTimesheetFieldsDataError(serviceError));
        dispatch(setTimesheetFieldsDataHasLoaded(true));
      } else {
        dispatch(setTimesheetFieldsDataError(null));
      }
      prevErrorRef.current = serviceError;
    }

    if (
      dataChanged &&
      (serviceCustomers.length > 0 ||
        serviceProducts.length > 0 ||
        serviceClasses.length > 0 ||
        serviceDepartments.length > 0)
    ) {
      dispatch(
        setTimesheetFieldsData({
          customers: serviceCustomers,
          products: serviceProducts,
          classes: serviceClasses,
          departments: serviceDepartments,
        }),
      );
      prevDataLengthRef.current = {
        customers: serviceCustomers.length,
        products: serviceProducts.length,
        classes: serviceClasses.length,
        departments: serviceDepartments.length,
      };
    }
  }, [
    dispatch,
    serviceLoading,
    serviceError,
    serviceCustomers,
    serviceProducts,
    serviceClasses,
    serviceDepartments,
  ]);

  // Load data function that wraps the service function
  const loadTimesheetFieldsData = useCallback(
    async (loadArgs?: { first: number; offset?: number }) => {
      const finalArgs = loadArgs || {
        first: args?.first || 50,
        offset: args?.offset,
      };
      return serviceLoadTimesheetFieldsData(finalArgs);
    },
    [serviceLoadTimesheetFieldsData, args?.first, args?.offset],
  );

  // Refetch function for convenience
  const refetch = useCallback(
    async () => loadTimesheetFieldsData(),
    [loadTimesheetFieldsData],
  );

  // Auto-load data if specified - only run once on mount
  useEffect(() => {
    if (
      args?.autoLoad &&
      !timesheetFieldsState.hasLoaded &&
      !timesheetFieldsState.loading
    ) {
      loadTimesheetFieldsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - load only once on mount

  return {
    customers: timesheetFieldsState.customers,
    services: timesheetFieldsState.services,
    classes: timesheetFieldsState.classes,
    departments: timesheetFieldsState.departments,
    loading: timesheetFieldsState.loading,
    error: timesheetFieldsState.error,
    hasLoaded: timesheetFieldsState.hasLoaded,
    loadTimesheetFieldsData,
    refetch,
  };
};
