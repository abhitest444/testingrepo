import React from 'react';
import styled from 'styled-components';
import Dropdown, { MenuItem } from '@ids-ts/dropdown';
import { Controller, useFormContext } from 'react-hook-form';
import { useIntl, useTracking } from '@payroll/quicksand';

import { DAYS_OF_WEEK } from 'src/js/widgets/timeTrackingSettings/hooks/useTimeTrackingSettingsForm';
import { TIME_ACTIVITY_SETTINGS_TRACKING_POINTS } from 'src/js/common/useClickTracking';

export const FlexColumnContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 32px;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-flow: column;
  gap: 16px;
`;

export const EditFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

export const FieldUpdateLabel = styled.label`
  min-width: 380px;
  font-weight: var(--font-weight-input-label);
  color: var(--color-text-primary);
`;

export const FieldUpdateValue = styled.span`
  min-width: 250px;
  font-weight: var(--font-weight-component-bold);
  color: var(--color-text-primary);
`;

export const EditGeneralTimeTrackingSettings = () => {
  const daysOfWeek = Object.keys(DAYS_OF_WEEK);

  const { setValue } = useFormContext();
  const intl = useIntl();

  const track = useTracking();

  return (
    <FlexColumnContainer>
      <SectionContainer>
        <EditFormRow>
          <FieldUpdateLabel>
            {intl.formatMessage({
              id: 'location-settings.fields.general-settings',
            })}
          </FieldUpdateLabel>
          <FieldUpdateValue>
            <Controller
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  multiselect={false}
                  colorScheme="light"
                  placeholder="Select days"
                  onChange={(e: any) => {
                    e.stopPropagation();
                    track(
                      TIME_ACTIVITY_SETTINGS_TRACKING_POINTS.GENERAL_SECTION_FIRST_DAY_OF_WEEK,
                    );
                    setValue('firstDayOfWeek', e.target.value, {
                      shouldDirty: true,
                    });
                    onChange(e.target.value);
                  }}
                  aria-label="DaysOfWeekDropDown"
                  value={value}
                >
                  {Object.entries(daysOfWeek).map(([index, day]) => (
                    <MenuItem key={index} value={index}>
                      {intl.formatMessage({ id: day })}
                    </MenuItem>
                  ))}
                </Dropdown>
              )}
              name="firstDayOfWeek"
            />
          </FieldUpdateValue>
        </EditFormRow>
      </SectionContainer>
    </FlexColumnContainer>
  );
};
