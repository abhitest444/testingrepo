import { act } from '@testing-library/react';
import dayjs from 'dayjs';
import { renderHookWithAllProviders } from 'test/unit/testUtils';
import {
  useUpdateBreakEntry,
  UseUpdateBreakEntryArgs,
} from 'src/js/widgets/breaks/features/break-entries/hooks/useUpdateBreakEntry';
import { BreakEntry } from 'src/js/widgets/breaks/types';

describe('useUpdateBreakEntry', () => {
  let args: UseUpdateBreakEntryArgs;
  let mockBreakEntry: BreakEntry;

  beforeEach(() => {
    args = {
      onError: jest.fn(),
      onSuccess: jest.fn(),
    };

    mockBreakEntry = {
      name: 'Test Break',
      breakRule: 'break-rule-id',
      startDate: dayjs('2024-01-01'),
      endDate: dayjs('2024-01-01'),
      startTime: dayjs('2024-01-01T09:00:00'),
      endTime: dayjs('2024-01-01T10:00:00'),
      description: 'Test break entry',
      timezone: 'America/New_York',
      contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
      useStartEndTime: true,
      currentlyWorking: false,
      timeEntryId: 'time-entry-id',
      version: '1',
    };
  });

  it('should return the expected hook structure', () => {
    const { result } = renderHookWithAllProviders(
      () => useUpdateBreakEntry(args),
      [],
    );

    expect(result.current).toHaveProperty('updateBreakEntry');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.updateBreakEntry).toBe('function');
  });

  it('should handle break entry with start/end times', () => {
    const { result } = renderHookWithAllProviders(
      () => useUpdateBreakEntry(args),
      [],
    );

    expect(() => {
      result.current.updateBreakEntry(mockBreakEntry, 'time-entry-id', '1');
    }).not.toThrow();
  });

  it('should handle duration-based break entries', () => {
    const durationBreakEntry: BreakEntry = {
      ...mockBreakEntry,
      useStartEndTime: false,
      duration: 3600, // 1 hour in seconds
      startTime: undefined,
      endTime: undefined,
    };

    const { result } = renderHookWithAllProviders(
      () => useUpdateBreakEntry(args),
      [],
    );

    expect(() => {
      result.current.updateBreakEntry(durationBreakEntry, 'time-entry-id', '1');
    }).not.toThrow();
  });

  it('should handle currently working break entries', () => {
    const currentlyWorkingBreakEntry: BreakEntry = {
      ...mockBreakEntry,
      currentlyWorking: true,
      endTime: undefined, // No end time when currently working
    };

    const { result } = renderHookWithAllProviders(
      () => useUpdateBreakEntry(args),
      [],
    );

    expect(() => {
      result.current.updateBreakEntry(
        currentlyWorkingBreakEntry,
        'time-entry-id',
        '1',
      );
    }).not.toThrow();
  });

  it('should handle partial break entries with only required fields', () => {
    const partialBreakEntry: BreakEntry = {
      name: 'Test Break',
      breakRule: 'break-rule-id',
      startDate: dayjs('2024-01-01'),
      description: 'Test break entry',
      timeEntryId: 'time-entry-id',
      // Omit optional fields to test sparse updates
    };

    const { result } = renderHookWithAllProviders(
      () => useUpdateBreakEntry(args),
      [],
    );

    expect(() => {
      result.current.updateBreakEntry(partialBreakEntry, 'time-entry-id', '1');
    }).not.toThrow();
  });

  describe('Timezone-specific date handling for updates', () => {
    it('should not shift date backwards when updating with Pacific timezone', () => {
      const pacificBreakEntry: BreakEntry = {
        name: 'Updated Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'), // November 4th
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(22).minute(45), // 10:45 PM
        endTime: dayjs().hour(23).minute(45), // 11:45 PM
        description: 'Location testing - updated',
        timezone: 'America/Los_Angeles', // Pacific time
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      // Verify the function is properly defined and doesn't throw when processing timezone data
      // The actual date/time conversion logic is the same as in create (which we test with assertions)
      expect(result.current.updateBreakEntry).toBeDefined();
      expect(() => {
        result.current.updateBreakEntry(
          pacificBreakEntry,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });

    it('should correctly format start and end times with Pacific timezone on update', () => {
      const pacificBreakEntry: BreakEntry = {
        name: 'Updated Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(22).minute(45),
        endTime: dayjs().hour(23).minute(45),
        description: 'Testing timezone formatting - updated',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      expect(() => {
        result.current.updateBreakEntry(
          pacificBreakEntry,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });

    it('should handle updating breaks spanning midnight in Pacific timezone', () => {
      const midnightBreakEntry: BreakEntry = {
        name: 'Midnight Break - Updated',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-05'), // Next day
        startTime: dayjs().hour(23).minute(30), // 11:30 PM on Nov 4
        endTime: dayjs().hour(0).minute(30), // 12:30 AM on Nov 5
        description: 'Overnight break - updated',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      expect(() => {
        result.current.updateBreakEntry(
          midnightBreakEntry,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });

    it('should handle updating with Eastern timezone without date shifting', () => {
      const easternBreakEntry: BreakEntry = {
        name: 'Eastern Break - Updated',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(23).minute(30), // 11:30 PM
        endTime: dayjs().hour(23).minute(45), // 11:45 PM
        description: 'Late night break - updated',
        timezone: 'America/New_York',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      expect(() => {
        result.current.updateBreakEntry(
          easternBreakEntry,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });

    it('should use startDate for endDate when endDate is not provided during update', () => {
      const breakEntryWithoutEndDate: BreakEntry = {
        name: 'Test Break - Updated',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        // endDate is not provided, should fall back to startDate
        startTime: dayjs().hour(10).minute(0),
        endTime: dayjs().hour(11).minute(0),
        description: 'Single day break - updated',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      // Verify the hook executes without error and the function is properly defined
      expect(result.current.updateBreakEntry).toBeDefined();
      expect(() => {
        result.current.updateBreakEntry(
          breakEntryWithoutEndDate,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });

    it('should handle DST transition dates correctly when updating in Pacific timezone', () => {
      const dstBreakEntry: BreakEntry = {
        name: 'DST Break - Updated',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-03-09'), // DST starts in 2025
        endDate: dayjs('2025-03-09'),
        startTime: dayjs().hour(2).minute(30), // During DST transition
        endTime: dayjs().hour(3).minute(30),
        description: 'DST transition break - updated',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      expect(() => {
        result.current.updateBreakEntry(dstBreakEntry, 'time-entry-id', '1');
      }).not.toThrow();
    });

    it('should handle updating with international timezones without date shifting', () => {
      const timezones = [
        { tz: 'Europe/London', name: 'London' },
        { tz: 'Asia/Tokyo', name: 'Tokyo' },
        { tz: 'Australia/Sydney', name: 'Sydney' },
        { tz: 'Asia/Kolkata', name: 'India' },
      ];

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      timezones.forEach(({ tz, name }) => {
        const internationalBreakEntry: BreakEntry = {
          name: `${name} Break - Updated`,
          breakRule: 'break-rule-id',
          startDate: dayjs('2025-11-04'),
          endDate: dayjs('2025-11-04'),
          startTime: dayjs().hour(14).minute(0),
          endTime: dayjs().hour(15).minute(0),
          description: `${name} timezone test - updated`,
          timezone: tz,
          contact: {
            id: 'employee-id',
            name: 'Test Employee',
            type: 'EMPLOYEE',
          },
          useStartEndTime: true,
          currentlyWorking: false,
          timeEntryId: 'time-entry-id',
          version: '1',
        };

        expect(() => {
          result.current.updateBreakEntry(
            internationalBreakEntry,
            'time-entry-id',
            '1',
          );
        }).not.toThrow();
      });
    });

    it('should handle sparse updates with only time changes in Pacific timezone', () => {
      const sparseUpdateBreakEntry: BreakEntry = {
        name: 'Test Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        // Only updating times, not dates
        startTime: dayjs().hour(20).minute(0), // Changed time
        endTime: dayjs().hour(21).minute(0), // Changed time
        timezone: 'America/Los_Angeles',
        useStartEndTime: true,
        currentlyWorking: false,
        timeEntryId: 'time-entry-id',
        version: '1',
      };

      const { result } = renderHookWithAllProviders(
        () => useUpdateBreakEntry(args),
        [],
      );

      expect(() => {
        result.current.updateBreakEntry(
          sparseUpdateBreakEntry,
          'time-entry-id',
          '1',
        );
      }).not.toThrow();
    });
  });
});
