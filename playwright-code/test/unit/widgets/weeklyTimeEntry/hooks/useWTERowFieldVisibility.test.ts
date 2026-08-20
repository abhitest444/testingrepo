import { renderHook } from '@testing-library/react-hooks';
import { useWTERowFieldVisibility } from 'src/js/widgets/weeklyTimeEntry/hooks/useWTERowFieldVisibility';
import * as assignmentFieldUtils from 'src/js/common/assignmentFieldUtils';

// Mock Redux
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppSelector: jest.fn(),
}));

// Mock utility functions
jest.mock('src/js/common/assignmentFieldUtils', () => ({
  getFallbackStandardFieldsVisibility: jest.fn(),
  getStandardFieldsVisibilityWithAssignmentOverride: jest.fn(),
}));

const mockUseAppSelector =
  require('src/js/widgets/weeklyTimeEntry/store').useAppSelector;

const mockGetFallbackStandardFieldsVisibility =
  assignmentFieldUtils.getFallbackStandardFieldsVisibility as jest.Mock;
const mockGetStandardFieldsVisibilityWithAssignmentOverride =
  assignmentFieldUtils.getStandardFieldsVisibilityWithAssignmentOverride as jest.Mock;

describe('useWTERowFieldVisibility', () => {
  // Create a mock state that all tests can use
  const createMockState = (overrides: any = {}) => {
    const defaultState: any = {
      timeEntryGrid: {
        weeklyTimeEntries: {
          'row-1': {
            rowId: 'row-1',
            timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
            deleted: false,
            timeEntries: {},
          },
        },
        rowOrder: ['row-1'],
      },
      timeEntrySettings: {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        isClassEnabled: false,
        isLocationEnabled: false,
        billingRateForTimeEnabled: false,
        firstDayOfWeek: 1,
        classRequired: false,
        locationRequired: false,
        serviceItemRequired: false,
        requireBillable: false,
        timeSheetEntryMakesNotesRequiredEnabled: false,
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

    // Deep merge overrides with default state
    if (overrides?.assignments) {
      defaultState.assignments = {
        ...defaultState.assignments,
        ...overrides.assignments,
        customerAssignments: {
          ...defaultState.assignments.customerAssignments,
          ...(overrides.assignments?.customerAssignments || {}),
        },
        globalOptions: {
          ...defaultState.assignments.globalOptions,
          ...(overrides.assignments?.globalOptions || {}),
        },
      };
    }

    if (overrides?.timeEntryGrid) {
      defaultState.timeEntryGrid = {
        ...defaultState.timeEntryGrid,
        ...overrides.timeEntryGrid,
      };
    }

    return defaultState;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockGetStandardFieldsVisibilityWithAssignmentOverride.mockReturnValue({
      service: true,
      class: true,
      location: true,
      billable: true,
    });

    mockGetFallbackStandardFieldsVisibility.mockReturnValue({
      service: true,
      class: false,
      location: false,
      billable: true,
    });

    // Mock useAppSelector to execute selectors against mock state
    mockUseAppSelector.mockImplementation((selector: any) => {
      const mockState = createMockState();
      return typeof selector === 'function' ? selector(mockState) : null;
    });
  });

  describe('Standard fields visibility', () => {
    it('should return fallback visibility when customerAssignments is null', () => {
      const companySettings = { isClassEnabled: true };

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings,
        }),
      );

      // Fallback comes from per-customer selector (uses state.timeEntrySettings)
      expect(mockGetFallbackStandardFieldsVisibility).toHaveBeenCalled();
      expect(result.current.standardFieldsVisibility).toEqual({
        service: true,
        class: false,
        location: false,
        billable: true,
      });
    });

    it('should calculate visibility from customer assignments when available', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [
          { name: 'SERVICE_ITEM', assigned: true },
          { name: 'CLASS', assigned: false },
        ],
        customFieldAssignments: [],
        standardFieldOptions: {
          service: [],
          class: [],
          location: [],
        },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      // Override mock for this test
      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            currentWorkerId: 'worker1',
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              loading: false,
              error: null,
            },
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      // Selector calls with state-derived company settings
      expect(
        mockGetStandardFieldsVisibilityWithAssignmentOverride,
      ).toHaveBeenCalledWith(
        expect.any(Object),
        mockCustomerAssignments.standardFieldAssignments,
      );
      expect(result.current.standardFieldsVisibility).toEqual({
        service: true,
        class: true,
        location: true,
        billable: true,
      });
    });

    it('should show standard field when row has value on any time entry (update case)', () => {
      mockGetStandardFieldsVisibilityWithAssignmentOverride.mockReturnValue({
        service: false,
        class: false,
        location: false,
        billable: false,
      });

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': {
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
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
                deleted: false,
                timeEntries: {
                  0: {
                    metaInfo: {
                      service: { id: 's1', name: 'Service A' },
                      class: null,
                      location: null,
                    },
                    billableInfo: null,
                  },
                },
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.standardFieldsVisibility.service).toBe(true);
      expect(result.current.standardFieldsVisibility.class).toBe(false);
    });
  });

  describe('Custom fields visibility', () => {
    it('should return empty set when customerAssignments is null and no global CF', () => {
      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds).toEqual(new Set());
    });

    it('should return set of assigned custom field IDs', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [
          { id: 'cf-1', assigned: true },
          { id: 'cf-2', assigned: false },
          { id: 'cf-3', assigned: true },
        ],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds).toBeInstanceOf(Set);
      expect(result.current.visibleCustomFieldIds?.has('cf-1')).toBe(true);
      expect(result.current.visibleCustomFieldIds?.has('cf-2')).toBe(false);
      expect(result.current.visibleCustomFieldIds?.has('cf-3')).toBe(true);
    });

    it('should return empty set when no custom fields are assigned', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [
          { id: 'cf-1', assigned: false },
          { id: 'cf-2', assigned: false },
        ],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds).toBeInstanceOf(Set);
      expect(result.current.visibleCustomFieldIds?.size).toBe(0);
    });

    it('should include CF in visibleCustomFieldIds when row has value for that CF (update case)', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [{ id: 'cf-1', assigned: true }],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-1': [{ id: 'opt1', name: 'Option 1', assigned: true }],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
                deleted: false,
                timeEntries: {
                  0: {
                    customFields: [
                      {
                        id: 'cf-other',
                        name: 'Other',
                        value: 'x',
                        optionID: 'o1',
                      },
                    ],
                  },
                },
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds?.has('cf-1')).toBe(true);
      expect(result.current.visibleCustomFieldIds?.has('cf-other')).toBe(true);
    });
  });

  describe('Standard field options', () => {
    it('should return customer-specific options when available', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [],
        standardFieldOptions: {
          service: [{ id: 'service-1', name: 'Customer Service' }],
          class: [{ id: 'class-1', name: 'Customer Class' }],
          location: [{ id: 'location-1', name: 'Customer Location' }],
        },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockGlobalOptions = {
        standardFieldOptions: {
          service: [{ id: 'service-global', name: 'Global Service' }],
          class: [{ id: 'class-global', name: 'Global Class' }],
          location: [{ id: 'location-global', name: 'Global Location' }],
        },
        customFieldOptions: {},
        loading: false,
        error: null,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            globalOptions: mockGlobalOptions,
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getServiceOptions()).toEqual([
        { id: 'service-1', name: 'Customer Service' },
      ]);
      expect(result.current.getClassOptions()).toEqual([
        { id: 'class-1', name: 'Customer Class' },
      ]);
      expect(result.current.getLocationOptions()).toEqual([
        { id: 'location-1', name: 'Customer Location' },
      ]);
    });

    it('should fall back to global options when customer options are empty', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [],
        standardFieldOptions: {
          service: [],
          class: [],
          location: [],
        },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockGlobalOptions = {
        standardFieldOptions: {
          service: [{ id: 'service-global', name: 'Global Service' }],
          class: [{ id: 'class-global', name: 'Global Class' }],
          location: [{ id: 'location-global', name: 'Global Location' }],
        },
        customFieldOptions: {},
        loading: false,
        error: null,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            globalOptions: mockGlobalOptions,
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getServiceOptions()).toEqual([
        { id: 'service-global', name: 'Global Service' },
      ]);
      expect(result.current.getClassOptions()).toEqual([
        { id: 'class-global', name: 'Global Class' },
      ]);
      expect(result.current.getLocationOptions()).toEqual([
        { id: 'location-global', name: 'Global Location' },
      ]);
    });

    it('should handle undefined options gracefully', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: null,
                deleted: false,
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getServiceOptions()).toEqual([]);
      expect(result.current.getClassOptions()).toEqual([]);
      expect(result.current.getLocationOptions()).toEqual([]);
    });
  });

  describe('Custom field options', () => {
    it('should return customer-specific CF options when available', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-1': [{ id: 'option-1', name: 'Customer Option' }],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockGlobalOptions = {
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptions: {
          'cf-1': [{ id: 'option-global', name: 'Global Option' }],
        },
        loading: false,
        error: null,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            globalOptions: mockGlobalOptions,
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getCustomFieldOptions('cf-1')).toEqual([
        { id: 'option-1', name: 'Customer Option' },
      ]);
    });

    it('should use only customer CFO when customer is present (no global fallback)', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-1': [],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockGlobalOptions = {
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptions: {
          'cf-1': [{ id: 'option-global', name: 'Global Option' }],
        },
        loading: false,
        error: null,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            globalOptions: mockGlobalOptions,
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getCustomFieldOptions('cf-1')).toEqual([]);
    });

    it('should handle undefined CF options gracefully', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: null,
                deleted: false,
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.getCustomFieldOptions('cf-1')).toEqual([]);
    });
  });

  describe('Billable visibility from baseVisibility only', () => {
    it('should use baseVisibility.billable directly without checking row time entries', () => {
      mockGetStandardFieldsVisibilityWithAssignmentOverride.mockReturnValue({
        service: false,
        class: false,
        location: false,
        billable: false,
      });

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': {
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
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
                deleted: false,
                timeEntries: {
                  0: {
                    metaInfo: { service: null, class: null, location: null },
                    billableInfo: { billable: true, billableRate: '50.00' },
                  },
                },
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.standardFieldsVisibility.billable).toBe(false);
    });

    it('should show billable when baseVisibility.billable is true even without billable data on row', () => {
      mockGetStandardFieldsVisibilityWithAssignmentOverride.mockReturnValue({
        service: false,
        class: false,
        location: false,
        billable: true,
      });

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': {
                standardFieldAssignments: [{ name: 'BILLABLE' }],
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
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: { id: 'customer-1', type: 'CUSTOMER' },
                deleted: false,
                timeEntries: {
                  0: {
                    metaInfo: { service: null, class: null, location: null },
                    billableInfo: null,
                  },
                },
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.standardFieldsVisibility.billable).toBe(true);
    });
  });

  describe('Worker-only custom field assignments', () => {
    it('should use workerOnlyCFAssignments when no customerId is present', () => {
      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            globalOptions: {
              standardFieldOptions: { service: [], class: [], location: [] },
              customFieldOptions: {},
              workerOnlyCFAssignments: [
                { id: 'cf-worker-1', assigned: true },
                { id: 'cf-worker-2', assigned: false },
              ],
              loading: false,
              error: null,
            },
          },
          timeEntryGrid: {
            weeklyTimeEntries: {
              'row-1': {
                rowId: 'row-1',
                timeAgainst: null,
                deleted: false,
                timeEntries: {},
              },
            },
            rowOrder: ['row-1'],
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds?.has('cf-worker-1')).toBe(
        true,
      );
      expect(result.current.visibleCustomFieldIds?.has('cf-worker-2')).toBe(
        false,
      );
    });
  });

  describe('Custom field dropdown with no assigned options', () => {
    it('should hide CF when it is a dropdown with no options', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [{ id: 'cf-dropdown', assigned: true }],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-dropdown': [],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds?.has('cf-dropdown')).toBe(
        false,
      );
    });

    it('should show CF when it is a dropdown with assigned options', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [{ id: 'cf-dropdown', assigned: true }],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-dropdown': [{ id: 'opt1', name: 'Option 1', assigned: true }],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds?.has('cf-dropdown')).toBe(
        true,
      );
    });

    it('should hide CF when dropdown has options but none are assigned', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [{ id: 'cf-dropdown', assigned: true }],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {
          'cf-dropdown': [
            { id: 'opt1', name: 'Option 1', assigned: false },
            { id: 'opt2', name: 'Option 2', assigned: false },
          ],
        },
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.visibleCustomFieldIds?.has('cf-dropdown')).toBe(
        false,
      );
    });
  });

  describe('Loading state', () => {
    it('should return loading false when customerAssignments is null', () => {
      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.loading).toBe(false);
    });

    it('should return loading state from customerAssignments', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {},
        loading: true,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      mockUseAppSelector.mockImplementation((selector: any) => {
        const mockState = createMockState({
          assignments: {
            customerAssignments: {
              'customer-1': mockCustomerAssignments,
            },
          },
        });
        return typeof selector === 'function' ? selector(mockState) : null;
      });

      const { result } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings: {},
        }),
      );

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Memoization', () => {
    it('should memoize standard fields visibility', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [{ name: 'SERVICE_ITEM', assigned: true }],
        customFieldAssignments: [],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockState = createMockState({
        assignments: {
          customerAssignments: {
            'customer-1': mockCustomerAssignments,
          },
        },
      });
      mockUseAppSelector.mockImplementation((selector: any) =>
        typeof selector === 'function' ? selector(mockState) : null,
      );

      const companySettings = {};
      const { result, rerender } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings,
        }),
      );

      const firstResult = result.current.standardFieldsVisibility;
      rerender();
      const secondResult = result.current.standardFieldsVisibility;

      // The reference should be the same (memoized)
      expect(firstResult).toBe(secondResult);
    });

    it('should memoize visible custom field IDs', () => {
      const mockCustomerAssignments = {
        standardFieldAssignments: [],
        customFieldAssignments: [
          { id: 'cf-1', assigned: true },
          { id: 'cf-2', assigned: true },
        ],
        standardFieldOptions: { service: [], class: [], location: [] },
        customFieldOptionAssignments: {},
        loading: false,
        error: null,
        lastFetched: Date.now(),
        cfoLoading: false,
      };

      const mockState = createMockState({
        assignments: {
          customerAssignments: {
            'customer-1': mockCustomerAssignments,
          },
        },
      });
      mockUseAppSelector.mockImplementation((selector: any) =>
        typeof selector === 'function' ? selector(mockState) : null,
      );

      const companySettings = {};
      const { result, rerender } = renderHook(() =>
        useWTERowFieldVisibility({
          rowId: 'row-1',
          companySettings,
        }),
      );

      const firstResult = result.current.visibleCustomFieldIds;
      rerender();
      const secondResult = result.current.visibleCustomFieldIds;

      expect(firstResult).toEqual(secondResult);
      expect(firstResult?.size).toBe(2);
    });
  });
});
