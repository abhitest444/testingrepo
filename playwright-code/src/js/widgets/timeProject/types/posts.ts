export interface PostWorker {
  id: string;
  type?: string | null; // 'EMPLOYEE' | 'VENDOR' | ...
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  isActive?: boolean | null;
}

export interface PostAttachment {
  id: string;
  documentId?: string | null;
  fileName?: string | null;
  orientationDegree?: number | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface PostMention {
  workerId: string;
  displayName?: string | null;
  token: string; // e.g. "<EMPLOYEE_6>"
  active: boolean;
}

export interface Post {
  id: string;
  parentPostId?: string | null;
  projectId?: string | null;
  customerId?: string | null;
  author: PostWorker;
  content: string; // raw, may contain mention tokens
  replyCount: number;
  unreadReplyCount: number;
  attachments: PostAttachment[];
  mentions: PostMention[];
  createdAt: string;
  updatedAt: string;
}

// ---- Mutation response shapes ----

export interface ManagePostSuccessResponse {
  __typename: 'TimeTracking_ManagePostPayload';
  successCode: string;
}

export interface ManagePostErrorResponse {
  __typename: 'TimeTracking_ManagePostError';
  errorCode: string;
  message: string | null;
  details: string | null;
  subCode: string | null;
}

export type ManagePostResponse =
  | ManagePostSuccessResponse
  | ManagePostErrorResponse;

export interface ManagePostMutationData {
  timeTrackingManagePost: ManagePostResponse;
}

export interface DeletePostResponse {
  successCode?: string;
  deletedPostId?: string;
  errorCode?: string;
  message?: string | null;
  details?: string | null;
  subCode?: string | null;
}

export interface DeletePostMutationData {
  timeTrackingDeletePost: DeletePostResponse;
}

export interface MarkPostsReadResponse {
  successCode?: string;
  readTo?: string;
  errorCode?: string;
  message?: string | null;
  details?: string | null;
  subCode?: string | null;
}

export interface MarkPostsReadMutationData {
  timeTrackingMarkPostsRead: MarkPostsReadResponse;
}

// ---- Raw GQL response shapes ----

// timeTrackingPostsUnreadCount
export interface PostsUnreadCountResponse {
  timeTrackingPostsUnreadCount?: {
    projectId: string | null;
    customerId: string | null;
    workerId: string;
    unreadCount: number;
  } | null;
}

// timeTrackingPosts

export interface PostNodeGQL {
  id: string;
  projectId?: string | null;
  customerId?: string | null;
  content?: string | null;
  parentPostId?: string | null;
  replyCount: number;
  unreadReplyCount: number;
  worker?: PostWorker | null;
  contentAttachments?:
    | {
        id: string;
        documentId?: string | null;
        fileName?: string | null;
        orientationDegree?: number | null;
        meta?: { createdAt?: string | null; createdBy?: string | null } | null;
      }[]
    | null;
  postMentions?: PostMention[] | null;
  postMeta: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string | null;
    updatedBy?: string | null;
  };
}

export interface PostsFeedEdge {
  cursor: string;
  node: PostNodeGQL;
}

export interface PostsFeedResponse {
  timeTrackingPosts?: {
    edges: PostsFeedEdge[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
    totalCount: number;
  } | null;
}
