/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import { OvertimeFilledState } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeFilledState';
import { OVERTIME_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeLoggingConstants';
import {
  createOvertimePolicy,
  createOvertimeRule,
  createDailyRule,
  createDoubleDailyRule,
  createOvertimePolicies,
  createAssignment,
} from 'test/unit/fixtures/overtimeFixtures';

// Mock styled components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/styles/OvertimeFilledState.styled',
  () => ({
    Container: ({ children }: any) => (
      <div data-testid="container">{children}</div>
    ),
    HeaderRow: ({ children }: any) => (
      <div data-testid="header-row">{children}</div>
    ),
    StyledTable: ({ children }: any) => (
      <table data-testid="styled-table">{children}</table>
    ),
    ActionsHeaderCell: ({ children }: any) => (
      <th data-testid="actions-header">{children}</th>
    ),
    ActionsCell: ({ children }: any) => (
      <td data-testid="actions-cell">{children}</td>
    ),
    ActionsContainer: ({ children }: any) => (
      <div data-testid="actions-container">{children}</div>
    ),
    PaginationContainer: ({ children }: any) => (
      <div data-testid="pagination-container">{children}</div>
    ),
    PolicyNameCell: ({ children }: any) => (
      <div data-testid="policy-name-cell">{children}</div>
    ),
  }),
);

// Mock dependencies
jest.mock('@ids-ts/table', () => {
  const TableComponent = ({ children }: any) => (
    <table data-testid="table">{children}</table>
  );
  TableComponent.Header = ({ children }: any) => (
    <thead data-testid="table-header">{children}</thead>
  );
  TableComponent.Body = ({ children }: any) => (
    <tbody data-testid="table-body">{children}</tbody>
  );
  TableComponent.Row = ({ children }: any) => <tr>{children}</tr>;
  TableComponent.Cell = ({ children }: any) => <td>{children}</td>;

  return {
    Table: TableComponent,
  };
});

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    'data-testid': testId,
    ...otherProps
  }: any) => (
    <button onClick={onClick} data-testid={testId} {...otherProps}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/combo-link', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    onSelect,
    label,
    'data-testid': componentTestId,
  }: any) => (
    <div data-testid="combo-link">
      <div data-testid={componentTestId}>
        <button onClick={onClick}>{label}</button>
        <div role="button" tabIndex={0} onKeyDown={onSelect} onClick={onSelect}>
          {children}
        </div>
      </div>
    </div>
  ),
  MenuItem: ({ children, value }: any) => (
    <div data-testid="menu-item" data-value={value}>
      {children}
    </div>
  ),
}));

jest.mock('@ids-ts/pagination', () => ({
  Pagination: ({
    onPageChange,
    activePage,
    totalPages,
    pageSize: _pageSize,
    preventPageJump: _preventPageJump,
    'data-testid': testId,
    totalItems: _totalItems,
  }: any) => (
    <div data-testid={testId}>
      <span>{`Page ${activePage} of ${totalPages}`}</span>
      <button
        data-testid="page-1"
        onClick={() => onPageChange(1)}
        disabled={activePage === 1}
      >
        Page 1
      </button>
      <button
        data-testid="page-2"
        onClick={() => onPageChange(2)}
        disabled={activePage === 2}
      >
        Page 2
      </button>
    </div>
  ),
}));

describe('OvertimeFilledState', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnCreatePolicy = jest.fn();
  const mockOnEditPolicy = jest.fn();
  const mockOnPageChange = jest.fn();
  const mockPageInfo = {
    hasNextPage: false,
    hasPreviousPage: false,
    totalCount: 3,
  };
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  const mockPolicies = [
    createOvertimePolicy({
      id: '1',
      name: 'Basic overtime policy',
      isDefault: true,
      assignments: {
        values: [
          createAssignment({
            id: 'w1',
            entityId: 'user-123',
            entityName: 'John Doe',
          }),
          createAssignment({
            id: 'w2',
            entityId: 'user-456',
            entityName: 'Jane Smith',
          }),
          createAssignment({
            id: 'w3',
            entityType: 'group',
            entityId: 'group-789',
            entityName: 'Engineering Team',
          }),
        ],
      },
      rules: {
        values: [
          createOvertimeRule(),
          createDailyRule(),
          createDoubleDailyRule(),
        ],
      },
    }),
    createOvertimePolicy({
      id: '2',
      name: 'California overtime policy',
      rules: {
        values: [
          createOvertimeRule(),
          createDailyRule(),
          createDoubleDailyRule(),
          createOvertimeRule({
            name: '7th Consecutive Day',
            type: 'consecutive_daily',
            frequency: 'DAILY',
            conditions: [{ field: 'days_in_a_row', value: '7' }],
          }),
          createOvertimeRule({
            name: '7th Consecutive Day Double',
            type: 'consecutive_double_daily',
            frequency: 'DAILY',
            multiplier: 2.0,
            conditions: [
              { field: 'days_in_a_row', value: '7' },
              { field: 'threshold', value: '8' },
            ],
          }),
        ],
      },
    }),
    createOvertimePolicy({
      id: '3',
      name: 'New York overtime policy',
      assignments: {
        values: [
          createAssignment({
            id: 'w4',
            entityId: 'user-111',
            entityName: 'Alice Brown',
          }),
          createAssignment({
            id: 'w5',
            entityId: 'user-222',
            entityName: 'Bob Wilson',
          }),
          createAssignment({
            id: 'w6',
            entityId: 'user-333',
            entityName: 'Carol Davis',
          }),
          createAssignment({
            id: 'w7',
            entityId: 'user-444',
            entityName: 'David Lee',
          }),
          createAssignment({
            id: 'w8',
            entityId: 'user-555',
            entityName: 'Eva Martinez',
          }),
        ],
      },
      rules: {
        values: [
          createOvertimeRule(),
          createDailyRule(),
          createDoubleDailyRule(),
          createDailyRule({
            multiplier: 2.0,
            conditions: [{ field: 'threshold', value: '10' }],
          }),
        ],
      },
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
  });

  describe('Component Rendering', () => {
    it('should render the create policy button', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const createButton = screen.getByTestId('create-overtime-policy-button');
      expect(createButton).toBeInTheDocument();
      // i18n key will be rendered in tests
      expect(createButton).toHaveTextContent(
        /NLS overtime.landing.create.button/i,
      );
    });

    it('should render the table with policies', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      expect(screen.getByTestId('table-header')).toBeInTheDocument();
      expect(screen.getByTestId('table-body')).toBeInTheDocument();
    });

    it('should render all policy names', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      expect(screen.getByText('Basic overtime policy')).toBeInTheDocument();
      expect(
        screen.getByText('California overtime policy'),
      ).toBeInTheDocument();
      expect(screen.getByText('New York overtime policy')).toBeInTheDocument();
    });

    it('should render pagination when policies exceed page size', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      expect(
        screen.getByTestId('overtime-policies-pagination'),
      ).toBeInTheDocument();
    });

    it('should render actions for each policy', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onEditPolicy={mockOnEditPolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const comboLinks = screen.getAllByTestId('combo-link');
      expect(comboLinks).toHaveLength(mockPolicies.length);
    });
  });

  describe('Component Lifecycle', () => {
    it('should log FILLED_STATE_MOUNTED when component mounts', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.FILLED_STATE_MOUNTED),
          {
            policiesCount: mockPolicies.length,
            totalPages: 1,
          },
        );
      });
    });

    it('should calculate correct total pages for pagination', async () => {
      // Page size is 10 (OVERTIME_POLICIES_PAGE_SIZE), so 25 policies = 3 pages
      const manyPolicies = createOvertimePolicies(25);

      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={manyPolicies}
          pageInfo={{
            hasNextPage: false,
            hasPreviousPage: false,
            totalCount: 25,
          }}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.FILLED_STATE_MOUNTED),
          {
            policiesCount: 25,
            totalPages: 3, // 10 per page (OVERTIME_POLICIES_PAGE_SIZE), so 25 policies = 3 pages
          },
        );
      });
    });
  });

  describe('User Interactions - Create Policy', () => {
    it('should call onCreatePolicy when create button is clicked', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const createButton = screen.getByTestId('create-overtime-policy-button');
      fireEvent.click(createButton);

      expect(mockOnCreatePolicy).toHaveBeenCalled();
    });

    it('should log FILLED_STATE_CREATE_POLICY_CLICKED when create button is clicked', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const createButton = screen.getByTestId('create-overtime-policy-button');
      fireEvent.click(createButton);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.FILLED_STATE_CREATE_POLICY_CLICKED,
        ),
        undefined,
      );
    });
  });

  describe('User Interactions - Edit Policy', () => {
    it('should call onEditPolicy when edit button is clicked', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onEditPolicy={mockOnEditPolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const comboLinks = screen.getAllByTestId('combo-link');
      const editButton = comboLinks[0].querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
      }

      expect(mockOnEditPolicy).toHaveBeenCalledWith('1');
    });

    it('should log FILLED_STATE_EDIT_POLICY_CLICKED with correct policyId', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onEditPolicy={mockOnEditPolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const comboLinks = screen.getAllByTestId('combo-link');
      const editButton = comboLinks[0].querySelector('button');

      if (editButton) {
        fireEvent.click(editButton);
      }

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          OVERTIME_LOGGING.FILLED_STATE_EDIT_POLICY_CLICKED,
        ),
        { policyId: '1' },
      );
    });

    it('should handle missing onEditPolicy callback gracefully', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const comboLinks = screen.getAllByTestId('combo-link');
      const editButton = comboLinks[0].querySelector('button');

      // Should not throw error
      expect(() => {
        if (editButton) {
          fireEvent.click(editButton);
        }
      }).not.toThrow();
    });
  });

  describe('User Interactions - Menu', () => {
    it('should log FILLED_STATE_MENU_OPENED when menu is opened', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={mockPolicies}
          pageInfo={mockPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onEditPolicy={mockOnEditPolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      const comboLinks = screen.getAllByTestId('combo-link');
      const menuItems = comboLinks[0].querySelectorAll(
        '[data-testid="menu-item"]',
      );

      expect(menuItems.length).toBeGreaterThan(0);

      // Simulate menu select event
      const menuItem = menuItems[0];
      fireEvent.click(menuItem);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(OVERTIME_LOGGING.FILLED_STATE_MENU_OPENED),
        { policyId: '1' },
      );
    });
  });

  describe('Pagination', () => {
    it('should not log pagination changes', () => {
      const manyPolicies = createOvertimePolicies(25);

      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={manyPolicies}
          pageInfo={{
            hasNextPage: false,
            hasPreviousPage: false,
            totalCount: 25,
          }}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      // Clear mount logs
      jest.clearAllMocks();

      const page2Button = screen.getByTestId('page-2');
      fireEvent.click(page2Button);

      // Should not log pagination changes
      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
    });

    it('should display correct active page', async () => {
      // Page size is 10 (OVERTIME_POLICIES_PAGE_SIZE), so 30 policies = 3 pages
      const manyPolicies = createOvertimePolicies(30);

      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={manyPolicies}
          pageInfo={{
            hasNextPage: true,
            hasPreviousPage: false,
            totalCount: 30,
          }}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      // Verify initial pagination state shows "Page 1 of 3"
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      // Policies should be visible (component displays all policies passed to it)
      expect(screen.getByText('Policy 1')).toBeInTheDocument();

      const page2Button = screen.getByTestId('page-2');
      fireEvent.click(page2Button);

      // Verify onPageChange was called with page 2
      // The parent component is responsible for fetching new data
      await waitFor(() => {
        expect(mockOnPageChange).toHaveBeenCalledWith(2);
      });

      // Verify pagination indicator updated to show page 2
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  describe('Empty Policies', () => {
    it('should handle empty policies array', () => {
      const emptyPageInfo = {
        hasNextPage: false,
        hasPreviousPage: false,
        totalCount: 0,
      };
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={[]}
          pageInfo={emptyPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      expect(
        screen.getByTestId('create-overtime-policy-button'),
      ).toBeInTheDocument();
    });

    it('should log correct counts for empty policies', async () => {
      const emptyPageInfo = {
        hasNextPage: false,
        hasPreviousPage: false,
        totalCount: 0,
      };
      renderWithQuicksandReduxAndLogging(
        <OvertimeFilledState
          policies={[]}
          pageInfo={emptyPageInfo}
          onCreatePolicy={mockOnCreatePolicy}
          onPageChange={mockOnPageChange}
        />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.FILLED_STATE_MOUNTED),
          {
            policiesCount: 0,
            totalPages: 0,
          },
        );
      });
    });
  });
});
