# Break Entries Feature

The Break Entries feature allows users to create and manage break entries using
a form that renders inside an IDS drawer.

## Features

- **Break Entry Form**: A comprehensive form for creating break entries
- **Quickfill Integration**: Uses the existing BreakSelectorQuickfill component
  for break rule selection
- **Redux State Management**: Manages form state and break entries in Redux
- **Form Components**: Uses existing form components from the codebase

## Components

### BreakEntryForm

The main form component that renders inside an IDS drawer. It includes:

- Break rule selection using HOCWidget
- Date and time fields using FormattedDatePicker and TimeDropdown
- Timezone selection using TimeZoneField
- Notes field using Notes component

### BreakEntryFormContainer

A wrapper component that handles Redux state management for the form:

- Manages form open/close state
- Handles initial data from Redux
- Provides save/cancel callbacks
- Integrates with external onSave/onCancel props

### BreakEntryFormFields

Contains all the form fields and handles the integration with the quickfill
component.

### BreakEntryTrigger

A simple trigger component to open the break entry form.

## Usage

### Using the Widget

```typescript
import Widget from 'web-shell-core/widgets/HOCWidget';

<Widget
  key="break-entry-form"
  widgetId="time-tracking-ui/breaks"
  options={{
    feature: 'break-entries',
    functionality: 'create-break-entry',
    props: {
      assigneeId: '400000009',
      onSave: (data) => {
        console.log('Break entry saved:', data);
      },
      onCancel: () => {
        console.log('Form cancelled');
      },
    },
  }}
/>;
```

### Using the Container Component

```typescript
import BreakEntryFormContainer from 'src/js/widgets/breaks/features/break-entries/components/BreakEntryFormContainer';

<BreakEntryFormContainer
  assigneeId="400000009"
  onSave={(data) => {
    console.log('Break entry saved:', data);
  }}
  onCancel={() => {
    console.log('Form cancelled');
  }}
/>;
```

### Using the Form Component Directly

```typescript
import BreakEntryForm from 'src/js/widgets/breaks/features/break-entries/components/BreakEntryForm';

<BreakEntryForm
  open={isOpen}
  onClose={handleClose}
  onSave={handleSave}
  assigneeId="400000009"
  initialData={existingData}
/>;
```

## Redux State

The feature uses a dedicated Redux slice (`breakEntriesSlice`) that manages:

- Form open/close state
- Loading states
- Error handling
- Current entry data
- List of break entries

### Actions

- `openBreakEntryForm`: Opens the form with optional initial data
- `closeBreakEntryForm`: Closes the form and resets state
- `setBreakEntryFormLoading`: Sets loading state
- `setBreakEntryFormError`: Sets error state
- `addBreakEntry`: Adds a new break entry
- `updateBreakEntry`: Updates an existing break entry
- `removeBreakEntry`: Removes a break entry
- `clearBreakEntries`: Clears all break entries

## Form Fields

1. **Break Rule Selection**: Uses HOCWidget with breaks-quickfills feature
2. **Start Date**: FormattedDatePicker component
3. **End Date**: FormattedDatePicker component (optional)
4. **Start Time**: TimeDropdown component
5. **End Time**: TimeDropdown component
6. **Timezone**: TimeZoneField component
7. **Notes**: Notes component (optional)

## NLS Keys

The following NLS keys are used:

- `breaks.entry.form.title`: Form title
- `breaks.entry.form.cancel`: Cancel button text
- `breaks.entry.form.save`: Save button text
- `breaks.entry.form.startDate.label`: Start date label
- `breaks.entry.form.endDate.label`: End date label
- `breaks.entry.form.startTime.label`: Start time label
- `breaks.entry.form.endTime.label`: End time label
- `breaks.entry.form.startDate.required`: Start date validation message
- `breaks.entry.form.timezone.required`: Timezone validation message
- `breaks.entry.trigger.button`: Trigger button text

## Dependencies

- React Hook Form for form management
- Redux Toolkit for state management
- IDS components for UI
- Existing form components from the codebase
- HOCWidget for break rule selection
