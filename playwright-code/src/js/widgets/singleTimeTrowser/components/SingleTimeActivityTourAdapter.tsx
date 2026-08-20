import React, { useState, useEffect, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { SingleTimeActivityTourSteps } from 'src/js/common/tourSteps';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';

interface SingleTimeActivityTourAdapterProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
  targetElement?: HTMLElement;
  stepTargetElement?: HTMLElement;
}

const SingleTimeActivityTourAdapter: React.FC<
  SingleTimeActivityTourAdapterProps
> = ({ open = false, onClose, onFinish, targetElement, stepTargetElement }) => {
  const sandbox = useSandbox();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = SingleTimeActivityTourSteps();

  // UX Preferences for tour completion
  const { setPreference } = useUxPreferences();

  // Popover instrumentation
  const {
    logPopoverOpen,
    logPopoverClose,
    logTourStepChange,
    logTourComplete,
    logPopoverError,
  } = usePopoverInstrumentation({
    screen: 'Single Time Activity Tour', // Current popover heading
    previous_screen: 'Single Time Activity', // Previous popover heading (or screen name)
    object_detail: 'single_time_activity_tour',
    ui_object_detail: 'single_time_activity_tour_popover',
    popoverHeading: 'Single Time Activity Tour',
  });

  // Build the steps array with anchorEl for each step
  // This creates the tour steps with proper anchor elements for positioning
  const tourSteps: GeneralPopoverTourStep[] = useMemo(() => {
    // For single time entry, we'll use the target element as the anchor
    // since the tour steps are designed for modal display rather than popover
    const anchorElement = targetElement || stepTargetElement;

    const result: GeneralPopoverTourStep[] = steps.map((step, index) => {
      // Try to find the target element using targetSelector if no anchor element is provided
      let stepAnchorElement = anchorElement;

      if (step.targetSelector) {
        const foundElement = document.querySelector(step.targetSelector);
        if (foundElement) {
          stepAnchorElement = foundElement as HTMLElement;
        } else {
          sandbox.logger.warn(
            `SingleTimeActivityTourAdapter - Could not find element with selector: ${step.targetSelector}`,
          );
        }
      }

      // If still no anchor element, use a fallback (body element)
      if (!stepAnchorElement) {
        stepAnchorElement = document.body;
        sandbox.logger.warn(
          'SingleTimeActivityTourAdapter - No anchor element found, using document.body as fallback',
        );
      }

      return {
        id: step.id,
        title: step.title,
        description: step.description,
        buttonText: step.buttonText,
        position: step.position,
        alignment: step.alignment,
        distance: step.distance,
        skidding: step.skidding,
        bgcolor: step.bgcolor,
        anchorEl: stepAnchorElement,
        lottieData: step.lottieData,
        arrowColor: step.arrowColor,
      };
    });

    return result;
  }, [targetElement, stepTargetElement, steps, sandbox.logger]);

  // Log popover open/close events
  useEffect(() => {
    if (open) {
      logPopoverOpen({
        stepHeading: steps[0]?.title || 'Single Time Activity Tour',
        popoverHeading: steps[0]?.title || 'Single Time Activity Tour',
      });
    } else {
      logPopoverClose({
        stepHeading: steps[currentStep]?.title || 'Single Time Activity Tour',
        popoverHeading:
          steps[currentStep]?.title || 'Single Time Activity Tour',
      });
    }
  }, [open, currentStep, logPopoverOpen, logPopoverClose, steps]); // Include all dependencies

  // Reset tour state when it opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  // Don't render if tour is closed
  if (!open) {
    return null;
  }

  // Main step change handler - manages navigation between tour steps
  const handleStepChange = (newStep: number) => {
    sandbox.logger.info('Single Time Activity Tour step change:', {
      from: currentStep,
      to: newStep,
      totalSteps: steps.length,
    });
    logTourStepChange(newStep, steps.length, {
      stepHeading: steps[newStep]?.title || '',
      popoverHeading: steps[newStep]?.title || 'Single Time Activity Tour',
    });

    // For single time entry tour, we have simple forward/backward navigation
    // since it's typically a single step or simple multi-step tour
    setCurrentStep(newStep);
  };

  // Custom finish handler - called when user clicks "Done" on final step
  const handleTourFinish = async () => {
    try {
      // Set preference to true when user completes the tour
      await setPreference(
        UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED,
        true,
      );

      sandbox.logger.info('Single Time Activity tour completed successfully');
      logTourComplete({
        stepHeading: steps[currentStep]?.title || 'Single Time Activity Tour',
        popoverHeading:
          steps[currentStep]?.title || 'Single Time Activity Tour',
      });
    } catch (error) {
      const errorMessage = String(error);

      sandbox.logger.error(
        'Failed to save single time activity tour completion:',
        {
          error: errorMessage,
        },
      );
      logPopoverError(errorMessage, {
        stepHeading: steps[currentStep]?.title || 'Single Time Activity Tour',
        popoverHeading:
          steps[currentStep]?.title || 'Single Time Activity Tour',
      });
    }

    onFinish?.();
  };

  // Only render if we have valid steps
  if (tourSteps.length === 0) {
    return null;
  }

  return (
    <GeneralPopoverTour
      open={open}
      steps={tourSteps}
      onClose={onClose}
      onFinish={handleTourFinish}
      onStepChange={handleStepChange}
    />
  );
};

export default SingleTimeActivityTourAdapter;
