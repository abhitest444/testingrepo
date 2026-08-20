import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import {
  ReactEvent,
  OnChangeInfoType,
} from '@ids-ts/dropdown-typeahead/dist/types';
import GoogleMapReact from 'google-map-react';
import { Activity } from '@ids-ts/loader';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import {
  GEOFENCE_RADIUS,
  GEOFENCE_MAP_ID,
  DEFAULT_MAP_CENTER,
} from 'src/js/widgets/assignments/constants';
import {
  FieldSection,
  RadiusLabel,
  MapPlaceholder,
  GeofenceMapHost,
  GeofenceMapSpinnerOverlay,
} from 'src/js/widgets/assignments/styles/GeofenceDrawer.styled';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import {
  setSelectedPlace,
  clearSelectedPlace,
  setAddressInput,
  setPredictions,
  setRadiusSearchText,
  setMapReady,
  setAddressError,
  setRadiusError,
  setResolvedPlaceId,
  setRadius,
  selectSelectedPlace,
  selectAddressInput,
  selectPredictions,
  selectRadiusSearchText,
  selectMapReady,
  selectAddressError,
  selectRadiusError,
  selectRadius,
} from 'src/js/widgets/assignments/store/geofenceLocationSearchSlice';
import { useGeofenceCircle } from 'src/js/widgets/assignments/hooks/useGeofenceMap';
import { useGeofenceRadius } from 'src/js/service/hooks/assignments/useGeofenceRadius';
import { GEOFENCE_TRACKING_POINTS } from 'src/js/widgets/assignments/utils/assignmentsTrackingPoints';

interface GeofenceLocationFieldsProps {
  addressValue: string;
  initialMapCenter: { lat: number; lng: number };
  geofenceCoordinatesSaved: boolean;
}

const RADIUS_STEP = 10;
const RADIUS_OPTIONS = Array.from(
  { length: (GEOFENCE_RADIUS.MAX - GEOFENCE_RADIUS.MIN) / RADIUS_STEP + 1 },
  (_, i) => GEOFENCE_RADIUS.MIN + i * RADIUS_STEP,
);

const GeofenceLocationFields: React.FC<GeofenceLocationFieldsProps> = ({
  addressValue,
  initialMapCenter,
  geofenceCoordinatesSaved,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const track = useTracking();
  const hasTrackedAddressTyped = useRef(false);
  const savedPlace = useAppSelector(selectSelectedPlace);
  const addressInput = useAppSelector(selectAddressInput);
  const predictions = useAppSelector(selectPredictions);
  const radiusSearchText = useAppSelector(selectRadiusSearchText);
  const mapReady = useAppSelector(selectMapReady);
  const addressError = useAppSelector(selectAddressError);
  const radiusError = useAppSelector(selectRadiusError);
  const radius = useAppSelector(selectRadius);
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);
  const googleApiKey = sandbox?.pluginConfig?.extendedProperties
    ?.googleApiKey as string | undefined;

  // Refs — non-serializable,must stay outside Redux
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Derived from Redux — no need to duplicate in state
  const hasValidCenter = !!savedPlace || geofenceCoordinatesSaved;
  let mapCenter = DEFAULT_MAP_CENTER;
  if (savedPlace) {
    mapCenter = { lat: savedPlace.lat, lng: savedPlace.lng };
  } else if (geofenceCoordinatesSaved) {
    mapCenter = initialMapCenter;
  }

  const {
    data: geofenceRadiusData,
    loadGeofenceRadius,
    loading: radiusLoading,
  } = useGeofenceRadius();

  useGeofenceCircle({
    mapInstance: mapInstanceRef.current,
    center: hasValidCenter ? mapCenter : null,
    radius,
  });

  // Initialise addressInput on mount; clear Redux state on unmount
  useEffect(() => {
    if (!addressInput && addressValue) {
      dispatch(setAddressInput(addressValue));
    }
    return () => {
      dispatch(clearSelectedPlace());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply radius from API when it arrives
  useEffect(() => {
    if (geofenceRadiusData?.geofenceRadiusInMeter != null) {
      dispatch(setRadius(geofenceRadiusData.geofenceRadiusInMeter));
    }
  }, [dispatch, geofenceRadiusData]);

  const handleApiLoaded = useCallback(
    ({ map }: { map: google.maps.Map }) => {
      mapInstanceRef.current = map;
      autocompleteServiceRef.current =
        new google.maps.places.AutocompleteService();
      const service = new google.maps.places.PlacesService(map);
      placesServiceRef.current = service;
      dispatch(setMapReady(true));

      if (!savedPlace && geofenceCoordinatesSaved) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {
            location: { lat: initialMapCenter.lat, lng: initialMapCenter.lng },
          },
          (results, status) => {
            if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) {
              dispatch(setAddressError(true));
              return;
            }

            const { place_id: placeId, address_components: components = [] } =
              results[0];
            dispatch(setResolvedPlaceId(placeId));

            service.getDetails(
              {
                placeId,
                fields: ['formatted_address', 'address_components'],
              },
              (place, detailStatus) => {
                if (
                  detailStatus !== google.maps.places.PlacesServiceStatus.OK ||
                  !place
                ) {
                  dispatch(setAddressError(true));
                  return;
                }

                dispatch(
                  setSelectedPlace({
                    placeId,
                    lat: initialMapCenter.lat,
                    lng: initialMapCenter.lng,
                    address: place.formatted_address || addressValue,
                    label: addressValue,
                    addressComponents: components,
                  }),
                );
              },
            );
          },
        );
      } else if (!savedPlace && !geofenceCoordinatesSaved) {
        dispatch(setAddressError(true));
      }
    },
    [
      dispatch,
      savedPlace,
      geofenceCoordinatesSaved,
      initialMapCenter,
      addressValue,
    ],
  );

  const handleAddressSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      if (query.trim() && !hasTrackedAddressTyped.current) {
        track(GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_ADDRESS);
        hasTrackedAddressTyped.current = true;
      }
      dispatch(setAddressError(false));
      dispatch(setAddressInput(query));
      if (!autocompleteServiceRef.current || !query.trim()) {
        dispatch(setPredictions([]));
        return;
      }
      autocompleteServiceRef.current.getPlacePredictions(
        { input: query },
        (results, status) => {
          dispatch(
            setPredictions(
              status === google.maps.places.PlacesServiceStatus.OK && results
                ? results.map((p) => ({
                    value: p.place_id,
                    label: p.description,
                  }))
                : [],
            ),
          );
        },
      );
    },
    [dispatch, track],
  );

  const handleAddressChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const placeId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;
      const prediction = predictions.find((p) => p.value === placeId);
      if (!placeId || !placesServiceRef.current) return;

      dispatch(setAddressError(false));
      loadGeofenceRadius({ input: { placeId } });

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['formatted_address', 'geometry', 'address_components'],
        },
        (place, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place?.geometry?.location
          )
            return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || prediction?.label || '';
          // Use the prediction description (full autocomplete string) as the label shown in the search bar
          const label = prediction?.label || address;
          const addressComponents = place.address_components ?? [];

          dispatch(
            setSelectedPlace({
              placeId,
              lat,
              lng,
              address,
              label,
              addressComponents,
            }),
          );
        },
      );
    },
    [dispatch, predictions, loadGeofenceRadius],
  );

  const handleAddressBlur = useCallback(() => {
    const trimmedInput = addressInput.trim();
    if (!trimmedInput) {
      dispatch(setAddressError(true));
      return;
    }
    const inputUnchanged = trimmedInput === addressValue.trim();
    const savedLabel = savedPlace ? savedPlace.label || savedPlace.address : '';
    const hasInvalidInput =
      trimmedInput &&
      !inputUnchanged &&
      (!savedPlace || trimmedInput !== savedLabel);
    if (hasInvalidInput) {
      dispatch(setAddressError(true));
    } else if (savedPlace) {
      dispatch(setAddressInput(savedLabel));
    }
  }, [savedPlace, addressInput, addressValue, dispatch]);

  const handleRadiusSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setRadiusError(false));
      dispatch(setRadiusSearchText(e.target.value));
    },
    [dispatch],
  );

  const handleRadiusChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const value = Number(
        infoObject?.selectedItem?.value ??
          (event.target as HTMLInputElement).value,
      );
      if (!Number.isNaN(value)) {
        track(GEOFENCE_TRACKING_POINTS.EDIT_GEOFENCE_RADIUS);
        dispatch(setRadiusError(false));
        dispatch(setRadiusSearchText(null));
        dispatch(setRadius(value));
      }
    },
    [dispatch, track],
  );

  const handleRadiusBlur = useCallback(() => {
    if (radiusSearchText !== null && radiusSearchText.trim()) {
      const parsed = Number(radiusSearchText.trim());
      if (
        !Number.isNaN(parsed) &&
        (RADIUS_OPTIONS.includes(parsed) || parsed === radius)
      ) {
        dispatch(setRadius(parsed));
        dispatch(setRadiusError(false));
      } else {
        dispatch(setRadiusError(true));
      }
    }
    dispatch(setRadiusSearchText(null));
  }, [radiusSearchText, radius, dispatch]);

  const radiusDataSource = useMemo(() => {
    const options = RADIUS_OPTIONS.map((r) => ({
      value: String(r),
      label: `${r}`,
    }));
    if (!RADIUS_OPTIONS.includes(radius)) {
      options.unshift({ value: String(radius), label: `${radius}` });
    }
    return radiusSearchText
      ? options.filter((opt) => opt.label.includes(radiusSearchText))
      : options;
  }, [radius, radiusSearchText]);

  const addressErrorText = useMemo(() => {
    if (!addressError) return undefined;
    if (!addressInput.trim()) {
      return text('assignments.geofence.drawer.addressRequired');
    }
    if (addressInput.trim() === addressValue.trim() && !savedPlace) {
      return text('assignments.geofence.drawer.addressResolutionError');
    }
    return text('assignments.geofence.drawer.invalidAddress');
  }, [addressError, addressInput, addressValue, savedPlace, text]);

  if (!googleApiKey) return null;

  return (
    <FieldSection>
      <DropdownTypeahead
        label={text('assignments.geofence.drawer.addressLabel')}
        placeholder={text('assignments.geofence.drawer.addressPlaceholder')}
        value={savedPlace?.placeId || ''}
        inputValue={addressInput}
        onChange={handleAddressChange}
        onSearch={handleAddressSearch}
        onBlur={handleAddressBlur}
        dataSource={predictions}
        validationError={addressError}
        errorText={addressErrorText}
        width="100%"
        renderItem={(item, index) => (
          <MenuItem key={String(index)} value={item.value}>
            {item.label}
          </MenuItem>
        )}
      />

      <div>
        <RadiusLabel>
          {text('assignments.geofence.drawer.radiusLabel')}
        </RadiusLabel>
        <DropdownTypeahead
          value={String(radius)}
          inputValue={
            radiusSearchText !== null ? radiusSearchText : `${radius}`
          }
          onChange={handleRadiusChange}
          onSearch={handleRadiusSearch}
          onBlur={handleRadiusBlur}
          dataSource={radiusDataSource}
          validationError={radiusError}
          errorText={
            radiusError
              ? text('assignments.geofence.drawer.invalidRadius')
              : undefined
          }
          label=""
          width="100%"
          renderItem={(item, index) => (
            <MenuItem key={String(index)} value={item.value}>
              {item.label}
            </MenuItem>
          )}
        />
      </div>

      <MapPlaceholder data-testid="geofence-map-container">
        <GeofenceMapHost data-visible={mapReady ? 'true' : 'false'}>
          <GoogleMapReact
            bootstrapURLKeys={{
              key: googleApiKey,
              libraries: ['places', 'marker'],
            }}
            center={hasValidCenter ? mapCenter : DEFAULT_MAP_CENTER}
            zoom={hasValidCenter ? 15 : 4}
            options={(maps) => ({
              mapId: GEOFENCE_MAP_ID,
              disableDefaultUI: true,
              fullscreenControl: true,
              fullscreenControlOptions: {
                position: maps.ControlPosition.BOTTOM_RIGHT,
              },
            })}
            onGoogleApiLoaded={handleApiLoaded}
            yesIWantToUseGoogleMapApiInternals
          />
        </GeofenceMapHost>
        {(!mapReady || radiusLoading) && (
          <GeofenceMapSpinnerOverlay data-testid="map-loading-overlay">
            <Activity shape="dots" size="small" />
          </GeofenceMapSpinnerOverlay>
        )}
      </MapPlaceholder>
    </FieldSection>
  );
};

export default GeofenceLocationFields;
