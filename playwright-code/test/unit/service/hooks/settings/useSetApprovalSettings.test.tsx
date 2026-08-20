// @ts-nocheck
// This file is using @ts-nocheck to bypass the tsconfig.json parsing error
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { buildSandbox } from '@payroll/quicksand';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import { useSetApprovalSettings } from 'src/js/service/hooks/settings/useSetApprovalSettings';
import {
  TimeTracking_UpdateApprovalSettingsInput,
  TimeTracking_ApprovalReminderBasis,
  TimeTracking_SettingNotificationMedium,
} from 'src/__generated__/timeTracking/graphql';
import * as customerInteraction from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { Sandbox } from 'src/js/common/sandbox';

// Mock the Apollo hooks
const mockMutateFn = jest.fn();
jest.mock('src/__generated__/timeTracking/graphql', () => {
  const originalModule = jest.requireActual(
    'src/__generated__/timeTracking/graphql',
  );

  return {
    ...originalModule,
    TimeTracking_ApprovalReminderBasis: {
      DayOfWeek: 'DAY_OF_WEEK',
      PayPeriod: 'PAY_PERIOD',
      Daily: 'DAILY',
    },
    TimeTracking_SettingNotificationMedium: {
      Email: 'EMAIL',
      Push: 'PUSH',
      PushNotification: 'PUSH_NOTIFICATION',
    },
    useTimeTrackingUpdateApprovalSettingsMutation: () => [
      mockMutateFn,
      {
        loading: false,
      },
    ],
  };
});

// Mock the CustomerInteraction module
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
  TimeCustomerInteraction: {
    UPDATE_APPROVAL_SETTINGS: 'update-approval-settings',
  },
}));

// Mock mapError
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn((params) => params.error),
}));

// Mock mapTimeTrackingMutationError
jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  mapTimeTrackingMutationError: jest.fn((intl, error) => error),
}));

describe('useSetApprovalSettings', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockInput = (): TimeTracking_UpdateApprovalSettingsInput => ({
    employee: {
      approvalEnabled: {
        version: '1',
        value: true,
      },
      partialWeekApprovalEnabled: {
        version: '1',
        value: false,
      },
      submissionRequired: {
        version: '1',
        value: true,
      },
      submitMessage: {
        version: '1',
        value: 'Please submit your timesheet',
      },
    },
  });

  const expectCustomerInteractionSuccess = () => {
    expect(customerInteraction.createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
    );
    expect(customerInteraction.endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
    );
  };

  const expectCustomerInteractionFailure = (
    errorMessage: string,
    error: any,
  ) => {
    expect(customerInteraction.createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
    );
    expect(customerInteraction.endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.UPDATE_APPROVAL_SETTINGS,
      errorMessage,
      error,
    );
  };

  describe('successful mutation', () => {
    it('should successfully update approval settings', async () => {
      const mockInput = createMockInput();
      const mockResultPayload = {
        __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
        successCode: 'SUCCESS',
        approvalSettings: {
          employee: {
            approvalEnabled: {
              meta: {
                version: '2',
                createdAt: '',
                updatedAt: '',
                createdBy: '',
                updatedBy: '',
              },
              value: true,
            },
          },
        },
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockResultPayload,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess, onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalledWith({
          variables: { input: mockInput },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: {},
          },
        });
      });

      expectCustomerInteractionSuccess();
      expect(onSuccess).toHaveBeenCalledWith(mockResultPayload);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle mutation with manager reminders', async () => {
      const mockInput: TimeTracking_UpdateApprovalSettingsInput = {
        manager: {
          reminders: {
            reminderBasedOn: {
              version: '1',
              value: TimeTracking_ApprovalReminderBasis.DayOfWeek,
            },
            week: {
              currentWeekReminder: {
                daysOfWeek: {
                  version: '1',
                  value: ['MONDAY', 'FRIDAY'],
                },
                hour: {
                  version: '1',
                  value: 9,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any],
                },
              },
            },
          },
        },
      };

      const mockResultPayload = {
        __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
        successCode: 'SUCCESS',
        approvalSettings: {},
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockResultPayload,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionSuccess();
      expect(onSuccess).toHaveBeenCalledWith(mockResultPayload);
    });

    it('should handle mutation with submission notifications', async () => {
      const mockInput: TimeTracking_UpdateApprovalSettingsInput = {
        submissionNotifications: {
          notifyManagerOnSubmit: {
            version: '1',
            value: true,
          },
          notifyManagerOnGroupSubmitted: {
            version: '1',
            value: false,
          },
        },
      };

      const mockResultPayload = {
        __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
        successCode: 'SUCCESS',
        approvalSettings: {},
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockResultPayload,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionSuccess();
      expect(onSuccess).toHaveBeenCalledWith(mockResultPayload);
    });
  });

  describe('error handling', () => {
    it('should handle GraphQL errors in result', async () => {
      const mockInput = createMockInput();
      const mockError = {
        message: 'Validation error',
        extensions: { code: 'BAD_REQUEST' },
      };
      const mockResult = {
        data: null,
        errors: [mockError],
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess, onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionFailure('Validation error', mockError);
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle TimeTracking_UpdateApprovalSettingsError typename', async () => {
      const mockInput = createMockInput();
      const mockErrorResult = {
        __typename: 'TimeTracking_UpdateApprovalSettingsError',
        errorCode: 'APPROVAL_SETTINGS_VALIDATION_ERROR',
        message: 'Invalid approval settings',
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockErrorResult,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess, onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionFailure(
        'Invalid approval settings',
        mockErrorResult,
      );
      expect(onError).toHaveBeenCalledWith(
        'APPROVAL_SETTINGS_VALIDATION_ERROR',
      );
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle TimeTracking_UpdateApprovalSettingsError without errorCode', async () => {
      const mockInput = createMockInput();
      const mockErrorResult = {
        __typename: 'TimeTracking_UpdateApprovalSettingsError',
        message: 'Update failed',
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockErrorResult,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess, onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionFailure('Update failed', mockErrorResult);
      expect(onError).toHaveBeenCalledWith('Update failed');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle mutation rejection', async () => {
      const mockInput = createMockInput();
      const mockError = new Error('Network error');

      mockMutateFn.mockRejectedValue(mockError);

      const onSuccess = jest.fn();
      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess, onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionFailure('Network error', mockError);
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should handle error without message', async () => {
      const mockInput = createMockInput();
      const mockError = { extensions: { code: 'UNKNOWN' } };
      const mockResult = {
        data: null,
        errors: [mockError],
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onError = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onError }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('hook interface', () => {
    it('should return correct interface structure', () => {
      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings(),
        sandbox,
      );

      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('function');
      expect(result.current[1]).toHaveProperty('loading');
      expect(typeof result.current[1].loading).toBe('boolean');
    });

    it('should work without callbacks', async () => {
      const mockInput = createMockInput();
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: {
            __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
            successCode: 'SUCCESS',
            approvalSettings: {},
          },
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings(),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expectCustomerInteractionSuccess();
    });
  });

  describe('Apollo client configuration', () => {
    it('should use correct Apollo client configuration', async () => {
      const mockInput = createMockInput();
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: {
            __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
            successCode: 'SUCCESS',
            approvalSettings: {},
          },
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings(),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalledWith({
          variables: { input: mockInput },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: {},
          },
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      const mockInput: TimeTracking_UpdateApprovalSettingsInput = {};
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: {
            __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
            successCode: 'SUCCESS',
            approvalSettings: {},
          },
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalled();
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle complete approval settings input', async () => {
      const mockInput: TimeTracking_UpdateApprovalSettingsInput = {
        employee: {
          approvalEnabled: {
            version: '1',
            value: true,
          },
          partialWeekApprovalEnabled: {
            version: '1',
            value: true,
          },
          submissionRequired: {
            version: '1',
            value: true,
          },
          submitMessage: {
            version: '1',
            value: 'Submit now',
          },
          reminders: {
            reminderBasedOn: {
              version: '1',
              value: TimeTracking_ApprovalReminderBasis.PayPeriod,
            },
            week: {
              currentWeekReminder: {
                daysOfWeek: {
                  version: '1',
                  value: ['MONDAY'],
                },
                hour: {
                  version: '1',
                  value: 10,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any],
                },
              },
              previousWeekReminder: {
                daysOfWeek: {
                  version: '1',
                  value: ['FRIDAY'],
                },
                hour: {
                  version: '1',
                  value: 16,
                },
                reminderMedium: {
                  version: '1',
                  value: ['PUSH' as any],
                },
              },
            },
            payPeriod: {
              currentPeriodReminder: {
                hour: {
                  version: '1',
                  value: 8,
                },
                offsetDays: {
                  version: '1',
                  value: 2,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any],
                },
              },
              previousPeriodReminder: {
                hour: {
                  version: '1',
                  value: 12,
                },
                offsetDays: {
                  version: '1',
                  value: 3,
                },
                reminderMedium: {
                  version: '1',
                  value: ['PUSH' as any],
                },
              },
            },
            daily: {
              firstReminder: {
                hour: {
                  version: '1',
                  value: 9,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any],
                },
              },
              secondReminder: {
                hour: {
                  version: '1',
                  value: 15,
                },
                reminderMedium: {
                  version: '1',
                  value: ['PUSH' as any],
                },
              },
              reminderForTimesheetDays: {
                version: '1',
                value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
              },
            },
          },
        },
        manager: {
          reminders: {
            reminderBasedOn: {
              version: '1',
              value: TimeTracking_ApprovalReminderBasis.DayOfWeek,
            },
            week: {
              currentWeekReminder: {
                daysOfWeek: {
                  version: '1',
                  value: ['THURSDAY'],
                },
                hour: {
                  version: '1',
                  value: 11,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any, 'PUSH' as any],
                },
              },
              previousWeekReminder: {
                daysOfWeek: {
                  version: '1',
                  value: ['TUESDAY'],
                },
                hour: {
                  version: '1',
                  value: 14,
                },
                reminderMedium: {
                  version: '1',
                  value: ['PUSH' as any],
                },
              },
            },
            payPeriod: {
              currentPeriodReminder: {
                hour: {
                  version: '1',
                  value: 13,
                },
                offsetDays: {
                  version: '1',
                  value: 1,
                },
                reminderMedium: {
                  version: '1',
                  value: ['EMAIL' as any],
                },
              },
              previousPeriodReminder: {
                hour: {
                  version: '1',
                  value: 17,
                },
                offsetDays: {
                  version: '1',
                  value: 4,
                },
                reminderMedium: {
                  version: '1',
                  value: ['PUSH' as any],
                },
              },
            },
          },
        },
        submissionNotifications: {
          notifyManagerOnSubmit: {
            version: '1',
            value: true,
          },
          notifyManagerOnGroupSubmitted: {
            version: '1',
            value: true,
          },
        },
      };

      const mockResultPayload = {
        __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
        successCode: 'SUCCESS',
        approvalSettings: {},
      };
      const mockResult = {
        data: {
          timeTrackingUpdateApprovalSettings: mockResultPayload,
        },
        errors: undefined,
      };

      mockMutateFn.mockResolvedValue(mockResult);

      const onSuccess = jest.fn();

      const { result } = renderHookWithQuicksandProvider(
        () => useSetApprovalSettings({ onSuccess }),
        sandbox,
      );

      const [updateApprovalSettings] = result.current;

      await act(async () => {
        await updateApprovalSettings(mockInput);
      });

      await waitFor(() => {
        expect(mockMutateFn).toHaveBeenCalledWith({
          variables: { input: mockInput },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: {},
          },
        });
      });

      expectCustomerInteractionSuccess();
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
