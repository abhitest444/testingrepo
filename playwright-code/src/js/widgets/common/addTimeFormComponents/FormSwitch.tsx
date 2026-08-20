import { Controller, useFormContext, useWatch } from 'react-hook-form';
import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Switch from '@ids-ts/switch';
import styled from 'styled-components';
import { B2 } from '@ids-ts/typography';
import { TrackingPoints } from 'src/js/common/useClickTracking';

export interface FormSwitchProps {
  name: string;
  isdisabled?: boolean;
  trackingPoints: TrackingPoints;
}

const StyledB2 = styled(B2)`
  color: var(--color-text-primary, #393a3d);
`;

const StyledSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const FormSwitch = ({
  name,
  isdisabled = false,
  trackingPoints,
}: FormSwitchProps) => {
  const intl = useIntl();
  const track = useTracking();
  const { clearErrors } = useFormContext();

  // Watch isApproved from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value } }) => (
        <StyledSwitchContainer>
          <Switch
            checked={value}
            disabled={isLocked || isdisabled}
            aria-label={intl.formatMessage({
              id: 'drawer.field.toggleClockIn',
            })}
            onChange={() => {
              if (value) {
                track(trackingPoints.CLOCK_OUT);
                // Clear time-related errors when switching to duration mode (toggleClockIn = false)
                clearErrors('startTime');
                clearErrors('endTime');
              } else {
                track(trackingPoints.CLOCK_IN);
                // Clear duration-related errors when switching to time mode (toggleClockIn = true)
                clearErrors('duration');
              }
              onChange(!value);
            }}
          />
          <StyledB2>
            {intl.formatMessage({
              id: 'drawer.field.toggleClockIn',
            })}
          </StyledB2>
        </StyledSwitchContainer>
      )}
    />
  );
};
