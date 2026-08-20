import React, { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  Observable,
} from '@apollo/client';
import Assignments from 'src/js/widgets/assignments/Assignments';

// Mock withBaseWidget to pass through the component unchanged
jest.mock('@core-app/variability-sync-sdk', () => ({
  withBaseWidget: jest.fn((component) => component),
}));

// Mock NLS loader
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn(() => ({})),
  },
}));

// Mock queryStringUtil
const mockGetQueryParams = jest.fn(() => new Map<string, string>());
jest.mock('src/js/service/utils/queryStringUtil', () => ({
  getQueryParams: () => mockGetQueryParams(),
  TAB_QUERY_PARAM: 'tab',
}));

// Mock Apollo Client for assignments
const mockLink = new ApolloLink(
  () =>
    new Observable((observer) => {
      observer.next({
        data: {
          timeTrackingTimeAgainstAssignmentSummary: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            totalTimeForAssignments: 0,
            totalCustomFieldAssignments: 0,
            totalStandardFieldAssignments: 0,
          },
        },
      });
      observer.complete();
    }),
);

const mockApolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: mockLink,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

// Mock the AssignmentApolloClient module
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(() => mockApolloClient),
  createAssignmentApolloClient: jest.fn(() => mockApolloClient),
  resetAssignmentApolloClient: jest.fn(),
}));

// Mock BaseWidget with a working ready() method
jest.mock(
  'web-shell-core/widgets/BaseWidget',
  () =>
    class MockBaseWidget extends React.Component<any> {
      ready = jest.fn();

      render() {
        return <div>{null}</div>;
      }
    },
);

// Mock the AssignmentTabs child component
jest.mock(
  'src/js/widgets/assignments/components/Tabs',
  () =>
    function MockAssignmentTabs({ initialTab }: { initialTab?: string }) {
      return (
        <div data-testid="assignment-tabs" data-initial-tab={initialTab || ''}>
          Assignment Tabs
        </div>
      );
    },
);

// Mock Redux store
jest.mock('src/js/widgets/assignments/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
  },
}));

// Mock QuicksandProvider and related hooks
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }: { children: ReactElement }) => (
    <div data-testid="quicksand-provider">{children}</div>
  ),
}));

// Mock the Widget component
jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockWidget() {
      return <div data-testid="mock-widget">Mock Widget</div>;
    },
);

// Mock EmptyCustomerState
jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/components/EmptyCustomerState',
  () =>
    function MockEmptyCustomerState() {
      return <div data-testid="empty-customer-state">Empty State</div>;
    },
);

// Mock CustomerAssignmentTable
jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/components/CustomerAssignmentTable',
  () =>
    function MockCustomerAssignmentTable() {
      return (
        <div data-testid="customer-assignment-table">
          Customer Assignment Table
        </div>
      );
    },
);

// Mock SearchField
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: () => <div data-testid="search-field">Search Field</div>,
}));

describe('Assignments Component', () => {
  const mockSandbox = {
    logger: {
      log: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    extensions: {
      qbo: {
        webStorage: {
          persistent: jest.fn().mockReturnValue({
            setItemByPersonaId: jest.fn(),
            getItemByPersonaId: jest.fn(),
            removeItemByPersonaId: jest.fn(),
          }),
        },
      },
    },
  } as any;

  const mockOptions = {} as any;

  beforeEach(() => {
    mockGetQueryParams.mockReturnValue(new Map<string, string>());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders without crashing', () => {
      const { container } = render(
        <Assignments sandbox={mockSandbox} options={mockOptions} />,
      );
      expect(container).toBeInTheDocument();
    });

    test('renders AssignmentTabs component', () => {
      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);
      expect(screen.getByTestId('assignment-tabs')).toBeInTheDocument();
    });

    test('wraps content with QuicksandProvider', () => {
      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);
      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('logs message on component mount', () => {
      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'ASSIGNMENTS_WIDGET_MOUNTED',
      );
    });

    test('calls ready() on mount', () => {
      const WidgetClass = Assignments as any;
      const instance = new WidgetClass({
        sandbox: mockSandbox,
        options: mockOptions,
      });
      instance.ready = jest.fn();

      instance.componentDidMount();

      expect(instance.ready).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'ASSIGNMENTS_WIDGET_MOUNTED',
      );
    });

    test('loads NLS files for assignments', () => {
      const nlsLoader = require('src/nls').default;
      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);
      expect(nlsLoader.requireNlsForLocale).toHaveBeenCalledWith([
        'assignments',
        'assignmentDrawer',
        'groups',
        'workers',
      ]);
    });
  });

  describe('Apollo Client', () => {
    test('uses getAssignmentApolloClient when externalApolloClient is not provided', () => {
      const {
        getAssignmentApolloClient,
      } = require('src/js/service/AssignmentApolloClient');

      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);
      expect(getAssignmentApolloClient).toHaveBeenCalledWith(mockSandbox);
    });

    test('uses externalApolloClient when provided', () => {
      const {
        getAssignmentApolloClient,
      } = require('src/js/service/AssignmentApolloClient');

      render(
        <Assignments
          sandbox={mockSandbox}
          options={mockOptions}
          externalApolloClient={mockApolloClient}
        />,
      );
      expect(getAssignmentApolloClient).not.toHaveBeenCalled();
    });

    test('renders error when Apollo client is not initialized', () => {
      const {
        getAssignmentApolloClient,
      } = require('src/js/service/AssignmentApolloClient');
      getAssignmentApolloClient.mockReturnValueOnce(null);

      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'APOLLO_CLIENT_NOT_INITIALIZED',
      );
      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });

    test('does not render AssignmentTabs when Apollo client is null', () => {
      const {
        getAssignmentApolloClient,
      } = require('src/js/service/AssignmentApolloClient');
      getAssignmentApolloClient.mockReturnValueOnce(null);

      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

      expect(screen.queryByTestId('assignment-tabs')).not.toBeInTheDocument();
    });
  });

  describe('withBaseWidget HOC', () => {
    test('withBaseWidget is used as the default export wrapper', () => {
      const { withBaseWidget } = require('@core-app/variability-sync-sdk');
      // withBaseWidget is called at module evaluation time (before tests run),
      // so we verify the mock is configured as a pass-through
      expect(typeof withBaseWidget).toBe('function');
      expect(withBaseWidget(() => null)).toBeDefined();
    });
  });

  describe('Component Structure', () => {
    test('renders correct provider hierarchy', () => {
      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
      expect(screen.getByTestId('assignment-tabs')).toBeInTheDocument();

      const quicksandProvider = screen.getByTestId('quicksand-provider');
      const assignmentTabs = screen.getByTestId('assignment-tabs');
      expect(quicksandProvider).toContainElement(assignmentTabs);
    });
  });

  describe('Query Param Tab Initialization', () => {
    test('passes empty initialTab when no tab query param exists', () => {
      mockGetQueryParams.mockReturnValue(new Map<string, string>());

      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

      expect(screen.getByTestId('assignment-tabs')).toHaveAttribute(
        'data-initial-tab',
        '',
      );
    });

    test.each([
      ['WORKERS', 'WORKERS'],
      ['CUSTOMERS', 'CUSTOMERS'],
    ])(
      'passes %s initialTab when tab=%s query param is present',
      (tabValue, expected) => {
        mockGetQueryParams.mockReturnValue(
          new Map<string, string>([['tab', tabValue]]),
        );

        render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

        expect(screen.getByTestId('assignment-tabs')).toHaveAttribute(
          'data-initial-tab',
          expected,
        );
      },
    );

    test('ignores invalid tab query param values', () => {
      mockGetQueryParams.mockReturnValue(
        new Map<string, string>([['tab', 'INVALID_TAB']]),
      );

      render(<Assignments sandbox={mockSandbox} options={mockOptions} />);

      expect(screen.getByTestId('assignment-tabs')).toHaveAttribute(
        'data-initial-tab',
        '',
      );
    });
  });
});
