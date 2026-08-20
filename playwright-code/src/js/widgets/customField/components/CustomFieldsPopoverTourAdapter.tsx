import React, { useState, useEffect, useMemo } from 'react';
import { useSandbox } from '@payroll/quicksand';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { CustomFieldTourSteps } from 'src/js/common/tourSteps';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';

interface CustomFieldsPopoverTourAdapterProps {
  open: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

const CustomFieldsPopoverTourAdapter: React.FC<
  CustomFieldsPopoverTourAdapterProps
> = ({ open = false, onClose, onFinish }) => {
  const sandbox = useSandbox();
  const steps = useMemo(() => CustomFieldTourSteps(), []);

  // Popover instrumentation configuration
  const instrumentationConfig = useMemo(
    () => ({
      screen: 'Custom Fields Tour',
      previous_screen: 'Custom Fields',
      object_detail: 'custom_fields_tour',
      ui_object_detail: 'custom_fields_tour_popover',
      popoverHeading: 'Custom Fields Tour',
      additionalContext: {
        totalSteps: steps.length,
        tourType: 'custom_fields',
      },
    }),
    [steps.length],
  );

  // Popover instrumentation
  const {
    logPopoverOpen,
    logPopoverClose,
    logTourStepChange,
    logTourComplete,
  } = usePopoverInstrumentation(instrumentationConfig);

  // Build the steps array with anchorEl for each step using useMemo
  const tourSteps: GeneralPopoverTourStep[] = useMemo(
    () =>
      steps.map((step) => {
        let anchorEl: HTMLElement | null = null;

        // Try to find element using the step's target selector
        if (step.targetSelector) {
          anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
        }

        // Fallback: if no element found, use document.body
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

  // Log tour open when component mounts with open=true
  useEffect(() => {
    if (open) {
      const additionalData = {
        popoverHeading: tourSteps[0]?.title || 'Custom Fields Tour',
        stepHeading: tourSteps[0]?.title || 'Custom Fields Tour',
        currentStep: 0,
        totalSteps: tourSteps.length,
        action: 'tour_opened',
        tourType: 'custom_fields',
      };
      logPopoverOpen(additionalData);
    }
  }, [open, tourSteps.length, logPopoverOpen, tourSteps]);

  // Custom step change handler for instrumentation
  const handleStepChange = (newStep: number) => {
    const additionalData = {
      popoverHeading: tourSteps[newStep]?.title || 'Custom Fields Tour',
      stepHeading: tourSteps[newStep]?.title || 'Custom Fields Tour',
      fromStep: 0,
      toStep: newStep,
      totalSteps: tourSteps.length,
      tourType: 'custom_fields',
    };

    sandbox.logger.info('Custom Fields Tour step change:', {
      from: 0,
      to: newStep,
      totalSteps: tourSteps.length,
      tourType: 'custom_fields',
    });
    logTourStepChange(newStep, tourSteps.length, additionalData);
  };

  // Custom finish handler
  const handleTourFinish = () => {
    const additionalData = {
      popoverHeading:
        tourSteps[tourSteps.length - 1]?.title || 'Custom Fields Tour',
      stepHeading:
        tourSteps[tourSteps.length - 1]?.title || 'Custom Fields Tour',
      currentStep: tourSteps.length - 1,
      totalSteps: tourSteps.length,
      completionStatus: 'success',
      tourType: 'custom_fields',
    };

    sandbox.logger.info(
      'Custom Fields tour completed successfully',
      additionalData,
    );
    logTourComplete(additionalData);
    onFinish?.();
  };

  // Custom close handler that always allows closing when user explicitly closes the tour
  const handleTourClose = () => {
    const additionalData = {
      popoverHeading: tourSteps[0]?.title || 'Custom Fields Tour',
      stepHeading: tourSteps[0]?.title || 'Custom Fields Tour',
      currentStep: 0,
      totalSteps: tourSteps.length,
      action: 'tour_closed',
      closeReason: 'user_initiated',
      tourType: 'custom_fields',
    };
    logPopoverClose(additionalData);
    onClose?.();
  };

  return open ? (
    <GeneralPopoverTour
      open={open}
      steps={tourSteps}
      onClose={handleTourClose}
      onFinish={handleTourFinish}
      onStepChange={handleStepChange}
    />
  ) : null;
};

export default CustomFieldsPopoverTourAdapter;
