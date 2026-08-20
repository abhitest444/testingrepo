import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useSandbox } from '@payroll/quicksand';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import {
  getFallbackStandardFieldsVisibility,
  getStandardFieldsVisibilityWithAssignmentOverride,
  shouldUseAssignmentLogic,
  getStandardFieldAssignmentFilter,
  getCustomFieldAssignmentFilter,
} from 'src/js/common/assignmentFieldUtils';
import { CustomField as CustomFieldType } from 'src/js/widgets/common/customFields/utils';

export interface UseTimeClockFieldAssignmentsProps {
  companySettings: any;
  allCustomFields: CustomFieldType[];
}

export interface UseTimeClockFieldAssignmentsResult {
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
 * Custom hook for managing field assignments in Time Clock
 *
 * This hook handles:
 * - Field visibility (which SF/CF to show/hide)
 * - Custom field option filtering
 * - Assignment-based field configuration
 *
 * Pattern:
 * 1. Watch form fields (timeFor, timeAgainst) to get worker/customer IDs
 * 2. Fetch SF and CF assignments when customer changes
 * 3. Calculate field visibility based on assignments or company settings
 * 4. Fetch CFO (Custom Field Options) for dropdown CFs
 *
 * @param props - Configuration object
 * @returns Field visibility state and loading status
 */
export const useTimeClockFieldAssignments = ({
  companySettings,
  allCustomFields,
}: UseTimeClockFieldAssignmentsProps): UseTimeClockFieldAssignmentsResult => {
  const sandbox = useSandbox();
  // Watch form fields for worker and customer changes
  const timeFor = useWatch({ name: 'timeFor' });
  const timeAgainst = useWatch({ name: 'timeAgainst' });

  const workerId = timeFor?.id;
  const customerId = timeAgainst?.customer?.id;
  const projectId = timeAgainst?.project?.id;

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

  // Determine if we should use assignments (Time Clock is always OTX)
  const hasCustomerOrProject =
    (customerId && customerId !== '') || (projectId && projectId !== '');
  const hasAssignmentError = !!(customFieldError || standardFieldError);

  // Time Clock is always OTX → assignments are always applicable.
  const useAssignments = shouldUseAssignmentLogic(
    true,
    hasCustomerOrProject,
    hasAssignmentError,
  );

  // Calculate SF and CF assignment filters
  const sfFilterAssigned = useMemo(
    () => getStandardFieldAssignmentFilter(companySettings).assigned,
    [companySettings],
  );

  const cfFilterAssigned = useMemo(
    () =>
      getCustomFieldAssignmentFilter(companySettings, allCustomFields).assigned,
    [companySettings, allCustomFields],
  );

  // Create a stable key for fetch triggering
  const assignmentKey = useMemo(() => {
    if (!hasCustomerOrProject) return null;
    return `${customerId || 'null'}-${
      projectId || 'null'
    }-${sfFilterAssigned}-${cfFilterAssigned}`;
  }, [
    hasCustomerOrProject,
    customerId,
    projectId,
    sfFilterAssigned,
    cfFilterAssigned,
  ]);

  // CF should also be fetched when worker is set but no customer (worker-only)
  const shouldFetchCF = useMemo(
    () => allCustomFields.length > 0 && (hasCustomerOrProject || workerId),
    [allCustomFields.length, hasCustomerOrProject, workerId],
  );

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
    if (allCustomFields.length > 0 && (hasCustomerOrProject || workerId)) {
      setCfDataLoadedForCustomer(null);
    }

    // Time Clock uses customer id only; do not pass projectId at all
    const input = { customerId };

    // Fetch CF: with customer when present, or null + assigned true when worker-only
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

    // SF only when we have customer/project
    if (assignmentKey) {
      if (sfFilterAssigned === true) {
        loadStandardFieldAssignments({
          input,
          filter: { assigned: true },
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

  // Update state when CF assignment data arrives
  useEffect(() => {
    if (customFieldData) {
      setCustomFieldAssignments(customFieldData);
      // Mark CF data as loaded for current customer
      const customerKey = `${customerId || 'null'}-${projectId || 'null'}`;
      setCfDataLoadedForCustomer(customerKey);
    }
  }, [customFieldData, customerId, projectId]);

  // Update state when SF assignment data arrives
  useEffect(() => {
    if (standardFieldData) {
      setStandardFieldAssignments(standardFieldData);
      // Mark SF data as loaded for current customer
      const customerKey = `${customerId || 'null'}-${projectId || 'null'}`;
      setSfDataLoadedForCustomer(customerKey);
    }
  }, [standardFieldData, customerId, projectId]);

  // Assigned CFs (enabled + assigned) - filter by CF API response (Time Clock is always OTX)
  const assignedCustomFields = useMemo(() => {
    const assignedFieldIds = new Set(
      customFieldAssignments.filter((cf) => cf.assigned).map((a) => a.id),
    );
    return allCustomFields.filter((field) => assignedFieldIds.has(field.id));
  }, [allCustomFields, customFieldAssignments]);

  // Hide dropdown CFs that have no options assigned (also drops required validation).
  // Show dropdown CFs while CFO is loading so the field is visible; hide only once loaded and options are empty.
  const visibleCustomFields = useMemo(
    () =>
      assignedCustomFields.filter((field) => {
        const isDropdown =
          field.type?.toUpperCase() === 'DROPDOWN' ||
          field.type?.toUpperCase() === 'MULTI_SELECT' ||
          (field.options && field.options.length > 0);
        if (!isDropdown) return true;
        const options = customFieldOptionAssignments[field.id];
        const hasOptions = Array.isArray(options) && options.length > 0;
        if (customFieldOptionLoading) return true; // show while loading so dropdown appears
        return hasOptions;
      }),
    [
      assignedCustomFields,
      customFieldOptionAssignments,
      customFieldOptionLoading,
    ],
  );

  // Calculate standard fields visibility (must be before SFO fetching that depends on it)
  const standardFieldsVisibility = useMemo(() => {
    // If assignments shouldn't be used, fall back to company settings
    if (!useAssignments) {
      return getFallbackStandardFieldsVisibility(companySettings);
    }

    // If all SFs are enabled (sfFilterAssigned is null), we don't fetch SF assignments
    if (sfFilterAssigned !== true) {
      return getFallbackStandardFieldsVisibility(companySettings);
    }

    // Show if enabled in company settings OR in SF response (disabled-in-settings still show when assigned).
    return getStandardFieldsVisibilityWithAssignmentOverride(
      companySettings,
      standardFieldAssignments,
    );
  }, [
    useAssignments,
    companySettings,
    sfFilterAssigned,
    standardFieldAssignments,
  ]);

  // Get dropdown CF IDs for CFO fetching. Use same "dropdown" definition as visibleCustomFields:
  // DROPDOWN, MULTI_SELECT, or any CF with options (e.g. type "string" with options like listtype).
  const dropdownCFIdsString = useMemo(() => {
    const dropdown = assignedCustomFields.filter((cf) => {
      const type = cf.type?.toUpperCase();
      const hasOptions = cf.options && cf.options.length > 0;
      return type === 'DROPDOWN' || type === 'MULTI_SELECT' || !!hasOptions;
    });
    return dropdown
      .map((cf) => cf.id)
      .sort()
      .join(',');
  }, [assignedCustomFields]);

  // Parse the string back to array for API call
  const dropdownCFIds = useMemo(
    () => (dropdownCFIdsString ? dropdownCFIdsString.split(',') : []),
    [dropdownCFIdsString],
  );

  // Fetch CFO assignments for dropdown CFs
  // IMPORTANT: When customer is present, wait for CF assignments to complete first
  useEffect(() => {
    // CFO should be called when worker OR customer is present
    if (!workerId && !customerId) {
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    if (dropdownCFIds.length === 0) {
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    // Only fetch if we have workerId (required by CFO API)
    if (!workerId) {
      setCustomFieldOptionAssignments({});
      return undefined;
    }

    // CRITICAL: When customer is present, wait for CF data to be loaded first
    if (customerId) {
      const currentCustomerKey = `${customerId || 'null'}-${
        projectId || 'null'
      }`;

      // Check if CF data has been loaded for the current customer
      if (cfDataLoadedForCustomer !== currentCustomerKey) {
        // CF data not yet loaded for this customer, wait...
        return undefined;
      }
    }

    // Clear previous CFO data
    setCustomFieldOptionAssignments({});

    // Make a single API call with all dropdown CF IDs as an array
    loadCustomFieldOptionAssignments({
      input: {
        timeForEntityId: workerId || null,
        timeAgainstEntityId: customerId || null,
        customFieldIds: dropdownCFIds, // Pass array of all CF IDs
      },
      filter: {
        assigned: true,
        active: true,
      },
      first: 100,
    });

    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workerId,
    customerId,
    projectId,
    cfDataLoadedForCustomer, // Wait for CF data
    dropdownCFIdsString, // Use string for stable dependency
    loadCustomFieldOptionAssignments,
  ]);

  // Fetch SFO (Standard Field Option) assignments when worker or customer changes.
  // Standard field option (SFO) logic:
  // Worker + customer: Call SFO only for visible fields. assigned = true only when
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

  // Store CFO data when it arrives
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

      // Group options by customFieldId, filtering to only assigned options
      customFieldOptionData.forEach((option) => {
        // Only include options where assigned is true
        if (option.assigned === true) {
          const cfId = option.customFieldId;

          // Look up the option name from the CF definition
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
                'Event=TimeClockAssignments Message=Suffix fallback was used as CFO ids provided by CES and QL dont match',
                { cfId },
              );
            }
          }
          const optionName = matchingOption?.name || option.name || option.id;

          if (!initializedStorage[cfId]) {
            initializedStorage[cfId] = [];
          }
          initializedStorage[cfId].push({
            ...option,
            name: optionName, // Use name from CF definition
          });
        }
      });
    }

    setCustomFieldOptionAssignments(initializedStorage);
  }, [customFieldOptionData, dropdownCFIdsString, cfOptionsSignature]);

  return {
    visibleCustomFields,
    standardFieldsVisibility,
    loading:
      customFieldLoading || standardFieldLoading || customFieldOptionLoading,
    workerId,
    customerId,
    projectId,
    customFieldOptionAssignments,
  };
};
