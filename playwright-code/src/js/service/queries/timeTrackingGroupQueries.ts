/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

/**
 * Group-related queries for Time Tracking
 * These queries are used with GraphQL codegen for auto-generated types
 */

/**
 * Query to fetch groups (without nested members for initial load)
 * SLICE 2: Groups infinite scroll
 */
export const GET_GROUPS_QUERY = gql`
  query getTimeTrackingGroups(
    $first: PositiveInt
    $filter: TimeTracking_GroupFilter
    $orderBy: [TimeTracking_GroupOrderBy!]
    $after: String
  ) {
    timeTrackingGroups(
      first: $first
      filter: $filter
      orderBy: $orderBy
      after: $after
    ) {
      totalTimeAgainstCount
      totalCount
      edges {
        node {
          id
          name
          isActive
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          stats {
            memberCount
            managerCount
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/**
 * Query to fetch workers who are not assigned to any group
 * Used to display the "No Group" section in Workers Table
 */
export const GET_UNASSIGNED_WORKERS_QUERY = gql`
  query getUnassignedWorkers(
    $first: PositiveInt!
    $after: String
    $filter: TimeTracking_WorkersQueryFilter
    $orderBy: [TimeTracking_WorkerOrderBy!]
  ) {
    timeTrackingWorkers(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          type
          isActive
          firstName
          lastName
          displayName
          memberOfGroup {
            id
            name
            isActive
          }
          managesGroups {
            id
            name
            isActive
          }
        }
      }
    }
  }
`;

/**
 * Query to fetch workers with pagination and filtering support
 * Used for assigning workers to groups in the Assign Workers and Assign Leads drawers
 * Supports search, group filtering, and pagination
 */
export const GET_TIME_TRACKING_WORKERS = gql`
  query getTimeTrackingWorkers(
    $first: PositiveInt! = 100
    $after: String
    $filter: TimeTracking_WorkersQueryFilter
    $orderBy: [TimeTracking_WorkerOrderBy!]
  ) {
    timeTrackingWorkers(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      totalCount
      edges {
        node {
          id
          type
          isActive
          firstName
          lastName
          displayName
          memberOfGroup {
            id
            name
            isActive
          }
          managesGroups {
            id
            name
            isActive
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/**
 * Query to search workers in a group using timeTrackingWorkers API
 * Searches both members (groupId) and managers (managesGroupId) with searchText
 * Used when user types in search field in GroupDetailView
 */
export const SEARCH_GROUP_WORKERS_QUERY = gql`
  query searchGroupWorkers(
    $groupId: ID!
    $searchText: String
    $types: [TimeTracking_TimeForType!]
    $first: PositiveInt!
    $after: String
  ) {
    members: timeTrackingWorkers(
      first: $first
      after: $after
      filter: { groupId: $groupId, searchText: $searchText, types: $types }
      orderBy: [DISPLAY_NAME_ASC]
    ) {
      totalCount
      edges {
        cursor
        node {
          id
          type
          isActive
          firstName
          lastName
          displayName
          managesGroups {
            id
            name
            isActive
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

/**
 * Query to fetch members (workers) for a specific group using the group's members field
 * Used for nested infinite scroll in Workers Table by Groups View
 * SLICE 3: Nested workers infinite scroll with cursor-based pagination
 */
export const GET_GROUP_MEMBERS_QUERY = gql`
  query getGroupMembers($groupId: ID!, $first: PositiveInt!, $after: String) {
    timeTrackingGroups(first: 1, filter: { ids: [$groupId] }) {
      edges {
        node {
          id
          name
          isActive
          stats {
            memberCount
            managerCount
          }
          members(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                type
                isActive
                firstName
                lastName
                displayName
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      }
    }
  }
`;

/**
 * Query to fetch current managers for a specific group
 * Used for Assign Manager modal to:
 * 1. Get group context (name for modal title, stats for worker count)
 * 2. Get current managers for pre-selection in edit mode
 */
export const GET_CURRENT_GROUP_MANAGERS = gql`
  query getCurrentGroupManagers(
    $groupId: ID!
    $first: PositiveInt! = 100
    $after: String
  ) {
    timeTrackingGroups(first: 1, filter: { ids: [$groupId] }) {
      edges {
        node {
          id
          name
          isActive
          stats {
            memberCount
            managerCount
          }
          managers(first: $first, after: $after) {
            edges {
              cursor
              node {
                id
                type
                isActive
                firstName
                lastName
                displayName
                identityAuthId
                intuitProfileId
                memberOfGroup {
                  id
                  name
                  isActive
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      }
    }
  }
`;

/**
 * Query to fetch only totalCount of workers matching filter criteria
 * Optimized for header display - doesn't fetch worker data
 * Used in WorkersListView header
 */
export const GET_WORKERS_TOTAL_COUNT = gql`
  query getWorkersTotalCount($filter: TimeTracking_WorkersQueryFilter) {
    timeTrackingWorkers(first: 1, filter: $filter) {
      totalCount
    }
  }
`;

/**
 * Query to fetch only totalActiveGroupCount
 * Optimized for header display - doesn't fetch group data
 * Used in GroupDetailView header
 */
export const GET_ACTIVE_GROUPS_TOTAL_COUNT = gql`
  query getActiveGroupsTotalCount($filter: TimeTracking_GroupFilter) {
    timeTrackingGroups(first: 1, filter: $filter) {
      totalActiveGroupCount
    }
  }
`;

/**
 * Query to fetch only totalCount of workers in a group
 * Optimized for header display - doesn't fetch worker data
 * Used in GroupDetailView header to show member count
 */
export const GET_GROUP_WORKERS_TOTAL_COUNT = gql`
  query getGroupWorkersTotalCount(
    $groupId: ID!
    $searchText: String
    $types: [TimeTracking_TimeForType!]
  ) {
    members: timeTrackingWorkers(
      first: 1
      filter: { groupId: $groupId, searchText: $searchText, types: $types }
    ) {
      totalCount
    }
  }
`;
