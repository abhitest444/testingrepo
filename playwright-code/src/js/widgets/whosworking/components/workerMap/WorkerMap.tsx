import React, { useRef, useState, useEffect, useCallback } from 'react';
import useSuperCluster from 'use-supercluster';
import { PointFeature, ClusterProperties } from 'supercluster';
import GoogleMapReact, { Maps, fitBounds, NESWBounds } from 'google-map-react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { B2 } from '@ids-ts/typography';
import { IconControl } from '@ids-ts/icon-control';
import Toggle from '@qbds/toggle';
import { Refresh } from '@design-systems/icons';
import {
  US_CENTER,
  ZOOM_DEFAULT,
  ZOOM_SINGLE_WORKER,
  ZOOM_MAX,
  CLUSTER_RADIUS_PIXELS,
} from '../../constants/mapConstants';
import { WorkerMarker } from './WorkerMarker';
import { WorkerClusterMarker } from './WorkerClusterMarker';
import {
  transformWorkerToGeoJSON,
  WorkerGeoJSONProperties,
} from '../../utils/geoJsonUtils';
import {
  WhoIsWorkingWorkerNode,
  WhoIsWorkingSummary,
} from '../../hooks/useWhoIsWorkingLoadMore';
import {
  WorkerMapContainer,
  MapContainer,
  MapToggleContainer,
  MapHeaderContainer,
  MapHeader,
  MapStatsContainer,
  HeaderImage,
  ClockedInMarker,
  ClockedInCountContainer,
  StyledIconControl,
} from './WorkerMap.styled';
import { useWhosWorkingTrackingPoints } from '../../hooks/useWhosWorkingTrackingPoints';

interface WorkerMapProps {
  workers: WhoIsWorkingWorkerNode[];
  loading?: boolean;
  selectedWorkerId?: string;
  onSelectWorker?: (workerId: string) => void;
  summary?: WhoIsWorkingSummary | null;
  onRefresh?: () => void;
}

interface WorkerMapHeaderProps {
  onTheClockCount?: number;
  totalWorkers?: number;
  onRefresh?: () => void;
}

interface MapProps {
  workers: WhoIsWorkingWorkerNode[];
  selectedWorkerId: string;
  onSelectWorker: (workerId: string) => void;
}

interface GoogleMapBounds {
  center: { lat: number; lng: number };
  zoom: number;
}

// Cluster configuration
const clusterOptions = {
  radius: CLUSTER_RADIUS_PIXELS,
  maxZoom: ZOOM_MAX,
  // Map function: Extract properties to aggregate
  map: (props: any) => ({
    isSelected: props.isSelected,
  }),
  // Reduce function: Aggregate properties across clustered workers
  reduce: (accumulatedProps: any, props: any) => {
    if (props.isSelected) {
      accumulatedProps.isSelected = props.isSelected;
    }
    return accumulatedProps;
  },
};

/**
 * Convert NESWBounds to supercluster bounds format
 * @param bounds NESWBounds from google-map-react
 * @returns [west, south, east, north] for supercluster
 */
const neswBoundsToSuperclusterBounds = (
  bounds: NESWBounds | undefined,
): [number, number, number, number] => [
  bounds?.sw.lng ?? 0,
  bounds?.sw.lat ?? 0,
  bounds?.ne.lng ?? 0,
  bounds?.ne.lat ?? 0,
];

const defaultMapBounds = {
  center: US_CENTER,
  zoom: ZOOM_DEFAULT,
};

/**
 * Calculate map bounds to fit all workers with GPS
 * Logic referenced from timecapture-whos-working-ui
 */
const getMapBounds = (
  workersWithGPS: WhoIsWorkingWorkerNode[],
  container: HTMLDivElement | null,
  defaultZoom: number,
): GoogleMapBounds => {
  if (workersWithGPS.length === 0) {
    return defaultMapBounds;
  }

  if (workersWithGPS.length === 1) {
    const location = workersWithGPS[0].currentLocation;
    return {
      center: {
        lat: location!.latitude,
        lng: location!.longitude,
      },
      zoom: ZOOM_SINGLE_WORKER,
    };
  }

  // Multiple workers - calculate bounds
  const latLngBounds = new google.maps.LatLngBounds();
  workersWithGPS.forEach((worker) => {
    const { latitude, longitude } = worker.currentLocation!;
    latLngBounds.extend(new google.maps.LatLng(latitude, longitude));
  });

  const neswBounds = {
    ne: latLngBounds.getNorthEast().toJSON(),
    sw: latLngBounds.getSouthWest().toJSON(),
  };

  const mapSize = {
    width: container?.clientWidth ?? 1,
    height: container?.clientHeight ?? 1,
  };

  return fitBounds(neswBounds, mapSize);
};

/**
 * Worker Map Component
 * Displays interactive map with worker locations
 * Includes clustering logic referenced from timecapture-whos-working-ui
 */
export const WorkerMap: React.FC<WorkerMapProps> = ({
  workers,
  loading = false,
  selectedWorkerId = '',
  onSelectWorker,
  summary,
  onRefresh,
}) => {
  // Filter workers with active time entry AND GPS locations
  // Only show markers for workers currently on the clock with location data
  const workersWithGPS = workers.filter(
    (worker) =>
      worker.activeTimeEntry &&
      worker.currentLocation &&
      worker.currentLocation.latitude &&
      worker.currentLocation.longitude,
  );

  // Use summary from API if available, otherwise calculate from workers array
  const totalOnClock =
    summary?.totalOnClock ?? workers.filter((w) => w.activeTimeEntry).length;
  const totalWorkers = summary?.totalWorkers ?? workers.length;

  const handleSelectWorker = (workerId: string) => {
    if (onSelectWorker) {
      onSelectWorker(workerId);
    }
  };

  return (
    <WorkerMapContainer>
      <WorkerMapHeader
        onTheClockCount={totalOnClock}
        totalWorkers={totalWorkers}
        onRefresh={onRefresh}
      />
      <Map
        workers={workersWithGPS}
        selectedWorkerId={selectedWorkerId}
        onSelectWorker={handleSelectWorker}
      />
    </WorkerMapContainer>
  );
};

const WorkerMapHeader: React.FC<WorkerMapHeaderProps> = ({
  onTheClockCount = 0,
  totalWorkers = 0,
  onRefresh,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();

  const handleRefreshClick = () => {
    track(trackingPoints.REFRESH);
    onRefresh?.();
  };

  return (
    <MapHeaderContainer>
      <MapHeader>
        <HeaderImage />
        <B2 weight="demi">
          {intl.formatMessage({ id: 'whosWorking.map.title' })}
        </B2>
      </MapHeader>
      <MapStatsContainer>
        <ClockedInMarker />
        <ClockedInCountContainer>
          {intl.formatMessage(
            { id: 'whosWorking.map.onClock' },
            { count: onTheClockCount, total: totalWorkers },
          )}
        </ClockedInCountContainer>
        <StyledIconControl
          onClick={handleRefreshClick}
          aria-label={intl.formatMessage({ id: 'whosWorking.map.refresh' })}
        >
          <Refresh />
        </StyledIconControl>
      </MapStatsContainer>
    </MapHeaderContainer>
  );
};

/**
 * Map Component with Clustering
 * Referenced from timecapture-whos-working-ui implementation
 */
const Map: React.FC<MapProps> = ({
  workers,
  selectedWorkerId,
  onSelectWorker,
}) => {
  const sandbox = useSandbox();
  const track = useTracking();
  const trackingPoints = useWhosWorkingTrackingPoints();
  const googleApiKey = sandbox?.pluginConfig?.extendedProperties
    ?.googleApiKey as string;
  const intl = useIntl();

  // Store map instance and container references
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [googleMapsApi, setGoogleMapsApi] = useState<Maps | undefined>();
  const [neswBounds, setNESWBounds] = useState<NESWBounds>();

  // Transform workers to GeoJSON points for clustering
  const workerPoints = workers.map((worker) =>
    transformWorkerToGeoJSON(worker, selectedWorkerId),
  );

  // Calculate initial map bounds based on workers
  // Use worker-aware defaults even before Google Maps API loads for faster initial render
  const getInitialBounds = (): GoogleMapBounds => {
    // If 1 worker, use their location with street-level zoom even before API loads
    if (workers.length === 1 && workers[0].currentLocation) {
      return {
        center: {
          lat: workers[0].currentLocation.latitude,
          lng: workers[0].currentLocation.longitude,
        },
        zoom: ZOOM_SINGLE_WORKER,
      };
    }

    return defaultMapBounds;
  };

  const { center, zoom } = googleMapsApi
    ? getMapBounds(
        workers,
        mapContainerRef.current,
        mapRef.current?.getZoom() ?? ZOOM_DEFAULT,
      )
    : getInitialBounds();

  // Setup clustering with supercluster
  const superClusterBounds = neswBoundsToSuperclusterBounds(neswBounds);
  const { clusters, supercluster } = useSuperCluster({
    points: workerPoints,
    bounds: superClusterBounds,
    zoom: mapRef.current?.getZoom() ?? ZOOM_DEFAULT,
    options: clusterOptions,
  });

  // Handler when Google API loads
  const handleApiLoaded = ({
    map,
    maps,
  }: {
    map: google.maps.Map;
    maps: Maps;
  }) => {
    mapRef.current = map;
    setGoogleMapsApi(maps);
  };

  // Track map changes (zoom, pan)
  const handleMapChange = ({ bounds }: { bounds: NESWBounds }) => {
    setNESWBounds(bounds);
  };

  // Handler for cluster clicks - zoom in to expand
  const handleClusterClick = (cluster: PointFeature<ClusterProperties>) => {
    track(trackingPoints.MAP_CLUSTER_CLICK);
    const expansionZoom = Math.min(
      supercluster?.getClusterExpansionZoom(Number(cluster.id)) ?? ZOOM_MAX,
      ZOOM_MAX,
    );
    mapRef.current?.setZoom(expansionZoom);
    mapRef.current?.panTo({
      lng: cluster.geometry.coordinates[0],
      lat: cluster.geometry.coordinates[1],
    });
  };

  /**
   * Focus map on a specific worker or fit all workers
   * Used by both marker clicks and external selection changes (e.g., from list)
   */
  const focusOnWorker = useCallback(
    (workerId: string) => {
      if (!mapRef.current) return;

      if (workerId) {
        // Selecting a worker - pan and zoom to their location
        const selectedWorker = workers.find(
          (w) => w.timeForContactDAS?.id === workerId,
        );
        if (selectedWorker?.currentLocation) {
          mapRef.current.panTo({
            lat: selectedWorker.currentLocation.latitude,
            lng: selectedWorker.currentLocation.longitude,
          });
          mapRef.current.setZoom(ZOOM_SINGLE_WORKER);
        }
      } else {
        // Deselecting - fit map to show all workers
        const { center: allWorkersCenter, zoom: allWorkersZoom } = getMapBounds(
          workers,
          mapContainerRef.current,
          ZOOM_DEFAULT,
        );
        mapRef.current.panTo(allWorkersCenter);
        mapRef.current.setZoom(allWorkersZoom);
      }
    },
    [workers],
  );

  // React to selectedWorkerId changes from parent (e.g., clicking map icon in list)
  useEffect(() => {
    focusOnWorker(selectedWorkerId);
  }, [selectedWorkerId, focusOnWorker]);

  // Handler for worker selection from map marker click
  const handleWorkerSelect = (workerId: string) => {
    const newWorkerId = workerId === selectedWorkerId ? '' : workerId;
    onSelectWorker(newWorkerId);
  };

  // Create options function that has access to google at runtime
  const createMapOptions = (maps: Maps) => ({
    mapTypeControl: false,
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: maps.ControlPosition.BOTTOM_RIGHT,
    },
  });

  // Handler to switch map type programmatically
  const handleMapTypeChange = (type: 'roadmap' | 'satellite') => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(type);
      setMapType(type);
    }
  };

  const mapToggleOptions = [
    {
      label: intl.formatMessage({ id: 'whosWorking.map.type.map' }),
      value: 'roadmap',
    },
    {
      label: intl.formatMessage({ id: 'whosWorking.map.type.satellite' }),
      value: 'satellite',
    },
  ];

  const handleToggleChange = (value: string) => {
    track({
      ...trackingPoints.MAP_VIEW_TOGGLE,
      map_view: value,
    });
    handleMapTypeChange(value as 'roadmap' | 'satellite');
  };
  return googleApiKey ? (
    <MapContainer ref={mapContainerRef}>
      <MapToggleContainer>
        <Toggle
          groupLabel={intl.formatMessage({
            id: 'whosWorking.map.type.ariaLabel',
          })}
          options={mapToggleOptions}
          defaultValue={mapType}
          overrideValue={mapType}
          variant="label-only"
          size="mini"
          onChange={handleToggleChange}
        />
      </MapToggleContainer>
      <GoogleMapReact
        bootstrapURLKeys={{ key: googleApiKey }}
        defaultCenter={US_CENTER}
        defaultZoom={ZOOM_DEFAULT}
        center={center}
        zoom={zoom}
        style={{ overflow: 'hidden' }}
        options={createMapOptions}
        onChange={handleMapChange}
        onGoogleApiLoaded={handleApiLoaded}
        yesIWantToUseGoogleMapApiInternals
      >
        {/* Render clusters or individual markers */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } =
            cluster.properties as any;

          if (isCluster) {
            return (
              <WorkerClusterMarker
                key={`cluster-${cluster.id}`}
                cluster={cluster as PointFeature<ClusterProperties>}
                count={pointCount}
                lat={latitude}
                lng={longitude}
                isSelected={(cluster.properties as any).isSelected}
                onClusterClick={handleClusterClick}
              />
            );
          }

          const { workerDetails } =
            cluster.properties as WorkerGeoJSONProperties;
          return (
            <WorkerMarker
              key={
                workerDetails.timeForContactDAS?.id || workerDetails.displayName
              }
              worker={workerDetails}
              lat={latitude}
              lng={longitude}
              isSelected={
                workerDetails.timeForContactDAS?.id === selectedWorkerId
              }
              onSelect={handleWorkerSelect}
            />
          );
        })}
      </GoogleMapReact>
    </MapContainer>
  ) : null;
};
