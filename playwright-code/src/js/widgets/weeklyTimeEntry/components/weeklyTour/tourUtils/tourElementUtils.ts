import { useSandbox } from '@payroll/quicksand';
import { GeneralPopoverTourStep } from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';

export const useTourElementUtils = () => {
  const sandbox = useSandbox();

  // Helper function to find anchor element for a tour step
  // This determines where the tour popover should be positioned for each step
  const findAnchorElement = (
    step: any,
    idx: number,
    targetElement?: HTMLElement,
    stepTargetElement?: HTMLElement,
  ): HTMLElement => {
    let anchorEl: HTMLElement | null = null;

    // First try to find element using the step's target selector (e.g., '[data-testid="weekly-team-member-dropdown"]')
    if (step.targetSelector) {
      anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
    }

    // Fallback chain: if target selector doesn't work, try other options
    if (!anchorEl && idx === 0 && stepTargetElement) {
      // For first step, use the provided stepTargetElement if available
      anchorEl = stepTargetElement;
    }
    if (!anchorEl && targetElement) {
      // Use the general targetElement as fallback
      anchorEl = targetElement;
    }

    // Final fallback: if no element found, use document.body
    if (!anchorEl) {
      anchorEl = document.body;
    }

    return anchorEl!;
  };

  // Helper function to create base steps with anchor elements
  // This converts the tour step definitions into actual tour steps with positioned anchor elements
  const createBaseSteps = (
    steps: any[],
    targetElement?: HTMLElement,
    stepTargetElement?: HTMLElement,
  ): GeneralPopoverTourStep[] =>
    steps.map((step, idx) => ({
      ...step,
      // Find the appropriate anchor element for each step
      anchorEl: findAnchorElement(step, idx, targetElement, stepTargetElement),
    }));

  return {
    findAnchorElement,
    createBaseSteps,
  };
};
