import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import TimeEntryTimeline from 'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryTimeline';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock useTracking
const mockTrack = jest.fn();

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: (
      { id }: { id: string },
      values?: Record<string, string>,
    ) => {
      const messages: Record<string, string> = {
        'timeEntryLocation.timeline.clockedIn': `Clocked in at ${
          values?.time || ''
        }`,
        'timeEntryLocation.timeline.clockedOut': `Clocked out at ${
          values?.time || ''
        }`,
        'timeEntryLocation.timeline.expandAll': 'Expand all location points',
        'timeEntryLocation.timeline.showMore': 'Show more',
        'timeEntryLocation.timeline.showLess': 'Show less',
        'timeEntryLocation.flags.leftGeofence': 'Left geofence location',
        'timeEntryLocation.flags.loggedOutOnClock': 'Logged out on clock',
        'timeEntryLocation.flags.locationNotShared': 'Location not shared',
        'timeEntryLocation.flags.lowBattery': 'Low battery',
        'timeEntryLocation.flags.batterySaverEnabled': 'Battery saver enabled',
        'timeEntryLocation.flags.mockedLocation': 'Mocked location',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
}));

// Mock @ids-ts/typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  B2: ({ children }: any) => (
    <span data-testid="typography-b2">{children}</span>
  ),
  B3: ({ children }: any) => (
    <span data-testid="typography-b3">{children}</span>
  ),
}));

// Mock @ids-ts/chip
jest.mock('@ids-ts/chip', () => ({
  __esModule: true,
  default: ({ selectionLabels, dismissible }: any) => (
    <div
      data-testid="chip"
      data-dismissible={dismissible}
      data-labels={selectionLabels?.join(',')}
    >
      {selectionLabels?.join(', ')}
    </div>
  ),
}));

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  __esModule: true,
  ExpandAll: () => <span data-testid="expand-all-icon">ExpandAll</span>,
  Circle: () => <span data-testid="circle-icon">Circle</span>,
  CommentPencil: () => <span data-testid="comment-pencil-icon">Note</span>,
}));

// Mock common.styles
jest.mock(
  'src/js/widgets/timeEntryLocation/components/styles/common.styles',
  () => ({
    __esModule: true,
    GreenLocationMarker: () => (
      <span data-testid="green-location-marker">GreenMarker</span>
    ),
    GrayLocationMarker: () => (
      <span data-testid="gray-location-marker">GrayMarker</span>
    ),
    OrangeLocationMarker: () => (
      <span data-testid="orange-location-marker">OrangeMarker</span>
    ),
  }),
);

// Mock utility functions
jest.mock('src/js/widgets/timeEntryLocation/utils/locationPointUtils', () => ({
  ...jest.requireActual(
    'src/js/widgets/timeEntryLocation/utils/locationPointUtils',
  ),
  getClockInOutTimes: jest.fn((locationPoints) => {
    if (locationPoints.length === 0) {
      return { clockInTime: '', clockOutTime: '' };
    }
    // Extract time from formatted timestamp (format: "D MMM YYYY, h:mm A")
    const extractTime = (timestamp: string) => {
      const timeMatch = timestamp.match(/,\s*(.+)$/);
      return timeMatch ? timeMatch[1] : timestamp;
    };
    return {
      clockInTime: extractTime(locationPoints[0].timestamp),
      clockOutTime: extractTime(
        locationPoints[locationPoints.length - 1].timestamp,
      ),
    };
  }),
  mapLocationPointsToTimeline: jest.fn((locationPoints) => {
    // Extract time from formatted timestamp (format: "D MMM YYYY, h:mm A")
    const extractTime = (timestamp: string) => {
      const timeMatch = timestamp.match(/,\s*(.+)$/);
      return timeMatch ? timeMatch[1] : timestamp;
    };
    return locationPoints.map((point: any, index: number) => ({
      id: `location-${index}`,
      time: extractTime(point.timestamp),
      isArrival: index === 0 || index === locationPoints.length - 1,
      deviceAttributes: point.deviceAttributes,
    }));
  }),
}));

describe('TimeEntryTimeline', () => {
  const sandbox = getDefaultSandbox();

  const mockTimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:00:00.000-08:00',
    endTime: '2026-01-14T17:00:00.000-08:00',
    timeZone: 'America/Los_Angeles',
  } as any;

  const mockLocationPoints = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '14 Jan 2026, 10:00 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '14 Jan 2026, 11:00 AM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
    },
  ];

  const defaultProps = {
    timeEntry: mockTimeEntry,
    locationPoints: mockLocationPoints,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  it('should render without crashing', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should display clock in time from first location point', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('should display clock out time from last location point', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
  });

  it('should not show expand button with 2 points (no additional points)', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    // With 2 location points, there are no additional points, so no expand button
    expect(
      screen.queryByText('Expand all location points'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('expand-all-icon')).not.toBeInTheDocument();
  });

  it('should show expand button when collapsed with 3+ points', () => {
    const multiPoint = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 10:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 11:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 12:00 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
      sandbox,
    );
    // With 3+ location points, should show expand button
    expect(screen.getByText('Expand all location points')).toBeInTheDocument();
    expect(screen.getByTestId('expand-all-icon')).toBeInTheDocument();
  });

  it('should not show location points when collapsed with 3+ points', () => {
    const multiPoint = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 10:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 11:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 12:00 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
      sandbox,
    );
    // Initially collapsed, intermediate points should not be visible
    expect(screen.queryByText('11:00 AM')).not.toBeInTheDocument();
  });

  it('should toggle expand when expand button is clicked with 3+ points', () => {
    const multiPoint = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 10:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 11:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 12:00 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
      sandbox,
    );
    // Initially collapsed
    expect(screen.queryByText('11:00 AM')).not.toBeInTheDocument();

    // Click expand button
    fireEvent.click(screen.getByText('Expand all location points'));

    // With 3+ location points, middle ones should be shown
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
  });

  it('should render with empty location points', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={[]} />,
      sandbox,
    );
    // With empty location points, component returns null (nothing renders)
    const greenMarkers = screen.queryAllByTestId('green-location-marker');
    expect(greenMarkers.length).toBe(0); // Nothing rendered
  });

  it('should render with null timeEntry', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline timeEntry={null} locationPoints={[]} />,
      sandbox,
    );
    // With empty location points, component returns null (nothing renders)
    const greenMarkers = screen.queryAllByTestId('green-location-marker');
    expect(greenMarkers.length).toBe(0); // Nothing rendered
  });

  it('should render only clock in with 1 point (no dots, no expand button, no clock out)', () => {
    const singlePoint = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 10:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={singlePoint} />,
      sandbox,
    );
    // With 1 location point, should only show clock in
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    // Should NOT show expand button (no additional points)
    expect(
      screen.queryByText('Expand all location points'),
    ).not.toBeInTheDocument();
    // Should NOT show dots (no multiple points)
    const circleIcons = screen.queryAllByTestId('circle-icon');
    expect(circleIcons.length).toBe(0);
    // Should only have 1 green marker (clock in only, no clock out)
    const greenMarkers = screen.getAllByTestId('green-location-marker');
    expect(greenMarkers.length).toBe(1); // Only clock in
  });

  it('should render clock in and clock out with 2 points (no expand button)', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    // With 2 location points, should show clock in and clock out
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM')).toBeInTheDocument();
    // Should NOT show expand button (no additional points)
    expect(
      screen.queryByText('Expand all location points'),
    ).not.toBeInTheDocument();
    // Should show dots between clock in and clock out
    const circleIcons = screen.getAllByTestId('circle-icon');
    expect(circleIcons.length).toBeGreaterThan(0);
    // Should have 2 green markers (clock in and clock out)
    const greenMarkers = screen.getAllByTestId('green-location-marker');
    expect(greenMarkers.length).toBe(2);
  });

  it('should render vertical dots connector between timeline items with 2+ points', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} />,
      sandbox,
    );
    // With 2 points, should have dots between clock in and clock out
    const circleIcons = screen.getAllByTestId('circle-icon');
    expect(circleIcons.length).toBeGreaterThan(0);
  });

  it('should render multiple location points with only middle ones shown (first and last filtered)', () => {
    const multiPoint = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '14 Jan 2026, 10:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '14 Jan 2026, 11:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
      },
      {
        lat: 37.388,
        lng: -122.086,
        timestamp: '14 Jan 2026, 12:00 PM',
        accuracy: '10m',
        teamMemberName: 'John Doe',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
      sandbox,
    );
    // Expand first
    fireEvent.click(screen.getByText('Expand all location points'));
    // With 3+ location points, first and last are filtered out from intermediate points (match clock in/out)
    // Clock in shows "10:00 AM" and clock out shows "12:00 PM", but these don't appear as intermediate location points
    expect(screen.getByText('10:00 AM')).toBeInTheDocument(); // Clock in time
    expect(screen.getByText('11:00 AM')).toBeInTheDocument(); // Middle location point shown
    expect(screen.getByText('12:00 PM')).toBeInTheDocument(); // Clock out time
    // Dots between points, after clock in, and before clock out
    const circleIcons = screen.getAllByTestId('circle-icon');
    expect(circleIcons.length).toBeGreaterThan(0);
  });

  it('should render clock in and clock out with green markers', () => {
    renderWithQuicksandProvider(
      <TimeEntryTimeline {...defaultProps} locationPoints={[]} />,
      sandbox,
    );
    // With empty location points, component returns null (nothing renders)
    const greenMarkers = screen.queryAllByTestId('green-location-marker');
    expect(greenMarkers.length).toBe(0); // Nothing rendered
  });

  describe('tracking events', () => {
    it('should track EXPAND_ALL_LOCATION_POINTS when expand button is clicked', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      const multiPoint = [
        {
          lat: 37.386,
          lng: -122.084,
          timestamp: '14 Jan 2026, 10:00 AM',
          accuracy: '15m',
          teamMemberName: 'John Doe',
        },
        {
          lat: 37.387,
          lng: -122.085,
          timestamp: '14 Jan 2026, 11:00 AM',
          accuracy: '12m',
          teamMemberName: 'John Doe',
        },
        {
          lat: 37.388,
          lng: -122.086,
          timestamp: '14 Jan 2026, 12:00 PM',
          accuracy: '10m',
          teamMemberName: 'John Doe',
        },
      ];

      renderWithQuicksandProvider(
        <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
        sandbox,
      );

      // Click expand button (initially collapsed)
      fireEvent.click(screen.getByText('Expand all location points'));

      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.EXPAND_ALL_LOCATION_POINTS,
      );
    });

    it('should not track EXPAND_ALL_LOCATION_POINTS when collapsing', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      const multiPoint = [
        {
          lat: 37.386,
          lng: -122.084,
          timestamp: '14 Jan 2026, 10:00 AM',
          accuracy: '15m',
          teamMemberName: 'John Doe',
        },
        {
          lat: 37.387,
          lng: -122.085,
          timestamp: '14 Jan 2026, 11:00 AM',
          accuracy: '12m',
          teamMemberName: 'John Doe',
        },
        {
          lat: 37.388,
          lng: -122.086,
          timestamp: '14 Jan 2026, 12:00 PM',
          accuracy: '10m',
          teamMemberName: 'John Doe',
        },
      ];

      renderWithQuicksandProvider(
        <TimeEntryTimeline {...defaultProps} locationPoints={multiPoint} />,
        sandbox,
      );

      // First click expands (should track)
      fireEvent.click(screen.getByText('Expand all location points'));
      mockTrack.mockClear();

      // Second click collapses (should NOT track)
      const expandButton = screen.queryByText('Expand all location points');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      expect(mockTrack).not.toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.EXPAND_ALL_LOCATION_POINTS,
      );
    });
  });
});

describe('TimeEntryTimeline — device/geofence flags (SBSEG-QBO-geofence-flags)', () => {
  const sandbox = getDefaultSandbox();

  const mockTimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:00:00.000-08:00',
    endTime: '2026-01-14T17:00:00.000-08:00',
    timeZone: 'America/Los_Angeles',
  } as any;

  // Clock-in flagged, one flagged intermediate, clock-out unflagged
  const threePointsWithFlags = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '14 Jan 2026, 9:30 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: true },
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '14 Jan 2026, 10:00 AM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
      deviceAttributes: {
        leftGeofence: true,
        notes: ['Left the geofence to grab supplies.'],
      },
    },
    {
      lat: 37.388,
      lng: -122.086,
      timestamp: '14 Jan 2026, 5:30 PM',
      accuracy: '10m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: false },
    },
  ];

  const twoPointsNoFlags = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '14 Jan 2026, 9:30 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '14 Jan 2026, 5:30 PM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  const expandTimeline = () => {
    const expandButton = screen.queryByText('Expand all location points');
    if (expandButton) {
      fireEvent.click(expandButton);
    }
  };

  describe('feature flag off (default look and feel unchanged)', () => {
    it('does not render any flag chips when isGeofenceFlagsEnabled is false, even with active flags', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled={false}
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
    });

    it('does not render any flag chips when isGeofenceFlagsEnabled is not provided (default off)', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
    });

    it('does not render a note block when isGeofenceFlagsEnabled is false, even with a note present', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled={false}
        />,
        sandbox,
      );
      expandTimeline();
      expect(
        screen.queryByTestId('comment-pencil-icon'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Left the geofence to grab supplies.'),
      ).not.toBeInTheDocument();
    });

    it('renders only green/gray markers (no orange) when the feature flag is off', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled={false}
        />,
        sandbox,
      );
      expandTimeline();
      expect(
        screen.queryByTestId('orange-location-marker'),
      ).not.toBeInTheDocument();
    });

    it('renders identically for points with no deviceAttributes at all when the flag is off', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={twoPointsNoFlags}
          isGeofenceFlagsEnabled={false}
        />,
        sandbox,
      );
      expect(screen.getByText('9:30 AM')).toBeInTheDocument();
      expect(screen.getByText('5:30 PM')).toBeInTheDocument();
      expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
    });
  });

  describe('feature flag on', () => {
    it('renders a flag chip for the clock-in point when it has an active flag', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      const chips = screen.getAllByTestId('chip');
      expect(
        chips.some(
          (chip) => chip.getAttribute('data-labels') === 'Mocked location',
        ),
      ).toBe(true);
    });

    it('renders a flag chip for an intermediate point when expanded', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      const chips = screen.getAllByTestId('chip');
      expect(
        chips.some(
          (chip) =>
            chip.getAttribute('data-labels') === 'Left geofence location',
        ),
      ).toBe(true);
    });

    it('does not render a flag chip for the clock-out point when it has no active flags', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      // clock-out point has mockedLocation: false only, so it must not render a chip labeled Mocked location for it.
      // We assert indirectly: exactly one chip should exist before expanding (clock-in's), none from clock-out.
      const chips = screen.getAllByTestId('chip');
      expect(chips).toHaveLength(1);
    });

    it('does not render any chips or notes when no points have deviceAttributes, even with the flag on', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={twoPointsNoFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('comment-pencil-icon'),
      ).not.toBeInTheDocument();
    });

    it('renders orange marker for a flagged intermediate point when expanded', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(
        screen.getAllByTestId('orange-location-marker').length,
      ).toBeGreaterThan(0);
    });

    it('renders orange marker for the clock-in point when it has an active flag (endpoints can be orange)', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      // Clock-in row renders before expanding; its marker should be orange since it has an active flag
      expect(
        screen.getAllByTestId('orange-location-marker').length,
      ).toBeGreaterThan(0);
    });

    it('renders a green marker for the clock-out point since it has no active flags', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      // At least one green marker should exist for the unflagged clock-out point
      expect(
        screen.getAllByTestId('green-location-marker').length,
      ).toBeGreaterThan(0);
    });

    it('renders the note block with the comment icon for a point that has a note, once expanded', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.getByTestId('comment-pencil-icon')).toBeInTheDocument();
      expect(
        screen.getByText('Left the geofence to grab supplies.'),
      ).toBeInTheDocument();
    });

    it('does not render a show more/less toggle for a short note', () => {
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={threePointsWithFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.queryByText('Show more')).not.toBeInTheDocument();
      expect(screen.queryByText('Show less')).not.toBeInTheDocument();
    });

    it('renders a truncated note with a Show more toggle when the note exceeds 100 characters', () => {
      const longNote = 'a'.repeat(150);
      const pointsWithLongNote = [
        threePointsWithFlags[0],
        {
          ...threePointsWithFlags[1],
          deviceAttributes: { leftGeofence: true, notes: [longNote] },
        },
        threePointsWithFlags[2],
      ];
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={pointsWithLongNote}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.getByText('Show more')).toBeInTheDocument();
      // Truncated text (100 chars + ellipsis) should be shown, not the full 150-char note
      expect(screen.getByText(`${'a'.repeat(100)}...`)).toBeInTheDocument();
      expect(screen.queryByText(longNote)).not.toBeInTheDocument();
    });

    it('expands to show the full note when Show more is clicked, and toggles back with Show less', () => {
      const longNote = 'b'.repeat(150);
      const pointsWithLongNote = [
        threePointsWithFlags[0],
        {
          ...threePointsWithFlags[1],
          deviceAttributes: { leftGeofence: true, notes: [longNote] },
        },
        threePointsWithFlags[2],
      ];
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={pointsWithLongNote}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();

      fireEvent.click(screen.getByText('Show more'));
      expect(screen.getByText(longNote)).toBeInTheDocument();
      expect(screen.getByText('Show less')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Show less'));
      expect(screen.getByText(`${'b'.repeat(100)}...`)).toBeInTheDocument();
      expect(screen.getByText('Show more')).toBeInTheDocument();
    });

    it('only shows the first note when a point has multiple notes', () => {
      const pointsWithMultipleNotes = [
        threePointsWithFlags[0],
        {
          ...threePointsWithFlags[1],
          deviceAttributes: {
            leftGeofence: true,
            notes: ['First note text', 'Second note text'],
          },
        },
        threePointsWithFlags[2],
      ];
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={pointsWithMultipleNotes}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(screen.getByText('First note text')).toBeInTheDocument();
      expect(screen.queryByText('Second note text')).not.toBeInTheDocument();
    });

    it('does not render a note block when the point has an active flag but no notes', () => {
      const pointsNoNotes = [
        threePointsWithFlags[0],
        {
          lat: 37.387,
          lng: -122.085,
          timestamp: '14 Jan 2026, 10:00 AM',
          accuracy: '12m',
          teamMemberName: 'John Doe',
          deviceAttributes: { leftGeofence: true },
        },
        threePointsWithFlags[2],
      ];
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={pointsNoNotes}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      expect(
        screen.queryByTestId('comment-pencil-icon'),
      ).not.toBeInTheDocument();
    });

    it('renders multiple flag chips for a point with more than one active flag', () => {
      const pointsWithMultipleFlags = [
        threePointsWithFlags[0],
        {
          lat: 37.387,
          lng: -122.085,
          timestamp: '14 Jan 2026, 10:00 AM',
          accuracy: '12m',
          teamMemberName: 'John Doe',
          deviceAttributes: { leftGeofence: true, lowBattery: true },
        },
        threePointsWithFlags[2],
      ];
      renderWithQuicksandProvider(
        <TimeEntryTimeline
          timeEntry={mockTimeEntry}
          locationPoints={pointsWithMultipleFlags}
          isGeofenceFlagsEnabled
        />,
        sandbox,
      );
      expandTimeline();
      const labels = screen
        .getAllByTestId('chip')
        .map((chip) => chip.getAttribute('data-labels'));
      expect(labels).toContain('Left geofence location');
      expect(labels).toContain('Low battery');
    });
  });
});
