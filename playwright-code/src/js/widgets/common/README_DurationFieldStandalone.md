# DurationFieldStandalone

A self-contained duration input component that allows users to enter time
durations in hours and minutes format. This component is independent of React
Hook Form and manages its own state internally.

## Features

- **Self-contained**: No dependencies on React Hook Form
- **Duration formatting**: Converts between seconds and hh:mm format
- **Real-time validation**: Validates input format and maximum duration limits
- **Keyboard navigation**: Supports arrow key navigation for grid layouts
- **Auto-focus**: Can automatically focus when used as a break field
- **Error handling**: Comprehensive error state management
- **Accessibility**: Full ARIA support and keyboard navigation

## Props

| Prop             | Type                                                     | Default | Description                                                                    |
| ---------------- | -------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `value`          | `number \| null`                                         | -       | Duration in seconds                                                            |
| `onChange`       | `(value: number \| null) => void`                        | -       | Callback when value changes                                                    |
| `setError`       | `(error?: string) => void`                               | -       | Callback to set error state                                                    |
| `label`          | `string`                                                 | -       | Field label                                                                    |
| `errorText`      | `string`                                                 | -       | Error text to display (if provided, internal validation errors are suppressed) |
| `name`           | `string`                                                 | `''`    | Field name (used for keyboard navigation)                                      |
| `width`          | `string`                                                 | -       | Custom width styling                                                           |
| `isLocked`       | `boolean`                                                | `false` | Whether field is read-only                                                     |
| `isBreakField`   | `boolean`                                                | `false` | Whether to auto-focus                                                          |
| `billableStatus` | `TimeTracking_BillableStatus`                            | -       | Billable status (unused but kept for compatibility)                            |
| `onKeyDown`      | `(event: React.KeyboardEvent<HTMLInputElement>) => void` | -       | Custom key handler                                                             |

## Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import { DurationFieldStandalone } from './DurationFieldStandalone';

const MyComponent = () => {
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();

  return (
    <DurationFieldStandalone
      value={duration}
      onChange={setDuration}
      setError={setError}
      label="Enter Duration"
      // errorText={error} // Only pass errorText if you want to override internal validation
    />
  );
};
```

### With Keyboard Navigation

```tsx
import { KeyboardNavigationProvider } from 'src/js/common/useKeyboardNavigation';

const MyGridComponent = () => {
  return (
    <KeyboardNavigationProvider>
      <DurationFieldStandalone
        name="row1-col2" // Format: row{number}-col{number}
        value={duration}
        onChange={setDuration}
        setError={setError}
        label="Duration"
      />
    </KeyboardNavigationProvider>
  );
};
```

### With Custom Styling

```tsx
<DurationFieldStandalone
  value={duration}
  onChange={setDuration}
  setError={setError}
  label="Duration"
  width="300px"
  isLocked={false}
  isBreakField={true}
  // errorText={error} // Only pass errorText if you want to override internal validation
/>
```

## Input Format

The component accepts various input formats and automatically formats them:

- `"5"` → `"5:00"`
- `"2:30"` → `"2:30"`
- `"1.5"` → `"1:30"`
- `"1234"` → `"12:34"`

## Validation

The component validates:

1. **Format**: Must be in hh:mm format
2. **Maximum duration**: Cannot exceed 525,600 minutes (365 days)
3. **Empty values**: Handles null/empty values gracefully

## Error Messages

The component uses internationalized error messages:

- `duration.format.error` - Invalid format
- `work.max.duration` - Duration exceeds maximum

**Note**: If you pass `errorText` prop, the component will display that error
instead of its internal validation errors. This is useful when you want to show
custom error messages or when using external validation.

## Keyboard Navigation

When used within a `KeyboardNavigationProvider` and with a properly formatted
`name` prop (e.g., "row1-col2"), the component supports:

- **Arrow Up/Down**: Navigate between rows
- **Tab**: Standard tab navigation
- **Enter**: Standard form submission

## Migration from DurationField

To migrate from the original `DurationField` component:

1. Replace `useWatch` dependency with `isLocked` prop
2. Remove React Hook Form dependencies
3. Manage state externally using `useState`
4. Handle errors through the `setError` callback

### Before (with React Hook Form)

```tsx
const { register, watch } = useForm();
const isLocked = watch('isLocked');

<DurationField
  {...register('duration')}
  value={duration}
  onChange={setDuration}
  setError={setError}
/>;
```

### After (standalone)

```tsx
const [isLocked, setIsLocked] = useState(false);

<DurationFieldStandalone
  value={duration}
  onChange={setDuration}
  setError={setError}
  isLocked={isLocked}
/>;
```

## Testing

The component includes comprehensive tests covering:

- Rendering with various props
- Input validation and formatting
- Error handling
- Keyboard navigation
- Accessibility features

Run tests with:

```bash
yarn test:jest --no-prelint --collect-coverage=false test/unit/common/DurationFieldStandalone.test.tsx
```
