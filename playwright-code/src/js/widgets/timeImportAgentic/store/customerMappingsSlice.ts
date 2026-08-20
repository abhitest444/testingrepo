import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

export interface CustomerMapping {
  id: string;
  name: string;
  isMappedToDAS: boolean; // Whether this customer exists in DAS
}

export interface CustomerMappingsState {
  customerMappings: Record<string, CustomerMapping>; // key: customer name, value: CustomerMapping
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerMappingsState = {
  customerMappings: {},
  isLoading: false,
  error: null,
};

const customerMappingsSlice = createSlice({
  name: 'customerMappings',
  initialState,
  reducers: {
    // Initialize customer mappings from DAS data
    initializeCustomerMappings: (
      state,
      action: PayloadAction<{ customers: any[] }>,
    ) => {
      const { customers } = action.payload;

      // Clear existing mappings
      state.customerMappings = {};

      // Add all DAS customers as mapped
      customers.forEach((customerItem: any) => {
        const customerName =
          customerItem.fullName ||
          customerItem.displayName ||
          customerItem.name ||
          '';
        if (customerName) {
          state.customerMappings[customerName.toLowerCase().trim()] = {
            id: customerItem.id,
            name: customerName,
            isMappedToDAS: true,
          };
        }
      });
    },

    // Add a new customer mapping (when user creates a new customer)
    addCustomerMapping: (
      state,
      action: PayloadAction<{ customerName: string; customerId: string }>,
    ) => {
      const { customerName, customerId } = action.payload;
      const normalizedName = customerName.toLowerCase().trim();

      state.customerMappings[normalizedName] = {
        id: customerId,
        name: customerName,
        isMappedToDAS: true, // Newly created customers are considered mapped
      };
    },

    // Update customer mapping (when user selects from dropdown)
    updateCustomerMapping: (
      state,
      action: PayloadAction<{ customerName: string; customerId: string }>,
    ) => {
      const { customerName, customerId } = action.payload;
      const normalizedName = customerName.toLowerCase().trim();

      if (state.customerMappings[normalizedName]) {
        state.customerMappings[normalizedName].id = customerId;
        state.customerMappings[normalizedName].isMappedToDAS = true;
      } else {
        // Add new mapping if it doesn't exist
        state.customerMappings[normalizedName] = {
          id: customerId,
          name: customerName,
          isMappedToDAS: true,
        };
      }
    },

    // Check if a customer needs validation error
    checkCustomerValidation: (
      state,
      action: PayloadAction<{ customerName: string }>,
    ) => {
      const { customerName } = action.payload;
      const normalizedName = customerName.toLowerCase().trim();

      // If customer doesn't exist in mappings, it needs validation
      if (!state.customerMappings[normalizedName]) {
        state.customerMappings[normalizedName] = {
          id: '',
          name: customerName,
          isMappedToDAS: false,
        };
      }
    },

    // Clear all mappings
    clearCustomerMappings: (state) => {
      state.customerMappings = {};
    },

    // Set loading state
    setCustomerMappingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error state
    setCustomerMappingsError: (state, action: PayloadAction<string | null>) => {
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
  initializeCustomerMappings,
  addCustomerMapping,
  updateCustomerMapping,
  clearCustomerMappings,
} = customerMappingsSlice.actions;

export default customerMappingsSlice.reducer;

// Selectors
export const selectCustomerMappings = (state: any) =>
  state.customerMappings.customerMappings;
export const selectCustomerMapping = (customerName: string) => (state: any) => {
  const normalizedName = customerName.toLowerCase().trim();
  return state.customerMappings.customerMappings[normalizedName];
};
export const selectCustomerMappingsLoading = (state: any) =>
  state.customerMappings.isLoading;
export const selectCustomerMappingsError = (state: any) =>
  state.customerMappings.error;

// Helper function to check if a customer needs validation error
export const getCustomerValidationError = (
  customerName: string,
  state: any,
): string | null => {
  const normalizedName = customerName.toLowerCase().trim();
  const mapping = state.customerMappings.customerMappings[normalizedName];

  if (!mapping || !mapping.isMappedToDAS || !mapping.id) {
    return 'customer';
  }

  return null;
};
