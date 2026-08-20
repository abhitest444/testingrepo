import { renderHook } from '@testing-library/react-hooks';
import {
  useTransformTimeEntries,
  BillableContext,
} from '../../../../../src/js/service/hooks/weeklyTimeEntries/useTransformTimeEntries';
import {
  TimeTracking_TimeForType,
  TimeTracking_BillableStatus,
} from '../../../../../src/__generated__/timeTracking/graphql';
import { DataAccess_ContactType } from '../../../../../src/__generated__/oigql/graphql';
import type {
  TimesheetRow,
  TeamMember,
  timeEntryDetails,
} from '../../../../../src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import { TimeForType } from '../../../../../src/js/widgets/weeklyTimeEntry/types';
import type { DimensionDefinition } from '../../../../../src/js/widgets/common/dimensions/types';
import { getFormattedCellHours } from '../../../../../src/js/widgets/weeklyTimeEntry/utils/helpers';
import { useIXPFeatureFlag } from '../../../../../src/js/common/useIXPFeatureFlag';

jest.mock('../../../../../src/js/common/useIXPFeatureFlag');

const mockLegacyQboUserFlag = (isEnabled: boolean) =>
  (useIXPFeatureFlag as jest.Mock).mockReturnValue({
    isEnabled,
    isLoading: false,
    error: null,
    settled: true,
  });

beforeEach(() => {
  // Default flag-off: preserves pre-flag behavior for all existing tests.
  mockLegacyQboUserFlag(false);
});

describe('useTransformTimeEntries', () => {
  const defaultBillableContext: BillableContext = {
    isBillingFieldEnabled: true,
    customerAssignmentsMap: {},
  };

  const mockTeamMember: TeamMember = {
    id: 'emp-123',
    name: 'John Doe',
    type: TimeForType.EMPLOYEE,
  };

  const mockVendorTeamMember: TeamMember = {
    id: 'vendor-123',
    name: 'Jane Vendor',
    type: TimeForType.VENDOR,
  };

  const mockDateRange = {
    start: '2024-01-01',
    end: '2024-01-07',
  };

  const createMockTimeEntryDetails = (
    overrides: Partial<timeEntryDetails> = {},
  ): timeEntryDetails => ({
    timeEntryId: 'entry-1',
    date: '2024-01-01',
    hours: 8,
    notes: 'Test work',
    operation: 'CREATE' as const,
    billableInfo: {
      billable: true,
      billableRate: '50.00',
    },
    isApproved: false,
    metaInfo: {
      class: { id: 'class-1', name: 'Development' },
      service: { id: 'service-1', name: 'Programming' },
      location: { id: 'location-1', name: 'Main Office' },
    },
    customFields: [
      {
        id: 'udcf_1000000002',
        name: 'Region',
        value: 'NorthEast',
        optionID: '',
      },
      { id: 'udcf_1000000003', name: 'Mileage', value: '20', optionID: '' },
    ],
    ...overrides,
  });

  const createMockTimesheetRow = (
    overrides: Partial<TimesheetRow> = {},
  ): TimesheetRow => ({
    rowId: 'row-1',
    timeAgainst: {
      id: 'customer-1',
      displayName: 'customer-1',
      type: DataAccess_ContactType.Customer,
    },
    timeEntries: {
      0: createMockTimeEntryDetails({
        date: '2024-01-01',
        timeEntryId: 'entry-1',
        operation: 'CREATE',
        isApproved: false,
      }),
      1: createMockTimeEntryDetails({
        date: '2024-01-02',
        timeEntryId: 'entry-2',
        hours: 4,
        operation: 'UPDATE',
        billableInfo: { billable: false, billableRate: undefined },
        metaInfo: {},
        isApproved: false,
      }),
    },
    totalHours: 12,
    billableTotal: 400,
    hasApprovedEntries: false,
    ...overrides,
  });

  describe('transformToTimeEntries', () => {
    it('should transform timesheet data to GraphQL mutation input', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );

      expect(transformed).toHaveLength(2);

      // Check first entry (CREATE operation)
      expect(transformed[0]).toEqual({
        id: 'entry-1',
        date: '2024-01-01',
        duration: 28800, // 8 hours * 3600 seconds
        timeFor: {
          id: 'emp-123',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: 'customer-1',
        },
        classID: 'class-1',
        serviceItemID: 'service-1',
        departmentID: 'location-1',
        departmentLabel: 'Main Office',
        billableStatus: TimeTracking_BillableStatus.Billable,
        billableRate: 50.0,
        notes: 'Test work',
        customFields: [
          {
            id: 'udcf_1000000002',
            name: 'Region',
            value: 'NorthEast',
            optionID: '',
          },
          { id: 'udcf_1000000003', name: 'Mileage', value: '20', optionID: '' },
        ],
      });

      // Check second entry (UPDATE operation)
      expect(transformed[1]).toEqual({
        id: 'entry-2',
        date: '2024-01-02',
        duration: 14400, // 4 hours * 3600 seconds
        timeFor: {
          id: 'emp-123',
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: 'customer-1',
        },
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        billableRate: null,
        notes: 'Test work',
        customFields: [
          {
            id: 'udcf_1000000002',
            name: 'Region',
            value: 'NorthEast',
            optionID: '',
          },
          { id: 'udcf_1000000003', name: 'Mileage', value: '20', optionID: '' },
        ],
      });
    });

    it('should handle vendor team member type', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockVendorTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].timeFor).toEqual({
        id: 'vendor-123',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
    });

    it('should handle project timeAgainst type (WTE sends customer id only)', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const projectRow = createMockTimesheetRow({
        timeAgainst: {
          id: 'customer-for-project-1',
          displayName: 'project-1',
          type: 'PROJECT',
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [projectRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      // WTE sends customerId only, even when type is project
      expect(transformed[0].timeAgainst).toEqual({
        customerId: 'customer-for-project-1',
      });
    });

    it('should include custom fields in transformed entries', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].customFields).toEqual([
        {
          id: 'udcf_1000000002',
          name: 'Region',
          value: 'NorthEast',
          optionID: '',
        },
        { id: 'udcf_1000000003', name: 'Mileage', value: '20', optionID: '' },
      ]);
    });

    it('should include custom dimensions in customExtensions payload', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithDimensions = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            dimensions: [
              { id: 'dim-1', name: 'Department', optionID: 'opt-1' },
              { id: 'dim-2', name: 'Location', optionID: 'opt-2' },
            ],
          }),
        },
      });

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [rowWithDimensions],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].customExtensions).toEqual({
        dimensions: [
          { definitionId: 'dim-1', values: ['opt-1'] },
          { definitionId: 'dim-2', values: ['opt-2'] },
        ],
      });
    });

    it('should omit customExtensions when no dimensions are set', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].customExtensions).toBeUndefined();
    });

    it('should send [] when a previously-saved custom dimension is cleared on edit', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      // An edit cell (timeEntryId set) where a saved custom value was cleared
      // surfaces with optionID '' (non-null). mapDimensionsToPayload sends [] so
      // the backend learns of the clear rather than silently retaining the
      // previously-saved value.
      const rowWithClearedDimension = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            dimensions: [{ id: 'dim-1', name: 'Department', optionID: '' }],
          }),
        },
      });

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [rowWithClearedDimension],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: [] }],
      });
    });

    it('echoes an unchanged removed worker default as ["-1"] on edit', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      // A removed worker default surfaces from the response as optionID '' with
      // activeValueIsDefault preserved. An unchanged edit must re-send ['-1']
      // (send the response value as is) rather than degrading to [].
      const rowWithRemovedDefault = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            dimensions: [
              {
                id: 'dim-1',
                name: 'Department',
                optionID: '',
                activeValueIsDefault: true,
              },
            ],
          }),
        },
      });

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [rowWithRemovedDefault],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: ['-1'] }],
      });
    });

    it('echoes an unchanged persisted value as is on edit', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithValue = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            dimensions: [
              { id: 'dim-1', name: 'Department', optionID: 'opt-7' },
            ],
          }),
        },
      });

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [rowWithValue],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: ['opt-7'] }],
      });
    });

    describe('create-flow dimension seeding', () => {
      const dimensionDefs: DimensionDefinition[] = [
        {
          id: 'dim-default',
          name: 'Job Costs',
          active: true,
          enabledForTimeTracking: true,
          required: false,
          workerDefaultOptionId: 'default-opt',
        },
        {
          id: 'dim-no-default',
          name: 'Department',
          active: true,
          enabledForTimeTracking: true,
          required: false,
        },
        {
          id: 'dim-hidden',
          name: 'Service Type',
          active: false,
          enabledForTimeTracking: false,
          required: false,
          workerDefaultOptionId: 'hidden-default',
        },
      ];

      const createCell = (dimensions?: timeEntryDetails['dimensions']) =>
        createMockTimeEntryDetails({
          // No timeEntryId → treated as a create.
          timeEntryId: undefined,
          operation: 'CREATE',
          ...(dimensions ? { dimensions } : {}),
        });

      it('seeds the worker default and omits no-default fields for an untouched create entry', () => {
        const { result } = renderHook(() => useTransformTimeEntries());

        const transformed = result.current.transformToTimeEntries(
          {
            weeklyTimeEntries: [
              createMockTimesheetRow({ timeEntries: { 0: createCell() } }),
            ],
            teamMember: mockTeamMember,
            dateRange: mockDateRange,
          },
          defaultBillableContext,
          dimensionDefs,
        );

        expect(transformed[0].customExtensions?.dimensions).toEqual([
          { definitionId: 'dim-default', values: ['default-opt'] },
        ]);
        // Hidden dimensions are never seeded; a visible field with no populated
        // value (dim-no-default) is omitted rather than sent as [].
        expect(transformed[0].customExtensions?.dimensions).toHaveLength(1);
      });

      it('keeps a user-selected value over the worker default on create', () => {
        const { result } = renderHook(() => useTransformTimeEntries());

        const transformed = result.current.transformToTimeEntries(
          {
            weeklyTimeEntries: [
              createMockTimesheetRow({
                timeEntries: {
                  0: createCell([
                    { id: 'dim-default', name: 'Job Costs', optionID: 'opt-9' },
                  ]),
                },
              }),
            ],
            teamMember: mockTeamMember,
            dateRange: mockDateRange,
          },
          defaultBillableContext,
          dimensionDefs,
        );

        expect(transformed[0].customExtensions?.dimensions).toEqual([
          { definitionId: 'dim-default', values: ['opt-9'] },
        ]);
      });

      it('sends ["-1"] when a prefilled default is cleared on create', () => {
        const { result } = renderHook(() => useTransformTimeEntries());

        const transformed = result.current.transformToTimeEntries(
          {
            weeklyTimeEntries: [
              createMockTimesheetRow({
                timeEntries: {
                  0: createCell([
                    { id: 'dim-default', name: 'Job Costs', optionID: '' },
                  ]),
                },
              }),
            ],
            teamMember: mockTeamMember,
            dateRange: mockDateRange,
          },
          defaultBillableContext,
          dimensionDefs,
        );

        expect(transformed[0].customExtensions?.dimensions).toEqual([
          { definitionId: 'dim-default', values: ['-1'] },
        ]);
      });
    });

    it('should handle entries without custom fields', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const entryWithoutCustomFields = createMockTimeEntryDetails({
        customFields: undefined,
      });

      const rowWithoutCustomFields = createMockTimesheetRow({
        timeEntries: {
          0: entryWithoutCustomFields,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithoutCustomFields],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].customFields).toBeUndefined();
    });

    it('should handle entries with empty custom fields array', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const entryWithEmptyCustomFields = createMockTimeEntryDetails({
        customFields: [],
      });

      const rowWithEmptyCustomFields = createMockTimesheetRow({
        timeEntries: {
          0: entryWithEmptyCustomFields,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithEmptyCustomFields],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].customFields).toBeUndefined();
    });

    it('should skip entries with DELETE operation', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithDeleteOperation = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 8,
            operation: 'DELETE',
            date: '2024-01-01',
          }),
          1: createMockTimeEntryDetails({
            hours: 8,
            operation: 'CREATE',
            date: '2024-01-02',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithDeleteOperation],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(1);
      expect(transformed[0].date).toBe('2024-01-02');
    });

    it('should skip entries with undefined hours', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithUndefinedHours = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: undefined,
            operation: 'CREATE',
            date: '2024-01-01',
          }),
          1: createMockTimeEntryDetails({
            hours: 8,
            operation: 'CREATE',
            date: '2024-01-02',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithUndefinedHours],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(1);
      expect(transformed[0].date).toBe('2024-01-02');
    });

    it('should skip rows without valid timeAgainst data when billable is active', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const invalidRow = createMockTimesheetRow({
        timeAgainst: {
          id: '',
          displayName: '',
          type: DataAccess_ContactType.Customer,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [invalidRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );

      expect(transformed).toHaveLength(0);
    });

    it('should skip rows without timeAgainst type when billable is active', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const invalidRow = createMockTimesheetRow({
        timeAgainst: {
          id: 'customer-1',
          displayName: 'customer-1',
          type: undefined as any,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [invalidRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );

      expect(transformed).toHaveLength(0);
    });

    it('should handle entries without timeEntryId (new entries)', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const newEntryRow = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            timeEntryId: '',
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [newEntryRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(1);
      expect(transformed[0]).not.toHaveProperty('id');
    });

    it('should handle decimal hours correctly', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const decimalHoursRow = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 8.5,
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [decimalHoursRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].duration).toBe(30600); // 8.5 hours * 3600 seconds
    });

    // QUANTA-11081 regression: covers the full HH:MM -> decimal hours -> seconds path.
    // `getFormattedCellHours('8:12')` computes 8 + 12/60 = 8.2, which in IEEE-754 is
    // not exactly representable; 8.2 * 3600 = 29519.999999999996. The GraphQL
    // `duration` field is typed as Int, so a non-integer causes OIGQL to reject the
    // mutation. Exercising getFormattedCellHours here (rather than hard-coding
    // `hours: 8.2`) guards against refactors in either the helper or the transformer.
    it.each([
      { input: '8:12', expectedSeconds: 29520 },
      { input: '4:06', expectedSeconds: 14760 },
      { input: '8:18', expectedSeconds: 29880 },
    ])(
      'should produce integer duration when HH:MM input ($input) parses to a float-imprecise decimal',
      ({ input, expectedSeconds }) => {
        const { result } = renderHook(() => useTransformTimeEntries());

        const parsedHours = getFormattedCellHours(input);

        const row = createMockTimesheetRow({
          timeEntries: {
            0: createMockTimeEntryDetails({
              hours: parsedHours,
              operation: 'CREATE',
            }),
          },
        });

        const transformed = result.current.transformToTimeEntries({
          weeklyTimeEntries: [row],
          teamMember: mockTeamMember,
          dateRange: mockDateRange,
        });

        expect(transformed[0].duration).toBe(expectedSeconds);
        expect(Number.isInteger(transformed[0].duration)).toBe(true);
      },
    );

    it('should handle missing optional metadata fields', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const minimalRow = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            notes: '',
            metaInfo: {},
            billableInfo: { billable: false, billableRate: undefined },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [minimalRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0]).not.toHaveProperty('classID');
      expect(transformed[0]).not.toHaveProperty('serviceItemID');
      expect(transformed[0]).not.toHaveProperty('departmentID');
      expect(transformed[0].notes).toBe('');
    });

    it('should include both departmentID and departmentLabel when location has both ID and name', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithLocation = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            metaInfo: {
              location: { id: 'location-1', name: 'Main Office' },
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithLocation],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].departmentID).toBe('location-1');
      expect(transformed[0].departmentLabel).toBe('Main Office');
    });

    it('should include only departmentID when location has only ID but no name', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithLocationIdOnly = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            metaInfo: {
              location: { id: 'location-1', name: undefined as any },
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithLocationIdOnly],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0].departmentID).toBe('location-1');
      expect(transformed[0]).not.toHaveProperty('departmentLabel');
    });

    it('should include only departmentLabel when location has only name but no ID', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithLocationNameOnly = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            metaInfo: {
              location: { id: undefined as any, name: 'Main Office' },
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithLocationNameOnly],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed[0]).not.toHaveProperty('departmentID');
      expect(transformed[0].departmentLabel).toBe('Main Office');
    });

    it('should handle break and time off types', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const breakRow = createMockTimesheetRow({
        timeAgainst: {
          id: 'break-1',
          displayName: 'break-1',
          type: 'PAID',
        },
      });

      const timeOffRow = createMockTimesheetRow({
        timeAgainst: {
          id: 'timeoff-1',
          displayName: 'timeoff-1',
          type: 'TIME_OFF',
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [breakRow, timeOffRow],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(4); // 2 entries per row

      // For break entries (PAID/UNPAID), should have timeBreakId but no timeAgainst
      expect(transformed[0]).toHaveProperty('timeBreakId', 'break-1');
      expect(transformed[0]).not.toHaveProperty('timeAgainst');

      // For time off entries, should have empty timeAgainst
      expect(transformed[2]).toHaveProperty('timeAgainst', {});
      expect(transformed[2]).not.toHaveProperty('timeBreakId');
    });
  });

  describe('extractTimeEntriesToDelete', () => {
    it('should extract deleted entry IDs', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-1',
                operation: 'DELETE',
              }),
              1: createMockTimeEntryDetails({
                timeEntryId: 'entry-2',
                operation: 'DELETE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);

      expect(extracted).toEqual([{ id: 'entry-1' }, { id: 'entry-2' }]);
    });

    it('should filter out empty or invalid IDs', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-1',
                operation: 'DELETE',
              }),
              1: createMockTimeEntryDetails({
                timeEntryId: '',
                operation: 'DELETE',
              }),
              2: createMockTimeEntryDetails({
                timeEntryId: '   ',
                operation: 'DELETE',
              }),
              3: createMockTimeEntryDetails({
                timeEntryId: 'entry-2',
                operation: 'DELETE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);

      expect(extracted).toEqual([{ id: 'entry-1' }, { id: 'entry-2' }]);
    });

    it('should skip non-DELETE operations', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-1',
                operation: 'CREATE',
              }),
              1: createMockTimeEntryDetails({
                timeEntryId: 'entry-2',
                operation: 'UPDATE',
              }),
              2: createMockTimeEntryDetails({
                timeEntryId: 'entry-3',
                operation: 'DELETE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);

      expect(extracted).toEqual([{ id: 'entry-3' }]);
    });

    it('should handle empty weeklyTimeEntries array', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);
      expect(extracted).toEqual([]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty weeklyTimeEntries array', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      expect(transformed).toEqual([]);
    });

    it('should handle undefined billableRate', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithUndefinedRate = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            billableInfo: {
              billable: true,
              billableRate: undefined,
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithUndefinedRate],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      expect(transformed[0].billableRate).toBe(null);
    });

    it('should handle multiple timesheet rows', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeAgainst: {
              id: 'customer-1',
              displayName: 'customer-1',
              type: DataAccess_ContactType.Customer,
            },
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-1',
                date: '2024-01-01',
                hours: 4,
                operation: 'CREATE',
              }),
            },
          }),
          createMockTimesheetRow({
            timeAgainst: {
              id: 'project-1',
              displayName: 'project-1',
              type: 'PROJECT',
            },
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-2',
                date: '2024-01-01',
                hours: 4,
                operation: 'CREATE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(2);
      expect(transformed[0].timeAgainst).toEqual({ customerId: 'customer-1' });
      // WTE sends customerId only, even when type is project
      expect(transformed[1].timeAgainst).toEqual({ customerId: 'project-1' });
    });

    it('should handle invalid billable rate strings when billable is active', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithInvalidRate = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            billableInfo: {
              billable: true,
              billableRate: 'invalid-rate',
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithInvalidRate],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );
      expect(transformed[0].billableRate).toBeNaN();
    });

    it('should return null billable rate when billable context is not provided', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithInvalidRate = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            billableInfo: {
              billable: true,
              billableRate: 'invalid-rate',
            },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithInvalidRate],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      expect(transformed[0].billableRate).toBeNull();
      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should handle very large hour values', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithLargeHours = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 999.99,
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithLargeHours],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      expect(transformed[0].duration).toBe(3599964); // 999.99 hours * 3600 seconds
    });

    it('should handle missing or null notes', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithNullNotes = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            notes: null as any,
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithNullNotes],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      expect(transformed[0].notes).toBe('');
    });

    it('should handle timeAgainst type that is not CUSTOMER or PROJECT', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithUnknownType = createMockTimesheetRow({
        timeAgainst: {
          id: 'unknown-1',
          displayName: 'unknown-1',
          type: 'UNKNOWN' as any,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithUnknownType],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(2);
      expect(transformed[0].timeAgainst).toEqual({}); // Should be empty object for unknown types
    });

    it('should handle mixed operation types in timeEntries object', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithMixedOperations = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 8,
            date: '2024-01-01',
            operation: 'CREATE',
          }),
          1: createMockTimeEntryDetails({
            hours: 4,
            date: '2024-01-02',
            operation: 'DELETE',
          }), // Should be skipped in transformToTimeEntries
          2: createMockTimeEntryDetails({
            hours: 4.5,
            date: '2024-01-03',
            operation: 'UPDATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithMixedOperations],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);

      expect(transformed).toHaveLength(2); // Only CREATE and UPDATE operations
      expect(transformed[0].date).toBe('2024-01-01');
      expect(transformed[1].date).toBe('2024-01-03');
      expect(transformed[1].duration).toBe(16200); // 4.5 hours * 3600 seconds
    });
  });

  describe('implicit deletion via zeroed-out hours', () => {
    it('should extract entries with original hours > 0 but current hours = 0', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-saved',
                hours: 0,
                operation: 'UPDATE',
                originalValues: { hours: 8 },
              }),
              1: createMockTimeEntryDetails({
                timeEntryId: 'entry-normal-delete',
                operation: 'DELETE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);

      expect(extracted).toEqual(
        expect.arrayContaining([
          { id: 'entry-saved' },
          { id: 'entry-normal-delete' },
        ]),
      );
    });

    it('should not implicitly delete entries without original hours', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const timeEntryGridData = {
        weeklyTimeEntries: [
          createMockTimesheetRow({
            timeEntries: {
              0: createMockTimeEntryDetails({
                timeEntryId: 'entry-new',
                hours: 0,
                operation: 'CREATE',
              }),
            },
          }),
        ],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const extracted =
        result.current.extractTimeEntriesToDelete(timeEntryGridData);

      expect(extracted).toEqual([]);
    });
  });

  describe('rows with no valid entries', () => {
    it('should skip rows where all entries have zero hours', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithAllZeroHours = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 0,
            operation: 'CREATE',
            date: '2024-01-01',
          }),
          1: createMockTimeEntryDetails({
            hours: 0,
            operation: 'UPDATE',
            date: '2024-01-02',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithAllZeroHours],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );

      expect(transformed).toHaveLength(0);
    });

    it('should skip rows where all entries have only DELETE operations', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const rowWithAllDeletes = createMockTimesheetRow({
        timeEntries: {
          0: createMockTimeEntryDetails({
            hours: 8,
            operation: 'DELETE',
            date: '2024-01-01',
          }),
          1: createMockTimeEntryDetails({
            hours: 4,
            operation: 'DELETE',
            date: '2024-01-02',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithAllDeletes],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        defaultBillableContext,
      );

      expect(transformed).toHaveLength(0);
    });
  });

  describe('performance and optimization', () => {
    it('should handle large datasets efficiently', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      // Create a large dataset
      const largeWeeklyTimeEntries = Array.from({ length: 100 }, (_, i) =>
        createMockTimesheetRow({
          timeAgainst: {
            id: `customer-${i}`,
            displayName: `customer-${i}`,
            type: DataAccess_ContactType.Customer,
          },
          timeEntries: {
            0: createMockTimeEntryDetails({
              timeEntryId: `entry-${i}`,
              date: '2024-01-01',
              hours: 8,
              operation: 'CREATE',
            }),
          },
        }),
      );

      const timeEntryGridData = {
        weeklyTimeEntries: largeWeeklyTimeEntries,
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const startTime = performance.now();
      const transformed =
        result.current.transformToTimeEntries(timeEntryGridData);
      const endTime = performance.now();

      expect(transformed).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('BillableContext gating', () => {
    it('should gate billable status to NotBillable when isBillingFieldEnabled is false', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: false,
        customerAssignmentsMap: {},
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
      expect(transformed[0].billableRate).toBeNull();
    });

    it('should allow billable status when isBillingFieldEnabled is true and feature flag disabled', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: true,
        customerAssignmentsMap: {},
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.Billable,
      );
      expect(transformed[0].billableRate).toBe(50.0);
    });

    it('should use customer assignment when feature flag is enabled and customer has billable assigned', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: false,
        customerAssignmentsMap: {
          'customer-1': {
            standardFieldAssignments: [{ name: 'billable', assigned: true }],
            customFieldAssignments: [],
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptionAssignments: {},
            loading: false,
            error: null,
            lastFetched: Date.now(),
            cfoLoading: false,
          } as any,
        },
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.Billable,
      );
      expect(transformed[0].billableRate).toBe(50.0);
    });

    it('should gate billable when feature flag is enabled but customer has no billable in assignments', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: false,
        customerAssignmentsMap: {
          'customer-1': {
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
          } as any,
        },
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
      expect(transformed[0].billableRate).toBeNull();
    });

    it('should fall back to company settings when feature flag enabled but customer has no assignments', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: true,
        customerAssignmentsMap: {},
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.Billable,
      );
      expect(transformed[0].billableRate).toBe(50.0);
    });

    it('should fall back to company settings when feature flag enabled but customer has empty assignments', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: true,
        customerAssignmentsMap: {
          'customer-1': {
            standardFieldAssignments: [],
            customFieldAssignments: [],
            standardFieldOptions: { service: [], class: [], location: [] },
            customFieldOptionAssignments: {},
            loading: false,
            error: null,
            lastFetched: Date.now(),
            cfoLoading: false,
          } as any,
        },
      };

      const timeEntryGridData = {
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.Billable,
      );
    });

    it('should fall back to company settings when feature flag enabled and no customer selected', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: true,
        customerAssignmentsMap: {},
      };

      const rowWithNoCustomer = createMockTimesheetRow({
        timeAgainst: {
          id: '',
          displayName: '',
          type: 'TIME_OFF',
        },
        timeEntries: {
          0: createMockTimeEntryDetails({
            billableInfo: { billable: false, billableRate: undefined },
            operation: 'CREATE',
          }),
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithNoCustomer],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should not skip billable rows without timeAgainst when billable is gated off', () => {
      const { result } = renderHook(() => useTransformTimeEntries());

      const billableContext: BillableContext = {
        isBillingFieldEnabled: false,
        customerAssignmentsMap: {},
      };

      const rowWithNoTimeAgainst = createMockTimesheetRow({
        timeAgainst: {
          id: '',
          displayName: '',
          type: DataAccess_ContactType.Customer,
        },
      });

      const timeEntryGridData = {
        weeklyTimeEntries: [rowWithNoTimeAgainst],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      };

      const transformed = result.current.transformToTimeEntries(
        timeEntryGridData,
        billableContext,
      );

      expect(transformed.length).toBeGreaterThan(0);
      expect(transformed[0].billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });
  });

  describe('LEGACY_QBO_USER feature flag gating', () => {
    const mockLegacyQboTeamMember: TeamMember = {
      id: 'persona-123',
      name: 'QBO Admin',
      type: TimeForType.LEGACY_QBO_USER,
    };

    it('falls back to VENDOR for LEGACY_QBO_USER team member when flag is OFF', () => {
      mockLegacyQboUserFlag(false);
      const { result } = renderHook(() => useTransformTimeEntries());

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockLegacyQboTeamMember,
        dateRange: mockDateRange,
      });

      // Pre-flag behavior: anything not 'EMPLOYEE' becomes Vendor.
      expect(transformed[0].timeFor).toEqual({
        id: 'persona-123',
        timeForType: TimeTracking_TimeForType.Vendor,
      });
    });

    it('emits LEGACY_QBO_USER timeForType when flag is ON', () => {
      mockLegacyQboUserFlag(true);
      const { result } = renderHook(() => useTransformTimeEntries());

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockLegacyQboTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].timeFor).toEqual({
        id: 'persona-123',
        timeForType: TimeTracking_TimeForType.LegacyQboUser,
      });
    });

    it('does not affect EMPLOYEE behavior when flag is ON', () => {
      mockLegacyQboUserFlag(true);
      const { result } = renderHook(() => useTransformTimeEntries());

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].timeFor.timeForType).toBe(
        TimeTracking_TimeForType.Employee,
      );
    });

    it('does not affect VENDOR behavior when flag is ON', () => {
      mockLegacyQboUserFlag(true);
      const { result } = renderHook(() => useTransformTimeEntries());

      const transformed = result.current.transformToTimeEntries({
        weeklyTimeEntries: [createMockTimesheetRow()],
        teamMember: mockVendorTeamMember,
        dateRange: mockDateRange,
      });

      expect(transformed[0].timeFor.timeForType).toBe(
        TimeTracking_TimeForType.Vendor,
      );
    });
  });
});
