import React from 'react';
import { act, waitFor, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { useGetQLSettings } from '../../../../../src/js/service/hooks/settings/useGetQLSettings';
import { useGetEntitlements } from '../../../../../src/js/service/hooks/entitlements/useGetEntitlements';
import useGetPreferences from '../../../../../src/js/service/hooks/preferenceces/useGetPreferences';
import { fetchSettingsAccess } from '../../../../../src/js/service/utils/sandboxUtils';
import { useGetApprovalSettings } from '../../../../../src/js/service/hooks/settings/useGetApprovalSettings';
import {
  TimeTrackingSettingsProvider,
  useTimeTrackingSettingsContext,
} from '../../../../../src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext';
import { UxPreferenceKey } from '../../../../../src/js/service/utils/useUXPreferences';

// Increase Jest timeout for long-running async tests
jest.setTimeout(15000);

// Constants for test data
const DEFAULT_BADGE_DATA = {
  timeTrackingVisibilityEndDate: '',
  timeSheetVisibilityEndDate: '',
  notificationVisibilityEndDate: '',
  breaksVisibilityEndDate: '',
  customFieldsVisibilityEndDate: '',
  geoLocationsVisibilityEndDate: '',
  approvalsVisibilityEndDate: '',
  newTimesheetVisibilityEndDate: '',
  newCustomFieldsVisibilityEndDate: '',
};

const FUTURE_DATE = '01/01/2025';
const FUTURE_BADGE_DATA = {
  timeTrackingVisibilityEndDate: FUTURE_DATE,
  timeSheetVisibilityEndDate: FUTURE_DATE,
  notificationVisibilityEndDate: FUTURE_DATE,
  breaksVisibilityEndDate: FUTURE_DATE,
  customFieldsVisibilityEndDate: FUTURE_DATE,
  geoLocationsVisibilityEndDate: FUTURE_DATE,
  approvalsVisibilityEndDate: FUTURE_DATE,
  newTimesheetVisibilityEndDate: FUTURE_DATE,
  newCustomFieldsVisibilityEndDate: FUTURE_DATE,
};

// Mock all the hooks and utilities
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({
    id: 'test-sandbox',
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    appContext: {
      getLocalizationInfo: jest.fn().mockReturnValue({
        locale: 'en-us',
      }),
    },
  }),
  useAppContext: jest.fn().mockReturnValue({
    realmId: 'test-realm',
    environment: 'test-env',
  }),
  useIntl: jest.fn().mockReturnValue({
    formatMessage: jest.fn().mockReturnValue('test message'),
  }),
}));

jest.mock('../../../../../src/js/service/hooks/settings/useGetQLSettings');
jest.mock(
  '../../../../../src/js/service/hooks/entitlements/useGetEntitlements',
);
jest.mock(
  '../../../../../src/js/service/hooks/preferenceces/useGetPreferences',
);
jest.mock('../../../../../src/js/service/utils/sandboxUtils');
jest.mock(
  '../../../../../src/js/service/hooks/settings/useGetApprovalSettings',
);

// Mock useIXPFeatureFlag
jest.mock('../../../../../src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(() => ({
    isEnabled: false,
    isLoading: false,
    error: null,
    settled: true,
  })),
}));

// Mock useUxPreferences
const mockGetPreference = jest.fn();
const mockLoadPreferences = jest.fn();
const mockSetPreferences = jest.fn();
const mockUxPreferences = {
  data: { [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: DEFAULT_BADGE_DATA },
  loading: false,
  loadPreferences: mockLoadPreferences,
  getPreference: mockGetPreference,
  setPreferences: mockSetPreferences,
  initialized: true,
};

jest.mock('../../../../../src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: () => mockUxPreferences,
  UxPreferenceKey: {
    TIME_ENTRY_NEW_BADGE_VISIBLE: 'time-entry-new-badge-visible',
  },
  DEFAULT_UX_PREFERENCE_DATA_STATE: {
    'time-entry-new-badge-visible': {
      timeTrackingVisibilityEndDate: '',
      timeSheetVisibilityEndDate: '',
      notificationVisibilityEndDate: '',
      breaksVisibilityEndDate: '',
      customFieldsVisibilityEndDate: '',
      geoLocationsVisibilityEndDate: '',
      approvalsVisibilityEndDate: '',
      newTimesheetVisibilityEndDate: '',
      newCustomFieldsVisibilityEndDate: '',
    },
  },
}));

// Helper functions
const createMockSandbox = (locale = 'en-us') => ({
  id: 'test-sandbox',
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  appContext: {
    getLocalizationInfo: jest.fn().mockReturnValue({ locale }),
  },
});

const setupDefaultMocks = (sandbox = createMockSandbox()) => {
  (useSandbox as jest.Mock).mockReturnValue(sandbox);
  (useGetQLSettings as jest.Mock).mockReturnValue({
    qlSettings: {},
    loading: false,
    error: undefined,
    refetch: jest.fn(),
  });
  (useGetEntitlements as jest.Mock).mockReturnValue({
    data: [],
    loading: false,
  });
  (useGetPreferences as jest.Mock).mockReturnValue({
    data: {},
    loading: false,
    error: false,
  });
  (useGetApprovalSettings as jest.Mock).mockReturnValue({
    approvalSettings: null,
    loading: false,
    error: '',
    refetch: jest.fn(),
  });
  (fetchSettingsAccess as jest.Mock).mockResolvedValue(true);
};

const resetUxPreferences = (data = DEFAULT_BADGE_DATA) => {
  mockUxPreferences.loading = false;
  mockUxPreferences.initialized = true;
  mockUxPreferences.data = {
    [UxPreferenceKey.TIME_ENTRY_NEW_BADGE_VISIBLE]: data,
  };
};

const createWrapper =
  () =>
  ({ children }: { children: React.ReactNode }) =>
    <TimeTrackingSettingsProvider>{children}</TimeTrackingSettingsProvider>;

const TestComponent = () => {
  useTimeTrackingSettingsContext();
  return <div data-testid="content">Content rendered</div>;
};

const ContextReadyComponent = () => {
  useTimeTrackingSettingsContext();
  return <div data-testid="context-ready">Context Ready</div>;
};

const renderContextHook = () =>
  renderHook(() => useTimeTrackingSettingsContext(), {
    wrapper: createWrapper(),
  });

describe('TimeTrackingSettingsContext', () => {
  const mockSandbox = createMockSandbox();

  beforeEach(() => {
    jest.clearAllMocks();
    resetUxPreferences();
    setupDefaultMocks(mockSandbox);
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '' },
      writable: true,
    });
  });

  it('throws error when hook is used outside provider', () => {
    const { result } = renderHook(() => useTimeTrackingSettingsContext());
    expect(result.error).toEqual(
      Error(
        'useTimeTrackingSettingsContext must be used within a TimeTrackingSettingsProvider.',
      ),
    );
  });

  it('provides context values correctly', async () => {
    const { result } = renderContextHook();
    await waitFor(() => {
      expect(result.current).toEqual(
        expect.objectContaining({
          QLData: {},
          isQLSettingsLoading: false,
          QLSettingsError: undefined,
          v3PreferencesData: {},
          v3PreferencesLoading: false,
          v3PreferencesError: false,
          entitlements: [],
          entitlementsLoading: false,
          sandbox: mockSandbox,
          isFormEditable: true,
          errorMessage: '',
          isRenderTimeEntry: false,
          reRenderTimeEntrySetting: expect.any(Function),
          updateErrorMessage: expect.any(Function),
          refetchQlSettings: expect.any(Function),
          isUKLocale: false,
          approvalSettings: null,
          approvalSettingsLoading: false,
          approvalSettingsError: '',
          refetchApprovalSettings: expect.any(Function),
        }),
      );
    });
  });

  it('handles initial render and refetch', async () => {
    const mockRefetch = jest.fn();
    const mockQLSettings = {
      qlSettings: {},
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    };
    (useGetQLSettings as jest.Mock).mockImplementation(() => mockQLSettings);

    const { result, rerender } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());

    act(() => result.current.reRenderTimeEntrySetting('Test Message'));
    await waitFor(() =>
      expect(result.current.errorMessage).toBe('Test Message'),
    );
    expect(mockRefetch).toHaveBeenCalled();
    expect(result.current.isRenderTimeEntry).toBe(true);

    mockQLSettings.loading = true;
    rerender();
    expect(result.current.isQLSettingsLoading).toBe(true);

    mockQLSettings.loading = false;
    rerender();
    await waitFor(() => expect(result.current.isRenderTimeEntry).toBe(false));
  });

  it('handles settings access check', async () => {
    (fetchSettingsAccess as jest.Mock).mockResolvedValue(false);
    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    await waitFor(() => expect(result.current.isFormEditable).toBe(false));
    expect(fetchSettingsAccess).toHaveBeenCalledWith(mockSandbox);
  });

  it('provides context values correctly when not loading', async () => {
    const mockRefetch = jest.fn();
    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: { testSetting: 'value' },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });
    (useGetEntitlements as jest.Mock).mockReturnValue({
      data: [{ id: 'test-entitlement' }],
      loading: false,
    });
    (useGetPreferences as jest.Mock).mockReturnValue({
      data: { testPreference: 'value' },
      loading: false,
      error: false,
    });

    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());

    expect(result.current.isQLSettingsLoading).toBe(false);
    expect(result.current.entitlementsLoading).toBe(false);
    expect(result.current.v3PreferencesLoading).toBe(false);
    expect(result.current.QLData).toEqual({ testSetting: 'value' });
    expect(result.current.entitlements).toEqual([{ id: 'test-entitlement' }]);
    expect(result.current.v3PreferencesData).toEqual({
      testPreference: 'value',
    });
    expect(typeof result.current.reRenderTimeEntrySetting).toBe('function');
    expect(typeof result.current.updateErrorMessage).toBe('function');
    expect(typeof result.current.refetchQlSettings).toBe('function');
    expect(result.current.refetchQlSettings).toBe(mockRefetch);
  });

  it('correctly reflects loading states in context values', async () => {
    const mockRefetch = jest.fn();
    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: { testData: 'initial' },
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });
    (useGetEntitlements as jest.Mock).mockReturnValue({
      data: [{ id: 'test-entitlement' }],
      loading: false,
    });
    (useGetPreferences as jest.Mock).mockReturnValue({
      data: { testPreference: 'initial' },
      loading: false,
      error: false,
    });

    const { result, rerender } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());

    expect(result.current.isQLSettingsLoading).toBe(false);
    expect(result.current.entitlementsLoading).toBe(false);
    expect(result.current.v3PreferencesLoading).toBe(false);

    act(() => result.current.reRenderTimeEntrySetting('test message'));

    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: { testData: 'loading' },
      loading: true,
      error: undefined,
      refetch: mockRefetch,
    });
    (useGetPreferences as jest.Mock).mockReturnValue({
      data: { testPreference: 'loading' },
      loading: true,
      error: false,
    });
    rerender();

    expect(result.current.isQLSettingsLoading).toBe(true);
    expect(result.current.entitlementsLoading).toBe(false);
    expect(result.current.v3PreferencesLoading).toBe(true);
    expect(result.current.QLData).toEqual({ testData: 'loading' });
    expect(result.current.entitlements).toEqual([{ id: 'test-entitlement' }]);
    expect(result.current.v3PreferencesData).toEqual({
      testPreference: 'loading',
    });
    expect(result.current.errorMessage).toBe('test message');
    expect(result.current.isRenderTimeEntry).toBe(true);
  });

  it('handles error states correctly', async () => {
    const testError = 'Test Error';
    (useGetQLSettings as jest.Mock).mockReturnValue({
      qlSettings: {},
      loading: false,
      error: testError,
      refetch: jest.fn(),
    });
    (useGetPreferences as jest.Mock).mockReturnValue({
      data: {},
      loading: false,
      error: true,
    });

    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current.QLSettingsError).toBe(testError);
    expect(result.current.v3PreferencesError).toBe(true);
  });

  it('updates error message correctly', async () => {
    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    const testErrorMessage = 'Test Error Message';
    act(() => result.current.updateErrorMessage(testErrorMessage));
    expect(result.current.errorMessage).toBe(testErrorMessage);
  });

  it('resets initialRender when QLSettings loading completes', async () => {
    const mockRefetch = jest.fn();
    const loadingState = false;
    const mockQLSettings = {
      qlSettings: {},
      loading: loadingState,
      error: undefined,
      refetch: mockRefetch,
    };
    (useGetQLSettings as jest.Mock).mockReturnValue(mockQLSettings);

    const { result, rerender } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());

    act(() => result.current.reRenderTimeEntrySetting('Test Message'));
    expect(result.current.isRenderTimeEntry).toBe(true);

    mockQLSettings.loading = true;
    rerender();
    mockQLSettings.loading = false;
    rerender();

    await waitFor(() => expect(result.current.isRenderTimeEntry).toBe(false));
  });

  it('correctly identifies UK locale', async () => {
    (useSandbox as jest.Mock).mockReturnValue(createMockSandbox('en-gb'));
    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    await waitFor(() => expect(result.current.isUKLocale).toBe(true));
  });

  it('correctly identifies non-UK locale', async () => {
    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    await waitFor(() => expect(result.current.isUKLocale).toBe(false));
  });

  it('handles missing locale with default value', async () => {
    const noLocaleMockSandbox = createMockSandbox();
    noLocaleMockSandbox.appContext.getLocalizationInfo.mockReturnValue({});
    (useSandbox as jest.Mock).mockReturnValue(noLocaleMockSandbox);

    const { result } = renderContextHook();
    await waitFor(() => expect(result.current).toBeDefined());
    await waitFor(() => expect(result.current.isUKLocale).toBe(false));
    expect(
      noLocaleMockSandbox.appContext.getLocalizationInfo,
    ).toHaveBeenCalled();
  });

  it('handles null getLocalizationInfo response', async () => {
    const nullResponseMockSandbox = createMockSandbox();
    nullResponseMockSandbox.appContext.getLocalizationInfo.mockReturnValue(
      null,
    );
    (useSandbox as jest.Mock).mockReturnValue(nullResponseMockSandbox);

    const { result } = renderContextHook();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Cannot read properties of null');
    expect(
      nullResponseMockSandbox.appContext.getLocalizationInfo,
    ).toHaveBeenCalled();
  });

  describe('Approval Settings Integration', () => {
    it('provides approval settings data correctly', async () => {
      const mockApprovalSettings = {
        employee: {
          approvalEnabled: {
            meta: {
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
          submissionRequired: {
            meta: {
              version: '1',
              createdAt: '',
              updatedAt: '',
              createdBy: '',
              updatedBy: '',
            },
            value: true,
          },
        },
      };

      (useGetApprovalSettings as jest.Mock).mockReturnValue({
        approvalSettings: mockApprovalSettings,
        loading: false,
        error: '',
        refetch: jest.fn(),
      });
      const { result } = renderContextHook();
      await waitFor(() => expect(result.current).toBeDefined());

      expect(result.current.approvalSettings).toEqual(mockApprovalSettings);
      expect(result.current.approvalSettingsLoading).toBe(false);
      expect(result.current.approvalSettingsError).toBe('');
      expect(typeof result.current.refetchApprovalSettings).toBe('function');
    });

    // it('handles approval settings loading state', async () => {
    //   (useGetApprovalSettings as jest.Mock).mockReturnValue({
    //     approvalSettings: null,
    //     loading: true,
    //     error: '',
    //     refetch: jest.fn(),
    //   });

    //   const wrapper = ({ children }: { children: React.ReactNode }) => (
    //     <TimeTrackingSettingsProvider>{children}</TimeTrackingSettingsProvider>
    //   );

    //   const { result } = renderHook(() => useTimeTrackingSettingsContext(), {
    //     wrapper,
    //   });

    //   await waitFor(() => {
    //     expect(result.current).toBeDefined();
    //   });

    //   expect(result.current.approvalSettings).toBeNull();
    //   expect(result.current.approvalSettingsLoading).toBe(true);
    //   expect(result.current.approvalSettingsError).toBe('');
    // });

    it('handles approval settings error state', async () => {
      const testError = 'Failed to load approval settings';
      (useGetApprovalSettings as jest.Mock).mockReturnValue({
        approvalSettings: null,
        loading: false,
        error: testError,
        refetch: jest.fn(),
      });
      const { result } = renderContextHook();
      await waitFor(() => expect(result.current).toBeDefined());

      expect(result.current.approvalSettings).toBeNull();
      expect(result.current.approvalSettingsLoading).toBe(false);
      expect(result.current.approvalSettingsError).toBe(testError);
    });

    it('provides refetch functionality for approval settings', async () => {
      const mockRefetch = jest.fn().mockResolvedValue(undefined);
      (useGetApprovalSettings as jest.Mock).mockReturnValue({
        approvalSettings: null,
        loading: false,
        error: '',
        refetch: mockRefetch,
      });
      const { result } = renderContextHook();
      await waitFor(() => expect(result.current).toBeDefined());

      await act(async () => {
        await result.current.refetchApprovalSettings?.();
      });
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Loading Spinner Display', () => {
    it('shows loading spinner when entitlementsLoading is true', async () => {
      setupDefaultMocks();
      resetUxPreferences();
      (useGetEntitlements as jest.Mock).mockReturnValue({
        data: [],
        loading: true,
      });

      const { queryByTestId } = render(
        <TimeTrackingSettingsProvider>
          <TestComponent />
        </TimeTrackingSettingsProvider>,
      );
      expect(queryByTestId('content')).not.toBeInTheDocument();
    });

    it('shows loading spinner when isQLSettingsLoading is true and isRenderTimeEntry is false', async () => {
      setupDefaultMocks();
      resetUxPreferences();
      (useGetQLSettings as jest.Mock).mockReturnValue({
        qlSettings: {},
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      });

      const { queryByTestId } = render(
        <TimeTrackingSettingsProvider>
          <TestComponent />
        </TimeTrackingSettingsProvider>,
      );
      expect(queryByTestId('content')).not.toBeInTheDocument();
    });

    it('shows content when all loading conditions are false', async () => {
      setupDefaultMocks();
      resetUxPreferences();

      const { queryByTestId } = render(
        <TimeTrackingSettingsProvider>
          <TestComponent />
        </TimeTrackingSettingsProvider>,
      );
      await waitFor(() => expect(queryByTestId('content')).toBeInTheDocument());
    });

    it('shows content when approval settings loading completes', async () => {
      setupDefaultMocks();
      resetUxPreferences();
      (useGetApprovalSettings as jest.Mock).mockReturnValue({
        approvalSettings: null,
        loading: true,
        error: '',
        refetch: jest.fn(),
      });

      const { queryByTestId, rerender } = render(
        <TimeTrackingSettingsProvider>
          <TestComponent />
        </TimeTrackingSettingsProvider>,
      );
      expect(queryByTestId('content')).not.toBeInTheDocument();

      (useGetApprovalSettings as jest.Mock).mockReturnValue({
        approvalSettings: { employee: { approvalEnabled: { value: true } } },
        loading: false,
        error: '',
        refetch: jest.fn(),
      });
      rerender(
        <TimeTrackingSettingsProvider>
          <TestComponent />
        </TimeTrackingSettingsProvider>,
      );
      await waitFor(() => expect(queryByTestId('content')).toBeInTheDocument());
    });
  });
});

describe('UX Preference Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetUxPreferences();
    setupDefaultMocks(createMockSandbox());
    mockLoadPreferences.mockResolvedValue(undefined);
    mockSetPreferences.mockResolvedValue(undefined);
  });

  it('provides error handling infrastructure for UX preferences', () => {
    setupDefaultMocks();
    resetUxPreferences();

    const { result } = renderContextHook();
    expect(result.current).toBeDefined();
    expect(result.current.sandbox.logger.error).toBeDefined();
    expect(typeof result.current.sandbox.logger.error).toBe('function');
    expect(typeof result.current.updateErrorMessage).toBe('function');
  });

  //   it('logs error and prevents infinite retry if getPreference throws (catch block coverage)', async () => {
  //     Object.defineProperty(window, 'location', { value: { ...window.location, search: '?p=time' }, writable: true });
  //     const mockSandbox = createMockSandbox();
  //     setupDefaultMocks(mockSandbox);
  //     resetUxPreferences();
  //     const thrownError = new Error('getPreference failed');
  //     mockGetPreference.mockImplementation(() => Promise.reject(thrownError));

  //     renderContextHook();
  //     await waitFor(() => {
  //       expect(mockSandbox.logger.error).toHaveBeenCalledWith(
  //         'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TimeTrackingSettingsContext Error="Failed to load UX preferences"',
  //         { error: thrownError },
  //       );
  //     }, { timeout: 10000 });

  //     mockGetPreference.mockClear();
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //     expect(mockGetPreference).not.toHaveBeenCalled();
  //   });
  // });
});
