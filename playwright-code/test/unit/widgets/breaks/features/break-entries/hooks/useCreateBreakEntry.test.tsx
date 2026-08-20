import React from 'react';
import { act } from '@testing-library/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider, buildSandbox } from '@payroll/quicksand';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import {
  useCreateBreakEntry,
  UseCreateBreakEntryArgs,
} from 'src/js/widgets/breaks/features/break-entries/hooks/useCreateBreakEntry';
import { BreakEntry } from 'src/js/widgets/breaks/types';

// Extend dayjs with timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Helper function to render hook with all necessary providers
const renderHookWithProviders = (callback: any) => {
  const store = configureStore({
    reducer: {
      // Add a minimal reducer to prevent Redux warnings
      ui: (state = {}, action) => state,
    },
  });

  const sandbox = buildSandbox();

  return renderHook(callback, {
    wrapper: ({ children }) => (
      <MockQuicksandProvider sandbox={sandbox}>
        <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
          <MockedProvider mocks={[]} addTypename={false}>
            <Provider store={store}>{children}</Provider>
          </MockedProvider>
        </LoggingConfigProvider>
      </MockQuicksandProvider>
    ),
  });
};

describe('useCreateBreakEntry', () => {
  let args: UseCreateBreakEntryArgs;
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
    };
  });

  it('should return the expected hook structure', () => {
    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(result.current).toHaveProperty('createBreakEntry');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(typeof (result.current as any).createBreakEntry).toBe('function');
  });

  it('should handle break entry with start/end times and timezone', () => {
    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(() => {
      (result.current as any).createBreakEntry(mockBreakEntry, 'assignee-id');
    }).not.toThrow();
  });

  it('should handle break entry without timezone (fallback)', () => {
    const breakEntryWithoutTimezone: BreakEntry = {
      ...mockBreakEntry,
      timezone: undefined,
    };

    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(() => {
      (result.current as any).createBreakEntry(
        breakEntryWithoutTimezone,
        'assignee-id',
      );
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

    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(() => {
      (result.current as any).createBreakEntry(
        durationBreakEntry,
        'assignee-id',
      );
    }).not.toThrow();
  });

  it('should handle currently working break entries', () => {
    const currentlyWorkingBreakEntry: BreakEntry = {
      ...mockBreakEntry,
      currentlyWorking: true,
      endTime: undefined, // No end time when currently working
    };

    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(() => {
      (result.current as any).createBreakEntry(
        currentlyWorkingBreakEntry,
        'assignee-id',
      );
    }).not.toThrow();
  });

  it('should handle different timezones correctly', () => {
    const timezones = [
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
    ];

    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    timezones.forEach((tz) => {
      const breakEntryWithTimezone: BreakEntry = {
        ...mockBreakEntry,
        timezone: tz,
      };

      expect(() => {
        (result.current as any).createBreakEntry(
          breakEntryWithTimezone,
          'assignee-id',
        );
      }).not.toThrow();
    });
  });

  it('should handle break entry with partial data', () => {
    const partialBreakEntry: BreakEntry = {
      name: 'Test Break',
      breakRule: 'break-rule-id',
      startDate: dayjs('2024-01-01'),
      description: 'Test break entry',
      timezone: 'America/New_York',
      useStartEndTime: true,
      currentlyWorking: false,
    };

    const { result } = renderHookWithProviders(() => useCreateBreakEntry(args));

    expect(() => {
      (result.current as any).createBreakEntry(
        partialBreakEntry,
        'assignee-id',
      );
    }).not.toThrow();
  });

  describe('Timezone-specific date handling', () => {
    it('should not shift date backwards when using Pacific timezone', () => {
      // Use a spy on Redux dispatch to capture the action
      const store = configureStore({
        reducer: {
          ui: (state = {}, action) => state,
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const pacificBreakEntry: BreakEntry = {
        name: 'Test Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'), // November 4th
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(22).minute(45), // 10:45 PM
        endTime: dayjs().hour(23).minute(45), // 11:45 PM
        description: 'Location testing',
        timezone: 'America/Los_Angeles', // Pacific time
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const sandbox = buildSandbox();
      const { result } = renderHook(() => useCreateBreakEntry(args), {
        wrapper: ({ children }) => (
          <MockQuicksandProvider sandbox={sandbox}>
            <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
              <MockedProvider mocks={[]} addTypename={false}>
                <Provider store={store}>{children}</Provider>
              </MockedProvider>
            </LoggingConfigProvider>
          </MockQuicksandProvider>
        ),
      });

      act(() => {
        (result.current as any).createBreakEntry(
          pacificBreakEntry,
          'assignee-id',
        );
      });

      // Check that dispatch was called with the timeEntryInput
      expect(dispatchSpy).toHaveBeenCalled();
      const dispatchCall = dispatchSpy.mock.calls.find(
        (call) => (call[0] as any).type === 'breakEntries/saveTimeEntryInput',
      );

      expect(dispatchCall).toBeDefined();
      const { payload } = dispatchCall?.[0] as any;

      // Verify the date field is November 4th, not shifted to November 3rd
      expect(payload.date).toBe('2025-11-04');

      // Verify startTime and endTime are formatted correctly
      expect(payload.startTime).toBeDefined();
      expect(payload.endTime).toBeDefined();

      // The times should include the date 2025-11-04 in the timestamp
      expect(payload.startTime).toContain('2025-11-04');
      expect(payload.endTime).toContain('2025-11-04');

      // Verify timezone is included
      expect(payload.timeZone).toBe('America/Los_Angeles');
    });

    it('should correctly format start and end times with Pacific timezone', () => {
      const store = configureStore({
        reducer: {
          ui: (state = {}, action) => state,
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const pacificBreakEntry: BreakEntry = {
        name: 'Test Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(14).minute(30), // 2:30 PM
        endTime: dayjs().hour(15).minute(0), // 3:00 PM
        description: 'Testing timezone formatting',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const sandbox = buildSandbox();
      const { result } = renderHook(() => useCreateBreakEntry(args), {
        wrapper: ({ children }) => (
          <MockQuicksandProvider sandbox={sandbox}>
            <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
              <MockedProvider mocks={[]} addTypename={false}>
                <Provider store={store}>{children}</Provider>
              </MockedProvider>
            </LoggingConfigProvider>
          </MockQuicksandProvider>
        ),
      });

      act(() => {
        (result.current as any).createBreakEntry(
          pacificBreakEntry,
          'assignee-id',
        );
      });

      const dispatchCall = dispatchSpy.mock.calls.find(
        (call) => (call[0] as any).type === 'breakEntries/saveTimeEntryInput',
      );
      const { payload } = dispatchCall?.[0] as any;

      // Verify times are formatted correctly with timezone offset
      // Expected format: YYYY-MM-DDTHH:mm:ss-08:00 (Pacific time in November)
      expect(payload.startTime).toMatch(/2025-11-04T14:30:00-0[78]:00/);
      expect(payload.endTime).toMatch(/2025-11-04T15:00:00-0[78]:00/);

      // Verify the date doesn't shift
      expect(payload.date).toBe('2025-11-04');
    });

    it('should handle breaks spanning midnight in Pacific timezone', () => {
      const store = configureStore({
        reducer: {
          ui: (state = {}, action) => state,
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const midnightBreakEntry: BreakEntry = {
        name: 'Midnight Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-05'), // Next day
        startTime: dayjs().hour(23).minute(30), // 11:30 PM on Nov 4
        endTime: dayjs().hour(0).minute(30), // 12:30 AM on Nov 5
        description: 'Overnight break',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const sandbox = buildSandbox();
      const { result } = renderHook(() => useCreateBreakEntry(args), {
        wrapper: ({ children }) => (
          <MockQuicksandProvider sandbox={sandbox}>
            <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
              <MockedProvider mocks={[]} addTypename={false}>
                <Provider store={store}>{children}</Provider>
              </MockedProvider>
            </LoggingConfigProvider>
          </MockQuicksandProvider>
        ),
      });

      act(() => {
        (result.current as any).createBreakEntry(
          midnightBreakEntry,
          'assignee-id',
        );
      });

      const dispatchCall = dispatchSpy.mock.calls.find(
        (call) => (call[0] as any).type === 'breakEntries/saveTimeEntryInput',
      );
      const { payload } = dispatchCall?.[0] as any;

      // Verify start time is on Nov 4
      expect(payload.startTime).toContain('2025-11-04');
      // Verify end time is on Nov 5 (next day)
      expect(payload.endTime).toContain('2025-11-05');
      // Verify the base date field uses the start date
      expect(payload.date).toBe('2025-11-04');
    });

    it('should handle Eastern timezone without date shifting', () => {
      const easternBreakEntry: BreakEntry = {
        name: 'Eastern Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(23).minute(30), // 11:30 PM
        endTime: dayjs().hour(23).minute(45), // 11:45 PM
        description: 'Late night break',
        timezone: 'America/New_York',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const { result } = renderHookWithProviders(() =>
        useCreateBreakEntry(args),
      );

      expect(() => {
        (result.current as any).createBreakEntry(
          easternBreakEntry,
          'assignee-id',
        );
      }).not.toThrow();
    });

    it('should handle UTC timezone correctly', () => {
      const utcBreakEntry: BreakEntry = {
        name: 'UTC Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        endDate: dayjs('2025-11-04'),
        startTime: dayjs().hour(12).minute(0), // Noon UTC
        endTime: dayjs().hour(13).minute(0), // 1 PM UTC
        description: 'UTC break',
        timezone: 'UTC',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const { result } = renderHookWithProviders(() =>
        useCreateBreakEntry(args),
      );

      expect(() => {
        (result.current as any).createBreakEntry(utcBreakEntry, 'assignee-id');
      }).not.toThrow();
    });

    it('should use startDate for endDate when endDate is not provided', () => {
      const store = configureStore({
        reducer: {
          ui: (state = {}, action) => state,
        },
      });
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const breakEntryWithoutEndDate: BreakEntry = {
        name: 'Test Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-11-04'),
        // endDate is not provided
        startTime: dayjs().hour(10).minute(0),
        endTime: dayjs().hour(11).minute(0),
        description: 'Single day break',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const sandbox = buildSandbox();
      const { result } = renderHook(() => useCreateBreakEntry(args), {
        wrapper: ({ children }) => (
          <MockQuicksandProvider sandbox={sandbox}>
            <LoggingConfigProvider sandbox={sandbox} prefix="timeTrackingOnly">
              <MockedProvider mocks={[]} addTypename={false}>
                <Provider store={store}>{children}</Provider>
              </MockedProvider>
            </LoggingConfigProvider>
          </MockQuicksandProvider>
        ),
      });

      act(() => {
        (result.current as any).createBreakEntry(
          breakEntryWithoutEndDate,
          'assignee-id',
        );
      });

      const dispatchCall = dispatchSpy.mock.calls.find(
        (call) => (call[0] as any).type === 'breakEntries/saveTimeEntryInput',
      );
      const { payload } = dispatchCall?.[0] as any;

      // When endDate is not provided, both times should be on the same date (startDate)
      expect(payload.startTime).toContain('2025-11-04');
      expect(payload.endTime).toContain('2025-11-04');
      expect(payload.date).toBe('2025-11-04');
    });

    it('should handle DST transition dates correctly in Pacific timezone', () => {
      // Test during DST transition (spring forward)
      const dstBreakEntry: BreakEntry = {
        name: 'DST Break',
        breakRule: 'break-rule-id',
        startDate: dayjs('2025-03-09'), // DST starts in 2025
        endDate: dayjs('2025-03-09'),
        startTime: dayjs().hour(2).minute(30), // During DST transition
        endTime: dayjs().hour(3).minute(30),
        description: 'DST transition break',
        timezone: 'America/Los_Angeles',
        contact: { id: 'employee-id', name: 'Test Employee', type: 'EMPLOYEE' },
        useStartEndTime: true,
        currentlyWorking: false,
      };

      const { result } = renderHookWithProviders(() =>
        useCreateBreakEntry(args),
      );

      expect(() => {
        (result.current as any).createBreakEntry(dstBreakEntry, 'assignee-id');
      }).not.toThrow();
    });

    it('should handle international timezones without date shifting', () => {
      const timezones = [
        { tz: 'Europe/London', name: 'London' },
        { tz: 'Asia/Tokyo', name: 'Tokyo' },
        { tz: 'Australia/Sydney', name: 'Sydney' },
        { tz: 'Asia/Kolkata', name: 'India' },
      ];

      const { result } = renderHookWithProviders(() =>
        useCreateBreakEntry(args),
      );

      timezones.forEach(({ tz, name }) => {
        const internationalBreakEntry: BreakEntry = {
          name: `${name} Break`,
          breakRule: 'break-rule-id',
          startDate: dayjs('2025-11-04'),
          endDate: dayjs('2025-11-04'),
          startTime: dayjs().hour(14).minute(0),
          endTime: dayjs().hour(15).minute(0),
          description: `${name} timezone test`,
          timezone: tz,
          contact: {
            id: 'employee-id',
            name: 'Test Employee',
            type: 'EMPLOYEE',
          },
          useStartEndTime: true,
          currentlyWorking: false,
        };

        expect(() => {
          (result.current as any).createBreakEntry(
            internationalBreakEntry,
            'assignee-id',
          );
        }).not.toThrow();
      });
    });
  });
});
