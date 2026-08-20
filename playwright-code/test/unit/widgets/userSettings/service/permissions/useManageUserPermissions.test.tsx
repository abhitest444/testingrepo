import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_UpdateWorkerPermissionsError,
  aTimeTracking_UpdateWorkerPermissionsPayload,
  aTimeTracking_WorkerPermissions,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  TimeTracking_TimeForType,
  TimeTrackingUpdateWorkerPermissionsDocument,
} from 'src/__generated__/timeTracking/graphql';
import {
  useManageUserPermissions,
  UseManageUserPermissionsArgs,
} from 'src/js/widgets/userSettings/service/permissions/useManageUserPermissions';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';
import {
  PERMISSIONS_ROLE_VALUE,
  PROJECTS_ACCESS_VALUE,
  SCHEDULE_SCOPE_VALUE,
  WHOS_WORKING_SCOPE_VALUE,
} from 'src/js/widgets/userSettings/components/cards/PermissionsCard/constants';

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  ...jest.requireActual('src/js/service/errors/timeTrackingErrors'),
  isExpectedError: jest.fn(),
  mapTimeTrackingMutationError: jest.fn(),
}));

const basePermissions = {
  role: PERMISSIONS_ROLE_VALUE.WORKER,
  timesheets: { mobileTimeEntry: false, manageMyTimesheets: false },
  schedule: {
    viewSchedule: false,
    viewScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
    manageSchedule: false,
    manageScheduleScope: SCHEDULE_SCOPE_VALUE.THEIR_OWN,
  },
  projectsAccess: PROJECTS_ACCESS_VALUE.NO_ACCESS,
  company: {
    viewWhosWorking: false,
    viewWhosWorkingScope: WHOS_WORKING_SCOPE_VALUE.ALL_WORKERS,
  },
};

describe('useManageUserPermissions', () => {
  let args: UseManageUserPermissionsArgs;
  const saveInput = {
    settingsFor: {
      id: 'worker-1',
      timeForType: TimeTracking_TimeForType.Employee,
    },
    permissions: {
      ...basePermissions,
      role: PERMISSIONS_ROLE_VALUE.TIME_ADMIN,
    },
    previousPermissions: basePermissions,
  };
  const mutationVariables = {
    input: {
      workerId: 'worker-1',
      workerType: TimeTracking_TimeForType.Employee,
      admin: true,
    },
  };

  beforeEach(() => {
    args = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      interaction: TimeCustomerInteraction.USER_PERMISSIONS_SAVE,
    };
    jest.clearAllMocks();
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(false);
  });

  it('saves permissions successfully', async () => {
    const payload = aTimeTracking_UpdateWorkerPermissionsPayload({
      workerPermissions: aTimeTracking_WorkerPermissions({ admin: true }),
    });

    const { result } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [
        {
          request: {
            query: TimeTrackingUpdateWorkerPermissionsDocument,
            variables: mutationVariables,
          },
          result: { data: { timeTrackingUpdateWorkerPermissions: payload } },
        },
      ],
    );

    await act(async () => {
      await result.current.saveUserPermissions(saveInput);
    });

    expect(args.onSuccess).toHaveBeenCalledWith({
      permissions: expect.objectContaining({
        role: PERMISSIONS_ROLE_VALUE.TIME_ADMIN,
      }),
    });
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_SAVE,
    );
  });

  it('handles mutation error payload', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Save failed');

    const { result } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [
        {
          request: {
            query: TimeTrackingUpdateWorkerPermissionsDocument,
            variables: mutationVariables,
          },
          result: {
            data: {
              timeTrackingUpdateWorkerPermissions:
                aTimeTracking_UpdateWorkerPermissionsError({
                  errorCode: 'INVALID_INPUT',
                  message: 'bad input',
                }),
            },
          },
        },
      ],
    );

    await act(async () => {
      await result.current.saveUserPermissions(saveInput);
    });

    expect(args.onError).toHaveBeenCalledWith('Save failed');
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalled();
  });

  it('handles null and unexpected mutation responses', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Null Response');

    const nullMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: { data: { timeTrackingUpdateWorkerPermissions: null } },
    };

    const { result: nullResult } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [nullMock],
    );

    await act(async () => {
      await nullResult.current.saveUserPermissions(saveInput);
    });
    expect(args.onError).toHaveBeenCalledWith('Null Response');

    mapError.mockReturnValue('Unexpected response type');
    const unexpectedMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions: { __typename: 'Unexpected' },
        },
      },
    };

    const { result: unexpectedResult } = renderHookWithApolloProvider(
      () => useManageUserPermissions({ ...args, onError: jest.fn() }),
      [unexpectedMock],
    );

    await act(async () => {
      await unexpectedResult.current.saveUserPermissions(saveInput);
    });
  });

  it('handles Apollo network errors and expected business errors', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Network error');

    const networkMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      error: new ApolloError({ errorMessage: 'Network error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [networkMock],
    );

    await act(async () => {
      await result.current.saveUserPermissions(saveInput);
    });
    expect(args.onError).toHaveBeenCalledWith('Network error');

    const {
      isExpectedError,
    } = require('src/js/service/errors/timeTrackingErrors');
    isExpectedError.mockReturnValue(true);
    mapError.mockReturnValue('Expected error');

    const expectedErrorMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions:
            aTimeTracking_UpdateWorkerPermissionsError({
              errorCode: 'PERMISSION_DENIED',
              message: 'denied',
            }),
        },
      },
    };

    const { result: expectedResult } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [expectedErrorMock],
    );

    await act(async () => {
      await expectedResult.current.saveUserPermissions(saveInput);
    });

    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.USER_PERMISSIONS_SAVE,
    );
  });

  it('skips onError when mapError returns undefined', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);

    const errorMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions:
            aTimeTracking_UpdateWorkerPermissionsError({
              errorCode: 'INVALID_INPUT',
            }),
        },
      },
    };

    const onError = jest.fn();
    const { result } = renderHookWithApolloProvider(
      () => useManageUserPermissions({ onError }),
      [errorMock],
    );

    await act(async () => {
      await result.current.saveUserPermissions(saveInput);
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('handles null workerPermissions in success payload and custom GENERAL errors', async () => {
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('Null Response');

    const nullWorkerMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions: {
            __typename: 'TimeTracking_UpdateWorkerPermissionsPayload',
            successCode: 'SUCCESS',
            workerPermissions: null,
          },
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageUserPermissions(args),
      [nullWorkerMock],
    );

    await act(async () => {
      await result.current.saveUserPermissions(saveInput);
    });
    expect(args.onError).toHaveBeenCalledWith('Null Response');

    mapError.mockImplementation(
      ({
        customErrorHandler,
      }: {
        customErrorHandler?: (raw: string) => string;
      }) => customErrorHandler?.('GENERAL_V3_ERROR'),
    );

    const generalErrorMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions:
            aTimeTracking_UpdateWorkerPermissionsError({
              errorCode: 'GENERAL_V3_ERROR',
              message: 'msg',
              details: 'details',
              subCode: 'SUB',
            }),
        },
      },
    };

    const onError = jest.fn();
    const { result: generalResult } = renderHookWithApolloProvider(
      () => useManageUserPermissions({ onError }),
      [generalErrorMock],
    );

    await act(async () => {
      await generalResult.current.saveUserPermissions(saveInput);
    });

    expect(mapError).toHaveBeenCalledWith(
      expect.objectContaining({
        customErrorHandler: expect.any(Function),
      }),
    );

    const {
      mapTimeTrackingMutationError,
    } = require('src/js/service/errors/timeTrackingErrors');
    mapTimeTrackingMutationError.mockReturnValue('Mapped mutation error');
    mapError.mockImplementation(
      ({
        customErrorHandler,
      }: {
        customErrorHandler?: (raw: string) => string;
      }) => customErrorHandler?.('OTHER_ERROR'),
    );

    const otherErrorMock = {
      request: {
        query: TimeTrackingUpdateWorkerPermissionsDocument,
        variables: mutationVariables,
      },
      result: {
        data: {
          timeTrackingUpdateWorkerPermissions:
            aTimeTracking_UpdateWorkerPermissionsError({
              errorCode: 'OTHER_ERROR',
              subCode: '',
            }),
        },
      },
    };

    const otherOnError = jest.fn();
    const { result: otherResult } = renderHookWithApolloProvider(
      () => useManageUserPermissions({ onError: otherOnError }),
      [otherErrorMock],
    );

    await act(async () => {
      await otherResult.current.saveUserPermissions(saveInput);
    });

    expect(mapTimeTrackingMutationError).toHaveBeenCalled();
  });

  it('logs unexpected sync failures from mutate', async () => {
    const mutate = jest.fn().mockRejectedValue(new Error('sync fail'));
    const useMutationSpy = jest
      .spyOn(
        require('src/__generated__/timeTracking/graphql'),
        'useTimeTrackingUpdateWorkerPermissionsMutation',
      )
      .mockReturnValue([mutate, { loading: false }] as any);

    try {
      const { result } = renderHookWithApolloProvider(
        () => useManageUserPermissions(args),
        [],
      );

      await act(async () => {
        await result.current.saveUserPermissions(saveInput);
      });

      expect(mutate).toHaveBeenCalled();
    } finally {
      useMutationSpy.mockRestore();
    }
  });
});
