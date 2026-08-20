/**
 * Constants for Workers Table by Groups View
 */

export const GROUPS_PAGE_SIZE = 20;
export const WORKERS_PAGE_SIZE = 20;
export const VIRTUOSO_OVERSCAN = 200;

export const TEST_IDS = {
  GROUPS_LOADING: 'groups-loading',
  GROUPS_EMPTY_STATE: 'groups-empty-state',
  LOADING_MORE_GROUPS: 'loading-more-groups',
  END_OF_GROUPS: 'end-of-groups',
} as const;

export const MESSAGES = {
  LOADING_WORKERS: 'Loading workers...',
  LOADING_MORE_GROUPS: 'Loading more groups...',
  NO_GROUPS_TITLE: 'No Groups',
  NO_GROUPS_MESSAGE: 'No groups found. Create a group to get started.',
  FAILED_TO_LOAD_GROUPS: 'Failed to load groups',
  ALL_GROUPS_LOADED: (count: number) => `All groups loaded (${count} total)`,
} as const;

/**
 * Worker/Member status enum
 * Use instead of hardcoded 'Active'/'Inactive' strings
 */
export enum WorkerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}
