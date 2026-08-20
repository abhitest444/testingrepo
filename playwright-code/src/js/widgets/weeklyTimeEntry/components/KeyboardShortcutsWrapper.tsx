import React, { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import dayjs from 'dayjs';
import { useSaveWeeklyTimeEntries } from 'src/js/service/hooks/weeklyTimeEntries/useSaveWeeklyTimeEntries';
import { useAppDispatch, useAppSelector } from '../store';
import { setLastPressedKey } from '../store/keyboardShortcutsSlice';
import { setClipboard } from '../store/contextMenuSlice';
import {
  selectSelectedCell,
  selectWeeklyTimeEntriesMap,
  selectDateRange,
  selectVisibleDays,
  selectRowOrder,
  selectCompanySettings,
  selectPanelOpen,
} from '../store/selectors';
import {
  updateCell,
  addRow,
  clearCell,
  deleteRow,
} from '../store/timeEntryGridSlice';
import { createEmptyRow } from '../utils/helpers';
import { useReset } from '../hooks/useReset';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { useOptimizedCellClick } from '../hooks/useOptimizedCellClick';

// Detect operating system for cross-platform keyboard shortcuts
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'meta' : 'ctrl';

interface KeyboardShortcutsWrapperProps {
  children: React.ReactNode;
  currentWeek?: any;
  onWeekChange?: (newDateRange: { start: string; end: string }) => void;
  setOpen?: (open: boolean) => void;
}

export const KeyboardShortcutsWrapper: React.FC<
  KeyboardShortcutsWrapperProps
> = ({ children, currentWeek, onWeekChange, setOpen }) => {
  const dispatch = useAppDispatch();
  const selectedCell = useAppSelector(selectSelectedCell);
  const weeklyTimeEntriesMap = useAppSelector(selectWeeklyTimeEntriesMap);
  const clipboard = useAppSelector((state) => state.contextMenu.clipboard);
  const dateRange = useAppSelector(selectDateRange);
  const visibleDays = useAppSelector(selectVisibleDays);
  const rowOrder = useAppSelector(selectRowOrder);
  const companySettings = useAppSelector(selectCompanySettings);
  const isPanelOpen = useAppSelector(selectPanelOpen);

  // Use the reusable save hook
  const { saveWeeklyTimeEntries } = useSaveWeeklyTimeEntries();

  // Use the reset hook for comprehensive reset functionality
  const { reset } = useReset();

  // Use the undo/redo hook
  const { canUndo, canRedo, handleUndo, handleRedo, resetHistory } =
    useUndoRedo();

  // Use the optimized cell click hook for auto-population
  const { handleCellClick: optimizedCellClick } = useOptimizedCellClick();

  // State to track current field focus within a cell
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(-1);

  // Get the current row data to check if it's a break
  const currentRow = selectedCell
    ? weeklyTimeEntriesMap[selectedCell.rowId]
    : null;

  // Check if the current row is a break (PAID or UNPAID time category)
  const isBreakRow =
    currentRow?.timeAgainst?.type === 'PAID' ||
    currentRow?.timeAgainst?.type === 'UNPAID';

  // Define the order of focusable fields in the panel
  // This function returns an array of field names in the order they should be focused
  // It respects company settings and only includes enabled fields
  // For break rows, it only includes the notes field
  // Custom fields are expanded to individual field IDs for proper tab navigation
  const getFocusableFields = () => {
    const fields = [];

    // Only include non-break fields if it's not a break row
    if (!isBreakRow) {
      // Service Field - controlled by company settings only
      if (companySettings?.isServiceFieldEnabled) {
        fields.push('service');
      }

      // Class Field - controlled by UX preferences and company settings
      if (companySettings?.isClassEnabled) {
        fields.push('class');
      }

      // Location Field - controlled by UX preferences and company settings
      if (companySettings?.isLocationEnabled) {
        fields.push('location');
      }

      // Billable Field - controlled by the company settings
      if (companySettings?.isBillingFieldEnabled) {
        fields.push('billable');
      }

      // Custom Fields - expand to individual field IDs using data-testid attributes
      // Each custom field gets its own entry in the tab order, allowing users to tab through
      // all custom fields individually before moving to the next cell
      const customFieldsContainer = document.querySelector(
        '[data-testid="custom-fields"]',
      );
      if (customFieldsContainer) {
        // Find all custom field elements with data-testid starting with "custom-field-"
        const customFieldElements = customFieldsContainer.querySelectorAll(
          '[data-testid^="custom-field-"]',
        );

        // Add each custom field to the focusable fields array
        customFieldElements.forEach((element) => {
          const testId = element.getAttribute('data-testid');
          if (testId && testId.startsWith('custom-field-')) {
            fields.push(testId);
          }
        });
      }
    }

    // Notes field - always shown, even for breaks, and always last
    fields.push('notes');

    return fields;
  };

  // Helper function to focus on a specific field
  // This function handles focusing on different types of fields:
  // - Regular fields (service, class, location, billable, notes) using their data-testid selectors
  // - Custom fields using their individual data-testid attributes (e.g., custom-field-123)
  // - Each custom field is focused individually, allowing proper tab navigation through all custom fields
  const focusField = (fieldName: string) => {
    // Handle custom fields specially
    if (fieldName.startsWith('custom-field-')) {
      const element = document.querySelector(
        `[data-testid="${fieldName}"]`,
      ) as HTMLElement;
      if (element) {
        // For custom fields, we need to find the actual input element within the component
        // Try multiple selectors to ensure we find the right input
        const inputSelectors = [
          'input',
          'textarea',
          '.ids-text-field input',
          '.ids-textarea textarea',
          '.QuickfillsEntity input',
          '.ids-dropdown input',
        ];

        const focusedElement = inputSelectors.find((selector) => {
          const inputElement = element.querySelector(selector) as HTMLElement;
          if (inputElement) {
            const isDisabled = (
              inputElement as HTMLInputElement | HTMLTextAreaElement
            ).disabled;
            if (!isDisabled) {
              inputElement.focus();
              return true;
            }
          }
          return false;
        });

        if (focusedElement) {
          return true;
        }

        // If no nested input found, try focusing the element itself (for dropdowns)
        const isDisabled = (element as HTMLInputElement | HTMLTextAreaElement)
          .disabled;
        if (!isDisabled) {
          element.focus();
          return true;
        }
      }
      return false;
    }

    const fieldSelectors = {
      service:
        '[data-testid="service-field"] input, [data-testid="service-field"] .QuickfillsEntity input, [data-testid="service-field"] .ids-text-field input',
      class:
        '[data-testid="class-field"] input, [data-testid="class-field"] .QuickfillsEntity input, [data-testid="class-field"] .ids-text-field input',
      location:
        '[data-testid="location-field"] input, [data-testid="location-field"] .QuickfillsEntity input, [data-testid="location-field"] .ids-text-field input',
      billable:
        '[data-testid="billable-field"] input, [data-testid="billable-field"] .ids-checkbox input, [data-testid="billable-field"] .ids-text-field input',
      notes: '[data-testid="notes-field"]',
    };

    const selector = fieldSelectors[fieldName as keyof typeof fieldSelectors];
    if (selector) {
      const elements = Array.from(document.querySelectorAll(selector));

      // Special handling for billable field - prefer text field over checkbox when available
      if (fieldName === 'billable') {
        // First try to find a text field (rate input)
        const textField = elements.find((element: Element) => {
          if (element && element instanceof HTMLElement) {
            const isDisabled = (
              element as HTMLInputElement | HTMLTextAreaElement
            ).disabled;
            if (!isDisabled && (element as HTMLInputElement).type === 'text') {
              element.focus();
              return true;
            }
          }
          return false;
        });

        if (textField) {
          return true;
        }
        // If no text field found, fall back to checkbox
        const checkboxField = elements.find((element: Element) => {
          if (element && element instanceof HTMLElement) {
            const isDisabled = (
              element as HTMLInputElement | HTMLTextAreaElement
            ).disabled;
            if (!isDisabled) {
              element.focus();
              return true;
            }
          }
          return false;
        });

        if (checkboxField) {
          return true;
        }
      } else {
        // For other fields, use the first focusable element
        const focusableElement = elements.find((element: Element) => {
          if (element && element instanceof HTMLElement) {
            const isDisabled = (
              element as HTMLInputElement | HTMLTextAreaElement
            ).disabled;
            if (!isDisabled) {
              element.focus();
              return true;
            }
          }
          return false;
        });

        if (focusableElement) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper function to handle tab navigation
  // This function implements a sophisticated tab navigation system that:
  // 1. When Tab is pressed from a cell input, it moves to the first meta info field in the panel
  // 2. When Tab is pressed from a meta info field, it moves to the next field or next cell
  // 3. When Shift+Tab is pressed, it moves to the previous field or previous cell
  // 4. The navigation respects company settings and only shows enabled fields
  // 5. For break rows, it only shows the notes field
  // 6. When reaching the end of a row, it moves to the next row
  const handleTabNavigation = (isShiftTab: boolean = false) => {
    if (!selectedCell) {
      // If no cell is selected, don't prevent default - let browser handle tab normally
      return false;
    }

    // If panel is not open, just navigate to next/previous cell
    if (!isPanelOpen) {
      if (isShiftTab) {
        handleDirectionalNavigation('left');
      } else {
        handleDirectionalNavigation('right');
      }
      handleKeyPress(isShiftTab ? 'Shift + Tab' : 'Tab');
      return true; // Prevent default browser behavior
    }

    const focusableFields = getFocusableFields();

    if (currentFieldIndex === -1) {
      // Currently in cell input, move to first field
      setCurrentFieldIndex(0);
      if (focusableFields.length > 0) {
        const focused = focusField(focusableFields[0]);
        if (focused) {
          handleKeyPress('Tab');
          return true; // Prevent default browser behavior
        }
      }
    } else {
      // Currently in a field, navigate to next/previous field or cell
      let nextFieldIndex: number;

      if (isShiftTab) {
        // Shift+Tab: go to previous field or cell
        nextFieldIndex = currentFieldIndex - 1;
        if (nextFieldIndex < 0) {
          // Move to previous cell
          setCurrentFieldIndex(-1);
          handleDirectionalNavigation('left');
          handleKeyPress('Shift + Tab');
          return true; // Prevent default browser behavior
        }
      } else {
        // Tab: go to next field or cell
        nextFieldIndex = currentFieldIndex + 1;
        if (nextFieldIndex >= focusableFields.length) {
          // Move to next cell
          setCurrentFieldIndex(-1);
          handleDirectionalNavigation('right');
          handleKeyPress('Tab');
          return true; // Prevent default browser behavior
        }
      }

      // Focus on the next/previous field
      const nextField = focusableFields[nextFieldIndex];
      const focused = focusField(nextField);
      if (focused) {
        setCurrentFieldIndex(nextFieldIndex);
        handleKeyPress(isShiftTab ? 'Shift + Tab' : 'Tab');
        return true; // Prevent default browser behavior
      }
      // If we can't focus on this field, try the next one
      if (!isShiftTab && nextFieldIndex + 1 < focusableFields.length) {
        const nextNextField = focusableFields[nextFieldIndex + 1];
        const nextFocused = focusField(nextNextField);
        if (nextFocused) {
          setCurrentFieldIndex(nextFieldIndex + 1);
          handleKeyPress('Tab');
          return true;
        }
      }
    }

    // Fallback: if we can't focus on a field, move to next/previous cell
    setCurrentFieldIndex(-1);
    if (isShiftTab) {
      handleDirectionalNavigation('left');
    } else {
      handleDirectionalNavigation('right');
    }
    handleKeyPress(isShiftTab ? 'Shift + Tab' : 'Tab');
    return true; // Prevent default browser behavior
  };

  // Reset field index when cell changes
  useEffect(() => {
    setCurrentFieldIndex(-1);
  }, [selectedCell?.rowId, selectedCell?.dayIdx]);

  // Global event listener to prevent browser shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Cmd+N (new window) and Cmd+Shift++ (zoom in)
      if (
        (e.metaKey && e.key === 'n') ||
        (e.metaKey && e.shiftKey && e.key === '=') ||
        (e.ctrlKey && e.key === 'n') ||
        (e.ctrlKey && e.shiftKey && e.key === '=')
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      return true;
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Helper function to log and dispatch key press
  const handleKeyPress = (key: string) => {
    dispatch(setLastPressedKey(key));
  };

  // Helper function to handle copy cell action
  const handleCopyCell = () => {
    if (!selectedCell) {
      return;
    }

    const { rowId, dayIdx } = selectedCell;
    const row = weeklyTimeEntriesMap[rowId];
    const cell = row?.timeEntries[dayIdx];

    if (cell) {
      // Don't copy if hours <= 0
      if (!cell.hours) {
        return;
      }

      // Copy cell data but exclude fields that shouldn't be copied (same as context menu)
      const { timeEntryId, date, operation, originalValues, ...copyableData } =
        cell;

      dispatch(setClipboard({ value: copyableData }));
    }
  };

  // Helper function to handle paste cell action
  const handlePasteCell = () => {
    if (!selectedCell || !clipboard) {
      return;
    }

    const { rowId, dayIdx } = selectedCell;
    dispatch(updateCell({ rowId, dayIdx, value: { ...clipboard.value } }));
  };

  // Helper function to handle add new row action
  const handleAddNewRow = () => {
    if (!selectedCell || !currentWeek) {
      return;
    }

    const { rowId } = selectedCell;
    const newRow = createEmptyRow(currentWeek);
    dispatch(addRow({ row: newRow, afterRowId: rowId }));
  };

  // Helper function to handle insert row action (same as context menu)
  const handleInsertRow = () => {
    if (!selectedCell || !currentWeek) {
      return;
    }

    const { rowId } = selectedCell;
    const newRow = createEmptyRow(currentWeek);
    dispatch(addRow({ row: newRow, afterRowId: rowId }));
  };

  // Helper function to handle clear cell action (same as context menu)
  const handleClearCell = () => {
    if (!selectedCell) {
      return;
    }

    const { rowId, dayIdx } = selectedCell;
    dispatch(clearCell({ rowId, dayIdx }));
  };

  // Helper function to handle delete row action (same as context menu)
  const handleDeleteRow = () => {
    if (!selectedCell) {
      return;
    }

    const { rowId } = selectedCell;
    dispatch(deleteRow({ rowId }));
  };

  // Helper function to handle go to today action
  const handleGoToToday = () => {
    if (!onWeekChange) {
      return;
    }

    // Clear undo/redo history when changing date
    resetHistory();

    // Use dayjs for DST-safe week calculation
    const today = dayjs();
    const startOfWeek = today.startOf('week');
    const endOfWeek = startOfWeek.add(6, 'day');

    const newDateRange = {
      start: startOfWeek.format('YYYY-MM-DD'),
      end: endOfWeek.format('YYYY-MM-DD'),
    };

    // Call the same week change handler that the header uses
    onWeekChange(newDateRange);
  };

  // Helper function to handle week navigation (reuses header logic)
  const navigateWeek = (direction: 'next' | 'prev') => {
    if (!onWeekChange) {
      return;
    }

    // Clear undo/redo history when changing week
    resetHistory();

    const { start } = dateRange;

    if (!start) {
      return;
    }

    // Reuse the same logic as WeekNavigator
    const currentStartDate = dayjs(start);
    const newStartDate =
      direction === 'next'
        ? currentStartDate.add(1, 'week')
        : currentStartDate.subtract(1, 'week');

    const newDateRange = {
      start: newStartDate.startOf('week').format('YYYY-MM-DD'),
      end: newStartDate.endOf('week').format('YYYY-MM-DD'),
    };

    // Call the same week change handler that the header uses
    onWeekChange(newDateRange);
  };

  // Helper function to handle close action
  const handleClose = () => {
    if (setOpen) {
      setOpen(false);
    }
  };

  // Helper function to handle directional navigation
  const handleDirectionalNavigation = (
    direction: 'up' | 'down' | 'left' | 'right',
  ) => {
    // First, save any pending input value by triggering blur on the currently focused input
    const { activeElement } = document;
    if (
      activeElement &&
      activeElement.tagName === 'INPUT' &&
      activeElement !== document.body
    ) {
      // Trigger blur to save the current input value
      (activeElement as HTMLElement).blur();

      // Small delay to ensure the blur event is processed before navigation
      setTimeout(() => {
        performNavigation(direction);
      }, 10);
    } else {
      // No input focused, navigate immediately
      performNavigation(direction);
    }
  };

  // Helper function to perform navigation and apply auto-population
  const performNavigation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;

    const { rowId, dayIdx } = selectedCell;
    const currentRowIndex = rowOrder.indexOf(rowId);

    let newRowId = rowId;
    let newDayIdx = dayIdx;

    // Calculate new position based on direction
    switch (direction) {
      case 'up': {
        if (currentRowIndex > 0) {
          newRowId = rowOrder[currentRowIndex - 1];
        }
        break;
      }
      case 'down': {
        if (currentRowIndex < rowOrder.length - 1) {
          newRowId = rowOrder[currentRowIndex + 1];
        }
        break;
      }
      case 'left': {
        const currentVisibleIndex = visibleDays.indexOf(dayIdx);
        if (currentVisibleIndex > 0) {
          newDayIdx = visibleDays[currentVisibleIndex - 1];
        }
        break;
      }
      case 'right': {
        const currentVisibleIndex = visibleDays.indexOf(dayIdx);
        if (currentVisibleIndex < visibleDays.length - 1) {
          newDayIdx = visibleDays[currentVisibleIndex + 1];
        }
        break;
      }
      default:
        break;
    }

    // Only navigate if position changed
    if (newRowId !== rowId || newDayIdx !== dayIdx) {
      // Use optimizedCellClick to handle both selection and auto-population
      // Convert dayIdx to cellIdx (cellIdx = visibleDays.indexOf(dayIdx) + 1)
      const cellIdx = visibleDays.indexOf(newDayIdx) + 1;
      optimizedCellClick(newRowId, cellIdx);
    }
  };

  // Register all keyboard shortcuts from KeyboardShortcutsModal using cross-platform modifiers
  useHotkeys(
    'Tab',
    (e) => {
      const shouldPreventDefault = handleTabNavigation(false);
      if (shouldPreventDefault) {
        e.preventDefault();
      }
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    'shift+Tab',
    (e) => {
      const shouldPreventDefault = handleTabNavigation(true);
      if (shouldPreventDefault) {
        e.preventDefault();
      }
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    'ArrowUp',
    (e) => {
      e.preventDefault();
      handleKeyPress('↑');
      handleDirectionalNavigation('up');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'ArrowDown',
    (e) => {
      e.preventDefault();
      handleKeyPress('↓');
      handleDirectionalNavigation('down');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'ArrowLeft',
    (e) => {
      e.preventDefault();
      handleKeyPress('←');
      handleDirectionalNavigation('left');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'ArrowRight',
    (e) => {
      e.preventDefault();
      handleKeyPress('→');
      handleDirectionalNavigation('right');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+c`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + C' : 'Ctrl + C');
      handleCopyCell();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+v`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + V' : 'Ctrl + V');
      handlePasteCell();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'alt+n',
    (e) => {
      e.preventDefault();
      handleKeyPress('Alt + N');
      handleAddNewRow();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'shift+alt+n',
    (e) => {
      e.preventDefault();
      handleKeyPress('Alt + Shift + N');
      handleAddNewRow();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+s`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + S' : 'Ctrl + S');

      // Trigger blur on the currently focused element to save any pending changes
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }

      // Clear undo/redo history when saving
      resetHistory();

      saveWeeklyTimeEntries();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+z`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + Z' : 'Ctrl + Z');
      handleUndo();
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    `${modifierKey}+y`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + Y' : 'Ctrl + Y');
      handleRedo();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'alt+c',
    (e) => {
      e.preventDefault();
      handleKeyPress('Alt + C');

      // Clear undo/redo history when resetting
      resetHistory();

      reset();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'alt+t',
    (e) => {
      e.preventDefault();
      handleKeyPress('Alt + T');
      handleGoToToday();
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+ArrowRight`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + →' : 'Ctrl + →');
      navigateWeek('next');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    `${modifierKey}+ArrowLeft`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + ←' : 'Ctrl + ←');
      navigateWeek('prev');
    },
    { enableOnFormTags: true },
  );
  useHotkeys(
    'Escape',
    (e) => {
      e.preventDefault();
      handleKeyPress('Esc');
      handleClose();
    },
    { enableOnFormTags: true },
  );

  // Additional shortcuts from context menu
  useHotkeys(
    'Delete',
    (e) => {
      e.preventDefault();
      handleKeyPress('Delete');
      handleClearCell();
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    'shift+Delete',
    (e) => {
      e.preventDefault();
      handleKeyPress('Shift + Delete');
      handleDeleteRow();
    },
    { enableOnFormTags: true },
  );

  useHotkeys(
    `${modifierKey}+shift+=`,
    (e) => {
      e.preventDefault();
      handleKeyPress(isMac ? 'Cmd + Shift + +' : 'Ctrl + Shift + +');
      handleInsertRow();
    },
    { enableOnFormTags: true },
  );

  return <>{children}</>;
};
