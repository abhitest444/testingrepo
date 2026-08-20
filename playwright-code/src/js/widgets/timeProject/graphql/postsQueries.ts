import gql from 'graphql-tag';

// Lightweight unread-count query for the Posts tab badge. Called on
// ProjectSummary mount regardless of which tab is active.
export const GET_POSTS_UNREAD_COUNT = gql`
  query TimeTrackingPostsUnreadCount(
    $input: TimeTracking_PostsUnreadCountInput!
  ) {
    timeTrackingPostsUnreadCount(input: $input) {
      projectId
      customerId
      workerId
      unreadCount
    }
  }
`;

// Feed mode: top-level posts (no `filter`, so parentPostId IS NULL),
// newest-first, cursor-paginated. Replies are intentionally not fetched
// here — that lands in the thread story.
export const GET_POSTS_FEED = gql`
  query TimeTrackingPosts(
    $input: TimeTracking_PostsInput!
    $first: PositiveInt!
    $after: String
  ) {
    timeTrackingPosts(input: $input, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          projectId
          customerId
          content
          parentPostId
          replyCount
          unreadReplyCount
          worker {
            id
            type
            firstName
            lastName
            displayName
            isActive
          }
          contentAttachments {
            id
            documentId
            fileName
            orientationDegree
            meta {
              createdAt
              createdBy
            }
          }
          postMentions {
            workerId
            displayName
            token
            active
          }
          postMeta {
            createdAt
            updatedAt
            createdBy
            updatedBy
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Replies mode: direct children of a post (filter.parentPostId), cursor
// paginated. Same node shape as the feed so the mapper is reused.
export const GET_POST_REPLIES = gql`
  query TimeTrackingPostReplies(
    $input: TimeTracking_PostsInput!
    $filter: TimeTracking_PostsFilter
    $first: PositiveInt!
    $after: String
  ) {
    timeTrackingPosts(
      input: $input
      filter: $filter
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          projectId
          customerId
          content
          parentPostId
          replyCount
          unreadReplyCount
          worker {
            id
            type
            firstName
            lastName
            displayName
            isActive
          }
          contentAttachments {
            id
            documentId
            fileName
            orientationDegree
            meta {
              createdAt
              createdBy
            }
          }
          postMentions {
            workerId
            displayName
            token
            active
          }
          postMeta {
            createdAt
            updatedAt
            createdBy
            updatedBy
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;
