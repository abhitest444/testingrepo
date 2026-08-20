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
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import {
  useManageStandardFieldOptionTimeForAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageStandardFieldOptionTimeForAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
  FetchParams,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { processAssignmentChanges } from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
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
  STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE,
  appendData,
  resetStandardFieldWorkerAssignmentsState,
  setLoading,
  selectStandardFieldWorkerAssignmentsAllItems,
  selectStandardFieldWorkerAssignmentsTotalCount,
  selectStandardFieldWorkerAssignmentsLoading,
  selectStandardFieldWorkerAssignmentsHasMore,
  selectStandardFieldWorkerAssignmentsEndCursor,
} from 'src/js/widgets/timeTrackingSettings/store/standardFieldWorkerAssignmentsSlice';

export interface StandardFieldOption {
  id: string;
  name: string;
}

interface StandardFieldWorkerAssignmentIntegrationProps {
  field: ITimeSheetFieldOption;
  fieldDisplayName: string;
  standardFieldOption: StandardFieldOption;
  onClose: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onShowSuccess?: (message: string) => void;
}

const StandardFieldWorkerAssignmentIntegrationInternal: React.FC<
  StandardFieldWorkerAssignmentIntegrationProps
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
  const dispatch = useAppDispatch();
  const fieldLabel = getFieldAssignmentLabel(field.key);

  // Assigned_to is always 'standard_field_item' for worker assignment from detail view
  const assignedToType: AssignedToType = 'standard_field_item';

  const allItems = useAppSelector(selectStandardFieldWorkerAssignmentsAllItems);
  const totalCount = useAppSelector(
    selectStandardFieldWorkerAssignmentsTotalCount,
  );
  const reduxLoading = useAppSelector(
    selectStandardFieldWorkerAssignmentsLoading,
  );
  const hasMore = useAppSelector(selectStandardFieldWorkerAssignmentsHasMore);
  const endCursor = useAppSelector(
    selectStandardFieldWorkerAssignmentsEndCursor,
  );

  const [drawerError, setDrawerError] = useState<DetailedErrorInfo | null>(
    null,
  );

  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const handleMutationSuccess = useCallback(() => {
    logger.info('Standard field worker assignment saved successfully');

    setDrawerError(null);
    const successMsg = intl.formatMessage({
      id: 'assignments.workerCustomerAssignment.saveSuccess',
    });
    onShowSuccess?.(successMsg);
  }, [intl, onShowSuccess, logger]);

  const handleMutationPartialSuccess = useCallback(
    (errorInfo: PartialSuccessErrorInfo) => {
      logger.warn('Standard field worker assignment partially succeeded', {
        errorInfo,
      });

      const totalSuccess =
        errorInfo.workers.successCount + errorInfo.groups.successCount;
      const detailedError: DetailedErrorInfo = {
        title: intl.formatMessage(
          { id: 'assignments.workerAssignment.partialSuccess.title' },
          { successCount: totalSuccess },
        ),
        isPartialSuccess: true,
      };

      setDrawerError(null);
      onError?.(detailedError);
    },
    [intl, onError, logger],
  );

  const handleMutationError = useCallback(
    (errorMessage: string) => {
      logger.error('Standard field worker assignment failed', { errorMessage });

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
    [intl, logger],
  );

  const [
    manageStandardFieldOptionTimeForAssignment,
    { loading: mutationLoading },
  ] = useManageStandardFieldOptionTimeForAssignment({
    onSuccess: handleMutationSuccess,
    onPartialSuccess: handleMutationPartialSuccess,
    onError: handleMutationError,
  });

  const {
    loadTimeForAssignments,
    data: apiData,
    pageInfo: apiPageInfo,
    totalTimeForCount,
  } = useTimeForAssignments();

  // Reset state on mount
  useEffect(() => {
    dispatch(resetStandardFieldWorkerAssignmentsState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUngrouped = useCallback(
    (groupId: any) =>
      !groupId || groupId === 0 || groupId === '0' || groupId === '',
    [],
  );

  useEffect(() => {
    if (apiData && apiData.length > 0) {
      const flatWorkerItems: AssignmentItem[] = apiData.map((worker) => {
        const workerId = worker.timeForContactDAS.id || '';
        const timeForType =
          worker.timeForType || TimeTracking_TimeForType.Employee;
        const workerItem: AssignmentItem = {
          id: workerId,
          name: worker.displayName || worker.fullName || '',
          level: 1,
          hasChildren: false,
          isSelected: worker.assigned,
          type: timeForType,
        };

        if (isUngrouped(worker.groupId)) {
          return { ...workerItem, parentId: 'no-group' };
        }
        const groupId = worker.groupId!;
        const groupName = worker.groupName || `Group ${groupId}`;
        return {
          ...workerItem,
          parentId: `group-${groupId}`,
          metadata: { groupName },
        };
      });

      dispatch(
        appendData({
          items: flatWorkerItems,
          totalCount: totalTimeForCount || 0,
          hasNextPage: apiPageInfo?.hasNextPage || false,
          endCursor: apiPageInfo?.endCursor || null,
        }),
      );
    } else if (totalTimeForCount !== null && apiData.length === 0) {
      // Data loaded but empty (0 workers) - set loading to false
      dispatch(setLoading(false));
    }
  }, [apiData, apiPageInfo, totalTimeForCount, dispatch, isUngrouped]);

  const hierarchicalItems = useMemo(() => {
    if (allItems.length === 0) return [];

    const groupMap = new Map<
      string,
      { name: string; workers: AssignmentItem[]; groupId: string }
    >();
    const ungroupedWorkers: AssignmentItem[] = [];

    allItems.forEach((worker) => {
      if (worker.level !== 1) return;

      if (worker.parentId === 'no-group') {
        ungroupedWorkers.push(worker);
      } else if (
        worker.parentId &&
        worker.parentId.toString().startsWith('group-')
      ) {
        const groupId = worker.parentId.toString().replace('group-', '');
        if (!groupMap.has(groupId)) {
          const groupName =
            (worker.metadata as any)?.groupName || `Group ${groupId}`;
          groupMap.set(groupId, {
            name: groupName,
            workers: [],
            groupId,
          });
        }
        groupMap.get(groupId)!.workers.push(worker);
      }
    });

    const result: AssignmentItem[] = [];

    groupMap.forEach((group, groupId) => {
      const allSelected = group.workers.every((w) => w.isSelected);
      const parentId = `group-${groupId}`;

      result.push({
        id: parentId,
        name: group.name,
        level: 0,
        hasChildren: true,
        isSelected: allSelected,
        count: group.workers.length,
      });

      result.push(...group.workers);
    });

    if (ungroupedWorkers.length > 0) {
      const allSelected = ungroupedWorkers.every((w) => w.isSelected);

      result.push({
        id: 'no-group',
        name: intl.formatMessage({ id: 'assignments.noGroup' }),
        level: 0,
        hasChildren: true,
        isSelected: allSelected,
        count: ungroupedWorkers.length,
      });

      result.push(...ungroupedWorkers);
    }

    return result;
  }, [allItems, intl]);

  const initialSelections = useMemo(
    () =>
      new Set(
        hierarchicalItems
          .filter((item) => item.isSelected && item.level === 1) // Only workers, not groups
          .map((item) => item.id),
      ),
    [hierarchicalItems],
  );

  const handleSave = useCallback(
    async (changes: AssignmentChanges) => {
      // Track save action for worker assignment
      track({
        ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.SAVE_ASSIGNMENTS,
        object_detail: 'assign_workers',
        assigned_to: assignedToType,
      });

      const input: any = {
        standardFieldLabel: fieldLabel!,
        standardFieldOptionId: standardFieldOption.id,
      };

      if (changes.isSelectAll) {
        // When assignToAll is true, only send the flag, no lists needed
        input.assignToAll = true;
      } else {
        const processed = processAssignmentChanges(changes, hierarchicalItems);

        // Add timeForAssignments only for regular (non-assignToAll) cases
        if (
          processed.workersToAssign.length > 0 ||
          processed.workersToUnassign.length > 0 ||
          processed.groupIdsToAssign.length > 0 ||
          processed.groupIdsToUnassign.length > 0
        ) {
          input.timeForAssignments = {
            timeForToAssign: processed.workersToAssign,
            timeForToUnassign: processed.workersToUnassign,
            groupIdsToAssign: processed.groupIdsToAssign,
            groupIdsToUnassign: processed.groupIdsToUnassign,
          };
        }
      }

      await manageStandardFieldOptionTimeForAssignment({
        variables: { input },
      });
    },
    [
      fieldLabel,
      standardFieldOption.id,
      hierarchicalItems,
      manageStandardFieldOptionTimeForAssignment,
      track,
      assignedToType,
    ],
  );

  const fetchData = useCallback(
    async (params: FetchParams) => {
      const page = params.page || 1;
      const pageSize = STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE;

      // Only fetch if we haven't fetched yet (totalTimeForCount is null before first fetch)
      if (
        allItems.length === 0 &&
        !reduxLoading &&
        totalTimeForCount === null
      ) {
        dispatch(setLoading(true));
        loadTimeForAssignments({
          first: STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE,
          input: {
            standardFieldLabel: fieldLabel!,
            standardFieldOption: standardFieldOption.id,
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount: 0 };
      }

      const workers = allItems.filter((item) => item.level === 1);
      const startWorkerIndex = (page - 1) * pageSize;
      const endWorkerIndex = startWorkerIndex + pageSize;
      const workersForThisPage = workers.slice(
        startWorkerIndex,
        endWorkerIndex,
      );

      if (workersForThisPage.length > 0) {
        const parentIdsNeeded = new Set(
          workersForThisPage.map((w) => w.parentId).filter((pid) => pid),
        );
        const parentsNeeded = hierarchicalItems.filter(
          (item) => item.level === 0 && parentIdsNeeded.has(item.id),
        );

        const pageItems: AssignmentItem[] = [];
        parentsNeeded.forEach((parent) => {
          pageItems.push(parent);
          const childrenForParent = workersForThisPage.filter(
            (w) => w.parentId === parent.id,
          );
          pageItems.push(...childrenForParent);
        });

        return {
          items: pageItems,
          totalCount,
        };
      }

      if (hasMore && endCursor && !reduxLoading) {
        dispatch(setLoading(true));
        loadTimeForAssignments({
          first: STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE,
          after: endCursor,
          input: {
            standardFieldLabel: fieldLabel!,
            standardFieldOption: standardFieldOption.id,
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount };
      }

      return {
        items: [],
        totalCount,
      };
    },
    [
      allItems,
      hierarchicalItems,
      totalCount,
      hasMore,
      endCursor,
      reduxLoading,
      totalTimeForCount,
      fieldLabel,
      standardFieldOption.id,
      loadTimeForAssignments,
      dispatch,
    ],
  );

  const config: AssignmentDrawerConfig = useMemo(
    () => ({
      assignmentType: 'WorkerAssignment',
      dataSource: {
        fetchData,
        searchMode: 'client',
      },
      ui: {
        searchPlaceholder: '',
        searchSupported: true,
        searchExpandable: true,
        fieldName: standardFieldOption.name,
      },
      table: {
        columns: [{ key: 'name', header: '' }],
        sortable: false,
        defaultExpanded: true,
        hierarchicalSelection: true,
      },
      pagination: {
        enabled: true,
        defaultPageSize: STANDARD_FIELD_WORKER_ASSIGNMENT_PAGE_SIZE,
      },
      callbacks: {
        onSave: handleSave,
      },
    }),
    [fetchData, standardFieldOption.name, handleSave],
  );

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
    // Track cancel action for worker assignment
    track({
      ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.CANCEL_ASSIGNMENTS,
      object_detail: 'assign_workers',
      assigned_to: assignedToType,
    });
    setDrawerError(null);
    onClose();
  }, [onClose, track, assignedToType]);

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

const StandardFieldWorkerAssignmentIntegration: React.FC<
  StandardFieldWorkerAssignmentIntegrationProps
> = (props) => {
  const sandbox = useSandbox();

  return (
    <LoggingConfigProvider
      sandbox={sandbox}
      prefix="StandardFieldWorkerAssignment"
    >
      <StandardFieldWorkerAssignmentIntegrationInternal {...props} />
    </LoggingConfigProvider>
  );
};

export default StandardFieldWorkerAssignmentIntegration;
