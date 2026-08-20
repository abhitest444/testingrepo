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
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useTimeForAssignments } from 'src/js/service/hooks/assignments/useTimeForAssignments';
import {
  useManageTimeAgainstTimeForAssignment,
  PartialSuccessErrorInfo,
} from 'src/js/service/hooks/assignments/useManageTimeAgainstTimeForAssignment';
import AssignmentDrawer from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentItem,
  AssignmentDrawerConfig,
  AssignmentChanges,
  FetchParams,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import { processAssignmentChanges } from 'src/js/widgets/common/AssignmentDrawer/assignmentUtils';
import {
  resetCustomerWorkerAssignmentsState,
  setLoading,
  appendData,
  WORKER_ASSIGNMENT_PAGE_SIZE,
} from '../../assignments/store/customerWorkerAssignmentsSlice';
import { useAppDispatch, useAppSelector } from '../store';
import { TimeProjectRow } from '../types';
import { useAssignWorkersTrackingPoints } from '../hooks/useAssignWorkersTrackingPoints';

interface ProjectWorkerAssignmentDrawerProps {
  project: TimeProjectRow;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const ProjectWorkerAssignmentDrawer: React.FC<
  ProjectWorkerAssignmentDrawerProps
> = ({ project, onClose, onSuccess, onError }) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const text = (id: string, values?: Record<string, any>) =>
    intl.formatMessage({ id }, values);
  const trackingPoints = useAssignWorkersTrackingPoints();

  // Read the canonical customer id from the OIGQL contacts lookup. Per
  // the new contract, every save / read that takes a `(projectId,
  // customerId)` tuple must use the id resolved by
  // `useProjectCustomerLookup` — NOT the inline `customer.id` returned
  // by `dataAccessWorkProjects`. Fall back to the row's own customerId
  // only if the lookup hasn't resolved yet (covers unit-test renders
  // and the brief gap between the projects fetch and the contacts
  // round-trip).
  const customerIdFromRefs = useAppSelector(
    (state) => state.projects.projectRefs[project.projectId]?.customerId,
  );
  const effectiveCustomerId = customerIdFromRefs || project.customerId;
  // Parent customer id (the OIGQL contact id of the project's parent),
  // sourced from the same contacts lookup but persisted in a separate
  // slice field used ONLY by the assignment-save flow. Read it here
  // so the save mutation can build a hierarchical `timeAgainstList`
  // (project entry + ancestor customer entry) — matching the
  // assignments widget's payload shape. Undefined when the contacts
  // lookup hasn't resolved or the project has no parent contact.
  const parentCustomerId = useAppSelector(
    (state) => state.projects.projectParents[project.projectId],
  );

  const allItems = useAppSelector(
    (state) => state.customerWorkerAssignments.allItems,
  );
  const totalCount = useAppSelector(
    (state) => state.customerWorkerAssignments.totalCount,
  );
  const reduxLoading = useAppSelector(
    (state) => state.customerWorkerAssignments.loading,
  );
  const endCursor = useAppSelector(
    (state) => state.customerWorkerAssignments.endCursor,
  );
  const hasMore = useAppSelector(
    (state) => state.customerWorkerAssignments.hasMore,
  );

  const [drawerError, setDrawerError] = useState<{
    title: string;
    subtitle?: string;
  } | null>(null);

  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  const handleMutationSuccess = useCallback(() => {
    sandbox.logger.info(
      'Component=ProjectWorkerAssignmentDrawer Event=Worker assignment saved',
    );
    setDrawerError(null);
    onSuccess?.(text('timeProject.assignWorkers.saveSuccess'));
  }, [sandbox.logger, onSuccess]);

  const handleMutationPartialSuccess = useCallback(
    (errorInfo: PartialSuccessErrorInfo) => {
      sandbox.logger.warn(
        'Component=ProjectWorkerAssignmentDrawer Event=Partial success',
        { errorInfo },
      );
      const totalSuccessCount =
        errorInfo.workers.successCount + errorInfo.groups.successCount;
      setDrawerError(null);
      onError?.(
        text('timeProject.assignWorkers.partialSuccess', {
          count: totalSuccessCount,
        }),
      );
    },
    [sandbox.logger, onError],
  );

  const handleMutationError = useCallback(
    (errorMessage: string) => {
      sandbox.logger.error(
        'Component=ProjectWorkerAssignmentDrawer Event=Assignment failed',
        { errorMessage },
      );
      setDrawerError({
        title: text('timeProject.assignWorkers.error.title'),
        subtitle: text('timeProject.assignWorkers.error.subtitle'),
      });
    },
    [sandbox.logger],
  );

  const [manageAssignment, { loading: mutationLoading }] =
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
  } = useTimeForAssignments();

  useEffect(() => {
    dispatch(resetCustomerWorkerAssignmentsState());
  }, [dispatch]);

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
          groupMap.set(groupId, { name: groupName, workers: [], groupId });
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
          .filter((item) => item.isSelected && item.level === 1)
          .map((item) => item.id),
      ),
    [hierarchicalItems],
  );

  const handleSave = useCallback(
    async (changes: AssignmentChanges) => {
      track(trackingPoints.SAVE_ASSIGN_WORKER);

      // Match the Customer Assignments widget's payload shape:
      // `timeAgainst` carries only the project's `customerId`
      // (project-scoped contact id), and `timeAgainstList` is the
      // hierarchical chain — the project entry FOLLOWED BY its
      // ancestor customer entry. Customer Assignments builds that
      // chain via `buildHierarchicalTimeAgainstList(node, allEdges)`
      // by walking the customer tree; here we pull the same parent
      // contact id directly from the contacts-lookup side channel
      // (`projectParents`). When the parent isn't known (lookup
      // hasn't resolved, or the project has no parent contact), we
      // send only the project entry — same fallback the assignments
      // widget falls back to when the parent edge is missing.
      const timeAgainstList: Array<{ customerId: string }> = [
        { customerId: effectiveCustomerId },
      ];
      if (parentCustomerId && parentCustomerId !== effectiveCustomerId) {
        timeAgainstList.push({ customerId: parentCustomerId });
      }

      const input: any = {
        timeAgainst: {
          customerId: effectiveCustomerId,
        },
        timeAgainstList,
      };

      if (changes.isSelectAll) {
        input.assignToAll = true;
      } else {
        const processed = processAssignmentChanges(changes, hierarchicalItems);
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

      await manageAssignment({ variables: { input } });
    },
    [
      project,
      effectiveCustomerId,
      parentCustomerId,
      hierarchicalItems,
      manageAssignment,
      track,
      trackingPoints,
    ],
  );

  const fetchData = useCallback(
    async (params: FetchParams) => {
      const page = params.page || 1;
      const pageSize = WORKER_ASSIGNMENT_PAGE_SIZE;

      if (
        allItems.length === 0 &&
        !reduxLoading &&
        totalTimeForCount === null
      ) {
        dispatch(setLoading(true));
        loadTimeForAssignments({
          first: WORKER_ASSIGNMENT_PAGE_SIZE,
          // Match the assignments widget shape — `customerId` only.
          // The contacts-resolved id is project-scoped, so passing
          // `projectId` here would actually narrow incorrectly.
          input: {
            customerId: effectiveCustomerId,
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount: 0 };
      }

      const workers = allItems.filter((item) => item.level === 1);
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const workersForPage = workers.slice(startIdx, endIdx);

      if (workersForPage.length > 0) {
        const parentIdsNeeded = new Set(
          workersForPage.map((w) => w.parentId).filter((pid) => pid),
        );
        const parentsNeeded = hierarchicalItems.filter(
          (item) => item.level === 0 && parentIdsNeeded.has(item.id),
        );
        const pageItems: AssignmentItem[] = [];
        parentsNeeded.forEach((parent) => {
          pageItems.push(parent);
          pageItems.push(
            ...workersForPage.filter((w) => w.parentId === parent.id),
          );
        });
        return { items: pageItems, totalCount };
      }

      if (hasMore && endCursor && !reduxLoading) {
        dispatch(setLoading(true));
        loadTimeForAssignments({
          first: WORKER_ASSIGNMENT_PAGE_SIZE,
          after: endCursor,
          input: {
            customerId: effectiveCustomerId,
          },
          filter: {},
          fetchPolicy: 'no-cache',
        });
        return { items: [], totalCount };
      }

      return { items: [], totalCount };
    },
    [
      allItems,
      hierarchicalItems,
      totalCount,
      hasMore,
      endCursor,
      reduxLoading,
      totalTimeForCount,
      project,
      effectiveCustomerId,
      loadTimeForAssignments,
      dispatch,
    ],
  );

  const handleSearchTracking = useCallback(
    (value: string) => {
      if (value.trim()) {
        track(trackingPoints.TYPE_SEARCH_ASSIGN_WORKERS);
      }
    },
    [track, trackingPoints],
  );

  const config: AssignmentDrawerConfig = useMemo(
    () => ({
      assignmentType: 'WorkerAssignment',
      dataSource: { fetchData, searchMode: 'client' },
      ui: {
        searchPlaceholder: '',
        searchSupported: true,
        searchExpandable: true,
        fieldName: project.projectName,
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
      callbacks: { onSave: handleSave, onSearch: handleSearchTracking },
    }),
    [fetchData, project.projectName, handleSave, handleSearchTracking],
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
    </PageMessage>
  ) : undefined;

  const handleClose = useCallback(() => {
    track(trackingPoints.CLOSE_ASSIGN_WORKER);
    setDrawerError(null);
    onClose();
  }, [onClose, track, trackingPoints]);

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

export default ProjectWorkerAssignmentDrawer;
