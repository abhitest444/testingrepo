# Weekly Time Entry Module Documentation

## Folder Structure

```
weeklyTimeEntry/
├── components/
│   ├── commons/           # Shared UI components (SuperSearch, fields, etc.)
│   ├── styles/            # Styled-components for UI
│   ├── WeeklyTimeEntryTable.tsx  # Main grid/table UI
│   ├── WeeklyTimeEntryContextMenu.tsx  # Context menu logic
│   ├── WeeklyTimeEntryTrowser.tsx      # Trowser (side panel) for weekly entry
│   ├── WeeklyTimeEntryPanelContent.tsx # Panel content for trowser
│   ├── WeeklyTimeEntryHeader.tsx       # Header for the grid
│   ├── WeekNavigator.tsx               # Week navigation UI
│   ├── TeamMemberDropdown.tsx          # Team member selector
│   └── helpers.ts                      # Table/grid helpers
├── store/
│   ├── timeEntryGridSlice.ts      # Main Redux slice for grid state
│   ├── contextMenuSlice.ts        # Context menu state
│   ├── timeEntrySettingsSlice.ts  # Settings for time entry
│   ├── timeEntryTransformer.ts    # Data transformation helpers
│   ├── selectors.ts               # Redux selectors
│   ├── customerSlice.ts           # Customer/project data
│   └── index.ts                   # Store exports
├── hooks/
│   ├── useCombinedDataFetching.ts # Fetches settings, preferences, etc.
│   ├── useTimeEntriesFetching.ts  # Fetches and merges time entries
│   ├── useOptimizedCellClick.ts   # Optimized cell click logic
│   ├── useGridInitialization.ts   # Grid initialization logic
│   └── useCustomerDataFetching.ts # Fetches customer data
├── types/                # TypeScript types
│   └── index.ts
```

---

## Detailed File Explanations

### components/
- **WeeklyTimeEntryTable.tsx**: Main grid/table UI. Renders all rows and cells, handles cell selection, editing, and dispatches Redux actions for all grid operations. Integrates with context menu and super search.
- **WeeklyTimeEntryContextMenu.tsx**: Renders the context menu (copy/paste, clear, super search, etc.) based on Redux state. Handles menu positioning and closing logic.
- **WeeklyTimeEntryTrowser.tsx**: Implements the trowser (side panel) for weekly entry, used for detailed editing or review.
- **WeeklyTimeEntryPanelContent.tsx**: Content for the trowser panel, including forms and additional controls.
- **WeeklyTimeEntryHeader.tsx**: Renders the header row for the grid, including day labels and totals.
- **WeekNavigator.tsx**: UI for navigating between weeks (previous/next/current week).
- **TeamMemberDropdown.tsx**: Dropdown for selecting the team member whose time entries are being viewed/edited.
- **helpers.ts**: Utility functions for the grid, including:
  - `getVisibleDaysFromPreferences`: Determines which days to show based on user preferences.
  - `getCellStyle`: Returns style for a cell.
  - `formatCellValue`: Formats a cell value for display.
  - `getHeaderData`: Returns header data for the table.
  - `getRowData`: Returns cell data for a row.
  - `createEmptyRow`: Returns a blank row for the grid.

#### components/commons/
- **WeeklySuperSearch.tsx**: Vertical tab super search for selecting customer/project, breaks, or time off. Used in the context menu for the first column.
- **WeeklyCustomerProjectField.tsx**: Field editor for customer/project selection in a row.
- **WeeklyDateNavigation.tsx**: Date navigation controls for the grid.
- **WeeklyLocationField.tsx**: Field editor for location selection.
- **WeeklyServiceField.tsx**: Field editor for service selection.
- **WeeklyClassField.tsx**: Field editor for class selection.
- **WeeklyBillableField.tsx**: Field editor for billable status.

#### components/commons/styles/
- **WeeklySuperSearch.styles.ts**: Styled-components for the super search UI.

#### components/styles/
- **WeeklySuperSerach.styles.ts**: Styled-components for the super search cell and container in the grid.
- **WeeklyTimeEntryTable.styles.ts**: Styled-components for the main grid/table, including DataCell, SelectedCell, and row styles.
- **WeeklyTimeEntryHeader.styles.ts**: Styled-components for the grid header.

### store/
- **timeEntryGridSlice.ts**: Main Redux slice for the grid. Defines:
  - State for all rows, selected cell, team member, date range, loading, errors, etc.
  - Actions: `addRow`, `deleteRow`, `updateCell`, `selectCell`, `updateTimeAgainst`, `clearCell`, `mergeTimeEntries`, `setLoading`, `setError`, etc.
  - Reducers for all grid operations.
- **contextMenuSlice.ts**: Redux slice for context menu state (open/close, position, menu type, clipboard for copy/paste).
- **timeEntrySettingsSlice.ts**: Redux slice for time entry settings (first day of week, preferences, loading, errors, etc.).
- **timeEntryTransformer.ts**: Data transformation helpers, including:
  - `transformTimeEntriesToTimesheetRows`: Converts raw API data to grid rows.
  - `processBatch`: Utility for batch processing large arrays.
  - `clearTransformationCache`: Clears any memoized transformation cache.
- **selectors.ts**: Memoized selectors for efficient state access (e.g., selectTimeEntries, selectSelectedCell, selectCustomerData, selectTimeEntryGridLoading, selectCustomerDataLoading, selectTimeEntrySettingsLoading, etc.).
- **customerSlice.ts**: Redux slice for customer/project data (fetched from API) with loading and error states.
- **index.ts**: Exports all store slices and hooks for use in the app.

### hooks/
- **useCombinedDataFetching.ts**: Loads settings and preferences, dispatches to Redux. Handles initial app setup and state hydration.
- **useTimeEntriesFetching.ts**: Loads time entries for the current week/team member, merges into Redux. Handles transformation and merging of API data.
- **useOptimizedCellClick.ts**: Custom hook for optimized cell click logic (focus, selection, keyboard navigation).
- **useGridInitialization.ts**: Handles initial grid setup and any required state resets.
- **useCustomerDataFetching.ts**: Fetches customer/project data from the API and stores in Redux.

### types/
- **index.ts**: TypeScript types for all major data structures (rows, cells, actions, etc.). Used throughout the module for type safety.

---

## State Management Architecture

### Loading and Error States
Each slice manages its own loading and error states for better separation of concerns:

- **timeEntryGridSlice**: `loading` and `error` for time entry operations
- **timeEntrySettingsSlice**: `loading` and `error` for settings operations
- **customerSlice**: `loading` and `error` for customer data operations

### Loading Selectors
- `selectTimeEntryGridLoading`: Loading state for time entry grid operations
- `selectCustomerDataLoading`: Loading state for customer data operations
- `selectTimeEntrySettingsLoading`: Loading state for settings operations
- `selectIsLoading`: Combined loading state across all slices (for global spinner)

### Data Structure Updates
- **TimesheetRow**: Uses `timeEntries` (camelCase) property instead of `timeentries` (lowercase)
- **timeEntryDetails**: Renamed from `DayDetails` for clarity
- **TimeEntryGridState**: Uses `weeklyTimeEntries` instead of `timeEntries` for the main array

---

## End-to-End Flow

1. **Initialization**
  - `useCombinedDataFetching` loads settings and user preferences, dispatches to Redux.
  - `useTimeEntriesFetching` loads time entries for the selected week and team member.

2. **State Management**
  - Redux slices (`timeEntryGridSlice`, `contextMenuSlice`, etc.) hold all UI and data state.
  - Each slice manages its own loading and error states.
  - Actions (e.g., `addRow`, `updateCell`, `openContextMenu`) update the state via reducers.

3. **UI Rendering**
  - Main UI (`WeeklyTimeEntryTable.tsx`) reads from Redux and renders the grid.
  - Context menus and popups are controlled by Redux state.
  - Components use hooks/selectors to read and update state.
  - Loading states are combined for unified spinner display.

4. **User Actions**
  - User clicks, edits, or right-clicks cells.
  - Components dispatch Redux actions (e.g., to update a cell, open a menu, copy/paste).
  - State updates trigger re-renders.

5. **Data Transformation**
  - Raw time entry data is transformed into grid rows by `transformTimeEntriesToTimesheetRows` (transformer).
  - Helpers like `createEmptyRow` ensure consistent row structure.

6. **Persistence**
  - Changes are eventually synced to the backend via API hooks (not shown in this module, but typically handled in service/hooks).

---

## State, Actions, and Transitions

- **Default State**: On load, the grid is populated with at least 6 empty rows. Settings and preferences are loaded and stored in Redux.
- **Actions**: User actions (add row, edit cell, open menu, etc.) dispatch Redux actions. These update the state via reducers.
- **Reducers**: Each slice defines reducers for its part of the state (e.g., `addRow`, `updateCell`, `openContextMenu`).
- **Selectors**: Components use selectors to read state efficiently.
- **Transitions**: State changes (e.g., selecting a cell, editing hours) trigger UI updates and may trigger data fetching or transformation.

---

## Example Flow: Editing a Cell
1. User clicks a cell in the grid.
2. `WeeklyTimeEntryTable.tsx` dispatches `selectCell` action.
3. Redux updates `selectedCell` state.
4. UI re-renders, showing the cell as selected.
5. User edits the value; `updateCell` action is dispatched.
6. Redux updates the cell value in the grid state.
7. If needed, data is transformed and persisted.

---

## Summary
- The weekly time entry module is a modern, Redux-driven React feature.
- All state, actions, and UI are modular and maintainable.
- Each slice manages its own loading and error states for better separation of concerns.
- Data flows from API/hooks → Redux → UI, and user actions flow UI → Redux → (optionally) API.
- Helpers and transformers keep data normalized and consistent.
- Loading states are combined for unified user experience.

For more details, see comments in each file or ask for a deep dive on any specific part!
