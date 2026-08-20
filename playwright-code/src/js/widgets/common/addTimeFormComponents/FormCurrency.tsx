import React from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { CurrencyField } from 'src/js/widgets/common/CurrencyField';
import { TrackingPoint } from 'src/js/common/useClickTracking';

export interface FormCurrencyProps {
  name: string;
  width?: number | string;
  labelKey?: string;
  shouldValidate?: boolean;
  setVendorCostRateVisibility?: boolean;
  trackingPoint: TrackingPoint;
  maxLength?: number;
  costRateToolTipVisibility?: boolean;
  billRateToolTipVisibility?: boolean;
  tooltipInfoId?: string;
  showOnly?: boolean;
  allowNegative?: boolean;
}

export const FormCurrency = ({
  name,
  width,
  labelKey,
  shouldValidate = true,
  setVendorCostRateVisibility = false,
  costRateToolTipVisibility = false,
  billRateToolTipVisibility = false,
  showOnly = false,
  trackingPoint,
  maxLength,
  tooltipInfoId,
  allowNegative = false,
}: FormCurrencyProps) => {
  const intl = useIntl();
  const track = useTracking();

  const { setError } = useFormContext();

  // Watch form values
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: number | null) => {
          if (shouldValidate) {
            if (value === null) {
              return intl.formatMessage({
                id: 'drawer.field.required',
              });
            }
            if (maxLength && Number(value).toFixed().length > maxLength) {
              return intl.formatMessage({
                id: 'drawer.field.tooLong',
              });
            }
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <CurrencyField
          value={value}
          showOnly={showOnly || isLocked}
          onChange={(value) => {
            track(trackingPoint);
            onChange(value);
          }}
          showTooltip={setVendorCostRateVisibility}
          showTooltipIcon={costRateToolTipVisibility}
          showBillRateTooltip={billRateToolTipVisibility}
          tooltipInfoId={tooltipInfoId}
          label={
            labelKey
              ? intl.formatMessage({
                  id: labelKey,
                })
              : null
          }
          errorText={error?.message}
          setError={(error?: string) => {
            setError(name, { type: 'custom', message: error });
          }}
          width={width}
          maxLength={maxLength}
          allowNegative={allowNegative}
        />
      )}
    />
  );
};
