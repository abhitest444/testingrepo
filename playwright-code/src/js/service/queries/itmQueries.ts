/* eslint-disable no-unused-expressions */

/**
 * ITM (Intuit Task Management) GraphQL Queries
 *
 * This file contains queries for the ITM API via OIGQL.
 */

import gql from 'graphql-tag';

export const GET_TASK_LIST = gql`
  query taskManagementTasks(
    $first: Int!
    $after: Int!
    $filter: TaskManagement_TaskFilter!
    $orderBy: [TaskManagement_OrderBy!]
  ) {
    taskManagementTasks(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      nodes {
        id
        name
        description
        status
        type
        dueDate
        priority
        references {
          id
        }
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation taskManagementUpdateTask(
    $taskUpdateRequest: TaskManagement_UpdateTaskInput!
  ) {
    taskManagementUpdateTask(input: $taskUpdateRequest) {
      message
      success
      code
      task {
        id
        name
      }
    }
  }
`;
