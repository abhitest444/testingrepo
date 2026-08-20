import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTracking } from '@payroll/quicksand';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  TimeTracking_CreateTimeEntryInput,
  TimeTracking_TimeForType,
  TimeTracking_BillableStatus,
} from 'src/__generated__/timeTracking/graphql';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import { useBreakEntryTrackingPoints } from '../hooks/useBreakEntryTrackingPoints';
import {
  closeBreakEntryForm,
  selectBreakEntryFormIsOpen,
  selectCurrentBreakEntry,
  selectBreakEntryFormIsLoading,
  addBreakEntry,
  saveTimeEntryInput,
  setBreakEntryFormLoading,
  openBreakEntryForm,
  setIsQuickFindEnabled,
} from '../../../store/breakEntriesSlice';
import {
  setPageMessage,
  selectUnsavedChangesModal,
  closeUnsavedChangesModal,
} from '../../../store/uiSlice';
import { BreakEntry } from '../../../types';
import { mapErrorCodeToNls } from '../../../utils';
import BreakEntryForm from './BreakEntryForm';
import { useCreateBreakEntry } from '../hooks/useCreateBreakEntry';
import { UnsavedChangesModal } from '../../../components/UnsavedChangesModal';

interface BreakEntryFormContainerProps {
  onSave?: (data: BreakEntry) => void;
  onClose?: () => void;
  open?: boolean;
  workerId?: string;
  employeeId?: string | null;
}

const BreakEntryFormContainer: React.FC<BreakEntryFormContainerProps> = ({
  onSave,
  onClose,
  open,
  workerId,
  employeeId = null,
}) => {
  const dispatch = useDispatch();
  const logger = useLoggingConfig();
  const isOpen = useSelector(selectBreakEntryFormIsOpen);
  const isLoading = useSelector(selectBreakEntryFormIsLoading);
  const initialData = useSelector(selectCurrentBreakEntry);
  const unsavedChangesModal = useSelector(selectUnsavedChangesModal);
  const submittedDataRef = useRef<BreakEntry | null>(null);
  const track = useTracking();
  const trackingPoints = useBreakEntryTrackingPoints();

  const {
    isEnabled: isPostR2ReleaseTimeExperienceEnabled,
    settled: isPostR2ReleaseTimeExperienceEnabledSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_R2_RELEASE,
    defaultValue: false,
  });
  const isQuickfindEnabledSet = useAppSelector(
    (state) => state.breakEntries.isQuickFindEnabled,
  );
  useEffect(() => {
    if (
      isPostR2ReleaseTimeExperienceEnabledSettled &&
      isQuickfindEnabledSet === undefined
    ) {
      dispatch(setIsQuickFindEnabled(isPostR2ReleaseTimeExperienceEnabled));
    }
  }, [
    isPostR2ReleaseTimeExperienceEnabled,
    dispatch,
    isQuickfindEnabledSet,
    isPostR2ReleaseTimeExperienceEnabledSettled,
  ]);

  const { createBreakEntry, loading, error } = useCreateBreakEntry({
    onSuccess: (timeEntries) => {
      logger.info('Break entry created successfully:', { timeEntries });
      // Set loading to false on success
      dispatch(setBreakEntryFormLoading(false));
      // Close the form on successful API call
      dispatch(closeBreakEntryForm());
      // Call onSave with the submitted data
      if (submittedDataRef.current) {
        onSave?.(submittedDataRef.current);
        submittedDataRef.current = null;
      }
    },
    onError: (error) => {
      logger.error('Error creating break entry:', { error: String(error) });
      // Set loading to false on error
      dispatch(setBreakEntryFormLoading(false));

      // Extract error code from error message or use the full error as code

      // Show page message with error
      dispatch(
        setPageMessage({
          show: true,
          type: 'error',
          message: error,
          title: error,
        }),
      );
      // Keep form open on error so user can retry
    },
  });

  // Separate hook for "Save & New" functionality that doesn't close the form
  const { createBreakEntry: createBreakEntryForSaveAndNew } =
    useCreateBreakEntry({
      onSuccess: (timeEntries) => {
        logger.info('Break entry created successfully for Save & New:', {
          timeEntries,
        });
        // Set loading to false on success but don't close the form
        dispatch(setBreakEntryFormLoading(false));
        // Don't call onSave here since we want to keep the form open
      },
      onError: (error) => {
        logger.error('Error creating break entry for Save & New:', {
          error: String(error),
        });
        // Set loading to false on error
        dispatch(setBreakEntryFormLoading(false));

        // Show page message with error
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: error,
            title: error,
          }),
        );
      },
    });

  const handleClose = useCallback(() => {
    dispatch(closeBreakEntryForm());
    onClose?.();
  }, [dispatch, onClose]);

  const discardUnSavedChanges = useCallback(() => {
    if (unsavedChangesModal.pendingActionType) {
      // Handle different action types
      switch (unsavedChangesModal.pendingActionType) {
        case 'closeBreakEntryForm':
          handleClose();
          break;
        case 'saveAndClose':
          // This would need to be handled by the form component
          break;
        default:
          break;
      }
    }
    dispatch(closeUnsavedChangesModal());
  }, [unsavedChangesModal.pendingActionType, dispatch, handleClose]);

  const respectUnsavedChanges = useCallback(() => {
    dispatch(closeUnsavedChangesModal());
  }, [dispatch]);

  const handleSave = useCallback(
    async (data: BreakEntry) => {
      try {
        // Set loading to true when API call starts
        dispatch(setBreakEntryFormLoading(true));

        // Derive assigneeId from the saved contact
        const derivedAssigneeId = data.contact?.id;

        // Store data for success callback
        submittedDataRef.current = data;

        // Add to entries list
        // dispatch(addBreakEntry(data));

        // Call API - the hook will handle the timeEntryInput formatting
        createBreakEntry(data, derivedAssigneeId);
      } catch (error) {
        logger.error('Error saving break entry:', { error: String(error) });
        // Set loading to false on synchronous error
        dispatch(setBreakEntryFormLoading(false));

        // Extract error code from error message or use the full error as code
        const errorCode = String(error).includes(' ')
          ? String(error).split(' ')[0]
          : String(error);
        const titleNlsKey = mapErrorCodeToNls(errorCode);

        // Show page message with error
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: String(error),
            titleNlsKey,
            descriptionNlsKey: 'breaks.api.save.error.description',
          }),
        );
      }
    },
    [dispatch, onSave, createBreakEntry, logger],
  );

  const handleSaveAndNew = useCallback(
    async (data: BreakEntry) => {
      try {
        // Set loading to true when API call starts
        dispatch(setBreakEntryFormLoading(true));

        // Derive assigneeId from the saved contact
        const derivedAssigneeId = data.contact?.id;

        // Add to entries list
        dispatch(addBreakEntry(data));

        // Call API - the hook will handle the timeEntryInput formatting
        createBreakEntryForSaveAndNew(data, derivedAssigneeId);

        // Note: We don't close the form here, just let the form reset
        // The form will be reset in the useBreakEntryForm hook after successful save
      } catch (error) {
        logger.error('Error saving break entry:', { error: String(error) });
        // Set loading to false on synchronous error
        dispatch(setBreakEntryFormLoading(false));

        // Extract error code from error message or use the full error as code
        const errorCode = String(error).includes(' ')
          ? String(error).split(' ')[0]
          : String(error);
        const titleNlsKey = mapErrorCodeToNls(errorCode);

        // Show page message with error
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: String(error),
            titleNlsKey,
            descriptionNlsKey: 'breaks.api.save.error.description',
          }),
        );
      }
    },
    [dispatch, createBreakEntryForSaveAndNew, logger],
  );

  useEffect(() => {
    if (open && !isOpen) {
      dispatch(openBreakEntryForm());
      track(trackingPoints.ADD_BREAK_FROM_ADD_TIME);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dispatch]);

  return (
    <>
      <BreakEntryForm
        open={isOpen}
        onClose={handleClose}
        onSave={handleSave}
        onSaveAndNew={handleSaveAndNew}
        initialData={initialData || { contact: { id: workerId } } || undefined}
        employeeId={employeeId}
      />
      <UnsavedChangesModal
        open={unsavedChangesModal.isOpen}
        onYesClick={respectUnsavedChanges}
        onNoClick={discardUnSavedChanges}
        onClose={respectUnsavedChanges}
      />
    </>
  );
};

export default BreakEntryFormContainer;
