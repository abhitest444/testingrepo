import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import TTOHomePage from 'src/js/widgets/ttoHomePage/features/home-page/TTOHomePage';
import { useTTOContext } from 'src/js/widgets/ttoHomePage/context/TTOContext';
import {
  renderWithAllAppProviders,
  getDefaultSandbox,
} from 'test/unit/testUtils';

jest.mock('src/js/widgets/ttoHomePage/context/TTOContext');
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

const defaultProps = {
  onAddTime: jest.fn(),
  onView: jest.fn(),
  sandbox: getDefaultSandbox(),
};

describe('TTOHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTTOContext as jest.Mock).mockReturnValue({
      userName: 'John Doe',
      companyName: 'TestCo',
      weekDuration: 3600,
      monthDuration: 7200,
      weekDurationLoading: false,
      monthDurationLoading: false,
    });
  });

  const renderWidget = (props = {}) =>
    renderWithAllAppProviders(<TTOHomePage {...defaultProps} {...props} />);

  it('renders user and company info', () => {
    renderWidget();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/TestCo/)).toBeInTheDocument();
  });

  it('calls onAddTime when add time card is clicked', () => {
    renderWidget();
    const addTimeCard = screen.getByTestId('add-time-card');
    fireEvent.click(addTimeCard);
    expect(defaultProps.onAddTime).toHaveBeenCalled();
  });

  it('calls onView when view button is clicked', () => {
    renderWidget();
    fireEvent.click(screen.getByText(/view/i));
    expect(defaultProps.onView).toHaveBeenCalled();
  });
});
