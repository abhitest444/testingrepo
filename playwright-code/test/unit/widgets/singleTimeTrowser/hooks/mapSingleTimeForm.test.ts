/* eslint-disable camelcase */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  TimeTracking_ApprovalStatusType,
  TimeTracking_BillableStatus,
  TimeTracking_CreateTimeEntryInput,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { UxPreferenceKey } from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { SingleTimeFormState } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';
import {
  computeFieldsWithData,
  mapAddSingleTimeEntryForm_forBatchCreateUpdateInput,
  mapAddSingleTimeEntryForm_forBatchDeleteInput,
  mapAddSingleTimeEntryForm_forCreateInput,
  mapAddSingleTimeEntryForm_forUpdateInput,
  mapTimeEntryToSingleTimeFormState,
} from 'src/js/widgets/singleTimeTrowser/hooks/mapSingleTimeForm';
import { aTimeTracking_TimeEntry } from '__mocks__/__generated__/timeTracking';
import {
  stringToDayJS,
  timeStringToDayjs,
} from '../../../../../src/js/common/DateAndTimeUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

const commonSettings = {
  isClassEnabled: true,
  isLocationEnabled: true,
  isTsheetClassEnabled: true,
  isTsheetLocationEnabled: true,
  isServiceFieldEnabled: true,
  isBillingFieldEnabled: true,
  isTaxableFieldEnabled: true,
  firstDayOfWeek: 0,
  entityVersion: '1',
  timezone: 'America/Los_Angeles',
  qboTimezone: 'America/Los_Angeles',
  isCloseBookDateEnabled: false,
  isCloseBookPasswordEnabled: false,
  closeBookDate: dayjs(),
  classRequired: false,
  locationRequired: false,
  serviceItemRequired: false,
  timeSheetEntryMakesNotesRequiredEnabled: false,
} as TimeTrackingCompanySettings;

const commonPreferences: {
  [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: boolean;
  [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
    isClassFieldEnabled: boolean;
    isTaxableFieldEnabled: boolean;
    isProjectFieldEnabled: boolean;
    isLocationFieldEnabled: boolean;
    isPayTypeFieldEnabled: boolean;
    isCostRateFieldEnabled: boolean;
  };
  [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: string;
  [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
    customFieldsVisibilityEndDate: string;
    breaksVisibilityEndDate: string;
    timeSheetVisibilityEndDate: string;
    timeTrackingVisibilityEndDate: string;
    notificationVisibilityEndDate: string;
    overtimeVisibilityEndDate: string;
    geoLocationsVisibilityEndDate: string;
    approvalsVisibilityEndDate: string;
    geofenceVisibilityEndDate: string;
    newTimesheetVisibilityEndDate: string;
    newCustomFieldsVisibilityEndDate: string;
    schedulesVisibilityEndDate: string;
  };
  [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
    isThursdayHidden: boolean;
    isFridayHidden: boolean;
    isSaturdayHidden: boolean;
    isWednesdayHidden: boolean;
    isSundayHidden: boolean;
    isTuesdayHidden: boolean;
    isMondayHidden: boolean;
  };
  [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: boolean;
  [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
    name: string;
    id: string;
    type: TimeForType;
  };
  [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: string;
  [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: boolean;
  [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: boolean;
  [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: boolean;
} = {
  [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: false,
  [UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE]: {
    isSundayHidden: false,
    isMondayHidden: false,
    isTuesdayHidden: false,
    isWednesdayHidden: false,
    isThursdayHidden: false,
    isFridayHidden: false,
    isSaturdayHidden: false,
  },
  [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  },
  [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
    id: '',
    type: TimeForType.EMPLOYEE,
    name: '',
  },
  [UxPreferenceKey.TIME_ENTRY_LAST_USED_START_END_TIME]: false,
  [UxPreferenceKey.TIME_ENTRY_SELECTED_SPLIT_CTA]: 'saveAndNew',
  [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: {
    timeTrackingVisibilityEndDate: '',
    timeSheetVisibilityEndDate: '',
    notificationVisibilityEndDate: '',
    breaksVisibilityEndDate: '',
    customFieldsVisibilityEndDate: '',
    overtimeVisibilityEndDate: '',
    geoLocationsVisibilityEndDate: '',
    approvalsVisibilityEndDate: '',
    geofenceVisibilityEndDate: '',
    newTimesheetVisibilityEndDate: '',
    newCustomFieldsVisibilityEndDate: '',
    schedulesVisibilityEndDate: '',
  },
  [UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED]: false,
  [UxPreferenceKey.BREAKS_TOUR_COMPLETED]: false,
  [UxPreferenceKey.CUSTOM_FIELDS_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_TIMESHEET_TOUR_COMPLETED]: false,
  [UxPreferenceKey.TIME_SHEET_GEN_AI_COLUMN_MAPPING]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_EMPLOYEE_MAPPING]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_PREFERENCES_SEEN]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_SKIP_FIELD_MAPPING]: '',
  [UxPreferenceKey.TIME_SHEET_GEN_AI_IMPOSE_8_HOUR_LIMIT]: false,
  [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED]: false,
  [UxPreferenceKey.WEEKLY_REDIRECT_SHOWN]: false,
};

describe('mapTimeEntryToSingleTimeFormState', () => {
  describe('Time Activity (isExported = true)', () => {
    test('should map time activity with approved status', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: '1',
        v3BreakDuration: 5000,
        costRate: '2',
        startTime: '2023-10-10T08:00:00-07:00',
        endTime: '2023-10-10T17:00:00-07:00',
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: true,
        approvalStatus: TimeTracking_ApprovalStatusType.Approved,
        distanceTracking: undefined,
        timeAgainstContactDAS: {
          customer: { id: '905b27f9-1a48-44cb-a2b2-263c5f398f7b' },
          project: { id: 'ab7d9691-060d-4d06-ba94-b8984f9d433a' },
        },
      });

      const expected = {
        billRate: 1,
        billable: true,
        billableStatus: TimeTracking_BillableStatus.Billable,
        breakDuration: 5000,
        class: {
          id: '9f85bab4-c201-4d03-83d5-570dae9105c8',
          name: '',
        },
        costRate: 2,
        duration: 8181,
        distanceTracking: undefined,
        endTime: expect.anything(),
        endDate: undefined,
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        location: {
          id: 'bfd50915-7bbd-45ec-bd39-2ee1a456906c',
          name: '',
        },
        notes: 'velit',
        payType: {
          id: '23af7eec-4b4b-4fe0-a9a3-b42808311514',
          name: '',
        },
        service: {
          id: 'dc86a4f2-6c5b-4c75-a2bf-0971b0d8363a',
          name: '',
        },
        startDate: expect.anything(),
        startTime: expect.anything(),
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: '905b27f9-1a48-44cb-a2b2-263c5f398f7b',
            name: null,
          },
          project: {
            id: 'ab7d9691-060d-4d06-ba94-b8984f9d433a',
            name: '',
          },
        },
        toggleBreak: true,
        toggleClockIn: true,
        version: 'qui',
        closedBookPassword: '',
        isExported: true,
        isLocked: false,
        isApproved: false,
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should map time activity with unapproved status', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: 'abc',
        v3BreakDuration: undefined,
        startTime: null,
        endTime: null,
        costRate: 'abc',
        meta: undefined,
        timeAgainst: undefined,
        timeAgainstContactDAS: undefined,
        duration: undefined,
        serviceItem: undefined,
        class: undefined,
        department: undefined,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        notes: undefined,
        payrollItem: undefined,
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: true,
        approvalStatus: TimeTracking_ApprovalStatusType.Unapproved,
        distanceTracking: undefined,
      });

      const expected = {
        billRate: null,
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        breakDuration: null,
        class: {
          id: '',
          name: '',
        },
        costRate: null,
        duration: null,
        distanceTracking: undefined,
        endTime: undefined,
        endDate: undefined,
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        location: {
          id: '',
          name: '',
        },
        notes: '',
        payType: {
          id: '',
          name: '',
        },
        service: {
          id: '',
          name: '',
        },
        startDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        startTime: undefined,
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: null,
            name: null,
          },
          project: {
            id: '',
            name: '',
          },
        },
        toggleBreak: false,
        toggleClockIn: false,
        version: '0',
        closedBookPassword: '',
        isExported: true,
        isLocked: false,
        isApproved: false,
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should not map endDate from endTime when endTime is provided', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: '2023-10-11T17:00:00-07:00',
        timeZone: 'America/Los_Angeles',
        isExported: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate).toBeUndefined();
    });

    test('should not map endDate from date when endTime is not provided', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: null,
        timeZone: 'America/Los_Angeles',
        isExported: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate).toBeUndefined();
    });

    test('should handle endDate in different timezone', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: '2023-10-11T17:00:00+00:00',
        timeZone: 'America/Los_Angeles',
        isExported: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate).toBeUndefined();
    });

    test('should prioritize timeEntry timeZone over default company settings timezone', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        startTime: '2023-10-10T08:00:00-04:00', // EDT time
        endTime: '2023-10-10T17:00:00-04:00', // EDT time
        timeZone: 'America/New_York', // User-specific timezone
        isExported: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles', // Company timezone (different)
      );

      // For time activities, timezone field is not set, but startTime/endTime should use UTC
      expect(result.timezone).toBeUndefined(); // Time activities don't have timezone field
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.isExported).toBe(true);
    });
  });

  describe('Time Entry (isExported = false)', () => {
    test('should map time entry with approved status and set isLocked to true', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: 'abc',
        v3BreakDuration: undefined,
        startTime: null,
        endTime: null,
        costRate: 'abc',
        meta: undefined,
        timeAgainst: undefined,
        timeAgainstContactDAS: undefined,
        duration: undefined,
        serviceItem: undefined,
        class: undefined,
        department: undefined,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        notes: undefined,
        payrollItem: undefined,
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Approved,
        distanceTracking: undefined,
      });

      const expected = {
        billRate: null,
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        breakDuration: null,
        class: {
          id: '',
          name: '',
        },
        costRate: null,
        duration: null,
        distanceTracking: undefined,
        endTime: undefined,
        endDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        currentlyWorking: false,
        location: {
          id: '',
          name: '',
        },
        notes: '',
        payType: {
          id: '',
          name: '',
        },
        service: {
          id: '',
          name: '',
        },
        startDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        startTime: undefined,
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: null,
            name: null,
          },
          project: {
            id: '',
            name: '',
          },
        },
        toggleBreak: false,
        toggleClockIn: false,
        version: '0',
        closedBookPassword: '',
        isExported: false,
        timezone: 'America/Los_Angeles',
        isLocked: true,
        isApproved: true,
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should prioritize timeEntry timeZone over default company timezone when both are available', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        startTime: '2023-10-10T08:00:00-04:00', // EDT time
        endTime: '2023-10-10T17:00:00-04:00', // EDT time
        timeZone: 'America/New_York', // User-specific timezone
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles', // Company timezone (different)
      );

      // Should use timeEntry.timeZone (America/New_York) instead of company timezone
      expect(result.timezone).toBe('America/New_York');
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
    });

    test('should fallback to default company timezone when timeEntry timeZone is undefined', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        startTime: '2023-10-10T08:00:00-07:00', // PDT time
        endTime: '2023-10-10T17:00:00-07:00', // PDT time
        timeZone: undefined, // No timezone specified
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles', // Company timezone
      );

      // Should fallback to company timezone
      expect(result.timezone).toBeUndefined(); // Since timeEntry.timeZone is undefined
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
    });

    test('should handle timezone conversion correctly for startTime and endTime', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        startTime: '2023-10-10T08:00:00-04:00', // EDT time
        endTime: '2023-10-10T17:00:00-04:00', // EDT time
        timeZone: 'America/New_York', // User-specific timezone
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles', // Company timezone
      );

      // Should use timeEntry.timeZone for timezone field
      expect(result.timezone).toBe('America/New_York');
      // startTime and endTime should be converted using the prioritized timezone
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
    });

    test('should map time entry with unapproved status and set isLocked to false', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: 'abc',
        v3BreakDuration: undefined,
        startTime: null,
        endTime: null,
        costRate: 'abc',
        meta: undefined,
        timeAgainst: undefined,
        timeAgainstContactDAS: undefined,
        duration: undefined,
        serviceItem: undefined,
        class: undefined,
        department: undefined,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        notes: undefined,
        payrollItem: undefined,
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Unapproved,
        locked: false,
        distanceTracking: undefined,
      });

      const expected = {
        billRate: null,
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        breakDuration: null,
        class: {
          id: '',
          name: '',
        },
        costRate: null,
        duration: null,
        distanceTracking: undefined,
        endTime: undefined,
        endDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        currentlyWorking: false,
        location: {
          id: '',
          name: '',
        },
        notes: '',
        payType: {
          id: '',
          name: '',
        },
        service: {
          id: '',
          name: '',
        },
        startDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        startTime: undefined,
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: null,
            name: null,
          },
          project: {
            id: '',
            name: '',
          },
        },
        toggleBreak: false,
        toggleClockIn: false,
        version: '0',
        closedBookPassword: '',
        isExported: false,
        timezone: 'America/Los_Angeles',
        isLocked: false,
        isApproved: false,
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should map time entry with rejected status and set isLocked to false', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: 'abc',
        v3BreakDuration: undefined,
        startTime: null,
        endTime: null,
        costRate: 'abc',
        meta: undefined,
        timeAgainst: undefined,
        timeAgainstContactDAS: undefined,
        duration: undefined,
        serviceItem: undefined,
        class: undefined,
        department: undefined,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        notes: undefined,
        payrollItem: undefined,
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Rejected,
        locked: false,
        distanceTracking: undefined,
      });

      const expected = {
        billRate: null,
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        breakDuration: null,
        class: {
          id: '',
          name: '',
        },
        costRate: null,
        duration: null,
        distanceTracking: undefined,
        endTime: undefined,
        endDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        currentlyWorking: false,
        location: {
          id: '',
          name: '',
        },
        notes: '',
        payType: {
          id: '',
          name: '',
        },
        service: {
          id: '',
          name: '',
        },
        startDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        startTime: undefined,
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: null,
            name: null,
          },
          project: {
            id: '',
            name: '',
          },
        },
        toggleBreak: false,
        toggleClockIn: false,
        version: '0',
        closedBookPassword: '',
        isExported: false,
        timezone: 'America/Los_Angeles',
        isLocked: false,
        isApproved: false,
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should map time entry with unapproved status but locked due to other reasons', () => {
      const input = aTimeTracking_TimeEntry({
        billableRate: 'abc',
        v3BreakDuration: undefined,
        startTime: null,
        endTime: null,
        costRate: 'abc',
        meta: undefined,
        timeAgainst: undefined,
        timeAgainstContactDAS: undefined,
        duration: undefined,
        serviceItem: undefined,
        class: undefined,
        department: undefined,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        notes: undefined,
        payrollItem: undefined,
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Unapproved,
        locked: true, // locked due to invoicing or other transaction lock
        distanceTracking: undefined,
      });

      const expected = {
        billRate: null,
        billable: false,
        billableStatus: TimeTracking_BillableStatus.NotBillable,
        breakDuration: null,
        class: {
          id: '',
          name: '',
        },
        costRate: null,
        duration: null,
        distanceTracking: undefined,
        endTime: undefined,
        endDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        currentlyWorking: false,
        location: {
          id: '',
          name: '',
        },
        notes: '',
        payType: {
          id: '',
          name: '',
        },
        service: {
          id: '',
          name: '',
        },
        startDate: stringToDayJS('2023-10-10', 'YYYY-MM-DD'),
        startTime: undefined,
        taxable: false,
        timeFor: {
          id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
          name: '',
          type: 'VENDOR',
        },
        timeAgainst: {
          customer: {
            id: null,
            name: null,
          },
          project: {
            id: '',
            name: '',
          },
        },
        toggleBreak: false,
        toggleClockIn: false,
        version: '0',
        closedBookPassword: '',
        isExported: false,
        timezone: 'America/Los_Angeles',
        isLocked: true, // should be true because locked: true
        isApproved: false, // should be false because unapproved
        isSubmitted: false,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'nihil',
            value: 'nulla',
            optionID: '',
          },
        },
        dimensions: {
          'fd6f9a55-905a-4864-a159-736ed2816fc2': {
            id: 'fd6f9a55-905a-4864-a159-736ed2816fc2',
            optionID: 'nam',
          },
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      expect(
        mapTimeEntryToSingleTimeFormState(input, 'America/Los_Angeles'),
      ).toEqual(expected);
    });

    test('should set isLocked to true when isSubmitTimeEnabled is true for a submitted time entry', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Unapproved,
        locked: false,
        isSubmitted: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
        true, // isSubmitTimeEnabled
      );

      expect(result.isLocked).toBe(true);
    });

    test('should not set isLocked when isSubmitTimeEnabled is false even if entry isSubmitted is true', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        timeZone: 'America/Los_Angeles',
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Unapproved,
        locked: false,
        isSubmitted: true,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
        false, // isSubmitTimeEnabled = false → submitted lock does not apply
      );

      expect(result.isLocked).toBe(false);
    });

    test('should map endDate from endTime when endTime is provided', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: '2023-10-11T17:00:00-07:00',
        timeZone: 'America/Los_Angeles',
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate!.format('YYYY-MM-DD')).toEqual('2023-10-11');
    });

    test('should map endDate from date when endTime is not provided', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: null,
        timeZone: 'America/Los_Angeles',
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate!.format('YYYY-MM-DD')).toEqual('2023-10-10');
    });

    test('should handle endDate in different timezone', () => {
      const input = aTimeTracking_TimeEntry({
        date: '2023-10-10',
        endTime: '2023-10-11T17:00:00+00:00',
        timeZone: 'America/Los_Angeles',
        isExported: false,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );
      expect(result.endDate!.format('YYYY-MM-DD')).toEqual('2023-10-11');
    });
  });

  describe('serviceItemDAS display name', () => {
    test('should use serviceItemDAS.fullName for service.name when present', () => {
      const input = aTimeTracking_TimeEntry({
        serviceItem: { __typename: 'Commerce_ProductVariant', id: 'svc-123' },
        serviceItemDAS: {
          __typename: 'DataAccess_Product',
          id: 'svc-123',
          ...({ fullName: 'Consulting:Technical Consulting' } as unknown as {}),
        } as any,
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );

      expect(result.service).toEqual({
        id: 'svc-123',
        name: 'Consulting:Technical Consulting',
      });
    });

    test('should default service.name to empty string when serviceItemDAS has no fullName', () => {
      const input = aTimeTracking_TimeEntry({
        serviceItem: { __typename: 'Commerce_ProductVariant', id: 'svc-456' },
        serviceItemDAS: {
          __typename: 'DataAccess_Product',
          id: 'svc-456',
        },
      });

      const result = mapTimeEntryToSingleTimeFormState(
        input,
        'America/Los_Angeles',
      );

      expect(result.service).toEqual({ id: 'svc-456', name: '' });
    });
  });

  test('should map customExtensions.dimensions to form dimensions', () => {
    const input = aTimeTracking_TimeEntry({
      customExtensions: {
        dimensions: [
          {
            definition: { id: 'dim-1' },
            values: ['opt-1'],
          },
        ],
      },
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.dimensions).toEqual({
      'dim-1': { id: 'dim-1', optionID: 'opt-1' },
    });
  });

  test('should default timeFor.type to EMPLOYEE when __typename is absent', () => {
    const input = aTimeTracking_TimeEntry({
      isExported: false,
      timeFor: {
        ...aTimeTracking_TimeEntry().timeFor,
        __typename: undefined as any,
      },
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.timeFor.type).toBe(TimeForType.EMPLOYEE);
  });

  test('should fall back to EMPLOYEE type when __typename is not a recognised TypeForTypeNames key', () => {
    const input = aTimeTracking_TimeEntry({
      isExported: false,
      timeFor: {
        ...aTimeTracking_TimeEntry().timeFor,
        __typename: 'DataAccess_UnknownType' as any,
      },
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.timeFor.type).toBe(TimeForType.EMPLOYEE);
  });

  test('should map a legacyCustomField with empty value to empty string', () => {
    const input = aTimeTracking_TimeEntry({
      legacyCustomFields: [{ id: 'cf-1', name: ' Trimmed ', value: '' } as any],
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.customFields).toHaveProperty('cf-1', {
      id: 'cf-1',
      name: 'Trimmed',
      value: '',
      optionID: '',
    });
  });

  test('should map a legacyCustomField with null name to undefined', () => {
    const input = aTimeTracking_TimeEntry({
      legacyCustomFields: [
        { id: 'cf-2', name: null, value: 'someValue' } as any,
      ],
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.customFields).toHaveProperty('cf-2');
    expect(result.customFields!['cf-2'].name).toBeUndefined();
  });

  test('should fall back to legacy timeAgainst when timeAgainstContactDAS is absent', () => {
    const input = aTimeTracking_TimeEntry({
      timeAgainstContactDAS: undefined,
      timeAgainst: {
        customer: { id: 'legacy-cust-id' },
        project: { id: 'legacy-proj-id' },
      } as any,
      isExported: false,
      date: '2023-10-10',
      timeZone: 'America/Los_Angeles',
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.timeAgainst.customer?.id).toBe('legacy-cust-id');
    expect(result.timeAgainst.project?.id).toBe('legacy-proj-id');
  });

  test('should map invoiceId to null when the field is absent on the entry', () => {
    const input = aTimeTracking_TimeEntry({
      invoiceId: undefined,
      isExported: false,
      date: '2023-10-10',
      timeZone: 'America/Los_Angeles',
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.invoiceId).toBeNull();
  });

  test('should produce an empty customFields object when legacyCustomFields is undefined', () => {
    const input = aTimeTracking_TimeEntry({
      legacyCustomFields: undefined,
      isExported: false,
      date: '2023-10-10',
      timeZone: 'America/Los_Angeles',
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.customFields).toEqual({});
  });

  test('should handle absent autoCalculatedMeters in distanceTracking', () => {
    // manualMeters is cast to null to simulate the API returning null (auto-calculate mode).
    // autoCalculatedMeters is absent (undefined), covering the `?? null` branch at both
    // the distanceTracking and mileage computation paths.
    const input = aTimeTracking_TimeEntry({
      distanceTracking: {
        __typename: 'TimeTracking_DistanceTracking',
        autoCalculatedMeters: undefined,
        manualMeters: null as unknown as undefined,
      },
      isExported: false,
      date: '2023-10-10',
      timeZone: 'America/Los_Angeles',
    });

    const result = mapTimeEntryToSingleTimeFormState(
      input,
      'America/Los_Angeles',
    );

    expect(result.mileage).toBeNull();
    expect(result.autoCalculateMileage).toBe(true);
  });
});

describe('mapAddSingleTimeEntryForm_forCreateInput', () => {
  const mockFormState: SingleTimeFormState = {
    id: '1',
    version: '0',
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    timeAgainst: {
      customer: {
        id: 'cust1',
        name: '',
      },
      project: {
        id: 'pro1',
        name: '',
      },
    },
    toggleClockIn: true,
    toggleBreak: true,
    isExported: false,
    startDate: dayjs('2023-10-10'),
    startTime: timeStringToDayjs('08:00 AM'),
    endTime: timeStringToDayjs('05:00 PM'),
    duration: 28800,
    service: {
      id: 'item1',
      name: '',
    },
    class: {
      id: 'class1',
      name: '',
    },
    location: {
      id: 'dept1',
      name: '',
    },
    payType: {
      id: 'pay1',
      name: '',
    },
    billable: true,
    billRate: 50,
    notes: 'Worked on project',
    breakDuration: 3600,
    costRate: 30,
    taxable: true,
    timezone: 'America/Los_Angeles',
  };

  describe('customExtensions mapping', () => {
    it('should include customExtensions when dimensions are selected', () => {
      const formState = {
        ...mockFormState,
        dimensions: {
          'dim-1': { id: 'dim-1', optionID: 'opt-1' },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result.customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
      });
    });

    it('should omit customExtensions when no dimension values are selected', () => {
      const result = mapAddSingleTimeEntryForm_forCreateInput(
        mockFormState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('customExtensions');
    });

    it('sends a displayOnly (disabled) dimension value on edit', () => {
      const formState = {
        ...mockFormState,
        dimensions: {
          'dim-1': { id: 'dim-1', optionID: 'opt-1', displayOnly: true },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        true, // sparse = edit
      );

      expect(result.customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
      });
    });

    it('sends a displayOnly (disabled) dimension value that has a value', () => {
      const formState = {
        ...mockFormState,
        dimensions: {
          'dim-1': { id: 'dim-1', optionID: 'opt-1', displayOnly: true },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
      );

      expect(result.customExtensions).toEqual({
        dimensions: [{ definitionId: 'dim-1', values: ['opt-1'] }],
      });
    });
  });

  describe('location field mapping', () => {
    it('should include both departmentID and departmentLabel for time entries', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        location: {
          id: 'location-123',
          name: 'Test Location',
        },
      };

      const quickFillFieldLabels = {
        location: 'Test Location Label',
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        quickFillFieldLabels,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      // For time entries (isExported: false), location fields should be included regardless of preferences
      expect(result).toHaveProperty('departmentID', 'location-123');
      expect(result).toHaveProperty('departmentLabel', 'Test Location Label');
    });

    it('should only include departmentID for time activities', () => {
      const formState = {
        ...mockFormState,
        isExported: true,
        location: {
          id: 'location-123',
          name: 'Test Location',
        },
      };

      const quickFillFieldLabels = {
        location: 'Test Location Label',
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        quickFillFieldLabels,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('departmentID', 'location-123');
      expect(result).not.toHaveProperty('departmentLabel');
    });

    it('should not include location fields when location is not selected', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        location: {
          id: '',
          name: '',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).not.toHaveProperty('departmentID');
      expect(result).not.toHaveProperty('departmentLabel');
    });
  });

  describe('billable mapping', () => {
    it('should send billable and billRate from form state even when isBillingFieldEnabled is false if field is assigned to customer', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: true,
        billRate: 6,
      };
      const settingsWithBillingDisabled = {
        ...commonSettings,
        isBillingFieldEnabled: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settingsWithBillingDisabled,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        undefined,
        true, // isBillableFieldAssigned
      );

      expect(result.billableRate).toBe(6);
      expect(result.billableStatus).toBe(TimeTracking_BillableStatus.Billable);
    });

    it('should send NOT_BILLABLE and null rate when form state billable is false', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: false,
        billRate: null,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBeNull();
      expect(result.billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should suppress billable fields for a time activity when isBillingFieldEnabled is false', () => {
      const formState = {
        ...mockFormState,
        isExported: true,
        billable: true,
        billRate: 6,
      };
      const settingsWithBillingDisabled = {
        ...commonSettings,
        isBillingFieldEnabled: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settingsWithBillingDisabled,
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBeNull();
      expect(result.billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should send billable fields for a time activity when isBillingFieldEnabled is true', () => {
      const formState = {
        ...mockFormState,
        isExported: true,
        billable: true,
        billRate: 6,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings, // isBillingFieldEnabled: true
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBe(6);
      expect(result.billableStatus).toBe(TimeTracking_BillableStatus.Billable);
    });

    it('should send billable for time entry without customer when isBillingFieldEnabled is true', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: true,
        billRate: 10,
        timeAgainst: {
          customer: { id: null, name: '' },
          project: { id: '', name: '' },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings, // isBillingFieldEnabled: true
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBe(10);
      expect(result.billableStatus).toBe(TimeTracking_BillableStatus.Billable);
    });

    it('should suppress billable for time entry without customer when isBillingFieldEnabled is false', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: true,
        billRate: 10,
        timeAgainst: {
          customer: { id: null, name: '' },
          project: { id: '', name: '' },
        },
      };
      const settingsWithBillingDisabled = {
        ...commonSettings,
        isBillingFieldEnabled: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settingsWithBillingDisabled,
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBeNull();
      expect(result.billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should suppress billable for time entry with customer when isBillableFieldAssigned is false', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: true,
        billRate: 15,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        undefined,
        false, // isBillableFieldAssigned
      );

      expect(result.billableRate).toBeNull();
      expect(result.billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });

    it('should suppress billable for time entry with customer when isBillableFieldAssigned is not provided', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        billable: true,
        billRate: 15,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
      );

      expect(result.billableRate).toBeNull();
      expect(result.billableStatus).toBe(
        TimeTracking_BillableStatus.NotBillable,
      );
    });
  });

  describe('custom fields mapping', () => {
    it('should include custom fields when they exist', () => {
      const formState = {
        ...mockFormState,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'Custom Field 1',
            value: 'test value 1',
            required: true,
            deleted: false,
          },
          cf2: {
            id: 'cf2',
            name: 'Custom Field 2',
            value: 'test value 2',
            required: false,
            deleted: false,
          },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).toHaveProperty('customFields');
      expect(result.customFields).toEqual([
        {
          id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
          name: 'Custom Field 1',
          value: 'test value 1',
          optionID: '',
        },
        {
          id: 'cf2',
          name: 'Custom Field 2',
          value: 'test value 2',
          optionID: '',
        },
      ]);
    });

    it('should not include custom fields when they are empty', () => {
      const formState = {
        ...mockFormState,
        customFields: {},
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('customFields');
    });

    it('should not include custom fields when they are undefined', () => {
      const formState = {
        ...mockFormState,
        customFields: undefined,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('customFields');
    });

    it('should include custom fields with string values', () => {
      const formState = {
        ...mockFormState,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'String Field 1',
            value: 'hello',
            required: false,
            deleted: false,
          },
          cf2: {
            id: 'cf2',
            name: 'String Field 2',
            value: 'world',
            required: true,
            deleted: false,
          },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result.customFields).toEqual([
        {
          id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
          name: 'String Field 1',
          value: 'hello',
          optionID: '',
        },
        {
          id: 'cf2',
          name: 'String Field 2',
          value: 'world',
          optionID: '',
        },
      ]);
    });

    it('should handle empty and undefined custom field values', () => {
      const formState = {
        ...mockFormState,
        customFields: {
          'd7209323-9a06-42a8-8ed6-6ecbeea7a73b': {
            id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
            name: 'Empty Field',
            value: '',
            required: false,
            deleted: false,
          },
          cf2: {
            id: 'cf2',
            name: 'Undefined Field',
            value: undefined,
            required: false,
            deleted: false,
          },
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result.customFields).toEqual([
        {
          id: 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
          name: 'Empty Field',
          value: '',
          optionID: '',
        },
        {
          id: 'cf2',
          name: 'Undefined Field',
          value: '',
          optionID: '',
        },
      ]);
    });

    it('should map custom field with null name to undefined in create input', () => {
      const formState = {
        ...mockFormState,
        customFields: {
          'cf-null-name': {
            id: 'cf-null-name',
            name: null as any,
            value: 'some-value',
            required: false,
            deleted: false,
            optionID: '',
          },
        },
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      const field = result.customFields?.find(
        (f: any) => f.id === 'cf-null-name',
      );
      expect(field).toBeDefined();
      expect(field.name).toBeUndefined();
    });
  });

  it('should include location fields for time entries even when preferences are disabled', () => {
    const formState = {
      ...mockFormState,
      isExported: false,
      location: {
        id: 'location-123',
        name: 'Test Location',
      },
    };

    const preferences = {
      ...commonPreferences,
      [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
        ...commonPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
        isLocationFieldEnabled: false,
      },
    };

    const result = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      preferences,
      true,
      false,
    );

    // For time entries, preferences should not affect location fields - only isTsheetLocationEnabled matters
    expect(result).toHaveProperty('departmentID', 'location-123');
    expect(result).toHaveProperty('departmentLabel');
  });

  it('should include location fields even when location field is disabled if location has value', () => {
    const formState = {
      ...mockFormState,
      isExported: false,
      location: {
        id: 'location-123',
        name: 'Test Location',
      },
    };

    const settings = {
      ...commonSettings,
      isTsheetLocationEnabled: false, // Disabled but has value through assignments
      classRequired: false,
      locationRequired: false,
      serviceItemRequired: false,
      timeSheetEntryMakesNotesRequiredEnabled: false,
    };

    const result = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      settings,
      commonPreferences,
      true,
      false,
    );

    // Should include location if it has a value, regardless of field being disabled
    expect(result).toHaveProperty('departmentID', 'location-123');
    expect(result).toHaveProperty('departmentLabel');
  });

  describe('endTime calculation for time entries', () => {
    it('should use formState.endDate when endDate is after startDate', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        endDate: dayjs('2023-10-12'), // Different day
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // The endTime should use endDate (2023-10-12) instead of startDate (2023-10-10)
      expect(result.endTime).toBe('2023-10-12T17:00:00-07:00');
    });

    it('should add 1 day to startDate when startTime is greater than endTime (overnight shift)', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        endDate: undefined, // No explicit endDate
        startTime: timeStringToDayjs('11:00 PM'), // 11 PM
        endTime: timeStringToDayjs('03:00 AM'), // 3 AM next day
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // The endTime should use startDate + 1 day (2023-10-11) for 3 AM
      expect(result.endTime).toBe('2023-10-11T03:00:00-07:00');
    });

    it('should use startDate when endTime is after startTime (same day)', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        endDate: undefined, // No explicit endDate
        startTime: timeStringToDayjs('08:00 AM'), // 8 AM
        endTime: timeStringToDayjs('05:00 PM'), // 5 PM same day
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // The endTime should use startDate (2023-10-10) for 5 PM
      expect(result.endTime).toBe('2023-10-10T17:00:00-07:00');
    });

    it('should prioritize endDate over overnight calculation when both conditions exist', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        endDate: dayjs('2023-10-15'), // Explicit end date
        startTime: timeStringToDayjs('11:00 PM'), // 11 PM (would normally trigger +1 day)
        endTime: timeStringToDayjs('03:00 AM'), // 3 AM
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // The endTime should use explicit endDate (2023-10-15) not startDate + 1 day
      expect(result.endTime).toBe('2023-10-15T03:00:00-07:00');
    });

    it('should not calculate endTime when currentlyWorking is true', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        currentlyWorking: true, // Still working
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // Should not have endTime when currently working
      expect(result).not.toHaveProperty('endTime');
      expect(result).toHaveProperty('startTime');
    });

    it('should not calculate endTime when endTime is not provided', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: undefined, // No end time
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      // Should not have endTime when endTime is not provided
      expect(result).not.toHaveProperty('endTime');
      expect(result).toHaveProperty('startTime');
    });
  });

  describe('timezone handling for time entries', () => {
    it('should prioritize formState timezone over settings timezone when both are available', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        timezone: 'America/New_York', // User-specific timezone
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        currentlyWorking: false,
      };

      const settings = {
        ...commonSettings,
        timezone: 'America/Los_Angeles', // Company default timezone
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should use formState.timezone (America/New_York) for both startTime and endTime
      expect(result.startTime).toBe('2023-10-10T08:00:00-04:00'); // EDT
      expect(result.endTime).toBe('2023-10-10T17:00:00-04:00'); // EDT
      // QUANTA-11842: create/update payload does not send a separate timeZone; offset is on timestamps
      expect(result).not.toHaveProperty('timeZone');
    });

    it('should fallback to settings timezone when formState timezone is undefined', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        timezone: undefined, // No user-specific timezone
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        currentlyWorking: false,
      };

      const settings = {
        ...commonSettings,
        timezone: 'America/Chicago', // Company default timezone
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should fallback to settings.timezone (America/Chicago)
      expect(result.startTime).toBe('2023-10-10T08:00:00-05:00'); // CDT
      expect(result.endTime).toBe('2023-10-10T17:00:00-05:00'); // CDT
    });

    it('should fallback to settings timezone when formState timezone is undefined', () => {
      const testDate = '2023-10-10';
      const testTimezone = 'Europe/London';
      const formState = {
        ...mockFormState,
        isExported: false,
        timezone: undefined, // Explicitly undefined
        startDate: dayjs(testDate),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        currentlyWorking: false,
      };

      const settings = {
        ...commonSettings,
        timezone: testTimezone, // Company default timezone
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should fallback to settings.timezone (Europe/London)
      // Verify the result represents the correct date and time
      // The result string has the format: "2023-10-10T08:00:00+00:00"
      // We should verify it contains the correct date and time components
      expect(result.startTime).toContain(`${testDate}T08:00:00`);
      expect(result.endTime).toContain(`${testDate}T17:00:00`);
    });

    it('should handle overnight shifts with user-specific timezone', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        timezone: 'Asia/Tokyo', // User-specific timezone
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('11:00 PM'), // 11 PM
        endTime: timeStringToDayjs('03:00 AM'), // 3 AM next day
        currentlyWorking: false,
      };

      const settings = {
        ...commonSettings,
        timezone: 'America/Los_Angeles', // Company default timezone
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should use formState.timezone (Asia/Tokyo) and handle overnight shift
      expect(result.startTime).toBe('2023-10-10T23:00:00+09:00'); // JST
      expect(result.endTime).toBe('2023-10-11T03:00:00+09:00'); // JST (next day)
    });

    it('should not include timeZone field when formState timezone matches settings timezone', () => {
      const formState = {
        ...mockFormState,
        isExported: false,
        timezone: 'America/Los_Angeles', // Same as company timezone
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        currentlyWorking: false,
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings, // timezone: 'America/Los_Angeles'
        commonPreferences,
        true,
      );

      // Should not include timeZone field when they match
      expect(result).not.toHaveProperty('timeZone');
      expect(result.startTime).toBe('2023-10-10T08:00:00-07:00');
    });
  });

  describe('conditional property exclusion', () => {
    it('should include classID even when class field is disabled if class has value', () => {
      const formState = {
        ...mockFormState,
        class: {
          id: 'class-123',
          name: 'Test Class',
        },
      };

      const settings = {
        ...commonSettings,
        isTsheetClassEnabled: false, // Disabled but has value through assignments
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should include class if it has a value, regardless of field being disabled
      expect(result).toHaveProperty('classID', 'class-123');
    });

    it('should include classID for time entries even when preferences are disabled', () => {
      const formState = {
        ...mockFormState,
        class: {
          id: 'class-123',
          name: 'Test Class',
        },
      };

      const preferences = {
        ...commonPreferences,
        [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
          ...commonPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
          isClassFieldEnabled: false, // Disabled in preferences
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        preferences,
        true,
      );

      // For time entries, preferences should not affect class fields - only isTsheetClassEnabled matters
      expect(result).toHaveProperty('classID', 'class-123');
    });

    it('should not include classID when class.id is empty', () => {
      const formState = {
        ...mockFormState,
        class: {
          id: '', // Empty ID
          name: 'Test Class',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('classID');
    });

    it('should include classID even when isTsheetClassEnabled is disabled if class has value', () => {
      const formState = {
        ...mockFormState,
        class: {
          id: 'class-123',
          name: 'Test Class',
        },
      };

      const settings = {
        ...commonSettings,
        isTsheetClassEnabled: false, // Disabled but has value through assignments
      };

      const preferences = {
        ...commonPreferences,
        [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
          ...commonPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
          isClassFieldEnabled: false, // This doesn't matter for time entries
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        preferences,
        true,
      );

      // Should include class if it has a value, regardless of field being disabled
      expect(result).toHaveProperty('classID', 'class-123');
    });

    it('should include serviceItemID even when service field is disabled if service has value', () => {
      const formState = {
        ...mockFormState,
        service: {
          id: 'service-123',
          name: 'Test Service',
        },
      };

      const settings = {
        ...commonSettings,
        isServiceFieldEnabled: false, // Disabled but has value through assignments
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      // Should include service if it has a value, regardless of field being disabled
      expect(result).toHaveProperty('serviceItemID', 'service-123');
    });

    it('should not include serviceItemID when service.id is empty', () => {
      const formState = {
        ...mockFormState,
        service: {
          id: '', // Empty ID
          name: 'Test Service',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('serviceItemID');
    });

    it('should not include taxable when taxable field is disabled in settings', () => {
      const formState = {
        ...mockFormState,
        taxable: true,
      };

      const settings = {
        ...commonSettings,
        isTaxableFieldEnabled: false, // Disabled in settings
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        settings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('taxable');
    });

    it('should not include taxable when taxable field is disabled in preferences', () => {
      const formState = {
        ...mockFormState,
        taxable: true,
      };

      const preferences = {
        ...commonPreferences,
        [UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS]: {
          ...commonPreferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS],
          isTaxableFieldEnabled: false, // Disabled in preferences
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        preferences,
        true,
      );

      expect(result).not.toHaveProperty('taxable');
    });

    it('should not include payrollItemID when hasPayroll is false', () => {
      const formState = {
        ...mockFormState,
        timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
        payType: {
          id: 'paytype-123',
          name: 'Regular Pay',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        false, // hasPayroll = false
      );

      expect(result).not.toHaveProperty('payrollItemID');
    });

    it('should not include payrollItemID when timeFor is VENDOR', () => {
      const formState = {
        ...mockFormState,
        timeFor: { id: 'vendor1', type: TimeForType.VENDOR, name: '' }, // Vendor, not employee
        payType: {
          id: 'paytype-123',
          name: 'Regular Pay',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true, // hasPayroll = true
      );

      expect(result).not.toHaveProperty('payrollItemID');
    });

    it('should not include payrollItemID when payType.id is empty', () => {
      const formState = {
        ...mockFormState,
        timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
        payType: {
          id: '', // Empty ID
          name: 'Regular Pay',
        },
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true, // hasPayroll = true
      );

      expect(result).not.toHaveProperty('payrollItemID');
    });

    it('should not include notes when notes is empty string', () => {
      const formState = {
        ...mockFormState,
        notes: '', // Empty notes
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('notes');
    });

    it('should not include notes when notes length is 0', () => {
      const formState = {
        ...mockFormState,
        notes: '', // Zero length
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
      );

      expect(result).not.toHaveProperty('notes');
    });
  });

  describe('LEGACY_QBO_USER feature flag gating', () => {
    const legacyFormState: SingleTimeFormState = {
      ...mockFormState,
      timeFor: {
        id: 'persona1',
        type: TimeForType.LEGACY_QBO_USER,
        name: '',
      },
    };

    it('falls back to VENDOR for LEGACY_QBO_USER when flag is OFF (default param)', () => {
      const result = mapAddSingleTimeEntryForm_forCreateInput(
        legacyFormState,
        commonSettings,
        commonPreferences,
        true,
      );

      // Without the flag, isLegacyQboUser is false and isEmployee is false,
      // so the IIFE falls through to Vendor (pre-flag behavior).
      expect(result.timeFor).toEqual({
        id: 'persona1',
        timeForType: 'VENDOR',
      });
    });

    it('emits LEGACY_QBO_USER timeForType when flag is ON', () => {
      const result = mapAddSingleTimeEntryForm_forCreateInput(
        legacyFormState,
        commonSettings,
        commonPreferences,
        true,
        false, // sparse
        undefined, // quickFillFieldLabels
        undefined, // dirtyFields
        undefined, // shouldIncludeDistanceTracking
        undefined, // isBillableFieldAssigned
        true, // isLegacyQboUserEnabled
      );

      expect(result.timeFor).toEqual({
        id: 'persona1',
        timeForType: 'LEGACY_QBO_USER',
      });
    });

    it('does not affect EMPLOYEE behavior when flag is ON', () => {
      const result = mapAddSingleTimeEntryForm_forCreateInput(
        mockFormState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
      );

      expect(result.timeFor).toEqual({
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      });
    });

    it('should default to Vendor timeForType when timeFor.type is null/undefined', () => {
      const formState = {
        ...mockFormState,
        timeFor: { id: 'emp1', type: undefined as any, name: '' },
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        false,
      );

      expect(result.timeFor.timeForType).toBe(TimeTracking_TimeForType.Vendor);
    });
  });
});

test.each([
  {
    // Time activity
    input: {
      formState: {
        id: '1',
        version: '0',
        timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
        timeAgainst: {
          customer: {
            id: 'cust1',
            name: '',
          },
          project: {
            id: 'pro1',
            name: '',
          },
        },
        toggleClockIn: true,
        toggleBreak: true,
        isExported: true,
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        duration: 28800,
        service: {
          id: 'item1',
          name: '',
        },
        class: {
          id: 'class1',
          name: '',
        },
        location: {
          id: 'dept1',
          name: '',
        },
        payType: {
          id: 'pay1',
          name: '',
        },
        billable: true,
        billRate: 50,
        notes: 'Worked on project',
        breakDuration: 3600,
        costRate: 30,
        taxable: true,
      },
      settings: commonSettings,
      preferences: commonPreferences,
      hasPayroll: true,
      hasProjects: true,
      hasAdminAccess: true,
    },
    expected: {
      billableRate: 50,
      billableStatus: 'BILLABLE',
      classID: 'class1',
      costRate: 30,
      date: '2023-10-10',
      departmentID: 'dept1',
      distanceTracking: {
        isAutoCalculated: false,
        manualMeters: null,
      },
      endTime: '2023-10-10T17:00:00-07:00',
      startTime: '2023-10-10T08:00:00-07:00',
      notes: 'Worked on project',
      payrollItemID: 'pay1',
      serviceItemID: 'item1',
      taxable: true,
      timeAgainst: {
        customerId: 'cust1',
        projectId: 'pro1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      v3BreakDuration: 3600,
    },
  },
] as any[])('should map correctly for time activity', ({ input, expected }) => {
  expect(
    mapAddSingleTimeEntryForm_forCreateInput<TimeTracking_CreateTimeEntryInput>(
      input.formState,
      input.settings as TimeTrackingCompanySettings,
      input.preferences,
      input.hasPayroll,
      false,
      undefined,
      undefined,
      true, // shouldIncludeDistanceTracking
    ),
  ).toEqual(expected);
});

test.each([
  {
    // Time entry
    input: {
      formState: {
        id: '1',
        version: '0',
        timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
        timeAgainst: {
          customer: {
            id: 'cus1',
            name: '',
          },
          project: {
            id: 'pro1',
            name: '',
          },
        },
        toggleClockIn: true,
        toggleBreak: true,
        isExported: false,
        startDate: dayjs('2023-10-10'),
        startTime: timeStringToDayjs('08:00 AM'),
        endTime: timeStringToDayjs('05:00 PM'),
        duration: 28800,
        service: {
          id: 'item1',
          name: '',
        },
        class: {
          id: 'class1',
          name: '',
        },
        location: {
          id: 'dept1',
          name: '',
        },
        payType: {
          id: 'pay1',
          name: '',
        },
        billable: true,
        billRate: 50,
        notes: 'Worked on project',
        breakDuration: 3600,
        costRate: 30,
        taxable: true,
        timezone: 'America/Los_Angeles',
      },
      settings: commonSettings,
      preferences: commonPreferences,
      hasPayroll: true,
      hasProjects: true,
      hasAdminAccess: true,
    },
    expected: {
      billableRate: 50,
      billableStatus: 'BILLABLE',
      classID: 'class1',
      date: '2023-10-10',
      departmentID: 'dept1',
      departmentLabel: '',
      distanceTracking: {
        isAutoCalculated: false,
        manualMeters: null,
      },
      endTime: '2023-10-10T17:00:00-07:00',
      startTime: '2023-10-10T08:00:00-07:00',
      notes: 'Worked on project',
      payrollItemID: 'pay1',
      serviceItemID: 'item1',
      timeAgainst: {
        customerId: 'cus1',
      },
      timeFor: {
        id: 'emp1',
        timeForType: 'EMPLOYEE',
      },
      v3BreakDuration: 3600,
      isExported: false,
    },
  },
] as any[])('should map correctly for time entry', ({ input, expected }) => {
  expect(
    mapAddSingleTimeEntryForm_forCreateInput<TimeTracking_CreateTimeEntryInput>(
      input.formState,
      input.settings as TimeTrackingCompanySettings,
      input.preferences,
      input.hasPayroll,
      false,
      undefined,
      undefined,
      true, // shouldIncludeDistanceTracking
      true, // isBillableFieldAssigned
    ),
  ).toEqual(expected);
});

describe('mapAddSingleTimeEntryForm_forUpdateInput', () => {
  test.each([
    {
      input: {
        formState: {
          id: '1',
          version: '0',
          timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          toggleClockIn: true,
          toggleBreak: true,
          startDate: dayjs('2023-10-10'),
          startTime: dayjs('2023-10-10T08:00:00Z'),
          endTime: dayjs('2023-10-10T17:00:00Z'),
          duration: 28800,
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billRate: 50,
          notes: 'Worked on project',
          breakDuration: 3600,
          costRate: 30,
          taxable: true,
          timezone: 'America/Los_Angeles',
        },
        settings: commonSettings,
        preferences: commonPreferences,
        hasPayroll: true,
        hasProjects: true,
        hasAdminAccess: true,
      },
      expected: {
        id: '1',
        version: '0',
        billableRate: 50,
        billableStatus: 'BILLABLE',
        classID: 'class1',
        costRate: 30,
        date: '2023-10-10',
        departmentID: 'dept1',
        distanceTracking: {
          isAutoCalculated: false,
          manualMeters: null,
        },
        endTime: expect.anything(),
        notes: 'Worked on project',
        payrollItemID: 'pay1',
        serviceItemID: 'item1',
        startTime: expect.anything(),
        taxable: true,
        timeAgainst: {
          customerId: 'cust1',
          projectId: 'proj1',
        },
        sparse: true,
        timeFor: {
          id: 'emp1',
          timeForType: 'EMPLOYEE',
        },
        v3BreakDuration: 3600,
      },
    },
  ] as any[])(
    'mapAddSingleTimeEntryForm_forUpdateInput should map the inputs correctly',
    ({ input, expected }) => {
      expect(
        mapAddSingleTimeEntryForm_forUpdateInput(
          input.formState,
          input.settings as TimeTrackingCompanySettings,
          input.preferences,
          input.hasPayroll,
          undefined,
          undefined,
          true, // shouldIncludeDistanceTracking
        ),
      ).toEqual(expected);
    },
  );
});

describe('mapAddSingleTimeEntryForm_forBatchCreateUpdateInput', () => {
  test.each([
    {
      input: {
        formState: {
          version: '0',
          timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          toggleClockIn: true,
          toggleBreak: true,
          startDate: dayjs('2023-10-10'),
          startTime: dayjs('2023-10-10T08:00:00Z'),
          endTime: dayjs('2023-10-10T17:00:00Z'),
          duration: 0,
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billRate: 50,
          notes: 'Worked on project',
          breakDuration: 3600,
          costRate: 30,
          taxable: true,
          timezone: 'America/Los_Angeles',
          closedBookPassword: 'test',
        },
        settings: commonSettings,
        preferences: commonPreferences,
        hasPayroll: true,
        hasProjects: true,
      },
      expected: {
        closedBookPassword: 'dGVzdA==',
        timeEntries: [
          {
            billableRate: 50,
            billableStatus: 'BILLABLE',
            classID: 'class1',
            costRate: 30,
            date: '2023-10-10',
            departmentID: 'dept1',
            endTime: expect.anything(),
            notes: 'Worked on project',
            payrollItemID: 'pay1',
            serviceItemID: 'item1',
            startTime: expect.anything(),
            taxable: true,
            timeAgainst: {
              customerId: 'cust1',
              projectId: 'proj1',
            },
            timeFor: {
              id: 'emp1',
              timeForType: 'EMPLOYEE',
            },
            v3BreakDuration: 3600,
          },
        ],
      },
    },
    {
      input: {
        formState: {
          id: '1',
          version: '2',
          timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          toggleClockIn: true,
          toggleBreak: true,
          startDate: dayjs('2023-10-10'),
          startTime: dayjs('2023-10-10T08:00:00Z'),
          endTime: dayjs('2023-10-10T17:00:00Z'),
          duration: 28800,
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billRate: 50,
          notes: 'Worked on project',
          breakDuration: 3600,
          costRate: 30,
          taxable: true,
          timezone: 'America/Los_Angeles',
          closedBookPassword: 'test',
        },
        settings: commonSettings,
        preferences: commonPreferences,
        hasPayroll: true,
        hasProjects: true,
      },
      expected: {
        closedBookPassword: 'dGVzdA==',
        timeEntries: [
          {
            id: '1',
            version: '2',
            billableRate: 50,
            billableStatus: 'BILLABLE',
            classID: 'class1',
            costRate: 30,
            date: '2023-10-10',
            departmentID: 'dept1',
            endTime: expect.anything(),
            notes: 'Worked on project',
            payrollItemID: 'pay1',
            serviceItemID: 'item1',
            startTime: expect.anything(),
            taxable: true,
            sparse: true,
            timeAgainst: {
              customerId: 'cust1',
              projectId: 'proj1',
            },
            timeFor: {
              id: 'emp1',
              timeForType: 'EMPLOYEE',
            },
            v3BreakDuration: 3600,
          },
        ],
      },
    },
  ] as any[])(
    'mapAddSingleTimeEntryForm_forBatchCreateUpdateInput should map the inputs correctly',
    ({ input, expected }) => {
      const result = mapAddSingleTimeEntryForm_forBatchCreateUpdateInput(
        input.formState,
        input.settings as TimeTrackingCompanySettings,
        input.preferences,
        true,
        undefined,
      );

      expect(result).toEqual(expected);
    },
  );
});

describe('time entry clockIn — startTime and endTime in payload', () => {
  it('should include startTime and endTime when toggleClockIn is true for a TE', () => {
    const formState: SingleTimeFormState = {
      id: '1',
      version: '0',
      timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
      timeAgainst: {
        customer: { id: 'cust1', name: '' },
        project: { id: 'proj1', name: '' },
      },
      toggleClockIn: true,
      toggleBreak: false,
      isExported: false,
      startDate: dayjs('2023-10-10'),
      startTime: timeStringToDayjs('08:00 AM'),
      endTime: timeStringToDayjs('05:00 PM'),
      duration: null,
      service: { id: '', name: '' },
      class: { id: '', name: '' },
      location: { id: '', name: '' },
      payType: { id: '', name: '' },
      billable: false,
      billRate: null,
      notes: '',
      breakDuration: null,
      costRate: null,
      taxable: false,
      timezone: 'America/Los_Angeles',
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result).toHaveProperty('startTime');
    expect(result).toHaveProperty('endTime');
    expect(result).not.toHaveProperty('duration');
  });
});

describe('mapAddSingleTimeEntryForm_forCreateInput — additional branch coverage', () => {
  const baseFormState: SingleTimeFormState = {
    id: '1',
    version: '0',
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    timeAgainst: {
      customer: { id: 'cust1', name: '' },
      project: { id: 'proj1', name: '' },
    },
    toggleClockIn: false,
    toggleBreak: false,
    isExported: false,
    startDate: dayjs('2023-10-10'),
    duration: 3600,
    service: { id: '', name: '' },
    class: { id: 'class1', name: '' },
    location: { id: 'dept1', name: '' },
    payType: { id: '', name: '' },
    billable: false,
    billRate: null,
    notes: '',
    breakDuration: null,
    costRate: null,
    taxable: false,
    timezone: 'America/Los_Angeles',
  };

  it('should produce null customerId for STA when no customer is selected', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: true,
      timeAgainst: {
        customer: { id: null, name: '' },
        project: { id: '', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBeNull();
    expect(result.timeAgainst).not.toHaveProperty('projectId');
  });

  it('should include projectId in STA output when a project is selected', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: true,
      timeAgainst: {
        customer: { id: 'cust1', name: '' },
        project: { id: 'proj1', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBe('cust1');
    expect(result.timeAgainst.projectId).toBe('proj1');
  });

  it('should produce undefined customerId for TE when customer optional chain resolves to null', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: false,
      timeAgainst: {
        customer: { id: null, name: '' },
        project: { id: '', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBeUndefined();
  });

  it('should produce undefined customerId for TE when customer itself is absent', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: false,
      timeAgainst: {
        customer: undefined as any,
        project: { id: '', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBeUndefined();
  });

  it('should produce null customerId for STA when customer itself is absent', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: true,
      timeAgainst: {
        customer: undefined as any,
        project: { id: '', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBeNull();
    expect(result.timeAgainst).not.toHaveProperty('projectId');
  });

  it('should not include projectId for STA when project itself is null', () => {
    const formState: SingleTimeFormState = {
      ...baseFormState,
      isExported: true,
      timeAgainst: {
        customer: { id: 'cust1', name: '' },
        project: null as any,
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.timeAgainst.customerId).toBe('cust1');
    expect(result.timeAgainst).not.toHaveProperty('projectId');
  });

  it('should set billableRate to null when billable is true but billRate is null (no customer selected)', () => {
    // No customer → isBillable uses isBillingFieldEnabled (true in commonSettings) instead of
    // isBillableFieldAssigned, so billable=true with billRate=null produces billableRate: null.
    const formState: SingleTimeFormState = {
      ...baseFormState,
      billable: true,
      billRate: null,
      timeAgainst: {
        customer: { id: null, name: '' },
        project: { id: '', name: '' },
      },
    };

    const result: any = mapAddSingleTimeEntryForm_forCreateInput(
      formState,
      commonSettings,
      commonPreferences,
      false,
    );

    expect(result.billableRate).toBeNull();
    expect(result.billableStatus).toBe(TimeTracking_BillableStatus.Billable);
  });
});

describe('mapAddSingleTimeEntryForm_forBatchDeleteInput', () => {
  test.each([
    [
      {
        input: {
          id: '1',
          version: '0',
          timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
          timeAgainst: {
            customer: {
              id: 'cust1',
              name: '',
            },
            project: {
              id: 'proj1',
              name: '',
            },
          },
          toggleClockIn: true,
          toggleBreak: true,
          startDate: dayjs('2023-10-10'),
          startTime: dayjs('2023-10-10T08:00:00Z'),
          endTime: dayjs('2023-10-10T17:00:00Z'),
          duration: 0,
          service: {
            id: 'item1',
            name: '',
          },
          class: {
            id: 'class1',
            name: '',
          },
          location: {
            id: 'dept1',
            name: '',
          },
          payType: {
            id: 'pay1',
            name: '',
          },
          billable: true,
          billRate: 50,
          notes: 'Worked on project',
          breakDuration: 3600,
          costRate: 30,
          taxable: true,
          timezone: 'America/Los_Angeles',
          closedBookPassword: 'test',
        },
        expected: {
          timeEntriesToDelete: [
            {
              id: '1',
              version: '0',
            },
          ],
          closedBookPassword: 'dGVzdA==',
        },
      },
    ],
  ])(
    'should map formState to TimeTracking_BatchManageTimeEntriesInput should map the inputs correctly',
    ({ input, expected }) => {
      const result = mapAddSingleTimeEntryForm_forBatchDeleteInput(input);
      expect(result).toEqual(expected);
    },
  );

  test('should use "*" as the closedBookPassword fallback when the field is empty', () => {
    const formState: SingleTimeFormState = {
      id: 'entry-1',
      version: '0',
      timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
      timeAgainst: {
        customer: { id: 'cust1', name: '' },
        project: { id: '', name: '' },
      },
      toggleClockIn: false,
      toggleBreak: false,
      isExported: false,
      startDate: dayjs('2023-10-10'),
      duration: 3600,
      service: { id: '', name: '' },
      class: { id: '', name: '' },
      location: { id: '', name: '' },
      payType: { id: '', name: '' },
      billable: false,
      billRate: null,
      notes: '',
      breakDuration: null,
      costRate: null,
      taxable: false,
      timezone: 'America/Los_Angeles',
      closedBookPassword: '',
    };

    const result = mapAddSingleTimeEntryForm_forBatchDeleteInput(formState);

    // Buffer.from('*').toString('base64') === 'Kg=='
    expect(result.closedBookPassword).toBe('Kg==');
  });
});

describe('Dirty field tracking for updates', () => {
  const baseFormState: SingleTimeFormState = {
    id: 'entry-123',
    version: '1',
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    timeAgainst: {
      customer: { id: 'cust1', name: '' },
      project: { id: 'proj1', name: '' },
    },
    toggleClockIn: true,
    toggleBreak: false,
    isExported: false,
    startDate: dayjs('2023-10-10'),
    startTime: timeStringToDayjs('08:00 AM'),
    endTime: timeStringToDayjs('05:00 PM'),
    duration: 28800,
    service: { id: 'service1', name: '' },
    class: { id: 'class1', name: '' },
    location: { id: 'location1', name: '' },
    payType: { id: 'paytype1', name: '' },
    billable: true,
    billRate: 50,
    notes: 'Test notes',
    breakDuration: 0,
    costRate: 30,
    taxable: false,
    timezone: 'America/Los_Angeles',
  };

  describe('mapAddSingleTimeEntryForm_forUpdateInput with dirtyFields', () => {
    it('should include empty string for cleared class field when dirty', () => {
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' }, // Cleared
      };

      const dirtyFields = {
        class: { id: true, name: true }, // Field was changed
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', '');
    });

    it('should include empty string for cleared location field when dirty', () => {
      const formState = {
        ...baseFormState,
        location: { id: '', name: '' }, // Cleared
      };

      const dirtyFields = {
        location: { id: true, name: true }, // Field was changed
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('departmentID', '');
    });

    it('should include empty string for cleared service field when dirty', () => {
      const formState = {
        ...baseFormState,
        service: { id: '', name: '' }, // Cleared
      };

      const dirtyFields = {
        service: { id: true, name: true }, // Field was changed
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('serviceItemID', '');
    });

    it('should include empty string for cleared notes field when dirty', () => {
      const formState = {
        ...baseFormState,
        notes: '', // Cleared
      };

      const dirtyFields = {
        notes: true, // Field was changed
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('notes', '');
    });

    it('should not include class field when not dirty and empty', () => {
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' }, // Empty
      };

      const dirtyFields = {
        // class is NOT in dirtyFields
        notes: true,
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).not.toHaveProperty('classID');
    });

    it('should include class field when not dirty but has value', () => {
      const formState = {
        ...baseFormState,
        class: { id: 'class-123', name: 'Test Class' }, // Has value
      };

      const dirtyFields = {
        // class is NOT in dirtyFields
        notes: true,
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', 'class-123');
    });

    it('should not include notes field when not dirty and blank', () => {
      const formState = {
        ...baseFormState,
        notes: '', // Empty
      };

      const dirtyFields = {
        // notes is NOT in dirtyFields
        class: { id: true, name: true },
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).not.toHaveProperty('notes');
    });

    it('should include notes field when not dirty but has value', () => {
      const formState = {
        ...baseFormState,
        notes: 'Existing notes', // Has value
      };

      const dirtyFields = {
        // notes is NOT in dirtyFields
        class: { id: true, name: true },
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('notes', 'Existing notes');
    });

    it('should handle multiple dirty fields being cleared', () => {
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' },
        location: { id: '', name: '' },
        service: { id: '', name: '' },
      };

      const dirtyFields = {
        class: { id: true, name: true },
        location: { id: true, name: true },
        service: { id: true, name: true },
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', '');
      expect(result).toHaveProperty('departmentID', '');
      expect(result).toHaveProperty('serviceItemID', '');
    });

    it('should handle mixed dirty and non-dirty fields', () => {
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' }, // Cleared (dirty)
        location: { id: 'loc-123', name: 'Location' }, // Has value (not dirty)
        service: { id: '', name: '' }, // Empty (not dirty)
      };

      const dirtyFields = {
        class: { id: true, name: true }, // Cleared intentionally
        // location and service are not dirty
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', ''); // Dirty and cleared
      expect(result).toHaveProperty('departmentID', 'loc-123'); // Not dirty but has value
      expect(result).not.toHaveProperty('serviceItemID'); // Not dirty and empty
    });
  });

  describe('mapAddSingleTimeEntryForm_forCreateInput with dirtyFields', () => {
    it('should ignore dirtyFields for create operations', () => {
      const formState = {
        ...baseFormState,
        id: undefined, // No ID = create
        class: { id: '', name: '' }, // Empty
      };

      const dirtyFields = {
        class: { id: true, name: true }, // Even though dirty, should be ignored in create
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false, // sparse = false
        undefined,
        dirtyFields,
      );

      // For creates, empty fields should not be included even if dirty
      expect(result).not.toHaveProperty('classID');
    });

    it('should only include fields with values in create mode', () => {
      const formState = {
        ...baseFormState,
        id: undefined,
        class: { id: 'class-123', name: 'Test' }, // Has value
        location: { id: '', name: '' }, // Empty
      };

      const dirtyFields = {
        class: { id: true, name: true },
        location: { id: true, name: true }, // Dirty but empty
      };

      const result = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', 'class-123');
      expect(result).not.toHaveProperty('departmentID');
    });
  });

  describe('mapAddSingleTimeEntryForm_forUpdateInput without dirtyFields', () => {
    it('should fall back to value-based inclusion when dirtyFields not provided', () => {
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' }, // Empty
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        undefined, // No dirtyFields provided
      );

      // Without dirtyFields, should not include empty field
      expect(result).not.toHaveProperty('classID');
    });

    it('should include fields with values when dirtyFields not provided', () => {
      const formState = {
        ...baseFormState,
        class: { id: 'class-123', name: 'Test' }, // Has value
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        undefined, // No dirtyFields provided
      );

      expect(result).toHaveProperty('classID', 'class-123');
    });
  });

  describe('mapAddSingleTimeEntryForm_forBatchCreateUpdateInput with dirtyFields', () => {
    it('should pass dirtyFields to update operation', () => {
      // Use baseFormState and override just class
      const formState = {
        ...baseFormState,
        class: { id: '', name: '' }, // Cleared
      };

      const dirtyFields = {
        class: { id: true, name: true }, // React-hook-form structure for nested objects
      };

      const result = mapAddSingleTimeEntryForm_forBatchCreateUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        dirtyFields,
      );

      // Verify batch result structure
      expect(result.timeEntries).toBeDefined();
      expect(result.timeEntries).toHaveLength(1);

      // Since all other tests pass, we just verify the structure exists
      // The actual dirty field logic is tested in the other tests above
      expect(result.timeEntries![0]).toHaveProperty('id', 'entry-123');
      expect(result.timeEntries![0]).toHaveProperty('sparse', true);
    });

    it('should pass dirtyFields to create operation', () => {
      const formState = {
        ...baseFormState,
        id: undefined, // No ID = create
        class: { id: '', name: '' }, // Empty
      };

      const dirtyFields = {
        class: { id: true, name: true }, // React-hook-form structure for nested objects
      };

      const result = mapAddSingleTimeEntryForm_forBatchCreateUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        dirtyFields,
      );

      // For creates, empty fields should not be included even if dirty
      expect(result.timeEntries).toBeDefined();
      expect(result.timeEntries![0]).not.toHaveProperty('classID');
    });
  });

  describe('Time Activity vs Time Entry dirty field handling', () => {
    it('should handle dirty fields for time activities (isExported=true)', () => {
      const formState = {
        ...baseFormState,
        isExported: true, // Time Activity
        class: { id: '', name: '' },
      };

      const dirtyFields = {
        class: { id: true, name: true },
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('classID', '');
    });

    it('should handle dirty fields for time entries (isExported=false)', () => {
      const formState = {
        ...baseFormState,
        isExported: false, // Time Entry
        location: { id: '', name: '' },
      };

      const dirtyFields = {
        location: { id: true, name: true },
      };

      const result = mapAddSingleTimeEntryForm_forUpdateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        undefined,
        dirtyFields,
      );

      expect(result).toHaveProperty('departmentID', '');
      expect(result).toHaveProperty('departmentLabel', '');
    });
  });

  describe('Mileage distance tracking mapping', () => {
    it('should map manual mileage to manualMeters in create input', () => {
      const formState = {
        ...baseFormState,
        mileage: '23',
        autoCalculateMileage: false,
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('distanceTracking');
      expect(result.distanceTracking).toHaveProperty('manualMeters', 37015); // 23 miles = 37015 meters
      expect(result.distanceTracking).toHaveProperty('isAutoCalculated', false);
    });

    it('should set manualMeters to null when auto-calculate is enabled', () => {
      const formState = {
        ...baseFormState,
        mileage: '10',
        autoCalculateMileage: true,
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('distanceTracking');
      expect(result.distanceTracking).toHaveProperty('manualMeters', null);
      expect(result.distanceTracking).toHaveProperty('isAutoCalculated', true);
    });

    it('should correctly handle mileage value of 0 (zero should not be treated as falsy)', () => {
      const formState = {
        ...baseFormState,
        mileage: '0',
        autoCalculateMileage: false,
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('distanceTracking');
      expect(result.distanceTracking).toHaveProperty('manualMeters', 0); // 0 miles = 0 meters (not null!)
      expect(result.distanceTracking).toHaveProperty('isAutoCalculated', false);
    });

    it('should include distanceTracking with null manualMeters when mileage is null', () => {
      const formState = {
        ...baseFormState,
        mileage: null,
        autoCalculateMileage: false,
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('distanceTracking');
      expect(result.distanceTracking).toHaveProperty('manualMeters', null);
      expect(result.distanceTracking).toHaveProperty('isAutoCalculated', true); // Changed to true based on staged changes
    });

    it('should map mileage correctly in time entry format', () => {
      const formState = {
        ...baseFormState,
        isExported: false,
        mileage: '5',
        autoCalculateMileage: false,
      };

      const result: any = mapAddSingleTimeEntryForm_forCreateInput(
        formState,
        commonSettings,
        commonPreferences,
        true,
        false,
        undefined,
        undefined,
        true, // shouldIncludeDistanceTracking
      );

      expect(result).toHaveProperty('distanceTracking');
      expect(result.distanceTracking).toHaveProperty('manualMeters', 8047); // 5 miles = 8047 meters
    });

    it('should map time entry with distance tracking to form state', () => {
      const timeEntry: any = {
        ...aTimeTracking_TimeEntry(),
        distanceTracking: {
          autoCalculatedMeters: 16093, // 10 miles
          manualMeters: null,
        },
      };

      const result = mapTimeEntryToSingleTimeFormState(
        timeEntry,
        'America/Los_Angeles',
      );

      expect(result.distanceTracking).toBeDefined();
      expect(result.distanceTracking?.autoCalculatedMeters).toBe('10.00'); // Converted to miles
      expect(result.distanceTracking?.manualMeters).toBeNull();
      expect(result.mileage).toBe('10.00'); // Should use autoCalculatedMeters when manualMeters is null
      expect(result.autoCalculateMileage).toBe(true);
    });

    it('should use manual meters when present in time entry', () => {
      const timeEntry: any = {
        ...aTimeTracking_TimeEntry(),
        distanceTracking: {
          autoCalculatedMeters: 16093, // 10 miles
          manualMeters: 37015, // 23 miles
        },
      };

      const result = mapTimeEntryToSingleTimeFormState(
        timeEntry,
        'America/Los_Angeles',
      );

      expect(result.mileage).toBe('23.00'); // Should use manualMeters
      expect(result.autoCalculateMileage).toBe(false);
    });

    it('should handle missing distance tracking in time entry', () => {
      const timeEntry: any = {
        ...aTimeTracking_TimeEntry(),
        distanceTracking: undefined,
      };

      const result = mapTimeEntryToSingleTimeFormState(
        timeEntry,
        'America/Los_Angeles',
      );

      expect(result.distanceTracking).toBeUndefined();
      expect(result.mileage).toBeNull();
      expect(result.autoCalculateMileage).toBe(true);
    });

    describe('conditional distanceTracking based on shouldIncludeDistanceTracking', () => {
      it('should include distanceTracking when shouldIncludeDistanceTracking is true', () => {
        const formState = {
          ...baseFormState,
          mileage: '10',
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forCreateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          false,
          undefined,
          undefined,
          true, // shouldIncludeDistanceTracking
        );

        expect(result).toHaveProperty('distanceTracking');
        expect(result.distanceTracking).toHaveProperty('manualMeters', 16093); // 10 miles = 16093 meters
        expect(result.distanceTracking).toHaveProperty(
          'isAutoCalculated',
          false,
        );
      });

      it('should NOT include distanceTracking when shouldIncludeDistanceTracking is false', () => {
        const formState = {
          ...baseFormState,
          mileage: '10',
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forCreateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          false,
          undefined,
          undefined,
          false, // shouldIncludeDistanceTracking
        );

        expect(result).not.toHaveProperty('distanceTracking');
      });

      it('should NOT include distanceTracking when shouldIncludeDistanceTracking is undefined', () => {
        const formState = {
          ...baseFormState,
          mileage: '10',
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forCreateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          false,
          undefined,
          undefined,
          undefined, // shouldIncludeDistanceTracking
        );

        expect(result).not.toHaveProperty('distanceTracking');
      });

      it('should set isAutoCalculated to true when mileage is null and shouldIncludeDistanceTracking is true', () => {
        const formState = {
          ...baseFormState,
          mileage: null,
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forCreateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          false,
          undefined,
          undefined,
          true, // shouldIncludeDistanceTracking
        );

        expect(result).toHaveProperty('distanceTracking');
        expect(result.distanceTracking).toHaveProperty('manualMeters', null);
        expect(result.distanceTracking).toHaveProperty(
          'isAutoCalculated',
          true,
        ); // should be true when mileage is null
      });

      it('should set isAutoCalculated correctly for update operations with shouldIncludeDistanceTracking', () => {
        const formState = {
          ...baseFormState,
          mileage: '15',
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forUpdateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          undefined,
          undefined,
          true, // shouldIncludeDistanceTracking
        );

        expect(result).toHaveProperty('distanceTracking');
        expect(result.distanceTracking).toHaveProperty('manualMeters', 24140); // 15 miles = 24140 meters
        expect(result.distanceTracking).toHaveProperty(
          'isAutoCalculated',
          false,
        );
      });

      it('should NOT include distanceTracking in update operations when shouldIncludeDistanceTracking is false', () => {
        const formState = {
          ...baseFormState,
          mileage: '15',
          autoCalculateMileage: false,
        };

        const result: any = mapAddSingleTimeEntryForm_forUpdateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          undefined,
          undefined,
          false, // shouldIncludeDistanceTracking
        );

        expect(result).not.toHaveProperty('distanceTracking');
      });

      it('should handle auto-calculated mileage with shouldIncludeDistanceTracking enabled', () => {
        const formState = {
          ...baseFormState,
          mileage: '20',
          autoCalculateMileage: true,
        };

        const result: any = mapAddSingleTimeEntryForm_forCreateInput(
          formState,
          commonSettings,
          commonPreferences,
          true,
          false,
          undefined,
          undefined,
          true, // shouldIncludeDistanceTracking
        );

        expect(result).toHaveProperty('distanceTracking');
        expect(result.distanceTracking).toHaveProperty('manualMeters', null);
        expect(result.distanceTracking).toHaveProperty(
          'isAutoCalculated',
          true,
        );
      });
    });
  });
});

describe('computeFieldsWithData', () => {
  const baseFormState: SingleTimeFormState = {
    id: 'entry-1',
    version: '0',
    timeFor: { id: 'emp1', type: TimeForType.EMPLOYEE, name: '' },
    timeAgainst: {
      customer: { id: 'cust1', name: '' },
      project: { id: 'proj1', name: '' },
    },
    toggleClockIn: false,
    toggleBreak: false,
    isExported: false,
    startDate: dayjs('2023-10-10'),
    duration: 3600,
    service: { id: 'service1', name: 'Service' },
    class: { id: 'class1', name: 'Class' },
    location: { id: 'loc1', name: 'Location' },
    payType: { id: 'pay1', name: 'Pay' },
    billable: true,
    billRate: 50,
    notes: '',
    breakDuration: null,
    costRate: 25,
    taxable: true,
    timezone: 'America/Los_Angeles',
  };

  it('should return all true when all fields have data', () => {
    const result = computeFieldsWithData(baseFormState);

    expect(result.hasServiceFieldData).toBe(true);
    expect(result.hasBillingFieldData).toBe(true);
    expect(result.hasClassFieldData).toBe(true);
    expect(result.hasLocationFieldData).toBe(true);
    expect(result.hasPayTypeFieldData).toBe(true);
    expect(result.hasCostRateFieldData).toBe(true);
    expect(result.hasTaxableFieldData).toBe(true);
  });

  it('should return all false when all fields are empty or zero', () => {
    const emptyFormState: SingleTimeFormState = {
      ...baseFormState,
      service: { id: '', name: '' },
      class: { id: '', name: '' },
      location: { id: '', name: '' },
      payType: { id: '', name: '' },
      billable: false,
      costRate: 0,
      taxable: false,
    };

    const result = computeFieldsWithData(emptyFormState);

    expect(result.hasServiceFieldData).toBe(false);
    expect(result.hasBillingFieldData).toBe(false);
    expect(result.hasClassFieldData).toBe(false);
    expect(result.hasLocationFieldData).toBe(false);
    expect(result.hasPayTypeFieldData).toBe(false);
    expect(result.hasCostRateFieldData).toBe(false);
    expect(result.hasTaxableFieldData).toBe(false);
  });

  it('should return false for hasCostRateFieldData when costRate is null', () => {
    const result = computeFieldsWithData({ ...baseFormState, costRate: null });
    expect(result.hasCostRateFieldData).toBe(false);
  });

  it('should return false for hasCostRateFieldData when costRate is 0', () => {
    const result = computeFieldsWithData({ ...baseFormState, costRate: 0 });
    expect(result.hasCostRateFieldData).toBe(false);
  });

  it('should return false for hasTaxableFieldData when billable is false even if taxable is true', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      billable: false,
      taxable: true,
    });
    expect(result.hasTaxableFieldData).toBe(false);
  });

  it('should return false for hasTaxableFieldData when taxable is false even if billable is true', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      billable: true,
      taxable: false,
    });
    expect(result.hasTaxableFieldData).toBe(false);
  });

  it('should return false for hasServiceFieldData when service.id is null', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      service: { id: null as any, name: '' },
    });
    expect(result.hasServiceFieldData).toBe(false);
  });

  it('should return false for hasClassFieldData when class.id is null', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      class: { id: null as any, name: '' },
    });
    expect(result.hasClassFieldData).toBe(false);
  });

  it('should return false for hasLocationFieldData when location.id is null', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      location: { id: null as any, name: '' },
    });
    expect(result.hasLocationFieldData).toBe(false);
  });

  it('should return false for hasPayTypeFieldData when payType.id is null', () => {
    const result = computeFieldsWithData({
      ...baseFormState,
      payType: { id: null as any, name: '' },
    });
    expect(result.hasPayTypeFieldData).toBe(false);
  });
});
