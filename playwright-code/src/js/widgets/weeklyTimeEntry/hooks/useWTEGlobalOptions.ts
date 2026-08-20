import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setWorker,
  setGlobalOptionsLoading,
  setGlobalCFO,
  setGlobalOptionsError,
  setWorkerOnlyCFAssignments,
  selectCurrentWorkerId,
  selectGlobalOptions,
} from '../store/assignmentSlice';
import { enrichCFOOptionsWithNamesFromCF } from '../utils/helpers';

/**
 * Hook to fetch global CFO on team member load (NO customer context)
 *
 * REFACTORED: Now uses assignmentSlice instead of rowAssignmentsSlice
 *
 * Called once at widget level.
 *
 * Fetches:
 * - CF for worker-only (customerId null)
 * - CFO for ENABLED dropdown custom fields
 *
 * SFO (service, class, location) is handled by QuickFind internally.
 */
export const useWTEGlobalOptions = ({
  workerId,
  allCustomFields,
}: {
  workerId: string | null;
  allCustomFields: any[];
  isServiceFieldEnabled?: boolean;
  isClassEnabled?: boolean;
  isLocationEnabled?: boolean;
}) => {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const currentWorkerId = useAppSelector(selectCurrentWorkerId);
  const globalOptions = useAppSelector(selectGlobalOptions);

  // CFO hook
  const {
    loadCustomFieldOptionAssignments,
    data: customFieldOptionData,
    loading: customFieldOptionLoading,
    error: customFieldOptionError,
  } = useCustomFieldOptionAssignments();

  // CF hook for worker-only call (customerId null)
  const { loadCustomFieldAssignments, data: customFieldData } =
    useCustomFieldAssignments();

  // Get dropdown CF IDs (enabled + dropdown/multi-select type or CFs with options, e.g. API type 'string' with options)
  const dropdownCFIds = useMemo(
    () =>
      allCustomFields
        .filter((cf) => {
          const type = cf.type?.toUpperCase();
          const hasOptions =
            cf.options && Array.isArray(cf.options) && cf.options.length > 0;
          return type === 'DROPDOWN' || type === 'MULTI_SELECT' || !!hasOptions;
        })
        .map((cf) => cf.id),
    [allCustomFields],
  );

  // Update worker ID when it changes
  useEffect(() => {
    if (workerId !== currentWorkerId) {
      dispatch(setWorker(workerId));
    }
  }, [workerId, currentWorkerId, dispatch]);

  // Fetch global SFO/CFO when worker loads (no customer)
  useEffect(() => {
    if (!workerId) {
      return undefined;
    }

    let isMounted = true;

    dispatch(setGlobalOptionsLoading(true));

    // CF call with customerId null (worker only) - when CFs enabled
    // Explicit null so API receives input: { customerId: null, projectId: null }, not input: {}
    if (allCustomFields.length > 0) {
      loadCustomFieldAssignments({
        input: {
          customerId: null,
          projectId: null,
        },
        filter: { assigned: true },
        first: 100,
      });
    }

    // Fetch CFO for ENABLED dropdown CFs (all enabled CFs when worker only)
    dropdownCFIds.forEach((cfId) => {
      loadCustomFieldOptionAssignments({
        input: {
          timeForEntityId: workerId || null,
          timeAgainstEntityId: null, // No customer context
          customFieldIds: cfId,
        },
        filter: {
          assigned: true,
          active: true,
        },
        first: 100,
      });
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders omitted to avoid duplicate runs
  }, [
    workerId,
    allCustomFields.length,
    dropdownCFIds,
    loadCustomFieldAssignments,
    loadCustomFieldOptionAssignments,
    dispatch,
  ]);

  // Store worker-only CF assignments when data arrives (only when we requested CF, i.e. CFs enabled)
  useEffect(() => {
    if (allCustomFields.length > 0 && customFieldData) {
      dispatch(
        setWorkerOnlyCFAssignments({
          customFieldAssignments: customFieldData,
        }),
      );
    }
  }, [customFieldData, allCustomFields.length, dispatch]);

  // Store CFO data; use customFieldId from option and enrich option names from CF definition
  useEffect(() => {
    let isMounted = true;
    if (
      customFieldOptionData &&
      customFieldOptionData.length > 0 &&
      isMounted
    ) {
      const first = customFieldOptionData[0] as {
        id: string;
        name: string;
        assigned: boolean;
        customFieldId?: string;
      };
      const cfId = first?.customFieldId ?? first?.id;
      if (cfId) {
        const optionsWithNames = enrichCFOOptionsWithNamesFromCF(
          customFieldOptionData,
          cfId,
          allCustomFields,
          sandbox,
        );
        dispatch(
          setGlobalCFO({ customFieldId: cfId, options: optionsWithNames }),
        );
      }
    }
    return () => {
      isMounted = false;
    };
  }, [customFieldOptionData, allCustomFields, dispatch]);

  // Clear global options loading when CFO loading completes (no SFO in this hook)
  useEffect(() => {
    if (!customFieldOptionLoading) {
      dispatch(setGlobalOptionsLoading(false));
    }
  }, [customFieldOptionLoading, dispatch]);

  // Handle errors
  useEffect(() => {
    let isMounted = true;
    if (customFieldOptionError && isMounted) {
      dispatch(setGlobalOptionsError(customFieldOptionError));
    }
    return () => {
      isMounted = false;
    };
  }, [customFieldOptionError, dispatch]);

  return {
    loading: customFieldOptionLoading,
  };
};
