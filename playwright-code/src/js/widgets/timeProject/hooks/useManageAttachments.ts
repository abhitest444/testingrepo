import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  TimeCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
} from 'src/js/common/CustomerInteraction';
import {
  CREATE_ATTACHMENTS,
  DELETE_ATTACHMENTS,
} from '../graphql/postsMutations';
import {
  useTimeProjectLogger,
  useTimeProjectSandbox,
  withLoggedOperation,
} from '../utils/timeProjectLogging';

/** A single attachment to link to a post (maps to TimeTracking_CreateAttachmentInput). */
export interface CreateAttachmentInput {
  documentId: string;
  name: string;
  description?: string;
  orientationDegree?: number;
}

export interface CreateAttachmentsArgs {
  postId: string;
  attachments: CreateAttachmentInput[];
}

export interface DeleteAttachmentsArgs {
  postId: string;
  /** Attachment ids (not documentIds) to remove. */
  attachmentIds: string[];
}

export interface AttachmentsResult {
  success: boolean;
  errorMessage?: string;
}

export interface UseManageAttachmentsResult {
  saving: boolean;
  createAttachments: (
    args: CreateAttachmentsArgs,
  ) => Promise<AttachmentsResult>;
  deleteAttachments: (
    args: DeleteAttachmentsArgs,
  ) => Promise<AttachmentsResult>;
}

/**
 * Create (link) and delete (unlink) content attachments on a post via
 * `timeTrackingCreateAttachments` / `timeTrackingDeleteAttachments`. Attachments
 * are managed separately from the post body — the composer calls these after
 * the post itself is created/updated.
 */
export const useManageAttachments = (): UseManageAttachmentsResult => {
  const logger = useTimeProjectLogger();
  const sandbox = useTimeProjectSandbox();
  const [saving, setSaving] = useState(false);
  const [createMutation] = useMutation(CREATE_ATTACHMENTS);
  const [deleteMutation] = useMutation(DELETE_ATTACHMENTS);

  const createAttachments = useCallback(
    async ({
      postId,
      attachments,
    }: CreateAttachmentsArgs): Promise<AttachmentsResult> => {
      setSaving(true);
      try {
        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_POST_ATTACHMENTS_CREATE,
          event: {
            start:
              'Component=useManageAttachments Event=Create Attachments Started',
            success:
              'Component=useManageAttachments Event=Create Attachments Success',
            failure:
              'Component=useManageAttachments Event=Create Attachments Failed',
          },
          extraProps: { postId, count: attachments.length },
          isFailure: (res) =>
            res.data?.timeTrackingCreateAttachments?.successCode
              ? null
              : res.data?.timeTrackingCreateAttachments?.errorCode ||
                'NO_SUCCESS_CODE',
          run: () =>
            createMutation({
              variables: { input: { postId, attachments } },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POST_ATTACHMENTS_CREATE,
                      ),
                    },
                  }
                : {}),
            }),
        });

        const result = data?.timeTrackingCreateAttachments;
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
    [createMutation, logger, sandbox],
  );

  const deleteAttachments = useCallback(
    async ({
      postId,
      attachmentIds,
    }: DeleteAttachmentsArgs): Promise<AttachmentsResult> => {
      setSaving(true);
      try {
        const { data } = await withLoggedOperation({
          logger,
          sandbox,
          interactionName:
            TimeCustomerInteraction.TIME_PROJECT_POST_ATTACHMENTS_DELETE,
          event: {
            start:
              'Component=useManageAttachments Event=Delete Attachments Started',
            success:
              'Component=useManageAttachments Event=Delete Attachments Success',
            failure:
              'Component=useManageAttachments Event=Delete Attachments Failed',
          },
          extraProps: { postId, count: attachmentIds.length },
          isFailure: (res) =>
            res.data?.timeTrackingDeleteAttachments?.successCode
              ? null
              : res.data?.timeTrackingDeleteAttachments?.errorCode ||
                'NO_SUCCESS_CODE',
          run: () =>
            deleteMutation({
              variables: { input: { postId, attachments: attachmentIds } },
              ...(sandbox
                ? {
                    context: {
                      headers: getCustomerInteractionPropagationHeaders(
                        sandbox,
                        TimeCustomerInteraction.TIME_PROJECT_POST_ATTACHMENTS_DELETE,
                      ),
                    },
                  }
                : {}),
            }),
        });

        const result = data?.timeTrackingDeleteAttachments;
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
    [deleteMutation, logger, sandbox],
  );

  return { saving, createAttachments, deleteAttachments };
};
