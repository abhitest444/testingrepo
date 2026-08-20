import React from 'react';
import { screen } from '@testing-library/react';
import TTOFeatureRenderer from 'src/js/widgets/ttoHomePage/TTOFeatureRenderer';
import { useTTOContext } from 'src/js/widgets/ttoHomePage/context/TTOContext';
import { renderWithAllAppProviders } from 'test/unit/testUtils';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';

jest.mock('src/js/widgets/ttoHomePage/context/TTOContext');
jest.mock(
  'src/js/widgets/ttoHomePage/features/details-page/TTOAddTimeDetails',
  () => () =>
    (
      <div data-testid="tto-feature-renderer-add-time-details">
        AddTimeDetails
      </div>
    ),
);
jest.mock(
  'src/js/widgets/ttoHomePage/features/home-page/TTOHomePage',
  () => () => <div data-testid="tto-feature-renderer-home-page">HomePage</div>,
);
jest.mock(
  'src/js/widgets/ttoHomePage/features/error/TTOUnauthorizedAccess',
  () => () =>
    <div data-testid="tto-unauthorized-access">UnauthorizedAccess</div>,
);

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  ...jest.requireActual('src/js/providers/LoggingConfigProvider'),
  useLoggingConfig: jest.fn().mockReturnValue({
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const defaultProps = {
  options: {},
  routeInfo: {},
  sandbox: {},
  showAddTimeDetails: false,
  onBack: jest.fn(),
  onAddTime: jest.fn(),
  onView: jest.fn(),
};

describe('TTOFeatureRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization checks', () => {
    it('renders unauthorized screen when user is not authorized', () => {
      (useTTOContext as jest.Mock).mockReturnValue({
        isExpenseEnabled: true,
        isAuthorized: false,
        authLoading: false,
      });
      renderWithAllAppProviders(<TTOFeatureRenderer {...defaultProps} />);
      expect(screen.getByTestId('tto-unauthorized-access')).toBeInTheDocument();
    });

    it('renders normal content when user is authorized', () => {
      (useTTOContext as jest.Mock).mockReturnValue({
        isExpenseEnabled: true,
        isAuthorized: true,
        authLoading: false,
      });
      renderWithAllAppProviders(
        <TTOFeatureRenderer {...defaultProps} options={{}} />,
      );
      expect(
        screen.getByTestId('tto-feature-renderer-home-page'),
      ).toBeInTheDocument();
    });
  });

  it('renders AddTimeDetails if isExpenseEnabled and detailsPage is time', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer
        {...defaultProps}
        routeInfo={{ params: { detailsPage: 'time' } }}
      />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-add-time-details'),
    ).toBeInTheDocument();
  });

  it('renders AddTimeDetails if not isExpenseEnabled', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: false,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(<TTOFeatureRenderer {...defaultProps} />);
    expect(
      screen.getByTestId('tto-feature-renderer-add-time-details'),
    ).toBeInTheDocument();
  });

  it('renders AddTimeDetails if showAddTimeDetails is true', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer {...defaultProps} showAddTimeDetails />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-add-time-details'),
    ).toBeInTheDocument();
  });

  it('renders HomePage if options is missing or feature is not set', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer {...defaultProps} options={{}} />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-home-page'),
    ).toBeInTheDocument();
  });

  it('renders AddTimeDetails if options.feature is TTO_HOME_FEATURE and options.functionality is TTO_HOME_FUNCTIONALITY_DETAILS', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer
        {...defaultProps}
        options={{ feature: 'tto-home', functionality: 'details' }}
      />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-add-time-details'),
    ).toBeInTheDocument();
  });

  it('renders HomePage if options.feature is TTO_HOME_FEATURE and options.functionality is not TTO_HOME_FUNCTIONALITY_DETAILS', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer
        {...defaultProps}
        options={{ feature: 'tto-home', functionality: 'other' }}
      />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-home-page'),
    ).toBeInTheDocument();
  });

  it('renders unknown feature div if options.feature is set but not TTO_HOME_FEATURE', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    renderWithAllAppProviders(
      <TTOFeatureRenderer
        {...defaultProps}
        options={{ feature: 'unknown-feature' }}
      />,
    );
    expect(
      screen.getByTestId('tto-feature-renderer-unknown-feature'),
    ).toBeInTheDocument();
  });

  it('calls logger.info on render', () => {
    (useTTOContext as jest.Mock).mockReturnValue({
      isExpenseEnabled: true,
      isAuthorized: true,
      authLoading: false,
    });
    const infoSpy = jest.spyOn(useLoggingConfig(), 'info');
    renderWithAllAppProviders(<TTOFeatureRenderer {...defaultProps} />);
    expect(infoSpy).toHaveBeenCalled();
  });
});
