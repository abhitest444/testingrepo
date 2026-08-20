import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  selectShowValidationError,
  selectValidationErrorMessages,
  selectBreaksError,
  selectCustomerDataError,
  selectTimeEntryGridLoading,
  selectSaveError,
  selectSettingsError,
} from '../../store/selectors';
import {
  clearValidationError,
  clearSaveError,
  clearSettingsError,
} from '../../store/validationSlice';
import { RequiredFieldsErrorMessage } from './RequiredFieldsErrorMessage';
import { WarningPageMessage } from './WarningPageMessage';
import { CommonErrorMessage } from './CommonErrorMessage';

export const CommonErrorDisplay: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  // Get error states from Redux
  const showValidationError = useAppSelector(selectShowValidationError);
  const validationErrorMessages = useAppSelector(selectValidationErrorMessages);
  const breaksError = useAppSelector(selectBreaksError);
  const customersError = useAppSelector(selectCustomerDataError);
  const isLoading = useAppSelector(selectTimeEntryGridLoading);
  const saveError = useAppSelector(selectSaveError);
  const settingsError = useAppSelector(selectSettingsError);

  // Handler for closing validation errors
  const handleCloseValidationError = React.useCallback(() => {
    dispatch(clearValidationError());
  }, [dispatch]);

  // Handler for closing save errors
  const handleCloseSaveError = React.useCallback(() => {
    dispatch(clearSaveError());
  }, [dispatch]);

  // Handler for closing settings errors
  const handleCloseSettingsError = React.useCallback(() => {
    dispatch(clearSettingsError());
  }, [dispatch]);

  return (
    <>
      {/* Warning message for time category errors */}
      {(breaksError || customersError) && !isLoading && (
        <WarningPageMessage
          title={intl.formatMessage({
            id: 'weekly.time.entry.warning.time.category.title',
          })}
          message={intl.formatMessage({
            id: 'weekly.time.entry.warning.time.category.message',
          })}
        />
      )}

      {/* Required fields validation error */}
      <RequiredFieldsErrorMessage
        errorMessages={showValidationError ? validationErrorMessages : []}
        onClose={handleCloseValidationError}
      />

      {/* Save error message */}
      {saveError && (
        <CommonErrorMessage
          type="error"
          titleText={intl.formatMessage({
            id: 'weekly.time.entry.save.error.title',
          })}
          onClose={handleCloseSaveError}
        >
          {saveError}
        </CommonErrorMessage>
      )}

      {/* Company settings error message - shown as page message */}
      {settingsError === 'company_settings_error' && (
        <CommonErrorMessage
          type="error"
          titleText={intl.formatMessage({
            id: 'company.settings.error.title',
            defaultMessage: 'Something went wrong',
          })}
          onClose={handleCloseSettingsError}
        >
          {intl.formatMessage({
            id: 'company.settings.error.message',
            defaultMessage: 'We ran into an issue loading company settings',
          })}
        </CommonErrorMessage>
      )}
    </>
  );
};
