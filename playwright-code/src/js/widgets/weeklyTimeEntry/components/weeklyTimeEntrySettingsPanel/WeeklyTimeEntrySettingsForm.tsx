import React, { useCallback, memo } from 'react';
import styled from 'styled-components';
import { TrackingPoints } from 'src/js/common/useClickTracking';
import { UxPreferenceHideWeekdaysData } from 'src/js/service/utils/useUXPreferences';
import { WeeklyTimeEntryWeekdaySettings } from './WeeklyTimeEntryWeekdaySettings';

const StyledSettingsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export interface WeeklyTimeEntrySettingsFormProps {
  hideWeekdays: UxPreferenceHideWeekdaysData;
  showDaysOfWeekPreferences?: boolean;
  trackingPoints: TrackingPoints;
  settingsState: {
    weekdays: {
      isSundayEnabled: boolean;
      isMondayEnabled: boolean;
      isTuesdayEnabled: boolean;
      isWednesdayEnabled: boolean;
      isThursdayEnabled: boolean;
      isFridayEnabled: boolean;
      isSaturdayEnabled: boolean;
    };
  };
  updateWeekday: (weekdayName: string, value: boolean) => void;
  uxPreferencesError?: string | null;
}

export const WeeklyTimeEntrySettingsForm: React.FC<WeeklyTimeEntrySettingsFormProps> =
  memo(
    ({
      hideWeekdays,
      showDaysOfWeekPreferences = true,
      trackingPoints,
      settingsState,
      updateWeekday,
      uxPreferencesError,
    }) => (
      <StyledSettingsForm>
        {/* Setting to decide the days of the week to be shown for all users */}
        {showDaysOfWeekPreferences && !uxPreferencesError && (
          <WeeklyTimeEntryWeekdaySettings
            hideWeekdays={hideWeekdays}
            trackingPoints={trackingPoints}
            settingsState={settingsState}
            updateWeekday={updateWeekday}
          />
        )}
      </StyledSettingsForm>
    ),
  );
