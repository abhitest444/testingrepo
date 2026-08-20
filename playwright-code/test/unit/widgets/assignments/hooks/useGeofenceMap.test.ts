import { renderHook, act } from '@testing-library/react-hooks';
import { useGeofenceCircle } from 'src/js/widgets/assignments/hooks/useGeofenceMap';
import { GEOFENCE_ACCENT_COLOR } from 'src/js/widgets/assignments/constants';

const GEOFENCE_PIN_COLOR = '#ea4335';

const mockSetMap = jest.fn();
const mockSetRadius = jest.fn();

const mockCircleInstance = { setMap: mockSetMap, setRadius: mockSetRadius };
const MockCircle = jest.fn().mockImplementation(() => mockCircleInstance);

const mockPinElement = { element: document.createElement('div') };
const MockPinElement = jest.fn().mockImplementation(() => mockPinElement);

let mockMarkerInstances: Array<{
  map: any;
  position: any;
  content: any;
  title: string;
}>;

const MockAdvancedMarkerElement = jest.fn().mockImplementation((opts) => {
  const instance = { ...opts };
  mockMarkerInstances.push(instance);
  return instance;
});

const setupGoogleMock = () => {
  mockMarkerInstances = [];

  (global as any).google = {
    maps: {
      Circle: MockCircle,
      importLibrary: jest.fn().mockResolvedValue({
        PinElement: MockPinElement,
        AdvancedMarkerElement: MockAdvancedMarkerElement,
      }),
    },
  };
};

describe('useGeofenceCircle', () => {
  const defaultCenter = { lat: 40.7128, lng: -74.006 };
  const defaultRadius = 200;
  const mockMap = {} as google.maps.Map;

  beforeEach(() => {
    jest.clearAllMocks();
    setupGoogleMock();
  });

  afterEach(() => {
    delete (global as any).google;
  });

  it('should not create circle or marker when mapInstance is null', () => {
    renderHook(() =>
      useGeofenceCircle({
        mapInstance: null,
        center: defaultCenter,
        radius: defaultRadius,
      }),
    );

    expect(MockCircle).not.toHaveBeenCalled();
    expect((global as any).google.maps.importLibrary).not.toHaveBeenCalled();
  });

  it('should not create circle or marker when center is null', () => {
    renderHook(() =>
      useGeofenceCircle({
        mapInstance: mockMap,
        center: null,
        radius: defaultRadius,
      }),
    );

    expect(MockCircle).not.toHaveBeenCalled();
    expect((global as any).google.maps.importLibrary).not.toHaveBeenCalled();
  });

  it('should create circle with correct options when map and center are provided', () => {
    renderHook(() =>
      useGeofenceCircle({
        mapInstance: mockMap,
        center: defaultCenter,
        radius: defaultRadius,
      }),
    );

    expect(MockCircle).toHaveBeenCalledWith({
      map: mockMap,
      center: defaultCenter,
      radius: defaultRadius,
      strokeColor: GEOFENCE_ACCENT_COLOR,
      strokeOpacity: 0.5,
      strokeWeight: 1.5,
      fillColor: GEOFENCE_ACCENT_COLOR,
      fillOpacity: 0.1,
    });
  });

  it('should create an AdvancedMarkerElement at the center', async () => {
    renderHook(() =>
      useGeofenceCircle({
        mapInstance: mockMap,
        center: defaultCenter,
        radius: defaultRadius,
      }),
    );

    await act(async () => {
      await flushPromises();
    });

    expect((global as any).google.maps.importLibrary).toHaveBeenCalledWith(
      'marker',
    );
    expect(MockPinElement).toHaveBeenCalledWith({
      background: GEOFENCE_PIN_COLOR,
      borderColor: '#c5221f',
    });
    expect(MockAdvancedMarkerElement).toHaveBeenCalledWith({
      map: mockMap,
      position: defaultCenter,
      content: mockPinElement.element,
      title: 'Geofence center',
    });
  });

  it('should update only the circle radius when radius changes', async () => {
    const { rerender } = renderHook(
      ({ radius }) =>
        useGeofenceCircle({
          mapInstance: mockMap,
          center: defaultCenter,
          radius,
        }),
      { initialProps: { radius: 200 } },
    );

    await act(async () => {
      await flushPromises();
    });

    MockCircle.mockClear();
    mockSetRadius.mockClear();

    rerender({ radius: 500 });

    expect(MockCircle).not.toHaveBeenCalled();
    expect(mockSetRadius).toHaveBeenCalledWith(500);
  });

  it('should not recreate circle or marker when only radius changes', async () => {
    const { rerender } = renderHook(
      ({ radius }) =>
        useGeofenceCircle({
          mapInstance: mockMap,
          center: defaultCenter,
          radius,
        }),
      { initialProps: { radius: 100 } },
    );

    await act(async () => {
      await flushPromises();
    });

    const initialCircleCallCount = MockCircle.mock.calls.length;
    const initialMarkerCallCount = MockAdvancedMarkerElement.mock.calls.length;

    rerender({ radius: 300 });
    rerender({ radius: 600 });

    expect(MockCircle).toHaveBeenCalledTimes(initialCircleCallCount);
    expect(MockAdvancedMarkerElement).toHaveBeenCalledTimes(
      initialMarkerCallCount,
    );
  });

  it('should clean up circle and marker on unmount', async () => {
    const { unmount } = renderHook(() =>
      useGeofenceCircle({
        mapInstance: mockMap,
        center: defaultCenter,
        radius: defaultRadius,
      }),
    );

    await act(async () => {
      await flushPromises();
    });

    expect(mockMarkerInstances).toHaveLength(1);
    const markerInstance = mockMarkerInstances[0];

    unmount();

    expect(mockSetMap).toHaveBeenCalledWith(null);
    expect(markerInstance.map).toBeNull();
  });

  it('should clean up old circle and marker when center changes', async () => {
    const { rerender } = renderHook(
      ({ center }) =>
        useGeofenceCircle({
          mapInstance: mockMap,
          center,
          radius: defaultRadius,
        }),
      {
        initialProps: {
          center: defaultCenter as { lat: number; lng: number } | null,
        },
      },
    );

    await act(async () => {
      await flushPromises();
    });

    const firstMarker = mockMarkerInstances[0];
    mockSetMap.mockClear();
    MockCircle.mockClear();

    const newCenter = { lat: 34.0522, lng: -118.2437 };

    await act(async () => {
      rerender({ center: newCenter });
      await flushPromises();
    });

    expect(mockSetMap).toHaveBeenCalledWith(null);
    expect(firstMarker.map).toBeNull();
    expect(MockCircle).toHaveBeenCalledWith(
      expect.objectContaining({ center: newCenter }),
    );
  });

  it('should clean up old circle and marker when mapInstance changes', async () => {
    const map1 = {} as google.maps.Map;
    const map2 = {} as google.maps.Map;

    const { rerender } = renderHook(
      ({ mapInstance }) =>
        useGeofenceCircle({
          mapInstance,
          center: defaultCenter,
          radius: defaultRadius,
        }),
      { initialProps: { mapInstance: map1 as google.maps.Map | null } },
    );

    await act(async () => {
      await flushPromises();
    });

    const firstMarker = mockMarkerInstances[0];
    mockSetMap.mockClear();
    MockCircle.mockClear();

    await act(async () => {
      rerender({ mapInstance: map2 });
      await flushPromises();
    });

    expect(mockSetMap).toHaveBeenCalledWith(null);
    expect(firstMarker.map).toBeNull();
    expect(MockCircle).toHaveBeenCalledWith(
      expect.objectContaining({ map: map2 }),
    );
  });

  it('should cancel pending marker creation if effect re-runs before library loads', async () => {
    let resolveImport: (value: any) => void;
    (global as any).google.maps.importLibrary = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );

    const { rerender } = renderHook(
      ({ center }) =>
        useGeofenceCircle({
          mapInstance: mockMap,
          center,
          radius: defaultRadius,
        }),
      {
        initialProps: {
          center: defaultCenter as { lat: number; lng: number } | null,
        },
      },
    );

    rerender({ center: null });

    await act(async () => {
      resolveImport!({
        PinElement: MockPinElement,
        AdvancedMarkerElement: MockAdvancedMarkerElement,
      });
      await flushPromises();
    });

    expect(MockAdvancedMarkerElement).not.toHaveBeenCalled();
  });

  it('should use current radius ref when recreating circle on center change', async () => {
    const { rerender } = renderHook(
      ({ center, radius }) =>
        useGeofenceCircle({ mapInstance: mockMap, center, radius }),
      {
        initialProps: {
          center: defaultCenter as { lat: number; lng: number } | null,
          radius: 200,
        },
      },
    );

    await act(async () => {
      await flushPromises();
    });

    MockCircle.mockClear();

    const newCenter = { lat: 51.5074, lng: -0.1278 };

    await act(async () => {
      rerender({ center: newCenter, radius: 750 });
      await flushPromises();
    });

    expect(MockCircle).toHaveBeenCalledWith(
      expect.objectContaining({ radius: 750, center: newCenter }),
    );
  });

  it('should clean up marker created after cancellation', async () => {
    let resolveImport: (value: any) => void;
    (global as any).google.maps.importLibrary = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );

    const { unmount } = renderHook(() =>
      useGeofenceCircle({
        mapInstance: mockMap,
        center: defaultCenter,
        radius: defaultRadius,
      }),
    );

    unmount();

    await act(async () => {
      resolveImport!({
        PinElement: MockPinElement,
        AdvancedMarkerElement: MockAdvancedMarkerElement,
      });
      await flushPromises();
    });

    if (mockMarkerInstances.length > 0) {
      expect(mockMarkerInstances[0].map).toBeNull();
    }
  });
});

function flushPromises() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
