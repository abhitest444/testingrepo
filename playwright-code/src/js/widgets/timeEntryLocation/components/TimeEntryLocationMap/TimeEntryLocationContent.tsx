import React, { useRef, useState, useCallback, useEffect } from 'react';
import GoogleMapReact, { Maps } from 'google-map-react';
import { useSandbox, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import Toggle from '@qbds/toggle';
import { MapPin, PlayNoCircle } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { B2 } from '@ids-ts/typography';
import { TimeTracking_LocationTrackingType } from 'src/__generated__/timeTracking/graphql';
import {
  getGreenMarkerUrl,
  getGrayMarkerUrl,
  getOrangeMarkerUrl,
} from '../styles/common.styles';
import { LocationPointData } from '../types';
import { hasActiveDeviceFlags } from '../../utils/locationPointUtils';
import LocationPointPopover from './LocationPointPopover';
import { LOCATION_MAP_TRACKING_POINTS } from '../../utils/locationMapTrackingPoints';
import {
  TIMESHEET_MAP_STYLES,
  ZOOM_DEFAULT,
  US_CENTER,
  MAP_TOGGLE_OPTIONS,
  getMapViewForTracking,
  type MapType,
  ZOOM_MAX,
} from '../../utils/constants';

interface TimeEntryLocationContentProps {
  /** Pre-formatted location points with timezone-adjusted timestamps */
  locationPoints: LocationPointData[];
  /** Location tracking effective value from unified user settings */
  locationSettings?: TimeTracking_LocationTrackingType | null;
  /** Whether the SBSEG-QBO-geofence-flags feature flag is enabled */
  isGeofenceFlagsEnabled?: boolean;
}

// Styled components
const MapWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const MapHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const HeaderIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;

  /* Fix for Google Maps control buttons getting distorted */
  button.gm-control-active {
    min-width: 40px;

    &:focus {
      box-shadow: none;
    }
  }
`;

const MapToggleContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
`;

const RetryButtonContainer = styled.div`
  position: absolute;
  left: 16px;
  bottom: 24px;
  z-index: 10;

  /* to style the IconControl button within */
  button {
    background: #2ca01c !important;
    transition: background 0.2s, opacity 0.2s;

    &:hover:not(:disabled) {
      background: #248a17 !important;
    }

    &:disabled {
      opacity: 0.8 !important;
    }
  }
`;

// Hidden anchor element for positioning the IDS Popover
const PopoverAnchor = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  pointer-events: none;
  z-index: 100;
`;

const GLOW_RADIUS = 150;
const GLOW_OPACITY = 0.1;

// Create marker icon - uses SVG data URLs from common styles
// Any point (including endpoints) turns orange when it has an active device/geofence flag;
// otherwise endpoints are green and intermediate points are gray.
const createMarkerIcon = (
  isEndpoint: boolean,
  hasFlags: boolean,
): google.maps.Icon => {
  let url = getGrayMarkerUrl();
  if (hasFlags) {
    url = getOrangeMarkerUrl();
  } else if (isEndpoint) {
    url = getGreenMarkerUrl();
  }

  return {
    url,
    scaledSize: new google.maps.Size(26, 26),
    anchor: new google.maps.Point(13, 12),
  };
};

// Helper to create glow effect circle on map with grow-from-center animation
const addGlowCircle = (
  map: google.maps.Map,
  center: { lat: number; lng: number },
  targetRadius: number,
  targetOpacity: number,
): google.maps.Circle => {
  const circle = new google.maps.Circle({
    center,
    radius: 0, // Start from center (0 radius)
    fillColor: '#00892E',
    fillOpacity: 0, // Start invisible
    strokeColor: 'transparent',
    strokeWeight: 0,
    map,
    zIndex: 0,
  });

  // Animate grow from center + fade-in
  const animationDuration = 600; // 0.6 seconds
  const startTime = Date.now();

  const animateGrow = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    // Ease-out curve for smooth deceleration
    const easeOut = 1 - (1 - progress) ** 3;

    circle.setOptions({
      radius: targetRadius * easeOut,
      fillOpacity: targetOpacity * easeOut,
    });

    if (progress < 1) {
      requestAnimationFrame(animateGrow);
    }
  };

  requestAnimationFrame(animateGrow);
  return circle;
};

const TimeEntryLocationContent: React.FC<TimeEntryLocationContentProps> = ({
  locationPoints,
  locationSettings,
  isGeofenceFlagsEnabled,
}) => {
  const sandbox = useSandbox();
  const track = useTracking();
  const googleApiKey = sandbox?.pluginConfig?.extendedProperties
    ?.googleApiKey as string;

  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const popoverAnchorRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Store glow circle on polyline ref to avoid extra ref
  const getGlowCircle = () =>
    (polylineRef.current as any)?._glowCircle as google.maps.Circle | undefined;
  const setGlowCircle = (circle: google.maps.Circle | null) => {
    if (polylineRef.current) {
      (polylineRef.current as any)._glowCircle = circle;
    }
  };

  const [mapType, setMapType] = useState<MapType>('roadmap');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<LocationPointData | null>(
    null,
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Handle marker click - position anchor and show popover
  const handleMarkerClick = useCallback(
    (point: LocationPointData, marker: google.maps.Marker) => {
      if (
        !mapRef.current ||
        !mapContainerRef.current ||
        !popoverAnchorRef.current
      )
        return;

      // Track location point selection
      track(LOCATION_MAP_TRACKING_POINTS.SELECT_LOCATION_POINT);

      // Get the marker's pixel position on screen
      const overlay = new google.maps.OverlayView();
      overlay.setMap(mapRef.current);
      overlay.draw = () => {};
      overlay.onAdd = () => {
        const projection = overlay.getProjection();
        if (projection) {
          const position = marker.getPosition();
          if (position) {
            const pixelPosition =
              projection.fromLatLngToContainerPixel(position);
            if (pixelPosition && popoverAnchorRef.current) {
              // Position the anchor element at the marker's screen position
              popoverAnchorRef.current.style.left = `${pixelPosition.x}px`;
              popoverAnchorRef.current.style.top = `${pixelPosition.y}px`;

              setSelectedPoint(point);
              setIsPopoverOpen(true);
            }
          }
        }
        overlay.setMap(null);
      };
    },
    [track],
  );

  // Close popover
  const handlePopoverClose = useCallback(() => {
    setIsPopoverOpen(false);
    setSelectedPoint(null);
  }, []);

  // Animate the polyline drawing using native Google Maps spherical.interpolate
  const animateLineDraw = useCallback(() => {
    if (!polylineRef.current || !mapRef.current) return;

    // Track replay if this is not the first auto-play
    if (hasPlayed) {
      track(LOCATION_MAP_TRACKING_POINTS.REPLAY);
    }

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Remove existing glow circle for replay
    const existingGlow = getGlowCircle();
    if (existingGlow) {
      existingGlow.setMap(null);
      setGlowCircle(null);
    }

    setIsPlaying(true);

    // Hide all markers initially (except start)
    markersRef.current.forEach((marker, index) => {
      if (index > 0) marker.setMap(null);
    });

    // Reset polyline to start point only
    const startLatLng = new google.maps.LatLng(
      locationPoints[0].lat,
      locationPoints[0].lng,
    );
    polylineRef.current.setPath([startLatLng]);

    const map = mapRef.current;
    const points = locationPoints;
    const totalPoints = points.length;
    const animationDuration = 5500; // 5.5 seconds -> matches animation timing with Tsheet TE map
    const startTime = Date.now();

    // Convert points to LatLng objects for spherical.interpolate
    const latLngPoints = points.map(
      (p) => new google.maps.LatLng(p.lat, p.lng),
    );

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Calculate current position along the path
      const exactPosition = progress * (totalPoints - 1);
      const currentPointIndex = Math.floor(exactPosition);
      const segmentProgress = exactPosition - currentPointIndex;

      // Build the path up to current position
      const currentPath: google.maps.LatLng[] = [];

      // Add all completed points
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i <= currentPointIndex && i < totalPoints; i++) {
        currentPath.push(latLngPoints[i]);
      }

      // Use spherical.interpolate for smooth geodesic animation between points
      if (currentPointIndex < totalPoints - 1 && segmentProgress > 0) {
        const fromLatLng = latLngPoints[currentPointIndex];
        const toLatLng = latLngPoints[currentPointIndex + 1];

        // Native Google Maps interpolation (follows Earth's curvature)
        const interpolatedLatLng = google.maps.geometry.spherical.interpolate(
          fromLatLng,
          toLatLng,
          segmentProgress,
        );
        currentPath.push(interpolatedLatLng);
      }

      // Update polyline path
      polylineRef.current?.setPath(currentPath);

      // Show markers as the line reaches them
      markersRef.current.forEach((marker, index) => {
        if (index <= currentPointIndex && !marker.getMap()) {
          marker.setMap(map);
        }
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - ensure all markers are visible
        markersRef.current.forEach((marker) => {
          if (!marker.getMap()) marker.setMap(map);
        });

        // Add glow circle around the end point when animation completes
        const endPoint = points[points.length - 1];
        setGlowCircle(
          addGlowCircle(
            map,
            { lat: endPoint.lat, lng: endPoint.lng },
            GLOW_RADIUS,
            GLOW_OPACITY,
          ),
        );

        setIsPlaying(false);
        setHasPlayed(true);
      }
    };

    animate();
  }, [locationPoints, hasPlayed, track]);

  // Draw polyline and markers when Google Maps API loads
  const handleApiLoaded = useCallback(
    ({ map }: { map: google.maps.Map; maps: Maps }) => {
      mapRef.current = map;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Clear existing polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Only render markers and polylines if there are location points
      if (locationPoints.length === 0) {
        return;
      }

      // Create polyline path
      const path = locationPoints.map((point) => ({
        lat: point.lat,
        lng: point.lng,
      }));

      // Create polyline with the full path
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#2ca01c',
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      polylineRef.current.setMap(map);

      // Create markers for each location point
      locationPoints.forEach((point, index) => {
        const isStart = index === 0;
        const isEnd = index === locationPoints.length - 1;
        const isEndpoint = isStart || isEnd;
        const hasFlags = hasActiveDeviceFlags(
          point.deviceAttributes,
          isGeofenceFlagsEnabled,
        );
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          icon: createMarkerIcon(isEndpoint, hasFlags),
          title: point.timestamp,
          zIndex: isEndpoint ? 10 : 1,
        });

        // Handle marker click to show IDS Popover
        marker.addListener('click', () => {
          handleMarkerClick(point, marker);
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all points
      const bounds = new google.maps.LatLngBounds();
      locationPoints.forEach((point) => {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng));
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

      // Auto-play animation on first load after a short delay
      if (!hasAutoPlayedRef.current) {
        hasAutoPlayedRef.current = true;
        track(LOCATION_MAP_TRACKING_POINTS.PLAY_LOCATION_POINTS);
        animateLineDraw();
      }
    },
    [
      locationPoints,
      animateLineDraw,
      handleMarkerClick,
      track,
      isGeofenceFlagsEnabled,
    ],
  );

  // Handle map type toggle
  const handleMapTypeChange = (value: string) => {
    const newType = value as MapType;
    setMapType(newType);
    if (mapRef.current) {
      mapRef.current.setMapTypeId(newType);
    }
    // Track map view selection with map_view parameter
    track({
      ...LOCATION_MAP_TRACKING_POINTS.SELECT_MAP_VIEW,
      map_view: getMapViewForTracking(newType),
    });
  };

  if (!googleApiKey) {
    return null;
  }

  // Use first location point if available, otherwise use US center
  const hasLocationPoints = locationPoints.length > 0;
  const defaultCenter = hasLocationPoints ? locationPoints[0] : US_CENTER;

  return (
    <MapWrapper>
      {/* Header */}
      <MapHeader>
        <HeaderIcon>
          <MapPin />
        </HeaderIcon>
        <B2 weight="demi">Location points tracked</B2>
      </MapHeader>

      {/* Map */}
      <MapContainer ref={mapContainerRef}>
        {/* Map/Satellite Toggle */}
        <MapToggleContainer>
          <Toggle
            groupLabel="Map type"
            options={MAP_TOGGLE_OPTIONS}
            defaultValue={mapType}
            overrideValue={mapType}
            variant="label-only"
            size="mini"
            onChange={handleMapTypeChange}
          />
        </MapToggleContainer>

        {/* Retry Animation Button - only show if there are location points, disabled while playing or before first play, enabled after animation completes */}
        {hasLocationPoints && (
          <RetryButtonContainer>
            <IconControl
              complementary
              aria-label="Play route"
              label=""
              labelAlignment="right"
              onClick={animateLineDraw}
              shape="circle"
              size="large"
              disabled={isPlaying || !hasPlayed}
            >
              <PlayNoCircle />
            </IconControl>
          </RetryButtonContainer>
        )}

        <GoogleMapReact
          bootstrapURLKeys={{ key: googleApiKey, libraries: ['geometry'] }}
          defaultCenter={defaultCenter}
          defaultZoom={ZOOM_DEFAULT}
          onGoogleApiLoaded={handleApiLoaded}
          yesIWantToUseGoogleMapApiInternals
          style={{ overflow: 'hidden' }}
          options={(maps: Maps) => ({
            maxZoom: ZOOM_MAX,
            fullscreenControlOptions: {
              position: maps.ControlPosition.BOTTOM_RIGHT,
            },
            rotateControl: false,
            // Ensure place labels and POIs are visible for timesheet verification
            clickableIcons: true,
            // Essential labels for map view (see TIMESHEET_MAP_STYLES constant for details)
            styles: TIMESHEET_MAP_STYLES,
          })}
        />

        {/* Hidden anchor for IDS Popover positioning */}
        <PopoverAnchor ref={popoverAnchorRef} />

        {/* IDS Popover for location point details */}
        <LocationPointPopover
          point={selectedPoint}
          isOpen={isPopoverOpen}
          onClose={handlePopoverClose}
          targetElement={popoverAnchorRef.current}
          locationSettings={locationSettings}
          isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
        />
      </MapContainer>
    </MapWrapper>
  );
};

export default TimeEntryLocationContent;
