import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useGetDataAccessContacts } from 'src/js/service/hooks/oigql/useGetDataAccessContacts';
import {
  DataAccess_ContactType,
  DataAccess_ContactsSort,
} from 'src/__generated__/oigql/graphql';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setEmployees,
  setEmployeeDataLoading,
  setEmployeeDataError,
  Employee,
  setHasLoaded,
} from '../store/employeeDataSlice';

/**
 * Hook for fetching and managing employee data
 * Similar to quickFind implementation but stores data in Redux
 */
export const useEmployeeData = () => {
  const dispatch = useAppDispatch();

  // Get current state
  const { employees, loading, error, hasLoaded } = useAppSelector(
    (state) => state.employeeData,
  );

  // Use the existing data access contacts hook
  const {
    employees: rawEmployees,
    loading: rawLoading,
    error: rawError,
    loadDataAccessContacts,
  } = useGetDataAccessContacts();

  // Helper function to extract error message
  const getErrorMessage = useCallback((error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return String(error.message);
    }
    return 'An error occurred while fetching employee data';
  }, []);

  // Transform raw employees to our Employee interface
  const transformedEmployees = useMemo(
    (): Employee[] =>
      rawEmployees.map((emp) => ({
        id: emp.id,
        name: emp.displayName || 'Unknown',
        email: (emp as any).email,
        department: (emp as any).department?.name,
        type:
          emp.type === DataAccess_ContactType.Employee ? 'EMPLOYEE' : 'VENDOR',
      })),
    [rawEmployees],
  );

  // Track previous values to prevent unnecessary dispatches
  const prevLoadingRef = useRef(rawLoading);
  const prevErrorRef = useRef<any>(rawError);
  const prevTransformedLengthRef = useRef(0);

  // Batched update: combine all Redux dispatches into a single effect
  useEffect(() => {
    // Only dispatch if values have actually changed
    const loadingChanged = prevLoadingRef.current !== rawLoading;
    const errorChanged = prevErrorRef.current !== rawError;
    const dataChanged =
      transformedEmployees.length > 0 &&
      transformedEmployees.length !== prevTransformedLengthRef.current;

    if (loadingChanged) {
      dispatch(setEmployeeDataLoading(rawLoading));
      prevLoadingRef.current = rawLoading;
    }

    if (errorChanged) {
      if (rawError) {
        const errorMessage = getErrorMessage(rawError);
        dispatch(setEmployeeDataError(errorMessage));
        dispatch(setHasLoaded(true));
      } else {
        dispatch(setEmployeeDataError(null));
      }
      prevErrorRef.current = rawError;
    }

    if (dataChanged && !rawLoading) {
      dispatch(setEmployees(transformedEmployees));
      prevTransformedLengthRef.current = transformedEmployees.length;
    }
  }, [transformedEmployees, dispatch, rawLoading, rawError, getErrorMessage]);

  // Load employees on mount
  const loadEmployees = useCallback(() => {
    if (!hasLoaded && !rawLoading) {
      loadDataAccessContacts({
        filter: {
          or: [
            {
              and: [
                {
                  type: {
                    matchesAny: [DataAccess_ContactType.Employee],
                  },
                },
                {
                  active: {
                    equals: true,
                  },
                },
                {
                  activeEmploymentStatus: {
                    equals: true,
                  },
                },
              ],
            },
          ],
        },
        first: 200,
        offset: 0,
        orderBy: [
          DataAccess_ContactsSort?.TypeAsc,
          DataAccess_ContactsSort?.FullNameAsc,
        ],
      });
    }
  }, [hasLoaded, rawLoading, loadDataAccessContacts]);

  // Auto-load on mount - use empty dependency array to run only once
  useEffect(() => {
    if (!hasLoaded && !rawLoading) {
      loadDataAccessContacts({
        filter: {
          or: [
            {
              and: [
                {
                  type: {
                    matchesAny: [DataAccess_ContactType.Employee],
                  },
                },
                {
                  active: {
                    equals: true,
                  },
                },
                {
                  activeEmploymentStatus: {
                    equals: true,
                  },
                },
              ],
            },
          ],
        },
        first: 200,
        offset: 0,
        orderBy: [
          DataAccess_ContactsSort?.TypeAsc,
          DataAccess_ContactsSort?.FullNameAsc,
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - load only once on mount

  return {
    employees,
    loading,
    error,
    hasLoaded,
    loadEmployees,
  };
};
