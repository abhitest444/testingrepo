# QuickFind Widget Usage Documentation

## Overview

The QuickFind widget is a React-based component designed for quickly finding and selecting team members (employees and vendors) within the time tracking application. It provides a typeahead dropdown interface with real-time search capabilities.

### API Backend - Feature Flag Support

The QuickFind widget supports two backend APIs controlled by the `Enable_QuickFind_OTX` feature flag:

- **DAS API (Default)**: Uses `dataAccessContacts` GraphQL query via `useGetDataAccessContacts` hook
- **GraphQL API (When FF Enabled)**: Uses `timeTrackingWorkers` GraphQL query via `useTimeTrackingWorkers` hook

This allows for gradual migration and A/B testing of the new API without affecting existing functionality.

## Features

- 🔍 **Real-time search**: Typeahead functionality with instant filtering
- 👥 **Team member selection**: Support for employees and vendors
- 🧑‍🔧 **Customer and Project search**: Search / add customer or projects
- 🌐 **Internationalization**: Multi-language support through NLS
- 🎨 **Customizable**: Configurable labels, placeholders, and error messages
- 📱 **Responsive**: Works across different screen sizes
- ♿ **Accessible**: Built with accessibility best practices
- 🎚️ **Feature Flag Controlled**: Supports gradual API migration via feature flags

## Installation & Setup

The QuickFind widget is part of the time-tracking-ui package and requires the following dependencies:

```bash
# Core dependencies (already included in the project)
@payroll/quicksand
@design-systems/theme
web-shell-core
```

### Required Imports

For typical usage, you'll need these imports:

```typescript
// HOC Widget (recommended approach)
import Widget from 'web-shell-core/widgets/HOCWidget';

// Contact types (for subTypes configuration)
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// React Hook Form integration (if using forms)
import { Controller, useFormContext } from 'react-hook-form';

// Internationalization
import { useIntl } from '@payroll/quicksand';

// Data transformation utilities (if needed)
import {
  mapStringToTimeForType,
  mapTimeForState,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
```

## Basic Usage

### HOC Widget Pattern (Recommended)

The quickFind widget is typically used through the HOC Widget pattern, which provides better integration with the platform:

```typescript
import Widget from 'web-shell-core/widgets/HOCWidget';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

// Basic usage in a React component
<Widget
  widgetId="time-tracking-ui/quickFind"
  dropdownType="team-member"
  subTypes={[DataAccess_ContactType.Employee, DataAccess_ContactType.Vendor]}
  onChange={(value: string, item: any) => {
    console.log('Selected ID:', value);
    console.log('Selected Item:', item);
  }}
  onReady={(data: any[]) => {
    console.log('Widget ready with data:', data);
  }}
  placeholder="Select a team member..."
  label="Team Member"
/>
```

### React Hook Form Integration

Real-world usage with React Hook Form validation (as used in BreakEntryFormFields):

```typescript
import { Controller, useFormContext } from 'react-hook-form';
import { useIntl } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';

const TeamMemberField = () => {
  const intl = useIntl();
  const { setValue, getValues } = useFormContext();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Controller
      name="contact"
      rules={{
        validate: (value) => {
          if (!value || !value.id || value.id === '') {
            return intl.formatMessage({
              id: 'drawer.field.required',
            });
          }
          return undefined;
        },
      }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Widget
          widgetId="time-tracking-ui/quickFind"
          dropdownType="team-member"
          subTypes={[
            DataAccess_ContactType.Employee,
            DataAccess_ContactType.Vendor,
          ]}
          onChange={(_, item) => {
            onChange(item); // Update form value
          }}
          value={value?.id}
          onReady={(data) => {
            setIsLoading(false);
          }}
          onLoad={(data) => {
            // Handle data loading and form updates
            const item = data?.[0];
            const existingValue = getValues().contact;
            const updatedValue = {
              ...existingValue,
              ...(item?.type && {
                type: mapStringToTimeForType(item.type),
              }),
            };
            setValue('contact', updatedValue, { shouldDirty: false });
          }}
          placeholder={intl.formatMessage({
            id: 'team.member.placeholder',
          })}
          label={intl.formatMessage({
            id: 'team.member',
          })}
          errorText={error?.message}
        />
      )}
    />
  );
};
```

## API Reference

### Widget Configuration

#### Widget ID
The quickFind widget uses the following widget ID for HOC integration:
```typescript
widgetId="time-tracking-ui/quickFind"
```

#### Widget Props (HOC Pattern)

When using the HOC Widget pattern, the following props are passed directly to the Widget component:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `dropdownType` | `QuickFindDropdownType` | No | `'team-member'` | Type of dropdown to render |
| `subTypes` | `ContactType[]` | No | `[]` | Contact types to include in search |
| `value` | `any` | No | `''` | Initial selected value |
| `label` | `string` | No | - | Label text for the dropdown |
| `placeholder` | `string` | No | - | Placeholder text |
| `errorText` | `string` | No | - | Error message to display |
| `onChange` | `(value: string, item?: any) => void` | No | - | Callback when selection changes |
| `onReady` | `(data?: any) => void` | No | - | Callback when widget is ready |
| `onError` | `(error: Error \| string) => void` | No | - | Callback for error handling |
| `onLoad` | `(data?: any) => void` | No | - | Callback when data loads |
| `filters` | `FilterConfig` | No | - | Advanced filtering options |

### Types

#### ContactType Enum

```typescript
export enum ContactType {
  Employee = 'EMPLOYEE',
  Vendor = 'VENDOR',
}
```

#### QuickFindDropdownType

```typescript
export type QuickFindDropdownType = 'team-member' | 'service' | 'class';
```

#### TeamMember Interface

```

## Event Handling

### onChange Event

Triggered when a user selects a team member:

```typescript
const handleChange = (value: string, item?: TeamMember) => {
  console.log('Selected ID:', value);
  console.log('Selected Item:', item);
  
  // Update your application state
  setSelectedTeamMember(item);
};
```

### onReady Event

Called when the widget has finished initializing:

```typescript
const handleReady = () => {
  console.log('QuickFind widget is ready');
  // Enable form submission or other dependent functionality
  setFormReady(true);
};
```

### onError Event

Handles errors that occur during data loading or user interaction:

```typescript
const handleError = (error: Error | string) => {
  console.error('QuickFind error:', error);
  // Show user-friendly error message
  showNotification('Unable to load team members. Please try again.', 'error');
};
```

## Advanced Examples

### Advanced Filtering with Complex Rules

Real-world example from BreakEntryFormFields showing advanced filtering capabilities:

```typescript
<Widget
  widgetId="time-tracking-ui/quickFind"
  dropdownType="team-member"
  subTypes={[
    DataAccess_ContactType.Employee,
    DataAccess_ContactType.Vendor,
  ]}
  filters={{
    subtypes: {
      [DataAccess_ContactType.Vendor]: {
        contractor: false, // Exclude contractor vendors
      },
    },
  }}
  onChange={(_, item) => {
    handleTeamMemberSelection(item);
  }}
  // ... other props
/>
```

### Feature Flag Conditional Rendering

Production pattern for graceful fallback to legacy widgets:

```typescript
import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';

const TeamMemberSelector = () => {
  const isQuickFindEnabled = useAppSelector(
    (state) => state.breakEntries.isQuickFindEnabled,
  );

  return (
    <div>
      {isQuickFindEnabled ? (
        // New QuickFind Widget
        <Widget
          widgetId="time-tracking-ui/quickFind"
          dropdownType="team-member"
          subTypes={[
            DataAccess_ContactType.Employee,
            DataAccess_ContactType.Vendor,
          ]}
          onChange={(_, item) => {
            onChange(item);
          }}
          value={value?.id}
          onReady={handleTeamMemberReady}
          onLoad={(data) => {
            const item = data?.[0];
            const existingValue = getValues().contact;
            const updatedValue = {
              ...existingValue,
              ...(item?.type && {
                type: mapStringToTimeForType(item.type),
              }),
            };
            setValue('contact', updatedValue, { shouldDirty: false });
          }}
          placeholder={intl.formatMessage({
            id: 'team.member.placeholder',
          })}
          label={intl.formatMessage({
            id: 'team.member',
          })}
          errorText={error?.message}
          filters={{
            subtypes: {
              [DataAccess_ContactType.Vendor]: {
                contractor: false,
              },
            },
          }}
        />
      ) : (
        // Legacy Quickfills Widget (fallback)
        <Widget
          widgetId="qbo-quickfills-ui/quickfills"
          addNew={false}
          shouldShowSubLabel
          type="contact"
          subTypes={['employee', 'vendor']}
          value={value?.id}
          onChange={(e) => {
            const newValue = mapTimeForState(e);
            onChange(newValue);
          }}
          onReady={handleTeamMemberReady}
          onLoad={(item) => {
            // Legacy data handling
            const existingValue = getValues().contact;
            const updatedValue = {
              ...existingValue,
              ...(item?.contact?.type && {
                type: mapStringToTimeForType(item.contact.type),
              }),
            };
            setValue('contact', updatedValue, { shouldDirty: false });
          }}
          placeholder={intl.formatMessage({
            id: 'team.member.placeholder',
          })}
          label={intl.formatMessage({
            id: 'team.member',
          })}
          errorText={error?.message}
          width={BREAK_ENTRY_FIELDS_WIDTH}
          excludePayrollInactiveEmployees
        />
      )}
    </div>
  );
};
```

### Loading State Management

Managing loading states during data fetching:

```typescript
const [isTeamMemberLoading, setIsTeamMemberLoading] = useState(true);

const handleTeamMemberReady = () => {
  setIsTeamMemberLoading(false);
};

return (
  <FormWrapper>
    <LoadingOverlay isLoading={isTeamMemberLoading} />
    <Widget
      widgetId="time-tracking-ui/quickFind"
      // ... other props
      onReady={(data) => {
        handleTeamMemberReady();
      }}
    />
  </FormWrapper>
);
```

### Data Transformation and Mapping

Pattern for transforming widget data to match form requirements:

```typescript
import {
  mapStringToTimeForType,
  mapTimeForState,
} from 'src/js/widgets/common/addTimeFormComponents/TeamMember';

<Widget
  widgetId="time-tracking-ui/quickFind"
  dropdownType="team-member"
  subTypes={[DataAccess_ContactType.Employee, DataAccess_ContactType.Vendor]}
  onChange={(_, item) => {
    // Transform widget data to form-compatible format
    const formValue = {
      id: item.id,
      name: item.name,
      type: mapStringToTimeForType(item.type),
      // Add any other required fields
    };
    onChange(formValue);
  }}
  onLoad={(data) => {
    // Handle initial data loading
    const item = data?.[0];
    if (item) {
      const existingValue = getValues().contact;
      const updatedValue = {
        ...existingValue,
        ...(item?.type && {
          type: mapStringToTimeForType(item.type),
        }),
      };
      setValue('contact', updatedValue, { shouldDirty: false });
    }
  }}
  // ... other props
/>
```

## Internationalization

The widget supports multiple languages through the NLS (National Language Support) system. Default text keys include:

```json
{
  "quickfind.dropdown.loading": "Loading...",
  "quickfind.dropdown.error": "Something went wrong. Please try again.",
  "quickfind.dropdown.no-contacts": "No contacts available",
  "quickfind.dropdown.team.member.label": "Name",
  "quickfind.dropdown.team.member.placeholder": "Select a team member..."
}
```

To customize text for different locales, add translations to the appropriate NLS files in `src/nls/`.

## Styling and Customization

The widget uses styled-components and follows the design system theme. Key CSS classes:

- `.quickfind-menu-item`: Menu item styling
- Global styles are applied through `QuickFindDropdownGlobalStyle`

### Custom Styling Example

```typescript
// The widget automatically applies theme from sandbox
// Custom styles can be added through CSS classes or styled-components
```

## Data Source

The widget fetches team member data using GraphQL. The backend API is controlled by the `Enable_QuickFind_OTX` feature flag:

### DAS API (Default - Feature Flag Disabled)
Uses `useGetDataAccessContacts` hook:
- Query: `dataAccessContacts`
- Response: Standard DataAccess contact format
- Filtering: By contact type and active status

### GraphQL API (Feature Flag Enabled)
Uses `useTimeTrackingWorkers` hook:
- Query: `timeTrackingWorkers`
- Response: Time tracking worker format with cursor-based pagination
- Filtering: By worker type, active status, and search text
- Query structure:
  ```graphql
  query getTimeTrackingWorkers(
    $first: PositiveInt! = 100
    $after: String
    $filter: TimeTracking_WorkersQueryFilter
    $orderBy: [TimeTracking_WorkerOrderBy!]
  ) {
    timeTrackingWorkers(first: $first, after: $after, filter: $filter, orderBy: $orderBy) {
      edges {
        node {
          id
          type
          isActive
          firstName
          lastName
          displayName
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ```

Both APIs automatically:
- Filter results based on `subTypes` configuration
- Provide real-time search as user types
- Handle loading and error states
- Cache results for performance

## Browser Support

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- IE 11 not supported (use of modern JavaScript features)

## Accessibility

The widget implements accessibility best practices:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Troubleshooting

### Common Issues

#### Widget Not Loading Data

```typescript
// Check that sandbox and GraphQL client are properly configured
const widget = new QuickFindWidget({
  sandbox: validSandboxInstance, // Ensure this is valid
  // ... other props
});
```

#### Selection Not Working

```typescript
// Ensure onChange callback is properly defined
props: {
  onChange: (value, item) => {
    console.log('Change event:', { value, item }); // Debug output
    // Your logic here
  }
}
```

#### Styling Issues

- Verify that theme provider is properly configured
- Check for CSS conflicts with global styles
- Ensure design system tokens are loaded

### Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `QUICK_FIND_CRASH` | Widget crashed during rendering | Check console for detailed error, verify props |
| GraphQL errors | Data fetching failures | Verify network connectivity and API permissions |

## Performance Considerations

- The widget implements debounced search (300ms) to avoid excessive API calls
- Results are cached to improve subsequent search performance
- Use specific `subTypes` to reduce data payload size
- GraphQL API (when enabled) supports cursor-based pagination for large datasets
- Feature flag evaluation happens once per component instance using `useRef` pattern

## Migration Notes

If migrating from the legacy `quickFillWidgets` or `qbo-quickfills-ui/quickfills`:

### Widget ID Change
```typescript
// OLD
widgetId="qbo-quickfills-ui/quickfills"

// NEW  
widgetId="time-tracking-ui/quickFind"
```

### Property Changes
1. **subTypes format**: Use `DataAccess_ContactType` enum instead of strings
   ```typescript
   // OLD
   subTypes={['employee', 'vendor']}
   
   // NEW
   subTypes={[DataAccess_ContactType.Employee, DataAccess_ContactType.Vendor]}
   ```

2. **New required prop**: Add `dropdownType` prop
   ```typescript
   // NEW (required)
   dropdownType="team-member"
   ```

3. **Remove legacy props**: Properties like `addNew`, `shouldShowSubLabel`, `type`, `width`, `excludePayrollInactiveEmployees` are no longer needed

4. **NLS keys**: Update to new `quickFind.*` keys
   ```typescript
   // OLD
   "quickfill.dropdown.placeholder"
   
   // NEW
   "quickfind.dropdown.team.member.placeholder"
   ```

### Event Handler Changes
```typescript
// OLD - legacy quickfills onChange
onChange={(e) => {
  const newValue = mapTimeForState(e);
  onChange(newValue);
}}

// NEW - quickFind onChange  
onChange={(_, item) => {
  onChange(item); // Direct item usage
}}
```

### Testing Migration
1. Implement feature flag conditional rendering for gradual rollout
2. Test data transformation functions (`mapStringToTimeForType`, `mapTimeForState`)
3. Verify form validation continues to work
4. Test internationalization with all supported locales
5. Ensure loading states and error handling work correctly

## Feature Flag Implementation

### Overview
The `Enable_QuickFind_OTX` feature flag controls which backend API the QuickFind widget uses internally. This is transparent to consumers of the widget.

### Feature Flag Details
- **Flag Name**: `Enable_QuickFind_OTX`
- **Default**: `false` (uses DAS API)
- **When Enabled**: Uses GraphQL `timeTrackingWorkers` API
- **Location**: Evaluated in `QuickFindContent.tsx` using `useFeatureFlag` hook

### Implementation Pattern
```typescript
// src/js/widgets/quickFind/components/QuickFindContent.tsx
const isQuickFindOTXEnabled = useFeatureFlag(
  FEATURE_FLAGS.ENABLE_QUICKFIND_OTX,
  false,
);

return isQuickFindOTXEnabled ? (
  <TeamMemberDropdownGraphQL {...props} />  // New API
) : (
  <TeamMemberDropdown {...props} />          // DAS API
);
```

### Expected Logs
When the QuickFind widget loads, you'll see this log:
```
Event=Evaluation result for feature flag - Enable_QuickFind_OTX Result=false
```

### Migration Path
1. **Phase 1 (Current)**: FF disabled, uses DAS API (existing behavior)
2. **Phase 2**: Enable FF for beta users, monitor logs and performance
3. **Phase 3**: Gradual rollout to all users
4. **Phase 4**: Make GraphQL API default, remove FF and old implementation

### Testing with Feature Flag
```typescript
// To test GraphQL API locally:
// 1. Enable feature flag via IXP: Enable_QuickFind_OTX = true
// 2. Reload the application
// 3. Check console for: "Result=true"
// 4. QuickFind will now use timeTrackingWorkers API
```

### For Widget Consumers
**No changes required!** The feature flag is internal to the QuickFind widget. All props and callbacks remain the same regardless of which API is used.

## Examples Repository

For more examples and integration patterns, see the test files in:
- `test/unit/widgets/quickFind/Widget.test.tsx`
- `test/unit/widgets/quickFind/components/QuickFindContent.test.tsx`
- `test/unit/widgets/quickFind/components/TeamMemberDropdownGraphQL.test.tsx` (GraphQL API tests)

## Support

For questions or issues:
1. Check this documentation
2. Review test files for usage examples
3. Check console for error messages and feature flag logs
4. Contact the Time Tracking UI team

---
