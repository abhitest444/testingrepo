import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Checkbox from '@ids-ts/checkbox';
import { B2 } from '@ids-ts/typography';
import styled from 'styled-components';
import { TrackingPoint } from 'src/js/common/useClickTracking';

const StyledB2 = styled(B2)<{ disabled?: boolean }>`
  color: ${({ disabled }) =>
    disabled ? 'var(--color-text-disabled)' : 'var(--color-text-primary)'};
`;

export interface WeeklyTimeEntryCheckboxProps {
  name: string;
  labelKey: string;
  trackingPoint: TrackingPoint;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export const WeeklyTimeEntryCheckbox: React.FC<
  WeeklyTimeEntryCheckboxProps
> = ({
  name,
  labelKey,
  trackingPoint,
  checked = false,
  onChange,
  disabled = false,
}) => {
  const intl = useIntl();
  const track = useTracking();

  const handleChange = (event: any) => {
    const newValue = event.target.checked;
    const ui_action = newValue ? 'enabled' : 'disabled';
    track({ ...trackingPoint, ui_action });
    onChange(newValue);
  };

  return (
    <Checkbox
      name={name}
      onChange={handleChange}
      checked={checked}
      disabled={disabled}
    >
      <StyledB2 disabled={disabled}>
        {intl.formatMessage({
          id: labelKey,
        })}
      </StyledB2>
    </Checkbox>
  );
};
