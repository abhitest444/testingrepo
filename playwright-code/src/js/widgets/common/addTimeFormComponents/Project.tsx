import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller } from 'react-hook-form';
import Widget from 'web-shell-core/widgets/HOCWidget';
import React, { useRef } from 'react';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { EntityRef } from 'src/js/widgets/common/types';

export interface ProjectProps {
  name: string;
  width?: number;
  canAddNew?: boolean;
  trackingPoint: TrackingPoint;
  updateLabel?: (field: string, value: string) => void;
}

export const Project = ({
  name,
  width,
  canAddNew = false,
  trackingPoint,
  updateLabel,
}: ProjectProps) => {
  const intl = useIntl();
  const track = useTracking();
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const getFieldlabel = () => {
    if (widgetContainerRef.current) {
      const inputElement = widgetContainerRef.current.querySelector('input');
      if (inputElement) {
        // use this value to populate state
        if (updateLabel) updateLabel('Project', inputElement.value);
      }
    }
  };

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div ref={widgetContainerRef}>
          <Widget
            widgetId="qbo-quickfills-ui/quickfills"
            type="contact"
            addNew={canAddNew}
            subTypes={['customer']}
            customerSubType="PROJECT"
            value={value.id}
            onChange={(e: any) => {
              track(trackingPoint);
              onChange({
                id: e?.selectedItem?.localId || '', // projectRef number
                name: e?.selectedItem?.displayName || '',
              } as EntityRef);
            }}
            onReady={() => {
              getFieldlabel();
            }}
            placeholder={intl.formatMessage({
              id: 'drawer.form.project.placeholder',
            })}
            label={intl.formatMessage({
              id: 'drawer.form.project.label',
            })}
            errorText={error?.message}
            width={width}
          />
        </div>
      )}
    />
  );
};
