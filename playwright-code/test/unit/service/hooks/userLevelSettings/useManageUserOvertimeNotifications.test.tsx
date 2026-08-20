// @ts-nocheck
/**
 * Tests for useManageUserOvertimeNotifications — save mutation + boolean result.
 */

import { act } from '@testing-library/react-hooks';
import {
  aTimeTracking_ManageUnifiedUserSettingsInput,
  aTimeTracking_ManageUnifiedUserSettingsPayload,
  aTimeTracking_ManageUnifiedUserSettingsError,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { ManageUserOvertimeNotificationsDocument } from 'src/js/service/queries/userSettingsQueries';
import { useManageUserOvertimeNotifications } from 'src/js/service/hooks/userLevelSettings/useManageUserOvertimeNotifications';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

jest.mock('src/js/service/errors/timeTrackingErrors', () => ({
  ...jest.requireActual('src/js/service/errors/timeTrackingErrors'),
  isExpectedError: jest.fn(() => false),
  mapTimeTrackingMutationError: jest.fn(),
}));

describe('useManageUserOvertimeNotifications', () => {
  const mockInput = aTimeTracking_ManageUnifiedUserSettingsInput();

  beforeEach(() => {
    jest.clearAllMocks();
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue('mapped-error');
  });

  it('saveUserOvertimeNotifications returns true on payload success', async () => {
    const payload = aTimeTracking_ManageUnifiedUserSettingsPayload();
    const mocks = [
      {
        request: {
          query: ManageUserOvertimeNotificationsDocument,
          variables: { input: mockInput },
        },
        result: {
          data: {
            timeTrackingManageUnifiedUserSettings: payload,
          },
        },
      },
    ];

    const { result } = renderHookWithApolloProvider(
      () =>
        useManageUserOvertimeNotifications({
          onSuccess: jest.fn(),
          onError: jest.fn(),
          interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
        }),
      mocks,
    );

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveUserOvertimeNotifications(mockInput);
    });

    expect(ok!).toBe(true);
  });

  it('saveUserOvertimeNotifications returns false on error payload', async () => {
    const errPayload = aTimeTracking_ManageUnifiedUserSettingsError({
      errorCode: 'ERROR_SAVING_USER_SETTINGS',
    });
    const mocks = [
      {
        request: {
          query: ManageUserOvertimeNotificationsDocument,
          variables: { input: mockInput },
        },
        result: {
          data: {
            timeTrackingManageUnifiedUserSettings: errPayload,
          },
        },
      },
    ];

    const onError = jest.fn();
    const { result } = renderHookWithApolloProvider(
      () =>
        useManageUserOvertimeNotifications({
          onSuccess: jest.fn(),
          onError,
          interaction: TimeCustomerInteraction.USER_NOTIFICATION_SETTINGS_SAVE,
        }),
      mocks,
    );

    let ok: boolean;
    await act(async () => {
      ok = await result.current.saveUserOvertimeNotifications(mockInput);
    });

    expect(ok!).toBe(false);
    expect(onError).toHaveBeenCalled();
  });
});
