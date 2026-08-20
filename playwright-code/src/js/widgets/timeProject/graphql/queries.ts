import gql from 'graphql-tag';

export const GET_PROJECT_ASSIGNMENT_SUMMARY = gql`
  query GetProjectAssignmentSummary(
    $first: PositiveInt! = 100
    $after: String
    $filter: TimeTracking_TimeAgainstAssignmentSummaryFilter
  ) {
    timeTrackingTimeAgainstAssignmentSummary(
      first: $first
      after: $after
      filter: $filter
    ) {
      edges {
        node {
          timeAgainst {
            timeAgainstContactDAS {
              project {
                id
              }
              customer {
                id
              }
            }
            assigned
            displayName
            fullName
            customerType
            active
            parentId
            level
            numChildren
          }
          assignedTimeForCount
          assignedCustomFieldCount
          assignedStandardFieldCount
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalTimeForAssignments
      totalCustomFieldAssignments
      totalStandardFieldAssignments
      totalTimeAgainstCount
    }
  }
`;

export const GET_TIME_PROJECTS_WITH_CUSTOMERS = gql`
  query GetTimeProjectsWithCustomers(
    $first: PositiveInt! = 6
    $after: String
    $filter: DataAccess_WorkProjectFilter
    $orderBy: [DataAccess_WorkProjectSort!] = [NAME_ASC]
  ) {
    dataAccessWorkProjects(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          status
          customerId
          dueDate
          startDate
          completedDate
          active
          description
          customer {
            id
            companyId
            fullName
            firstName
            lastName
            displayName
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_TIME_PROJECTS = gql`
  query GetTimeProjects(
    $first: PositiveInt! = 6
    $after: String
    $filter: DataAccess_WorkProjectFilter
    $orderBy: [DataAccess_WorkProjectSort!] = [NAME_ASC]
  ) {
    dataAccessWorkProjects(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          status
          customerId
          dueDate
          startDate
          completedDate
          active
          description
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

/**
 * Resolves the customer id ("parent contact" id) for a batch of work
 * project ids in a single OIGQL round-trip.
 *
 * Why filter on `parentId` (and not `projectId`): the supergraph treats
 * each project as a Contact whose parent is its customer. A project's
 * own `projectId` is a path-style URN (e.g. `/work/Project;<...>:<n>`),
 * but the OIGQL filter validator only accepts equality matches at the
 * `parentId` level for the (project, customer) parent-child link.
 *
 * Filter envelope shape (level1=or, level2=and) is required by the
 * OIGQL validator — see useProjectCustomerLookup for the runtime call.
 */
export const GET_PROJECT_CUSTOMERS_VIA_CONTACTS = gql`
  query GetProjectCustomersViaContacts(
    $timeAgainstIds: [String!]!
    $pageSize: PositiveInt!
  ) {
    dataAccessContacts(
      filter: {
        or: [
          {
            and: [
              { parentId: { matchesAny: $timeAgainstIds } }
              { active: { equals: true } }
              { customerType: { matchesAny: [PROJECT] } }
            ]
          }
        ]
      }
      first: $pageSize
    ) {
      edges {
        cursor
        node {
          __typename
          id
          ... on DataAccess_Project {
            projectId
            # parentId / parent.id is the OIGQL contact id of the
            # parent customer. Used by the assignment-save flow to
            # build the hierarchical timeAgainstList (project entry
            # + ancestor customer entry).
            parentId
            parent {
              id
              displayName
              fullName
            }
          }
        }
      }
    }
  }
`;

export const GET_WORKER_TIME_SUMMARY = gql`
  query WorkerTimeSummaryByProject(
    $input: TimeTracking_WorkerTimeSummaryInput!
    $first: Int
    $after: String
  ) {
    timeTrackingWorkerTimeSummary(input: $input, first: $first, after: $after) {
      edges {
        node {
          totalRegularSeconds
          timeForType
          timeForContactDAS {
            id
            firstName
            lastName
            displayName
            fullName
            type
            ... on DataAccess_Vendor {
              contractor
            }
          }
          # DAS can't stitch LEGACY_QBO_USER rows so timeForContactDAS is
          # null for them. Pull the persona id off the timeFor union so we
          # can resolve the display name from Identity downstream.
          timeFor {
            ... on TimeTracking_LegacyQboUser {
              id
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_WORKFLOW_PROJECTS = gql`
  query getJobs_workflow(
    $pageSize: Int
    $after: String
    $filter: String
    $order: String
  ) {
    company {
      projects(
        first: $pageSize
        after: $after
        filterBy: $filter
        orderBy: $order
      ) {
        edges {
          cursor
          node {
            id
            name
            status
            description
            dueDate
            completedDate
            startDate
            client {
              id
            }
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
      }
    }
  }
`;

export const GET_WORKFLOW_PROJECT_BY_ID = gql`
  query GetWorkflowProjectById($filter: String) {
    company {
      projects(first: 1, filterBy: $filter) {
        edges {
          node {
            id
            name
            status
            description
            dueDate
            completedDate
            startDate
            client {
              id
            }
          }
        }
      }
    }
  }
`;

/**
 * Full-text project name search via OIGQL contacts.
 *
 * `contactSearch` drives the relevance ranking. The `or/and` envelope
 * restricts results to active, non-deleted project-type contacts only.
 *
 * `__typename` is required because the Apollo client has `addTypename: false`;
 * without it, the `... on DataAccess_Project` inline fragment would not be
 * applied and `projectId` would always be undefined.
 *
 * `projectId` is a path-style URN returned by OIGQL:
 *   `/work/Project; djQuMTo5...:767655383`
 * `extractWorkflowIdFromUrn` strips everything up to and including the
 * semicolon to yield the Workflow API global `id` (`djQuMTo5...:767655383`),
 * which is used directly in the `id in (...)` Workflow filter.
 */
export const GET_PROJECTS_SEARCH_VIA_CONTACTS = gql`
  query SearchProjectsViaContacts(
    $searchText: String!
    $pageSize: PositiveInt!
  ) {
    dataAccessContacts(
      filter: {
        contactSearch: { searchText: $searchText, displayName: {} }
        or: [
          {
            and: [
              { active: { equals: true } }
              { customerType: { matchesAny: [PROJECT] } }
            ]
          }
        ]
      }
      first: $pageSize
      orderBy: [SCORE_DESC, FULL_NAME_ASC]
    ) {
      edges {
        node {
          __typename
          id
          displayName
          ... on DataAccess_Project {
            projectId
          }
        }
      }
    }
  }
`;

export const GET_PROJECT_ESTIMATES = gql`
  query GetProjectEstimates(
    $projectRefs: [TimeTracking_ProjectEstimateProjectRefInput!]
    $first: PositiveInt
    $after: String
    $itemsFirst: PositiveInt
    $itemsAfter: String
  ) {
    timeTrackingProjectEstimates(
      input: { projectRefs: $projectRefs }
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          projectId
          projectEstimateType
          projectElapsedSeconds
          totalEstimatedSeconds
          fieldType
          fieldRef
          projectEstimateItems(first: $itemsFirst, after: $itemsAfter) {
            edges {
              cursor
              node {
                fieldOptionId
                estimatedSeconds
                elapsedSeconds
                serviceItemDAS {
                  id
                  fullName
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
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
