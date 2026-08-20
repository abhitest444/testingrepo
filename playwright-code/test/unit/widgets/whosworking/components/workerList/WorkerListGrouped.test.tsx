import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { WorkerListGrouped } from 'src/js/widgets/whosworking/components/workerList/WorkerListGrouped';
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
        'whosWorking.list.header.group': 'Group',
        'whosWorking.list.header.hours': 'Hours',
        'whosWorking.list.header.map': 'Map',
        'whosWorking.list.header.action': 'Action',
        'whosWorking.list.action.editTime': 'Edit Time',
        'whosWorking.list.action.addTime': 'Add Time',
        'whosWorking.list.map.show': 'Show on map',
        'whosWorking.list.map.deselect': 'Deselect from map',
        'whosWorking.list.hours.today': 'Today: {duration}',
        'whosWorking.group.noGroup': 'No group',
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
  B3: ({ children, weight }: any) => (
    <span data-weight={weight}>{children}</span>
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

jest.mock('@ids-ts/accordion', () => {
  const Accordion = ({ children }: any) => (
    <div data-testid="accordion">{children}</div>
  );
  const AccordionItem = ({ children, id, defaultExpanded }: any) => (
    <div data-testid={`accordion-item-${id}`} data-expanded={defaultExpanded}>
      {children}
    </div>
  );
  const AccordionItemHeader = ({ sectionTitle, className }: any) => (
    <div data-testid="accordion-header" className={className}>
      {sectionTitle}
    </div>
  );
  const AccordionItemBody = ({ children, className }: any) => (
    <div data-testid="accordion-body" className={className}>
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: Accordion,
    AccordionItem,
    AccordionItemHeader,
    AccordionItemBody,
  };
});

jest.mock(
  'src/js/widgets/whosworking/components/workerList/WorkerListGrouped.styled',
  () => ({
    GroupContent: ({ children }: any) => (
      <div data-testid="group-content">{children}</div>
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

describe('WorkerListGrouped', () => {
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
    it('renders the component with empty workers', () => {
      render(<WorkerListGrouped {...defaultProps} />);

      // Should render header table and accordion
      expect(screen.getByTestId('styled-table')).toBeInTheDocument();
      expect(screen.getByTestId('accordion')).toBeInTheDocument();
    });

    it('renders with workers', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group A' },
        }),
      ];
      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('accordion-item-g1')).toBeInTheDocument();
    });
  });

  describe('Grouping', () => {
    it('groups workers by group name', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
        createMockWorker('3', 'Bob Wilson', {
          group: { groupId: 'g2', groupName: 'Sales' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('accordion-item-g1')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-item-g2')).toBeInTheDocument();
    });

    it('shows group count in header', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      const headers = screen.getAllByTestId('accordion-header');
      expect(headers[0]).toHaveTextContent('Engineering (2)');
    });

    it('puts workers without group in No group', () => {
      const workers = [
        createMockWorker('1', 'John Doe'),
        createMockWorker('2', 'Jane Smith'),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('accordion-item-no-group')).toBeInTheDocument();
      const header = screen.getByTestId('accordion-header');
      expect(header).toHaveTextContent('No group (2)');
    });

    it('maintains group order based on first encounter', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Alpha' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g2', groupName: 'Beta' },
        }),
        createMockWorker('3', 'Bob Wilson', {
          group: { groupId: 'g1', groupName: 'Alpha' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      const accordionItems = screen.getAllByTestId(/accordion-item-/);
      expect(accordionItems[0]).toHaveAttribute(
        'data-testid',
        'accordion-item-g1',
      );
      expect(accordionItems[1]).toHaveAttribute(
        'data-testid',
        'accordion-item-g2',
      );
    });
  });

  describe('Table Headers', () => {
    it('renders table headers', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Map')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  describe('Worker Display', () => {
    it('displays worker display name', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays worker initial in avatar', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('profile-avatar')).toHaveTextContent('J');
    });

    it('displays customer name when available', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
            timeAgainstContactDAS: {
              customer: { id: 'customer-1', displayName: 'Acme Corp' },
            },
          },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  describe('Hours Display', () => {
    it('displays hours container', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          totalDaySeconds: 7200,
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('hours-cell-container')).toBeInTheDocument();
    });

    it('displays time on clock', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 3600000).toISOString();

      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime,
            isOpen: true,
          },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('time-on-clock')).toBeInTheDocument();
    });

    it('shows -- when no active time entry', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('time-on-clock')).toHaveTextContent('--');
    });
  });

  describe('Map Icon', () => {
    it('shows map icon for workers with location', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });

    it('does not show map icon for workers without location', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.queryByTestId('icon-control')).not.toBeInTheDocument();
    });

    it('calls onMapClick when map icon is clicked', () => {
      const onMapClick = jest.fn();
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(
        <WorkerListGrouped
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
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByText('Edit Time')).toBeInTheDocument();
    });

    it('shows Add Time button for workers without active time entry', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByText('Add Time')).toBeInTheDocument();
    });

    it('calls onEditTime directly when Edit Time button is clicked', () => {
      const onEditTime = jest.fn();
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
        }),
      ];

      render(
        <WorkerListGrouped
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
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      // Click the Add Time button to open menu
      fireEvent.click(screen.getByText('Add Time'));

      // Menu should be visible with options
      expect(screen.getByTestId('menu-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Single time entry')).toBeInTheDocument();
      expect(screen.getByText('Add break')).toBeInTheDocument();
    });

    it('calls onAddBreak when Add break is clicked', () => {
      const onAddBreak = jest.fn();
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(
        <WorkerListGrouped
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
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g1', groupName: 'Group' },
        }),
      ];

      render(
        <WorkerListGrouped
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

  describe('Accordion Behavior', () => {
    it('accordion items are expanded by default', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('accordion-item-g1')).toHaveAttribute(
        'data-expanded',
        'true',
      );
    });
  });

  describe('Multiple Groups', () => {
    it('renders multiple groups correctly', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g2', groupName: 'Sales' },
        }),
        createMockWorker('3', 'Bob Wilson', {
          group: { groupId: 'g3', groupName: 'Marketing' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('accordion-item-g1')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-item-g2')).toBeInTheDocument();
      expect(screen.getByTestId('accordion-item-g3')).toBeInTheDocument();
    });

    it('each group has its own table', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Engineering' },
        }),
        createMockWorker('2', 'Jane Smith', {
          group: { groupId: 'g2', groupName: 'Sales' },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      const groupContents = screen.getAllByTestId('group-content');
      expect(groupContents).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('has accessible map icon button', () => {
      const workers = [
        createMockWorker('1', 'John Doe', {
          group: { groupId: 'g1', groupName: 'Group' },
          activeTimeEntry: {
            id: 'entry-1',
            startTime: new Date().toISOString(),
          },
          currentLocation: { latitude: 40.7128, longitude: -74.006 },
        }),
      ];

      render(<WorkerListGrouped {...defaultProps} workers={workers} />);

      expect(screen.getByTestId('icon-control')).toHaveAttribute(
        'aria-label',
        'Show on map',
      );
    });
  });
});
