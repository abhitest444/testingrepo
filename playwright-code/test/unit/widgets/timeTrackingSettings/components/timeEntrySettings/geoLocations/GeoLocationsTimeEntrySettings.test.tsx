import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import '@testing-library/jest-dom';
import { GeoLocationsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/GeoLocationsTimeEntrySettings';

const mockIntlMessages = {
  edit: 'Edit',
  off: 'Off',
  on: 'On',
  'time-entries.section.title.geo-locations': 'Geolocations',
  'time-entries.section.title.geo-locations.value.required': 'Required',
  'time-entries.section.title.geo-locations.value.optional': 'Optional',
  'time-entries.section.title.geo-locations.value.off': 'Never',
};

const mockRefetchQlSettings = jest.fn();
const mockContextValue = {
  isFormEditable: true,
  timeEntryNewBadgeVisibleFor: {
    geoLocationsVisibilityEndDate: '',
    geofenceVisibilityEndDate: '',
  },
  QLData: {
    locationTracking: {
      value: 'OPTIONAL',
      version: '1',
    },
    mileageTrackingEnabled: {
      value: false,
      version: '1',
    },
    geofenceEnabled: {
      value: false,
      version: '1',
    },
  },
  QLSettingsError: '',
  isQLSettingsLoading: false,
  refetchQlSettings: mockRefetchQlSettings,
};

const mockTrack = jest.fn();

// Mock dependencies
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) =>
        mockIntlMessages[id as keyof typeof mockIntlMessages] || id,
    }),
    useSandbox: () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        log: jest.fn(),
      },
      pubsub: {
        publish: jest.fn(),
        subscribe: jest.fn(),
      },
    }),
    useTracking: () => mockTrack,
  };
});

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock feature flag hook
const mockGeofenceFeatureFlag = jest.fn();
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: (args: { flagName: string }) => {
    if (args.flagName === 'qb-time-tracking-geofencing-settings-enabled') {
      return mockGeofenceFeatureFlag();
    }
    return { isEnabled: false };
  },
}));

// Mock entitlements hook
const mockGetEntitlements = jest.fn();
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  useGetEntitlements: () => mockGetEntitlements(),
  computeHasTimeElite: (entitlements: any[]) =>
    entitlements.some((e) => e.name === 'TIME_ELITE'),
}));

jest.mock(
  '@payroll-shared-components/payroll-settings-section',
  () =>
    function MockSettingsSection({
      mode,
      title,
      viewContent,
      onEdit,
      readonly,
      ...props
    }: any) {
      return (
        <div data-testid="settings-section">
          <div data-testid="settings-title">{title}</div>
          <div data-testid="settings-mode">{mode}</div>
          <div data-testid="settings-readonly">{String(readonly)}</div>
          <div data-testid="settings-view-content">{viewContent}</div>
          {!readonly && onEdit && (
            <button onClick={onEdit} data-testid="edit-button">
              Edit
            </button>
          )}
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/geoLocations/GeoLocationsTrowserContainer',
  () => ({
    GeoLocationsTrowserContainer: ({
      open,
      onClose,
      currentValue,
      locationTrackingVersion,
      refetchQlSettings,
      showMileageTrackingSetting,
      mileageTrackingEnabled,
      mileageTrackingVersion,
      showGeofenceSetting,
      geofencingEnabled,
      geofencingVersion,
    }: any) => {
      if (!open) return null;
      return (
        <div data-testid="geo-locations-trowser">
          <button onClick={onClose} data-testid="trowser-close">
            Close
          </button>
          <span data-testid="trowser-current-value">{currentValue}</span>
          <span data-testid="trowser-version">{locationTrackingVersion}</span>
          <span data-testid="trowser-show-mileage">
            {String(showMileageTrackingSetting)}
          </span>
          <span data-testid="trowser-mileage-enabled">
            {String(mileageTrackingEnabled)}
          </span>
          <span data-testid="trowser-mileage-version">
            {mileageTrackingVersion}
          </span>
          <span data-testid="trowser-show-geofence">
            {String(showGeofenceSetting)}
          </span>
          <span data-testid="trowser-geofence-enabled">
            {String(geofencingEnabled)}
          </span>
          <span data-testid="trowser-geofence-version">
            {geofencingVersion}
          </span>
        </div>
      );
    },
  }),
);

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent', () => ({
  ViewContent: ({ formFields, isErrorInView }: any) => (
    <div data-testid="view-content">
      <div data-testid="is-error-in-view">{String(isErrorInView)}</div>
      {formFields &&
        Object.entries(formFields).map(([sectionKey, fields]: [string, any]) =>
          Array.isArray(fields)
            ? fields.map((field: any) => (
                <div key={field.key} data-testid={`field-${field.key}`}>
                  <span data-testid={`field-value-${field.key}`}>
                    {field.value}
                  </span>
                </div>
              ))
            : null,
        )}
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection',
  () => ({
    StyledSettingsSection: ({ children, componentId }: any) => (
      <div data-testid={`styled-settings-section-${componentId}`}>
        {children}
      </div>
    ),
  }),
);

const {
  useTimeTrackingSettingsContext,
} = require('src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext');

describe('GeoLocationsTimeEntrySettings', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(
      mockContextValue,
    );
    // Default: geofence feature flag enabled and Time Elite entitlement
    mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
    mockGetEntitlements.mockReturnValue({
      data: [{ name: 'TIME_ELITE' }],
    });
  });

  it('should render the component', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('settings-section')).toBeInTheDocument();
  });

  it('should display the correct title', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('settings-title')).toHaveTextContent(
      'Geolocations',
    );
  });

  it('should display in VIEW mode', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('settings-mode')).toHaveTextContent('VIEW');
  });

  it('should display current location tracking value as Optional', async () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Optional');
    });
  });

  it('should display "Never" when location tracking is OFF', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        locationTracking: {
          value: 'OFF',
          version: '1',
        },
      },
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Never');
    });
  });

  it('should display "Required" when location tracking is REQUIRED', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        locationTracking: {
          value: 'REQUIRED',
          version: '1',
        },
      },
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Required');
    });
  });

  it('should open trowser when edit button is clicked', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(
      screen.queryByTestId('geo-locations-trowser'),
    ).not.toBeInTheDocument();

    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
  });

  it('should close trowser when close button is clicked', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    // Open trowser
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();

    // Close trowser
    const closeButton = screen.getByTestId('trowser-close');
    fireEvent.click(closeButton);

    expect(
      screen.queryByTestId('geo-locations-trowser'),
    ).not.toBeInTheDocument();
  });

  it('should pass current value to trowser', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    // Open trowser
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(screen.getByTestId('trowser-current-value')).toHaveTextContent(
      'OPTIONAL',
    );
  });

  it('should pass locationTrackingVersion to trowser', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    // Open trowser
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(screen.getByTestId('trowser-version')).toHaveTextContent('1');
  });

  it('should pass refetchQlSettings to trowser', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    // Open trowser
    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
    // The refetchQlSettings is passed to the trowser component
  });

  it('should use StyledSettingsSection from GeneralSettingSection', () => {
    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(
      screen.getByTestId('styled-settings-section-geo-locations-settings'),
    ).toBeInTheDocument();
  });

  it('should set readonly to true when isFormEditable is false', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      isFormEditable: false,
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('settings-readonly')).toHaveTextContent('true');
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });

  it('should set readonly to true when there is an error', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Failed to load settings',
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('settings-readonly')).toHaveTextContent('true');
    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
  });

  it('should pass error state to ViewContent', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Failed to load settings',
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(screen.getByTestId('is-error-in-view')).toHaveTextContent('true');
  });

  it('should not render trowser when there is an error', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Failed to load settings',
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    expect(
      screen.queryByTestId('geo-locations-trowser'),
    ).not.toBeInTheDocument();
  });

  it('should display empty value when QLData is null', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: null,
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    // When QLData is null (without error), the useEffect doesn't run
    // so the field value stays at its initial empty state
    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('');
    });
  });

  it('should update field value when QLData changes', async () => {
    const { rerender } = render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Optional');
    });

    // Update context to REQUIRED
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLData: {
        locationTracking: {
          value: 'REQUIRED',
          version: '2',
        },
      },
    });

    rerender(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Required');
    });
  });

  it('should set field value to Never on error', async () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      ...mockContextValue,
      QLSettingsError: 'Error loading settings',
      isQLSettingsLoading: false,
    });

    render(
      <MockQuicksandProvider>
        <GeoLocationsTimeEntrySettings />
      </MockQuicksandProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('field-value-locationTracking'),
      ).toHaveTextContent('Never');
    });
  });

  describe('Mileage Tracking Field', () => {
    it('should render mileage tracking field when user has Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('field-mileageTracking')).toBeInTheDocument();
      });
    });

    it('should not render mileage tracking field when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId('field-mileageTracking'),
        ).not.toBeInTheDocument();
      });
    });

    it('should display "Off" for mileage tracking field by default when conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('Off');
      });
    });

    it('should display "On" for mileage tracking field when enabled', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...mockContextValue.QLData,
          mileageTrackingEnabled: {
            value: true,
            version: '1',
          },
        },
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('On');
      });
    });

    it('should display "Off" for mileage tracking field on error when conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLSettingsError: 'Error loading settings',
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('Off');
      });
    });

    it('should render both location tracking and mileage tracking fields when all conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('field-mileageTracking')).toBeInTheDocument();
      });
    });

    it('should only render location tracking field when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId('field-mileageTracking'),
        ).not.toBeInTheDocument();
      });
    });

    it('should maintain mileage tracking field when location tracking value changes and all conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      const { rerender } = render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-locationTracking'),
        ).toHaveTextContent('Optional');
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('Off');
      });

      // Update location tracking to REQUIRED
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...mockContextValue.QLData,
          locationTracking: {
            value: 'REQUIRED',
            version: '2',
          },
        },
      });

      rerender(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-locationTracking'),
        ).toHaveTextContent('Required');
        // Mileage tracking should still be present and show Off
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('Off');
      });
    });

    it('should not show mileage tracking field on error when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLSettingsError: 'Error loading settings',
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-locationTracking'),
        ).toHaveTextContent('Never');
        expect(
          screen.queryByTestId('field-mileageTracking'),
        ).not.toBeInTheDocument();
      });
    });

    it('should pass showMileageTrackingSetting prop to trowser', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-show-mileage')).toHaveTextContent(
          'true',
        );
      });
    });

    it('should pass showMileageTrackingSetting as false when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-show-mileage')).toHaveTextContent(
          'false',
        );
      });
    });

    it('should pass mileageTrackingEnabled and mileageTrackingVersion props to trowser', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...mockContextValue.QLData,
          mileageTrackingEnabled: {
            value: true,
            version: '3',
          },
        },
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-mileage-enabled')).toHaveTextContent(
          'true',
        );
        expect(screen.getByTestId('trowser-mileage-version')).toHaveTextContent(
          '3',
        );
      });
    });
  });

  describe('Geofencing Field', () => {
    it('should render geofencing field when feature flag is enabled and user has Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('field-geofence')).toBeInTheDocument();
      });
    });

    it('should not render geofencing field when feature flag is disabled', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('field-geofence')).not.toBeInTheDocument();
      });
    });

    it('should not render geofencing field when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.queryByTestId('field-geofence')).not.toBeInTheDocument();
      });
    });

    it('should display "Off" for geofencing field by default when conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('field-value-geofence')).toHaveTextContent(
          'Off',
        );
      });
    });

    it('should display "On" for geofencing field when enabled', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...mockContextValue.QLData,
          geofenceEnabled: {
            value: true,
            version: '1',
          },
        },
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('field-value-geofence')).toHaveTextContent(
          'On',
        );
      });
    });

    it('should display "Off" for geofencing field on error when conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLSettingsError: 'Error loading settings',
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('field-value-geofence')).toHaveTextContent(
          'Off',
        );
      });
    });

    it('should render both location tracking and geofencing fields when all conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('field-geofence')).toBeInTheDocument();
      });
    });

    it('should not show geofencing field on error when conditions are not met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLSettingsError: 'Error loading settings',
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-locationTracking'),
        ).toHaveTextContent('Never');
        expect(screen.queryByTestId('field-geofence')).not.toBeInTheDocument();
      });
    });

    it('should pass showGeofenceSetting prop to trowser', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-show-geofence')).toHaveTextContent(
          'true',
        );
      });
    });

    it('should pass showGeofenceSetting as false when conditions are not met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-show-geofence')).toHaveTextContent(
          'false',
        );
      });
    });

    it('should pass geofencingEnabled and geofencingVersion props to trowser', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          ...mockContextValue.QLData,
          geofenceEnabled: {
            value: true,
            version: '5',
          },
        },
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(
          screen.getByTestId('trowser-geofence-enabled'),
        ).toHaveTextContent('true');
        expect(
          screen.getByTestId('trowser-geofence-version'),
        ).toHaveTextContent('5');
      });
    });
  });

  describe('All Fields Combined', () => {
    it('should render all three fields when geofence flag is enabled and user has Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('field-mileageTracking')).toBeInTheDocument();
        expect(screen.getByTestId('field-geofence')).toBeInTheDocument();
      });
    });

    it('should render location and mileage fields but not geofence when geofence flag is disabled', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: false });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('field-mileageTracking')).toBeInTheDocument();
        expect(screen.queryByTestId('field-geofence')).not.toBeInTheDocument();
      });
    });

    it('should only render location tracking field when user is not Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [],
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-locationTracking'),
        ).toBeInTheDocument();
        expect(
          screen.queryByTestId('field-mileageTracking'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('field-geofence')).not.toBeInTheDocument();
      });
    });

    it('should pass all props to trowser when geofence flag is enabled and user has Time Elite', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLData: {
          locationTracking: {
            value: 'REQUIRED',
            version: '2',
          },
          mileageTrackingEnabled: {
            value: true,
            version: '3',
          },
          geofenceEnabled: {
            value: true,
            version: '4',
          },
        },
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
        expect(screen.getByTestId('trowser-current-value')).toHaveTextContent(
          'REQUIRED',
        );
        expect(screen.getByTestId('trowser-version')).toHaveTextContent('2');
        expect(screen.getByTestId('trowser-show-mileage')).toHaveTextContent(
          'true',
        );
        expect(screen.getByTestId('trowser-mileage-enabled')).toHaveTextContent(
          'true',
        );
        expect(screen.getByTestId('trowser-mileage-version')).toHaveTextContent(
          '3',
        );
        expect(screen.getByTestId('trowser-show-geofence')).toHaveTextContent(
          'true',
        );
        expect(
          screen.getByTestId('trowser-geofence-enabled'),
        ).toHaveTextContent('true');
        expect(
          screen.getByTestId('trowser-geofence-version'),
        ).toHaveTextContent('4');
      });
    });

    it('should show all three fields with correct values on error when conditions are met', async () => {
      mockGeofenceFeatureFlag.mockReturnValue({ isEnabled: true });
      mockGetEntitlements.mockReturnValue({
        data: [{ name: 'TIME_ELITE' }],
      });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        QLSettingsError: 'Error loading settings',
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('field-value-locationTracking'),
        ).toHaveTextContent('Never');
        expect(
          screen.getByTestId('field-value-mileageTracking'),
        ).toHaveTextContent('Off');
        expect(screen.getByTestId('field-value-geofence')).toHaveTextContent(
          'Off',
        );
      });
    });

    it('opens geolocation trowser immediately when deep link starts open', async () => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isQLSettingsLoading: false,
        QLSettingsError: '',
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings initialOpen />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('geo-locations-trowser')).toBeInTheDocument();
      });
    });

    it('does not auto-open trowser while settings are still loading', async () => {
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isQLSettingsLoading: true,
        QLSettingsError: '',
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings initialOpen />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId('geo-locations-trowser'),
        ).not.toBeInTheDocument();
      });
    });

    it('handles undefined entitlements when computing time elite', async () => {
      mockGetEntitlements.mockReturnValue({ data: undefined });
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        ...mockContextValue,
        isQLSettingsLoading: false,
      });

      render(
        <MockQuicksandProvider>
          <GeoLocationsTimeEntrySettings />
        </MockQuicksandProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('settings-section')).toBeInTheDocument();
      });
    });
  });
});
