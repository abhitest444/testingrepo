import React from 'react';

import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useWatch } from 'react-hook-form';
import Checkbox from '@ids-ts/checkbox';
import { B2 } from '@ids-ts/typography';
import { TrackingPoint } from '../../../common/useClickTracking';

export interface FormCheckboxProps {
  name: string;
  disabled?: boolean;
  labelKey: string;
  trackingPoint: TrackingPoint;
  color?: string;
  defaultChecked?: boolean;
  onChange?: (value: boolean | undefined) => void;
}

export const FormCheckbox = ({
  name,
  disabled: disabledProp,
  labelKey,
  trackingPoint,
  color = '#393A3D',
  defaultChecked = true,
  onChange: onChangeProp,
}: FormCheckboxProps) => {
  const intl = useIntl();
  const track = useTracking();

  // Watch isApproved from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value } }) => (
        <Checkbox
          onChange={(e) => {
            const checked = !!e?.target?.checked;
            const ui_action = checked ? 'enabled' : 'disabled';
            track({ ...trackingPoint, ui_action });
            onChange(checked);
            if (onChangeProp) {
              onChangeProp(checked);
            }
          }}
          checked={!!value}
          disabled={disabledProp || isLocked}
          defaultChecked={defaultChecked}
        >
          <B2
            style={{
              color,
            }}
          >
            {intl.formatMessage({
              id: labelKey,
            })}
          </B2>
        </Checkbox>
      )}
    />
  );
};
