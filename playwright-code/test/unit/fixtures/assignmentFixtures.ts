import {
  GET_STANDARD_FIELD_ASSIGNMENTS_QUERY,
  GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY,
} from 'src/js/service/queries/timeTrackingAssignmentQueries';
import type {
  GetStandardFieldAssignmentsQuery,
  GetCustomFieldAssignmentsQuery,
  ManageStandardFieldAssignmentMutation,
  ManageCustomFieldAssignmentMutation,
} from 'src/__generated__/timeTracking/graphql';

interface EmptyConnectionData {
  edges: never[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: null;
    endCursor: null;
  };
}

export const mockStandardFieldAssignmentsData: GetStandardFieldAssignmentsQuery =
  {
    timeTrackingStandardFieldAssignments: {
      edges: [
        {
          node: { standardFieldLabel: { name: 'Customer' }, assigned: true },
          cursor: 'cursor-1',
        },
        {
          node: { standardFieldLabel: { name: 'Project' }, assigned: false },
          cursor: 'cursor-2',
        },
        {
          node: { standardFieldLabel: { name: 'Service' }, assigned: true },
          cursor: 'cursor-3',
        },
      ],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'cursor-1',
        endCursor: 'cursor-3',
      },
    },
  };

export const mockCustomFieldAssignmentsData: GetCustomFieldAssignmentsQuery = {
  timeTrackingCustomFieldAssignments: {
    edges: [
      {
        node: {
          customFieldDefinition: { id: 'cf-1' },
          assigned: true,
          assignedToAll: false,
        },
        cursor: 'cursor-1',
      },
      {
        node: {
          customFieldDefinition: { id: 'cf-2' },
          assigned: false,
          assignedToAll: false,
        },
        cursor: 'cursor-2',
      },
      {
        node: {
          customFieldDefinition: { id: 'cf-3' },
          assigned: true,
          assignedToAll: false,
        },
        cursor: 'cursor-3',
      },
    ],
    pageInfo: {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor-1',
      endCursor: 'cursor-3',
    },
  },
};

export const mockEmptyAssignmentsData: EmptyConnectionData = {
  edges: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
};

export const mockStandardManageSuccessResponse: ManageStandardFieldAssignmentMutation =
  {
    timeTrackingManageStandardFieldAssignment: {
      __typename: 'TimeTracking_ManageStandardFieldAssignmentPayload',
      successCode: 'SUCCESS',
      standardFieldLabel: 'CLASS',
      assignToAll: false,
      assignedCustomers: [
        { __typename: 'TimeTracking_AssignedCustomer', id: 'customer-1' },
        { __typename: 'TimeTracking_AssignedCustomer', id: 'customer-2' },
      ],
      unassignedCustomers: [],
    },
  };

export const mockStandardManagePartialSuccessResponse: ManageStandardFieldAssignmentMutation =
  {
    timeTrackingManageStandardFieldAssignment: {
      __typename: 'TimeTracking_PartialStandardFieldAssignmentPayload',
      successCode: 'PARTIAL_SUCCESS',
      standardFieldLabel: 'CLASS',
      assignResults: [
        { __typename: 'TimeTracking_AssignedCustomer', id: 'customer-1' },
        {
          __typename: 'TimeTracking_AssignmentItemError',
          errorCode: 'VALIDATION_ERROR',
          message: 'Customer not found',
          details: 'Customer does not exist',
          subCode: 'NOT_FOUND',
          element: 'customer-2',
        },
      ],
      unassignResults: [],
    },
  };

export const mockStandardManageErrorResponse: ManageStandardFieldAssignmentMutation =
  {
    timeTrackingManageStandardFieldAssignment: {
      __typename: 'TimeTracking_ManageStandardFieldAssignmentError',
      errorCode: 'VALIDATION_ERROR',
      message: 'Failed to manage standard field assignments',
      details: 'Invalid input provided',
      subCode: 'INVALID_INPUT',
    },
  };

export const mockCustomManageSuccessResponse: ManageCustomFieldAssignmentMutation =
  {
    timeTrackingManageCustomFieldAssignment: {
      __typename: 'TimeTracking_ManageCustomFieldAssignmentPayload',
      successCode: 'SUCCESS',
    },
  };

export const mockCustomManagePartialSuccessResponse: ManageCustomFieldAssignmentMutation =
  {
    timeTrackingManageCustomFieldAssignment: {
      __typename: 'TimeTracking_PartialCustomFieldAssignmentPayload',
      successCode: 'PARTIAL_SUCCESS',
      assignResults: [
        { __typename: 'TimeTracking_AssignedCustomer', id: 'customer-1' },
        {
          __typename: 'TimeTracking_AssignmentItemError',
          errorCode: 'VALIDATION_ERROR',
          message: 'Customer not found',
          details: 'Customer does not exist',
          subCode: 'NOT_FOUND',
          element: 'customer-2',
        },
      ],
      unassignResults: [],
    },
  };

export const mockCustomManageErrorResponse: ManageCustomFieldAssignmentMutation =
  {
    timeTrackingManageCustomFieldAssignment: {
      __typename: 'TimeTracking_ManageCustomFieldAssignmentError',
      errorCode: 'VALIDATION_ERROR',
      message: 'Failed to manage custom field assignments',
      details: 'Invalid input provided',
      subCode: 'INVALID_INPUT',
    },
  };

export function makeStandardFieldAssignmentsMock(
  variables: Record<string, unknown>,
  result?: unknown,
): Record<string, unknown> {
  if (
    result instanceof Error ||
    (result && typeof result === 'object' && 'error' in result)
  ) {
    return {
      request: { query: GET_STANDARD_FIELD_ASSIGNMENTS_QUERY, variables },
      error: result,
    };
  }
  return {
    request: { query: GET_STANDARD_FIELD_ASSIGNMENTS_QUERY, variables },
    result: {
      data: result ?? {
        timeTrackingStandardFieldAssignments:
          mockStandardFieldAssignmentsData.timeTrackingStandardFieldAssignments,
      },
    },
  };
}

export function makeCustomFieldAssignmentsMock(
  variables: Record<string, unknown>,
  result?: unknown,
): Record<string, unknown> {
  if (
    result instanceof Error ||
    (result && typeof result === 'object' && 'error' in result)
  ) {
    return {
      request: { query: GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY, variables },
      error: result,
    };
  }
  return {
    request: { query: GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY, variables },
    result: {
      data: result ?? {
        timeTrackingCustomFieldAssignments:
          mockCustomFieldAssignmentsData.timeTrackingCustomFieldAssignments,
      },
    },
  };
}
