import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GeofenceLocationFields from 'src/js/widgets/assignments/components/CustomerAssignments/components/GeofenceLocationFields';
import {
  GEOFENCE_RADIUS,
  DEFAULT_MAP_CENTER,
} from 'src/js/widgets/assignments/constants';
import { GEOFENCE_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';

// ── Mutable mock state ──────────────────────────────────────────────────────

let sliceState = {
  selectedPlace: null as any,
  addressInput: '',
  predictions: [] as any[],
  radiusSearchText: null as string | null,
  mapReady: false,
  addressError: false,
  radiusError: false,
  radius: GEOFENCE_RADIUS.DEFAULT as number,
};

const mockDispatch = jest.fn();

jest.mock('src/js/widgets/assignments/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (sel: (s: any) => any) =>
    sel({ geofenceLocationSearch: sliceState }),
}));

let sandboxCfg: any = {
  pluginConfig: { extendedProperties: { googleApiKey: 'test-key' } },
};

const mockTrack = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useSandbox: () => sandboxCfg,
  useTracking: () => mockTrack,
}));

const mockLoadRadius = jest.fn();
let radiusData: any = null;
let radiusLoading = false;

jest.mock('src/js/service/hooks/assignments/useGeofenceRadius', () => ({
  useGeofenceRadius: () => ({
    data: radiusData,
    loading: radiusLoading,
    loadGeofenceRadius: mockLoadRadius,
  }),
}));

const mockCircleHook = jest.fn();
jest.mock('src/js/widgets/assignments/hooks/useGeofenceMap', () => ({
  useGeofenceCircle: (a: any) => mockCircleHook(a),
}));

// ── UI mocks ────────────────────────────────────────────────────────────────

jest.mock('src/js/widgets/assignments/styles/GeofenceDrawer.styled', () => ({
  FieldSection: ({ children }: any) => (
    <div data-testid="field-section">{children}</div>
  ),
  RadiusLabel: ({ children }: any) => (
    <span data-testid="radius-label">{children}</span>
  ),
  MapPlaceholder: ({ children, 'data-testid': tid }: any) => (
    <div data-testid={tid}>{children}</div>
  ),
  GeofenceMapHost: ({ children, 'data-visible': vis }: any) => (
    <div data-visible={vis}>{children}</div>
  ),
  GeofenceMapSpinnerOverlay: ({ children, 'data-testid': tid }: any) => (
    <div data-testid={tid}>{children}</div>
  ),
}));

jest.mock('@ids-ts/loader', () => ({
  Activity: () => <div data-testid="activity-loader" />,
}));

jest.mock('@ids-ts/dropdown-typeahead', () => {
  const Mock = ({
    label,
    onSearch,
    onChange,
    onBlur,
    dataSource,
    inputValue,
    validationError,
    errorText,
  }: any) => {
    const id = label ? 'address' : 'radius';
    return (
      <div data-testid={`dropdown-${id}`}>
        <input
          data-testid={`input-${id}`}
          value={inputValue || ''}
          onChange={onSearch}
          onBlur={onBlur}
          readOnly={!onSearch}
        />
        {validationError && (
          <span data-testid={`error-${id}`}>{errorText}</span>
        )}
        <ul>
          {dataSource?.map((item: any) => (
            <li key={item.value} data-testid={`item-${id}-${item.value}`}>
              <button
                type="button"
                data-testid={`btn-${id}-${item.value}`}
                onClick={() => onChange({ target: { value: item.value } })}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return {
    __esModule: true,
    default: Mock,
    MenuItem: ({ children }: any) => <span>{children}</span>,
  };
});

let capturedApiLoaded: ((a: { map: any }) => void) | null = null;

jest.mock('google-map-react', () => ({
  __esModule: true,
  default: ({ onGoogleApiLoaded, center, zoom }: any) => {
    capturedApiLoaded = onGoogleApiLoaded;
    return (
      <div
        data-testid="google-map"
        data-center-lat={center?.lat}
        data-center-lng={center?.lng}
        data-zoom={zoom}
      />
    );
  },
}));

// ── Google Maps global stubs ────────────────────────────────────────────────

const mockGetPredictions = jest.fn();
const mockGetDetails = jest.fn();
const mockGeocode = jest.fn();

beforeAll(() => {
  (global as any).google = {
    maps: {
      places: {
        AutocompleteService: jest.fn(() => ({
          getPlacePredictions: mockGetPredictions,
        })),
        PlacesService: jest.fn(() => ({
          getDetails: mockGetDetails,
        })),
        PlacesServiceStatus: { OK: 'OK' },
      },
      Geocoder: jest.fn(() => ({
        geocode: mockGeocode,
      })),
      GeocoderStatus: { OK: 'OK' },
      Map: jest.fn(),
    },
  };
});

afterAll(() => {
  delete (global as any).google;
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const makeProps = (overrides: Record<string, any> = {}) => ({
  addressValue: '',
  initialMapCenter: { lat: 40.7128, lng: -74.006 },
  geofenceCoordinatesSaved: false,
  ...overrides,
});

const resetAll = () => {
  sliceState = {
    selectedPlace: null,
    addressInput: '',
    predictions: [],
    radiusSearchText: null,
    mapReady: false,
    addressError: false,
    radiusError: false,
    radius: GEOFENCE_RADIUS.DEFAULT,
  };
  radiusData = null;
  radiusLoading = false;
  sandboxCfg = {
    pluginConfig: { extendedProperties: { googleApiKey: 'test-key' } },
  };
  capturedApiLoaded = null;
};

const loadApi = () => act(() => capturedApiLoaded!({ map: {} as any }));

const dispatched = (type: string) =>
  mockDispatch.mock.calls
    .map(([a]: any) => a)
    .filter((a: any) => a?.type === type);

// ─────────────────────────────────────────────────────────────────────────────

describe('GeofenceLocationFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAll();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('returns null when googleApiKey is unavailable', () => {
    sandboxCfg = { pluginConfig: { extendedProperties: {} } };
    const { container } = render(<GeofenceLocationFields {...makeProps()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all field elements when API key is present', () => {
    render(<GeofenceLocationFields {...makeProps()} />);
    [
      'field-section',
      'dropdown-address',
      'dropdown-radius',
      'geofence-map-container',
      'google-map',
    ].forEach((tid) => {
      expect(screen.getByTestId(tid)).toBeInTheDocument();
    });
    expect(screen.getByTestId('radius-label')).toHaveTextContent(
      'assignments.geofence.drawer.radiusLabel',
    );
  });

  // ── Loading overlay ───────────────────────────────────────────────────────

  it.each([
    { mapReady: false, loading: false, visible: true, when: 'map not ready' },
    { mapReady: true, loading: true, visible: true, when: 'radius loading' },
    {
      mapReady: true,
      loading: false,
      visible: false,
      when: 'map ready & radius idle',
    },
  ])(
    'loading overlay visible=$visible when $when',
    ({ mapReady, loading, visible }) => {
      sliceState.mapReady = mapReady;
      radiusLoading = loading;
      render(<GeofenceLocationFields {...makeProps()} />);
      const el = screen.queryByTestId('map-loading-overlay');
      if (visible) {
        expect(el).toBeInTheDocument();
      } else {
        expect(el).not.toBeInTheDocument();
      }
    },
  );

  // ── Map center & geofence circle ──────────────────────────────────────────

  const PLACE = {
    placeId: 'p1',
    lat: 51.5,
    lng: -0.13,
    address: 'London',
    label: 'London',
    addressComponents: [],
  };

  it.each([
    {
      desc: 'default (no place, no saved coords)',
      place: null,
      saved: false,
      init: { lat: 40, lng: -74 },
      lat: DEFAULT_MAP_CENTER.lat,
      lng: DEFAULT_MAP_CENTER.lng,
      zoom: 4,
      circle: null,
    },
    {
      desc: 'selected place',
      place: PLACE,
      saved: false,
      init: { lat: 40, lng: -74 },
      lat: 51.5,
      lng: -0.13,
      zoom: 15,
      circle: { lat: 51.5, lng: -0.13 },
    },
    {
      desc: 'saved geofence coords (no place)',
      place: null,
      saved: true,
      init: { lat: 48.86, lng: 2.35 },
      lat: 48.86,
      lng: 2.35,
      zoom: 15,
      circle: { lat: 48.86, lng: 2.35 },
    },
    {
      desc: 'place takes precedence over saved coords',
      place: PLACE,
      saved: true,
      init: { lat: 48.86, lng: 2.35 },
      lat: 51.5,
      lng: -0.13,
      zoom: 15,
      circle: { lat: 51.5, lng: -0.13 },
    },
  ])(
    'map center & circle: $desc',
    ({ place, saved, init, lat, lng, zoom, circle }) => {
      sliceState.selectedPlace = place;
      render(
        <GeofenceLocationFields
          {...makeProps({
            geofenceCoordinatesSaved: saved,
            initialMapCenter: init,
          })}
        />,
      );
      const map = screen.getByTestId('google-map');
      expect(map).toHaveAttribute('data-center-lat', String(lat));
      expect(map).toHaveAttribute('data-center-lng', String(lng));
      expect(map).toHaveAttribute('data-zoom', String(zoom));
      expect(mockCircleHook).toHaveBeenCalledWith(
        expect.objectContaining({ center: circle }),
      );
    },
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  it('initialises addressInput on mount when addressValue is provided', () => {
    render(
      <GeofenceLocationFields
        {...makeProps({ addressValue: '123 Main St' })}
      />,
    );
    expect(dispatched('geofenceLocationSearch/setAddressInput')).toHaveLength(
      1,
    );
  });

  it('skips addressInput init when already populated', () => {
    sliceState.addressInput = 'existing';
    render(
      <GeofenceLocationFields
        {...makeProps({ addressValue: '123 Main St' })}
      />,
    );
    expect(dispatched('geofenceLocationSearch/setAddressInput')).toHaveLength(
      0,
    );
  });

  it('dispatches clearSelectedPlace on unmount', () => {
    const { unmount } = render(<GeofenceLocationFields {...makeProps()} />);
    mockDispatch.mockClear();
    unmount();
    expect(
      dispatched('geofenceLocationSearch/clearSelectedPlace'),
    ).toHaveLength(1);
  });

  // ── Radius from API ───────────────────────────────────────────────────────

  it('dispatches setRadius when API radius arrives', () => {
    radiusData = { geofenceRadiusInMeter: 500 };
    render(<GeofenceLocationFields {...makeProps()} />);
    expect(dispatched('geofenceLocationSearch/setRadius')).toContainEqual(
      expect.objectContaining({ payload: 500 }),
    );
  });

  it('does not dispatch setRadius when API radius is null', () => {
    render(<GeofenceLocationFields {...makeProps()} />);
    expect(dispatched('geofenceLocationSearch/setRadius')).toHaveLength(0);
  });

  // ── Google API loaded ─────────────────────────────────────────────────────

  it('sets map ready and initialises Google services on API load', () => {
    render(<GeofenceLocationFields {...makeProps()} />);
    loadApi();

    expect(dispatched('geofenceLocationSearch/setMapReady')[0]).toEqual(
      expect.objectContaining({ payload: true }),
    );
    const { places } = (global as any).google.maps;
    expect(places.AutocompleteService).toHaveBeenCalled();
    expect(places.PlacesService).toHaveBeenCalled();
  });

  // ── Address resolution on API load (reverse geocode) ───────────────────

  describe('Address resolution on API load', () => {
    it('calls geocoder when geofenceCoordinatesSaved and no savedPlace', () => {
      render(
        <GeofenceLocationFields
          {...makeProps({
            geofenceCoordinatesSaved: true,
            initialMapCenter: { lat: 40.7128, lng: -74.006 },
          })}
        />,
      );
      loadApi();
      expect(mockGeocode).toHaveBeenCalledWith(
        { location: { lat: 40.7128, lng: -74.006 } },
        expect.any(Function),
      );
    });

    it('does not call geocoder when savedPlace exists', () => {
      sliceState.selectedPlace = PLACE;
      render(
        <GeofenceLocationFields
          {...makeProps({ geofenceCoordinatesSaved: true })}
        />,
      );
      loadApi();
      expect(mockGeocode).not.toHaveBeenCalled();
    });

    it('does not call geocoder when geofenceCoordinatesSaved is false', () => {
      render(
        <GeofenceLocationFields
          {...makeProps({ addressValue: '123 Main St' })}
        />,
      );
      loadApi();
      expect(mockGeocode).not.toHaveBeenCalled();
    });

    it('dispatches setAddressError when no savedPlace and coordinates not saved', () => {
      render(
        <GeofenceLocationFields
          {...makeProps({ addressValue: '123 Main St' })}
        />,
      );
      loadApi();
      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('dispatches setAddressError when geocode returns non-OK status', () => {
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb(null, 'ZERO_RESULTS'),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({ geofenceCoordinatesSaved: true })}
        />,
      );
      loadApi();
      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('dispatches setAddressError when geocode returns empty results', () => {
      mockGeocode.mockImplementation((_: any, cb: any) => cb([], 'OK'));
      render(
        <GeofenceLocationFields
          {...makeProps({ geofenceCoordinatesSaved: true })}
        />,
      );
      loadApi();
      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('resolves placeId and fetches details on geocode success', () => {
      const geocoderComponents = [
        { long_name: 'New York', short_name: 'NY', types: ['locality'] },
      ];
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb(
          [{ place_id: 'resolved-p1', address_components: geocoderComponents }],
          'OK',
        ),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({ geofenceCoordinatesSaved: true })}
        />,
      );
      loadApi();

      expect(
        dispatched('geofenceLocationSearch/setResolvedPlaceId')[0],
      ).toEqual(expect.objectContaining({ payload: 'resolved-p1' }));
      expect(mockGetDetails).toHaveBeenCalledWith(
        {
          placeId: 'resolved-p1',
          fields: ['formatted_address', 'address_components'],
        },
        expect.any(Function),
      );
    });

    it('dispatches setSelectedPlace using initialMapCenter coords and geocoder addressComponents', () => {
      const geocoderComponents = [
        { long_name: 'New York', short_name: 'NY', types: ['locality'] },
      ];
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb(
          [{ place_id: 'resolved-p1', address_components: geocoderComponents }],
          'OK',
        ),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({
            addressValue: '123 Main St',
            geofenceCoordinatesSaved: true,
            initialMapCenter: { lat: 40.7128, lng: -74.006 },
          })}
        />,
      );
      loadApi();

      act(() => {
        mockGetDetails.mock.calls[0][1](
          {
            formatted_address: '123 Main St, Springfield',
            address_components: [
              { long_name: '123', short_name: '123', types: ['street_number'] },
            ],
          },
          'OK',
        );
      });

      expect(dispatched('geofenceLocationSearch/setSelectedPlace')[0]).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            placeId: 'resolved-p1',
            lat: 40.7128,
            lng: -74.006,
            address: '123 Main St, Springfield',
            label: '123 Main St',
            addressComponents: geocoderComponents,
          }),
        }),
      );
    });

    it('falls back to addressValue when formatted_address is empty', () => {
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb([{ place_id: 'resolved-p1', address_components: [] }], 'OK'),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({
            addressValue: '123 Main St',
            geofenceCoordinatesSaved: true,
          })}
        />,
      );
      loadApi();

      act(() => {
        mockGetDetails.mock.calls[0][1](
          { formatted_address: '', address_components: [] },
          'OK',
        );
      });

      expect(dispatched('geofenceLocationSearch/setSelectedPlace')[0]).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            address: '123 Main St',
            label: '123 Main St',
          }),
        }),
      );
    });

    it('dispatches setAddressError when getDetails returns non-OK status', () => {
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb([{ place_id: 'resolved-p1', address_components: [] }], 'OK'),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({
            addressValue: '123 Main St',
            geofenceCoordinatesSaved: true,
          })}
        />,
      );
      loadApi();
      mockDispatch.mockClear();

      act(() => {
        mockGetDetails.mock.calls[0][1](null, 'NOT_FOUND');
      });

      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('dispatches setAddressError when getDetails returns null place', () => {
      mockGeocode.mockImplementation((_: any, cb: any) =>
        cb([{ place_id: 'resolved-p1', address_components: [] }], 'OK'),
      );
      render(
        <GeofenceLocationFields
          {...makeProps({
            addressValue: '123 Main St',
            geofenceCoordinatesSaved: true,
          })}
        />,
      );
      loadApi();
      mockDispatch.mockClear();

      act(() => {
        mockGetDetails.mock.calls[0][1](null, 'OK');
      });

      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });
  });

  // ── Address search ────────────────────────────────────────────────────────

  describe('Address Search', () => {
    it('dispatches input value and clears addressError on typing', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: '742 Evergreen' },
      });
      expect(dispatched('geofenceLocationSearch/setAddressInput')[0]).toEqual(
        expect.objectContaining({ payload: '742 Evergreen' }),
      );
      expect(dispatched('geofenceLocationSearch/setAddressError')[0]).toEqual(
        expect.objectContaining({ payload: false }),
      );
    });

    it('clears predictions when query is blank or service is unavailable', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: 'hello' },
      });
      expect(dispatched('geofenceLocationSearch/setPredictions')[0]).toEqual(
        expect.objectContaining({ payload: [] }),
      );

      loadApi();
      mockDispatch.mockClear();
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: '   ' },
      });
      expect(dispatched('geofenceLocationSearch/setPredictions')[0]).toEqual(
        expect.objectContaining({ payload: [] }),
      );
    });

    it('tracks EDIT_GEOFENCE_ADDRESS once on first non-blank keystroke', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: 'A' },
      });
      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_ADDRESS,
      );

      mockTrack.mockClear();
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: 'AB' },
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_ADDRESS,
      );
    });

    it('does not track EDIT_GEOFENCE_ADDRESS when input is blank', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: '   ' },
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_ADDRESS,
      );
    });

    it('fetches and maps autocomplete predictions', () => {
      mockGetPredictions.mockImplementation((_: any, cb: any) => {
        cb(
          [
            { place_id: 'p1', description: '123 Main St' },
            { place_id: 'p2', description: '456 Oak Ave' },
          ],
          'OK',
        );
      });
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();
      mockDispatch.mockClear();

      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: '123' },
      });

      expect(mockGetPredictions).toHaveBeenCalledWith(
        { input: '123' },
        expect.any(Function),
      );
      expect(dispatched('geofenceLocationSearch/setPredictions')[0]).toEqual(
        expect.objectContaining({
          payload: [
            { value: 'p1', label: '123 Main St' },
            { value: 'p2', label: '456 Oak Ave' },
          ],
        }),
      );
    });

    it('dispatches empty predictions on non-OK autocomplete status', () => {
      mockGetPredictions.mockImplementation((_: any, cb: any) =>
        cb(null, 'ZERO_RESULTS'),
      );
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();
      mockDispatch.mockClear();

      fireEvent.change(screen.getByTestId('input-address'), {
        target: { value: 'zzz' },
      });
      expect(dispatched('geofenceLocationSearch/setPredictions')[0]).toEqual(
        expect.objectContaining({ payload: [] }),
      );
    });
  });

  // ── Address selection ─────────────────────────────────────────────────────

  describe('Address Selection', () => {
    it('fetches place details and dispatches selection with label', () => {
      sliceState.predictions = [{ value: 'place-123', label: '123 Main St' }];
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();

      fireEvent.click(screen.getByTestId('btn-address-place-123'));

      expect(mockLoadRadius).toHaveBeenCalledWith({
        input: { placeId: 'place-123' },
      });
      expect(mockGetDetails).toHaveBeenCalledWith(
        {
          placeId: 'place-123',
          fields: ['formatted_address', 'geometry', 'address_components'],
        },
        expect.any(Function),
      );

      act(() => {
        mockGetDetails.mock.calls[0][1](
          {
            formatted_address: '123 Main St, Springfield',
            geometry: {
              location: { lat: () => 39.78, lng: () => -89.65 },
            },
            address_components: [
              { long_name: '123', short_name: '123', types: ['street_number'] },
            ],
          },
          'OK',
        );
      });

      expect(dispatched('geofenceLocationSearch/setSelectedPlace')[0]).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            placeId: 'place-123',
            lat: 39.78,
            lng: -89.65,
            address: '123 Main St, Springfield',
            label: '123 Main St',
          }),
        }),
      );
    });

    it('falls back to prediction label when formatted_address is empty', () => {
      sliceState.predictions = [
        { value: 'place-123', label: 'Prediction Label' },
      ];
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();

      fireEvent.click(screen.getByTestId('btn-address-place-123'));
      act(() => {
        mockGetDetails.mock.calls[0][1](
          {
            formatted_address: '',
            geometry: { location: { lat: () => 0, lng: () => 0 } },
            address_components: [],
          },
          'OK',
        );
      });

      expect(dispatched('geofenceLocationSearch/setSelectedPlace')[0]).toEqual(
        expect.objectContaining({
          payload: expect.objectContaining({
            address: 'Prediction Label',
            label: 'Prediction Label',
          }),
        }),
      );
    });

    it('does not dispatch setSelectedPlace on non-OK status', () => {
      sliceState.predictions = [{ value: 'place-123', label: '123 Main St' }];
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();

      fireEvent.click(screen.getByTestId('btn-address-place-123'));
      mockDispatch.mockClear();
      act(() => mockGetDetails.mock.calls[0][1](null, 'NOT_FOUND'));

      expect(
        dispatched('geofenceLocationSearch/setSelectedPlace'),
      ).toHaveLength(0);
    });

    it('does not proceed when placeId is empty', () => {
      sliceState.predictions = [{ value: '', label: 'empty' }];
      render(<GeofenceLocationFields {...makeProps()} />);
      loadApi();

      fireEvent.click(screen.getByTestId('btn-address-'));
      expect(mockGetDetails).not.toHaveBeenCalled();
      expect(mockLoadRadius).not.toHaveBeenCalled();
    });
  });

  // ── Address blur ──────────────────────────────────────────────────────────

  describe('Address Blur', () => {
    it('flags error when typed input is unresolved', () => {
      sliceState.addressInput = 'partial address';
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.blur(screen.getByTestId('input-address'));

      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('resets input to saved place label when input is unchanged', () => {
      sliceState.addressInput = '123 Main St';
      sliceState.selectedPlace = {
        placeId: 'p1',
        lat: 0,
        lng: 0,
        address: '123 Main St, Full',
        label: '123 Main St',
        addressComponents: [],
      };
      render(
        <GeofenceLocationFields
          {...makeProps({ addressValue: '123 Main St' })}
        />,
      );
      mockDispatch.mockClear();
      fireEvent.blur(screen.getByTestId('input-address'));

      expect(dispatched('geofenceLocationSearch/setAddressInput')[0]).toEqual(
        expect.objectContaining({ payload: '123 Main St' }),
      );
    });

    it('flags error when input is blank', () => {
      sliceState.addressInput = '   ';
      render(<GeofenceLocationFields {...makeProps()} />);
      mockDispatch.mockClear();
      fireEvent.blur(screen.getByTestId('input-address'));

      expect(
        dispatched('geofenceLocationSearch/setAddressError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });
  });

  // ── Validation error display ──────────────────────────────────────────────

  describe('address error display', () => {
    it('shows required message when address input is empty', () => {
      sliceState.addressError = true;
      sliceState.addressInput = '';
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.getByTestId('error-address')).toHaveTextContent(
        'assignments.geofence.drawer.addressRequired',
      );
    });

    it('shows invalid message when address input is non-empty', () => {
      sliceState.addressError = true;
      sliceState.addressInput = 'partial text';
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.getByTestId('error-address')).toHaveTextContent(
        'assignments.geofence.drawer.invalidAddress',
      );
    });

    it('shows resolution error when input matches addressValue and no savedPlace', () => {
      sliceState.addressError = true;
      sliceState.addressInput = '123 Main St';
      sliceState.selectedPlace = null;
      render(
        <GeofenceLocationFields
          {...makeProps({ addressValue: '123 Main St' })}
        />,
      );
      expect(screen.getByTestId('error-address')).toHaveTextContent(
        'assignments.geofence.drawer.addressResolutionError',
      );
    });

    it('hidden when not flagged', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.queryByTestId('error-address')).not.toBeInTheDocument();
    });
  });

  describe('radius error display', () => {
    it('shows error text when flagged', () => {
      sliceState.radiusError = true;
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.getByTestId('error-radius')).toHaveTextContent(
        'assignments.geofence.drawer.invalidRadius',
      );
    });

    it('hidden when not flagged', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.queryByTestId('error-radius')).not.toBeInTheDocument();
    });
  });

  // ── Radius dropdown ───────────────────────────────────────────────────────

  describe('Radius Dropdown', () => {
    it('renders standard options and prepends non-standard radius', () => {
      sliceState.radius = 105;
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.getByTestId('item-radius-105')).toBeInTheDocument();
      expect(screen.getByTestId('item-radius-100')).toBeInTheDocument();
      expect(screen.getByTestId('item-radius-1000')).toBeInTheDocument();
    });

    it('filters options by search text', () => {
      sliceState.radiusSearchText = '1000';
      render(<GeofenceLocationFields {...makeProps()} />);
      expect(screen.getByTestId('item-radius-1000')).toBeInTheDocument();
      expect(screen.queryByTestId('item-radius-200')).not.toBeInTheDocument();
    });

    it('dispatches setRadius and clears error on selection', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.click(screen.getByTestId('btn-radius-200'));

      expect(dispatched('geofenceLocationSearch/setRadius')).toContainEqual(
        expect.objectContaining({ payload: 200 }),
      );
      expect(dispatched('geofenceLocationSearch/setRadiusError')[0]).toEqual(
        expect.objectContaining({ payload: false }),
      );
      expect(
        dispatched('geofenceLocationSearch/setRadiusSearchText')[0],
      ).toEqual(expect.objectContaining({ payload: null }));
    });
    it('tracks EDIT_GEOFENCE_RADIUS on selection', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.click(screen.getByTestId('btn-radius-200'));

      expect(mockTrack).toHaveBeenCalledWith(
        GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_RADIUS,
      );
    });
  });

  // ── Radius input ──────────────────────────────────────────────────────────

  describe('Radius Input', () => {
    it('dispatches search text and clears error on typing', () => {
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.change(screen.getByTestId('input-radius'), {
        target: { value: '50' },
      });
      expect(
        dispatched('geofenceLocationSearch/setRadiusSearchText')[0],
      ).toEqual(expect.objectContaining({ payload: '50' }));
      expect(dispatched('geofenceLocationSearch/setRadiusError')[0]).toEqual(
        expect.objectContaining({ payload: false }),
      );
    });

    it('flags error on blur when search text does not match any dropdown option', () => {
      sliceState.radiusSearchText = '999';
      render(<GeofenceLocationFields {...makeProps()} />);
      fireEvent.blur(screen.getByTestId('input-radius'));

      expect(
        dispatched('geofenceLocationSearch/setRadiusError'),
      ).toContainEqual(expect.objectContaining({ payload: true }));
    });

    it('auto-selects radius on blur when search text matches a dropdown option', () => {
      sliceState.radiusSearchText = '200';
      render(<GeofenceLocationFields {...makeProps()} />);
      mockDispatch.mockClear();
      fireEvent.blur(screen.getByTestId('input-radius'));

      expect(dispatched('geofenceLocationSearch/setRadius')).toContainEqual(
        expect.objectContaining({ payload: 200 }),
      );
      expect(
        dispatched('geofenceLocationSearch/setRadiusError'),
      ).toContainEqual(expect.objectContaining({ payload: false }));
      expect(
        dispatched('geofenceLocationSearch/setRadiusError').filter(
          (a: any) => a.payload === true,
        ),
      ).toHaveLength(0);
    });

    it.each([null, '', '   '])(
      'does not flag error on blur when search text is %j',
      (text) => {
        sliceState.radiusSearchText = text;
        render(<GeofenceLocationFields {...makeProps()} />);
        mockDispatch.mockClear();
        fireEvent.blur(screen.getByTestId('input-radius'));

        const errorDispatches = dispatched(
          'geofenceLocationSearch/setRadiusError',
        ).filter((a: any) => a.payload === true);
        expect(errorDispatches).toHaveLength(0);
      },
    );

    it('always dispatches setRadiusSearchText(null) on blur', () => {
      sliceState.radiusSearchText = '999';
      render(<GeofenceLocationFields {...makeProps()} />);
      mockDispatch.mockClear();
      fireEvent.blur(screen.getByTestId('input-radius'));

      expect(
        dispatched('geofenceLocationSearch/setRadiusSearchText'),
      ).toContainEqual(expect.objectContaining({ payload: null }));
    });
  });
});
