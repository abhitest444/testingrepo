import { useIntl, useTracking } from '@payroll/quicksand';
import { Controller } from 'react-hook-form';
import React, { useState } from 'react';
import TextField from '@ids-ts/text-field';
import { TrackingPoint } from 'src/js/common/useClickTracking';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';

export interface ClosedBooksConfirmationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onYesClick: () => void;
  isCloseBookPasswordEnabled: boolean;
  trackingPoint: TrackingPoint;
}

export const ClosedBooksConfirmationModal = ({
  open,
  setOpen,
  onYesClick,
  isCloseBookPasswordEnabled,
  trackingPoint,
}: ClosedBooksConfirmationModalProps) => {
  const intl = useIntl();
  const track = useTracking();
  const [internalValue, setInternalValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleYesClick = (onChange: Function) => {
    if (isCloseBookPasswordEnabled && internalValue === '') {
      setErrorMessage(
        intl.formatMessage({ id: 'closed.books.password.required' }),
      );
      return;
    }

    onChange(internalValue);
    track(trackingPoint);
    setInternalValue('');
    setErrorMessage('');
    onYesClick();
  };

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(event.target.value);
  };

  return (
    <Controller
      name="closedBookPassword"
      render={({ field: { onChange } }) => (
        <ConfirmationModal
          title={intl.formatMessage({
            id: 'closed.books.title',
          })}
          open={open}
          setOpen={setOpen}
          onYesClick={() => handleYesClick(onChange)}
        >
          <>
            {intl.formatMessage({
              id: 'closed.books.content',
            })}
            {isCloseBookPasswordEnabled && (
              <TextField
                label={intl.formatMessage({
                  id: 'closed.books.password.label',
                })}
                onChange={handleOnChange}
                value={internalValue}
                errorText={errorMessage}
                type="password"
                hasWeightedLabel
                required
              />
            )}
          </>
        </ConfirmationModal>
      )}
    />
  );
};
