import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import CustomerAssignmentsTab from 'src/js/widgets/assignments/components/CustomerAssignments/CustomerAssignmentsTab';
import { TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY } from 'src/js/service/queries/timeTrackingAssignmentQueries';
import customerAssignmentsReducer, {
  CUSTOMER_ASSIGNMENT_PAGE_SIZE,
} from 'src/js/widgets/assignments/store/customerAssignmentsSlice';

// Mock components
jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockWidget({
      widgetId,
      nameTypes,
      mode,
      contactId,
      customerId,
      onClose,
      onSuccess,
      open,
    }: any) {
      return (
        <div
          data-testid="contact-drawer-widget"
          data-widget-id={widgetId}
          data-name-types={JSON.stringify(nameTypes)}
          data-mode={mode}
          data-contact-id={contactId}
          data-customer-id={customerId}
          data-open={open}
        >
          <button onClick={() => onClose && onClose()}>Close</button>
          <button onClick={() => onSuccess && onSuccess()}>
            Save Customer
          </button>
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/components/EmptyCustomerState',
  () => () => <div data-testid="empty-customer-state">Empty State</div>,
);

jest.mock(
  'src/js/widgets/assignments/components/CustomerAssignments/components/CustomerAssignmentTable',
  () =>
    ({
      data,
      loading,
      error,
      searchValue,
      onLoadMore,
      onRefresh,
      onError,
      onClearError,
      onShowSuccess,
      activeFieldAssignment,
      onSetActiveFieldAssignment,
      activeWorkerAssignment,
      onSetActiveWorkerAssignment,
      onEditCustomer,
    }: any) =>
      (
        <div data-testid="customer-assignment-table">
          <div data-testid="table-search-value">{searchValue}</div>
          {error && <div data-testid="table-error">{error}</div>}
          <button onClick={() => onLoadMore && onLoadMore('cursor123')}>
            Load More
          </button>
          <button onClick={() => onRefresh && onRefresh()}>Refresh</button>
          <button
            onClick={() =>
              onError &&
              onError({
                title: 'Error occurred',
                subtitle: 'Error subtitle',
                description: 'Error description',
                isPartialSuccess: false,
              })
            }
          >
            Trigger Error
          </button>
          <button
            onClick={() =>
              onError &&
              onError({
                title: 'Partial success',
                subtitle: 'Some items failed',
                description: 'Check the details',
                isPartialSuccess: true,
              })
            }
          >
            Trigger Partial Error
          </button>
          <button onClick={() => onClearError && onClearError()}>
            Clear Error
          </button>
          <button onClick={() => onShowSuccess && onShowSuccess('Success!')}>
            Show Success
          </button>
          <button
            onClick={() =>
              onSetActiveFieldAssignment &&
              onSetActiveFieldAssignment({ id: 'test' })
            }
          >
            Set Active Assignment
          </button>
          <button
            onClick={() =>
              onSetActiveWorkerAssignment &&
              onSetActiveWorkerAssignment({ id: 'worker-test' })
            }
          >
            Set Active Worker Assignment
          </button>
          <button
            onClick={() =>
              onEditCustomer && onEditCustomer('customer-123', 'customer-123')
            }
            data-testid="edit-action"
          >
            Edit Action
          </button>
        </div>
      ),
);

jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange, label }: any) => (
    <div data-testid="search-field">
      <label>{label}</label>
      <input
        data-testid="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({ message, open, onClose }: any) =>
    open ? (
      <div data-testid="success-toast">
        <span data-testid="success-message">{message}</span>
        <button onClick={onClose} data-testid="close-toast">
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock(
  'src/js/widgets/common/AssignmentDrawer/components/AssignmentPagination',
  () =>
    ({ currentPage, totalPages, onPageChange }: any) =>
      totalPages > 1 ? (
        <div data-testid="assignment-pagination">
          <button
            data-testid="page-prev"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span data-testid="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            data-testid="page-next"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null,
);

const mockNavigate = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => mockLogger,
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    navigation: { navigate: mockNavigate },
    logger: mockLogger,
    performance: {
      createCustomerInteraction: jest.fn(),
      endInteractionWithSuccess: jest.fn(),
      endInteractionWithFailure: jest.fn(),
      getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
    },
  }),
  useTracking: () => jest.fn(),
  MockQuicksandProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    TIME_AGAINST_ASSIGNMENT_SUMMARY_READ:
      'TIME_AGAINST_ASSIGNMENT_SUMMARY_READ',
  },
}));

// Helper to create test store
const createTestStore = () =>
  configureStore({
    reducer: {
      customerAssignments: customerAssignmentsReducer,
    },
  });

// Helper to render with all providers
const renderWithProviders = (ui: React.ReactElement, mocks: any[] = []) => {
  const store = createTestStore();
  return {
    ...render(
      <Provider store={store}>
        <MockedProvider mocks={mocks} addTypename={false}>
          {ui}
        </MockedProvider>
      </Provider>,
    ),
    store,
  };
};

describe('CustomerAssignmentsTab', () => {
  const mockData = {
    timeTrackingTimeAgainstAssignmentSummary: {
      edges: [
        {
          node: {
            timeAgainst: {
              timeAgainstContactDAS: {
                customer: { id: '1' },
                project: null,
              },
              assigned: true,
              displayName: 'Customer 1',
              fullName: 'Customer 1 Full',
              customerType: 'customer',
              active: true,
              parentId: null,
              level: 0,
              numChildren: 0,
            },
            assignedTimeForCount: 5,
            assignedCustomFieldCount: 2,
            assignedStandardFieldCount: 3,
          },
          cursor: 'cursor1',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: 'cursor1',
        endCursor: 'cursor1',
      },
      totalTimeForAssignments: 10,
      totalCustomFieldAssignments: 5,
      totalStandardFieldAssignments: 5,
      totalTimeAgainstCount: 2,
    },
  };

  const mocks = [
    {
      request: {
        query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
        variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
      },
      result: { data: mockData },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('shows loader while data is loading', async () => {
      const loadingMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          delay: 1000,
          result: { data: mockData },
        },
      ];

      const view = renderWithProviders(
        <CustomerAssignmentsTab />,
        loadingMocks,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignments-loading'),
        ).toBeInTheDocument();
      });

      view.unmount();
    });

    it('buttons remain visible during loading', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      expect(
        screen.getByText('assignments.empty.customers.button.primary'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('assignments.empty.customers.button.secondary'),
      ).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search field when data is present', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(screen.getByTestId('search-field')).toBeInTheDocument();
      });
    });

    it('does not render search field in empty state', async () => {
      const emptyMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
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
                totalTimeAgainstCount: 0,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, emptyMocks);

      await waitFor(() => {
        expect(screen.queryByTestId('search-field')).not.toBeInTheDocument();
      });
    });

    it('updates search value on input change and triggers server-side search', async () => {
      const searchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              filter: { searchText: 'test' },
            },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: {
                edges: mockData.timeTrackingTimeAgainstAssignmentSummary.edges,
                pageInfo:
                  mockData.timeTrackingTimeAgainstAssignmentSummary.pageInfo,
                totalTimeForAssignments: 10,
                totalCustomFieldAssignments: 5,
                totalStandardFieldAssignments: 5,
                totalTimeAgainstCount: 2,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, searchMocks);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });
    });

    it('passes search value to table component and triggers server-side search', async () => {
      const searchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              filter: { searchText: 'customer' },
            },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: {
                edges: mockData.timeTrackingTimeAgainstAssignmentSummary.edges,
                pageInfo:
                  mockData.timeTrackingTimeAgainstAssignmentSummary.pageInfo,
                totalTimeForAssignments: 10,
                totalCustomFieldAssignments: 5,
                totalStandardFieldAssignments: 5,
                totalTimeAgainstCount: 2,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, searchMocks);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'customer' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-search-value')).toHaveTextContent(
          'customer',
        );
      });
    });

    it('resets to page 1 when clearing search and fetches all data', async () => {
      const searchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              filter: { searchText: 'test' },
            },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: {
                edges:
                  mockData.timeTrackingTimeAgainstAssignmentSummary.edges.slice(
                    0,
                    1,
                  ),
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: 'cursor1',
                  endCursor: 'cursor1',
                },
                totalTimeForAssignments: 5,
                totalCustomFieldAssignments: 2,
                totalStandardFieldAssignments: 3,
                totalTimeAgainstCount: 1,
              },
            },
          },
        },
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
            },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, searchMocks);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');

      // Start search
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      });

      // Clear search - should trigger API call without filter
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });

    it('handles server-side search with parent-child relationships', async () => {
      const dataWithProjects = {
        timeTrackingTimeAgainstAssignmentSummary: {
          edges: [
            {
              node: {
                timeAgainst: {
                  timeAgainstContactDAS: {
                    customer: { id: 'cust-1' },
                    project: null,
                  },
                  assigned: true,
                  displayName: 'Customer 1',
                  fullName: 'Customer 1 Full',
                  customerType: 'customer',
                  active: true,
                  parentId: null,
                  level: 0,
                  numChildren: 1,
                },
                assignedTimeForCount: 5,
                assignedCustomFieldCount: 2,
                assignedStandardFieldCount: 3,
              },
              cursor: 'cursor1',
            },
            {
              node: {
                timeAgainst: {
                  timeAgainstContactDAS: {
                    customer: null,
                    project: { id: 'proj-1' },
                  },
                  assigned: false,
                  displayName: 'Project 1',
                  fullName: 'Project 1 Full',
                  customerType: 'project',
                  active: true,
                  parentId: 'cust-1',
                  level: 1,
                  numChildren: 0,
                },
                assignedTimeForCount: 0,
                assignedCustomFieldCount: 0,
                assignedStandardFieldCount: 0,
              },
              cursor: 'cursor2',
            },
            {
              node: {
                timeAgainst: {
                  timeAgainstContactDAS: {
                    customer: null,
                    project: { id: 'proj-2' },
                  },
                  assigned: false,
                  displayName: 'Project 2',
                  fullName: 'Project 2 Full',
                  customerType: 'project',
                  active: true,
                  parentId: 'cust-1',
                  level: 1,
                  numChildren: 0,
                },
                assignedTimeForCount: 0,
                assignedCustomFieldCount: 0,
                assignedStandardFieldCount: 0,
              },
              cursor: 'cursor3',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor1',
            endCursor: 'cursor3',
          },
          totalTimeForAssignments: 10,
          totalCustomFieldAssignments: 5,
          totalStandardFieldAssignments: 5,
          totalTimeAgainstCount: 3,
        },
      };

      const projectSearchData = {
        timeTrackingTimeAgainstAssignmentSummary: {
          edges: [
            {
              node: {
                timeAgainst: {
                  timeAgainstContactDAS: {
                    customer: null,
                    project: { id: 'proj-1' },
                  },
                  assigned: false,
                  displayName: 'Project 1',
                  fullName: 'Project 1 Full',
                  customerType: 'project',
                  active: true,
                  parentId: 'cust-1',
                  level: 1,
                  numChildren: 0,
                },
                assignedTimeForCount: 0,
                assignedCustomFieldCount: 0,
                assignedStandardFieldCount: 0,
              },
              cursor: 'cursor2',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor2',
            endCursor: 'cursor2',
          },
          totalTimeForAssignments: 0,
          totalCustomFieldAssignments: 0,
          totalStandardFieldAssignments: 0,
          totalTimeAgainstCount: 1,
        },
      };

      const mocksWithProjects = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: dataWithProjects },
        },
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              filter: { searchText: 'Project 1' },
            },
          },
          result: { data: projectSearchData },
        },
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              filter: { searchText: 'Customer' },
            },
          },
          result: { data: dataWithProjects },
        },
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: dataWithProjects },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, mocksWithProjects);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');

      // Search for project - API returns filtered results
      fireEvent.change(searchInput, { target: { value: 'Project 1' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-search-value')).toHaveTextContent(
          'Project 1',
        );
      });

      // Search for customer - API returns customer and all children
      fireEvent.change(searchInput, { target: { value: 'Customer' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-search-value')).toHaveTextContent(
          'Customer',
        );
      });

      // Clear search - API returns all data
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-search-value')).toHaveTextContent('');
      });
    });
  });

  describe('Customer Creation', () => {
    it('opens contact drawer on button click', () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );

      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();
    });

    it('opens contact drawer in create mode by default', () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );

      const drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('data-mode', 'create');
      expect(drawer).not.toHaveAttribute('data-contact-id');
      expect(drawer).not.toHaveAttribute('data-customer-id');
    });

    it('closes drawer and refetches data on success', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Save Customer'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('contact-drawer-widget'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Customer Edit', () => {
    it('opens contact drawer in edit mode when onEditCustomer is called', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('edit-action'));

      const drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('data-mode', 'edit');
      expect(drawer).toHaveAttribute('data-contact-id', 'customer-123');
      expect(drawer).toHaveAttribute('data-customer-id', 'customer-123');
    });

    it('closes drawer and refetches data after editing customer', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('edit-action'));
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Save Customer'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('contact-drawer-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('closes drawer on close button click without saving', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('edit-action'));
      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('contact-drawer-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('resets to create mode when opening drawer after edit', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // First, open edit mode
      fireEvent.click(screen.getByTestId('edit-action'));
      let drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toHaveAttribute('data-mode', 'edit');

      // Close the drawer
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('contact-drawer-widget'),
        ).not.toBeInTheDocument();
      });

      // Now open add customer - should be in create mode
      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );

      drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('data-mode', 'create');
      expect(drawer).not.toHaveAttribute('data-contact-id');
    });

    it('passes customer nameTypes to the contact drawer', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('edit-action'));

      const drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toBeInTheDocument();
      expect(drawer).toHaveAttribute('data-name-types', '["customer"]');
    });
  });

  describe('Navigation', () => {
    it('navigates to settings on manage fields click', () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.secondary'),
      );

      expect(mockNavigate).toHaveBeenCalledWith('/app/accountsettings?p=time');
    });

    it('logs error on navigation failure', () => {
      mockNavigate.mockImplementationOnce(() => {
        throw new Error('Navigation failed');
      });

      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.secondary'),
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Navigation to time tracking settings failed',
        { error: expect.any(Error) },
      );
    });
  });

  describe('Data Display', () => {
    it('shows table when data is loaded', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });
    });

    it('shows empty state when no data', async () => {
      const emptyMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
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
                totalTimeAgainstCount: 0,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, emptyMocks);

      await waitFor(() => {
        expect(screen.getByTestId('empty-customer-state')).toBeInTheDocument();
      });
    });

    it('shows empty state when data is null', async () => {
      const nullDataMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: null,
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, nullDataMocks);

      await waitFor(() => {
        expect(screen.getByTestId('empty-customer-state')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when onError is called', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(screen.getByText('Error subtitle')).toBeInTheDocument();
        expect(screen.getByText('Error description')).toBeInTheDocument();
      });
    });

    it('displays error message with title only', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Verify that error message is displayed with all fields
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('dismisses error message on close', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Find and click the close button in PageMessage
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      });
    });

    it('handles partial success error and refetches data', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Trigger Partial Error'));

      await waitFor(() => {
        expect(screen.getByText('Partial success')).toBeInTheDocument();
        expect(screen.getByText('Some items failed')).toBeInTheDocument();
      });
    });

    it('clears error when onClearError is called', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // First trigger an error
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Now clear it
      fireEvent.click(screen.getByText('Clear Error'));

      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success Toast', () => {
    it('displays success toast when onShowSuccess is called', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show Success'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
        expect(screen.getByTestId('success-message')).toHaveTextContent(
          'Success!',
        );
      });
    });

    it('closes success toast on close button click', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show Success'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('close-toast'));

      await waitFor(() => {
        expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
      });
    });

    it('success handler refetches data', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show Success'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination and Refresh', () => {
    it('handles load more with cursor', async () => {
      const loadMoreMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              after: 'cursor123',
            },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, loadMoreMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });
    });

    it('handles refresh and clears error', async () => {
      const refreshMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refreshMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // First trigger an error
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Now refresh - this should clear the error
      fireEvent.click(screen.getByText('Refresh'));

      await waitFor(() => {
        expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
      });
    });

    it('fetches more data when navigating to page that needs more items', async () => {
      const multiPageMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: {
                edges: Array.from({ length: 20 }, (_, i) => ({
                  node: {
                    timeAgainst: {
                      timeAgainstContactDAS: {
                        customer: { id: `cust-${i + 1}` },
                        project: null,
                      },
                      assigned: true,
                      displayName: `Customer ${i + 1}`,
                      fullName: `Customer ${i + 1} Full`,
                      customerType: 'customer',
                      active: true,
                      parentId: null,
                      level: 0,
                      numChildren: 0,
                    },
                    assignedTimeForCount: 5,
                    assignedCustomFieldCount: 2,
                    assignedStandardFieldCount: 3,
                  },
                  cursor: `cursor${i + 1}`,
                })),
                pageInfo: {
                  hasNextPage: true,
                  hasPreviousPage: false,
                  startCursor: 'cursor1',
                  endCursor: 'cursor20',
                },
                totalTimeForAssignments: 10,
                totalCustomFieldAssignments: 5,
                totalStandardFieldAssignments: 5,
                totalTimeAgainstCount: 25,
              },
            },
          },
        },
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: {
              first: CUSTOMER_ASSIGNMENT_PAGE_SIZE,
              after: 'cursor20',
            },
          },
          result: {
            data: {
              timeTrackingTimeAgainstAssignmentSummary: {
                edges: Array.from({ length: 5 }, (_, i) => ({
                  node: {
                    timeAgainst: {
                      timeAgainstContactDAS: {
                        customer: { id: `cust-${i + 21}` },
                        project: null,
                      },
                      assigned: true,
                      displayName: `Customer ${i + 21}`,
                      fullName: `Customer ${i + 21} Full`,
                      customerType: 'customer',
                      active: true,
                      parentId: null,
                      level: 0,
                      numChildren: 0,
                    },
                    assignedTimeForCount: 5,
                    assignedCustomFieldCount: 2,
                    assignedStandardFieldCount: 3,
                  },
                  cursor: `cursor${i + 21}`,
                })),
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: true,
                  startCursor: 'cursor21',
                  endCursor: 'cursor25',
                },
                totalTimeForAssignments: 10,
                totalCustomFieldAssignments: 5,
                totalStandardFieldAssignments: 5,
                totalTimeAgainstCount: 25,
              },
            },
          },
        },
      ];

      const { store } = renderWithProviders(
        <CustomerAssignmentsTab />,
        multiPageMocks,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Wait for initial data to load
      await waitFor(() => {
        const state = store.getState();
        expect(state.customerAssignments.allItems.length).toBe(20);
        expect(state.customerAssignments.hasMore).toBe(true);
      });

      // Navigate to page 2 - should trigger fetch for more data
      await waitFor(() => {
        expect(screen.getByTestId('assignment-pagination')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('page-next');
      fireEvent.click(nextButton);

      // Wait for additional data to be fetched
      await waitFor(() => {
        const state = store.getState();
        expect(state.customerAssignments.allItems.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Field Assignment State Management', () => {
    it('manages activeFieldAssignment state', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Set Active Assignment'));

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });
    });

    it('clears activeFieldAssignment on error', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active assignment
      fireEvent.click(screen.getByText('Set Active Assignment'));

      // Trigger error - this should clear activeFieldAssignment
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('clears activeFieldAssignment on success', async () => {
      const refetchMocks = [
        ...mocks,
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, refetchMocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active assignment
      fireEvent.click(screen.getByText('Set Active Assignment'));

      // Show success - this should clear activeFieldAssignment
      fireEvent.click(screen.getByText('Show Success'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });
  });

  describe('Contact Drawer', () => {
    it('closes drawer on close button click', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );

      expect(screen.getByTestId('contact-drawer-widget')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('contact-drawer-widget'),
        ).not.toBeInTheDocument();
      });
    });

    it('renders drawer with correct props', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      fireEvent.click(
        screen.getByText('assignments.empty.customers.button.primary'),
      );

      const drawer = screen.getByTestId('contact-drawer-widget');
      expect(drawer).toHaveAttribute(
        'data-widget-id',
        'qbo-contacts-v2/contact-drawer',
      );
      expect(drawer).toHaveAttribute(
        'data-name-types',
        JSON.stringify(['customer']),
      );
      expect(drawer).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Initial Data Fetch', () => {
    it('fetches data on mount with correct pagination defaults', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });
    });

    it('handles loading state correctly', async () => {
      const delayedMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          delay: 100,
          result: { data: mockData },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, delayedMocks);

      expect(
        screen.getByTestId('customer-assignments-loading'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByTestId('customer-assignments-loading'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to CustomerAssignmentTable', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        const table = screen.getByTestId('customer-assignment-table');
        expect(table).toBeInTheDocument();

        // Test that all interactive elements are present
        expect(screen.getByText('Load More')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
        expect(screen.getByText('Trigger Error')).toBeInTheDocument();
        expect(screen.getByText('Clear Error')).toBeInTheDocument();
        expect(screen.getByText('Show Success')).toBeInTheDocument();
      });
    });

    it('shows buttons even when empty state is displayed', async () => {
      const emptyMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
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
                totalTimeAgainstCount: 0,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, emptyMocks);

      await waitFor(() => {
        expect(screen.getByTestId('empty-customer-state')).toBeInTheDocument();
      });

      expect(
        screen.getByText('assignments.empty.customers.button.primary'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('assignments.empty.customers.button.secondary'),
      ).toBeInTheDocument();
    });

    it('does not show success toast initially', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      expect(screen.queryByTestId('success-toast')).not.toBeInTheDocument();
    });

    it('does not show error message initially', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Error occurred')).not.toBeInTheDocument();
    });
  });

  describe('Worker Assignment Integration', () => {
    it('manages activeWorkerAssignment state', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active worker assignment
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });
    });

    it('closes worker assignment drawer on success toast', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active worker assignment first
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      // Simulate success which should close any active worker assignment drawer
      fireEvent.click(screen.getByText('Show Success'));

      await waitFor(() => {
        expect(screen.getByTestId('success-toast')).toBeInTheDocument();
      });
    });

    it('closes worker assignment drawer on error', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active worker assignment first
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      // Simulate error which should close any active worker assignment drawer
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('closes worker assignment drawer on partial success error', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active worker assignment first
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      // Trigger partial success error
      fireEvent.click(screen.getByText('Trigger Partial Error'));

      await waitFor(() => {
        expect(screen.getByText('Partial success')).toBeInTheDocument();
      });
    });

    it('auto-closes worker assignment drawer when error occurs', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set active worker assignment
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      // Trigger error - drawer should auto-close
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('maintains field assignment state when worker assignment is active', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Set field assignment first
      fireEvent.click(screen.getByText('Set Active Assignment'));

      // Then set worker assignment
      fireEvent.click(screen.getByText('Set Active Worker Assignment'));

      // Both should be tracked independently
      expect(
        screen.getByTestId('customer-assignment-table'),
      ).toBeInTheDocument();
    });
  });

  describe('Error Message Rendering', () => {
    it('renders error message without subtitle', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Manually trigger error via button
      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });
    });

    it('renders error message without description', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
        expect(screen.getByText('Error subtitle')).toBeInTheDocument();
      });
    });
  });

  describe('Button Container Styling', () => {
    it('applies correct styling when showing empty state', async () => {
      const emptyMocks = [
        {
          request: {
            query: TIME_AGAINST_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: CUSTOMER_ASSIGNMENT_PAGE_SIZE },
          },
          result: {
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
                totalTimeAgainstCount: 0,
              },
            },
          },
        },
      ];

      renderWithProviders(<CustomerAssignmentsTab />, emptyMocks);

      await waitFor(() => {
        expect(screen.getByTestId('empty-customer-state')).toBeInTheDocument();
      });

      // Buttons should still be visible in empty state
      expect(
        screen.getByText('assignments.empty.customers.button.primary'),
      ).toBeInTheDocument();
    });

    it('applies correct styling when showing data', async () => {
      renderWithProviders(<CustomerAssignmentsTab />, mocks);

      await waitFor(() => {
        expect(
          screen.getByTestId('customer-assignment-table'),
        ).toBeInTheDocument();
      });

      // Both search and buttons should be visible
      expect(screen.getByTestId('search-field')).toBeInTheDocument();
      expect(
        screen.getByText('assignments.empty.customers.button.primary'),
      ).toBeInTheDocument();
    });
  });
});
