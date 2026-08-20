import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GEOFENCE_RADIUS } from 'src/js/widgets/assignments/constants';
import type { RootState } from './index';

export interface Prediction {
  value: string;
  label: string;
}

export interface SelectedPlace {
  placeId: string;
  lat: number;
  lng: number;
  address: string;
  /** Place name from Google API, or prediction description as fallback. Shown in the search bar. */
  label: string;
  addressComponents: google.maps.GeocoderAddressComponent[];
}

interface GeofenceLocationSearchState {
  selectedPlace: SelectedPlace | null;
  addressInput: string;
  predictions: Prediction[];
  radiusSearchText: string | null;
  mapReady: boolean;
  addressError: boolean;
  radiusError: boolean;
  /** Place ID resolved from the customer address via Google Places on drawer open. */
  resolvedPlaceId: string;
  geofenceOn: boolean;
  radius: number;
  saveError: string | null;
}

const initialState: GeofenceLocationSearchState = {
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

const geofenceLocationSearchSlice = createSlice({
  name: 'geofenceLocationSearch',
  initialState,
  reducers: {
    setSelectedPlace: (state, action: PayloadAction<SelectedPlace>) => {
      state.selectedPlace = action.payload;
      state.addressInput = action.payload.label || action.payload.address;
      state.predictions = [];
      state.addressError = false;
    },
    // Only resets location-search fields; geofenceOn and radius are preserved so
    // toggling the geofence switch off/on does not lose the user's radius choice.
    clearSelectedPlace: (state) => ({
      ...initialState,
      geofenceOn: state.geofenceOn,
      radius: state.radius,
    }),
    setAddressInput: (state, action: PayloadAction<string>) => {
      state.addressInput = action.payload;
    },
    setPredictions: (state, action: PayloadAction<Prediction[]>) => {
      state.predictions = action.payload;
    },
    setRadiusSearchText: (state, action: PayloadAction<string | null>) => {
      state.radiusSearchText = action.payload;
    },
    setMapReady: (state, action: PayloadAction<boolean>) => {
      state.mapReady = action.payload;
    },
    setAddressError: (state, action: PayloadAction<boolean>) => {
      state.addressError = action.payload;
    },
    setRadiusError: (state, action: PayloadAction<boolean>) => {
      state.radiusError = action.payload;
    },
    setResolvedPlaceId: (state, action: PayloadAction<string>) => {
      state.resolvedPlaceId = action.payload;
    },
    setGeofenceOn: (state, action: PayloadAction<boolean>) => {
      state.geofenceOn = action.payload;
    },
    setRadius: (state, action: PayloadAction<number>) => {
      state.radius = action.payload;
    },
    setSaveError: (state, action: PayloadAction<string | null>) => {
      state.saveError = action.payload;
    },
  },
});

export const {
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
} = geofenceLocationSearchSlice.actions;

export const selectSelectedPlace = (state: RootState) =>
  state.geofenceLocationSearch.selectedPlace;
export const selectAddressInput = (state: RootState) =>
  state.geofenceLocationSearch.addressInput;
export const selectPredictions = (state: RootState) =>
  state.geofenceLocationSearch.predictions;
export const selectRadiusSearchText = (state: RootState) =>
  state.geofenceLocationSearch.radiusSearchText;
export const selectMapReady = (state: RootState) =>
  state.geofenceLocationSearch.mapReady;
export const selectAddressError = (state: RootState) =>
  state.geofenceLocationSearch.addressError;
export const selectRadiusError = (state: RootState) =>
  state.geofenceLocationSearch.radiusError;
export const selectResolvedPlaceId = (state: RootState) =>
  state.geofenceLocationSearch.resolvedPlaceId;
export const selectGeofenceOn = (state: RootState) =>
  state.geofenceLocationSearch.geofenceOn;
export const selectRadius = (state: RootState) =>
  state.geofenceLocationSearch.radius;
export const selectSaveError = (state: RootState) =>
  state.geofenceLocationSearch.saveError;

export default geofenceLocationSearchSlice.reducer;
