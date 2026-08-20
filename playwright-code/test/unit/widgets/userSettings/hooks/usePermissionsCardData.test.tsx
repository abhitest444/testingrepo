// @ts-nocheck
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import {
  usePermissionsCardData,
  SettingsForInput,
} from 'src/js/widgets/userSettings/hooks/usePermissionsCardData';
import permissionsReducer, {
  setPermissions,
  setPermissionsError,
  setPermissionsLoading,
} from 'src/js/widgets/userSettings/store/slices/permissionsSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { PERMISSIONS_ROLE_VALUE } from 'src/js/widgets/userSettings/components/cards/PermissionsCard/constants';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  }),
}));

const mockLoadUserPermissions = jest.fn();
let mockOnSuccess: ((data: { permissions: unknown }) => void) | undefined;
let mockOnError: ((error: string) => void) | undefined;
let mockLoading = false;

jest.mock(
  'src/js/widgets/userSettings/service/permissions/useGetUserPermissions',
  () => ({
    useGetUserPermissions: ({ onSuccess, onError } = {}) => {
      mockOnSuccess = onSuccess;
      mockOnError = onError;
      return {
        loading: mockLoading,
        loadUserPermissions: mockLoadUserPermissions,
      };
    },
  }),
);

describe('usePermissionsCardData', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = () =>
    configureStore({ reducer: { permissions: permissionsReducer } });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const settingsFor: SettingsForInput = {
    id: 'worker-1',
    timeForType: TimeTracking_TimeForType.Employee,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = undefined;
    mockOnError = undefined;
    mockLoading = false;
    store = createStore();
  });

  it('skips fetch when settingsFor is incomplete', () => {
    renderHook(() => usePermissionsCardData(undefined), { wrapper });
    renderHook(
      () =>
        usePermissionsCardData({ timeForType: settingsFor.timeForType } as any),
      { wrapper },
    );
    renderHook(() => usePermissionsCardData({ id: settingsFor.id } as any), {
      wrapper,
    });

    expect(mockLoadUserPermissions).not.toHaveBeenCalled();
  });

  it('dispatches loading and fetches when settingsFor is valid', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    renderHook(() => usePermissionsCardData(settingsFor), { wrapper });

    expect(dispatchSpy).toHaveBeenCalledWith(setPermissionsLoading(true));
    expect(mockLoadUserPermissions).toHaveBeenCalledWith({ settingsFor });
  });

  it('dispatches setPermissions on success and setPermissionsError on failure', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const permissions = { role: PERMISSIONS_ROLE_VALUE.WORKER };

    renderHook(() => usePermissionsCardData(settingsFor), { wrapper });

    mockOnSuccess?.({ permissions });
    expect(dispatchSpy).toHaveBeenCalledWith(setPermissions(permissions));

    mockOnError?.('load failed');
    expect(dispatchSpy).toHaveBeenCalledWith(
      setPermissionsError('load failed'),
    );
  });

  it('refetches when worker id or type changes', () => {
    const { rerender } = renderHook(
      ({ input }) => usePermissionsCardData(input),
      {
        wrapper,
        initialProps: { input: settingsFor },
      },
    );

    expect(mockLoadUserPermissions).toHaveBeenCalledTimes(1);

    rerender({
      input: {
        id: 'worker-2',
        timeForType: TimeTracking_TimeForType.Employee,
      },
    });
    expect(mockLoadUserPermissions).toHaveBeenCalledTimes(2);

    rerender({
      input: {
        id: 'worker-2',
        timeForType: TimeTracking_TimeForType.Vendor,
      },
    });
    expect(mockLoadUserPermissions).toHaveBeenCalledTimes(3);
  });

  it('returns loading from useGetUserPermissions', () => {
    mockLoading = true;
    const { result } = renderHook(() => usePermissionsCardData(settingsFor), {
      wrapper,
    });
    expect(result.current.loading).toBe(true);
  });
});
