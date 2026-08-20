import React, { memo } from 'react';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';
import { TrackingPoints } from 'src/js/common/useClickTracking';
import { UxPreferenceHideWeekdaysData } from 'src/js/service/utils/useUXPreferences';
import { useAppSelector } from '../../store';
import { selectWeekdaysWithData } from '../../store/selectors';
import { WeeklyTimeEntryCheckbox } from './WeeklyTimeEntryCheckbox';

const StyledB3 = styled(B3)`
  color: var(--color-text-secondary);
`;

const SettingsFieldSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingsCheckboxesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
`;

export interface WeeklyTimeEntryWeekdaySettingsProps {
  hideWeekdays: UxPreferenceHideWeekdaysData;
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
}

export const WeeklyTimeEntryWeekdaySettings: React.FC<WeeklyTimeEntryWeekdaySettingsProps> =
  memo(({ hideWeekdays, trackingPoints, settingsState, updateWeekday }) => {
    const intl = useIntl();
    const weekdaysWithData = useAppSelector(selectWeekdaysWithData);

    const handleWeekdayChange = (weekdayName: string, value: boolean) => {
      // tracking will be done in checkbox component itself
      updateWeekday(weekdayName, value);
    };

    const daysOfWeekCheckboxes = [
      {
        name: 'isSundayEnabled',
        labelKey: 'sunday',
        trackingPoint: trackingPoints.SUNDAY_SETTING,
        value:
          settingsState.weekdays.isSundayEnabled ||
          weekdaysWithData.hasSundayData,
        disabled: weekdaysWithData.hasSundayData,
      },
      {
        name: 'isMondayEnabled',
        labelKey: 'monday',
        trackingPoint: trackingPoints.MONDAY_SETTING,
        value:
          settingsState.weekdays.isMondayEnabled ||
          weekdaysWithData.hasMondayData,
        disabled: weekdaysWithData.hasMondayData,
      },
      {
        name: 'isTuesdayEnabled',
        labelKey: 'tuesday',
        trackingPoint: trackingPoints.TUESDAY_SETTING,
        value:
          settingsState.weekdays.isTuesdayEnabled ||
          weekdaysWithData.hasTuesdayData,
        disabled: weekdaysWithData.hasTuesdayData,
      },
      {
        name: 'isWednesdayEnabled',
        labelKey: 'wednesday',
        trackingPoint: trackingPoints.WEDNESDAY_SETTING,
        value:
          settingsState.weekdays.isWednesdayEnabled ||
          weekdaysWithData.hasWednesdayData,
        disabled: weekdaysWithData.hasWednesdayData,
      },
      {
        name: 'isThursdayEnabled',
        labelKey: 'thursday',
        trackingPoint: trackingPoints.THURSDAY_SETTING,
        value:
          settingsState.weekdays.isThursdayEnabled ||
          weekdaysWithData.hasThursdayData,
        disabled: weekdaysWithData.hasThursdayData,
      },
      {
        name: 'isFridayEnabled',
        labelKey: 'friday',
        trackingPoint: trackingPoints.FRIDAY_SETTING,
        value:
          settingsState.weekdays.isFridayEnabled ||
          weekdaysWithData.hasFridayData,
        disabled: weekdaysWithData.hasFridayData,
      },
      {
        name: 'isSaturdayEnabled',
        labelKey: 'saturday',
        trackingPoint: trackingPoints.SATURDAY_SETTING,
        value: settingsState.weekdays.isSaturdayEnabled,
        disabled: weekdaysWithData.hasSaturdayData,
      },
    ];

    const weekdaysFormCheckboxes = daysOfWeekCheckboxes.map((checkbox) => (
      <WeeklyTimeEntryCheckbox
        key={checkbox.name}
        name={checkbox.name}
        labelKey={checkbox.labelKey}
        trackingPoint={checkbox.trackingPoint}
        checked={checkbox.value}
        disabled={checkbox.disabled}
        onChange={(value: boolean) => handleWeekdayChange(checkbox.name, value)}
      />
    ));

    return (
      <SettingsFieldSection>
        <StyledB3 weight="medium">
          {intl.formatMessage({ id: 'days.of.the.week' })}
        </StyledB3>
        <SettingsCheckboxesContainer>
          {weekdaysFormCheckboxes}
        </SettingsCheckboxesContainer>
      </SettingsFieldSection>
    );
  });
