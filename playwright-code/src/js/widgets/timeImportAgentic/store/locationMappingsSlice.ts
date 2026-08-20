import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface LocationMapping {
  id: string;
  name: string;
  isMappedToDAS: boolean;
}

export interface LocationMappingsState {
  locationMappings: Record<string, LocationMapping>;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationMappingsState = {
  locationMappings: {},
  isLoading: false,
  error: null,
};

const locationMappingsSlice = createSlice({
  name: 'locationMappings',
  initialState,
  reducers: {
    initializeLocationMappings: (
      state,
      action: PayloadAction<{ locations: any[] }>,
    ) => {
      const { locations } = action.payload;
      state.locationMappings = {};

      locations.forEach((location) => {
        if (location.id && location.fullName) {
          state.locationMappings[location.fullName] = {
            id: location.id,
            name: location.fullName,
            isMappedToDAS: true,
          };
        }
      });
    },
    addLocationMapping: (
      state,
      action: PayloadAction<{ locationName: string; locationId: string }>,
    ) => {
      const { locationName, locationId } = action.payload;
      state.locationMappings[locationName] = {
        id: locationId,
        name: locationName,
        isMappedToDAS: true,
      };
    },
    updateLocationMapping: (
      state,
      action: PayloadAction<{ locationName: string; locationId: string }>,
    ) => {
      const { locationName, locationId } = action.payload;
      if (state.locationMappings[locationName]) {
        state.locationMappings[locationName].id = locationId;
        state.locationMappings[locationName].isMappedToDAS = true;
      } else {
        // Add new mapping if it doesn't exist
        state.locationMappings[locationName] = {
          id: locationId,
          name: locationName,
          isMappedToDAS: true,
        };
      }
    },
    setLocationMappingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLocationMappingsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetAllSlices, (state) => {
      Object.assign(state, initialState);
    });
  },
});

export const {
  initializeLocationMappings,
  addLocationMapping,
  updateLocationMapping,
  setLocationMappingsLoading,
  setLocationMappingsError,
} = locationMappingsSlice.actions;

// Selector to get location validation error
export const getLocationValidationError = (
  locationName: string,
  state: {
    locationMappings: { locationMappings: Record<string, LocationMapping> };
  },
) => {
  if (!locationName || !locationName.trim()) {
    return null; // No error for empty location names
  }

  const locationMapping = state.locationMappings.locationMappings[locationName];
  if (!locationMapping || !locationMapping.isMappedToDAS) {
    return `Location "${locationName}" not found`;
  }

  return null;
};

// Selector to get all location mappings
export const selectLocationMappings = (state: any) =>
  state.locationMappings.locationMappings;

export default locationMappingsSlice.reducer;
