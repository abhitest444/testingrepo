import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { WeeklyTimesheetPageTourSteps } from 'src/js/common/tourSteps';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';

interface WeeklyTimesheetPageTourAdapterProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
  isWeeklyTimeEntry?: boolean;
}

const WeeklyTimesheetPageTourAdapter: React.FC<
  WeeklyTimesheetPageTourAdapterProps
> = ({ open = false, onClose, onFinish, isWeeklyTimeEntry = false }) => {
  const sandbox = useSandbox();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = WeeklyTimesheetPageTourSteps();

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
    screen: 'Weekly Timesheet Tour',
    previous_screen: 'Weekly Timesheet',
    object_detail: 'weekly_timesheet_page_tour',
    ui_object_detail: 'weekly_timesheet_page_tour_popover',
    popoverHeading: 'Weekly Timesheet Tour',
    additionalContext: {
      isWeeklyTimeEntry,
    },
  });

  // Build the steps array with anchorEl for each step
  const tourSteps: GeneralPopoverTourStep[] = useMemo(
    () =>
      steps.map((step, idx) => {
        let anchorEl: HTMLElement | null = null;

        // Try to find the target element based on the selector
        if (step.targetSelector) {
          anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
        }

        // Fallback to body if target not found
        if (!anchorEl) {
          anchorEl = document.body;
        }

        return {
          ...step,
          anchorEl,
        };
      }),
    [steps],
  );

  // Log popover open/close events
  useEffect(() => {
    if (open) {
      logPopoverOpen({
        stepHeading: steps[0]?.title || 'Weekly Timesheet Tour',
        popoverHeading: 'Weekly Timesheet Tour',
      });
    }
  }, [open, logPopoverOpen, steps]);

  // Handle step changes
  const handleStepChange = useCallback(
    (newStep: number) => {
      setCurrentStep(newStep);
      logTourStepChange(newStep, steps.length, {
        stepHeading: steps[newStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: 'Weekly Timesheet Tour',
      });
    },
    [logTourStepChange, steps],
  );

  // Custom finish handler - called when user clicks "Done" on final step
  const handleTourFinish = async () => {
    try {
      // Set preference to true when user completes the tour
      await setPreference(
        UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED,
        true,
      );

      // Log tour completion
      logTourComplete({
        stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: 'Weekly Timesheet Tour',
        tourType: 'weekly-timesheet-page',
        completionMethod: 'finish',
        isWeeklyTimeEntry,
      });

      sandbox.logger.info('Weekly Timesheet Page Tour completed successfully', {
        tourType: 'weekly-timesheet-page',
        completionMethod: 'finish',
        isWeeklyTimeEntry,
      });
    } catch (error) {
      const errorMessage = String(error);

      // Log error
      logPopoverError(errorMessage, {
        stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: 'Weekly Timesheet Tour',
        tourType: 'weekly-timesheet-page',
        completionMethod: 'finish',
        isWeeklyTimeEntry,
        error: errorMessage,
      });

      sandbox.logger.error(
        'Failed to save Weekly Timesheet Page tour preference',
        {
          error: errorMessage,
        },
      );
    }

    onFinish?.();
  };

  // Handle tour close (X button or escape)
  const handleTourClose = () => {
    logPopoverClose({
      stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
      popoverHeading: 'Weekly Timesheet Tour',
      tourType: 'weekly-timesheet-page',
      completionMethod: 'close',
      isWeeklyTimeEntry,
    });
    onClose();
  };

  // Only render if we have valid steps
  if (tourSteps.length === 0) {
    return null;
  }

  return (
    <GeneralPopoverTour
      open={open}
      steps={tourSteps}
      onClose={handleTourClose}
      onFinish={handleTourFinish}
      onStepChange={handleStepChange}
    />
  );
};

export default WeeklyTimesheetPageTourAdapter;
