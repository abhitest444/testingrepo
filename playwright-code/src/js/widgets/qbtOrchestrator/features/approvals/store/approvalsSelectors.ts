import { RootState } from '../../../store';
import type { WeekTimeGroup } from '../types/Approvals.types';

// ==========================================
// Submit Time Panel Selectors
// ==========================================

export const selectSubmitTimePanelOpen = (state: RootState): boolean =>
  state.approvals?.submitTimePanel?.isOpen ?? false;

export const selectSubmitThroughDate = (state: RootState): string | null =>
  state.approvals?.submitTimePanel?.submitThroughDate ?? null;

export const selectPeriodStartDate = (state: RootState): string | null =>
  state.approvals?.submitTimePanel?.periodStartDate ?? null;

export const selectWeekGroups = (state: RootState): WeekTimeGroup[] =>
  state.approvals?.submitTimePanel?.weekGroups ?? [];

export const selectExpandedWeekIds = (state: RootState): string[] =>
  state.approvals?.submitTimePanel?.expandedWeekIds ?? [];

export const selectIsLoading = (state: RootState): boolean =>
  state.approvals?.submitTimePanel?.isLoading ?? false;

export const selectIsSubmitting = (state: RootState): boolean =>
  state.approvals?.submitTimePanel?.isSubmitting ?? false;

export const selectError = (state: RootState): string | null =>
  state.approvals?.submitTimePanel?.error ?? null;

// ==========================================
// Derived Selectors
// ==========================================

/**
 * Total unapproved (pending) minutes across all weeks up to the submit-through date
 */
export const selectTotalUnapprovedMinutes = (state: RootState): number =>
  selectWeekGroups(state).reduce(
    (total, week) =>
      total +
      week.days
        .filter((day) => day.status === 'pending')
        .reduce((weekTotal, day) => weekTotal + day.minutes, 0),
    0,
  );

/**
 * Whether the Submit action should be enabled (there is unapproved time to submit)
 */
export const selectHasUnapprovedTime = (state: RootState): boolean =>
  selectTotalUnapprovedMinutes(state) > 0;
