import gql from 'graphql-tag';

// Create / update / reply to a post. For the New post composer we send no
// `id` and no `parentPostId` (a new top-level post). The mutation returns
// only a success code (no post object), so the feed is re-fetched on
// success rather than upserted from the response.
export const MANAGE_POST = gql`
  mutation TimeTrackingManagePost($input: TimeTracking_ManagePostInput!) {
    timeTrackingManagePost(input: $input) {
      __typename
      ... on TimeTracking_ManagePostPayload {
        successCode
        post {
          id
        }
      }
      ... on TimeTracking_ManagePostError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

// Create (link) content attachments to a post. Attachments are managed
// separately from the post body (see timeTrackingManagePost docs). `postId`
// links the uploaded IDX documents as the post's content attachments.
export const CREATE_ATTACHMENTS = gql`
  mutation TimeTrackingCreateAttachments(
    $input: TimeTracking_CreateAttachmentsInput!
  ) {
    timeTrackingCreateAttachments(input: $input) {
      __typename
      ... on TimeTracking_CreateAttachmentsPayload {
        successCode
        attachments {
          id
          documentId
          fileName
          fileDescription
          orientationDegree
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
          }
        }
      }
      ... on TimeTracking_AttachmentsMutationError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

// Remove content attachments from a post. `attachments` is the list of
// attachment ids (not documentIds) to unlink/delete.
export const DELETE_ATTACHMENTS = gql`
  mutation TimeTrackingDeleteAttachments(
    $input: TimeTracking_DeleteAttachmentsInput!
  ) {
    timeTrackingDeleteAttachments(input: $input) {
      __typename
      ... on TimeTracking_DeleteAttachmentsPayload {
        successCode
        deleted
      }
      ... on TimeTracking_AttachmentsMutationError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

// Soft-delete a post or reply. Returns the deleted post ID on success, or
// an error with `errorCode` (e.g. HAS_ACTIVE_REPLIES, POST_NOT_FOUND).
export const DELETE_POST = gql`
  mutation TimeTrackingDeletePost($input: TimeTracking_DeletePostInput!) {
    timeTrackingDeletePost(input: $input) {
      __typename
      ... on TimeTracking_DeletePostPayload {
        successCode
        deletedPostId
      }
      ... on TimeTracking_DeletePostError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

// Mark posts as read for the current worker. The server sets the read
// watermark timestamp (readTo) server-side. entityType=PROJECT marks all
// feed-level posts as read; entityId is the project ID.
export const MARK_POSTS_READ = gql`
  mutation TimeTrackingMarkPostsRead($input: TimeTracking_MarkPostsReadInput!) {
    timeTrackingMarkPostsRead(input: $input) {
      __typename
      ... on TimeTracking_MarkPostsReadPayload {
        successCode
        readTo
      }
      ... on TimeTracking_MarkPostsReadError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;
