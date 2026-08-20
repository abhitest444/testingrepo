import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import { groupsSelectors } from './workersGroupViewSlice';

/**
 * Selectors for Workers Group View state
 */

export const selectWorkersGroupView = (state: RootState) =>
  state.workersGroupView;

const selectGroupsState = (state: RootState) => state.workersGroupView.groups;

export const selectAllGroups = createSelector(
  [selectGroupsState],
  (groupsState) => groupsSelectors.selectAll(groupsState),
);

export const selectGroupsLoading = (state: RootState) =>
  state.workersGroupView.groups.loading;

export const selectGroupsError = (state: RootState) =>
  state.workersGroupView.groups.error;

export const selectGroupById = (groupId: string) =>
  createSelector([selectGroupsState], (groupsState) =>
    groupsSelectors.selectById(groupsState, groupId),
  );

// Selector for header count (from useActiveGroupsTotalCount)
export const selectGroupsCount = createSelector(
  [selectGroupsState],
  (groupsState) =>
    groupsState.headerCount > 0
      ? groupsState.headerCount
      : groupsSelectors.selectTotal(groupsState),
);

// Selector for total count (from GraphQL response, for pagination)
export const selectGroupsTotalCount = createSelector(
  [selectGroupsState],
  (groupsState) =>
    groupsState.totalCount > 0
      ? groupsState.totalCount
      : groupsSelectors.selectTotal(groupsState),
);

export const selectHasNextPage = (state: RootState) =>
  state.workersGroupView.groups.hasNextPage;
export const selectGroupsCursor = (state: RootState) =>
  state.workersGroupView.groups.cursor;

export const selectHasMoreGroups = (state: RootState) =>
  state.workersGroupView.groups.hasMore;

export const selectIsLoadingMoreGroups = (state: RootState) =>
  state.workersGroupView.groups.isLoadingMore;

export const selectWorkersByGroup = createSelector(
  [(state: RootState) => state.workersGroupView.workersByGroup],
  (workersByGroup) => workersByGroup,
);

export const selectExpandedGroupIds = createSelector(
  [(state: RootState) => state.workersGroupView.expandedGroupIds],
  (expandedGroupIds) => expandedGroupIds,
);

export const selectWorkersForGroup = (groupId: string) => (state: RootState) =>
  state.workersGroupView.workersByGroup[groupId] || null;
