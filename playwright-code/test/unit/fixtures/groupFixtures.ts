import { GET_GROUPS_QUERY } from 'src/js/service/queries/timeTrackingGroupQueries';

export const mockGroupData: any = {
  id: 'group-1',
  name: 'Engineering',
  isActive: true,
  meta: {
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    version: 1,
  },
  stats: { memberCount: 10, managerCount: 2 },
};

export const mockGroupsListData: any = {
  timeTrackingGroups: {
    totalTimeAgainstCount: 2,
    totalCount: 2,
    edges: [
      {
        node: {
          id: 'group-1',
          name: 'Engineering',
          isActive: true,
          meta: {
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            createdBy: 'user-1',
            updatedBy: 'user-1',
            version: 1,
          },
          stats: { memberCount: 10, managerCount: 2 },
        },
        cursor: 'cursor-1',
      },
      {
        node: {
          id: 'group-2',
          name: 'Design',
          isActive: true,
          meta: {
            createdAt: '2024-01-02',
            updatedAt: '2024-01-02',
            createdBy: 'user-1',
            updatedBy: 'user-1',
            version: 1,
          },
          stats: { memberCount: 5, managerCount: 1 },
        },
        cursor: 'cursor-2',
      },
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'cursor-1',
      endCursor: 'cursor-2',
    },
  },
};

export const mockEmptyGroupsData: any = {
  timeTrackingGroups: {
    totalTimeAgainstCount: 0,
    totalCount: 0,
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  },
};

export function makeGroupQueryMock(
  variables: Record<string, any>,
  result?: any,
): any {
  if (result instanceof Error || (result && 'error' in result)) {
    return {
      request: { query: GET_GROUPS_QUERY, variables },
      error: result,
    };
  }
  return {
    request: { query: GET_GROUPS_QUERY, variables },
    result: { data: result ?? mockGroupsListData },
  };
}
