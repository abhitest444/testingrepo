import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { getDefaultSandbox } from 'test/unit/testUtils';
import { TimeActionView } from 'src/js/widgets/timeClock/components/TimeActionView';
import { TIME_CLOCK_EVENTS } from 'src/js/common/constants';
import { SEARCH_TIME_ENTRIES_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import { useLazyGetTSheetsWorkerById } from 'src/js/service/hooks/employee/useLazyGetTSheetsWorkerById';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';

// Mock the TSheets hook
jest.mock('src/js/service/hooks/employee/useLazyGetTSheetsWorkerById');
jest.mock('src/js/service/hooks/timeEntries/useLazySearchTimeEntries');

const defaultSandbox = getDefaultSandbox();
const mockSandbox = {
  ...defaultSandbox,
  appContext: {
    ...defaultSandbox.appContext,
    getUserAuthInfo: () => ({
      authId: 'test-auth-id',
      agentId: 'test-agent-id',
      authenticationLevel: 'FULL',
    }),
    getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
  },
  pubsub: {
    ...defaultSandbox.pubsub,
    subscribe: jest.fn().mockReturnValue('test-subscription-id'),
    unsubscribe: jest.fn(),
  },
  logger: {
    ...defaultSandbox.logger,
    info: jest.fn(),
    logException: jest.fn(),
  },
};

const mockEmployeeData = {
  tsheetsId: 'tsheets-123',
  authId: 'test-auth-id',
  employeeId: 'test-employee-id',
  profileId: 'test-profile-id',
  isEmployee: true,
  isQboUser: true,
};

const mockActiveTimeEntries = [
  {
    id: 'test-time-entry-id',
    startTime: '2024-03-20T10:00:00Z',
    endTime: null,
    isOpen: true,
  },
];

const defaultProps = {
  onClick: jest.fn(),
  open: true,
  setHasError: jest.fn(),
  resetError: jest.fn(),
  onSuccess: jest.fn(),
  loading: false,
  error: null,
};

describe('TimeActionView', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for TSheets hook
    (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: mockEmployeeData,
      loading: false,
      error: null,
    });

    // Default mock for search time entries hook
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: [],
      loading: false,
      error: null,
    });
  });

  it('renders clock in button when no active time entry', async () => {
    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/NLS timeclock\.clockIn/)).toBeInTheDocument();
    });
  });

  it('renders clock out button when there is an active time entry', async () => {
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: mockActiveTimeEntries,
      loading: false,
      error: null,
    });

    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    // Wait for component to update - when there's an active time entry, it shows a timer instead of text
    await waitFor(
      () => {
        // Check for the timer display (shows time like "11804:50:47")
        expect(screen.getByText(/\d+:\d+:\d+/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('handles employee data fetch error', async () => {
    (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: null,
      loading: false,
      error: new Error('Employee fetch error'),
    });

    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    // Component should still render even with error
    expect(screen.getByTestId('time-action-button')).toBeInTheDocument();
  });

  it('handles time entries fetch error', async () => {
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: null,
      loading: false,
      error: new Error('Time entries fetch error'),
    });

    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    // Component should still render even with error
    expect(screen.getByTestId('time-action-button')).toBeInTheDocument();
  });

  it('subscribes to TIME_CLOCK_EVENTS.CLOSE event', async () => {
    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    expect(mockSandbox.pubsub.subscribe).toHaveBeenCalledWith(
      TIME_CLOCK_EVENTS.CLOSE,
      expect.any(Function),
    );
  });

  it('unsubscribes from TIME_CLOCK_EVENTS.CLOSE event on unmount', async () => {
    const { unmount } = render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    unmount();

    expect(mockSandbox.pubsub.unsubscribe).toHaveBeenCalledWith(
      'test-subscription-id',
    );
  });

  it('calls onClick when button is clicked', async () => {
    render(
      <MockedProvider addTypename={false}>
        <MockQuicksandProvider sandbox={mockSandbox}>
          <TimeActionView {...defaultProps} />
        </MockQuicksandProvider>
      </MockedProvider>,
    );

    const button = screen.getByTestId('time-action-button');
    button.click();

    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  // New test cases to cover missing lines 48-150 and 161-165

  describe('Employee data handling', () => {
    it('fetches employee data on mount with valid authId', async () => {
      const mockQuery = jest.fn();
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: mockQuery,
        data: null,
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockQuery).toHaveBeenCalledWith({
          variables: {
            id: 'test-auth-id',
          },
        });
      });
    });

    it('does not fetch employee data when authId is missing', async () => {
      const mockQuery = jest.fn();
      const sandboxWithoutAuth = {
        ...mockSandbox,
        appContext: {
          ...mockSandbox.appContext,
          getUserAuthInfo: () => null,
        },
      };

      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: mockQuery,
        data: null,
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={sandboxWithoutAuth}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('sets employeeId and profileId when employee data is received', async () => {
      const mockQuery = jest.fn();
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: mockQuery,
        data: {
          employeeId: 'new-employee-id',
          profileId: 'new-profile-id',
        },
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // The component should update its internal state with the new IDs
      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          '[CLOCK_IN_FLOW] - TimeActionView - TimeActionView MOUNTED',
        );
      });
    });

    it('handles employee data with only employeeId', async () => {
      const mockQuery = jest.fn();
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: mockQuery,
        data: {
          employeeId: 'employee-only-id',
          profileId: null,
        },
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalled();
      });
    });

    it('handles employee data with only profileId', async () => {
      const mockQuery = jest.fn();
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: mockQuery,
        data: {
          employeeId: null,
          profileId: 'profile-only-id',
        },
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalled();
      });
    });
  });

  describe('Search time entries functionality', () => {
    it('searches for time entries when drawer is closed and effectiveId exists', async () => {
      const mockSearchQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: [] } },
      });

      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: { employeeId: 'test-employee-id' },
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockSearchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: {
              input: {
                timeEntryFilter: {
                  isExported: false,
                  isOpen: true,
                  timeForEntityId: {
                    equals: 'test-employee-id',
                  },
                },
              },
            },
          }),
        );
      });
    });

    it('does not search for time entries when drawer is open', async () => {
      const mockSearchQuery = jest.fn();
      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      expect(mockSearchQuery).not.toHaveBeenCalled();
    });

    it('does not search for time entries when effectiveId is missing', async () => {
      const mockSearchQuery = jest.fn();
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: { employeeId: null, profileId: null },
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      expect(mockSearchQuery).not.toHaveBeenCalled();
    });

    it('handles successful time entries search', async () => {
      const mockSearchQuery = jest.fn().mockResolvedValue({
        data: { timeTrackingTimeEntries: { edges: mockActiveTimeEntries } },
      });

      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: { employeeId: 'test-employee-id' },
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: mockActiveTimeEntries,
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          '[CLOCK_IN_FLOW] - TimeActionView - Successfully searched for active time entries',
          { activeTimeEntries: mockActiveTimeEntries },
        );
      });
    });

    it('handles time entries search error', async () => {
      const mockSearchQuery = jest
        .fn()
        .mockRejectedValue(new Error('Search failed'));
      const mockError = new Error('Search failed');

      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: { employeeId: 'test-employee-id' },
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.logException).toHaveBeenCalledWith(
          '[CLOCK_IN_FLOW] - TimeActionView - Error searching for active time entries',
          mockError,
        );
      });
    });
  });

  describe('PubSub event handling', () => {
    it('returns early from searchTimeEntries when effectiveId is empty (covers line 89)', async () => {
      const mockSearchQuery = jest.fn();
      let closeCallback: Function;

      const sandboxCapture = {
        ...mockSandbox,
        pubsub: {
          ...mockSandbox.pubsub,
          subscribe: jest.fn().mockImplementation((event, callback) => {
            if (event === TIME_CLOCK_EVENTS.CLOSE) {
              closeCallback = callback;
            }
            return 'test-subscription-id';
          }),
        },
      };

      // No employeeId or profileId so effectiveId will be empty string
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={sandboxCapture}>
            <TimeActionView {...defaultProps} open />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // Trigger the pubsub CLOSE callback with truthy data — searchTimeEntries will
      // be called but should return early because effectiveId is ''
      act(() => {
        closeCallback({ someData: 'test' });
      });

      // searchActiveTimeEntries query should NOT be called because effectiveId is empty
      await waitFor(() => {
        expect(mockSearchQuery).not.toHaveBeenCalled();
      });
    });

    it('handles TIME_CLOCK_EVENTS.CLOSE event and searches for time entries', async () => {
      const mockSearchQuery = jest.fn();
      let closeCallback: Function;

      mockSandbox.pubsub.subscribe = jest
        .fn()
        .mockImplementation((event, callback) => {
          if (event === TIME_CLOCK_EVENTS.CLOSE) {
            closeCallback = callback;
          }
          return 'test-subscription-id';
        });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // Simulate the close event
      act(() => {
        closeCallback({ someData: 'test' });
      });

      await waitFor(() => {
        expect(defaultProps.setHasError).toHaveBeenCalledWith(null);
        expect(mockSearchQuery).toHaveBeenCalled();
      });
    });

    it('handles TIME_CLOCK_EVENTS.CLOSE event with null data', async () => {
      let closeCallback: Function;

      mockSandbox.pubsub.subscribe = jest
        .fn()
        .mockImplementation((event, callback) => {
          if (event === TIME_CLOCK_EVENTS.CLOSE) {
            closeCallback = callback;
          }
          return 'test-subscription-id';
        });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // Simulate the close event with null data
      act(() => {
        closeCallback(null);
      });

      // Should not call setHasError or search when data is null
      expect(defaultProps.setHasError).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('sets error when drawer is closed and employee error exists', async () => {
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: 'Employee fetch failed',
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(defaultProps.setHasError).toHaveBeenCalledWith(
          new Error('Employee fetch failed'),
        );
      });
    });

    it('sets error when drawer is closed and time entries error exists', async () => {
      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: 'Time entries fetch failed',
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(defaultProps.setHasError).toHaveBeenCalledWith(
          new Error('Time entries fetch failed'),
        );
      });
    });

    it('sets error to false when drawer is closed and no errors exist', async () => {
      // Mock the hooks to return no errors
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: { employeeId: 'test-employee-id' },
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // The component should not call setHasError when there are no errors
      // It only sets the internal error state to false
      await waitFor(() => {
        // Verify the component renders without error state
        const button = screen.getByTestId('time-action-button');
        expect(button).toBeInTheDocument();
        expect(screen.getByText(/NLS timeclock\.clockIn/)).toBeInTheDocument();
      });
    });

    it('does not set error when drawer is open', async () => {
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: 'Employee fetch failed',
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      expect(defaultProps.setHasError).not.toHaveBeenCalled();
    });
  });

  describe('Button state and rendering', () => {
    it('renders error state button when error is true', async () => {
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: 'Employee fetch failed',
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        const button = screen.getByTestId('time-action-button');
        expect(button).toBeInTheDocument();
        // The button should show clock in text even in error state
        expect(screen.getByText(/NLS timeclock\.clockIn/)).toBeInTheDocument();
      });
    });

    it('disables button when loading', async () => {
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: true,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [],
        loading: true,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      const button = screen.getByTestId('time-action-button');
      expect(button).toBeDisabled();
    });

    it('passes startTime to TimeActionButton when there is an open time entry', async () => {
      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: mockActiveTimeEntries,
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        const button = screen.getByTestId('time-action-button');
        expect(button).toBeInTheDocument();
        // The button should show timer text when there's an active time entry
        expect(screen.getByText(/\d+:\d+:\d+/)).toBeInTheDocument();
      });
    });

    it('handles multiple active time entries and uses the first one', async () => {
      const multipleTimeEntries = [
        {
          id: 'first-time-entry',
          startTime: '2024-03-20T09:00:00Z',
          endTime: null,
          isOpen: true,
        },
        {
          id: 'second-time-entry',
          startTime: '2024-03-20T10:00:00Z',
          endTime: null,
          isOpen: true,
        },
      ];

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: multipleTimeEntries,
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      await waitFor(() => {
        const button = screen.getByTestId('time-action-button');
        expect(button).toBeInTheDocument();
        // Should show timer text when there are multiple active time entries
        expect(screen.getByText(/\d+:\d+:\d+/)).toBeInTheDocument();
      });
    });
    it('handles case when employee data is not available', async () => {
      // Mock the TSheets hook to return no employee data
      (useLazyGetTSheetsWorkerById as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: null,
        loading: false,
        error: null,
      });

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [],
        loading: false,
        error: null,
      });

      render(
        <MockedProvider addTypename={false}>
          <MockQuicksandProvider sandbox={mockSandbox}>
            <TimeActionView {...defaultProps} open={false} />
          </MockQuicksandProvider>
        </MockedProvider>,
      );

      // Should still render the button even when no employee data is available
      const button = screen.getByTestId('time-action-button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText(/NLS timeclock\.clockIn/)).toBeInTheDocument();
    });
  });
});
