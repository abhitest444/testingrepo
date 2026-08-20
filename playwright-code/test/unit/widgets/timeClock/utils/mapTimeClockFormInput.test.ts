import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  TimeTracking_BillableStatus,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import {
  mapTimeClockFormToCreateInput,
  mapTodayDurationInput,
  mapWeekDurationInput,
  getStartOfWeek,
  getEndOfWeek,
  getToday,
  getTomorrow,
  mapTimeEntryToFormValues,
  mapTimeClockFormToUpdateInput,
  mapSearchTimeEntriesInput,
  mapTimeClockFormToBreakInput,
  mapTimeClockFormToBreakEndInput,
  mapActiveTimeEntryForBreakEnd,
} from 'src/js/widgets/timeClock/utils/mapTimeClockFormInput';
import { DEFAULT_TIME_CLOCK_FORM_STATE } from 'src/js/widgets/timeClock/hooks/useTimeClockForm';
import { getBrowserTimezone } from 'src/js/common/DateAndTimeUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('mapTimeClockFormInput', () => {
  const mockEmployeeId = 'employee123';
  const mockTimezone = 'America/New_York';
  const mockCustomerId = 'customer123';
  const mockProjectId = 'project123';
  const mockServiceId = 'service123';
  const mockClassId = 'class123';
  const mockSettings = {
    isServiceFieldEnabled: false,
    isBillingFieldEnabled: false,
    firstDayOfWeek: 0,
    isClassEnabled: false,
    isLocationEnabled: false,
    isTaxableFieldEnabled: false,
    entityVersion: '0',
    isCloseBookDateEnabled: false,
    isCloseBookPasswordEnabled: false,
    closeBookDate: dayjs(),
    timezone: mockTimezone,
    isItemEnabled: false,
    isPayrollEnabled: false,
    isBreakEnabled: false,
    isCustomerEnabled: false,
    isProjectEnabled: false,
    classRequired: false,
    locationRequired: false,
    serviceItemRequired: false,
    timeSheetEntryMakesNotesRequiredEnabled: false,
  };

  describe('mapTimeClockFormToCreateInput', () => {
    it('should map form values to create input correctly', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
      });
    });
  });

  describe('mapTodayDurationInput', () => {
    it('should create correct duration input for today', () => {
      const today = '2024-03-20';
      const tomorrow = '2024-03-21';

      const result = mapTodayDurationInput(mockEmployeeId, today, tomorrow);

      expect(result).toEqual({
        totalDurationFilter: {
          timeForEntityId: mockEmployeeId,
          dateRange: {
            beginDate: today,
            endDate: tomorrow,
          },
          isExported: false,
        },
      });
    });
  });

  describe('mapWeekDurationInput', () => {
    it('should create correct duration input for week', () => {
      const startOfWeek = '2024-03-17';
      const endOfWeek = '2024-03-24';

      const result = mapWeekDurationInput(
        mockEmployeeId,
        startOfWeek,
        endOfWeek,
      );

      expect(result).toEqual({
        totalDurationFilter: {
          timeForEntityId: mockEmployeeId,
          dateRange: {
            beginDate: startOfWeek,
            endDate: endOfWeek,
          },
          isExported: false,
        },
      });
    });
  });

  describe('getStartOfWeek', () => {
    it('should return correct start of week for Sunday as first day', () => {
      const result = getStartOfWeek(mockTimezone, 0);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return correct start of week for Monday as first day', () => {
      const result = getStartOfWeek(mockTimezone, 1);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getToday', () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const result = getToday(mockTimezone);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getTomorrow', () => {
    it("should return tomorrow's date in YYYY-MM-DD format", () => {
      const result = getTomorrow(getBrowserTimezone());
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getEndOfWeek', () => {
    it('should return correct end of week date', () => {
      const startOfWeek = '2024-03-17';
      const result = getEndOfWeek(startOfWeek, getBrowserTimezone());

      // Calculate expected result dynamically using the same logic
      const expectedStart = dayjs(startOfWeek, 'YYYY-MM-DD').tz(
        getBrowserTimezone(),
      );
      const expectedEnd = expectedStart.add(7, 'day').format('YYYY-MM-DD');

      expect(result).toBe(expectedEnd);
    });
  });

  describe('mapTimeClockFormToUpdateInput', () => {
    it('should map form values to update input correctly', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: null,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        customFields: [],
      });
    });

    it('should handle minimal form values for update input', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: null,
          project: { id: '', name: '' },
        },
        service: { id: '', name: '' },
        class: { id: '', name: '' },
        timezone: mockTimezone,
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: undefined,
        },
        serviceItemID: undefined,
        classID: undefined,
        timeZone: getBrowserTimezone(),
        notes: '',
        billableRate: null,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        isExported: false,
        customFields: [],
      });
    });
  });

  describe('mapTimeClockFormToCreateInput edge cases', () => {
    it('should handle form values without customer and project', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: null,
          project: { id: '', name: '' },
        },
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: undefined,
        },
        isExported: false,
      });
    });

    it('should handle form values with only customer', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: '', name: '' },
        },
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
      });
    });

    it('should handle form values with custom fields', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        customFields: {
          field1: {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            deleted: false,
            optionID: '',
          },
          field2: {
            id: 'field2',
            name: 'Custom Field 2',
            value: 'value2',
            deleted: true,
            optionID: '',
          },
          field3: {
            id: 'field3',
            name: 'Custom Field 3',
            value: '',
            deleted: false,
            optionID: '',
          },
        },
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
        customFields: [
          {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            optionID: '',
          },
          {
            id: 'field2',
            name: 'Custom Field 2',
            value: 'value2',
            optionID: '',
          },
          {
            id: 'field3',
            name: 'Custom Field 3',
            value: '',
            optionID: '',
          },
        ],
      });
    });

    it('should handle form values with empty custom fields array', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        customFields: {},
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
      });
    });

    it('should handle form values with undefined custom fields', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        customFields: undefined,
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
      });
    });

    it('should include all custom fields including empty ones', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        customFields: {
          field1: {
            id: 'field1',
            name: 'Custom Field 1',
            value: '',
            deleted: false,
            optionID: '',
          },
          field2: {
            id: 'field2',
            name: 'Custom Field 2',
            value: '   ',
            deleted: false,
            optionID: '',
          },
          field3: {
            id: 'field3',
            name: 'Custom Field 3',
            value: 'value3',
            deleted: false,
            optionID: '',
          },
          field4: {
            id: 'field4',
            name: 'Custom Field 4',
            value: '',
            deleted: false,
            optionID: '',
          },
          field5: {
            id: 'field5',
            name: 'Custom Field 5',
            value: '',
            deleted: false,
            optionID: '',
          },
        },
      };

      const result = mapTimeClockFormToCreateInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockTimezone,
      );

      expect(result).toEqual({
        date: '2024-03-20',
        startTime: expect.any(String),
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customerId: mockCustomerId,
        },
        isExported: false,
        customFields: [
          {
            id: 'field1',
            name: 'Custom Field 1',
            value: '',
            optionID: '',
          },
          {
            id: 'field2',
            name: 'Custom Field 2',
            value: '   ',
            optionID: '',
          },
          {
            id: 'field3',
            name: 'Custom Field 3',
            value: 'value3',
            optionID: '',
          },
          {
            id: 'field4',
            name: 'Custom Field 4',
            value: '',
            optionID: '',
          },
          {
            id: 'field5',
            name: 'Custom Field 5',
            value: '',
            optionID: '',
          },
        ],
      });
    });
  });

  describe('mapSearchTimeEntriesInput', () => {
    it('should create correct search input', () => {
      const result = mapSearchTimeEntriesInput(mockEmployeeId);

      expect(result).toEqual({
        timeEntryFilter: {
          isExported: false,
          isOpen: true,
          timeForEntityId: {
            equals: mockEmployeeId,
          },
        },
      });
    });
  });

  describe('mapTimeEntryToFormValues', () => {
    it('should map time entry to form values correctly', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: { id: mockCustomerId },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timeZone: mockTimezone,
        notes: 'Test notes',
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, mockTimezone);

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: { id: mockCustomerId },
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        isExported: false,
      });
    });

    it('should handle time entry with missing optional fields', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {},
        serviceItem: undefined,
        class: undefined,
        timeZone: undefined,
        notes: undefined,
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, mockTimezone);

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: undefined,
          project: undefined,
        },
        service: undefined,
        class: undefined,
        notes: '',
        startTime: expect.any(Object),
        timezone: undefined,
        isExported: false,
      });
    });

    it('should correctly extract startDate from startTime when timezone conversion changes the date', () => {
      // Mock getBrowserTimezone to return Pacific Time
      const originalGetBrowserTimezone =
        require('src/js/common/DateAndTimeUtils').getBrowserTimezone;
      const mockGetBrowserTimezone = jest.fn(() => 'America/Los_Angeles');
      require('src/js/common/DateAndTimeUtils').getBrowserTimezone =
        mockGetBrowserTimezone;

      // Create a time entry with startTime in UTC that's late evening (11 PM on March 20)
      // When converted to Pacific Time (UTC-8), this becomes 3 PM on March 20 (same day)
      // But when UTC time is early morning (2 AM on March 21), it becomes 6 PM on March 20 (previous day)
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-21T02:00:00Z', // 2 AM UTC on March 21st
        date: '2024-03-21', // Original date in company timezone
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: { id: mockProjectId },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        timeZone: 'UTC',
        notes: 'Cross-timezone test',
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, 'UTC');

      // Verify that startDate is extracted from the timezone-converted startTime
      // 2024-03-21T02:00:00Z in UTC becomes 2024-03-20T19:00:00 in Pacific Time (accounting for DST)
      // So startDate should be March 20th, not March 21st
      expect(result.startDate.format('YYYY-MM-DD')).toBe('2024-03-20');

      // Verify that startTime is also correctly converted to Pacific Time
      expect(result.startTime?.format('YYYY-MM-DD HH:mm')).toBe(
        '2024-03-20 19:00',
      );

      // Restore original getBrowserTimezone
      require('src/js/common/DateAndTimeUtils').getBrowserTimezone =
        originalGetBrowserTimezone;
    });

    it('should handle timezone conversion when date remains the same', () => {
      // Mock getBrowserTimezone to return Eastern Time
      const originalGetBrowserTimezone =
        require('src/js/common/DateAndTimeUtils').getBrowserTimezone;
      const mockGetBrowserTimezone = jest.fn(() => 'America/New_York');
      require('src/js/common/DateAndTimeUtils').getBrowserTimezone =
        mockGetBrowserTimezone;

      // Create a time entry with startTime in UTC that's mid-day
      // When converted to Eastern Time (UTC-5), date should remain the same
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T15:00:00Z', // 3 PM UTC on March 20th
        date: '2024-03-20',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: { id: mockProjectId },
        },
        timeZone: 'UTC',
        notes: 'Same date test',
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, 'UTC');

      // Verify that startDate remains March 20th in Eastern Time
      // 2024-03-20T15:00:00Z in UTC becomes 2024-03-20T11:00:00 in Eastern Time (accounting for DST)
      expect(result.startDate.format('YYYY-MM-DD')).toBe('2024-03-20');

      // Verify that startTime is correctly converted to Eastern Time
      expect(result.startTime?.format('YYYY-MM-DD HH:mm')).toBe(
        '2024-03-20 11:00',
      );

      // Restore original getBrowserTimezone
      require('src/js/common/DateAndTimeUtils').getBrowserTimezone =
        originalGetBrowserTimezone;
    });
  });

  describe('mapTimeEntryToFormValues edge cases', () => {
    it('should handle time entry without customer and project', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timeZone: mockTimezone,
        timeAgainst: {},
        notes: undefined,
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, mockTimezone);

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: undefined,
          project: undefined,
        },
        notes: '',
        service: { id: mockServiceId },
        class: { id: mockClassId },
        startTime: expect.any(Object),
        timezone: mockTimezone,
        isExported: false,
      });
    });

    it('should handle time entry with only customer', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(mockTimeEntry, mockTimezone);

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        isExported: false,
      });
    });

    it('should handle time entry with billable status Billable', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billableRate: 100,
        department: { id: 'dept123', name: 'Test Department' },
        legacyCustomFields: [
          { id: 'field1', name: 'Custom Field 1', value: 'value1' },
          { id: 'field2', name: 'Custom Field 2', value: undefined },
        ],
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(
        mockTimeEntry,
        mockTimezone,
        mockTimeEntry.legacyCustomFields,
        'Location Label',
      );

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        location: {
          id: 'dept123',
          name: 'Location Label',
        },
        billable: true,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billRate: 100,
        isExported: false,
        customFields: {
          field1: {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            optionID: '',
          },
          field2: {
            id: 'field2',
            name: 'Custom Field 2',
            value: '',
            optionID: '',
          },
        },
      });
    });

    it('should handle time entry with billable status HasBeenBilled', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        billableStatus: TimeTracking_BillableStatus.HasBeenBilled,
        billableRate: 150,
        department: { id: 'dept123', name: 'Test Department' },
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(
        mockTimeEntry,
        mockTimezone,
        [],
        'Location Label',
      );

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        location: {
          id: 'dept123',
          name: 'Location Label',
        },
        billable: true,
        billableStatus: TimeTracking_BillableStatus.HasBeenBilled,
        billRate: 150,
        isExported: false,
        customFields: {},
      });
    });

    it('should handle time entry with non-billable status', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        billableRate: 0,
        department: { id: 'dept123', name: 'Test Department' },
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(
        mockTimeEntry,
        mockTimezone,
        [],
        'Location Label',
      );

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        location: {
          id: 'dept123',
          name: 'Location Label',
        },
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        billRate: 0,
        isExported: false,
        customFields: {},
      });
    });

    it('should handle time entry with NaN billable rate', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billableRate: NaN,
        department: { id: 'dept123', name: 'Test Department' },
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(
        mockTimeEntry,
        mockTimezone,
        [],
        'Location Label',
      );

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        location: {
          id: 'dept123',
          name: 'Location Label',
        },
        billable: true,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billRate: null,
        isExported: false,
        customFields: {},
      });
    });

    it('should handle time entry without department', () => {
      const mockTimeEntry = {
        id: 'timeEntry123',
        alternateIds: [],
        startTime: '2024-03-20T09:00:00Z',
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
        },
        serviceItem: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        notes: 'Test notes',
        timeZone: mockTimezone,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billableRate: 100,
        department: undefined,
        isTimeOffEntry: false,
      };

      const result = mapTimeEntryToFormValues(
        mockTimeEntry,
        mockTimezone,
        [],
        'Location Label',
      );

      expect(result).toEqual({
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        id: 'timeEntry123',
        startDate: expect.any(Object),
        timeAgainst: {
          customer: { id: mockCustomerId },
          project: undefined,
        },
        service: { id: mockServiceId },
        class: { id: mockClassId },
        notes: 'Test notes',
        startTime: expect.any(Object),
        timezone: mockTimezone,
        location: {
          id: '',
          name: '',
        },
        billable: true,
        billableStatus: TimeTracking_BillableStatus.Billable,
        billRate: 100,
        isExported: false,
        customFields: {},
      });
    });
  });

  describe('mapTimeClockFormToUpdateInput edge cases', () => {
    it('should handle update input with location enabled and location ID', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        location: { id: 'dept123', name: 'Test Department' },
        isExported: false,
        isTimeOffEntry: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithLocation = {
        ...mockSettings,
        isTsheetLocationEnabled: true,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettingsWithLocation,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        'Location Label',
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: null,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        departmentID: 'dept123',
        departmentLabel: 'Location Label',
        customFields: [],
      });
    });

    it('should handle update input with location enabled but no location ID', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        location: { id: '', name: '' },
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithLocation = {
        ...mockSettings,
        isTsheetLocationEnabled: true,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettingsWithLocation,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        'Location Label',
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: null,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        customFields: [],
      });
    });

    it('should handle update input with billing enabled and billable true', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        billable: true,
        billRate: 125,
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithBilling = {
        ...mockSettings,
        isBillingFieldEnabled: true,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettingsWithBilling,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: 125,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.Billable,
        customFields: [],
      });
    });

    it('should handle update input with billing enabled but billable false', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        billable: false,
        billRate: 125,
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithBilling = {
        ...mockSettings,
        isBillingFieldEnabled: true,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettingsWithBilling,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: null,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        customFields: [],
      });
    });

    it('should include customExtensions in payload when dimensions are dirty', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Dimension test notes',
        dimensions: {
          dim1: { id: 'dim1', optionID: 'opt1' },
          dim2: { id: 'dim2', optionID: 'opt2' },
        },
        isExported: false,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        undefined,
        { dim1: true, dim2: true },
      );

      expect(result.customExtensions).toBeDefined();
      expect(result.customExtensions?.dimensions).toHaveLength(2);
      expect(result.customExtensions?.dimensions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ definitionId: 'dim1' }),
          expect.objectContaining({ definitionId: 'dim2' }),
        ]),
      );
    });

    it('should include seeded worker defaults without dirty flag', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        timezone: mockTimezone,
        dimensions: {
          dim1: {
            id: 'dim1',
            optionID: 'default-opt',
            activeValueIsDefault: true,
          },
        },
        isExported: false,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        'timeEntry123',
        mockTimezone,
        mockSettings,
        '2024-03-20T17:00:00Z',
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result.customExtensions?.dimensions).toEqual([
        { definitionId: 'dim1', values: ['default-opt'] },
      ]);
    });

    it('should omit customExtensions from payload when dimensions are empty', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        timezone: mockTimezone,
        notes: 'No dimensions test',
        dimensions: {},
        isExported: false,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        'timeEntry123',
        mockTimezone,
        mockSettings,
        '2024-03-20T17:00:00Z',
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result.customExtensions).toBeUndefined();
    });

    it('should omit displayOnly dimensions from customExtensions payload', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        timezone: mockTimezone,
        notes: 'Display only dimension test',
        dimensions: {
          dim1: { id: 'dim1', optionID: 'opt1', displayOnly: true },
          dim2: { id: 'dim2', optionID: 'opt2' },
        },
        isExported: false,
      };

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        'timeEntry123',
        mockTimezone,
        mockSettings,
        '2024-03-20T17:00:00Z',
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        undefined,
        { dim2: true },
      );

      expect(result.customExtensions?.dimensions).toHaveLength(1);
      expect(result.customExtensions?.dimensions?.[0]).toMatchObject({
        definitionId: 'dim2',
      });
    });

    it('should handle update input with custom fields', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        timeAgainst: {
          customer: { id: mockCustomerId, name: 'Test Customer' },
          project: { id: mockProjectId, name: 'Test Project' },
        },
        service: { id: mockServiceId, name: 'Test Service' },
        class: { id: mockClassId, name: 'Test Class' },
        timezone: mockTimezone,
        notes: 'Updated notes',
        isExported: false,
        customFields: {
          field1: {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            deleted: false,
            optionID: '',
          },
          field2: {
            id: 'field2',
            name: 'Custom Field 2',
            value: 'value2',
            deleted: true,
            optionID: '',
          },
          field3: {
            id: 'field3',
            name: 'Custom Field 3',
            value: '',
            deleted: false,
            optionID: '',
          },
        },
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToUpdateInput(
        mockFormValues,
        mockTimeEntryId,
        mockTimezone,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeAgainst: {
          customerId: mockCustomerId,
        },
        timeBreakId: undefined,
        serviceItemID: mockServiceId,
        classID: mockClassId,
        timeZone: getBrowserTimezone(),
        notes: 'Updated notes',
        billableRate: null,
        isExported: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        customFields: [
          {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            optionID: '',
          },
          {
            id: 'field2',
            name: 'Custom Field 2',
            value: 'value2',
            optionID: '',
          },
          {
            id: 'field3',
            name: 'Custom Field 3',
            value: '',
            optionID: '',
          },
        ],
      });
    });
  });

  describe('mapTimeClockFormToBreakInput', () => {
    it('should map form values to break input correctly', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        customFields: {
          field1: {
            id: 'field1',
            name: 'Custom Field 1',
            value: 'value1',
            deleted: false,
            optionID: '',
          },
        },
      };

      const mockBreakId = 'break123';
      const mockCurrentTime = '2024-03-20T10:00:00Z';

      const result = mapTimeClockFormToBreakInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockBreakId,
        mockCurrentTime,
      );

      expect(result).toEqual({
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeBreakId: mockBreakId,
        date: '2024-03-20',
        startTime: mockCurrentTime,
        isExported: false,
      });
    });

    it('should handle break input with location', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        location: { id: 'dept123', name: 'Test Department' },
        customFields: {},
      };

      const mockBreakId = 'break123';
      const mockCurrentTime = '2024-03-20T10:00:00Z';
      const mockLocationLabel = 'Location Label';

      const result = mapTimeClockFormToBreakInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockBreakId,
        mockCurrentTime,
        mockLocationLabel,
      );

      expect(result).toEqual({
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeBreakId: mockBreakId,
        date: '2024-03-20',
        startTime: mockCurrentTime,
        isExported: false,
        departmentID: 'dept123',
        departmentLabel: mockLocationLabel,
      });
    });

    it('should handle break input without location', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        location: { id: '', name: '' },
      };

      const mockBreakId = 'break123';
      const mockCurrentTime = '2024-03-20T10:00:00Z';

      const result = mapTimeClockFormToBreakInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockBreakId,
        mockCurrentTime,
      );

      expect(result).toEqual({
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeBreakId: mockBreakId,
        date: '2024-03-20',
        startTime: mockCurrentTime,
        isExported: false,
      });
    });

    it('should handle break input with location but no quickFillFieldLocationLabel', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        location: { id: 'dept123', name: 'Test Department' },
      };

      const mockBreakId = 'break123';
      const mockCurrentTime = '2024-03-20T10:00:00Z';

      const result = mapTimeClockFormToBreakInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockBreakId,
        mockCurrentTime,
      );

      expect(result).toEqual({
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeBreakId: mockBreakId,
        date: '2024-03-20',
        startTime: mockCurrentTime,
        isExported: false,
        departmentID: 'dept123',
        departmentLabel: 'Test Department',
      });
    });

    it('should handle break input with undefined custom fields', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        customFields: undefined,
      };

      const mockBreakId = 'break123';
      const mockCurrentTime = '2024-03-20T10:00:00Z';

      const result = mapTimeClockFormToBreakInput(
        mockFormValues,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockBreakId,
        mockCurrentTime,
      );

      expect(result).toEqual({
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        timeBreakId: mockBreakId,
        date: '2024-03-20',
        startTime: mockCurrentTime,
        isExported: false,
      });
    });
  });

  describe('mapTimeClockFormToBreakEndInput', () => {
    it('should map form values to break end input correctly', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        breakId: 'break123',
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToBreakEndInput(
        mockFormValues,
        mockTimeEntryId,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeBreakId: 'break123',
        isExported: false,
      });
    });

    it('should handle break end input with location enabled and location ID', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        breakId: 'break123',
        location: { id: 'dept123', name: 'Test Department' },
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithLocation = {
        ...mockSettings,
        isTsheetLocationEnabled: true,
      };
      const mockLocationLabel = 'Location Label';

      const result = mapTimeClockFormToBreakEndInput(
        mockFormValues,
        mockTimeEntryId,
        mockSettingsWithLocation,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
        mockLocationLabel,
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeBreakId: 'break123',
        departmentID: 'dept123',
        departmentLabel: mockLocationLabel,
        isExported: false,
      });
    });

    it('should handle break end input with location enabled but no location ID', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        breakId: 'break123',
        location: { id: '', name: '' },
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';
      const mockSettingsWithLocation = {
        ...mockSettings,
        isTsheetLocationEnabled: true,
      };

      const result = mapTimeClockFormToBreakEndInput(
        mockFormValues,
        mockTimeEntryId,
        mockSettingsWithLocation,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeBreakId: 'break123',
        isExported: false,
      });
    });

    it('should handle break end input without breakId', () => {
      const mockFormValues = {
        ...DEFAULT_TIME_CLOCK_FORM_STATE,
        startDate: dayjs('2024-03-20'),
        startTime: dayjs('2024-03-20T09:00:00'),
        breakId: undefined,
      };

      const mockTimeEntryId = 'timeEntry123';
      const mockEndTime = '2024-03-20T17:00:00Z';

      const result = mapTimeClockFormToBreakEndInput(
        mockFormValues,
        mockTimeEntryId,
        mockSettings,
        mockEndTime,
        { id: mockEmployeeId, timeForType: TimeTracking_TimeForType.Employee },
      );

      expect(result).toEqual({
        id: mockTimeEntryId,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        endTime: mockEndTime,
        date: '2024-03-20',
        startTime: expect.any(String),
        timeBreakId: undefined,
        isExported: false,
      });
    });
  });

  describe('mapActiveTimeEntryForBreakEnd', () => {
    it('should set breakId and startTime from active time entry', () => {
      const mockActiveTimeEntry = {
        id: 'timeEntry123',
        timeBreakId: 'break123',
        startTime: '2024-03-20T09:00:00Z',
        alternateIds: [],
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        isTimeOffEntry: false,
      };

      const mockTimeClockFormMethods = {
        setValue: jest.fn(),
      };

      mapActiveTimeEntryForBreakEnd(
        mockActiveTimeEntry,
        mockTimeClockFormMethods,
      );

      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledWith(
        'breakId',
        'break123',
      );
      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledWith(
        'startTime',
        expect.any(Object), // dayjs object
      );
      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledTimes(2);
    });

    it('should only set breakId when startTime is not available', () => {
      const mockActiveTimeEntry = {
        id: 'timeEntry123',
        timeBreakId: 'break123',
        startTime: undefined,
        alternateIds: [],
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        isTimeOffEntry: false,
      };

      const mockTimeClockFormMethods = {
        setValue: jest.fn(),
      };

      mapActiveTimeEntryForBreakEnd(
        mockActiveTimeEntry,
        mockTimeClockFormMethods,
      );

      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledWith(
        'breakId',
        'break123',
      );
      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledTimes(1);
    });

    it('should only set startTime when breakId is not available', () => {
      const mockActiveTimeEntry = {
        id: 'timeEntry123',
        timeBreakId: undefined,
        startTime: '2024-03-20T09:00:00Z',
        alternateIds: [],
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        isTimeOffEntry: false,
      };

      const mockTimeClockFormMethods = {
        setValue: jest.fn(),
      };

      mapActiveTimeEntryForBreakEnd(
        mockActiveTimeEntry,
        mockTimeClockFormMethods,
      );

      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledWith(
        'startTime',
        expect.any(Object), // dayjs object
      );
      expect(mockTimeClockFormMethods.setValue).toHaveBeenCalledTimes(1);
    });

    it('should not set anything when both breakId and startTime are not available', () => {
      const mockActiveTimeEntry = {
        id: 'timeEntry123',
        timeBreakId: undefined,
        startTime: undefined,
        alternateIds: [],
        timeForType: TimeTracking_TimeForType.Employee,
        timeFor: {
          id: mockEmployeeId,
          timeForType: TimeTracking_TimeForType.Employee,
        },
        isTimeOffEntry: false,
      };

      const mockTimeClockFormMethods = {
        setValue: jest.fn(),
      };

      mapActiveTimeEntryForBreakEnd(
        mockActiveTimeEntry,
        mockTimeClockFormMethods,
      );

      expect(mockTimeClockFormMethods.setValue).not.toHaveBeenCalled();
    });
  });
});
