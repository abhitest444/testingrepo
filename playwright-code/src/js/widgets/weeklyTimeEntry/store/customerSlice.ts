import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit';
import { GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node } from 'src/__generated__/oigql/graphql';

/**
 * Entity adapter for customer data management
 * Provides normalized state structure and optimized CRUD operations
 * Uses 'id' as the unique identifier for each customer/contact
 */
const customerAdapter =
  createEntityAdapter<GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node>(
    {
      selectId: (customer) => customer.id, // Use the customer's id as the unique identifier
      // No sortComparer - preserve the order we receive from the API (loadTimeAgainstAssignments)
    },
  );

/**
 * State interface for customer data management using entity adapter
 * Stores normalized customer/contact information for time tracking and billing purposes
 */
export interface CustomerDataState {
  customers: ReturnType<typeof customerAdapter.getInitialState>;
  error: string | null;
  loading: boolean; // Loading state for customer data operations
}

// Initial state with entity adapter and additional fields
// loading defaults to true to avoid empty-state flash on initial render: the fetch effect
// in useWTETimeAgainstAssignmentsFetch runs after mount, so loading=false would briefly
// show the empty state before setLoading(true) is dispatched.
const initialState: CustomerDataState = {
  customers: customerAdapter.getInitialState(),
  error: null,
  loading: true,
};

/**
 * Redux slice for managing customer data with entity adapter
 * Handles loading, storing, and error management for customer/contact information
 * Uses normalized state structure for better performance and optimized re-renders
 */
const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    /**
     * Sets the customer data array with new customer information
     * Uses entity adapter to normalize and store customer data efficiently
     * Clears any existing errors when new data is successfully loaded
     * @param state - Current customer data state
     * @param action - Payload containing array of customer/contact objects
     */
    setCustomers(
      state,
      action: PayloadAction<{
        customers: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
      }>,
    ) {
      customerAdapter.setAll(state.customers, action.payload.customers);
      state.error = null;
      state.loading = false;
    },

    /**
     * Adds a single customer to the existing customer data
     * Uses entity adapter to efficiently add one customer without affecting others
     * @param state - Current customer data state
     * @param action - Payload containing a single customer object
     */
    addCustomer(
      state,
      action: PayloadAction<{
        customer: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node;
      }>,
    ) {
      customerAdapter.addOne(state.customers, action.payload.customer);
      state.error = null;
    },

    /**
     * Sets an error message for customer data operations
     * Used when loading customer data fails
     * @param state - Current customer data state
     * @param action - Payload containing error message or null
     */
    setError(state, action: PayloadAction<{ error: string | null }>) {
      state.error = action.payload.error;
      state.loading = false;
    },

    /**
     * Sets the loading state for customer data operations
     * @param state - Current customer data state
     * @param action - Payload containing loading boolean
     */
    setLoading(state, action: PayloadAction<{ loading: boolean }>) {
      state.loading = action.payload.loading;
    },

    /**
     * Resets customer data to initial state
     * Clears all customer data and returns to default state
     * @param state - Current customer data state
     */
    resetCustomers(state) {
      customerAdapter.removeAll(state.customers);
      state.error = null;
      state.loading = false;
    },

    /**
     * Appends customers from a load more fetch (merges, no duplicates)
     */
    appendCustomers(
      state,
      action: PayloadAction<{
        customers: GetEmployeesAndVendorsQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
      }>,
    ) {
      customerAdapter.addMany(state.customers, action.payload.customers);
    },
  },
});

// Export actions for use in components
export const {
  setCustomers,
  addCustomer,
  setError,
  setLoading,
  resetCustomers,
  appendCustomers,
} = customerSlice.actions;

// Export the reducer for store configuration
export default customerSlice.reducer;
