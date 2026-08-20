import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationPointPopover from 'src/js/widgets/timeEntryLocation/components/TimeEntryLocationMap/LocationPointPopover';
import { LocationPointData } from 'src/js/widgets/timeEntryLocation/components/types';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';

// Mock @ids-ts/popover
jest.mock('@ids-ts/popover', () => ({
  __esModule: true,
  Popover: ({ children, open, onClose }: any) =>
    open ? (
      <div data-testid="popover">
        <button data-testid="popover-close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverHeader: ({ title }: any) => (
    <div data-testid="popover-header">{title || '\u00A0'}</div>
  ),
}));

// Mock @ids-ts/typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  B3: ({ children, weight }: any) => (
    <span data-testid={weight ? `b3-${weight}` : 'b3'}>{children}</span>
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

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'timeEntryLocation.popover.time': 'Time',
        'timeEntryLocation.popover.accuracy': 'Accuracy',
        'timeEntryLocation.popover.flag': 'Flag',
        'timeEntryLocation.popover.locationSettings': 'Location settings',
        'timeEntryLocation.popover.locationSettings.required': 'Required',
        'timeEntryLocation.popover.locationSettings.optional': 'Optional',
        'timeEntryLocation.popover.locationSettings.off': 'Off',
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

describe('LocationPointPopover', () => {
  const mockOnClose = jest.fn();
  const mockTargetElement = document.createElement('div');

  const defaultPoint: LocationPointData = {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: '10:30 AM',
    teamMemberName: 'John Doe',
    accuracy: '5m',
  };

  const renderPopover = (
    overrides: {
      point?: LocationPointData | null;
      isOpen?: boolean;
      onClose?: () => void;
      targetElement?: HTMLElement | null;
      locationSettings?: TimeTracking_LocationTrackingType | null;
    } = {},
  ) => {
    const props = {
      point: overrides.point !== undefined ? overrides.point : defaultPoint,
      isOpen: overrides.isOpen !== undefined ? overrides.isOpen : true,
      onClose: overrides.onClose || mockOnClose,
      targetElement: overrides.targetElement || mockTargetElement,
      locationSettings: overrides.locationSettings,
    };
    return render(
      <LocationPointPopover
        point={props.point}
        isOpen={props.isOpen}
        onClose={props.onClose}
        targetElement={props.targetElement}
        locationSettings={props.locationSettings}
      />,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when point is null', () => {
    const { container } = renderPopover({ point: null });
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when isOpen is false', () => {
    renderPopover({ isOpen: false });
    expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
  });

  it('should render popover when isOpen is true', () => {
    renderPopover();
    expect(screen.getByTestId('popover')).toBeInTheDocument();
  });

  it('should display team member name in header', () => {
    renderPopover();
    expect(screen.getByTestId('popover-header')).toHaveTextContent('John Doe');
  });

  it('should display empty string when teamMemberName is null', () => {
    const pointWithoutName = { ...defaultPoint, teamMemberName: null };
    renderPopover({ point: pointWithoutName });
    // Header should maintain height with non-breaking space
    expect(screen.getByTestId('popover-header')).toBeInTheDocument();
  });

  it('should display Time label', () => {
    renderPopover();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should display Time value', () => {
    renderPopover();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });

  it('should display Accuracy label', () => {
    renderPopover();
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
  });

  it('should display Accuracy value', () => {
    renderPopover();
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('should display N/A when accuracy is null', () => {
    const pointWithoutAccuracy = { ...defaultPoint, accuracy: null };
    renderPopover({ point: pointWithoutAccuracy });
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should call onClose when popover close is triggered', () => {
    renderPopover();
    fireEvent.click(screen.getByTestId('popover-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('location settings', () => {
    it('should display Location settings label when locationSettings is provided', () => {
      renderPopover({
        locationSettings: TimeTracking_LocationTrackingType.Required,
      });
      expect(screen.getByText('Location settings')).toBeInTheDocument();
    });

    it('should display Required when locationSettings is REQUIRED', () => {
      renderPopover({
        locationSettings: TimeTracking_LocationTrackingType.Required,
      });
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('should display Optional when locationSettings is OPTIONAL', () => {
      renderPopover({
        locationSettings: TimeTracking_LocationTrackingType.Optional,
      });
      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('should display Off when locationSettings is OFF', () => {
      renderPopover({
        locationSettings: TimeTracking_LocationTrackingType.Off,
      });
      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('should not display Location settings section when locationSettings is null', () => {
      renderPopover({ locationSettings: null });
      expect(screen.queryByText('Location settings')).not.toBeInTheDocument();
      expect(screen.queryByText('Required')).not.toBeInTheDocument();
      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
      expect(screen.queryByText('Off')).not.toBeInTheDocument();
    });

    it('should not display Location settings section when locationSettings is undefined', () => {
      renderPopover({ locationSettings: undefined });
      expect(screen.queryByText('Location settings')).not.toBeInTheDocument();
    });

    it('should display all fields in correct order: Time, Location settings, Accuracy', () => {
      renderPopover({
        locationSettings: TimeTracking_LocationTrackingType.Required,
      });
      const content = screen.getByTestId('popover-content');
      const textContent = content.textContent || '';

      // Check order: Time should come before Location settings, Location settings before Accuracy
      const timeIndex = textContent.indexOf('Time');
      const locationSettingsIndex = textContent.indexOf('Location settings');
      const accuracyIndex = textContent.indexOf('Accuracy');

      expect(timeIndex).toBeLessThan(locationSettingsIndex);
      expect(locationSettingsIndex).toBeLessThan(accuracyIndex);
    });

    it('should display Time and Accuracy even when locationSettings is not provided', () => {
      renderPopover();
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.queryByText('Location settings')).not.toBeInTheDocument();
    });
  });
});

describe('LocationPointPopover — Flag row (SBSEG-QBO-geofence-flags)', () => {
  const mockTargetElement = document.createElement('div');

  const flaggedPoint: LocationPointData = {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: '10:30 AM',
    teamMemberName: 'John Doe',
    accuracy: '5m',
    deviceAttributes: {
      leftGeofence: true,
      mockedLocation: true,
    },
  };

  const unflaggedPoint: LocationPointData = {
    lat: 37.7749,
    lng: -122.4194,
    timestamp: '10:30 AM',
    teamMemberName: 'John Doe',
    accuracy: '5m',
    deviceAttributes: { leftGeofence: false },
  };

  const renderPopover = (
    overrides: {
      point?: LocationPointData;
      isGeofenceFlagsEnabled?: boolean;
    } = {},
  ) =>
    render(
      <LocationPointPopover
        point={overrides.point ?? flaggedPoint}
        isOpen
        onClose={jest.fn()}
        targetElement={mockTargetElement}
        isGeofenceFlagsEnabled={overrides.isGeofenceFlagsEnabled}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render the Flag row when the feature flag is off, even if the point has active flags', () => {
    renderPopover({ isGeofenceFlagsEnabled: false });
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
    expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
  });

  it('does not render the Flag row when isGeofenceFlagsEnabled is not provided (default off)', () => {
    render(
      <LocationPointPopover
        point={flaggedPoint}
        isOpen
        onClose={jest.fn()}
        targetElement={mockTargetElement}
      />,
    );
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
  });

  it('does not render the Flag row when the flag is on but the point has no active flags', () => {
    renderPopover({ isGeofenceFlagsEnabled: true, point: unflaggedPoint });
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
  });

  it('does not render the Flag row when the point has no deviceAttributes at all', () => {
    const pointWithoutDeviceAttributes: LocationPointData = {
      lat: 37.7749,
      lng: -122.4194,
      timestamp: '10:30 AM',
      teamMemberName: 'John Doe',
      accuracy: '5m',
    };
    renderPopover({
      isGeofenceFlagsEnabled: true,
      point: pointWithoutDeviceAttributes,
    });
    expect(screen.queryByText('Flag')).not.toBeInTheDocument();
  });

  it('renders the Flag row when the feature flag is on and the point has active flags', () => {
    renderPopover({ isGeofenceFlagsEnabled: true });
    expect(screen.getByText('Flag')).toBeInTheDocument();
  });

  it('renders a single chip containing all active flag labels for the point (not just the first)', () => {
    renderPopover({ isGeofenceFlagsEnabled: true });
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveAttribute(
      'data-labels',
      'Left geofence location,Mocked location',
    );
  });

  it('orders flag labels within the chip using the fixed declaration order, not input order', () => {
    const pointWithFlagsOutOfOrder: LocationPointData = {
      ...flaggedPoint,
      deviceAttributes: {
        mockedLocation: true,
        leftGeofence: true,
        batterySaverEnabled: true,
      },
    };
    renderPopover({
      isGeofenceFlagsEnabled: true,
      point: pointWithFlagsOutOfOrder,
    });
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveAttribute(
      'data-labels',
      'Left geofence location,Battery saver enabled,Mocked location',
    );
  });

  it('renders the chip as non-dismissible', () => {
    renderPopover({ isGeofenceFlagsEnabled: true });
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-dismissible',
      'false',
    );
  });

  it('renders the Flag row after the Accuracy row', () => {
    renderPopover({ isGeofenceFlagsEnabled: true });
    const content = screen.getByTestId('popover-content');
    const textContent = content.textContent || '';
    const accuracyIndex = textContent.indexOf('Accuracy');
    const flagIndex = textContent.indexOf('Flag');
    expect(accuracyIndex).toBeLessThan(flagIndex);
  });

  it('renders a single active flag correctly', () => {
    const singleFlagPoint: LocationPointData = {
      ...flaggedPoint,
      deviceAttributes: { lowBattery: true },
    };
    renderPopover({ isGeofenceFlagsEnabled: true, point: singleFlagPoint });
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-labels',
      'Low battery',
    );
  });

  it('renders all six flag labels when every flag is active', () => {
    const allFlagsPoint: LocationPointData = {
      ...flaggedPoint,
      deviceAttributes: {
        leftGeofence: true,
        loggedOutOnClock: true,
        locationNotShared: true,
        lowBattery: true,
        batterySaverEnabled: true,
        mockedLocation: true,
      },
    };
    renderPopover({ isGeofenceFlagsEnabled: true, point: allFlagsPoint });
    expect(screen.getByTestId('chip')).toHaveAttribute(
      'data-labels',
      [
        'Left geofence location',
        'Logged out on clock',
        'Location not shared',
        'Low battery',
        'Battery saver enabled',
        'Mocked location',
      ].join(','),
    );
  });
});
