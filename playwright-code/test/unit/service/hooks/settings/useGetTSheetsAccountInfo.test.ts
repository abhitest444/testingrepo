import { renderHook, act } from '@testing-library/react-hooks';
import {
  useGetTSheetsAccountInfo,
  useGetTSheetsAccountInfoLazy,
} from 'src/js/service/hooks/settings/useGetTSheetsAccountInfo';
import {
  getTSheetsAccountInfo,
  TSheetsAccountInfo,
} from 'src/js/service/rest/TSheetsApiClient';

// Mock the dependencies
jest.mock('src/js/service/rest/TSheetsApiClient');
jest.mock('src/js/service/utils/mapError');
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
  useIntl: jest.fn(),
}));

const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
};

describe('useGetTSheetsAccountInfo', () => {
  const mockGetTSheetsAccountInfo =
    getTSheetsAccountInfo as jest.MockedFunction<typeof getTSheetsAccountInfo>;

  const mockFreedataAccount: TSheetsAccountInfo = {
    hasTSheetsAccount: true,
    isFreedata: true,
    isOII: true,
    accountType: 'freedata',
    accountCreationDate: '2024-01-01',
  };

  const mockRegularAccount: TSheetsAccountInfo = {
    hasTSheetsAccount: true,
    isFreedata: false,
    isOII: false,
    accountType: 'regular',
    accountCreationDate: '2023-01-01',
  };

  beforeEach(() => {
    const { useSandbox, useIntl } = require('@payroll/quicksand');
    useSandbox.mockReturnValue(mockSandbox);
    useIntl.mockReturnValue({
      formatMessage: jest.fn((msg) => msg.defaultMessage || ''),
    });

    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockImplementation(({ error }: { error: string }) => error);

    jest.clearAllMocks();
  });

  describe('useGetTSheetsAccountInfo - auto-fetch', () => {
    it('should return loading state initially', () => {
      mockGetTSheetsAccountInfo.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useGetTSheetsAccountInfo());

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual({
        hasTSheetsAccount: false,
        isFreedata: false,
        isOII: false,
        accountType: '',
        accountCreationDate: null,
      });
    });

    it('should fetch account info on mount and return freedata account', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockFreedataAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      expect(result.current.loading).toBe(true);

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual(mockFreedataAccount);
      expect(mockGetTSheetsAccountInfo).toHaveBeenCalledWith(mockSandbox);
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useGetTSheetsAccountInfo Event=Fetching account info',
      );
    });

    it('should fetch account info on mount and return regular account', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockRegularAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockRegularAccount);
      expect(result.current.data.isFreedata).toBe(false);
    });

    it('should handle error when API call fails', async () => {
      const mockError = new Error('API Error');
      mockGetTSheetsAccountInfo.mockRejectedValue(mockError);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('API Error');
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=useGetTSheetsAccountInfo Event=Failed to fetch account info',
        expect.objectContaining({
          error: 'API Error',
        }),
      );
    });

    it('should log success when account info is fetched', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockFreedataAccount);

      const { waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=useGetTSheetsAccountInfo Event=Account info fetched successfully',
        expect.objectContaining({
          hasTSheetsAccount: true,
          isFreedata: true,
          accountType: 'freedata',
        }),
      );
    });

    it('should provide refetch function that re-fetches data', async () => {
      mockGetTSheetsAccountInfo
        .mockResolvedValueOnce(mockFreedataAccount)
        .mockResolvedValueOnce(mockRegularAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();
      expect(result.current.data.isFreedata).toBe(true);

      // Refetch
      act(() => {
        result.current.refetch();
      });

      await waitForNextUpdate();
      expect(result.current.data.isFreedata).toBe(false);
      expect(mockGetTSheetsAccountInfo).toHaveBeenCalledTimes(2);
    });

    it('should clear error on successful refetch', async () => {
      mockGetTSheetsAccountInfo
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockFreedataAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();
      expect(result.current.error).toBe('First error');

      // Refetch
      act(() => {
        result.current.refetch();
      });

      await waitForNextUpdate();
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual(mockFreedataAccount);
    });

    it('should handle account with no TSheets connection', async () => {
      const noAccountData: TSheetsAccountInfo = {
        hasTSheetsAccount: false,
        isFreedata: false,
        isOII: false,
        accountType: '',
        accountCreationDate: null,
      };

      mockGetTSheetsAccountInfo.mockResolvedValue(noAccountData);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(result.current.data.hasTSheetsAccount).toBe(false);
      expect(result.current.data.isFreedata).toBe(false);
    });

    it('should skip fetch when skip option is true', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockFreedataAccount);

      const { result } = renderHook(() =>
        useGetTSheetsAccountInfo({ skip: true }),
      );

      // Wait a bit to ensure no async operations are triggered
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual({
        hasTSheetsAccount: false,
        isFreedata: false,
        isOII: false,
        accountType: '',
        accountCreationDate: null,
      });
      expect(mockGetTSheetsAccountInfo).not.toHaveBeenCalled();
    });

    it('should fetch when skip option is false', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockFreedataAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo({ skip: false }),
      );

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockFreedataAccount);
      expect(mockGetTSheetsAccountInfo).toHaveBeenCalledWith(mockSandbox);
    });
  });

  describe('useGetTSheetsAccountInfoLazy - manual fetch', () => {
    it('should not fetch automatically on mount', () => {
      const { result } = renderHook(() => useGetTSheetsAccountInfoLazy());

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({
        hasTSheetsAccount: false,
        isFreedata: false,
        isOII: false,
        accountType: '',
        accountCreationDate: null,
      });
      expect(mockGetTSheetsAccountInfo).not.toHaveBeenCalled();
    });

    it('should fetch when query function is called', async () => {
      mockGetTSheetsAccountInfo.mockResolvedValue(mockFreedataAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfoLazy(),
      );

      expect(mockGetTSheetsAccountInfo).not.toHaveBeenCalled();

      let queryResult: TSheetsAccountInfo | undefined;
      act(() => {
        result.current.query().then((data) => {
          queryResult = data;
        });
      });

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockFreedataAccount);
      expect(queryResult).toEqual(mockFreedataAccount);
      expect(mockGetTSheetsAccountInfo).toHaveBeenCalledWith(mockSandbox);
    });

    it('should set loading to true while fetching', async () => {
      let resolvePromise: (value: TSheetsAccountInfo) => void;
      const promise = new Promise<TSheetsAccountInfo>((resolve) => {
        resolvePromise = resolve;
      });
      mockGetTSheetsAccountInfo.mockReturnValue(promise);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfoLazy(),
      );

      act(() => {
        result.current.query();
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        resolvePromise!(mockFreedataAccount);
      });

      await waitForNextUpdate();
      expect(result.current.loading).toBe(false);
    });

    it('should handle error when query fails', async () => {
      const mockError = new Error('Query failed');
      mockGetTSheetsAccountInfo.mockRejectedValue(mockError);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfoLazy(),
      );

      let queryError: Error | undefined;
      act(() => {
        result.current.query().catch((err) => {
          queryError = err;
        });
      });

      await waitForNextUpdate();

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Query failed');
      expect(queryError).toEqual(mockError);
    });

    it('should allow multiple calls to query', async () => {
      mockGetTSheetsAccountInfo
        .mockResolvedValueOnce(mockFreedataAccount)
        .mockResolvedValueOnce(mockRegularAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfoLazy(),
      );

      // First call
      act(() => {
        result.current.query();
      });

      await waitForNextUpdate();
      expect(result.current.data.isFreedata).toBe(true);

      // Second call
      act(() => {
        result.current.query();
      });

      await waitForNextUpdate();
      expect(result.current.data.isFreedata).toBe(false);
      expect(mockGetTSheetsAccountInfo).toHaveBeenCalledTimes(2);
    });

    it('should clear error on subsequent successful query', async () => {
      mockGetTSheetsAccountInfo
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockFreedataAccount);

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfoLazy(),
      );

      // First call - fails
      act(() => {
        result.current.query().catch(() => {});
      });

      await waitForNextUpdate();
      expect(result.current.error).toBe('First error');

      // Second call - succeeds
      act(() => {
        result.current.query();
      });

      await waitForNextUpdate();
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toEqual(mockFreedataAccount);
    });
  });

  describe('Error handling', () => {
    it('should call mapError when error occurs', async () => {
      const mockError = new Error('Test error');
      mockGetTSheetsAccountInfo.mockRejectedValue(mockError);

      const { mapError } = require('src/js/service/utils/mapError');
      mapError.mockReturnValue('Mapped error message');

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(mapError).toHaveBeenCalledWith({
        sourceComponent: 'useGetTSheetsAccountInfo',
        sandbox: mockSandbox,
        intl: expect.any(Object),
        error: 'Test error',
      });
      expect(result.current.error).toBe('Mapped error message');
    });

    it('should handle string errors', async () => {
      mockGetTSheetsAccountInfo.mockRejectedValue('String error');

      const { result, waitForNextUpdate } = renderHook(() =>
        useGetTSheetsAccountInfo(),
      );

      await waitForNextUpdate();

      expect(result.current.error).toBe('String error');
    });
  });
});
