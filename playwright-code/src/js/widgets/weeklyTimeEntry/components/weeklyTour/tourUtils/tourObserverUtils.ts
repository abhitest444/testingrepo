import { useSandbox } from '@payroll/quicksand';
import { GeneralPopoverTourStep } from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { createUpdatedSteps } from './tourNavigationUtils';

export const useTourObserverUtils = () => {
  const sandbox = useSandbox();

  // Helper function to setup menu observer
  // This watches for the super search menu to appear and then repositions the tour beside it
  const setupMenuObserver = (
    newStep: number,
    isBackward = false,
    steps?: any[],
    setDynamicSteps?: (steps: GeneralPopoverTourStep[]) => void,
    setCurrentStep?: (step: number) => void,
    timeCategoryStepIndex: number = 1,
  ) => {
    const observer = new MutationObserver((mutations) => {
      // Look for the super search menu using various selectors
      const superSearchMenu = document.querySelector(
        '[data-testid="super-search-context-menu"], [data-testid="super-search-menu"], [role="menu"], .super-search-menu, [data-testid*="menu"], .context-menu, .dropdown-menu, [class*="menu"], [class*="dropdown"], .WeeklySuperSerachstyles__Container',
      );

      // Also look for the specific weekly super search container
      const weeklySuperSearchContainer = document.querySelector(
        '[class*="WeeklySuperSerachstyles__Container"]',
      );
      const targetMenu = weeklySuperSearchContainer || superSearchMenu;

      // Check if menu is visible (offsetParent !== null means it's rendered and visible)
      if (targetMenu && (targetMenu as HTMLElement).offsetParent !== null) {
        // Menu found and visible, stop observing
        observer.disconnect();

        // Reposition tour beside the menu and move to the next step
        if (steps && setDynamicSteps && setCurrentStep) {
          const updatedSteps = createUpdatedSteps(
            steps,
            targetMenu as HTMLElement,
            timeCategoryStepIndex,
          );
          setDynamicSteps(updatedSteps);
          setCurrentStep(newStep);
        }
      }
    });

    // Start observing DOM changes to detect when menu appears
    observer.observe(document.body, {
      childList: true, // Watch for new elements being added/removed
      subtree: true, // Watch the entire DOM tree
      attributes: true, // Watch for attribute changes
      attributeFilter: ['class', 'style', 'data-testid'], // Only watch specific attributes
    });

    // For backward navigation, we need to ensure the step change happens even if menu doesn't appear
    // We'll use a more reliable approach by checking if the observer is still active after a short delay
    if (isBackward) {
      // For backward navigation, give a small delay to allow menu to appear, then proceed
      const checkAndProceed = () => {
        // Check if menu is already visible
        const targetMenu = document.querySelector(
          '[class*="WeeklySuperSerachstyles__Container"]',
        );
        if (targetMenu && (targetMenu as HTMLElement).offsetParent !== null) {
          // Menu is visible, observer will handle it
          return;
        }

        // Menu not visible after delay, proceed anyway for backward navigation
        observer.disconnect();
        if (setCurrentStep) {
          setCurrentStep(newStep);
        }
      };

      // Use requestAnimationFrame for better performance than setTimeout
      requestAnimationFrame(() => {
        requestAnimationFrame(checkAndProceed);
      });
    }
  };

  return {
    setupMenuObserver,
  };
};
