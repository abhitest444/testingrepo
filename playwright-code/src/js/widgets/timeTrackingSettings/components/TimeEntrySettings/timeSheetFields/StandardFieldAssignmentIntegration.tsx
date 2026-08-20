import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSandbox, useIntl, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import Typography from '@ids-ts/typography';
import {
  STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS,
  AssignedToType,
} from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { useTimeAgainstAssignments } from 'src/js/service/hooks/assignments/useTimeAgainstAssignments';
import {
  useManageStandardFieldAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageStandardFieldAssignment';
import { useManageStandardFieldOptionTimeAgainstAssignment } from 'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeAgainstAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
  FetchParams,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { transformTimeAgainstIds } from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
import { getFieldAssignmentLabel } from 'src/js/widgets/common/assignment/assignmentUtils';
import { ITimeSheetFieldOption } from 'src/js/widgets/timeTrackingSettings/types';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import {
  LoggingConfigProvider,
  useLoggingConfig,
} from 'src/js/providers/LoggingConfigProvider';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/timeTrackingSettings/store';
import {
  STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE,
  appendData,
  resetStandardFieldAssignmentsState,
  setLoading,
  selectStandardFieldAssignmentsAllItems,
  selectStandardFieldAssignmentsTotalCount,
  selectStandardFieldAssignmentsLoading,
  selectStandardFieldAssignmentsHasMore,
  selectStandardFieldAssignmentsEndCursor,
} from 'src/js/widgets/timeTrackingSettings/store/standardFieldAssignmentsSlice';

export interface StandardFieldOption {
  id: string;
  name: string;
}

interface StandardFieldAssignmentIntegrationProps {
  field: ITimeSheetFieldOption;
  fieldDisplayName: string; // Translated field name from parent
  standardFieldOption?: StandardFieldOption; // Optional standard field option for option-level assignments
  onClose: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onShowSuccess?: (message: string) => void;
}
// Standard Field Assignment Integration for Customers
const StandardFieldAssignmentIntegrationInternal: React.FC<
  StandardFieldAssignmentIntegrationProps
> = ({
  field,
  fieldDisplayName,
  standardFieldOption,
  onClose,
  onError,
  onShowSuccess,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const logger = useLoggingConfig();
  const isMountedRef = useRef(true);
  const dispatch = useAppDispatch();
  const fieldLabel = getFieldAssignmentLabel(field.key);

  // Determine assigned_to type based on whether we have a standardFieldOption
  const assignedToType: AssignedToType = standardFieldOption
    ? 'standard_field_item'
    : 'standard_field';

  const allItems = useAppSelector(selectStandardFieldAssignmentsAllItems);
  const totalCount = useAppSelector(selectStandardFieldAssignmentsTotalCount);
  const reduxLoading = useAppSelector(selectStandardFieldAssignmentsLoading);
  const hasMore = useAppSelector(selectStandardFieldAssignmentsHasMore);
  const endCursor = useAppSelector(selectStandardFieldAssignmentsEndCursor);

  const [drawerError, setDrawerError] = useState<DetailedErrorInfo | null>(
    null,
  );

  const handleMutationSuccess = useCallback(() => {
    logger.info('Standard field assignment saved successfully');
    onShowSuccess?.(
      intl.formatMessage({ id: 'assignments.fieldAssignment.saveSuccess' }),
    );
  }, [intl, onShowSuccess, logger]);

  const handleMutationPartialSuccess = useCallback(
    (errorInfo: PartialSuccessErrorInfo) => {
      logger.warn('Standard field assignment partially succeeded', {
        errorInfo,
      });
      onError?.({
        title: intl.formatMessage(
          { id: 'assignments.fieldAssignment.partialSuccess.title' },
          { successCount: errorInfo.successCount },
        ),
        isPartialSuccess: true,
      });
    },
    [intl, onError, logger],
  );

  const handleMutationError = useCallback(
    (errorMessage: string) => {
      logger.error('Standard field assignment failed', { errorMessage });
      if (isMountedRef.current) {
        setDrawerError({
          title: intl.formatMessage({
            id: 'assignments.fieldAssignment.error.title',
          }),
          subtitle: errorMessage,
        });
      }
    },
    [intl, logger],
  );

  // Hook for field-level assignments (when no option is specified)
  const [manageStandardFieldAssignment, { loading: fieldMutationLoading }] =
    useManageStandardFieldAssignment({
      onSuccess: handleMutationSuccess,
      onPartialSuccess: handleMutationPartialSuccess,
      onError: handleMutationError,
    });

  // Hook for option-level assignments (when standardFieldOption is specified)
  const [
    manageStandardFieldOptionTimeAgainstAssignment,
    { loading: optionMutationLoading },
  ] = useManageStandardFieldOptionTimeAgainstAssignment({
    onSuccess: handleMutationSuccess,
    onPartialSuccess: handleMutationPartialSuccess,
    onError: handleMutationError,
  });

  // Combined mutation loading state
  const mutationLoading = fieldMutationLoading || optionMutationLoading;

  const {
    loadTimeAgainstAssignments,
    data: apiData,
    pageInfo: apiPageInfo,
    totalTimeAgainstCount,
  } = useTimeAgainstAssignments();

  useEffect(() => {
    dispatch(resetStandardFieldAssignmentsState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const transformedItems: AssignmentItem[] = apiData.map(
        (item): AssignmentItem => {
          const customerId = item.timeAgainstContactDAS.customer?.id;
          const projectId = item.timeAgainstContactDAS.project?.id;

          return {
            id: customerId || projectId || '',
            name: item.displayName || item.fullName || '',
            level: item.level ?? 0,
            parentId: item.parentId,
            hasChildren: (item.numChildren ?? 0) > 0,
            isSelected: item.assigned,
          };
        },
      );

      dispatch(
        appendData({
          items: transformedItems,
          totalCount: totalTimeAgainstCount || transformedItems.length,
          hasNextPage: apiPageInfo?.hasNextPage || false,
          endCursor: apiPageInfo?.endCursor || null,
        }),
      );
    } else if (totalTimeAgainstCount !== null && apiData.length === 0) {
      // Data loaded but empty (0 customers) - set loading to false
      dispatch(setLoading(false));
    }
  }, [apiData, apiPageInfo, totalTimeAgainstCount, dispatch]);

  const initialSelections = useMemo(
    () =>
      new Set(
        allItems.filter((item) => item.isSelected).map((item) => item.id),
      ),
    [allItems],
  );

  const handleSave = useCallback(
    async (changes: AssignmentChanges) => {
      // Track save action
      track({
        ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.SAVE_ASSIGNMENTS,
        assigned_to: assignedToType,
      });

      const timeAgainstToAssign = transformTimeAgainstIds(
        changes.newlyAssigned,
        apiData,
      );
      const timeAgainstToUnassign = transformTimeAgainstIds(
        changes.newlyUnassigned,
        apiData,
      );

      // If standardFieldOption is present, use the option-level mutation
      if (standardFieldOption?.id) {
        const optionInput: any = {
          standardFieldLabel: fieldLabel!,
          standardFieldOptionId: standardFieldOption.id,
        };

        if (changes.isSelectAll) {
          optionInput.assignToAll = true;
        } else {
          optionInput.timeAgainstAssignments = {
            timeAgainstToAssign:
              timeAgainstToAssign.length > 0 ? timeAgainstToAssign : [],
            timeAgainstToUnassign:
              timeAgainstToUnassign.length > 0 ? timeAgainstToUnassign : [],
          };
        }

        await manageStandardFieldOptionTimeAgainstAssignment({
          variables: { input: optionInput },
        });
      } else {
        // Use the field-level mutation when no option is specified
        const fieldInput: any = {
          standardFieldLabel: fieldLabel!,
        };

        if (changes.isSelectAll) {
          fieldInput.assignToAll = true;
        } else {
          fieldInput.timeAgainstAssignments = {
            timeAgainstToAssign:
              timeAgainstToAssign.length > 0 ? timeAgainstToAssign : [],
            timeAgainstToUnassign:
              timeAgainstToUnassign.length > 0 ? timeAgainstToUnassign : [],
          };
        }

        await manageStandardFieldAssignment({
          variables: { input: fieldInput },
        });
      }
    },
    [
      fieldLabel,
      standardFieldOption?.id,
      apiData,
      manageStandardFieldAssignment,
      manageStandardFieldOptionTimeAgainstAssignment,
      track,
      assignedToType,
    ],
  );

  const fetchData = useCallback(
    async (params: FetchParams) => {
      const page = params.page || 1;
      const pageSize = STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Only fetch if we haven't fetched yet (totalTimeAgainstCount is null before first fetch)
      if (
        allItems.length === 0 &&
        !reduxLoading &&
        totalTimeAgainstCount === null
      ) {
        dispatch(setLoading(true));

        // Always send standardFieldLabel, add standardFieldOption if present
        const queryInput: {
          standardFieldLabel: string;
          standardFieldOption?: string;
        } = {
          standardFieldLabel: fieldLabel!,
        };
        if (standardFieldOption?.id) {
          queryInput.standardFieldOption = standardFieldOption.id;
        }

        loadTimeAgainstAssignments({
          first: STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE,
          input: queryInput,
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount: 0 };
      }

      if (endIndex <= allItems.length) {
        return {
          items: allItems.slice(startIndex, endIndex),
          totalCount,
        };
      }

      // Need more data - trigger API and return empty to show loading
      if (hasMore && endCursor && !reduxLoading) {
        dispatch(setLoading(true));

        // Always send standardFieldLabel, add standardFieldOption if present
        const queryInput: {
          standardFieldLabel: string;
          standardFieldOption?: string;
        } = {
          standardFieldLabel: fieldLabel!,
        };
        if (standardFieldOption?.id) {
          queryInput.standardFieldOption = standardFieldOption.id;
        }

        loadTimeAgainstAssignments({
          first: STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE,
          after: endCursor,
          input: queryInput,
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount };
      }

      // No more data or already loading
      return {
        items: allItems.slice(startIndex, endIndex),
        totalCount,
      };
    },
    [
      allItems,
      totalCount,
      hasMore,
      endCursor,
      reduxLoading,
      totalTimeAgainstCount,
      fieldLabel,
      standardFieldOption?.id,
      loadTimeAgainstAssignments,
      dispatch,
    ],
  );

  const config: AssignmentDrawerConfig = useMemo(
    () => ({
      assignmentType: 'CustomerAssignment',
      dataSource: {
        fetchData,
        searchMode: 'client',
      },
      ui: {
        searchPlaceholder: '',
        searchSupported: true,
        searchExpandable: true,
        fieldName: standardFieldOption
          ? standardFieldOption.name
          : fieldDisplayName,
      },
      table: {
        columns: [{ key: 'name', header: '' }],
        sortable: false,
        defaultExpanded: true,
        hierarchicalSelection: true, // Enable parent-child cascade selection
      },
      pagination: {
        enabled: true,
        defaultPageSize: STANDARD_FIELD_ASSIGNMENT_PAGE_SIZE,
      },
      callbacks: {
        onSave: handleSave,
        onSearch: (searchValue: string) => {
          if (searchValue.trim()) {
            track(
              STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.SEARCH_CUSTOMERS_ASSIGNMENT_DRAWER,
            );
          }
        },
      },
    }),
    [fetchData, fieldDisplayName, standardFieldOption, handleSave, track],
  );

  // Handle close/cancel action with tracking
  const handleClose = useCallback(() => {
    // Track cancel action
    track({
      ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.CANCEL_ASSIGNMENTS,
      assigned_to: assignedToType,
    });
    setDrawerError(null);
    onClose();
  }, [track, assignedToType, onClose]);

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

  if (!fieldLabel) {
    return null;
  }

  return (
    <AssignmentDrawer
      open
      onClose={handleClose}
      config={config}
      initialSelections={initialSelections}
      loading={reduxLoading || mutationLoading}
      errorMessage={errorMessageComponent}
    />
  );
};

const StandardFieldAssignmentIntegration: React.FC<
  StandardFieldAssignmentIntegrationProps
> = (props) => {
  const sandbox = useSandbox();

  return (
    <LoggingConfigProvider sandbox={sandbox} prefix="StandardFieldAssignment">
      <StandardFieldAssignmentIntegrationInternal {...props} />
    </LoggingConfigProvider>
  );
};

export default StandardFieldAssignmentIntegration;
