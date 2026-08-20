import {
  getThemeFromSandbox,
  formatBreakType,
  formatBreakDuration,
  formatFrequencyDisplay,
  deriveAssignmentTypeFromWorkerType,
  isEqual,
  mapErrorCodeToNls,
} from 'src/js/widgets/breaks/utils';
import {
  Payroll_Break,
  Payroll_DurationUnit,
} from 'src/__generated__/oigql/graphql';
import { TeamMember } from 'src/js/widgets/breaks/types';
import { WORKER_TYPES } from 'src/js/widgets/breaks/constants';

// Mock the sandbox
const mockSandbox = {
  appContext: {
    getAppInfo: () => ({
      appName: 'quickbooks',
    }),
  },
};

const mockIntl = {
  formatMessage: (
    message: { id: string; defaultValue?: string },
    values?: any,
  ) => {
    const messages: Record<string, string> = {
      'breaks.create.type.paid': 'Paid',
      'breaks.create.type.unpaid': 'Unpaid',
      'breaks.create.duration.minute.lowercase': `${
        values?.minute || 0
      } minute`,
      'breaks.create.duration.minutes.lowercase': `${
        values?.minutes || 0
      } minutes`,
      'breaks.create.duration.hour.lowercase': `${values?.hour || 0} hour`,
      'breaks.create.duration.hours.lowercase': `${values?.hours || 0} hours`,
    };
    return messages[message.id] || message.defaultValue || message.id;
  },
};

describe('Break Utils', () => {
  describe('getThemeFromSandbox', () => {
    it('should return quickbooks theme for quickbooks app', () => {
      const result = getThemeFromSandbox(mockSandbox as any);
      expect(result).toBe('quickbooks');
    });

    it('should return quickbooks theme for QB apps', () => {
      const qbSandbox = {
        appContext: {
          getAppInfo: () => ({
            appName: 'QBOnline',
          }),
        },
      };
      const result = getThemeFromSandbox(qbSandbox as any);
      expect(result).toBe('quickbooks');
    });

    it('should return intuit theme for other apps', () => {
      const otherSandbox = {
        appContext: {
          getAppInfo: () => ({
            appName: 'other-app',
          }),
        },
      };
      const result = getThemeFromSandbox(otherSandbox as any);
      expect(result).toBe('intuit');
    });

    it('should return intuit theme when appName is undefined', () => {
      const undefinedSandbox = {
        appContext: {
          getAppInfo: () => ({
            appName: undefined,
          }),
        },
      };
      const result = getThemeFromSandbox(undefinedSandbox as any);
      expect(result).toBe('intuit');
    });
  });

  describe('formatBreakType', () => {
    it('should format paid break type correctly', () => {
      const result = formatBreakType(Payroll_Break.Paid, mockIntl as any);
      expect(result).toBe('Paid');
    });

    it('should format unpaid break type correctly', () => {
      const result = formatBreakType(Payroll_Break.Unpaid, mockIntl as any);
      expect(result).toBe('Unpaid');
    });

    it('should fallback to enum value when NLS key not found', () => {
      const result = formatBreakType(
        'UNKNOWN_BREAK' as Payroll_Break,
        mockIntl as any,
      );
      expect(result).toBe('Unknown_break');
    });
  });

  describe('formatBreakDuration', () => {
    it('should return null for null duration', () => {
      const result = formatBreakDuration(
        null,
        Payroll_DurationUnit.Minutes,
        mockIntl as any,
      );
      expect(result).toBeNull();
    });

    it('should return null for undefined duration', () => {
      const result = formatBreakDuration(
        undefined,
        Payroll_DurationUnit.Minutes,
        mockIntl as any,
      );
      expect(result).toBeNull();
    });

    it('should return null for zero duration', () => {
      const result = formatBreakDuration(
        0,
        Payroll_DurationUnit.Minutes,
        mockIntl as any,
      );
      expect(result).toBeNull();
    });

    it('should format minutes correctly', () => {
      const result = formatBreakDuration(
        30,
        Payroll_DurationUnit.Minutes,
        mockIntl as any,
      );
      expect(result).toBe('30 minutes');
    });

    it('should format single minute correctly', () => {
      const result = formatBreakDuration(
        1,
        Payroll_DurationUnit.Minutes,
        mockIntl as any,
      );
      expect(result).toBe('1 minute');
    });

    it('should format hours correctly', () => {
      const result = formatBreakDuration(
        2,
        Payroll_DurationUnit.Hours,
        mockIntl as any,
      );
      expect(result).toBe('2 hours');
    });

    it('should format single hour correctly', () => {
      const result = formatBreakDuration(
        1,
        Payroll_DurationUnit.Hours,
        mockIntl as any,
      );
      expect(result).toBe('1 hour');
    });

    it('should format hours and minutes correctly', () => {
      const result = formatBreakDuration(
        1.5,
        Payroll_DurationUnit.Hours,
        mockIntl as any,
      );
      expect(result).toBe('1 hour 30 minutes');
    });

    it('should format hours and single minute correctly', () => {
      const result = formatBreakDuration(
        2.25,
        Payroll_DurationUnit.Hours,
        mockIntl as any,
      );
      expect(result).toBe('2 hours 15 minutes');
    });
  });

  describe('formatFrequencyDisplay', () => {
    it('should format frequency with hours and minutes', () => {
      const result = formatFrequencyDisplay('02:30');
      expect(result).toBe('2h 30m');
    });

    it('should format frequency with only hours', () => {
      const result = formatFrequencyDisplay('03:00');
      expect(result).toBe('3h');
    });

    it('should format frequency with only minutes', () => {
      const result = formatFrequencyDisplay('00:45');
      expect(result).toBe('45m');
    });

    it('should return original frequency for invalid format', () => {
      const result = formatFrequencyDisplay('invalid');
      expect(result).toBe('invalid');
    });

    it('should return original frequency for zero duration', () => {
      const result = formatFrequencyDisplay('00:00');
      expect(result).toBe('00:00');
    });
  });

  describe('deriveAssignmentTypeFromWorkerType', () => {
    it('should return Employee for employee worker type', () => {
      const member: TeamMember = {
        id: '1',
        name: 'John Doe',
        workerType: WORKER_TYPES.EMPLOYEE,
      };
      const result = deriveAssignmentTypeFromWorkerType(member);
      expect(result).toBe('EMPLOYEE');
    });

    it('should return Vendor for vendor worker type', () => {
      const member: TeamMember = {
        id: '2',
        name: 'Jane Smith',
        workerType: WORKER_TYPES.VENDOR,
      };
      const result = deriveAssignmentTypeFromWorkerType(member);
      expect(result).toBe('VENDOR');
    });

    it('should return Employee for unknown worker type', () => {
      const member: TeamMember = {
        id: '3',
        name: 'Unknown',
        workerType: 'Unknown',
      };
      const result = deriveAssignmentTypeFromWorkerType(member);
      expect(result).toBe('EMPLOYEE');
    });

    it('should handle case insensitive worker types', () => {
      const member: TeamMember = {
        id: '4',
        name: 'Test',
        workerType: 'employee',
      };
      const result = deriveAssignmentTypeFromWorkerType(member);
      expect(result).toBe('EMPLOYEE');
    });
  });

  describe('isEqual', () => {
    it('should return true for identical values', () => {
      expect(isEqual('test', 'test')).toBe(true);
      expect(isEqual(123, 123)).toBe(true);
      expect(isEqual(true, true)).toBe(true);
    });

    it('should return false for different values', () => {
      expect(isEqual('test', 'other')).toBe(false);
      expect(isEqual(123, 456)).toBe(false);
      expect(isEqual(true, false)).toBe(false);
    });

    it('should treat null and undefined as equal', () => {
      expect(isEqual(null, undefined)).toBe(true);
      expect(isEqual(undefined, null)).toBe(true);
    });

    it('should return true for null and null', () => {
      expect(isEqual(null, null)).toBe(true);
    });

    it('should return true for undefined and undefined', () => {
      expect(isEqual(undefined, undefined)).toBe(true);
    });
  });

  describe('mapErrorCodeToNls', () => {
    it('should return correct NLS key for known error code', () => {
      const result = mapErrorCodeToNls('MANUAL_MODE_NOT_ALLOWED');
      expect(result).toBe('create.break.entry.manual.not.allowed');
    });

    it('should return default NLS key for unknown error code', () => {
      const result = mapErrorCodeToNls('UNKNOWN_ERROR');
      expect(result).toBe('breaks.api.create.save.error.title');
    });
  });
});
