// @ts-nocheck
// This file is using @ts-nocheck to bypass the tsconfig.json parsing error
import { act, renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import React from 'react';
import { buildSandbox } from '@payroll/quicksand';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import {
  useGetApprovalSettings,
  UseGetApprovalSettingsResult,
} from 'src/js/service/hooks/settings/useGetApprovalSettings';
import { TimeTracking_ApprovalSettings } from 'src/__generated__/timeTracking/graphql';
import * as customerInteraction from 'src/js/common/CustomerInteraction';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { Sandbox } from 'src/js/common/sandbox';

// Mock the Apollo hooks
const mockQueryFn = jest.fn();
jest.mock('src/__generated__/timeTracking/graphql', () => {
  const originalModule = jest.requireActual(
    'src/__generated__/timeTracking/graphql',
  );

  return {
    ...originalModule,
    useGetApprovalSettingsLazyQuery: () => [
      mockQueryFn,
      {
        loading: false,
        error: null,
        data: { timeTrackingApprovalSettings: {} },
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
    GET_APPROVAL_SETTINGS: 'GET_APPROVAL_SETTINGS',
  },
}));

describe('useGetApprovalSettings', () => {
  let sandbox: Sandbox;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockApprovalSettings = (
    overrides: Partial<TimeTracking_ApprovalSettings> = {},
  ): TimeTracking_ApprovalSettings => ({
    __typename: 'TimeTracking_ApprovalSettings',
    employee: {
      __typename: 'TimeTracking_EmployeeApprovalSettings',
      approvalEnabled: {
        __typename: 'TimeTracking_SettingBoolean',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: false,
      },
      partialWeekApprovalEnabled: {
        __typename: 'TimeTracking_SettingBoolean',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: false,
      },
      submissionRequired: {
        __typename: 'TimeTracking_SettingBoolean',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: false,
      },
      submitMessage: {
        __typename: 'TimeTracking_SettingString',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: '',
      },
      reminders: null,
    },
    manager: {
      __typename: 'TimeTracking_ManagerApprovalSettings',
      reminders: null,
    },
    submissionNotifications: {
      __typename: 'TimeTracking_ApprovalSubmissionNotificationSettings',
      notifyManagerOnSubmit: {
        __typename: 'TimeTracking_SettingBoolean',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: false,
      },
      notifyManagerOnGroupSubmitted: {
        __typename: 'TimeTracking_SettingBoolean',
        meta: {
          __typename: 'TimeTracking_SettingMeta',
          version: '1',
          createdAt: '',
          updatedAt: '',
          createdBy: '',
          updatedBy: '',
        },
        value: false,
      },
    },
    ...overrides,
  });

  const setupSuccessfulQuery = (
    settings: TimeTracking_ApprovalSettings = createMockApprovalSettings(),
  ) => {
    mockQueryFn.mockResolvedValue({
      data: { timeTrackingApprovalSettings: settings },
      error: null,
    });
  };

  const setupErrorQuery = (error: Error) => {
    mockQueryFn.mockResolvedValue({
      data: null,
      error,
    });
  };

  const expectCustomerInteractionSuccess = () => {
    expect(customerInteraction.createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
    );
    expect(customerInteraction.endInteractionWithSuccess).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
    );
  };

  const expectCustomerInteractionFailure = (
    errorMessage: string,
    error: any,
  ) => {
    expect(customerInteraction.createCustomerInteraction).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
    );
    expect(customerInteraction.endInteractionWithFailure).toHaveBeenCalledWith(
      expect.any(Object),
      customerInteraction.TimeCustomerInteraction.GET_APPROVAL_SETTINGS,
      errorMessage,
      error,
    );
  };

  const expectQueryCall = () => {
    expect(mockQueryFn).toHaveBeenCalledWith({
      context: {
        clientName: ApolloClientNames.TIME_TRACKING,
        headers: {},
      },
    });
  };

  describe('successful data fetching', () => {
    it('should fetch approval settings on mount', async () => {
      const mockSettings = createMockApprovalSettings({
        employee: {
          __typename: 'TimeTracking_EmployeeApprovalSettings',
          approvalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          submissionRequired: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          partialWeekApprovalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: false,
          },
          submitMessage: {
            __typename: 'TimeTracking_SettingString',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: 'Please submit your timesheet',
          },
          reminders: null,
        },
      });

      setupSuccessfulQuery(mockSettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expectQueryCall();
      expectCustomerInteractionSuccess();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(true);
      expect(
        result.current.approvalSettings.requireTeamMembersSubmitTime.value,
      ).toBe(true);
      expect(
        result.current.approvalSettings.enablePartialWeekSubmission.value,
      ).toBe(true); // Inverted
      expect(result.current.approvalSettings.customMessage.value).toBe(
        'Please submit your timesheet',
      );
      expect(result.current.error).toBe('');
    });

    it('should handle empty approval settings data', async () => {
      const emptySettings = createMockApprovalSettings();

      setupSuccessfulQuery(emptySettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
      expect(
        result.current.approvalSettings.requireTeamMembersSubmitTime.value,
      ).toBe(false);
      expect(result.current.approvalSettings.customMessage.value).toBe('');
      expect(result.current.error).toBe('');
      expectCustomerInteractionSuccess();
    });

    it('should handle null approval settings data', async () => {
      mockQueryFn.mockResolvedValue({
        data: { timeTrackingApprovalSettings: null },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state, not null
      expect(result.current.approvalSettings).toBeDefined();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should handle undefined approval settings data', async () => {
      mockQueryFn.mockResolvedValue({
        data: { timeTrackingApprovalSettings: undefined },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state
      expect(result.current.approvalSettings).toBeDefined();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should handle response with data but no approval settings', async () => {
      mockQueryFn.mockResolvedValue({
        data: {},
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state
      expect(result.current.approvalSettings).toBeDefined();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
      expect(result.current.error).toBe('');
    });

    it('should handle response with data containing null timeTrackingApprovalSettings', async () => {
      jest.clearAllMocks();
      mockQueryFn.mockResolvedValue({
        data: { timeTrackingApprovalSettings: null },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state
      expect(result.current.approvalSettings).toBeDefined();
      expect(result.current.error).toBe('');
      // Verify that success interaction is NOT called since data is null
      expect(
        customerInteraction.endInteractionWithSuccess,
      ).not.toHaveBeenCalled();
    });

    it('should handle response with data containing falsy timeTrackingApprovalSettings', async () => {
      jest.clearAllMocks();
      mockQueryFn.mockResolvedValue({
        data: { timeTrackingApprovalSettings: false },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state
      expect(result.current.approvalSettings).toBeDefined();
      expect(result.current.error).toBe('');
      // Verify that success interaction is NOT called since data is falsy
      expect(
        customerInteraction.endInteractionWithSuccess,
      ).not.toHaveBeenCalled();
    });

    it('should handle response with null data', async () => {
      jest.clearAllMocks();
      mockQueryFn.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should return default state
      expect(result.current.approvalSettings).toBeDefined();
      expect(result.current.error).toBe('');
      // Verify that success interaction is NOT called since data is null
      expect(
        customerInteraction.endInteractionWithSuccess,
      ).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle query error', async () => {
      const mockError = new Error('Network error');
      setupErrorQuery(mockError);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.approvalSettings).toBeDefined();
      expectCustomerInteractionFailure('Network error', mockError);
    });

    it('should handle error without message gracefully', async () => {
      const mockError = { message: undefined };
      setupErrorQuery(mockError as Error);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(undefined);
      expectCustomerInteractionFailure(undefined, mockError);
    });

    it('should handle null error gracefully', async () => {
      mockQueryFn.mockResolvedValue({
        data: { timeTrackingApprovalSettings: null },
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('');
      expect(
        customerInteraction.endInteractionWithFailure,
      ).not.toHaveBeenCalled();
    });

    it('should handle response error in data', async () => {
      const mockError = new Error('GraphQL error');
      mockQueryFn.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('GraphQL error');
      expectCustomerInteractionFailure('GraphQL error', mockError);
    });
  });

  describe('loading state', () => {
    it('should handle loading state correctly', async () => {
      let resolveQuery: (value: any) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      mockQueryFn.mockReturnValue(queryPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      // Should be loading initially
      expect(result.current.loading).toBe(true);
      expect(result.current.approvalSettings).toBeDefined();
      expect(result.current.error).toBe('');

      // Resolve the query
      resolveQuery!({
        data: { timeTrackingApprovalSettings: createMockApprovalSettings() },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
    });

    it('should reset loading state after error', async () => {
      const mockError = new Error('Test error');
      setupErrorQuery(mockError);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Test error');
      expect(result.current.approvalSettings).toBeDefined();
    });
  });

  describe('settled state', () => {
    it('should not be settled while the initial request is in flight', async () => {
      let resolveQuery: (value: any) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });
      mockQueryFn.mockReturnValue(queryPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.settled).toBe(false);

      resolveQuery!({
        data: { timeTrackingApprovalSettings: createMockApprovalSettings() },
        error: null,
      });

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });
      expect(result.current.loading).toBe(false);
    });

    it('should become settled after a successful fetch', async () => {
      setupSuccessfulQuery();

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });
      expect(result.current.error).toBe('');
    });

    it('should become settled after a failed fetch', async () => {
      setupErrorQuery(new Error('Network error'));

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });
      expect(result.current.error).toBe('Network error');
    });

    it('should become settled after a promise rejection', async () => {
      mockQueryFn.mockRejectedValue(new Error('Promise rejection error'));

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });
      expect(result.current.error).toBe('Promise rejection error');
    });

    it('should re-settle after a refetch completes', async () => {
      setupSuccessfulQuery();

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.settled).toBe(true);
      });
      expect(result.current.loading).toBe(false);
    });
  });

  describe('refetch functionality', () => {
    it('should refetch approval settings when refetch is called', async () => {
      const initialSettings = createMockApprovalSettings({
        employee: {
          __typename: 'TimeTracking_EmployeeApprovalSettings',
          approvalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          submissionRequired: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: false,
          },
          partialWeekApprovalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: false,
          },
          submitMessage: {
            __typename: 'TimeTracking_SettingString',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: '',
          },
          reminders: null,
        },
      });

      setupSuccessfulQuery(initialSettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(true);

      // Reset mocks to verify refetch
      mockQueryFn.mockClear();
      customerInteraction.createCustomerInteraction.mockClear();
      customerInteraction.endInteractionWithSuccess.mockClear();

      // Setup new data for refetch
      const updatedSettings = createMockApprovalSettings({
        employee: {
          __typename: 'TimeTracking_EmployeeApprovalSettings',
          approvalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: false,
          },
          submissionRequired: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          partialWeekApprovalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: false,
          },
          submitMessage: {
            __typename: 'TimeTracking_SettingString',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '2',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: '',
          },
          reminders: null,
        },
      });
      setupSuccessfulQuery(updatedSettings);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expectQueryCall();
      expectCustomerInteractionSuccess();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
      expect(
        result.current.approvalSettings.requireTeamMembersSubmitTime.value,
      ).toBe(true);
    });

    it('should handle refetch error', async () => {
      // Initial successful load
      const initialSettings = createMockApprovalSettings();
      setupSuccessfulQuery(initialSettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup error for refetch
      const mockError = new Error('Refetch error');
      setupErrorQuery(mockError);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Refetch error');
      expectCustomerInteractionFailure('Refetch error', mockError);
    });

    it('should clear error on successful refetch', async () => {
      // Initial error
      const mockError = new Error('Initial error');
      setupErrorQuery(mockError);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Initial error');

      // Setup successful refetch
      const settings = createMockApprovalSettings();
      setupSuccessfulQuery(settings);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('');
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(false);
    });
  });

  describe('hook interface', () => {
    it('should return correct interface structure', async () => {
      const mockSettings = createMockApprovalSettings();
      setupSuccessfulQuery(mockSettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check that all expected properties exist
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('settled');
      expect(result.current).toHaveProperty('approvalSettings');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('error');

      // Check types
      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.settled).toBe('boolean');
      expect(typeof result.current.error).toBe('string');
      expect(typeof result.current.refetch).toBe('function');
      expect(result.current.approvalSettings).toBeDefined();
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime,
      ).toHaveProperty('value');
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime,
      ).toHaveProperty('version');
    });
  });

  describe('Apollo client configuration', () => {
    it('should use correct Apollo client configuration', async () => {
      setupSuccessfulQuery();

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockQueryFn).toHaveBeenCalledWith({
        context: {
          clientName: ApolloClientNames.TIME_TRACKING,
          headers: {},
        },
      });
    });
  });

  describe('edge cases for coverage', () => {
    it('should handle promise rejection in catch block', async () => {
      const mockError = new Error('Promise rejection error');
      mockQueryFn.mockRejectedValue(mockError);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Promise rejection error');
      expectCustomerInteractionFailure('Promise rejection error', mockError);
    });

    it('should handle handleFailure with null error', async () => {
      mockQueryFn.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Since error is null, handleFailure should not be called
      expect(
        customerInteraction.endInteractionWithFailure,
      ).not.toHaveBeenCalled();
    });

    it('should handle complete approval settings with all reminders', async () => {
      const completeSettings = createMockApprovalSettings({
        employee: {
          __typename: 'TimeTracking_EmployeeApprovalSettings',
          approvalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          partialWeekApprovalEnabled: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          submissionRequired: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          submitMessage: {
            __typename: 'TimeTracking_SettingString',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: 'Custom message',
          },
          reminders: {
            __typename: 'TimeTracking_EmployeeReminderSettings',
            reminderBasedOn: {
              __typename: 'TimeTracking_SettingString',
              meta: {
                __typename: 'TimeTracking_SettingMeta',
                version: '1',
                createdAt: '',
                updatedAt: '',
                createdBy: '',
                updatedBy: '',
              },
              value: 'PAY_PERIOD',
            },
            week: {
              __typename: 'TimeTracking_WeeklyReminderSettings',
              currentWeekReminder: {
                __typename: 'TimeTracking_WeeklyReminder',
                daysOfWeek: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['MONDAY', 'FRIDAY'],
                },
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 9,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL'],
                },
              },
              previousWeekReminder: {
                __typename: 'TimeTracking_WeeklyReminder',
                daysOfWeek: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['TUESDAY'],
                },
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 10,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['PUSH'],
                },
              },
            },
            payPeriod: {
              __typename: 'TimeTracking_PayPeriodReminderSettings',
              currentPeriodReminder: {
                __typename: 'TimeTracking_PayPeriodReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 8,
                },
                offsetDays: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 2,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL', 'PUSH'],
                },
              },
              previousPeriodReminder: {
                __typename: 'TimeTracking_PayPeriodReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 12,
                },
                offsetDays: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 3,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL'],
                },
              },
            },
            daily: {
              __typename: 'TimeTracking_DailyReminderSettings',
              firstReminder: {
                __typename: 'TimeTracking_DailyReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 14,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL'],
                },
              },
              secondReminder: {
                __typename: 'TimeTracking_DailyReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 16,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['PUSH'],
                },
              },
              reminderForTimesheetDays: {
                __typename: 'TimeTracking_SettingListString',
                meta: {
                  __typename: 'TimeTracking_SettingMeta',
                  version: '1',
                  createdAt: '',
                  updatedAt: '',
                  createdBy: '',
                  updatedBy: '',
                },
                value: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
              },
            },
          },
        },
        manager: {
          __typename: 'TimeTracking_ManagerApprovalSettings',
          reminders: {
            __typename: 'TimeTracking_ManagerReminderSettings',
            reminderBasedOn: {
              __typename: 'TimeTracking_SettingString',
              meta: {
                __typename: 'TimeTracking_SettingMeta',
                version: '1',
                createdAt: '',
                updatedAt: '',
                createdBy: '',
                updatedBy: '',
              },
              value: 'DAY_OF_WEEK',
            },
            week: {
              __typename: 'TimeTracking_WeeklyReminderSettings',
              currentWeekReminder: {
                __typename: 'TimeTracking_WeeklyReminder',
                daysOfWeek: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['THURSDAY'],
                },
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 11,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL', 'PUSH'],
                },
              },
              previousWeekReminder: {
                __typename: 'TimeTracking_WeeklyReminder',
                daysOfWeek: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['WEDNESDAY'],
                },
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 15,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['PUSH'],
                },
              },
            },
            payPeriod: {
              __typename: 'TimeTracking_PayPeriodReminderSettings',
              currentPeriodReminder: {
                __typename: 'TimeTracking_PayPeriodReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 13,
                },
                offsetDays: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 1,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['EMAIL'],
                },
              },
              previousPeriodReminder: {
                __typename: 'TimeTracking_PayPeriodReminder',
                hour: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 17,
                },
                offsetDays: {
                  __typename: 'TimeTracking_SettingInt',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: 4,
                },
                reminderMedium: {
                  __typename: 'TimeTracking_SettingListString',
                  meta: {
                    __typename: 'TimeTracking_SettingMeta',
                    version: '1',
                    createdAt: '',
                    updatedAt: '',
                    createdBy: '',
                    updatedBy: '',
                  },
                  value: ['PUSH'],
                },
              },
            },
          },
        },
        submissionNotifications: {
          __typename: 'TimeTracking_ApprovalSubmissionNotificationSettings',
          notifyManagerOnSubmit: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          notifyManagerOnGroupSubmitted: {
            __typename: 'TimeTracking_SettingBoolean',
            meta: {
              __typename: 'TimeTracking_SettingMeta',
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
        },
      });

      setupSuccessfulQuery(completeSettings);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetApprovalSettings(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify employee settings
      expect(
        result.current.approvalSettings.requireApprovalForTrackedTime.value,
      ).toBe(true);
      expect(
        result.current.approvalSettings.requireTeamMembersSubmitTime.value,
      ).toBe(true);
      expect(
        result.current.approvalSettings.enablePartialWeekSubmission.value,
      ).toBe(false); // inverted
      expect(result.current.approvalSettings.customMessage.value).toBe(
        'Custom message',
      );

      // Verify employee reminders
      expect(
        result.current.approvalSettings.employeeReminderBasedOn.value,
      ).toBe('PAY_PERIOD');
      expect(
        result.current.approvalSettings.employeeCurrentWeekReminderDays.value,
      ).toEqual(['MONDAY', 'FRIDAY']);
      expect(
        result.current.approvalSettings.employeeCurrentWeekReminderHour.value,
      ).toBe(9);
      expect(
        result.current.approvalSettings.employeeCurrentWeekReminderMedium.value,
      ).toEqual(['EMAIL']);
      expect(
        result.current.approvalSettings.employeePreviousWeekReminderDays.value,
      ).toEqual(['TUESDAY']);
      expect(
        result.current.approvalSettings.employeePreviousWeekReminderHour.value,
      ).toBe(10);
      expect(
        result.current.approvalSettings.employeePreviousWeekReminderMedium
          .value,
      ).toEqual(['PUSH']);
      expect(
        result.current.approvalSettings.employeeCurrentPayPeriodReminderHour
          .value,
      ).toBe(8);
      expect(
        result.current.approvalSettings
          .employeeCurrentPayPeriodReminderOffsetDays.value,
      ).toBe(2);
      expect(
        result.current.approvalSettings.employeeCurrentPayPeriodReminderMedium
          .value,
      ).toEqual(['EMAIL', 'PUSH']);
      expect(
        result.current.approvalSettings.employeePreviousPayPeriodReminderHour
          .value,
      ).toBe(12);
      expect(
        result.current.approvalSettings
          .employeePreviousPayPeriodReminderOffsetDays.value,
      ).toBe(3);
      expect(
        result.current.approvalSettings.employeePreviousPayPeriodReminderMedium
          .value,
      ).toEqual(['EMAIL']);
      expect(
        result.current.approvalSettings.employeeDailyReminderFirstReminderHour
          .value,
      ).toBe(14);
      expect(
        result.current.approvalSettings.employeeDailyReminderFirstReminderMedium
          .value,
      ).toEqual(['EMAIL']);
      expect(
        result.current.approvalSettings.employeeDailyReminderSecondReminderHour
          .value,
      ).toBe(16);
      expect(
        result.current.approvalSettings
          .employeeDailyReminderSecondReminderMedium.value,
      ).toEqual(['PUSH']);
      expect(
        result.current.approvalSettings.employeeDailyReminderForTimesheetDays
          .value,
      ).toEqual(['MONDAY', 'WEDNESDAY', 'FRIDAY']);

      // Verify manager reminders
      expect(result.current.approvalSettings.managerReminderBasedOn.value).toBe(
        'DAY_OF_WEEK',
      );
      expect(
        result.current.approvalSettings.managerCurrentWeekReminderDays.value,
      ).toEqual(['THURSDAY']);
      expect(
        result.current.approvalSettings.managerCurrentWeekReminderHour.value,
      ).toBe(11);
      expect(
        result.current.approvalSettings.managerCurrentWeekReminderMedium.value,
      ).toEqual(['EMAIL', 'PUSH']);
      expect(
        result.current.approvalSettings.managerPreviousWeekReminderDays.value,
      ).toEqual(['WEDNESDAY']);
      expect(
        result.current.approvalSettings.managerPreviousWeekReminderHour.value,
      ).toBe(15);
      expect(
        result.current.approvalSettings.managerPreviousWeekReminderMedium.value,
      ).toEqual(['PUSH']);
      expect(
        result.current.approvalSettings.managerCurrentPayPeriodReminderHour
          .value,
      ).toBe(13);
      expect(
        result.current.approvalSettings
          .managerCurrentPayPeriodReminderOffsetDays.value,
      ).toBe(1);
      expect(
        result.current.approvalSettings.managerCurrentPayPeriodReminderMedium
          .value,
      ).toEqual(['EMAIL']);
      expect(
        result.current.approvalSettings.managerPreviousPayPeriodReminderHour
          .value,
      ).toBe(17);
      expect(
        result.current.approvalSettings
          .managerPreviousPayPeriodReminderOffsetDays.value,
      ).toBe(4);
      expect(
        result.current.approvalSettings.managerPreviousPayPeriodReminderMedium
          .value,
      ).toEqual(['PUSH']);

      // Verify submission notifications
      expect(result.current.approvalSettings.notifyManagerOnSubmit.value).toBe(
        true,
      );
      expect(
        result.current.approvalSettings.notifyManagerOnGroupSubmitted.value,
      ).toBe(true);

      expectCustomerInteractionSuccess();
    });
  });
});
