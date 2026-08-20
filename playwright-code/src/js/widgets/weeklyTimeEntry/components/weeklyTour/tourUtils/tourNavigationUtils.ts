import { useSandbox } from '@payroll/quicksand';
import { GeneralPopoverTourStep } from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  closeContextMenu,
  openContextMenu,
} from '../../../store/contextMenuSlice';
import { selectAllTimesheetRows } from '../../../store/selectors';

export const useTourNavigation = () => {
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const allTimesheetRows = useAppSelector(selectAllTimesheetRows);

  // Common logic for selecting a cell
  const selectCell = (dayIdx: number = 0) => {
    const firstRowId =
      allTimesheetRows.length > 0 ? allTimesheetRows[0].rowId : null;
    if (firstRowId) {
      try {
        dispatch({
          type: 'timeEntryGrid/selectCell',
          payload: { rowId: firstRowId, dayIdx },
        });
      } catch (error) {
        // Silently handle error if Redux action fails
      }
    }
  };

  // Common logic for deselecting a cell
  const deselectCell = () => {
    dispatch({ type: 'timeEntryGrid/clearSelection' });
    dispatch({
      type: 'timeEntryGrid/selectCell',
      payload: null,
    });
  };

  // Helper function to handle backward navigation from step 2 to step 1
  // When user goes back from time category selector to team member dropdown
  const handleBackwardStep2To1 = (
    setDynamicSteps: (steps: GeneralPopoverTourStep[]) => void,
  ) => {
    dispatch({ type: 'contextMenu/closeContextMenu' });
    setDynamicSteps([]);
  };

  // Helper function to handle backward navigation from step 3 to step 2
  // When user goes back from details panel to time category selector
  const handleBackwardStep3To2 = (
    newStep: number,
    setupMenuObserver: (
      step: number,
      isBackward?: boolean,
      steps?: any[],
      setDynamicSteps?: (steps: GeneralPopoverTourStep[]) => void,
      setCurrentStep?: (step: number) => void,
      timeCategoryStepIndex?: number,
    ) => void,
    steps: any[],
    setDynamicSteps?: (steps: GeneralPopoverTourStep[]) => void,
    setCurrentStep?: (step: number) => void,
    timeCategoryStepIndex: number = 1,
  ) => {
    // Use common logic to deselect cell
    deselectCell();

    // Get the first row ID from Redux state using allTimesheetRows (same logic as forward navigation)
    const firstRowId =
      allTimesheetRows.length > 0 ? allTimesheetRows[0].rowId : null;

    if (firstRowId) {
      // Find the time category selector cell to get proper positioning
      const firstCustomerCell = document.querySelector(
        '[aria-label="weekly-time-category-selector"]',
      );

      if (firstCustomerCell) {
        // Get the cell's position to trigger the context menu at the right location
        const rect = firstCustomerCell.getBoundingClientRect();
        // Use the same approach as CustomerCell.tsx - trigger click event to get proper coordinates
        const clickEvent = new MouseEvent('click', {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
          bubbles: true,
          cancelable: true,
        });
        firstCustomerCell.dispatchEvent(clickEvent);

        // Then dispatch the context menu with the same coordinates and first row ID
        dispatch(
          openContextMenu({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rowId: firstRowId,
            dayIdx: 0,
            menuType: 'superSearch',
          }),
        );
      } else {
        // Fallback: trigger the super search menu using Redux action without positioning
        dispatch(
          openContextMenu({
            x: 0, // Will be positioned by the component
            y: 0, // Will be positioned by the component
            rowId: firstRowId,
            dayIdx: 0,
            menuType: 'superSearch',
          }),
        );
      }

      // Set up observer to wait for the super search menu to appear
      // Then reposition the tour beside the menu
      setupMenuObserver(
        newStep,
        true,
        steps,
        setDynamicSteps,
        setCurrentStep,
        timeCategoryStepIndex,
      );
      return true; // Indicate that we're waiting for observer
    }
    return false;
  };

  // Helper function to handle forward navigation from step 1 to step 2
  // When user goes from team member dropdown to time category selector
  const handleForwardStep1To2 = (
    newStep: number,
    steps: any[],
    targetElement?: HTMLElement,
    stepTargetElement?: HTMLElement,
    setDynamicSteps?: (steps: GeneralPopoverTourStep[]) => void,
    setCurrentStep?: (step: number) => void,
    setupMenuObserver?: (
      step: number,
      isBackward?: boolean,
      steps?: any[],
      setDynamicSteps?: (steps: GeneralPopoverTourStep[]) => void,
      setCurrentStep?: (step: number) => void,
      timeCategoryStepIndex?: number,
    ) => void,
    timeCategoryStepIndex: number = 1,
  ) => {
    // Check if super search menu is already open
    const existingMenu = document.querySelector(
      '[class*="WeeklySuperSerachstyles__Container"]',
    );
    if (existingMenu && (existingMenu as HTMLElement).offsetParent !== null) {
      // Menu is already open, just reposition tour beside it
      const updatedSteps = createUpdatedSteps(
        steps,
        existingMenu as HTMLElement,
        timeCategoryStepIndex,
      );
      setDynamicSteps?.(updatedSteps);
      setCurrentStep?.(newStep);
      return;
    }

    // Create initial steps with default anchor elements (before menu opens)
    const initialSteps = steps.map((step, idx) => {
      let anchorEl: HTMLElement | null = null;

      // Find anchor element using target selector
      if (step.targetSelector) {
        anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
      }

      // Fallback chain for anchor elements
      if (!anchorEl && idx === 0 && stepTargetElement) {
        anchorEl = stepTargetElement;
      }
      if (!anchorEl && targetElement) {
        anchorEl = targetElement;
      }
      if (!anchorEl) {
        anchorEl = document.body;
      }

      return {
        ...step,
        anchorEl: anchorEl!,
      };
    });

    // Set initial steps (tour will be positioned beside team member dropdown)
    setDynamicSteps?.(initialSteps);
    const firstRowId =
      allTimesheetRows.length > 0 ? allTimesheetRows[0].rowId : null;
    // Find and click the time category selector to trigger super search menu
    const firstCustomerCell = document.querySelector(
      '[aria-label="weekly-time-category-selector"]',
    );
    if (firstCustomerCell) {
      // Get cell position and trigger context menu at that location
      const rect = firstCustomerCell.getBoundingClientRect();
      dispatch(
        openContextMenu({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          rowId: firstRowId,
          dayIdx: 0,
          menuType: 'superSearch',
        }),
      );

      // Set up observer to wait for menu to appear, then reposition tour beside it
      setupMenuObserver?.(
        newStep,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
        timeCategoryStepIndex,
      );
    } else {
      // If cell not found, just proceed to next step
      setCurrentStep?.(newStep);
    }
  };

  // Helper function to handle forward navigation from step 2 to step 3
  // When user goes from time category selector to details panel
  const handleForwardStep2To3 = (
    newStep: number,
    setCurrentStep: (step: number) => void,
  ) => {
    // Ensure super search dialog is closed before moving to details panel step
    dispatch(closeContextMenu());

    // Use common logic to select cell (day 0 - Monday)
    selectCell(0);

    // Move to the next step (details panel)
    setCurrentStep(newStep);
  };

  // Helper function to handle forward navigation from step 3 to step 4
  // When user goes from details panel to save button
  const handleForwardStep3To4 = (
    newStep: number,
    setCurrentStep: (step: number) => void,
  ) => {
    // Use common logic to deselect cell (hide details panel)
    deselectCell();

    // Move to the next step (save button)
    setCurrentStep(newStep);
  };

  // Helper function to handle backward navigation from step 4 to step 3
  // When user goes back from save button to details panel
  const handleBackwardStep4To3 = (
    newStep: number,
    setCurrentStep: (step: number) => void,
  ) => {
    // Use common logic to select cell (day 0 - Monday)
    selectCell(0);

    // Move to the previous step (details panel)
    setCurrentStep(newStep);
  };

  return {
    handleBackwardStep2To1,
    handleBackwardStep3To2,
    handleBackwardStep4To3,
    handleForwardStep1To2,
    handleForwardStep2To3,
    handleForwardStep3To4,
    selectCell,
    deselectCell,
  };
};

// Helper function to create updated steps with new anchor elements
// This is used when the super search menu is open to reposition the tour beside it
export const createUpdatedSteps = (
  steps: any[],
  targetMenu?: HTMLElement,
  timeCategoryStepIndex: number = 1,
) =>
  steps.map((step, idx) => {
    let anchorEl: HTMLElement | null = null;

    if (idx === timeCategoryStepIndex && targetMenu) {
      // Step 2 (time category selector step) - position tour beside the super search menu
      anchorEl = targetMenu;
    } else if (step.targetSelector) {
      // Other steps - use their original target selectors
      anchorEl = document.querySelector(step.targetSelector) as HTMLElement;
    }

    // Fallbacks for anchor elements
    if (!anchorEl && idx === 0) {
      anchorEl = document.body;
    }
    if (!anchorEl) {
      anchorEl = document.body;
    }

    return {
      ...step,
      anchorEl: anchorEl!,
    };
  });
