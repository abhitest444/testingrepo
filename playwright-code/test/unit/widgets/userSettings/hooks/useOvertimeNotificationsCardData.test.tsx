// @ts-nocheck
/**
 * Tests for useOvertimeNotificationsCardData — GET overtime rules + Redux sync.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { useOvertimeNotificationsCardData } from 'src/js/widgets/userSettings/hooks/useOvertimeNotificationsCardData';
import overtimeNotificationsReducer, {
  resetOvertimeNotificationsState,
  setOvertimeNotificationsLoading,
} from 'src/js/widgets/userSettings/store/slices/overtimeNotificationsSlice';

const mockLoadUserOvertimeNotifications = jest.fn();

jest.mock(
  'src/js/service/hooks/userLevelSettings/useGetUserOvertimeNotifications',
  () => ({
    useGetUserOvertimeNotifications: ({ onSuccess, onError }) => ({
      loading: false,
      error: undefined,
      loadUserOvertimeNotifications:
        mockLoadUserOvertimeNotifications.mockImplementation((vars, opts) => {
          onSuccess?.({
            timeTrackingUnifiedUserSettings: {
              overtimeNotifications: { rules: [] },
            },
          });
        }),
    }),
  }),
);

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  useLoggingConfig: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('useOvertimeNotificationsCardData', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = () =>
    configureStore({
      reducer: { overtimeNotifications: overtimeNotificationsReducer },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    store = createStore();
  });

  it('dispatches reset(undefined) when settingsFor is missing', async () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderHook(() => useOvertimeNotificationsCardData(undefined), { wrapper });

    await act(async () => {});

    expect(dispatchSpy).toHaveBeenCalledWith(
      resetOvertimeNotificationsState(undefined),
    );
    expect(mockLoadUserOvertimeNotifications).not.toHaveBeenCalled();
  });

  it('dispatches loading and calls lazy load when settingsFor is set', async () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderHook(
      () =>
        useOvertimeNotificationsCardData({
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        }),
      { wrapper },
    );

    await act(async () => {});

    expect(dispatchSpy).toHaveBeenCalledWith(
      setOvertimeNotificationsLoading(true),
    );
    expect(mockLoadUserOvertimeNotifications).toHaveBeenCalledWith(
      {
        settingsFor: {
          id: 'worker-1',
          timeForType: TimeTracking_TimeForType.Employee,
        },
      },
      { fetchPolicy: 'no-cache' },
    );
  });

  it('does not throw when load ref updates between renders', async () => {
    const { rerender } = renderHook(
      ({ sf }) => useOvertimeNotificationsCardData(sf),
      {
        wrapper,
        initialProps: {
          sf: {
            id: 'a',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        },
      },
    );

    await act(async () => {});

    rerender({
      sf: {
        id: 'b',
        timeForType: TimeTracking_TimeForType.Employee,
      },
    });

    await act(async () => {});

    expect(mockLoadUserOvertimeNotifications).toHaveBeenCalled();
  });
});
