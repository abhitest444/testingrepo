import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import PageMessage from '@ids-ts/page-message';
import Typography from '@ids-ts/typography';
import { CircleAlertQuickbooks } from '@design-systems/icons';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import {
  useManageTimeAgainstTimeForAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageTimeAgainstTimeForAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import { DrawerLoadErrorState } from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer.styled';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
  FetchParams,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import {
  processAssignmentChanges,
  buildHierarchicalTimeAgainstList,
} from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import { CUSTOMER_ASSIGNMENTS_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';
import { WORKER_ASSIGNMENT_LOAD_ERROR_ICON_SIZE } from 'src/js/widgets/assignments/utils/constants';
import { TimeAgainstAssignmentSummaryEdge } from 'src/js/service/types/assignmentTypes';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  selectCustomerWorkerAssignmentsAllItems,
  selectCustomerWorkerAssignmentsTotalCount,
  selectCustomerWorkerAssignmentsLoading,
  selectCustomerWorkerAssignmentsEndCursor,
  selectCustomerWorkerAssignmentsHasMore,
  resetCustomerWorkerAssignmentsState,
  setLoading,
  appendData,
  WORKER_ASSIGNMENT_PAGE_SIZE,
} from '../../../store/customerWorkerAssignmentsSlice';

interface WorkerAssignmentIntegrationProps {
  node: TimeAgainstAssignmentSummaryEdge;
  allEdges?: TimeAgainstAssignmentSummaryEdge[];
  customerId: string;
  projectId?: string;
  displayName: string;
  onClose: () => void;
  onError?: (errorInfo: DetailedErrorInfo) => void;
  onShowSuccess?: (message: string) => void;
}

const WorkerAssignmentIntegration: React.FC<
  WorkerAssignmentIntegrationProps
> = ({
  node,
  allEdges = [],
  customerId,
  projectId,
  displayName,
  onClose,
  onError,
  onShowSuccess,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();

  const allItems = useAppSelector(selectCustomerWorkerAssignmentsAllItems);
  const totalCount = useAppSelector(selectCustomerWorkerAssignmentsTotalCount);
  const reduxLoading = useAppSelector(selectCustomerWorkerAssignmentsLoading);
  const endCursor = useAppSelector(selectCustomerWorkerAssignmentsEndCursor);
  const hasMore = useAppSelector(selectCustomerWorkerAssignmentsHasMore);

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
    sandbox.logger.info('Worker assignment saved successfully');

    setDrawerError(null);
    const successMsg = intl.formatMessage({
      id: 'assignments.workerCustomerAssignment.saveSuccess',
    });
    onShowSuccess?.(successMsg);
  }, [intl, onShowSuccess, sandbox.logger]);

  const handleMutationPartialSuccess = useCallback(
    (errorInfo: PartialSuccessErrorInfo) => {
      sandbox.logger.warn('Worker assignment partially succeeded', {
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
    [intl, onError, sandbox.logger],
  );

  const handleMutationError = useCallback(
    (errorMessage: string) => {
      sandbox.logger.error('Worker assignment failed', { errorMessage });

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
    [intl, sandbox.logger],
  );

  const [manageTimeAgainstTimeForAssignment, { loading: mutationLoading }] =
    useManageTimeAgainstTimeForAssignment({
      onSuccess: handleMutationSuccess,
      onPartialSuccess: handleMutationPartialSuccess,
      onError: handleMutationError,
    });

  const {
    loadTimeForAssignments,
    data: apiData,
    pageInfo: apiPageInfo,
    totalTimeForCount,
    error: fetchError,
  } = useTimeForAssignments();

  // Track drawer open on mount
  useEffect(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.ASSIGN_WORKER_DRAWER_OPEN);
    dispatch(resetCustomerWorkerAssignmentsState());
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

  // Clear the Redux loading state when the fetch errors so the spinner doesn't spin indefinitely
  useEffect(() => {
    if (fetchError) {
      dispatch(setLoading(false));
    }
  }, [fetchError, dispatch]);

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
      track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.SAVE_WORKER_ASSIGNMENT);

      // Build hierarchical timeAgainstList based on parent/child relationships
      const timeAgainstList = buildHierarchicalTimeAgainstList(node, allEdges);

      const input: any = {
        timeAgainst: {
          customerId,
          projectId: projectId || undefined,
        },
        timeAgainstList,
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

      await manageTimeAgainstTimeForAssignment({
        variables: { input },
      });
    },
    [
      track,
      node,
      allEdges,
      hierarchicalItems,
      manageTimeAgainstTimeForAssignment,
      customerId,
      projectId,
    ],
  );

  const fetchData = useCallback(
    async (params: FetchParams) => {
      const page = params.page || 1;
      const pageSize = WORKER_ASSIGNMENT_PAGE_SIZE;

      // Only fetch if we haven't fetched yet (totalTimeForCount is null before first fetch)
      if (
        allItems.length === 0 &&
        !reduxLoading &&
        totalTimeForCount === null
      ) {
        dispatch(setLoading(true));
        loadTimeForAssignments({
          first: WORKER_ASSIGNMENT_PAGE_SIZE,
          input: {
            customerId,
            projectId: projectId || undefined,
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
          first: WORKER_ASSIGNMENT_PAGE_SIZE,
          after: endCursor,
          input: {
            customerId,
            projectId: projectId || undefined,
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
      customerId,
      projectId,
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
        fieldName: displayName,
      },
      table: {
        columns: [{ key: 'name', header: '' }],
        sortable: false,
        defaultExpanded: true,
        hierarchicalSelection: true,
      },
      pagination: {
        enabled: true,
        defaultPageSize: WORKER_ASSIGNMENT_PAGE_SIZE,
      },
      callbacks: {
        onSave: handleSave,
      },
    }),
    [fetchData, displayName, handleSave],
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

  const loadErrorContent = fetchError ? (
    <DrawerLoadErrorState>
      <CircleAlertQuickbooks
        height={WORKER_ASSIGNMENT_LOAD_ERROR_ICON_SIZE}
        width={WORKER_ASSIGNMENT_LOAD_ERROR_ICON_SIZE}
      />
      <Typography variant="headline-4" weight="bold">
        {intl.formatMessage({
          id: 'assignments.workerAssignment.loadError.title',
        })}
      </Typography>
      <Typography variant="body-2">
        {intl.formatMessage({
          id: 'assignments.workerAssignment.loadError.subtitle',
        })}
      </Typography>
    </DrawerLoadErrorState>
  ) : undefined;

  const handleClose = useCallback(() => {
    track(CUSTOMER_ASSIGNMENTS_TRACKING_POINTS.CANCEL_WORKER_ASSIGNMENT);
    setDrawerError(null);
    onClose();
  }, [track, onClose]);

  return (
    <AssignmentDrawer
      open
      onClose={handleClose}
      config={config}
      initialSelections={initialSelections}
      loading={reduxLoading || mutationLoading}
      errorMessage={errorMessageComponent}
      loadError={loadErrorContent}
    />
  );
};

export default WorkerAssignmentIntegration;
