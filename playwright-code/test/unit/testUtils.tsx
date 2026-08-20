import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { buildSandbox, MockQuicksandProvider } from '@payroll/quicksand';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook } from '@testing-library/react-hooks';
import { RenderHookResult } from '@testing-library/react-hooks/src/types';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import ADSProvider from 'src/js/providers/ADSProvider';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';

// ------------------------------------------------------- default test sandbox
export const getDefaultSandbox = (): Sandbox => {
  // use quicksand default mock sandbox
  const sandbox = buildSandbox();

  // add a default date format
  sandbox.extensions.qbo.context.getCompanyL10nInfo = jest
    .fn()
    .mockReturnValue({
      defaultDateFormat: 'mm/dd/yyyy',
    });

  // add a default getAuthInfo mock for authorization
  sandbox.extensions.qbo.context.getAuthInfo = jest.fn().mockReturnValue({
    legacyPermissions: {
      features: {
        companyPrefs: 'ALL',
      },
    },
  });

  // @ts-ignore
  sandbox.experiments.optInUserToTreatmentsIL = jest
    .fn()
    .mockResolvedValue({ status: 'SUCCESS' });

  // add a default getAppInfo mock for appContext
  sandbox.appContext.getAppInfo = jest
    .fn()
    .mockReturnValue({ appName: 'quickbooks', appId: 'qbo-app' });

  // add missing methods for IXP unification hook
  sandbox.appContext.getEnvironment = jest.fn().mockReturnValue(Environment.QA);

  sandbox.appContext.getRealmInfo = jest
    .fn()
    .mockReturnValue({ realmId: '123456' });

  sandbox.extensions.qbo.context.getCompanyInfo = jest.fn().mockReturnValue({
    companyCreateDateInServerLocale: '2020-01-01',
  });

  sandbox.experiments.getRemoteExperimentAssignments = jest
    .fn()
    .mockResolvedValue([
      {
        treatmentKey: 'IXP2_T_1059480',
        experimentId: 485059,
      },
    ]);

  return sandbox;
};

// ------------------------------------------------------- create default Redux store
export const createDefaultStore = (
  reducers: any = {},
  preloadedState: any = undefined,
) =>
  configureStore({
    reducer: {
      // Add default reducers here if needed
      ...reducers,
    },
    ...(preloadedState ? { preloadedState } : {}),
  });

// ------------------------------------------------------- create qbtOrchestrator store with overtime reducer
export const createQbtOrchestratorStore = (preloadedState: any = undefined) => {
  // Import reducers dynamically to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sharedReducer =
    require('src/js/widgets/qbtOrchestrator/store/shared').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const uiReducer = require('src/js/widgets/qbtOrchestrator/store/ui').default;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    overtimeReducer,
  } = require('src/js/widgets/qbtOrchestrator/features/overtime/store');

  return configureStore({
    reducer: {
      shared: sharedReducer,
      ui: uiReducer,
      overtime: overtimeReducer,
    },
    ...(preloadedState ? { preloadedState } : {}),
  });
};

// ------------------------------------------------------- wrappers for provider mocks

const QuicksandWrapper: React.FC<{ sandbox: Sandbox }> = ({
  children,
  sandbox,
}) => (
  <MockQuicksandProvider sandbox={sandbox}>{children}</MockQuicksandProvider>
);

const ReduxWrapper: React.FC<{ store: any }> = ({ children, store }) => (
  <Provider store={store}>{children}</Provider>
);

const QuicksandReduxWrapper: React.FC<{ sandbox: Sandbox; store: any }> = ({
  children,
  sandbox,
  store,
}) => (
  <MockQuicksandProvider sandbox={sandbox}>
    <Provider store={store}>{children}</Provider>
  </MockQuicksandProvider>
);

const FormWrapper: React.FC<{ sandbox: Sandbox; defaultValues: any }> = ({
  children,
  sandbox,
  defaultValues,
}) => (
  <MockQuicksandProvider sandbox={sandbox}>
    <LoggingConfigProvider sandbox={sandbox}>
      <FormProvider
        {...useForm({
          defaultValues,
        })}
      >
        {children}
      </FormProvider>
    </LoggingConfigProvider>
  </MockQuicksandProvider>
);

const ApolloWrapper: React.FC<{ sandbox: Sandbox; mocks: any[] }> = ({
  children,
  sandbox,
  mocks,
}) => (
  <MockQuicksandProvider sandbox={sandbox}>
    <LoggingConfigProvider sandbox={sandbox}>
      <MockedProvider mocks={mocks} addTypename>
        {children}
      </MockedProvider>
    </LoggingConfigProvider>
  </MockQuicksandProvider>
);

const AllTheWrappers: React.FC<{
  sandbox: Sandbox;
  mocks: any[];
  defaultValues: any;
}> = ({ children, sandbox, mocks, defaultValues }) => (
  <MockQuicksandProvider sandbox={sandbox}>
    <ADSProvider>
      <MockedProvider mocks={mocks} addTypename>
        <FormProvider
          {...useForm({
            defaultValues,
          })}
        >
          {children}
        </FormProvider>
      </MockedProvider>
    </ADSProvider>
  </MockQuicksandProvider>
);

// ---------------------------------------------------------- render components with mock wrappers

export const renderWithQuicksandProvider = (
  ui: React.ReactElement,
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <QuicksandWrapper sandbox={sandbox}>{children}</QuicksandWrapper>
    ),
  });

export const renderWithQuicksandProviderAndLogging = (
  ui: React.ReactElement,
  sandbox: Sandbox = getDefaultSandbox(),
  prefix: string = 'test',
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <MockQuicksandProvider sandbox={sandbox}>
        <LoggingConfigProvider sandbox={sandbox} prefix={prefix}>
          {children}
        </LoggingConfigProvider>
      </MockQuicksandProvider>
    ),
  });

export const renderWithReduxProvider = (
  ui: React.ReactElement,
  store: any = createDefaultStore(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <ReduxWrapper store={store}>{children}</ReduxWrapper>
    ),
  });

export const renderWithQuicksandAndReduxProvider = (
  ui: React.ReactElement,
  store: any = createDefaultStore(),
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <QuicksandReduxWrapper sandbox={sandbox} store={store}>
        {children}
      </QuicksandReduxWrapper>
    ),
  });

export const renderWithQuicksandReduxAndLogging = (
  ui: React.ReactElement,
  store: any = createDefaultStore(),
  sandbox: Sandbox = getDefaultSandbox(),
  prefix: string = 'test',
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <MockQuicksandProvider sandbox={sandbox}>
        <LoggingConfigProvider sandbox={sandbox} prefix={prefix}>
          <Provider store={store}>{children}</Provider>
        </LoggingConfigProvider>
      </MockQuicksandProvider>
    ),
  });

export const renderWithFormProvider = (
  ui: React.ReactElement,
  { defaultValues = {} } = {},
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <FormWrapper sandbox={sandbox} defaultValues={defaultValues}>
        {children}
      </FormWrapper>
    ),
  });

export const renderWithApolloProvider = (
  ui: React.ReactElement,
  mocks: any[] = [],
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <ApolloWrapper sandbox={sandbox} mocks={mocks}>
        {children}
      </ApolloWrapper>
    ),
  });

export const renderWithAllProviders = (
  ui: React.ReactElement,
  mocks: any[] = [],
  { defaultValues = {} } = {},
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <AllTheWrappers
        sandbox={sandbox}
        mocks={mocks}
        defaultValues={defaultValues}
      >
        {children}
      </AllTheWrappers>
    ),
  });

const AllTheWrappersWithLoggingConfigProvider = ({
  children,
  sandbox,
  mocks,
  defaultValues,
}: {
  children: React.ReactNode;
  sandbox: Sandbox;
  mocks: any[];
  defaultValues: any;
}) => (
  <MockQuicksandProvider sandbox={sandbox}>
    <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
      <ADSProvider>
        <MockedProvider mocks={mocks}>
          <FormProvider {...useForm({ defaultValues })}>
            {children}
          </FormProvider>
        </MockedProvider>
      </ADSProvider>
    </LoggingConfigProvider>
  </MockQuicksandProvider>
);

export const renderWithAllAppProviders = (
  ui: React.ReactElement,
  mocks: any[] = [],
  { defaultValues = {} } = {},
  sandbox: Sandbox = getDefaultSandbox(),
) =>
  render(ui, {
    wrapper: ({ children }) => (
      <AllTheWrappersWithLoggingConfigProvider
        sandbox={sandbox}
        mocks={mocks}
        defaultValues={defaultValues}
      >
        {children}
      </AllTheWrappersWithLoggingConfigProvider>
    ),
  });

// ---------------------------------------------------------- render hooks with mock wrappers

export const renderHookWithQuicksandProvider = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  sandbox: Sandbox = getDefaultSandbox(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <QuicksandWrapper sandbox={sandbox}>{children}</QuicksandWrapper>
    ),
  });

export const renderHookWithReduxProvider = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  store: any = createDefaultStore(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <ReduxWrapper store={store}>{children}</ReduxWrapper>
    ),
  });

export const renderHookWithQuicksandAndReduxProvider = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  store: any = createDefaultStore(),
  sandbox: Sandbox = getDefaultSandbox(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <QuicksandReduxWrapper sandbox={sandbox} store={store}>
        {children}
      </QuicksandReduxWrapper>
    ),
  });

export const renderHookWithFormProvider = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  { defaultValues = {} } = {},
  sandbox: Sandbox = getDefaultSandbox(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <FormWrapper sandbox={sandbox} defaultValues={defaultValues}>
        {children}
      </FormWrapper>
    ),
  });

export const renderHookWithApolloProvider = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  mocks: any[] = [],
  sandbox: Sandbox = getDefaultSandbox(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <ApolloWrapper sandbox={sandbox} mocks={mocks}>
        {children}
      </ApolloWrapper>
    ),
  });

export const renderHookWithAllProviders = <P, R>(
  // eslint-disable-next-line no-unused-vars
  callback: (props: P) => R,
  mocks: any[] = [],
  { defaultValues = {} } = {},
  sandbox: Sandbox = getDefaultSandbox(),
): RenderHookResult<P, R> =>
  renderHook(callback, {
    wrapper: ({ children }) => (
      <LoggingConfigProvider sandbox={sandbox}>
        <AllTheWrappers
          sandbox={sandbox}
          mocks={mocks}
          defaultValues={defaultValues}
        >
          {children}
        </AllTheWrappers>
      </LoggingConfigProvider>
    ),
  });

// ---------------------------------------------------------- shared mock functions

/**
 * Standard intl formatMessage mock — returns the message id as-is.
 * Used in 13+ weeklyTimeEntry tests that mock useIntl from @payroll/quicksand.
 */
export const mockFormatMessage = jest.fn(({ id }: { id: string }) => id);

// Helper to mock all common weeklyTimeEntry selectors
export const mockWeeklyTimeEntrySelectors = () => {
  jest.mock('src/js/widgets/weeklyTimeEntry/store/selectors', () => ({
    selectPanelOpen: jest.fn(() => true),
    selectTimeEntryTimeFor: jest.fn(() => ({
      id: '1',
      name: 'Default',
      type: 'employee',
    })),
    selectTeamMember: jest.fn(() => null),
    selectDateRange: jest.fn(() => ({
      start: '2024-01-01',
      end: '2024-01-07',
    })),
    selectWeekDates: jest.fn(() => [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
    ]),
    selectTimesheetRows: jest.fn(() => []),
    selectCustomerData: jest.fn(() => ({})),
    selectVisibleDays: jest.fn(() => 7),
    selectTimeEntryGridLoading: jest.fn(() => false),
    selectCustomerDataLoading: jest.fn(() => false),
    selectTimeEntrySettingsLoading: jest.fn(() => false),
    selectTimeEntrySettingsError: jest.fn(() => null),
    selectVisibleDaysOfTheWeek: jest.fn(() => [0, 1, 2, 3, 4, 5, 6]),
  }));
};
