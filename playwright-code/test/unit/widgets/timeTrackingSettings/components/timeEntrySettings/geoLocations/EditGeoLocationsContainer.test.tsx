import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import '@testing-library/jest-dom';
import { EditGeoLocationsContainer } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/EditGeoLocationsContainer';
import { TIME_ENTRY_SETTINGS_TRACKING_POINTS } from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';

const mockIntlMessages = {
  'time-entries.section.title.geo-locations.location-tracking':
    'Location tracking',
  'time-entries.section.title.geo-locations.preference-subtitle':
    'Locations are never tracked when your team members are on break or clocked out.',
  'time-entries.section.title.geo-locations.location-tracking.required':
    'Location tracking is required for all time entries',
  'time-entries.section.title.geo-locations.location-tracking.optional':
    'Location tracking is optional for time entries',
  'time-entries.section.title.geo-locations.location-tracking.off':
    'Location tracking is turned off',
  'time-entries.section.title.geo-locations.value.required': 'Required',
  'time-entries.section.title.geo-locations.value.optional': 'Optional',
  'time-entries.section.title.geo-locations.value.off': 'Never',
  'time-entries.section.title.geo-locations.mileage-tracking':
    'Mileage tracking',
  'time-entries.section.title.geo-locations.mileage-tracking.heading':
    'Mileage tracking',
  'time-entries.section.title.geo-locations.mileage-tracking.subtitle':
    'Automatically track employee mileage for expense reimbursement.',
  'time-entries.section.title.geo-locations.mileage-tracking.turn-on':
    'Turn on mileage tracking',
  'time-entries.section.title.geo-locations.mileage-tracking.default':
    'Mileage is calculated automatically when location tracking is on, and your employee is sharing location on the Workforce app.',
  'time-entries.section.title.geo-locations.mileage-tracking.never':
    'Mileage will be edited manually when location tracking is set to "Never".',
  'time-entries.section.title.geo-locations.mileage-tracking.learn-more':
    'Learn more',
  'time-entries.section.title.geo-locations.geofencing': 'Geofencing',
  'time-entries.section.title.geo-locations.geofencing.subtitle':
    'Set up virtual boundaries around work locations to automatically track when employees arrive and leave.',
  'time-entries.section.title.geo-locations.geofencing.turn-on':
    'Turn on geofencing',
  'time-entries.section.title.geo-locations.geofencing.assignments-text':
    'Assign employees to locations in the Assignments page.',
  'time-entries.section.title.geo-locations.geofencing.go-to-assignments':
    'Go to Assignments',
  'time-entries.section.title.geo-locations.geofencing.setup-notifications':
    'Set up notifications',
  'time-entries.section.title.geo-locations.geofencing.banner.title':
    'Keep location tracking as "{value}"?',
  'time-entries.section.title.geo-locations.geofencing.banner.body':
    'For better geofence performance, set location tracking to "Required." Geofence settings won\'t work if team members don\'t enable location permissions.',
};

// Mock @ids-ts/page-message
jest.mock(
  '@ids-ts/page-message',
  () =>
    ({ children, onClose, automationId, open, ...rest }: any) =>
      open ? (
        <div data-testid={automationId}>
          {children}
          <button data-testid={`${automationId}-close`} onClick={onClose}>
            Close
          </button>
        </div>
      ) : null,
);

// Mock @ids-ts/cards
jest.mock('@ids-ts/cards', () => ({
  Card: ({ children, onClick, size, disableCardClick, ...props }: any) => (
    <div data-testid="ids-card" onClick={onClick}>
      {children}
    </div>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="ids-card-content">{children}</div>
  ),
}));

// Mock useIntl, useSandbox, and useTracking
const mockNavigate = jest.fn();
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: (
        { id }: { id: string },
        values?: Record<string, string>,
      ) => {
        let msg = mockIntlMessages[id as keyof typeof mockIntlMessages] || id;
        if (values) {
          Object.entries(values).forEach(([key, val]) => {
            msg = msg.replace(`{${key}}`, val);
          });
        }
        return msg;
      },
    }),
    useSandbox: () => ({
      navigation: {
        navigate: mockNavigate,
      },
    }),
    useTracking: () => mockTrack,
  };
});

describe('EditGeoLocationsContainer', () => {
  const mockOnSettingChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockTrack.mockClear();
  });

  it('should render all three location setting cards', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('should render with REQUIRED option selected initially', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const requiredRadio = screen.getByRole('radio', { name: /required/i });
    expect(requiredRadio).toBeChecked();
  });

  it('should render with OPTIONAL option selected initially', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="OPTIONAL"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const optionalRadio = screen.getByRole('radio', { name: /optional/i });
    expect(optionalRadio).toBeChecked();
  });

  it('should render with OFF option selected initially', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="OFF"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const offRadio = screen.getByRole('radio', { name: /never/i });
    expect(offRadio).toBeChecked();
  });

  it('should call onSettingChange when clicking on a different card', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const optionalRadio = screen.getByRole('radio', { name: /optional/i });
    fireEvent.click(optionalRadio);

    // Since it's a controlled component, verify the callback is called
    // The parent component is responsible for updating the setting prop
    expect(mockOnSettingChange).toHaveBeenCalledWith('OPTIONAL');
  });

  it('should display correct descriptions for all cards', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    expect(
      screen.getByText('Location tracking is required for all time entries'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Location tracking is optional for time entries'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Location tracking is turned off'),
    ).toBeInTheDocument();
  });

  it('should render images for all cards', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    expect(screen.getByAltText('REQUIRED option')).toBeInTheDocument();
    expect(screen.getByAltText('OPTIONAL option')).toBeInTheDocument();
    expect(screen.getByAltText('OFF option')).toBeInTheDocument();
  });

  it('should call onSettingChange when a card is clicked', () => {
    const onSettingChange = jest.fn();
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={onSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const optionalRadio = screen.getByRole('radio', { name: /optional/i });
    fireEvent.click(optionalRadio);

    expect(onSettingChange).toHaveBeenCalledWith('OPTIONAL');
    // Called twice: once from card onClick, once from radio onChange
    expect(onSettingChange).toHaveBeenCalledTimes(2);
  });

  it('should call onSettingChange with correct value when different cards are clicked', () => {
    const onSettingChange = jest.fn();
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={onSettingChange}
        />
      </MockQuicksandProvider>,
    );

    const offRadio = screen.getByRole('radio', { name: /never/i });
    fireEvent.click(offRadio);
    expect(onSettingChange).toHaveBeenCalledWith('OFF');

    const optionalRadio = screen.getByRole('radio', { name: /optional/i });
    fireEvent.click(optionalRadio);
    expect(onSettingChange).toHaveBeenCalledWith('OPTIONAL');

    // Called 4 times total: 2 clicks × 2 (card onClick + radio onChange)
    expect(onSettingChange).toHaveBeenCalledTimes(4);
  });

  it('should render using IDS Card components', () => {
    render(
      <MockQuicksandProvider>
        <EditGeoLocationsContainer
          setting="REQUIRED"
          onSettingChange={mockOnSettingChange}
        />
      </MockQuicksandProvider>,
    );

    // Should render 3 IDS Cards (one for each option)
    const idsCards = screen.getAllByTestId('ids-card');
    expect(idsCards).toHaveLength(3);

    // Should render 3 CardContent components
    const cardContents = screen.getAllByTestId('ids-card-content');
    expect(cardContents).toHaveLength(3);
  });

  describe('Mileage Tracking Section', () => {
    it('should show mileage tracking section when feature flag is enabled', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByText('Mileage tracking')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Automatically track employee mileage for expense reimbursement.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Turn on mileage tracking')).toBeInTheDocument();
      expect(
        screen.getByTestId('mileage-tracking-checkbox'),
      ).toBeInTheDocument();
    });

    it('should not show mileage tracking section when feature flag is disabled', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting={false}
          />
        </MockQuicksandProvider>,
      );

      expect(screen.queryByText('Mileage tracking')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Turn on mileage tracking'),
      ).not.toBeInTheDocument();
    });

    it('should show mileage tracking section for OPTIONAL setting', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByText('Mileage tracking')).toBeInTheDocument();
      expect(screen.getByText('Turn on mileage tracking')).toBeInTheDocument();
      expect(
        screen.getByTestId('mileage-tracking-checkbox'),
      ).toBeInTheDocument();
    });

    it('should show mileage tracking section for OFF setting', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OFF"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByText('Mileage tracking')).toBeInTheDocument();
      expect(screen.getByText('Turn on mileage tracking')).toBeInTheDocument();
      expect(
        screen.getByTestId('mileage-tracking-checkbox'),
      ).toBeInTheDocument();
    });

    it('should toggle mileage tracking checkbox', () => {
      const mockOnMileageTrackingChange = jest.fn();
      const { rerender } = render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            onMileageTrackingChange={mockOnMileageTrackingChange}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');

      // Initially unchecked
      expect(mileageCheckbox).not.toBeChecked();

      // Click to enable
      fireEvent.click(mileageCheckbox);
      expect(mockOnMileageTrackingChange).toHaveBeenCalledWith(true);

      // Simulate parent updating the prop
      rerender(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled
            onMileageTrackingChange={mockOnMileageTrackingChange}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckboxAfterEnable = screen.getByTestId(
        'mileage-tracking-checkbox',
      );
      expect(mileageCheckboxAfterEnable).toBeChecked();
    });

    it('should initialize mileageTrackingEnabled to false by default', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      expect(mileageCheckbox).not.toBeChecked();
    });

    it('should initialize mileageTrackingEnabled to true when prop is true', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      expect(mileageCheckbox).toBeChecked();
    });

    it('should initialize mileageTrackingEnabled to false when prop is false', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      expect(mileageCheckbox).not.toBeChecked();
    });

    it('should show default description for REQUIRED setting', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Mileage is calculated automatically when location tracking is on, and your employee is sharing location on the Workforce app.',
        ),
      ).toBeInTheDocument();
    });

    it('should show default description for OPTIONAL setting', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Mileage is calculated automatically when location tracking is on, and your employee is sharing location on the Workforce app.',
        ),
      ).toBeInTheDocument();
    });

    it('should show never description for OFF setting', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OFF"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Mileage will be edited manually when location tracking is set to "Never".',
        ),
      ).toBeInTheDocument();
    });

    it('should update description when location tracking setting changes', () => {
      const { rerender } = render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Mileage is calculated automatically when location tracking is on, and your employee is sharing location on the Workforce app.',
        ),
      ).toBeInTheDocument();

      // Change to OFF setting
      rerender(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OFF"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Mileage will be edited manually when location tracking is set to "Never".',
        ),
      ).toBeInTheDocument();
    });

    it('should render learn more link in description', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
          />
        </MockQuicksandProvider>,
      );

      const learnMoreLink = screen.getByTestId('mileage-tracking-learn-more');
      expect(learnMoreLink).toBeInTheDocument();
      expect(learnMoreLink).toHaveAttribute('target', '_blank');
      expect(learnMoreLink).toHaveAttribute(
        'href',
        'https://quickbooks.intuit.com/learn-support/en-us/help-article/track-mileage/quickbooks-time-mileage-tracking/L71aqD2WE_US_en_US',
      );
      expect(screen.getByText('Learn more')).toBeInTheDocument();
    });

    it('should call onMileageTrackingChange callback when checkbox is toggled', () => {
      const mockOnMileageTrackingChange = jest.fn();

      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
            onMileageTrackingChange={mockOnMileageTrackingChange}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      fireEvent.click(mileageCheckbox);

      expect(mockOnMileageTrackingChange).toHaveBeenCalledWith(true);
    });

    it('should call onMileageTrackingChange with false when toggling from enabled to disabled', () => {
      const mockOnMileageTrackingChange = jest.fn();

      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled
            onMileageTrackingChange={mockOnMileageTrackingChange}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      fireEvent.click(mileageCheckbox);

      expect(mockOnMileageTrackingChange).toHaveBeenCalledWith(false);
    });

    it('should update checkbox when mileageTrackingEnabled prop changes', () => {
      const { rerender } = render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      let mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      expect(mileageCheckbox).not.toBeChecked();

      // Update prop - controlled component reflects prop changes immediately
      rerender(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      expect(mileageCheckbox).toBeChecked();
    });

    it('should not break when onMileageTrackingChange is not provided', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');

      // Should not throw error
      expect(() => fireEvent.click(mileageCheckbox)).not.toThrow();
    });
  });

  describe('Geofencing Section', () => {
    it('should show geofencing section when showGeofenceSetting is true', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByText('Geofencing')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Set up virtual boundaries around work locations to automatically track when employees arrive and leave.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Turn on geofencing')).toBeInTheDocument();
      expect(screen.getByTestId('geofencing-checkbox')).toBeInTheDocument();
    });

    it('should not show geofencing section when showGeofenceSetting is false', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting={false}
          />
        </MockQuicksandProvider>,
      );

      expect(screen.queryByText('Geofencing')).not.toBeInTheDocument();
      expect(screen.queryByText('Turn on geofencing')).not.toBeInTheDocument();
    });

    it('should initialize geofencingEnabled to false by default', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      expect(geofencingCheckbox).not.toBeChecked();
    });

    it('should initialize geofencingEnabled to true when prop is true', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      expect(geofencingCheckbox).toBeChecked();
    });

    it('should call onGeofencingChange callback when checkbox is toggled', () => {
      const mockOnGeofencingChange = jest.fn();

      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
            onGeofencingChange={mockOnGeofencingChange}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      fireEvent.click(geofencingCheckbox);

      expect(mockOnGeofencingChange).toHaveBeenCalledWith(true);
    });

    it('should call onGeofencingChange with false when toggling from enabled to disabled', () => {
      const mockOnGeofencingChange = jest.fn();

      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
            onGeofencingChange={mockOnGeofencingChange}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      fireEvent.click(geofencingCheckbox);

      expect(mockOnGeofencingChange).toHaveBeenCalledWith(false);
    });

    it('should show expanded content when geofencing is enabled', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByText(
          'Assign employees to locations in the Assignments page.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('geofencing-go-to-assignments'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('setup-geofence-notifications-button'),
      ).toBeInTheDocument();
      expect(screen.getByText('Set up notifications')).toBeInTheDocument();
    });

    it('should not show expanded content when geofencing is disabled', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.queryByText(
          'Assign employees to locations in the Assignments page.',
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('setup-geofence-notifications-button'),
      ).not.toBeInTheDocument();
    });

    it('should render go to assignments link with correct attributes', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      const assignmentsLink = screen.getByTestId(
        'geofencing-go-to-assignments',
      );
      expect(assignmentsLink).toBeInTheDocument();
      expect(assignmentsLink).toHaveAttribute('role', 'button');
      expect(screen.getByText('Go to Assignments')).toBeInTheDocument();
    });

    it('should navigate to assignments when link is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      const assignmentsLink = screen.getByTestId(
        'geofencing-go-to-assignments',
      );
      fireEvent.click(assignmentsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/app/time/assignments');
    });

    it('should call onSetupNotificationsClick when setup notifications button is clicked', () => {
      const mockOnSetupNotificationsClick = jest.fn();

      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
            onSetupNotificationsClick={mockOnSetupNotificationsClick}
          />
        </MockQuicksandProvider>,
      );

      const setupNotificationsButton = screen.getByTestId(
        'setup-geofence-notifications-button',
      );
      fireEvent.click(setupNotificationsButton);

      expect(mockOnSetupNotificationsClick).toHaveBeenCalledTimes(1);
    });

    it('should toggle geofencing checkbox state', () => {
      const mockOnGeofencingChange = jest.fn();
      const { rerender } = render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
            onGeofencingChange={mockOnGeofencingChange}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');

      // Initially unchecked
      expect(geofencingCheckbox).not.toBeChecked();

      // Click to enable
      fireEvent.click(geofencingCheckbox);
      expect(mockOnGeofencingChange).toHaveBeenCalledWith(true);

      // Simulate parent updating the prop
      rerender(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
            onGeofencingChange={mockOnGeofencingChange}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckboxAfterEnable = screen.getByTestId(
        'geofencing-checkbox',
      );
      expect(geofencingCheckboxAfterEnable).toBeChecked();
    });

    it('should update checkbox when geofencingEnabled prop changes', () => {
      const { rerender } = render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      let geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      expect(geofencingCheckbox).not.toBeChecked();

      // Update prop - controlled component reflects prop changes immediately
      rerender(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      expect(geofencingCheckbox).toBeChecked();
    });

    it('should not break when onGeofencingChange is not provided', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');

      // Should not throw error
      expect(() => fireEvent.click(geofencingCheckbox)).not.toThrow();
    });

    it('should show both mileage tracking and geofencing sections together', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(screen.getByText('Mileage tracking')).toBeInTheDocument();
      expect(screen.getByText('Geofencing')).toBeInTheDocument();
      expect(
        screen.getByTestId('mileage-tracking-checkbox'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('geofencing-checkbox')).toBeInTheDocument();
    });
  });

  describe('Tracking points', () => {
    it('should track GEO_LOCATIONS_CARD_REQUIRED_CLICKED when Required card is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
          />
        </MockQuicksandProvider>,
      );

      const requiredRadio = screen.getByRole('radio', { name: /required/i });
      fireEvent.click(requiredRadio);

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_REQUIRED_CLICKED,
      );
    });

    it('should track GEO_LOCATIONS_CARD_OPTIONAL_CLICKED when Optional card is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
          />
        </MockQuicksandProvider>,
      );

      const optionalRadio = screen.getByRole('radio', { name: /optional/i });
      fireEvent.click(optionalRadio);

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_OPTIONAL_CLICKED,
      );
    });

    it('should track GEO_LOCATIONS_CARD_NEVER_CLICKED when Never card is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
          />
        </MockQuicksandProvider>,
      );

      const offRadio = screen.getByRole('radio', { name: /never/i });
      fireEvent.click(offRadio);

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEO_LOCATIONS_CARD_NEVER_CLICKED,
      );
    });

    it('should track MILEAGE_TRACKING_TOGGLE with ui_action enabled when mileage checkbox is turned on', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      fireEvent.click(mileageCheckbox);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.MILEAGE_TRACKING_TOGGLE,
        ui_action: 'enabled',
      });
    });

    it('should track MILEAGE_TRACKING_TOGGLE with ui_action disabled when mileage checkbox is turned off', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showMileageTrackingSetting
            mileageTrackingEnabled
          />
        </MockQuicksandProvider>,
      );

      const mileageCheckbox = screen.getByTestId('mileage-tracking-checkbox');
      fireEvent.click(mileageCheckbox);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.MILEAGE_TRACKING_TOGGLE,
        ui_action: 'disabled',
      });
    });

    it('should track GEOFENCE_CHECKBOX with ui_action enabled when geofencing checkbox is turned on', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled={false}
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      fireEvent.click(geofencingCheckbox);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_CHECKBOX,
        ui_action: 'enabled',
      });
    });

    it('should track GEOFENCE_CHECKBOX with ui_action disabled when geofencing checkbox is turned off', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      const geofencingCheckbox = screen.getByTestId('geofencing-checkbox');
      fireEvent.click(geofencingCheckbox);

      expect(mockTrack).toHaveBeenCalledWith({
        ...TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_CHECKBOX,
        ui_action: 'disabled',
      });
    });

    it('should track GEOFENCE_GO_TO_ASSIGNMENTS when Go to Assignments link is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
          />
        </MockQuicksandProvider>,
      );

      const assignmentsLink = screen.getByTestId(
        'geofencing-go-to-assignments',
      );
      fireEvent.click(assignmentsLink);

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_GO_TO_ASSIGNMENTS,
      );
    });

    it('should track GEOFENCE_SET_UP_NOTIFICATIONS when Set up notifications button is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
            geofencingEnabled
            onSetupNotificationsClick={jest.fn()}
          />
        </MockQuicksandProvider>,
      );

      const setupNotificationsButton = screen.getByTestId(
        'setup-geofence-notifications-button',
      );
      fireEvent.click(setupNotificationsButton);

      expect(mockTrack).toHaveBeenCalledWith(
        TIME_ENTRY_SETTINGS_TRACKING_POINTS.GEOFENCE_SET_UP_NOTIFICATIONS,
      );
    });
  });

  describe('Geofence Location Tracking Banner', () => {
    it('should show banner when setting is OPTIONAL and geofence section is visible', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByTestId('geofence-location-tracking-banner'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Keep location tracking as "Optional"?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'For better geofence performance, set location tracking to "Required." Geofence settings won\'t work if team members don\'t enable location permissions.',
        ),
      ).toBeInTheDocument();
    });

    it('should show banner when setting is OFF and geofence section is visible', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OFF"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByTestId('geofence-location-tracking-banner'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Keep location tracking as "Never"?'),
      ).toBeInTheDocument();
    });

    it('should not show banner when setting is REQUIRED', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="REQUIRED"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.queryByTestId('geofence-location-tracking-banner'),
      ).not.toBeInTheDocument();
    });

    it('should not show banner when geofence section is not visible', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting={false}
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.queryByTestId('geofence-location-tracking-banner'),
      ).not.toBeInTheDocument();
    });

    it('should dismiss banner when close button is clicked', () => {
      render(
        <MockQuicksandProvider>
          <EditGeoLocationsContainer
            setting="OPTIONAL"
            onSettingChange={mockOnSettingChange}
            showGeofenceSetting
          />
        </MockQuicksandProvider>,
      );

      expect(
        screen.getByTestId('geofence-location-tracking-banner'),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('geofence-location-tracking-banner-close'),
      );

      expect(
        screen.queryByTestId('geofence-location-tracking-banner'),
      ).not.toBeInTheDocument();
    });
  });
});
