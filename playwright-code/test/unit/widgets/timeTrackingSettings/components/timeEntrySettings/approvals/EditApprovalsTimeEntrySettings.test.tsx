import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditApprovalsTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/approvals/EditApprovalsTimeEntrySettings';

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'time-entries.section.title.approvals.approval-installed':
          'Approval installed',
        'time-entries.section.title.approvals.require-approval-for-tracked-time':
          'Require approval for tracked time',
        'time-entries.section.title.approvals.require-approval-for-tracked-time.subtitle':
          'Require approval for tracked time subtitle',
        'time-entries.section.title.approvals.require-team-members-submit-time':
          'Require team members to submit time',
        'time-entries.section.title.approvals.require-submission-for-full-week':
          'Require submission for full week',
        'time-entries.section.title.approvals.custom-message': 'Custom message',
        'time-entries.section.title.approvals.reset-message': 'Reset message',
        'time-entries.approvals.custom-message.default':
          'By submitting your timesheets you agree that they are complete and accurate.',
        'time.tracking.validation.blank.submit.message':
          'Submit message cannot be blank.',
        'time.tracking.validation.invalid.submit.message.length':
          'Submit message must be less than 192 characters.',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => jest.fn(),
}));

// Mock TimeTrackingSettingsContext
const mockApprovalSettings = {
  requireApprovalForTrackedTime: { version: '1', value: true },
  requireTeamMembersSubmitTime: { version: '1', value: false },
  enablePartialWeekSubmission: { version: '1', value: false },
  customMessage: { version: '1', value: 'Default API message' },
};

const defaultContextValue = {
  approvalSettings: null as any,
  approvalSettingsLoading: false,
};

let mockContextValue: any = defaultContextValue;

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: () => mockContextValue,
  }),
);

// Mock IDS components with proper event handling
jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: jest.fn(({ children, onChange, checked, disabled }) => (
    <label>
      <input
        type="checkbox"
        onChange={onChange}
        checked={checked}
        disabled={disabled}
        data-testid="checkbox"
      />
      {children}
    </label>
  )),
}));

jest.mock('@ids-ts/textarea', () => ({
  TextArea: jest.fn(({ value, onChange, errorText, ...props }) => (
    <div>
      <textarea
        value={value}
        onChange={onChange}
        data-testid="custom-message"
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...props}
      />
      {errorText && <span data-testid="custom-message-error">{errorText}</span>}
    </div>
  )),
}));

const TestWrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const methods = useForm({
    defaultValues: {
      requireApprovalForTrackedTime: false,
      requireTeamMembersSubmitTime: false,
      requireSubmissionForFullWeek: false,
      customMessage: '',
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

// Helper function to reset mock context
const resetMockContext = () => {
  mockContextValue = defaultContextValue;
};

describe('EditApprovalsTimeEntrySettings', () => {
  beforeEach(() => {
    resetMockContext();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing when not loading', () => {
      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      expect(screen.getByText('Approval installed')).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time subtitle'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time'),
      ).toBeInTheDocument();
    });

    it('should render main checkbox and hide child options when parent is unchecked', () => {
      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      // Install approval checkbox should be visible, checked, and disabled
      const installApprovalCheckbox = screen
        .getByTestId('install-approval')
        .querySelector('input');
      expect(installApprovalCheckbox).toBeInTheDocument();
      expect(installApprovalCheckbox).toBeChecked();
      expect(installApprovalCheckbox).toBeDisabled();

      // Main checkbox should be visible
      expect(
        screen.getByTestId('require-approval-for-tracked-time'),
      ).toBeInTheDocument();

      // Child options should not be visible when parent is unchecked
      expect(
        screen.queryByTestId('require-team-members-submit-time'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('require-submission-for-full-week'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('custom-message')).not.toBeInTheDocument();
    });

    it('should toggle install approval checkbox handler when triggered', () => {
      const { Checkbox } = require('@ids-ts/checkbox');

      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      const installApprovalCheckboxCall = (
        Checkbox as jest.Mock
      ).mock.calls.find(([props]: any[]) => props?.disabled === true);

      expect(installApprovalCheckboxCall).toBeDefined();
      const [installApprovalProps] = installApprovalCheckboxCall;
      expect(() => installApprovalProps.onChange()).not.toThrow();
    });
  });

  describe('Form Values from API', () => {
    it('should render form fields correctly', () => {
      mockContextValue = {
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
      };

      const TestWrapperWithChecked: React.FC<React.PropsWithChildren<{}>> = ({
        children,
      }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithChecked>,
      );

      // Verify install approval checkbox is always checked and disabled
      const installApprovalCheckbox = screen
        .getByTestId('install-approval')
        .querySelector('input');
      expect(installApprovalCheckbox).toBeChecked();
      expect(installApprovalCheckbox).toBeDisabled();

      // Verify the form renders with the fields visible
      expect(
        screen.getByTestId('require-approval-for-tracked-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-team-members-submit-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-submission-for-full-week'),
      ).toBeInTheDocument();
    });

    it('should handle approval settings with null data', () => {
      mockContextValue = {
        approvalSettings: null,
        approvalSettingsLoading: false,
      };

      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      // Should render without crashing
      expect(screen.getByText('Approval installed')).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time'),
      ).toBeInTheDocument();
    });

    it('should handle approval settings with undefined fields', () => {
      mockContextValue = {
        approvalSettings: {
          requireApprovalForTrackedTime: undefined,
          requireTeamMembersSubmitTime: undefined,
          enablePartialWeekSubmission: undefined,
          customMessage: undefined,
        },
        approvalSettingsLoading: false,
      };

      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      // Should render without crashing and use default values
      expect(screen.getByText('Approval installed')).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time'),
      ).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should show child options when main checkbox is checked', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true, // Main checkbox checked
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      // All child options should be visible
      expect(
        screen.getByTestId('require-team-members-submit-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-submission-for-full-week'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-message')).toBeInTheDocument();
      expect(screen.getByText('Reset message')).toBeInTheDocument();
    });

    it('should toggle child options visibility when main checkbox is clicked', () => {
      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      // Initially child options should not be visible
      expect(
        screen.queryByTestId('require-team-members-submit-time'),
      ).not.toBeInTheDocument();

      // Click main checkbox
      const mainCheckbox = screen
        .getByTestId('require-approval-for-tracked-time')
        .querySelector('input');
      fireEvent.click(mainCheckbox!);

      // Child options should now be visible
      expect(
        screen.getByTestId('require-team-members-submit-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-submission-for-full-week'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-message')).toBeInTheDocument();
    });

    it('should keep parent and children visible when require approval is enabled', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      expect(
        screen.getByTestId('require-approval-for-tracked-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-team-members-submit-time'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('require-submission-for-full-week'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-message')).toBeInTheDocument();
    });

    it('should hide team member submission option when show flag is false', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption={false}
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      expect(
        screen.queryByTestId('require-team-members-submit-time'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('require-submission-for-full-week'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('custom-message')).toBeInTheDocument();
    });

    it('should hide require approval row and children when show flag is false', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime={false}
          />
        </TestWrapperWithMainChecked>,
      );

      expect(
        screen.queryByTestId('require-approval-for-tracked-time'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('require-team-members-submit-time'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('require-submission-for-full-week'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('custom-message')).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle main checkbox toggle', () => {
      render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      const mainCheckbox = screen
        .getByTestId('require-approval-for-tracked-time')
        .querySelector('input');

      // Initially unchecked
      expect(mainCheckbox).not.toBeChecked();

      // Click to check
      fireEvent.click(mainCheckbox!);
      expect(mainCheckbox).toBeChecked();

      // Click to uncheck
      fireEvent.click(mainCheckbox!);
      expect(mainCheckbox).not.toBeChecked();
    });

    it('should handle child checkbox interactions when parent is checked', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowTeamMemberSubmissionOption
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      const submitTimeCheckbox = screen
        .getByTestId('require-team-members-submit-time')
        .querySelector('input');
      const fullWeekCheckbox = screen
        .getByTestId('require-submission-for-full-week')
        .querySelector('input');

      // Initially unchecked
      expect(submitTimeCheckbox).not.toBeChecked();
      expect(fullWeekCheckbox).not.toBeChecked();

      // Click to check both
      fireEvent.click(submitTimeCheckbox!);
      fireEvent.click(fullWeekCheckbox!);

      expect(submitTimeCheckbox).toBeChecked();
      expect(fullWeekCheckbox).toBeChecked();
    });

    it('should handle textarea input', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Type in textarea
      fireEvent.change(textarea, {
        target: { value: 'Custom approval message' },
      });
      expect(textarea).toHaveValue('Custom approval message');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to default system message when no API data', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: 'Some user input',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      const textarea = screen.getByTestId('custom-message');
      const resetLink = screen.getByText('Reset message');

      // Initially has user input
      expect(textarea).toHaveValue('Some user input');

      // Click reset
      fireEvent.click(resetLink);

      // Should reset to default system message
      expect(textarea).toHaveValue(
        'By submitting your timesheets you agree that they are complete and accurate.',
      );
    });

    it('should reset to default system message when approval settings are available', () => {
      mockContextValue = {
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
      };

      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: 'User modified message',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      const textarea = screen.getByTestId('custom-message');
      const resetLink = screen.getByText('Reset message');

      // Initially has user input
      expect(textarea).toHaveValue('User modified message');

      // Click reset
      fireEvent.click(resetLink);

      // Should reset to default system message (not API value)
      expect(textarea).toHaveValue(
        'By submitting your timesheets you agree that they are complete and accurate.',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty textarea value gracefully', () => {
      const TestWrapperWithMainChecked: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithMainChecked>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithMainChecked>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Should handle empty value
      expect(textarea).toHaveValue('');

      // Should handle setting to null/undefined
      fireEvent.change(textarea, { target: { value: null } });
      expect(textarea).toHaveValue('');
    });

    it('should render correctly when approval settings change', () => {
      // Start with null settings
      mockContextValue = {
        approvalSettings: null,
        approvalSettingsLoading: false,
      };

      const { rerender } = render(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      expect(screen.getByText('Approval installed')).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time'),
      ).toBeInTheDocument();

      // Change to loaded state with data
      mockContextValue = {
        approvalSettings: mockApprovalSettings,
        approvalSettingsLoading: false,
      };

      rerender(
        <TestWrapper>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapper>,
      );

      // Should still render correctly
      expect(screen.getByText('Approval installed')).toBeInTheDocument();
      expect(
        screen.getByText('Require approval for tracked time'),
      ).toBeInTheDocument();
    });
  });

  describe('Custom Message Validation', () => {
    it('should show error when custom message is empty', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: 'Valid message',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Trigger validation by clearing the field
      fireEvent.change(textarea, { target: { value: '' } });
      fireEvent.blur(textarea);

      // Wait for error message to appear
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('custom-message-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(
          'Submit message cannot be blank.',
        );
      });
    });

    it('should show error when custom message is only whitespace', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: 'Valid message',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Change to whitespace only
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.blur(textarea);

      // Wait for error message to appear
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('custom-message-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(
          'Submit message cannot be blank.',
        );
      });
    });

    it('should show error when custom message exceeds 192 characters', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Create a message longer than 192 characters
      const longMessage = 'a'.repeat(193);
      fireEvent.change(textarea, { target: { value: longMessage } });
      fireEvent.blur(textarea);

      // Wait for error message to appear
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('custom-message-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(
          'Submit message must be less than 192 characters.',
        );
      });
    });

    it('should not show error for valid custom message', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Enter a valid message
      fireEvent.change(textarea, {
        target: { value: 'This is a valid custom message' },
      });
      fireEvent.blur(textarea);

      // Wait and ensure no error message appears
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('custom-message-error');
        expect(errorMessage).not.toBeInTheDocument();
      });
    });

    it('should accept message with exactly 192 characters', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: '',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // Create a message with exactly 192 characters
      const exactLengthMessage = 'a'.repeat(192);
      fireEvent.change(textarea, { target: { value: exactLengthMessage } });
      fireEvent.blur(textarea);

      // Wait and ensure no error message appears
      await waitFor(() => {
        const errorMessage = screen.queryByTestId('custom-message-error');
        expect(errorMessage).not.toBeInTheDocument();
      });
    });

    it('should clear error when valid message is entered after error', async () => {
      const TestWrapperWithValidation: React.FC<
        React.PropsWithChildren<{}>
      > = ({ children }) => {
        const methods = useForm({
          defaultValues: {
            requireApprovalForTrackedTime: true,
            requireTeamMembersSubmitTime: false,
            requireSubmissionForFullWeek: false,
            customMessage: 'Valid initial message',
          },
          mode: 'onChange',
        });

        return <FormProvider {...methods}>{children}</FormProvider>;
      };

      render(
        <TestWrapperWithValidation>
          <EditApprovalsTimeEntrySettings
            shouldShowRequireApprovalForTrackedTime
          />
        </TestWrapperWithValidation>,
      );

      const textarea = screen.getByTestId('custom-message');

      // First, trigger an error by clearing the field
      fireEvent.change(textarea, { target: { value: '' } });
      fireEvent.blur(textarea);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.queryByTestId('custom-message-error'),
        ).toBeInTheDocument();
      });

      // Now enter a valid message
      fireEvent.change(textarea, {
        target: { value: 'Valid message now' },
      });
      fireEvent.blur(textarea);

      // Wait for error to disappear
      await waitFor(() => {
        expect(
          screen.queryByTestId('custom-message-error'),
        ).not.toBeInTheDocument();
      });
    });
  });
});
