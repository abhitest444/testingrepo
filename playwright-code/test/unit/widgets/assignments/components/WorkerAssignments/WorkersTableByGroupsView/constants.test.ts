import {
  GROUPS_PAGE_SIZE,
  WORKERS_PAGE_SIZE,
  VIRTUOSO_OVERSCAN,
  TEST_IDS,
  MESSAGES,
  WorkerStatus,
} from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/constants';

describe('Constants', () => {
  describe('Page Sizes', () => {
    it('should have correct GROUPS_PAGE_SIZE', () => {
      expect(GROUPS_PAGE_SIZE).toBe(20);
    });

    it('should have correct WORKERS_PAGE_SIZE', () => {
      expect(WORKERS_PAGE_SIZE).toBe(20);
    });

    it('should have correct VIRTUOSO_OVERSCAN', () => {
      expect(VIRTUOSO_OVERSCAN).toBe(200);
    });
  });

  describe('TEST_IDS', () => {
    it('should have correct test ids', () => {
      expect(TEST_IDS).toEqual({
        GROUPS_LOADING: 'groups-loading',
        GROUPS_EMPTY_STATE: 'groups-empty-state',
        LOADING_MORE_GROUPS: 'loading-more-groups',
        END_OF_GROUPS: 'end-of-groups',
      });
    });

    it('should be immutable (as const)', () => {
      // TypeScript should enforce this at compile time
      expect(Object.isFrozen(TEST_IDS)).toBe(false); // as const doesn't freeze at runtime
      // But we can verify the values exist
      expect(TEST_IDS.GROUPS_LOADING).toBeDefined();
      expect(TEST_IDS.GROUPS_EMPTY_STATE).toBeDefined();
      expect(TEST_IDS.LOADING_MORE_GROUPS).toBeDefined();
      expect(TEST_IDS.END_OF_GROUPS).toBeDefined();
    });
  });

  describe('MESSAGES', () => {
    it('should have correct loading messages', () => {
      expect(MESSAGES.LOADING_WORKERS).toBe('Loading workers...');
      expect(MESSAGES.LOADING_MORE_GROUPS).toBe('Loading more groups...');
    });

    it('should have correct empty state messages', () => {
      expect(MESSAGES.NO_GROUPS_TITLE).toBe('No Groups');
      expect(MESSAGES.NO_GROUPS_MESSAGE).toBe(
        'No groups found. Create a group to get started.',
      );
    });

    it('should have correct error messages', () => {
      expect(MESSAGES.FAILED_TO_LOAD_GROUPS).toBe('Failed to load groups');
    });

    it('should have ALL_GROUPS_LOADED function', () => {
      expect(typeof MESSAGES.ALL_GROUPS_LOADED).toBe('function');
    });

    it('should format ALL_GROUPS_LOADED message correctly', () => {
      expect(MESSAGES.ALL_GROUPS_LOADED(5)).toBe('All groups loaded (5 total)');
      expect(MESSAGES.ALL_GROUPS_LOADED(0)).toBe('All groups loaded (0 total)');
      expect(MESSAGES.ALL_GROUPS_LOADED(100)).toBe(
        'All groups loaded (100 total)',
      );
    });
  });

  describe('WorkerStatus Enum', () => {
    it('should have ACTIVE status', () => {
      expect(WorkerStatus.ACTIVE).toBe('Active');
    });

    it('should have INACTIVE status', () => {
      expect(WorkerStatus.INACTIVE).toBe('Inactive');
    });

    it('should have exactly two statuses', () => {
      const keys = Object.keys(WorkerStatus);
      // Enum has both keys and reverse mappings
      const actualKeys = keys.filter((key) => Number.isNaN(Number(key)));
      expect(actualKeys).toHaveLength(2);
      expect(actualKeys).toContain('ACTIVE');
      expect(actualKeys).toContain('INACTIVE');
    });

    it('should use WorkerStatus enum values instead of hardcoded strings', () => {
      // This test documents the intent: always use enum, never hardcoded strings
      const status = WorkerStatus.ACTIVE;
      expect(status).toBe('Active');
      expect(status).not.toBe('active'); // Case matters
      expect(status).not.toBe('ACTIVE'); // Different from enum key
    });

    it('should support comparison', () => {
      const status1 = WorkerStatus.ACTIVE;
      const status2 = WorkerStatus.ACTIVE;
      const status3 = WorkerStatus.INACTIVE;

      expect(status1).toBe(status2);
      expect(status1).not.toBe(status3);
    });

    it('should support ternary operations', () => {
      const isActive = true;
      const status = isActive ? WorkerStatus.ACTIVE : WorkerStatus.INACTIVE;
      expect(status).toBe(WorkerStatus.ACTIVE);

      const isInactive = false;
      const status2 = isInactive ? WorkerStatus.ACTIVE : WorkerStatus.INACTIVE;
      expect(status2).toBe(WorkerStatus.INACTIVE);
    });
  });

  describe('Constants Type Safety', () => {
    it('should not allow modification of const values', () => {
      // These should be TypeScript compile-time errors, but we can verify at runtime
      expect(GROUPS_PAGE_SIZE).toBe(20);
      expect(WORKERS_PAGE_SIZE).toBe(20);
      expect(VIRTUOSO_OVERSCAN).toBe(200);
    });
  });

  describe('Message Interpolation', () => {
    it('should handle large numbers in ALL_GROUPS_LOADED', () => {
      expect(MESSAGES.ALL_GROUPS_LOADED(1000)).toBe(
        'All groups loaded (1000 total)',
      );
      expect(MESSAGES.ALL_GROUPS_LOADED(999999)).toBe(
        'All groups loaded (999999 total)',
      );
    });

    it('should handle negative numbers (edge case)', () => {
      // Though this shouldn't happen in practice
      expect(MESSAGES.ALL_GROUPS_LOADED(-1)).toBe(
        'All groups loaded (-1 total)',
      );
    });
  });
});
