import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import React, { useRef } from 'react';
import { EntityRef } from 'src/js/widgets/common/types';
import useAuthorization from 'src/js/providers/useAuthorization';
import { TrackingPoint } from '../../../common/useClickTracking';

export interface CustomerProps {
  name: string;
  width?: number;
  trackingPoint: TrackingPoint;
  updateLabel?: (field: string, value: string) => void;
}

export const Customer = ({
  name,
  width,
  trackingPoint,
  updateLabel,
}: CustomerProps) => {
  const intl = useIntl();
  const track = useTracking();
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const { decision } = useAuthorization({
    resource: { id: 'irn:intuit::contacts:names:customer:ui:v4' },
    action: { id: 'create' },
  });
  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('customer', inputElement.value);
      }
    }
  };

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: EntityRef) => {
          if (!value || !value.id || value.id === '') {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div ref={widgetContainerRef}>
          <Widget
            widgetId="qbo-quickfills-ui/quickfills"
            type="contact"
            addNew={decision?.isAuthorized || false}
            subTypes={['customer']}
            customerSubType="CUSTOMER"
            value={value.id}
            onChange={(e: any) => {
              track(trackingPoint);
              onChange({
                id: e?.selectedItem?.localId || '',
                name: e?.selectedItem?.displayName || '',
              } as EntityRef);
            }}
            onReady={() => {
              getFieldlabel();
            }}
            placeholder={intl.formatMessage({
              id: 'drawer.form.customer.placeholder',
            })}
            label={intl.formatMessage({
              id: 'drawer.form.customer.label',
            })}
            errorText={error?.message}
            width={width}
          />
        </div>
      )}
    />
  );
};
