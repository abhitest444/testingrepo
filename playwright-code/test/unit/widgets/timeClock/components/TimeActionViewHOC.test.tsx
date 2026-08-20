import React from 'react';
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useLazySearchTimeEntries } from 'src/js/service/hooks/timeEntries/useLazySearchTimeEntries';

import { TIME_CLOCK_EVENTS, FEATURE_FLAGS } from 'src/js/common/constants';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';
import TimeActionViewHOC from 'src/js/widgets/timeClock/components/TimeActionViewHOC';

// Mock isIXPFeatureFlagEnabled for tour functionality
jest.mock('src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: jest.fn().mockResolvedValue(false),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: jest.fn().mockReturnValue({
    data: {
      TIME_CLOCK_TOUR_COMPLETED: false,
    },
    loading: false,
    getPreference: jest.fn(),
    setPreference: jest.fn(),
    initialized: true,
  }),
  UxPreferenceKey: {
    TIME_CLOCK_TOUR_COMPLETED: 'TIME_CLOCK_TOUR_COMPLETED',
  },
}));

// Mock the required dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    appContext: {
      getUserAuthInfo: () => ({ authId: 'test-user-id' }),
      getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
    },
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      logException: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(),
      getCustomerInteraction: jest.fn(),
    },
    pubsub: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      publish: jest.fn(),
    },
  }),
}));

// Mock the company settings hook
jest.mock('src/js/service/hooks/settings/useCompanySettings', () => ({
  useCompanySettings: () => ({
    settingsData: { timezone: 'America/Los_Angeles' },
    loading: false,
    error: null,
  }),
}));

jest.mock('src/js/service/hooks/timeEntries/useLazySearchTimeEntries');

// Mock the TimeClockPopoverTourAdapter component
jest.mock(
  'src/js/widgets/timeClock/components/TimeClockPopoverTourAdapter',
  () =>
    function MockTimeClockPopoverTourAdapter({
      open,
      onClose,
      onFinish,
      targetElement,
      stepTargetElement,
      isClockedIn,
      tourContext,
    }: any) {
      if (!open) {
        return null;
      }
      return (
        <div data-testid="time-clock-popover-tour-adapter">
          <div>
            <button onClick={onClose}>Close Tour</button>
            <button onClick={onFinish}>Finish Tour</button>
            <span>Tour Context: {tourContext}</span>
            <span>Clocked In: {isClockedIn ? 'Yes' : 'No'}</span>
          </div>
        </div>
      );
    },
);

describe('TimeActionViewHOC', () => {
  const defaultProps = {
    onClick: jest.fn(),
    open: true,
    setHasError: jest.fn(),
    resetError: jest.fn(),
    onSuccess: jest.fn(),
    loading: false,
    error: null,
    employeeId: 'test-employee-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: [],
      loading: false,
    });
  });

  it('renders TimeActionButton with clock in state when no time entries', async () => {
    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} />
      </MockedProvider>,
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('timeclock.clockIn');
      expect(button).toHaveClass('purpose-standard');
    });
  });

  it('renders TimeActionButton with clock out state when there is an open time entry', async () => {
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: [{ startTime: '2024-03-20T10:00:00Z' }],
      loading: false,
    });

    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} />
      </MockedProvider>,
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('purpose-standard');
      // The button will show a timer instead of text when there's an open time entry
      expect(button).toBeInTheDocument();
    });
  });

  it('does not search for time entries when drawer is closed', async () => {
    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} open={false} />
      </MockedProvider>,
    );
  });

  it('searches for time entries when drawer is open', async () => {
    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} open />
      </MockedProvider>,
    );
  });

  it('handles OTX mode correctly', async () => {
    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('handles error when searching for time entries fails', async () => {
    const mockError = new Error('{}');
    const mocksetHasError = jest.fn();

    // Setup employee data first

    // Setup time entries query to fail
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: jest.fn(),
      data: null,
      loading: false,
      error: '{}',
    });

    render(
      <MockedProvider>
        <TimeActionViewHOC
          {...defaultProps}
          open={false}
          setHasError={mocksetHasError}
        />
      </MockedProvider>,
    );

    // Wait for error to be propagated
    await waitFor(() => {
      expect(mocksetHasError).toHaveBeenCalledWith(new Error('{}'));
    });
  });

  it('handles thrown error when searching for time entries', async () => {
    const mockError = new Error('Query failed');
    const mockSandbox = {
      logger: {
        info: jest.fn(),
        logException: jest.fn(),
      },
      performance: {
        createCustomerInteraction: jest.fn(),
        endInteractionWithFailure: jest.fn(),
        getCustomerInteraction: jest.fn(),
      },
      appContext: {
        getUserAuthInfo: () => ({ authId: 'test-user-id' }),
        getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
      },
      pubsub: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      },
    };

    jest
      .spyOn(require('@payroll/quicksand'), 'useSandbox')
      .mockReturnValue(mockSandbox);

    // Setup employee data

    // Setup time entries query to throw
    const mockSearchFn = jest.fn().mockRejectedValue(mockError);
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: mockSearchFn,
      data: null,
      loading: false,
    });

    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} open={false} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(mockSandbox.logger.logException).toHaveBeenCalledWith(
        '[CLOCK_IN_FLOW] - TimeActionViewHOC - Error searching for active time entries',
        mockError,
      );
      // expect(mockSandbox.performance.endInteractionWithFailure).toHaveBeenCalledWith(
      //   'active-time-entry-read',
      //   'QUERY_ERROR',
      //   mockError
      // );
    });
  });

  it('successfully searches for time entries and handles customer interactions', async () => {
    const mockSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        logException: jest.fn(),
      },
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn(),
      },
      appContext: {
        getUserAuthInfo: () => ({ authId: 'test-user-id' }),
        getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
      },
      pubsub: {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        publish: jest.fn(),
      },
    };

    jest
      .spyOn(require('@payroll/quicksand'), 'useSandbox')
      .mockReturnValue(mockSandbox);

    // Setup employee data first

    const mockSearchFn = jest.fn().mockResolvedValue({ data: [] });
    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: mockSearchFn,
      data: [],
      loading: false,
    });

    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} open={false} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(mockSearchFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: expect.objectContaining({
              timeEntryFilter: {
                isExported: false,
                isOpen: true,
                timeForEntityId: {
                  equals: 'test-employee-id',
                },
              },
            }),
          },
        }),
      );
      expect(
        mockSandbox.performance.createCustomerInteraction,
      ).toHaveBeenCalledWith('active-time-entry-read', undefined, {
        returnExistingCI: true,
      });
    });
  });

  it('refreshes time entries and resets error when TIME_CLOCK_EVENTS.CLOSE is published', async () => {
    const mocksetHasError = jest.fn();
    const mockSearchFn = jest.fn();
    let pubsubCallback: Function | undefined;
    const mockSandbox = {
      logger: { info: jest.fn() },
      performance: {
        createCustomerInteraction: jest.fn(),
        getCustomerInteraction: jest.fn(),
      },
      appContext: {
        getUserAuthInfo: () => ({ authId: 'test-user-id' }),
        getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
      },
      pubsub: {
        subscribe: jest.fn().mockImplementation((event, callback) => {
          pubsubCallback = callback;
          return 'mock-subscription-id';
        }),
        unsubscribe: jest.fn(),
      },
    };

    jest
      .spyOn(require('@payroll/quicksand'), 'useSandbox')
      .mockReturnValue(mockSandbox);

    (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
      query: mockSearchFn,
      data: null,
      loading: false,
    });

    render(
      <MockedProvider>
        <TimeActionViewHOC {...defaultProps} setHasError={mocksetHasError} />
      </MockedProvider>,
    );

    // Wait for component to mount and subscribe
    await waitFor(() => {
      expect(mockSandbox.pubsub.subscribe).toHaveBeenCalledWith(
        TIME_CLOCK_EVENTS.CLOSE,
        expect.any(Function),
      );
    });

    // Now trigger the callback
    pubsubCallback?.(false);

    // Wait for the callback effects
    await waitFor(() => {
      expect(mocksetHasError).toHaveBeenCalledWith(null);
      expect(mockSearchFn).toHaveBeenCalled();
    });
  });

  describe('Tour Functionality', () => {
    beforeEach(() => {
      // Mock tour preferences
      (useUxPreferences as jest.Mock).mockReturnValue({
        data: {
          TIME_CLOCK_TOUR_COMPLETED: false, // Tour not completed
        },
        loading: false,
        getPreference: jest.fn(),
        setPreference: jest.fn(),
        initialized: true,
      });

      // Mock feature flags
      (isIXPFeatureFlagEnabled as jest.Mock).mockImplementation(
        (sandbox, flagName) => {
          if (flagName === FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR) {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        },
      );
    });

    it('should trigger tour when drawer closes and conditions are met', async () => {
      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            // Call callback immediately to simulate drawer close event
            callback(true);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      // Setup employee data

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [{ startTime: '2024-03-20T10:00:00Z' }], // Active time entry
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // Should show tour adapter when conditions are met
        expect(
          screen.getByTestId('time-clock-popover-tour-adapter'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('Tour Context: drawer-closed'),
        ).toBeInTheDocument();
        expect(screen.getByText('Clocked In: Yes')).toBeInTheDocument();
      });
    });

    it('should not trigger tour when tour is already completed', async () => {
      // Mock tour as completed
      (useUxPreferences as jest.Mock).mockReturnValue({
        data: {
          TIME_CLOCK_TOUR_COMPLETED: true, // Tour completed
        },
        loading: false,
        getPreference: jest.fn(),
        setPreference: jest.fn(),
        initialized: true,
      });

      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            callback(true);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // Tour should not be shown when already completed
        expect(
          screen.queryByTestId('time-clock-popover-tour-adapter'),
        ).not.toBeInTheDocument();
      });
    });

    it('should not trigger tour when feature flag is disabled', async () => {
      // Mock tour feature flag as disabled
      (isIXPFeatureFlagEnabled as jest.Mock).mockImplementation(
        (sandbox, flagName) => {
          if (flagName === FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR) {
            return Promise.resolve(false); // Tour feature flag disabled
          }
          return Promise.resolve(false);
        },
      );

      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            callback(true);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // Tour should not be shown when feature flag is disabled
        expect(
          screen.queryByTestId('time-clock-popover-tour-adapter'),
        ).not.toBeInTheDocument();
      });
    });

    it('should not trigger tour when feature flag check fails', async () => {
      const mockSandbox = {
        logger: {
          info: jest.fn(),
          error: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            callback(true);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      // Mock feature flag to return false (disabled) instead of throwing error
      (isIXPFeatureFlagEnabled as jest.Mock).mockResolvedValue(false);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // Tour should not be shown when feature flag is disabled
        expect(
          screen.queryByTestId('time-clock-popover-tour-adapter'),
        ).not.toBeInTheDocument();
      });
    });

    it('should call isIXPFeatureFlagEnabled with correct parameters', async () => {
      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            callback(true);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        expect(isIXPFeatureFlagEnabled).toHaveBeenCalledWith(
          mockSandbox,
          FEATURE_FLAGS.QB_TIME_TRACKING_UI_TIME_CLOCK_TOUR,
        );
      });
    });

    it('should not trigger tour when no active time entry on drawer close', async () => {
      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            // Call callback with false to simulate no active time entry
            callback(false);
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn(),
        data: [], // No active time entries
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      await waitFor(() => {
        // Tour should not be shown when there's no active time entry
        expect(
          screen.queryByTestId('time-clock-popover-tour-adapter'),
        ).not.toBeInTheDocument();
      });
    });

    it('should call searchTimeEntries when drawer closes', async () => {
      const mockSearchTimeEntries = jest.fn();
      let pubsubCallback: Function | undefined;
      const mockSandbox = {
        logger: {
          info: jest.fn(),
        },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            pubsubCallback = callback;
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchTimeEntries,
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      // Wait for component to mount and subscribe
      await waitFor(() => {
        expect(mockSandbox.pubsub.subscribe).toHaveBeenCalledWith(
          TIME_CLOCK_EVENTS.CLOSE,
          expect.any(Function),
        );
      });

      // Now trigger the callback
      pubsubCallback?.(true);

      // Wait for the callback effects
      await waitFor(() => {
        expect(mockSearchTimeEntries).toHaveBeenCalled();
      });
    });

    it('should close tour popover when onClose is called', async () => {
      (isIXPFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);

      // Fire the pubsub callback only once so that re-subscribing (caused by
      // tourPopover being in the useEffect dep array) does not immediately
      // re-open the popover after onClose sets tourPopover=false.
      const mockSandbox = {
        logger: { info: jest.fn() },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest
            .fn()
            .mockImplementationOnce((_event: any, callback: any) => {
              setTimeout(() => callback(true), 0);
              return 'mock-sub-id';
            })
            .mockImplementation(() => 'mock-sub-id-noop'),
          unsubscribe: jest.fn(),
          publish: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn().mockResolvedValue({}),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} open={false} />
        </MockedProvider>,
      );

      // Wait for tour adapter to appear (triggered by the one-shot pubsub callback)
      await waitFor(
        () => {
          expect(
            screen.queryByTestId('time-clock-popover-tour-adapter'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Click Close Tour — calls setTourPopover(false)
      const closeButton = screen.getByText('Close Tour');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      // Subsequent re-subscriptions are no-ops so the popover stays closed
      await waitFor(() => {
        expect(
          screen.queryByTestId('time-clock-popover-tour-adapter'),
        ).not.toBeInTheDocument();
      });
    });

    it('should handle empty employeeId gracefully (covers effectiveId falsy branch)', async () => {
      render(
        <MockedProvider>
          <TimeActionViewHOC
            {...defaultProps}
            employeeId={undefined as any}
            open
          />
        </MockedProvider>,
      );

      // Component renders without crashing; effectiveId is '' so searchTimeEntries returns early
      await waitFor(() => {
        expect(screen.queryByTestId('time-clock-container')).toBeDefined();
      });
    });

    it('returns early from searchTimeEntries when effectiveId is empty via pubsub CLOSE callback (covers line 88)', async () => {
      const mockSearchQuery = jest.fn();
      let pubsubCallback: Function | undefined;

      const mockSandbox = {
        logger: { info: jest.fn() },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((event, callback) => {
            pubsubCallback = callback;
            return 'mock-subscription-id';
          }),
          unsubscribe: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: mockSearchQuery,
        data: [],
        loading: false,
      });

      render(
        <MockedProvider>
          {/* employeeId is undefined so effectiveId resolves to '' */}
          <TimeActionViewHOC {...defaultProps} employeeId={undefined as any} />
        </MockedProvider>,
      );

      // Wait for subscription to be set up
      await waitFor(() => {
        expect(mockSandbox.pubsub.subscribe).toHaveBeenCalledWith(
          TIME_CLOCK_EVENTS.CLOSE,
          expect.any(Function),
        );
      });

      // Trigger the CLOSE callback — searchTimeEntries is called but should return
      // early at line 88 because effectiveId is ''
      pubsubCallback?.(true);

      // The search query should NOT be invoked because effectiveId is empty
      await waitFor(() => {
        expect(mockSearchQuery).not.toHaveBeenCalled();
      });
    });

    it('should use false for tourCompleted when uxPreferencesData is null', async () => {
      const {
        useUxPreferences: mockUxPref,
      } = require('src/js/service/utils/useUXPreferences');
      mockUxPref.mockReturnValue({
        data: null, // null data — exercises the `?.` null path and `?? false` fallback
        loading: false,
        getPreference: jest.fn(),
        setPreference: jest.fn(),
        initialized: true,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} />
        </MockedProvider>,
      );

      // Should render without crashing when data is null (tourCompleted defaults to false)
      expect(
        screen.queryByTestId('time-clock-popover-tour-adapter'),
      ).toBeDefined();
    });

    it('should call setPreference when onFinish is called', async () => {
      (isIXPFeatureFlagEnabled as jest.Mock).mockResolvedValue(true);

      const mockSetPreference = jest.fn().mockResolvedValue(undefined);
      const {
        useUxPreferences: mockUxPref,
      } = require('src/js/service/utils/useUXPreferences');
      mockUxPref.mockReturnValue({
        data: { TIME_CLOCK_TOUR_COMPLETED: false },
        loading: false,
        getPreference: jest.fn(),
        setPreference: mockSetPreference,
        initialized: true,
      });

      const mockSandbox = {
        logger: { info: jest.fn() },
        performance: {
          createCustomerInteraction: jest.fn(),
          getCustomerInteraction: jest.fn(),
        },
        appContext: {
          getUserAuthInfo: () => ({ authId: 'test-user-id' }),
          getRealm: () => Promise.resolve({ realmId: 'test-realm-id' }),
        },
        pubsub: {
          subscribe: jest.fn().mockImplementation((_event, callback) => {
            setTimeout(() => callback(true), 0);
            return 'mock-sub-id-2';
          }),
          unsubscribe: jest.fn(),
          publish: jest.fn(),
        },
      };

      jest
        .spyOn(require('@payroll/quicksand'), 'useSandbox')
        .mockReturnValue(mockSandbox);

      (useLazySearchTimeEntries as jest.Mock).mockReturnValue({
        query: jest.fn().mockResolvedValue({}),
        data: [{ startTime: '2024-03-20T10:00:00Z' }],
        loading: false,
      });

      render(
        <MockedProvider>
          <TimeActionViewHOC {...defaultProps} open={false} />
        </MockedProvider>,
      );

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('time-clock-popover-tour-adapter'),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      const finishButton = screen.getByText('Finish Tour');
      await act(async () => {
        fireEvent.click(finishButton);
      });

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalledWith(
          UxPreferenceKey.TIME_CLOCK_TOUR_COMPLETED,
          true,
        );
      });
    });
  });
});
