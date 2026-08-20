// Adapter for TimeClockPopover using GeneralPopoverTour
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { TimeClockTourSteps, Omit } from 'src/js/common/tourSteps';

import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from '../../common/GeneralPopoverTour/GeneralPopoverTour';

interface TimeClockPopoverTourAdapterProps {
  open: boolean;
  onClose: () => void;
  targetElement: HTMLElement | null;
  stepTargetElement?: HTMLElement | null;
  isClockedIn: boolean;
  tourContext: 'clock-in' | 'clock-out' | 'drawer-closed';
  onFinish?: () => void; // Add this prop for tour completion actions
}

const TimeClockPopoverTourAdapter: React.FC<
  TimeClockPopoverTourAdapterProps
> = ({
  open = false,
  onClose,
  targetElement,
  stepTargetElement,
  isClockedIn,
  tourContext,
  onFinish,
}) => {
  const sandbox = useSandbox();
  const [currentStep, setCurrentStep] = useState(0);

  // UX Preferences for tour completion
  const { setPreference } = useUxPreferences();

  // Memoize popover instrumentation configuration to prevent recreation
  const instrumentationConfig = useMemo(
    () => ({
      screen: 'Time Clock Tour', // Current popover heading
      previous_screen: 'Time Clock', // Previous popover heading (or screen name)
      object_detail: 'time_clock_tour',
      ui_object_detail: 'time_clock_tour_popover',
      popoverHeading: 'Time Clock Tour',
    }),
    [],
  );

  // Popover instrumentation
  const {
    logPopoverOpen,
    logPopoverClose,
    logTourStepChange,
    logTourComplete,
    logPopoverError,
  } = usePopoverInstrumentation(instrumentationConfig);

  // Select the correct tour steps
  const stepContents = TimeClockTourSteps();

  // Build the steps array with anchorEl for each step
  const steps: GeneralPopoverTourStep[] = (() => {
    let filteredSteps: (Omit<GeneralPopoverTourStep, 'anchorEl'> & {
      targetSelector?: string;
    })[];

    switch (tourContext) {
      case 'clock-in':
        // Don't show any steps for clock-in context
        filteredSteps = [];
        break;
      case 'clock-out':
        filteredSteps = stepContents.slice(0, 4); // Steps 0-3 (clock-out specific)
        break;
      case 'drawer-closed':
        filteredSteps = stepContents.slice(4); // Steps 4+ (drawer-closed specific)
        break;
      default:
        filteredSteps = []; // No fallback steps
        break;
    }

    return filteredSteps.map((step, idx) => {
      let anchorEl: HTMLElement | null = null;
      if (step.targetSelector) {
        anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
      }
      // Fallbacks
      if (!anchorEl && idx === 0 && stepTargetElement) {
        anchorEl = stepTargetElement;
      }
      if (!anchorEl) {
        anchorEl = targetElement;
      }

      return {
        ...step,
        anchorEl: anchorEl!,
      };
    });
  })();

  // Memoize step change handler to prevent recreation on every render
  const handleStepChange = useCallback(
    (newStep: number) => {
      const additionalData = {
        stepHeading: steps[newStep]?.title || '',
        popoverHeading: steps[newStep]?.title || 'Time Clock Tour',
        tourContext,
        isClockedIn,
        fromStep: currentStep,
        toStep: newStep,
        totalSteps: steps.length,
      };

      sandbox.logger.info('Time Clock Tour step change:', {
        from: currentStep,
        to: newStep,
        totalSteps: steps.length,
        tourContext,
        isClockedIn,
      });
      logTourStepChange(newStep, steps.length, additionalData);
      setCurrentStep(newStep);
    },
    [
      sandbox.logger,
      currentStep,
      steps.length,
      tourContext,
      isClockedIn,
      steps,
    ],
  );

  // Memoize tour finish handler to prevent recreation on every render
  const handleTourFinish = async () => {
    const additionalData = {
      stepHeading: steps[currentStep]?.title || 'Time Clock Tour',
      popoverHeading: steps[currentStep]?.title || 'Time Clock Tour',
      tourContext,
      isClockedIn,
      currentStep,
      totalSteps: steps.length,
      completionStatus: 'success',
    };

    try {
      if (tourContext === 'drawer-closed') {
        // This is the final context - set preference
        await setPreference(UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED, true);
        sandbox.logger.info(
          'Time Clock tour completed successfully',
          additionalData,
        );
        logTourComplete(additionalData);
      }
    } catch (error) {
      const errorMessage = String(error);
      const errorData = {
        ...additionalData,
        completionStatus: 'error',
        errorMessage,
        errorType: 'preference_save_error',
      };

      sandbox.logger.error('Failed to save time clock tour completion:', {
        error: errorMessage,
        ...errorData,
      });
      logPopoverError(errorMessage, errorData);
    }

    onFinish?.();
  };

  // Log popover open/close events
  useEffect(() => {
    if (open) {
      const openData = {
        stepHeading: steps[0]?.title || 'Time Clock Tour',
        popoverHeading: steps[0]?.title || 'Time Clock Tour',
        tourContext,
        isClockedIn,
        currentStep: 0,
        totalSteps: steps.length,
        action: 'tour_opened',
      };
      logPopoverOpen(openData);
    } else {
      const closeData = {
        stepHeading: steps[currentStep]?.title || 'Time Clock Tour',
        popoverHeading: steps[currentStep]?.title || 'Time Clock Tour',
        tourContext,
        isClockedIn,
        currentStep,
        totalSteps: steps.length,
        action: 'tour_closed',
      };
      logPopoverClose(closeData);
    }
  }, [
    open,
    logPopoverOpen,
    logPopoverClose,
    steps,
    currentStep,
    tourContext,
    isClockedIn,
  ]);

  // Don't render if we're still loading or determining clock status
  if (!open) {
    return null;
  }

  return (
    <GeneralPopoverTour
      open={open}
      steps={steps}
      onClose={onClose}
      onFinish={handleTourFinish}
      onStepChange={handleStepChange}
    />
  );
};

export default TimeClockPopoverTourAdapter;
