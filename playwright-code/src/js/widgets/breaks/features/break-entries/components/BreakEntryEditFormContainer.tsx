import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import {
  closeBreakEntryEditForm,
  selectBreakEntryEditFormIsOpen,
  selectCurrentBreakEntryEdit,
  selectBreakEntryEditFormIsLoading,
  setBreakEntryEditFormLoading,
  openBreakEntryEditForm,
  setIsQuickFindEnabled,
} from '../../../store/breakEntriesSlice';
import {
  setPageMessage,
  selectUnsavedChangesModal,
  closeUnsavedChangesModal,
} from '../../../store/uiSlice';
import { BreakEntry } from '../../../types';
import { useUpdateBreakEntry } from '../hooks/useUpdateBreakEntry';
import { UnsavedChangesModal } from '../../../components/UnsavedChangesModal';

import BreakEntryEditForm from './BreakEntryEditForm';

interface BreakEntryEditFormContainerProps {
  onSave?: (data: BreakEntry) => void;
  onClose?: () => void;
  open?: boolean;
}

const BreakEntryEditFormContainer: React.FC<
  BreakEntryEditFormContainerProps
> = ({ onSave, onClose, open }) => {
  const dispatch = useDispatch();
  const logger = useLoggingConfig();
  const isOpen = useSelector(selectBreakEntryEditFormIsOpen);
  const isLoading = useSelector(selectBreakEntryEditFormIsLoading);
  const initialData = useSelector(selectCurrentBreakEntryEdit);
  const unsavedChangesModal = useSelector(selectUnsavedChangesModal);
  const submittedDataRef = useRef<BreakEntry | null>(null);

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

  const {
    updateBreakEntry,
    loading: updateLoading,
    error: updateError,
  } = useUpdateBreakEntry({
    onSuccess: (data) => {
      logger.info('Break entry updated successfully:', { data });
      dispatch(setBreakEntryEditFormLoading(false));
      dispatch(closeBreakEntryEditForm());

      if (submittedDataRef.current) {
        onSave?.(submittedDataRef.current);
        submittedDataRef.current = null;
      }
    },
    onError: (error) => {
      logger.error('Error updating break entry:', { error });
      dispatch(setBreakEntryEditFormLoading(false));

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
    dispatch(closeBreakEntryEditForm());
    onClose?.();
  }, [dispatch, onClose]);

  const discardUnSavedChanges = useCallback(() => {
    if (unsavedChangesModal.pendingActionType) {
      // Handle different action types
      switch (unsavedChangesModal.pendingActionType) {
        case 'closeBreakEntryEditForm':
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
        // Set loading to true when save starts
        dispatch(setBreakEntryEditFormLoading(true));

        // Store data for success callback
        submittedDataRef.current = data;

        // Check if we have the required data for update
        if (!initialData?.timeEntryId) {
          throw new Error('Time entry ID is required for updates');
        }

        // Call the update function
        updateBreakEntry(data, initialData?.timeEntryId);
      } catch (error) {
        logger.error('Error saving break entry:', { error: String(error) });
        // Set loading to false on error
        dispatch(setBreakEntryEditFormLoading(false));

        // Show page message with error
        dispatch(
          setPageMessage({
            show: true,
            type: 'error',
            message: String(error),
            title: String(error),
          }),
        );
        // Keep form open on error so user can retry
      }
    },
    [dispatch, onSave, logger, updateBreakEntry, initialData],
  );

  useEffect(() => {
    if (open && !isOpen) {
      dispatch(openBreakEntryEditForm());
    }
  }, [open, dispatch]);

  return (
    <>
      <BreakEntryEditForm
        open={isOpen}
        onClose={handleClose}
        onSave={handleSave}
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

export default BreakEntryEditFormContainer;
