import { useCallback, useState, useEffect } from 'react';
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
import { useTaskManagementTasksLazyQuery } from 'src/__generated__/oigql/graphql';
import { storeManager } from '../../../store/storeManager';
import {
  setTasks,
  setLoadingTasks,
  setTasksError,
  setRefetchTasks,
} from '../store/overviewSlice';
import {
  selectItmTasks,
  selectIsLoadingTasks,
  selectTasksError,
  selectRefetchTasks,
} from '../store/overviewSelectors';
import {
  OVERVIEW_LOGGING,
  DEFAULT_ITM_TASKS_FIRST,
  DEFAULT_ITM_TASKS_AFTER,
  DEFAULT_ITM_TASKS_FILTER,
  ITM_REQUEST_HEADERS,
} from '../constants';
import type {
  ItmTask,
  GetTasksParams,
  GetTasksResult,
} from '../types/Overview.types';

const { store } = storeManager;

const useStoreSelector = <T>(
  selector: (state: ReturnType<typeof store.getState>) => T,
): T => {
  const [value, setValue] = useState(() => selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setValue(selector(store.getState()));
    });
    return unsubscribe;
  }, [selector]);

  return value;
};

interface UseGetItmTasksResult {
  getItmTasks: (params?: Partial<GetTasksParams>) => Promise<GetTasksResult>;
  tasks: ItmTask[];
  isLoading: boolean;
  error: string | null;
  shouldRefetch: boolean;
  clearRefetchFlag: () => void;
}

export const useGetItmTasks = (): UseGetItmTasksResult => {
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const { dispatch } = store;

  const tasks = useStoreSelector(selectItmTasks);
  const isLoading = useStoreSelector(selectIsLoadingTasks);
  const error = useStoreSelector(selectTasksError);
  const shouldRefetch = useStoreSelector(selectRefetchTasks);

  const [fetchTasksQuery] = useTaskManagementTasksLazyQuery({
    fetchPolicy: 'network-only',
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
  });

  const getItmTasks = useCallback(
    async (params?: Partial<GetTasksParams>): Promise<GetTasksResult> => {
      const first = params?.first ?? DEFAULT_ITM_TASKS_FIRST;
      const after = params?.after ?? DEFAULT_ITM_TASKS_AFTER;
      const filter = params?.filter ?? DEFAULT_ITM_TASKS_FILTER;
      const orderBy = params?.orderBy;
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
            headers: {
              ...getCustomerInteractionPropagationHeaders(
                sandbox,
                interactionType,
              ),
              ...ITM_REQUEST_HEADERS,
            },
          },
        });

        const nodes = result.data?.taskManagementTasks?.nodes || [];

        const mappedTasks: ItmTask[] = nodes.map((node) => ({
          id: node.id,
          name: node.name,
          description: node.description ?? undefined,
          status: node.status,
          type: node.type ?? undefined,
          dueDate: node.dueDate ?? undefined,
          priority: node.priority ?? undefined,
          references: node.references?.map((ref) => ({
            id: ref.id,
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
