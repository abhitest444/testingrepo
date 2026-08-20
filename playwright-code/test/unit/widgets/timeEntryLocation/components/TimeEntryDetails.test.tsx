import React from 'react';
import { screen } from '@testing-library/react';
import TimeEntryDetails from 'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryDetails';
import { LocationPointData } from 'src/js/widgets/timeEntryLocation/components/types';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock child components
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryFilters',
  () => ({
    __esModule: true,
    default: ({ timeEntry, locationPoints }: any) => (
      <div data-testid="time-entry-filters">
        <span data-testid="filter-time-entry-id">
          {timeEntry?.id || 'no-entry'}
        </span>
        <span data-testid="filter-location-points-count">
          {locationPoints?.length || 0}
        </span>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryTimeline',
  () => ({
    __esModule: true,
    default: ({ timeEntry, locationPoints }: any) => (
      <div data-testid="time-entry-timeline">
        <span data-testid="timeline-time-entry-id">
          {timeEntry?.id || 'no-entry'}
        </span>
        <span data-testid="timeline-location-points-count">
          {locationPoints?.length || 0}
        </span>
      </div>
    ),
  }),
);

// Mock common styles
jest.mock(
  'src/js/widgets/timeEntryLocation/components/styles/common.styles',
  () => ({
    HorizontalDivider: () => <hr data-testid="horizontal-divider" />,
    smallScreen: (styles: string) => styles,
  }),
);

describe('TimeEntryDetails', () => {
  const sandbox = getDefaultSandbox();

  const mockLocationPoints: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:30 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
    },
  ];

  const mockTimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:30:00.000-08:00',
    endTime: '2026-01-14T10:30:00.000-08:00',
    duration: 3600,
    notes: 'Test notes',
    timeZone: 'America/Los_Angeles',
  } as unknown as TimeTracking_TimeEntry;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={mockLocationPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    expect(screen.getByTestId('time-entry-filters')).toBeInTheDocument();
    expect(screen.getByTestId('time-entry-timeline')).toBeInTheDocument();
  });

  it('should render TimeEntryFilters component', () => {
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={mockLocationPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    expect(screen.getByTestId('time-entry-filters')).toBeInTheDocument();
  });

  it('should render TimeEntryTimeline component', () => {
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={mockLocationPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    expect(screen.getByTestId('time-entry-timeline')).toBeInTheDocument();
  });

  it('should render horizontal divider between sections', () => {
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={mockLocationPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    expect(screen.getByTestId('horizontal-divider')).toBeInTheDocument();
  });

  it('should render with different location points', () => {
    const differentPoints = [
      {
        lat: 37.387,
        lng: -122.085,
        timestamp: '9:35 AM',
        accuracy: '12m',
        teamMemberName: 'Jane Smith',
      },
    ];
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={differentPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    expect(screen.getByTestId('time-entry-filters')).toBeInTheDocument();
  });

  it('should render Location points label above timeline', () => {
    renderWithQuicksandProvider(
      <TimeEntryDetails
        locationPoints={mockLocationPoints}
        timeEntry={mockTimeEntry}
      />,
      sandbox,
    );
    // NLS mock returns key-based text, so we look for the label containing the NLS key pattern
    expect(
      screen.getByText(/timeEntryLocation\.timeline\.locationPointsLabel/),
    ).toBeInTheDocument();
  });
});
