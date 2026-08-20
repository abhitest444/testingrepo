import React, { useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import { useIntl, useTracking } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import { IconControl } from '@ids-ts/icon-control';
import { Delete } from '@design-systems/icons';
import { TrackingPoint } from 'src/js/common/useClickTracking';

const IconContainer = styled.div`
  margin-top: 30px;
`;

const ButtonContainer = styled.div`
  margin-top: var(--space-component-inline-padding-medium);
  margin-bottom: var(--space-component-inline-padding-medium);
`;

export interface ToggleBreakProps {
  name: string;
  trackingPoint: TrackingPoint;
}

export const ToggleBreak = ({ name, trackingPoint }: ToggleBreakProps) => {
  const intl = useIntl();
  const track = useTracking();
  const shouldFocus = useRef(false);

  const { setValue } = useFormContext();

  // Focus on the button when it is rendered
  // but only after the delete icon is clicked
  const handleFocusOnRender = (el: HTMLButtonElement | null) => {
    if (shouldFocus.current) {
      el?.focus();
      shouldFocus.current = false;
    }
  };

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value } }) => (
        <>
          {value ? (
            <IconContainer>
              <IconControl
                aria-label={`${intl.formatMessage({
                  id: 'drawer.field.deletebreak',
                })}`}
                onClick={() => {
                  track(trackingPoint);
                  setValue('breakDuration', null);
                  onChange(false);
                  shouldFocus.current = true;
                }}
                size="medium"
              >
                <Delete />
              </IconControl>
            </IconContainer>
          ) : (
            <ButtonContainer>
              <Button
                innerRef={handleFocusOnRender}
                priority="secondary"
                purpose="passive"
                size="small"
                onClick={() => {
                  track(trackingPoint);
                  onChange(true);
                  shouldFocus.current = false;
                }}
              >
                {intl.formatMessage({
                  id: 'drawer.field.addbreak',
                })}
              </Button>
            </ButtonContainer>
          )}
        </>
      )}
    />
  );
};
