import { useState, useEffect, useMemo, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import {
  useGetWorkersTotalCountLazyQuery,
  useGetGroupWorkersTotalCountLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import type { OvertimePolicyAssignment } from '../types/Overtime.types';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { OVERTIME_WORKER_TYPES } from '../constants/overtimeWorkerTypes';
import { USER_NOT_FOUND_ENTITY_NAME } from '../../../constants';

export interface UseOvertimePolicyWorkerCountOptions {
  assignments: OvertimePolicyAssignment[];
}

export interface UseOvertimePolicyWorkerCountResult {
  /** Total count of workers assigned to the policy */
  totalWorkerCount: number;
  /** Count of all active workers (for "X of Y" display) */
  companyTotalWorkerCount: number;
  /** Whether any queries are still loading */
  loading: boolean;
  /** Error message if any query failed */
  error: string | null;
  /** Whether the policy is assigned to all workers */
  isCompanyWide: boolean;
  /** Whether there are no assignments */
  hasNoAssignments: boolean;
}

/**
 * Custom hook to calculate total worker count for an overtime policy
 * Handles all assignment types: 'all' (company-wide), 'group', and 'user'
 *
 * For groups, fetches the member count for each group and sums them.
 * Note: Does not de-duplicate workers who may be in multiple groups or
 * assigned both individually and through a group, as this would require
 * fetching all worker IDs which is expensive.
 */
export const useOvertimePolicyWorkerCount = (
  options: UseOvertimePolicyWorkerCountOptions,
): UseOvertimePolicyWorkerCountResult => {
  const logger = useLoggingConfig();
  const { assignments } = options;
  const sandbox = useSandbox();
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [groupErrors, setGroupErrors] = useState<Record<string, string>>({});
  const fetchedGroupIdsRef = useRef<Set<string>>(new Set());

  // Lazy query for company total worker count (active workers)
  const [
    executeCompanyCountQuery,
    {
      data: companyCountData,
      loading: companyCountLoading,
      error: companyCountError,
    },
  ] = useGetWorkersTotalCountLazyQuery({
    fetchPolicy: 'cache-and-network',
  });

  // Lazy query for group worker counts
  const [executeGroupCountQuery, { loading: groupCountLoading }] =
    useGetGroupWorkersTotalCountLazyQuery({
      fetchPolicy: 'cache-and-network',
    });

  // Categorize assignments
  const { isCompanyWide, groupAssignments, userAssignments, hasNoAssignments } =
    useMemo(() => {
      const companyWide = assignments.some((a) => a.entityType === 'all');
      const groups = assignments.filter((a) => a.entityType === 'group');
      const users = assignments.filter(
        (a) =>
          a.entityType === 'user' &&
          a.entityName !== USER_NOT_FOUND_ENTITY_NAME,
      );
      return {
        isCompanyWide: companyWide,
        groupAssignments: groups,
        userAssignments: users,
        hasNoAssignments: assignments.length === 0,
      };
    }, [assignments]);

  // Fetch company total count on mount
  useEffect(() => {
    const companyReadInteraction =
      TimeCustomerInteraction.WORKERS_READ_FOR_ASSIGNMENT;
    createCustomerInteraction(sandbox, companyReadInteraction);
    executeCompanyCountQuery({
      variables: {
        filter: { isActive: true, types: OVERTIME_WORKER_TYPES },
      },
      context: {
        headers: getCustomerInteractionPropagationHeaders(
          sandbox,
          companyReadInteraction,
        ),
      },
      onCompleted: () => {
        endInteractionWithSuccess(sandbox, companyReadInteraction);
      },
      onError: (error) => {
        endInteractionWithFailure(
          sandbox,
          companyReadInteraction,
          error.message,
          error,
        );
      },
    });
  }, [executeCompanyCountQuery, sandbox]);

  // Fetch group counts when assignments change
  useEffect(() => {
    if (groupAssignments.length === 0) {
      fetchedGroupIdsRef.current = new Set();
      setGroupCounts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      setGroupErrors((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    const currentGroupIds = new Set(groupAssignments.map((a) => a.entityId));

    // Remove stale entries for groups no longer in this policy (e.g. after switching policies)
    setGroupCounts((prev) => {
      const hasStale = Object.keys(prev).some((id) => !currentGroupIds.has(id));
      if (!hasStale) return prev;
      return Object.fromEntries(
        Object.entries(prev).filter(([id]) => currentGroupIds.has(id)),
      );
    });
    setGroupErrors((prev) => {
      const hasStale = Object.keys(prev).some((id) => !currentGroupIds.has(id));
      if (!hasStale) return prev;
      return Object.fromEntries(
        Object.entries(prev).filter(([id]) => currentGroupIds.has(id)),
      );
    });

    // Remove stale IDs from ref so they can be re-fetched if they reappear in a new policy
    Array.from(fetchedGroupIdsRef.current).forEach((id) => {
      if (!currentGroupIds.has(id)) {
        fetchedGroupIdsRef.current.delete(id);
      }
    });

    // Fetch count for each group (skip already-fetched groups to avoid infinite loops)
    groupAssignments.forEach((assignment) => {
      if (fetchedGroupIdsRef.current.has(assignment.entityId)) {
        return;
      }
      fetchedGroupIdsRef.current.add(assignment.entityId);
      const groupReadInteraction = TimeCustomerInteraction.GROUP_MEMBERS_READ;
      createCustomerInteraction(sandbox, groupReadInteraction, {
        groupId: assignment.entityId,
      });
      executeGroupCountQuery({
        variables: {
          groupId: assignment.entityId,
          types: OVERTIME_WORKER_TYPES,
        },
        context: {
          headers: getCustomerInteractionPropagationHeaders(
            sandbox,
            groupReadInteraction,
          ),
        },
        onCompleted: (data) => {
          const count = data?.members?.totalCount ?? 0;
          setGroupCounts((prev) => ({
            ...prev,
            [assignment.entityId]: count,
          }));
          endInteractionWithSuccess(sandbox, groupReadInteraction);
        },
        onError: (error) => {
          logger.error(OVERTIME_LOGGING.FETCH_WORKER_COUNT_FAILED, {
            groupId: assignment.entityId,
            error: error.message,
          });
          setGroupErrors((prev) => ({
            ...prev,
            [assignment.entityId]: error.message,
          }));
          endInteractionWithFailure(
            sandbox,
            groupReadInteraction,
            error.message,
            error,
          );
        },
      });
    });
  }, [groupAssignments, executeGroupCountQuery, logger, sandbox]);

  // Calculate total worker count
  const totalWorkerCount = useMemo(() => {
    if (isCompanyWide) {
      return companyCountData?.timeTrackingWorkers?.totalCount ?? 0;
    }

    // Sum group counts
    const groupTotal = Object.values(groupCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Add individual user count
    const userTotal = userAssignments.length;

    return groupTotal + userTotal;
  }, [isCompanyWide, companyCountData, groupCounts, userAssignments.length]);

  // Determine if still loading
  const loading = useMemo(() => {
    if (companyCountLoading) return true;
    if (groupCountLoading) return true;
    // Check if we're still waiting for any group counts
    const pendingGroups = groupAssignments.filter(
      (a) => !(a.entityId in groupCounts) && !(a.entityId in groupErrors),
    );
    return pendingGroups.length > 0;
  }, [
    companyCountLoading,
    groupCountLoading,
    groupAssignments,
    groupCounts,
    groupErrors,
  ]);

  // Aggregate errors
  const error = useMemo(() => {
    if (companyCountError) return companyCountError.message;
    const groupErrorMessages = Object.values(groupErrors);
    if (groupErrorMessages.length > 0) return groupErrorMessages[0];
    return null;
  }, [companyCountError, groupErrors]);

  const companyTotalWorkerCount =
    companyCountData?.timeTrackingWorkers?.totalCount ?? 0;

  return {
    totalWorkerCount,
    companyTotalWorkerCount,
    loading,
    error,
    isCompanyWide,
    hasNoAssignments,
  };
};
