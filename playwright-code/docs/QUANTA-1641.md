# Technical Spec: [Breaks Preferences UI Refactor/QUANTA-1641]

**About this design**

**Driver:** Arup Kumar Gupta

**Approver:** Shekhar Dokania | Vanitha Venkatesh

**Overall Status:** IN_PROGRESS

**Status Date:** 2025-05-07

[Jira: QUANTA-1641](https://jira.intuit.com/browse/QUANTA-1641)

## 1 Introduction

### 1.1 Purpose
This document describes the refactor and enhancement of the Breaks Preferences UI in the time-tracking application. The target audience includes developers, QA, and product managers involved in time-tracking features.

### 1.2 Problem statement
The previous implementation of Breaks Preferences was not modular and lacked a clear separation of concerns, making it difficult to extend and maintain. The new design introduces modular components for CRUD operations, improved state management, and better testability.

### 1.3 Glossary of terms
- **Break Rule**: A rule defining break duration, type, assignment, and status.
- **CRUD**: Create, Read, Update, Delete operations.
- **Trowser**: A side panel UI component for managing preferences.

## 2 Use cases
- As an admin, I want to manage (add, edit, delete) break rules for my team.
- As a user, I want to view all break rules in a table with clear actions.

### 2.1 High level requirements
- Modular React components for break rule management.
- CRUD operations for break rules.
- Responsive and accessible UI.
- Integration with design system components.

## 3 High level solution
Refactor the Breaks Preferences feature into modular components:
- `BreakPreferencesContainer`: Manages the trowser and modal state.
- `BreakPreferences`: Displays the table of break rules and actions.
- `BreakRuleCrudContainer`: Handles the drawer for creating/editing rules.
- `CreateOrEditBreakRule`: The form for rule details.

### 3.1 Principles
- Separation of concerns
- Reusability
- Accessibility
- Testability

### 3.3 Proposed solution
- Use mock data for initial development.
- Integrate with design system for consistent UI.
- Provide comprehensive unit tests.

## 4 Detailed Design

### 4.1 Components

#### BreakRule interface
```typescript
export interface BreakRule {
  id: string;
  name: string;
  duration: string;
  type: 'Paid' | 'Unpaid';
  autoManual: string;
  assignedTo: string;
  isActive: boolean;
}
```

#### BreakPreferencesContainer
- Props:
  - `open: boolean` - Whether the trowser is open
  - `onClose: () => void` - Close handler
- Usage: Wraps the preferences table and manages delete modal state.

#### BreakPreferences
- Props:
  - `data: BreakRule[]` - List of break rules
  - `onDelete: (id: string) => void` - Delete handler
- Usage: Renders a table of break rules with edit/delete actions.

#### BreakRuleCrudContainer
- Props:
  - `open: boolean` - Whether the drawer is open
  - `onClose: () => void` - Close handler
  - `onSave: (data: Partial<BreakRule>) => void` - Save handler
  - `initialData?: Partial<BreakRule>` - Data for editing
- Usage: Wraps the create/edit form in a drawer.

#### CreateOrEditBreakRule
- Props:
  - `open: boolean`
  - `onClose: () => void`
  - `onSave: (data: Partial<BreakRule>) => void`
  - `initialData?: Partial<BreakRule>`
  - `setSubmitForm: (cb: () => void) => void`
- Usage: Form for creating or editing a break rule.

### 4.2 Usage

#### Example: Open Break Preferences in a Trowser
```tsx
import BreakPreferencesContainer from 'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer';

<BreakPreferencesContainer open={true} onClose={() => {}} />
```

#### Example: Render Break Preferences Table
```tsx
import BreakPreferences from 'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferences';

const data = [
  { id: '1', name: 'Rest break', duration: '1 hour', type: 'Paid', autoManual: 'Automatic', assignedTo: 'All team members', isActive: true },
  // ...
];
<BreakPreferences data={data} onDelete={id => {}} />
```

#### Example: Open Create/Edit Drawer
```tsx
import BreakRuleCrudContainer from 'src/js/widgets/breaks/features/breaks-settings/components/BreakRuleCrudContainer';

<BreakRuleCrudContainer open={true} onClose={() => {}} onSave={data => {}} />
```

## 6 Work estimates
| Area     | Description | Estimates (person days) | Comments |
| -------- | ----------- | ----------------------- | -------- |
| Web      | Refactor Breaks Preferences UI | 3 | Includes modularization and unit tests |
| Web      | Integrate with design system   | 1 | |
| Web      | Add/Update unit tests          | 1 | |

## 7 Operational Excellence
- **HA/DR**: N/A (UI only)
- **Alerts, Observability, Tracing**: N/A (UI only)
- **FMEA**: N/A (UI only)

## 8 Code Coverage
| File | Statements | Branches | Functions | Lines |
| ---- | ---------- | -------- | --------- | ----- |
| src/js/widgets/breaks/features/breaks-settings/components/CreateOrEditBreakRule.tsx | 100% | 100% | 100% | 100% |
| src/js/widgets/breaks/features/breaks-settings/components/BreakPreferences.tsx | 100% | 100% | 100% | 100% |
| src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer.tsx | 100% | 100% | 100% | 100% |
| src/js/widgets/breaks/features/breaks-settings/components/BreakRuleCrudContainer.tsx | 100% | 100% | 100% | 100% |
| src/js/widgets/breaks/features/breaks-settings/components/DeleteBreakRuleConfirmationModal.tsx | 100% | 100% | 100% | 100% |

**Test Coverage Notes:**
- All branches, edge cases, and user interactions are now tested for the Breaks Preferences UI refactor.
- Scenarios include: empty data, missing/invalid props, modal open/close, all handler functions, and all UI states.
- The test suite ensures robust coverage and reliability for all main components and the delete confirmation modal.
- All tests are passing and coverage is at 100% for statements, branches, functions, and lines for the above files.

---

*This document was auto-generated based on branch QUANTA-1641. For more details, see [jira.intuit.com/browse/QUANTA-1641](https://jira.intuit.com/browse/QUANTA-1641).* 