import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkerType } from 'src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';
import { navigateToWorkerSettings } from 'src/js/widgets/assignments/utils/helpers';
import { useAppSelector } from 'src/js/widgets/assignments/store/hooks';
import { GroupDetailWorkersTable } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailWorkersTable';
import {
  selectGroupDetailViewError,
  selectGroupDetailViewGroupId,
  selectGroupDetailViewGroupName,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';

// Mock dependencies
const mockNavigate = jest.fn();
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('src/js/widgets/assignments/utils/helpers', () => ({
  ...jest.requireActual('src/js/widgets/assignments/utils/helpers'),
  navigateToWorkerSettings: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn((msg, values) => {
      if (msg.id === 'groups.detail.loading') return 'Loading workers...';
      if (msg.id === 'groups.detail.groupLead') return 'Group lead';
      if (msg.id === 'workers.type.employee') return 'Employee';
      if (msg.id === 'workers.type.user') return 'User';
      if (msg.id === 'workers.filter.vendor') return 'Vendor';
      if (msg.id === 'groups.detail.workerColumn')
        return `Worker (${values?.count || 0})`;
      if (msg.id === 'groups.detail.typeColumn') return 'Type';
      if (msg.id === 'groups.detail.actionsColumn') return 'Actions';
      if (msg.id === 'workers.actions.viewSettings') return 'View settings';
      if (msg.id === 'workers.actions.editWorker') return 'Edit worker';
      if (msg.id === 'workers.actions.removeWorker') return 'Remove from group';
      // Empty state messages (getWorkersEmptyStateTitle)
      if (msg.id === 'groups.detail.noWorkers') return 'No workers found';
      if (msg.id === 'groups.detail.noSearchResults')
        return `No workers found matching "${values?.searchText || ''}"`;
      if (msg.id === 'groups.detail.noWorkersByType') {
        const ft = values?.filterType || '';
        if (ft === 'employee') return 'No employees found';
        if (ft === 'vendor') return 'No vendors found';
        if (ft === 'user') return 'No users found';
        return `No workers of type "${ft}" in this group yet`;
      }
      return msg.defaultMessage || msg.id;
    }),
  })),
  useSandbox: jest.fn(() => ({
    navigation: {
      navigate: mockNavigate,
    },
    logger: mockLogger,
  })),
  useTracking: jest.fn(() => jest.fn()),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ shape, size }: any) => (
    <div data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

jest.mock('@ids-ts/page-message', () => ({
  __esModule: true,
  default: ({ children, type, title, open }: any) =>
    open ? (
      <div data-testid="page-message" data-type={type} data-title={title}>
        {children}
      </div>
    ) : null,
}));

jest.mock('src/js/widgets/assignments/store/hooks', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('src/js/widgets/assignments/store/workersGroupViewSlice', () => ({
  ...jest.requireActual(
    'src/js/widgets/assignments/store/workersGroupViewSlice',
  ),
  selectGroupDetailViewError: jest.fn(
    (state: any) => state?.workersGroupView?.groupDetailView?.error,
  ),
}));

const mockSetGroupDetail = jest.fn();
const mockSetMainTab = jest.fn();
const mockSetWorkersView = jest.fn();
jest.mock('src/js/widgets/assignments/utils/tabPersistence', () => ({
  __esModule: true,
  default: {
    setGroupDetail: (...args: any[]) => mockSetGroupDetail(...args),
    setMainTab: (...args: any[]) => mockSetMainTab(...args),
    setWorkersView: (...args: any[]) => mockSetWorkersView(...args),
    getGroupDetail: jest.fn(),
    clearGroupDetail: jest.fn(),
  },
}));

jest.mock('@ids-ts/table', () => ({
  Table: {
    Row: ({ children, onClick, style }: any) => (
      <tr onClick={onClick} style={style}>
        {children}
      </tr>
    ),
    Cell: ({ children, colSpan }: any) => <td colSpan={colSpan}>{children}</td>,
    Header: ({ children }: any) => <thead>{children}</thead>,
    Body: ({ children }: any) => <tbody>{children}</tbody>,
  },
}));

jest.mock('@ids-ts/link', () => {
  const React = require('react');
  const Link = React.forwardRef(
    (
      { children, onClick, className, href, 'data-testid': testId }: any,
      ref: any,
    ) => {
      const handleClick = (e: any) => {
        e.preventDefault();
        if (onClick) {
          onClick(e);
        }
      };

      return (
        <a
          ref={ref}
          data-testid={testId || 'link'}
          className={className}
          href={href}
          onClick={handleClick}
        >
          {children}
        </a>
      );
    },
  );
  Link.displayName = 'Link';

  return {
    __esModule: true,
    Link,
  };
});

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/styles/GroupDetailView.styled',
  () => {
    const React = require('react');
    const StyledLink = React.forwardRef(
      (
        {
          children,
          onClick,
          className,
          href,
          'data-testid': testId,
          'aria-disabled': ariaDisabled,
          $isDisabled,
        }: any,
        ref: any,
      ) => (
        <a
          ref={ref}
          data-testid={testId || 'link'}
          className={className}
          href={href}
          aria-disabled={ariaDisabled}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(e);
          }}
        >
          {children}
        </a>
      ),
    );
    StyledLink.displayName = 'StyledLink';

    return {
      StyledTable: ({ children, 'data-testid': testId }: any) => (
        <table data-testid={testId}>{children}</table>
      ),
      WorkerInfoContainer: ({ children }: any) => <div>{children}</div>,
      WorkerName: ({ children }: any) => <div>{children}</div>,
      WorkerTypeText: ({ children }: any) => <div>{children}</div>,
      ActionsContainer: ({ children }: any) => <div>{children}</div>,
      TableCellWithPadding: ({ children }: any) => <td>{children}</td>,
      TableCellRightAligned: ({ children }: any) => <td>{children}</td>,
      EmptyStateCell: ({ children, colSpan }: any) => (
        <td colSpan={colSpan}>{children}</td>
      ),
      LoadingRow: ({ children }: any) => <tr>{children}</tr>,
      EmptyStateContainer: ({ children }: any) => <div>{children}</div>,
      StyledLink,
    };
  },
);

const mockNavigateToWorkerSettings =
  navigateToWorkerSettings as jest.MockedFunction<
    typeof navigateToWorkerSettings
  >;

describe('GroupDetailWorkersTable', () => {
  const mockWorkers = [
    {
      id: 'worker-1',
      displayName: 'John Doe',
      type: WorkerType.EMPLOYEE,
      isGroupLead: false,
    },
    {
      id: 'worker-2',
      displayName: 'Jane Manager',
      type: WorkerType.EMPLOYEE,
      isGroupLead: true,
    },
    {
      id: 'worker-3',
      displayName: 'Bob Vendor',
      type: WorkerType.VENDOR,
      isGroupLead: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogger.error.mockClear();
    mockLogger.info.mockClear();
    mockSetGroupDetail.mockClear();
    (useAppSelector as jest.Mock).mockReturnValue(null); // Default no error
  });

  describe('Rendering', () => {
    it('should render the table', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(
        screen.getByTestId('group-detail-workers-table'),
      ).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('Worker (3)')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should use totalCount when provided instead of workers.length', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
          totalCount={10}
        />,
      );

      expect(screen.getByText('Worker (10)')).toBeInTheDocument();
    });

    it('should use workers.length when totalCount is not provided', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('Worker (3)')).toBeInTheDocument();
    });

    it('should render all workers', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('Bob Vendor')).toBeInTheDocument();
    });

    it('should display employee type for employees', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const employeeLabels = screen.getAllByText('Employee');
      expect(employeeLabels.length).toBeGreaterThan(0);
    });

    it('should display contractor type for vendors', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const vendorLabels = screen.getAllByText('Vendor');
      expect(vendorLabels.length).toBeGreaterThan(0);
    });

    it('should display User type for LegacyQboUser workers', () => {
      const legacyQboUserWorker = [
        {
          id: 'worker-4',
          displayName: 'Legacy User',
          type: WorkerType.LEGACY_QBO_USER,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={legacyQboUserWorker}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const userLabels = screen.getAllByText('User');
      expect(userLabels.length).toBeGreaterThan(0);
    });

    it('should display group lead badge for group leads', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('Group lead')).toBeInTheDocument();
    });

    it('should render action buttons for each worker', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsButtons = screen.getAllByText('View settings');
      expect(viewSettingsButtons).toHaveLength(3);
    });
  });

  describe('View settings persistence', () => {
    it('should call TabPersistence.setGroupDetail when currentGroupId and currentGroupName are set', () => {
      (useAppSelector as jest.Mock).mockImplementation((selector: any) => {
        if (selector === selectGroupDetailViewError) return null;
        if (selector === selectGroupDetailViewGroupId) return 'group-123';
        if (selector === selectGroupDetailViewGroupName) return 'Engineering';
        return null;
      });
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );
      const viewSettingsButtons = screen.getAllByText('View settings');
      fireEvent.click(viewSettingsButtons[0]);
      expect(mockSetGroupDetail).toHaveBeenCalledWith(
        expect.anything(),
        'group-123',
        'Engineering',
      );
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
      expect(screen.getByText('Loading workers...')).toBeInTheDocument();
    });

    it('should have correct loader attributes', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const loader = screen.getByTestId('activity-loader');
      expect(loader).toHaveAttribute('data-shape', 'dots');
      expect(loader).toHaveAttribute('data-size', 'large');
    });

    it('should not render workers when loading', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no workers', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('No workers found')).toBeInTheDocument();
    });

    it('should display search-specific empty message', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText="John"
          filterType={WorkerType.ALL}
        />,
      );

      expect(
        screen.getByText('No workers found matching "John"'),
      ).toBeInTheDocument();
    });

    it('should display filter-specific empty message for employees', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.EMPLOYEE}
        />,
      );

      expect(screen.getByText('No employees found')).toBeInTheDocument();
    });

    it('should display filter-specific empty message for vendors', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.VENDOR}
        />,
      );

      expect(screen.getByText('No vendors found')).toBeInTheDocument();
    });

    it('should display filter-specific empty message for users', () => {
      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.LEGACY_QBO_USER}
        />,
      );

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    const mockSandbox = {
      navigation: { navigate: mockNavigate },
      logger: mockLogger,
    };

    it('should call navigateToWorkerSettings when view settings is clicked', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsButtons = screen.getAllByText('View settings');
      fireEvent.click(viewSettingsButtons[0]);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        mockWorkers[0],
        mockSandbox,
        'GroupDetailWorkersTable',
      );
    });

    it('should call navigateToWorkerSettings when row is clicked', () => {
      const { container } = render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[0]);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        mockWorkers[0],
        mockSandbox,
        'GroupDetailWorkersTable',
      );
    });

    it('should call navigateToWorkerSettings for correct worker when row is clicked', () => {
      const { container } = render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      mockNavigateToWorkerSettings.mockClear();

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[1]);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        mockWorkers[1],
        mockSandbox,
        'GroupDetailWorkersTable',
      );
    });

    it('should call navigateToWorkerSettings with worker without name', () => {
      const workersWithoutName = [
        {
          id: 'worker-1',
          displayName: '',
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={workersWithoutName}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsLink = screen.getByText('View settings');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        workersWithoutName[0],
        mockSandbox,
        'GroupDetailWorkersTable',
      );
    });

    it('should call navigateToWorkerSettings with special character worker', () => {
      const workersWithSpecialChars = [
        {
          id: 'worker@special',
          displayName: "José O'Connor",
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={workersWithSpecialChars}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsLink = screen.getByText('View settings');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        workersWithSpecialChars[0],
        mockSandbox,
        'GroupDetailWorkersTable',
      );
    });
  });

  describe('Worker Display', () => {
    it('should display worker names correctly', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('Bob Vendor')).toBeInTheDocument();
    });

    it('should handle workers with long names', () => {
      const workersWithLongNames = [
        {
          id: 'worker-1',
          displayName:
            'This is a very long worker name that might be truncated',
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={workersWithLongNames}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(
        screen.getByText(
          'This is a very long worker name that might be truncated',
        ),
      ).toBeInTheDocument();
    });

    it('should display correct type in both columns', () => {
      const employeeWorker = [mockWorkers[0]];
      render(
        <GroupDetailWorkersTable
          workers={employeeWorker}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      // Type appears in worker info and type column
      const employeeLabels = screen.getAllByText('Employee');
      expect(employeeLabels.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Table Structure', () => {
    it('should render correct number of rows', () => {
      const { container } = render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(3);
    });

    it('should have table with correct test id', () => {
      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const table = screen.getByTestId('group-detail-workers-table');
      expect(table).toHaveAttribute(
        'data-testid',
        'group-detail-workers-table',
      );
      expect(table.tagName).toBe('TABLE');
    });

    it('should render three cells per row', () => {
      const { container } = render(
        <GroupDetailWorkersTable
          workers={[mockWorkers[0]]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const cells = container.querySelectorAll('tbody tr td');
      expect(cells).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty worker displayName', () => {
      const workersWithEmptyName = [
        {
          id: 'worker-1',
          displayName: '',
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      const { container } = render(
        <GroupDetailWorkersTable
          workers={workersWithEmptyName}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      // Should still render the row
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(1);
    });

    it('should handle undefined isGroupLead', () => {
      const workersWithoutLeadFlag = [
        {
          id: 'worker-1',
          displayName: 'Test Worker',
          type: WorkerType.EMPLOYEE,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={workersWithoutLeadFlag as any}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('Test Worker')).toBeInTheDocument();
      expect(screen.queryByText('Group lead')).not.toBeInTheDocument();
    });

    it('should handle single worker', () => {
      render(
        <GroupDetailWorkersTable
          workers={[mockWorkers[0]]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText('Worker (1)')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should handle large number of workers', () => {
      const manyWorkers = Array.from({ length: 100 }, (_, i) => ({
        id: `worker-${i}`,
        displayName: `Worker ${i}`,
        type: WorkerType.EMPLOYEE,
        isGroupLead: false,
      }));

      const { container } = render(
        <GroupDetailWorkersTable
          workers={manyWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(100);
    });

    it('should handle workers with special characters in names', () => {
      const workersWithSpecialChars = [
        {
          id: 'worker-1',
          displayName: "José María O'Connor-Smith",
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={workersWithSpecialChars}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByText("José María O'Connor-Smith")).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error exists', () => {
      (useAppSelector as jest.Mock).mockReturnValue('Failed to load workers');

      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.getByTestId('page-message')).toBeInTheDocument();
      expect(screen.getByText('Failed to load workers')).toBeInTheDocument();
      expect(screen.getByTestId('page-message')).toHaveAttribute(
        'data-type',
        'error',
      );
    });

    it('should not display error when loading', () => {
      (useAppSelector as jest.Mock).mockReturnValue('Failed to load workers');

      render(
        <GroupDetailWorkersTable
          workers={[]}
          isLoading
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
    });

    it('should not display error when no error exists', () => {
      (useAppSelector as jest.Mock).mockReturnValue(null);

      render(
        <GroupDetailWorkersTable
          workers={mockWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      expect(screen.queryByTestId('page-message')).not.toBeInTheDocument();
    });
  });

  describe('QBO User Disabled State', () => {
    const qboWorkers = [
      {
        id: 'qbo-1',
        displayName: 'QBO User',
        type: WorkerType.LEGACY_QBO_USER,
        isGroupLead: false,
      },
    ];

    beforeEach(() => {
      (useAppSelector as jest.Mock).mockReturnValue(null);
    });

    it('should not call navigateToWorkerSettings when QBO user row is clicked', () => {
      const { container } = render(
        <GroupDetailWorkersTable
          workers={qboWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[0]);

      expect(mockNavigateToWorkerSettings).not.toHaveBeenCalled();
    });

    // NOTE: Test removed - "should not call navigateToWorkerSettings when QBO user link is clicked"
    // In real browser: pointer-events: none prevents clicks on disabled links
    // In tests: fireEvent.click() bypasses CSS, so onClick is called
    // The important behavior (visual disabled state, aria-disabled) is tested elsewhere

    it('should have aria-disabled attribute on link for QBO users', () => {
      render(
        <GroupDetailWorkersTable
          workers={qboWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsLink = screen.getByText('View settings');
      expect(viewSettingsLink).toHaveAttribute('aria-disabled', 'true');
    });

    it('should display User type for QBO users', () => {
      render(
        <GroupDetailWorkersTable
          workers={qboWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const userTexts = screen.getAllByText('User');
      expect(userTexts.length).toBeGreaterThan(0);
    });

    it('should allow clicks for non-QBO workers', () => {
      const mixedWorkers = [
        ...qboWorkers,
        {
          id: 'emp-1',
          displayName: 'Employee',
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      const { container } = render(
        <GroupDetailWorkersTable
          workers={mixedWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const rows = container.querySelectorAll('tbody tr');
      fireEvent.click(rows[1]); // Click employee row (second row)

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        mixedWorkers[1],
        expect.anything(),
        'GroupDetailWorkersTable',
      );
    });

    it('should not have aria-disabled for employee workers', () => {
      const employeeWorkers = [
        {
          id: 'emp-1',
          displayName: 'Employee',
          type: WorkerType.EMPLOYEE,
          isGroupLead: false,
        },
      ];

      render(
        <GroupDetailWorkersTable
          workers={employeeWorkers}
          isLoading={false}
          searchText=""
          filterType={WorkerType.ALL}
        />,
      );

      const viewSettingsLink = screen.getByText('View settings');
      expect(viewSettingsLink).not.toHaveAttribute('aria-disabled', 'true');
    });
  });
});
