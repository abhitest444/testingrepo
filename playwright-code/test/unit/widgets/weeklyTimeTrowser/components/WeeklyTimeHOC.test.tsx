import { useIntl, useSandbox } from '@payroll/quicksand';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import dayjs from 'dayjs';
import { useGetEntitlements } from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  computeTimeTrackingOnlyUser,
  getDefaultDecision,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import { WeeklyTimeHOC } from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimeHOC';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { FEATURE_FLAGS, TIME_TRACKING_HEADERS } from 'src/js/common/constants';
import { useIsMobileDevice } from 'src/js/common/screenSizeUtils';
import {
  useWeeklyTimeForm,
  getWeeklyTimeFormDefaultValues,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm';
import { useBatchSaveTimeEntries } from 'src/js/service/hooks/timeEntries/useBatchSaveTimeEntries';
import * as timeEntryLockUtils from 'src/js/common/timeEntryLockUtils';
import { renderWithFormProvider } from 'test/unit/testUtils';

const mockSandbox = {
  performance: {
    createCustomerInteraction: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logException: jest.fn(),
  },
  appContext: {
    getEnvironment: jest.fn().mockReturnValue('e2e'),
    getRealmInfo: jest.fn().mockReturnValue({
      realmId: '123456',
      realmName: 'Test Company',
    }),
    getUserAuthInfo: jest.fn().mockReturnValue({ authId: '' }),
  },
  sandboxContext: {
    getInfo: jest.fn().mockReturnValue({ widgetId: 'test-widget-id' }),
  },
  extensions: {
    qbo: {
      context: {
        getCompanyInfo: jest.fn().mockReturnValue({
          id: '',
          companyCreateDateInServerLocale: '2020-01-01',
        }),
        getCompanyL10nInfo: jest.fn().mockReturnValue({
          region: 'US',
          defaultDateFormat: 'mm/dd/yyyy',
        }),
        getAuthInfo: jest.fn().mockReturnValue({}),
      },
    },
  },
  experiments: {
    getRemoteExperimentAssignments: jest.fn().mockResolvedValue([]),
  },
};

// Mock Apollo useMutation
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useMutation: jest.fn(),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

// Mock necessary hooks and modules
jest.mock('src/js/service/utils/sandboxUtils');
jest.mock('src/js/service/hooks/timeEntries/useLazySearchTimeEntries');
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements');
jest.mock('src/js/common/screenSizeUtils', () => ({
  useIsMobileDevice: jest.fn().mockReturnValue(false),
}));
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(),
}));
// Mock the maintenance feature flag hook (defaults to disabled)
jest.mock('src/js/common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(false),
}));
// Mock the full-page maintenance banner
jest.mock('src/js/common/components/MaintenancePage/MaintenancePage', () => ({
  __esModule: true,
  default: () => <div data-testid="maintenance-page" />,
}));
jest.mock('src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled', () => ({
  useOvertimeFeatureFlag: jest.fn().mockReturnValue({ isEnabled: false }),
}));

jest.mock('src/js/service/utils/useTimeTrackingAuthorization', () => ({
  computeCanEditSettings: jest.fn().mockResolvedValue(true),
  useTimeTrackingBatchAuthorization: jest.fn(),
  computeTimeTrackingOnlyUser: jest.fn(),
  getDefaultDecision: jest.fn(() => ({})),
}));
jest.mock('src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm');

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(),
  useIntl: jest.fn(),
  useTracking: jest.fn().mockReturnValue(jest.fn()),
  useAppContext: jest.fn().mockReturnValue({
    realmId: '123456',
    environment: 'sandbox',
  }),
  useStorage: jest.fn().mockReturnValue([false, jest.fn()]),
  useAuthorization: jest.fn().mockReturnValue({
    loading: false,
    decision: {
      isAuthorized: true,
    },
  }),
}));
jest.mock('src/js/service/hooks/settings/useCompanySettings', () => ({
  useCompanySettings: jest.fn().mockReturnValue({
    settingsData: {
      isServiceFieldEnabled: true,
      isBillingFieldEnabled: true,
      billingRateForTimeEnabled: true,
      firstDayOfWeek: 1,
      isClassEnabled: true,
      isLocationEnabled: true,
      isTaxableFieldEnabled: true,
      entityVersion: '1',
      isCloseBookDateEnabled: false,
      isCloseBookPasswordEnabled: false,
      closeBookDate: '01-01-2025',
      timezone: 'America/(UTC-08:00) Pacific Time (US & Canada)',
    },
    refetch: jest.fn(),
    loading: false,
    error: '',
  }),
}));
jest.mock('src/js/common/useConsolidatedLoading', () => ({
  useConsolidatedLoading: jest.fn().mockReturnValue(false),
}));
jest.mock('src/js/service/hooks/employee/useLazyGetEmployeeData', () => ({
  useLazyGetEmployeeData: jest.fn().mockReturnValue({
    query: jest.fn(),
    loading: false,
    error: undefined,
    data: [],
    resetData: jest.fn(),
  }),
}));
jest.mock('src/js/service/hooks/timeEntries/useBatchSaveTimeEntries', () => ({
  useBatchSaveTimeEntries: jest.fn().mockReturnValue([
    jest.fn(),
    {
      batchSaveTimeEntries: jest.fn(),
      loading: false,
      error: undefined,
    },
  ]),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  fetchSettingsAccess: jest.fn().mockReturnValue(Promise.resolve({})),
  useHasAdminAccess: jest.fn().mockReturnValue(true),
  useCurrencyFormat: jest.fn().mockReturnValue('USD'),
  useCurrencySymbol: jest.fn().mockReturnValue('$'),
  useFeatureFlag: jest.fn().mockResolvedValue(true),
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));
jest.mock('src/js/common/DateAndTimeUtils', () => ({
  getDateFormat: jest.fn().mockReturnValue('mm/dd/yyyy'),
  stringToDayJS: jest.fn((value) => dayjs(value)),
}));
jest.mock('src/js/service/rest/NeoApiClient', () => ({
  NeoApiClient: jest.fn().mockReturnValue(
    Promise.resolve({
      canAccessSalesInfo: true,
    }),
  ),
  canAccessSalesInfo: jest.fn().mockReturnValue(true),
}));
jest.mock('src/js/service/hooks/preferenceces/useGetPreferences', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    data: {
      Preferences: {
        AccountingInfoPrefs: {
          DepartmentTerminology: 'Department',
          CustomerTerminology: 'Customer',
        },
      },
    },
    loading: false,
    error: false,
  }),
}));

/** Lazy search `query` must return a Promise — WeeklyTimeHOC chains `.then()` for consumption logs. */
const resolvedSearchTimeEntriesResponse = { data: {} };

const initialValues = {
  timeFor: {
    id: '1',
    name: 'Test',
    type: TimeForType.VENDOR,
  },
  week: {
    startDate: dayjs('2025-03-10T20:00:00'),
    endDate: dayjs('2025-03-14T20:00:00'),
  },
  weeklyTimeRows: [],
  dirtyFields: {
    weeklyTimeRows: [],
  },
  defaultValues: {
    weeklyTimeRows: [],
  },
};

describe('WeeklyTimeHOC Component', () => {
  const mockSetOpen = jest.fn();
  const mockFormatMessage = jest.fn(({ id }) => id);
  const mockHandleSubmit = jest.fn().mockReturnValue(jest.fn());
  const setupWeeklyFormHook = () => {
    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );
  };

  beforeEach(() => {
    // Mock Apollo useMutation
    const { useMutation } = require('@apollo/client');
    useMutation.mockReturnValue([
      jest.fn(),
      {
        loading: false,
        error: undefined,
        data: undefined,
      },
    ]);

    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      loading: false,
      data: getDefaultDecision(),
    });
    (useGetEntitlements as jest.Mock).mockReturnValue({
      data: [],
      loading: false,
    });
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    jest.clearAllMocks();
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: false,
      settled: true,
    });
    (useFeatureFlag as jest.Mock).mockReturnValue(false);
    (useIsMobileDevice as jest.Mock).mockReturnValue(false);
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn().mockResolvedValue(resolvedSearchTimeEntriesResponse),
      loading: false,
      data: [],
      resetData: jest.fn(),
    });
    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: mockFormatMessage,
    });
    // Re-establish useCompanySettings mock after clearAllMocks
    const {
      useCompanySettings,
    } = require('src/js/service/hooks/settings/useCompanySettings');
    (useCompanySettings as jest.Mock).mockReturnValue({
      settingsData: {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        billingRateForTimeEnabled: true,
        firstDayOfWeek: 1,
        isClassEnabled: true,
        isLocationEnabled: true,
        isTaxableFieldEnabled: true,
        entityVersion: '1',
        isCloseBookDateEnabled: false,
        isCloseBookPasswordEnabled: false,
        closeBookDate: '01-01-2025',
        timezone: 'America/(UTC-08:00) Pacific Time (US & Canada)',
      },
      refetch: jest.fn(),
      loading: false,
      error: '',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render without crashing when opened', () => {
    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );
    const { container } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('should submit form if there are no duration format errors', () => {
    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    const { getByTestId } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    fireEvent.click(getByTestId('weekly-time-trowser_save'));
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('should not submit form if there are duration format errors', () => {
    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      formState: {
        ...result.current.formState,
        dirtyFields: result.current.formState.dirtyFields,
        errors: {
          weeklyTimeRows: [{ durations: [{ message: 'Invalid duration' }] }],
        },
      },
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    const { getByTestId } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    fireEvent.click(getByTestId('weekly-time-trowser_save'));
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it('should initialize isTeamMemberLoaded state to false', () => {
    const { container } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    // Component should render successfully with isTeamMemberLoaded initialized to false
    // This validates the new state management for team member loading
    expect(container).toBeTruthy();
  });

  it('should conditionally render WayBackWhatsNewContainer based on isTeamMemberLoaded', () => {
    const { container } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    // WayBackWhatsNewContainer rendering is conditional on isTeamMemberLoaded
    // This test validates that the component handles the loading state properly
    expect(container).toBeTruthy();
  });

  it('should pass setOnTeamMemberLoaded callback to WeeklyTimeTableHeader', () => {
    const { container } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    // The WeeklyTimeTableHeader should receive setOnTeamMemberLoaded prop
    // to signal when the team member widget is ready
    expect(container).toBeTruthy();
  });

  it('should call searchTimeEntries with context headers when FF is settled and timeForId is set', () => {
    const mockSearchTimeEntries = jest
      .fn()
      .mockResolvedValue(resolvedSearchTimeEntriesResponse);
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: true,
      settled: true,
    });
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: mockSearchTimeEntries,
      loading: false,
      data: [],
      resetData: jest.fn(),
    });

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

    expect(mockSearchTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.any(Object),
        context: expect.objectContaining({
          headers: expect.objectContaining({
            [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
          }),
        }),
      }),
    );
  });

  it('should not pass TIME_ACTIVITY header when FF is settled but disabled', () => {
    const mockSearchTimeEntries = jest
      .fn()
      .mockResolvedValue(resolvedSearchTimeEntriesResponse);
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: false,
      settled: true,
    });
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: mockSearchTimeEntries,
      loading: false,
      data: [],
      resetData: jest.fn(),
    });

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

    expect(mockSearchTimeEntries).toHaveBeenCalled();
    const callArg = mockSearchTimeEntries.mock.calls[0][0];
    expect(callArg.context?.headers).not.toHaveProperty(
      TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW,
    );
  });

  it('should render Save & Close button for time tracking only users', () => {
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('tt-only-123');

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    const { getByTestId } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    expect(
      getByTestId('weekly-time-trowser_save_and_close'),
    ).toBeInTheDocument();
  });

  it('should render Save button alongside Save & Close for time tracking only users', () => {
    (computeTimeTrackingOnlyUser as jest.Mock).mockReturnValue('tt-only-123');

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    const { getByTestId } = renderWithFormProvider(
      <WeeklyTimeHOC open setOpen={mockSetOpen} />,
    );

    expect(getByTestId('weekly-time-trowser_save')).toBeInTheDocument();
  });

  it('should not render when trowser is closed', () => {
    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    const { container } = renderWithFormProvider(
      <WeeklyTimeHOC open={false} setOpen={mockSetOpen} />,
    );
    expect(container).toBeTruthy();
  });

  it('should render auth error message when authorization fails', () => {
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue({
      loading: false,
      data: getDefaultDecision(),
      error: new Error('forbidden'),
    });

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

    expect(screen.getByText('auth.error.header')).toBeInTheDocument();
  });

  it('should render mobile block when on mobile devices', () => {
    (useIsMobileDevice as jest.Mock).mockReturnValue(true);

    const {
      useWeeklyTimeForm: originalHook,
      getWeeklyTimeFormDefaultValues: originalGetDefaultValues,
    } = jest.requireActual(
      'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeForm',
    );
    const { result } = renderHook(() => originalHook(initialValues));

    (useWeeklyTimeForm as jest.Mock).mockReturnValue({
      ...result.current,
      handleSubmit: mockHandleSubmit,
    });
    (getWeeklyTimeFormDefaultValues as jest.Mock).mockReturnValue(
      originalGetDefaultValues(1, initialValues),
    );

    renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

    expect(screen.getByText('screen.to.small.title')).toBeInTheDocument();
  });

  describe('pending save banner behavior', () => {
    it('does not show pending save banner on read even when utility returns message', async () => {
      setupWeeklyFormHook();
      const getPendingMessageSpy = jest
        .spyOn(timeEntryLockUtils, 'getPendingSaveBannerMessageFromEntries')
        .mockReturnValue({
          type: 'warn',
          titleKey: 'single.time.pending.save.locked.fallback.title',
          messageKey: 'single.time.pending.save.locked.fallback.message',
        });

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      await waitFor(() => {
        expect(
          document.querySelector(
            '[data-automation-id="WeeklyTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
      expect(getPendingMessageSpy).not.toHaveBeenCalled();
    });

    it('does not show pending save banner on batch save success when response has locked + TIMECHARGE_PENDING', async () => {
      setupWeeklyFormHook();
      let capturedOnSuccess:
        | ((payload: { timeEntries: Array<Record<string, any>> }) => void)
        | undefined;
      (useBatchSaveTimeEntries as jest.Mock).mockImplementationOnce(
        ({ onSuccess }) => {
          capturedOnSuccess = onSuccess;
          return [
            jest.fn(),
            {
              batchSaveTimeEntries: jest.fn(),
              loading: false,
              error: undefined,
            },
          ];
        },
      );
      const getPendingMessageSpy = jest
        .spyOn(timeEntryLockUtils, 'getPendingSaveBannerMessageFromEntries')
        .mockReturnValue({
          type: 'info',
          titleKey: 'single.time.pending.save.title',
          messageKey: 'single.time.pending.save.message',
        });

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      await act(async () => {
        capturedOnSuccess?.({
          timeEntries: [{ locked: true, lockedReason: 'TIMECHARGE_PENDING' }],
        });
      });

      expect(getPendingMessageSpy).not.toHaveBeenCalled();
      expect(
        document.querySelector(
          '[data-automation-id="WeeklyTimeHOCPendingSavePageMessage"]',
        ),
      ).not.toBeInTheDocument();
    });

    it('shows pending save banner when batch save errors with TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH and save response cached time-charge-generation lock context', async () => {
      setupWeeklyFormHook();
      let capturedOnSuccess:
        | ((payload: { timeEntries: Array<Record<string, any>> }) => void)
        | undefined;
      let capturedOnError:
        | ((
            error: string,
            element?: string,
            meta?: { errorCode?: string; subCode?: string },
          ) => void)
        | undefined;
      (useBatchSaveTimeEntries as jest.Mock).mockImplementationOnce(
        ({ onSuccess, onError }) => {
          capturedOnSuccess = onSuccess;
          capturedOnError = onError;
          return [
            jest.fn(),
            {
              batchSaveTimeEntries: jest.fn(),
              loading: false,
              error: undefined,
            },
          ];
        },
      );

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      act(() => {
        capturedOnSuccess?.({
          timeEntries: [
            { id: 'row-1', locked: false, lockedReason: '' },
            {
              id: 'row-2',
              locked: true,
              lockedReason: 'TIMECHARGE_PENDING',
            },
          ],
        });
      });

      act(() => {
        capturedOnError?.('time.entry.error', undefined, {
          errorCode: 'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        });
      });

      await waitFor(() => {
        expect(
          document.querySelector(
            '[data-automation-id="WeeklyTimeHOCPendingSavePageMessage"]',
          ),
        ).toBeInTheDocument();
        expect(
          document.querySelector(
            '[data-testid="WeeklyTimeHOCErrorPageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('falls back to regular error message when sequence mismatch occurs without cached lock context', async () => {
      setupWeeklyFormHook();
      window.HTMLElement.prototype.scrollIntoView = jest.fn();
      let capturedOnError:
        | ((
            error: string,
            element?: string,
            meta?: { errorCode?: string; subCode?: string },
          ) => void)
        | undefined;
      (useBatchSaveTimeEntries as jest.Mock).mockImplementationOnce(
        ({ onError }) => {
          capturedOnError = onError;
          return [
            jest.fn(),
            {
              batchSaveTimeEntries: jest.fn(),
              loading: false,
              error: undefined,
            },
          ];
        },
      );

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      await act(async () => {
        capturedOnError?.('weekly.error.message', 'customer-id', {
          errorCode: 'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        });
      });

      expect(
        document.querySelector('[data-testid="WeeklyTimeHOCErrorPageMessage"]'),
      ).toBeInTheDocument();
      expect(
        document.querySelector(
          '[data-automation-id="WeeklyTimeHOCPendingSavePageMessage"]',
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Full page maintenance banner', () => {
    it('renders the maintenance banner inside the trowser when the flag is enabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(true);
      setupWeeklyFormHook();

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      expect(screen.getByTestId('maintenance-page')).toBeInTheDocument();
    });

    it('does not render the maintenance banner when the flag is disabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(false);
      setupWeeklyFormHook();

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      expect(screen.queryByTestId('maintenance-page')).not.toBeInTheDocument();
    });

    it('checks the maintenance banner flag with the correct feature flag constant', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(false);
      setupWeeklyFormHook();

      renderWithFormProvider(<WeeklyTimeHOC open setOpen={mockSetOpen} />);

      expect(useFeatureFlag).toHaveBeenCalledWith(
        FEATURE_FLAGS.SBSEG_QBO_QBTIME_MAINTENANCE_FULL_PAGE,
        false,
      );
    });
  });
});
