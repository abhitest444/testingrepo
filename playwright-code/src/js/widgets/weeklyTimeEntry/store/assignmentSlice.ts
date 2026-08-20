import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

/**
 * Redux slice for managing assignment-based field visibility in WTE
 *
 * WTE Caching Strategy:
 * - Store assignments by CUSTOMER ID (not row ID) for reusability
 * - Multiple rows can share the same customer's assignments
 * - When clicking a cell, look up customer → get cached assignments → compute visibility
 * - Global options (worker-only, no customer) stored separately for baseline filtering
 */

export interface CustomFieldAssignment {
  id: string;
  assigned: boolean;
}

export interface StandardFieldAssignment {
  name: string;
  assigned: boolean;
}

export interface StandardFieldOptionAssignment {
  id: string;
  name: string;
  assigned: boolean;
  /** From saleDetails when fieldType is service (SERVICE_ITEM) */
  price?: number | null;
  description?: string | null;
  taxable?: boolean;
}

export interface CustomFieldOptionAssignment {
  id: string;
  name: string;
  assigned: boolean;
}

export interface CustomerAssignments {
  customFieldAssignments: CustomFieldAssignment[];
  standardFieldAssignments: StandardFieldAssignment[];
  // Standard field options (dropdown options for service/class/location)
  standardFieldOptions: {
    service: StandardFieldOptionAssignment[];
    class: StandardFieldOptionAssignment[];
    location: StandardFieldOptionAssignment[];
  };
  customFieldOptionAssignments: Record<string, CustomFieldOptionAssignment[]>; // Map of CF ID to its option assignments
  loading: boolean;
  error: string | null;
  lastFetched: number; // Timestamp for cache invalidation
  cfoLoading: boolean; // Loading state for CF option assignments
}

export interface GlobalOptions {
  // Global standard field options (worker-only, no customer context)
  standardFieldOptions: {
    service: StandardFieldOptionAssignment[];
    class: StandardFieldOptionAssignment[];
    location: StandardFieldOptionAssignment[];
  };
  // Global custom field options (worker-only, no customer context)
  customFieldOptions: Record<string, CustomFieldOptionAssignment[]>;
  // CF assignments when only worker is set (customerId null) - used for worker-only baseline
  workerOnlyCFAssignments: CustomFieldAssignment[];
  loading: boolean;
  error: string | null;
}

export interface AssignmentState {
  // Global options (worker-only, no customer) - baseline for all rows
  globalOptions: GlobalOptions;

  // Assignment data cached by customer ID
  customerAssignments: Record<string, CustomerAssignments>;

  // Current worker ID (global)
  currentWorkerId: string | null;
}

const initialState: AssignmentState = {
  globalOptions: {
    standardFieldOptions: {
      service: [],
      class: [],
      location: [],
    },
    customFieldOptions: {},
    workerOnlyCFAssignments: [],
    loading: false,
    error: null,
  },
  customerAssignments: {},
  currentWorkerId: null,
};

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    /**
     * Set the current worker ID.
     * Resets assignment cache and global options (assignments are worker-specific).
     */
    setWorker: (state, action: PayloadAction<string | null>) => {
      state.currentWorkerId = action.payload;
      state.customerAssignments = {};
      state.globalOptions = initialState.globalOptions;
    },

    /**
     * Set global options loading state
     */
    setGlobalOptionsLoading: (state, action: PayloadAction<boolean>) => {
      state.globalOptions.loading = action.payload;
    },

    /**
     * Set global standard field options (SFO)
     */
    setGlobalSFO: (
      state,
      action: PayloadAction<{
        fieldType: 'service' | 'class' | 'location';
        options: StandardFieldOptionAssignment[];
      }>,
    ) => {
      state.globalOptions.standardFieldOptions[action.payload.fieldType] =
        action.payload.options;
      state.globalOptions.loading = false;
    },

    /**
     * Set global custom field options (CFO)
     */
    setGlobalCFO: (
      state,
      action: PayloadAction<{
        customFieldId: string;
        options: CustomFieldOptionAssignment[];
      }>,
    ) => {
      state.globalOptions.customFieldOptions[action.payload.customFieldId] =
        action.payload.options;
      state.globalOptions.loading = false;
    },

    /**
     * Set global options error
     */
    setGlobalOptionsError: (state, action: PayloadAction<string | null>) => {
      state.globalOptions.error = action.payload;
      state.globalOptions.loading = false;
    },

    /**
     * Set worker-only CF assignments (CF call with customerId null)
     */
    setWorkerOnlyCFAssignments: (
      state,
      action: PayloadAction<{
        customFieldAssignments: CustomFieldAssignment[];
      }>,
    ) => {
      state.globalOptions.workerOnlyCFAssignments =
        action.payload.customFieldAssignments;
    },

    /**
     * Set loading state for a customer
     */
    setCustomerLoading: (
      state,
      action: PayloadAction<{ customerId: string; loading: boolean }>,
    ) => {
      const { customerId, loading } = action.payload;

      if (!state.customerAssignments[customerId]) {
        state.customerAssignments[customerId] = {
          customFieldAssignments: [],
          standardFieldAssignments: [],
          standardFieldOptions: {
            service: [],
            class: [],
            location: [],
          },
          customFieldOptionAssignments: {},
          loading: false,
          error: null,
          lastFetched: 0,
          cfoLoading: false,
        };
      }

      state.customerAssignments[customerId].loading = loading;
    },

    /**
     * Update both custom and standard field assignments for a customer
     */
    setCustomerAssignments: (
      state,
      action: PayloadAction<{
        customerId: string;
        customFieldAssignments: CustomFieldAssignment[];
        standardFieldAssignments: StandardFieldAssignment[];
      }>,
    ) => {
      const { customerId, customFieldAssignments, standardFieldAssignments } =
        action.payload;

      state.customerAssignments[customerId] = {
        customFieldAssignments,
        standardFieldAssignments,
        standardFieldOptions: {
          service: [],
          class: [],
          location: [],
        },
        customFieldOptionAssignments: {}, // Initialize empty, will be populated separately
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };
    },

    /**
     * Store standard field assignments when SF API completes (merge into existing customer entry from setCustomerLoading)
     */
    setCustomerSF: (
      state,
      action: PayloadAction<{
        customerId: string;
        standardFieldAssignments: StandardFieldAssignment[];
      }>,
    ) => {
      const { customerId, standardFieldAssignments } = action.payload;
      if (!state.customerAssignments[customerId]) {
        state.customerAssignments[customerId] = {
          customFieldAssignments: [],
          standardFieldAssignments: [],
          standardFieldOptions: { service: [], class: [], location: [] },
          customFieldOptionAssignments: {},
          loading: true,
          error: null,
          lastFetched: 0,
          cfoLoading: false,
        };
      }
      state.customerAssignments[customerId].standardFieldAssignments =
        standardFieldAssignments;
      state.customerAssignments[customerId].loading = false;
      state.customerAssignments[customerId].lastFetched = Date.now();
    },

    /**
     * Store custom field assignments when CF API completes (merge into existing customer entry)
     */
    setCustomerCF: (
      state,
      action: PayloadAction<{
        customerId: string;
        customFieldAssignments: CustomFieldAssignment[];
      }>,
    ) => {
      const { customerId, customFieldAssignments } = action.payload;
      if (!state.customerAssignments[customerId]) {
        state.customerAssignments[customerId] = {
          customFieldAssignments: [],
          standardFieldAssignments: [],
          standardFieldOptions: { service: [], class: [], location: [] },
          customFieldOptionAssignments: {},
          loading: true,
          error: null,
          lastFetched: 0,
          cfoLoading: false,
        };
      }
      state.customerAssignments[customerId].customFieldAssignments =
        customFieldAssignments;
      state.customerAssignments[customerId].loading = false;
      state.customerAssignments[customerId].lastFetched = Date.now();
    },

    /**
     * Set standard field options (SFO) for a specific customer
     */
    setCustomerSFO: (
      state,
      action: PayloadAction<{
        customerId: string;
        fieldType: 'service' | 'class' | 'location';
        options: StandardFieldOptionAssignment[];
      }>,
    ) => {
      const { customerId, fieldType, options } = action.payload;
      if (state.customerAssignments[customerId]) {
        state.customerAssignments[customerId].standardFieldOptions[fieldType] =
          options;
      }
    },

    /**
     * Set error for a customer
     */
    setCustomerError: (
      state,
      action: PayloadAction<{ customerId: string; error: string }>,
    ) => {
      const { customerId, error } = action.payload;

      if (state.customerAssignments[customerId]) {
        state.customerAssignments[customerId].error = error;
        state.customerAssignments[customerId].loading = false;
      }
    },

    /**
     * Set CFO loading state for a customer
     */
    setCustomerCFOLoading: (
      state,
      action: PayloadAction<{ customerId: string; loading: boolean }>,
    ) => {
      const { customerId, loading } = action.payload;

      if (state.customerAssignments[customerId]) {
        state.customerAssignments[customerId].cfoLoading = loading;
      }
    },

    /**
     * Set custom field option assignments for a specific custom field
     */
    setCustomFieldOptionAssignments: (
      state,
      action: PayloadAction<{
        customerId: string;
        customFieldId: string;
        options: CustomFieldOptionAssignment[];
      }>,
    ) => {
      const { customerId, customFieldId, options } = action.payload;

      if (state.customerAssignments[customerId]) {
        state.customerAssignments[customerId].customFieldOptionAssignments[
          customFieldId
        ] = options;
        state.customerAssignments[customerId].cfoLoading = false;
      }
    },

    /**
     * Clear assignments for a specific customer
     */
    clearCustomerAssignments: (state, action: PayloadAction<string>) => {
      delete state.customerAssignments[action.payload];
    },

    /**
     * Clear all assignment data (cache + global options).
     * Used when worker or date changes so assignments are re-fetched for the new context.
     */
    clearAllAssignments: (state) => {
      state.customerAssignments = {};
      state.globalOptions = initialState.globalOptions;
    },
  },
  extraReducers: (builder) => {
    // Reset assignment cache when week/date range changes (assignments are week-context specific)
    builder.addCase('timeEntryGrid/setDateRange', (state) => {
      state.customerAssignments = {};
      state.globalOptions = initialState.globalOptions;
    });
  },
});

export const {
  setWorker,
  setGlobalOptionsLoading,
  setGlobalSFO,
  setGlobalCFO,
  setGlobalOptionsError,
  setWorkerOnlyCFAssignments,
  setCustomerLoading,
  setCustomerAssignments,
  setCustomerSF,
  setCustomerCF,
  setCustomerSFO,
  setCustomerError,
  setCustomerCFOLoading,
  setCustomFieldOptionAssignments,
  clearCustomerAssignments,
  clearAllAssignments,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;

// Selectors

/**
 * Get current worker ID
 */
export const selectCurrentWorkerId = (state: RootState) =>
  state.assignments.currentWorkerId;

/**
 * Get global options (worker-only, no customer context)
 */
export const selectGlobalOptions = (state: RootState) =>
  state.assignments.globalOptions;

/**
 * Get cached assignments for a specific customer
 * Returns null if not cached
 */
export const selectCustomerAssignments =
  (customerId: string) => (state: RootState) =>
    state.assignments.customerAssignments[customerId] || null;

/**
 * Check if assignments are cached for a customer
 */
export const selectIsCustomerCached =
  (customerId: string) => (state: RootState) =>
    !!state.assignments.customerAssignments[customerId];

/**
 * Get standard field visibility for a specific customer
 * Returns null if no assignments cached (fallback to settings)
 */
export const selectCustomerStandardFieldsVisibility =
  (customerId: string) => (state: RootState) => {
    const customerData = state.assignments.customerAssignments[customerId];

    if (!customerData || customerData.standardFieldAssignments.length === 0) {
      return null; // Fallback to settings
    }

    const { standardFieldAssignments } = customerData;

    // Check which fields are assigned (case-insensitive; API may return e.g. SERVICE_ITEM)
    const norm = (name: string | undefined) =>
      (name || '').trim().toUpperCase();
    const serviceAssigned = standardFieldAssignments.some(
      (a) =>
        norm(a.name) === 'SERVICE_ITEM' || (a.name || '').trim() === 'service',
    );
    const classAssigned = standardFieldAssignments.some(
      (a) => norm(a.name) === 'CLASS' || (a.name || '').trim() === 'class',
    );
    const locationAssigned = standardFieldAssignments.some(
      (a) =>
        norm(a.name) === 'LOCATION' || (a.name || '').trim() === 'location',
    );
    const billableAssigned = standardFieldAssignments.some(
      (a) =>
        norm(a.name) === 'BILLABLE' || (a.name || '').trim() === 'billable',
    );

    return {
      service: serviceAssigned,
      class: classAssigned,
      location: locationAssigned,
      billable: billableAssigned,
    };
  };

/**
 * Get visible custom field IDs for a specific customer
 * Returns null if no assignments cached (fallback to settings)
 */
export const selectCustomerVisibleCustomFieldIds =
  (customerId: string) => (state: RootState) => {
    const customerData = state.assignments.customerAssignments[customerId];

    if (!customerData || customerData.customFieldAssignments.length === 0) {
      return null; // Fallback to settings
    }

    // Return Set of assigned custom field IDs
    return new Set(customerData.customFieldAssignments.map((a) => a.id));
  };
