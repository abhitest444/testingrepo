import gql from 'graphql-tag';

/**
 * Fetches per-worker permissions for the PermissionsCard.
 *
 * Backed by `timeTrackingWorkerPermissions` on the qbtime subgraph
 * (resolver: `WorkerPermissionsQueryResolver`). The selection set mirrors
 * the full `TimeTracking_WorkerPermissions` type so consumers can render
 * the card view-model from a single fetch — no follow-up queries needed.
 */
export const GET_TIME_TRACKING_WORKER_PERMISSIONS = gql`
  query TimeTrackingWorkerPermissions(
    $input: TimeTracking_WorkerPermissionsInput!
  ) {
    timeTrackingWorkerPermissions(input: $input) {
      workerId
      workerType
      admin
      managementPermissions {
        manageTimesheets
        manageMyTimesheets
        manageUsers
        manageStandardFields
        manageAuthorization
        approveTimesheets
        viewReports
      }
      schedulePermissions {
        manageLevel
        viewLevel
      }
      projectPermission
      featurePermissions {
        mobileEnabled
        whosWorkingEnabled
        pinLoginEnabled
        externalAccessEnabled
      }
    }
  }
`;

/**
 * Persists per-worker permission changes via the
 * `timeTrackingUpdateWorkerPermissions` mutation
 * (resolver: `WorkerPermissionsMutationResolver`). Accepts sparse input —
 * the FE only sends the groups whose fields actually changed. The success
 * payload re-selects the full `TimeTracking_WorkerPermissions` shape so
 * the caller can resync state with the server-confirmed values without a
 * follow-up read.
 */
export const UPDATE_TIME_TRACKING_WORKER_PERMISSIONS = gql`
  mutation TimeTrackingUpdateWorkerPermissions(
    $input: TimeTracking_UpdateWorkerPermissionsInput!
  ) {
    timeTrackingUpdateWorkerPermissions(input: $input) {
      ... on TimeTracking_UpdateWorkerPermissionsPayload {
        successCode
        workerPermissions {
          workerId
          workerType
          admin
          managementPermissions {
            manageTimesheets
            manageMyTimesheets
            manageUsers
            manageStandardFields
            manageAuthorization
            approveTimesheets
            viewReports
          }
          schedulePermissions {
            manageLevel
            viewLevel
          }
          projectPermission
          featurePermissions {
            mobileEnabled
            whosWorkingEnabled
            pinLoginEnabled
            externalAccessEnabled
          }
        }
      }
      ... on TimeTracking_UpdateWorkerPermissionsError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;
