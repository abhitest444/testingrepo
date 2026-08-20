import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { BreakEntry } from '../../../types';
import { BREAK_LOGGING_CONSTANTS } from '../../../constants';

interface UseBreakEntryFormProps {
  onSave: (data: BreakEntry) => void;
  onClose: () => void;
  reset: UseFormReturn<BreakEntry>['reset'];
  onSaveAndNew?: (data: BreakEntry) => Promise<void>;
  isEditForm?: boolean;
}

export const useBreakEntryForm = ({
  onSave,
  onClose,
  reset,
  onSaveAndNew,
  isEditForm = false,
}: UseBreakEntryFormProps) => {
  const logger = useLoggingConfig();

  const handleFormSubmit = useCallback(
    async (data: BreakEntry) => {
      try {
        if (isEditForm) {
          logger.info(
            BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
              .BREAK_ENTRY_EDIT_FORM_SAVE_CLICKED,
          );
        } else {
          logger.info(
            BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
              .BREAK_ENTRY_FORM_SAVE_CLICKED,
          );
        }
        onSave(data);
      } catch (error) {
        const errorConstant = isEditForm
          ? BREAK_LOGGING_CONSTANTS.FORM_STATE
              .BREAK_ENTRY_EDIT_FORM_SUBMISSION_FAILED
          : BREAK_LOGGING_CONSTANTS.FORM_STATE
              .BREAK_ENTRY_FORM_SUBMISSION_FAILED;
        logger.error(errorConstant, {
          error: String(error),
        });
      }
    },
    [onSave, onClose, reset, logger, isEditForm],
  );

  const handleSaveAndNew = useCallback(
    async (data: BreakEntry) => {
      try {
        logger.info(
          BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS
            .BREAK_ENTRY_FORM_SAVE_AND_NEW_CLICKED,
        );
        if (onSaveAndNew) {
          // Use the dedicated save and new function if provided
          await onSaveAndNew(data);
        } else {
          // Fallback to regular save
          await onSave(data);
        }
        // Reset form for new entry
        reset();
      } catch (error) {
        logger.error(
          BREAK_LOGGING_CONSTANTS.FORM_STATE.BREAK_ENTRY_FORM_SUBMISSION_FAILED,
          {
            error: String(error),
          },
        );
      }
    },
    [onSave, onSaveAndNew, reset, logger],
  );

  return {
    handleFormSubmit,
    handleSaveAndNew,
  };
};
