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
import {
  useTaskManagementUpdateTaskMutation,
  TaskManagement_UpdateTaskInput,
} from 'src/__generated__/oigql/graphql';
import { storeManager } from '../../../store/storeManager';
import {
  setUpdatingTask,
  setUpdateTaskError,
  updateTask,
  setRefetchTasks,
} from '../store/overviewSlice';
import {
  selectIsUpdatingTask,
  selectUpdateTaskError,
} from '../store/overviewSelectors';
import { OVERVIEW_LOGGING, ITM_REQUEST_HEADERS } from '../constants';
import type { UpdateTaskResult } from '../types/Overview.types';

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

interface UseUpdateItmTaskResult {
  updateItmTask: (
    taskUpdateRequest: TaskManagement_UpdateTaskInput,
  ) => Promise<UpdateTaskResult>;
  isUpdating: boolean;
  error: string | null;
}

export const useUpdateItmTask = (): UseUpdateItmTaskResult => {
  const sandbox = useSandbox();
  const logger = useLoggingConfig();
  const { dispatch } = store;

  const isUpdating = useStoreSelector(selectIsUpdatingTask);
  const error = useStoreSelector(selectUpdateTaskError);

  const [updateTaskMutation] = useTaskManagementUpdateTaskMutation({
    context: {
      clientName: ApolloClientNames.OIGQL,
    },
  });

  const updateItmTask = useCallback(
    async (
      taskUpdateRequest: TaskManagement_UpdateTaskInput,
    ): Promise<UpdateTaskResult> => {
      const interactionType = TimeCustomerInteraction.ITM_TASK_UPDATE;
      createCustomerInteraction(sandbox, interactionType);

      logger.info(OVERVIEW_LOGGING.UPDATE_TASK_START, {
        taskId: taskUpdateRequest.id,
      });

      dispatch(setUpdatingTask(true));

      try {
        const result = await updateTaskMutation({
          variables: {
            taskUpdateRequest,
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

        const response = result.data?.taskManagementUpdateTask;

        if (response?.success && response.task) {
          dispatch(
            updateTask({
              id: response.task.id,
              changes: {
                status: taskUpdateRequest.status,
              },
            }),
          );

          dispatch(setRefetchTasks(true));

          logger.info(OVERVIEW_LOGGING.UPDATE_TASK_SUCCESS, {
            taskId: response.task.id,
            taskName: response.task.name,
          });

          endInteractionWithSuccess(sandbox, interactionType);
          dispatch(setUpdatingTask(false));

          return {
            success: true,
            message: response.message,
            code: response.code,
            task: {
              id: response.task.id,
              name: response.task.name,
            },
          };
        }

        const errorMessage = response?.message || 'Failed to update task';
        dispatch(setUpdateTaskError(errorMessage));

        logger.error(OVERVIEW_LOGGING.UPDATE_TASK_FAILED, {
          error: errorMessage,
          code: response?.code,
        });

        endInteractionWithFailure(sandbox, interactionType, errorMessage);

        return {
          success: false,
          message: errorMessage,
          code: response?.code || 'UNKNOWN_ERROR',
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';

        dispatch(setUpdateTaskError(errorMessage));

        logger.error(OVERVIEW_LOGGING.UPDATE_TASK_FAILED, {
          error: errorMessage,
        });

        endInteractionWithFailure(sandbox, interactionType, errorMessage, err);

        return {
          success: false,
          message: errorMessage,
          code: 'EXCEPTION',
        };
      }
    },
    [sandbox, logger, dispatch, updateTaskMutation],
  );

  return {
    updateItmTask,
    isUpdating,
    error,
  };
};

export default useUpdateItmTask;
