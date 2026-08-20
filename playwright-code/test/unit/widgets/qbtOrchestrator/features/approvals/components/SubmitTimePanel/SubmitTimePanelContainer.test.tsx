import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SubmitTimePanelContainer from 'src/js/widgets/qbtOrchestrator/features/approvals/components/SubmitTimePanel/SubmitTimePanelContainer';
import {
  resetSubmitTimePanel,
  setLoading,
  setSubmitThroughDate,
  setSubmitTimePanelData,
  setSubmitting,
  toggleWeekExpanded,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/store/approvalsSlice';
import { APPROVALS_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/approvals/constants/approvalsLoggingConstants';

const mockDispatch = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
const mockFetchSubmitTimePanelData = jest.fn();
const mockSubmitTime = jest.fn();
const mockApprovalSettings = {
  requireApprovalForTrackedTime: { version: '1', value: true },
  enablePartialWeekSubmission: { version: '1', value: true },
  customMessage: { version: '1', value: '' },
};
let mockApprovalsLoading = false;
let mockApprovalsSettled = true;
let mockQLSettingsLoading = false;

const mockState = {
  approvals: {
    submitTimePanel: {
      isOpen: true,
      submitThroughDate: null as string | null,
      periodStartDate: null as string | null,
      weekGroups: [],
      expandedWeekIds: [] as string[],
      isLoading: false,
      isSubmitting: false,
      error: null,
    },
  },
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: mockLogger,
  }),
  useIntl: () => ({
    formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
      defaultMessage,
  }),
}));

jest.mock('src/js/widgets/qbtOrchestrator/features/approvals/hooks', () => ({
  useSubmitTimePanelData: () => ({
    fetchSubmitTimePanelData: mockFetchSubmitTimePanelData,
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetApprovalSettings', () => ({
  useGetApprovalSettings: () => ({
    loading: false,
    settled: mockApprovalsSettled,
    error: '',
    refetch: jest.fn(),
    approvalSettings: mockApprovalSettings,
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetQLSettings', () => ({
  useGetQLSettings: () => ({
    loading: mockQLSettingsLoading,
    error: '',
    refetch: jest.fn(),
    qlSettings: {
      firstDayOfWeek: { version: '1', value: 1 },
    },
  }),
}));

jest.mock('src/js/widgets/qbtOrchestrator/features/approvals/hooks', () => ({
  useSubmitTimePanelData: () => ({
    fetchSubmitTimePanelData: mockFetchSubmitTimePanelData,
  }),
  useSubmitTimeMutations: () => ({
    submitTime: mockSubmitTime,
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetApprovalSettings', () => ({
  useGetApprovalSettings: () => ({
    loading: mockApprovalsLoading,
    settled: mockApprovalsSettled,
    error: '',
    refetch: jest.fn(),
    approvalSettings: mockApprovalSettings,
  }),
}));

jest.mock('src/js/service/hooks/settings/useGetQLSettings', () => ({
  useGetQLSettings: () => ({
    loading: mockQLSettingsLoading,
    error: '',
    refetch: jest.fn(),
    qlSettings: {
      firstDayOfWeek: { version: '1', value: 1 },
    },
  }),
}));

jest.mock('src/js/widgets/qbtOrchestrator/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: any) => unknown) => selector(mockState),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/approvals/components/SubmitTimePanel/SubmitTimePanel',
  () => ({
    __esModule: true,
    default: ({
      onClose,
      onSubmitThroughDateChange,
      onToggleWeekExpanded,
      onOpenSubmitConfirmation,
      onSubmit,
      onDismissError,
      summaryThroughDate,
      showFullWeekSubmissionText,
      submitConfirmationMessage,
    }: {
      onClose: () => void;
      onSubmitThroughDateChange: (iso: string) => void;
      onToggleWeekExpanded: (id: string) => void;
      onOpenSubmitConfirmation: () => void;
      onSubmit: () => void;
      onDismissError: () => void;
      summaryThroughDate?: string | null;
      showFullWeekSubmissionText?: boolean;
      submitConfirmationMessage?: string | null;
    }) => (
      <div>
        <button data-testid="close" onClick={onClose}>
          close
        </button>
        <button
          data-testid="change-date"
          onClick={() => onSubmitThroughDateChange('2025-09-20')}
        >
          change date
        </button>
        <button
          data-testid="toggle-week"
          onClick={() => onToggleWeekExpanded('current')}
        >
          toggle week
        </button>
        <button
          data-testid="open-submit-confirmation"
          onClick={onOpenSubmitConfirmation}
        >
          open submit confirmation
        </button>
        <button data-testid="submit" onClick={onSubmit}>
          submit
        </button>
        <button data-testid="dismiss-error" onClick={onDismissError}>
          dismiss
        </button>
        <div data-testid="confirmation-message">
          {submitConfirmationMessage || ''}
        </div>
        <div data-testid="summary-through-date">{summaryThroughDate || ''}</div>
        <div data-testid="full-week-helper">
          {showFullWeekSubmissionText ? 'true' : 'false'}
        </div>
      </div>
    ),
  }),
);

describe('SubmitTimePanelContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.approvals.submitTimePanel = {
      isOpen: true,
      submitThroughDate: '2025-09-15',
      periodStartDate: null,
      weekGroups: [],
      expandedWeekIds: [],
      isLoading: false,
      isSubmitting: false,
      error: null,
    };
    mockApprovalsLoading = false;
    mockApprovalsSettled = true;
    mockQLSettingsLoading = false;
    mockApprovalSettings.requireApprovalForTrackedTime.value = true;
    mockApprovalSettings.enablePartialWeekSubmission.value = true;
    mockFetchSubmitTimePanelData.mockResolvedValue({
      weekGroups: [
        {
          id: '2025-09-15',
          weekStart: '2025-09-15',
          weekEnd: '2025-09-21',
          totalMinutes: 60,
          isSubmitted: false,
          isCurrentWeek: true,
          days: [],
        },
      ],
      periodStartDate: '2025-08-15',
      currentUserId: 123,
    });
    mockSubmitTime.mockResolvedValue(undefined);
  });

  it('logs mount, sets initial submit-through date and loads weekly data via hook', async () => {
    render(<SubmitTimePanelContainer />);

    expect(mockLogger.info).toHaveBeenCalledWith(
      APPROVALS_LOGGING.SUBMIT_TIME_PANEL_MOUNTED,
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      setSubmitThroughDate(expect.any(String)),
    );
    expect(mockDispatch).toHaveBeenCalledWith(setLoading(true));

    await act(async () => {});

    const dataCall = mockDispatch.mock.calls.find(
      ([action]) => action?.type === setSubmitTimePanelData.type,
    );
    expect(dataCall).toBeDefined();
    expect(dataCall?.[0].payload.weekGroups).toEqual(expect.any(Array));
    expect(dataCall?.[0].payload.weekGroups.length).toBeGreaterThan(0);
    expect(dataCall?.[0].payload.weekGroups[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        totalMinutes: expect.any(Number),
      }),
    );
    expect(dataCall?.[0].payload.periodStartDate).toEqual(expect.any(String));
    expect(mockFetchSubmitTimePanelData).toHaveBeenCalledWith({
      throughDateIso: expect.any(String),
      weekStartDay: 1,
      includeFullSelectedWeek: true,
    });
    expect(screen.getByTestId('summary-through-date')).toHaveTextContent(
      '2025-09-21',
    );
    expect(screen.getByTestId('full-week-helper')).toHaveTextContent('true');
  });

  it('dispatches date-change, week-toggle, dismiss-error and close handlers', () => {
    render(<SubmitTimePanelContainer />);

    fireEvent.click(screen.getByTestId('change-date'));
    expect(mockDispatch).toHaveBeenCalledWith(
      setSubmitThroughDate('2025-09-20'),
    );
    expect(mockFetchSubmitTimePanelData).toHaveBeenCalledWith({
      throughDateIso: '2025-09-20',
      weekStartDay: 1,
      includeFullSelectedWeek: true,
    });

    fireEvent.click(screen.getByTestId('toggle-week'));
    expect(mockDispatch).toHaveBeenCalledWith(toggleWeekExpanded('current'));

    fireEvent.click(screen.getByTestId('open-submit-confirmation'));
    expect(mockLogger.info).toHaveBeenCalledWith(
      APPROVALS_LOGGING.SUBMIT_TIME_PANEL_CONFIRM,
      expect.objectContaining({
        submitThroughDate: '2025-09-15',
        totalUnapprovedMinutes: expect.any(Number),
      }),
    );

    fireEvent.click(screen.getByTestId('dismiss-error'));
    // setError(null) -> ensure dispatch was called with a setError action payload null
    const errorDismissCall = mockDispatch.mock.calls.find(
      ([action]) =>
        action?.payload === null && action?.type?.endsWith('setError'),
    );
    expect(errorDismissCall).toBeDefined();

    fireEvent.click(screen.getByTestId('close'));
    expect(mockDispatch).toHaveBeenCalledWith(resetSubmitTimePanel());
  });

  it('sets empty panel when approvals are disabled', async () => {
    mockApprovalSettings.requireApprovalForTrackedTime.value = false;
    render(<SubmitTimePanelContainer />);
    await act(async () => {});

    expect(mockFetchSubmitTimePanelData).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      setSubmitTimePanelData({
        weekGroups: [],
        periodStartDate: expect.any(String),
      }),
    );
  });

  it('skips initial load until approval settings have settled', () => {
    mockApprovalsSettled = false;
    render(<SubmitTimePanelContainer />);

    expect(mockDispatch).not.toHaveBeenCalledWith(
      setSubmitThroughDate(expect.any(String)),
    );
    expect(mockDispatch).not.toHaveBeenCalledWith(setLoading(true));
    expect(mockFetchSubmitTimePanelData).not.toHaveBeenCalled();
  });

  it('hides full-week helper text until approval settings settle', () => {
    mockApprovalsSettled = false;
    mockApprovalSettings.enablePartialWeekSubmission.value = true;
    render(<SubmitTimePanelContainer />);

    expect(screen.getByTestId('full-week-helper')).toHaveTextContent('false');
  });

  it('skips initial load until QL settings have finished loading', () => {
    mockQLSettingsLoading = true;
    render(<SubmitTimePanelContainer />);

    expect(mockDispatch).not.toHaveBeenCalledWith(
      setSubmitThroughDate(expect.any(String)),
    );
    expect(mockDispatch).not.toHaveBeenCalledWith(setLoading(true));
    expect(mockFetchSubmitTimePanelData).not.toHaveBeenCalled();
  });

  it('does not reset the panel on unmount (cleanup removed)', () => {
    const { unmount } = render(<SubmitTimePanelContainer />);

    mockDispatch.mockClear();
    unmount();

    expect(mockDispatch).not.toHaveBeenCalledWith(resetSubmitTimePanel());
  });

  it('triggers the initial load once approval settings settle after mount', async () => {
    mockApprovalsSettled = false;
    const { rerender } = render(<SubmitTimePanelContainer />);

    expect(mockFetchSubmitTimePanelData).not.toHaveBeenCalled();

    mockApprovalsSettled = true;
    rerender(<SubmitTimePanelContainer />);
    await act(async () => {});

    expect(mockDispatch).toHaveBeenCalledWith(
      setSubmitThroughDate(expect.any(String)),
    );
    expect(mockFetchSubmitTimePanelData).toHaveBeenCalledTimes(1);
  });

  it('performs the initial load exactly once across re-renders', async () => {
    const { rerender } = render(<SubmitTimePanelContainer />);
    await act(async () => {});

    expect(mockFetchSubmitTimePanelData).toHaveBeenCalledTimes(1);

    rerender(<SubmitTimePanelContainer />);
    await act(async () => {});
    rerender(<SubmitTimePanelContainer />);
    await act(async () => {});

    expect(mockFetchSubmitTimePanelData).toHaveBeenCalledTimes(1);
  });

  it('submits and resets panel, invokes onSubmitSuccess and onClose', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    const onSubmitSuccess = jest.fn();
    render(
      <SubmitTimePanelContainer
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />,
    );
    await act(async () => {});

    fireEvent.click(screen.getByTestId('submit'));
    expect(mockDispatch).toHaveBeenCalledWith(setSubmitting(true));

    await act(async () => {});

    expect(mockSubmitTime).toHaveBeenCalledWith({
      throughDateIso: '2025-09-21',
      userId: 123,
    });
    expect(mockDispatch).toHaveBeenCalledWith(setSubmitting(false));
    expect(onSubmitSuccess).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockDispatch).toHaveBeenCalledWith(resetSubmitTimePanel());
    expect(onClose).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('submits selected day when partial-week submission is enabled', async () => {
    mockApprovalSettings.enablePartialWeekSubmission.value = false;
    const onClose = jest.fn();
    const onSubmitSuccess = jest.fn();
    render(
      <SubmitTimePanelContainer
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />,
    );
    await act(async () => {});

    fireEvent.click(screen.getByTestId('submit'));
    await act(async () => {});

    expect(mockSubmitTime).toHaveBeenCalledWith({
      throughDateIso: '2025-09-15',
      userId: 123,
    });
    expect(screen.getByTestId('summary-through-date')).toHaveTextContent(
      '2025-09-15',
    );
    expect(screen.getByTestId('full-week-helper')).toHaveTextContent('false');
  });

  it('handles submit failure and leaves panel open', async () => {
    const onClose = jest.fn();
    const onSubmitSuccess = jest.fn();
    mockSubmitTime.mockRejectedValueOnce(new Error('submit failed'));

    render(
      <SubmitTimePanelContainer
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />,
    );
    await act(async () => {});
    fireEvent.click(screen.getByTestId('submit'));

    await act(async () => {});

    const submitErrorCall = mockDispatch.mock.calls.find(
      ([action]) =>
        action?.payload === 'An error occurred. Please try again.' &&
        action?.type?.endsWith('setError'),
    );
    expect(submitErrorCall).toBeDefined();
    expect(onSubmitSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      APPROVALS_LOGGING.API_SUBMIT_TIME_FAILED,
      expect.objectContaining({ error: 'submit failed' }),
    );
  });

  it('handles missing submit-through date as submit failure', async () => {
    mockState.approvals.submitTimePanel.submitThroughDate = null;
    render(<SubmitTimePanelContainer />);
    await act(async () => {});

    fireEvent.click(screen.getByTestId('submit'));
    await act(async () => {});

    expect(mockSubmitTime).not.toHaveBeenCalled();
    const submitErrorCall = mockDispatch.mock.calls.find(
      ([action]) =>
        action?.payload === 'An error occurred. Please try again.' &&
        action?.type?.endsWith('setError'),
    );
    expect(submitErrorCall).toBeDefined();
  });

  it('handles submit failure and leaves panel open', async () => {
    const onClose = jest.fn();
    const onSubmitSuccess = jest.fn(() => {
      throw new Error('submit callback failed');
    });

    render(
      <SubmitTimePanelContainer
        onClose={onClose}
        onSubmitSuccess={onSubmitSuccess}
      />,
    );
    fireEvent.click(screen.getByTestId('submit'));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const submitErrorCall = mockDispatch.mock.calls.find(
      ([action]) =>
        action?.payload === 'An error occurred. Please try again.' &&
        action?.type?.endsWith('setError'),
    );
    expect(submitErrorCall).toBeDefined();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      APPROVALS_LOGGING.API_SUBMIT_TIME_FAILED,
      expect.objectContaining({ error: 'submit callback failed' }),
    );
  });
});
