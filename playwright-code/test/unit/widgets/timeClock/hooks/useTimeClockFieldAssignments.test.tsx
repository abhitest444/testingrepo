import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { useTimeClockFieldAssignments } from 'src/js/widgets/timeClock/hooks/useTimeClockFieldAssignments';
import { useCustomFieldAssignments } from 'src/js/service/hooks/assignments/useCustomFieldAssignments';
import { useCustomFieldOptionAssignments } from 'src/js/service/hooks/assignments/useCustomFieldOptionAssignments';
import { useStandardFieldAssignments } from 'src/js/service/hooks/assignments/useStandardFieldAssignments';
import { useStandardFieldOptionAssignments } from 'src/js/service/hooks/assignments/useStandardFieldOptionAssignments';

// Mock the hooks
jest.mock('react-hook-form', () => ({
  useWatch: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({ logger: { info: jest.fn() } })),
}));

jest.mock('src/js/service/hooks/assignments/useCustomFieldAssignments');
jest.mock('src/js/service/hooks/assignments/useCustomFieldOptionAssignments');
jest.mock('src/js/service/hooks/assignments/useStandardFieldAssignments');
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

describe('useTimeClockFieldAssignments', () => {
  const mockLoadCustomFieldAssignments = jest.fn();
  const mockLoadStandardFieldAssignments = jest.fn();
  const mockLoadCustomFieldOptionAssignments = jest.fn();
  const mockLoadStandardFieldOptionAssignments = jest.fn();

  const mockCompanySettings = {
    isServiceFieldEnabled: true,
    isClassEnabled: true,
    isLocationEnabled: true,
    isTsheetClassEnabled: true,
    isTsheetLocationEnabled: true,
    isBillingFieldEnabled: true,
  };

  const mockCompanySettingsWithDisabledLocation = {
    isServiceFieldEnabled: true,
    isClassEnabled: true,
    isLocationEnabled: false, // Disabled - this will trigger SF assignment calls
    isTsheetClassEnabled: true,
    isTsheetLocationEnabled: true,
    isBillingFieldEnabled: true,
  };

  const mockCustomFields = [
    {
      id: 'cf1',
      name: 'Department',
      type: 'TEXT',
      deleted: false,
      required: false,
    },
    {
      id: 'cf2',
      name: 'Project Type',
      type: 'DROPDOWN',
      deleted: false,
      required: false,
    },
  ];

  const mockTimeFor = { id: 'worker1', name: 'John Doe' };
  const mockTimeAgainst = {
    customer: { id: 'customer1', name: 'Acme Corp' },
    project: { id: 'project1', name: 'Website Redesign' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset useWatch to default behavior
    (useWatch as any).mockImplementation((props: any) => {
      if (props.name === 'timeFor') return mockTimeFor;
      if (props.name === 'timeAgainst') return mockTimeAgainst;
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

    mockUseStandardFieldOptionAssignments.mockReturnValue({
      loadStandardFieldOptionAssignments:
        mockLoadStandardFieldOptionAssignments,
      data: [],
      loading: false,
      error: null,
      pageInfo: null,
    });
  });

  describe('Assignment behavior', () => {
    it('should fetch assignments when customer is selected', async () => {
      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalled();
      });
    });

    it('should not fetch assignments when no customer and no worker', () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst') return null;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should fetch CF with null input when worker present but no customer (worker-only)', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return mockTimeFor;
        if (props.name === 'timeAgainst') return null;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
          input: { customerId: null },
          filter: { assigned: true },
          first: 100,
        });
      });
      expect(mockLoadStandardFieldAssignments).not.toHaveBeenCalled();
    });

    it('should fetch assignments even when worker is not selected', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst') return mockTimeAgainst;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
      });
    });

    it('should filter custom fields based on assignment data', async () => {
      const mockCFData = [
        { id: 'cf1', name: 'Department', assigned: true, assignedToAll: false },
        {
          id: 'cf2',
          name: 'Project Type',
          assigned: false,
          assignedToAll: false,
        },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(result.current.visibleCustomFields).toHaveLength(1);
        expect(result.current.visibleCustomFields[0].id).toBe('cf1');
      });
    });

    it('should calculate SF visibility from assignments', async () => {
      const mockSFData = [
        { name: 'SERVICE_ITEM', assigned: true },
        { name: 'CLASS', assigned: true },
        { name: 'LOCATION', assigned: false },
        { name: 'BILLABLE', assigned: true },
      ];

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: mockSFData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(result.current.standardFieldsVisibility).toEqual({
          service: true,
          class: true,
          location: false,
          billable: true,
        });
      });
    });

    it('should fetch CFO for dropdown fields when worker is present', async () => {
      const dropdownFields = [
        {
          id: 'cf1',
          name: 'Department',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
        {
          id: 'cf2',
          name: 'Status',
          type: 'MULTI_SELECT',
          deleted: false,
          required: false,
        },
      ];

      const mockCFData = [
        { id: 'cf1', name: 'Department', assigned: true, assignedToAll: false },
        { id: 'cf2', name: 'Status', assigned: true, assignedToAll: false },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: dropdownFields,
        }),
      );

      await waitFor(() => {
        // Time Clock makes a single call with all dropdown CF IDs as an array
        expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalledWith({
          input: {
            timeForEntityId: 'worker1',
            timeAgainstEntityId: 'customer1',
            customFieldIds: ['cf1', 'cf2'], // Array of CF IDs
          },
          filter: {
            assigned: true,
            active: true,
          },
          first: 100,
        });
      });
    });

    it('should fetch CFO for CFs with type string that have options (listtype-style)', async () => {
      const fieldsWithStringAndOptions = [
        {
          id: 'udcf_listtype',
          name: 'listtype',
          type: 'string',
          deleted: false,
          required: false,
          options: [
            { id: 'opt_1', name: 'Opt 1', deleted: false },
            { id: 'opt_2', name: 'Opt 2', deleted: false },
          ],
        },
      ];
      const mockCFData = [
        { id: 'udcf_listtype', assigned: true, assignedToAll: false },
      ];
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: fieldsWithStringAndOptions,
        }),
      );

      await waitFor(() => {
        expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalledWith({
          input: {
            timeForEntityId: 'worker1',
            timeAgainstEntityId: 'customer1',
            customFieldIds: ['udcf_listtype'],
          },
          filter: { assigned: true, active: true },
          first: 100,
        });
      });
    });

    it('should show dropdown CFs in visibleCustomFields while CFO is loading', async () => {
      const dropdownFields = [
        {
          id: 'cf1',
          name: 'Text',
          type: 'TEXT',
          deleted: false,
          required: false,
        },
        {
          id: 'cf2',
          name: 'Status',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
      ];
      const mockCFData = [
        { id: 'cf1', assigned: true, assignedToAll: false },
        { id: 'cf2', assigned: true, assignedToAll: false },
      ];
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: true,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: dropdownFields,
        }),
      );

      await waitFor(() => {
        expect(result.current.visibleCustomFields).toHaveLength(2);
        expect(result.current.visibleCustomFields.map((f) => f.id)).toEqual([
          'cf1',
          'cf2',
        ]);
      });
    });

    it('should NOT fetch CFO when customer is present without worker', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null; // No worker
        if (props.name === 'timeAgainst') return mockTimeAgainst;
        return undefined;
      });

      const dropdownFields = [
        {
          id: 'cf1',
          name: 'Department',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
      ];

      const mockCFData = [
        { id: 'cf1', name: 'Department', assigned: true, assignedToAll: false },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: dropdownFields,
        }),
      );

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT call CFO when worker is not present
      expect(mockLoadCustomFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should fetch SF when worker or customer is present (SFO is handled by QuickFind)', async () => {
      // Use settings with at least one SF disabled so sfFilterAssigned is true (hook only fetches SF when assigned filter is true)
      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
      });

      expect(mockLoadStandardFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should NOT fetch SFO with customer only when worker is not present', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst') return mockTimeAgainst;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      // Wait a bit to ensure no calls are made
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should NOT call SFO when worker is not present
      expect(mockLoadStandardFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should not fetch SFO when neither worker nor customer is present', () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst') return null;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      expect(mockLoadStandardFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should handle assignment errors gracefully', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [],
        loading: false,
        error: 'Failed to fetch',
        pageInfo: null,
      });

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: 'Failed to fetch',
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      // When there's an error, SF visibility falls back to company settings
      expect(result.current.standardFieldsVisibility).toEqual({
        service: true,
        class: true,
        location: true,
        billable: true,
      });
      // CF visibility still filters by assignment response; with no data we show none
      expect(result.current.visibleCustomFields).toEqual([]);
    });

    it('should return loading state', () => {
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [],
        loading: true,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      expect(result.current.loading).toBe(true);
    });

    it('should not fetch CF assignments when no custom fields exist', async () => {
      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: [],
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
        expect(mockLoadCustomFieldAssignments).not.toHaveBeenCalled();
      });
    });

    it('should call SF assignment with assigned: true when customer is present', async () => {
      const partialSettings = {
        ...mockCompanySettings,
        isServiceFieldEnabled: false,
      };

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: partialSettings,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalledWith({
          input: {
            customerId: 'customer1',
          },
          filter: {
            assigned: true,
          },
          first: 100,
        });
      });
    });

    it('should fetch CF when worker only (no customer); SFO is handled by QuickFind', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return mockTimeFor;
        if (props.name === 'timeAgainst') return null;
        return undefined;
      });

      const settingsWithDisabledService = {
        ...mockCompanySettings,
        isServiceFieldEnabled: false,
        isClassEnabled: true,
        isLocationEnabled: true,
        isBillingFieldEnabled: true,
      };

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: settingsWithDisabledService,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalledWith({
          input: { customerId: null },
          filter: { assigned: true },
          first: 100,
        });
      });

      expect(mockLoadStandardFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should not fetch SFO when worker only (SFO handled by QuickFind)', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return mockTimeFor;
        if (props.name === 'timeAgainst') return null;
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadCustomFieldAssignments).toHaveBeenCalled();
      });

      // SF is only fetched when customer/project present; SFO is never fetched here
      expect(mockLoadStandardFieldOptionAssignments).not.toHaveBeenCalled();
    });

    it('should hide dropdown CFs that have no options assigned', async () => {
      const dropdownFields = [
        {
          id: 'cf1',
          name: 'Dept',
          type: 'TEXT',
          deleted: false,
          required: false,
        },
        {
          id: 'cf2',
          name: 'Status',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
      ];
      const mockCFData = [
        { id: 'cf1', assigned: true, assignedToAll: false },
        { id: 'cf2', assigned: true, assignedToAll: false },
      ];
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });
      // CFO returns empty for cf2 so it should be hidden from visibleCustomFields
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: dropdownFields,
        }),
      );

      await waitFor(() => {
        expect(result.current.visibleCustomFields).toHaveLength(1);
        expect(result.current.visibleCustomFields[0].id).toBe('cf1');
      });
    });

    it('should store CFO data with option names from CF definition', async () => {
      const fieldsWithOptions = [
        {
          id: 'cf1',
          name: 'Dept',
          type: 'DROPDOWN',
          options: [
            { id: 'opt1', name: 'Option One', deleted: false },
            { id: 'opt2', name: 'Option Two', deleted: false },
          ],
          deleted: false,
          required: false,
        },
      ];
      const mockCFData = [{ id: 'cf1', assigned: true, assignedToAll: false }];
      const mockCFOData = [
        {
          id: 'opt1',
          customFieldId: 'cf1',
          name: 'Option One',
          assigned: true,
        },
      ];

      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: mockCFData,
        loading: false,
        error: null,
        pageInfo: null,
      });
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: mockCFOData,
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: fieldsWithOptions,
        }),
      );

      await waitFor(() => {
        expect(result.current.customFieldOptionAssignments.cf1).toBeDefined();
        expect(result.current.customFieldOptionAssignments.cf1).toHaveLength(1);
        expect(
          result.current.customFieldOptionAssignments.cf1[0],
        ).toMatchObject({ id: 'opt1', assigned: true });
      });
    });

    it('should use suffix fallback when CFO option id and CF option id differ by prefix', async () => {
      const fieldsWithPrefixedOptions = [
        {
          id: 'cf1',
          name: 'Dept',
          type: 'DROPDOWN',
          options: [
            { id: 'CES_1', name: 'Option One', deleted: false },
            { id: 'CES_2', name: 'Option Two', deleted: false },
          ],
          deleted: false,
          required: false,
        },
      ];
      const mockCFODataWithPrefix = [
        {
          id: 'QL_1',
          customFieldId: 'cf1',
          name: 'QL_1',
          assigned: true,
        },
        {
          id: 'QL_2',
          customFieldId: 'cf1',
          name: 'QL_2',
          assigned: true,
        },
      ];
      mockUseCustomFieldAssignments.mockReturnValue({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data: [{ id: 'cf1', assigned: true, assignedToAll: false }],
        loading: false,
        error: null,
        pageInfo: null,
      });
      mockUseCustomFieldOptionAssignments.mockReturnValue({
        loadCustomFieldOptionAssignments: mockLoadCustomFieldOptionAssignments,
        data: mockCFODataWithPrefix,
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: fieldsWithPrefixedOptions,
        }),
      );

      await waitFor(() => {
        expect(result.current.customFieldOptionAssignments.cf1).toBeDefined();
        expect(result.current.customFieldOptionAssignments.cf1).toHaveLength(2);
        expect(
          result.current.customFieldOptionAssignments.cf1[0],
        ).toMatchObject({ id: 'QL_1', name: 'Option One' });
        expect(
          result.current.customFieldOptionAssignments.cf1[1],
        ).toMatchObject({ id: 'QL_2', name: 'Option Two' });
      });
    });

    it('should not call CFO when customer present but CF data not yet loaded for that customer', async () => {
      let timeAgainstValue: any = mockTimeAgainst;
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return mockTimeFor;
        if (props.name === 'timeAgainst') return timeAgainstValue;
        return undefined;
      });

      const dropdownFields = [
        {
          id: 'cf1',
          name: 'Dept',
          type: 'DROPDOWN',
          deleted: false,
          required: false,
        },
      ];
      const mockCFDataForCustomer1 = [
        { id: 'cf1', assigned: true, assignedToAll: false },
      ];

      mockUseCustomFieldAssignments.mockImplementation((): any => ({
        loadCustomFieldAssignments: mockLoadCustomFieldAssignments,
        data:
          timeAgainstValue?.customer?.id === 'customer1'
            ? mockCFDataForCustomer1
            : undefined,
        loading: false,
        error: null,
        pageInfo: null,
      }));

      mockUseStandardFieldAssignments.mockReturnValue({
        loadStandardFieldAssignments: mockLoadStandardFieldAssignments,
        data: [],
        loading: false,
        error: null,
        pageInfo: null,
      });

      const { result, rerender } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: dropdownFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadCustomFieldOptionAssignments).toHaveBeenCalled();
      });

      mockLoadCustomFieldOptionAssignments.mockClear();
      timeAgainstValue = {
        customer: { id: 'customer2', name: 'Other' },
        project: { id: 'project2', name: 'Other' },
      };
      rerender();

      await new Promise((r) => setTimeout(r, 50));
      expect(mockLoadCustomFieldOptionAssignments).not.toHaveBeenCalled();
    });
  });

  describe('Return Values', () => {
    it('should return all expected fields', () => {
      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      expect(result.current).toHaveProperty('visibleCustomFields');
      expect(result.current).toHaveProperty('standardFieldsVisibility');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('workerId');
      expect(result.current).toHaveProperty('customerId');
      expect(result.current).toHaveProperty('projectId');
      expect(result.current).toHaveProperty('customFieldOptionAssignments');
    });

    it('should extract correct IDs from form values', () => {
      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      expect(result.current.workerId).toBe('worker1');
      expect(result.current.customerId).toBe('customer1');
      expect(result.current.projectId).toBe('project1');
    });
  });

  describe('Assignment Key Logic', () => {
    it('should create assignment key with customer only', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst')
          return {
            customer: { id: 'customer1', name: 'Test' },
            project: null,
          };
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
      });
    });

    it('should create assignment key with project only', async () => {
      (useWatch as any).mockImplementation((props: any) => {
        if (props.name === 'timeFor') return null;
        if (props.name === 'timeAgainst')
          return {
            customer: null,
            project: { id: 'project1', name: 'Test Project' },
          };
        return undefined;
      });

      renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettingsWithDisabledLocation,
          allCustomFields: mockCustomFields,
        }),
      );

      await waitFor(() => {
        expect(mockLoadStandardFieldAssignments).toHaveBeenCalled();
      });
    });
  });

  describe('CFO Data Storage', () => {
    it('should initialize customFieldOptionAssignments as empty object', () => {
      const { result } = renderHook(() =>
        useTimeClockFieldAssignments({
          companySettings: mockCompanySettings,
          allCustomFields: mockCustomFields,
        }),
      );

      // Should start with empty object
      expect(result.current.customFieldOptionAssignments).toEqual({});
    });
  });
});
