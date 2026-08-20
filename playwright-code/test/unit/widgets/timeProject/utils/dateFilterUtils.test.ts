import moment from 'moment';
import {
  DueDateFilterType,
  getFilterDateRange,
  getCustomDateRange,
  isInvalidDateRange,
  isDefaultDueDateRangeForUser,
  DUE_DATE_FILTER_OPTIONS,
  DATE_RANGE_MONTHS_LIMIT,
} from 'src/js/widgets/timeProject/utils/dateFilterUtils';

describe('dateFilterUtils', () => {
  const today = moment().format('YYYY-MM-DD');

  describe('getFilterDateRange', () => {
    it('returns today for TODAY', () => {
      const result = getFilterDateRange(DueDateFilterType.TODAY);
      expect(result.filterType).toBe(DueDateFilterType.TODAY);
      expect(result.fromDate).toBe(today);
      expect(result.toDate).toBe(today);
    });

    it('returns yesterday for YESTERDAY', () => {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.YESTERDAY);
      expect(result.filterType).toBe(DueDateFilterType.YESTERDAY);
      expect(result.fromDate).toBe(yesterday);
      expect(result.toDate).toBe(yesterday);
    });

    it('returns start and end of current week for THIS_WEEK', () => {
      const start = moment().startOf('week').format('YYYY-MM-DD');
      const end = moment().endOf('week').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.THIS_WEEK);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns start and end of current month for THIS_MONTH', () => {
      const start = moment().startOf('month').format('YYYY-MM-DD');
      const end = moment().endOf('month').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.THIS_MONTH);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns start and end of current year for THIS_YEAR', () => {
      const start = moment().startOf('year').format('YYYY-MM-DD');
      const end = moment().endOf('year').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.THIS_YEAR);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns start and end of next week for NEXT_WEEK', () => {
      const start = moment().add(7, 'day').startOf('week').format('YYYY-MM-DD');
      const end = moment().add(7, 'day').endOf('week').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.NEXT_WEEK);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns today to today+30 for NEXT_THIRTY_DAYS', () => {
      const endDate = moment().add(30, 'day').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.NEXT_THIRTY_DAYS);
      expect(result.fromDate).toBe(today);
      expect(result.toDate).toBe(endDate);
    });

    it('returns start and end of next month for NEXT_MONTH', () => {
      const start = moment()
        .add(1, 'month')
        .startOf('month')
        .format('YYYY-MM-DD');
      const end = moment().add(1, 'month').endOf('month').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.NEXT_MONTH);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns start and end of last week for LAST_WEEK', () => {
      const start = moment()
        .subtract(7, 'day')
        .startOf('week')
        .format('YYYY-MM-DD');
      const end = moment()
        .subtract(7, 'day')
        .endOf('week')
        .format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.LAST_WEEK);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns today-30 to today for LAST_THIRTY_DAYS', () => {
      const startDate = moment().subtract(30, 'day').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.LAST_THIRTY_DAYS);
      expect(result.fromDate).toBe(startDate);
      expect(result.toDate).toBe(today);
    });

    it('returns start and end of last month for LAST_MONTH', () => {
      const start = moment()
        .subtract(1, 'month')
        .startOf('month')
        .format('YYYY-MM-DD');
      const end = moment()
        .subtract(1, 'month')
        .endOf('month')
        .format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.LAST_MONTH);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('returns -3 months to +9 months for CUSTOM_RANGE default', () => {
      const start = moment().subtract(3, 'month').format('YYYY-MM-DD');
      const end = moment().add(9, 'month').format('YYYY-MM-DD');
      const result = getFilterDateRange(DueDateFilterType.CUSTOM_RANGE);
      expect(result.fromDate).toBe(start);
      expect(result.toDate).toBe(end);
    });

    it('always returns filterType matching the input', () => {
      Object.values(DueDateFilterType).forEach((type) => {
        const result = getFilterDateRange(type);
        expect(result.filterType).toBe(type);
      });
    });
  });

  describe('getCustomDateRange', () => {
    it('returns CUSTOM_RANGE filterType with provided dates', () => {
      const result = getCustomDateRange('2026-01-01', '2026-06-30');
      expect(result.filterType).toBe(DueDateFilterType.CUSTOM_RANGE);
      expect(result.fromDate).toBe('2026-01-01');
      expect(result.toDate).toBe('2026-06-30');
    });
  });

  describe('isInvalidDateRange', () => {
    it('returns true when both dates are undefined', () => {
      expect(isInvalidDateRange()).toBe(true);
    });

    it('returns true when fromDate is missing', () => {
      expect(isInvalidDateRange(undefined, '2026-06-01')).toBe(true);
    });

    it('returns true when toDate is missing', () => {
      expect(isInvalidDateRange('2026-01-01', undefined)).toBe(true);
    });

    it('returns true when fromDate is after toDate', () => {
      expect(isInvalidDateRange('2026-06-01', '2026-01-01')).toBe(true);
    });

    it('returns true when dates are in invalid format', () => {
      expect(isInvalidDateRange('not-a-date', '2026-06-01')).toBe(true);
    });

    it('returns false for valid date range', () => {
      expect(isInvalidDateRange('2026-01-01', '2026-06-30')).toBe(false);
    });

    it('returns false when fromDate equals toDate (same-day range)', () => {
      expect(isInvalidDateRange('2026-06-01', '2026-06-01')).toBe(false);
    });
  });

  describe('DUE_DATE_FILTER_OPTIONS', () => {
    it('contains exactly 12 options (no All Dates — only presets)', () => {
      expect(DUE_DATE_FILTER_OPTIONS).toHaveLength(12);
    });

    it('starts with CUSTOM_RANGE', () => {
      expect(DUE_DATE_FILTER_OPTIONS[0].value).toBe(
        DueDateFilterType.CUSTOM_RANGE,
      );
    });

    it('includes all DueDateFilterType values', () => {
      const values = DUE_DATE_FILTER_OPTIONS.map((o) => o.value);
      Object.values(DueDateFilterType).forEach((type) => {
        expect(values).toContain(type);
      });
    });

    it('each option has a non-empty nlsKey', () => {
      DUE_DATE_FILTER_OPTIONS.forEach((opt) => {
        expect(opt.nlsKey).toBeTruthy();
        expect(opt.nlsKey.startsWith('timeProject.filter.dueDate.')).toBe(true);
      });
    });
  });

  describe('isDefaultDueDateRangeForUser', () => {
    const customRange = getFilterDateRange(DueDateFilterType.CUSTOM_RANGE);
    const todayRange = getFilterDateRange(DueDateFilterType.TODAY);

    describe('non-Workflow path (isWorkflowApiEnabled=false)', () => {
      it('returns true when dueDateRange is null', () => {
        expect(isDefaultDueDateRangeForUser(null, false, false)).toBe(true);
      });

      it('returns true when dueDateRange is undefined', () => {
        expect(isDefaultDueDateRangeForUser(undefined, false, false)).toBe(
          true,
        );
      });

      it('returns false when any non-null range is provided', () => {
        expect(isDefaultDueDateRangeForUser(customRange, false, false)).toBe(
          false,
        );
      });
    });

    describe('Workflow path, non-accountant (isWorkflowApiEnabled=true, isAccountant=false)', () => {
      it('returns true when dueDateRange is null', () => {
        expect(isDefaultDueDateRangeForUser(null, true, false)).toBe(true);
      });

      it('returns false for any non-null range, including CUSTOM_RANGE', () => {
        expect(isDefaultDueDateRangeForUser(customRange, true, false)).toBe(
          false,
        );
        expect(isDefaultDueDateRangeForUser(todayRange, true, false)).toBe(
          false,
        );
      });
    });

    describe('QBOA accountant on Workflow path (isWorkflowApiEnabled=true, isAccountant=true)', () => {
      it('returns true when dueDateRange is null', () => {
        expect(isDefaultDueDateRangeForUser(null, true, true)).toBe(true);
      });

      it('returns true when filterType is CUSTOM_RANGE (the accountant baseline)', () => {
        expect(isDefaultDueDateRangeForUser(customRange, true, true)).toBe(
          true,
        );
      });

      it('returns true for a user-picked custom date range with CUSTOM_RANGE filterType', () => {
        const userPicked = getCustomDateRange('2025-01-01', '2025-06-30');
        expect(isDefaultDueDateRangeForUser(userPicked, true, true)).toBe(true);
      });

      it.each([
        DueDateFilterType.TODAY,
        DueDateFilterType.YESTERDAY,
        DueDateFilterType.THIS_WEEK,
        DueDateFilterType.THIS_MONTH,
        DueDateFilterType.THIS_YEAR,
        DueDateFilterType.NEXT_WEEK,
        DueDateFilterType.NEXT_THIRTY_DAYS,
        DueDateFilterType.NEXT_MONTH,
        DueDateFilterType.LAST_WEEK,
        DueDateFilterType.LAST_THIRTY_DAYS,
        DueDateFilterType.LAST_MONTH,
      ])('returns false for preset filterType %s', (filterType) => {
        expect(
          isDefaultDueDateRangeForUser(
            getFilterDateRange(filterType),
            true,
            true,
          ),
        ).toBe(false);
      });
    });
  });

  describe('DATE_RANGE_MONTHS_LIMIT', () => {
    it('is 36', () => {
      expect(DATE_RANGE_MONTHS_LIMIT).toBe(36);
    });
  });
});
