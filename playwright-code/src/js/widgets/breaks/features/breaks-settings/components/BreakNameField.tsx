import React, { useCallback, RefObject, useEffect, useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Typography } from '@ids-ts/typography';
import { useAppDispatch } from 'src/js/widgets/breaks/store/hooks';
import {
  updateBreakName,
  setFieldValidationError,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { WideTextField, FormSectionWithMargin } from '../styles/Breaks.styled';
import { FormValidationError } from './FormValidationError';

interface BreakNameFieldProps {
  breakName: string;
  nameInputRef?: RefObject<HTMLInputElement>;
  error?: string;
}

const BreakNameField: React.FC<BreakNameFieldProps> = ({
  breakName,
  nameInputRef,
  error,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  // Local state for immediate input feedback
  const [localBreakName, setLocalBreakName] = useState(breakName);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Handlers that update local state immediately and Redux on blur
  const handleBreakNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setLocalBreakName(value);
      setHasBeenTouched(true);
    },
    [dispatch, error],
  );

  const handleBreakNameBlur = useCallback(() => {
    dispatch(updateBreakName(localBreakName));
    setHasBeenTouched(true);

    // Validate break name on blur only if field has been touched
    if (hasBeenTouched) {
      if (!localBreakName?.trim()) {
        dispatch(
          setFieldValidationError({
            field: 'breakName',
            error: intl.formatMessage({
              id: 'breaks.validation.name.required',
            }),
          }),
        );
      } else {
        dispatch(
          setFieldValidationError({
            field: 'breakName',
            error: '',
          }),
        );
      }
    }
  }, [dispatch, localBreakName, hasBeenTouched, intl]);

  useEffect(() => {
    if (breakName) setLocalBreakName(breakName);
  }, [breakName]);

  return (
    <FormSectionWithMargin>
      <WideTextField
        value={localBreakName}
        onChange={handleBreakNameChange}
        onBlur={handleBreakNameBlur}
        id="break-name"
        data-testid="break-name-input"
        required
        label={intl.formatMessage({ id: 'breaks.create.name.label' })}
        aria-label={intl.formatMessage({ id: 'breaks.create.name.label' })}
        autoFocus
        ref={nameInputRef}
      />
      {error && hasBeenTouched && (
        <FormValidationError
          message={error}
          testId="break-name-validation-error"
        />
      )}
    </FormSectionWithMargin>
  );
};

export default BreakNameField;
