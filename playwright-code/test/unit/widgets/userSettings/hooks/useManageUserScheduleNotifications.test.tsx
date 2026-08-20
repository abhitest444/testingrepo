// @ts-nocheck
import { renderHook, act } from '@testing-library/react-hooks';
import { useManageUserScheduleNotifications } from 'src/js/service/hooks/userLevelSettings/useManageUserScheduleNotifications';
import { USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING } from 'src/js/widgets/userSettings/constants/loggingConstants';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// ─── Apollo mock ──────────────────────────────────────────────────────────────
// useMutation is mocked entirely so no Apollo Provider is required.
// We capture the onCompleted/onError options so we can fire them directly in tests.

let capturedOnCompleted: ((result: any) => void) | undefined;
let capturedApolloOnError: ((err: any) => void) | undefined;
const mockMutateFn = jest.fn();

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  const mockUseMutationFn = jest.fn();
  return {
    ApolloError: actual.ApolloError,
    useMutation: mockUseMutationFn,
  };
});

// ─── Quicksand mock ───────────────────────────────────────────────────────────

const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
  useIntl: jest.fn(),
}));

// ─── ApolloClientBuilderUtils mock ────────────────────────────────────────────

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ApolloClientNames: {
    TIME_TRACKING: 'TIME_TRACKING',
  },
}));

// ─── mapError mock ────────────────────────────────────────────────────────────

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

// ─── timeTrackingErrors mock ──────────────────────────────────────────────────

jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  isExpectedError: jest.fn(() => false),
  mapTimeTrackingMutationError: jest.fn(),
}));

// ─── CustomerInteraction mock ─────────────────────────────────────────────────

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest
    .fn()
    .mockReturnValue({ 'x-interaction-id': 'test-id' }),
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockInput = {
  scheduleNotifications: { subscriptions: [] },
};

const mockPayload = {
  __typename: 'TimeTracking_ManageUnifiedUserSettingsPayload',
  successCode: 'SUCCESS',
  userSettings: {},
};

const mockErrorResponse = {
  __typename: 'TimeTracking_ManageUnifiedUserSettingsError',
  errorCode: 'ERROR_SAVING_USER_SETTINGS',
  message: 'Something went wrong',
  details: 'detail info',
  subCode: '',
};

// ─── Helper to render the hook ────────────────────────────────────────────────

const buildHook = (
  overrides: Partial<{
    onSuccess: jest.Mock;
    onError: jest.Mock;
    interaction: any;
  }> = {},
) => {
  const onSuccess = overrides.onSuccess ?? jest.fn();
  const onError = overrides.onError ?? jest.fn();
  const interaction =
    'interaction' in overrides ? overrides.interaction : undefined;
  return renderHook(() =>
    useManageUserScheduleNotifications({ onSuccess, onError, interaction }),
  );
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('useManageUserScheduleNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnCompleted = undefined;
    capturedApolloOnError = undefined;

    // Restore useMutation implementation after clearAllMocks wipes it.
    const { useMutation } = require('@apollo/client');
    useMutation.mockImplementation((_document, options) => {
      capturedOnCompleted = options?.onCompleted;
      capturedApolloOnError = options?.onError;
      return [mockMutateFn, { loading: false }];
    });

    const { useSandbox, useIntl } = require('@payroll/quicksand');
    useSandbox.mockReturnValue(mockSandbox);
    useIntl.mockReturnValue({
      formatMessage: jest.fn((msg) => msg?.defaultMessage ?? ''),
    });

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('mapped-error-string');

    const {
      mapTimeTrackingMutationError,
    } = require('src/js/service/errors/timeTrackingErrors');
    mapTimeTrackingMutationError.mockReturnValue('mapped-mutation-error');

    // Restore interaction mock impls cleared by clearAllMocks
    const CI = require('src/js/common/CustomerInteraction');
    CI.getCustomerInteractionPropagationHeaders.mockReturnValue({
      'x-interaction-id': 'test-id',
    });
  });

  // ── 1. saveUserScheduleNotifications calls mutate with correct variables and context ──

  it('calls mutate with correct variables and TIME_TRACKING context', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockPayload,
      },
    });

    const { result } = buildHook();

    await act(async () => {
      await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(mockMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: mockInput },
        context: expect.objectContaining({
          clientName: ApolloClientNames.TIME_TRACKING,
        }),
      }),
    );
  });

  // ── 2. Returns true when mutation returns Payload typename ─────────────────

  it('returns true when mutation result has Payload typename', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockPayload,
      },
    });

    const { result } = buildHook();

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(ok!).toBe(true);
  });

  // ── 3. Returns false when mutation returns Error typename ──────────────────

  it('returns false when mutation result has Error typename', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      },
    });

    const { result } = buildHook();

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(ok!).toBe(false);
  });

  // ── 4. Returns false when mutation throws ─────────────────────────────────

  it('returns false when the mutation throws', async () => {
    mockMutateFn.mockRejectedValue(new Error('network failure'));

    const { result } = buildHook();

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(ok!).toBe(false);
  });

  // ── 5. onCompleted with Payload typename calls onSuccess with the payload ──

  it('onCompleted with Payload typename calls onSuccess with the payload', async () => {
    mockMutateFn.mockResolvedValue({});

    const onSuccess = jest.fn();
    buildHook({ onSuccess });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockPayload,
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(mockPayload);
  });

  it('logs SAVE_SUCCESS with Component/Event/section format on successful save', async () => {
    mockMutateFn.mockResolvedValue({});

    buildHook();

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockPayload,
      });
    });

    expect(mockSandbox.logger.info).toHaveBeenCalledWith(
      `Component=useManageUserScheduleNotifications Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.SAVE_SUCCESS} section=SCHEDULE_NOTIFICATIONS`,
    );
  });

  // ── 6. onCompleted with Error typename calls onError with mapped error ─────

  it('onCompleted with Error typename calls onError with mapped error', async () => {
    mockMutateFn.mockResolvedValue({});

    const onError = jest.fn();
    buildHook({ onError });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(onError).toHaveBeenCalledWith('mapped-error-string');
  });

  // ── 7. onCompleted with null response calls onError ───────────────────────

  it('onCompleted with null response calls onError', async () => {
    mockMutateFn.mockResolvedValue({});

    const onError = jest.fn();
    buildHook({ onError });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: null,
      });
    });

    expect(onError).toHaveBeenCalledWith('mapped-error-string');
  });

  // ── 8. onCompleted with unexpected typename calls onError ─────────────────

  it('onCompleted with unexpected typename calls onError', async () => {
    mockMutateFn.mockResolvedValue({});

    const onError = jest.fn();
    buildHook({ onError });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: {
          __typename: 'SomeUnknownType',
        },
      });
    });

    expect(onError).toHaveBeenCalledWith('mapped-error-string');
  });

  // ── 9. Apollo-level onError callback calls onError prop ───────────────────

  it('Apollo-level onError callback calls onError prop', async () => {
    mockMutateFn.mockResolvedValue({});

    const onError = jest.fn();
    buildHook({ onError });

    const { ApolloError } = jest.requireActual('@apollo/client');
    const apolloErr = new ApolloError({ errorMessage: 'Apollo network error' });

    await act(async () => {
      capturedApolloOnError?.(apolloErr);
    });

    expect(onError).toHaveBeenCalledWith('mapped-error-string');
  });

  // ── 10. createCustomerInteraction is called when interaction is provided ───

  it('calls createCustomerInteraction when saveUserScheduleNotifications is invoked and interaction is set', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockPayload,
      },
    });

    const {
      createCustomerInteraction,
    } = require('src/js/common/CustomerInteraction');

    const { result } = buildHook({
      interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    });

    await act(async () => {
      await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(createCustomerInteraction).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    );
  });

  // ── Extra: createCustomerInteraction NOT called when no interaction ────────

  it('does NOT call createCustomerInteraction when interaction is undefined', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockPayload,
      },
    });

    const {
      createCustomerInteraction,
    } = require('src/js/common/CustomerInteraction');

    const { result } = buildHook({ interaction: undefined });

    await act(async () => {
      await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(createCustomerInteraction).not.toHaveBeenCalled();
  });

  // ── Extra: propagation headers are merged into mutation context ────────────

  it('passes interaction propagation headers in mutation context when interaction is provided', async () => {
    mockMutateFn.mockResolvedValue({
      data: {
        timeTrackingManageUnifiedUserSettings: mockPayload,
      },
    });

    const {
      getCustomerInteractionPropagationHeaders,
    } = require('src/js/common/CustomerInteraction');

    const { result } = buildHook({
      interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    });

    await act(async () => {
      await result.current.saveUserScheduleNotifications(mockInput);
    });

    expect(getCustomerInteractionPropagationHeaders).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    );

    expect(mockMutateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: { 'x-interaction-id': 'test-id' },
        }),
      }),
    );
  });

  // ── Extra: endInteractionWithSuccess called on successful save ────────────

  it('calls endInteractionWithSuccess when onCompleted receives Payload and interaction is set', async () => {
    mockMutateFn.mockResolvedValue({});

    const {
      endInteractionWithSuccess,
    } = require('src/js/common/CustomerInteraction');

    buildHook({
      interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockPayload,
      });
    });

    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    );
  });

  // ── Extra: endInteractionWithFailure called for non-expected errors ────────

  it('calls endInteractionWithFailure on non-expected Error typename when interaction is set', async () => {
    mockMutateFn.mockResolvedValue({});

    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(false);

    const {
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');

    buildHook({
      interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(endInteractionWithFailure).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
      mockErrorResponse.errorCode,
    );
  });

  // ── Extra: endInteractionWithSuccess called for expected errors ───────────

  it('calls endInteractionWithSuccess (not failure) for expected errors when interaction is set', async () => {
    mockMutateFn.mockResolvedValue({});

    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(true);

    const {
      endInteractionWithSuccess,
      endInteractionWithFailure,
    } = require('src/js/common/CustomerInteraction');

    buildHook({
      interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(endInteractionWithSuccess).toHaveBeenCalledWith(
      mockSandbox,
      TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
    );
    expect(endInteractionWithFailure).not.toHaveBeenCalled();
  });

  // ── Extra: customErrorHandler uses message+details for GENERAL errors with non-empty subCode ─

  it('onCompleted Error path calls onError with mapped message', async () => {
    mockMutateFn.mockResolvedValue({});
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('mapped-error-message');

    const onError = jest.fn();
    buildHook({ onError });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: {
          __typename: 'TimeTracking_ManageUnifiedUserSettingsError',
          errorCode: 'GENERAL_V3_ERROR',
          message: 'msg',
          details: 'det',
          subCode: '  SUBCODE  ',
        },
      });
    });

    expect(onError).toHaveBeenCalledWith('mapped-error-message');
  });

  // ── Extra: customErrorHandler delegates to mapTimeTrackingMutationError for other codes ─

  it('customErrorHandler delegates to mapTimeTrackingMutationError for other error codes', async () => {
    mockMutateFn.mockResolvedValue({});

    const { mapError } = require('src/js/service/utils/mapError');
    const {
      mapTimeTrackingMutationError,
    } = require('src/js/service/errors/timeTrackingErrors');

    let capturedCustomHandler: ((error: string) => string) | undefined;
    let capturedIntl: any;
    mapError.mockImplementation(({ customErrorHandler, intl }) => {
      capturedCustomHandler = customErrorHandler;
      capturedIntl = intl;
      return 'mapped-result';
    });

    mapTimeTrackingMutationError.mockReturnValue('tt-error-mapped');

    buildHook();

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(capturedCustomHandler).toBeDefined();
    capturedCustomHandler!('SOME_OTHER_ERROR');

    expect(mapTimeTrackingMutationError).toHaveBeenCalledWith(
      capturedIntl,
      'SOME_OTHER_ERROR',
    );
  });

  // Extra tests for error logging
  it('logs errorCode as-is when handleError receives a plain string', async () => {
    mockMutateFn.mockResolvedValue({});

    buildHook();

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      `Component=useManageUserScheduleNotifications Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.SAVE_FAILED} section=SCHEDULE_NOTIFICATIONS`,
      expect.objectContaining({ errorCode: mockErrorResponse.errorCode }),
    );
  });

  it('logs errorCode as ApolloError.message when handleError receives an ApolloError', async () => {
    mockMutateFn.mockResolvedValue({});

    const { ApolloError } = jest.requireActual('@apollo/client');
    const apolloErr = new ApolloError({ errorMessage: 'Apollo network error' });

    buildHook();

    await act(async () => {
      capturedApolloOnError?.(apolloErr);
    });

    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      `Component=useManageUserScheduleNotifications Event=${USER_SETTINGS_SCHEDULE_NOTIFICATIONS_LOGGING.SAVE_FAILED} section=SCHEDULE_NOTIFICATIONS`,
      expect.objectContaining({ errorCode: apolloErr.message }),
    );
  });

  // ── Extra: loading state is exposed ───────────────────────────────────────

  it('exposes loading: false from useMutation', () => {
    const { result } = buildHook();
    expect(result.current.loading).toBe(false);
  });

  // ── Extra: onError not called when mapError returns undefined ─────────────

  it('does NOT call onError when mapError returns undefined', async () => {
    mockMutateFn.mockResolvedValue({});

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const onError = jest.fn();
    buildHook({ onError });

    await act(async () => {
      capturedOnCompleted?.({
        timeTrackingManageUnifiedUserSettings: mockErrorResponse,
      });
    });

    expect(onError).not.toHaveBeenCalled();
  });
});
