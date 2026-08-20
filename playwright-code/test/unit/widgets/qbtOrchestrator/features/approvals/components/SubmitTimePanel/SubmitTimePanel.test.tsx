import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import SubmitTimePanel from 'src/js/widgets/qbtOrchestrator/features/approvals/components/SubmitTimePanel/SubmitTimePanel';
import type {
  SubmitTimePanelProps,
  WeekTimeGroup,
} from 'src/js/widgets/qbtOrchestrator/features/approvals/types/Approvals.types';

const mockUseSubmitTimeDatesContext = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: (
      message: { defaultMessage: string },
      values?: Record<string, any>,
    ) => {
      if (!values) return message.defaultMessage;
      return Object.entries(values).reduce(
        (text, [key, value]) =>
          text
            .replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
            .replace(
              new RegExp(
                `\\{${key}, plural, one \\{# timesheet\\} other \\{# timesheets\\}\\}`,
                'g',
              ),
              `${value} ${Number(value) === 1 ? 'timesheet' : 'timesheets'}`,
            ),
        message.defaultMessage,
      );
    },
  }),
}));

jest.mock(
  'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider',
  () => ({
    useSubmitTimeDatesContext: () => mockUseSubmitTimeDatesContext(),
  }),
);

jest.mock('@ids-ts/button', () => {
  const MockButton = ({
    children,
    onClick,
    disabled,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'data-testid'?: string;
  }) => (
    <button data-testid={dataTestId} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
  return MockButton;
});

jest.mock('@ids-ts/date-picker', () => {
  const MockDatePicker = ({
    label,
    value,
    minDate,
    onChange,
    'data-testid': dataTestId,
  }: {
    label: string;
    value: string;
    minDate?: string;
    onChange?: (e: { target: { value: string } }) => void;
    'data-testid'?: string;
  }) => (
    <label>
      {label}
      <input
        data-testid={dataTestId}
        data-min-date={minDate}
        value={value}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      />
    </label>
  );
  return { __esModule: true, default: MockDatePicker };
});

jest.mock('@ids-ts/typography', () => {
  const MockTypography = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    __esModule: true,
    default: MockTypography,
    H5: MockTypography,
    B2: MockTypography,
  };
});

jest.mock('@ids-ts/loader', () => ({
  Activity: ({ 'data-testid': dataTestId }: { 'data-testid'?: string }) => (
    <div data-testid={dataTestId} />
  ),
}));

jest.mock('@ids-ts/page-message', () => {
  const MockPageMessage = ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>;
  return MockPageMessage;
});

jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>,
  DrawerHeader: ({
    title,
    onClose,
  }: {
    title: string;
    onClose?: () => void;
  }) => (
    <div>
      <span>{title}</span>
      <button onClick={onClose}>x</button>
    </div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({
    children,
    open,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    open?: boolean;
    'data-testid'?: string;
  }) => (open ? <div data-testid={dataTestId}>{children}</div> : null),
  ModalHeader: ({
    children,
    onClose,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
    'data-testid'?: string;
  }) => (
    <div data-testid={dataTestId}>
      {children}
      <button onClick={onClose}>x</button>
    </div>
  ),
  ModalTitle: ({ title }: { title: string }) => <div>{title}</div>,
  ModalContent: ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>,
  ModalActions: ({
    children,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    'data-testid'?: string;
  }) => <div data-testid={dataTestId}>{children}</div>,
}));

jest.mock('@design-systems/icons', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
}));

const today = dayjs().format('YYYY-MM-DD');

const buildWeek = (
  id: string,
  overrides: Partial<WeekTimeGroup> = {},
): WeekTimeGroup => ({
  id,
  weekStart: '2025-09-08',
  weekEnd: '2025-09-12',
  totalMinutes: 0,
  isSubmitted: false,
  isCurrentWeek: false,
  days: [],
  ...overrides,
});

const baseWeeks: WeekTimeGroup[] = [
  buildWeek('current', {
    isCurrentWeek: true,
    totalMinutes: 1441,
    days: [
      {
        id: 'today',
        date: today,
        minutes: 481,
        timesheetCount: 1,
        status: 'pending',
      },
      {
        id: 'no-ts',
        date: '2025-09-13',
        minutes: 0,
        timesheetCount: 0,
        status: 'pending',
      },
      {
        id: 'submitted-day',
        date: '2025-09-11',
        minutes: 480,
        timesheetCount: 1,
        status: 'submitted',
      },
    ],
  }),
  buildWeek('previous', {
    isSubmitted: true,
    totalMinutes: 2160,
    days: [],
  }),
];

const baseProps: SubmitTimePanelProps = {
  title: 'Submit time',
  submitThroughDate: '2025-09-15',
  summaryThroughDate: '2025-09-21',
  showFullWeekSubmissionText: true,
  periodStartDate: '2025-08-15',
  weekGroups: baseWeeks,
  expandedWeekIds: ['current'],
  totalUnapprovedMinutes: 1441,
  isLoading: false,
  isSubmitting: false,
  error: null,
  onClose: jest.fn(),
  onSubmitThroughDateChange: jest.fn(),
  onToggleWeekExpanded: jest.fn(),
  onOpenSubmitConfirmation: jest.fn(),
  onSubmit: jest.fn(),
  onDismissError: jest.fn(),
};

const renderPanel = (overrides: Partial<SubmitTimePanelProps> = {}) =>
  render(<SubmitTimePanel {...baseProps} {...overrides} />);

describe('SubmitTimePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubmitTimeDatesContext.mockReturnValue({ minSelectableDate: null });
  });

  it('renders description, summary, date picker, and expanded current week days', () => {
    renderPanel();

    expect(screen.getByTestId('submit-time-panel')).toBeInTheDocument();
    expect(
      screen.getByTestId('submit-time-panel-description'),
    ).toHaveTextContent(
      'Submit unapproved time up to a chosen date for the past month. Time submissions will be for the entire week of the selected date.',
    );
    expect(screen.getByTestId('submit-time-panel-summary')).toHaveTextContent(
      '24h 1m to submit through Aug 15 - Sept 21, 2025',
    );
    expect(screen.getByTestId('submit-through-date-picker')).toHaveValue(
      '9/15/2025',
    );
    expect(screen.getByTestId('week-row-current')).toBeInTheDocument();
    expect(screen.getByTestId('week-row-previous')).toBeInTheDocument();
    expect(screen.getByTestId('day-row-today')).toBeInTheDocument();
    expect(screen.getByTestId(`day-${'today'}-today`)).toBeInTheDocument();
    expect(screen.getByTestId('day-row-no-ts')).toHaveTextContent(
      'No timesheets',
    );
    expect(screen.getByTestId('day-row-submitted-day')).toHaveTextContent(
      '8h 0m (submitted)',
    );
  });

  it('renders previous week summary with "(submitted)" suffix and does not show its days when collapsed', () => {
    renderPanel();
    expect(screen.getByTestId('week-row-previous')).toHaveTextContent(
      '36h 0m (submitted)',
    );
    expect(screen.queryByTestId('day-row-previous-0')).toBeNull();
  });

  it('renders both month names for cross-month week labels', () => {
    renderPanel({
      weekGroups: [
        buildWeek('cross-month', {
          weekStart: '2026-05-27',
          weekEnd: '2026-06-02',
          totalMinutes: 0,
          isCurrentWeek: false,
          days: [],
        }),
      ],
      expandedWeekIds: [],
      totalUnapprovedMinutes: 0,
    });

    expect(screen.getByTestId('week-row-cross-month')).toHaveTextContent(
      'May 27 - June 2',
    );
  });

  it('hides full-week helper sentence when partial-week mode is enabled', () => {
    renderPanel({ showFullWeekSubmissionText: false });
    expect(
      screen.getByTestId('submit-time-panel-description'),
    ).toHaveTextContent(
      'Submit unapproved time up to a chosen date for the past month.',
    );
    expect(
      screen.getByTestId('submit-time-panel-description'),
    ).not.toHaveTextContent(
      'Time submissions will be for the entire week of the selected date.',
    );
  });

  it('toggles week expansion', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('week-row-previous'));
    expect(baseProps.onToggleWeekExpanded).toHaveBeenCalledWith('previous');
  });

  it('emits new ISO submit-through date when user changes the date picker', () => {
    renderPanel();
    fireEvent.change(screen.getByTestId('submit-through-date-picker'), {
      target: { value: '9/20/2025' },
    });
    expect(baseProps.onSubmitThroughDateChange).toHaveBeenCalledWith(
      '2025-09-20',
    );
  });

  it('passes min selectable date from submit-time context to date picker', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs('2025-09-16'),
    });
    renderPanel();

    expect(screen.getByTestId('submit-through-date-picker')).toHaveAttribute(
      'data-min-date',
      '2025-09-16',
    );
  });

  it('disables Submit when there is no unapproved time', () => {
    renderPanel({ totalUnapprovedMinutes: 0 });
    expect(
      screen.getByTestId('submit-time-panel-submit-button'),
    ).toBeDisabled();
  });

  it('opens confirmation modal on Submit and confirms submission', () => {
    renderPanel({ error: 'Something failed' });
    expect(screen.getByTestId('submit-time-panel-error')).toHaveTextContent(
      'Something failed',
    );

    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));
    expect(baseProps.onOpenSubmitConfirmation).toHaveBeenCalled();
    expect(
      screen.getByTestId('submit-time-confirmation-modal'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId('submit-time-confirmation-modal-confirm'),
    );
    expect(baseProps.onSubmit).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('submit-time-panel-cancel-button'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('closes confirmation modal on cancel without submitting', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));
    expect(
      screen.getByTestId('submit-time-confirmation-modal'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('submit-time-confirmation-modal-cancel'),
    );
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId('submit-time-confirmation-modal'),
    ).not.toBeInTheDocument();
  });

  it('renders custom confirmation message when provided', () => {
    renderPanel({ submitConfirmationMessage: 'Custom submit warning' });
    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));
    expect(screen.getByText(/Custom submit warning/)).toBeInTheDocument();
  });

  it('renders summary duration in bold in confirmation modal', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));

    const modalContent = screen.getByTestId(
      'submit-time-confirmation-modal-content',
    );
    const boldDuration = modalContent.querySelector('strong');
    expect(boldDuration).toBeInTheDocument();
    expect(boldDuration).toHaveTextContent('24h 1m');
  });

  it('falls back to default confirmation message when custom is blank', () => {
    renderPanel({ submitConfirmationMessage: '   ' });
    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));
    expect(
      screen.getByText(
        /By submitting your timesheets you agree that they are complete and accurate\./,
      ),
    ).toBeInTheDocument();
  });

  it('uses custom confirmation text as-is when provided', () => {
    const defaultMessage =
      'By submitting your timesheets you agree that they are complete and accurate.';
    renderPanel({ submitConfirmationMessage: defaultMessage });
    fireEvent.click(screen.getByTestId('submit-time-panel-submit-button'));

    const modalContent = screen.getByTestId(
      'submit-time-confirmation-modal-content',
    );
    expect(modalContent).toHaveTextContent(defaultMessage);
  });

  it('does not emit date change for empty date picker value', () => {
    renderPanel();
    fireEvent.change(screen.getByTestId('submit-through-date-picker'), {
      target: { value: '' },
    });
    expect(baseProps.onSubmitThroughDateChange).not.toHaveBeenCalled();
  });

  it('uses fallback title and empty submit-through value when not provided', () => {
    renderPanel({
      title: '',
      submitThroughDate: null,
      periodStartDate: null,
      totalUnapprovedMinutes: 0,
    });
    expect(screen.getByText('Submit time')).toBeInTheDocument();
    expect(screen.getByTestId('submit-through-date-picker')).toHaveValue('');
    expect(screen.getByTestId('submit-time-panel-summary')).toHaveTextContent(
      '0h 0m to submit through',
    );
  });

  it('shows submitting label and disables action buttons while submitting', () => {
    renderPanel({ isSubmitting: true });
    expect(
      screen.getByTestId('submit-time-panel-submit-button'),
    ).toHaveTextContent('Submitting...');
    expect(
      screen.getByTestId('submit-time-panel-submit-button'),
    ).toBeDisabled();
    expect(
      screen.getByTestId('submit-time-panel-cancel-button'),
    ).toBeDisabled();
  });

  it('renders loading and empty states', () => {
    const { rerender } = renderPanel({
      isLoading: true,
      weekGroups: [],
      totalUnapprovedMinutes: 0,
    });
    expect(screen.getByTestId('submit-time-panel-loader')).toBeInTheDocument();

    rerender(
      <SubmitTimePanel
        {...baseProps}
        isLoading={false}
        weekGroups={[]}
        totalUnapprovedMinutes={0}
      />,
    );
    expect(
      screen.getByText('No time entries found for the selected date range.'),
    ).toBeInTheDocument();
  });
});
