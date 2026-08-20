import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useSandbox } from '@payroll/quicksand';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import {
  useCustomFieldOptionAssignments,
  CustomFieldOptionAssignment,
} from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import {
  getFallbackStandardFieldsVisibility,
  getStandardFieldsVisibilityWithAssignmentOverride,
  filterCustomFieldsByAssignment,
  shouldUseAssignmentLogic,
  getStandardFieldAssignmentFilter,
  getCustomFieldAssignmentFilter,
} from 'src/js/common/assignmentFieldUtils';
import {
  getVisibleCustomFields,
  getStandardFieldsVisibility,
  CustomField,
  CompanySettings,
} from 'src/js/common/assignmentVisibilityUtils';
import { UxPreferenceHideTimeEntryFieldsData } from 'src/js/service/utils/useUXPreferences';
import { CustomField as CustomFieldType } from 'src/js/widgets/common/customFields/utils';

export interface UseSTEFieldAssignmentsProps {
  companySettings: CompanySettings;
  uxPreferences: UxPreferenceHideTimeEntryFieldsData;
  allCustomFields: CustomFieldType[];
  isOTX: boolean;
  isTimeEntry: boolean;
}

export interface UseSTEFieldAssignmentsResult {
  visibleCustomFields: CustomFieldType[];
  standardFieldsVisibility: {
    service: boolean;
    class: boolean;
    location: boolean;
    billable: boolean;
  };
  loading: boolean;
  workerId: string | undefined;
  customerId: string | undefined;
  projectId: string | undefined;
  customFieldOptionAssignments: Record<string, any[]>; // Map of CF ID to its option assignments
}

/**
 * Custom hook for managing field assignments in Single Time Entry (STE)
 *
 * This hook handles FIELD VISIBILITY (which fields to show/hide), NOT option filtering.
 *
 * What it does:
 * - Watches form fields (timeFor, timeAgainst) using React Hook Form's useWatch
 * - When CUSTOMER/PROJECT changes: Fetches which SF (Standard Fields) and CF (Custom Fields) are VISIBLE
 * - Implements assignment override logic based on SF settings
 *
 * NEW LOGIC:
 * Standard Fields (SF):
 * 1. Check if SF is ENABLED or DISABLED in company settings
 * 2. If ANY SF is DISABLED → Fetch assignments with assigned: true (show only assigned fields)
 * 3. If ALL SF are ENABLED → Pass assigned: null (show all enabled fields, no filtering)
 *
 * Custom Fields (CF) - OPPOSITE logic:
 * 1. Check if CF is ENABLED in company settings
 * 2. If ANY CF is ENABLED → Fetch assignments with assigned: true (show only assigned fields)
 * 3. If NO CF are ENABLED → Pass assigned: null (don't filter, but won't show anyway)
 *
 * What it does NOT do:
 * - Does NOT filter custom field OPTIONS/VALUES (that's based on worker ID, not customer ID)
 * - Worker-based option filtering would use useCustomFieldOptionAssignments separately
 *
 * Assignment Override Logic:
 * - Company Settings → UX Preferences → Assignment API (OVERRIDES when SF disabled)
 * - When assignment data exists AND SF disabled, it takes precedence over settings
 * - Falls back to settings when feature flag is OFF or no assignment data
 *
 * Example:
 * - Customer A: Shows Service + Class fields, hides Location + Custom Field "Department"
 * - Customer B: Shows Location + Custom Field "Department", hides Service + Class
 *
 * @param props - Configuration object
 * @returns Field visibility state and loading status
 */
export const useSTEFieldAssignments = ({
  companySettings,
  uxPreferences,
  allCustomFields,
  isOTX,
  isTimeEntry,
}: UseSTEFieldAssignmentsProps): UseSTEFieldAssignmentsResult => {
  // Watch form fields for worker and customer changes
  const timeFor = useWatch({ name: 'timeFor' });
  const timeAgainst = useWatch({ name: 'timeAgainst' });

  // Watch form fields used for update-scenario visibility (show field if TE has value even when not assigned)
  const timeEntryId = useWatch({ name: 'id' });
  const formService = useWatch({ name: 'service' });
  const formClass = useWatch({ name: 'class' });
  const formLocation = useWatch({ name: 'location' });
  const formBillable = useWatch({ name: 'billable' });
  const formCustomFields = useWatch({ name: 'customFields' });
  const sandbox = useSandbox();

  const workerId = timeFor?.id;
  const customerId = timeAgainst?.customer?.id;
  const projectId = timeAgainst?.project?.id;

  // Stable signatures for form values to avoid infinite loops (useWatch can return new object refs each render)
  const formCustomFieldsSignature = useMemo(() => {
    if (!formCustomFields || typeof formCustomFields !== 'object') return '';
    const entries = Object.entries(formCustomFields as Record<string, any>);
    const parts = entries
      .filter(([, v]) => v && (v as any).deleted !== true)
      .map(
        ([id, v]) =>
          `${id}:${(v as any).value ?? ''}:${(v as any).optionID ?? ''}`,
      );
    return parts.sort().join('|');
    // formCustomFields is the only input; listing nested keys would not add stability
  }, [formCustomFields]);

  const formStandardFieldsSignature = useMemo(
    () =>
      [
        formService?.id ?? formService?.value ?? '',
        formClass?.id ?? formClass?.value ?? '',
        formLocation?.id ?? formLocation?.value ?? '',
        formBillable === true ? '1' : '0',
      ].join(','),
    // Intentionally depend on object refs so signature only changes when identity changes; listing .id/.value would trigger on every useWatch tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formService, formClass, formLocation, formBillable],
  );

  // State for assignment data
  const [customFieldAssignments, setCustomFieldAssignments] = useState<any[]>(
    [],
  );
  const [standardFieldAssignments, setStandardFieldAssignments] = useState<
    any[]
  >([]);
  const [customFieldOptionAssignments, setCustomFieldOptionAssignments] =
    useState<Record<string, any[]>>({});
  // Track when SF and CF data has been loaded for the current customer
  // This prevents race conditions between SF/CF and SFO/CFO calls
  const [sfDataLoadedForCustomer, setSfDataLoadedForCustomer] = useState<
    string | null
  >(null);
  const [cfDataLoadedForCustomer, setCfDataLoadedForCustomer] = useState<
    string | null
  >(null);

  // Track last entity we fetched CFO for; only clear when it changes to avoid clear->re-render loops
  const lastCFOFetchEntityRef = useRef<string | null>(null);

  // Hooks for assignment APIs
  const {
    loadCustomFieldAssignments,
    data: customFieldData,
    loading: customFieldLoading,
    error: customFieldError,
  } = useCustomFieldAssignments();

  const {
    loadStandardFieldAssignments,
    data: standardFieldData,
    loading: standardFieldLoading,
    error: standardFieldError,
  } = useStandardFieldAssignments();

  const {
    loadCustomFieldOptionAssignments,
    data: customFieldOptionData,
    loading: customFieldOptionLoading,
    error: customFieldOptionError,
  } = useCustomFieldOptionAssignments();

  // Determine if we should use assignments
  const shouldUseAssignments = isOTX && isTimeEntry;
  const hasCustomerOrProject =
    (customerId && customerId !== '') || (projectId && projectId !== '');
  const hasAssignmentError = !!(customFieldError || standardFieldError);

  // Decide whether to use assignment logic based on conditions (SF and general)
  const useAssignments = shouldUseAssignmentLogic(
    isTimeEntry,
    hasCustomerOrProject,
    hasAssignmentError,
  );
  // ==================================================================================
  // FILTER CALCULATION
  // ==================================================================================
  // Calculate SF and CF assignment filters based on company settings
  // These determine whether we fetch ALL fields or only ASSIGNED fields

  // SF Filter: Extract only the 'assigned' boolean value for stable dependencies
  // If ANY SF is disabled → assigned: true (fetch only assigned fields)
  // If ALL SFs enabled → assigned: null (fetch all fields)
  const sfFilterAssigned = useMemo(
    () => getStandardFieldAssignmentFilter(companySettings).assigned,
    [companySettings],
  );

  // CF Filter: Extract only the 'assigned' boolean value for stable dependencies
  // If allCustomFields has items → assigned: true (CFs enabled, fetch assigned ones)
  // If allCustomFields is empty → assigned: null (no CFs, skip API call)
  const cfFilterAssigned = useMemo(
    () =>
      getCustomFieldAssignmentFilter(companySettings, allCustomFields).assigned,
    [companySettings, allCustomFields],
  );

  // ==================================================================================
  // ASSIGNMENT KEY FOR FETCH TRIGGERING
  // ==================================================================================
  const assignmentKey = useMemo(() => {
    if (!shouldUseAssignments) return null;
    if (!hasCustomerOrProject) return null;
    return `${customerId || 'null'}-${
      projectId || 'null'
    }-${sfFilterAssigned}-${cfFilterAssigned}`;
  }, [
    shouldUseAssignments,
    customerId,
    projectId,
    sfFilterAssigned,
    cfFilterAssigned,
  ]);

  // CF should also be fetched when worker is set but no customer (worker-only baseline)
  const shouldFetchCF = useMemo(
    () =>
      shouldUseAssignments &&
      allCustomFields.length > 0 &&
      (hasCustomerOrProject || workerId),
    [
      shouldUseAssignments,
      allCustomFields.length,
      hasCustomerOrProject,
      workerId,
    ],
  );

  // ==================================================================================
  // FIELD & OPTION ASSIGNMENT FETCHING
  // ==================================================================================
  // Fetch CF and SF field assignments when customer/project changes (or worker-only for CF)
  useEffect(() => {
    if (!assignmentKey && !shouldFetchCF) {
      setCustomFieldAssignments([]);
      setStandardFieldAssignments([]);
      setSfDataLoadedForCustomer(null);
      setCfDataLoadedForCustomer(null);
      return undefined;
    }

    const customerKey = `${customerId || 'null'}-${projectId || 'null'}`;
    if (assignmentKey) {
      setSfDataLoadedForCustomer(null);
      setCfDataLoadedForCustomer(null);
    }
    // Reset CF loaded when fetching CF (customer or worker-only) so UI doesn’t show stale data
    if (allCustomFields.length > 0 && (hasCustomerOrProject || workerId)) {
      setCfDataLoadedForCustomer(null);
    }

    // Uses customer id only; do not pass projectId at all
    const input = { customerId };

    // CUSTOM FIELD ASSIGNMENTS: fetch with customer when present, or with null + assigned true when worker-only
    if (allCustomFields.length > 0) {
      if (hasCustomerOrProject) {
        loadCustomFieldAssignments({
          input,
          filter: {
            assigned: cfFilterAssigned === null ? null : cfFilterAssigned,
          },
          first: 100,
        });
      } else if (workerId) {
        loadCustomFieldAssignments({
          input: { customerId: null },
          filter: { assigned: true },
          first: 100,
        });
      }
    } else {
      setCustomFieldAssignments([]);
      setCfDataLoadedForCustomer(customerKey);
    }

    // STANDARD FIELD ASSIGNMENTS: only when we have customer/project
    if (assignmentKey) {
      if (sfFilterAssigned === true) {
        loadStandardFieldAssignments({
          input,
          filter: {
            assigned: true,
          },
          first: 100,
        });
      } else {
        setStandardFieldAssignments([]);
        setSfDataLoadedForCustomer(customerKey);
      }
    }

    return undefined;
  }, [
    assignmentKey,
    shouldFetchCF,
    hasCustomerOrProject,
    workerId,
    loadCustomFieldAssignments,
    loadStandardFieldAssignments,
    customerId,
    projectId,
    sfFilterAssigned,
    cfFilterAssigned,
    allCustomFields.length,
  ]);

  // ==================================================================================
  // STATE UPDATES FROM API RESPONSES
  // ==================================================================================
  // Update state when CF assignment data arrives from API
  useEffect(() => {
    if (customFieldData) {
      setCustomFieldAssignments(customFieldData);
      // Mark CF data as loaded for current customer
      const customerKey = `${customerId || 'null'}-${projectId || 'null'}`;
      setCfDataLoadedForCustomer(customerKey);
    }
  }, [customFieldData, customerId, projectId]);

  // Update state when SF assignment data arrives from API
  useEffect(() => {
    if (standardFieldData) {
      setStandardFieldAssignments(standardFieldData);
      // Mark SF data as loaded for current customer
      const customerKey = `${customerId || 'null'}-${projectId || 'null'}`;
      setSfDataLoadedForCustomer(customerKey);
    }
  }, [standardFieldData, customerId, projectId]);

  // ==================================================================================
  // VISIBLE CUSTOM FIELDS CALCULATION
  // ==================================================================================
  // Assigned CFs (enabled + assigned) - when assignment enabled, filter by CF API response
  const assignedCustomFields = useMemo(() => {
    if (!shouldUseAssignments) return allCustomFields;
    const assignedFieldIds = new Set(
      customFieldAssignments.filter((cf) => cf.assigned).map((a) => a.id),
    );
    return allCustomFields.filter((field) => assignedFieldIds.has(field.id));
  }, [shouldUseAssignments, allCustomFields, customFieldAssignments]);

  // Visible custom fields: enabled + assigned (create), or assigned OR has value on time entry (update).
  // Required CFs with no assigned options (dropdown/multi_select): we do NOT show them and do NOT validate.
  // - Dropdown/multi_select with no CFO options are filtered out below (so they are never shown).
  // - Form components should pass required: false for dropdown CFs with no options (see SingleTimeFormDesktop/Mobile).
  // In update scenario (time entry id present): also show CFs that have a value on the time entry even if not assigned.
  const visibleCustomFields = useMemo(() => {
    if (!shouldUseAssignments) return assignedCustomFields;

    const hasValueOnTimeEntry = (fieldId: string) => {
      const entry =
        formCustomFields && (formCustomFields as Record<string, any>)[fieldId];
      if (!entry) return false;
      const hasValue =
        (entry.value !== undefined &&
          entry.value !== null &&
          entry.value !== '') ||
        (entry.optionID !== undefined &&
          entry.optionID !== null &&
          entry.optionID !== '');
      return hasValue && entry.deleted !== true;
    };

    const isUpdate = !!timeEntryId;
    const assignedSet = new Set(assignedCustomFields.map((f) => f.id));
    const baseFields = isUpdate
      ? [
          ...assignedCustomFields,
          ...allCustomFields.filter(
            (f) => !assignedSet.has(f.id) && hasValueOnTimeEntry(f.id),
          ),
        ]
      : assignedCustomFields;

    return baseFields.filter((field) => {
      const isDropdown =
        field.type?.toUpperCase() === 'DROPDOWN' ||
        field.type?.toUpperCase() === 'MULTI_SELECT' ||
        (field.options && field.options.length > 0);
      if (!isDropdown) return true;
      const options = customFieldOptionAssignments[field.id];
      const hasOptions = Array.isArray(options) && options.length > 0;
      if (hasOptions) return true;
      if (isUpdate && hasValueOnTimeEntry(field.id)) return true;
      return false;
    });
  }, [
    shouldUseAssignments,
    assignedCustomFields,
    allCustomFields,
    customFieldOptionAssignments,
    timeEntryId,
    formCustomFieldsSignature,
  ]);

  // ==================================================================================
  // STANDARD FIELDS VISIBILITY CALCULATION
  // ==================================================================================
  // Calculate standard fields visibility (must be before SFO fetching that depends on it).
  // In update scenario (time entry id present): show a field if it is assigned OR the time entry has a value for it.
  const standardFieldsVisibility = useMemo(() => {
    // Fallback to settings when assignments shouldn't be used
    if (!useAssignments) {
      return getFallbackStandardFieldsVisibility(companySettings);
    }

    // When all SFs are enabled (sfFilterAssigned !== true), use company settings
    if (sfFilterAssigned !== true) {
      return getFallbackStandardFieldsVisibility(companySettings);
    }

    // Show if enabled in company settings OR present in SF response (so disabled-in-settings fields still show when assigned).
    const baseVisibility = getStandardFieldsVisibilityWithAssignmentOverride(
      companySettings,
      standardFieldAssignments,
    );

    const isUpdate = !!timeEntryId;
    if (!isUpdate) {
      return baseVisibility;
    }

    // Update scenario only: also show field if the time entry has a value for it (even if not assigned)
    const hasService = !!(formService?.id ?? formService?.value);
    const hasClass = !!(formClass?.id ?? formClass?.value);
    const hasLocation = !!(formLocation?.id ?? formLocation?.value);
    const hasBillable = formBillable === true;

    return {
      service: baseVisibility.service || hasService,
      class: baseVisibility.class || hasClass,
      location: baseVisibility.location || hasLocation,
      billable: baseVisibility.billable || hasBillable,
    };
  }, [
    useAssignments,
    sfFilterAssigned,
    companySettings,
    standardFieldAssignments,
    timeEntryId,
    formStandardFieldsSignature,
  ]);

  // ==================================================================================
  // DROPDOWN CF IDs (for CFO fetching)
  // ==================================================================================
  // Include all dropdown CFs we might show: assigned + in update case also those with a value on the time entry.
  // This ensures we call CFO for update-case fields so their assigned options load and display correctly.
  const dropdownCFIdsString = useMemo(() => {
    const isDropdown = (cf: CustomFieldType) => {
      const type = cf.type?.toUpperCase();
      return type === 'DROPDOWN' || type === 'MULTI_SELECT';
    };
    const hasValueOnTimeEntry = (fieldId: string) => {
      const entry =
        formCustomFields && (formCustomFields as Record<string, any>)[fieldId];
      if (!entry) return false;
      const hasValue =
        (entry.value !== undefined &&
          entry.value !== null &&
          entry.value !== '') ||
        (entry.optionID !== undefined &&
          entry.optionID !== null &&
          entry.optionID !== '');
      return hasValue && entry.deleted !== true;
    };
    const isUpdate = !!timeEntryId;
    const fromAssigned = assignedCustomFields
      .filter(isDropdown)
      .map((cf) => cf.id);
    const idsSet = new Set(fromAssigned);
    if (isUpdate) {
      allCustomFields.forEach((cf) => {
        if (
          isDropdown(cf) &&
          hasValueOnTimeEntry(cf.id) &&
          !idsSet.has(cf.id)
        ) {
          idsSet.add(cf.id);
        }
      });
    }
    return Array.from(idsSet).sort().join(',');
    // formCustomFields read via hasValueOnTimeEntry; we use formCustomFieldsSignature to avoid re-running on every form ref change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    assignedCustomFields,
    allCustomFields,
    timeEntryId,
    formCustomFieldsSignature,
  ]);

  // Parse the string back to array for API call
  const dropdownCFIds = useMemo(
    () => (dropdownCFIdsString ? dropdownCFIdsString.split(',') : []),
    [dropdownCFIdsString],
  );

  // ==================================================================================
  // CUSTOM FIELD OPTION ASSIGNMENT FETCHING
  // ==================================================================================
  // Fetch CFO (Custom Field Option) assignments when worker or customer changes
  // This determines WHICH OPTIONS within dropdown CFs are available for the worker
  // Make a single API call with all DROPDOWN-TYPE CF IDs
  // CRITICAL: Wait for CF definitions to be loaded before making CFO call
  // CRITICAL: When customer is present, also wait for CF assignment data to complete first
  useEffect(() => {
    if (!shouldUseAssignments) {
      return undefined;
    }

    if (!workerId && !customerId) {
      lastCFOFetchEntityRef.current = null;
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    // Wait for CF definitions to be loaded (needed for dropdownCFIds and mapping)
    if (dropdownCFIdsString === '') {
      return undefined;
    }

    if (dropdownCFIds.length === 0) {
      lastCFOFetchEntityRef.current = null;
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    if (!workerId) {
      lastCFOFetchEntityRef.current = null;
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    // When customer is present, wait for CF assignment data to be loaded first
    if (customerId) {
      const currentCustomerKey = `${customerId || 'null'}-${
        projectId || 'null'
      }`;

      if (cfDataLoadedForCustomer !== currentCustomerKey) {
        return undefined;
      }
    }

    const entityKey = `${workerId ?? ''}-${customerId ?? ''}`;
    const entityChanged = lastCFOFetchEntityRef.current !== entityKey;
    lastCFOFetchEntityRef.current = entityKey;
    if (entityChanged) {
      setCustomFieldOptionAssignments({});
    }

    // Make a single API call with all dropdown CF IDs as an array
    loadCustomFieldOptionAssignments({
      input: {
        timeForEntityId: workerId || null,
        timeAgainstEntityId: customerId || null,
        customFieldIds: dropdownCFIds, // Pass array of all CF IDs
      },
      filter: {
        assigned: true, // Always true when timeFor or timeAgainst is present
        active: true, // Only active options
      },
      first: 100,
    });

    return undefined;
    // Intentionally depend on dropdownCFIdsString (not dropdownCFIds array) to avoid effect re-running on every array ref change
    // dropdownCFIdsString will be empty if CF definitions aren't loaded yet, which prevents CFO call
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shouldUseAssignments,
    workerId,
    customerId,
    projectId,
    cfDataLoadedForCustomer,
    dropdownCFIdsString,
    loadCustomFieldOptionAssignments,
  ]);

  // ==================================================================================
  // STABLE CF OPTIONS SIGNATURE
  // ==================================================================================
  // Create a stable string representation of CF options to prevent infinite loop
  // Only changes when the actual CF options data changes, not when allCustomFields array reference changes
  const cfOptionsSignature = useMemo(() => {
    const relevantData: Record<
      string,
      Array<{ id: string; name: string }>
    > = {};
    allCustomFields.forEach((cf) => {
      if (cf.options && cf.options.length > 0) {
        relevantData[cf.id] = cf.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
        }));
      }
    });
    return JSON.stringify(relevantData);
  }, [allCustomFields]);

  // ==================================================================================
  // CFO DATA STORAGE
  // ==================================================================================
  // Store CFO assignment data when it arrives
  // Group options by custom field ID
  // IMPORTANT: Only include options where assigned: true
  // CRITICAL: Initialize all queried CFs with empty arrays first, then populate
  // Match option IDs from CFO with option names from CF definitions
  useEffect(() => {
    // Parse dropdownCFIds from string
    const cfIds = dropdownCFIdsString ? dropdownCFIdsString.split(',') : [];

    // Always initialize with empty arrays for all dropdown CFs being tracked
    // This ensures CFs with NO assigned options get an empty array (not undefined)
    const initializedStorage: Record<string, any[]> = {};
    cfIds.forEach((cfId) => {
      initializedStorage[cfId] = [];
    });

    if (customFieldOptionData && customFieldOptionData.length > 0) {
      // Parse CF options from signature
      const cfOptionsMap: Record<
        string,
        Array<{ id: string; name: string }>
      > = cfOptionsSignature ? JSON.parse(cfOptionsSignature) : {};

      // Check if CF definitions are available for mapping
      const hasCFData = Object.keys(cfOptionsMap).length > 0;

      // Only process options if CF definitions are available
      // This prevents showing IDs when CF data hasn't loaded yet
      if (hasCFData) {
        // Group options by customFieldId, filtering to only assigned options
        customFieldOptionData.forEach((option) => {
          if (!option.assigned) {
            return;
          }

          const cfId = option.customFieldId;
          const cfOptions = cfOptionsMap[cfId] || [];
          let matchingOption = cfOptions.find((opt) => opt.id === option.id);

          // Fallback: when CFO option id (from QL) and CF option id (from CES) differ by prefix, match on last part after underscore
          if (!matchingOption && option.id?.includes('_')) {
            const optionIdSuffix = option.id.split('_').pop();
            matchingOption = cfOptions.find(
              (opt) =>
                opt.id?.includes('_') &&
                opt.id.split('_').pop() === optionIdSuffix,
            );
            // log out the information that the suffix fallback was used for this custom field options mapping
            if (matchingOption) {
              sandbox.logger.info(
                'Event=STEAssignments Message=Suffix fallback was used as CFO ids provided by CES and QL dont match',
                {
                  cfId,
                },
              );
            }
          }

          // Skip if option not found in CF definitions (prevents showing IDs)
          if (!matchingOption) {
            return;
          }

          if (!initializedStorage[cfId]) {
            initializedStorage[cfId] = [];
          }

          initializedStorage[cfId].push({
            ...option,
            name: matchingOption.name, // Use name from CF definition only
          });
        });
      }
    }

    setCustomFieldOptionAssignments(initializedStorage);
  }, [customFieldOptionData, dropdownCFIdsString, cfOptionsSignature]);

  // ==================================================================================
  // RETURN VALUES
  // ==================================================================================
  return {
    visibleCustomFields, // CFs that should be shown (enabled AND assigned)
    standardFieldsVisibility, // SF visibility flags
    loading:
      customFieldLoading || standardFieldLoading || customFieldOptionLoading,
    workerId, // Current worker ID
    customerId, // Current customer ID
    projectId, // Current project ID
    customFieldOptionAssignments, // CFO data for dropdowns (keyed by CF ID)
  };
};
