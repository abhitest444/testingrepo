import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import React from 'react';
import styled from 'styled-components';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { TextAreaField } from '../TextAreaField';

const MAX_NOTES_LENGTH = 4000;

export interface NotesProps {
  name: string;
  disabled?: boolean;
  shouldValidate?: boolean;
  isNotesRequired?: boolean;
  trackingPoint: TrackingPoint;
  resizeTextArea?: boolean;
  rows?: number;
  maxHeight?: string;
}

const TextareaControlContainer = styled(TextAreaField)`
  height: fit-content;
`;

export const Notes = ({
  name,
  disabled: disabledProp,
  shouldValidate = false,
  isNotesRequired = false,
  trackingPoint,
  resizeTextArea,
  rows,
  maxHeight,
}: NotesProps) => {
  const intl = useIntl();
  const track = useTracking();
  const { setError } = useFormContext();

  // Watch isLocked from form context
  const isLocked = useWatch({
    name: 'isLocked',
    defaultValue: false,
  });

  return (
    <Controller
      name={name}
      rules={{
        validate: (value: string) => {
          if (value?.length >= MAX_NOTES_LENGTH) {
            return intl.formatMessage({ id: 'max.length.error' });
          }
          if (
            shouldValidate &&
            isNotesRequired &&
            (!value || value.trim() === '')
          ) {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextareaControlContainer
          value={value}
          onChange={(value) => {
            track(trackingPoint);
            onChange(value);
            // manually clear the error
            setError(name, { type: 'custom', message: undefined });
          }}
          readOnly={disabledProp || isLocked}
          label={`${intl.formatMessage({
            id: 'drawer.form.notes.label',
          })} ${isNotesRequired ? '*' : ''}`} // required notes is denoted by asterisk
          errorText={error?.message}
          resizeTextArea={resizeTextArea}
          rows={rows}
          maxHeight={maxHeight}
        />
      )}
    />
  );
};
