import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useIntl } from '@payroll/quicksand';
import { useRequiredFieldsValidation } from 'src/js/widgets/weeklyTimeEntry/hooks/useRequiredFieldsValidation';
import { mockFormatMessage } from 'test/unit/testUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

// Mock the store module to ensure useAppSelector is properly mocked
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: jest.fn(),
  useAppDispatch: jest.fn(),
}));

// Mock the useUnsavedChangesDetection hook
jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useUnsavedChangesDetection',
  () => ({
    useUnsavedChangesDetection: jest.fn(),
  }),
);

const mockUseSelector = jest.fn();
const mockUseAppSelector = jest.fn();
const mockUseUnsavedChangesDetection = jest.fn();

// Set up the mocks
(useIntl as jest.MockedFunction<typeof useIntl>).mockReturnValue({
  formatMessage: mockFormatMessage,
} as any);

(
  require('react-redux').useSelector as jest.MockedFunction<any>
).mockImplementation(mockUseSelector);

(
  require('src/js/widgets/weeklyTimeEntry/store')
    .useAppSelector as jest.MockedFunction<any>
).mockImplementation(mockUseAppSelector);

(
  require('src/js/widgets/weeklyTimeEntry/hooks/useUnsavedChangesDetection')
    .useUnsavedChangesDetection as jest.MockedFunction<any>
).mockImplementation(mockUseUnsavedChangesDetection);

// Helper function to set up the mock implementation
const setupMockImplementation = (
  mockTimeEntry: any,
  companySettings: any = {},
  customFields: any = [],
  customerAssignments: Record<string, any> = {},
  dimensions: any = [],
  dimensionsEnabled = false,
) => {
  // Create a complete mock state that actual selectors can work with
  const mockState: any = {
    timeEntryGrid: {
      weeklyTimeEntries: {},
      rowOrder: [mockTimeEntry?.rowId || 'row-1'],
      selected: null,
    },
    timeEntrySettings: {
      serviceItemRequired: true,
      isServiceFieldEnabled: true,
      classRequired: true,
      isClassEnabled: true,
      locationRequired: true,
      isLocationEnabled: true,
      timeSheetEntryMakesNotesRequiredEnabled: true,
      requireBillable: false,
      isBillingFieldEnabled: true,
      ...companySettings,
    },
    customFields: {
      customFields,
    },
    dimensions: {
      dimensions,
      enabled: dimensionsEnabled,
      loading: false,
      error: null,
    },
    assignments: {
      currentWorkerId: 'worker1',
      globalOptions: {
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptions: {},
        loading: false,
        error: null,
      },
      customerAssignments: { ...customerAssignments },
    },
  };

  // Add the mockTimeEntry to the state
  if (mockTimeEntry && mockTimeEntry.rowId) {
    mockState.timeEntryGrid.weeklyTimeEntries[mockTimeEntry.rowId] =
      mockTimeEntry;
  }

  mockUseAppSelector.mockImplementation((selector: any) => {
    try {
      // Try to execute the selector with the mock state
      return selector(mockState);
    } catch (e) {
      // Fallback to string matching for selectors that don't work with our mock state
      const selectorStr = selector.toString();

      if (
        selectorStr.includes('memoized') ||
        selectorStr.includes('cache.get')
      ) {
        return [mockTimeEntry];
      }
      if (selectorStr.includes('customFields')) return customFields;
      if (selectorStr.includes('selected')) return null;
      if (selectorStr.includes('assignments')) {
        return mockState.assignments;
      }
      return null;
    }
  });
};

describe('useRequiredFieldsValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useUnsavedChangesDetection
    mockUseUnsavedChangesDetection.mockReturnValue({
      hasUnsavedChanges: true,
    });
  });

  describe('validation rules map', () => {
    it('should create validation rules based on company settings', () => {
      // Mock the selectors to return empty data
      mockUseAppSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();

        if (
          selectorStr.includes('selectAllTimesheetRows') ||
          selectorStr.includes('memoized')
        )
          return [];
        if (
          selectorStr.includes('selectCompanySettings') ||
          selectorStr.includes('timeEntrySettings')
        )
          return {
            serviceItemRequired: true,
            isServiceFieldEnabled: true,
            classRequired: true,
            isClassEnabled: true,
            locationRequired: true,
            isLocationEnabled: true,
            timeSheetEntryMakesNotesRequiredEnabled: true,
            requireBillable: false,
            isBillingFieldEnabled: true,
          };
        if (
          selectorStr.includes('selectCustomFields') ||
          selectorStr.includes('customFields')
        )
          return [];
        // Mock the selectedCell selector
        if (
          selectorStr.includes('state.timeEntryGrid.selected') ||
          selectorStr.includes('selected')
        )
          return null;
        // Mock assignments state (new structure)
        if (selectorStr.includes('assignments')) {
          return {
            currentWorkerId: 'worker1',
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              loading: false,
              error: null,
            },
            customerAssignments: {},
          };
        }
        return [];
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should validate service field when required and enabled', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: null }, // Missing service
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());

      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toHaveLength(1);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.service',
      );
    });

    it('should validate class field when required and enabled', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: null }, // Missing class
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.class',
      );
    });

    it('should validate location field when required and enabled', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: null }, // Missing location
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.location',
      );
    });

    it('should validate notes field when required', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: null, // Missing notes
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.notes',
      );
    });

    it('should skip notes validation for break rows (PAID/UNPAID)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: null }, // Missing service
              class: { id: null }, // Missing class
              location: { id: null }, // Missing location
            },
            notes: null, // Missing notes
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'break-1', type: 'PAID' }, // This is a break row
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      // Should skip validation for service, class, location, and notes on break rows
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });
  });

  describe('over hours validation', () => {
    it('should detect when total hours exceed 24', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 25, // Over 24 hours
        timeEntries: {
          0: {
            hours: 25,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.dayTotalErrors).toHaveLength(1);
      expect(validationResult.dayTotalErrors[0].totalHours).toBe(25);
      expect(validationResult.errorMessages).toContain(
        'weekly.time.entry.validation.day.total.over.limit',
      );
    });
  });

  describe('validation rules optimization', () => {
    it('should use validation rules map for consistent field validation', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: null }, // Missing service
              class: { id: null }, // Missing class
              location: { id: null }, // Missing location
            },
            notes: null, // Missing notes
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      // Should validate all required fields using the rules map
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.service',
      );
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.class',
      );
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.location',
      );
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.notes',
      );
    });
  });

  describe('custom fields validation', () => {
    it('should validate required custom fields', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '' }, // Missing required custom field
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {},
        [
          {
            id: 'custom-1',
            name: 'Required Field',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'custom-1', assigned: true }],
            customFieldOptionAssignments: {},
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'Required Field',
      );
    });

    it('should not validate deleted custom fields', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '' }, // Missing custom field but it's deleted
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should not validate custom fields for break rows (PAID)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '' }, // Missing required custom field
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'break-1', type: 'PAID' }, // Break row
      };

      setupMockImplementation(mockTimeEntry, {}, [
        {
          id: 'custom-1',
          name: 'Required Field',
          required: true,
          deleted: false,
        },
      ]);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should not validate custom fields for break rows (UNPAID)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '' }, // Missing required custom field
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'break-2', type: 'UNPAID' }, // Break row
      };

      setupMockImplementation(mockTimeEntry, {}, [
        {
          id: 'custom-1',
          name: 'Required Field',
          required: true,
          deleted: false,
        },
      ]);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should not validate service, class, location, billable fields for break rows', () => {
      const mockTimeEntry = {
        rowId: 'row1',
        timeAgainst: { type: 'PAID', id: 'break1' },
        timeEntries: {
          '1': {
            hours: 2,
            operation: 'CREATE',
            date: '2025-01-01',
            metaInfo: {
              service: { id: 'service1' },
              class: { id: 'class1' },
              location: { id: 'location1' },
            },
            notes: 'Test notes',
            billableInfo: { billable: true },
          },
        },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());

      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should validate billable time category requirement', () => {
      const mockTimeEntry = {
        rowId: 'row1',
        timeAgainst: { type: null, id: null }, // No time category selected
        timeEntries: {
          '1': {
            hours: 2,
            operation: 'CREATE',
            date: '2025-01-01',
            metaInfo: {
              service: { id: 'service1' },
              class: { id: 'class1' },
              location: { id: 'location1' },
            },
            notes: 'Test notes',
            billableInfo: { billable: true }, // Billable is checked
          },
        },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());

      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toHaveLength(1);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.time.category',
      );
    });

    it('should not validate billable time category for non-billable entries', () => {
      const mockTimeEntry = {
        rowId: 'row1',
        timeAgainst: { type: null, id: null }, // No time category selected
        timeEntries: {
          '1': {
            hours: 2,
            operation: 'CREATE',
            date: '2025-01-01',
            metaInfo: {
              service: { id: 'service1' },
              class: { id: 'class1' },
              location: { id: 'location1' },
            },
            notes: 'Test notes',
            billableInfo: { billable: false }, // Billable is not checked
          },
        },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());

      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should not validate billable time category when time category is selected', () => {
      const mockTimeEntry = {
        rowId: 'row1',
        timeAgainst: { type: 'CUSTOMER', id: 'customer1' }, // Time category is selected
        timeEntries: {
          '1': {
            hours: 2,
            operation: 'CREATE',
            date: '2025-01-01',
            metaInfo: {
              service: { id: 'service1' },
              class: { id: 'class1' },
              location: { id: 'location1' },
            },
            notes: 'Test notes',
            billableInfo: { billable: true }, // Billable is checked
          },
        },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());

      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });
  });

  describe('field errors creation', () => {
    it('should create field errors for missing required fields', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: null }, // Missing service
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(mockTimeEntry);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.fieldErrors).toHaveProperty('row-1-0');
      expect(validationResult.fieldErrors['row-1-0']).toHaveProperty('service');
    });

    it('should create custom field errors', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '' }, // Missing required custom field
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {},
        [
          {
            id: 'custom-1',
            name: 'Required Field',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'custom-1', assigned: true }],
            customFieldOptionAssignments: {},
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.fieldErrors).toHaveProperty('row-1-0');
      expect(validationResult.fieldErrors['row-1-0']).toHaveProperty(
        'customFields',
      );
      expect(
        validationResult.fieldErrors['row-1-0'].customFields,
      ).toHaveProperty('custom-1');
    });

    it('should create dimension field errors', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            dimensions: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {},
        [],
        {},
        [
          {
            id: 'dim-1',
            name: 'Department',
            active: true,
            enabledForTimeTracking: true,
            required: true,
          },
        ],
        true,
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.fieldErrors).toHaveProperty('row-1-0');
      expect(validationResult.fieldErrors['row-1-0']).toHaveProperty(
        'dimensions',
      );
      expect(validationResult.fieldErrors['row-1-0'].dimensions).toEqual({
        'dim-1': 'Required',
      });
    });
  });

  describe('day total validation', () => {
    it('should detect when day totals exceed 24 hours', () => {
      const mockTimeEntries = [
        {
          rowId: 'row-1',
          totalHours: 25,
          timeEntries: {
            0: {
              hours: 12,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-1' },
                class: { id: 'class-1' },
                location: { id: 'location-1' },
              },
              notes: 'Test notes',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
        },
        {
          rowId: 'row-2',
          totalHours: 20,
          timeEntries: {
            0: {
              hours: 13,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-2' },
                class: { id: 'class-2' },
                location: { id: 'location-2' },
              },
              notes: 'Test notes 2',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-2', type: 'CUSTOMER' },
        },
      ];

      mockUseAppSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();

        // Check if this is a memoized function (selectAllTimesheetRows)
        if (
          selectorStr.includes('memoized') ||
          selectorStr.includes('cache.get')
        ) {
          return mockTimeEntries;
        }

        // Check if this is selectCompanySettings by looking for the specific function content
        if (
          selectorStr.includes('timeEntrySettings') ||
          selectorStr.includes('serviceItemRequired')
        ) {
          return {
            serviceItemRequired: false,
            isServiceFieldEnabled: false,
            classRequired: false,
            isClassEnabled: false,
            locationRequired: false,
            isLocationEnabled: false,
            timeSheetEntryMakesNotesRequiredEnabled: false,
          };
        }
        if (selector.toString().includes('customFields')) return [];
        if (selectorStr.includes('selected')) return null; // selectSelectedCell
        if (selectorStr.includes('assignments')) {
          return {
            currentWorkerId: 'worker1',
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              loading: false,
              error: null,
            },
            customerAssignments: {},
          };
        }
        return [];
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.dayTotalErrors).toHaveLength(1);
      expect(validationResult.dayTotalErrors[0]).toEqual({
        dayIndex: 0,
        dayLabel: 'Sun',
        totalHours: 25, // 12 + 13 = 25 hours
      });
      expect(validationResult.errorMessages).toContain(
        'weekly.time.entry.validation.day.total.over.limit',
      );
    });

    it('should not detect errors when day totals are within limit', () => {
      const mockTimeEntries = [
        {
          rowId: 'row-1',
          totalHours: 8,
          timeEntries: {
            0: {
              hours: 8,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-1' },
                class: { id: 'class-1' },
                location: { id: 'location-1' },
              },
              notes: 'Test notes',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
        },
        {
          rowId: 'row-2',
          totalHours: 16,
          timeEntries: {
            0: {
              hours: 16,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-2' },
                class: { id: 'class-2' },
                location: { id: 'location-2' },
              },
              notes: 'Test notes 2',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-2', type: 'CUSTOMER' },
        },
      ];

      mockUseAppSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();

        if (
          selectorStr.includes('selectAllTimesheetRows') ||
          selectorStr.includes('memoized')
        )
          return mockTimeEntries;
        if (
          selectorStr.includes('selectCompanySettings') ||
          selectorStr.includes('timeEntrySettings')
        )
          return {
            serviceItemRequired: false,
            isServiceFieldEnabled: false,
            classRequired: false,
            isClassEnabled: false,
            locationRequired: false,
            isLocationEnabled: false,
            timeSheetEntryMakesNotesRequiredEnabled: false,
          };
        if (selectorStr.includes('customFields')) return [];
        // Mock the selectedCell selector
        if (
          selectorStr.includes('state.timeEntryGrid.selected') ||
          selectorStr.includes('selected')
        )
          return null;
        if (selectorStr.includes('assignments')) {
          return {
            currentWorkerId: 'worker1',
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              loading: false,
              error: null,
            },
            customerAssignments: {},
          };
        }
        return [];
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.dayTotalErrors).toHaveLength(0);
      expect(validationResult.errorMessages).toHaveLength(0);
    });
  });

  describe('labelPreference functionality', () => {
    it('should use DepartmentTerminology for location field validation when labelPreference is provided', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              // Missing location
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: true,
          isLocationEnabled: true,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [],
      );

      const labelPreference = {
        DepartmentTerminology: 'Custom Department',
        CustomerTerminology: 'Custom Customer',
      };

      const { result } = renderHook(() =>
        useRequiredFieldsValidation(labelPreference),
      );
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'Custom Department',
      );
    });

    it('should fallback to default location field message when DepartmentTerminology is empty', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              // Missing location
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: true,
          isLocationEnabled: true,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [],
      );

      const labelPreference = {
        DepartmentTerminology: '', // Empty string
        CustomerTerminology: 'Custom Customer',
      };

      const { result } = renderHook(() =>
        useRequiredFieldsValidation(labelPreference),
      );
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.location',
      );
    });

    it('should fallback to default location field message when labelPreference is not provided', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              // Missing location
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: true,
          isLocationEnabled: true,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [],
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.location',
      );
    });

    it('should use DepartmentTerminology in field errors when labelPreference is provided', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              // Missing location
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: true,
          isLocationEnabled: true,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [],
      );

      const labelPreference = {
        DepartmentTerminology: 'Custom Department',
        CustomerTerminology: 'Custom Customer',
      };

      const { result } = renderHook(() =>
        useRequiredFieldsValidation(labelPreference),
      );
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.fieldErrors['row-1-0'].location).toBe('Required');
    });

    it('should not affect other field validations when using labelPreference', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              // Missing service
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: true,
          isServiceFieldEnabled: true,
        },
        [],
      );

      const labelPreference = {
        DepartmentTerminology: 'Custom Department',
        CustomerTerminology: 'Custom Customer',
      };

      const { result } = renderHook(() =>
        useRequiredFieldsValidation(labelPreference),
      );
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.service',
      );
      expect(validationResult.fieldErrors['row-1-0'].service).toBe('Required');
    });
  });

  describe('assignment-based billable gating in validation', () => {
    it('should require time category when feature flag enabled and customer has billable assigned', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: '', type: 'CUSTOMER' },
      };

      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: { 'row-1': mockTimeEntry },
          rowOrder: ['row-1'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: true,
        },
        customFields: { customFields: [] },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          return selector(mockState);
        } catch (e) {
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.time.category',
      );
    });

    it('should require time category when feature flag enabled and customer has billable in assignments', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: { 'row-1': mockTimeEntry },
          rowOrder: ['row-1'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: false,
        },
        customFields: { customFields: [] },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {
            'customer-1': {
              standardFieldAssignments: [
                { name: 'BILLABLE' },
                { name: 'SERVICE_ITEM' },
              ],
              customFieldAssignments: [],
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptionAssignments: {},
              loading: false,
              error: null,
              lastFetched: Date.now(),
              cfoLoading: false,
            },
          },
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          return selector(mockState);
        } catch (e) {
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
    });

    it('should not require time category when feature flag enabled and customer has no billable assignment', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: 'customer-2', type: 'CUSTOMER' },
      };

      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: { 'row-1': mockTimeEntry },
          rowOrder: ['row-1'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: false,
        },
        customFields: { customFields: [] },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {
            'customer-2': {
              standardFieldAssignments: [
                { name: 'SERVICE_ITEM' },
                { name: 'CLASS' },
              ],
              customFieldAssignments: [],
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptionAssignments: {},
              loading: false,
              error: null,
              lastFetched: Date.now(),
              cfoLoading: false,
            },
          },
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          return selector(mockState);
        } catch (e) {
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
    });

    it('should fall back to company settings when feature flag enabled but customer has empty assignments', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: 'customer-3', type: 'CUSTOMER' },
      };

      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: { 'row-1': mockTimeEntry },
          rowOrder: ['row-1'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: false,
        },
        customFields: { customFields: [] },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {
            'customer-3': {
              standardFieldAssignments: [],
              customFieldAssignments: [],
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptionAssignments: {},
              loading: false,
              error: null,
              lastFetched: Date.now(),
              cfoLoading: false,
            },
          },
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          return selector(mockState);
        } catch (e) {
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('custom field option assignment logic (lines 446-460)', () => {
    it('should skip validation when CF has empty options array (line 448)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [
          {
            id: 'cf-1',
            name: 'DropdownCF',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'cf-1', assigned: true }],
            customFieldOptionAssignments: { 'cf-1': [] },
            standardFieldAssignments: [],
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should validate CF when options have assigned:true entries (line 454 truthy)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [
          {
            id: 'cf-1',
            name: 'DropdownCF',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'cf-1', assigned: true }],
            customFieldOptionAssignments: {
              'cf-1': [
                { assigned: true, value: 'Option1' },
                { assigned: false, value: 'Option2' },
              ],
            },
            standardFieldAssignments: [],
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'DropdownCF',
      );
    });

    it('should skip validation when CF options exist but none have assigned:true (line 454 falsy)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [
          {
            id: 'cf-1',
            name: 'DropdownCF',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'cf-1', assigned: true }],
            customFieldOptionAssignments: {
              'cf-1': [
                { assigned: false, value: 'Option1' },
                { assigned: false, value: 'Option2' },
              ],
            },
            standardFieldAssignments: [],
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should fall back to globalOptions when customer has no CF option assignments (line 443-444)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: { 'row-1': mockTimeEntry },
          rowOrder: ['row-1'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          isBillingFieldEnabled: false,
        },
        customFields: {
          customFields: [
            {
              id: 'cf-1',
              name: 'GlobalCF',
              required: true,
              deleted: false,
            },
          ],
        },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {
              'cf-1': [{ assigned: true, value: 'Global Option' }],
            },
            loading: false,
            error: null,
          },
          customerAssignments: {
            'customer-1': {
              customFieldAssignments: [{ id: 'cf-1', assigned: true }],
              customFieldOptionAssignments: {},
              standardFieldAssignments: [],
            },
          },
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          return selector(mockState);
        } catch (e) {
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'GlobalCF',
      );
    });

    it('should not validate CF when customer assignment has assigned:false', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [
          {
            id: 'cf-1',
            name: 'UnassignedCF',
            required: true,
            deleted: false,
          },
        ],
        {
          'customer-1': {
            customFieldAssignments: [{ id: 'cf-1', assigned: false }],
            customFieldOptionAssignments: {},
            standardFieldAssignments: [],
          },
        },
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should skip CF validation when no customer is selected (customerId is null)', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [{ id: 'cf-1', value: '' }],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: null, type: null },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
        },
        [
          {
            id: 'cf-1',
            name: 'RequiredCF',
            required: true,
            deleted: false,
          },
        ],
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = result.current.validateRequiredFields();

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });
  });

  describe('comprehensive coverage tests', () => {
    it('should handle multiple error types - both missing fields and day total errors', () => {
      const mockTimeEntries = [
        {
          rowId: 'row-1',
          totalHours: 15,
          timeEntries: {
            0: {
              hours: 15,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                // Missing service
                class: { id: 'class-1' },
                location: { id: 'location-1' },
              },
              notes: 'Test notes',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
        },
        {
          rowId: 'row-2',
          totalHours: 12,
          timeEntries: {
            0: {
              hours: 12,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-2' },
                class: { id: 'class-2' },
                location: { id: 'location-2' },
              },
              notes: 'Test notes 2',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-2', type: 'CUSTOMER' },
        },
      ];

      // Create a complete mock state that actual selectors can work with
      const mockState: any = {
        timeEntryGrid: {
          weeklyTimeEntries: {
            'row-1': mockTimeEntries[0],
            'row-2': mockTimeEntries[1],
          },
          rowOrder: ['row-1', 'row-2'],
          selected: null,
        },
        timeEntrySettings: {
          serviceItemRequired: true,
          isServiceFieldEnabled: true,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: true,
        },
        customFields: {
          customFields: [],
        },
        assignments: {
          currentWorkerId: 'worker1',
          globalOptions: {
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptions: {},
            loading: false,
            error: null,
          },
          customerAssignments: {},
        },
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        try {
          // Try to execute the selector with the mock state
          return selector(mockState);
        } catch (e) {
          // Fallback for any selector that doesn't work
          const selectorStr = selector.toString();
          if (selectorStr.includes('assignments')) {
            return mockState.assignments;
          }
          return null;
        }
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      // Should have both missing fields and day total errors
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toHaveLength(1); // Missing service field
      expect(validationResult.dayTotalErrors).toHaveLength(1); // Day total > 24 hours (15 + 12 = 27)

      // Should have multiple error messages
      expect(validationResult.errorMessages).toContain(
        'weekly.time.entry.validation.day.total.over.limit',
      );
      expect(validationResult.errorMessages.length).toBeGreaterThan(1);
    });

    it('should handle notes validation with empty string', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: '   ', // Only whitespace
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: true,
        },
        [],
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.notes',
      );
    });

    it('should handle validation rules with function-based isRequired', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'UPDATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: '', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: false,
          isServiceFieldEnabled: false,
          classRequired: false,
          isClassEnabled: false,
          locationRequired: false,
          isLocationEnabled: false,
          timeSheetEntryMakesNotesRequiredEnabled: false,
          requireBillable: false,
          isBillingFieldEnabled: true,
        },
        [],
      );

      mockUseUnsavedChangesDetection.mockReturnValue({
        hasUnsavedChanges: true,
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.time.category',
      );
      expect(
        validationResult.fieldErrors['row-1-time-category'].customerProject,
      ).toBe('Required');
    });

    it('should handle billable time category validation with empty string', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: true },
          },
        },
        timeAgainst: { id: '', type: 'CUSTOMER' }, // Empty ID
      };

      setupMockImplementation(mockTimeEntry, {}, []);

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'weekly.time.entry.validation.field.time.category',
      );
      expect(
        validationResult.fieldErrors['row-1-time-category'].customerProject,
      ).toBe('Required');
    });

    it('should handle date parsing failure gracefully', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: 'invalid-date-format',
            operation: 'CREATE',
            metaInfo: {
              // Missing service
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(
        mockTimeEntry,
        {
          serviceItemRequired: true,
          isServiceFieldEnabled: true,
        },
        [],
      );

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields).toHaveLength(1);
      // Should still create error messages even with invalid date
      expect(validationResult.errorMessages.length).toBeGreaterThan(0);
    });

    it('should handle custom fields with whitespace-only values', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [
              { id: 'custom-1', value: '   ' }, // Whitespace only
            ],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      const customFields = [
        {
          id: 'custom-1',
          name: 'Custom Field 1',
          required: true,
          deleted: false,
        },
      ];

      setupMockImplementation(mockTimeEntry, {}, customFields, {
        'customer-1': {
          customFieldAssignments: [{ id: 'custom-1', assigned: true }],
          customFieldOptionAssignments: {},
        },
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingFields[0].missingFields).toContain(
        'Custom Field 1',
      );
      expect(
        validationResult.fieldErrors['row-1-0'].customFields,
      ).toHaveProperty('custom-1', 'Required');
    });

    it('should handle entries without unsaved changes', () => {
      const mockTimeEntry = {
        rowId: 'row-1',
        totalHours: 8,
        timeEntries: {
          0: {
            hours: 8,
            date: '2024-01-01',
            // No operation - means no unsaved changes
            metaInfo: {
              service: { id: 'service-1' },
              class: { id: 'class-1' },
              location: { id: 'location-1' },
            },
            notes: 'Test notes',
            customFields: [],
            billableInfo: { billable: false },
          },
        },
        timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
      };

      setupMockImplementation(mockTimeEntry, {}, []);

      // Mock hasUnsavedChanges to return false
      mockUseUnsavedChangesDetection.mockReturnValue({
        hasUnsavedChanges: false,
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      // Should be valid since no unsaved changes to validate
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });

    it('should handle deleted rows correctly', () => {
      const mockTimeEntries = [
        {
          rowId: 'row-1',
          deleted: true, // Deleted row
          totalHours: 8,
          timeEntries: {
            0: {
              hours: 8,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                // Missing service - but should be ignored since row is deleted
              },
              notes: 'Test notes',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
        },
        {
          rowId: 'row-2',
          totalHours: 8,
          timeEntries: {
            0: {
              hours: 8,
              date: '2024-01-01',
              operation: 'CREATE',
              metaInfo: {
                service: { id: 'service-2' },
                class: { id: 'class-2' },
                location: { id: 'location-2' },
              },
              notes: 'Test notes 2',
              customFields: [],
              billableInfo: { billable: false },
            },
          },
          timeAgainst: { id: 'customer-2', type: 'CUSTOMER' },
        },
      ];

      mockUseAppSelector.mockImplementation((selector: any) => {
        const selectorStr = selector.toString();

        if (
          selectorStr.includes('selectAllTimesheetRows') ||
          selectorStr.includes('memoized')
        )
          return mockTimeEntries;
        if (
          selectorStr.includes('selectCompanySettings') ||
          selectorStr.includes('timeEntrySettings')
        )
          return {
            serviceItemRequired: true,
            isServiceFieldEnabled: true,
          };
        if (
          selectorStr.includes('selectCustomFields') ||
          selectorStr.includes('customFields')
        )
          return [];
        if (
          selectorStr.includes('state.timeEntryGrid.selected') ||
          selectorStr.includes('selected')
        )
          return null;
        if (selectorStr.includes('assignments')) {
          return {
            currentWorkerId: 'worker1',
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              loading: false,
              error: null,
            },
            customerAssignments: {},
          };
        }
        return [];
      });

      const { result } = renderHook(() => useRequiredFieldsValidation());
      const validationResult = (result.current as any).validateRequiredFields();

      // Should be valid since deleted row is filtered out
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.missingFields).toHaveLength(0);
    });
  });
});
