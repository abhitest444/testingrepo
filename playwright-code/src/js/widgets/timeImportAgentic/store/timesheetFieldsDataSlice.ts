import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node,
  GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node,
  GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass,
  GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department,
} from 'src/__generated__/oigql/graphql';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing the timesheet fields data state
 */
export interface TimesheetFieldsDataState {
  customers: GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  services: GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node[];
  classes: GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass[];
  departments: GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

/**
 * Payload interface for setting all timesheet fields data at once
 */
export interface SetTimesheetFieldsDataPayload {
  customers: GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[];
  products: GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node[];
  classes: GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass[];
  departments: GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department[];
}

const initialState: TimesheetFieldsDataState = {
  customers: [],
  services: [],
  classes: [],
  departments: [],
  loading: false,
  error: null,
  hasLoaded: false,
};

export const timesheetFieldsDataSlice = createSlice({
  name: 'timesheetFieldsData',
  initialState,
  reducers: {
    setTimesheetFieldsData: (
      state,
      action: PayloadAction<SetTimesheetFieldsDataPayload>,
    ) => {
      state.customers = action.payload.customers;
      state.services = action.payload.products;
      state.classes = action.payload.classes;
      state.departments = action.payload.departments;
      state.error = null;
      state.hasLoaded = true;
    },

    setTimesheetFieldsDataLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setTimesheetFieldsDataError: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.error = action.payload;
      state.loading = false;
    },

    setTimesheetFieldsDataHasLoaded: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.hasLoaded = action.payload;
    },

    setCustomers: (
      state,
      action: PayloadAction<
        GetTimesheetFieldsDataQuery_dataAccessContacts_DataAccess_ContactConnection_edges_DataAccess_ContactEdge_node[]
      >,
    ) => {
      state.customers = action.payload;
    },

    setServices: (
      state,
      action: PayloadAction<
        GetTimesheetFieldsDataQuery_dataAccessProducts_DataAccess_ProductConnection_edges_DataAccess_ProductEdge_node[]
      >,
    ) => {
      state.services = action.payload;
    },

    setClasses: (
      state,
      action: PayloadAction<
        GetTimesheetFieldsDataQuery_dataAccessKlasses_DataAccess_KlassConnection_edges_DataAccess_KlassEdge_node_DataAccess_Klass[]
      >,
    ) => {
      state.classes = action.payload;
    },

    setDepartments: (
      state,
      action: PayloadAction<
        GetTimesheetFieldsDataQuery_dataAccessDepartments_DataAccess_DepartmentConnection_edges_DataAccess_DepartmentEdge_node_DataAccess_Department[]
      >,
    ) => {
      state.departments = action.payload;
    },

    resetTimesheetFieldsData: (state) => {
      state.customers = [];
      state.services = [];
      state.classes = [];
      state.departments = [];
      state.loading = false;
      state.error = null;
      state.hasLoaded = false;
    },

    resetTimesheetFieldsDataState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setTimesheetFieldsData,
  setTimesheetFieldsDataLoading,
  setTimesheetFieldsDataError,
  setTimesheetFieldsDataHasLoaded,
  setCustomers,
  setServices,
  setClasses,
  setDepartments,
  resetTimesheetFieldsData,
  resetTimesheetFieldsDataState,
} = timesheetFieldsDataSlice.actions;

export default timesheetFieldsDataSlice.reducer;
