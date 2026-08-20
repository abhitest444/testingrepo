import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import { Typography } from '@ids-ts/typography';
import { Checkbox } from '@ids-ts/checkbox';
import { Payroll_DurationUnit } from 'src/__generated__/oigql/graphql';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/breaks/store/hooks';
import {
  updateAllowManual,
  updateAutoEnd,
  updateCantEndEarly,
  updateNotify,
  updateNotifyDuration,
  setFieldValidationError,
} from 'src/js/widgets/breaks/store/breakPolicyFormSlice';
import { formatBreakDuration } from '../../../utils';
import {
  BreakOptionsContainer,
  NotifyRow,
  FormSectionWithMargin,
  NotifyTextContainer,
} from '../styles/Breaks.styled';
import NumericInput from './NumericInput';
import { FormValidationError } from './FormValidationError';

interface BreakManualSectionProps {
  allowManual: boolean;
  autoEndBreak: boolean;
  cantEndEarly: boolean;
  notify: boolean;
  notifyDuration: number;
  breakDuration: number;
  error?: string;
}

const BreakManualSection: React.FC<BreakManualSectionProps> = ({
  allowManual,
  autoEndBreak,
  cantEndEarly,
  notify,
  notifyDuration,
  breakDuration,
  error,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.breakPolicyForm.formData);

  // Local state for immediate input feedback
  const [localNotifyDuration, setLocalNotifyDuration] = useState(
    notifyDuration || 5,
  );
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Update local state when form data changes (only on initial load)
  useEffect(() => {
    setLocalNotifyDuration(notifyDuration || 5);
  }, [notifyDuration]);

  // Reset all manual section rules when noSetDuration is true
  useEffect(() => {
    if (formData.noSetDuration) {
      // setLocalNotifyDuration(0);
      // dispatch(updateNotifyDuration(0));
      dispatch(updateAllowManual(true));
      dispatch(updateAutoEnd(false));
      dispatch(updateCantEndEarly(false));
      dispatch(updateNotify(false));
    }
  }, [formData.noSetDuration, dispatch]);

  const handleNotifyDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setLocalNotifyDuration(value);
      setHasBeenTouched(true);
    },
    [],
  );

  const handleNotifyDurationBlur = useCallback(() => {
    dispatch(updateNotifyDuration(localNotifyDuration));
    setHasBeenTouched(true);

    // Validate notify duration on blur only if field has been touched
    if (allowManual && notify && hasBeenTouched) {
      if (!localNotifyDuration || localNotifyDuration <= 0) {
        dispatch(
          setFieldValidationError({
            field: 'notifyDuration',
            error: intl.formatMessage({
              id: 'breaks.validation.notify.duration.required',
            }),
          }),
        );
      } else {
        // Convert break duration to minutes for comparison
        const breakDurationMinutes =
          formData.durationUnit === Payroll_DurationUnit.Hours
            ? (formData.breakDuration || 0) * 60
            : formData.breakDuration || 0;

        if (localNotifyDuration >= breakDurationMinutes) {
          dispatch(
            setFieldValidationError({
              field: 'notifyDuration',
              error: intl.formatMessage({
                id: 'breaks.validation.notify.duration.invalid',
              }),
            }),
          );
        } else {
          dispatch(
            setFieldValidationError({
              field: 'notifyDuration',
              error: '',
            }),
          );
        }
      }
    }
  }, [
    dispatch,
    localNotifyDuration,
    allowManual,
    notify,
    formData.durationUnit,
    formData.breakDuration,
    intl,
    hasBeenTouched,
  ]);

  // Memoized handlers for better performance
  const handleAllowManualChange = useCallback(
    (e: any) => {
      dispatch(updateAllowManual(e.target.checked || false));
    },
    [dispatch],
  );

  const handleAutoEndChange = useCallback(
    (e: any) => {
      dispatch(updateAutoEnd(e.target.checked || false));
    },
    [dispatch],
  );

  const handleCantEndEarlyChange = useCallback(
    (e: any) => {
      dispatch(updateCantEndEarly(e.target.checked || false));
    },
    [dispatch],
  );

  const handleNotifyChange = useCallback(
    (e: any) => {
      const isChecked = e.target.checked || false;
      dispatch(updateNotify(isChecked));

      // Validate notify duration when notifications are enabled
      if (isChecked && allowManual) {
        setHasBeenTouched(true);
        if (!localNotifyDuration || localNotifyDuration <= 0) {
          dispatch(
            setFieldValidationError({
              field: 'notifyDuration',
              error: intl.formatMessage({
                id: 'breaks.validation.notify.duration.required',
              }),
            }),
          );
        } else {
          // Convert break duration to minutes for comparison
          const breakDurationMinutes =
            formData.durationUnit === Payroll_DurationUnit.Hours
              ? (formData.breakDuration || 0) * 60
              : formData.breakDuration || 0;

          if (localNotifyDuration >= breakDurationMinutes) {
            dispatch(
              setFieldValidationError({
                field: 'notifyDuration',
                error: intl.formatMessage({
                  id: 'breaks.validation.notify.duration.invalid',
                }),
              }),
            );
          } else {
            dispatch(
              setFieldValidationError({
                field: 'notifyDuration',
                error: '',
              }),
            );
          }
        }
      } else if (!isChecked) {
        // Clear validation error when notifications are disabled
        dispatch(
          setFieldValidationError({
            field: 'notifyDuration',
            error: '',
          }),
        );
      }
    },
    [
      dispatch,
      allowManual,
      localNotifyDuration,
      formData.durationUnit,
      formData.breakDuration,
      intl,
    ],
  );

  return (
    <FormSectionWithMargin>
      <Checkbox
        checked={allowManual || false}
        data-testid="break-manual-checkbox"
        onChange={handleAllowManualChange}
        disabled={formData.noSetDuration}
        description={intl.formatMessage({
          id: 'breaks.create.manual.description',
        })}
      >
        {intl.formatMessage({ id: 'breaks.create.manual.label' })}
      </Checkbox>
      {allowManual && (
        <BreakOptionsContainer>
          <Checkbox
            checked={autoEndBreak || false}
            data-testid="break-auto-end-checkbox"
            onChange={handleAutoEndChange}
            disabled={formData.noSetDuration}
          >
            {intl.formatMessage({ id: 'breaks.create.autoEnd.label' })}
          </Checkbox>
          <Checkbox
            checked={cantEndEarly || false}
            data-testid="break-cant-end-early-checkbox"
            onChange={handleCantEndEarlyChange}
            disabled={formData.noSetDuration}
          >
            {intl.formatMessage({ id: 'breaks.create.cantEndEarly.label' })} (
            {formatBreakDuration(breakDuration, formData.durationUnit, intl)})
          </Checkbox>
          <NotifyRow>
            <Checkbox
              checked={notify || false}
              data-testid="break-notify-checkbox"
              onChange={handleNotifyChange}
              disabled={formData.noSetDuration}
            >
              <NotifyTextContainer>
                {intl.formatMessage({ id: 'breaks.create.notify.label' })}
              </NotifyTextContainer>
              <NumericInput
                value={localNotifyDuration}
                onChange={handleNotifyDurationChange}
                onBlur={handleNotifyDurationBlur}
                size="medium"
                disabled={formData.noSetDuration}
              />
              <NotifyTextContainer>
                {intl.formatMessage({ id: 'breaks.create.notify.suffix' })}
              </NotifyTextContainer>
            </Checkbox>
          </NotifyRow>
          {error && hasBeenTouched && (
            <FormValidationError
              message={error}
              testId="break-manual-validation-error"
            />
          )}
        </BreakOptionsContainer>
      )}
    </FormSectionWithMargin>
  );
};

export default BreakManualSection;
