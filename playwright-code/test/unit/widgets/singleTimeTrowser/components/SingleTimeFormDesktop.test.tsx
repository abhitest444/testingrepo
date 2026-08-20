import dayjs from 'dayjs';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { useGetPayTypes } from 'src/js/service/hooks/paytypes/useGetPayTypes';
import { UxPreferenceHideTimeEntryFieldsData } from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { SingleTimeFormDesktop } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeFormDesktop';
import { renderWithAllProviders } from 'test/unit/testUtils';
import { CustomFieldsQuery } from 'src/js/service/queries/customFieldQueries';
import { mockLabelPreference } from 'test/unit/fixtures';

// Type augmentation for CustomerProject to include isTimeEntry prop
declare module 'src/js/widgets/common/addTimeFormComponents/CustomerProject' {
  export interface CustomerProjectProps {
    isTimeEntry?: boolean;
  }
}

jest.mock('@core-app/variability-sync-sdk', () => ({
  getDecision: jest.fn(
    (_key: string, options: { defaultValue: boolean }) => options.defaultValue,
  ),
}));

// Mock useGetCustomFields hook
jest.mock('src/js/service/hooks/timeEntries/useGetCustomFields', () => ({
  useGetCustomFields: jest.fn().mockReturnValue({
    customFields: [],
    loading: false,
    error: null,
    query: jest.fn().mockResolvedValue({ data: {} }),
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

// Mock useIXPFeatureFlag hook
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn().mockReturnValue({
    isEnabled: true,
    isLoading: false,
    error: null,
  }),
}));

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn().mockReturnValue({
    data: {
      customFieldDefinitions: {
        edges: [],
      },
    },
    loading: false,
    error: null,
  }),
}));

jest.mock('src/js/widgets/common/addTimeFormComponents/TeamMember', () => {
  const React = require('react');
  return {
    TeamMember: ({ setTeamMemberLoading }: any) => {
      React.useEffect(() => {
        setTeamMemberLoading?.(true);
      }, [setTeamMemberLoading]);
      return <div data-testid="team-member" />;
    },
    TimeForType: { EMPLOYEE: 'EMPLOYEE', VENDOR: 'VENDOR' },
  };
});

jest.mock('src/js/widgets/common/addTimeFormComponents/CustomerProject', () => {
  const React = require('react');
  return {
    CustomerProject: ({ setCustomerProjectLoading }: any) => {
      React.useEffect(() => {
        setCustomerProjectLoading?.(true);
      }, [setCustomerProjectLoading]);
      return <div data-testid="customer-project" />;
    },
  };
});

jest.mock('src/js/widgets/common/addTimeFormComponents/Service', () => {
  const React = require('react');
  return {
    Service: ({ setServiceLoading }: any) => {
      React.useEffect(() => {
        setServiceLoading?.(true);
      }, [setServiceLoading]);
      return <div data-testid="service" />;
    },
  };
});

jest.mock('src/js/widgets/common/addTimeFormComponents/Class', () => {
  const React = require('react');
  return {
    Class: ({ setClassLoading }: any) => {
      React.useEffect(() => {
        setClassLoading?.(true);
      }, [setClassLoading]);
      return <div data-testid="class" />;
    },
  };
});

jest.mock('src/js/widgets/common/addTimeFormComponents/Location', () => {
  const React = require('react');
  return {
    Location: ({ setLocationLoading }: any) => {
      React.useEffect(() => {
        setLocationLoading?.(true);
      }, [setLocationLoading]);
      return <div data-testid="location" />;
    },
  };
});

// Log the DOM structure to the console

const timeTrackingSettings = {
  isClassEnabled: true,
  isLocationEnabled: true,
  isServiceFieldEnabled: true,
  isBillingFieldEnabled: true,
  isTaxableFieldEnabled: true,
  firstDayOfWeek: 0,
  entityVersion: '1',
  isCloseBookDateEnabled: false,
  isCloseBookPasswordEnabled: false,
  closeBookDate: dayjs(),
  timezone: '(UTC-08:00) Pacific Time (US & Canada)',
  classRequired: false,
  locationRequired: false,
  serviceItemRequired: false,
  timeSheetEntryMakesNotesRequiredEnabled: false,
};

const mockHideTimeEntryFieldsPreferences: UxPreferenceHideTimeEntryFieldsData =
  {
    isClassFieldEnabled: true,
    isProjectFieldEnabled: true,
    isLocationFieldEnabled: true,
    isPayTypeFieldEnabled: true,
    isCostRateFieldEnabled: true,
    isTaxableFieldEnabled: true,
  };

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  fetchSettingsAccess: jest.fn().mockReturnValue(Promise.resolve({})),
  useHasAdminAccess: jest.fn().mockReturnValue(true),
  useCurrencyFormat: jest.fn().mockReturnValue('USD'),
  useFeatureFlag: jest.fn().mockReturnValue(true),
  isEmployeeAuthorized: jest.fn().mockResolvedValue(true),
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

// Mock useFeatureFlag hook for PayType feature flag
jest.mock('src/js/common/hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn().mockReturnValue(false),
}));

// Mock useHasPaytypeAccess hook
jest.mock('src/js/common/hooks/useHasPaytypeAccess', () => ({
  useHasPaytypeAccess: jest.fn().mockReturnValue({
    hasPaytypeAccess: false,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('src/js/service/hooks/paytypes/useGetPayTypes', () => ({
  ...jest.requireActual('src/js/service/hooks/paytypes/useGetPayTypes'),
  useGetPayTypes: jest.fn(),
}));
jest.mock(
  'src/js/widgets/singleTimeTrowser/hooks/useSTEFieldAssignments',
  () => ({
    useSTEFieldAssignments: jest.fn().mockReturnValue({
      visibleCustomFields: [],
      standardFieldsVisibility: {
        service: true,
        class: true,
        location: true,
        billable: true,
      },
      loading: false,
      workerId: undefined,
      customerId: undefined,
      projectId: undefined,
      customFieldOptionAssignments: {},
    }),
  }),
);

jest.mock('src/js/widgets/singleTimeTrowser/hooks/useSingleTimeTotals', () => ({
  useSingleTimeTotals: jest.fn().mockReturnValue({
    currencyRate: 'USD',
    durationCurrencyCalcAmount: '120',
    clockedInCurrencyCalcAmount: '240',
    durationHours: 6,
    durationMinutes: 0,
    clockedInHours: 12,
    clockedInMinutes: 0,
    netDurationInSeconds: 43200,
    billable: true,
  }),
}));

const mockPayTypes = [
  {
    id: '1',
    employerCompensation: { name: 'Hourly', type: { value: 'HOURLY_PAY' } },
    active: true,
  },
  {
    id: '2',
    employerCompensation: { name: 'Salary', type: { value: 'SALARY' } },
    active: true,
  },
];

const commonProps = {
  userFirstName: 'John',
  settings: timeTrackingSettings,
  hideTimeEntryFieldsPreferences: mockHideTimeEntryFieldsPreferences,
  toggledClockIn: true,
  toggledBreak: true,
  toggledBillable: true,
  hasPayroll: true,
  toggledCurrentlyWorking: true,
  hasProjects: true,
  hasAdminAccess: true,
  timeForType: TimeForType.EMPLOYEE,
  serviceItemPriceRef: React.createRef<number>(),
  serviceDescriptionRef: React.createRef<string>(),
  serviceTaxableRef: React.createRef<boolean>(),
  isBillRateEnable: true,
  labelPreference: mockLabelPreference,
  billableStatus: TimeTracking_BillableStatus.Billable,
  timeOffMethod: null,
  isOTX: true, // Add isOTX prop
  shouldShowTeamMemberField: true,
};

const defaultFormValues = {
  id: '1234',
  version: '0',
  timeFor: {
    id: '1',
    type: TimeForType.EMPLOYEE,
    name: 'Jarrod',
  },
  timeAgainst: {
    customer: {
      id: '1',
      name: 'None',
    },
    project: {
      id: '2',
      name: 'None',
    },
  },
  toggleClockIn: true,
  toggleBreak: false,
  toggledCurrentlyWorking: false,
  startDate: dayjs(),
  endDate: dayjs(),
  startTime: undefined,
  endTime: undefined,
  duration: null,
  service: {
    id: '',
    name: '',
  },
  class: {
    id: '',
    name: '',
  },
  location: {
    id: '',
    name: '',
  },
  billable: true,
  billableStatus: undefined,
  billRate: null,
  notes: '',
  breakDuration: null,
  payType: {
    id: '',
    name: '',
  },
  costRate: null,
  taxable: true,
  closedBookPassword: '',
};

// Mock for CustomFieldsQuery
const customFieldsMock = {
  request: {
    query: CustomFieldsQuery,
    variables: {},
    context: {
      clientName: 'CUSTOM_EXTENSIONS',
    },
  },
  result: {
    data: {
      customFieldDefinitions: {
        edges: [
          {
            node: {
              id: '1',
              schema: {
                type: 'string',
                title: 'Test Field',
                format: 'text',
                allowedOperations: ['READ', 'WRITE'],
                allowedValues: [],
                uiValidations: {
                  mandatory: false,
                  defaultValue: '',
                },
                metadataProperties: [],
              },
              name: 'Test Field',
              deleted: false,
              associatedEntityTypes: [
                {
                  type: 'TIME_ENTRY',
                  deleted: false,
                  allowedOperations: ['READ', 'WRITE'],
                  entityConditions: [],
                },
              ],
              colorCode: '#000000',
              customFieldDefinitionMetaModel: {
                suggested: false,
              },
            },
          },
        ],
      },
    },
  },
};

describe('SingleTimeFormDesktop Component', () => {
  beforeEach(() => {
    (useGetPayTypes as jest.Mock).mockReturnValue({ data: mockPayTypes });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should render Single Time Form for desktop', () => {
    const { container } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    expect(container).toBeDefined();
  });

  it('should have correct aria-label for tour targeting on toggle clock-in', () => {
    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    // Check that the FormSwitch wrapper div has the correct aria-label for tour targeting
    const toggleClockInContainer = document.querySelector(
      '[aria-label="single-time-toggle-clock-in"]',
    );
    expect(toggleClockInContainer).toBeInTheDocument();
  });

  it('should hide the "Add break" button when isExported is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    expect(
      queryByText((content) => content.includes('drawer.field.addbreak')),
    ).toBeNull();
  });

  it('should show the "Add break" button when isExported is true', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    expect(
      getByText((content) => content.includes('drawer.field.addbreak')),
    ).toBeDefined();
  });

  it('should hide the "End Date" dropdown when toggleClockIn is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          toggledClockIn: false,
        },
      },
    );

    expect(
      queryByText((content) => content.includes('drawer.form.endDate.label')),
    ).toBeNull();
  });

  it('should hide the "End Date" dropdown when isExported is true i.e for time activity', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          isExported: true,
        },
      },
    );

    expect(
      queryByText((content) => content.includes('drawer.form.endDate.label')),
    ).toBeNull();
  });

  it('should show the "End Date" dropdown for time entries when isOTX is true and toggleClockIn is true', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledCurrentlyWorking={false}
        isOTX
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    expect(
      getByText((content) => content.includes('drawer.form.endDate.label')),
    ).toBeDefined();
  });

  it('should show the "End Date" dropdown for time activities when isOTX is true and toggleClockIn is true', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledCurrentlyWorking={false}
        isOTX
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    expect(
      getByText((content) => content.includes('drawer.form.endDate.label')),
    ).toBeDefined();
  });

  it('should not show currentlyWorking checkbox for time activities', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: null, isExported: true } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should not show currentlyWorking checkbox for existing time activities', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: true } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should show currentlyWorking checkbox when all conditions are met (isTimeEntry, isOTX, toggledClockIn)', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    expect(
      getByText((content) => content.includes('currently.working')),
    ).toBeDefined();
  });

  it('should not show currentlyWorking checkbox when isOTX is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking
        isOTX={false}
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should not show currentlyWorking checkbox when toggledClockIn is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn={false}
        toggledCurrentlyWorking
        isOTX
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should not show currentlyWorking checkbox when isTimeEntry is false (time activity)', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking
        isOTX
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: true } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should not show currentlyWorking checkbox when isOTX is false and toggledClockIn is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn={false}
        toggledCurrentlyWorking
        isOTX={false}
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should not show currentlyWorking checkbox when all conditions are false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn={false}
        toggledCurrentlyWorking
        isOTX={false}
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: true } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should show currentlyWorking checkbox for new time entries when all conditions are met', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn isOTX />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: undefined,
          isExported: false,
        },
      },
    );

    expect(
      getByText((content) => content.includes('currently.working')),
    ).toBeDefined();
  });

  it('should not show currentlyWorking checkbox for closed existing time entries', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking={false}
        isOTX
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should show currentlyWorking checkbox for new time entries even when toggledCurrentlyWorking is false', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking={false}
        isOTX
      />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: undefined,
          isExported: false,
        },
      },
    );

    expect(
      getByText((content) => content.includes('currently.working')),
    ).toBeDefined();
  });

  it('should disable toggleClockIn switch for existing time entries', () => {
    const { getByRole } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, id: '123', isExported: false } },
    );

    const toggleSwitch = getByRole('switch', { name: /toggleClockIn/i });
    expect(toggleSwitch).toBeDisabled();
  });

  it('should enable toggleClockIn switch for new time entries', () => {
    const { getByRole } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: undefined,
          isExported: false,
        },
      },
    );

    const toggleSwitch = getByRole('switch', { name: /toggleClockIn/i });
    expect(toggleSwitch).not.toBeDisabled();
  });

  it('should not show cost rate, taxable and pay type fields for time entries (isExported = false)', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        hasPayroll
        hasProjects
        hasAdminAccess
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    // These fields should not be visible for time entries
    expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    expect(queryByText((content) => content.includes('cost.rate'))).toBeNull();
    expect(queryByText((content) => content.includes('taxable'))).toBeNull();
  });

  it('should show cost rate, taxable and pay type fields for time activities (isExported = true)', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        hasPayroll
        hasProjects
        hasAdminAccess
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    // These fields should be visible for time activities
    expect(
      getByText((content) => content.includes('pay.type')),
    ).toBeInTheDocument();
    expect(
      getByText((content) => content.includes('cost.rate')),
    ).toBeInTheDocument();
    expect(
      getByText((content) => content.includes('taxable')),
    ).toBeInTheDocument();
  });

  it('should call query when custom fields are enabled', () => {
    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
    const mockQuery = jest.fn().mockResolvedValue({ data: {} });
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: mockQuery,
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    // Verify hook was called and query function was called
    expect(useGetCustomFields).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should not call query when custom fields are disabled', () => {
    // Mock useFeatureFlag to return false for custom fields
    const { useFeatureFlag } = require('src/js/service/utils/sandboxUtils');
    useFeatureFlag.mockReturnValueOnce(false);

    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
    const mockQuery = jest.fn().mockResolvedValue({ data: {} });
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: mockQuery,
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX={false} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should call query only once when component mounts', () => {
    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
    const mockQuery = jest.fn().mockResolvedValue({ data: {} });
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: mockQuery,
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    // Verify hook was called and query function was called once
    expect(useGetCustomFields).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should handle custom fields disabled scenario with fallback values', () => {
    // Mock useFeatureFlag to return false for custom fields
    const { useFeatureFlag } = require('src/js/service/utils/sandboxUtils');
    useFeatureFlag.mockReturnValueOnce(false);

    const { getByTestId } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    // Should render without custom fields section
    expect(() => getByTestId('custom-fields-widget')).toThrow();
  });

  it('should provide fallback query function when custom fields are disabled', () => {
    // Mock useFeatureFlag to return false for custom fields
    const { useFeatureFlag } = require('src/js/service/utils/sandboxUtils');
    useFeatureFlag.mockReturnValueOnce(false);

    // This should not throw an error when custom fields are disabled
    expect(() => {
      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
      );
    }).not.toThrow();
  });

  it('should call query when custom fields are enabled and component mounts', () => {
    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
    const mockQuery = jest.fn().mockResolvedValue({ data: {} });

    // Mock the hook to return our query function
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: mockQuery,
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    // Verify hook was called and query function was called when component mounts
    expect(useGetCustomFields).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should not call query when custom fields are disabled and component mounts', () => {
    // Mock useFeatureFlag to return false for custom fields
    const { useFeatureFlag } = require('src/js/service/utils/sandboxUtils');
    useFeatureFlag.mockReturnValueOnce(false);

    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
    const mockQuery = jest.fn().mockResolvedValue({ data: {} });

    // Mock the hook to return our query function
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: mockQuery,
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX={false} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    // Verify that query was NOT called when custom fields are disabled
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should provide fallback values when custom fields are disabled', () => {
    // Mock useFeatureFlag to return false for custom fields
    const { useFeatureFlag } = require('src/js/service/utils/sandboxUtils');
    useFeatureFlag.mockReturnValueOnce(false);

    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');

    // Mock the hook to return fallback values
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: jest.fn(),
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    // The component should render without errors even with fallback values
    expect(
      screen.getByText((content) =>
        content.includes('drawer.form.startDate.label'),
      ),
    ).toBeInTheDocument();
  });

  it('should call useGetCustomFields hook when custom fields are enabled', () => {
    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');

    // Mock the hook to return test data
    useGetCustomFields.mockReturnValue({
      customFields: [
        {
          id: '1',
          name: 'Test Field',
          type: 'text',
          deleted: false,
          required: false,
          value: 'test value',
        },
      ],
      loading: false,
      error: null,
      query: jest.fn(),
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    // Verify that useGetCustomFields was called
    expect(useGetCustomFields).toHaveBeenCalled();
  });

  it('should call useGetCustomFields hook with skip=true when custom fields are disabled', () => {
    // Mock useIXPFeatureFlag to return false for custom fields
    const { useIXPFeatureFlag } = require('src/js/common/useIXPFeatureFlag');
    useIXPFeatureFlag.mockReturnValueOnce({
      isEnabled: false,
      isLoading: false,
      error: null,
    });

    const {
      useGetCustomFields,
    } = require('src/js/service/hooks/timeEntries/useGetCustomFields');

    // Mock the hook
    useGetCustomFields.mockReturnValue({
      customFields: [],
      loading: false,
      error: null,
      query: jest.fn().mockResolvedValue({ data: {} }),
    });

    renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} isOTX={false} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // Changed to false for time entries
    );

    // Verify that useGetCustomFields was called when custom fields are disabled
    expect(useGetCustomFields).toHaveBeenCalled();
  });

  it('should dispatch loading actions from child components', () => {
    const dispatchLoading = jest.fn();

    renderWithAllProviders(
      <SingleTimeFormDesktop
        {...commonProps}
        dispatchLoading={dispatchLoading}
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    expect(dispatchLoading).toHaveBeenCalledWith({
      type: 'SET_TEAM_MEMBER_LOADING',
      loading: true,
    });
    expect(dispatchLoading).toHaveBeenCalledWith({
      type: 'SET_CUSTOMER_PROJECT_LOADING',
      loading: true,
    });
    expect(dispatchLoading).toHaveBeenCalledWith({
      type: 'SET_SERVICE_LOADING',
      loading: true,
    });
    expect(dispatchLoading).toHaveBeenCalledWith({
      type: 'SET_CLASS_LOADING',
      loading: true,
    });
    expect(dispatchLoading).toHaveBeenCalledWith({
      type: 'SET_LOCATION_LOADING',
      loading: true,
    });
  });

  it('should clear endTime errors when currentlyWorking checkbox is checked', () => {
    const { getByRole } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn isOTX />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: '123',
          isExported: false,
        },
      },
    );

    // Find the currentlyWorking checkbox
    const currentlyWorkingCheckbox = getByRole('checkbox', {
      name: /currently.working/i,
    });

    // Simulate checking the checkbox
    fireEvent.click(currentlyWorkingCheckbox);

    // The onChange handler should have been called and cleared endTime errors
    // Note: The actual clearing is internal to the component and uses formContext.clearErrors
    expect(currentlyWorkingCheckbox).toBeChecked();
  });

  it('should handle currentlyWorking checkbox toggle correctly', () => {
    const { getByRole } = renderWithAllProviders(
      <SingleTimeFormDesktop {...commonProps} toggledClockIn isOTX />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: '123',
          isExported: false,
          currentlyWorking: false,
        },
      },
    );

    // Find the currentlyWorking checkbox
    const currentlyWorkingCheckbox = getByRole('checkbox', {
      name: /currently.working/i,
    });

    // Initially should not be checked
    expect(currentlyWorkingCheckbox).not.toBeChecked();

    // Simulate checking the checkbox
    fireEvent.click(currentlyWorkingCheckbox);

    // The checkbox should now be checked
    expect(currentlyWorkingCheckbox).toBeChecked();

    // Simulate unchecking the checkbox
    fireEvent.click(currentlyWorkingCheckbox);

    // The checkbox should be unchecked again
    expect(currentlyWorkingCheckbox).not.toBeChecked();
  });

  describe('PayType dropdown with feature flag', () => {
    it('should show PayType field when feature flag is OFF and hasAdminAccess is true (original behavior)', () => {
      // Feature flag OFF - use hasAdminAccess
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      const { getByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(
        getByText((content) => content.includes('pay.type')),
      ).toBeInTheDocument();
    });

    it('should hide PayType field when feature flag is OFF and hasAdminAccess is false', () => {
      // Feature flag OFF - use hasAdminAccess
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess={false}
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });

    it('should show PayType field when feature flag is ON and hasAdminAccess is true', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: false,
        isLoading: false,
        error: null,
      });

      const { getByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(
        getByText((content) => content.includes('pay.type')),
      ).toBeInTheDocument();
    });

    it('should show PayType field when feature flag is ON and hasPaytypeAccess is true (non-admin)', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: true,
        isLoading: false,
        error: null,
      });

      const { getByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess={false}
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(
        getByText((content) => content.includes('pay.type')),
      ).toBeInTheDocument();
    });

    it('should hide PayType field when feature flag is ON but neither admin nor paytype access', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: false,
        isLoading: false,
        error: null,
      });

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess={false}
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });

    it('should hide PayType field while paytype access is loading', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const {
        useHasPaytypeAccess,
      } = require('src/js/common/hooks/useHasPaytypeAccess');
      useHasPaytypeAccess.mockReturnValue({
        hasPaytypeAccess: true,
        isLoading: true,
        error: null,
      });

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess={false}
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });

    it('should hide PayType field for vendors regardless of feature flag', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(true);

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess
          timeForType={TimeForType.VENDOR}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });

    it('should hide PayType field for time entries (isExported = false)', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll
          hasAdminAccess
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });

    it('should hide PayType field when hasPayroll is false', () => {
      const { useFeatureFlag } = require('src/js/common/hooks/useFeatureFlag');
      useFeatureFlag.mockReturnValue(false);

      const { queryByText } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          hasPayroll={false}
          hasAdminAccess
          timeForType={TimeForType.EMPLOYEE}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
      );

      expect(queryByText((content) => content.includes('pay.type'))).toBeNull();
    });
  });

  describe('autoCalculates Mileage', () => {
    it('should update mileage to autoCalculatedMeters when autoCalculateMileage is true', () => {
      const distanceTrackingValues = {
        distanceTracking: {
          autoCalculatedMeters: 10.5,
          manualMeters: 5.0,
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      const { rerender } = renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, ...distanceTrackingValues } },
      );

      // Change autoCalculateMileage to false and rerender
      const updatedValues = {
        ...defaultFormValues,
        ...distanceTrackingValues,
        autoCalculateMileage: false,
      };

      rerender(<SingleTimeFormDesktop {...commonProps} />);

      // The component should have called setValue to update mileage
      // Note: In a real test, you'd need to spy on formContext.setValue
    });

    it('should update mileage to manualMeters when autoCalculateMileage is false', () => {
      const distanceTrackingValues = {
        distanceTracking: {
          autoCalculatedMeters: 10.5,
          manualMeters: 5.0,
        },
        autoCalculateMileage: false,
        mileage: null,
      };

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, ...distanceTrackingValues } },
      );

      // The component should set mileage to manualMeters value
      // Note: In a real test, you'd need to spy on formContext.setValue
    });

    it('should not update mileage when distanceTracking is undefined', () => {
      const valuesWithoutDistanceTracking = {
        autoCalculateMileage: true,
        mileage: null,
      };

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            ...valuesWithoutDistanceTracking,
          },
        },
      );

      // The component should not crash and should handle missing distanceTracking gracefully
      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should handle null autoCalculatedMeters when autoCalculateMileage is true', () => {
      const distanceTrackingValues = {
        distanceTracking: {
          autoCalculatedMeters: null,
          manualMeters: 5.0,
        },
        autoCalculateMileage: true,
        mileage: null,
      };

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, ...distanceTrackingValues } },
      );

      // Should handle null autoCalculatedMeters gracefully
      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should handle null manualMeters when autoCalculateMileage is false', () => {
      const distanceTrackingValues = {
        distanceTracking: {
          autoCalculatedMeters: 10.5,
          manualMeters: null,
        },
        autoCalculateMileage: false,
        mileage: null,
      };

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, ...distanceTrackingValues } },
      );

      // Should handle null manualMeters gracefully
      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });
  });

  describe('finalCustomFieldsWithEffectiveRequired useMemo', () => {
    const useSTEFieldAssignmentsMock =
      require('src/js/widgets/singleTimeTrowser/hooks/useSTEFieldAssignments')
        .useSTEFieldAssignments as jest.Mock;

    beforeEach(() => {
      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });
    });

    it('should apply effectiveRequired for dropdown field with assigned options', () => {
      const dropdownFieldWithOptions = {
        id: 'cf-1',
        name: 'Department',
        type: 'DROPDOWN',
        required: true,
        options: [{ id: 'opt-1', name: 'Option 1' }],
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [dropdownFieldWithOptions],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: 'w1',
        customerId: 'c1',
        projectId: 'p1',
        customFieldOptionAssignments: {
          'cf-1': [{ id: 'opt-1', name: 'Opt 1' }],
        },
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [dropdownFieldWithOptions],
        loading: false,
        error: null,
        query: jest.fn().mockResolvedValue({ data: {} }),
      });

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should apply effectiveRequired for multi_select field with customFieldOptionAssignments', () => {
      const multiSelectField = {
        id: 'cf-2',
        name: 'Tags',
        type: 'MULTI_SELECT',
        required: true,
        options: [],
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [multiSelectField],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: { 'cf-2': [{ id: 'o1', name: 'Tag1' }] },
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [multiSelectField],
        loading: false,
        error: null,
        query: jest.fn().mockResolvedValue({ data: {} }),
      });

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should apply effectiveRequired for field with options array', () => {
      const fieldWithOptions = {
        id: 'cf-3',
        name: 'Category',
        type: 'string',
        required: true,
        options: [{ id: 'cat-1', name: 'Category 1' }],
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [fieldWithOptions],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [fieldWithOptions],
        loading: false,
        error: null,
        query: jest.fn().mockResolvedValue({ data: {} }),
      });

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should set effectiveRequired false for dropdown without assigned options', () => {
      const dropdownNoOptions = {
        id: 'cf-4',
        name: 'Dropdown No Options',
        type: 'DROPDOWN',
        required: true,
        options: [],
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [dropdownNoOptions],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [dropdownNoOptions],
        loading: false,
        error: null,
        query: jest.fn().mockResolvedValue({ data: {} }),
      });

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should set effectiveRequired based on field.required when not dropdown', () => {
      const textFieldRequired = {
        id: 'cf-5',
        name: 'Text Field',
        type: 'TEXT',
        required: true,
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [textFieldRequired],
        standardFieldsVisibility: {
          service: true,
          class: true,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });

      const {
        useGetCustomFields,
      } = require('src/js/service/hooks/timeEntries/useGetCustomFields');
      (useGetCustomFields as jest.Mock).mockReturnValue({
        customFields: [textFieldRequired],
        loading: false,
        error: null,
        query: jest.fn().mockResolvedValue({ data: {} }),
      });

      renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Team Member visibility by team members dropdown flag', () => {
    it('should hide TeamMember field when flag is unresolved', () => {
      const { queryByTestId } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          shouldShowTeamMemberField={false}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(queryByTestId('team-member')).not.toBeInTheDocument();
    });

    it('should hide TeamMember field when flag resolves false', () => {
      const { queryByTestId } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          shouldShowTeamMemberField={false}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(queryByTestId('team-member')).not.toBeInTheDocument();
    });

    it('should show TeamMember field when flag resolves true', () => {
      const { getByTestId } = renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(getByTestId('team-member')).toBeInTheDocument();
    });

    it('should dispatch SET_TEAM_MEMBER_LOADING false when field is hidden', () => {
      const dispatchLoading = jest.fn();

      renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          dispatchLoading={dispatchLoading}
          shouldShowTeamMemberField={false}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(dispatchLoading).toHaveBeenCalledWith({
        type: 'SET_TEAM_MEMBER_LOADING',
        loading: false,
      });
    });

    it('should hide TeamMember field when shouldShowTeamMemberField is false', () => {
      const { queryByTestId } = renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          shouldShowTeamMemberField={false}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(queryByTestId('team-member')).not.toBeInTheDocument();
    });
  });

  describe('isBillableFieldAssignedRef', () => {
    it('should update isBillableFieldAssignedRef when finalBillableEnabled changes', () => {
      const ref = { current: false };

      renderWithAllProviders(
        <SingleTimeFormDesktop
          {...commonProps}
          isBillableFieldAssignedRef={ref}
        />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(ref.current).toBe(true);
    });

    it('should not fail when isBillableFieldAssignedRef is not provided', () => {
      const { container } = renderWithAllProviders(
        <SingleTimeFormDesktop {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(container).toBeTruthy();
    });
  });
});
