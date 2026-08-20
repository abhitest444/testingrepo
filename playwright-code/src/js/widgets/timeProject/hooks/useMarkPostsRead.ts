import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { MARK_POSTS_READ } from '../graphql/postsMutations';
import { MarkPostsReadMutationData } from '../types/posts';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';

export interface MarkPostsReadArgs {
  projectId: string;
  workerId: string;
  workerType: string;
}

export interface MarkPostsReadResult {
  success: boolean;
}

export interface UseMarkPostsReadResult {
  markPostsRead: (args: MarkPostsReadArgs) => Promise<MarkPostsReadResult>;
}

export const useMarkPostsRead = (): UseMarkPostsReadResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [markMutation] =
    useMutation<MarkPostsReadMutationData>(MARK_POSTS_READ);

  const markPostsRead = useCallback(
    async ({
      projectId,
      workerId,
      workerType,
    }: MarkPostsReadArgs): Promise<MarkPostsReadResult> => {
      try {
        const { data, errors } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_POSTS_MARK_READ,
          event: {
            start:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.MARK_POSTS_READ_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.MARK_POSTS_READ_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.MARK_POSTS_READ_FAILURE,
          },
          extraProps: { projectId },
          // A successCode wins even if GraphQL `errors` are also present
          // (matches the original lenient behavior). Only flag a failure when
          // there's no successCode — reporting the errors as the reason if any.
          isFailure: (res) => {
            if (res.data?.timeTrackingMarkPostsRead?.successCode) return null;
            if (res.errors?.length) {
              return res.errors.map((e) => e.message).join('; ');
            }
            return 'NO_SUCCESS_CODE';
          },
          run: () =>
            markMutation({
              variables: {
                input: {
                  entityType: 'PROJECT',
                  entityId: projectId,
                  workerId,
                  workerType,
                },
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POSTS_MARK_READ,
                      ),
                    },
                  }
                : {}),
            }),
        });

        const succeeded = !!data?.timeTrackingMarkPostsRead?.successCode;

        // A successCode wins, but if partial GraphQL errors rode alongside it,
        // still surface them in the logs (the FCI/withLoggedOperation already
        // recorded the overall success).
        if (succeeded && errors?.length) {
          logger.error(
            TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.MARK_POSTS_READ_FAILURE,
            {
              projectId,
              partialErrors: errors.map((e) => e.message).join('; '),
            },
          );
        }

        return succeeded ? { success: true } : { success: false };
      } catch {
        // withLoggedOperation already logged + ended the FCI as failed.
        return { success: false };
      }
    },
    [markMutation, logger, sandbox],
  );

  return { markPostsRead };
};
