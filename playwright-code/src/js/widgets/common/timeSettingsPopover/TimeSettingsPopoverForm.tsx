import React from 'react';
import styled from 'styled-components';

import { useIntl } from '@payroll/quicksand';

import { FormCheckbox } from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { TrackingPoints } from 'src/js/common/useClickTracking';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';

const SettingsCheckboxesContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
`;

const SubtitleContainer = styled.div`
  padding-bottom: 16px;
`;

export interface TimeSettingsPopoverFormProps {
  settings: TimeTrackingCompanySettings;
  showDaysOfWeekPreferences: boolean;
  hasPayroll: boolean;
  isPayTypeEnabled: boolean;
  hasProjects: boolean;
  hasAdminAccess: boolean;
  canEditSettings: boolean;
  trackingPoints: TrackingPoints;
  isSettingsAccessible: boolean;
  isTimeEntry?: boolean;
}

export const TimeSettingsPopoverForm = ({
  settings,
  showDaysOfWeekPreferences,
  isSettingsAccessible,
  hasPayroll,
  isPayTypeEnabled,
  hasProjects,
  hasAdminAccess,
  canEditSettings,
  trackingPoints,
  isTimeEntry = false,
}: TimeSettingsPopoverFormProps) => {
  const intl = useIntl();
  const { isClassEnabled, isLocationEnabled, isTaxableFieldEnabled } = settings;

  const checkboxes = [
    {
      name: 'isClassFieldEnabled',
      labelKey: 'drawer.form.class.label',
      condition: isClassEnabled,
      trackingPoint: trackingPoints.CLASS_SETTING,
    },
    // {
    //   name: 'isProjectFieldEnabled',
    //   labelKey: 'drawer.form.project.label',
    //   trackingPoint: trackingPoints.PROJECT_SETTING,
    // },
    {
      name: 'isBillingFieldEnabled',
      labelKey: 'billable.label.no.hour',
      condition: canEditSettings,
      trackingPoint: trackingPoints.BILLABLE_SETTING,
    },
    {
      name: 'isServiceFieldEnabled',
      labelKey: 'drawer.form.service.label',
      condition: canEditSettings,
      trackingPoint: trackingPoints.SERVICE_SETTING,
    },
    {
      name: 'isLocationFieldEnabled',
      labelKey: 'drawer.form.location.label',
      condition: isLocationEnabled,
      trackingPoint: trackingPoints.LOCATION_SETTING,
    },
    {
      name: 'isPayTypeFieldEnabled',
      labelKey: 'pay.type',
      condition:
        hasPayroll && isPayTypeEnabled && hasAdminAccess && !isTimeEntry,
      trackingPoint: trackingPoints.PAY_TYPE_SETTING,
    },
    {
      name: 'isCostRateFieldEnabled',
      labelKey: 'cost.rate.no.hour',
      condition: hasProjects && !isTimeEntry, // not available for time entries
      trackingPoint: trackingPoints.COST_RATE_SETTING,
    },
    {
      name: 'isTaxableFieldEnabled',
      labelKey: 'taxable',
      condition: isTaxableFieldEnabled && !isTimeEntry, // not available for time entries
      trackingPoint: trackingPoints.TAXABLE_SETTING,
    },
  ];

  const daysOfWeekCheckboxes = [
    {
      name: 'isSundayEnabled',
      labelKey: 'sunday',
      trackingPoint: trackingPoints.SUNDAY_SETTING,
    },
    {
      name: 'isMondayEnabled',
      labelKey: 'monday',
      trackingPoint: trackingPoints.MONDAY_SETTING,
    },
    {
      name: 'isTuesdayEnabled',
      labelKey: 'tuesday',
      trackingPoint: trackingPoints.TUESDAY_SETTING,
    },
    {
      name: 'isWednesdayEnabled',
      labelKey: 'wednesday',
      trackingPoint: trackingPoints.WEDNESDAY_SETTING,
    },
    {
      name: 'isThursdayEnabled',
      labelKey: 'thursday',
      trackingPoint: trackingPoints.THURSDAY_SETTING,
    },
    {
      name: 'isFridayEnabled',
      labelKey: 'friday',
      trackingPoint: trackingPoints.FRIDAY_SETTING,
    },
    {
      name: 'isSaturdayEnabled',
      labelKey: 'saturday',
      trackingPoint: trackingPoints.SATURDAY_SETTING,
    },
  ];

  const fieldsFormCheckboxes = checkboxes
    .filter(
      (checkbox) => checkbox.condition === undefined || checkbox.condition,
    )
    .map((checkbox) => (
      <FormCheckbox
        key={checkbox.name}
        name={checkbox.name}
        labelKey={checkbox.labelKey}
        trackingPoint={checkbox.trackingPoint}
      />
    ));

  const weekdaysFormCheckboxes = daysOfWeekCheckboxes.map((checkbox) => (
    <FormCheckbox
      key={checkbox.name}
      name={checkbox.name}
      labelKey={checkbox.labelKey}
      trackingPoint={checkbox.trackingPoint}
    />
  ));

  return (
    <>
      {isSettingsAccessible && (
        <>
          <SubtitleContainer>
            {intl.formatMessage({
              id: 'singletime.settings.popover.sub.title',
            })}
          </SubtitleContainer>
          <SettingsCheckboxesContainer>
            {fieldsFormCheckboxes}
          </SettingsCheckboxesContainer>
        </>
      )}

      {/* Days of the week to be shown for all users */}
      {showDaysOfWeekPreferences && (
        <>
          <SubtitleContainer>
            {intl.formatMessage({ id: 'settings.daysofweek' })}
          </SubtitleContainer>
          <SettingsCheckboxesContainer>
            {weekdaysFormCheckboxes}
          </SettingsCheckboxesContainer>
        </>
      )}
    </>
  );
};
