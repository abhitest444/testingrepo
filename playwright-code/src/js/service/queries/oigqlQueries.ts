/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

export const CUSTOMER_DATA_FOR_TIME_ENTRIES_QUERY = gql`
  query getCustomerDataForTimeEntries($filter: DataAccess_ContactFilter) {
    dataAccessContacts(filter: $filter) {
      edges {
        node {
          id
          displayName
          fullName
          ... on DataAccess_Project {
            projectId
          }
        }
      }
    }
  }
`;

export const ENTITLEMENTS_QUERY = gql`
  query getBulkAccountEntitlementGrants(
    $filterBy: Identity_BulkLookupAccountEntitlementGrantsFilter!
  ) {
    identityBulkLookupAccountEntitlementGrants(filterBy: $filterBy) {
      edges {
        node {
          accountId
          entitlementGrants {
            accountId
            accountType
            billingAccountId
            entitlementGrantProductOffering {
              assetId
              flavor
              offeringId
              releaseNumber
              versionNumber
            }
            entitlementGrantType
            entitlementInfo {
              name
              value
            }
            featureSet
            featureSetDetails {
              featureSetCode
              featureSetDetails {
                featureSetCode
                optionalFeatures {
                  code
                  readOnlyStatus
                  serviceStatus
                  status
                }
              }
            }
            grantId
            licenseNumber
            readOnlyStatus
            serviceStatus
            status
          }
        }
      }
    }
  }
`;

export const EMPLOYEE_JOB_COSTING_QUERY = gql`
  query getEmployeeJobCosting($employeeId: ID!) {
    workerManagementEmployeeJobCosting(employeeId: $employeeId) {
      billable
      billRate {
        value
      }
    }
  }
`;

gql`
  query getPayrollEmployeeCompensations(
    $filter: Payroll_EmployeeCompensationsFilter!
  ) {
    payrollEmployeeCompensations(filter: $filter) {
      edges {
        node {
          active
          id
          employerCompensation {
            name
            type {
              value
            }
          }
        }
      }
    }
  }
`;

export const EMPLOYEES_AND_VENDORS_QUERY = gql`
  query getEmployeesAndVendors(
    $filter: DataAccess_ContactFilter
    $first: PositiveInt!
    $offset: Int
    $orderBy: [DataAccess_ContactsSort!]
  ) {
    dataAccessContacts(
      filter: $filter
      first: $first
      offset: $offset
      orderBy: $orderBy
    ) {
      edges {
        node {
          type
          displayName
          firstName
          fullName
          id
          level
          numberOfChildren
          parentId
          root
          ... on DataAccess_Vendor {
            contractor
          }
          ... on DataAccess_Project {
            projectId
          }
        }
      }
      pageInfo {
        hasNextPage
      }
      totalCount
    }
  }
`;

// ems query
export const GET_PROFILE_ID_BY_WORKER_ID = gql`
  query WorkerManagementWorker($workerManagementWorkerId: ID!) {
    workerManagementWorker(id: $workerManagementWorkerId) {
      workerAccess {
        profileId
        digitalIdentityId
      }
    }
  }
`;

// identity accounts subgraph query
export const PROFILE_STATUS_QUERY = gql`
  query Profile($input: GetProfileInput!) {
    profile(input: $input) {
      profileStatus
    }
  }
`;

// identity update user
export const IDENTITY_UPDATE_USER_MUTATION = gql`
  mutation identityUpdateUser($input: Identity_UpdateUserInput!) {
    identityUpdateUser(input: $input) {
      identityUser {
        roles {
          canonicalName
          name
        }
      }
    }
  }
`;
