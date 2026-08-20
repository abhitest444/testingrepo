import React, { useEffect, useState } from 'react';
import TextArea from '@ids-ts/textarea';
import styled from 'styled-components';
import { MAX_NOTES_LENGTH } from '../../common/constants';

export interface TextAreaFieldProps {
  value: string;
  onChange: (value: string | null) => void;
  label?: string;
  errorText?: string;
  placeholder?: string;
  resizeTextArea?: boolean;
  rows?: number;
  maxHeight?: string;
  readOnly?: boolean;
}

const TextAreaWrapper = styled.div<{ maxHeight?: string }>`
  width: 100%; // Set the width of the wrapper.

  textarea {
    max-height: ${(props) => props.maxHeight};
  }
`;

export const TextAreaField = ({
  value,
  onChange,
  label,
  errorText,
  placeholder = '',
  resizeTextArea = false,
  rows,
  maxHeight,
  readOnly = false,
}: TextAreaFieldProps) => {
  const formattedValue = value != null ? value : '';

  const [internalValue, setInternalValue] = useState(formattedValue);

  useEffect(() => {
    setInternalValue(formattedValue);
  }, [formattedValue]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInternalValue(event.target.value);
  };

  const handleBlur = () => {
    if (internalValue === '') {
      setInternalValue('');
      onChange(null);
      return;
    }
    onChange(internalValue);
  };

  return (
    <TextAreaWrapper maxHeight={maxHeight}>
      <TextArea
        label={label}
        value={internalValue}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        errorText={errorText}
        maxLength={MAX_NOTES_LENGTH}
        width="100%"
        resizeTextArea={resizeTextArea}
        rows={rows}
        readOnly={readOnly}
      />
    </TextAreaWrapper>
  );
};
