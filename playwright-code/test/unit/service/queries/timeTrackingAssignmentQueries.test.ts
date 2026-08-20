/* eslint-disable no-unused-expressions */

import {
  GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY,
  GET_STANDARD_FIELD_ASSIGNMENTS_QUERY,
  MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION,
  MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION,
  MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION,
  TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
  TIME_AGAINST_ASSIGNMENTS_QUERY,
  TIME_FOR_ASSIGNMENTS_QUERY,
  MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION,
  MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION,
} from 'src/js/service/queries/timeTrackingAssignmentQueries';

describe('TimeTrackingAssignmentQueries', () => {
  describe('GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY', () => {
    it('should be defined', () => {
      expect(GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString = GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getCustomFieldAssignments');
    });

    it('should include required parameters', () => {
      const queryString = GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
      expect(queryString).toContain(
        '$input: TimeTracking_CustomFieldAssignmentsQueryInput!',
      );
      expect(queryString).toContain(
        '$filter: TimeTracking_CustomFieldAssignmentsFilter',
      );
    });

    it('should include timeTrackingCustomFieldAssignments query', () => {
      const queryString = GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('timeTrackingCustomFieldAssignments');
    });

    it('should query for customFieldDefinition and assigned status', () => {
      const queryString = GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('customFieldDefinition');
      expect(queryString).toContain('assigned');
    });

    it('should include pageInfo fields', () => {
      const queryString = GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('hasNextPage');
      expect(queryString).toContain('hasPreviousPage');
      expect(queryString).toContain('startCursor');
      expect(queryString).toContain('endCursor');
    });
  });

  describe('GET_STANDARD_FIELD_ASSIGNMENTS_QUERY', () => {
    it('should be defined', () => {
      expect(GET_STANDARD_FIELD_ASSIGNMENTS_QUERY).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString = GET_STANDARD_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getStandardFieldAssignments');
    });

    it('should include required parameters', () => {
      const queryString = GET_STANDARD_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
      expect(queryString).toContain(
        '$input: TimeTracking_StandardFieldAssignmentsQueryInput!',
      );
      expect(queryString).toContain(
        '$filter: TimeTracking_StandardFieldAssignmentsFilter',
      );
    });

    it('should query for standardFieldLabel and assigned status', () => {
      const queryString = GET_STANDARD_FIELD_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('standardFieldLabel');
      expect(queryString).toContain('assigned');
    });
  });

  describe('MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION', () => {
    it('should be defined', () => {
      expect(MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'mutation manageTimeAgainstFieldAssignment',
      );
    });

    it('should include required input parameter', () => {
      const queryString =
        MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        '$input: TimeTracking_ManageTimeAgainstFieldAssignmentInput!',
      );
    });

    it('should include payload types', () => {
      const queryString =
        MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'TimeTracking_ManageTimeAgainstFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_PartialTimeAgainstFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_ManageTimeAgainstFieldAssignmentError',
      );
    });

    it('should query for successCode and timeAgainst', () => {
      const queryString =
        MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('successCode');
      expect(queryString).toContain('timeAgainst');
    });

    it('should include custom and standard field results', () => {
      const queryString =
        MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('customFieldResult');
      expect(queryString).toContain('standardFieldResult');
    });
  });

  describe('MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION', () => {
    it('should be defined', () => {
      expect(MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('mutation manageStandardFieldAssignment');
    });

    it('should include required input parameter', () => {
      const queryString =
        MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        '$input: TimeTracking_ManageStandardFieldAssignmentInput!',
      );
    });

    it('should include payload and error types', () => {
      const queryString =
        MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'TimeTracking_ManageStandardFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_PartialStandardFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_ManageStandardFieldAssignmentError',
      );
    });

    it('should query for assigned and unassigned customers', () => {
      const queryString =
        MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('assignedCustomers');
      expect(queryString).toContain('unassignedCustomers');
    });

    it('should include assignment results for partial success', () => {
      const queryString =
        MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('assignResults');
      expect(queryString).toContain('unassignResults');
    });
  });

  describe('MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION', () => {
    it('should be defined', () => {
      expect(MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('mutation manageCustomFieldAssignment');
    });

    it('should include required input parameter', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        '$input: TimeTracking_ManageCustomFieldAssignmentInput!',
      );
    });

    it('should include all response types', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'TimeTracking_ManageCustomFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_PartialCustomFieldAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_ManageCustomFieldAssignmentError',
      );
    });

    it('should include assignment results', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('assignResults');
      expect(queryString).toContain('unassignResults');
    });
  });

  describe('TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY', () => {
    it('should be defined', () => {
      expect(TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.loc?.source.body;
      expect(queryString).toContain('query getTimeAgainstAssignmentSummary');
    });

    it('should include pagination parameters', () => {
      const queryString =
        TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
    });

    it('should query for timeAgainst details', () => {
      const queryString =
        TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.loc?.source.body;
      expect(queryString).toContain('timeAgainst');
      expect(queryString).toContain('displayName');
      expect(queryString).toContain('fullName');
      expect(queryString).toContain('customerType');
      expect(queryString).toContain('active');
    });

    it('should query for assignment counts', () => {
      const queryString =
        TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.loc?.source.body;
      expect(queryString).toContain('assignedTimeForCount');
      expect(queryString).toContain('assignedCustomFieldCount');
      expect(queryString).toContain('assignedStandardFieldCount');
    });

    it('should query for total assignment counts', () => {
      const queryString =
        TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.loc?.source.body;
      expect(queryString).toContain('totalTimeForAssignments');
      expect(queryString).toContain('totalCustomFieldAssignments');
      expect(queryString).toContain('totalStandardFieldAssignments');
      expect(queryString).toContain('totalTimeAgainstCount');
    });
  });

  describe('TIME_AGAINST_ASSIGNMENTS_QUERY', () => {
    it('should be defined', () => {
      expect(TIME_AGAINST_ASSIGNMENTS_QUERY).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString = TIME_AGAINST_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getTimeAgainstAssignments');
    });

    it('should include required parameters', () => {
      const queryString = TIME_AGAINST_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
      expect(queryString).toContain(
        '$input: TimeTracking_TimeAgainstAssignmentsQueryInput!',
      );
      expect(queryString).toContain(
        '$filter: TimeTracking_TimeAgainstAssignmentsFilter',
      );
    });

    it('should query for timeAgainstContactDAS', () => {
      const queryString = TIME_AGAINST_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('timeAgainstContactDAS');
      expect(queryString).toContain('project');
      expect(queryString).toContain('customer');
    });
  });

  describe('TIME_FOR_ASSIGNMENTS_QUERY', () => {
    it('should be defined', () => {
      expect(TIME_FOR_ASSIGNMENTS_QUERY).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString = TIME_FOR_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getTimeForAssignments');
    });

    it('should include required parameters', () => {
      const queryString = TIME_FOR_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
      expect(queryString).toContain(
        '$input: TimeTracking_TimeForAssignmentsQueryInput!',
      );
      expect(queryString).toContain(
        '$filter: TimeTracking_TimeForAssignmentsFilter',
      );
    });

    it('should query for timeForContactDAS and worker details', () => {
      const queryString = TIME_FOR_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('timeForContactDAS');
      expect(queryString).toContain('displayName');
      expect(queryString).toContain('fullName');
      expect(queryString).toContain('contractor');
      expect(queryString).toContain('groupId');
      expect(queryString).toContain('groupName');
      expect(queryString).toContain('timeForType');
    });

    it('should query for totalTimeForCount', () => {
      const queryString = TIME_FOR_ASSIGNMENTS_QUERY.loc?.source.body;
      expect(queryString).toContain('totalTimeForCount');
    });
  });

  describe('MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION', () => {
    it('should be defined', () => {
      expect(MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'mutation manageCustomFieldOptionAssignment',
      );
    });

    it('should include required input parameter', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        '$input: TimeTracking_ManageCustomFieldOptionAssignmentInput!',
      );
    });

    it('should include all response types', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'TimeTracking_ManageCustomFieldOptionAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_PartialCustomFieldOptionAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_ManageCustomFieldOptionAssignmentError',
      );
    });

    it('should include time for and group assignment results', () => {
      const queryString =
        MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('timeForAssignResults');
      expect(queryString).toContain('timeForUnassignResults');
      expect(queryString).toContain('groupAssignResults');
      expect(queryString).toContain('groupUnassignResults');
    });
  });

  describe('MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION', () => {
    it('should be defined', () => {
      expect(MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should contain correct operation name', () => {
      const queryString =
        MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'mutation manageTimeAgainstTimeForAssignment',
      );
    });

    it('should include required input parameter', () => {
      const queryString =
        MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        '$input: TimeTracking_ManageTimeAgainstTimeForAssignmentInput!',
      );
    });

    it('should include all response types', () => {
      const queryString =
        MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain(
        'TimeTracking_ManageTimeAgainstTimeForAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_PartialTimeAgainstTimeForAssignmentPayload',
      );
      expect(queryString).toContain(
        'TimeTracking_ManageTimeAgainstTimeForAssignmentError',
      );
    });

    it('should query for assigned and unassigned time for and groups', () => {
      const queryString =
        MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('assignedTimeFor');
      expect(queryString).toContain('unassignedTimeFor');
      expect(queryString).toContain('assignedGroups');
      expect(queryString).toContain('unassignedGroups');
    });

    it('should include assignToAll flag', () => {
      const queryString =
        MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.loc?.source.body;
      expect(queryString).toContain('assignToAll');
    });
  });

  describe('All Queries and Mutations', () => {
    it('should export all queries and mutations', () => {
      expect(GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY).toBeDefined();
      expect(GET_STANDARD_FIELD_ASSIGNMENTS_QUERY).toBeDefined();
      expect(MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
      expect(MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
      expect(MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION).toBeDefined();
      expect(TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY).toBeDefined();
      expect(TIME_AGAINST_ASSIGNMENTS_QUERY).toBeDefined();
      expect(TIME_FOR_ASSIGNMENTS_QUERY).toBeDefined();
      expect(MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION).toBeDefined();
      expect(MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION).toBeDefined();
    });

    it('should have valid GraphQL document nodes', () => {
      expect(GET_CUSTOM_FIELD_ASSIGNMENTS_QUERY.kind).toBe('Document');
      expect(GET_STANDARD_FIELD_ASSIGNMENTS_QUERY.kind).toBe('Document');
      expect(MANAGE_TIME_AGAINST_FIELD_ASSIGNMENT_MUTATION.kind).toBe(
        'Document',
      );
      expect(MANAGE_STANDARD_FIELD_ASSIGNMENT_MUTATION.kind).toBe('Document');
      expect(MANAGE_CUSTOM_FIELD_ASSIGNMENT_MUTATION.kind).toBe('Document');
      expect(TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY.kind).toBe('Document');
      expect(TIME_AGAINST_ASSIGNMENTS_QUERY.kind).toBe('Document');
      expect(TIME_FOR_ASSIGNMENTS_QUERY.kind).toBe('Document');
      expect(MANAGE_CUSTOM_FIELD_OPTION_ASSIGNMENT_MUTATION.kind).toBe(
        'Document',
      );
      expect(MANAGE_TIME_AGAINST_TIME_FOR_ASSIGNMENT_MUTATION.kind).toBe(
        'Document',
      );
    });
  });
});
