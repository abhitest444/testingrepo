import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { BreakRule } from 'src/js/widgets/breaks/types';

interface CustomBreakSelectorProps {
  name: string;
  employeeId: string;
  onBreakSelected?: (breakId: string, breakRule: BreakRule) => void;
}

export const CustomBreakSelector = ({
  name,
  employeeId,
  onBreakSelected,
}: CustomBreakSelectorProps) => {
  const intl = useIntl();

  return (
    <Controller
      name={name}
      render={({ field: { onChange, value } }) => (
        <Widget
          key="breaks-quickfills"
          widgetId="time-tracking-ui/breaks"
          options={{
            feature: 'breaks-quickfills',
            functionality: 'breaks-selector-quickfill',
            props: {
              assigneeId: employeeId,
              width: '100%',
              label: intl.formatMessage(
                { id: 'timeclock.form.breakType.label' },
                { defaultValue: 'Break type' },
              ),
              onBreakSelected: (breakId: string, breakRule: BreakRule) => {
                // Update form value using Controller's onChange
                onChange(breakId);

                // Call optional callback for additional handling
                if (onBreakSelected) {
                  onBreakSelected(breakId, breakRule);
                }
              },
              filter: {
                isActive: true,
                allowManual: true,
              },
            },
          }}
        />
      )}
    />
  );
};
