import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCustomFieldsData } from 'src/js/widgets/weeklyTimeEntry/hooks/useCustomFieldsData';
import validationSlice from 'src/js/widgets/weeklyTimeEntry/store/validationSlice';
import customFieldsSlice from 'src/js/widgets/weeklyTimeEntry/store/customFieldsSlice';

// Mock the hooks
jest.mock('src/js/widgets/weeklyTimeEntry/hooks/useGridInitialization', () => ({
  useGridInitialization: jest.fn(),
}));

// Mock the service hook
jest.mock('src/js/service/hooks/timeEntries/useGetCustomFields', () => ({
  useGetCustomFields: jest.fn(),
}));

const mockUseGetCustomFields =
  require('src/js/service/hooks/timeEntries/useGetCustomFields').useGetCustomFields;

const createTestStore = (initialState = {}) =>
  configureStore({
    reducer: {
      validation: validationSlice,
      customFields: customFieldsSlice,
    },
    preloadedState: {
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
      customFields: {
        customFields: [],
        loading: false,
        error: null,
      },
      ...initialState,
    },
  });

const TestWrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: any;
}) => <Provider store={store}>{children}</Provider>;

describe('useCustomFieldsData', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore({
      customFields: {
        customFields: [],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    jest.clearAllMocks();
    mockUseGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it('should initialize without errors', () => {
    const { result } = renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should handle custom fields error', () => {
    store = createTestStore({
      customFields: {
        customFields: [],
        loading: false,
        error: 'Failed to fetch custom fields',
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    const { result } = renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should handle loading state', () => {
    store = createTestStore({
      customFields: {
        customFields: [],
        loading: true,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    const { result } = renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should handle successful data loading', () => {
    store = createTestStore({
      customFields: {
        customFields: [
          { id: '1', name: 'Custom Field 1', type: 'TEXT' },
          { id: '2', name: 'Custom Field 2', type: 'NUMBER' },
        ],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    const { result } = renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });

  it('should dispatch custom fields error to validation slice when error occurs', () => {
    // Mock the service hook to return an error
    mockUseGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: 'Custom fields loading failed',
      query: jest.fn(),
      refetch: jest.fn(),
    });

    store = createTestStore({
      customFields: {
        customFields: [],
        loading: false,
        error: null, // Start with no error in Redux
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: null,
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Check that the error is dispatched to both customFields and validation slices
    expect(store.getState().customFields.error).toBe(
      'Custom fields loading failed',
    );
    expect(store.getState().validation.timeEntriesError).toBe(
      'Custom fields loading failed',
    );
  });

  it('should clear time entries error when custom fields loading starts', () => {
    // Mock the service hook to return loading state with no error
    mockUseGetCustomFields.mockReturnValue({
      customFields: [],
      loading: true,
      error: null,
      query: jest.fn(),
      refetch: jest.fn(),
    });

    store = createTestStore({
      customFields: {
        customFields: [],
        loading: false,
        error: null,
      },
      validation: {
        showValidationError: false,
        errorMessages: [],
        saveError: null,
        timeEntriesError: 'Previous error',
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    // Check that the error is cleared when loading starts
    expect(store.getState().validation.timeEntriesError).toBeNull();
  });

  it('should handle multiple error states', () => {
    store = createTestStore({
      customFields: {
        customFields: [],
        loading: false,
        error: 'Custom fields error',
      },
      validation: {
        showValidationError: true,
        errorMessages: ['Validation error'],
        saveError: 'Save error',
        timeEntriesError: 'Time entries error',
        fieldErrors: {},
        rowErrors: {},
        settingsError: null,
        savePayload: null,
        detailedSaveErrors: null,
        isSaveLoading: false,
      },
    });

    const { result } = renderHook(() => useCustomFieldsData(), {
      wrapper: ({ children }) => (
        <TestWrapper store={store}>{children}</TestWrapper>
      ),
    });

    expect(result.current).toBeDefined();
  });
});
