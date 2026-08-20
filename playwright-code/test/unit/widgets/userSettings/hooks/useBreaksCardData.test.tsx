// @ts-nocheck
/**
 * Tests for useBreaksCardData hook
 *
 * Tests the card-specific hook that orchestrates data fetching
 * and Redux synchronization for the BreaksCard component.
 */

import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useBreaksCardData } from 'src/js/widgets/userSettings/hooks/useBreaksCardData';
import breaksReducer, {
  setBreaks,
  setBreaksLoading,
  setBreaksError,
} from 'src/js/widgets/userSettings/store/slices/breaksSlice';

// Mock the useGetWorkerBreaks hook
const mockLoadWorkerBreaks = jest.fn();
let mockOnSuccess: ((breaks: any[]) => void) | undefined;
let mockOnError: ((error: string) => void) | undefined;

jest.mock('src/js/service/hooks/breaks', () => ({
  useGetWorkerBreaks: ({ onSuccess, onError } = {}) => {
    // Store callbacks so tests can trigger them
    mockOnSuccess = onSuccess;
    mockOnError = onError;
    return {
      breaks: [],
      loading: false,
      error: undefined,
      loadWorkerBreaks: mockLoadWorkerBreaks,
    };
  },
}));

// Mock useSandbox
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSandbox = {
  logger: mockLogger,
};

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => mockSandbox),
}));

describe('useBreaksCardData', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = () =>
    configureStore({
      reducer: {
        breaks: breaksReducer,
      },
    });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = undefined;
    mockOnError = undefined;
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    store = createStore();
  });

  describe('Initial Behavior', () => {
    it('should not call loadWorkerBreaks when assigneeId is undefined', () => {
      renderHook(() => useBreaksCardData(undefined), { wrapper });

      expect(mockLoadWorkerBreaks).not.toHaveBeenCalled();
    });

    it('should call loadWorkerBreaks when assigneeId is provided', () => {
      const assigneeId = 'test-assignee-123';

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      expect(mockLoadWorkerBreaks).toHaveBeenCalledTimes(1);
      // New API: callbacks are passed at hook init, not in loadWorkerBreaks
      expect(mockLoadWorkerBreaks).toHaveBeenCalledWith({
        assigneeId,
        isActive: true,
      });
    });

    it('should dispatch setBreaksLoading(true) when fetching', () => {
      const assigneeId = 'test-assignee-123';
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      expect(dispatchSpy).toHaveBeenCalledWith(setBreaksLoading(true));
    });

    it('should log when fetching breaks data', () => {
      const assigneeId = 'test-assignee-123';

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Hook=useBreaksCardData Event=Fetching breaks data for workerId=${assigneeId}`,
      );
    });
  });

  describe('onSuccess Callback', () => {
    it('should dispatch setBreaks when onSuccess is called', () => {
      const assigneeId = 'test-assignee-123';
      const mockBreaks = [
        { id: '1', breakName: 'Lunch', breakType: 'PAID' },
        { id: '2', breakName: 'Coffee', breakType: 'UNPAID' },
      ];

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnSuccess?.(mockBreaks);

      expect(dispatchSpy).toHaveBeenCalledWith(setBreaks(mockBreaks));
    });

    it('should log success when breaks data is fetched', () => {
      const assigneeId = 'test-assignee-123';
      const mockBreaks = [
        { id: '1', breakName: 'Lunch', breakType: 'PAID' },
        { id: '2', breakName: 'Coffee', breakType: 'UNPAID' },
      ];

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnSuccess?.(mockBreaks);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Hook=useBreaksCardData Event=Successfully fetched breaks data for workerId=${assigneeId}`,
      );
    });
  });

  describe('onError Callback', () => {
    it('should dispatch setBreaksError when onError is called', () => {
      const assigneeId = 'test-assignee-123';
      const errorMessage = 'Failed to fetch breaks';

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnError?.(errorMessage);

      expect(dispatchSpy).toHaveBeenCalledWith(setBreaksError(errorMessage));
    });

    it('should log error when breaks data fetch fails', () => {
      const assigneeId = 'test-assignee-123';
      const errorMessage = 'Failed to fetch breaks';

      renderHook(() => useBreaksCardData(assigneeId), { wrapper });

      // Trigger the callback that was passed at hook initialization
      mockOnError?.(errorMessage);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Hook=useBreaksCardData Event=Failed to fetch breaks data for workerId=${assigneeId}`,
        { error: errorMessage },
      );
    });
  });

  describe('Dependency Changes', () => {
    it('should refetch when assigneeId changes', () => {
      const { rerender } = renderHook(
        ({ assigneeId }) => useBreaksCardData(assigneeId),
        {
          wrapper,
          initialProps: { assigneeId: 'assignee-1' },
        },
      );

      expect(mockLoadWorkerBreaks).toHaveBeenCalledTimes(1);

      rerender({ assigneeId: 'assignee-2' });

      expect(mockLoadWorkerBreaks).toHaveBeenCalledTimes(2);
      expect(mockLoadWorkerBreaks).toHaveBeenLastCalledWith(
        expect.objectContaining({ assigneeId: 'assignee-2' }),
      );
    });

    it('should not refetch when assigneeId is the same', () => {
      const { rerender } = renderHook(
        ({ assigneeId }) => useBreaksCardData(assigneeId),
        {
          wrapper,
          initialProps: { assigneeId: 'assignee-1' },
        },
      );

      expect(mockLoadWorkerBreaks).toHaveBeenCalledTimes(1);

      rerender({ assigneeId: 'assignee-1' });

      // Should still be 1 since assigneeId didn't change
      expect(mockLoadWorkerBreaks).toHaveBeenCalledTimes(1);
    });
  });

  describe('Return Value', () => {
    it('should return loading state', () => {
      const assigneeId = 'test-assignee-123';

      const { result } = renderHook(() => useBreaksCardData(assigneeId), {
        wrapper,
      });

      expect(result.current).toHaveProperty('loading');
      expect(typeof result.current.loading).toBe('boolean');
    });
  });
});
