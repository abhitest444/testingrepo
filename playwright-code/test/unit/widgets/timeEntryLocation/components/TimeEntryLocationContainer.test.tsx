import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import TimeEntryLocationContainer from 'src/js/widgets/timeEntryLocation/components/TimeEntryLocationContainer';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock useTimeEntryLocationData hook
const mockUseTimeEntryLocationData = jest.fn();
jest.mock(
  'src/js/widgets/timeEntryLocation/hooks/useTimeEntryLocationData',
  () => ({
    useTimeEntryLocationData: (args: any) => mockUseTimeEntryLocationData(args),
  }),
);

// Mock useSameDayGeoEntries hook
const mockUseSameDayGeoEntries = jest.fn();
jest.mock(
  'src/js/widgets/timeEntryLocation/hooks/useSameDayGeoEntries',
  () => ({
    useSameDayGeoEntries: (args: any) => mockUseSameDayGeoEntries(args),
  }),
);

// Mock mapLocationPointsToDisplayData util
const mockMapLocationPointsToDisplayData = jest.fn();
jest.mock('src/js/widgets/timeEntryLocation/utils/locationPointUtils', () => ({
  mapLocationPointsToDisplayData: (points: any, timeEntry: any) =>
    mockMapLocationPointsToDisplayData(points, timeEntry),
}));

// Mock useGetUnifiedUserSettings hook
const mockLoadUnifiedUserSettings = jest.fn();
jest.mock(
  'src/js/service/hooks/userLevelSettings/useGetUnifiedUserSettings',
  () => ({
    useGetUnifiedUserSettings: (args: any) => {
      // Call onSuccess callback if provided in test
      if (args?.onSuccess && typeof args.onSuccess === 'function') {
        // Store the callback for test control
        (mockLoadUnifiedUserSettings as any).onSuccess = args.onSuccess;
      }
      return {
        loadUnifiedUserSettings: mockLoadUnifiedUserSettings,
        loading: false,
        error: null,
        data: null,
      };
    },
  }),
);

// Mock Trowser component
jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({
    children,
    open,
    onClose,
    title,
    cancelFooterButtonLabel,
    'data-testid': dataTestId,
  }: any) => (
    <div data-testid={dataTestId}>
      <div data-testid="trowser-title">{title}</div>
      <div data-testid="trowser-open">{open ? 'open' : 'closed'}</div>
      <button onClick={onClose} data-testid="trowser-cancel-button">
        {cancelFooterButtonLabel}
      </button>
      <div data-testid="trowser-content">{children}</div>
    </div>
  ),
}));

// Mock TimeEntryLocationContent
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryLocationMap/TimeEntryLocationContent',
  () => ({
    __esModule: true,
    default: ({
      locationPoints,
      timeEntry,
      locationSettings,
    }: {
      locationPoints: any[];
      timeEntry: any;
      locationSettings?: string | null;
    }) => (
      <div data-testid="time-entry-location-content">
        Content with {locationPoints?.length || 0} points
        {timeEntry && ` for ${timeEntry.id}`}
        {locationSettings && (
          <div data-testid="location-settings">{locationSettings}</div>
        )}
      </div>
    ),
  }),
);

// Mock TimeEntryDetails — exposes sameDayGeoEntryTimeRangesById and onSameDayTimeEntrySelect for assertions
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryDetails/TimeEntryDetails',
  () => ({
    __esModule: true,
    default: ({
      locationPoints,
      timeEntry,
      sameDayGeoEntryTimeRangesById,
      onSameDayTimeEntrySelect,
    }: {
      locationPoints: any[];
      timeEntry: any;
      sameDayGeoEntryTimeRangesById?: Record<string, string>;
      onSameDayTimeEntrySelect?: (id: string) => void;
    }) => (
      <div data-testid="time-entry-details">
        Details with {locationPoints?.length || 0} points
        {timeEntry && ` for ${timeEntry.id}`}
        {sameDayGeoEntryTimeRangesById && (
          <span data-testid="same-day-map">
            {JSON.stringify(sameDayGeoEntryTimeRangesById)}
          </span>
        )}
        {onSameDayTimeEntrySelect && (
          <button
            data-testid="same-day-select-btn"
            onClick={() => onSameDayTimeEntrySelect('entry-2')}
          >
            Switch
          </button>
        )}
      </div>
    ),
  }),
);

// Mock Activity loader
jest.mock('@ids-ts/loader', () => ({
  __esModule: true,
  Activity: ({ shape, size }: any) => (
    <div data-testid="activity-loader" data-shape={shape} data-size={size}>
      Loading...
    </div>
  ),
}));

// Mock TimeEntryLocationErrorState
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryLocationErrorState',
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="time-entry-location-error-state">Error State</div>
    ),
  }),
);

// Mock useTracking
const mockTrack = jest.fn();

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'timeEntryLocation.trowser.heading': 'Location tracking',
        'timeEntryLocation.trowser.cancel': 'Cancel',
        'timeEntryLocation.header.title': 'Location tracking',
        'timeEntryLocation.header.description': 'Real-time visibility',
        'timeEntryLocation.error.title': 'Something went wrong',
        'timeEntryLocation.error.message': 'Refresh the page to try again.',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
}));

// Mock @ids-ts/typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  H3: ({ children, weight }: any) => <h3 data-weight={weight}>{children}</h3>,
  B3: ({ children }: any) => <span>{children}</span>,
}));

describe('TimeEntryLocationContainer', () => {
  const mockOnClose = jest.fn();
  const sandbox = getDefaultSandbox();

  const mockTimeEntry = {
    id: '742291174',
    startTime: '2026-01-14T09:30:00.000-08:00',
    endTime: '2026-01-14T10:30:00.000-08:00',
    duration: 3600,
    notes: 'Test notes',
    timeZone: 'America/Los_Angeles',
    timeForType: 'EMPLOYEE',
    timeForContactDAS: {
      id: '400000021',
      displayName: 'John Doe',
      fullName: 'John Doe',
    },
    timeAgainstContactDAS: {
      project: null,
      customer: {
        id: '104',
        fullName: 'Test Customer',
        primaryAddress: {
          lines: '350 Fifth Avenue\nSuite 4200',
          city: 'New York',
          state: 'NY',
          postalCode: '10118',
          address: null,
        },
      },
    },
  };

  const mockApiLocationPoints = [
    {
      id: '111753208',
      longitude: -127.4203,
      latitude: 47.7769,
      createdAt: '2026-01-14T17:30:00.000Z',
      accuracy: 11.3,
      altitude: 202.8,
      deviceIdentifier: 'device-123',
    },
    {
      id: '111753210',
      longitude: -127.4208,
      latitude: 47.7775,
      createdAt: '2026-01-14T17:33:00.000Z',
      accuracy: 11.3,
      altitude: 202.8,
      deviceIdentifier: 'device-123',
    },
  ];

  const mockFormattedLocationPoints = [
    {
      lat: 47.7769,
      lng: -127.4203,
      timestamp: '9:30 AM',
      accuracy: '11m',
      deviceIdentifier: 'device-123',
      teamMemberName: 'John Doe',
    },
    {
      lat: 47.7775,
      lng: -127.4208,
      timestamp: '9:33 AM',
      accuracy: '11m',
      deviceIdentifier: 'device-123',
      teamMemberName: 'John Doe',
    },
  ];

  const defaultProps = {
    open: false,
    onClose: mockOnClose,
    timeEntryId: 'test-entry-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    mockLoadUnifiedUserSettings.mockClear();
    // Default mock implementation
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: false,
      timeEntry: mockTimeEntry,
      locationPoints: mockApiLocationPoints,
      error: null,
      refetch: jest.fn(),
    });
    mockMapLocationPointsToDisplayData.mockReturnValue(
      mockFormattedLocationPoints,
    );
    mockUseSameDayGeoEntries.mockReturnValue({
      sameDayGeoEntryTimeRangesById: {},
    });
  });

  const renderContainer = (overrides: Partial<typeof defaultProps> = {}) => {
    const props = { ...defaultProps, ...overrides };
    return renderWithQuicksandProvider(
      <TimeEntryLocationContainer
        open={props.open}
        onClose={props.onClose}
        timeEntryId={props.timeEntryId}
        traceHeaders={{}}
      />,
      sandbox,
    );
  };

  it('should render Trowser', () => {
    renderContainer();
    expect(
      screen.getByTestId('time-entry-location-container'),
    ).toBeInTheDocument();
  });

  it('should render with open=true', () => {
    renderContainer({ open: true });
    expect(screen.getByTestId('trowser-open')).toHaveTextContent('open');
  });

  it('should display title from NLS', () => {
    renderContainer();
    expect(screen.getByTestId('trowser-title')).toHaveTextContent(
      'Location tracking',
    );
  });

  it('should display cancel button label from NLS', () => {
    renderContainer();
    expect(screen.getByTestId('trowser-cancel-button')).toHaveTextContent(
      'Cancel',
    );
  });

  it('should call useTimeEntryLocationData with correct timeEntryId', () => {
    renderContainer({ timeEntryId: 'entry-456' });
    expect(mockUseTimeEntryLocationData).toHaveBeenCalledWith(
      expect.objectContaining({
        timeEntryId: 'entry-456',
      }),
    );
  });

  it('should show loading state when data is loading', () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: true,
      timeEntry: null,
      locationPoints: [],
      error: null,
      refetch: jest.fn(),
    });

    renderContainer({ open: true });
    expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    expect(screen.getByTestId('activity-loader')).toHaveAttribute(
      'data-shape',
      'dots',
    );
    expect(screen.getByTestId('activity-loader')).toHaveAttribute(
      'data-size',
      'large',
    );
  });

  it('should render content when not loading', async () => {
    renderContainer({ open: true });
    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-content'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('time-entry-details')).toBeInTheDocument();
  });

  it('should call mapLocationPointsToDisplayData with correct arguments', () => {
    renderContainer();
    expect(mockMapLocationPointsToDisplayData).toHaveBeenCalledWith(
      mockApiLocationPoints,
      mockTimeEntry,
    );
  });

  it('should pass formatted location points to TimeEntryLocationContent', async () => {
    renderContainer({ open: true });
    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-content'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Content with 2 points/)).toBeInTheDocument();
  });

  it('should pass formatted location points and timeEntry to TimeEntryDetails', async () => {
    renderContainer({ open: true });
    await waitFor(() => {
      expect(screen.getByTestId('time-entry-details')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Details with 2 points for 742291174/),
    ).toBeInTheDocument();
  });

  it('should render header section with title and description', async () => {
    renderContainer({ open: true });
    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-content'),
      ).toBeInTheDocument();
    });
    // Check that header title appears (there are multiple instances, so use getAllByText)
    const titles = screen.getAllByText('Location tracking');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText('Real-time visibility')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    renderContainer({ open: true });
    fireEvent.click(screen.getByTestId('trowser-cancel-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle empty location points', async () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: false,
      timeEntry: mockTimeEntry,
      locationPoints: [],
      error: null,
      refetch: jest.fn(),
    });
    mockMapLocationPointsToDisplayData.mockReturnValue([]);

    renderContainer({ open: true });
    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-content'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Content with 0 points/)).toBeInTheDocument();
  });

  it('should handle null timeEntry', async () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: false,
      timeEntry: null,
      locationPoints: mockApiLocationPoints,
      error: null,
      refetch: jest.fn(),
    });
    mockMapLocationPointsToDisplayData.mockReturnValue(
      mockFormattedLocationPoints,
    );

    renderContainer({ open: true });
    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-content'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Content with 2 points/)).toBeInTheDocument();
  });

  it('should show error state when error occurs', () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: false,
      timeEntry: null,
      locationPoints: [],
      error: new Error('Failed to fetch data'),
      refetch: jest.fn(),
    });

    renderContainer({ open: true });
    expect(
      screen.getByTestId('time-entry-location-error-state'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('time-entry-location-content'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('activity-loader')).not.toBeInTheDocument();
  });

  it('should not show error state when loading', () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: true,
      timeEntry: null,
      locationPoints: [],
      error: null,
      refetch: jest.fn(),
    });

    renderContainer({ open: true });
    expect(screen.getByTestId('activity-loader')).toBeInTheDocument();
    expect(
      screen.queryByTestId('time-entry-location-error-state'),
    ).not.toBeInTheDocument();
  });

  it('should show error state instead of content when error exists', () => {
    mockUseTimeEntryLocationData.mockReturnValue({
      loading: false,
      timeEntry: mockTimeEntry,
      locationPoints: mockApiLocationPoints,
      error: new Error('Network error'),
      refetch: jest.fn(),
    });

    renderContainer({ open: true });
    expect(
      screen.getByTestId('time-entry-location-error-state'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('time-entry-location-content'),
    ).not.toBeInTheDocument();
  });

  describe('tracking events', () => {
    it('should track VIEW_LOCATION_MAP when widget is opened successfully', async () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderContainer({ open: true });
      await waitFor(() => {
        expect(
          screen.getByTestId('time-entry-location-content'),
        ).toBeInTheDocument();
      });

      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.VIEW_LOCATION_MAP,
      );
    });

    it('should track SOMETHING_WENT_WRONG_VIEWED when error occurs', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      mockUseTimeEntryLocationData.mockReturnValue({
        loading: false,
        timeEntry: null,
        locationPoints: [],
        error: new Error('Failed to fetch data'),
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.SOMETHING_WENT_WRONG_VIEWED,
      );
    });

    it('should track CLOSE when cancel button is clicked', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderContainer({ open: true });
      mockTrack.mockClear();

      fireEvent.click(screen.getByTestId('trowser-cancel-button'));

      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.CLOSE,
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not track VIEW_LOCATION_MAP when widget is closed', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      mockTrack.mockClear();
      renderContainer({ open: false });

      expect(mockTrack).not.toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.VIEW_LOCATION_MAP,
      );
    });

    it('should not track VIEW_LOCATION_MAP when still loading', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      mockUseTimeEntryLocationData.mockReturnValue({
        loading: true,
        timeEntry: null,
        locationPoints: [],
        error: null,
        refetch: jest.fn(),
      });

      mockTrack.mockClear();
      renderContainer({ open: true });

      expect(mockTrack).not.toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.VIEW_LOCATION_MAP,
      );
    });
  });

  describe('unified user settings', () => {
    it('should fetch unified user settings when timeEntry has workerId and timeForType', async () => {
      renderContainer({ open: true });

      await waitFor(() => {
        expect(mockLoadUnifiedUserSettings).toHaveBeenCalledWith({
          settingsFor: {
            id: '400000021',
            timeForType: 'EMPLOYEE',
          },
        });
      });
    });

    it('should not fetch unified user settings when timeEntry is null', () => {
      mockUseTimeEntryLocationData.mockReturnValue({
        loading: false,
        timeEntry: null,
        locationPoints: [],
        error: null,
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      expect(mockLoadUnifiedUserSettings).not.toHaveBeenCalled();
    });

    it('should not fetch unified user settings when workerId is missing', () => {
      const timeEntryWithoutWorkerId = {
        ...mockTimeEntry,
        timeForContactDAS: null,
      };

      mockUseTimeEntryLocationData.mockReturnValue({
        loading: false,
        timeEntry: timeEntryWithoutWorkerId,
        locationPoints: mockApiLocationPoints,
        error: null,
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      expect(mockLoadUnifiedUserSettings).not.toHaveBeenCalled();
    });

    it('should not fetch unified user settings when timeForType is missing', () => {
      const timeEntryWithoutTimeForType = {
        ...mockTimeEntry,
        timeForType: undefined,
      };

      mockUseTimeEntryLocationData.mockReturnValue({
        loading: false,
        timeEntry: timeEntryWithoutTimeForType,
        locationPoints: mockApiLocationPoints,
        error: null,
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      expect(mockLoadUnifiedUserSettings).not.toHaveBeenCalled();
    });

    it('should pass locationSettings to TimeEntryLocationContent when settings are loaded', async () => {
      renderContainer({ open: true });

      // Simulate successful settings fetch
      const { onSuccess } = mockLoadUnifiedUserSettings as any;
      if (onSuccess) {
        onSuccess({
          timeTrackingUnifiedUserSettings: {
            locationTracking: {
              effectiveValue: 'REQUIRED',
            },
          },
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('location-settings')).toHaveTextContent(
          'REQUIRED',
        );
      });
    });

    it('should handle null locationSettings gracefully', async () => {
      renderContainer({ open: true });

      await waitFor(() => {
        expect(
          screen.getByTestId('time-entry-location-content'),
        ).toBeInTheDocument();
      });

      // Should not have location-settings element when settings are null
      expect(screen.queryByTestId('location-settings')).not.toBeInTheDocument();
    });

    it('should fetch settings with correct parameters for different worker', async () => {
      const newTimeEntry = {
        ...mockTimeEntry,
        timeForContactDAS: {
          id: '400000022',
          displayName: 'Jane Doe',
          fullName: 'Jane Doe',
        },
      };

      mockUseTimeEntryLocationData.mockReturnValue({
        loading: false,
        timeEntry: newTimeEntry,
        locationPoints: mockApiLocationPoints,
        error: null,
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      await waitFor(() => {
        expect(mockLoadUnifiedUserSettings).toHaveBeenCalledWith({
          settingsFor: {
            id: '400000022',
            timeForType: 'EMPLOYEE',
          },
        });
      });
    });
  });

  describe('same-day geo entries wiring', () => {
    it('passes sameDayGeoEntryTimeRangesById from hook to TimeEntryDetails', async () => {
      const map = {
        'entry-1': '9:30 AM - 10:45 AM',
        'entry-2': '11:00 AM - 12:00 PM',
      };
      mockUseSameDayGeoEntries.mockReturnValue({
        sameDayGeoEntryTimeRangesById: map,
      });

      renderContainer({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('same-day-map')).toHaveTextContent(
          JSON.stringify(map),
        );
      });
    });

    it('passes the original timeEntryId (not activeTimeEntryId) to useSameDayGeoEntries', () => {
      renderContainer({ timeEntryId: 'original-entry' });

      expect(mockUseSameDayGeoEntries).toHaveBeenCalledWith(
        expect.objectContaining({ timeEntryId: 'original-entry' }),
      );
    });

    it('passes loading state to useSameDayGeoEntries', () => {
      mockUseTimeEntryLocationData.mockReturnValue({
        loading: true,
        timeEntry: null,
        locationPoints: [],
        error: null,
        refetch: jest.fn(),
      });

      renderContainer({ open: true });

      expect(mockUseSameDayGeoEntries).toHaveBeenCalledWith(
        expect.objectContaining({ loading: true }),
      );
    });

    it('updating activeTimeEntryId via dropdown callback does not change timeEntryId passed to useSameDayGeoEntries', async () => {
      mockUseSameDayGeoEntries.mockReturnValue({
        sameDayGeoEntryTimeRangesById: {
          'entry-1': '9:30 AM - 10:45 AM',
          'entry-2': '11:00 AM - 12:00 PM',
        },
      });

      renderContainer({ open: true, timeEntryId: 'entry-1' });

      await waitFor(() => {
        expect(screen.getByTestId('same-day-select-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('same-day-select-btn'));

      // timeEntryId passed to the hook is always the original prop — never 'entry-2'
      const { calls } = mockUseSameDayGeoEntries.mock;
      calls.forEach((call: any[]) => {
        expect(call[0].timeEntryId).toBe('entry-1');
      });
    });
  });

  describe('Coverage gaps', () => {
    // setLocationSettings(effectiveValue || null) — the || null path
    // when onSuccess is called with data that has no effectiveValue
    it('should set locationSettings to null when effectiveValue is absent in onSuccess data (lines 74-76)', async () => {
      renderContainer({ open: true });

      // Trigger onSuccess with data that has no effectiveValue
      const { onSuccess } = mockLoadUnifiedUserSettings as any;
      if (onSuccess) {
        onSuccess({
          timeTrackingUnifiedUserSettings: {
            locationTracking: {
              effectiveValue: null,
            },
          },
        });
      }

      await waitFor(() => {
        // When effectiveValue is null, locationSettings is set to null and
        // the location-settings testid should NOT appear
        expect(
          screen.queryByTestId('location-settings'),
        ).not.toBeInTheDocument();
      });
    });

    it('should set locationSettings to null when onSuccess data has no locationTracking (lines 74-76)', async () => {
      renderContainer({ open: true });

      const { onSuccess } = mockLoadUnifiedUserSettings as any;
      if (onSuccess) {
        onSuccess({
          timeTrackingUnifiedUserSettings: null,
        });
      }

      await waitFor(() => {
        expect(
          screen.queryByTestId('location-settings'),
        ).not.toBeInTheDocument();
      });
    });

    it('should set locationSettings to null when locationTracking is undefined (line 74 branch)', async () => {
      renderContainer({ open: true });

      const { onSuccess } = mockLoadUnifiedUserSettings as any;
      if (onSuccess) {
        act(() => {
          onSuccess({
            timeTrackingUnifiedUserSettings: {
              locationTracking: undefined,
            },
          });
        });
      }

      await waitFor(() => {
        expect(
          screen.queryByTestId('location-settings'),
        ).not.toBeInTheDocument();
      });
    });

    it('should set locationSettings to null when onSuccess called with undefined data (line 74 data?. branch)', async () => {
      renderContainer({ open: true });

      const { onSuccess } = mockLoadUnifiedUserSettings as any;
      if (onSuccess) {
        act(() => {
          onSuccess(undefined);
        });
      }

      await waitFor(() => {
        expect(
          screen.queryByTestId('location-settings'),
        ).not.toBeInTheDocument();
      });
    });
  });
});
