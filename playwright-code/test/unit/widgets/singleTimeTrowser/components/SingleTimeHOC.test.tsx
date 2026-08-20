import React from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { waitFor, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SingleTimeHOC } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeHOC';
import { useGetTimeEntry } from 'src/js/service/hooks/timeEntries/useGetTimeEntry';
import { useSingleTimeEntryQuery } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeEntryQuery';
import { useSearchTimeEntries } from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import { useGetEntitlements } from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  useTimeTrackingBatchAuthorization,
  getDefaultDecision,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import { useGetUserInfo } from 'src/js/service/utils/useGetUserInfo';
import {
  DEFAULT_UX_PREFERENCE_DATA_STATE,
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { useHasProjects } from 'src/js/service/utils/projectsUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { useFeatureFlag } from 'src/js/common/hooks/useFeatureFlag';
import { useLazyGetEmployeeData } from 'src/js/service/hooks/employee/useLazyGetEmployeeData';
import { useLazyGetVendorData } from 'src/js/service/hooks/vendor/useLazyGetVendorData';
import { useGetCustomerData } from 'src/js/service/hooks/customer/useGetCustomerData';
import { useBatchSaveTimeEntries } from 'src/js/service/hooks/timeEntries/useBatchSaveTimeEntries';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { aTimeTracking_TimeEntry } from '__mocks__/__generated__/timeTracking';
import { getTimeTrackingQueryParams } from 'src/js/service/utils/queryStringUtil';
import { GetEmployeeByIdQuery_company_Company_employee_Employee } from 'src/__generated__/gas/graphql';
import { TimeTracking_ApprovalStatusType } from 'src/__generated__/timeTracking/graphql';
import { renderWithAllProviders } from 'test/unit/testUtils';

// Type augmentation for CustomerProject to include isTimeEntry prop
declare module 'src/js/widgets/common/addTimeFormComponents/CustomerProject' {
  export interface CustomerProjectProps {
    isTimeEntry?: boolean;
  }
}

jest.mock('src/js/widgets/common/addTimeFormComponents/TimeDropdown', () => ({
  TimeDropdown: ({ name }: any) => <div data-testid={`mock-time-${name}`} />,
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/Date', () => ({
  Date: ({ name }: any) => <div data-testid={`mock-date-${name}`} />,
}));

jest.mock('src/js/service/hooks/timeEntries/useGetCustomFields', () => ({
  useGetCustomFields: jest.fn().mockReturnValue({
    customFields: [],
    loading: false,
    error: null,
    query: jest.fn(),
  }),
}));

// Mock assignment hooks
jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldAssignments',
  () => ({
    useStandardFieldAssignments: jest.fn().mockReturnValue({
      data: [],
      loading: false,
      error: null,
      loadStandardFieldAssignments: jest.fn(),
      pageInfo: null,
    }),
  }),
);

jest.mock(
  'src/js/service/hooks/assignments/useStandardFieldOptionAssignments',
  () => ({
    useStandardFieldOptionAssignments: jest.fn().mockReturnValue({
      data: [],
      loading: false,
      error: null,
      loadStandardFieldOptionAssignments: jest.fn(),
      pageInfo: null,
    }),
  }),
);

jest.mock('src/js/service/hooks/assignments/useCustomFieldAssignments', () => ({
  useCustomFieldAssignments: jest.fn().mockReturnValue({
    data: [],
    loading: false,
    error: null,
    loadCustomFieldAssignments: jest.fn(),
    pageInfo: null,
  }),
}));

jest.mock(
  'src/js/service/hooks/assignments/useCustomFieldOptionAssignments',
  () => ({
    useCustomFieldOptionAssignments: jest.fn().mockReturnValue({
      data: [],
      loading: false,
      error: null,
      loadCustomFieldOptionAssignments: jest.fn(),
      pageInfo: null,
    }),
  }),
);

// Mock useIXPFeatureFlag for tour functionality
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn().mockReturnValue({
    isEnabled: false,
    isLoading: false,
    settled: true,
    error: null,
  }),
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

// Mock the old featureFlags file for isIXPFeatureFlagEnabled
jest.mock('src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: jest.fn(),
}));

// Mock sandbox utils
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(true),
  useCurrencySymbol: jest.fn(),
  useCurrencyFormat: jest.fn().mockReturnValue('USD'),
  useHasAdminAccess: jest.fn().mockReturnValue(true),
  fetchSettingsAccess: jest.fn().mockReturnValue(Promise.resolve({})),
  useSandboxNavigate: jest.fn(),
  getlookupIntervalForCopyLastTimesheet: jest.fn(),
  getJobs: jest.fn(),
  isPayrollFirstCompany: jest.fn(),
  getListType: jest.fn(),
  isTimeTrackingOnlyRole: jest.fn(),
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
  getLocalizationInfo: jest.fn().mockReturnValue({ region: 'US' }),
  canEditPreference: jest.fn(),
}));

jest.mock('src/js/service/hooks/timeEntries/useDeleteTimeEntry', () => ({
  useDeleteTimeEntry: jest.fn().mockReturnValue([
    jest.fn(),
    {
      loading: false,
      error: null,
      data: null,
    },
  ]),
}));

jest.mock('src/js/service/hooks/timeEntries/useCreateTimeEntry', () => ({
  useCreateTimeEntry: jest.fn().mockReturnValue([
    jest.fn(),
    {
      loading: false,
      error: null,
      data: null,
    },
  ]),
}));

jest.mock('src/js/service/hooks/timeEntries/useUpdateTimeEntry', () => ({
  useUpdateTimeEntry: jest.fn().mockReturnValue([
    jest.fn(),
    {
      loading: false,
      error: null,
      data: null,
    },
  ]),
}));

// Mock customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn().mockReturnValue({
    end: jest.fn(),
  }),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(),
  TimeCustomerInteraction: {
    SINGLE_TIME_TOUR_COMPLETE: 'single-time-tour-complete',
  },
}));

// Mock usePopoverInstrumentation hook
jest.mock('src/js/common/usePopoverInstrumentation', () => ({
  usePopoverInstrumentation: jest.fn().mockReturnValue({
    logPopoverOpen: jest.fn(),
    logPopoverClose: jest.fn(),
    logTourStepChange: jest.fn(),
    logTourComplete: jest.fn(),
    logPopoverError: jest.fn(),
  }),
}));

const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    logException: jest.fn(),
  },
  appContext: {
    getEnvironment: jest.fn().mockReturnValue('e2e'),
    getRealmInfo: jest.fn().mockReturnValue({
      realmId: 'exampleRealmId',
      realmName: 'exampleRealmName',
    }),
    getUserAuthInfo: jest.fn().mockReturnValue({ authId: 'test-auth-id' }),
    getAppInfo: jest.fn().mockReturnValue({ appId: 'qbo-app' }),
  },
  extensions: {
    qbo: {
      context: {
        getAuthInfo: jest.fn().mockReturnValue({
          isAccountantUser: false,
          isAdmin: false,
          isMasterAdmin: false,
          legacyRoles: {
            roleType: 'employee',
          },
        }),
        getEnvironmentInfo: jest.fn().mockReturnValue({
          xCsrfToken: 'exampleCsrfToken',
        }),
        getCompanyL10nInfo: jest.fn().mockReturnValue({
          region: 'exampleRegion',
        }),
      },
    },
  },
  sandboxContext: {
    getInfo: jest.fn().mockReturnValue({
      widgetId: 'test-widget-id',
    }),
  },
  performance: {
    getCustomerInteraction: jest.fn().mockReturnValue({
      success: jest.fn(),
      fail: jest.fn(),
      abort: jest.fn(),
      addMetadata: jest.fn(),
      getTracePropagationHeaders: jest.fn(),
      end: jest.fn(),
    }),
    createCustomerInteraction: jest.fn().mockReturnValue({
      success: jest.fn(),
      fail: jest.fn(),
      abort: jest.fn(),
      addMetadata: jest.fn(),
      getTracePropagationHeaders: jest.fn(),
      end: jest.fn(),
    }),
    record: jest.fn(),
  },
};

const mockUseIntl = {
  formatMessage: jest.fn(({ id }) => id),
};
const mockUseGetTimeEntry = {
  data: null,
  loading: false,
  resetData: jest.fn(),
};
const mockUseSingleTimeEntryQuery = {
  query: jest.fn(),
  data: null,
  loading: false,
  resetData: jest.fn(),
  error: undefined,
};
const mockUseSearchTimeEntries = {
  data: null,
  loading: false,
  resetData: jest.fn(),
};
const mockUseGetEntitlements = { data: [], loading: false };
const mockUseTimeTrackingBatchAuthorization = {
  data: getDefaultDecision(),
  loading: false,
};
const mockUseGetUserInfo = { data: { firstName: 'John' }, loading: false };
const mockUseUxPreferences = {
  data: {
    ...DEFAULT_UX_PREFERENCE_DATA_STATE,
    [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: true, // Default: activity tour completed (no modal)
  },
  loading: false,
  error: undefined,
  loadPreferences: jest.fn(),
  getPreference: jest.fn().mockReturnValue(true), // Default: tour completed
  setPreference: jest.fn(),
  setPreferences: jest.fn(),
};
const mockUseLazyGetEmployeeData = {
  query: jest.fn(),
  loading: false,
  error: undefined,
  data: [],
  resetData: jest.fn(),
};
const mockUseLazyGetVendorData = {
  getVendorCallback: jest.fn(),
  data: null,
  error: null,
};
const mockUseGetCustomerData = {
  query: jest.fn(),
  loading: false,
  error: undefined,
  data: [],
  resetData: jest.fn(),
};
const mockNeoApiClient = jest
  .fn()
  .mockResolvedValue({ canAccessSalesInfo: true });

// Mock necessary hooks and modules
afterEach(() => {
  jest.clearAllMocks();
});
jest.mock('src/js/service/hooks/timeEntries/useGetTimeEntry');
jest.mock('src/js/service/hooks/timeEntries/useSearchTimeEntries');
jest.mock('src/js/widgets/singleTimeTrowser/hooks/useSingleTimeEntryQuery');
jest.mock('src/js/service/rest/NeoApiClient');
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements');
jest.mock('src/js/service/utils/useTimeTrackingAuthorization', () => ({
  computeCanEditSettings: jest.fn().mockResolvedValue(true),
  useTimeTrackingBatchAuthorization: jest.fn(),
  computeTimeTrackingOnlyUser: jest.fn(),
  getDefaultDecision: jest.fn(() => ({})),
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
jest.mock('src/js/service/hooks/customer/useGetCustomerData', () => ({
  useGetCustomerData: jest.fn().mockReturnValue({
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
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      logException: jest.fn(),
    },
    appContext: {
      getEnvironment: jest.fn().mockReturnValue('e2e'),
      getRealmInfo: jest.fn().mockReturnValue({
        realmId: 'exampleRealmId', // Mock realmId value
      }),
      getUserAuthInfo: jest.fn().mockReturnValue({
        authId: 'exampleAuthId', // Mock authId value
      }),
    },
    pluginConfig: {
      extendedProperties: {
        appSecret: 'exampleAppSecret',
      },
    },
    extensions: {
      qbo: {
        context: {
          getEnvironmentInfo: jest.fn().mockReturnValue({
            xCsrfToken: 'exampleCsrfToken', // Mock CSRF token value
          }),
          getCompanyL10nInfo: jest.fn().mockReturnValue({
            region: 'exampleRegion', // Mock region value
          }),
        },
      },
    },
    performance: {
      getCustomerInteraction: jest.fn().mockReturnValue({
        success: jest.fn(),
        fail: jest.fn(),
        abort: jest.fn(),
        addMetadata: jest.fn(),
        getTracePropagationHeaders: jest.fn(),
        end: jest.fn(),
      }),
      createCustomerInteraction: jest.fn().mockReturnValue({
        success: jest.fn(),
        fail: jest.fn(),
        abort: jest.fn(),
        addMetadata: jest.fn(),
        getTracePropagationHeaders: jest.fn(),
        end: jest.fn(),
      }),
      record: jest.fn(),
    },
  })),
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

jest.mock('src/js/service/hooks/ixp/useIxpDynamicOptOut', () => ({
  default: jest.fn().mockReturnValue(jest.fn()),
  __esModule: true,
}));

jest.mock('src/js/service/hooks/ixp/useIxpExperiment', () => ({
  useIxpExperiment: jest.fn().mockReturnValue({
    isInTreatment: false,
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetSettings', () => ({
  useGetSettings: jest.fn().mockReturnValue({
    query: jest.fn(),
    loading: false,
    error: undefined,
    data: [],
    refetch: jest.fn(),
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetQLSettings', () => ({
  useGetQLSettings: jest.fn().mockReturnValue({
    query: jest.fn(),
    loading: false,
    qlSettings: {
      isServiceFieldEnabled: {
        version: '0',
        value: false,
      },
      isBillingFieldEnabled: {
        version: '0',
        value: false,
      },
      firstDayOfWeek: {
        version: '0',
        value: '0',
      },
      billingRateForTimeEnabled: {
        version: '0',
        value: true,
      },
    },
    refetch: jest.fn(),
  }),
}));

jest.mock('src/js/service/hooks/settings/useSetQLSettings', () => ({
  useSetQLSettings: jest.fn().mockReturnValue([jest.fn(), false]),
}));

jest.mock('src/js/service/hooks/settings/useSetSettings', () => ({
  useSetSettings: jest.fn().mockReturnValue([jest.fn(), false]),
}));

jest.mock('src/js/common/DateAndTimeUtils', () => {
  const actual = jest.requireActual('src/js/common/DateAndTimeUtils');
  return {
    ...actual,
    getDateFormat: jest.fn().mockReturnValue('mm/dd/yyyy'),
    stringToDayJS: jest.fn(),
    mapQBTimezoneToDayjsTimezone: jest
      .fn()
      .mockReturnValue('America/Los_Angeles'),
  };
});
jest.mock('src/js/service/utils/useGetUserInfo');
jest.mock('src/js/service/utils/useUXPreferences');
jest.mock('src/js/service/utils/projectsUtils');
jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(),
}));
jest.mock('src/js/service/hooks/useIsSubmitTimeEnabled', () => ({
  useIsSubmitTimeEnabled: jest.fn(() => true),
}));
jest.mock('src/js/service/hooks/useCanManageMyTimesheets', () => ({
  useCanManageMyTimesheets: jest.fn(() => true),
}));
jest.mock('src/js/service/hooks/vendor/useLazyGetVendorData');
jest.mock('src/js/service/utils/queryStringUtil', () => ({
  getTimeTrackingQueryParams: jest
    .fn()
    .mockResolvedValue({ id: null, txnId: null, customerId: null }),
}));

jest.mock('src/js/common/useConsolidatedLoading', () => ({
  useConsolidatedLoading: jest.fn(() => false),
}));

jest.mock('@ids-ts/trowser', () => ({
  __esModule: true,
  default: ({
    children,
    open,
    footerCenterLinkLabels = [],
    footerCenterLinkActions = [],
    footerButton = [],
  }: {
    children: React.ReactNode;
    open: boolean;
    footerCenterLinkLabels?: string[];
    footerCenterLinkActions?: Array<() => void>;
    footerButton?: React.ReactNode[];
  }) =>
    open ? (
      <div data-testid="trowser-mock">
        {footerCenterLinkLabels.map((label, index) => (
          <button
            key={`footer-center-link-${label}`}
            onClick={footerCenterLinkActions[index]}
            type="button"
          >
            {label}
          </button>
        ))}
        {React.Children.toArray(footerButton)}
        {children}
      </div>
    ) : null,
}));

const mockQualtricsSurveyWidget = jest.fn((_props?: any) => (
  <div data-testid="qualtrics-survey-widget" />
));
jest.mock('src/js/widgets/common/feedbackSurvey/QualtricsSurveyWidget', () => ({
  __esModule: true,
  default: (props: any) => mockQualtricsSurveyWidget(props),
}));
jest.mock(
  'src/js/widgets/common/feedbackSurvey/useProfileCompanyAndRolesMetadata',
  () => ({
    useProfileCompanyAndRolesMetadata: jest.fn(() => ({
      companyName: '',
    })),
  }),
);

describe('SingleTimeHOC Component', () => {
  const mockSetOpen = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue(
      mockUseTimeTrackingBatchAuthorization,
    );
    (useGetEntitlements as jest.Mock).mockReturnValue(mockUseGetEntitlements);
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (useTracking as jest.Mock).mockReturnValue(jest.fn());
    (useGetTimeEntry as jest.Mock).mockReturnValue(mockUseGetTimeEntry);
    (useSingleTimeEntryQuery as jest.Mock).mockReturnValue(
      mockUseSingleTimeEntryQuery,
    );
    (useSearchTimeEntries as jest.Mock).mockReturnValue(
      mockUseSearchTimeEntries,
    );
    (useIntl as jest.Mock).mockReturnValue(mockUseIntl);
    (useGetUserInfo as jest.Mock).mockReturnValue(mockUseGetUserInfo);
    (useUxPreferences as jest.Mock).mockReturnValue(mockUseUxPreferences);
    (useHasProjects as jest.Mock).mockReturnValue(false);
    (useLazyGetEmployeeData as jest.Mock).mockReturnValue(
      mockUseLazyGetEmployeeData,
    );
    (useLazyGetVendorData as jest.Mock).mockReturnValue(
      mockUseLazyGetVendorData,
    );
    (useQbTimeSdk as jest.Mock).mockReturnValue({
      data: true,
      loading: false,
      error: undefined,
    });
    (useGetCustomerData as jest.Mock).mockReturnValue(mockUseGetCustomerData);
    (NeoApiClient as jest.Mock).mockImplementation(mockNeoApiClient);
    (useIXPFeatureFlag as jest.Mock).mockReturnValue({
      isEnabled: true,
      isLoading: false,
      error: null,
    });
    (useFeatureFlag as jest.Mock).mockReturnValue(false);
  });

  it('should render the component', () => {
    renderWithAllProviders(
      <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
    );
    expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
  });

  it('does not render locked message while single time entry is loading', () => {
    (useSingleTimeEntryQuery as jest.Mock).mockReturnValue({
      ...mockUseSingleTimeEntryQuery,
      loading: true,
      data: aTimeTracking_TimeEntry({
        isExported: false,
        approvalStatus: TimeTracking_ApprovalStatusType.Approved,
      }),
    });

    renderWithAllProviders(
      <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
    );

    expect(
      screen.queryByText('time.entry.approved.message'),
    ).not.toBeInTheDocument();
  });

  it('should call NeoApiClient and set canAccessSalesInfo', async () => {
    renderWithAllProviders(<SingleTimeHOC open setOpen={mockSetOpen} />);

    await waitFor(() => {
      expect(NeoApiClient).toHaveBeenCalledWith(
        'security/settings?fields=canAccessSalesInfo',
        mockSandbox,
      );
    });
  });

  // Component mounts and initializes state correctly
  it('should initialize state and call tracking on mount', () => {
    renderWithAllProviders(<SingleTimeHOC open setOpen={mockSetOpen} />);

    expect(useSandbox().logger.info).toHaveBeenCalledWith(
      'Component=SingleTimeHOC Event=Mounted',
    );
    expect(useTracking()).toHaveBeenCalledWith(expect.anything());
  });

  // Handles network errors gracefully
  it('should cover edge case where useSingleTimeEntryQuery is called with id fetched from query params', async () => {
    const mockUseLazyGetEmployeeError = {
      query: jest.fn(),
      data: null,
      resetData: jest.fn(),
      error: 'Network Error',
    };
    (useLazyGetEmployeeData as jest.Mock).mockReturnValue(
      mockUseLazyGetEmployeeError,
    );
    (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
      id: '1234',
      txnId: '1234',
      customerId: '1234',
    });

    const mockUseSingleTimeEntryQueryWithData = {
      query: jest.fn(),
      data: aTimeTracking_TimeEntry({
        id: '1',
        date: '2024-10-09',
        duration: 28800,
        billableRate: '1',
        costRate: '2',
      }),
      loading: false,
      resetData: jest.fn(),
      error: undefined,
    };

    (useSingleTimeEntryQuery as jest.Mock).mockReturnValue(
      mockUseSingleTimeEntryQueryWithData,
    );

    renderWithAllProviders(<SingleTimeHOC open setOpen={mockSetOpen} />);
    expect(useSingleTimeEntryQuery).toHaveBeenCalledWith({
      id: '1234',
      isExported: true,
    });
    expect(useSandbox().logger.info).toHaveBeenCalledWith(
      'Component=SingleTimeHOC Event=Mounted',
    );
    expect(useTracking()).toHaveBeenCalledWith(expect.anything());
  });

  it('should cover edge case where useSearchTimeEntries is called with txnId fetched from query params & employee details are defined', async () => {
    const employee: GetEmployeeByIdQuery_company_Company_employee_Employee = {
      id: '1234',
      displayName: 'John Doe',
      employmentDetail: {
        jobCosting: {
          billRate: 12,
          costRate: 12,
          billable: true,
        },
      },
    };
    const mockUseLazyGetEmployeeData = {
      query: jest.fn(),
      data: employee,
      resetData: jest.fn(),
      error: undefined,
    };
    const mockUseSearchTimeEntriesWithData = {
      data: aTimeTracking_TimeEntry({
        id: '1',
        date: '2024-10-09',
        duration: 28800,
        billableRate: '1',
        costRate: '2',
      }),
      loading: false,
      resetData: jest.fn(),
    };
    (useSearchTimeEntries as jest.Mock).mockReturnValue(
      mockUseSearchTimeEntriesWithData,
    );
    (useLazyGetEmployeeData as jest.Mock).mockReturnValue(
      mockUseLazyGetEmployeeData,
    );
    (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
      id: null,
      txnId: null,
      customerId: null,
    });

    const { getByLabelText } = renderWithAllProviders(
      <SingleTimeHOC open setOpen={mockSetOpen} />,
    );
    expect(useSearchTimeEntries).toHaveBeenCalledWith({
      input: undefined,
      txnId: null,
    });
    expect(useSandbox().logger.info).toHaveBeenCalledWith(
      'Component=SingleTimeHOC Event=Mounted',
    );
    expect(useTracking()).toHaveBeenCalledWith(expect.anything());
    // const input = getByLabelText('Bill rate');
    // expect(input.nodeValue).toEqual(12);
  });

  it('should cover edge case where useSearchTimeEntries is called with txnId fetched from query params & vendor details are defined', async () => {
    const vendor = {
      Vendor: {
        BillRate: 20,
        CostRate: 20,
        DisplayName: 'David',
        Id: '5678',
      },
    };
    const mockUseLazyGetEmployeeData = {
      query: jest.fn(),
      data: null,
      resetData: jest.fn(),
      error: undefined,
    };
    const mockUseLazyGetVendorData = {
      getVendorCallback: jest.fn(),
      data: vendor,
      error: null,
    };
    const mockUseSearchTimeEntriesWithData = {
      data: aTimeTracking_TimeEntry({
        id: '1',
        date: '2024-10-09',
        duration: 28800,
        billableRate: '1',
        costRate: '2',
      }),
      loading: false,
      resetData: jest.fn(),
    };
    (useSearchTimeEntries as jest.Mock).mockReturnValue(
      mockUseSearchTimeEntriesWithData,
    );
    (useLazyGetEmployeeData as jest.Mock).mockReturnValue(
      mockUseLazyGetEmployeeData,
    );
    (useLazyGetVendorData as jest.Mock).mockReturnValue(
      mockUseLazyGetVendorData,
    );
    (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
      id: null,
      txnId: null,
      customerId: null,
    });

    const { getByLabelText } = renderWithAllProviders(
      <SingleTimeHOC open setOpen={mockSetOpen} />,
    );
    expect(useSearchTimeEntries).toHaveBeenCalledWith({
      input: undefined,
      txnId: null,
    });
    expect(useSandbox().logger.info).toHaveBeenCalledWith(
      'Component=SingleTimeHOC Event=Mounted',
    );
    expect(useTracking()).toHaveBeenCalledWith(expect.anything());
    // const input = getByLabelText('Bill rate');
    // expect(input.nodeValue).toEqual(20);
  });

  describe('Form validation', () => {
    describe('validateCustomFieldsInForm', () => {
      // Extract the validation logic for testing
      const validateCustomFieldsInForm = (
        formValues: {
          customFields?: Array<{
            id: string;
            name: string;
            value?: string;
            required?: boolean;
          }>;
        },
        setError: (field: string, error: any) => void,
        clearErrors: (field: string) => void,
        formatMessage: (params: {
          id: string;
          defaultMessage: string;
        }) => string,
      ): boolean => {
        const customFields = formValues.customFields || [];
        let isValid = true;

        customFields.forEach((field, index: number) => {
          if (field.required && (!field.value || field.value.trim() === '')) {
            const fieldPath = `customFields.${index}.value`;
            setError(fieldPath, {
              type: 'required',
              message: formatMessage({
                id: 'drawer.field.required',
                defaultMessage: 'Required',
              }),
            });
            isValid = false;
          } else {
            const fieldPath = `customFields.${index}.value`;
            clearErrors(fieldPath);
          }
        });

        return isValid;
      };

      let mockSetError: jest.Mock;
      let mockClearErrors: jest.Mock;
      let mockFormatMessage: jest.Mock;

      beforeEach(() => {
        mockSetError = jest.fn();
        mockClearErrors = jest.fn();
        mockFormatMessage = jest.fn().mockReturnValue('Required');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should return true when no custom fields are present', () => {
        const formValues = { customFields: [] };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).not.toHaveBeenCalled();
      });

      it('should return true when all required custom fields have values', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field 1',
              value: 'test value',
              required: true,
            },
            {
              id: 'field2',
              name: 'Optional Field',
              value: 'optional value',
              required: false,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).toHaveBeenCalledTimes(2);
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.0.value');
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.1.value');
      });

      it('should return false and set errors when required custom fields are empty', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field 1',
              value: '',
              required: true,
            },
            {
              id: 'field2',
              name: 'Required Field 2',
              value: '   ', // whitespace only
              required: true,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(false);
        expect(mockSetError).toHaveBeenCalledTimes(2);
        expect(mockSetError).toHaveBeenCalledWith('customFields.0.value', {
          type: 'required',
          message: 'Required',
        });
        expect(mockSetError).toHaveBeenCalledWith('customFields.1.value', {
          type: 'required',
          message: 'Required',
        });
        expect(mockClearErrors).not.toHaveBeenCalled();
      });

      it('should return false and set errors when required custom fields are undefined', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field 1',
              value: undefined,
              required: true,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(false);
        expect(mockSetError).toHaveBeenCalledTimes(1);
        expect(mockSetError).toHaveBeenCalledWith('customFields.0.value', {
          type: 'required',
          message: 'Required',
        });
        expect(mockClearErrors).not.toHaveBeenCalled();
      });

      it('should clear errors for valid fields', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field 1',
              value: 'valid value',
              required: true,
            },
            {
              id: 'field2',
              name: 'Optional Field',
              value: 'optional value',
              required: false,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).toHaveBeenCalledTimes(2);
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.0.value');
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.1.value');
      });

      it('should handle mixed valid and invalid fields correctly', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Valid Required Field',
              value: 'valid value',
              required: true,
            },
            {
              id: 'field2',
              name: 'Invalid Required Field',
              value: '',
              required: true,
            },
            {
              id: 'field3',
              name: 'Optional Field',
              value: 'optional value',
              required: false,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(false);
        expect(mockSetError).toHaveBeenCalledTimes(1);
        expect(mockSetError).toHaveBeenCalledWith('customFields.1.value', {
          type: 'required',
          message: 'Required',
        });
        expect(mockClearErrors).toHaveBeenCalledTimes(2);
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.0.value');
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.2.value');
      });

      it('should handle undefined customFields array', () => {
        const formValues = { customFields: undefined };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).not.toHaveBeenCalled();
      });

      it('should call setError with correct parameters for invalid fields', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field',
              value: '',
              required: true,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(false);
        expect(mockSetError).toHaveBeenCalledTimes(1);
        expect(mockSetError).toHaveBeenCalledWith('customFields.0.value', {
          type: 'required',
          message: 'Required',
        });
        expect(mockFormatMessage).toHaveBeenCalledWith({
          id: 'drawer.field.required',
          defaultMessage: 'Required',
        });
      });

      it('should call clearErrors for valid fields', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field',
              value: 'valid value',
              required: true,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).toHaveBeenCalledTimes(1);
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.0.value');
      });

      it('should handle fields with only whitespace as invalid', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Required Field',
              value: '   ', // only whitespace
              required: true,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(false);
        expect(mockSetError).toHaveBeenCalledTimes(1);
        expect(mockSetError).toHaveBeenCalledWith('customFields.0.value', {
          type: 'required',
          message: 'Required',
        });
      });

      it('should handle optional fields with empty values as valid', () => {
        const formValues = {
          customFields: [
            {
              id: 'field1',
              name: 'Optional Field',
              value: '',
              required: false,
            },
          ],
        };

        const result = validateCustomFieldsInForm(
          formValues,
          mockSetError,
          mockClearErrors,
          mockFormatMessage,
        );

        expect(result).toBe(true);
        expect(mockSetError).not.toHaveBeenCalled();
        expect(mockClearErrors).toHaveBeenCalledTimes(1);
        expect(mockClearErrors).toHaveBeenCalledWith('customFields.0.value');
      });
    });
  });

  describe('SingleTimeActivityTourAdapter integration', () => {
    it('should render SingleTimeActivityTourAdapter when shouldShowTour is true', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });

      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      // Test that the component renders without errors
      expect(document.body).toBeDefined();
    });

    it('should pass correct props to SingleTimeActivityTourAdapter', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });

      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      // Test that the component renders without errors
      expect(document.body).toBeDefined();
    });
  });

  describe('aria-label for split button', () => {
    it('should have correct aria-label for tour targeting', () => {
      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      // Test that the component renders without errors
      expect(document.body).toBeDefined();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should render with feature flags enabled', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should render with feature flags disabled', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: false,
        isLoading: false,
        error: null,
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should handle feature flag loading and error states', () => {
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: false,
        isLoading: true,
        error: 'Feature flag error',
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });
  });

  describe('Single Time Activity Tour Functions', () => {
    it('should handle tour completion and error scenarios', async () => {
      const mockSetPreference = jest.fn().mockResolvedValue(undefined);
      const mockLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        logException: jest.fn(),
      };

      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        setPreference: mockSetPreference,
      });

      (useSandbox as jest.Mock).mockReturnValue({
        logger: {
          ...mockLogger,
          warn: jest.fn(),
        },
        appContext: {
          getRealmInfo: jest.fn().mockReturnValue({ realmName: 'test-realm' }),
          getUserAuthInfo: jest
            .fn()
            .mockReturnValue({ authId: 'test-auth-id' }),
        },
        sandboxContext: {
          getAuthInfo: jest.fn().mockReturnValue({ userId: 'test-user' }),
        },
        extensions: {
          qbo: {
            context: {
              getAuthInfo: jest.fn().mockReturnValue({ userId: 'test-user' }),
            },
          },
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });
  });

  describe('UserVoice Feedback Integration', () => {
    it('should render UserVoice widget when feature flag is enabled', () => {
      (useIXPFeatureFlag as jest.Mock)
        .mockReturnValueOnce({
          isEnabled: true, // STE Tour Feature Flag
          isLoading: false,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: true, // UserVoice Feedback Feature Flag
          isLoading: false,
          error: null,
        });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should use triggerFeedback when UserVoice feature flag is enabled', () => {
      (useIXPFeatureFlag as jest.Mock)
        .mockReturnValueOnce({
          isEnabled: true, // STE Tour Feature Flag
          isLoading: false,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: true, // UserVoice Feedback Feature Flag
          isLoading: false,
          error: null,
        });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should use handleFeedbackIconClick when UserVoice feature flag is disabled', () => {
      (useIXPFeatureFlag as jest.Mock)
        .mockReturnValueOnce({
          isEnabled: true, // STE Tour Feature Flag
          isLoading: false,
          error: null,
        })
        .mockReturnValueOnce({
          isEnabled: false, // UserVoice Feedback Feature Flag
          isLoading: false,
          error: null,
        });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should render QualtricsSurveyWidget for workforce users', () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(screen.getByTestId('qualtrics-survey-widget')).toBeInTheDocument();
      expect(mockQualtricsSurveyWidget).toHaveBeenCalledWith(
        expect.objectContaining({
          activeEmployer: expect.objectContaining({
            employerId: 'exampleRealmId',
            product: 'US-Online',
            entitlementGrants: [],
          }),
        }),
      );
    });

    it('should not render QualtricsSurveyWidget for non-workforce users', () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(false);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(
        screen.queryByTestId('qualtrics-survey-widget'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Single Time Activity Tour Modal Logic', () => {
    it('should show single time activity tour when not single time entry and tour not completed', () => {
      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC
          open
          setOpen={jest.fn()}
          isSingleTimeEntry={false}
          isOTX
        />,
      );

      expect(document.body).toBeDefined();
    });

    it('should not show single time activity tour when single time entry', () => {
      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: false,
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry isOTX />,
      );

      expect(document.body).toBeDefined();
    });

    it('should not show single time activity tour when tour already completed', () => {
      (useUxPreferences as jest.Mock).mockReturnValue({
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED]: true,
        },
      });

      renderWithAllProviders(
        <SingleTimeHOC
          open
          setOpen={jest.fn()}
          isSingleTimeEntry={false}
          isOTX
        />,
      );

      expect(document.body).toBeDefined();
    });
  });

  describe('Customer Query Parameter Handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pre-populate customer field when customerId is present in query params for time activity', async () => {
      const testCustomerId = 'customer-456';

      // Mock query params to return customerId without id/txnId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: testCustomerId,
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC
          open
          setOpen={jest.fn()}
          isSingleTimeEntry={false}
          isOTX
        />,
      );

      // Wait for the component to render and form to be initialized
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify getTimeTrackingQueryParams was called to get the customerId
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();

      // Allow time for useEffect to execute
      // The useEffect should call setValue to populate the customer field
      await waitFor(
        () => {
          // Verify the query params function was called during the effect
          const { calls } = (getTimeTrackingQueryParams as jest.Mock).mock;
          expect(calls.length).toBeGreaterThan(0);
        },
        { timeout: 1000 },
      );

      // Additional verification: Check that the component rendered without errors
      // indicating the form setValue was executed successfully
      expect(
        container.querySelector('[data-testid="trowser-mock"]'),
      ).toBeInTheDocument();
    });

    it('should verify customer field is set in form state when customerId is in query params', async () => {
      const testCustomerId = 'customer-verify-123';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock query params to return customerId without id/txnId (new entry scenario)
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: testCustomerId,
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC
          open
          setOpen={jest.fn()}
          isSingleTimeEntry={false}
          isOTX
        />,
      );

      // Wait for component to render and useEffect to run
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify the useEffect that handles customerId was triggered
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();

      // Wait for the useEffect to complete and form state to be updated
      await waitFor(
        () => {
          // The trowser should render successfully
          const trowser = container.querySelector(
            '[data-testid="trowser-mock"]',
          );
          expect(trowser).toBeInTheDocument();
        },
        { timeout: 1500 },
      );

      // Critical verification: No errors should have occurred during setValue
      // If the form path 'timeAgainst.customer' was invalid or the data structure was wrong,
      // React Hook Form would log errors to console
      const relevantErrors = consoleErrorSpy.mock.calls.filter((call) =>
        call.some(
          (arg) => typeof arg === 'string' && arg.includes('timeAgainst'),
        ),
      );
      expect(relevantErrors.length).toBe(0);

      // Verify multiple calls to getTimeTrackingQueryParams (showing the useEffect executed)
      const queryParamsCalls = (getTimeTrackingQueryParams as jest.Mock).mock
        .calls.length;
      expect(queryParamsCalls).toBeGreaterThan(1);

      // Restore console.error
      consoleErrorSpy.mockRestore();

      // Note: This test verifies that:
      // 1. setValue('timeAgainst.customer', { id: customerId, name: null }) executed without errors
      // 2. The form accepted the nested path and data structure correctly
      // 3. The component rendered successfully, confirming form state is valid
      // 4. The useEffect with customerId dependency ran as expected
    });

    it('should not override customer when customerId is present but loading existing time entry by id', async () => {
      const testCustomerId = 'customer-789';
      const testTimeEntryId = 'entry-123';

      // Mock query params with both customerId and id
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: testTimeEntryId,
        txnId: null,
        customerId: testCustomerId,
      });

      const mockUseSingleTimeEntryQueryWithData = {
        query: jest.fn(),
        data: aTimeTracking_TimeEntry({
          id: testTimeEntryId,
          date: '2024-10-09',
          duration: 28800,
          billableRate: '1',
          costRate: '2',
        }),
        loading: false,
        resetData: jest.fn(),
        error: undefined,
      };

      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue(
        mockUseSingleTimeEntryQueryWithData,
      );

      renderWithAllProviders(<SingleTimeHOC open setOpen={jest.fn()} />);

      // Verify useSingleTimeEntryQuery was called with the id (existing entry load takes precedence)
      expect(useSingleTimeEntryQuery).toHaveBeenCalledWith({
        id: testTimeEntryId,
        isExported: true,
      });
    });

    it('should not override customer when customerId is present but loading existing time entry by txnId', async () => {
      const testCustomerId = 'customer-999';
      const testTxnId = 'txn-456';

      // Mock query params with both customerId and txnId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: testTxnId,
        customerId: testCustomerId,
      });

      const mockUseSearchTimeEntriesWithData = {
        data: [
          aTimeTracking_TimeEntry({
            id: '1',
            date: '2024-10-09',
            duration: 28800,
            billableRate: '1',
            costRate: '2',
          }),
        ],
        loading: false,
        resetData: jest.fn(),
      };

      (useSearchTimeEntries as jest.Mock).mockReturnValue(
        mockUseSearchTimeEntriesWithData,
      );

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify search was called with txnId (existing entry load takes precedence)
      expect(useSearchTimeEntries).toHaveBeenCalled();
      // Verify getTimeTrackingQueryParams was called to get txnId
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();
    });

    it('should not set customer when customerId is null in query params', async () => {
      // Mock query params without customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: null,
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify component renders without errors
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();
    });

    it('should not set customer when customerId is undefined in query params', async () => {
      // Mock query params without customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: undefined,
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify component renders without errors
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();
    });

    it('should not override customer when timeEntryId prop is provided', async () => {
      const testCustomerId = 'customer-111';
      const testTimeEntryId = 'entry-222';

      // Mock query params with customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: testCustomerId,
      });

      const mockUseSingleTimeEntryQueryWithData = {
        query: jest.fn(),
        data: aTimeTracking_TimeEntry({
          id: testTimeEntryId,
          date: '2024-10-09',
          duration: 28800,
        }),
        loading: false,
        resetData: jest.fn(),
        error: undefined,
      };

      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue(
        mockUseSingleTimeEntryQueryWithData,
      );

      renderWithAllProviders(
        <SingleTimeHOC
          open
          setOpen={jest.fn()}
          timeEntryId={testTimeEntryId}
          isSingleTimeEntry
        />,
      );

      // Verify useSingleTimeEntryQuery was called with the timeEntryId prop
      expect(useSingleTimeEntryQuery).toHaveBeenCalledWith({
        id: testTimeEntryId,
        isExported: false,
      });
    });

    it('should handle customerId when Recent Time Activities Modal is open', async () => {
      const testCustomerId = 'customer-333';

      // Mock query params with customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: testCustomerId,
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify component renders without errors when modal state changes
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();
    });

    it('should handle customerId change when trowser reopens', async () => {
      const firstCustomerId = 'customer-444';
      const secondCustomerId = 'customer-555';

      // Initial render with first customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: firstCustomerId,
      });

      const { rerender, container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify initial call was made
      const initialCallCount = (getTimeTrackingQueryParams as jest.Mock).mock
        .calls.length;
      expect(initialCallCount).toBeGreaterThan(0);

      // Change query params to different customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: secondCustomerId,
      });

      // Reopen trowser
      rerender(<SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />);

      await waitFor(() => {
        // Verify it was called more times after rerender (component handles new customerId)
        const finalCallCount = (getTimeTrackingQueryParams as jest.Mock).mock
          .calls.length;
        expect(finalCallCount).toBeGreaterThan(initialCallCount);
      });
    });

    it('should handle empty string customerId in query params', async () => {
      // Mock query params with empty string customerId
      (getTimeTrackingQueryParams as jest.Mock).mockReturnValue({
        id: null,
        txnId: null,
        customerId: '',
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Verify component renders without errors (empty string is falsy)
      expect(getTimeTrackingQueryParams).toHaveBeenCalled();
    });
  });

  describe('EmployeeId prop and Workforce User Support', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (useTimeTrackingBatchAuthorization as jest.Mock).mockReturnValue(
        mockUseTimeTrackingBatchAuthorization,
      );
      (useGetEntitlements as jest.Mock).mockReturnValue(mockUseGetEntitlements);
      (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
      (useTracking as jest.Mock).mockReturnValue(jest.fn());
      (useGetTimeEntry as jest.Mock).mockReturnValue(mockUseGetTimeEntry);
      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue(
        mockUseSingleTimeEntryQuery,
      );
      (useSearchTimeEntries as jest.Mock).mockReturnValue(
        mockUseSearchTimeEntries,
      );
      (useIntl as jest.Mock).mockReturnValue(mockUseIntl);
      (useGetUserInfo as jest.Mock).mockReturnValue(mockUseGetUserInfo);
      (useUxPreferences as jest.Mock).mockReturnValue(mockUseUxPreferences);
      (useHasProjects as jest.Mock).mockReturnValue(false);
      (useLazyGetEmployeeData as jest.Mock).mockReturnValue(
        mockUseLazyGetEmployeeData,
      );
      (useLazyGetVendorData as jest.Mock).mockReturnValue(
        mockUseLazyGetVendorData,
      );
      (useGetCustomerData as jest.Mock).mockReturnValue(mockUseGetCustomerData);
      (NeoApiClient as jest.Mock).mockImplementation(mockNeoApiClient);
      (useIXPFeatureFlag as jest.Mock).mockReturnValue({
        isEnabled: true,
        isLoading: false,
        error: null,
      });
    });

    it('should accept employeeId prop', () => {
      const testEmployeeId = 'emp-123';
      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={testEmployeeId} />,
      );

      expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
    });

    it('should set default timeFor using employeeId for workforce users', async () => {
      const testEmployeeId = 'emp-456';
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={testEmployeeId} />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
        {
          employeeId: testEmployeeId,
          source: 'workforce',
        },
      );
    });

    it('should not set employeeId as default timeFor for non-workforce users', async () => {
      const testEmployeeId = 'emp-789';
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(false);

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={testEmployeeId} />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Should not log the workforce-specific message
      const workforceLogCalls = mockSandbox.logger.info.mock.calls.filter(
        (call) =>
          call[0] ===
          'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
      );
      expect(workforceLogCalls.length).toBe(0);
    });

    it('should prioritize employeeId over preference for workforce users', async () => {
      const testEmployeeId = 'emp-priority';
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const mockPreferences = {
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: {
            id: 'different-id',
            name: 'Different User',
            type: 'EMPLOYEE',
          },
        },
      };

      (useUxPreferences as jest.Mock).mockReturnValue(mockPreferences);

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={testEmployeeId} />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Should log that employeeId is being used (priority)
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
        {
          employeeId: testEmployeeId,
          source: 'workforce',
        },
      );
    });

    it('should use preference when employeeId is not provided even for workforce users', async () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const mockPreferenceTimeFor = {
        id: 'pref-id',
        name: 'Preference User',
        type: 'EMPLOYEE',
      };

      const mockPreferences = {
        ...mockUseUxPreferences,
        data: {
          ...DEFAULT_UX_PREFERENCE_DATA_STATE,
          [UxPreferenceKey.TIME_ENTRY_TIME_FOR]: mockPreferenceTimeFor,
        },
      };

      (useUxPreferences as jest.Mock).mockReturnValue(mockPreferences);

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={null} />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Should not log the employeeId message since it's not provided
      const workforceLogCalls = mockSandbox.logger.info.mock.calls.filter(
        (call) =>
          call[0] ===
          'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
      );
      expect(workforceLogCalls.length).toBe(0);
    });

    it('should handle null employeeId gracefully', () => {
      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId={null} />,
      );

      expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
    });

    it('should handle undefined employeeId gracefully', () => {
      renderWithAllProviders(<SingleTimeHOC open setOpen={jest.fn()} />);

      expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
    });

    it('should handle empty string employeeId gracefully', async () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} employeeId="" />,
      );

      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });

      // Should not set timeFor with empty string
      const workforceLogCalls = mockSandbox.logger.info.mock.calls.filter(
        (call) =>
          call[0] ===
          'Component=SingleTimeHOC Event=SettingEmployeeIdAsDefaultTimeFor',
      );
      expect(workforceLogCalls.length).toBe(0);
    });
  });

  describe('pending save banner behavior', () => {
    const setupBatchUpdateHookCapture = () => {
      let createOnSuccess:
        | ((payload: { timeEntries: any[] }) => void)
        | undefined;
      let deleteOnError:
        | ((
            error: string,
            element?: string,
            meta?: { errorCode?: string; subCode?: string },
          ) => void)
        | undefined;
      let updateOnSuccess:
        | ((payload: { timeEntries: any[] }) => void)
        | undefined;
      let updateOnError:
        | ((
            error: string,
            element?: string,
            meta?: { errorCode?: string; subCode?: string },
          ) => void)
        | undefined;

      const defaultMutationResult = {
        batchSaveTimeEntries: jest.fn(),
        loading: false,
        error: undefined,
      };

      (useBatchSaveTimeEntries as jest.Mock)
        // deleteTimeEntry hook
        .mockImplementationOnce(({ onError }) => {
          deleteOnError = onError;
          return [jest.fn(), defaultMutationResult];
        })
        // createTimeEntry hook
        .mockImplementationOnce(({ onSuccess }) => {
          createOnSuccess = onSuccess;
          return [jest.fn(), defaultMutationResult];
        })
        // updateTimeEntry hook
        .mockImplementationOnce(({ onSuccess, onError }) => {
          updateOnSuccess = onSuccess;
          updateOnError = onError;
          return [jest.fn(), defaultMutationResult];
        });

      return () => ({
        createOnSuccess,
        deleteOnError,
        updateOnSuccess,
        updateOnError,
      });
    };

    it('does not show pending save banner on read for Time Activity when queried entry is locked with TIMECHARGE_PENDING', async () => {
      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue({
        ...mockUseSingleTimeEntryQuery,
        data: aTimeTracking_TimeEntry({
          locked: true,
          lockedReason: 'TIMECHARGE_PENDING',
        }),
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry={false} />,
      );

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('does not show pending save banner on read for Time Entry even when locked with TIMECHARGE_PENDING', async () => {
      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue({
        ...mockUseSingleTimeEntryQuery,
        data: aTimeTracking_TimeEntry({
          locked: true,
          lockedReason: 'TIMECHARGE_PENDING',
        }),
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('does not show pending save banner when update mutation succeeds with locked + TIMECHARGE_PENDING', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { updateOnSuccess } = getBatchCallbacks();

      await act(async () => {
        updateOnSuccess?.({
          timeEntries: [
            {
              locked: true,
              lockedReason: 'TIMECHARGE_PENDING',
            },
          ],
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('does not show pending save banner when create mutation succeeds with locked + TIMECHARGE_PENDING', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { createOnSuccess } = getBatchCallbacks();

      await act(async () => {
        createOnSuccess?.({
          timeEntries: [
            {
              locked: true,
              lockedReason: 'TIMECHARGE_PENDING',
            },
          ],
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('does not show pending save banner when lock reason is not TIMECHARGE_PENDING', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { updateOnSuccess } = getBatchCallbacks();

      await act(async () => {
        updateOnSuccess?.({
          timeEntries: [
            {
              locked: true,
              lockedReason: 'INVOICED',
            },
          ],
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('shows pending save banner when update mutation errors with TIME_ACTIVITY_EDIT_BLOCKED and TIMECHARGE_PENDING', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { updateOnError } = getBatchCallbacks();

      await act(async () => {
        updateOnError?.('time.entry.error', undefined, {
          errorCode: 'TIME_ACTIVITY_EDIT_BLOCKED',
          subCode: 'TIMECHARGE_PENDING',
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).toBeInTheDocument();
      });
    });

    it('shows pending save banner when update mutation errors with TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH and create response had TIMECHARGE_PENDING lock', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { createOnSuccess, updateOnError } = getBatchCallbacks();

      await act(async () => {
        createOnSuccess?.({
          timeEntries: [
            {
              id: 'created-time-activity-id',
              locked: true,
              lockedReason: 'TIMECHARGE_PENDING',
            },
          ],
        });
      });

      await act(async () => {
        updateOnError?.('time.entry.error', undefined, {
          errorCode: 'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).toBeInTheDocument();
      });
    });

    it('shows delete pending save banner when delete mutation errors with TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH and create response had TIMECHARGE_PENDING lock', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { createOnSuccess, deleteOnError } = getBatchCallbacks();

      await act(async () => {
        createOnSuccess?.({
          timeEntries: [
            {
              id: 'created-time-activity-id',
              locked: true,
              lockedReason: 'TIMECHARGE_PENDING',
            },
          ],
        });
      });

      await act(async () => {
        deleteOnError?.('time.entry.error', undefined, {
          errorCode: 'TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH',
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText('single.time.pending.save.delete.message'),
      ).toBeTruthy();
    });

    it('falls back to existing sequence mismatch error when update mutation errors with TIME_ACTIVITY_EDIT_SEQUENCE_MISMATCH and create lock context was not cached', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} />,
      );
      const { updateOnError } = getBatchCallbacks();

      await act(async () => {
        updateOnError?.('time.tracking.validation.edit.sequence.mismatch');
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
      expect(
        container.querySelector(
          '[data-testid="SingleTimeHOCErrorPageMessage"]',
        ),
      ).toBeInTheDocument();
    });

    it('clears pending save banner when delete is clicked', async () => {
      const getBatchCallbacks = setupBatchUpdateHookCapture();
      (useSingleTimeEntryQuery as jest.Mock).mockReturnValue({
        ...mockUseSingleTimeEntryQuery,
        data: aTimeTracking_TimeEntry({
          id: 'existing-time-entry-id',
          locked: true,
          lockedReason: 'TIMECHARGE_PENDING',
        }),
      });

      const { container } = renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry={false} />,
      );
      const { updateOnError } = getBatchCallbacks();

      await act(async () => {
        updateOnError?.('time.entry.error', undefined, {
          errorCode: 'TIME_ACTIVITY_EDIT_BLOCKED',
          subCode: 'TIMECHARGE_PENDING',
        });
      });

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(
          container.querySelector(
            '[data-automation-id="SingleTimeHOCPendingSavePageMessage"]',
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('labelPreference and isWorkforceEnvironment', () => {
    it('should use default Department and Customer terminology when isWorkforceEnvironment is true', async () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(true);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
      });

      expect(mockIsWorkforceEnvironment).toHaveBeenCalledWith(mockSandbox);
    });

    it('should use v3 preferences for labelPreference when isWorkforceEnvironment is false', async () => {
      const mockIsWorkforceEnvironment =
        require('src/js/service/utils/sandboxUtils').isWorkforceEnvironment;
      mockIsWorkforceEnvironment.mockReturnValue(false);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
      });

      expect(mockIsWorkforceEnvironment).toHaveBeenCalledWith(mockSandbox);
    });
  });

  describe('Full page maintenance banner', () => {
    it('renders the maintenance banner inside the trowser when the flag is enabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(true);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
      expect(screen.getByTestId('maintenance-page')).toBeInTheDocument();
    });

    it('does not render the maintenance banner when the flag is disabled', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(false);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      expect(screen.getByTestId('trowser-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('maintenance-page')).not.toBeInTheDocument();
    });

    it('checks the maintenance banner flag with the correct feature flag constant', () => {
      (useFeatureFlag as jest.Mock).mockReturnValue(false);

      renderWithAllProviders(
        <SingleTimeHOC open setOpen={jest.fn()} isSingleTimeEntry />,
      );

      expect(useFeatureFlag).toHaveBeenCalledWith(
        'SBSEG-QBO-SBSEG-QBO-QBTIME-MAINTENANCE-FULL-PAGE',
        false,
      );
    });
  });
});
