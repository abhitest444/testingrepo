import React from 'react';
import { screen, within, fireEvent } from '@testing-library/react';
import TimeEntryFilters from 'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryFilters';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import { LocationPointData } from 'src/js/widgets/timeEntryLocation/components/types';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'timeEntryLocation.filters.teamMember': 'Team member',
        'timeEntryLocation.filters.timeEntries': 'Time entries',
        'timeEntryLocation.filters.timeEntries.selectPlaceholder':
          'Select a time',
        'timeEntryLocation.now': 'Now',
        'timeEntryLocation.filters.customerProject': 'Customer/Project',
        'timeEntryLocation.filters.totalHours': 'Total hours',
        'timeEntryLocation.filters.address': 'Address',
        'timeEntryLocation.filters.notes': 'Notes',
        'timeEntryLocation.filters.timesheetFlags': 'Timesheet flags',
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

// Mock @ids-ts/dropdown
jest.mock('@ids-ts/dropdown', () => ({
  __esModule: true,
  Dropdown: ({
    label,
    value,
    onChange,
    children,
    'data-testid': testId,
  }: any) => (
    <div data-testid={testId || 'dropdown'} data-value={value}>
      <span data-testid="dropdown-label">{label}</span>
      <select
        data-testid="dropdown-select"
        value={value}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
      >
        {children}
      </select>
    </div>
  ),
  MenuItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

// Mock @ids-ts/text-field
jest.mock('@ids-ts/text-field', () => ({
  __esModule: true,
  default: ({ label, value, readOnly, size, width }: any) => (
    <div
      data-testid={`text-field-${label?.replace(/\s+/g, '-').toLowerCase()}`}
      data-readonly={readOnly}
      data-size={size}
    >
      <span data-testid="text-field-label">{label}</span>
      <span data-testid="text-field-value">{value || ''}</span>
    </div>
  ),
}));

// Mock utility functions
jest.mock('src/js/widgets/timeEntryLocation/utils/locationPointUtils', () => ({
  ...jest.requireActual(
    'src/js/widgets/timeEntryLocation/utils/locationPointUtils',
  ),
  getTeamMemberInfo: jest.fn((timeEntry) => {
    if (!timeEntry?.timeForContactDAS) {
      return { name: '', id: undefined };
    }
    const contact = timeEntry.timeForContactDAS as any;
    return {
      name: contact.displayName || contact.fullName || '',
      id: contact.id,
    };
  }),
  getTimeEntryRange: jest.fn((timeEntry) => {
    if (!timeEntry?.startTime || !timeEntry?.endTime) return '';
    // Mock formatTimeEntryTimestamp to return formatted times
    const formatTime = (timestamp: string | null | undefined) => {
      if (!timestamp) return '';
      if (timestamp === '2026-01-14T09:00:00.000-08:00') return '9:00 AM';
      if (timestamp === '2026-01-14T17:00:00.000-08:00') return '5:00 PM';
      if (timestamp === '2026-01-14T09:30:00.000-08:00') return '9:30 AM';
      if (timestamp === '2026-01-14T10:30:00.000-08:00') return '10:30 AM';
      return timestamp;
    };
    const startTime = formatTime(timeEntry.startTime);
    const endTime = formatTime(timeEntry.endTime);
    if (!startTime || !endTime) return '';
    return `${startTime} - ${endTime}`;
  }),
  getTotalHoursFromLocationPoints: jest.fn((timeEntry) => {
    if (!timeEntry?.duration) return '';
    const hours = Math.floor(timeEntry.duration / 3600);
    const minutes = Math.floor((timeEntry.duration % 3600) / 60);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return '';
  }),
  getFormattedAddress: jest.fn((timeEntry) => {
    if (!timeEntry?.timeAgainstContactDAS) return '';
    const timeAgainst = timeEntry.timeAgainstContactDAS as any;
    const contact = timeAgainst.project || timeAgainst.customer;
    if (!contact?.primaryAddress) return '';
    const { lines, city, state, postalCode } = contact.primaryAddress;
    const parts = [lines, city, state, postalCode]
      .filter((p) => p)
      .map((p) => String(p).replace(/\n/g, ' ').trim())
      .filter((p) => p.length > 0);
    return parts.join(', ');
  }),
  getCustomerInfo: jest.fn((timeEntry) => {
    if (!timeEntry?.timeAgainstContactDAS) {
      return { name: '', id: undefined };
    }
    const timeAgainst = timeEntry.timeAgainstContactDAS as any;
    const contact = timeAgainst.project || timeAgainst.customer;
    if (!contact) {
      return { name: '', id: undefined };
    }
    return {
      name: contact.displayName || contact.fullName || '',
      id: contact.id,
    };
  }),
}));

// Mock common styles
jest.mock(
  'src/js/widgets/timeEntryLocation/components/styles/common.styles',
  () => ({
    HorizontalDivider: () => <hr data-testid="horizontal-divider" />,
  }),
);

describe('TimeEntryFilters', () => {
  const sandbox = getDefaultSandbox();

  const mockLocationPoints: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:00 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '5:00 PM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
    },
  ];

  const mockTimeEntry: TimeTracking_TimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:00:00.000-08:00',
    endTime: '2026-01-14T17:00:00.000-08:00',
    duration: 28800, // 8 hours
    timeZone: 'America/Los_Angeles',
    timeForContactDAS: {
      id: '400000021',
      displayName: 'John Doe',
      fullName: 'John Doe',
    } as any,
    timeAgainstContactDAS: {
      project: null,
      customer: {
        id: '104',
        fullName: 'Test Customer',
        primaryAddress: {
          lines: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
        } as any,
      } as any,
    } as any,
  } as unknown as TimeTracking_TimeEntry;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderFilters = (
    overrides: Partial<{
      timeEntry: TimeTracking_TimeEntry | null;
      locationPoints: LocationPointData[];
      isGeofenceFlagsEnabled: boolean;
    }> = {},
  ) => {
    const props = {
      timeEntry: mockTimeEntry,
      locationPoints: mockLocationPoints,
      ...overrides,
    };
    return renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={props.timeEntry}
        locationPoints={props.locationPoints}
        isGeofenceFlagsEnabled={props.isGeofenceFlagsEnabled}
      />,
      sandbox,
    );
  };

  it('should render without crashing', () => {
    renderFilters();
    expect(screen.getByText('Team member')).toBeInTheDocument();
  });

  it('should render team member text field', () => {
    renderFilters();
    expect(screen.getByTestId('text-field-team-member')).toBeInTheDocument();
    expect(screen.getByText('Team member')).toBeInTheDocument();
  });

  it('should render time entries text field', () => {
    renderFilters();
    expect(screen.getByTestId('text-field-time-entries')).toBeInTheDocument();
    expect(screen.getByText('Time entries')).toBeInTheDocument();
  });

  it('should render customer/project text field', () => {
    renderFilters();
    expect(
      screen.getByTestId('text-field-customer/project'),
    ).toBeInTheDocument();
    expect(screen.getByText('Customer/Project')).toBeInTheDocument();
  });

  it('should render total hours text field', () => {
    renderFilters();
    expect(screen.getByTestId('text-field-total-hours')).toBeInTheDocument();
    expect(screen.getByText('Total hours')).toBeInTheDocument();
  });

  it('should render address text field', () => {
    renderFilters();
    expect(screen.getByTestId('text-field-address')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
  });

  it('should render with null timeEntry', () => {
    renderFilters({ timeEntry: null });
    expect(screen.getByText('Team member')).toBeInTheDocument();
  });

  it('should render with empty location points', () => {
    renderFilters({ locationPoints: [] });
    expect(screen.getByText('Team member')).toBeInTheDocument();
  });

  it('should render horizontal dividers between filter rows', () => {
    renderFilters();
    const dividers = screen.getAllByTestId('horizontal-divider');
    expect(dividers.length).toBeGreaterThan(0);
  });

  it('should display computed team member name', () => {
    renderFilters();
    const textField = screen.getByTestId('text-field-team-member');
    expect(textField).toHaveAttribute('data-readonly', 'true');
    expect(within(textField).getByTestId('text-field-value')).toHaveTextContent(
      'John Doe',
    );
  });

  it('should display computed time entry range', () => {
    renderFilters();
    const timeEntriesField = screen.getByTestId('text-field-time-entries');
    expect(
      within(timeEntriesField).getByTestId('text-field-value'),
    ).toHaveTextContent('9:00 AM - 5:00 PM');
  });

  it('should display computed total hours', () => {
    renderFilters();
    const totalHoursField = screen.getByTestId('text-field-total-hours');
    expect(
      within(totalHoursField).getByTestId('text-field-value'),
    ).toHaveTextContent('8h');
  });

  it('should display formatted address when available', () => {
    renderFilters();
    const addressField = screen.getByTestId('text-field-address');
    expect(addressField).toBeInTheDocument();
    expect(
      within(addressField).getByTestId('text-field-value'),
    ).toHaveTextContent('123 Main St, San Francisco, CA, 94102');
  });

  it('should not render address text field when address is empty', () => {
    const timeEntryWithoutAddress = {
      ...mockTimeEntry,
      timeAgainstContactDAS: {
        customer: {
          id: '104',
          primaryAddress: null,
        },
      },
    } as unknown as TimeTracking_TimeEntry;

    renderFilters({ timeEntry: timeEntryWithoutAddress });
    expect(screen.queryByTestId('text-field-address')).not.toBeInTheDocument();
  });

  it('should render notes text field', () => {
    const timeEntryWithNotes = {
      ...mockTimeEntry,
      notes: 'Test notes content',
    } as unknown as TimeTracking_TimeEntry;

    renderFilters({ timeEntry: timeEntryWithNotes });
    const notesField = screen.getByTestId('text-field-notes');
    expect(notesField).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(
      within(notesField).getByTestId('text-field-value'),
    ).toHaveTextContent('Test notes content');
  });

  it('should not render notes text field when notes are not present', () => {
    renderFilters();
    expect(screen.queryByTestId('text-field-notes')).not.toBeInTheDocument();
  });

  it('should render notes text field as read-only when notes exist', () => {
    const timeEntryWithNotes = {
      ...mockTimeEntry,
      notes: 'Test notes content',
    } as unknown as TimeTracking_TimeEntry;

    renderFilters({ timeEntry: timeEntryWithNotes });
    const notesField = screen.getByTestId('text-field-notes');
    expect(notesField).toHaveAttribute('data-readonly', 'true');
  });
});

describe('TimeEntryFilters — same-day dropdown', () => {
  const sandbox = getDefaultSandbox();

  const mockLocationPoints: LocationPointData[] = [];

  const mockTimeEntry: TimeTracking_TimeEntry = {
    id: 'entry-1',
    startTime: '2026-01-14T17:30:00.000Z',
    endTime: '2026-01-14T18:45:00.000Z',
    timeZone: 'America/Los_Angeles',
  } as unknown as TimeTracking_TimeEntry;

  const sameDayGeoEntryTimeRangesById = {
    'entry-1': '9:30 AM - 10:45 AM',
    'entry-2': '11:00 AM - 12:00 PM',
  };

  const renderWithDropdown = (
    overrides: {
      timeEntry?: TimeTracking_TimeEntry | null;
      sameDayGeoEntryTimeRangesById?: Record<string, string>;
      onSameDayTimeEntrySelect?: jest.Mock;
    } = {},
  ) => {
    const onSelect = overrides.onSameDayTimeEntrySelect ?? jest.fn();
    return renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={overrides.timeEntry ?? mockTimeEntry}
        locationPoints={mockLocationPoints}
        sameDayGeoEntryTimeRangesById={
          overrides.sameDayGeoEntryTimeRangesById ??
          sameDayGeoEntryTimeRangesById
        }
        onSameDayTimeEntrySelect={onSelect}
      />,
      sandbox,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a dropdown instead of read-only field when multiple same-day geo entries exist', () => {
    renderWithDropdown();
    expect(
      screen.getByTestId('time-entry-location-time-dropdown'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('text-field-time-entries'),
    ).not.toBeInTheDocument();
  });

  it('renders a read-only text field when only one same-day geo entry exists', () => {
    renderWithDropdown({
      sameDayGeoEntryTimeRangesById: { 'entry-1': '9:30 AM - 10:45 AM' },
    });
    expect(
      screen.queryByTestId('time-entry-location-time-dropdown'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('text-field-time-entries')).toBeInTheDocument();
  });

  it('renders a read-only text field when sameDayGeoEntryTimeRangesById is empty', () => {
    renderWithDropdown({ sameDayGeoEntryTimeRangesById: {} });
    expect(
      screen.queryByTestId('time-entry-location-time-dropdown'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('text-field-time-entries')).toBeInTheDocument();
  });

  it('renders a read-only text field when onSameDayTimeEntrySelect is not provided', () => {
    renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={mockTimeEntry}
        locationPoints={mockLocationPoints}
        sameDayGeoEntryTimeRangesById={sameDayGeoEntryTimeRangesById}
      />,
      sandbox,
    );
    expect(
      screen.queryByTestId('time-entry-location-time-dropdown'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('text-field-time-entries')).toBeInTheDocument();
  });

  it('pre-selects the currently viewed entry in the dropdown', () => {
    renderWithDropdown();
    const dropdown = screen.getByTestId('time-entry-location-time-dropdown');
    expect(dropdown).toHaveAttribute('data-value', 'entry-1');
  });

  it('dropdown has empty selectedId when current entry is not in the map', () => {
    renderWithDropdown({
      timeEntry: { ...mockTimeEntry, id: 'entry-99' } as TimeTracking_TimeEntry,
    });
    const dropdown = screen.getByTestId('time-entry-location-time-dropdown');
    expect(dropdown).toHaveAttribute('data-value', '');
  });

  it('renders all same-day geo options as dropdown items', () => {
    renderWithDropdown();
    expect(screen.getByText('9:30 AM - 10:45 AM')).toBeInTheDocument();
    expect(screen.getByText('11:00 AM - 12:00 PM')).toBeInTheDocument();
  });

  it('calls onSameDayTimeEntrySelect with the selected entry id on change', () => {
    const onSelect = jest.fn();
    renderWithDropdown({ onSameDayTimeEntrySelect: onSelect });

    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: 'entry-2' },
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('entry-2');
  });
});

describe('TimeEntryFilters — Timesheet flags (SBSEG-QBO-geofence-flags)', () => {
  const sandbox = getDefaultSandbox();

  const mockTimeEntry: TimeTracking_TimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:00:00.000-08:00',
    endTime: '2026-01-14T17:00:00.000-08:00',
    duration: 28800,
    timeZone: 'America/Los_Angeles',
    timeForContactDAS: {
      id: '400000021',
      displayName: 'John Doe',
      fullName: 'John Doe',
    } as any,
  } as unknown as TimeTracking_TimeEntry;

  const flaggedLocationPoints: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:00 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: true },
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '5:00 PM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
      deviceAttributes: { leftGeofence: true },
    },
  ];

  const unflaggedLocationPoints: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:00 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: false },
    },
  ];

  const renderFilters = (
    overrides: Partial<{
      locationPoints: LocationPointData[];
      isGeofenceFlagsEnabled: boolean;
    }> = {},
  ) =>
    renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={mockTimeEntry}
        locationPoints={overrides.locationPoints ?? flaggedLocationPoints}
        isGeofenceFlagsEnabled={overrides.isGeofenceFlagsEnabled}
      />,
      sandbox,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render the Timesheet flags row when the feature flag is off, even if points have active flags', () => {
    renderFilters({ isGeofenceFlagsEnabled: false });
    expect(screen.queryByText('Timesheet flags')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
  });

  it('does not render the Timesheet flags row when isGeofenceFlagsEnabled is not provided (default off)', () => {
    renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={mockTimeEntry}
        locationPoints={flaggedLocationPoints}
      />,
      sandbox,
    );
    expect(screen.queryByText('Timesheet flags')).not.toBeInTheDocument();
  });

  it('does not render the Timesheet flags row when the flag is on but no points have active flags', () => {
    renderFilters({
      isGeofenceFlagsEnabled: true,
      locationPoints: unflaggedLocationPoints,
    });
    expect(screen.queryByText('Timesheet flags')).not.toBeInTheDocument();
  });

  it('does not render the Timesheet flags row when the flag is on but locationPoints is empty', () => {
    renderFilters({ isGeofenceFlagsEnabled: true, locationPoints: [] });
    expect(screen.queryByText('Timesheet flags')).not.toBeInTheDocument();
  });

  it('renders the Timesheet flags row when the feature flag is on and points have active flags', () => {
    renderFilters({ isGeofenceFlagsEnabled: true });
    expect(screen.getByText('Timesheet flags')).toBeInTheDocument();
  });

  it('renders one chip per distinct active flag across all points, in fixed order', () => {
    renderFilters({ isGeofenceFlagsEnabled: true });
    const chips = screen.getAllByTestId('chip');
    // leftGeofence (from point 2) should render before mockedLocation (from point 1) - fixed order
    expect(chips).toHaveLength(2);
    expect(chips[0]).toHaveAttribute('data-labels', 'Left geofence location');
    expect(chips[1]).toHaveAttribute('data-labels', 'Mocked location');
  });

  it('renders chips as non-dismissible', () => {
    renderFilters({ isGeofenceFlagsEnabled: true });
    const chips = screen.getAllByTestId('chip');
    chips.forEach((chip) => {
      expect(chip).toHaveAttribute('data-dismissible', 'false');
    });
  });

  it('dedupes the same flag appearing on multiple points into a single chip', () => {
    const duplicateFlagPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '10:00 AM',
        accuracy: '12m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: true },
      },
    ];
    renderFilters({
      isGeofenceFlagsEnabled: true,
      locationPoints: duplicateFlagPoints,
    });
    expect(screen.getAllByTestId('chip')).toHaveLength(1);
  });

  it('renders all six flag chips in fixed order when every flag is active across points', () => {
    const allFlagsPoints: LocationPointData[] = [
      {
        lat: 37.386,
        lng: -122.084,
        timestamp: '9:00 AM',
        accuracy: '15m',
        teamMemberName: 'John Doe',
        deviceAttributes: {
          leftGeofence: true,
          loggedOutOnClock: true,
          locationNotShared: true,
          lowBattery: true,
          batterySaverEnabled: true,
          mockedLocation: true,
        },
      },
    ];
    renderFilters({
      isGeofenceFlagsEnabled: true,
      locationPoints: allFlagsPoints,
    });
    const chips = screen.getAllByTestId('chip');
    expect(chips).toHaveLength(6);
    expect(chips.map((chip) => chip.getAttribute('data-labels'))).toEqual([
      'Left geofence location',
      'Logged out on clock',
      'Location not shared',
      'Low battery',
      'Battery saver enabled',
      'Mocked location',
    ]);
  });

  it('places the Timesheet flags row after the Notes row', () => {
    const timeEntryWithNotes = {
      ...mockTimeEntry,
      notes: 'Some notes',
    } as unknown as TimeTracking_TimeEntry;
    renderWithQuicksandProvider(
      <TimeEntryFilters
        timeEntry={timeEntryWithNotes}
        locationPoints={flaggedLocationPoints}
        isGeofenceFlagsEnabled
      />,
      sandbox,
    );
    const notesIndex = screen
      .getByText('Notes')
      .compareDocumentPosition(screen.getByText('Timesheet flags'));
    // Node.DOCUMENT_POSITION_FOLLOWING = 4: "Timesheet flags" comes after "Notes" in the DOM
    // eslint-disable-next-line no-bitwise
    expect(notesIndex & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
