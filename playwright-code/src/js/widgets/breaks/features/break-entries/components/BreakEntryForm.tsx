import React, { useCallback, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useIntl, useTracking, useSandbox } from '@payroll/quicksand';

import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@ids-ts/drawer';
import { Button } from '@ids-ts/button';
import SplitButton, { MenuItem } from '@ids-ts/split-button';
import styled from 'styled-components';
import dayjs from 'dayjs';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { BREAK_LOGGING_CONSTANTS } from 'src/js/widgets/breaks/constants';
import { TimeForType } from 'src/js/widgets/weeklyTimeEntry/types';
import { useBreakEntryTrackingPoints } from '../hooks/useBreakEntryTrackingPoints';
import { BreakEntry } from '../../../types';
import { selectBreakEntryFormIsLoading } from '../../../store/breakEntriesSlice';
import {
  clearPageMessage,
  openUnsavedChangesModal,
} from '../../../store/uiSlice';
import { useBreakEntryForm } from '../hooks/useBreakEntryForm';
import BreakEntryFormFields from './BreakEntryFormFields';
import LoadingOverlay from './LoadingOverlay';
import PageMessage from '../../../components/PageMessage';
import {
  DYN_BREAKS_CANCEL_BREAK_BUTTON,
  DYN_SAVE_BREAK_BUTTON,
} from '../../../trackingMetadata';

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

export interface BreakEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: BreakEntry) => void;
  onSaveAndNew?: (data: BreakEntry) => Promise<void>;
  initialData?: Partial<BreakEntry>;
  employeeId?: string | null;
}

const BreakEntryForm: React.FC<BreakEntryFormProps> = ({
  open,
  onClose,
  onSave,
  onSaveAndNew,
  initialData,
  employeeId = null,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useDispatch();
  const isLoading = useSelector(selectBreakEntryFormIsLoading);
  const logger = useLoggingConfig();
  const sandbox = useSandbox();
  const trackingPoints = useBreakEntryTrackingPoints();
  const {
    data: isTeamMembersDropdownEnabled,
    loading: teamMembersDropdownLoading,
  } = useQbTimeSdk<boolean>((sdk) => sdk.isTeamMembersDropdownEnabled, {
    executeOnMount: true,
  });
  const shouldShowTeamMemberField = isTeamMembersDropdownEnabled === true;

  // Get UX preferences for team member selection
  const {
    data: timeTrackingPreferences,
    loading: preferencesLoading,
    getPreference,
  } = useUxPreferences();

  // Create default values with proper Dayjs objects
  const defaultValues: BreakEntry = {
    name: '',
    breakRule: '',
    startDate: dayjs(), // Use Dayjs object
    endDate: dayjs(), // Use Dayjs object
    startTime: dayjs().startOf('hour'), // Set to current hour
    endTime: dayjs().startOf('hour').add(1, 'hour'), // Set to next hour
    description: '',
    timezone: getBrowserTimezone(),
    contact: { id: '', name: '' }, // Default contact value
    ...initialData,
  };

  const methods = useForm<BreakEntry>({
    defaultValues,
    shouldUnregister: true,
  });

  const dirtyFields = Object.keys(methods.formState.dirtyFields);

  useEffect(() => {
    if (open) {
      track(trackingPoints.ADD_BREAK_DRAWER_VIEWED);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load UX preferences on component mount
  useEffect(() => {
    getPreference(UxPreferenceKey.TIME_ENTRY_TIME_FOR);
  }, [getPreference]);

  // Apply UX preferences to set contact value automatically
  useEffect(() => {
    // Don't apply preferences if loading an existing break entry or if preferences are still loading
    if (preferencesLoading) {
      return;
    }

    // TODO: use hook to fetch to workers details instead of static type.
    if (!shouldShowTeamMemberField && employeeId) {
      methods.setValue(
        'contact',
        { id: employeeId, name: '', type: TimeForType.EMPLOYEE },
        { shouldDirty: false },
      );
      return;
    }

    // Get the preferred team member from UX preferences
    const preferredTeamMember =
      timeTrackingPreferences[UxPreferenceKey.TIME_ENTRY_TIME_FOR];

    // Apply UX preference if available and no existing contact is set
    if (preferredTeamMember?.id && !methods.getValues().contact?.id) {
      methods.setValue('contact', preferredTeamMember, { shouldDirty: false });
    }
  }, [
    timeTrackingPreferences,
    preferencesLoading,
    methods,
    shouldShowTeamMemberField,
    employeeId,
  ]);

  // Keep endDate synchronized with startDate for break entries
  useEffect(() => {
    const startDate = methods.watch('startDate');
    if (startDate && startDate.isValid()) {
      methods.setValue('endDate', startDate, { shouldDirty: false });
    }
  }, [methods.watch('startDate'), methods]);

  const { handleFormSubmit, handleSaveAndNew } = useBreakEntryForm({
    onSave,
    onClose,
    onSaveAndNew,
    reset: methods.reset,
  });

  const handleCancel = useCallback(
    (source?: 'header' | 'footer') => {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
          .BREAK_ENTRY_FORM_CANCEL_CLICKED,
      );
      if (dirtyFields.length > 0) {
        dispatch(openUnsavedChangesModal('closeBreakEntryForm'));
      } else {
        methods.reset();
        dispatch(clearPageMessage());
        onClose();
        switch (source) {
          case 'header':
            track(trackingPoints.EXIT_BREAK);
            break;
          case 'footer':
            track(trackingPoints.CANCEL_BREAK);
            sandbox.analytics.track({
              dynamic_id: DYN_BREAKS_CANCEL_BREAK_BUTTON,
            });
            break;
          default:
            break;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dirtyFields, dispatch, methods, onClose, logger],
  );

  const handleFormClick = () => {
    dispatch(clearPageMessage());
  };

  const onSubmit = methods.handleSubmit(
    (data) => {
      handleFormSubmit(data);
    },
    (errors) => {
      logger.error(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
          .BREAK_ENTRY_FORM_VALIDATION_FAILED,
        {
          errors,
        },
      );
    },
  );

  const handleSaveAndNewSubmit = methods.handleSubmit(
    (data) => {
      handleSaveAndNew(data);
      track(trackingPoints.SAVE_AND_NEW_BREAK);
    },
    (errors) => {
      logger.error(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
          .BREAK_ENTRY_FORM_VALIDATION_FAILED,
        {
          errors,
        },
      );
    },
  );

  const handleSplitButtonClick = () => {
    onSubmit();
    track(trackingPoints.SAVE_BREAK);
    sandbox.analytics.track({ dynamic_id: DYN_SAVE_BREAK_BUTTON });
  };

  const handleSplitButtonSelect = (e: any) => {
    if (e.target.value === 'saveAndNew') {
      handleSaveAndNewSubmit();
    }
  };

  // Log form open/close events
  useEffect(() => {
    if (open) {
      logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.BREAK_ENTRY_FORM_OPENED);
    } else {
      logger.info(BREAK_LOGGING_CONSTANTS.NAVIGATION.BREAK_ENTRY_FORM_CLOSED);
    }
  }, [open, logger]);

  return (
    <Drawer open={open} onClose={() => handleCancel('header')} size="medium">
      <DrawerHeader
        title={intl.formatMessage(
          { id: 'breaks.entry.form.title' },
          { defaultValue: 'Add Break Entry' },
        )}
        onClose={() => handleCancel('header')}
      />
      <DrawerContent>
        <PageMessage
          clearAction={clearPageMessage}
          testId="break-entry-form-page-message"
        />
        <FormContainer onClick={handleFormClick}>
          <LoadingOverlay
            isLoading={
              isLoading || preferencesLoading || teamMembersDropdownLoading
            }
          />
          <FormProvider {...methods}>
            <form onSubmit={onSubmit}>
              <BreakEntryFormFields
                shouldShowTeamMemberField={shouldShowTeamMemberField}
              />
            </form>
          </FormProvider>
        </FormContainer>
      </DrawerContent>
      <DrawerFooter>
        <FormActions>
          <Button
            type="button"
            onClick={() => handleCancel('footer')}
            disabled={isLoading}
            priority="tertiary"
            id={DYN_BREAKS_CANCEL_BREAK_BUTTON}
          >
            {intl.formatMessage(
              { id: 'breaks.entry.form.cancel' },
              { defaultValue: 'Cancel' },
            )}
          </Button>
          <SplitButton
            label={intl.formatMessage(
              { id: 'breaks.entry.form.save' },
              { defaultValue: 'Save' },
            )}
            onClick={handleSplitButtonClick}
            onSelect={handleSplitButtonSelect}
            disabled={isLoading}
            id={DYN_SAVE_BREAK_BUTTON}
          >
            <MenuItem value="saveAndNew">
              {intl.formatMessage(
                { id: 'breaks.entry.form.save.and.new' },
                { defaultValue: 'Save & New' },
              )}
            </MenuItem>
          </SplitButton>
        </FormActions>
      </DrawerFooter>
    </Drawer>
  );
};

export default BreakEntryForm;
