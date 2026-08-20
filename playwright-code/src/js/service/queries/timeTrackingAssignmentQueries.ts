/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

/**
 * Assignment-related queries for Time Tracking
 * These queries are used with GraphQL codegen for auto-generated types
 */

export const GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY = gql`
  query getCustomFieldAssignments(
    $first: PositiveInt! = 20
    $after: String
    $input: TimeTracking_CustomFieldAssignmentsQueryInput!
    $filter: TimeTracking_CustomFieldAssignmentsFilter
  ) {
    timeTrackingCustomFieldAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
          customFieldDefinition {
            id
          }
          assigned
          assignedToAll
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

export const GET_STANDARD_FIELD_ASSIGNMENTS_QUERY = gql`
  query getStandardFieldAssignments(
    $first: PositiveInt! = 20
    $after: String
    $input: TimeTracking_StandardFieldAssignmentsQueryInput!
    $filter: TimeTracking_StandardFieldAssignmentsFilter
  ) {
    timeTrackingStandardFieldAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
          standardFieldLabel {
            name
          }
          assigned
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

export const MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION = gql`
  mutation manageTimeAgainstFieldAssignment(
    $input: TimeTracking_ManageTimeAgainstFieldAssignmentInput!
  ) {
    timeTrackingManageTimeAgainstFieldAssignment(input: $input) {
      ... on TimeTracking_ManageTimeAgainstFieldAssignmentPayload {
        successCode
        timeAgainst {
          customer {
            id
          }
          project {
            id
          }
        }
        customFieldResult {
          ... on TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload {
            successCode
          }
          ... on TimeTracking_ManageTimeAgainstCustomFieldAssignmentError {
            errorCode
            message
            details
            subCode
          }
        }
        standardFieldResult {
          ... on TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload {
            successCode
          }
          ... on TimeTracking_ManageTimeAgainstStandardFieldAssignmentError {
            errorCode
            message
            details
            subCode
          }
        }
      }
      ... on TimeTracking_PartialTimeAgainstFieldAssignmentPayload {
        successCode
        timeAgainst {
          customer {
            id
          }
          project {
            id
          }
        }
        customFieldResult {
          ... on TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload {
            successCode
          }
          ... on TimeTracking_ManageTimeAgainstCustomFieldAssignmentError {
            errorCode
            message
            details
            subCode
          }
        }
        standardFieldResult {
          ... on TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload {
            successCode
          }
          ... on TimeTracking_ManageTimeAgainstStandardFieldAssignmentError {
            errorCode
            message
            details
            subCode
          }
        }
      }
      ... on TimeTracking_ManageTimeAgainstFieldAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION = gql`
  mutation manageStandardFieldAssignment(
    $input: TimeTracking_ManageStandardFieldAssignmentInput!
  ) {
    timeTrackingManageStandardFieldAssignment(input: $input) {
      ... on TimeTracking_ManageStandardFieldAssignmentPayload {
        successCode
        standardFieldLabel
        assignToAll
        assignedCustomers {
          id
        }
        unassignedCustomers {
          id
        }
      }
      ... on TimeTracking_PartialStandardFieldAssignmentPayload {
        successCode
        standardFieldLabel
        assignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        unassignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
      }
      ... on TimeTracking_ManageStandardFieldAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION = gql`
  mutation manageCustomFieldAssignment(
    $input: TimeTracking_ManageCustomFieldAssignmentInput!
  ) {
    timeTrackingManageCustomFieldAssignment(input: $input) {
      ... on TimeTracking_ManageCustomFieldAssignmentPayload {
        successCode
      }
      ... on TimeTracking_PartialCustomFieldAssignmentPayload {
        successCode
        assignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        unassignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
      }
      ... on TimeTracking_ManageCustomFieldAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY = gql`
  query getTimeAgainstAssignmentSummary(
    $first: PositiveInt! = 20
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
            shippingAddress {
              city
              country
              lines
              postalCode
              state
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
        cursor
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

export const TIME_AGAINST_ASSIGNMENTS_QUERY = gql`
  query getTimeAgainstAssignments(
    $first: PositiveInt! = 20
    $after: String
    $input: TimeTracking_TimeAgainstAssignmentsQueryInput!
    $filter: TimeTracking_TimeAgainstAssignmentsFilter
  ) {
    timeTrackingTimeAgainstAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
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
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalTimeAgainstCount
    }
  }
`;

export const TIME_FOR_ASSIGNMENTS_QUERY = gql`
  query getTimeForAssignments(
    $first: PositiveInt! = 20
    $after: String
    $input: TimeTracking_TimeForAssignmentsQueryInput!
    $filter: TimeTracking_TimeForAssignmentsFilter
  ) {
    timeTrackingTimeForAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
          timeForContactDAS {
            id
          }
          assigned
          displayName
          fullName
          contractor
          groupId
          groupName
          timeForType
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalTimeForCount
    }
  }
`;

export const GET_CUSTOM_FIELD_OPTION_ASSIGNMENTS_QUERY = gql`
  query getCustomFieldOptionAssignments(
    $first: PositiveInt! = 20
    $after: String
    $input: TimeTracking_CustomFieldOptionAssignmentsQueryInput!
    $filter: TimeTracking_CustomFieldOptionAssignmentsFilter
  ) {
    timeTrackingCustomFieldOptionAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
          customField {
            id
          }
          customFieldOptions {
            customFieldOption {
              id
            }
            assigned
          }
          timeFor {
            id
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

export const MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION = gql`
  mutation manageCustomFieldOptionAssignment(
    $input: TimeTracking_ManageCustomFieldOptionAssignmentInput!
  ) {
    timeTrackingManageCustomFieldOptionAssignment(input: $input) {
      ... on TimeTracking_ManageCustomFieldOptionAssignmentPayload {
        successCode
      }
      ... on TimeTracking_PartialCustomFieldOptionAssignmentPayload {
        successCode
        customFieldOption {
          id
        }
        timeForAssignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        timeForUnassignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        groupAssignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        groupUnassignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
      }
      ... on TimeTracking_ManageCustomFieldOptionAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION = gql`
  mutation manageTimeAgainstTimeForAssignment(
    $input: TimeTracking_ManageTimeAgainstTimeForAssignmentInput!
  ) {
    timeTrackingManageTimeAgainstTimeForAssignment(input: $input) {
      ... on TimeTracking_ManageTimeAgainstTimeForAssignmentPayload {
        successCode
        timeAgainst {
          customer {
            id
          }
          project {
            id
          }
        }
        assignToAll
        assignedTimeFor {
          id
        }
        unassignedTimeFor {
          id
        }
        assignedGroups {
          id
        }
        unassignedGroups {
          id
        }
      }
      ... on TimeTracking_PartialTimeAgainstTimeForAssignmentPayload {
        successCode
        timeAgainst {
          customer {
            id
          }
          project {
            id
          }
        }
        timeForAssignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        timeForUnassignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        groupAssignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        groupUnassignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
      }
      ... on TimeTracking_ManageTimeAgainstTimeForAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const STANDARD_FIELD_OPTIONS_SUMMARY_QUERY = gql`
  query getStandardFieldOptionsSummary(
    $standardFieldLabel: String!
    $first: PositiveInt! = 20
    $after: String
    $filter: TimeTracking_StandardFieldOptionSummaryFilter
  ) {
    timeTrackingStandardFieldOptionSummary(
      standardFieldLabel: $standardFieldLabel
      first: $first
      after: $after
      filter: $filter
    ) {
      edges {
        node {
          id
          name
          standardFieldLabel
          workerAssignmentCount
          customerAssignmentCount
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalWorkerCount
      totalCustomerCount
      totalOptionsCount
    }
  }
`;

export const MANAGE_STANDARD_FIELD_OPTION_TIME_FOR_ASSIGNMENT_MUTATION = gql`
  mutation manageStandardFieldOptionTimeForAssignment(
    $input: TimeTracking_ManageStandardFieldOptionTimeForAssignmentInput!
  ) {
    timeTrackingManageStandardFieldOptionTimeForAssignment(input: $input) {
      ... on TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload {
        successCode
      }
      ... on TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload {
        successCode
        timeForAssignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
        timeForUnassignResults {
          ... on TimeTracking_AssignedWorker {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
        groupAssignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
        groupUnassignResults {
          ... on TimeTracking_AssignedGroup {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
      }
      ... on TimeTracking_ManageStandardFieldOptionTimeForAssignmentError {
        errorCode
        message
      }
    }
  }
`;

export const MANAGE_STANDARD_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION = gql`
  mutation manageStandardFieldOptionTimeAgainstAssignment(
    $input: TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput!
  ) {
    timeTrackingManageStandardFieldOptionTimeAgainstAssignment(input: $input) {
      ... on TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload {
        successCode
      }
      ... on TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload {
        successCode
        timeAgainstAssignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
        timeAgainstUnassignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            element
            message
          }
        }
      }
      ... on TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError {
        errorCode
        message
      }
    }
  }
`;

export const MANAGE_CUSTOM_FIELD_OPTION_TIME_AGAINST_ASSIGNMENT_MUTATION = gql`
  mutation manageCustomFieldOptionTimeAgainstAssignment(
    $input: TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput!
  ) {
    timeTrackingManageCustomFieldOptionTimeAgainstAssignment(input: $input) {
      ... on TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload {
        successCode
        customField {
          id
        }
        customFieldOption {
          id
          name
          deleted
        }
        assignedTimeAgainst {
          id
        }
        unassignedTimeAgainst {
          id
        }
      }
      ... on TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload {
        successCode
        customFieldOption {
          id
          name
        }
        timeAgainstAssignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
        timeAgainstUnassignResults {
          ... on TimeTracking_AssignedCustomer {
            id
          }
          ... on TimeTracking_AssignmentItemError {
            errorCode
            message
            details
            subCode
            element
          }
        }
      }
      ... on TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const GEOFENCE_CONFIGURATION_QUERY = gql`
  query getGeofenceConfiguration(
    $input: TimeTracking_GeofenceConfigurationInput!
  ) {
    timeTrackingGeofenceConfiguration(input: $input) {
      edges {
        node {
          timeAgainstContactDAS {
            project {
              id
            }
            customer {
              id
            }
          }
          geofenceEnabled {
            meta {
              version
            }
            value
          }
          geofenceLocation {
            meta {
              version
              createdAt
              updatedAt
            }
            latitude
            longitude
            geofenceRadiusInMeter
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

// TODO: [QUANTA-10202] Wire up GEOFENCE_RADIUS_QUERY in GeofenceLocationFields once address search and map are implemented
export const GEOFENCE_RADIUS_QUERY = gql`
  query getGeofenceRadius($input: TimeTracking_GeofenceRadiusInput!) {
    timeTrackingGeofenceRadius(input: $input) {
      placeId
      geofenceRadiusInMeter
    }
  }
`;

export const UPDATE_GEOFENCE_CONFIGURATION_MUTATION = gql`
  mutation updateGeofenceConfiguration(
    $input: TimeTracking_UpdateGeofenceConfigurationInput!
  ) {
    timeTrackingUpdateGeofenceConfiguration(input: $input) {
      ... on TimeTracking_UpdateGeofenceConfigurationPayload {
        successCode
        geofenceConfiguration {
          timeAgainstContactDAS {
            project {
              id
            }
            customer {
              id
            }
          }
          geofenceEnabled {
            meta {
              version
            }
            value
          }
          geofenceLocation {
            meta {
              version
              createdAt
              updatedAt
            }
            latitude
            longitude
            geofenceRadiusInMeter
          }
        }
      }
      ... on TimeTracking_UpdateGeofenceConfigurationError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

export const STANDARD_FIELD_OPTION_ASSIGNMENTS_QUERY = gql`
  query StandardFieldOptionAssignments(
    $first: PositiveInt!
    $after: String
    $input: TimeTracking_StandardFieldOptionAssignmentsQueryInput!
    $filter: TimeTracking_StandardFieldOptionAssignmentsFilter
  ) {
    timeTrackingStandardFieldOptionAssignments(
      first: $first
      after: $after
      input: $input
      filter: $filter
    ) {
      edges {
        node {
          id
          name
          assigned
          active
          standardFieldLabel
          fullName
          parentId
          level
          saleDetails {
            price
            description
          }
          taxable
          numberOfChildren
          __typename
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      __typename
    }
  }
`;
