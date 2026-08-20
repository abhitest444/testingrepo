import React from 'react';
import { NoSpinnerTextField } from '../styles/Breaks.styled';

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  min?: number;
  max?: number;
  value?: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: 'small' | 'medium';
  defaultValue?: number;
}

const NumericInput: React.FC<NumericInputProps> = ({
  min = 0,
  max = 999,
  value,
  onChange,
  size = 'medium',
  defaultValue,
  ...rest
}) => {
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const val = input.value.replace(/[^0-9]/g, '');
    if (val) {
      const num = Math.max(min, Math.min(max, parseInt(val, 10)));
      input.value = num.toString();
    } else {
      input.value = defaultValue?.toString() ?? '';
    }
  };

  return (
    <NoSpinnerTextField
      type="number"
      min={min}
      max={max}
      inputMode="numeric"
      pattern="[0-9]*"
      value={value ?? defaultValue}
      onChange={onChange}
      onInput={handleInput}
      size={size}
      aria-label={rest['aria-label'] || 'Break duration'}
      {...rest}
    />
  );
};

export default NumericInput;
