/**
 * Worker types eligible for overtime policies.
 * Only EMPLOYEE and VENDOR types are supported for overtime - LEGACY_QBO_USER is excluded.
 *
 * This constant is shared across:
 * - useOvertimePolicyWorkerCount.ts (for fetching worker counts)
 * - useWizardMembersData.ts (for filtering workers in wizard)
 */
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

export const OVERTIME_WORKER_TYPES = [
  TimeTracking_TimeForType.Employee,
  TimeTracking_TimeForType.Vendor,
];
