import React, { useEffect, useState } from 'react';
import TextField from '@ids-ts/text-field';
import Tooltip from '@ids-ts/tooltip';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { CircleQuestion } from '@design-systems/icons';
import {
  formatCurrency,
  isValidCurrencyFormat,
  processCurrencyInput,
} from 'src/js/common/CurrencyUtils';

export interface CurrencyFieldProps {
  value: number | null; // decimal number
  onChange: (value: number | null) => void; // decimal number
  width?: number | string;
  label?: string;
  errorText?: string;
  setError: (error?: string) => void;
  maxLength?: number;
  showTooltip?: boolean;
  showTooltipIcon?: boolean;
  showBillRateTooltip?: boolean;
  tooltipInfoId?: string;
  showOnly?: boolean;
  allowNegative?: boolean; // Allow negative values for cost/bill rate adjustments
}

const StyledTooltip = styled(Tooltip)`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 260px !important;
  min-width: 80px !important;

  @media (max-width: 490px) {
    max-width: 140px !important;
  }
`;

const TooltipContent = styled.div`
  margin-top: 8px;
`;

const CurrencyFieldContainer = styled.div<{
  showTooltipIcon: boolean;
  showBillRateTooltip: boolean;
}>`
  display: flex;
  flex-direction: ${({ showTooltipIcon }) =>
    showTooltipIcon ? 'column' : 'row'};
  gap: ${({ showBillRateTooltip }) => (showBillRateTooltip ? '8px' : '2px')};
  ${({ showTooltipIcon }) =>
    showTooltipIcon && 'min-width: 232px; flex-grow: 1; flex-basis: 30%;'}
`;

const PlaceholderTextOpacity = styled.div`
  input::placeholder {
    color: var(
      --color-input-placeholder
    ) !important; /* (SemanticContextMatchOnly) */
    opacity: 0.5 !important;
  }
`;

export const CurrencyField = ({
  value,
  onChange,
  width,
  label,
  errorText,
  setError,
  maxLength = 11,
  showTooltip,
  showTooltipIcon = false,
  showBillRateTooltip = false,
  tooltipInfoId = '',
  showOnly,
  allowNegative = false,
}: CurrencyFieldProps) => {
  const intl = useIntl();

  const formattedValue =
    value !== null ? formatCurrency(value.toString(), allowNegative) : '';

  const [internalValue, setInternalValue] = useState(formattedValue);
  const [internalShowTooltip, setInternalShowTooltip] = useState(false);

  useEffect(() => {
    setInternalValue(formattedValue);
  }, [formattedValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = processCurrencyInput(
      event.target.value,
      maxLength,
      allowNegative,
    );
    setInternalValue(newValue);
  };

  const handleFocus = () => {
    setInternalShowTooltip(!!showTooltip);
  };

  const handleBlur = () => {
    setInternalShowTooltip(false);
    if (internalValue === '') {
      setError(undefined);
      setInternalValue('');
      onChange(null);
      return;
    }

    const formattedCurrency = formatCurrency(internalValue, allowNegative);
    if (isValidCurrencyFormat(formattedCurrency, allowNegative)) {
      setError(undefined);
      setInternalValue(formattedCurrency);
      onChange(parseFloat(formattedCurrency));
    } else {
      setError(
        intl.formatMessage({
          id: 'billrate.format.error',
        }),
      );
    }
  };

  const CustomLabel = () => (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ color: 'var(--color-input-label)' }}>{label}</span>
      {showTooltipIcon && (
        <Tooltip
          tooltipOffsetSkidding={-2}
          message={intl.formatMessage({
            id: tooltipInfoId,
          })}
        >
          <CircleQuestion color="#6B6C72" style={{ marginLeft: '8px' }} />
        </Tooltip>
      )}
    </span>
  );

  return (
    <CurrencyFieldContainer
      showTooltipIcon={showTooltipIcon}
      showBillRateTooltip={showBillRateTooltip}
    >
      <CustomLabel />
      <StyledTooltip
        tooltipOffsetSkidding={2}
        message={intl.formatMessage({
          id: 'cost_rate_vendor_field_info',
        })}
        open={internalShowTooltip}
        position="right"
        tooltipOffsetDistance={-5}
      >
        <PlaceholderTextOpacity>
          <TextField
            disabled={showOnly}
            aria-label={intl.formatMessage({
              id: 'bill.rate',
            })}
            value={internalValue}
            placeholder="0.00"
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus} // Pass onFocus to TextField
            errorText={errorText}
            width={width}
          />
        </PlaceholderTextOpacity>
      </StyledTooltip>
      {showBillRateTooltip && (
        <div>
          <Tooltip
            tooltipOffsetSkidding={-2}
            message={intl.formatMessage({
              id: tooltipInfoId,
            })}
          >
            <TooltipContent>
              <CircleQuestion color="#6B6C72" />
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </CurrencyFieldContainer>
  );
};
