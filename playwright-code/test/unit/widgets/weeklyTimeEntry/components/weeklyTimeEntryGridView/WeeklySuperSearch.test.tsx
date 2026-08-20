import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { mockFormatMessage } from 'test/unit/testUtils';
import WeeklySuperSearch from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/WeeklySuperSearch';
import timeEntryGridReducer from '../../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import breaksReducer from '../../../../../../src/js/widgets/weeklyTimeEntry/store/breaksSlice';
import customersReducer from '../../../../../../src/js/widgets/weeklyTimeEntry/store/customerSlice';
import { DataAccess_ContactType } from '../../../../../../src/__generated__/oigql/graphql';

// Mock useIntl and useSandbox
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useSandbox: jest.fn(() => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
  })),
}));

// Mock useWTEAssignments for scroll loadMore path
const mockWTEAssignmentsLoadMore = jest.fn();
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/context/WTEAssignmentsContext',
  () => ({
    useWTEAssignments: jest.fn(() => null),
  }),
);

// Mock useCustomerProjects hook (GraphQL).
//
// The real useCustomerProjects returns a useState-backed `customers` array, so its reference is
// stable across renders and only changes when the data changes. The default mock MUST honor that
// contract: returning a fresh object/array on every render would churn the sync effect's
// dependency array in WeeklySuperSearch and drive an infinite render loop. We therefore return a
// single stable object reference and let individual tests override it via mockReturnValue when
// they need different data. (Jest requires factory-referenced vars to be prefixed `mock`.)
const mockLoadCustomersGraphQL = jest.fn();
const mockRefetchGraphQL = jest.fn();
const mockLoadMoreGraphQL = jest.fn();
const mockCustomerProjectsResult = {
  customers: [] as any[],
  loading: false,
  error: null as string | null,
  loadCustomers: mockLoadCustomersGraphQL,
  refetch: mockRefetchGraphQL,
  loadMore: mockLoadMoreGraphQL,
  hasMore: false,
};
jest.mock(
  '../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects',
  () => ({
    useCustomerProjects: jest.fn(() => mockCustomerProjectsResult),
  }),
);

// Mock ContactDrawer
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/ContactDrawer',
  () => ({
    ContactDrawer: ({ onClose }: any) => (
      <div data-testid="contact-drawer">
        <button onClick={onClose}>Close</button>
      </div>
    ),
  }),
);

// Mock dependencies
jest.mock(
  '@ids-ts/text-field',
  () =>
    function MockTextField({ value, onChange, placeholder, size, style }: any) {
      return (
        <input
          data-testid="search-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          size={size}
          style={style}
        />
      );
    },
);

jest.mock(
  '@qbds/link-action-button',
  () =>
    function MockLinkActionButton({ children, onClick }: any) {
      return (
        <button data-testid="add-customer-button" onClick={onClick}>
          {children}
        </button>
      );
    },
);

jest.mock('@design-systems/icons', () => ({
  PersonThree: () => (
    <span data-testid="person-icon" role="img" aria-label="person">
      👤
    </span>
  ),
  CoffeeCup: () => (
    <span data-testid="coffee-icon" role="img" aria-label="coffee">
      ☕
    </span>
  ),
  Calendar: () => (
    <span data-testid="calendar-icon" role="img" aria-label="calendar">
      📅
    </span>
  ),
}));

// Mock styled components
jest.mock(
  '../../../../../../src/js/widgets/weeklyTimeEntry/components/styles/WeeklySuperSerach.styles',
  () => ({
    Container: ({ children }: any) => (
      <div data-testid="container">{children}</div>
    ),
    TabsColumn: ({ children }: any) => (
      <div data-testid="tabs-column">{children}</div>
    ),
    TabItem: ({ children, selected, onClick }: any) => (
      <button
        data-testid="tab-item"
        data-selected={selected}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
    ),
    ContentColumn: ({ children, onScroll }: any) => (
      <div data-testid="content-column" onScroll={onScroll}>
        {children}
      </div>
    ),
    SearchRow: ({ children }: any) => (
      <div data-testid="search-row">{children}</div>
    ),
    List: ({ children }: any) => <div data-testid="list">{children}</div>,
    ListItem: ({ children, selected, onClick, style }: any) => (
      <button
        data-testid="list-item"
        data-selected={selected}
        onClick={onClick}
        style={style}
        type="button"
      >
        {children}
      </button>
    ),
    TypeLabel: ({ children }: any) => (
      <span data-testid="type-label">{children}</span>
    ),
    CustomerTypeLabel: ({ children }: any) => (
      <span data-testid="type-label">{children}</span>
    ),
    EmptyState: ({ children }: any) => (
      <div data-testid="empty-state">{children}</div>
    ),
  }),
);

const mockCustomers = [
  {
    id: 'customer1',
    displayName: 'Customer One',
    __typename: 'DataAccess_Customer',
  },
  {
    id: 'customer2',
    displayName: 'Customer Two',
    __typename: 'DataAccess_Customer',
  },
  {
    id: 'project1',
    displayName: 'Project Alpha',
    __typename: 'DataAccess_Project',
  },
  {
    id: 'project2',
    displayName: 'Project Beta',
    __typename: 'DataAccess_Project',
  },
];

const mockBreaks = [
  {
    id: 'break1',
    breakName: 'Lunch Break',
    isActive: true,
    breakType: 'PAID' as const,
    allowManual: true,
    allowAuto: false,
    noSetDuration: false,
    breakDuration: 30,
    durationUnit: 'MINUTES',
    isDeleted: false,
    isDefaultPolicy: false,
    activeBreakAssignmentCount: 5,
  },
  {
    id: 'break2',
    breakName: 'Coffee Break',
    isActive: true,
    breakType: 'UNPAID' as const,
    allowManual: true,
    allowAuto: true,
    noSetDuration: true,
    breakDuration: 15,
    durationUnit: 'MINUTES',
    isDeleted: false,
    isDefaultPolicy: false,
    activeBreakAssignmentCount: 3,
  },
  {
    id: 'break3',
    breakName: 'Rest Break',
    isActive: false,
    breakType: 'PAID' as const,
    allowManual: true,
    allowAuto: false,
    noSetDuration: false,
    breakDuration: 10,
    durationUnit: 'MINUTES',
    isDeleted: false,
    isDefaultPolicy: false,
    activeBreakAssignmentCount: 0,
  },
];

/**
 * Normalizes a flat customer list into the entity-adapter shape used by customerSlice.
 * Each test owns its own data so we never mutate shared state between renders.
 */
const toCustomerEntityState = (customers: any[]) => ({
  customers: {
    ids: customers.map((c) => c.id ?? 'null-id'),
    entities: customers.reduce((acc, customer) => {
      acc[customer.id ?? 'null-id'] = customer;
      return acc;
    }, {} as Record<string, any>),
  },
  loading: false,
  error: null,
});

/**
 * Builds a fresh store for each test using the REAL slices (no pass-through stubs and no
 * post-hoc store.getState() mutation). Using the real customerSlice reducer makes the
 * setLoading/setError/setCustomers dispatches idempotent, so the sync effect converges
 * instead of looping.
 */
interface MockStoreOptions {
  customers?: any[];
  breaks?: any[];
  teamMember?: any;
  customerLoading?: boolean;
}

const createMockStore = ({
  customers = mockCustomers,
  breaks = mockBreaks,
  teamMember = null,
  customerLoading = false,
}: MockStoreOptions = {}) =>
  configureStore({
    reducer: {
      timeEntryGrid: timeEntryGridReducer,
      breaks: breaksReducer,
      customers: customersReducer,
      timeEntrySettings: (
        state = {
          visibleDays: [0, 1, 2, 3, 4, 5, 6],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _action: any,
      ) => state,
    },
    preloadedState: {
      timeEntryGrid: {
        weeklyTimeEntries: {},
        rowOrder: [],
        teamMember,
        dateRange: { start: '', end: '' },
        loading: false,
        error: null,
        selected: null,
        firstEditedCells: {},
        showSelectTeamMemberTooltip: false,
        isTeamMemberDropdownReady: false,
        isTimeCategorySelectorReady: false,
        isQuickFindEnabled: false,
        isQuickFindSettled: false,
        confirmTimeEntryConversionModal: {
          isOpen: false,
          rowId: null,
          dayIdx: null,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      breaks: {
        breaks,
        loading: false,
        error: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      timeEntrySettings: {
        visibleDays: [0, 1, 2, 3, 4, 5, 6],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      customers: {
        ...toCustomerEntityState(customers),
        loading: customerLoading,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    },
    // The component mutates nothing in Redux directly, but mockBreaks/mockCustomers are shared
    // module-level fixtures; disable the dev middleware checks so reusing them across tests does
    // not trip the serializable/immutable invariants on the preloaded (not dispatched) state.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

const defaultProps = {
  rowId: 'row-1',
  value: {
    type: DataAccess_ContactType.Customer,
    id: null,
    displayName: null,
  },
  onSelect: jest.fn(),
};

describe('WeeklySuperSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatMessage.mockImplementation(({ id }) => id);
    // Restore the default stable hook results so per-test mockReturnValue overrides cannot
    // leak their implementation into subsequent tests.
    const useWTEAssignmentsMock =
      require('../../../../../../src/js/widgets/weeklyTimeEntry/context/WTEAssignmentsContext').useWTEAssignments;
    useWTEAssignmentsMock.mockReturnValue(null);
    const useCustomerProjectsMock =
      require('../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;
    useCustomerProjectsMock.mockReturnValue(mockCustomerProjectsResult);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByTestId('container')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-column')).toBeInTheDocument();
      expect(screen.getByTestId('content-column')).toBeInTheDocument();
    });

    it('renders both tabs with correct labels and icons', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      expect(tabItems).toHaveLength(2);
      expect(tabItems[0]).toHaveTextContent(
        'weekly.time.entry.super.search.customer.project.tab',
      );
      expect(tabItems[1]).toHaveTextContent(
        'weekly.time.entry.super.search.breaks.tab',
      );
      expect(screen.getAllByTestId('person-icon')).toHaveLength(1);
      expect(screen.getAllByTestId('coffee-icon')).toHaveLength(1);
    });

    it('shows customer/project tab as selected by default', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      expect(tabItems[0]).toHaveAttribute('data-selected', 'true');
      expect(tabItems[1]).toHaveAttribute('data-selected', 'false');
    });

    it('renders search input and add button in customer tab', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-customer-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-customer-button')).toHaveTextContent(
        'weekly.time.entry.super.search.add.customer.project',
      );
    });

    it('renders customer list with all customers and projects', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const listItems = screen.getAllByTestId('list-item');
      expect(listItems).toHaveLength(4); // 4 customers/projects

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.getByText('Customer Two')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('renders correct type labels for customers and projects', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const typeLabels = screen.getAllByTestId('type-label');
      expect(typeLabels).toHaveLength(4);

      const customerLabels = typeLabels.filter(
        (label) =>
          label.textContent === 'weekly.time.entry.super.search.customer.label',
      );
      const projectLabels = typeLabels.filter(
        (label) =>
          label.textContent === 'weekly.time.entry.super.search.project.label',
      );
      expect(customerLabels).toHaveLength(2);
      expect(projectLabels).toHaveLength(2);
    });
  });

  describe('Tab Switching', () => {
    it('switches to breaks tab when clicked', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      const breaksTab = tabItems[1];
      fireEvent.click(breaksTab);

      expect(breaksTab).toHaveAttribute('data-selected', 'true');
      expect(tabItems[0]).toHaveAttribute('data-selected', 'false');
    });

    it('switches back to customer tab when clicked', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      const breaksTab = tabItems[1];
      const customerTab = tabItems[0];

      fireEvent.click(breaksTab);
      expect(breaksTab).toHaveAttribute('data-selected', 'true');

      fireEvent.click(customerTab);
      expect(customerTab).toHaveAttribute('data-selected', 'true');
      expect(breaksTab).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Search Functionality', () => {
    it('filters customers based on search input', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'One' } });

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.queryByText('Customer Two')).not.toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });

    it('filters projects based on search input', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.queryByText('Customer One')).not.toBeInTheDocument();
      expect(screen.queryByText('Customer Two')).not.toBeInTheDocument();
      expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
    });

    it('shows all items when search is cleared', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'One' } });
      expect(screen.queryByText('Customer Two')).not.toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.getByText('Customer Two')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('performs case-insensitive search', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'CUSTOMER' } });

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.getByText('Customer Two')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });
  });

  describe('Customer Selection', () => {
    it('calls onSelect when a customer is clicked', () => {
      const onSelect = jest.fn();
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} onSelect={onSelect} />
        </Provider>,
      );

      const customerItems = screen.getAllByTestId('list-item');
      fireEvent.click(customerItems[0]);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('dispatches updateTimeAgainst action when customer is selected', () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const customerTab = screen.getAllByTestId('tab-item')[0];
      fireEvent.click(customerTab);

      const customerItems = screen.getAllByTestId('list-item');
      fireEvent.click(customerItems[0]);

      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'timeEntryGrid/updateTimeAgainst',
        payload: {
          rowId: 'row-1',
          timeAgainst: {
            id: 'customer1',
            type: 'CUSTOMER',
            displayName: 'Customer One',
          },
        },
      });
    });

    it('marks selected customer as selected', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch
            {...defaultProps}
            selectedCustomer={{ id: 'customer1', displayName: 'Customer One' }}
          />
        </Provider>,
      );

      const listItems = screen.getAllByTestId('list-item');
      expect(listItems[0]).toHaveAttribute('data-selected', 'true');
      expect(listItems[1]).toHaveAttribute('data-selected', 'false');
    });
  });

  describe('Break Selection', () => {
    it('renders breaks tab with search functionality', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const searchInputs = screen.getAllByTestId('search-input');
      expect(searchInputs).toHaveLength(1);
      expect(searchInputs[0]).toHaveAttribute('placeholder', 'Search breaks');
    });

    it('displays active breaks with correct type labels', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Coffee Break')).toBeInTheDocument();
      expect(screen.queryByText('Rest Break')).not.toBeInTheDocument(); // Inactive break

      const typeLabels = screen.getAllByTestId('type-label');
      expect(typeLabels).toHaveLength(2);
      expect(typeLabels[0]).toHaveTextContent('Paid Break');
      expect(typeLabels[1]).toHaveTextContent('Unpaid Break');
    });

    it('filters breaks based on search input', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Lunch' } });

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.queryByText('Coffee Break')).not.toBeInTheDocument();
    });

    it('dispatches updateTimeAgainst action when break is selected', () => {
      const store = createMockStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const breakItems = screen.getAllByTestId('list-item');
      fireEvent.click(breakItems[0]);

      expect(dispatchSpy).toHaveBeenCalledWith({
        type: 'timeEntryGrid/updateTimeAgainst',
        payload: {
          rowId: 'row-1',
          timeAgainst: {
            id: 'break1',
            type: 'PAID',
          },
        },
      });
    });

    it('marks selected break as selected', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch
            {...defaultProps}
            value={{ type: 'PAID', id: 'break1', displayName: 'Paid Break' }}
          />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const listItems = screen.getAllByTestId('list-item');
      expect(listItems[0]).toHaveAttribute('data-selected', 'true');
      expect(listItems[1]).toHaveAttribute('data-selected', 'false');
    });

    it('calls onSelect when a break is clicked', () => {
      const onSelect = jest.fn();
      const store = createMockStore();

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} onSelect={onSelect} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const breakItems = screen.getAllByTestId('list-item');
      fireEvent.click(breakItems[0]);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty customer list', () => {
      const store = createMockStore({ customers: [] });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const listItems = screen.queryAllByTestId('list-item');
      expect(listItems).toHaveLength(0);
    });

    it('handles empty breaks list (hides breaks tab)', () => {
      const store = createMockStore({ breaks: [] });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      expect(tabItems).toHaveLength(1);
      expect(tabItems[1]).toBeUndefined();
    });
  });

  describe('NLS Integration', () => {
    it('should use NLS for search placeholder and aria-label', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.search.placeholder',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.search.aria.label',
      });
    });

    it('should use NLS for add customer/project button', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.add.customer.project',
      });
    });

    it('should use NLS for tab labels', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.customer.label',
      });
      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.project.label',
      });
    });

    it('should use NLS for break labels', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'weekly.time.entry.super.search.breaks.tab',
      });
    });
  });

  describe('Hierarchical Customer Structure', () => {
    it('should build hierarchical structure with parent-child relationships', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'parent1',
            displayName: 'Parent Customer',
            __typename: 'DataAccess_Customer',
          },
          {
            id: 'child1',
            displayName: 'Child Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
          {
            id: 'project1',
            displayName: 'Child Project',
            __typename: 'DataAccess_Project',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Parent Customer')).toBeInTheDocument();
      expect(screen.getByText('Child Customer')).toBeInTheDocument();
      expect(screen.getByText('Child Project')).toBeInTheDocument();
    });

    it('should handle orphaned items (parent not found)', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'orphan1',
            displayName: 'Orphaned Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'nonexistent-parent',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Orphaned Customer')).toBeInTheDocument();
    });

    it('should derive parent info from fullName for customers with parentId', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'child1',
            displayName: 'Child Customer',
            fullName: 'Parent Company:Child Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Child Customer')).toBeInTheDocument();

      const typeLabels = screen.getAllByTestId('type-label');
      expect(typeLabels[0].textContent).toContain(
        'weekly.time.entry.super.search.sub.customer.of.label',
      );
    });

    it('should show "Project of parentName" label for projects with parent info', () => {
      mockFormatMessage.mockImplementation((args: any, values?: any) => {
        if (args.id === 'weekly.time.entry.super.search.project.of.label') {
          return `Project of ${values?.parentName}`;
        }
        return args.id;
      });

      const store = createMockStore({
        customers: [
          {
            id: 'project1',
            displayName: 'My Project',
            fullName: 'Parent Customer:My Project',
            __typename: 'DataAccess_Project',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('My Project')).toBeInTheDocument();
      expect(
        screen.getByText(/Project of Parent Customer/i),
      ).toBeInTheDocument();
    });

    it('should handle customers with complex fullName hierarchy', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'child1',
            displayName: 'Grandchild',
            fullName: 'GrandParent:Parent:Child:Grandchild',
            __typename: 'DataAccess_Customer',
            parentId: 'child0',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Grandchild')).toBeInTheDocument();
    });

    it('should handle fullName with single segment (no parent)', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'single1',
            displayName: 'Single Customer',
            fullName: 'Single Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Single Customer')).toBeInTheDocument();
    });

    it('should handle fullName with empty segment before delimiter', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'empty1',
            displayName: 'Customer',
            fullName: ':Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Customer')).toBeInTheDocument();
    });
  });

  describe('Contact Drawer', () => {
    it('should open contact drawer when add button is clicked', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const addButton = screen.getByTestId('add-customer-button');
      fireEvent.click(addButton);

      expect(screen.getByTestId('contact-drawer')).toBeInTheDocument();
    });

    it('should close contact drawer when close is called', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const addButton = screen.getByTestId('add-customer-button');
      fireEvent.click(addButton);
      expect(screen.getByTestId('contact-drawer')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('contact-drawer')).not.toBeInTheDocument();
    });

    it('should pass current search value to contact drawer', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'New Customer' } });

      const addButton = screen.getByTestId('add-customer-button');
      fireEvent.click(addButton);

      expect(screen.getByTestId('contact-drawer')).toBeInTheDocument();
    });
  });

  describe('Search with Parent Info Derivation', () => {
    it('should derive parent info from fullName during search filtering', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'customer1',
            displayName: 'Sub Customer',
            fullName: 'Main Customer:Sub Customer',
            __typename: 'DataAccess_Customer',
            parentId: 'main1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Sub' } });

      expect(screen.getByText('Sub Customer')).toBeInTheDocument();
    });

    it('should search by customer ID', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'customer1' } });

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.queryByText('Customer Two')).not.toBeInTheDocument();
    });

    it('should search by fullName in addition to displayName', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'customer1',
            displayName: 'ABC Corp',
            fullName: 'XYZ Holdings:ABC Corp',
            __typename: 'DataAccess_Customer',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'XYZ' } });
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'ABC' } });
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();
    });
  });

  describe('Depth Calculation', () => {
    it('should apply correct padding based on depth', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'parent1',
            displayName: 'Parent',
            __typename: 'DataAccess_Customer',
          },
          {
            id: 'child1',
            displayName: 'Child',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
          {
            id: 'grandchild1',
            displayName: 'Grandchild',
            __typename: 'DataAccess_Customer',
            parentId: 'child1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const listItems = screen.getAllByTestId('list-item');

      expect(listItems[0]).toHaveStyle({ paddingLeft: '0px' });
      expect(listItems[1]).toHaveStyle({ paddingLeft: '24px' });
      expect(listItems[2]).toHaveStyle({ paddingLeft: '48px' });
    });

    it('should reset depth to 0 for search results', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'parent1',
            displayName: 'Parent',
            __typename: 'DataAccess_Customer',
          },
          {
            id: 'child1',
            displayName: 'Searched Child',
            __typename: 'DataAccess_Customer',
            parentId: 'parent1',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Searched' } });

      const listItems = screen.getAllByTestId('list-item');
      expect(listItems[0]).toHaveStyle({ paddingLeft: '0px' });
    });

    it('should handle depth calculation for deeply nested customers', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'root',
            displayName: 'Root',
            __typename: 'DataAccess_Customer',
          },
          {
            id: 'level1',
            displayName: 'Level 1',
            __typename: 'DataAccess_Customer',
            parentId: 'root',
          },
          {
            id: 'level2',
            displayName: 'Level 2',
            __typename: 'DataAccess_Customer',
            parentId: 'level1',
          },
          {
            id: 'level3',
            displayName: 'Level 3',
            __typename: 'DataAccess_Customer',
            parentId: 'level2',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const listItems = screen.getAllByTestId('list-item');
      expect(listItems).toHaveLength(4);

      expect(listItems[0]).toHaveStyle({ paddingLeft: '0px' }); // Root
      expect(listItems[1]).toHaveStyle({ paddingLeft: '24px' }); // Level 1
      expect(listItems[2]).toHaveStyle({ paddingLeft: '48px' }); // Level 2
      expect(listItems[3]).toHaveStyle({ paddingLeft: '72px' }); // Level 3
    });
  });

  describe('Display Name Fallbacks', () => {
    it('should display fullName when displayName is missing', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'customer1',
            displayName: null,
            fullName: 'Full Customer Name',
            __typename: 'DataAccess_Customer',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('Full Customer Name')).toBeInTheDocument();
    });

    it('should display customer id when both displayName and fullName are missing', () => {
      const store = createMockStore({
        customers: [
          {
            id: 'customer123',
            displayName: null,
            fullName: null,
            __typename: 'DataAccess_Customer',
          },
        ],
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByText('customer123')).toBeInTheDocument();
    });
  });

  describe('Search State Independence', () => {
    it('should maintain separate search states between customer and break tabs', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const customerSearchInput = screen.getByTestId('search-input');
      fireEvent.change(customerSearchInput, { target: { value: 'Customer' } });

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();

      const tabItems = screen.getAllByTestId('tab-item');
      fireEvent.click(tabItems[1]);

      const breakSearchInput = screen.getByTestId('search-input');
      expect(breakSearchInput).toHaveValue('');

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.getByText('Coffee Break')).toBeInTheDocument();

      fireEvent.change(breakSearchInput, { target: { value: 'Lunch' } });

      expect(screen.getByText('Lunch Break')).toBeInTheDocument();
      expect(screen.queryByText('Coffee Break')).not.toBeInTheDocument();

      fireEvent.click(tabItems[0]);

      const customerSearchInputAgain = screen.getByTestId('search-input');
      expect(customerSearchInputAgain).toHaveValue('Customer');

      expect(screen.getByText('Customer One')).toBeInTheDocument();
      expect(screen.queryByText('Project Alpha')).not.toBeInTheDocument();
    });
  });

  describe('GraphQL data sync', () => {
    it('should use the GraphQL customer/project hook', () => {
      const useCustomerProjectsMock =
        require('../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;

      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(useCustomerProjectsMock).toHaveBeenCalled();
    });

    it('should not call the GraphQL API on mount (data comes from the store)', () => {
      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      // The list is hydrated from Redux (useWTETimeAgainstAssignmentsFetch); the dropdown does
      // not fetch on mount. It only calls loadCustomers when the user searches.
      expect(mockLoadCustomersGraphQL).not.toHaveBeenCalled();
    });

    it('should render the container when the GraphQL hook reports loading', () => {
      const useCustomerProjectsMock =
        require('../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;
      useCustomerProjectsMock.mockReturnValue({
        customers: [],
        loading: true,
        error: null,
        loadCustomers: mockLoadCustomersGraphQL,
        refetch: mockRefetchGraphQL,
        loadMore: mockLoadMoreGraphQL,
        hasMore: false,
      });

      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByTestId('container')).toBeInTheDocument();
    });

    it('should render the container when the GraphQL hook reports an error', () => {
      const useCustomerProjectsMock =
        require('../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;
      useCustomerProjectsMock.mockReturnValue({
        customers: [],
        loading: false,
        error: 'GraphQL Error',
        loadCustomers: mockLoadCustomersGraphQL,
        refetch: mockRefetchGraphQL,
        loadMore: mockLoadMoreGraphQL,
        hasMore: false,
      });

      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      expect(screen.getByTestId('container')).toBeInTheDocument();
    });
  });

  describe('Infinite scroll', () => {
    const setScrollDimensions = (el: HTMLElement) => {
      Object.defineProperty(el, 'scrollTop', { value: 80, configurable: true });
      Object.defineProperty(el, 'scrollHeight', {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(el, 'clientHeight', {
        value: 50,
        configurable: true,
      });
    };

    it('should call loadMoreGraphQL when user scrolls near bottom while searching', () => {
      jest.useFakeTimers();
      const useCustomerProjectsMock =
        require('../../../../../../src/js/widgets/quickFind/hooks/useCustomerProjects').useCustomerProjects;
      useCustomerProjectsMock.mockReturnValue({
        customers: [{ id: 'c1', displayName: 'Customer 1', type: 'CUSTOMER' }],
        loading: false,
        error: null,
        loadCustomers: mockLoadCustomersGraphQL,
        refetch: mockRefetchGraphQL,
        loadMore: mockLoadMoreGraphQL,
        hasMore: true,
      });

      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const contentColumn = screen.getByTestId('content-column');
      setScrollDimensions(contentColumn);
      fireEvent.scroll(contentColumn);

      expect(mockLoadMoreGraphQL).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should call wteAssignments.loadMore when scrolling with store data (no search)', () => {
      const useWTEAssignmentsMock =
        require('../../../../../../src/js/widgets/weeklyTimeEntry/context/WTEAssignmentsContext').useWTEAssignments;
      useWTEAssignmentsMock.mockReturnValue({
        loadMore: mockWTEAssignmentsLoadMore,
        hasMore: true,
      });

      const store = createMockStore({
        teamMember: { id: '123', name: 'John Doe', type: 'employee' },
      });

      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      const contentColumn = screen.getByTestId('content-column');
      setScrollDimensions(contentColumn);
      fireEvent.scroll(contentColumn);

      expect(mockWTEAssignmentsLoadMore).toHaveBeenCalled();
    });
  });

  describe('Debounced Search', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should call the GraphQL search after debounce delay', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      mockLoadCustomersGraphQL.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockLoadCustomersGraphQL).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockLoadCustomersGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ searchText: 'test' }),
      );
    });

    it('should only run the latest search if it changes before debounce completes', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <WeeklySuperSearch {...defaultProps} />
        </Provider>,
      );

      mockLoadCustomersGraphQL.mockClear();

      const searchInput = screen.getByTestId('search-input');

      fireEvent.change(searchInput, { target: { value: 'test1' } });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      fireEvent.change(searchInput, { target: { value: 'test2' } });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      fireEvent.change(searchInput, { target: { value: 'test3' } });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockLoadCustomersGraphQL).toHaveBeenCalledTimes(1);
      expect(mockLoadCustomersGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({ searchText: 'test3' }),
      );
    });
  });
});
