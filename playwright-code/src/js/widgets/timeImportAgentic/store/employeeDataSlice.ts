import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllSlices } from './globalActions';

/**
 * Interface representing an employee
 */
export interface Employee {
  id: string;
  name: string;
  email?: string;
  department?: string;
  type: 'EMPLOYEE' | 'VENDOR';
}

/**
 * Interface representing the employee data state
 */
export interface EmployeeDataState {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

const initialState: EmployeeDataState = {
  employees: [],
  loading: false,
  error: null,
  hasLoaded: false,
};

export const employeeDataSlice = createSlice({
  name: 'employeeData',
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload;
      state.error = null;
      state.hasLoaded = true;
    },

    setEmployeeDataLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setEmployeeDataError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    setHasLoaded: (state, action: PayloadAction<boolean>) => {
      state.hasLoaded = action.payload;
    },

    addEmployee: (state, action: PayloadAction<Employee>) => {
      const existingIndex = state.employees.findIndex(
        (emp) => emp.id === action.payload.id,
      );
      if (existingIndex === -1) {
        state.employees.push(action.payload);
      } else {
        state.employees[existingIndex] = action.payload;
      }
    },

    removeEmployee: (state, action: PayloadAction<string>) => {
      state.employees = state.employees.filter(
        (emp) => emp.id !== action.payload,
      );
    },

    resetEmployeeData: (state) => {
      state.employees = [];
      state.loading = false;
      state.error = null;
      state.hasLoaded = false;
    },

    resetEmployeeDataState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setEmployees,
  setEmployeeDataLoading,
  setEmployeeDataError,
  setHasLoaded,
  addEmployee,
  removeEmployee,
  resetEmployeeData,
  resetEmployeeDataState,
} = employeeDataSlice.actions;

export default employeeDataSlice.reducer;
