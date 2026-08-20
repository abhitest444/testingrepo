import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ApprovalsFeature from 'src/js/widgets/qbtOrchestrator/features/approvals';
import { APPROVALS_FUNCTIONALITY } from 'src/js/widgets/qbtOrchestrator/features/approvals/constants';
import { APPROVALS_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/approvals/constants/approvalsLoggingConstants';
import { ORCHESTRATOR_LOGGING } from 'src/js/widgets/qbtOrchestrator/constants';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockHasReducer = jest.fn();
const mockInject = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({ logger: mockLogger }),
  useIntl: () => ({
    formatMessage: (
      message: { defaultMessage: string },
      values?: Record<string, string | number>,
    ) => {
      if (!values) return message.defaultMessage;
      return Object.entries(values).reduce(
        (text, [key, value]) =>
          text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
        message.defaultMessage,
      );
    },
  }),
}));

jest.mock('src/js/widgets/qbtOrchestrator/store/storeManager', () => ({
  storeManager: {
    hasReducer: (...args: unknown[]) => mockHasReducer(...args),
    inject: (...args: unknown[]) => mockInject(...args),
  },
}));

jest.mock('src/js/widgets/qbtOrchestrator/features/approvals/store', () => ({
  approvalsReducer: jest.fn(),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/approvals/components/SubmitTimePanel/SubmitTimePanelContainer',
  () => ({
    __esModule: true,
    default: ({
      onSubmitSuccess,
    }: {
      onSubmitSuccess?: (submittedMinutes?: number) => void;
    }) => (
      <div data-testid="submit-time-panel-container">
        <button
          type="button"
          data-testid="trigger-submit-success"
          onClick={() => onSubmitSuccess?.(1543)}
        >
          trigger
        </button>
      </div>
    ),
  }),
);

jest.mock('src/js/widgets/common/SuccessToast', () => ({
  SuccessToast: ({
    open,
    message,
    onClose,
  }: {
    open: boolean;
    message: string;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="approvals-success-toast">
        <span>{message}</span>
        <button
          type="button"
          data-testid="approvals-success-toast-close"
          onClick={onClose}
        >
          close
        </button>
      </div>
    ) : null,
}));

jest.mock(
  'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider',
  () => ({
    SubmitTimeDatesProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="submit-time-dates-provider">{children}</div>
    ),
  }),
);

describe('ApprovalsFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasReducer.mockReturnValue(false);
  });

  it('injects reducer and renders submit time panel by default', async () => {
    render(<ApprovalsFeature />);

    expect(
      await screen.findByTestId('submit-time-dates-provider'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('submit-time-panel-container'),
    ).toBeInTheDocument();
    expect(mockHasReducer).toHaveBeenCalledWith('approvals');
    expect(mockInject).toHaveBeenCalledWith('approvals', expect.any(Function));
    expect(mockLogger.info).toHaveBeenCalledWith(
      ORCHESTRATOR_LOGGING.REDUCER_INJECTED,
      { feature: 'approvals' },
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      APPROVALS_LOGGING.FEATURE_MOUNTED,
      { functionality: APPROVALS_FUNCTIONALITY.SUBMIT_TIME_PANEL },
    );
  });

  it('shows a success toast when the panel reports submit success and forwards callback after delay', async () => {
    jest.useFakeTimers();
    const onSubmitSuccess = jest.fn();
    render(<ApprovalsFeature onSubmitSuccess={onSubmitSuccess} />);

    const trigger = await screen.findByTestId('trigger-submit-success');
    expect(screen.queryByTestId('approvals-success-toast')).toBeNull();

    act(() => {
      fireEvent.click(trigger);
    });

    expect(screen.getByTestId('approvals-success-toast')).toBeInTheDocument();
    expect(screen.getByText('25h 43m submitted')).toBeInTheDocument();
    expect(onSubmitSuccess).not.toHaveBeenCalled();

    act(() => {
      fireEvent.click(screen.getByTestId('approvals-success-toast-close'));
    });

    expect(screen.queryByTestId('approvals-success-toast')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('renders unknown functionality message and logs error', () => {
    render(<ApprovalsFeature functionality="invalid-functionality" />);

    expect(
      screen.getByText(
        'Unknown approvals functionality: invalid-functionality',
      ),
    ).toBeInTheDocument();
    expect(mockLogger.error).toHaveBeenCalledWith(
      APPROVALS_LOGGING.UNKNOWN_FUNCTIONALITY,
      { functionality: 'invalid-functionality' },
    );
  });
});
