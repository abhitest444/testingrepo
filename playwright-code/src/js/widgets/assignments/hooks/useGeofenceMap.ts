import { useEffect, useRef } from 'react';
import { GEOFENCE_ACCENT_COLOR } from 'src/js/widgets/assignments/constants';

const GEOFENCE_PIN_COLOR = '#ea4335';

interface UseGeofenceCircleOptions {
  mapInstance: google.maps.Map | null;
  center: { lat: number; lng: number } | null;
  radius: number;
}

type AdvancedMarkerElement = google.maps.marker.AdvancedMarkerElement;

/**
 * Manages the lifecycle of a google.maps.Circle and a center AdvancedMarkerElement
 * on the geofence map. Recreates them when the map or center changes; updates
 * only the circle radius when radius changes (avoids unnecessary teardown).
 */
export const useGeofenceCircle = ({
  mapInstance,
  center,
  radius,
}: UseGeofenceCircleOptions): void => {
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markerRef = useRef<AdvancedMarkerElement | null>(null);
  // Keep radius in a ref so the creation effect reads the current value without
  // listing it as a dependency — radius-only updates are handled separately.
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  useEffect(() => {
    circleRef.current?.setMap(null);
    circleRef.current = null;
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = null;

    let cancelled = false;

    if (mapInstance && center) {
      circleRef.current = new google.maps.Circle({
        map: mapInstance,
        center,
        radius: radiusRef.current,
        strokeColor: GEOFENCE_ACCENT_COLOR,
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        fillColor: GEOFENCE_ACCENT_COLOR,
        fillOpacity: 0.1,
      });

      (async () => {
        const markerLib = (await google.maps.importLibrary(
          'marker',
        )) as google.maps.MarkerLibrary;
        if (cancelled || !mapInstance || !center) return;

        const { PinElement, AdvancedMarkerElement } = markerLib;
        const pin = new PinElement({
          background: GEOFENCE_PIN_COLOR,
          borderColor: '#c5221f',
        });
        const marker = new AdvancedMarkerElement({
          map: mapInstance,
          position: center,
          content: pin.element,
          title: 'Geofence center',
        });
        if (!cancelled) {
          markerRef.current = marker;
        } else {
          marker.map = null;
        }
      })();
    }

    return () => {
      cancelled = true;
      circleRef.current?.setMap(null);
      circleRef.current = null;
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [mapInstance, center]); // radius intentionally omitted — handled below

  useEffect(() => {
    circleRef.current?.setRadius(radius);
  }, [radius]);
};
