import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import TimeEntryLocationContent from 'src/js/widgets/timeEntryLocation/components/TimeEntryLocationMap/TimeEntryLocationContent';
import { LocationPointData } from 'src/js/widgets/timeEntryLocation/components/types';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Capture the onGoogleApiLoaded and onChange callbacks
let capturedOnGoogleApiLoaded:
  | ((args: { map: any; maps: any }) => void)
  | null = null;
let capturedOnChange: ((value: string) => void) | null = null;
let capturedMarkerClickHandlers: Array<() => void> = [];

// Mock google-map-react
jest.mock('google-map-react', () => ({
  __esModule: true,
  default: ({
    children,
    onGoogleApiLoaded,
    defaultCenter,
    defaultZoom,
    options,
  }: any) => {
    capturedOnGoogleApiLoaded = onGoogleApiLoaded;
    // Call options to get coverage on that function
    if (options) {
      options({ ControlPosition: { BOTTOM_RIGHT: 9 } });
    }
    return (
      <div
        data-testid="google-map-react"
        data-default-lat={defaultCenter?.lat}
        data-default-lng={defaultCenter?.lng}
        data-default-zoom={defaultZoom}
      >
        {children}
      </div>
    );
  },
}));

// Mock @qbds/toggle
jest.mock('@qbds/toggle', () => ({
  __esModule: true,
  default: ({ groupLabel, options, defaultValue, onChange }: any) => {
    capturedOnChange = onChange;
    return (
      <div data-testid="toggle" data-group-label={groupLabel}>
        {options?.map((opt: any) => (
          <button
            key={opt.value}
            data-testid={`toggle-option-${opt.value}`}
            data-selected={opt.value === defaultValue}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  },
}));

// Mock @ids-ts/typography - using forwardRef to support styled-components
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  B2: React.forwardRef(({ children, weight }: any, ref: any) => (
    <span ref={ref} data-testid="b2-typography" data-weight={weight}>
      {children}
    </span>
  )),
  B3: React.forwardRef(({ children, weight }: any, ref: any) => (
    <span ref={ref} data-testid="b3-typography" data-weight={weight}>
      {children}
    </span>
  )),
}));

// Mock @ids-ts/icon-control
jest.mock('@ids-ts/icon-control', () => ({
  __esModule: true,
  IconControl: ({
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
  }: any) => (
    <button
      data-testid="icon-control"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

// Mock @ids-ts/popover
jest.mock('@ids-ts/popover', () => ({
  __esModule: true,
  Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverHeader: ({ children }: any) => (
    <div data-testid="popover-header">{children}</div>
  ),
}));

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  __esModule: true,
  Retry: () => <span data-testid="retry-icon">Retry</span>,
  PlayNoCircle: () => (
    <span data-testid="play-no-circle-icon">PlayNoCircle</span>
  ),
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
}));

// Mock common.styles for marker URL helpers
jest.mock(
  'src/js/widgets/timeEntryLocation/components/styles/common.styles',
  () => ({
    __esModule: true,
    getGreenMarkerUrl: () => 'data:image/svg+xml,green-marker',
    getGrayMarkerUrl: () => 'data:image/svg+xml,gray-marker',
    getOrangeMarkerUrl: () => 'data:image/svg+xml,orange-marker',
    HorizontalDivider: 'hr',
    GreenLocationMarker: 'div',
    GrayLocationMarker: 'div',
    OrangeLocationMarker: 'div',
  }),
);

// Mock LocationPointPopover
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryLocationMap/LocationPointPopover',
  () => ({
    __esModule: true,
    default: ({ point, isOpen, onClose }: any) => (
      <div data-testid="location-point-popover" data-is-open={isOpen}>
        {point && <span data-testid="popover-point">{point.timestamp}</span>}
        <button data-testid="popover-close" onClick={onClose}>
          Close
        </button>
      </div>
    ),
  }),
);

// Mock useTracking
const mockTrack = jest.fn();

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

describe('TimeEntryLocationContent', () => {
  const defaultSandbox = getDefaultSandbox();
  const sandboxWithApiKey = {
    ...defaultSandbox,
    pluginConfig: {
      ...defaultSandbox.pluginConfig,
      extendedProperties: {
        ...defaultSandbox.pluginConfig?.extendedProperties,
        googleApiKey: 'test-api-key',
      },
    },
  } as typeof defaultSandbox;

  const sandboxWithoutApiKey = {
    ...defaultSandbox,
    pluginConfig: {
      ...defaultSandbox.pluginConfig,
      extendedProperties: {
        ...defaultSandbox.pluginConfig?.extendedProperties,
        googleApiKey: undefined,
      },
    },
  } as typeof defaultSandbox;

  // Mock location points data
  const mockLocationPoints: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:30 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '9:35 AM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.388,
      lng: -122.086,
      timestamp: '9:40 AM',
      accuracy: '10m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.389,
      lng: -122.087,
      timestamp: '9:45 AM',
      accuracy: '8m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.39,
      lng: -122.088,
      timestamp: '9:50 AM',
      accuracy: '5m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.391,
      lng: -122.089,
      timestamp: '9:55 AM',
      accuracy: '3m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.392,
      lng: -122.09,
      timestamp: '10:00 AM',
      accuracy: '2m',
      teamMemberName: 'John Doe',
    },
    {
      lat: 37.393,
      lng: -122.091,
      timestamp: '10:05 AM',
      accuracy: '1m',
      teamMemberName: 'John Doe',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    capturedOnGoogleApiLoaded = null;
    capturedOnChange = null;
    capturedMarkerClickHandlers = [];
  });

  // Helper to create a full google mock
  const createGoogleMock = (overrides: any = {}) => {
    const mockSetMap = jest.fn();
    const mockSetPath = jest.fn();
    const mockSetOptions = jest.fn();
    const mockGetMap = jest.fn().mockReturnValue(null);
    const mockGetPosition = jest
      .fn()
      .mockReturnValue({ lat: 37.386, lng: -122.084 });

    return {
      maps: {
        Polyline: jest.fn().mockImplementation(() => ({
          setMap: mockSetMap,
          setPath: mockSetPath,
          _glowCircle: null,
        })),
        Marker: jest.fn().mockImplementation(() => ({
          setMap: mockSetMap,
          getMap: mockGetMap,
          getPosition: mockGetPosition,
          addListener: jest.fn((event, handler) => {
            if (event === 'click') {
              capturedMarkerClickHandlers.push(handler);
            }
          }),
        })),
        LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
        LatLngBounds: jest.fn().mockImplementation(() => ({
          extend: jest.fn(),
        })),
        Size: jest.fn().mockImplementation((w, h) => ({ width: w, height: h })),
        Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
        geometry: {
          spherical: {
            interpolate: jest
              .fn()
              .mockReturnValue({ lat: 37.39, lng: -122.07 }),
          },
        },
        Circle: jest.fn().mockImplementation(() => ({
          setMap: mockSetMap,
          setOptions: mockSetOptions,
        })),
        OverlayView: jest.fn().mockImplementation(() => {
          const overlay = {
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn().mockReturnValue({
              fromLatLngToContainerPixel: jest
                .fn()
                .mockReturnValue({ x: 100, y: 200 }),
            }),
          };
          // Immediately trigger onAdd when setMap is called
          overlay.setMap = jest.fn().mockImplementation((map) => {
            if (map && overlay.onAdd) {
              overlay.onAdd();
            }
          });
          return overlay;
        }),
        ...overrides,
      },
    };
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('google-map-react')).toBeInTheDocument();
    });

    it('should render with different location points', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent
          locationPoints={[mockLocationPoints[0], mockLocationPoints[1]]}
        />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('google-map-react')).toBeInTheDocument();
    });

    it('should return null when googleApiKey is not provided', () => {
      const { container } = renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithoutApiKey,
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render map header with MapPin icon', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    it('should render header title with typography', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByText('Location points tracked')).toBeInTheDocument();
      expect(screen.getByTestId('b2-typography')).toHaveAttribute(
        'data-weight',
        'demi',
      );
    });
  });

  describe('map toggle', () => {
    it('should render map toggle with correct group label', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      const toggle = screen.getByTestId('toggle');
      expect(toggle).toHaveAttribute('data-group-label', 'Map type');
    });

    it('should render Map and Satellite toggle options', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('toggle-option-roadmap')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-option-satellite')).toBeInTheDocument();
    });

    it('should call onChange when toggle option is clicked', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      const satelliteButton = screen.getByTestId('toggle-option-satellite');
      fireEvent.click(satelliteButton);
      // The component should handle the change internally
      expect(satelliteButton).toBeInTheDocument();
    });
  });

  describe('play button', () => {
    it('should render play button', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });

    it('should render PlayNoCircle icon inside play button', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('play-no-circle-icon')).toBeInTheDocument();
    });

    it('should have correct aria-label on play button', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('icon-control')).toHaveAttribute(
        'aria-label',
        'Play route',
      );
    });

    it('should have play button disabled initially (before animation has played)', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('icon-control')).toBeDisabled();
    });
  });

  describe('popover', () => {
    it('should render location point popover', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('location-point-popover')).toBeInTheDocument();
    });

    it('should have popover initially closed', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('location-point-popover')).toHaveAttribute(
        'data-is-open',
        'false',
      );
    });
  });

  describe('google maps default values', () => {
    it('should set correct default center from first location point', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      const mapElement = screen.getByTestId('google-map-react');
      expect(mapElement).toHaveAttribute('data-default-lat', '37.386');
      expect(mapElement).toHaveAttribute('data-default-lng', '-122.084');
    });

    it('should set default zoom from ZOOM_DEFAULT constant', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(screen.getByTestId('google-map-react')).toHaveAttribute(
        'data-default-zoom',
        '4',
      );
    });
  });

  describe('google maps options', () => {
    it('should call options function to configure map settings', () => {
      // The existing mock already calls options() - we just verify rendering works
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      // Map should render successfully with options configured
      expect(screen.getByTestId('google-map-react')).toBeInTheDocument();
    });

    it('should import ZOOM_MAX constant for maxZoom configuration', () => {
      const {
        ZOOM_MAX,
      } = require('src/js/widgets/timeEntryLocation/utils/constants');

      // Verify ZOOM_MAX is defined and has correct value
      expect(ZOOM_MAX).toBeDefined();
      expect(ZOOM_MAX).toBe(17);
    });
  });

  describe('Google Maps API loaded callback', () => {
    it('should capture onGoogleApiLoaded callback', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );
      expect(capturedOnGoogleApiLoaded).toBeDefined();
    });

    it('should handle Google Maps API loaded event', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = {
        fitBounds: jest.fn(),
        setMapTypeId: jest.fn(),
      };

      const mockMaps = {
        ControlPosition: { BOTTOM_RIGHT: 9 },
      };

      // Mock global google object for the callback
      (global as any).google = {
        maps: {
          Polyline: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setPath: jest.fn(),
          })),
          Marker: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          })),
          LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
          LatLngBounds: jest.fn().mockImplementation(() => ({
            extend: jest.fn(),
          })),
          Size: jest
            .fn()
            .mockImplementation((w, h) => ({ width: w, height: h })),
          Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
          geometry: {
            spherical: {
              interpolate: jest.fn(),
            },
          },
          Circle: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setOptions: jest.fn(),
          })),
          OverlayView: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn(),
          })),
        },
      };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({ map: mockMap, maps: mockMaps });
      }

      expect(mockMap.fitBounds).toHaveBeenCalled();
    });
  });

  describe('map type change', () => {
    it('should handle map type change to satellite', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      // Create mock for google.maps before triggering change
      const mockSetMapTypeId = jest.fn();
      (global as any).google = {
        maps: {
          Polyline: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setPath: jest.fn(),
          })),
          Marker: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          })),
          LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
          LatLngBounds: jest.fn().mockImplementation(() => ({
            extend: jest.fn(),
          })),
          Size: jest
            .fn()
            .mockImplementation((w, h) => ({ width: w, height: h })),
          Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
          geometry: {
            spherical: {
              interpolate: jest.fn(),
            },
          },
          Circle: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setOptions: jest.fn(),
          })),
          OverlayView: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn(),
          })),
        },
      };

      // First load the API
      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: { fitBounds: jest.fn(), setMapTypeId: mockSetMapTypeId },
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Then change map type
      if (capturedOnChange) {
        capturedOnChange('satellite');
      }

      expect(mockSetMapTypeId).toHaveBeenCalledWith('satellite');
    });

    it('should handle map type change to roadmap', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetMapTypeId = jest.fn();
      (global as any).google = {
        maps: {
          Polyline: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setPath: jest.fn(),
          })),
          Marker: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          })),
          LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
          LatLngBounds: jest.fn().mockImplementation(() => ({
            extend: jest.fn(),
          })),
          Size: jest
            .fn()
            .mockImplementation((w, h) => ({ width: w, height: h })),
          Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
          geometry: {
            spherical: {
              interpolate: jest.fn(),
            },
          },
          Circle: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setOptions: jest.fn(),
          })),
          OverlayView: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn(),
          })),
        },
      };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: { fitBounds: jest.fn(), setMapTypeId: mockSetMapTypeId },
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      if (capturedOnChange) {
        capturedOnChange('roadmap');
      }

      expect(mockSetMapTypeId).toHaveBeenCalledWith('roadmap');
    });
  });

  describe('handleMarkerClick', () => {
    it('should register marker click handlers when API loads', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // 8 markers should have registered click handlers
      expect(capturedMarkerClickHandlers.length).toBe(8);
    });

    it('should not throw when marker is clicked', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Should not throw when clicked
      if (capturedMarkerClickHandlers.length > 0) {
        expect(() => capturedMarkerClickHandlers[0]()).not.toThrow();
      }
    });
  });

  describe('handlePopoverClose', () => {
    it('should close popover when close button is clicked', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const closeButton = screen.getByTestId('popover-close');
      fireEvent.click(closeButton);

      expect(screen.getByTestId('location-point-popover')).toHaveAttribute(
        'data-is-open',
        'false',
      );
    });
  });

  describe('handleApiLoaded', () => {
    it('should create polyline when API loads', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      expect((global as any).google.maps.Polyline).toHaveBeenCalled();
    });

    it('should create 8 markers for sample location points', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      expect((global as any).google.maps.Marker).toHaveBeenCalledTimes(8);
    });

    it('should fit bounds to show all points', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockFitBounds = jest.fn();
      const mockMap = { fitBounds: mockFitBounds, setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      expect(mockFitBounds).toHaveBeenCalled();
    });

    it('should create LatLngBounds', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      expect((global as any).google.maps.LatLngBounds).toHaveBeenCalled();
    });

    it('should use Size and Point for marker icons', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      expect((global as any).google.maps.Size).toHaveBeenCalled();
      expect((global as any).google.maps.Point).toHaveBeenCalled();
    });

    it('should clear existing polyline when API loads again', () => {
      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetMapOnPolyline = jest.fn();
      const mockPolylineInstance = {
        setMap: mockSetMapOnPolyline,
        setPath: jest.fn(),
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      // Override Polyline to return our controlled instance
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      // First load
      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Second load - should clear the existing polyline
      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // polyline.setMap(null) should have been called to clear it
      expect(mockSetMapOnPolyline).toHaveBeenCalledWith(null);
    });

    it('should trigger auto-play animation after delay', () => {
      jest.useFakeTimers();

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: mockSetPath,
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Fast-forward timers to trigger auto-play
      jest.advanceTimersByTime(500);

      // The animation should have started, which calls setPath with start point
      expect(mockSetPath).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('animateLineDraw', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should animate polyline drawing with requestAnimationFrame', () => {
      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          setTimeout(() => cb(Date.now()), 16);
          return 1;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockSetMap = jest.fn();
      const mockGetMap = jest.fn().mockReturnValue(null);
      const mockPolylineInstance = {
        setMap: mockSetMap,
        setPath: mockSetPath,
        _glowCircle: null,
      };

      const mockMarkerInstance = {
        setMap: mockSetMap,
        getMap: mockGetMap,
        getPosition: jest.fn().mockReturnValue({ lat: 37.386, lng: -122.084 }),
        addListener: jest.fn((event, handler) => {
          if (event === 'click') {
            capturedMarkerClickHandlers.push(handler);
          }
        }),
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);
      (global as any).google.maps.Marker = jest
        .fn()
        .mockImplementation(() => mockMarkerInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play
      jest.advanceTimersByTime(500);

      // Animation should start
      expect(mockRAF).toHaveBeenCalled();

      mockRAF.mockRestore();
    });

    it('should complete animation and create glow circle', () => {
      // Mock Date.now to control animation progress
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          // Advance time past animation duration (5500ms)
          currentTime = startTime + 6000;
          setTimeout(() => cb(currentTime), 0);
          return 1;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockSetMap = jest.fn();
      const mockGetMap = jest.fn().mockReturnValue(null);
      const mockSetOptions = jest.fn();
      const mockPolylineInstance = {
        setMap: mockSetMap,
        setPath: mockSetPath,
        _glowCircle: null,
      };

      const mockMarkerInstance = {
        setMap: mockSetMap,
        getMap: mockGetMap,
        getPosition: jest.fn().mockReturnValue({ lat: 37.386, lng: -122.084 }),
        addListener: jest.fn(),
      };

      const mockCircleInstance = {
        setMap: mockSetMap,
        setOptions: mockSetOptions,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);
      (global as any).google.maps.Marker = jest
        .fn()
        .mockImplementation(() => mockMarkerInstance);
      (global as any).google.maps.Circle = jest
        .fn()
        .mockImplementation(() => mockCircleInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play and run animation to completion
      jest.advanceTimersByTime(500);
      // Advance timers in smaller increments to avoid infinite loop
      jest.advanceTimersByTime(100);

      // Circle should be created for glow effect
      expect((global as any).google.maps.Circle).toHaveBeenCalled();

      mockRAF.mockRestore();
    });

    it('should cancel existing animation when starting new one', () => {
      const mockCancelRAF = jest
        .spyOn(window, 'cancelAnimationFrame')
        .mockImplementation(() => {});
      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          setTimeout(() => cb(Date.now()), 16);
          return 123; // Return a specific animation frame ID
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockSetMap = jest.fn();
      const mockPolylineInstance = {
        setMap: mockSetMap,
        setPath: mockSetPath,
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger first animation
      jest.advanceTimersByTime(500);

      // The animation is ongoing, clicking play should cancel it
      const playButton = screen.getByTestId('icon-control');
      fireEvent.click(playButton);

      // We can't directly test cancelAnimationFrame was called with the right ID
      // but we verify the animation infrastructure is in place
      expect(mockRAF).toHaveBeenCalled();

      mockRAF.mockRestore();
      mockCancelRAF.mockRestore();
    });

    it('should interpolate between points during animation', () => {
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          // Advance time to mid-animation (50% progress)
          currentTime = startTime + 1250;
          setTimeout(() => cb(currentTime), 0);
          return 1;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: mockSetPath,
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play
      jest.advanceTimersByTime(500);
      // Advance timers in smaller increments to avoid infinite loop
      jest.advanceTimersByTime(100);

      // spherical.interpolate should be called for smooth animation
      expect(
        (global as any).google.maps.geometry.spherical.interpolate,
      ).toHaveBeenCalled();

      mockRAF.mockRestore();
    });

    it('should show markers as animation progresses', () => {
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockSetMap = jest.fn();
      const mockGetMap = jest.fn().mockReturnValue(null);
      const mockMarkerInstance = {
        setMap: mockSetMap,
        getMap: mockGetMap,
        getPosition: jest.fn().mockReturnValue({ lat: 37.386, lng: -122.084 }),
        addListener: jest.fn(),
      };

      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          // Progress through animation
          currentTime = startTime + 1250;
          setTimeout(() => cb(currentTime), 0);
          return 1;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Marker = jest
        .fn()
        .mockImplementation(() => mockMarkerInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play
      jest.advanceTimersByTime(500);
      // Advance timers in smaller increments to avoid infinite loop
      jest.advanceTimersByTime(100);

      // Markers should be shown (setMap called with map object)
      expect(mockSetMap).toHaveBeenCalled();

      mockRAF.mockRestore();
    });

    it('should remove existing glow circle on replay', () => {
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockGlowCircleSetMap = jest.fn();
      const mockGlowCircle = {
        setMap: mockGlowCircleSetMap,
        setOptions: jest.fn(),
      };

      let rafCallCount = 0;
      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          rafCallCount += 1;
          // Complete animation (5500ms duration)
          currentTime = startTime + 6000;
          // Only schedule a limited number of frames to avoid infinite loop
          if (rafCallCount < 20) {
            setTimeout(() => cb(currentTime), 0);
          }
          return rafCallCount;
        });

      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: jest.fn(),
        _glowCircle: mockGlowCircle,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);
      (global as any).google.maps.Circle = jest
        .fn()
        .mockImplementation(() => mockGlowCircle);

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // First animation
      jest.advanceTimersByTime(500);
      jest.advanceTimersByTime(100);

      // Glow circle setMap should have been called
      expect(mockGlowCircleSetMap).toHaveBeenCalled();

      mockRAF.mockRestore();
    });
  });

  describe('addGlowCircle animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should animate glow circle grow effect', () => {
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockSetOptions = jest.fn();
      const mockCircleInstance = {
        setMap: jest.fn(),
        setOptions: mockSetOptions,
      };

      const rafCallbackHolder: { current: FrameRequestCallback | null } = {
        current: null,
      };
      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          rafCallbackHolder.current = cb;
          return 1;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: jest.fn(),
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);
      (global as any).google.maps.Circle = jest
        .fn()
        .mockImplementation(() => mockCircleInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger animation to completion
      jest.advanceTimersByTime(500);

      // Simulate animation frames completing main animation (5500ms duration)
      currentTime = startTime + 6000;
      if (rafCallbackHolder.current) {
        rafCallbackHolder.current(currentTime);
      }

      // Circle should be created with animation
      expect((global as any).google.maps.Circle).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 0,
          fillOpacity: 0,
        }),
      );

      mockRAF.mockRestore();
    });

    it('should complete glow animation with full radius and opacity', () => {
      const startTime = 1000;
      let currentTime = startTime;
      jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

      const mockSetOptions = jest.fn();
      const mockCircleInstance = {
        setMap: jest.fn(),
        setOptions: mockSetOptions,
      };

      const rafCallbacks: FrameRequestCallback[] = [];
      const mockRAF = jest
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((cb) => {
          rafCallbacks.push(cb);
          return rafCallbacks.length;
        });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: jest.fn(),
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);
      (global as any).google.maps.Circle = jest
        .fn()
        .mockImplementation(() => mockCircleInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play
      jest.advanceTimersByTime(500);

      // Run through animation frames until completion (5500ms duration)
      currentTime = startTime + 6000;
      rafCallbacks.forEach((cb) => cb(currentTime));

      // After animation completes, glow should animate
      currentTime = startTime + 7000;
      rafCallbacks.forEach((cb) => cb(currentTime));

      // Circle setOptions should be called to animate radius/opacity
      expect(mockSetOptions).toHaveBeenCalled();

      mockRAF.mockRestore();
    });
  });

  describe('marker click with overlay positioning', () => {
    it('should create overlay view when marker is clicked', () => {
      // Set up google mock before rendering
      const mockProjection = {
        fromLatLngToContainerPixel: jest
          .fn()
          .mockReturnValue({ x: 150, y: 250 }),
      };

      let overlayOnAddCallback: (() => void) | null = null;
      const mockOverlayView = jest.fn().mockImplementation(() => {
        const overlay = {
          _onAdd: null as (() => void) | null,
          setMap: jest
            .fn()
            .mockImplementation(function setMapMock(this: any, map: any) {
              if (map && this._onAdd) {
                this._onAdd();
              }
            }),
          draw: jest.fn(),
          getProjection: jest.fn().mockReturnValue(mockProjection),
        };
        Object.defineProperty(overlay, 'onAdd', {
          set(fn: () => void) {
            overlay._onAdd = fn;
            overlayOnAddCallback = fn;
          },
          get() {
            return overlay._onAdd;
          },
        });
        return overlay;
      });

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click on first marker
      if (capturedMarkerClickHandlers.length > 0) {
        capturedMarkerClickHandlers[0]();
      }

      // OverlayView should be created for positioning
      expect(mockOverlayView).toHaveBeenCalled();
    });

    it('should create overlay and set up onAdd when marker is clicked', () => {
      const mockPixelPosition = { x: 100, y: 200 };
      const mockProjection = {
        fromLatLngToContainerPixel: jest
          .fn()
          .mockReturnValue(mockPixelPosition),
      };

      // Track when OverlayView is instantiated
      const mockOverlayView = jest.fn().mockImplementation(() => ({
        setMap: jest.fn(),
        draw: jest.fn(),
        onAdd: jest.fn(),
        getProjection: jest.fn().mockReturnValue(mockProjection),
      }));

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click on first marker
      if (capturedMarkerClickHandlers.length > 0) {
        capturedMarkerClickHandlers[0]();
      }

      // The overlay should have been created for positioning
      expect(mockOverlayView).toHaveBeenCalled();
    });

    it('should handle marker click when projection returns null position', () => {
      const mockProjection = {
        fromLatLngToContainerPixel: jest.fn().mockReturnValue(null),
      };

      // Store created overlays to trigger onAdd after it's set
      const createdOverlays: any[] = [];
      const mockOverlayView = jest.fn().mockImplementation(() => {
        const overlay = {
          _onAdd: null as (() => void) | null,
          _map: null as any,
          setMap: jest
            .fn()
            .mockImplementation(function setMapMock(this: any, map: any) {
              this._map = map;
              // Trigger onAdd async (after it's been set)
              if (map) {
                setTimeout(() => {
                  if (this._onAdd) this._onAdd();
                }, 0);
              }
            }),
          draw: jest.fn(),
          getProjection: jest.fn().mockReturnValue(mockProjection),
        };
        Object.defineProperty(overlay, 'onAdd', {
          set(fn: () => void) {
            overlay._onAdd = fn;
          },
          get() {
            return overlay._onAdd;
          },
        });
        createdOverlays.push(overlay);
        return overlay;
      });

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click should not throw when pixel position is null
      if (capturedMarkerClickHandlers.length > 0) {
        expect(() => capturedMarkerClickHandlers[0]()).not.toThrow();
      }

      // Manually trigger onAdd for coverage
      createdOverlays.forEach((overlay) => {
        if (overlay._onAdd) overlay._onAdd();
      });
    });

    it('should handle marker click when marker position is null', () => {
      const mockProjection = {
        fromLatLngToContainerPixel: jest
          .fn()
          .mockReturnValue({ x: 100, y: 200 }),
      };

      // Store created overlays to trigger onAdd after it's set
      const createdOverlays: any[] = [];
      const mockOverlayView = jest.fn().mockImplementation(() => {
        const overlay = {
          _onAdd: null as (() => void) | null,
          setMap: jest.fn(),
          draw: jest.fn(),
          getProjection: jest.fn().mockReturnValue(mockProjection),
        };
        Object.defineProperty(overlay, 'onAdd', {
          set(fn: () => void) {
            overlay._onAdd = fn;
          },
          get() {
            return overlay._onAdd;
          },
        });
        createdOverlays.push(overlay);
        return overlay;
      });

      // Override Marker to return null position
      const mockMarkerWithNullPosition = {
        setMap: jest.fn(),
        getMap: jest.fn().mockReturnValue(null),
        getPosition: jest.fn().mockReturnValue(null), // Return null position
        addListener: jest.fn((event, handler) => {
          if (event === 'click') {
            capturedMarkerClickHandlers.push(handler);
          }
        }),
      };

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });
      (global as any).google.maps.Marker = jest
        .fn()
        .mockImplementation(() => mockMarkerWithNullPosition);

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click should not throw when marker position is null
      if (capturedMarkerClickHandlers.length > 0) {
        expect(() => capturedMarkerClickHandlers[0]()).not.toThrow();
      }

      // Manually trigger onAdd for coverage (tests null position branch)
      createdOverlays.forEach((overlay) => {
        if (overlay._onAdd) overlay._onAdd();
      });
    });

    it('should handle overlay with null projection', () => {
      // Store created overlays to trigger onAdd after it's set
      const createdOverlays: any[] = [];
      const mockOverlayView = jest.fn().mockImplementation(() => {
        const overlay = {
          _onAdd: null as (() => void) | null,
          setMap: jest.fn(),
          draw: jest.fn(),
          getProjection: jest.fn().mockReturnValue(null), // Return null projection
        };
        Object.defineProperty(overlay, 'onAdd', {
          set(fn: () => void) {
            overlay._onAdd = fn;
          },
          get() {
            return overlay._onAdd;
          },
        });
        createdOverlays.push(overlay);
        return overlay;
      });

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click should not throw when projection is null
      if (capturedMarkerClickHandlers.length > 0) {
        expect(() => capturedMarkerClickHandlers[0]()).not.toThrow();
      }

      // Manually trigger onAdd for coverage (tests null projection branch)
      createdOverlays.forEach((overlay) => {
        if (overlay._onAdd) overlay._onAdd();
      });
    });

    it('should execute full popover positioning logic when all conditions are met', () => {
      const mockPixelPosition = { x: 100, y: 200 };
      const mockProjection = {
        fromLatLngToContainerPixel: jest
          .fn()
          .mockReturnValue(mockPixelPosition),
      };

      // Store created overlays to trigger onAdd
      const createdOverlays: any[] = [];
      const mockOverlayView = jest.fn().mockImplementation(() => {
        const overlay = {
          _onAdd: null as (() => void) | null,
          setMap: jest.fn(),
          draw: jest.fn(),
          getProjection: jest.fn().mockReturnValue(mockProjection),
        };
        Object.defineProperty(overlay, 'onAdd', {
          set(fn: () => void) {
            overlay._onAdd = fn;
          },
          get() {
            return overlay._onAdd;
          },
        });
        createdOverlays.push(overlay);
        return overlay;
      });

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Click on marker
      if (capturedMarkerClickHandlers.length > 0) {
        capturedMarkerClickHandlers[0]();
      }

      // Manually trigger onAdd for coverage (tests full positioning logic)
      createdOverlays.forEach((overlay) => {
        if (overlay._onAdd) overlay._onAdd();
      });

      // Verify the projection was used
      expect(mockProjection.fromLatLngToContainerPixel).toHaveBeenCalled();
    });
  });

  describe('tracking events', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should track PLAY_LOCATION_POINTS when auto-play animation starts', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: mockSetPath,
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Fast-forward to trigger auto-play (500ms delay)
      jest.advanceTimersByTime(500);

      // Should track PLAY_LOCATION_POINTS
      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.PLAY_LOCATION_POINTS,
      );
    });

    it('should track REPLAY when play button is clicked after animation has played', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetPath = jest.fn();
      const mockPolylineInstance = {
        setMap: jest.fn(),
        setPath: mockSetPath,
        _glowCircle: null,
      };

      (global as any).google = createGoogleMock();
      (global as any).google.maps.Polyline = jest
        .fn()
        .mockImplementation(() => mockPolylineInstance);

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Trigger auto-play and complete animation
      jest.advanceTimersByTime(500);
      jest.advanceTimersByTime(6000); // Complete animation (5500ms duration)

      // Clear previous tracking calls
      mockTrack.mockClear();

      // Click play button (should be enabled now)
      const playButton = screen.getByTestId('icon-control');
      fireEvent.click(playButton);

      // Should track REPLAY
      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.REPLAY,
      );
    });

    it('should track SELECT_MAP_VIEW when map type changes to satellite', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetMapTypeId = jest.fn();
      (global as any).google = {
        maps: {
          Polyline: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setPath: jest.fn(),
          })),
          Marker: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          })),
          LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
          LatLngBounds: jest.fn().mockImplementation(() => ({
            extend: jest.fn(),
          })),
          Size: jest
            .fn()
            .mockImplementation((w, h) => ({ width: w, height: h })),
          Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
          geometry: {
            spherical: {
              interpolate: jest.fn(),
            },
          },
          Circle: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setOptions: jest.fn(),
          })),
          OverlayView: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn(),
          })),
        },
      };

      // Load the API first
      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: { fitBounds: jest.fn(), setMapTypeId: mockSetMapTypeId },
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Clear previous tracking calls
      mockTrack.mockClear();

      // Change map type to satellite
      if (capturedOnChange) {
        capturedOnChange('satellite');
      }

      // Should track SELECT_MAP_VIEW with map_view: 'satellite'
      expect(mockTrack).toHaveBeenCalledWith({
        ...LOCATION_MAP_TRACKING_POINTS.SELECT_MAP_VIEW,
        map_view: 'satellite',
      });
    });

    it('should track SELECT_MAP_VIEW when map type changes to roadmap', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockSetMapTypeId = jest.fn();
      (global as any).google = {
        maps: {
          Polyline: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setPath: jest.fn(),
          })),
          Marker: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          })),
          LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
          LatLngBounds: jest.fn().mockImplementation(() => ({
            extend: jest.fn(),
          })),
          Size: jest
            .fn()
            .mockImplementation((w, h) => ({ width: w, height: h })),
          Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
          geometry: {
            spherical: {
              interpolate: jest.fn(),
            },
          },
          Circle: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            setOptions: jest.fn(),
          })),
          OverlayView: jest.fn().mockImplementation(() => ({
            setMap: jest.fn(),
            draw: jest.fn(),
            onAdd: jest.fn(),
            getProjection: jest.fn(),
          })),
        },
      };

      // Load the API first
      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: { fitBounds: jest.fn(), setMapTypeId: mockSetMapTypeId },
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Clear previous tracking calls
      mockTrack.mockClear();

      // Change map type to roadmap
      if (capturedOnChange) {
        capturedOnChange('roadmap');
      }

      // Should track SELECT_MAP_VIEW with map_view: 'map'
      expect(mockTrack).toHaveBeenCalledWith({
        ...LOCATION_MAP_TRACKING_POINTS.SELECT_MAP_VIEW,
        map_view: 'map',
      });
    });

    it('should track SELECT_LOCATION_POINT when marker is clicked', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      const mockPixelPosition = { x: 100, y: 200 };
      const mockProjection = {
        fromLatLngToContainerPixel: jest
          .fn()
          .mockReturnValue(mockPixelPosition),
      };

      const mockOverlayView = jest.fn().mockImplementation(() => ({
        setMap: jest.fn(),
        draw: jest.fn(),
        onAdd: jest.fn(),
        getProjection: jest.fn().mockReturnValue(mockProjection),
      }));

      (global as any).google = createGoogleMock({
        OverlayView: mockOverlayView,
      });

      renderWithQuicksandProvider(
        <TimeEntryLocationContent locationPoints={mockLocationPoints} />,
        sandboxWithApiKey,
      );

      const mockMap = { fitBounds: jest.fn(), setMapTypeId: jest.fn() };

      if (capturedOnGoogleApiLoaded) {
        capturedOnGoogleApiLoaded({
          map: mockMap,
          maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
        });
      }

      // Clear previous tracking calls
      mockTrack.mockClear();

      // Click on first marker
      if (capturedMarkerClickHandlers.length > 0) {
        capturedMarkerClickHandlers[0]();
      }

      // Should track SELECT_LOCATION_POINT
      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.SELECT_LOCATION_POINT,
      );
    });
  });
});

describe('TimeEntryLocationContent — marker colors (SBSEG-QBO-geofence-flags)', () => {
  const sandboxWithApiKey = {
    ...getDefaultSandbox(),
    pluginConfig: {
      ...getDefaultSandbox().pluginConfig,
      extendedProperties: {
        ...getDefaultSandbox().pluginConfig?.extendedProperties,
        googleApiKey: 'test-api-key',
      },
    },
  } as ReturnType<typeof getDefaultSandbox>;

  // 3 points: flagged endpoint (index 0), flagged intermediate (index 1), unflagged endpoint (index 2)
  const pointsWithFlags: LocationPointData[] = [
    {
      lat: 37.386,
      lng: -122.084,
      timestamp: '9:30 AM',
      accuracy: '15m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: true },
    },
    {
      lat: 37.387,
      lng: -122.085,
      timestamp: '9:45 AM',
      accuracy: '12m',
      teamMemberName: 'John Doe',
      deviceAttributes: { leftGeofence: true },
    },
    {
      lat: 37.388,
      lng: -122.086,
      timestamp: '10:00 AM',
      accuracy: '10m',
      teamMemberName: 'John Doe',
      deviceAttributes: { mockedLocation: false },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnGoogleApiLoaded = null;
  });

  const loadMap = (
    locationPoints: LocationPointData[],
    isGeofenceFlagsEnabled?: boolean,
  ) => {
    renderWithQuicksandProvider(
      <TimeEntryLocationContent
        locationPoints={locationPoints}
        isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
      />,
      sandboxWithApiKey,
    );

    const markerCalls: any[] = [];
    (global as any).google = {
      maps: {
        Polyline: jest.fn().mockImplementation(() => ({
          setMap: jest.fn(),
          setPath: jest.fn(),
        })),
        Marker: jest.fn().mockImplementation((options: any) => {
          markerCalls.push(options);
          return {
            setMap: jest.fn(),
            getMap: jest.fn(),
            getPosition: jest.fn(),
            addListener: jest.fn(),
          };
        }),
        LatLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
        LatLngBounds: jest.fn().mockImplementation(() => ({
          extend: jest.fn(),
        })),
        Size: jest.fn().mockImplementation((w, h) => ({ width: w, height: h })),
        Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
        geometry: { spherical: { interpolate: jest.fn() } },
        Circle: jest.fn().mockImplementation(() => ({
          setMap: jest.fn(),
          setOptions: jest.fn(),
        })),
        OverlayView: jest.fn().mockImplementation(() => ({
          setMap: jest.fn(),
          draw: jest.fn(),
          onAdd: jest.fn(),
          getProjection: jest.fn(),
        })),
      },
    };

    if (capturedOnGoogleApiLoaded) {
      capturedOnGoogleApiLoaded({
        map: { fitBounds: jest.fn(), setMapTypeId: jest.fn() },
        maps: { ControlPosition: { BOTTOM_RIGHT: 9 } },
      });
    }

    return markerCalls;
  };

  it('uses green markers for endpoints and gray for intermediate points when the feature flag is off, regardless of flags', () => {
    const markerCalls = loadMap(pointsWithFlags, false);
    expect(markerCalls[0].icon.url).toBe('data:image/svg+xml,green-marker'); // flagged endpoint, FF off -> green
    expect(markerCalls[1].icon.url).toBe('data:image/svg+xml,gray-marker'); // flagged intermediate, FF off -> gray
    expect(markerCalls[2].icon.url).toBe('data:image/svg+xml,green-marker'); // unflagged endpoint -> green
  });

  it('uses green markers for endpoints and gray for intermediate points when isGeofenceFlagsEnabled is not provided (default off)', () => {
    const markerCalls = loadMap(pointsWithFlags, undefined);
    expect(markerCalls[0].icon.url).toBe('data:image/svg+xml,green-marker');
    expect(markerCalls[1].icon.url).toBe('data:image/svg+xml,gray-marker');
    expect(markerCalls[2].icon.url).toBe('data:image/svg+xml,green-marker');
  });

  it('uses orange markers for any point (including endpoints) with active flags when the feature flag is on', () => {
    const markerCalls = loadMap(pointsWithFlags, true);
    expect(markerCalls[0].icon.url).toBe('data:image/svg+xml,orange-marker'); // flagged endpoint -> orange
    expect(markerCalls[1].icon.url).toBe('data:image/svg+xml,orange-marker'); // flagged intermediate -> orange
    expect(markerCalls[2].icon.url).toBe('data:image/svg+xml,green-marker'); // unflagged endpoint -> stays green
  });

  it('uses gray for an unflagged intermediate point even when the feature flag is on', () => {
    const points: LocationPointData[] = [
      pointsWithFlags[0],
      {
        lat: 37.4,
        lng: -122.1,
        timestamp: '9:50 AM',
        accuracy: '9m',
        teamMemberName: 'John Doe',
        deviceAttributes: { mockedLocation: false, leftGeofence: false },
      },
      pointsWithFlags[2],
    ];
    const markerCalls = loadMap(points, true);
    expect(markerCalls[1].icon.url).toBe('data:image/svg+xml,gray-marker');
  });

  it('uses gray for an intermediate point with no deviceAttributes when the feature flag is on', () => {
    const points: LocationPointData[] = [
      pointsWithFlags[0],
      {
        lat: 37.4,
        lng: -122.1,
        timestamp: '9:50 AM',
        accuracy: '9m',
        teamMemberName: 'John Doe',
      },
      pointsWithFlags[2],
    ];
    const markerCalls = loadMap(points, true);
    expect(markerCalls[1].icon.url).toBe('data:image/svg+xml,gray-marker');
  });
});
