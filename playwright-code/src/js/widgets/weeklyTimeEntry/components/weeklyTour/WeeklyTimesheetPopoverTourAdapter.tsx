import React, { useState, useEffect, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { WeeklyTimesheetTourSteps } from 'src/js/common/tourSteps';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { useTourNavigation } from './tourUtils/tourNavigationUtils';
import { useTourElementUtils } from './tourUtils/tourElementUtils';
import { useTourObserverUtils } from './tourUtils/tourObserverUtils';
import { useAppDispatch } from '../../store';
import { setWeeklyTimesheetTourCompleted } from '../../store/timeEntrySettingsSlice';

interface WeeklyTimesheetPopoverTourAdapterProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
  targetElement?: HTMLElement;
  stepTargetElement?: HTMLElement;
}

const WeeklyTimesheetPopoverTourAdapter: React.FC<
  WeeklyTimesheetPopoverTourAdapterProps
> = ({ open = false, onClose, onFinish, targetElement, stepTargetElement }) => {
  const sandbox = useSandbox();
  const isWFSUser = isWorkforceEnvironment(sandbox as QuickbooksOnlineSandbox);
  const stepOffset = isWFSUser ? 1 : 0;
  const timeCategoryStepIndex = isWFSUser ? 0 : 1;
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [dynamicSteps, setDynamicSteps] = useState<GeneralPopoverTourStep[]>(
    [],
  );
  const allSteps = useMemo(() => WeeklyTimesheetTourSteps(), []);
  const steps = useMemo(
    () => allSteps.slice(stepOffset),
    [allSteps, stepOffset],
  );

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
    screen: 'Weekly Timesheet Tour', // Current popover heading
    previous_screen: 'Weekly Timesheet', // Previous popover heading (or screen name)
    object_detail: 'weekly_timesheet_tour',
    ui_object_detail: 'weekly_timesheet_tour_popover',
    popoverHeading: 'Weekly Timesheet Tour',
  });

  // Initialize utility hooks
  const { createBaseSteps } = useTourElementUtils();
  const { setupMenuObserver } = useTourObserverUtils();
  const {
    handleBackwardStep2To1,
    handleBackwardStep3To2,
    handleBackwardStep4To3,
    handleForwardStep1To2,
    handleForwardStep2To3,
    handleForwardStep3To4,
  } = useTourNavigation();

  const toAbsoluteStep = (step: number) => step + stepOffset;

  // Build the steps array with anchorEl for each step
  // This creates the tour steps with proper anchor elements for positioning
  const tourSteps: GeneralPopoverTourStep[] = useMemo(() => {
    // Create base steps with default anchor elements (team member dropdown, time category selector, etc.)
    const baseSteps = createBaseSteps(steps, targetElement, stepTargetElement);

    // Use dynamic steps if available (when menu is open), otherwise use base steps
    // Dynamic steps are used when the super search menu is open to position tour beside it
    return dynamicSteps.length > 0 ? dynamicSteps : baseSteps;
  }, [
    targetElement,
    stepTargetElement,
    open,
    dynamicSteps,
    steps,
    createBaseSteps,
  ]);

  // Log popover open/close events
  useEffect(() => {
    if (open) {
      logPopoverOpen({
        stepHeading: steps[0]?.title || 'Weekly Timesheet Tour',
        popoverHeading: steps[0]?.title || 'Weekly Timesheet Tour',
      });
    } else {
      logPopoverClose({
        stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
      });
    }
  }, [open, currentStep, steps]); // Only depend on open state + current step

  // Reset tour state when it opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setDynamicSteps([]);
      if (isWFSUser) {
        handleForwardStep1To2(
          0,
          steps,
          targetElement,
          stepTargetElement,
          setDynamicSteps,
          setCurrentStep,
          setupMenuObserver,
          timeCategoryStepIndex,
        );
      }
    }
  }, [open]);

  // Don't render if tour is closed
  if (!open) {
    return null;
  }

  // Main step change handler - manages navigation between tour steps
  const handleStepChange = (newStep: number) => {
    const currentAbsoluteStep = toAbsoluteStep(currentStep);
    const newAbsoluteStep = toAbsoluteStep(newStep);
    sandbox.logger.info('Tour step change:', {
      from: currentStep,
      to: newStep,
      totalSteps: steps.length,
    });
    logTourStepChange(newStep, steps.length, {
      stepHeading: steps[newStep]?.title || '',
      popoverHeading: steps[newStep]?.title || 'Weekly Timesheet Tour',
    });
    // Handle backward navigation (user clicks "Back" button)
    if (newStep < currentStep) {
      // Step 2 → Step 1: Close super search menu and reset to original steps
      if (currentAbsoluteStep === 1 && newAbsoluteStep === 0) {
        handleBackwardStep2To1(setDynamicSteps);
        setCurrentStep(newStep);
        return;
      }

      // Step 3 → Step 2: Clear cell selection, open super search menu, wait for observer
      if (currentAbsoluteStep === 2 && newAbsoluteStep === 1) {
        const waitingForObserver = handleBackwardStep3To2(
          newStep,
          setupMenuObserver,
          steps,
          setDynamicSteps,
          setCurrentStep,
          timeCategoryStepIndex,
        );
        if (waitingForObserver) {
          // Observer is waiting for menu to appear, don't set step yet
          return;
        }
        setCurrentStep(newStep);
        return;
      }

      // Step 4 → Step 3: Select cell to show details panel
      if (currentAbsoluteStep === 3 && newAbsoluteStep === 2) {
        handleBackwardStep4To3(newStep, setCurrentStep);
        return;
      }

      // Default backward navigation
      setCurrentStep(newStep);
      return;
    }

    // Handle forward navigation (user clicks "Next" button)
    if (currentAbsoluteStep === 0 && newAbsoluteStep === 1) {
      // Step 1 → Step 2: Open super search menu and position tour beside it
      handleForwardStep1To2(
        newStep,
        steps,
        targetElement,
        stepTargetElement,
        setDynamicSteps,
        setCurrentStep,
        setupMenuObserver,
        timeCategoryStepIndex,
      );
    } else if (currentAbsoluteStep === 1 && newAbsoluteStep === 2) {
      // Step 2 → Step 3: Select a time cell to show details panel
      handleForwardStep2To3(newStep, setCurrentStep);
    } else if (currentAbsoluteStep === 2 && newAbsoluteStep === 3) {
      // Step 3 → Step 4: Deselect cell to hide details panel
      handleForwardStep3To4(newStep, setCurrentStep);
    } else {
      // Default forward navigation
      setCurrentStep(newStep);
    }
  };

  // Custom finish handler - called when user clicks "Done" on final step
  const handleTourFinish = async () => {
    try {
      // Set preference to true when user completes the tour
      await setPreference(
        UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED,
        true,
      );
      dispatch(setWeeklyTimesheetTourCompleted(true));

      sandbox.logger.info('Weekly timesheet tour completed successfully');
      logTourComplete({
        stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
      });
    } catch (error) {
      const errorMessage = String(error);

      sandbox.logger.error('Failed to save weekly timesheet tour completion:', {
        error: errorMessage,
      });
      logPopoverError(errorMessage, {
        stepHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
        popoverHeading: steps[currentStep]?.title || 'Weekly Timesheet Tour',
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

export default WeeklyTimesheetPopoverTourAdapter;
