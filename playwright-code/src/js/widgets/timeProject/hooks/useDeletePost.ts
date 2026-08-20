import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { DELETE_POST } from '../graphql/postsMutations';
import { DeletePostMutationData } from '../types/posts';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';

export interface DeletePostArgs {
  postId: string;
  projectId: string;
  customerId: string;
  workerId: string;
  workerType: string;
}

export interface DeletePostResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface UseDeletePostResult {
  inProgress: boolean;
  deletePost: (args: DeletePostArgs) => Promise<DeletePostResult>;
}

export const useDeletePost = (): UseDeletePostResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [inProgress, setInProgress] = useState(false);
  const [deleteMutation] = useMutation<DeletePostMutationData>(DELETE_POST);

  const deletePost = useCallback(
    async ({
      postId,
      projectId,
      customerId,
      workerId,
      workerType,
    }: DeletePostArgs): Promise<DeletePostResult> => {
      setInProgress(true);
      try {
        const { data, errors } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_POST_DELETE,
          event: {
            start: TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_DELETE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_DELETE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_DELETE_FAILURE,
          },
          extraProps: { projectId, postId },
          // Cover all delete failure shapes: GraphQL errors, empty response,
          // and the error branch / missing success code.
          isFailure: (res) => {
            if (res.errors?.length) {
              return res.errors.map((e) => e.message).join('; ');
            }
            const r = res.data?.timeTrackingDeletePost;
            if (!r) return 'EMPTY_RESPONSE';
            if (r.successCode) return null;
            return r.errorCode || 'UNKNOWN_RESPONSE';
          },
          run: () =>
            deleteMutation({
              variables: {
                input: {
                  id: postId,
                  projectRefs: { projectId, customerId },
                  workerId,
                  workerType,
                },
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POST_DELETE,
                      ),
                    },
                  }
                : {}),
            }),
        });

        if (errors?.length) return { success: false };

        const result = data?.timeTrackingDeletePost;
        if (result?.successCode) return { success: true };
        if (result?.errorCode) {
          return {
            success: false,
            errorCode: result.errorCode,
            errorMessage: result.message ?? undefined,
          };
        }
        return { success: false };
      } catch {
        // withLoggedOperation already logged + ended the FCI as failed.
        return { success: false };
      } finally {
        setInProgress(false);
      }
    },
    [deleteMutation, logger, sandbox],
  );

  return { inProgress, deletePost };
};
