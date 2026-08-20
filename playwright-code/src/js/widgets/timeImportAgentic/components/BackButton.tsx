import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@ids-ts/button';
import { Sandbox } from 'src/js/common/sandbox';
import { setCurrentStep } from '../store/progressSlice';
import { resetAllSlices } from '../store/globalActions';
import { useAIImportPreferences } from '../hooks/useAIImportPreferences';

interface BackButtonProps {
  sandbox?: Sandbox;
}

const BackButton: React.FC<BackButtonProps> = ({ sandbox }) => {
  const dispatch = useDispatch();
  const currentStep = useSelector((state: any) => state.progress.currentStep);

  // Always call hooks unconditionally - React hooks rules
  // Use a dummy sandbox if not provided (the hook's methods will use optional chaining anyway)
  const aiPrefs = useAIImportPreferences(sandbox || ({} as Sandbox));

  const handleBack = () => {
    // Step 1 = Upload, Step 1.5 = Processing, Step 2 = Mapping, Step 3 = Field Mapping, Step 4 = Preferences, Step 5 = Review, Step 6 = Complete
    if (currentStep > 1) {
      let previousStep: number;

      // Special case: Going from Step 2 back to Step 1 - reset ALL state FIRST for complete fresh start (same as onClose)
      if (currentStep === 2) {
        // Clear USER-scoped sandbox storage (column mappings, employee mappings, 8-hour limit)
        aiPrefs?.clearAll();

        // Reset everything and go back to Step 1 (fresh start)
        // This single action will reset ALL slices via their extraReducers
        // REALM-scoped preferences (preferences seen, skip field mapping) remain in UX Preferences
        dispatch(resetAllSlices());
        return; // Exit early - resetAllSlices resets progress to step 1
      }

      // Special case: From Review (Step 5), go back to Mapping (Step 2)
      if (currentStep === 5) {
        previousStep = 2;
      }
      // Handle decimal steps (like 1.5)
      else if (Math.floor(currentStep) !== currentStep) {
        previousStep = Math.floor(currentStep);
      }
      // Default: go back one step
      else {
        previousStep = currentStep - 1;
      }

      dispatch(setCurrentStep(previousStep));
    }
  };

  // Don't render on step 1 or step 1.5 (processing step)
  if (currentStep <= 1.5) {
    return null;
  }

  // Get button text based on current step
  const getButtonText = () => {
    if (currentStep === 5) {
      return 'Back to mapping';
    }
    return 'Back';
  };

  return (
    <Button
      priority="tertiary"
      purpose="standard"
      theme="gbsgexperimental"
      onClick={handleBack}
    >
      {getButtonText()}
    </Button>
  );
};

export default BackButton;
