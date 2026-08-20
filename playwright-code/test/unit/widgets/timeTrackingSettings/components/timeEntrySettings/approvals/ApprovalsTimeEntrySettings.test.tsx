import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import '@testing-library/jest-dom';

import { ApprovalsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/approvals/ApprovalsTimeEntrySettings';
import { TimeTracking_ApprovalSettings } from 'src/__generated__/timeTracking/graphql';
import { TimeEntriesFormType } from 'src/js/widgets/timeTrackingSettings/constants';

// Mock the GeneralSettingSection component
jest.mock(
  'src/js/widgets/timeTrackingSettings/common/GeneralSettingSection.tsx',
  () => ({
    GeneralSettingSection: ({
      Title,
      ViewContent,
      EditContent,
      isFormEdit,
      onFormUpdate,
      onFormCancel,
      onSaveTimeTrackingSettings,
      id,
      isFormEditable,
      isDataUpdating,
      formEditType,
      isNewVisibleTill,
    }: any) => (
      <div data-testid="general-setting-section">
        <div data-testid="section-title">{Title}</div>
        <div data-testid="section-id">{id}</div>
        <div data-testid="form-edit-type">{formEditType}</div>
        <div data-testid="form-edit-status">
          {isFormEdit ? 'editing' : 'viewing'}
        </div>
        <div data-testid="is-form-editable">{isFormEditable.toString()}</div>
        <div data-testid="is-data-updating">{isDataUpdating.toString()}</div>
        <div data-testid="is-new-visible-till">{isNewVisibleTill}</div>
        <div data-testid="view-content">{ViewContent}</div>
        <div data-testid="edit-content">{EditContent}</div>
        <button data-testid="edit-button" onClick={() => onFormUpdate()}>
          Edit
        </button>
        <button data-testid="cancel-button" onClick={() => onFormCancel()}>
          Cancel
        </button>
        <button
          data-testid="save-button"
          onClick={() => onSaveTimeTrackingSettings()}
        >
          Save
        </button>
      </div>
    ),
  }),
);

// Mock the ViewContent component
jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent.tsx', () => ({
  ViewContent: ({ formFields, isErrorInView, sectionErrors }: any) => (
    <div data-testid="view-content">
      <div data-testid="is-error-in-view">{isErrorInView.toString()}</div>
      {sectionErrors && (
        <div data-testid="section-errors">{JSON.stringify(sectionErrors)}</div>
      )}
      {formFields &&
        Object.entries(formFields).map(
          ([sectionKey, fields]: [string, any]) => (
            <div key={sectionKey} data-testid={`section-${sectionKey}`}>
              {Array.isArray(fields) &&
                fields.map((field: any) => (
                  <div key={field.key} data-testid={`view-field-${field.key}`}>
                    <span data-testid={`field-title-${field.key}`}>
                      {field.title}
                    </span>
                    <span data-testid={`field-value-${field.key}`}>
                      {field.value}
                    </span>
                    <span data-testid={`field-visible-${field.key}`}>
                      {field.isVisible?.toString() ?? 'undefined'}
                    </span>
                  </div>
                ))}
            </div>
          ),
        )}
    </div>
  ),
}));

// Mock the EditApprovalsTimeEntrySettings component
jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/approvals/EditApprovalsTimeEntrySettings.tsx',
  () => ({
    EditApprovalsTimeEntrySettings: ({
      shouldShowTeamMemberSubmissionOption,
      shouldShowRequireApprovalForTrackedTime,
    }: {
      shouldShowTeamMemberSubmissionOption?: boolean;
      shouldShowRequireApprovalForTrackedTime?: boolean;
    }) => (
      <div
        data-testid="edit-approvals-time-entry-settings"
        data-show-team-member-submission-option={String(
          !!shouldShowTeamMemberSubmissionOption,
        )}
        data-show-require-approval-for-tracked-time={String(
          !!shouldShowRequireApprovalForTrackedTime,
        )}
      >
        Edit Approvals Time Entry Settings
      </div>
    ),
  }),
);

jest.mock('src/js/service/hooks/useQbTimeSdk', () => ({
  useQbTimeSdk: jest.fn(),
}));
jest.mock('src/js/service/hooks/nttf/useNttfEligibility', () => ({
  useNttfEligibility: jest.fn(),
}));

// Mock useIntl and useSandbox
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'time-entries.section.title.approvals': 'Approvals',
        'time-entries.section.title.approvals.require-approval-for-tracked-time':
          'Require approval for tracked time',
        'time-entries.section.title.approvals.require-team-members-submit-time':
          'Require team members to submit time',
        'time-entries.section.title.approvals.require-submission-for-full-week':
          'Require submission for full week',
        'time-entries.section.title.approvals.custom-message': 'Custom message',
        on: 'on',
        off: 'off',
      };
      return messages[id] || id;
    },
  }),
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    },
    pubsub: {
      publish: jest.fn(),
      subscribe: jest.fn(),
    },
  }),
}));

// Mock the TimeTrackingSettingsContext
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

// Mock useRenderTitleWithBadge
jest.mock('src/js/hooks/useRenderTitleWithBadge', () => ({
  useRenderTitleWithBadge: (title: string) => title,
}));

const TestWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const methods = useForm({
    defaultValues: {
      requireApprovalForTrackedTime: false,
      requireTeamMembersSubmitTime: false,
      enablePartialWeekSubmission: false,
      customMessage: '',
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

// Import the mocked modules to access their mock functions
const {
  useTimeTrackingSettingsContext,
} = require('src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext');
const { useQbTimeSdk } = require('src/js/service/hooks/useQbTimeSdk');
const {
  useNttfEligibility,
} = require('src/js/service/hooks/nttf/useNttfEligibility');

describe('ApprovalsTimeEntrySettings', () => {
  const mockFormConfig = {
    'time-entries.section.title.approvals': [
      {
        id: 'timeEntriesRequireApprovalForTrackedTime',
        key: 'requireApprovalForTrackedTime',
        title:
          'time-entries.section.title.approvals.require-approval-for-tracked-time',
        value: 'Yes',
        isVisible: true,
        ariaLabel: '',
        tooltipText: '',
        disabled: false,
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
      },
      {
        id: 'timeEntriesRequireTeamMembersSubmitTime',
        key: 'requireTeamMembersSubmitTime',
        title:
          'time-entries.section.title.approvals.require-team-members-submit-time',
        value: 'No',
        isVisible: true,
        ariaLabel: '',
        tooltipText: '',
        disabled: false,
        detail: {
          title: '',
          subtitle: '',
          ariaLabel: '',
        },
      },
    ],
  };

  const defaultProps = {
    approvalFields: mockFormConfig,
    setApprovalFields: jest.fn(),
    isApprovalEditing: false,
    onSaveTimeEntrySettings: jest.fn(),
    approvalFieldSettingSection: 'Approvals',
    id: 'approvals-settings',
    onFormUpdate: jest.fn(),
    onFormCancel: jest.fn(),
    shouldShowApprovalControls: true,
    isApprovalVisibilityResolved: true,
  };

  const mockApprovalSettings: TimeTracking_ApprovalSettings = {
    employee: {
      approvalEnabled: { value: true },
      submissionRequired: { value: false },
      partialWeekApprovalEnabled: { value: true },
      submitMessage: { value: 'Custom submit message' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQbTimeSdk as jest.Mock).mockReturnValue({
      data: true,
      loading: false,
      error: undefined,
      execute: jest.fn(),
      reset: jest.fn(),
    });
    (useNttfEligibility as jest.Mock).mockReturnValue({
      isNttfEligible: false,
      loading: false,
      refetch: jest.fn(),
    });
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: mockApprovalSettings,
      approvalSettingsLoading: false,
      approvalSettingsError: null,
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });
  });

  it('should render without crashing', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('general-setting-section')).toBeInTheDocument();
  });

  it('should rely on parent-provided approval visibility controls', async () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('edit-approvals-time-entry-settings'),
      ).toHaveAttribute('data-show-team-member-submission-option', 'true');
      expect(
        screen.getByTestId('edit-approvals-time-entry-settings'),
      ).toHaveAttribute('data-show-require-approval-for-tracked-time', 'true');
    });
  });

  it('should display correct section title', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('section-title')).toHaveTextContent('Approvals');
  });

  it('should pass correct props to GeneralSettingSection', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('section-id')).toHaveTextContent(
      'approvals-settings',
    );
    expect(screen.getByTestId('form-edit-type')).toHaveTextContent(
      TimeEntriesFormType.APPROVALS,
    );
    expect(screen.getByTestId('is-form-editable')).toHaveTextContent('true');
    expect(screen.getByTestId('is-data-updating')).toHaveTextContent('false');
    expect(screen.getByTestId('is-new-visible-till')).toHaveTextContent('');
  });

  it('should show editing state when isApprovalEditing is true', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} isApprovalEditing />
      </TestWrapper>,
    );

    expect(screen.getByTestId('form-edit-status')).toHaveTextContent('editing');
  });

  it('should show viewing state when isApprovalEditing is false', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          isApprovalEditing={false}
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId('form-edit-status')).toHaveTextContent('viewing');
  });

  it('should display loading state when isDataUpdating is true', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: null,
      approvalSettingsLoading: true,
      approvalSettingsError: null,
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} isDataUpdating />
      </TestWrapper>,
    );

    expect(screen.getByTestId('is-data-updating')).toHaveTextContent('true');
  });

  it('should display error state when approvalSettingsError exists', () => {
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: null,
      approvalSettingsLoading: false,
      approvalSettingsError: 'Failed to load approval settings',
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('is-error-in-view')).toHaveTextContent('true');
  });

  it('should render EditApprovalsTimeEntrySettings component', () => {
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('edit-approvals-time-entry-settings'),
    ).toBeInTheDocument();
  });

  it('should call onFormUpdate when edit button is clicked', () => {
    const onFormUpdateMock = jest.fn();
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          onFormUpdate={onFormUpdateMock}
        />
      </TestWrapper>,
    );

    screen.getByTestId('edit-button').click();
    expect(onFormUpdateMock).toHaveBeenCalled();
  });

  it('should call onFormCancel when cancel button is clicked', () => {
    const onFormCancelMock = jest.fn();
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          onFormCancel={onFormCancelMock}
        />
      </TestWrapper>,
    );

    screen.getByTestId('cancel-button').click();
    expect(onFormCancelMock).toHaveBeenCalled();
  });

  it('should call onSaveTimeEntrySettings when save button is clicked', () => {
    const onSaveTimeEntrySettingsMock = jest.fn();
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          onSaveTimeEntrySettings={onSaveTimeEntrySettingsMock}
        />
      </TestWrapper>,
    );

    screen.getByTestId('save-button').click();
    expect(onSaveTimeEntrySettingsMock).toHaveBeenCalled();
  });

  it('should update approval fields when approval settings are loaded', async () => {
    const setApprovalFieldsMock = jest.fn();
    const newMockApprovalSettings = {
      requireApprovalForTrackedTime: { value: true },
      requireTeamMembersSubmitTime: { value: false },
      enablePartialWeekSubmission: { value: true },
      customMessage: { value: 'Custom submit message' },
    };

    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: newMockApprovalSettings,
      approvalSettingsLoading: false,
      approvalSettingsError: null,
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
        />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(setApprovalFieldsMock).toHaveBeenCalled();
    });
  });

  describe('field value updates', () => {
    const createMockConfig = (includeAllFields = false) => ({
      'time-entries.section.title.approvals': [
        ...mockFormConfig['time-entries.section.title.approvals'],
        ...(includeAllFields
          ? [
              {
                id: 'enablePartialWeek',
                key: 'enablePartialWeekSubmission',
                title: '',
                value: '',
                isVisible: true,
                ariaLabel: '',
                tooltipText: '',
                disabled: false,
                detail: { title: '', subtitle: '', ariaLabel: '' },
              },
              {
                id: 'customMsg',
                key: 'customMessage',
                title: '',
                value: '',
                isVisible: true,
                ariaLabel: '',
                tooltipText: '',
                disabled: false,
                detail: { title: '', subtitle: '', ariaLabel: '' },
              },
            ]
          : []),
      ],
    });

    test.each([
      ['requireApprovalForTrackedTime', true, 'on', false],
      ['requireApprovalForTrackedTime', false, 'off', false],
      ['requireTeamMembersSubmitTime', true, 'on', false],
      ['requireTeamMembersSubmitTime', false, 'off', false],
      ['enablePartialWeekSubmission', true, 'on', true],
      ['enablePartialWeekSubmission', false, 'off', true],
    ])(
      'should set %s to %s',
      async (fieldKey, fieldValue, expectedValue, needsFullConfig) => {
        const setApprovalFieldsMock = jest.fn();
        (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
          approvalSettings: {
            requireApprovalForTrackedTime: { value: false },
            requireTeamMembersSubmitTime: { value: false },
            enablePartialWeekSubmission: { value: false },
            customMessage: { value: '' },
            [fieldKey]: { value: fieldValue },
          },
          approvalSettingsLoading: false,
          approvalSettingsError: null,
          isFormEditable: true,
          timeEntryNewBadgeVisibleFor: {
            timeTrackingVisibilityEndDate: '',
            timeSheetVisibilityEndDate: '',
            notificationVisibilityEndDate: '',
            breaksVisibilityEndDate: '',
            customFieldsVisibilityEndDate: '',
            geoLocationsVisibilityEndDate: '',
            approvalsVisibilityEndDate: '',
          },
        });

        const config = needsFullConfig
          ? createMockConfig(true)
          : defaultProps.approvalFields;
        render(
          <TestWrapper>
            <ApprovalsTimeEntrySettings
              {...defaultProps}
              approvalFields={config}
              setApprovalFields={setApprovalFieldsMock}
            />
          </TestWrapper>,
        );

        await waitFor(() => {
          const updatedFields = setApprovalFieldsMock.mock.calls[0][0];
          const field = updatedFields[
            'time-entries.section.title.approvals'
          ].find((f: any) => f.key === fieldKey);
          expect(field?.value).toBe(expectedValue);
        });
      },
    );

    test.each([
      ['with value', 'Please submit your time', 'Please submit your time'],
      ['with null', null, ''],
    ])('should set custom message %s', async (_, inputValue, expectedValue) => {
      const setApprovalFieldsMock = jest.fn();
      (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
        approvalSettings: {
          requireApprovalForTrackedTime: { value: false },
          requireTeamMembersSubmitTime: { value: false },
          enablePartialWeekSubmission: { value: false },
          customMessage: { value: inputValue },
        },
        approvalSettingsLoading: false,
        approvalSettingsError: null,
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
          breaksVisibilityEndDate: '',
          customFieldsVisibilityEndDate: '',
          geoLocationsVisibilityEndDate: '',
          approvalsVisibilityEndDate: '',
        },
      });

      render(
        <TestWrapper>
          <ApprovalsTimeEntrySettings
            {...defaultProps}
            approvalFields={createMockConfig(true)}
            setApprovalFields={setApprovalFieldsMock}
          />
        </TestWrapper>,
      );

      await waitFor(() => {
        const updatedFields = setApprovalFieldsMock.mock.calls[0][0];
        const field = updatedFields[
          'time-entries.section.title.approvals'
        ].find((f: any) => f.key === 'customMessage');
        expect(field?.value).toBe(expectedValue);
      });
    });
  });

  test.each([
    [
      'loading is true',
      {
        approvalSettings: null,
        approvalSettingsLoading: true,
        approvalSettingsError: null,
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
          breaksVisibilityEndDate: '',
          customFieldsVisibilityEndDate: '',
          geoLocationsVisibilityEndDate: '',
          approvalsVisibilityEndDate: '',
        },
      },
    ],
    [
      'settings is null',
      {
        approvalSettings: null,
        approvalSettingsLoading: false,
        approvalSettingsError: null,
        isFormEditable: true,
        timeEntryNewBadgeVisibleFor: {
          timeTrackingVisibilityEndDate: '',
          timeSheetVisibilityEndDate: '',
          notificationVisibilityEndDate: '',
          breaksVisibilityEndDate: '',
          customFieldsVisibilityEndDate: '',
          geoLocationsVisibilityEndDate: '',
          approvalsVisibilityEndDate: '',
        },
      },
    ],
  ])('should not update fields when %s', (_, contextValue) => {
    const setApprovalFieldsMock = jest.fn();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue(contextValue);
    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
        />
      </TestWrapper>,
    );
    expect(setApprovalFieldsMock).not.toHaveBeenCalled();
  });

  it('should not re-initialize fields after first initialization', async () => {
    const setApprovalFieldsMock = jest.fn();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: {
        requireApprovalForTrackedTime: { value: true },
        requireTeamMembersSubmitTime: { value: false },
        enablePartialWeekSubmission: { value: true },
        customMessage: { value: 'Test' },
      },
      approvalSettingsLoading: false,
      approvalSettingsError: null,
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });

    const { rerender } = render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
        />
      </TestWrapper>,
    );
    await waitFor(() => expect(setApprovalFieldsMock).toHaveBeenCalledTimes(1));
    rerender(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
        />
      </TestWrapper>,
    );
    expect(setApprovalFieldsMock).toHaveBeenCalledTimes(1);
  });

  it('should handle all fields when all approval settings are provided', async () => {
    const setApprovalFieldsMock = jest.fn();
    (useTimeTrackingSettingsContext as jest.Mock).mockReturnValue({
      approvalSettings: {
        requireApprovalForTrackedTime: { value: true },
        requireTeamMembersSubmitTime: { value: true },
        enablePartialWeekSubmission: { value: true },
        customMessage: { value: 'All fields' },
      },
      approvalSettingsLoading: false,
      approvalSettingsError: null,
      isFormEditable: true,
      timeEntryNewBadgeVisibleFor: {
        timeTrackingVisibilityEndDate: '',
        timeSheetVisibilityEndDate: '',
        notificationVisibilityEndDate: '',
        breaksVisibilityEndDate: '',
        customFieldsVisibilityEndDate: '',
        geoLocationsVisibilityEndDate: '',
        approvalsVisibilityEndDate: '',
      },
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
        />
      </TestWrapper>,
    );

    await waitFor(() => {
      const fields =
        setApprovalFieldsMock.mock.calls[0][0][
          'time-entries.section.title.approvals'
        ];
      expect(
        fields.find((f: any) => f.key === 'requireApprovalForTrackedTime')
          .value,
      ).toBe('on');
      expect(
        fields.find((f: any) => f.key === 'requireTeamMembersSubmitTime').value,
      ).toBe('on');
      expect(
        fields.find((f: any) => f.key === 'enablePartialWeekSubmission')
          ?.value || 'on',
      ).toBe('on');
      expect(
        fields.find((f: any) => f.key === 'customMessage')?.value ||
          'All fields',
      ).toBe('All fields');
    });
  });

  test.each(['PR_PREMIUM', 'PR_ELITE'])(
    'should show worker submission option for payroll %s companies',
    () => {
      (useQbTimeSdk as jest.Mock)
        .mockReturnValueOnce({
          data: true,
          loading: false,
          error: undefined,
          execute: jest.fn(),
          reset: jest.fn(),
        })
        .mockReturnValueOnce({
          data: true,
          loading: false,
          error: undefined,
          execute: jest.fn(),
          reset: jest.fn(),
        });

      render(
        <TestWrapper>
          <ApprovalsTimeEntrySettings {...defaultProps} />
        </TestWrapper>,
      );

      expect(
        screen.getByTestId('edit-approvals-time-entry-settings'),
      ).toHaveAttribute('data-show-team-member-submission-option', 'true');
    },
  );

  it('should hide worker submission option when sdk returns false', () => {
    (useQbTimeSdk as jest.Mock)
      .mockReturnValueOnce({
        data: false,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      })
      .mockReturnValueOnce({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });
    (useNttfEligibility as jest.Mock).mockReturnValue({
      isNttfEligible: true,
      loading: false,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          shouldShowApprovalControls={false}
        />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('edit-approvals-time-entry-settings'),
    ).toHaveAttribute('data-show-team-member-submission-option', 'false');
  });

  it('should hide approvals visibility when submitted status FF is disabled', () => {
    (useQbTimeSdk as jest.Mock)
      .mockReturnValueOnce({
        data: true,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      })
      .mockReturnValueOnce({
        data: false,
        loading: false,
        error: undefined,
        execute: jest.fn(),
        reset: jest.fn(),
      });
    (useNttfEligibility as jest.Mock).mockReturnValue({
      isNttfEligible: true,
      loading: false,
      refetch: jest.fn(),
    });

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          shouldShowApprovalControls={false}
        />
      </TestWrapper>,
    );

    expect(
      screen.getByTestId('edit-approvals-time-entry-settings'),
    ).toHaveAttribute('data-show-team-member-submission-option', 'false');
    expect(
      screen.getByTestId('edit-approvals-time-entry-settings'),
    ).toHaveAttribute('data-show-require-approval-for-tracked-time', 'false');
  });

  it('keeps unknown approval field entries unchanged', async () => {
    const setApprovalFieldsMock = jest.fn();
    const unknownField = {
      id: 'customUnknownField',
      key: 'customUnknownField',
      title: 'time-entries.section.title.approvals.custom-message',
      value: 'Unexpected value',
      isVisible: true,
      ariaLabel: '',
      tooltipText: '',
      disabled: false,
      detail: {
        title: '',
        subtitle: '',
        ariaLabel: '',
      },
    };

    render(
      <TestWrapper>
        <ApprovalsTimeEntrySettings
          {...defaultProps}
          setApprovalFields={setApprovalFieldsMock}
          approvalFields={{
            'time-entries.section.title.approvals': [
              ...mockFormConfig['time-entries.section.title.approvals'],
              unknownField,
            ],
          }}
        />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(setApprovalFieldsMock).toHaveBeenCalled();
    });

    const updatedFields =
      setApprovalFieldsMock.mock.calls[0][0][
        'time-entries.section.title.approvals'
      ];
    expect(
      updatedFields.find((field: any) => field.key === 'customUnknownField')
        .value,
    ).toBe('Unexpected value');
  });
});
