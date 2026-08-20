import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { enableMapSet } from 'immer';
import step1Reducer from './step1Slice';
import excelDataReducer from './excelDataSlice';
import reviewReducer from './reviewSlice';
import progressReducer from './progressSlice';
import companySettingsReducer from './companySettingsSlice';
import employeeDataReducer from './employeeDataSlice';
import customFieldsReducer from './customFieldsSlice';
import weeklyTimeEntriesReducer from './weeklyTimeEntriesSlice';
import timesheetFieldsDataReducer from './timesheetFieldsDataSlice';
import timeEntriesReducer from './timeEntriesSlice';
import uxPreferencesReducer from './uxPreferencesSlice';
import aiImportPreferencesReducer from './aiImportPreferencesSlice';
import validationReducer from './validationSlice';
import classMappingsReducer from './classMappingsSlice';
import customerMappingsReducer from './customerMappingsSlice';
import serviceMappingsReducer from './serviceMappingsSlice';
import locationMappingsReducer from './locationMappingsSlice';
import scannedDataReducer from './scannedDataSlice';
import fieldMappingsReducer from './fieldMappingsSlice';

// Enable Immer's MapSet plugin for Map support
enableMapSet();

/**
 * Redux store configuration for the TimeImportGenAITool demo widget
 * Manages all demo state with separate slices for better organization
 */
const store = configureStore({
  reducer: {
    step1: step1Reducer, // Manages employee selection, date range, and upload options
    excelData: excelDataReducer, // Manages Excel data, column mapping, and QB Time fields
    review: reviewReducer, // Manages time entries, filtering, and save operations
    progress: progressReducer, // Manages step navigation and AI analysis progress
    companySettings: companySettingsReducer, // Manages company settings and configuration
    employeeData: employeeDataReducer, // Manages employee data fetching and storage
    customFields: customFieldsReducer, // Manages custom fields data fetching and storage
    weeklyTimeEntries: weeklyTimeEntriesReducer, // Manages weekly time entries from useReadWeeklyTimeEntries
    timesheetFieldsData: timesheetFieldsDataReducer, // Manages timesheet fields data (employees, vendors, customers, services, classes, departments)
    timeEntries: timeEntriesReducer, // Manages time entries with timeForContactDas and duration
    uxPreferences: uxPreferencesReducer, // Manages UX preferences data and loading state
    aiImportPreferences: aiImportPreferencesReducer, // Manages AI import preferences (column/employee mappings, 8-hour limit, preferences seen, skip field mapping)
    validation: validationReducer, // Manages validation logic, employee mapping, and 24-hour limits
    classMappings: classMappingsReducer,
    customerMappings: customerMappingsReducer,
    serviceMappings: serviceMappingsReducer,
    locationMappings: locationMappingsReducer, // Manages class mappings (ID and name pairs) for validation
    scannedData: scannedDataReducer, // Manages scanned data from OCR extraction
    fieldMappings: fieldMappingsReducer, // Manages unmapped field values and their associations with time entries
  },
  devTools: {
    name: 'TimeImportGenAITool', // Widget name for Redux DevTools
  },
});

/**
 * TypeScript type for the complete store state
 * Derived from the store's getState method for type safety
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * TypeScript type for the store's dispatch function
 * Used for properly typing dispatch actions
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed version of useDispatch hook
 * Provides type safety for dispatch actions
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector hook
 * Provides type safety for state selection
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
