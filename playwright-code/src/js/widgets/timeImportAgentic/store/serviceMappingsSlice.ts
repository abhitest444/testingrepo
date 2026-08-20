import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface ServiceMapping {
  id: string;
  name: string;
  isMappedToDAS: boolean;
}

export interface ServiceMappingsState {
  serviceMappings: Record<string, ServiceMapping>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ServiceMappingsState = {
  serviceMappings: {},
  isLoading: false,
  error: null,
};

const serviceMappingsSlice = createSlice({
  name: 'serviceMappings',
  initialState,
  reducers: {
    initializeServiceMappings: (
      state,
      action: PayloadAction<{ services: any[] }>,
    ) => {
      const { services } = action.payload;
      state.serviceMappings = {};

      services.forEach((service) => {
        if (service.id && service.fullName) {
          state.serviceMappings[service.fullName] = {
            id: service.id,
            name: service.fullName,
            isMappedToDAS: true,
          };
        }
      });
    },
    addServiceMapping: (
      state,
      action: PayloadAction<{ serviceName: string; serviceId: string }>,
    ) => {
      const { serviceName, serviceId } = action.payload;
      state.serviceMappings[serviceName] = {
        id: serviceId,
        name: serviceName,
        isMappedToDAS: true,
      };
    },
    updateServiceMapping: (
      state,
      action: PayloadAction<{ serviceName: string; serviceId: string }>,
    ) => {
      const { serviceName, serviceId } = action.payload;
      if (state.serviceMappings[serviceName]) {
        state.serviceMappings[serviceName].id = serviceId;
        state.serviceMappings[serviceName].isMappedToDAS = true;
      } else {
        // Add new mapping if it doesn't exist
        state.serviceMappings[serviceName] = {
          id: serviceId,
          name: serviceName,
          isMappedToDAS: true,
        };
      }
    },
    setServiceMappingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setServiceMappingsError: (state, action: PayloadAction<string | null>) => {
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
  initializeServiceMappings,
  addServiceMapping,
  updateServiceMapping,
  setServiceMappingsLoading,
  setServiceMappingsError,
} = serviceMappingsSlice.actions;

// Selector to get service validation error
export const getServiceValidationError = (
  serviceName: string,
  state: {
    serviceMappings: { serviceMappings: Record<string, ServiceMapping> };
  },
) => {
  if (!serviceName || !serviceName.trim()) {
    return null; // No error for empty service names
  }

  const serviceMapping = state.serviceMappings.serviceMappings[serviceName];
  if (!serviceMapping || !serviceMapping.isMappedToDAS) {
    return `Service "${serviceName}" not found`;
  }

  return null;
};

// Selector to get all service mappings
export const selectServiceMappings = (state: any) =>
  state.serviceMappings.serviceMappings;

export default serviceMappingsSlice.reducer;
