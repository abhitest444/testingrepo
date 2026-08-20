import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import {
  WorkerRowContent,
  WorkerRowContentProps,
} from 'src/js/widgets/whosworking/components/workerList/WorkerRowContent';
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
    formatMessage: ({ id }: { id: string }, values?: any) => {
      const messages: Record<string, string> = {
        'whosWorking.list.hours.today': `Today: ${values?.duration || '0h 0m'}`,
        'whosWorking.list.map.show': 'Show on map',
        'whosWorking.list.map.deselect': 'Deselect',
        'whosWorking.list.action.editTime': 'Edit Time',
        'whosWorking.list.action.addTime': 'Add Time',
        'whosWorking.popover.singleTimeEntry': 'Single Time Entry',
        'whosWorking.popover.addBreak': 'Add Break',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
  useSandbox: () => mockSandbox,
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children, weight, color }: any) => (
    <span data-weight={weight} data-color={color}>
      {children}
    </span>
  ),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({
    children,
    onClick,
    'aria-label': ariaLabel,
    selected,
  }: any) => (
    <button
      type="button"
      data-testid="map-icon-control"
      onClick={onClick}
      aria-label={ariaLabel}
      data-selected={selected}
    >
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/menu', () => ({
  Menu: ({ children, open, anchorElement }: any) => (
    <div data-testid="menu-container">
      {anchorElement}
      {open && <div data-testid="menu-items">{children}</div>}
    </div>
  ),
  MenuItem: ({ children, onClick, value }: any) => (
    <button type="button" data-testid={`menu-item-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  Map: () => <span data-testid="map-icon">Map</span>,
}));

jest.mock(
  'src/js/widgets/whosworking/components/workerList/WorkerList.styled',
  () => ({
    WorkerRow: ({ children }: any) => (
      <div data-testid="worker-row">{children}</div>
    ),
    WorkerCell: ({ children }: any) => (
      <div data-testid="worker-cell">{children}</div>
    ),
    HoursCellContainer: ({ children }: any) => (
      <div data-testid="hours-cell-container">{children}</div>
    ),
    TimeOnClock: ({ children }: any) => (
      <div data-testid="time-on-clock">{children}</div>
    ),
    ProfileAvatar: ({ children }: any) => (
      <div data-testid="profile-avatar">{children}</div>
    ),
    WorkerNameContainer: ({ children }: any) => (
      <div data-testid="worker-name-container">{children}</div>
    ),
    WorkerNameDetails: ({ children }: any) => (
      <div data-testid="worker-name-details">{children}</div>
    ),
    ProfileAvatarContainer: ({ children, $isSelected }: any) => (
      <div data-testid="profile-avatar-container" data-selected={$isSelected}>
        {children}
      </div>
    ),
    ActionButton: ({ children, onClick, priority, size }: any) => (
      <button
        type="button"
        data-testid="action-button"
        onClick={onClick}
        data-priority={priority}
        data-size={size}
      >
        {children}
      </button>
    ),
  }),
);

jest.mock('src/js/common/MiscUtils', () => ({
  getInitials: (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase(),
}));

jest.mock('src/js/widgets/whosworking/utils/utils', () => ({
  formatDuration: (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  },
  getActiveEntryDuration: () => '2h 30m',
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

describe('WorkerRowContent', () => {
  const defaultProps: WorkerRowContentProps = {
    worker: createMockWorker('1', 'John Doe'),
    isSelected: false,
    onMapClick: jest.fn(),
    onEditTime: jest.fn(),
    onAddTime: jest.fn(),
    onAddBreak: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with worker name', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders profile avatar with initials', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders hours today', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.getByText('Today: 1h 0m')).toBeInTheDocument();
    });

    it('renders "Add Time" button when no active time entry', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.getByText('Add Time')).toBeInTheDocument();
    });

    it('renders "Edit Time" button when there is an active time entry', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.getByText('Edit Time')).toBeInTheDocument();
    });

    it('does not render "Edit Time" button when sdk disables edit time for a different worker', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          currentUserWorkerId="different-worker-id"
          isWhoIsWorkingEditTimeEnabled={false}
        />,
      );

      expect(screen.queryByText('Edit Time')).not.toBeInTheDocument();
    });

    it('does not render "Edit Time" button for a different worker id', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          currentUserWorkerId="different-worker-id"
          isWhoIsWorkingEditTimeEnabled={false}
        />,
      );

      expect(screen.queryByText('Edit Time')).not.toBeInTheDocument();
    });

    it('does not render "Add Time" button for a different worker id when sdk disables edit time', () => {
      const worker = createMockWorker('1', 'John Doe');

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          currentUserWorkerId="different-worker-id"
          isWhoIsWorkingEditTimeEnabled={false}
        />,
      );

      expect(screen.queryByText('Add Time')).not.toBeInTheDocument();
    });

    it('renders time on clock when there is an active time entry', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.getByText('2h 30m')).toBeInTheDocument();
    });

    it('renders "--" for time on clock when no active time entry', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.getByText('--')).toBeInTheDocument();
    });
  });

  describe('Map Icon', () => {
    it('does not render map icon when worker has no location', () => {
      render(<WorkerRowContent {...defaultProps} />);

      expect(screen.queryByTestId('map-icon-control')).not.toBeInTheDocument();
    });

    it('does not render map icon when worker has location but no active time entry', () => {
      const worker = createMockWorker('1', 'John Doe', {
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.queryByTestId('map-icon-control')).not.toBeInTheDocument();
    });

    it('renders map icon when worker has active time entry AND location', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.getByTestId('map-icon-control')).toBeInTheDocument();
    });

    it('calls onMapClick when map icon is clicked', () => {
      const onMapClick = jest.fn();
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          onMapClick={onMapClick}
        />,
      );

      fireEvent.click(screen.getByTestId('map-icon-control'));

      expect(onMapClick).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('shows "Show on map" aria-label when not selected', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          isSelected={false}
        />,
      );

      expect(screen.getByTestId('map-icon-control')).toHaveAttribute(
        'aria-label',
        'Show on map',
      );
    });

    it('shows "Deselect" aria-label when selected', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} isSelected />);

      expect(screen.getByTestId('map-icon-control')).toHaveAttribute(
        'aria-label',
        'Deselect',
      );
    });
  });

  describe('Action Button', () => {
    it('calls onEditTime when Edit Time button is clicked', () => {
      const onEditTime = jest.fn();
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(
        <WorkerRowContent
          {...defaultProps}
          worker={worker}
          onEditTime={onEditTime}
        />,
      );

      fireEvent.click(screen.getByTestId('action-button'));

      expect(onEditTime).toHaveBeenCalledWith('entry-1');
    });

    it('opens menu when Add Time button is clicked', () => {
      render(<WorkerRowContent {...defaultProps} />);

      fireEvent.click(screen.getByTestId('action-button'));

      expect(screen.getByTestId('menu-items')).toBeInTheDocument();
    });

    it('calls onAddTime when Single Time Entry menu item is clicked', () => {
      const onAddTime = jest.fn();
      render(<WorkerRowContent {...defaultProps} onAddTime={onAddTime} />);

      // Open menu
      fireEvent.click(screen.getByTestId('action-button'));

      // Click Single Time Entry
      fireEvent.click(screen.getByTestId('menu-item-singleTimeEntry'));

      expect(onAddTime).toHaveBeenCalled();
    });

    it('calls onAddBreak when Add Break menu item is clicked', () => {
      const onAddBreak = jest.fn();
      render(<WorkerRowContent {...defaultProps} onAddBreak={onAddBreak} />);

      // Open menu
      fireEvent.click(screen.getByTestId('action-button'));

      // Click Add Break
      fireEvent.click(screen.getByTestId('menu-item-addBreak'));

      expect(onAddBreak).toHaveBeenCalled();
    });
  });

  describe('Customer/Project Display', () => {
    it('displays customer name when available', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
          timeAgainstContactDAS: {
            customer: { id: '1', displayName: 'Acme Corp' },
          },
        },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('displays project name when customer is not available', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
          timeAgainstContactDAS: {
            project: { id: '1', displayName: 'Project Alpha' },
          },
        },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('marks profile avatar container as selected when isSelected is true', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} isSelected />);

      expect(screen.getByTestId('profile-avatar-container')).toHaveAttribute(
        'data-selected',
        'true',
      );
    });
  });

  describe('Click Tracking', () => {
    beforeEach(() => {
      mockTrack.mockClear();
    });

    it('tracks EMPLOYEE_LOCATION_MAP when map icon is clicked', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
        currentLocation: { latitude: 40.7128, longitude: -74.006 },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      fireEvent.click(screen.getByTestId('map-icon-control'));

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'employee_location_map',
        }),
      );
    });

    it('tracks EDIT_TIME when Edit Time button is clicked', () => {
      const worker = createMockWorker('1', 'John Doe', {
        activeTimeEntry: {
          id: 'entry-1',
          startTime: new Date().toISOString(),
        },
      });

      render(<WorkerRowContent {...defaultProps} worker={worker} />);

      fireEvent.click(screen.getByTestId('action-button'));

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'edit_time',
        }),
      );
    });

    it('tracks SINGLE_TIME_ENTRY when Single Time Entry menu item is clicked', () => {
      render(<WorkerRowContent {...defaultProps} />);

      // Open menu
      fireEvent.click(screen.getByTestId('action-button'));

      // Click Single Time Entry
      fireEvent.click(screen.getByTestId('menu-item-singleTimeEntry'));

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'single_time_entry',
        }),
      );
    });

    it('tracks ADD_BREAK when Add Break menu item is clicked', () => {
      render(<WorkerRowContent {...defaultProps} />);

      // Open menu
      fireEvent.click(screen.getByTestId('action-button'));

      // Click Add Break
      fireEvent.click(screen.getByTestId('menu-item-addBreak'));

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'add_break',
        }),
      );
    });

    it('does not track EDIT_TIME when Add Time button is clicked (menu opens instead)', () => {
      render(<WorkerRowContent {...defaultProps} />);

      fireEvent.click(screen.getByTestId('action-button'));

      // Should not have tracked EDIT_TIME because there's no active time entry
      expect(mockTrack).not.toHaveBeenCalledWith(
        expect.objectContaining({
          ui_object_detail: 'edit_time',
        }),
      );
    });
  });
});
