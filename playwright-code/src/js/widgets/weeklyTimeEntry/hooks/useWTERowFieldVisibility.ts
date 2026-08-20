import { useMemo } from 'react';
import { useAppSelector } from '../store';
import {
  selectTimesheetRows,
  selectBaseStandardFieldsVisibilityForCustomer,
} from '../store/selectors';
import {
  selectCustomerAssignments,
  selectGlobalOptions,
} from '../store/assignmentSlice';

/**
 * Hook to get field visibility and options for a specific row
 *
 * REFACTORED: Now uses assignmentSlice (customer-based caching) instead of rowAssignmentsSlice
 *
 * Strategy:
 * 1. Look up the row to get its customer ID
 * 2. Get customer assignments from assignmentSlice (cached by customer ID)
 * 3. Merge global options (worker-only) with customer-specific options
 *
 * Update case (same as STE): For rows that have existing values on time entries, we show SF/CF
 * if the time entry has a value for that field (even if not assigned), and we call SFO/CFO for
 * those so assigned options load. Required CFs with no assigned options are not shown and not validated.
 *
 * Returns:
 * - Standard field visibility (service/class/location/billable)
 * - Visible custom field IDs
 * - Option getters for SF and CF dropdowns (merged global + customer-specific)
 */
export const useWTERowFieldVisibility = ({
  rowId,
  companySettings,
}: {
  rowId: string;
  companySettings: any;
}) => {
  // Get the row to extract customer ID
  const rows = useAppSelector(selectTimesheetRows);
  const row = rows.find((r) => r.rowId === rowId);
  const customerId = row?.timeAgainst?.id || null;

  // Get customer-specific assignments (cached by customer ID, not row ID)
  const customerAssignments = useAppSelector(
    selectCustomerAssignments(customerId || ''),
  );

  // Per-customer memoized SF visibility so panel updates when row's customer changes
  const baseStandardFieldsVisibility = useAppSelector((state) =>
    selectBaseStandardFieldsVisibilityForCustomer(state, customerId),
  );

  // Get global options (worker-only baseline)
  const globalOptions = useAppSelector(selectGlobalOptions);

  // Stable signature for row's time-entry data so downstream useMemos only re-run when content changes (avoids loops when row ref changes)
  const rowTimeEntriesSignature = useMemo(() => {
    const entries = row?.timeEntries ? Object.values(row.timeEntries) : [];
    const parts = entries.map((e: any) => {
      const sf = [
        e.metaInfo?.service?.id ?? e.metaInfo?.service?.name,
        e.metaInfo?.class?.id ?? e.metaInfo?.class?.name,
        e.metaInfo?.location?.id ?? e.metaInfo?.location?.name,
      ].join(';');
      const cfs = (e.customFields || [])
        .map((cf: any) => `${cf.id}:${cf.value ?? ''}:${cf.optionID ?? ''}`)
        .join(',');
      return `${sf}|${cfs}`;
    });
    return parts.join('||');
    // Depend on row only; row.timeEntries would change ref often and cause loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  // Row-wise visibility: per-customer base visibility (memoized from SF response) + update-case row overlay.
  const standardFieldsVisibility = useMemo(() => {
    const baseVisibility = baseStandardFieldsVisibility; // memoized per customer from selector

    const entries = row?.timeEntries ? Object.values(row.timeEntries) : [];
    const hasServiceOnRow = entries.some(
      (e: any) =>
        (e.metaInfo?.service?.id ?? e.metaInfo?.service?.name) != null,
    );
    const hasClassOnRow = entries.some(
      (e: any) => (e.metaInfo?.class?.id ?? e.metaInfo?.class?.name) != null,
    );
    const hasLocationOnRow = entries.some(
      (e: any) =>
        (e.metaInfo?.location?.id ?? e.metaInfo?.location?.name) != null,
    );

    return {
      service: baseVisibility.service || hasServiceOnRow,
      class: baseVisibility.class || hasClassOnRow,
      location: baseVisibility.location || hasLocationOnRow,
      billable: baseVisibility.billable,
    };
  }, [baseStandardFieldsVisibility, rowTimeEntriesSignature]);

  // Get visible custom field IDs:
  // - Rows WITH customer: use customer-specific assignments (customerAssignments)
  // - Rows WITHOUT customer (no time category): use worker-only baseline (workerOnlyCFAssignments)
  // - Required CFs with no assigned options: never shown, validation skipped (same as STE).
  // - Update case: include CFs that have a value on any day entry for this row (so CFO is used for display).
  const visibleCustomFieldIds = useMemo(() => {
    const result = new Set<string>();

    // Day entries on this row: collect CF IDs that have a value (update case)
    const entries = row?.timeEntries ? Object.values(row.timeEntries) : [];
    const cfIdsWithValueOnRow = new Set<string>();
    entries.forEach((e: any) => {
      (e.customFields || []).forEach((cf: any) => {
        if (
          cf.id &&
          ((cf.value != null && cf.value !== '') ||
            (cf.optionID != null && cf.optionID !== ''))
        ) {
          cfIdsWithValueOnRow.add(cf.id);
        }
      });
    });

    const assigned = customerId
      ? (customerAssignments?.customFieldAssignments ?? []).filter(
          (cf) => cf.assigned,
        )
      : (globalOptions?.workerOnlyCFAssignments ?? []).filter(
          (cf) => cf.assigned,
        );

    assigned.forEach((cf) => {
      const options = customerId
        ? customerAssignments?.customFieldOptionAssignments?.[cf.id] ??
          globalOptions?.customFieldOptions?.[cf.id]
        : globalOptions?.customFieldOptions?.[cf.id];
      const hasAssignedOption =
        Array.isArray(options) &&
        options.length > 0 &&
        options.some((opt: { assigned?: boolean }) => opt.assigned === true);
      // Dropdown with no options: hide and skip required. Non-dropdown or has options: show when assigned.
      const hasNoOptions = Array.isArray(options) && options.length === 0;
      if (hasNoOptions) {
        return; // Don't show CF when no options assigned (also removes from required validation)
      }
      const isDropdownWithOptions =
        Array.isArray(options) && options.length > 0;
      if (isDropdownWithOptions ? hasAssignedOption : true) {
        result.add(cf.id);
      }
    });

    // Update case: add CFs that have a value on this row (even if not assigned) so we show them and CFO loads
    cfIdsWithValueOnRow.forEach((id) => result.add(id));

    return result;
    // row.timeEntries is derived from row; we use rowTimeEntriesSignature to avoid re-running on every row ref change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    customerId,
    rowTimeEntriesSignature,
    customerAssignments?.customFieldAssignments,
    customerAssignments?.customFieldOptionAssignments,
    globalOptions?.workerOnlyCFAssignments,
    globalOptions?.customFieldOptions,
  ]);

  // Merge global and customer-specific options
  // Priority: Customer-specific options > Global options (worker-only)
  const mergeOptions = (globalOpts: any[] = [], customerOpts: any[] = []) => {
    if (customerOpts && customerOpts.length > 0) {
      return customerOpts; // Customer-specific options take precedence
    }
    return globalOpts; // Fall back to global options
  };

  // Getter for service options
  const getServiceOptions = () =>
    mergeOptions(
      globalOptions?.standardFieldOptions.service,
      customerAssignments?.standardFieldOptions.service,
    );

  // Getter for class options
  const getClassOptions = () =>
    mergeOptions(
      globalOptions?.standardFieldOptions.class,
      customerAssignments?.standardFieldOptions.class,
    );

  // Getter for location options
  const getLocationOptions = () =>
    mergeOptions(
      globalOptions?.standardFieldOptions.location,
      customerAssignments?.standardFieldOptions.location,
    );

  // Getter for custom field options.
  // When we have a customer: use only that customer's CFO; empty or missing = no options (do not fall back to global).
  // When no customer: use global (worker-only) options.
  const getCustomFieldOptions = (customFieldId: string) => {
    if (customerId) {
      return (
        customerAssignments?.customFieldOptionAssignments?.[customFieldId] ?? []
      );
    }
    return globalOptions?.customFieldOptions?.[customFieldId] ?? [];
  };

  return {
    standardFieldsVisibility,
    visibleCustomFieldIds,
    getServiceOptions,
    getClassOptions,
    getLocationOptions,
    getCustomFieldOptions,
    loading: customerAssignments?.loading ?? false,
    shouldUseAssignments: true,
    customerId, // For SFO refetch-with-search (entityId when row has customer/project)
  };
};
