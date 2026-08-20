import { useCallback } from 'react';
import { useAppDispatch } from '../../store';
import { setSelectedUploadOption } from '../../store/step1Slice';
import { setIsUploading } from '../../store/excelDataSlice';
import {
  setTimeEntries,
  setSaveError,
  setIsInitialLoadError,
} from '../../store/reviewSlice';
import { setCurrentStep } from '../../store/progressSlice';
import { useEnhancedSheetJSParser } from '../../hooks/useEnhancedSheetJSParser';

const useFileUpload = (): {
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'xls' | 'scan',
  ) => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const { parseTimesheetFile } = useEnhancedSheetJSParser();

  const handleFileUpload = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      type: 'xls' | 'scan',
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      dispatch(setSelectedUploadOption(type));
      dispatch(setIsUploading(true));

      try {
        // Both xls and scan use the same file processing
        await parseTimesheetFile(file, 'STANDARD');

        // Navigate to step 2 (mapping)
        dispatch(setIsUploading(false));
        // Navigate to processing step (1.5) which will auto-map fields
        dispatch(setCurrentStep(1.5));
      } catch (error) {
        dispatch(setIsUploading(false));

        // Handle Excel upload/parsing errors - navigate to Step 6 (failure screen)
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to upload or parse the Excel file';
        dispatch(setSaveError(`Excel Upload Error: ${errorMessage}`));
        dispatch(setIsInitialLoadError(true));
        dispatch(setCurrentStep(6));
      }
    },
    [dispatch, parseTimesheetFile],
  );

  return { handleFileUpload };
};

export default useFileUpload;
