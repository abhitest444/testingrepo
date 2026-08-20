// @ts-nocheck
/**
 * Tests for useNotificationsCardData hook
 *
 * Tests the card-specific hook that orchestrates data fetching
 * and Redux synchronization for the NotificationsCard component.
 */

import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useNotificationsCardData } from 'src/js/widgets/userSettings/hooks/useNotificationsCardData';
import notificationsReducer, {
  resetState,
  setNotificationsLoading,
  setNotificationsError,
} from 'src/js/widgets/userSettings/store/slices/notificationsSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }),
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
}));

// Mock the useGetEffectiveUserSettings hook
const mockLoadEffectiveUserSettings = jest.fn();
let mockOnSuccess: ((data: any) => void) | undefined;
let mockOnError: ((error: string) => void) | undefined;

jest.mock(
  'src/js/service/hooks/userLevelSettings/useGetEffectiveUserSettings',
  () => ({
    useGetEffectiveUserSettings: ({ onSuccess, onError } = {}) => {
      // Store callbacks so tests can trigger them
      mockOnSuccess = onSuccess;
      mockOnError = onError;
      return {
        data: undefined,
        loading: false,
        error: undefined,
        loadEffectiveUserSettings: mockLoadEffectiveUserSettings,
      };
    },
  }),
);

describe('useNotificationsCardData', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = () =>
    configureStore({
      reducer: {
        notifications: notificationsReducer,
      },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const mockSettingsFor = {
    id: 'test-user-123',
    timeForType: TimeTracking_TimeForType.Employee,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = undefined;
    mockOnError = undefined;
    store = createStore();
  });

  describe('Initial Behavior', () => {
    it('should not call loadEffectiveUserSettings when settingsFor is undefined', () => {
      renderHook(() => useNotificationsCardData(undefined), { wrapper });

      expect(mockLoadEffectiveUserSettings).not.toHaveBeenCalled();
    });

    it('should not call loadEffectiveUserSettings when settingsFor.id is missing', () => {
      const invalidSettingsFor = {
        id: undefined,
        timeForType: TimeTracking_TimeForType.Employee,
      };

      renderHook(() => useNotificationsCardData(invalidSettingsFor as any), {
        wrapper,
      });

      expect(mockLoadEffectiveUserSettings).not.toHaveBeenCalled();
    });

    it('should not call loadEffectiveUserSettings when settingsFor.timeForType is missing', () => {
      const invalidSettingsFor = {
        id: 'test-user-123',
        timeForType: undefined,
      };

      renderHook(() => useNotificationsCardData(invalidSettingsFor as any), {
        wrapper,
      });

      expect(mockLoadEffectiveUserSettings).not.toHaveBeenCalled();
    });

    it('should call loadEffectiveUserSettings when settingsFor is valid', () => {
      renderHook(() => useNotificationsCardData(mockSettingsFor), { wrapper });

      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledTimes(1);
      // New API: callbacks are passed at hook init, input is passed directly
      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledWith({
        settingsFor: {
          id: mockSettingsFor.id,
          timeForType: mockSettingsFor.timeForType,
        },
      });
    });

    it('should dispatch setNotificationsLoading(true) when fetching', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useNotificationsCardData(mockSettingsFor), { wrapper });

      expect(dispatchSpy).toHaveBeenCalledWith(setNotificationsLoading(true));
    });
  });

  describe('onSuccess Callback', () => {
    it('should dispatch resetState when onSuccess is called', () => {
      const mockData = {
        timeTrackingEffectiveUserSettings: {
          clockInSetting: {
            reminderTime: { value: { value: '08:00:00' } },
          },
        },
      };

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useNotificationsCardData(mockSettingsFor), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnSuccess?.(mockData);

      expect(dispatchSpy).toHaveBeenCalledWith(resetState(mockData));
    });
  });

  describe('onError Callback', () => {
    it('should dispatch setNotificationsError when onError is called', () => {
      const errorMessage = 'Failed to fetch settings';

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useNotificationsCardData(mockSettingsFor), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnError?.(errorMessage);

      expect(dispatchSpy).toHaveBeenCalledWith(
        setNotificationsError(errorMessage),
      );
    });
  });

  describe('Dependency Changes', () => {
    it('should refetch when settingsFor.id changes', () => {
      const { rerender } = renderHook(
        ({ settingsFor }) => useNotificationsCardData(settingsFor),
        {
          wrapper,
          initialProps: { settingsFor: mockSettingsFor },
        },
      );

      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledTimes(1);

      rerender({
        settingsFor: {
          ...mockSettingsFor,
          id: 'different-user-456',
        },
      });

      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledTimes(2);
    });

    it('should refetch when settingsFor.timeForType changes', () => {
      const { rerender } = renderHook(
        ({ settingsFor }) => useNotificationsCardData(settingsFor),
        {
          wrapper,
          initialProps: { settingsFor: mockSettingsFor },
        },
      );

      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledTimes(1);

      rerender({
        settingsFor: {
          ...mockSettingsFor,
          timeForType: TimeTracking_TimeForType.Vendor,
        },
      });

      expect(mockLoadEffectiveUserSettings).toHaveBeenCalledTimes(2);
    });
  });

  describe('Return Value', () => {
    it('should return loading state', () => {
      const { result } = renderHook(
        () => useNotificationsCardData(mockSettingsFor),
        { wrapper },
      );

      expect(result.current).toHaveProperty('loading');
      expect(typeof result.current.loading).toBe('boolean');
    });
  });
});
