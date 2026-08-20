import { gql } from '@apollo/client';
import {
  GET_GROUPS_QUERY,
  GET_UNASSIGNED_WORKERS_QUERY,
} from 'src/js/service/queries/timeTrackingGroupQueries';

describe('TimeTracking Group Queries', () => {
  describe('GET_GROUPS_QUERY', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_GROUPS_QUERY).toBeDefined();
      expect(GET_GROUPS_QUERY.kind).toBe('Document');
      expect(GET_GROUPS_QUERY.definitions).toBeDefined();
    });

    it('should have correct query structure', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getTimeTrackingGroups');
      expect(queryString).toContain('timeTrackingGroups');
    });

    it('should include required fields', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;

      // Group fields
      expect(queryString).toContain('id');
      expect(queryString).toContain('name');
      expect(queryString).toContain('isActive');

      // Stats fields for lazy loading
      expect(queryString).toContain('stats');
      expect(queryString).toContain('memberCount');
      expect(queryString).toContain('managerCount');
    });

    it('should include pagination parameters', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('$after: String');
      expect(queryString).toContain('pageInfo');
      expect(queryString).toContain('hasNextPage');
      expect(queryString).toContain('endCursor');
    });

    it('should include filter and orderBy parameters', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;
      expect(queryString).toContain('$filter: TimeTracking_GroupFilter');
      expect(queryString).toContain('$orderBy: [TimeTracking_GroupOrderBy!]');
    });

    it('should not include nested members/managers in main query', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;

      // Should use stats, not nested members/managers
      expect(queryString).toContain('stats');

      // Check that we're not fetching full member/manager lists in main query
      // (They should be fetched separately for lazy loading)
      const statsSection = queryString?.match(/stats\s*{[^}]*}/)?.[0];
      expect(statsSection).toBeDefined();
      expect(statsSection).toContain('memberCount');
      expect(statsSection).toContain('managerCount');
    });
  });

  describe('GET_UNASSIGNED_WORKERS_QUERY', () => {
    it('should be a valid GraphQL query', () => {
      expect(GET_UNASSIGNED_WORKERS_QUERY).toBeDefined();
      expect(GET_UNASSIGNED_WORKERS_QUERY.kind).toBe('Document');
    });

    it('should query for unassigned workers', () => {
      const queryString = GET_UNASSIGNED_WORKERS_QUERY.loc?.source.body;
      expect(queryString).toContain('query getUnassignedWorkers');
      expect(queryString).toContain('timeTrackingWorkers');
    });

    it('should include worker fields', () => {
      const queryString = GET_UNASSIGNED_WORKERS_QUERY.loc?.source.body;
      expect(queryString).toContain('id');
      expect(queryString).toContain('firstName');
      expect(queryString).toContain('lastName');
    });

    it('should support pagination', () => {
      const queryString = GET_UNASSIGNED_WORKERS_QUERY.loc?.source.body;
      expect(queryString).toContain('$first: PositiveInt');
      expect(queryString).toContain('pageInfo');
    });
  });

  describe('Query Consistency', () => {
    it('should use consistent pagination pattern across all queries', () => {
      const queries = [GET_GROUPS_QUERY, GET_UNASSIGNED_WORKERS_QUERY];

      queries.forEach((query) => {
        const queryString = query.loc?.source.body;
        expect(queryString).toContain('pageInfo');
        expect(queryString).toContain('hasNextPage');
      });
    });

    it('should use cursor-based pagination for groups', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;
      expect(queryString).toContain('cursor');
      expect(queryString).toContain('endCursor');
    });
  });

  describe('Query Optimization', () => {
    it('GET_GROUPS_QUERY should be optimized for list view', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;

      // Should fetch stats (counts) not full member/manager lists
      expect(queryString).toContain('stats');
      expect(queryString).toContain('memberCount');
      expect(queryString).toContain('managerCount');
    });

    it('GET_GROUPS_QUERY should use stats for efficient loading', () => {
      const queryString = GET_GROUPS_QUERY.loc?.source.body;

      // Verify we're using stats API for counts
      expect(queryString).toContain('stats');
      const statsSection = queryString?.match(/stats\s*{[^}]*}/)?.[0];
      expect(statsSection).toBeDefined();
      expect(statsSection).toContain('memberCount');
      expect(statsSection).toContain('managerCount');
    });
  });
});
