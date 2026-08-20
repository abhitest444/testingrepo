/* eslint-disable no-unused-expressions */

/**
 * TSheets GraphQL Queries
 *
 * This file contains queries for the TSheets API.
 * IMPORTANT: This file is NOT included in the GraphQL codegen process.
 * The queries here are used directly with the Apollo client and do not
 * generate TypeScript types or React hooks.
 */

import gql from 'graphql-tag';

export const GET_TIME_TRACKING_WORKER_BY_ID = gql`
  query timeTrackingWorkerById($id: ID!) {
    timeTrackingWorkerById(id: $id) {
      tsheetsId
      authId
      profileId
      employeeId
      vendorId
      isEmployee
      isQboUser
      isVendor
      self
      managedGroupIds
      groupId
      permissions
      cacheHit
      timeMs
    }
  }
`;

/**
 * Query to fetch TSheets company settings, specifically overtime addon status
 * Used to check if overtime is enabled before making IXP feature flag calls
 */
export const GET_TSHEETS_OVERTIME_ENABLED = gql`
  query TimeTrackingSettings {
    timeTrackingSettings {
      overtimeSettings {
        addonEnabled
      }
    }
  }
`;
