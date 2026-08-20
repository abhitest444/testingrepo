import { renderHook, act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  Common_DayOfWeek,
  TimeTracking_NotificationReminderMedium,
  TimeTracking_LocationTrackingType,
} from 'src/__generated__/timeTracking/graphql';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { mapError } from 'src/js/service/utils/mapError';
import {
  mapNumberToDaysOfWeekValue,
  useSetQLSettings,
  UseUpdateQLSettingsArgs,
  SetQLSettingsArgs,
} from '../../../../../src/js/service/hooks/settings/useSetQLSettings';

// Mock the CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({
    traceId: 'mock-trace-id',
  })),
  TimeCustomerInteraction: {
    EMPLOYER_SETTINGS_SAVE: 'employer-settings-save',
  },
}));

// Mock the error mapping utilities
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  mapTimeTrackingMutationError: jest.fn(),
}));

// Mock the sandbox and intl
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    featureFlags: {
      isFeatureEnabled: jest.fn(),
    },
  }),
  useIntl: () => ({
    formatMessage: jest.fn().mockReturnValue('Mocked message'),
  }),
}));

// Mock the mutation hook
const mockMutationFn = jest.fn();
let mockOnCompleted: any = null;
let mockOnError: any = null;

jest.mock('src/__generated__/timeTracking/graphql', () => ({
  Common_DayOfWeek: {
    Sunday: 'SUNDAY',
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
  },
  TimeTracking_NotificationReminderMedium: {
    Email: 'EMAIL',
    PushNotification: 'PUSH_NOTIFICATION',
  },
  TimeTracking_LocationTrackingType: {
    Optional: 'OPTIONAL',
    Required: 'REQUIRED',
    None: 'NONE',
  },
  useTimeTrackingUpdateEmployerSettingsMutation: (callbacks: any) => {
    mockOnCompleted = callbacks?.onCompleted;
    mockOnError = callbacks?.onError;
    return [mockMutationFn];
  },
}));

describe('useSetQLSettings', () => {
  let args: UseUpdateQLSettingsArgs;
  const mockSettings: SetQLSettingsArgs = {
    timeTrackingBillingEnabled: {
      version: '1',
      value: true,
    },
    timeTrackingStartWorkWeek: {
      version: '1',
      value: 1,
    },
    dateTimeSettings: {
      timeZone: {
        version: '1',
        value: 'America/Los_Angeles',
      },
      clockFormat: {
        version: '1',
        value: 12,
      },
    },
    timesheetManagementSettings: {
      notes: {
        enabled: {
          version: '1',
          value: true,
        },
      },
    },
    clockRoundingSettings: {
      startTimeRounding: {
        direction: {
          version: '1',
          value: 'UP',
        },
        roundInMin: {
          version: '1',
          value: 15,
        },
      },
    },
    notificationSettings: {
      startShiftNotifications: {
        reminderTime: {
          version: '1',
          value: '30',
        },
        notificationMedium: {
          version: '1',
          value: [TimeTracking_NotificationReminderMedium.Email],
        },
      },
    },
  };

  beforeEach(() => {
    args = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };
    mockOnCompleted = null;
    mockOnError = null;
    jest.clearAllMocks();
    (mapError as jest.Mock).mockReturnValue('Mocked error message');
  });

  // TODO: Temporarily disabled, reenable once version mismatch issue for employer settings is resolved
  it.skip('should handle successful mutation with all fields', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({
        timeTrackingBillingEnabled: { version: '1.0', value: true },
        timeTrackingUseItemForTimeEnabled: { version: '1.0', value: false },
        timeTrackingBillingRateForTimeEnabled: { version: '1.0', value: true },
        timeTrackingStartWorkWeek: { version: '1.0', value: 1 },
        coreSettings: {
          requireBillable: { version: '1.0', value: true },
        },
        dateTimeSettings: {
          timeZone: { version: '1.0', value: 'America/New_York' },
          clockFormat: { version: '1.0', value: 12 },
        },
        timesheetManagementSettings: {
          notes: {
            enabled: { version: '1.0', value: true },
            editEnabled: { version: '1.0', value: false },
            requiredEnabled: { version: '1.0', value: true },
          },
          timesheet: {
            manageOwnTimesheetEnabled: { version: '1.0', value: true },
            editClockOutTimeEnabled: { version: '1.0', value: false },
            clockOutOverrideHours: { version: '1.0', value: 24 },
            splitAtMidnightEnabled: { version: '1.0', value: true },
            locationTracking: {
              version: '1.0',
              value: TimeTracking_LocationTrackingType.Optional,
            },
            mileageTrackingEnabled: { version: '1.0', value: true },
          },
          customFields: {
            customersEnabled: { version: '1.0', value: true },
            classEnabled: { version: '1.0', value: false },
            locationEnabled: { version: '1.0', value: true },
          },
        },
        geofenceSettings: {
          geofenceEnabled: { version: '1.0', value: true },
          geofenceReminderSettings: {
            startTime: { version: '1.0', value: '08:00' },
            endTime: { version: '1.0', value: '18:00' },
            daysOfWeek: {
              version: '1.0',
              value: [
                Common_DayOfWeek.Monday,
                Common_DayOfWeek.Tuesday,
                Common_DayOfWeek.Wednesday,
                Common_DayOfWeek.Thursday,
                Common_DayOfWeek.Friday,
              ],
            },
          },
        },
        clockRoundingSettings: {
          startTimeRounding: {
            direction: { version: '1.0', value: 'UP' },
            roundInMin: { version: '1.0', value: 15 },
          },
          endTimeRounding: {
            direction: { version: '1.0', value: 'DOWN' },
            roundInMin: { version: '1.0', value: 15 },
          },
        },
        notificationSettings: {
          startShiftNotifications: {
            reminderTime: { version: '1.0', value: '09:00' },
            notificationMedium: {
              version: '1.0',
              value: [TimeTracking_NotificationReminderMedium.Email],
            },
          },
          endShiftNotifications: {
            reminderTime: { version: '1.0', value: '17:00' },
            notificationMedium: {
              version: '1.0',
              value: [TimeTracking_NotificationReminderMedium.PushNotification],
            },
          },
          notificationEnabledForDays: {
            version: '1.0',
            value: [Common_DayOfWeek.Monday, Common_DayOfWeek.Friday],
          },
          clockOutOverrideNotifications: {
            adminEnabled: { version: '1.0', value: true },
            groupManagerEnabled: { version: '1.0', value: false },
          },
          timesheetEditNotifications: {
            adminEnabled: { version: '1.0', value: true },
            groupManagerEnabled: { version: '1.0', value: true },
          },
        },
      });
    });

    // Trigger the onCompleted callback
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalled();
    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
    );
    expect(endInteractionWithSuccess).toHaveBeenCalled();
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });

  // TODO: Temporarily disabled, reenable once version mismatch issue for employer settings is resolved
  it.skip('should create the customer interaction and attach propagation headers before calling the mutation', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    await act(async () => {
      await updateSettings(mockSettings);
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
    );
    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      expect.anything(),
      TimeCustomerInteraction.EMPLOYER_SETTINGS_SAVE,
    );
    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: { traceId: 'mock-trace-id' },
        }),
      }),
    );
  });

  it('should handle error when mutation fails with Apollo Error', async () => {
    const error = new ApolloError({ errorMessage: 'Mutation failed' });
    mockMutationFn.mockRejectedValue(error);

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    // Trigger the onError callback
    act(() => {
      if (mockOnError) {
        mockOnError(error);
      }
    });

    await updatePromise;

    expect(endInteractionWithFailure).toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Mocked error message');
    expect(args.onSuccess).not.toHaveBeenCalled();
  });

  it('should manage loading state correctly', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    expect(result.current[1].loading).toBe(false);

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    await updatePromise;
    expect(result.current[1].loading).toBe(false);
  });

  it('should handle null response', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    // Trigger onCompleted with null response
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: null,
        });
      }
    });

    await updatePromise;

    expect(endInteractionWithFailure).toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Mocked error message');
    expect(args.onSuccess).not.toHaveBeenCalled();
  });

  it('should handle error response type', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    // Trigger onCompleted with error response
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsError',
            errorCode: 'SOME_ERROR',
          },
        });
      }
    });

    await updatePromise;

    expect(endInteractionWithFailure).toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith('Mocked error message');
    expect(args.onSuccess).not.toHaveBeenCalled();
  });

  it('should handle payload without employerSettings', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    // Trigger onCompleted with payload but no employerSettings
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: null,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalled();
    expect(args.onSuccess).not.toHaveBeenCalled();
  });

  it('should not call onError when mapError returns null', async () => {
    (mapError as jest.Mock).mockReturnValue(null);
    mockMutationFn.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings(mockSettings);
    });

    // Trigger onError
    act(() => {
      if (mockOnError) {
        mockOnError(new Error('Test error'));
      }
    });

    await updatePromise;

    expect(endInteractionWithFailure).toHaveBeenCalled();
    expect(args.onError).not.toHaveBeenCalled();
  });

  it('should map timeTrackingStartWorkWeek value correctly for different days', async () => {
    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    await act(async () => {
      await updateSettings({
        timeTrackingStartWorkWeek: {
          version: '1.0',
          value: 3, // Wednesday
        },
      });
    });

    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            timeTrackingStartWorkWeek: {
              version: '1.0',
              value: Common_DayOfWeek.Wednesday,
            },
          }),
        }),
      }),
    );
  });

  it('should handle empty args', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({});
    });

    // Trigger the onCompleted callback
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalled();
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });

  it('should handle geofenceSettings correctly', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({
        geofenceSettings: {
          geofenceEnabled: { version: '1.0', value: true },
          geofenceReminderSettings: {
            startTime: { version: '1.0', value: '09:00' },
            endTime: { version: '1.0', value: '17:00' },
            daysOfWeek: {
              version: '1.0',
              value: [Common_DayOfWeek.Monday, Common_DayOfWeek.Wednesday],
            },
          },
        },
      });
    });

    // Trigger the onCompleted callback
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            geofenceSettings: {
              geofenceEnabled: { version: '1.0', value: true },
              geofenceReminderSettings: {
                startTime: { version: '1.0', value: '09:00' },
                endTime: { version: '1.0', value: '17:00' },
                daysOfWeek: {
                  version: '1.0',
                  value: [Common_DayOfWeek.Monday, Common_DayOfWeek.Wednesday],
                },
              },
            },
          }),
        }),
      }),
    );
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });

  it('should handle geofenceSettings with only geofenceEnabled', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({
        geofenceSettings: {
          geofenceEnabled: { version: '1.0', value: false },
        },
      });
    });

    // Trigger the onCompleted callback
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            geofenceSettings: {
              geofenceEnabled: { version: '1.0', value: false },
            },
          }),
        }),
      }),
    );
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });

  it('should handle mileageTrackingEnabled in timesheetManagementSettings', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({
        timesheetManagementSettings: {
          timesheet: {
            mileageTrackingEnabled: { version: '1.0', value: true },
          },
        },
      });
    });

    // Trigger the onCompleted callback
    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            timesheetManagementSettings: {
              timesheet: {
                mileageTrackingEnabled: { version: '1.0', value: true },
              },
            },
          }),
        }),
      }),
    );
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });

  it('should handle customDimensions in timesheetManagementSettings.customFields', async () => {
    const mockEmployerSettings = {
      employerId: '123',
      version: '2.0',
    };

    mockMutationFn.mockResolvedValue({});

    const { result } = renderHook(() => useSetQLSettings(args));
    const [updateSettings] = result.current;

    const updatePromise = act(async () => {
      await updateSettings({
        timesheetManagementSettings: {
          customFields: {
            customDimensions: [
              {
                dimensionDefinitionId: '1000000023',
                enabledForTimeTracking: { version: '1.0', value: true },
                required: { version: '2.0', value: false },
              },
              {
                dimensionDefinitionId: '1000000024',
                enabledForTimeTracking: { version: '3.0', value: false },
                required: { version: '4.0', value: true },
              },
            ],
          },
        },
      });
    });

    act(() => {
      if (mockOnCompleted) {
        mockOnCompleted({
          timeTrackingUpdateEmployerSettings: {
            __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
            employerSettings: mockEmployerSettings,
          },
        });
      }
    });

    await updatePromise;

    expect(mockMutationFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            timesheetManagementSettings: {
              customFields: {
                customDimensions: [
                  {
                    dimensionDefinitionId: '1000000023',
                    enabledForTimeTracking: { version: '1.0', value: true },
                    required: { version: '2.0', value: false },
                  },
                  {
                    dimensionDefinitionId: '1000000024',
                    enabledForTimeTracking: { version: '3.0', value: false },
                    required: { version: '4.0', value: true },
                  },
                ],
              },
            },
          }),
        }),
      }),
    );
    expect(args.onSuccess).toHaveBeenCalledWith(mockEmployerSettings);
  });
});

describe('mapNumberToDaysOfWeekValue', () => {
  it('should map numbers to correct days of week', () => {
    expect(mapNumberToDaysOfWeekValue(0)).toBe(Common_DayOfWeek.Sunday);
    expect(mapNumberToDaysOfWeekValue(1)).toBe(Common_DayOfWeek.Monday);
    expect(mapNumberToDaysOfWeekValue(2)).toBe(Common_DayOfWeek.Tuesday);
    expect(mapNumberToDaysOfWeekValue(3)).toBe(Common_DayOfWeek.Wednesday);
    expect(mapNumberToDaysOfWeekValue(4)).toBe(Common_DayOfWeek.Thursday);
    expect(mapNumberToDaysOfWeekValue(5)).toBe(Common_DayOfWeek.Friday);
    expect(mapNumberToDaysOfWeekValue(6)).toBe(Common_DayOfWeek.Saturday);
  });

  it('should return Sunday for invalid numbers', () => {
    expect(mapNumberToDaysOfWeekValue(-1)).toBe(Common_DayOfWeek.Sunday);
    expect(mapNumberToDaysOfWeekValue(7)).toBe(Common_DayOfWeek.Sunday);
    expect(mapNumberToDaysOfWeekValue(999)).toBe(Common_DayOfWeek.Sunday);
  });
});
