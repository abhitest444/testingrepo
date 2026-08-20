import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  createCustomerInteraction,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getAssignmentApolloClient } from 'src/js/service/AssignmentApolloClient';
import TimeEntryLocationWidget from 'src/js/widgets/timeEntryLocation/TimeEntryLocationWidget';
import { renderWithAllProviders, getDefaultSandbox } from '../../testUtils';

// Mock TimeEntryLocationContainer
jest.mock(
  'src/js/widgets/timeEntryLocation/components/TimeEntryLocationContainer',
  () => ({
    __esModule: true,
    default: ({ open, onClose, timeEntryId }: any) => (
      <div data-testid="time-entry-location-container">
        <div data-testid="container-open">{open ? 'open' : 'closed'}</div>
        <div data-testid="container-time-entry-id">{timeEntryId}</div>
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      </div>
    ),
  }),
);

// Mock the AssignmentApolloClient
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: jest.fn(),
}));

// Mock nlsLoader
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

// Mock QuicksandProvider
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

// Mock CustomerInteraction
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  TimeCustomerInteraction: {
    TIME_ENTRY_LOCATION_READ: 'time-entry-location-read',
  },
}));

describe('TimeEntryLocationWidget', () => {
  const mockSandbox = {
    ...getDefaultSandbox(),
    logger: {
      ...getDefaultSandbox().logger,
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  const mockApolloClient = {
    query: jest.fn(),
    mutate: jest.fn(),
  };

  const defaultProps = {
    sandbox: mockSandbox,
    open: false,
    setOpen: jest.fn(),
    timeEntryId: 'test-entry-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAssignmentApolloClient as jest.Mock).mockReturnValue(mockApolloClient);
  });

  const renderWidget = (props: any = {}) => {
    const Widget = TimeEntryLocationWidget as any;
    return renderWithAllProviders(<Widget {...defaultProps} {...props} />);
  };

  it('should render successfully', async () => {
    renderWidget();

    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-container'),
      ).toBeInTheDocument();
    });
  });

  it('should log mount on componentDidMount', async () => {
    renderWidget();

    await waitFor(() => {
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'TIME_ENTRY_LOCATION_WIDGET_MOUNTED',
      );
    });
  });

  it('should show error when Apollo client is not initialized', async () => {
    (getAssignmentApolloClient as jest.Mock).mockReturnValue(null);

    renderWidget();

    await waitFor(() => {
      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'APOLLO_CLIENT_NOT_INITIALIZED',
      );
    });
  });

  it('should render with open=true', async () => {
    renderWidget({ open: true });

    await waitFor(() => {
      expect(screen.getByTestId('container-open')).toHaveTextContent('open');
    });
  });

  it('should call setOpen when close button is clicked', async () => {
    const mockSetOpen = jest.fn();
    renderWidget({ open: true, setOpen: mockSetOpen });

    await waitFor(() => {
      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    screen.getByTestId('close-button').click();
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('should use externalApolloClient when provided', async () => {
    const externalClient = { query: jest.fn() };
    renderWidget({ externalApolloClient: externalClient });

    await waitFor(() => {
      expect(
        screen.getByTestId('time-entry-location-container'),
      ).toBeInTheDocument();
    });
  });

  it('should pass timeEntryId to container', async () => {
    renderWidget({ timeEntryId: 'entry-456' });

    await waitFor(() => {
      expect(screen.getByTestId('container-time-entry-id')).toHaveTextContent(
        'entry-456',
      );
    });
  });

  describe('customer interaction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create customer interaction on componentDidMount', async () => {
      renderWidget({ timeEntryId: 'test-entry-123' });

      await waitFor(() => {
        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
          { timeEntryId: 'test-entry-123' },
        );
      });
    });

    it('should create customer interaction when timeEntryId changes in componentDidUpdate', async () => {
      const Widget = TimeEntryLocationWidget as any;
      const { rerender } = renderWithAllProviders(
        <Widget {...defaultProps} timeEntryId="test-entry-123" />,
      );

      await waitFor(() => {
        expect(createCustomerInteraction).toHaveBeenCalledTimes(1);
        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
          { timeEntryId: 'test-entry-123' },
        );
      });

      // Clear the mock to track new calls
      (createCustomerInteraction as jest.Mock).mockClear();

      // Update with new timeEntryId
      rerender(<Widget {...defaultProps} timeEntryId="test-entry-456" />);

      await waitFor(() => {
        expect(createCustomerInteraction).toHaveBeenCalledWith(
          mockSandbox,
          TimeCustomerInteraction.TIME_ENTRY_LOCATION_READ,
          { timeEntryId: 'test-entry-456' },
        );
      });
    });

    it('should not create customer interaction when timeEntryId does not change', async () => {
      const Widget = TimeEntryLocationWidget as any;
      const { rerender } = renderWithAllProviders(
        <Widget {...defaultProps} timeEntryId="test-entry-123" />,
      );

      await waitFor(() => {
        expect(createCustomerInteraction).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track new calls
      (createCustomerInteraction as jest.Mock).mockClear();

      // Rerender with same timeEntryId
      rerender(<Widget {...defaultProps} timeEntryId="test-entry-123" />);

      // Wait a bit to ensure componentDidUpdate runs
      await waitFor(() => {
        // Should not create new interaction when timeEntryId hasn't changed
        expect(createCustomerInteraction).not.toHaveBeenCalled();
      });
    });
  });

  describe('componentDidCatch', () => {
    it('should log error and call onError when componentDidCatch is triggered (lines 92-97)', async () => {
      const Widget = TimeEntryLocationWidget as any;
      const testError = new Error('Test render error');
      const mockOnError = jest.fn();

      // Directly instantiate the class component and call componentDidCatch
      // since React error boundaries are hard to trigger via renderWithAllProviders
      const instance = new Widget({ ...defaultProps, onError: mockOnError });
      instance.componentDidCatch(testError);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=TIME_ENTRY_LOCATION_WIDGET_CRASH',
        { error: testError },
      );
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });

    it('should log error without calling onError when onError prop is not provided (line 97 optional call)', async () => {
      const Widget = TimeEntryLocationWidget as any;
      const testError = new Error('Test render error no callback');

      const instance = new Widget({ ...defaultProps });
      instance.componentDidCatch(testError);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=TIME_ENTRY_LOCATION_WIDGET_CRASH',
        { error: testError },
      );
    });
  });

  describe('Coverage gaps', () => {
    // truthy path when createCustomerInteraction returns an object
    it('should call getTracePropagationHeaders when createCustomerInteraction returns non-null (lines 65, 87)', async () => {
      const mockTraceHeaders = { 'x-trace-id': 'abc' };
      const mockGetTracePropagationHeaders = jest
        .fn()
        .mockReturnValue(mockTraceHeaders);
      (createCustomerInteraction as jest.Mock).mockReturnValue({
        getTracePropagationHeaders: mockGetTracePropagationHeaders,
      });

      renderWidget({ timeEntryId: 'entry-trace-test' });

      await waitFor(() => {
        expect(mockGetTracePropagationHeaders).toHaveBeenCalled();
      });
    });

    it('should call getTracePropagationHeaders on componentDidUpdate when timeEntryId changes (line 87)', async () => {
      const mockGetTracePropagationHeaders = jest
        .fn()
        .mockReturnValue({ 'x-trace-id': 'xyz' });
      (createCustomerInteraction as jest.Mock).mockReturnValue({
        getTracePropagationHeaders: mockGetTracePropagationHeaders,
      });

      const Widget = TimeEntryLocationWidget as any;
      const { rerender } = renderWithAllProviders(
        <Widget {...defaultProps} timeEntryId="entry-a" />,
      );

      (createCustomerInteraction as jest.Mock).mockClear();
      mockGetTracePropagationHeaders.mockClear();
      (createCustomerInteraction as jest.Mock).mockReturnValue({
        getTracePropagationHeaders: mockGetTracePropagationHeaders,
      });

      rerender(<Widget {...defaultProps} timeEntryId="entry-b" />);

      await waitFor(() => {
        expect(mockGetTracePropagationHeaders).toHaveBeenCalled();
      });
    });

    // this.props.setOpen?.(open) when setOpen is undefined (skips the call)
    it('should not crash when close button clicked without setOpen prop (line 101: ?. skip path)', async () => {
      renderWidget({ open: true, setOpen: undefined });

      await waitFor(() => {
        expect(screen.getByTestId('close-button')).toBeInTheDocument();
      });

      // Click close — triggers this.setOpen(false) → this.props.setOpen?.(false)
      // setOpen is undefined so ?. skips the call without throwing
      // The widget's internal setState still runs; the prop-controlled open doesn't change
      expect(() => screen.getByTestId('close-button').click()).not.toThrow();

      // open prop is still true because no external state handler changed it
      await waitFor(() => {
        expect(screen.getByTestId('container-open')).toHaveTextContent('open');
      });
    });

    it('should use default open=true when open prop is not provided (line 109: default param)', async () => {
      const Widget = TimeEntryLocationWidget as any;
      renderWithAllProviders(
        <Widget
          sandbox={mockSandbox}
          timeEntryId="entry-default-open"
          setOpen={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('container-open')).toHaveTextContent('open');
      });
    });
  });
});
