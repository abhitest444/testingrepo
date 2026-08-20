import { useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import {
  selectWizardEditMode,
  selectPolicyAssignments,
  selectPolicyMemberIds,
  selectAssignmentsDirty,
} from '../store';
import { useOvertimePolicyWorkerCount } from './useOvertimePolicyWorkerCount';

export interface UseWizardPolicyWorkerCountOptions {
  /** Skip fetching (e.g., when step is not visible) */
  skip?: boolean;
}

export interface UseWizardPolicyWorkerCountResult {
  /** Total count of workers assigned/selected */
  totalWorkerCount: number;
  /** Count of all active workers (for "X of Y" display) */
  companyTotalWorkerCount: number;
  /** Whether the policy covers all workers */
  isCompanyWide: boolean;
  /** Whether there are no assignments/selections */
  hasNoAssignments: boolean;
  /** Whether data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether user has modified selections from original assignments */
  isDirty: boolean;
}

/**
 * Coordinator hook for wizard worker count display.
 *
 * This hook provides accurate worker counts based on wizard context:
 * - In CREATE mode: Returns count from user selections (policyMemberIds)
 * - In EDIT mode (clean): Uses useOvertimePolicyWorkerCount to fetch group/all counts
 * - In EDIT mode (dirty): Returns count from user selections after modification
 *
 * This ensures ReviewStep displays accurate counts even when policies include
 * group or company-wide ("all") assignments that haven't been resolved to IDs.
 *
 * @example
 * ```tsx
 * const {
 *   totalWorkerCount,
 *   companyTotalWorkerCount,
 *   isCompanyWide,
 *   hasNoAssignments,
 *   loading,
 * } = useWizardPolicyWorkerCount();
 *
 * if (isCompanyWide) return "All workers";
 * if (hasNoAssignments) return "No workers assigned";
 * return `${totalWorkerCount} of ${companyTotalWorkerCount} workers`;
 * ```
 */
export function useWizardPolicyWorkerCount(
  options?: UseWizardPolicyWorkerCountOptions,
): UseWizardPolicyWorkerCountResult {
  const skip = options?.skip ?? false;

  // Redux state
  const isEditMode = useAppSelector(selectWizardEditMode);
  const policyAssignments = useAppSelector(selectPolicyAssignments);
  const policyMemberIds = useAppSelector(selectPolicyMemberIds);
  const assignmentsDirty = useAppSelector(selectAssignmentsDirty);

  // Determine which counting strategy to use:
  // - Edit mode + not dirty + has assignments → use assignment-based count (accurate for groups)
  // - Otherwise → use policyMemberIds count (user selections)
  const useAssignmentsCounting = useMemo(
    () => isEditMode && !assignmentsDirty && policyAssignments.length > 0,
    [isEditMode, assignmentsDirty, policyAssignments.length],
  );

  // Use the assignment-based hook (will be efficient when assignments array is empty)
  const assignmentCountResult = useOvertimePolicyWorkerCount({
    assignments: useAssignmentsCounting && !skip ? policyAssignments : [],
  });

  // Return assignment-based count for clean edit mode
  if (useAssignmentsCounting) {
    return {
      totalWorkerCount: assignmentCountResult.totalWorkerCount,
      companyTotalWorkerCount: assignmentCountResult.companyTotalWorkerCount,
      isCompanyWide: assignmentCountResult.isCompanyWide,
      hasNoAssignments: assignmentCountResult.hasNoAssignments,
      loading: skip ? false : assignmentCountResult.loading,
      error: assignmentCountResult.error,
      isDirty: false,
    };
  }

  // Selection-based counting (create mode or dirty edit mode)
  return {
    totalWorkerCount: policyMemberIds.length,
    companyTotalWorkerCount: assignmentCountResult.companyTotalWorkerCount,
    isCompanyWide: false, // User selecting individually = not company-wide
    hasNoAssignments: policyMemberIds.length === 0,
    loading: skip ? false : assignmentCountResult.loading, // Still loading company total
    error: null,
    isDirty: assignmentsDirty,
  };
}

export default useWizardPolicyWorkerCount;
