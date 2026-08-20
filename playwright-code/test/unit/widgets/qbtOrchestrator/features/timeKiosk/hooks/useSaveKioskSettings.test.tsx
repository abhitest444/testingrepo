import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, act } from '@testing-library/react-hooks';
import { useSetQLSettings } from 'src/js/service/hooks/settings/useSetQLSettings';
import timeKioskReducer from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/store';
import { useSaveKioskSettings } from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/hooks/useSaveKioskSettings';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any) => defaultMessage ?? id,
  }),
}));

jest.mock('src/js/service/hooks/settings/useSetQLSettings', () => ({
  useSetQLSettings: jest.fn(),
}));

const mockedUseSetQLSettings = useSetQLSettings as jest.Mock;

const setup = () => {
  const store = configureStore({ reducer: { timeKiosk: timeKioskReducer } });
  const wrapper: React.FC = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  const onSaveSuccess = jest.fn();
  const mockUpdate = jest.fn().mockResolvedValue(undefined);
  let onSuccess: (data: any) => void = () => {};
  let onError: (err: any) => void = () => {};

  mockedUseSetQLSettings.mockImplementation((args: any) => {
    onSuccess = args.onSuccess;
    onError = args.onError;
    return [mockUpdate, { loading: false }];
  });

  const { result } = renderHook(() => useSaveKioskSettings({ onSaveSuccess }), {
    wrapper,
  });

  return {
    store,
    result,
    onSaveSuccess,
    mockUpdate,
    getOnSuccess: () => onSuccess,
    getOnError: () => onError,
  };
};

describe('useSaveKioskSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears the error and calls the mutation with the current version', async () => {
    const { result, mockUpdate } = setup();

    await act(async () => {
      await result.current.saveInactivityTimeout(30);
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      kioskSettings: {
        inactivityTimeout: { value: 30, version: '0' },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it('commits returned value/version and fires onSaveSuccess on success', () => {
    const { store, onSaveSuccess, getOnSuccess } = setup();

    act(() => {
      getOnSuccess()({
        kioskSettings: {
          inactivityTimeout: { value: 45, meta: { version: '2' } },
        },
      });
    });

    const { settings } = store.getState().timeKiosk;
    expect(settings.inactivityTimeoutSeconds).toBe(45);
    expect(settings.inactivityTimeoutVersion).toBe('2');
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not commit a value when the mutation returns none, but still calls onSaveSuccess', () => {
    const { store, onSaveSuccess, getOnSuccess } = setup();

    act(() => {
      getOnSuccess()({ kioskSettings: { inactivityTimeout: { value: null } } });
    });

    // Unchanged from the default seed.
    expect(store.getState().timeKiosk.settings.inactivityTimeoutSeconds).toBe(
      20,
    );
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('stores the error and stops saving on failure', () => {
    const { result, onSaveSuccess, getOnError } = setup();

    act(() => {
      getOnError()('Something failed');
    });

    expect(result.current.error).toBe('Something failed');
    expect(onSaveSuccess).not.toHaveBeenCalled();
  });

  it('falls back to the generic error message when none is provided', () => {
    const { result, getOnError } = setup();

    act(() => {
      getOnError()(undefined);
    });

    expect(result.current.error).toBe('catch.all.error.content');
  });

  it('clearError resets a stored save error', () => {
    const { result, getOnError } = setup();

    act(() => {
      getOnError()('Something failed');
    });
    expect(result.current.error).toBe('Something failed');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
