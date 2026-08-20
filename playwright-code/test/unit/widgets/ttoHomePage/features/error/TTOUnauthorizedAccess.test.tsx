import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import TTOUnauthorizedAccess from 'src/js/widgets/ttoHomePage/features/error/TTOUnauthorizedAccess';
import { renderWithAllAppProviders } from 'test/unit/testUtils';

const mockNavigate = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'unauthorized.access.title': 'You need permission to access this page',
        'unauthorized.access.login.message':
          'Log into QuickBooks with your account',
        'unauthorized.access.purpose.message': 'used to track time for access',
        'unauthorized.access.back.to.homepage': 'Back to homepage',
      };
      return messages[id] || id;
    },
  }),
  useSandbox: () => ({
    navigation: {
      navigate: mockNavigate,
    },
  }),
}));

describe('TTOUnauthorizedAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders unauthorized access message with correct text', () => {
    renderWithAllAppProviders(<TTOUnauthorizedAccess />);

    expect(
      screen.getByText('You need permission to access this page'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Log into QuickBooks with your account'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('used to track time for access'),
    ).toBeInTheDocument();
  });

  it('renders the back to homepage link', () => {
    renderWithAllAppProviders(<TTOUnauthorizedAccess />);

    const backLink = screen.getByTestId('tto-unauthorized-back-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveTextContent('Back to homepage');
  });

  it('navigates to homepage when back link is clicked', () => {
    renderWithAllAppProviders(<TTOUnauthorizedAccess />);

    const backLink = screen.getByTestId('tto-unauthorized-back-link');
    fireEvent.click(backLink);

    expect(mockNavigate).toHaveBeenCalledWith('homepage');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders with correct test ids', () => {
    renderWithAllAppProviders(<TTOUnauthorizedAccess />);

    expect(screen.getByTestId('tto-unauthorized-access')).toBeInTheDocument();
    expect(screen.getByTestId('tto-unauthorized-title')).toBeInTheDocument();
    expect(
      screen.getByTestId('tto-unauthorized-description-line1'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('tto-unauthorized-description-line2'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('tto-unauthorized-back-link'),
    ).toBeInTheDocument();
  });

  it('handles missing sandbox gracefully', () => {
    jest.spyOn(require('@payroll/quicksand'), 'useSandbox').mockReturnValue({
      navigation: null,
    });

    renderWithAllAppProviders(<TTOUnauthorizedAccess />);

    const backLink = screen.getByTestId('tto-unauthorized-back-link');
    fireEvent.click(backLink);

    // Should not crash when navigation is null
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
