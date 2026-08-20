import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import type { ItmTask } from '../types/Overview.types';

const EMPTY_ARRAY: ItmTask[] = [];
const EMPTY_IDS: string[] = [];
const EMPTY_ENTITIES: Record<string, ItmTask> = {};

const selectTasksState = (state: RootState) => state.overview?.tasks;

export const selectItmTasks = createSelector(
  [selectTasksState],
  (tasks): ItmTask[] => {
    if (!tasks?.ids || !tasks?.entities) {
      return EMPTY_ARRAY;
    }
    return (tasks.ids as Array<string | number>)
      .map((id: string | number) => tasks.entities[id])
      .filter((task): task is ItmTask => task !== undefined);
  },
);

export const selectItmTasksEntities = (
  state: RootState,
): Record<string, ItmTask | undefined> =>
  state.overview?.tasks?.entities ?? EMPTY_ENTITIES;

export const selectItmTaskIds = (state: RootState): string[] =>
  (state.overview?.tasks?.ids as string[]) ?? EMPTY_IDS;

export const selectTaskById = (
  state: RootState,
  taskId: string,
): ItmTask | undefined => state.overview?.tasks?.entities?.[taskId];

export const selectIsLoadingTasks = (state: RootState): boolean =>
  state.overview?.isLoadingTasks ?? false;

export const selectTasksError = (state: RootState): string | null =>
  state.overview?.error ?? null;

export const selectHasTasks = (state: RootState): boolean => {
  const ids = state.overview?.tasks?.ids;
  return Array.isArray(ids) && ids.length > 0;
};

export const selectTasksCount = (state: RootState): number =>
  state.overview?.tasks?.ids?.length ?? 0;

export const selectIsUpdatingTask = (state: RootState): boolean =>
  state.overview?.isUpdatingTask ?? false;

export const selectUpdateTaskError = (state: RootState): string | null =>
  state.overview?.updateTaskError ?? null;

export const selectRefetchTasks = (state: RootState): boolean =>
  state.overview?.refetchTasks ?? false;
