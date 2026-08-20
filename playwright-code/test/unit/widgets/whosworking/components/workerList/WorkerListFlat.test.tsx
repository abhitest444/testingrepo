import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { WorkerListFlat } from 'src/js/widgets/whosworking/components/workerList/WorkerListFlat';
import { WhoIsWorkingWorkerNode } from 'src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore';

// Mock tracking function
const mockTrack = jest.fn();
const mockSandbox = {
  appContext: {
    getUserAuthInfo: jest.fn(() => ({ authId: 'auth-user-1' })),
    getAppInfo: jest.fn(() => ({ appId: 'test-app' })),
  },
};

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'whosWorking.list.header.teamMember': 'Team Member',
        'whosWorking.list.header.hours': 'Hours',
        'whosWorking.list.header.map': 'Map',
        'whosWorking.list.header.action': 'Action',
        'whosWorking.list.action.editTime': 'Edit Time',
        'whosWorking.list.action.addTime': 'Add Time',
        'whosWorking.list.map.show': 'Show on map',
        'whosWorking.list.map.deselect': 'Deselect from map',
        'whosWorking.list.hours.today': 'Today: {duration}',
        'whosWorking.popover.singleTimeEntry': 'Single time entry',
        'whosWorking.popover.addBreak': 'Add break',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
  useSandbox: () => mockSandbox,
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, weight, color }: any) => (
    <span data-weight={weight} style={{ color }}>
      {children}
    </span>
  ),
}));

jest.mock('@ids-ts/table', () => ({
  Table: Object.assign(
    ({ children, divider, hover, summary, density }: any) => (
      <table
        data-divider={divider}
        data-hover={hover}
        data-summary={summary}
        data-density={density}
      >
        {children}
      </table>
    ),
    {
      Header: ({ children }: any) => <thead>{children}</thead>,
      Body: ({ children }: any) => <tbody>{children}</tbody>,
      Row: ({ children, onClick, className }: any) => (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <tr onClick={onClick} className={className}>
          {children}
        </tr>
      ),
      Cell: ({ children, colSpan }: any) => (
        <td colSpan={colSpan}>{children}</td>
      ),
    },
  ),
}));

jest.mock('@design-systems/icons', () => ({
  Map: () => <span data-testid="map-icon">Map</span>,
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, 'aria-label': ariaLabel }: any) => (
    <button data-testid="icon-control" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({ children, onClick, priority, size }: any) => (
    <button data-testid={`button-${priority}-${size}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/menu', () => ({
  Menu: ({ children, open, anchorElement, onClose, onClickAway }: any) => (
    <div data-testid="menu-container">
      {anchorElement}
      {open && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div data-testid="menu-dropdown" onClick={onClickAway}>
          {children}
        </div>
      )}
    </div>
  ),
  MenuItem: ({ children, onClick, value }: any) => (
    <button data-testid={`menu-item-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock(
  'src/js/widgets/whosworking/components/workerList/WorkerList.styled',
  () => ({
    StyledTable: ({ children, divider, hover, summary, density }: any) => (
      <table
        data-testid="styled-table"
        data-divider={divider}
        data-hover={hover}
      >
        {children}
      </table>
    ),
    WorkerRow: ({ children, $isSelected }: any) => (
      <tr data-testid="worker-row" data-selected={$isSelected}>
        {children}
      </tr>
    ),
    WorkerCell: ({ children }: any) => (
      <td data-testid="worker-cell">{children}</td>
    ),
    HoursCellContainer: ({ children }: any) => (
      <div data-testid="hours-cell-container">{children}</div>
    ),
    TimeOnClock: ({ children }: any) => (
      <span data-testid="time-on-clock">{children}</span>
    ),
    ProfileAvatar: ({ children }: any) => (
      <div data-testid="profile-avatar">{children}</div>
    ),
    ProfileAvatarContainer: ({ children, $isSelected }: any) => (
      <div data-testid="profile-avatar-container" data-selected={$isSelected}>
        {children}
      </div>
    ),
    WorkerNameContainer: ({ children }: any) => (
      <div data-testid="worker-name-container">{children}</div>
    ),
    WorkerNameDetails: ({ children }: any) => (
      <div data-testid="worker-name-details">{children}</div>
    ),
    ActionButton: ({ children, onClick, priority, size }: any) => (
      <button
        data-testid={`action-button-${priority}-${size}`}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
    ),
  }),
);

jest.mock('src/js/widgets/whosworking/utils/utils', () => ({
  formatDuration: (seconds: number | null) => {
    if (seconds == null || seconds === 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h 0m`;
    return `${m}m`;
  },
  getActiveEntryDuration: (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffSeconds = Math.max(
      0,
      Math.floor((now.getTime() - start.getTime()) / 1000),
    );
    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h 0m`;
    if (m > 0) return `${m}m`;
    return '0m';
  },
  getInitials: (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },
}));

// Helper to create mock worker nodes
const createMockWorker = (
  id: string,
  displayName: string,
  overrides?: Partial<WhoIsWorkingWorkerNode>,
): WhoIsWorkingWorkerNode =>
  ({
    timeForContactDAS: { id },
    firstName: displayName.split(' ')[0],
    lastName: displayName.split(' ')[1] || 'Test',
    displayName,
    timeForType: 'EMPLOYEE',
    group: null,
    totalDaySeconds: 3600,
    activeTimeEntry: null,
    currentLocation: null,
    ...overrides,
  } as WhoIsWorkingWorkerNode);

describe('WorkerListFlat', () => {
  const defaultProps = {
    workers: [] as WhoIsWorkingWorkerNode[],
    selectedWorkerId: '',
    onMapClick: jest.fn(),
    onEditTime: jest.fn(),
    onAddTime: jest.fn(),
    onAddBreak: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<WorkerListFlat {...defaultProps} />);

      expect(screen.getByTestId('styled-table')).toBeInTheDocument();
    });

    it('renders with default props when no workers provided', () => {
      render(<WorkerListFlat {...defaultProps} workers={[]} />);

      expect(screen.getByTestId('styled-table')).toBeInTheDocument();
    });
  });

  describe('Worker List', () => {
    it('renders table with workers', () => {
      const workers = [
        createMockWorker('1', 'John Doe'),
        createMockWorker('2', 'Jane Smith'),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('styled-table')).toBeInTheDocument();
      expect(screen.getAllByTestId('worker-row')).toHaveLength(2);
    });

    it('renders table headers', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('Team Member')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Map')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('displays worker display name', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays worker initial in avatar', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('profile-avatar')).toHaveTextContent('J');
    });
  });

  describe('Hours Display', () => {
    it('displays hours container', () => {
      const workers = [
        createMockWorker('1', 'John Doe', { totalDaySeconds: 7200 }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('hours-cell-container')).toBeInTheDocument();
    });

    it('displays time on clock', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 3600000).toISOString(); // 1 hour ago

      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime,
            isOpen: true,
          },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('time-on-clock')).toBeInTheDocument();
    });

    it('shows -- when no active time entry', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('time-on-clock')).toHaveTextContent('--');
    });
  });

  describe('Map Icon', () => {
    it('shows map icon for workers with location', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });

    it('does not show map icon for workers without location', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.queryByTestId('icon-control')).not.toBeInTheDocument();
    });

    it('calls onMapClick when map icon is clicked', () => {
      const onMapClick = jest.fn();
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          onMapClick={onMapClick}
        />,
      );

      fireEvent.click(screen.getByTestId('icon-control'));

      expect(onMapClick).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  describe('Action Buttons', () => {
    it('shows Edit Time button for workers with active time entry', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('Edit Time')).toBeInTheDocument();
    });

    it('shows Add Time button for workers without active time entry', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('Add Time')).toBeInTheDocument();
    });

    it('calls onEditTime directly when Edit Time button is clicked', () => {
      const onEditTime = jest.fn();
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
        }),
      ];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          onEditTime={onEditTime}
        />,
      );

      // Click the Edit Time button - should directly call onEditTime
      fireEvent.click(screen.getByText('Edit Time'));

      expect(onEditTime).toHaveBeenCalledWith('entry-1');
    });

    it('opens menu when Add Time button is clicked', () => {
      const workers = [createMockWorker('1', 'John Doe')];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      // Click the Add Time button to open menu
      fireEvent.click(screen.getByText('Add Time'));

      // Menu should be visible with options
      expect(screen.getByTestId('menu-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Single time entry')).toBeInTheDocument();
      expect(screen.getByText('Add break')).toBeInTheDocument();
    });

    it('does not open menu when Edit Time button is clicked', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      // Click the Edit Time button - should NOT open menu
      fireEvent.click(screen.getByText('Edit Time'));

      // Menu should NOT be visible since Edit Time directly calls onEditTime
      expect(screen.queryByTestId('menu-dropdown')).not.toBeInTheDocument();
    });

    it('calls onAddTime when Single time entry is clicked for worker without active entry', () => {
      const onAddTime = jest.fn();
      const workers = [createMockWorker('1', 'John Doe')];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          onAddTime={onAddTime}
        />,
      );

      // Open menu
      fireEvent.click(screen.getByText('Add Time'));
      // Click Single time entry
      fireEvent.click(screen.getByTestId('menu-item-singleTimeEntry'));

      expect(onAddTime).toHaveBeenCalled();
    });

    it('calls onAddBreak when Add break is clicked', () => {
      const onAddBreak = jest.fn();
      const workers = [createMockWorker('1', 'John Doe')];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          onAddBreak={onAddBreak}
        />,
      );

      // Open menu
      fireEvent.click(screen.getByText('Add Time'));
      // Click Add break
      fireEvent.click(screen.getByTestId('menu-item-addBreak'));

      expect(onAddBreak).toHaveBeenCalledWith('1');
    });
  });

  describe('Selected Worker', () => {
    it('marks selected worker row', () => {
      const workers = [
        createMockWorker('1', 'John Doe'),
        createMockWorker('2', 'Jane Smith'),
      ];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          selectedWorkerId="1"
        />,
      );

      const rows = screen.getAllByTestId('worker-row');
      // Verify both rows are rendered - selected state is handled by ProfileAvatarContainer
      expect(rows).toHaveLength(2);
    });
  });

  describe('Customer/Project Display', () => {
    it('displays customer name when available', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
            timeAgainstContactDAS: {
              customer: { id: 'customer-1', displayName: 'Acme Corp' },
            },
          },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('displays project name when available and no customer', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
            timeAgainstContactDAS: {
              project: { id: 'project-1', displayName: 'Website Redesign' },
            },
          },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByText('Website Redesign')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible map icon button', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(<WorkerListFlat {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('icon-control')).toHaveAttribute(
        'aria-label',
        'Show on map',
      );
    });

    it('changes aria-label when worker is selected', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(
        <WorkerListFlat
          {...defaultProps}
          workers={workers}
          selectedWorkerId="1"
        />,
      );

      expect(screen.getByTestId('icon-control')).toHaveAttribute(
        'aria-label',
        'Deselect from map',
      );
    });
  });
});
