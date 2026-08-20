import React from 'react';
import { CoachMarks } from '@ids-ts/guided-tour-tooltip';
import type { GuidedTourTooltipProps as GTTProps } from '@ids-ts/guided-tour-tooltip';
import { TooltipStepConfig, TourStep } from '../types';

interface BuildTooltipStepsParams {
  steps: TourStep[];
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  renderTooltipContent: (step: TourStep, index: number) => React.ReactNode;
  /** If true (default), sets lower z-index to hide tour under trowsers */
  shouldHideUnderTrowser?: boolean;
}

/**
 * Builds IDS-compatible step configurations for tooltip mode
 *
 * @param steps - Array of tour steps
 * @param onStepChange - Callback when step changes
 * @param onComplete - Callback when tour completes
 * @param renderMessageContent - Function to render the message content for each step
 */
export const buildTooltipSteps = ({
  steps,
  onStepChange,
  onComplete,
  renderTooltipContent,
  shouldHideUnderTrowser = true,
}: BuildTooltipStepsParams): TooltipStepConfig[] =>
  steps.map((step, index) => {
    const isLastStep = index === steps.length - 1;

    // Get rendered message content from parent
    const tooltipContent = renderTooltipContent(step, index);

    // IDS-compatible step config matching GTTStep interface
    const stepConfig: TooltipStepConfig = {
      targetElement: step.targetRef?.current || null,
      message: tooltipContent,
      // IDS defaults to 'Title' if falsy, so use space to bypass the fallback
      // Then hide with CSS className
      title: ' ',
      className: 'hide-tooltip-title',
      position: step.position || 'bottom',
      alignment: step.alignment || 'left',
      enableClickAway: true,
      onNextClick: onStepChange
        ? () => {
            // Execute custom onNext callback if provided
            if (step.onNext) {
              step.onNext();
            }
            // No custom onNext, proceed immediately
            onStepChange(index + 1);
          }
        : undefined,
      onBackClick: onStepChange
        ? () => {
            // Execute custom onBack callback if provided
            if (step.onBack) {
              step.onBack();
            }
            // No custom onBack, go back immediately
            onStepChange(index - 1);
          }
        : undefined,
      nextLabel: step.nextLabel || 'Next',
      backLabel: step.backLabel || 'Back',
    };

    // Inline style override applied to the IDS Position wrapper.
    // Combines two independent concerns:
    //   1. Trowser layering — tooltip needs `z-index: 999` so trowsers
    //      (~1050) cover it instead of the other way around.
    //   2. Optional per-step `tooltipOffset` — uses the CSS `translate`
    //      property (NOT `transform`) so it composes with IDS' own
    //      positioning transform instead of clobbering it.
    const positionStyle: React.CSSProperties = {};
    if (shouldHideUnderTrowser) {
      positionStyle.zIndex = 999;
    }
    if (step.tooltipOffset) {
      const x = step.tooltipOffset.x ?? 0;
      const y = step.tooltipOffset.y ?? 0;
      positionStyle.translate = `${x}px ${y}px`;
      positionStyle.zIndex = 99999999;
    }
    if (Object.keys(positionStyle).length > 0) {
      stepConfig.stylePosition = () => positionStyle;
    }

    // IMPORTANT: Only on the LAST step, set onClose to trigger completion
    // This is called by IDS when user clicks "Done" button (not the X button)
    // The X button uses the main GuidedTourTooltip's onClose prop instead
    if (isLastStep) {
      stepConfig.onClose = () => {
        // Mark tour as completed in storage (persistent + session)
        if (onComplete) {
          onComplete();
        }
      };
    }
    // Conditionally add CoachMarks overlay only if showOverlay is true
    if (step.showOverlay) {
      stepConfig.renderCoachMarks = (
        coachMarksProps: GTTProps & { children: React.ReactNode },
      ) => (
        <CoachMarks
          {...coachMarksProps}
          open={coachMarksProps.open ?? false}
          targetDomNode={step.targetRef!.current}
          borderRadius={8}
          padding={8}
        >
          {coachMarksProps.children}
        </CoachMarks>
      );
    }

    return stepConfig;
  });
