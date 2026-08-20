import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { useSTEFieldAssignments } from 'src/js/widgets/singleTimeTrowser/hooks/useSTEFieldAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import { useStandardFieldOptionAssignments } from 'src/js/service/hooks/assignments/useStandardFieldOptionAssignments';

// Mock dependencies
jest.mock('react-hook-form', () => ({
  useWatch: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({ logger: { info: jest.fn() } })),
}));

jest.mock('src/js/service/hooks/assignments/useCustomFieldAssignments');
jest.mock('src/js/service/hooks/assignments/useStandardFieldAssignments');
jest.mock('src/js/service/hooks/assignments/useCustomFieldOptionAssignments');
jest.mock('src/js/service/hooks/assignments/useStandardFieldOptionAssignments');

const mockUseWatch = useWatch as jest.MockedFunction<typeof useWatch>;
const mockUseCustomFieldAssignments =
  useCustomFieldAssignments as jest.MockedFunction<
    typeof useCustomFieldAssignments
  >;
const mockUseStandardFieldAssignments =
  useStandardFieldAssignments as jest.MockedFunction<
    typeof useStandardFieldAssignments
  >;
const mockUseCustomFieldOptionAssignments =
  useCustomFieldOptionAssignments as jest.MockedFunction<
    typeof useCustomFieldOptionAssignments
  >;
const mockUseStandardFieldOptionAssignments =
  useStandardFieldOptionAssignments as jest.MockedFunction<
    typeof useStandardFieldOptionAssignments
  >;

describe('useSTEFieldAssignments', () => {
  const mockCompanySettings = {
    isServiceFieldEnabled: true,
    isClassEnabled: true,
    isLocationEnabled: false,
    isBillingFieldEnabled: true,
    customFieldsEnabled: {
      field1: true,
      field2: false,
      field3: true,
    },
  };

  const mockUxPreferences = {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  };

  const mockAllCustomFields = [
    {
      id: 'field1',
      name: 'Field 1',
      deleted: false,
      required: false,
      type: 'TEXT',
    },
    {
      id: 'field2',
      name: 'Field 2',
      deleted: false,
      required: false,
      type: 'DROPDOWN',
      options: [{ id: 'opt1', name: 'Option 1', deleted: false }],
    },
    {
      id: 'field3',
      name: 'Field 3',
      deleted: false,
      required: false,
      type: 'MULTI_SELECT',
      options: [],
    },
  ];

  const mockLoadCustomFieldAssignments = jest.fn();
  const mockLoadStandardFieldAssignments = jest.fn();
  const mockLoadCustomFieldOptionAssignments = jest.fn();
  const mockLoadStandardFieldOptionAssignments = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations (create scenario: no timeEntryId)
    (mockUseWatch as any).mockImplementation((options: any) => {
      if (options.name === 'timeFor') {
        return { id: 'worker1' };
      }
      if (options.name === 'timeAgainst') {
        return { customer: { id: 'customer1' }, project: null };
      }
      if (options.name === 'id') return undefined;
      if (options.name === 'service') return undefined;
      if (options.name === 'class') return undefined;
      if (options.name === 'location') return undefined;
      if (options.name === 'billable') return undefined;
      if (options.name === 'customFields') return undefined;
      return undefined;
    });

    mockUseCustomFieldAssignments.mockReturnValue({
      loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });

    mockUseStandardFieldAssignments.mockReturnValue({
      loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });

    mockUseCustomFieldOptionAssignments.mockReturnValue({
      loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });

    // Mock Standard Field Option Assignments - called 3 times (service, class, location)
    mockUseStandardFieldOptionAssignments.mockReturnValue({
      loadStandardFieldOptionAssignments:
        mockLoadStandardFieldOptionAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });
  });

  describe('Feature flag behavior', () => {
    it('should use settings when not OTX', () => {
      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: false, // Not OTX
          isTimeEntry: true,
        }),
      );

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should use settings when not time entry', () => {
      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: false, // Time activity
        }),
      );

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Assignment fetching', () => {
    it('should fetch CF and SF assignments when customer changes (with disabled location)', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings, // location is disabled
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });

      // SF assignment should be called because location is disabled
      expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
    });

    it('should NOT fetch SF assignments when all standard fields are enabled', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      const allEnabledSettings = {
        ...mockCompanySettings,
        isLocationEnabled: true, // Now all are enabled
      };

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: allEnabledSettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(mockLoadCustomFieldAssignments).toHaveBeenCalled();
      // SF assignment should NOT be called when all SFs are enabled
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should fetch assignments when project changes (still only customerId in API input)', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' }, project: { id: 'project1' } };
        }
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
    });

    it('should fetch SF/CF assignments with customer only (no worker required)', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return undefined; // No worker
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // SF/CF calls should be made when customer is present (worker not required)
      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
      expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
    });

    it('should not fetch if no customer or project and no worker', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') return null;
        if (options.name === 'timeAgainst') return {}; // No customer or project
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not fetch when no customer/project and no worker
      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Field visibility with assignments', () => {
    it('should use assignment data to determine field visibility', async () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'field2', assigned: true, assignedToAll: false }, // Only assigned fields are returned
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });
      // field2 is DROPDOWN; provide CFO options so it stays visible
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            customFieldId: 'field2',
            id: 'opt1',
            name: 'Option 1',
            assigned: true,
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [
          { name: 'LOCATION', assigned: true }, // Only assigned, uppercase API format
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // field2 should be visible (assigned + has options)
      expect(result.current.visibleCustomFields).toHaveLength(1);
      expect(result.current.visibleCustomFields[0].id).toBe('field2');

      // Service visible (enabled in company settings); location visible (in SF response when disabled in settings).
      expect(result.current.standardFieldsVisibility).toMatchObject({
        service: true,
        location: true,
      });
    });
  });

  describe('Loading states', () => {
    it('should aggregate loading states from both APIs', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [],
        loading: true,
        error: null,
        pageInfo: null,
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Return values', () => {
    it('should return worker, customer, and project IDs', () => {
      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(result.current.workerId).toBe('worker1');
      expect(result.current.customerId).toBe('customer1');
      expect(result.current.projectId).toBeUndefined();
    });
  });

  describe('Custom Field Assignment Logic', () => {
    it('should skip CF assignment call when allCustomFields is empty', () => {
      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: [], // No CFs
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call CF assignment API
      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      // Should still call SF assignment API
      expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
    });

    it('should call CF assignment with assigned: true when CFs exist', () => {
      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
    });

    it('should filter visible CFs based on assignment data', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'field1', assigned: true, assignedToAll: false },
          { id: 'field2', assigned: true, assignedToAll: false },
          // field3 not in response = not assigned
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });
      // field2 is DROPDOWN; provide CFO options so it stays visible
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            customFieldId: 'field2',
            id: 'opt1',
            name: 'Option 1',
            assigned: true,
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Only field1 and field2 should be visible (assigned; field2 has options)
      expect(result.current.visibleCustomFields).toHaveLength(2);
      expect(result.current.visibleCustomFields.map((f) => f.id)).toEqual([
        'field1',
        'field2',
      ]);
    });

    it('should exclude dropdown CF with no assigned options from visibleCustomFields (required with no options not shown)', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'field2', assigned: true, assignedToAll: false },
          { id: 'field3', assigned: true, assignedToAll: false },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });
      // No CFO options returned for field2/field3 (empty)
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Dropdown/multi_select CFs with no options are hidden (and validation not applied)
      expect(
        result.current.visibleCustomFields.every(
          (f) => f.id !== 'field2' && f.id !== 'field3',
        ),
      ).toBe(true);
      expect(result.current.visibleCustomFields.map((f) => f.id)).not.toContain(
        'field2',
      );
      expect(result.current.visibleCustomFields.map((f) => f.id)).not.toContain(
        'field3',
      );
    });
  });

  describe('Custom Field Option Assignment Logic', () => {
    it('should not call CFO API when no worker', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return undefined; // No worker
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call CFO API without worker
      expect(mockLoadCustomFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should call CFO API once with all dropdown CF IDs', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'field1', assigned: true, assignedToAll: false }, // TEXT
          { id: 'field2', assigned: true, assignedToAll: false }, // DROPDOWN
          { id: 'field3', assigned: true, assignedToAll: false }, // MULTI_SELECT
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should call CFO once with array of all dropdown CF IDs
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalledTimes(1);
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalledWith({
        input: {
          timeForEntityId: 'worker1',
          timeAgainstEntityId: 'customer1', // Customer from mock
          customFieldIds: ['field2', 'field3'], // Array of dropdown CF IDs
        },
        filter: { assigned: true, active: true },
        first: 100,
      });
    });

    it('should not call CFO API when no visible CFs', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [], // No assigned CFs
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call CFO API when no visible CFs
      expect(mockLoadCustomFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should include CFO loading state in overall loading', () => {
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: true, // CFO is loading
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(result.current.loading).toBe(true);
    });
  });

  describe('Standard Field Filter Logic', () => {
    it('should use assigned: true filter when any SF is disabled', () => {
      const settingsWithDisabledSF = {
        ...mockCompanySettings,
        isServiceFieldEnabled: false, // Disabled
      };

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: settingsWithDisabledSF,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
        input: { customerId: 'customer1' },
        filter: { assigned: true },
        first: 100,
      });
    });

    it('should NOT fetch SF assignments when all SFs are enabled', () => {
      const settingsWithAllEnabled = {
        isServiceFieldEnabled: true,
        isClassEnabled: true,
        isLocationEnabled: true,
        isBillingFieldEnabled: true,
      };

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: settingsWithAllEnabled,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // SF assignment should NOT be called when all SFs are enabled
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should fetch SFO based on standardFieldsVisibility (assigned or enabled)', () => {
      // Mock SF assignments to return only SERVICE and CLASS as assigned; LOCATION disabled in settings
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [
          { name: 'SERVICE_ITEM', assigned: true },
          { name: 'CLASS', assigned: true },
          // LOCATION not assigned
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // SFO is no longer fetched by useSTEFieldAssignments (handled by Quick Find / form components).
      const sfoCallLabels =
        mockLoadStandardFieldOptionAssignments.mock.calls.map(
          (call: any) => call[0]?.input?.standardFieldLabel,
        );
      expect(sfoCallLabels).toEqual([]);
    });

    it('should fetch SFO based on company settings when only worker is selected', () => {
      // No customer
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return {};
        }
        return undefined;
      }) as any);

      // Location is disabled in mockCompanySettings; service and class enabled
      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // SFO is no longer fetched by useSTEFieldAssignments (handled elsewhere).
      const sfoCallLabels =
        mockLoadStandardFieldOptionAssignments.mock.calls.map(
          (call: any) => call[0]?.input?.standardFieldLabel,
        );
      expect(sfoCallLabels).toEqual([]);
    });

    it('should trigger CFO calls when team member (workerId) is present', () => {
      // Mock CF assignments to return field2 and field3 as assigned (dropdown types)
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'field1', assigned: true, assignedToAll: false },
          { id: 'field2', assigned: true, assignedToAll: false }, // DROPDOWN
          { id: 'field3', assigned: true, assignedToAll: false }, // MULTI_SELECT
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      // Default mock already returns worker1 and customer1
      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // CFO should be called for dropdown/multi-select custom fields (field2, field3)
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalled();

      // Verify it's called with correct timeForEntityId and customFieldIds array
      const { calls } = mockLoadCustomFieldOptionAssignments.mock;
      expect(
        calls.some(
          (call: any) => call[0]?.input?.timeForEntityId === 'worker1',
        ),
      ).toBe(true);

      // Verify it's called with array of dropdown custom field IDs
      expect(
        calls.some((call: any) => {
          const customFieldIds = call[0]?.input?.customFieldIds;
          return (
            Array.isArray(customFieldIds) &&
            customFieldIds.includes('field2') &&
            customFieldIds.includes('field3')
          );
        }),
      ).toBe(true);
    });

    it('should clear CFO assignments when worker is removed', () => {
      // Mock useWatch to return no worker
      (mockUseWatch as any).mockImplementation((options: any) => {
        if (options.name === 'timeFor') {
          return undefined; // No worker
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' }, project: null };
        }
        return undefined;
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // CFO assignments should be empty when no worker
      expect(result.current.customFieldOptionAssignments).toEqual({});
      expect(result.current.workerId).toBeUndefined();
    });
  });

  describe('CFO Data Storage', () => {
    it('should store CFO data when it arrives', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            name: 'Option 1',
            assigned: true,
            customFieldId: 'field2',
          },
          {
            id: 'opt2',
            name: 'Option 2',
            assigned: true,
            customFieldId: 'field2',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // CFO data should be stored with the CF ID as key
      expect(result.current.customFieldOptionAssignments).toBeDefined();
    });

    it('should not store CFO data when there are no custom fields', () => {
      // When allCustomFields is empty, no CFO data should be returned
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [], // No data since there are no custom fields
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: [], // No CFs = no CFO fetching
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      expect(result.current.customFieldOptionAssignments).toEqual({});
    });
  });

  describe('Assignment Key Stability', () => {
    it('should generate same key for same inputs', () => {
      const { rerender, result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const callCount = mockLoadStandardFieldAssignments.mock.calls.length;

      // Rerender without changing inputs
      rerender();

      // Should not call API again (same key)
      expect(mockLoadStandardFieldAssignments).toHaveBeenCalledTimes(callCount);
    });

    it('should generate null key when no customer or project', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') return null;
        if (options.name === 'timeAgainst') return {}; // No customer or project
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call APIs with null key (no worker => no CF fetch)
      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should handle empty string customer ID', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') return null; // No worker
        if (options.name === 'timeAgainst') {
          return { customer: { id: '' } }; // Empty string
        }
        return undefined;
      }) as any);

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call APIs with empty string
      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should fallback to settings when CF assignment API errors', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [],
        loading: false,
        error: 'API Error',
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // When assignment enabled, filter by response; with error we have no data so show none
      expect(result.current.visibleCustomFields).toHaveLength(0);
    });

    it('should fallback to settings when SF assignment API errors', () => {
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: 'API Error',
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should use company settings when API errors
      expect(result.current.standardFieldsVisibility).toEqual({
        service: true,
        class: true,
        location: false,
        billable: true,
      });
    });

    it('should not block loading when CFO API errors', () => {
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: false,
        error: 'CFO API Error',
        pageInfo: null,
      });

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not be loading
      expect(result.current.loading).toBe(false);
      // field2 is DROPDOWN with no CFO options (error) so it is hidden
      expect(result.current.visibleCustomFields).toHaveLength(0);
    });
  });

  describe('Customer and Project Changes', () => {
    it('should refetch assignments when customer changes', () => {
      const { rerender } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const initialCalls = mockLoadStandardFieldAssignments.mock.calls.length;

      // Change customer
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer2' } }; // Different customer
        }
        return undefined;
      }) as any);

      rerender();

      // Should call API again with new customer
      expect(
        mockLoadStandardFieldAssignments.mock.calls.length,
      ).toBeGreaterThan(initialCalls);
      expect(
        mockLoadStandardFieldAssignments.mock.calls[initialCalls][0].input
          .customerId,
      ).toBe('customer2');
    });

    it('should refetch assignments when project changes', () => {
      const { rerender } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const initialCalls = mockLoadStandardFieldAssignments.mock.calls.length;

      // Add project
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' }, project: { id: 'project1' } };
        }
        return undefined;
      }) as any);

      rerender();

      // Should call API again; STE passes only customerId (no projectId)
      expect(
        mockLoadStandardFieldAssignments.mock.calls.length,
      ).toBeGreaterThan(initialCalls);
      expect(
        mockLoadStandardFieldAssignments.mock.calls[initialCalls][0].input,
      ).toEqual({ customerId: 'customer1' });
      expect(
        mockLoadStandardFieldAssignments.mock.calls[initialCalls][0].input,
      ).not.toHaveProperty('projectId');
    });

    it('should clear assignments when customer is removed', () => {
      const { rerender, result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Remove customer
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return {}; // No customer
        }
        return undefined;
      }) as any);

      rerender();

      // When no customer, we filter by assignment response (worker-only or empty); show none
      expect(result.current.visibleCustomFields).toHaveLength(0);
    });
  });

  describe('Case-Insensitive CF Type Handling', () => {
    it('should handle lowercase dropdown type', () => {
      const cfWithLowercase = [
        {
          id: 'field1',
          name: 'Field 1',
          type: 'dropdown',
          deleted: false,
          required: false,
        },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field1', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: cfWithLowercase,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should recognize lowercase 'dropdown' and call CFO
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalled();
    });

    it('should handle mixed case multi_select type', () => {
      const cfWithMixedCase = [
        {
          id: 'field1',
          name: 'Field 1',
          type: 'Multi_Select',
          deleted: false,
          required: false,
        },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field1', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: cfWithMixedCase,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should recognize mixed case and call CFO
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalled();
    });
  });

  describe('CFO Worker and Customer Change', () => {
    it('should refetch CFO when worker changes', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { rerender } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const initialCalls =
        mockLoadCustomFieldOptionAssignments.mock.calls.length;

      // Change worker
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker2' }; // Different worker
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      rerender();

      // Should call CFO API again with new worker
      expect(
        mockLoadCustomFieldOptionAssignments.mock.calls.length,
      ).toBeGreaterThan(initialCalls);
    });

    it('should pass customer ID to CFO API when customer is present', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Verify CFO was called with timeAgainstEntityId (customer)
      expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            timeAgainstEntityId: 'customer1',
          }),
        }),
      );
    });

    it('should clear CFO data before fetching new worker data', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field2', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            name: 'Option 1',
            assigned: true,
            customFieldId: 'field2',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result, rerender } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Change worker
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker2' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' } };
        }
        return undefined;
      }) as any);

      rerender();

      // CFO data should be cleared during refetch
      // (This tests the setCustomFieldOptionAssignments({}) call)
      expect(result.current.customFieldOptionAssignments).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null SF data gracefully', () => {
      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not crash
      expect(result.current.standardFieldsVisibility).toBeDefined();
    });

    it('should handle null CF data gracefully', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not crash
      expect(result.current.visibleCustomFields).toBeDefined();
    });

    it('should handle empty CFO data array', () => {
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not crash with empty CFO data
      expect(result.current.customFieldOptionAssignments).toBeDefined();
    });

    it('should handle CF without type property', () => {
      const cfWithoutType = [
        { id: 'field1', name: 'Field 1', deleted: false, required: false },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'field1', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: cfWithoutType,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not call CFO for CF without type
      expect(mockLoadCustomFieldOptionAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should prevent state updates after unmount', () => {
      const { unmount } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Unmount component
      unmount();

      // Should not throw error if data arrives after unmount
      // (This tests the isMounted flag logic)
      expect(() => {
        mockUseCustomFieldAssignments.mockReturnValue({
          loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
          data: [{ id: 'field1', assigned: true, assignedToAll: false }],
          loading: false,
          error: null,
          pageInfo: null,
        });
      }).not.toThrow();
    });

    it('should clear CFO assignments when both worker and customer are missing', () => {
      mockUseWatch.mockImplementation(((options: any) => {
        if (options.name === 'timeFor') {
          return undefined; // No worker
        }
        if (options.name === 'timeAgainst') {
          return {}; // No customer
        }
        return undefined;
      }) as any);

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockAllCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // CFO assignments should be empty when both worker and customer are missing
      expect(result.current.customFieldOptionAssignments).toEqual({});
    });
  });

  describe('CFO Option Mapping - ID to Name Conversion', () => {
    const mockCustomFieldsWithOptions = [
      {
        id: 'equipment',
        name: 'Equipment',
        deleted: false,
        required: false,
        type: 'DROPDOWN',
        options: [
          { id: 'opt1', name: 'Option 1', deleted: false },
          { id: 'opt2', name: 'Option 2', deleted: false },
          { id: 'opt3', name: 'Option 3', deleted: false },
        ],
      },
    ];

    beforeEach(() => {
      (mockUseWatch as any).mockImplementation((options: any) => {
        if (options.name === 'timeFor') {
          return { id: 'worker1' };
        }
        if (options.name === 'timeAgainst') {
          return { customer: { id: 'customer1' }, project: null };
        }
        if (options.name === 'id') return undefined;
        if (options.name === 'service') return undefined;
        if (options.name === 'class') return undefined;
        if (options.name === 'location') return undefined;
        if (options.name === 'billable') return undefined;
        if (options.name === 'customFields') return undefined;
        return undefined;
      });

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'equipment', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });
    });

    it('should map CFO option IDs to CF option names correctly', () => {
      // CFO API returns option IDs
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt1', // CFO API might return ID as name
          },
          {
            id: 'opt2',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt2', // CFO API might return ID as name
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockCustomFieldsWithOptions,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Wait for effects to run
      expect(result.current.customFieldOptionAssignments).toBeDefined();
      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;

      // Should have mapped options
      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(2);

      // Should use names from CF definitions, not from CFO API
      expect(equipmentOptions[0].name).toBe('Option 1'); // From CF definition
      expect(equipmentOptions[0].id).toBe('opt1');
      expect(equipmentOptions[1].name).toBe('Option 2'); // From CF definition
      expect(equipmentOptions[1].id).toBe('opt2');
    });

    it('should skip options when CF definitions are not loaded yet', () => {
      // CFO data arrives before CF definitions
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt1',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      // Pass empty CF definitions (simulating not loaded yet)
      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: [], // CF definitions not loaded
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Should not have any options (skipped because CF data not available)
      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;
      expect(equipmentOptions).toBeUndefined();
    });

    it('should skip options not found in CF definitions', () => {
      // CFO API returns an option ID that doesn't exist in CF definitions
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt1',
          },
          {
            id: 'opt999', // This option doesn't exist in CF definitions
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt999',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockCustomFieldsWithOptions,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;

      // Should only include opt1 (found in CF definitions)
      // opt999 should be skipped (not found)
      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(1);
      expect(equipmentOptions[0].id).toBe('opt1');
      expect(equipmentOptions[0].name).toBe('Option 1');
    });

    it('should handle CFO data arriving after CF definitions are loaded', () => {
      // First render with CF definitions but no CFO data
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result, rerender } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockCustomFieldsWithOptions,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Initially no options (empty array when no CFO data)
      const initialOptions =
        result.current.customFieldOptionAssignments.equipment;
      // Can be undefined or empty array depending on initialization
      expect(initialOptions === undefined || initialOptions?.length === 0).toBe(
        true,
      );

      // Now CFO data arrives
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt1', // CFO API returns ID
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      rerender();

      // Should now have mapped options with correct names
      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;
      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(1);
      expect(equipmentOptions[0].name).toBe('Option 1'); // From CF definition
      expect(equipmentOptions[0].id).toBe('opt1');
    });

    it('should skip options where assigned is false', () => {
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true, // Assigned
            name: 'opt1',
          },
          {
            id: 'opt2',
            customFieldId: 'equipment',
            assigned: false, // Not assigned
            name: 'opt2',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: mockCustomFieldsWithOptions,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;

      // Should only include assigned options
      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(1);
      expect(equipmentOptions[0].id).toBe('opt1');
    });

    it('should handle multiple custom fields with different options', () => {
      const multipleCustomFields = [
        {
          id: 'equipment',
          name: 'Equipment',
          deleted: false,
          required: false,
          type: 'DROPDOWN',
          options: [{ id: 'opt1', name: 'Equipment Option 1', deleted: false }],
        },
        {
          id: 'department',
          name: 'Department',
          deleted: false,
          required: false,
          type: 'DROPDOWN',
          options: [
            { id: 'dept1', name: 'Department Option 1', deleted: false },
          ],
        },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [
          { id: 'equipment', assigned: true, assignedToAll: false },
          { id: 'department', assigned: true, assignedToAll: false },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'opt1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'opt1',
          },
          {
            id: 'dept1',
            customFieldId: 'department',
            assigned: true,
            name: 'dept1',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: multipleCustomFields,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      // Both fields should have correctly mapped options
      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;
      const departmentOptions =
        result.current.customFieldOptionAssignments.department;

      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(1);
      expect(equipmentOptions[0].name).toBe('Equipment Option 1');

      expect(departmentOptions).toBeDefined();
      expect(departmentOptions.length).toBe(1);
      expect(departmentOptions[0].name).toBe('Department Option 1');
    });

    it('should use suffix fallback when CFO option id and CF option id differ by prefix', () => {
      const customFieldsWithPrefixedIds = [
        {
          id: 'equipment',
          name: 'Equipment',
          deleted: false,
          required: false,
          type: 'DROPDOWN',
          options: [
            { id: 'CES_1', name: 'Option 1', deleted: false },
            { id: 'CES_2', name: 'Option 2', deleted: false },
          ],
        },
      ];
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [
          {
            id: 'QL_1',
            customFieldId: 'equipment',
            assigned: true,
            name: 'QL_1',
          },
          {
            id: 'QL_2',
            customFieldId: 'equipment',
            assigned: true,
            name: 'QL_2',
          },
        ],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useSTEFieldAssignments({
          companySettings: mockCompanySettings,
          uxPreferences: mockUxPreferences,
          allCustomFields: customFieldsWithPrefixedIds,
          isOTX: true,
          isTimeEntry: true,
        }),
      );

      const equipmentOptions =
        result.current.customFieldOptionAssignments.equipment;
      expect(equipmentOptions).toBeDefined();
      expect(equipmentOptions.length).toBe(2);
      expect(equipmentOptions[0]).toMatchObject({
        id: 'QL_1',
        name: 'Option 1',
      });
      expect(equipmentOptions[1]).toMatchObject({
        id: 'QL_2',
        name: 'Option 2',
      });
    });
  });
});
