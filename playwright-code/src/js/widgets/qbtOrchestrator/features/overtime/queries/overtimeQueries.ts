/* eslint-disable no-unused-expressions */

/**
 * Overtime GraphQL Queries
 *
 * This file contains queries for the TSheets API overtime endpoints.
 * IMPORTANT: This file is NOT included in the GraphQL codegen process.
 * The queries here are used directly with the Apollo client and do not
 * generate TypeScript types or React hooks.
 */

import gql from 'graphql-tag';

/**
 * Query to fetch a single overtime policy by ID
 */
export const GET_OVERTIME_POLICY = gql`
  query GetOvertimePolicy($id: ID!) {
    overtimePolicy(id: $id) {
      id
      name
      isDefault
      description
      isActive
      rules {
        values {
          id
          name
          type
          frequency
          multiplier
          enabled
          conditions {
            field
            value
          }
          payrollItemMap {
            id
            name
          }
        }
      }
      assignments {
        values {
          id
          entityType
          entityId
          entityName
        }
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * Query to fetch a list of overtime policies with optional filtering and pagination
 */
export const GET_OVERTIME_POLICIES = gql`
  query GetOvertimePolicies(
    $filter: OvertimePolicyFilter
    $pagination: PaginationInput
  ) {
    overtimePolicies(filter: $filter, pagination: $pagination) {
      values {
        id
        name
        isDefault
        description
        isActive
        rules {
          values {
            id
            name
            type
            frequency
            multiplier
            enabled
            conditions {
              field
              value
            }
            payrollItemMap {
              id
              name
            }
          }
        }
        assignments {
          values {
            id
            entityType
            entityId
            entityName
          }
        }
        createdAt
        updatedAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalCount
      }
    }
  }
`;

// ==========================================
// Overtime Policy Mutations
// ==========================================

/**
 * Shared fragment for overtime policy response fields
 */
const OVERTIME_POLICY_FIELDS = `
  id
  name
  description
  isDefault
  isActive
  rules {
    values {
      id
      name
      type
      frequency
      multiplier
      enabled
      conditions {
        field
        value
      }
      payrollItemMap {
        id
        name
      }
    }
  }
  assignments {
    values {
      id
      entityType
      entityId
      entityName
    }
  }
  createdAt
  updatedAt
`;

/**
 * Mutation to create a new overtime policy
 */
export const CREATE_OVERTIME_POLICY = gql`
  mutation CreateOvertimePolicy($input: CreateOvertimePolicyInput!) {
    createOvertimePolicy(input: $input) {
      clientMutationId
      policy {
        ${OVERTIME_POLICY_FIELDS}
      }
      status {
        statusCode
        message
      }
    }
  }
`;

/**
 * Mutation to update an existing overtime policy
 */
export const UPDATE_OVERTIME_POLICY = gql`
  mutation UpdateOvertimePolicy($id: ID!, $input: UpdateOvertimePolicyInput!) {
    updateOvertimePolicy(id: $id, input: $input) {
      clientMutationId
      policy {
        ${OVERTIME_POLICY_FIELDS}
      }
      status {
        statusCode
        message
      }
    }
  }
`;

/**
 * Mutation to delete an overtime policy
 */
export const DELETE_OVERTIME_POLICY = gql`
  mutation DeleteOvertimePolicy(
    $id: ID!
    $clientMutationId: String
    $userId: String
  ) {
    deleteOvertimePolicy(
      id: $id
      clientMutationId: $clientMutationId
      userId: $userId
    ) {
      clientMutationId
      deletedPolicyId
      status {
        statusCode
        message
      }
    }
  }
`;

/**
 * Mutation to create a user-level overtime policy override.
 * Uses userId and assignments.userIds to associate the policy with a specific worker.
 */
export const CREATE_USER_OVERTIME_POLICY = gql`
  mutation CreateUserOvertimePolicy($input: CreateOvertimePolicyInput!) {
    createOvertimePolicy(input: $input) {
      clientMutationId
      policy {
        id
        name
        description
        isDefault
        isActive
        rules {
          values {
            id
            name
            type
            frequency
            multiplier
            enabled
            conditions {
              field
              value
            }
          }
        }
        createdAt
        updatedAt
      }
      status {
        statusCode
        message
      }
    }
  }
`;

/**
 * Mutation to manage overtime policy assignments (assign/unassign users and groups)
 */
export const MANAGE_OVERTIME_POLICY_ASSIGNMENTS = gql`
  mutation ManageOvertimePolicyAssignments($policyId: ID!, $input: ManageOvertimePolicyAssignmentsInput!) {
    manageOvertimePolicyAssignments(policyId: $policyId, input: $input) {
      clientMutationId
      policy {
        ${OVERTIME_POLICY_FIELDS}
      }
      status {
        statusCode
        message
      }
    }
  }
`;
