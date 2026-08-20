import { renderHook, act } from '@testing-library/react-hooks';
import { useTourStorage } from 'src/js/widgets/common/TourFramework/hooks/useTourStorage';
import { Sandbox } from 'src/js/common/sandbox';
import {
  getTourStorageKey,
  getTourSessionKey,
} from 'src/js/widgets/common/TourFramework/constants';
import * as webStorageUtil from 'src/js/widgets/common/TourFramework/utils/webStorageUtil';

jest.mock('src/js/widgets/common/TourFramework/constants', () => ({
  getTourStorageKey: jest.fn((tourId: string) => `tour_completed_${tourId}`),
  getTourSessionKey: jest.fn((tourId: string) => `tour_session_${tourId}`),
}));

jest.mock('src/js/widgets/common/TourFramework/utils/webStorageUtil');

describe('useTourStorage', () => {
  const TOUR_ID = 'test_tour';
  const STORAGE_KEY = 'tour_completed_test_tour';
  const SESSION_KEY = 'tour_session_test_tour';

  let mockGetItemAsync: jest.Mock;
  let mockSetItem: jest.Mock;
  let mockLogger: { info: jest.Mock; warn: jest.Mock; error: jest.Mock };
  let sandbox: Sandbox;

  beforeEach(() => {
    sessionStorage.clear();
    mockGetItemAsync = jest.fn();
    mockSetItem = jest.fn();
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

    sandbox = {
      logger: mockLogger,
    } as unknown as Sandbox;

    // Mock the webStorageUtil functions
    (webStorageUtil.getItemByPersonaIdAsync as jest.Mock) = mockGetItemAsync;
    (webStorageUtil.setItemByPersonaId as jest.Mock) = mockSetItem;

    jest.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should start with loading state without auto-checking storage', () => {
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isTourCompleted).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockGetItemAsync).not.toHaveBeenCalled();
    });

    it('should initialize from persistent storage successfully', async () => {
      mockGetItemAsync.mockResolvedValue(true);
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      expect(mockGetItemAsync).toHaveBeenCalledWith(sandbox, STORAGE_KEY);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isTourCompleted).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should fallback to session storage on persistent storage failure', async () => {
      const error = new Error('Persistent error');
      mockGetItemAsync.mockRejectedValue(error);
      sessionStorage.setItem(SESSION_KEY, 'true');

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `[TourStorage] Failed to read from persistent storage for tour: ${TOUR_ID}`,
        { error },
      );
      expect(result.current.isTourCompleted).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should return false when both storages fail', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('Persistent error'));
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Session error');
      });

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      expect(result.current.isTourCompleted).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it.each([undefined, null, false])(
      'should treat %p as not completed',
      async (value) => {
        mockGetItemAsync.mockResolvedValue(value);
        const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

        await act(async () => {
          await result.current.initializeTourStatus();
        });

        expect(result.current.isTourCompleted).toBe(false);
      },
    );

    it('should handle multiple initialization calls safely', async () => {
      mockGetItemAsync.mockResolvedValue(true);
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
        await result.current.initializeTourStatus();
      });

      expect(result.current.isTourCompleted).toBe(true);
      expect(mockGetItemAsync).toHaveBeenCalledTimes(2);
    });

    it('should return true when tour is completed', async () => {
      mockGetItemAsync.mockResolvedValue(true);
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      expect(result.current.isTourCompleted).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `[TourStorage] Read from persistent storage for tour: ${TOUR_ID}`,
        { result: true },
      );
    });

    it('should handle session storage returning non-"true" values', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('Persistent error'));
      sessionStorage.setItem(SESSION_KEY, 'false');

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      expect(result.current.isTourCompleted).toBe(false);
    });
  });

  describe('Mark Tour Completed', () => {
    it('should save to both persistent and session storage', async () => {
      mockGetItemAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      await act(async () => {
        await result.current.markTourCompleted();
      });

      expect(mockSetItem).toHaveBeenCalledWith(sandbox, STORAGE_KEY, true);
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('true');
      expect(result.current.isTourCompleted).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `[TourStorage] Tour marked as completed  : ${TOUR_ID}`,
      );
    });

    it('should fallback to session storage when persistent write fails', async () => {
      mockGetItemAsync.mockResolvedValue(false);
      mockSetItem.mockImplementation(() => {
        throw new Error('Write error');
      });

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      await act(async () => {
        await result.current.markTourCompleted();
      });

      expect(mockLogger.error).toHaveBeenCalled();
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('true');
      expect(result.current.isTourCompleted).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should throw when both storages fail', async () => {
      mockGetItemAsync.mockResolvedValue(false);
      mockSetItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Session error');
      });

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      await expect(
        act(async () => {
          await result.current.markTourCompleted();
        }),
      ).rejects.toThrow();

      expect(result.current.isTourCompleted).toBe(false);
    });

    it('should handle non-Error thrown objects', async () => {
      mockGetItemAsync.mockResolvedValue(false);
      mockSetItem.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error';
      });

      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      await act(async () => {
        await result.current.initializeTourStatus();
      });

      await act(async () => {
        await result.current.markTourCompleted();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
    });
  });

  describe('Complete User Flow', () => {
    it('should handle full tour lifecycle', async () => {
      mockGetItemAsync.mockResolvedValue(false);
      const { result } = renderHook(() => useTourStorage(sandbox, TOUR_ID));

      // Initial check - not completed
      await act(async () => {
        await result.current.initializeTourStatus();
      });
      expect(result.current.isTourCompleted).toBe(false);

      // Mark as completed
      await act(async () => {
        await result.current.markTourCompleted();
      });
      expect(result.current.isTourCompleted).toBe(true);
      expect(mockSetItem).toHaveBeenCalledWith(sandbox, STORAGE_KEY, true);
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('true');
    });

    it('should use correct storage keys', () => {
      renderHook(() => useTourStorage(sandbox, TOUR_ID));

      expect(getTourStorageKey).toHaveBeenCalledWith(TOUR_ID);
      expect(getTourSessionKey).toHaveBeenCalledWith(TOUR_ID);
    });
  });
});
