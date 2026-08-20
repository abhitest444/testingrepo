import React from 'react';
import { screen, fireEvent, act, within } from '@testing-library/react';
import TTOAddTimeDetails from 'src/js/widgets/ttoHomePage/features/details-page/TTOAddTimeDetails';
import { useTTOContext } from 'src/js/widgets/ttoHomePage/context/TTOContext';
import { NAVIGATION_ROUTES } from 'src/js/widgets/ttoHomePage/constants';
import {
  renderWithAllAppProviders,
  getDefaultSandbox,
} from 'test/unit/testUtils';

jest.mock('src/js/widgets/ttoHomePage/context/TTOContext');
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

const defaultProps = {
  onBack: jest.fn(),
  sandbox: getDefaultSandbox() as any,
};

describe('TTOAddTimeDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTTOContext as jest.Mock).mockReturnValue({
      weekDuration: 3600,
      monthDuration: 7200,
      weekDurationLoading: false,
      monthDurationLoading: false,
      weekRange: 'Apr 1-7',
      monthLabel: 'April',
    });
  });

  const renderWidget = (props = {}) =>
    renderWithAllAppProviders(
      <TTOAddTimeDetails {...defaultProps} {...props} />,
    );

  it('renders user and company info', async () => {
    renderWidget();
    expect(
      await screen.findByTestId('tto-add-time-details-card-header'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('tto-add-time-details-card-header'),
    ).toHaveTextContent(/Hi, Joe Bloggs/);
    expect(
      screen.getByTestId('tto-add-time-details-card-header'),
    ).toHaveTextContent(/track.time.for/i);
  });

  it('calls onBack when back link is clicked', async () => {
    renderWidget();
    fireEvent.click(
      await screen.findByTestId('tto-add-time-details-back-link'),
    );
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('navigates when option buttons are clicked', async () => {
    renderWidget();
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-weekly-button'),
      );
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-time-activity-button'),
      );
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-report-button'),
      );
    });
    expect(defaultProps.sandbox.navigation.navigate).toHaveBeenCalled();
  });

  it('navigates to weekly timesheet with correct route', async () => {
    renderWidget();
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-weekly-button'),
      );
    });
    expect(defaultProps.sandbox.navigation.navigate).toHaveBeenCalledWith(
      NAVIGATION_ROUTES.TIMETRACKING,
    );
  });

  it('navigates to time activity with correct route', async () => {
    renderWidget();
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-time-activity-button'),
      );
    });
    expect(defaultProps.sandbox.navigation.navigate).toHaveBeenCalledWith(
      NAVIGATION_ROUTES.TIME_ACTIVITY,
    );
  });

  it('navigates to report with correct back navigation parameters', async () => {
    renderWidget();
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-report-button'),
      );
    });

    const expectedBackLinkText = encodeURIComponent('homepage');
    const expectedBackLinkRoute = encodeURIComponent(NAVIGATION_ROUTES.HOME);
    const expectedUrl = `${NAVIGATION_ROUTES.REPORT}backLinkRoute=${expectedBackLinkRoute}&backLinkText=${expectedBackLinkText}`;

    expect(defaultProps.sandbox.navigation.navigate).toHaveBeenCalledWith(
      expectedUrl,
    );
  });

  it('properly encodes back navigation parameters for report', async () => {
    renderWidget();
    await act(async () => {
      fireEvent.click(
        screen.getByTestId('tto-add-time-details-option-report-button'),
      );
    });

    const navigationCall =
      defaultProps.sandbox.navigation.navigate.mock.calls[0][0];

    // Verify URL encoding is applied
    expect(navigationCall).toContain('backLinkText=homepage');
    expect(navigationCall).toContain('backLinkRoute=timetracking%2Fhomepage');
    // Verify it starts with the report base URL
    expect(navigationCall.startsWith('report?rptId=TIME_ACTIVITIES&')).toBe(
      true,
    );
  });

  it('shows loading state for week and month durations', async () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      weekDuration: 3600,
      monthDuration: 7200,
      weekDurationLoading: true,
      monthDurationLoading: true,
      weekRange: 'Apr 1-7',
      monthLabel: 'April',
    });
    renderWidget();
    expect(
      screen.getByTestId('tto-add-time-details-week-time-block'),
    ).toHaveTextContent('00:00');
    expect(
      screen.getByTestId('tto-add-time-details-month-time-block'),
    ).toHaveTextContent('00:00');
  });

  it('shows 00:00 for null durations', async () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      weekDuration: null,
      monthDuration: null,
      weekDurationLoading: false,
      monthDurationLoading: false,
      weekRange: 'Apr 1-7',
      monthLabel: 'April',
    });
    renderWidget();
    const weekBlock = screen.getByTestId(
      'tto-add-time-details-week-time-block',
    );
    expect(within(weekBlock).getByText('00:00')).toBeInTheDocument();
    const monthBlock = screen.getByTestId(
      'tto-add-time-details-month-time-block',
    );
    expect(within(monthBlock).getByText('00:00')).toBeInTheDocument();
  });

  it('falls back to DEFAULT_USER and empty company', async () => {
    const sandbox = getDefaultSandbox();
    sandbox.appContext.getUserProfile = jest.fn().mockResolvedValue({});
    sandbox.extensions.qbo.context.getCompanyInfo = jest
      .fn()
      .mockReturnValue({});
    renderWidget({ sandbox });
    expect(
      await screen.findByTestId('tto-add-time-details-card-header'),
    ).toHaveTextContent('Hi, user');
    // Should not throw if company is missing
  });

  it('calls logger.info on render', async () => {
    const logger = { info: jest.fn() };
    const LoggingConfigProvider = await import(
      'src/js/providers/LoggingConfigProvider'
    );
    jest
      .spyOn(LoggingConfigProvider, 'useLoggingConfig')
      .mockReturnValue(logger as any);
    renderWidget();
    expect(logger.info).toHaveBeenCalledWith('TTOAddTimeDetails rendered');
  });

  it('does not render back link if onBack is not provided', async () => {
    renderWidget({ onBack: undefined });
    expect(screen.queryByTestId('tto-add-time-details-back-link')).toBeNull();
  });

  it('renders correct intl message IDs for all option buttons and headers', async () => {
    renderWidget();
    expect(
      screen.getByTestId('tto-add-time-details-card-header'),
    ).toHaveTextContent('track.time.for');
    expect(
      screen.getByTestId('tto-add-time-details-option-weekly-content'),
    ).toHaveTextContent('weekly.timesheet');
    expect(
      screen.getByTestId('tto-add-time-details-option-weekly-content'),
    ).toHaveTextContent('enter.hours.for.week');
    expect(
      screen.getByTestId('tto-add-time-details-option-weekly-button'),
    ).toHaveTextContent('weekly');
    expect(
      screen.getByTestId('tto-add-time-details-option-time-activity-content'),
    ).toHaveTextContent('time.activity');
    expect(
      screen.getByTestId('tto-add-time-details-option-time-activity-content'),
    ).toHaveTextContent('enter.hours.for.day');
    expect(
      screen.getByTestId('tto-add-time-details-option-time-activity-button'),
    ).toHaveTextContent('single.activity');
    expect(
      screen.getByTestId('tto-add-time-details-option-report-content'),
    ).toHaveTextContent('report');
    expect(
      screen.getByTestId('tto-add-time-details-option-report-content'),
    ).toHaveTextContent('view.report');
    expect(
      screen.getByTestId('tto-add-time-details-option-report-button'),
    ).toHaveTextContent('go.to.report');
  });
});
