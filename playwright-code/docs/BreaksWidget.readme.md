# BreaksWidget

The BreaksWidget is a React component that provides functionality for managing break settings and preferences in the time tracking application.

JIRA: [QUANTA-1639](https://jira.intuit.com/browse/QUANTA-1639)

## Features
The widget supports two main features:

1. **Break Settings (`breaks-settings`)**
   - Functionality: 
     - `settings-handle`: Displays a settings section that opens the break preferences
     - `breaks-preferences`: Shows a trowser containing break rules management
   - Purpose: Manages break rules and preferences including duration, type (paid/unpaid), and assignment
   - Components:
     - `BreakSettingsHandle`: Entry point component with settings section
     - `BreakPreferencesContainer`: Break rules management interface in a trowser 

2. **Break Quickfills (`breaks-quickfills`)**
   - Functionality:
     - `breaks-selector-quickfill`: Provides a dropdown selector for breaks with advanced filtering capabilities
   - Purpose: Allows users to select breaks from a filtered list based on various criteria
   - Components:
     - `BreakSelectorQuickfill`: Main quickfill component with filtering logic
     - `BreaksByAssigneeDropdown`: Dropdown component for displaying and selecting breaks

## Component Structure

```
src/js/widgets/breaks/
├── BreaksWidget.tsx        # Main widget component
├── types.ts               # Type definitions
├── utils.ts              # Utility functions
├── widget.yaml           # Widget configuration
├── store/                # Redux store for breaks data
│   ├── quickfillsSlice.ts # Redux slice for quickfill state management
│   └── hooks.ts          # Custom hooks for Redux state access
├── components/           # Shared components
│   ├── BreakSelectorQuickfill.tsx
│   ├── BreaksByAssigneeDropdown.tsx
│   └── BreaksContent.tsx
└── features/             # Feature-specific components
    └── breaks-settings/  # Break settings feature
        └── components/   # Break settings components
            ├── BreakSettingsHandle.tsx
            └── BreakPreferences.tsx
```

## Usage

### Break Settings Feature

```typescript
import Widget from 'web-shell-core/widgets/HOCWidget';

// Example usage for break settings
<Widget
  key="breaks-settings-handle-1"
  widgetId="time-tracking-ui/breaks"
  options={{
    feature: 'breaks-settings',
    functionality: 'settings-handle',
    props: {
      // any additional props needed by the component requested
    }
  }}
/>
```

### Break Quickfills Feature

```typescript
import Widget from 'web-shell-core/widgets/HOCWidget';
import { BreakRule } from 'src/js/widgets/breaks/types';

// Example usage for break quickfills with filtering
<Widget
  key="breaks-quickfills"
  widgetId="time-tracking-ui/breaks"
  options={{
    feature: 'breaks-quickfills',
    functionality: 'breaks-selector-quickfill',
    props: {
      assigneeId: '400000009',
      onBreakSelected: (breakId: string, breakRule: BreakRule) => {
        console.log('Break selected:', breakId, breakRule);
        // Handle break selection
      },
      filter: {
        isActive: true,
        isDefaultPolicy: true,
        allowManual: true,
        allowAuto: true,
        breakType: 'PAID',
      }
    },
  }}
/>
```

## Props

### Required Props

- `options`: Configuration object containing:
  - `feature`: The feature to render (`'breaks-settings'` or `'breaks-quickfills'`)
  - [OPTIONAL] `functionality`: The specific functionality to render
  - [OPTIONAL] `props`: Additional props needed by the requested component

### Break Quickfills Props

For the `breaks-quickfills` feature with `breaks-selector-quickfill` functionality:

```typescript
interface BreakSelectorQuickfillProps {
  assigneeId: string; // Required: ID of the assignee (employee/vendor)
  onBreakSelected?: (breakId: string, breakRule: BreakRule) => void; // Optional: Callback when break is selected
  filter?: {
    isActive?: boolean;        // Filter by active status
    isDefaultPolicy?: boolean; // Filter by default policy status
    allowAuto?: boolean;       // Filter by auto allowance
    allowManual?: boolean;     // Filter by manual allowance
    breakType?: Payroll_Break; // Filter by break type (PAID/UNPAID)
  };
}
```

## Features and Functionalities

### Break Settings Feature

The `breaks-settings` feature provides the following functionality:

- `settings-handle`: Renders the `BreakSettingsHandle` component for managing break settings
  - Provides a settings section for managing break preferences
  - Includes edit, save, and cancel functionality
  - Supports break rule management (add, edit, delete)
  - Handles break rule status toggling

### Break Preferences Component

The `BreakPreferences` component within the `breaks-settings` feature:
- Displays a table of break rules
- Supports CRUD operations for break rules
- Includes status toggles for each break rule
- Provides edit and delete actions for each rule
- Supports adding new break rules

### Break Quickfills Feature

The `breaks-quickfills` feature provides the following functionality:

- `breaks-selector-quickfill`: Renders the `BreakSelectorQuickfill` component
  - Displays a dropdown with available breaks for the specified assignee
  - Supports advanced filtering based on multiple criteria
  - Uses AND logic for combining filter conditions
  - Maintains separate Redux state for filtered and original breaks
  - Automatically falls back to original breaks when no filter is applied

#### Filtering Logic

The quickfill component supports filtering with AND logic, meaning a break will only be included if it matches ALL specified filter conditions:

```typescript
// Example: Only show breaks that are:
// - Active (isActive: true) AND
// - Default policy (isDefaultPolicy: true) AND
// - Allow manual (allowManual: true) AND
// - Allow auto (allowAuto: true) AND
// - Paid breaks (breakType: 'PAID')
const filter = {
  isActive: true,
  isDefaultPolicy: true,
  allowManual: true,
  allowAuto: true,
  breakType: 'PAID',
};
```

#### State Management

The component uses Redux for state management with the following structure:

```typescript
interface BreaksByAssignee {
  [assigneeId: string]: {
    breaks: BreakRule[];           // Original breaks from API
    filteredBreaks?: BreakRule[];  // Filtered breaks based on criteria
    loading: boolean;
    error: string | null;
  };
}
```

## Modal and Handler Logic

- When a user clicks the delete icon for a break rule, a confirmation modal appears.
- The modal provides "Cancel" and "Delete" actions, both of which are fully tested for correct behavior.
- The modal closes when either action is taken, and the appropriate handler is called.
- All handler props (`onDelete`, `onCancel`, etc.) are tested to ensure they are passed and invoked correctly.

## Test Coverage

- **BreakPreferencesContainer**:
  - Renders and hides content based on the `open` prop.
  - Passes handler props to child components.
  - Opens the delete modal when a break rule is deleted.
  - Closes the modal on confirm or cancel.
- **BreakSettingsHandle**:
  - Renders in view mode by default.
  - Shows the break preferences container when the edit button is clicked.
- **BreakSelectorQuickfill**:
  - Renders with assigneeId prop
  - Applies filtering logic correctly with AND operators
  - Handles individual filter properties (isActive, isDefaultPolicy, allowAuto, allowManual, breakType)
  - Shows all breaks when no filter is provided
  - Updates Redux state with filtered breaks
  - Prevents infinite loops during state updates
- **All major user flows (add, edit, delete, confirm/cancel, filtering) are covered by unit tests.**

## Dependencies

- React
- Apollo Client
- Quicksand Provider
- Theme Provider
- Web Shell Core
- Redux Toolkit
- @ids-ts components (Table, Button, Switch, Dropdown, etc.)
- @payroll-shared-components/payroll-settings-section

## Development

### Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test src/js/widgets/breaks/features/breaks-settings/components/BreakSettingsHandle.test.tsx

# Run quickfill tests
yarn test src/js/widgets/breaks/components/BreakSelectorQuickfill.test.tsx
```

### Building

```bash
yarn build
```

## Contributing

1. Follow the project's coding standards
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## License

See LICENSE.md for details. 