# Technical Spec: QUANTA-1405-opex - TTO Home Page Widget (OPEX Update)

**About this design**

**Driver:** Arup Kumar Gupta

**Approver:** Shekhar Dokania | Vanitha Venkatesh

**Overall Status:** IN_PROGRESS

**Status Date:** 2025-05-22

---

[Jira Link](https://jira.intuit.com/browse/QUANTA-1405-opex)

*This document is an OPEX/operational excellence update for the TTO Home Page Widget, reflecting changes and improvements in the `QUANTA-1405-opex` branch.*

## 1 Introduction

### 1.1 Purpose
This document describes the design and implementation of the new TTO (Time Tracking Only) Home Page widget, introduced in branch `QUANTA-1405`. The target audience includes developers, QA, and product managers involved in time tracking UI enhancements.

### 1.2 Problem statement
The existing time tracking UI lacked a dedicated, user-friendly home page for TTO users, making it difficult to quickly view tracked hours and add new time entries. This feature addresses usability and workflow efficiency for TTO users.

### 1.3 Glossary of terms
- **TTO**: Time Tracking Only
- **Widget**: A self-contained UI component
- **Sandbox**: Mocked environment for testing
- **ApolloProvider**: React context provider for GraphQL

## 2 Use cases
- As a TTO user, I want to see my weekly and monthly tracked hours at a glance.
- As a TTO user, I want to quickly add new time entries from the home page.
- As a TTO user, I want to navigate between home and details pages easily.

### 2.1 High level requirements
- Display user and company info
- Show weekly/monthly tracked hours
- Allow adding/viewing time entries
- Responsive and accessible UI

## 3 High level solution
A new widget, `TTOWidget`, is introduced, leveraging context providers and Apollo GraphQL for data. The widget is modular, with clear separation of concerns and hooks for data fetching.

### 3.1 Principles
- Reusability: Components are modular and context-driven
- Performance: Uses React Suspense and lazy data fetching
- Accessibility: Follows design system standards

### 3.3 Proposed solution
- New files under `src/js/widgets/ttoHomePage/` for widget, context, feature renderer, and supporting components
- Integration with existing Apollo and Quicksand providers
- NLS support for localization

## 4 Detailed Design

### 4.1 Components
- **TTOWidget**: Main entry point, extends `BaseWidget`, manages navigation and context
- **TTOFeatureRenderer**: Decides which feature/page to render based on context and props
- **TTOHomePage**: Displays user greeting, company, tracked hours, and add time button
- **TTOContext**: Provides user, company, and duration data to children

#### TTOWidget Interface (TypeScript)
```tsx
export interface TTOWidgetProps {
  sandbox: any;
  externalApolloClient?: ApolloClient<any>;
  options?: any;
  routeInfo?: any;
}
```

#### TTOContextType Interface
```tsx
interface TTOContextType {
  userName: string;
  isExpenseEnabled: boolean;
  companyName: string;
  weekDuration: number | null;
  weekDurationLoading: boolean;
  monthDuration: number | null;
  monthDurationLoading: boolean;
  weekRange: string;
  monthLabel: string;
}
```

### 4.2 Usage
#### Example: Embedding the TTOWidget
```tsx
import TTOWidget from 'src/js/widgets/ttoHomePage/TTOWidget';

<TTOWidget sandbox={sandboxInstance} />
```

#### Example: Using TTOContext in a child component
```tsx
import { useTTOContext } from 'src/js/widgets/ttoHomePage/context/TTOContext';

const MyComponent = () => {
  const { userName, weekDuration } = useTTOContext();
  return <div>Hello {userName}, you tracked {weekDuration} hours this week.</div>;
};
```

#### Example: TTOHomePage UI
```tsx
<TTOHomePage onAddTime={handleAddTime} onView={handleView} sandbox={sandbox} />
```

## 5 Test Coverage

| File | % Stmts | % Branch | % Funcs | % Lines |
|------|---------|----------|---------|---------|
| src/js/widgets/ttoHomePage/TTOWidget.tsx | 80.64% | 80% | 50% | 80.64% |
| src/js/widgets/ttoHomePage/TTOFeatureRenderer.tsx | 81.48% | 83.33% | 100% | 81.48% |
| src/js/widgets/ttoHomePage/context/TTOContext.tsx | 85.71% | 47.91% | 100% | 85.29% |
| src/js/widgets/ttoHomePage/features/home-page/TTOHomePage.tsx | 95.45% | 40% | 100% | 100% |
| src/js/widgets/ttoHomePage/features/details-page/TTOAddTimeDetails.tsx | 97.14% | 43.33% | 100% | 100% |
| src/js/providers/LoggingConfigProvider.tsx | 100% | 100% | 100% | 100% |

*Coverage is current as of 2025-05-22. See `reports/jest/coverage-final.json` for details.*

## 6 Work estimates
| Area     | Description | Estimates (person days) | Comments |
| -------- | ----------- | ----------------------- | -------- |
| Web      | Widget implementation | 3 | Includes context, renderer, and UI |
| Web      | NLS integration | 0.5 | |
| Web      | Unit tests | 1 | |
| Web      | Documentation | 0.5 | |

## 7 Operational Excellence
- **HA/DR (High Availability/Disaster Recovery):** The TTO Home Page Widget is stateless and does not maintain backend state, enabling easy scaling, failover, and recovery. No persistent data is stored in the widget itself.
- **Alerts, Observability, Tracing:**
  - The widget uses the sandbox logger and `LoggingConfigProvider` to log key lifecycle events, API calls, and errors. For example, `logger.info` is called on widget mount, API call success, and page renders; `logger.error` is called on API failures and unexpected errors. These logs are structured and can be integrated with monitoring and alerting systems for proactive issue detection.
  - Customer interactions are tracked using `createCustomerInteraction`, `endInteractionWithSuccess`, and `endInteractionWithFailure` (see `useTTOTimeWindowDuration`). This enables tracing of user actions and API flows, supporting both observability and customer support investigations.
  - Analytics events are tracked using `sandbox.analytics.track` and click tracking utilities (see `src/js/common/useClickTracking.ts`).
  - Example log and analytics events:
    - Widget mount: `sandbox.logger.log(LOG_WIDGET_MOUNTED)`
    - API call start/success/failure: `logger.info('Triggering week and month duration API calls', ...)`, `logger.info('Week duration API call succeeded', ...)`, `logger.error('Week duration API call failed', ...)`
    - Customer interaction: `createCustomerInteraction(...)`, `endInteractionWithSuccess(...)`, `endInteractionWithFailure(...)`
    - Analytics: `sandbox.analytics.track('event_name', { ... })`
- **FMEA (Failure Mode and Effects Analysis):** The widget handles critical errors gracefully, such as missing Apollo client, navigation failures, and API errors. User feedback is provided for recoverable errors, and all failures are logged for diagnosis. The design ensures that failures in one part of the widget do not cascade or impact the overall user experience.

### LoggingConfigProvider Interface
```tsx
export interface LoggingConfig {
  context?: Record<string, unknown>;
  prefix?: string;
}

export const LoggingConfigProvider: React.FC<LoggingConfigProviderProps> = ({
  sandbox,
  context,
  prefix,
  children,
}) => { /* ... */ };

export function useLoggingConfig(): SandboxLogger;
```

### Example: Using LoggingConfigProvider
```tsx
import { LoggingConfigProvider, useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

<LoggingConfigProvider sandbox={sandbox} prefix="TimeTrackingOnly">
  <MyComponent />
</LoggingConfigProvider>

// In a child component
const logger = useLoggingConfig();
logger.info('MyComponent rendered');
``` 