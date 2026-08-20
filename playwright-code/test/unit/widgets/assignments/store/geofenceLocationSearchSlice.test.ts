import geofenceLocationSearchReducer, {
  setSelectedPlace,
  clearSelectedPlace,
  setAddressInput,
  setPredictions,
  setRadiusSearchText,
  setMapReady,
  setAddressError,
  setRadiusError,
  setResolvedPlaceId,
  setGeofenceOn,
  setRadius,
  setSaveError,
  selectSelectedPlace,
  selectAddressInput,
  selectPredictions,
  selectRadiusSearchText,
  selectMapReady,
  selectAddressError,
  selectRadiusError,
  selectResolvedPlaceId,
  selectGeofenceOn,
  selectRadius,
  selectSaveError,
} from 'src/js/widgets/assignments/store/geofenceLocationSearchSlice';
import type {
  SelectedPlace,
  Prediction,
} from 'src/js/widgets/assignments/store/geofenceLocationSearchSlice';
import { GEOFENCE_RADIUS } from 'src/js/widgets/assignments/constants';

describe('geofenceLocationSearchSlice', () => {
  const initialState = {
    selectedPlace: null,
    addressInput: '',
    predictions: [],
    radiusSearchText: null,
    mapReady: false,
    addressError: false,
    radiusError: false,
    resolvedPlaceId: '',
    geofenceOn: false,
    radius: GEOFENCE_RADIUS.DEFAULT,
    saveError: null,
  };

  const mockPlace: SelectedPlace = {
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    lat: -33.8688,
    lng: 151.2093,
    address: '123 George St, Sydney NSW 2000, Australia',
    label: '123 George St, Sydney',
    addressComponents: [
      { long_name: '123', short_name: '123', types: ['street_number'] },
      { long_name: 'George Street', short_name: 'George St', types: ['route'] },
    ] as google.maps.GeocoderAddressComponent[],
  };

  const mockPredictions: Prediction[] = [
    { value: 'place-1', label: '123 Main St, Springfield' },
    { value: 'place-2', label: '456 Oak Ave, Shelbyville' },
  ];

  it('should return the initial state', () => {
    expect(
      geofenceLocationSearchReducer(undefined, { type: 'unknown' }),
    ).toEqual(initialState);
  });

  // ─── reducers ─────────────────────────────────────────────────────────────────

  describe('setSelectedPlace', () => {
    it('should set the selected place and sync addressInput from label', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setSelectedPlace(mockPlace),
      );
      expect(state.selectedPlace).toEqual(mockPlace);
      expect(state.addressInput).toBe(mockPlace.label);
    });

    it('should fall back to address when label is empty', () => {
      const placeWithoutLabel = { ...mockPlace, label: '' };
      const state = geofenceLocationSearchReducer(
        initialState,
        setSelectedPlace(placeWithoutLabel),
      );
      expect(state.addressInput).toBe(placeWithoutLabel.address);
    });

    it('should clear predictions when a place is selected', () => {
      const stateWithPredictions = {
        ...initialState,
        predictions: mockPredictions,
      };
      const state = geofenceLocationSearchReducer(
        stateWithPredictions,
        setSelectedPlace(mockPlace),
      );
      expect(state.predictions).toEqual([]);
    });

    it('should clear addressError when a place is selected', () => {
      const stateWithError = { ...initialState, addressError: true };
      const state = geofenceLocationSearchReducer(
        stateWithError,
        setSelectedPlace(mockPlace),
      );
      expect(state.addressError).toBe(false);
    });
  });

  describe('clearSelectedPlace', () => {
    it('should reset location-search fields but preserve geofenceOn and radius', () => {
      const dirtyState = {
        selectedPlace: mockPlace,
        addressInput: 'some address',
        predictions: mockPredictions,
        radiusSearchText: '500',
        mapReady: true,
        addressError: true,
        radiusError: true,
        resolvedPlaceId: 'some-place-id',
        geofenceOn: true,
        radius: 500,
        saveError: 'Something went wrong',
      };
      const state = geofenceLocationSearchReducer(
        dirtyState,
        clearSelectedPlace(),
      );
      expect(state).toEqual({
        ...initialState,
        geofenceOn: true,
        radius: 500,
      });
    });

    it('should keep default geofenceOn and radius when they are at defaults', () => {
      const dirtyState = {
        ...initialState,
        selectedPlace: mockPlace,
        addressInput: 'some address',
      };
      const state = geofenceLocationSearchReducer(
        dirtyState,
        clearSelectedPlace(),
      );
      expect(state.geofenceOn).toBe(false);
      expect(state.radius).toBe(GEOFENCE_RADIUS.DEFAULT);
    });
  });

  describe('setAddressInput', () => {
    it('should set the address input value', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setAddressInput('742 Evergreen Terrace'),
      );
      expect(state.addressInput).toBe('742 Evergreen Terrace');
    });

    it('should allow setting an empty string', () => {
      const stateWithAddress = { ...initialState, addressInput: 'existing' };
      const state = geofenceLocationSearchReducer(
        stateWithAddress,
        setAddressInput(''),
      );
      expect(state.addressInput).toBe('');
    });
  });

  describe('setPredictions', () => {
    it('should set predictions', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setPredictions(mockPredictions),
      );
      expect(state.predictions).toEqual(mockPredictions);
    });

    it('should replace existing predictions', () => {
      const stateWithPredictions = {
        ...initialState,
        predictions: mockPredictions,
      };
      const newPredictions: Prediction[] = [
        { value: 'place-99', label: '789 Elm St' },
      ];
      const state = geofenceLocationSearchReducer(
        stateWithPredictions,
        setPredictions(newPredictions),
      );
      expect(state.predictions).toEqual(newPredictions);
      expect(state.predictions).toHaveLength(1);
    });

    it('should allow setting an empty array', () => {
      const stateWithPredictions = {
        ...initialState,
        predictions: mockPredictions,
      };
      const state = geofenceLocationSearchReducer(
        stateWithPredictions,
        setPredictions([]),
      );
      expect(state.predictions).toEqual([]);
    });
  });

  describe('setRadiusSearchText', () => {
    it('should set the radius search text', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setRadiusSearchText('200'),
      );
      expect(state.radiusSearchText).toBe('200');
    });

    it('should allow setting an empty string', () => {
      const stateWithRadius = { ...initialState, radiusSearchText: '500' };
      const state = geofenceLocationSearchReducer(
        stateWithRadius,
        setRadiusSearchText(''),
      );
      expect(state.radiusSearchText).toBe('');
    });

    it('should allow setting null', () => {
      const stateWithRadius = { ...initialState, radiusSearchText: '500' };
      const state = geofenceLocationSearchReducer(
        stateWithRadius,
        setRadiusSearchText(null),
      );
      expect(state.radiusSearchText).toBeNull();
    });
  });

  describe('setMapReady', () => {
    it('should set mapReady to true', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setMapReady(true),
      );
      expect(state.mapReady).toBe(true);
    });

    it('should set mapReady to false', () => {
      const readyState = { ...initialState, mapReady: true };
      const state = geofenceLocationSearchReducer(
        readyState,
        setMapReady(false),
      );
      expect(state.mapReady).toBe(false);
    });
  });

  describe('setAddressError', () => {
    it('should set addressError to true', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setAddressError(true),
      );
      expect(state.addressError).toBe(true);
    });

    it('should set addressError to false', () => {
      const errorState = { ...initialState, addressError: true };
      const state = geofenceLocationSearchReducer(
        errorState,
        setAddressError(false),
      );
      expect(state.addressError).toBe(false);
    });
  });

  describe('setRadiusError', () => {
    it('should set radiusError to true', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setRadiusError(true),
      );
      expect(state.radiusError).toBe(true);
    });

    it('should set radiusError to false', () => {
      const errorState = { ...initialState, radiusError: true };
      const state = geofenceLocationSearchReducer(
        errorState,
        setRadiusError(false),
      );
      expect(state.radiusError).toBe(false);
    });
  });

  describe('setResolvedPlaceId', () => {
    it('should set the resolved place ID', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setResolvedPlaceId('ChIJN1t_tDeuEmsRUsoyG83frY4'),
      );
      expect(state.resolvedPlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
    });
  });

  describe('setGeofenceOn', () => {
    it('should set geofenceOn to true', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setGeofenceOn(true),
      );
      expect(state.geofenceOn).toBe(true);
    });

    it('should set geofenceOn to false', () => {
      const onState = { ...initialState, geofenceOn: true };
      const state = geofenceLocationSearchReducer(
        onState,
        setGeofenceOn(false),
      );
      expect(state.geofenceOn).toBe(false);
    });
  });

  describe('setRadius', () => {
    it('should set the radius', () => {
      const state = geofenceLocationSearchReducer(initialState, setRadius(500));
      expect(state.radius).toBe(500);
    });
  });

  describe('setSaveError', () => {
    it('should set a save error message', () => {
      const state = geofenceLocationSearchReducer(
        initialState,
        setSaveError('Failed to save'),
      );
      expect(state.saveError).toBe('Failed to save');
    });

    it('should clear the save error with null', () => {
      const errorState = { ...initialState, saveError: 'Failed to save' };
      const state = geofenceLocationSearchReducer(
        errorState,
        setSaveError(null),
      );
      expect(state.saveError).toBeNull();
    });
  });

  // ─── selectors ──────────────────────────────────────────────────────────────

  describe('selectors', () => {
    const mockRootState = {
      geofenceLocationSearch: {
        selectedPlace: mockPlace,
        addressInput: '123 George St',
        predictions: mockPredictions,
        radiusSearchText: '300',
        mapReady: true,
        addressError: true,
        radiusError: true,
        resolvedPlaceId: 'resolved-abc',
        geofenceOn: true,
        radius: 250,
        saveError: 'Something went wrong',
      },
    };

    it('selectSelectedPlace should return the selected place', () => {
      expect(selectSelectedPlace(mockRootState as any)).toEqual(mockPlace);
    });

    it('selectAddressInput should return the address input', () => {
      expect(selectAddressInput(mockRootState as any)).toBe('123 George St');
    });

    it('selectPredictions should return predictions', () => {
      expect(selectPredictions(mockRootState as any)).toEqual(mockPredictions);
    });

    it('selectRadiusSearchText should return the radius search text', () => {
      expect(selectRadiusSearchText(mockRootState as any)).toBe('300');
    });

    it('selectMapReady should return mapReady', () => {
      expect(selectMapReady(mockRootState as any)).toBe(true);
    });

    it('selectAddressError should return addressError', () => {
      expect(selectAddressError(mockRootState as any)).toBe(true);
    });

    it('selectRadiusError should return radiusError', () => {
      expect(selectRadiusError(mockRootState as any)).toBe(true);
    });

    it('selectResolvedPlaceId should return the resolved place ID', () => {
      expect(selectResolvedPlaceId(mockRootState as any)).toBe('resolved-abc');
    });

    it('selectGeofenceOn should return geofenceOn', () => {
      expect(selectGeofenceOn(mockRootState as any)).toBe(true);
    });

    it('selectRadius should return the radius', () => {
      expect(selectRadius(mockRootState as any)).toBe(250);
    });

    it('selectSaveError should return the save error', () => {
      expect(selectSaveError(mockRootState as any)).toBe(
        'Something went wrong',
      );
    });

    it('selectors should return initial values when state is empty', () => {
      const emptyRootState = { geofenceLocationSearch: initialState };
      expect(selectSelectedPlace(emptyRootState as any)).toBeNull();
      expect(selectAddressInput(emptyRootState as any)).toBe('');
      expect(selectPredictions(emptyRootState as any)).toEqual([]);
      expect(selectRadiusSearchText(emptyRootState as any)).toBeNull();
      expect(selectMapReady(emptyRootState as any)).toBe(false);
      expect(selectAddressError(emptyRootState as any)).toBe(false);
      expect(selectRadiusError(emptyRootState as any)).toBe(false);
      expect(selectResolvedPlaceId(emptyRootState as any)).toBe('');
      expect(selectGeofenceOn(emptyRootState as any)).toBe(false);
      expect(selectRadius(emptyRootState as any)).toBe(GEOFENCE_RADIUS.DEFAULT);
      expect(selectSaveError(emptyRootState as any)).toBeNull();
    });
  });
});
