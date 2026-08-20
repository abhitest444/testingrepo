import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SchedulesTimeEntrySettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/SchedulesTimeEntrySettings';
import {
  SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS,
  SCHEDULE_MANAGE_VALUE,
  SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS,
  SCHEDULE_VIEW_VALUE,
} from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/constants';
import { timeEntrySettingsDefaultState } from 'src/js/service/hooks/settings/useGetQLSettings';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const mockPubsub = {
  publish: jest.fn(),
  subscribe: jest.fn(),
};

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    pubsub: mockPubsub,
    logger: mockLogger,
  }),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => `msg:${id}`,
  }),
  useTracking: jest.fn(() => jest.fn()),
}));

const mockSaveScheduleSettings = jest.fn().mockResolvedValue(undefined);
let capturedScheduleSettingsOnSuccess: (() => void) | undefined;
let capturedScheduleSettingsOnError: ((error: string) => void) | undefined;

jest.mock('src/js/service/hooks/settings/useSetQLSettings', () => ({
  useSetQLSettings: jest.fn(
    (args: { onSuccess: () => void; onError: (error: string) => void }) => {
      capturedScheduleSettingsOnSuccess = args.onSuccess;
      capturedScheduleSettingsOnError = args.onError;
      return [mockSaveScheduleSettings, { loading: false }];
    },
  ),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    useTimeTrackingSettingsContext: jest.fn(),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/schedules/SchedulesTimeEntrySettingsEdit',
  () => ({
    SchedulesTimeEntrySettingsEdit: ({
      onDraftManageChange,
    }: {
      onDraftManageChange: (value: string) => void;
    }) => (
      <div data-testid="schedules-edit-content">
        <button
          type="button"
          data-testid="change-manage-company"
          onClick={() => onDraftManageChange('company')}
        >
          Change manage
        </button>
      </div>
    ),
  }),
);

jest.mock('@payroll-shared-components/payroll-settings-section', () => ({
  __esModule: true,
  default: ({
    mode,
    title,
    viewContent,
    editContent,
    readonly,
    id,
    onEdit,
    onSave,
    onCancel,
    saveButtonText,
    cancelButtonText,
  }: {
    mode: string;
    title: React.ReactNode;
    viewContent: React.ReactNode;
    editContent?: React.ReactNode;
    readonly?: boolean;
    id: string;
    onEdit?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    saveButtonText?: string;
    cancelButtonText?: string;
  }) => (
    <div data-testid="schedules-settings-section">
      <div data-testid="settings-section-id">{id}</div>
      <div data-testid="settings-section-mode">{mode}</div>
      <div data-testid="settings-section-readonly">{String(readonly)}</div>
      <div data-testid="settings-section-title">{title}</div>
      <div data-testid="settings-section-main-content">
        {mode === 'EDIT' ? editContent : viewContent}
      </div>
      {!readonly && onEdit && mode === 'VIEW' ? (
        <button type="button" data-testid="settings-edit" onClick={onEdit}>
          Edit
        </button>
      ) : null}
      {mode === 'EDIT' ? (
        <>
          <button
            type="button"
            data-testid="settings-cancel"
            onClick={onCancel}
          >
            {cancelButtonText}
          </button>
          <button type="button" data-testid="settings-save" onClick={onSave}>
            {saveButtonText}
          </button>
        </>
      ) : null}
    </div>
  ),
}));

jest.mock('src/js/widgets/timeTrackingSettings/common/viewContent', () => ({
  ViewContent: ({
    formFields,
    isErrorInView,
  }: {
    formFields: Record<string, unknown>;
    isErrorInView?: boolean;
  }) => (
    <div data-testid="view-content-mock">
      {isErrorInView ? (
        <div data-testid="view-content-error">ql-fetch-error</div>
      ) : (
        <>
          {formFields &&
            Object.entries(formFields).map(([sectionKey, fields]) =>
              Array.isArray(fields)
                ? fields.map((field: any) => (
                    <div
                      key={field.key}
                      data-testid={`view-field-${field.key}`}
                    >
                      <span data-testid={`field-title-${field.key}`}>
                        {field.title}
                      </span>
                      <span data-testid={`field-value-${field.key}`}>
                        {field.value}
                      </span>
                    </div>
                  ))
                : null,
            )}
        </>
      )}
    </div>
  ),
}));

const { useTimeTrackingSettingsContext } = jest.requireMock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
) as { useTimeTrackingSettingsContext: jest.Mock };

describe('SchedulesTimeEntrySettings', () => {
  const mockRefetchQlSettings = jest.fn().mockResolvedValue(undefined);

  const defaultContext = {
    isFormEditable: true,
    isQLSettingsLoading: false,
    QLSettingsError: '',
    timeEntryNewBadgeVisibleFor: {
      schedulesVisibilityEndDate: '',
    },
    QLData: timeEntrySettingsDefaultState,
    refetchQlSettings: mockRefetchQlSettings,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockPubsub.publish.mockClear();
    mockSaveScheduleSettings.mockClear();
    mockSaveScheduleSettings.mockResolvedValue(undefined);
    capturedScheduleSettingsOnSuccess = undefined;
    capturedScheduleSettingsOnError = undefined;
    useTimeTrackingSettingsContext.mockReturnValue(defaultContext);
  });

  it('renders SettingsSection in VIEW mode, not readonly, with stable id', () => {
    render(<SchedulesTimeEntrySettings />);
    expect(screen.getByTestId('settings-section-mode')).toHaveTextContent(
      'VIEW',
    );
    expect(screen.getByTestId('settings-section-readonly')).toHaveTextContent(
      'false',
    );
    expect(screen.getByTestId('settings-section-id')).toHaveTextContent(
      'schedules-settings-handle',
    );
  });

  it('renders edit control when not readonly', () => {
    render(<SchedulesTimeEntrySettings />);
    expect(screen.getByTestId('settings-edit')).toBeInTheDocument();
  });

  it('switches to EDIT mode and shows edit content when Edit is clicked', () => {
    render(<SchedulesTimeEntrySettings />);
    fireEvent.click(screen.getByTestId('settings-edit'));
    expect(screen.getByTestId('settings-section-mode')).toHaveTextContent(
      'EDIT',
    );
    expect(screen.getByTestId('schedules-edit-content')).toBeInTheDocument();
    expect(screen.queryByTestId('view-content-mock')).not.toBeInTheDocument();
  });

  it('returns to VIEW when Save is clicked with no draft changes (does not call mutation)', () => {
    render(<SchedulesTimeEntrySettings />);
    fireEvent.click(screen.getByTestId('settings-edit'));
    fireEvent.click(screen.getByTestId('settings-save'));
    expect(screen.getByTestId('settings-section-mode')).toHaveTextContent(
      'VIEW',
    );
    expect(screen.getByTestId('view-content-mock')).toBeInTheDocument();
    expect(mockSaveScheduleSettings).not.toHaveBeenCalled();
  });

  it('returns to VIEW when Cancel is clicked', () => {
    render(<SchedulesTimeEntrySettings />);
    fireEvent.click(screen.getByTestId('settings-edit'));
    fireEvent.click(screen.getByTestId('settings-cancel'));
    expect(screen.getByTestId('settings-section-mode')).toHaveTextContent(
      'VIEW',
    );
    expect(screen.getByTestId('view-content-mock')).toBeInTheDocument();
  });

  it('feeds ViewContent form fields with preferences header and QL schedule message ids', () => {
    render(<SchedulesTimeEntrySettings />);

    expect(
      screen.getByTestId('field-title-schedulesPreferencesHeader'),
    ).toHaveTextContent('time-entries.section.title.schedules.preferences');

    expect(screen.getByTestId('field-value-viewSchedule')).toHaveTextContent(
      SCHEDULE_VIEW_PREFERENCE_MESSAGE_IDS[SCHEDULE_VIEW_VALUE.THEIR_OWN],
    );
    expect(screen.getByTestId('field-value-manageSchedule')).toHaveTextContent(
      SCHEDULE_MANAGE_PREFERENCE_MESSAGE_IDS[SCHEDULE_MANAGE_VALUE.THEIR_OWN],
    );

    expect(screen.getByTestId('field-title-viewSchedule')).toHaveTextContent(
      'time-entries.section.title.schedules.view-schedule',
    );
    expect(screen.getByTestId('field-title-manageSchedule')).toHaveTextContent(
      'time-entries.section.title.schedules.manage-schedule',
    );
  });

  it('shows QL fetch error in view mode instead of default schedule preferences', () => {
    useTimeTrackingSettingsContext.mockReturnValue({
      ...defaultContext,
      QLSettingsError: 'Network error',
    });
    render(<SchedulesTimeEntrySettings />);

    expect(screen.getByTestId('view-content-error')).toBeInTheDocument();
    expect(
      screen.queryByTestId('field-title-schedulesPreferencesHeader'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('settings-section-readonly')).toHaveTextContent(
      'true',
    );
    expect(screen.queryByTestId('settings-edit')).not.toBeInTheDocument();
  });

  describe('sandbox.logger instrumentation', () => {
    it('logs SECTION_READY when schedule settings load successfully', () => {
      render(<SchedulesTimeEntrySettings />);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=SchedulesTimeEntrySettings Event=SECTION_READY section=SCHEDULES',
      );
      expect(mockPubsub.publish).toHaveBeenCalled();
    });

    it('does not log SECTION_READY while QL settings are loading', () => {
      useTimeTrackingSettingsContext.mockReturnValue({
        ...defaultContext,
        isQLSettingsLoading: true,
      });

      render(<SchedulesTimeEntrySettings />);

      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Component=SchedulesTimeEntrySettings Event=SECTION_READY section=SCHEDULES',
      );
    });

    it('logs Edit_Mode_Opened when the edit button is clicked', () => {
      render(<SchedulesTimeEntrySettings />);
      fireEvent.click(screen.getByTestId('settings-edit'));

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=SchedulesTimeEntrySettings Event=Edit_Mode_Opened section=SCHEDULES',
      );
    });

    it('logs SAVE_SUCCESS when schedule preferences save succeeds', () => {
      render(<SchedulesTimeEntrySettings />);
      fireEvent.click(screen.getByTestId('settings-edit'));
      fireEvent.click(screen.getByTestId('change-manage-company'));
      fireEvent.click(screen.getByTestId('settings-save'));

      expect(mockSaveScheduleSettings).toHaveBeenCalled();
      capturedScheduleSettingsOnSuccess?.();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=SchedulesTimeEntrySettings Event=SAVE_SUCCESS section=SCHEDULES',
      );
    });

    it('logs SAVE_ERROR when schedule preferences save fails', () => {
      render(<SchedulesTimeEntrySettings />);
      fireEvent.click(screen.getByTestId('settings-edit'));
      fireEvent.click(screen.getByTestId('change-manage-company'));
      fireEvent.click(screen.getByTestId('settings-save'));

      capturedScheduleSettingsOnError?.('save failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=SchedulesTimeEntrySettings Event=SAVE_ERROR section=SCHEDULES',
        { error: 'save failed' },
      );
    });
  });
});
