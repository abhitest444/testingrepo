import React from 'react';
import { render, screen } from '@testing-library/react';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';
import { WORKERS_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/workers/constants/workersLoggingConstants';
import WorkersFeature from 'src/js/widgets/qbtOrchestrator/features/workers';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockSandbox = { logger: { info: jest.fn(), error: jest.fn() } };

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
}));

const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

const mockUseInitializeItmTasks = jest.fn();

jest.mock('src/js/widgets/qbtOrchestrator/features/overview/hooks', () => ({
  useInitializeItmTasks: () => mockUseInitializeItmTasks(),
}));

// The dedicated assignments Apollo client must back the Workers subtree so
// queries strip __typename and inject the workforce header; assert it is used.
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => ({ __mockClient: true })),
}));

// ApolloProvider would otherwise throw on a non-real client; stub it to a
// passthrough that records the client it received.
const mockApolloProvider = jest.fn();
jest.mock('@apollo/client', () => ({
  ApolloProvider: ({
    client,
    children,
  }: {
    client: unknown;
    children: React.ReactNode;
  }) => {
    mockApolloProvider(client);
    return <div data-testid="apollo-provider">{children}</div>;
  },
}));

// The WorkerAssignments subtree is exercised by the Assignments widget's own
// tests; here we only assert that the feature renders it (and forwards the
// initialView prop), so a lightweight stub keeps this test scoped to the
// feature module's responsibilities.
const mockWorkerAssignmentsTab = jest.fn();
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkerAssignmentsTab',
  () => ({
    __esModule: true,
    default: (props: { initialView?: string }) => {
      mockWorkerAssignmentsTab(props);
      return <div data-testid="worker-assignments-tab" />;
    },
  }),
);

const mockGetAssignmentApolloClient =
  getAssignmentApolloClient as jest.MockedFunction<
    typeof getAssignmentApolloClient
  >;

describe('WorkersFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAssignmentApolloClient.mockReturnValue({
      __mockClient: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('renders the WorkerAssignmentsTab', () => {
    render(<WorkersFeature />);

    expect(screen.getByTestId('worker-assignments-tab')).toBeInTheDocument();
  });

  it('renders WorkerAssignmentsTab with an undefined initialView when no prop is passed', () => {
    render(<WorkersFeature />);

    expect(mockWorkerAssignmentsTab).toHaveBeenCalledWith({
      initialView: undefined,
    });
  });

  it('forwards the initialView prop through to WorkerAssignmentsTab', () => {
    render(<WorkersFeature initialView="groups" />);

    expect(mockWorkerAssignmentsTab).toHaveBeenCalledWith({
      initialView: 'groups',
    });
  });

  it('initializes ITM tasks on mount', () => {
    render(<WorkersFeature />);

    expect(mockUseInitializeItmTasks).toHaveBeenCalledTimes(1);
  });

  it('logs the feature mounted event', () => {
    render(<WorkersFeature />);

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      WORKERS_LOGGING.FEATURE_MOUNTED,
    );
  });

  it('mounts with the dedicated assignments Apollo client', () => {
    render(<WorkersFeature />);

    expect(mockGetAssignmentApolloClient).toHaveBeenCalledWith(mockSandbox);
    expect(mockApolloProvider).toHaveBeenCalledWith({ __mockClient: true });
  });

  it('renders an error and logs when the Apollo client is not initialized', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetAssignmentApolloClient.mockReturnValue(null as any);

    render(<WorkersFeature />);

    expect(mockLoggerError).toHaveBeenCalledWith(
      WORKERS_LOGGING.APOLLO_CLIENT_NOT_INITIALIZED,
    );
    expect(
      screen.queryByTestId('worker-assignments-tab'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Error: Apollo client not initialized'),
    ).toBeInTheDocument();
  });
});
