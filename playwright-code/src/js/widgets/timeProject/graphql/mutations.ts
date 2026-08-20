import gql from 'graphql-tag';

export const CREATE_PROJECT_ESTIMATE = gql`
  mutation CreateProjectEstimate(
    $input: TimeTracking_CreateProjectEstimateInput!
  ) {
    timeTrackingCreateProjectEstimate(input: $input) {
      ... on TimeTracking_CreateProjectEstimatePayload {
        successCode
        projectEstimate {
          id
          projectId
          projectEstimateType
          totalEstimatedSeconds
          fieldType
          fieldRef
          projectEstimateItems {
            edges {
              node {
                fieldOptionId
                estimatedSeconds
              }
              cursor
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
      ... on TimeTracking_CreateProjectEstimateError {
        errorCode
        message
        details
      }
    }
  }
`;

export const UPDATE_PROJECT_ESTIMATE = gql`
  mutation UpdateProjectEstimate(
    $input: TimeTracking_UpdateProjectEstimateInput!
  ) {
    timeTrackingUpdateProjectEstimate(input: $input) {
      ... on TimeTracking_UpdateProjectEstimatePayload {
        successCode
        projectEstimate {
          id
          projectId
          projectEstimateType
          totalEstimatedSeconds
          fieldType
          fieldRef
        }
      }
      ... on TimeTracking_UpdateProjectEstimateError {
        errorCode
        message
        details
      }
    }
  }
`;

export const DELETE_PROJECT_ESTIMATE = gql`
  mutation DeleteProjectEstimate(
    $input: TimeTracking_DeleteProjectEstimateInput!
  ) {
    timeTrackingDeleteProjectEstimate(input: $input) {
      ... on TimeTracking_DeleteProjectEstimatePayload {
        successCode
        projectId
      }
      ... on TimeTracking_DeleteProjectEstimateError {
        errorCode
        message
        details
      }
    }
  }
`;
