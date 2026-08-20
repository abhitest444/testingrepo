import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@ids-ts/drawer';
import { Button } from '@ids-ts/button';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BreakEntry } from '../../../types';
import {
  selectBreakEntryEditFormIsLoading,
  selectCurrentBreakEntryEdit,
} from '../../../store/breakEntriesSlice';
import {
  clearPageMessage,
  openUnsavedChangesModal,
} from '../../../store/uiSlice';
import { useBreakEntryForm } from '../hooks/useBreakEntryForm';
import BreakEntryEditFormFields from './BreakEntryEditFormFields';
import LoadingOverlay from './LoadingOverlay';
import PageMessage from '../../../components/PageMessage';
import { updateTimeToDayjs } from '../../../utils/mapTimeEntryToBreakEntry';
import { BREAK_LOGGING_CONSTANTS } from '../../../constants';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
`;

export interface BreakEntryEditFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: BreakEntry) => void;
}

const BreakEntryEditForm: React.FC<BreakEntryEditFormProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectBreakEntryEditFormIsLoading);
  const initialData = useSelector(selectCurrentBreakEntryEdit);
  const isTimeOff = initialData?.isTimeOffEntry ?? false;
  const logger = useLoggingConfig();

  // Create default values with proper Dayjs objects
  const defaultValues: BreakEntry = {
    name: '',
    breakRule: '',
    startDate: dayjs(), // Use Dayjs object
    description: '',
    timezone: '', // Don't set default timezone
    contact: { id: '', name: '', type: 'EMPLOYEE' }, // Default contact value
    duration: undefined, // Duration will be set if present in data
    useStartEndTime: true, // Default to start/end time mode
  };

  const methods = useForm<BreakEntry>({
    defaultValues,
    // shouldUnregister: true,
  });

  const { handleFormSubmit } = useBreakEntryForm({
    onSave,
    onClose,
    reset: methods.reset,
    isEditForm: true,
  });

  const handleCancel = () => {
    logger.info(
      BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
        .BREAK_ENTRY_EDIT_FORM_CANCEL_CLICKED,
    );
    // Time off entries are read-only — never prompt to save
    if (isTimeOff) {
      methods.reset();
      dispatch(clearPageMessage());
      onClose();
      return;
    }
    const dirtyFields = Object.keys(methods.formState.dirtyFields);
    if (dirtyFields.length > 0) {
      dispatch(openUnsavedChangesModal('closeBreakEntryEditForm'));
    } else {
      methods.reset();
      dispatch(clearPageMessage());
      onClose();
    }
  };

  const handleFormClick = () => {
    dispatch(clearPageMessage());
  };

  const onSubmit = methods.handleSubmit(
    (data) => {
      if (!isTimeOff) {
        handleFormSubmit(data);
      }
    },
    (errors) => {
      logger.error(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
          .BREAK_ENTRY_EDIT_FORM_VALIDATION_FAILED,
        {
          errors,
        },
      );
    },
  );

  useEffect(() => {
    if (initialData) {
      const formdata = updateTimeToDayjs(initialData);
      methods.reset(formdata);
    }
  }, [initialData, methods]);

  // Log form open/close events
  useEffect(() => {
    if (open) {
      logger.info(
        BREAK_LOGGING_CONSTANTS.NAVIGATION.BREAK_ENTRY_EDIT_FORM_OPENED,
      );
    } else {
      logger.info(
        BREAK_LOGGING_CONSTANTS.NAVIGATION.BREAK_ENTRY_EDIT_FORM_CLOSED,
      );
    }
  }, [open, logger]);

  // Only show form content when data is loaded and form is ready
  const isFormReady = initialData && !isLoading;

  return (
    <Drawer open={open} onClose={handleCancel} size="medium">
      <DrawerHeader
        title={intl.formatMessage(
          {
            id: isTimeOff
              ? 'breaks.entry.edit.form.title.timeoff'
              : 'breaks.entry.edit.form.title',
          },
          {
            defaultValue: isTimeOff
              ? 'Viewing Time Off Entry'
              : 'Edit Break Entry',
          },
        )}
        onClose={handleCancel}
      />
      <DrawerContent>
        <>
          <PageMessage
            clearAction={clearPageMessage}
            testId="break-entry-edit-form-page-message"
          />
          {isFormReady ? (
            <FormContainer onClick={handleFormClick}>
              <FormProvider {...methods}>
                <form onSubmit={onSubmit}>
                  <BreakEntryEditFormFields disabled={isTimeOff} />
                </form>
              </FormProvider>
            </FormContainer>
          ) : (
            <LoadingOverlay isLoading />
          )}
        </>
      </DrawerContent>
      <DrawerFooter>
        <FormActions>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            priority="tertiary"
          >
            {intl.formatMessage(
              { id: 'breaks.entry.form.cancel' },
              { defaultValue: 'Cancel' },
            )}
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isTimeOff || isLoading}
            priority="primary"
          >
            {intl.formatMessage(
              { id: 'breaks.entry.form.save' },
              { defaultValue: 'Save' },
            )}
          </Button>
        </FormActions>
      </DrawerFooter>
    </Drawer>
  );
};

export default BreakEntryEditForm;
