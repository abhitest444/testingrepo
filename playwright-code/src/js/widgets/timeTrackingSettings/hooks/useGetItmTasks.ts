import { useCallback, useEffect, useRef } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  useTaskManagementTasksLazyQuery,
  TaskManagement_TaskFilter,
  TaskManagement_OrderBy,
} from 'src/__generated__/oigql/graphql';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setTasks,
  setLoadingTasks,
  setTasksError,
  setRefetchTasks,
  ItmTask,
} from '../store/overviewSlice';

const OVERVIEW_LOGGING = {
  FETCH_TASKS_START: 'time_settings_fetch_itm_tasks_start',
  FETCH_TASKS_SUCCESS: 'time_settings_fetch_itm_tasks_success',
  FETCH_TASKS_FAILED: 'time_settings_fetch_itm_tasks_failed',
};

export interface GetTasksParams {
  first: number;
  after: number;
  filter: TaskManagement_TaskFilter;
  orderBy?: TaskManagement_OrderBy[];
}

export interface GetTasksResult {
  tasks: ItmTask[];
  success: boolean;
}

interface UseGetItmTasksResult {
  getItmTasks: (params: GetTasksParams) => Promise<GetTasksResult>;
  tasks: ItmTask[];
  isLoading: boolean;
  error: string | null;
  shouldRefetch: boolean;
  clearRefetchFlag: () => void;
}

export const useGetItmTasks = (): UseGetItmTasksResult => {
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((state) => state.overview?.tasks ?? []);
  const isLoading = useAppSelector(
    (state) => state.overview?.isLoadingTasks ?? false,
  );
  const error = useAppSelector((state) => state.overview?.error ?? null);
  const shouldRefetch = useAppSelector(
    (state) => state.overview?.refetchTasks ?? false,
  );

  const [fetchTasksQuery] = useTaskManagementTasksLazyQuery({
    fetchPolicy: 'network-only',
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
  });

  const getItmTasks = useCallback(
    async (params: GetTasksParams): Promise<GetTasksResult> => {
      const { first, after, filter, orderBy } = params;
      const interactionType = TimeCustomerInteraction.ITM_TASKS_READ;
      createCustomerInteraction(sandbox, interactionType);

      logger.info(OVERVIEW_LOGGING.FETCH_TASKS_START, {
        first,
        after,
        filter,
      });

      dispatch(setLoadingTasks(true));

      try {
        const result = await fetchTasksQuery({
          variables: {
            first,
            after,
            filter,
            orderBy,
          },
          context: {
            clientName: ApolloClientNames.OIGQL,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              interactionType,
            ),
          },
        });

        const nodes = result.data?.taskManagementTasks?.nodes || [];

        const mappedTasks: ItmTask[] = nodes.map((node) => ({
          id: String(node.id),
          name: node.name,
          description: node.description ?? undefined,
          status: node.status,
          type: node.type ?? undefined,
          dueDate: node.dueDate ?? undefined,
          priority: node.priority ?? undefined,
          references: node.references?.map((ref) => ({
            id: String(ref.id),
          })),
        }));

        dispatch(setTasks(mappedTasks));
        dispatch(setRefetchTasks(false));

        logger.info(OVERVIEW_LOGGING.FETCH_TASKS_SUCCESS, {
          count: mappedTasks.length,
        });

        endInteractionWithSuccess(sandbox, interactionType);

        return {
          tasks: mappedTasks,
          success: true,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch tasks';

        dispatch(setTasksError(errorMessage));

        logger.error(OVERVIEW_LOGGING.FETCH_TASKS_FAILED, {
          error: errorMessage,
        });

        endInteractionWithFailure(sandbox, interactionType, errorMessage, err);

        return {
          tasks: [],
          success: false,
        };
      }
    },
    [sandbox, logger, dispatch, fetchTasksQuery],
  );

  const clearRefetchFlag = useCallback(() => {
    dispatch(setRefetchTasks(false));
  }, [dispatch]);

  return {
    getItmTasks,
    tasks,
    isLoading,
    error,
    shouldRefetch,
    clearRefetchFlag,
  };
};

export default useGetItmTasks;
