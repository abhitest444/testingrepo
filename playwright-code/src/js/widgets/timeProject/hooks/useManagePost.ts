import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import { MANAGE_POST } from '../graphql/postsMutations';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';
import { TIME_PROJECT_LOGGING_CONSTANTS } from '../constants';

// A timeTrackingManagePost response is a logical failure when it carries no
// successCode (the GraphQL promise still resolves on the error branch).
const managePostFailure = (data: any): string | null => {
  const r = data?.timeTrackingManagePost;
  if (r?.successCode) return null;
  return r?.errorCode || 'NO_SUCCESS_CODE';
};

export interface CreatePostArgs {
  projectId: string;
  customerId: string;
  content: string;
  workerId: string;
  workerType: string;
  /** Present when creating a reply (the parent post id); absent for a
   * top-level post. */
  parentPostId?: string;
}

export interface UpdatePostArgs {
  postId: string;
  projectId: string;
  customerId: string;
  content: string;
  workerId: string;
  workerType: string;
}

export interface ManagePostResult {
  success: boolean;
  /** Backend error message when the mutation returned an error branch. */
  errorMessage?: string;
  /**
   * Id of the created/updated post. Used to link uploaded attachments via
   * `timeTrackingCreateAttachments` after a successful create.
   */
  postId?: string;
}

/** @deprecated Use ManagePostResult instead. */
export type CreatePostResult = ManagePostResult;

export interface UseManagePostResult {
  saving: boolean;
  createPost: (args: CreatePostArgs) => Promise<ManagePostResult>;
  updatePost: (args: UpdatePostArgs) => Promise<ManagePostResult>;
}

/**
 * Create or update a project post via `timeTrackingManagePost`. The
 * mutation returns only a success code, so callers re-fetch the feed on
 * success rather than upserting a returned post. Keeps local `saving`
 * state; surfaces the backend error message (if any) so the drawer can
 * show it.
 */
export const useManagePost = (): UseManagePostResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [saving, setSaving] = useState(false);
  const [manage] = useMutation(MANAGE_POST);

  const createPost = useCallback(
    async ({
      projectId,
      customerId,
      content,
      workerId,
      workerType,
      parentPostId,
    }: CreatePostArgs): Promise<ManagePostResult> => {
      setSaving(true);
      const isReply = !!parentPostId;
      // Distinct Splunk events for reply vs. top-level post creates so alerts
      // can target each independently. Both carry `projectId`.
      const createEvent = isReply
        ? {
            start: TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.REPLY_CREATE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.REPLY_CREATE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.REPLY_CREATE_FAILURE,
          }
        : {
            start: TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_CREATE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_CREATE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_CREATE_FAILURE,
          };
      try {
        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_POST_CREATE,
          event: createEvent,
          extraProps: {
            projectId,
            customerId,
            isReply,
            ...(parentPostId ? { parentPostId } : {}),
          },
          isFailure: (res) => managePostFailure(res.data),
          run: () =>
            manage({
              variables: {
                input: {
                  projectRefs: { projectId, customerId },
                  ...(parentPostId ? { parentPostId } : {}),
                  content,
                  workerId,
                  workerType,
                },
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POST_CREATE,
                      ),
                    },
                  }
                : {}),
            }),
        });

        const result = data?.timeTrackingManagePost;
        if (result?.successCode) {
          return { success: true, postId: result?.post?.id };
        }
        return { success: false, errorMessage: result?.message };
      } catch {
        // withLoggedOperation already logged + ended the FCI as failed.
        return { success: false };
      } finally {
        setSaving(false);
      }
    },
    [manage, logger, sandbox],
  );

  const updatePost = useCallback(
    async ({
      postId,
      projectId,
      customerId,
      content,
      workerId,
      workerType,
    }: UpdatePostArgs): Promise<ManagePostResult> => {
      setSaving(true);
      try {
        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName: TimeCustomerInteraction.TIME_PROJECT_POST_UPDATE,
          event: {
            start: TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_UPDATE_START,
            success:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_UPDATE_SUCCESS,
            failure:
              TIME_PROJECT_LOGGING_CONSTANTS.MUTATIONS.POST_UPDATE_FAILURE,
          },
          extraProps: { projectId, postId },
          isFailure: (res) => managePostFailure(res.data),
          run: () =>
            manage({
              variables: {
                input: {
                  id: postId,
                  projectRefs: { projectId, customerId },
                  content,
                  workerId,
                  workerType,
                },
              },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POST_UPDATE,
                      ),
                    },
                  }
                : {}),
            }),
        });

        const result = data?.timeTrackingManagePost;
        if (result?.successCode) {
          return { success: true };
        }
        return { success: false, errorMessage: result?.message };
      } catch {
        // withLoggedOperation already logged + ended the FCI as failed.
        return { success: false };
      } finally {
        setSaving(false);
      }
    },
    [manage, logger, sandbox],
  );

  return { saving, createPost, updatePost };
};
