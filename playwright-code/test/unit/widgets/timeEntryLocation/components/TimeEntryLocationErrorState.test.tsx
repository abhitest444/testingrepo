import React from 'react';
import { screen } from '@testing-library/react';
import TimeEntryLocationErrorState from 'src/js/widgets/timeEntryLocation/components/TimeEntryLocationErrorState';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from '../../../testUtils';

// Mock the SVG component
jest.mock('src/assets/images/SomethingWentWrong.svg', () => ({
  ReactComponent: ({
    'aria-hidden': ariaHidden,
  }: {
    'aria-hidden'?: boolean;
  }) => (
    <svg
      data-testid="something-went-wrong-illustration"
      aria-hidden={ariaHidden}
    >
      <title>Something went wrong illustration</title>
    </svg>
  ),
}));

// Mock @ids-ts/typography
jest.mock('@ids-ts/typography', () => ({
  __esModule: true,
  B1: ({
    children,
    weight,
  }: {
    children: React.ReactNode;
    weight?: string;
  }) => (
    <div data-testid="error-title" data-weight={weight}>
      {children}
    </div>
  ),
  B2: ({
    children,
    weight,
    color,
  }: {
    children: React.ReactNode;
    weight?: string;
    color?: string;
  }) => (
    <div data-testid="error-message" data-weight={weight} data-color={color}>
      {children}
    </div>
  ),
}));

// Mock useTracking
const mockTrack = jest.fn();

// Mock useIntl and useTracking
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'timeEntryLocation.error.title': 'Something went wrong',
        'timeEntryLocation.error.message': 'Refresh the page to try again.',
      };
      return messages[id] || id;
    },
  }),
  useTracking: () => mockTrack,
}));

describe('TimeEntryLocationErrorState', () => {
  const sandbox = getDefaultSandbox();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  it('should render without crashing', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    expect(
      screen.getByTestId('time-entry-location-error-state'),
    ).toBeInTheDocument();
  });

  it('should render the illustration', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const illustration = screen.getByTestId(
      'something-went-wrong-illustration',
    );
    expect(illustration).toBeInTheDocument();
    expect(illustration).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render error title with correct text', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const title = screen.getByTestId('error-title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Something went wrong');
  });

  it('should render error title with demi weight', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const title = screen.getByTestId('error-title');
    expect(title).toHaveAttribute('data-weight', 'demi');
  });

  it('should render error message with correct text', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const message = screen.getByTestId('error-message');
    expect(message).toBeInTheDocument();
    expect(message).toHaveTextContent('Refresh the page to try again.');
  });

  it('should render error message with medium weight', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const message = screen.getByTestId('error-message');
    expect(message).toHaveAttribute('data-weight', 'medium');
  });

  it('should render error message with correct color', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const message = screen.getByTestId('error-message');
    expect(message).toHaveAttribute(
      'data-color',
      'var(--color-text-secondary)',
    );
  });

  it('should have correct structure with container, illustration, and text', () => {
    renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);
    const container = screen.getByTestId('time-entry-location-error-state');
    expect(container).toBeInTheDocument();
    expect(
      screen.getByTestId('something-went-wrong-illustration'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('error-title')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });

  describe('tracking events', () => {
    it('should track SOMETHING_WENT_WRONG_VIEWED when component mounts', () => {
      const {
        LOCATION_MAP_TRACKING_POINTS,
      } = require('src/js/widgets/timeEntryLocation/utils/locationMapTrackingPoints');

      renderWithQuicksandProvider(<TimeEntryLocationErrorState />, sandbox);

      expect(mockTrack).toHaveBeenCalledWith(
        LOCATION_MAP_TRACKING_POINTS.SOMETHING_WENT_WRONG_VIEWED,
      );
    });
  });
});
