import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import Typography from '@ids-ts/typography';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useGetCustomFieldsForAssignments } from 'src/js/service/hooks/assignments/useGetCustomFieldsForAssignments';
import useGetPreferences from 'src/js/service/hooks/preferenceces/useGetPreferences';
import {
  useManageTimeAgainstFieldAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageTimeAgainstFieldAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { TimeAgainstAssignmentSummaryEdge } from 'src/js/service/types/assignmentTypes';
import { IntlFormatter } from 'src/js/widgets/common/assignment/assignmentUtils';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import { CUSTOMER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import { isStandardFieldDisabled } from 'src/js/common/assignmentFieldUtils';
import { useGetQLSettings } from 'src/js/service/hooks/settings/useGetQLSettings';
import { buildHierarchicalTimeAgainstList } from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';

interface FieldAssignmentIntegrationProps {
  node: TimeAgainstAssignmentSummaryEdge;
  allEdges?: TimeAgainstAssignmentSummaryEdge[];
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onShowSuccess?: (message: string) => void;
}

// Helper to get standard field display name from NLS
const getStandardFieldDisplayName = (
  fieldName: string,
  intl: IntlFormatter,
  preferences: any,
): string => {
  // Special case for LOCATION - use preferences
  if (fieldName === 'LOCATION') {
    return (
      preferences?.Preferences?.AccountingInfoPrefs?.DepartmentTerminology ||
      intl.formatMessage({ id: 'assignments.standardField.LOCATION' })
    );
  }

  // Get from NLS
  return intl.formatMessage({ id: `assignments.standardField.${fieldName}` });
};

// Standard field order
const STANDARD_FIELD_ORDER = ['SERVICE_ITEM', 'BILLABLE', 'CLASS', 'LOCATION'];

const FieldAssignmentIntegration: React.FC<FieldAssignmentIntegrationProps> = ({
  node,
  allEdges = [],
  onClose,
  onSuccess,
  onError,
  onShowSuccess,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  // Extract data from node
  const { project, customer } = node.node.timeAgainst.timeAgainstContactDAS;
  const customerId = customer?.id;
  const projectId = project?.id;
  const displayName = node.node.timeAgainst.displayName || '';

  const { qlSettings: companySettings } = useGetQLSettings();

  // State to store combined fields
  const [combinedFields, setCombinedFields] = useState<AssignmentItem[]>([]);

  // State to store last changes for error reporting
  const [lastChanges, setLastChanges] = useState<AssignmentChanges | null>(
    null,
  );

  // State to store drawer-level error (pure failures only)
  const [drawerError, setDrawerError] = useState<DetailedErrorInfo | null>(
    null,
  );

  // Mutation hook for saving field assignments
  const [manageTimeAgainstFieldAssignment, { loading: mutationLoading }] =
    useManageTimeAgainstFieldAssignment({
      onSuccess: () => {
        sandbox.logger.info('Field assignment saved successfully');

        setDrawerError(null);
        const successMsg = intl.formatMessage({
          id: 'assignments.fieldAssignment.saveSuccess',
        });
        onShowSuccess?.(successMsg);
      },
      onPartialSuccess: (errorInfo: PartialSuccessErrorInfo) => {
        sandbox.logger.warn('Field assignment partially succeeded', {
          errorInfo,
        });

        const detailedError: DetailedErrorInfo = {
          title: intl.formatMessage(
            { id: 'assignments.fieldAssignment.partialSuccess.title' },
            { successCount: errorInfo.successCount },
          ),
          isPartialSuccess: true,
        };

        setDrawerError(null);
        onError?.(detailedError);
      },
      onError: (errorMessage) => {
        sandbox.logger.error('Field assignment failed', { errorMessage });

        const detailedError: DetailedErrorInfo = {
          title: intl.formatMessage({
            id: 'assignments.fieldAssignment.error.title',
          }),
          subtitle: intl.formatMessage({
            id: 'assignments.fieldAssignment.error.subtitle',
          }),
        };

        setDrawerError(detailedError);
      },
    });

  // Call all three APIs
  const {
    loadStandardFieldAssignments,
    loading: standardFieldsLoading,
    data: standardFieldsData,
  } = useStandardFieldAssignments();

  const {
    loadCustomFieldAssignments,
    loading: customFieldsLoading,
    data: customFieldsData,
  } = useCustomFieldAssignments();

  // Fetch custom field metadata (names) for display
  const {
    customFields: allCustomFields,
    loading: allCustomFieldsLoading,
    loadCustomFieldsForAssignments,
  } = useGetCustomFieldsForAssignments();

  const { data: preferencesData, loading: preferencesDataLoading } =
    useGetPreferences();

  // Fetch data on mount and track drawer open
  useEffect(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGN_FIELDS_DRAWER_OPEN);

    // Fetch standard fields
    loadStandardFieldAssignments({
      first: 100,
      input: {
        customerId,
        projectId,
      },
    });

    // Fetch custom field assignments (which fields are assigned)
    loadCustomFieldAssignments({
      first: 100,
      input: {
        customerId,
        projectId,
      },
    });

    // Fetch custom field metadata (names for display)
    loadCustomFieldsForAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, projectId]);

  // Create a lookup map for custom field ID -> name
  const customFieldNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCustomFields.forEach((field) => {
      map.set(field.id, field.name);
    });
    return map;
  }, [allCustomFields]);

  // Transform and combine data when all APIs return
  useEffect(() => {
    if (
      !standardFieldsLoading &&
      !customFieldsLoading &&
      !preferencesDataLoading &&
      !allCustomFieldsLoading &&
      standardFieldsData &&
      customFieldsData &&
      preferencesData &&
      allCustomFields &&
      companySettings
    ) {
      // Transform standard fields
      const transformedStandardFields: AssignmentItem[] = standardFieldsData
        .filter((field) => field.name !== 'BILLABLE_RATE')
        .map((field) => ({
          id: field.name, // Use API name as string ID
          name: getStandardFieldDisplayName(field.name, intl, preferencesData),
          level: 0,
          parentId: undefined,
          hasChildren: false,
          isSelected: field.assigned,
          disabled: !isStandardFieldDisabled(field.name, companySettings),
        }));

      // Sort standard fields by defined order
      const sortedStandardFields = transformedStandardFields.sort((a, b) => {
        const indexA = STANDARD_FIELD_ORDER.indexOf(String(a.id));
        const indexB = STANDARD_FIELD_ORDER.indexOf(String(b.id));
        return indexA - indexB;
      });

      // Transform custom fields - now with actual names!
      const transformedCustomFields: AssignmentItem[] = customFieldsData.map(
        (field) => ({
          id: field.id, // Use custom field ID as string
          name: customFieldNameMap.get(field.id) || field.id, // Lookup name, fallback to ID
          level: 0,
          parentId: undefined,
          hasChildren: false,
          isSelected: field.assigned,
          disabled: field.assignedToAll, // Disable if assigned to all customers/projects
        }),
      );

      // Combine: Standard first, then custom
      const combined = [...sortedStandardFields, ...transformedCustomFields];

      // Store in state
      setCombinedFields(combined);
    }
    // customFieldNameMap is derived from allCustomFields, so we only need allCustomFields in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    standardFieldsLoading,
    customFieldsLoading,
    preferencesDataLoading,
    allCustomFieldsLoading,
    standardFieldsData,
    customFieldsData,
    preferencesData,
    allCustomFields,
    companySettings,
  ]);

  // Calculate loading state (includes mutation loading)
  const isLoading =
    standardFieldsLoading ||
    customFieldsLoading ||
    preferencesDataLoading ||
    allCustomFieldsLoading ||
    mutationLoading;

  // Calculate initial selections (fields that are already assigned)
  const initialSelections = useMemo(
    () =>
      new Set(
        combinedFields
          .filter((field) => field.isSelected)
          .map((field) => field.id),
      ),
    [combinedFields],
  );

  // Mock fetch function for drawer (we already have the data)
  const fetchFieldData = async () => ({
    items: combinedFields,
    hasNextPage: false,
    endCursor: null,
    totalCount: combinedFields.length,
  });

  // Handle save
  const handleSave = async (changes: AssignmentChanges) => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.SAVE_FIELDS);

    // Store changes for error reporting
    setLastChanges(changes);

    // Separate standard and custom field IDs from newlyAssigned/newlyUnassigned
    const standardFieldIdsToAssign: string[] = [];
    const standardFieldIdsToUnassign: string[] = [];
    const customFieldIdsToAssign: string[] = [];
    const customFieldIdsToUnassign: string[] = [];

    // Process newlyAssigned
    changes.newlyAssigned.forEach((id) => {
      const field = combinedFields.find((f) => f.id === id);
      if (field && !field.disabled) {
        // Check if it's a standard field (ID is in STANDARD_FIELD_ORDER)
        if (STANDARD_FIELD_ORDER.includes(String(id))) {
          standardFieldIdsToAssign.push(String(id));
        } else {
          // It's a custom field
          customFieldIdsToAssign.push(String(id));
        }
      }
    });

    // Process newlyUnassigned
    changes.newlyUnassigned.forEach((id) => {
      const field = combinedFields.find((f) => f.id === id);
      if (field && !field.disabled) {
        if (STANDARD_FIELD_ORDER.includes(String(id))) {
          standardFieldIdsToUnassign.push(String(id));
        } else {
          customFieldIdsToUnassign.push(String(id));
        }
      }
    });

    // Check if user selected all (no specific IDs, just assignToAll flag)
    const { isSelectAll } = changes;

    // Build standard field assignments object
    const hasStandardFieldChanges =
      standardFieldIdsToAssign.length > 0 ||
      standardFieldIdsToUnassign.length > 0;

    let standardFieldAssignments;
    if (isSelectAll) {
      // When select all, send assignToAll: true without specific IDs
      standardFieldAssignments = {
        assignToAll: true,
      };
    } else if (hasStandardFieldChanges) {
      // When there are specific changes, send the IDs
      standardFieldAssignments = {
        standardFieldsToAssign:
          standardFieldIdsToAssign.length > 0
            ? standardFieldIdsToAssign
            : undefined,
        standardFieldsToUnassign:
          standardFieldIdsToUnassign.length > 0
            ? standardFieldIdsToUnassign
            : undefined,
      };
    } else {
      standardFieldAssignments = undefined;
    }

    // Build custom field assignments object
    const hasCustomFieldChanges =
      customFieldIdsToAssign.length > 0 || customFieldIdsToUnassign.length > 0;

    let customFieldAssignments;
    if (isSelectAll) {
      // When select all, send assignToAll: true without specific IDs
      customFieldAssignments = {
        assignToAll: true,
      };
    } else if (hasCustomFieldChanges) {
      // When there are specific changes, send the IDs
      customFieldAssignments = {
        customFieldIdsToAssign:
          customFieldIdsToAssign.length > 0
            ? customFieldIdsToAssign
            : undefined,
        customFieldIdsToUnassign:
          customFieldIdsToUnassign.length > 0
            ? customFieldIdsToUnassign
            : undefined,
      };
    } else {
      customFieldAssignments = undefined;
    }

    // Build hierarchical timeAgainstList based on parent/child relationships
    const timeAgainstList = buildHierarchicalTimeAgainstList(node, allEdges);

    // Build the mutation input
    const input = {
      timeAgainst: {
        customerId: customerId!,
        projectId: projectId || undefined,
      },
      timeAgainstList,
      standardFieldAssignments,
      customFieldAssignments,
    };

    // Call the mutation (success/error handling done in hook callbacks)
    await manageTimeAgainstFieldAssignment({
      variables: {
        input,
      },
    });
  };

  // Drawer configuration
  const config: AssignmentDrawerConfig = {
    assignmentType: 'FieldAssignment',
    dataSource: {
      fetchData: fetchFieldData,
      searchMode: 'client', // Client-side search only
    },
    ui: {
      searchPlaceholder: '',
      searchSupported: true,
      searchExpandable: false,
      fieldName: displayName,
    },
    table: {
      columns: [
        {
          key: 'name',
          header: '', // Automatically derived from assignmentType
        },
      ],
      sortable: false,
      defaultExpanded: false,
      hierarchicalSelection: false, // Flat structure
    },
    pagination: {
      enabled: false, // No pagination needed - all fields fetched at once
      defaultPageSize: 100,
    },
    callbacks: {
      onSave: handleSave,
    },
  };

  const errorMessageComponent = drawerError ? (
    <PageMessage
      type="error"
      open
      onClose={() => setDrawerError(null)}
      title={drawerError.title}
    >
      {drawerError.subtitle && (
        <Typography variant="body-3" weight="demi">
          {drawerError.subtitle}
        </Typography>
      )}
      {drawerError.description && (
        <Typography variant="body-3">{drawerError.description}</Typography>
      )}
    </PageMessage>
  ) : undefined;

  const handleClose = useCallback(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.CANCEL_FIELDS);
    setDrawerError(null);
    onClose();
  }, [track, onClose]);

  return (
    <AssignmentDrawer
      open
      onClose={handleClose}
      config={config}
      initialSelections={initialSelections}
      loading={isLoading}
      errorMessage={errorMessageComponent}
    />
  );
};

export default FieldAssignmentIntegration;
