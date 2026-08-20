import dayjs from 'dayjs';
import React from 'react';
import { useIsMobileDevice } from 'src/js/common/screenSizeUtils';
import { DEFAULT_UX_PREFERENCE_DATA_STATE } from 'src/js/service/utils/useUXPreferences';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { SingleTimeForm } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeForm';
import { renderWithAllProviders } from 'test/unit/testUtils';
import { mockLabelPreference } from 'test/unit/fixtures';

// Type augmentation for CustomerProject to include isTimeEntry prop
declare module 'src/js/widgets/common/addTimeFormComponents/CustomerProject' {
  export interface CustomerProjectProps {
    isTimeEntry?: boolean;
  }
}

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

jest.mock('src/js/common/screenSizeUtils', () => ({
  useIsMobileDevice: jest.fn().mockReturnValue(true),
  breakPoints: {
    md: 1024,
    sm: 768,
    xs: 480,
  },
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

describe('SingleTimeForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobileDevice as jest.Mock).mockResolvedValue(true);
  });

  it('should render Single Time Form for mobile', () => {
    const component = renderWithAllProviders(
      <SingleTimeForm
        userFirstName="John"
        settings={timeTrackingSettings}
        preferences={DEFAULT_UX_PREFERENCE_DATA_STATE}
        hasPayroll
        hasProjects
        hasAdminAccess
        timeForType={TimeForType.VENDOR}
        serviceItemPriceRef={React.createRef()}
        serviceDescriptionRef={React.createRef()}
        serviceTaxableRef={React.createRef()}
        isBillRateEnable
        labelPreference={mockLabelPreference}
        timeOffMethod={null}
      />,
      [], // empty mocks array
      {
        defaultValues: {
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
          toggleClockIn: false,
          toggleBreak: false,
          startDate: dayjs(),
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
          billable: false,
          billableStatus: undefined,
          billRate: null,
          notes: '',
          breakDuration: null,
          payType: {
            id: '',
            name: '',
          },
          costRate: null,
          taxable: false,
          closedBookPassword: '',
        },
      },
    );
    const headerText = component.queryByDisplayValue('Hi, John', {
      exact: false,
    });
    expect(headerText).toBeDefined();
  });

  it('should render Single Time Form for mobile with toggleClockIn & toggleBreak set to true', () => {
    const component = renderWithAllProviders(
      <SingleTimeForm
        userFirstName="John"
        settings={timeTrackingSettings}
        preferences={DEFAULT_UX_PREFERENCE_DATA_STATE}
        hasPayroll
        hasProjects
        hasAdminAccess
        timeForType={TimeForType.VENDOR}
        serviceItemPriceRef={React.createRef()}
        serviceDescriptionRef={React.createRef()}
        serviceTaxableRef={React.createRef()}
        isBillRateEnable
        labelPreference={mockLabelPreference}
        timeOffMethod={null}
      />,
      [], // empty mocks array
      {
        defaultValues: {
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
          toggleBreak: true,
          startDate: dayjs(),
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
          billable: false,
          billableStatus: undefined,
          billRate: null,
          notes: '',
          breakDuration: null,
          payType: {
            id: '',
            name: '',
          },
          costRate: null,
          taxable: false,
          closedBookPassword: '',
        },
      },
    );
    const headerText = component.queryByDisplayValue('Hi, John', {
      exact: false,
    });
    expect(headerText).toBeDefined();
  });
});
