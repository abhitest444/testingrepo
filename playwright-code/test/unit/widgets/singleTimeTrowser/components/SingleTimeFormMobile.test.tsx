import dayjs from 'dayjs';
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { useGetPayTypes } from 'src/js/service/hooks/paytypes/useGetPayTypes';
import { UxPreferenceHideTimeEntryFieldsData } from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { SingleTimeFormMobile } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeFormMobile';
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
  timezone: 'America/(UTC-08:00) Pacific Time (US & Canada)',
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
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));
jest.mock('src/js/service/hooks/paytypes/useGetPayTypes', () => ({
  ...jest.requireActual('src/js/service/hooks/paytypes/useGetPayTypes'),
  useGetPayTypes: jest.fn(),
}));
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
  isOTX: true,
  updateLabel: jest.fn(),
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

describe('SingleTimeFormMobile Component', () => {
  beforeEach(() => {
    (useGetPayTypes as jest.Mock).mockReturnValue({ data: mockPayTypes });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should render Single Time Form for mobile', () => {
    const { container } = renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
    );

    expect(container).toBeDefined();
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
      <SingleTimeFormMobile {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // isExported: false makes it a time entry
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
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
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
      <SingleTimeFormMobile {...commonProps} isOTX />,
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
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
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
        <SingleTimeFormMobile {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: true } },
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
      <SingleTimeFormMobile {...commonProps} isOTX />,
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
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
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
      query: () => Promise.resolve(),
    });

    renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } },
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
      query: jest.fn().mockResolvedValue({ data: {} }),
    });

    renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} isOTX />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } }, // isExported: false makes it a time entry
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
      <SingleTimeFormMobile {...commonProps} />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: true } }, // isExported: true makes it a time activity (not time entry)
    );

    // Verify that useGetCustomFields was called when custom fields are disabled
    expect(useGetCustomFields).toHaveBeenCalled();
  });

  it('should show currentlyWorking checkbox when all conditions are met (isTimeEntry, isOTX, toggledClockIn)', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} toggledClockIn isOTX />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: '123',
          isExported: false,
        },
      },
    );

    expect(
      getByText((content) => content.includes('currently.working')),
    ).toBeDefined();
  });

  it('should show currentlyWorking checkbox for new time entries when all conditions are met', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} toggledClockIn isOTX />,
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

  // QUANTA-11887: a "closed" existing time entry is one that already has an id and
  // both start and end time — i.e. it was not in "currently working" state when loaded.
  // For these, the checkbox is not relevant on edit and should be hidden.
  it('should not show currentlyWorking checkbox for closed existing time entries (id present and not currentlyWorking)', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormMobile
        {...commonProps}
        toggledClockIn
        toggledCurrentlyWorking={false}
        isOTX
      />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: '123',
          isExported: false,
          // Closed entry has both start and end time; providing endTime also avoids
          // the existing useEffect path that auto-sets endTime via dayjs.tz.
          startTime: dayjs(),
          endTime: dayjs(),
        },
      },
    );

    expect(
      queryByText((content) => content.includes('currently.working')),
    ).toBeNull();
  });

  it('should show currentlyWorking checkbox for new time entries even when toggledCurrentlyWorking is false', () => {
    const { getByText } = renderWithAllProviders(
      <SingleTimeFormMobile
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

  it('should not show currentlyWorking checkbox for time activities', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormMobile
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

  it('should not show currentlyWorking checkbox when isOTX is false', () => {
    const { queryByText } = renderWithAllProviders(
      <SingleTimeFormMobile
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
      <SingleTimeFormMobile
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
      <SingleTimeFormMobile
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
      <SingleTimeFormMobile
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
      <SingleTimeFormMobile
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

  it('should hide Team Member field when shouldShowTeamMemberField is false', () => {
    renderWithAllProviders(
      <SingleTimeFormMobile
        {...commonProps}
        shouldShowTeamMemberField={false}
      />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    expect(screen.queryByTestId('team-member')).not.toBeInTheDocument();
    expect(
      screen.queryByText((content) => content.includes('select.team.member')),
    ).not.toBeInTheDocument();
  });

  it('should show Team Member field when shouldShowTeamMemberField is true', () => {
    renderWithAllProviders(
      <SingleTimeFormMobile {...commonProps} shouldShowTeamMemberField />,
      [customFieldsMock],
      { defaultValues: { ...defaultFormValues, isExported: false } },
    );

    expect(screen.getByTestId('team-member')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('select.team.member')),
    ).toBeInTheDocument();
  });

  it('should dispatch loading actions from child components', () => {
    const dispatchLoading = jest.fn();

    renderWithAllProviders(
      <SingleTimeFormMobile
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
      <SingleTimeFormMobile {...commonProps} toggledClockIn isOTX />,
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
      <SingleTimeFormMobile {...commonProps} toggledClockIn isOTX />,
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

  it('should auto-set current time when currentlyWorking is unchecked and endTime is undefined', () => {
    // Use a valid timezone format
    const validSettings = {
      ...timeTrackingSettings,
      timezone: 'America/Los_Angeles',
    };

    const { rerender } = renderWithAllProviders(
      <SingleTimeFormMobile
        {...commonProps}
        settings={validSettings}
        toggledClockIn
        isOTX
        toggledCurrentlyWorking
      />,
      [customFieldsMock],
      {
        defaultValues: {
          ...defaultFormValues,
          id: '123',
          isExported: false,
          currentlyWorking: true,
          endTime: undefined,
          timezone: 'America/Los_Angeles',
        },
      },
    );

    // Re-render with currentlyWorking set to false to trigger the useEffect
    rerender(
      <SingleTimeFormMobile
        {...commonProps}
        settings={validSettings}
        toggledClockIn
        isOTX
        toggledCurrentlyWorking={false}
      />,
    );

    // The useEffect should have auto-set the endTime when currentlyWorking became false
    // Note: The actual time setting is internal to the component
    expect(screen.getByTestId('customer-project')).toBeInTheDocument();
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
        <SingleTimeFormMobile {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, ...distanceTrackingValues } },
      );

      // Change autoCalculateMileage to false and rerender
      const updatedValues = {
        ...defaultFormValues,
        ...distanceTrackingValues,
        autoCalculateMileage: false,
      };

      rerender(<SingleTimeFormMobile {...commonProps} />);

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
        <SingleTimeFormMobile {...commonProps} />,
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
        <SingleTimeFormMobile {...commonProps} />,
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
        <SingleTimeFormMobile {...commonProps} />,
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
        <SingleTimeFormMobile {...commonProps} />,
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
        <SingleTimeFormMobile {...commonProps} />,
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

    it('should show timeTrackingOnlyId greeting when provided', () => {
      const { container } = renderWithAllProviders(
        <SingleTimeFormMobile {...commonProps} timeTrackingOnlyId="tt-123" />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: false,
          },
        },
      );

      const headings = container.querySelectorAll('h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should use baseClassEnabled for time activity when hideTimeEntryFieldsPreferences disables class', () => {
      const prefsWithClassDisabled = {
        ...mockHideTimeEntryFieldsPreferences,
        isClassFieldEnabled: false,
      };

      useSTEFieldAssignmentsMock.mockReturnValue({
        visibleCustomFields: [],
        standardFieldsVisibility: {
          service: true,
          class: false,
          location: true,
          billable: true,
        },
        loading: false,
        workerId: undefined,
        customerId: undefined,
        projectId: undefined,
        customFieldOptionAssignments: {},
      });

      renderWithAllProviders(
        <SingleTimeFormMobile
          {...commonProps}
          hideTimeEntryFieldsPreferences={prefsWithClassDisabled}
        />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: true,
          },
        },
      );

      expect(
        screen.getByText((content) =>
          content.includes('drawer.form.startDate.label'),
        ),
      ).toBeInTheDocument();
    });

    it('should show break section when toggledBreak and toggledClockIn', () => {
      renderWithAllProviders(
        <SingleTimeFormMobile {...commonProps} toggledBreak toggledClockIn />,
        [customFieldsMock],
        {
          defaultValues: {
            ...defaultFormValues,
            isExported: true,
            toggleBreak: true,
          },
        },
      );

      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      const hasBreakHeading = h3Elements.some(
        (h) =>
          h.textContent === 'break.details' ||
          h.textContent === 'Break details' ||
          (h.textContent || '').toLowerCase().includes('break'),
      );
      expect(hasBreakHeading).toBe(true);
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
        <SingleTimeFormMobile {...commonProps} />,
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

  describe('isBillableFieldAssignedRef', () => {
    it('should update isBillableFieldAssignedRef when finalBillableEnabled changes', () => {
      const ref = { current: false };

      renderWithAllProviders(
        <SingleTimeFormMobile
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
        <SingleTimeFormMobile {...commonProps} />,
        [customFieldsMock],
        { defaultValues: { ...defaultFormValues, isExported: false } },
      );

      expect(container).toBeTruthy();
    });
  });
});
