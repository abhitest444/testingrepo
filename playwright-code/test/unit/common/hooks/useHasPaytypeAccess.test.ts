import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useHasPaytypeAccess } from 'src/js/common/hooks/useHasPaytypeAccess';
import { Sandbox } from 'src/js/common/sandbox';

describe('useHasPaytypeAccess', () => {
  const createMockSandbox = (
    isHrAdminResult: boolean | null = false,
    payrollManageAccessResult: boolean | null = false,
    shouldReject = false,
  ) => {
    const mockIsAuthorized = shouldReject
      ? jest.fn().mockRejectedValue(new Error('Authorization service error'))
      : jest.fn().mockImplementation((_resource, action) => {
          if (action.id === 'Intuit.sb.qb.hrAdmin') {
            return Promise.resolve({ isAuthorized: isHrAdminResult });
          }
          if (action.id === 'Intuit.sb.payroll.manage') {
            return Promise.resolve({ isAuthorized: payrollManageAccessResult });
          }
          return Promise.resolve({ isAuthorized: false });
        });

    return {
      authorization: {
        isAuthorized: mockIsAuthorized,
      },
      logger: {
        error: jest.fn(),
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      },
    } as unknown as Sandbox;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state with hasPaytypeAccess as false', () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      expect(result.current.hasPaytypeAccess).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not perform check when enabled is false', async () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result } = renderHook(() =>
        useHasPaytypeAccess(mockSandbox, { enabled: false }),
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(mockSandbox.authorization.isAuthorized).not.toHaveBeenCalled();
      expect(result.current.hasPaytypeAccess).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('authorization check', () => {
    it('should set hasPaytypeAccess to true when hrAdmin is authorized', async () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      expect(mockSandbox.authorization.isAuthorized).toHaveBeenCalledWith(
        { id: 'Intuit.iam.identity.accountv2' },
        { id: 'Intuit.sb.qb.hrAdmin' },
      );
      expect(mockSandbox.authorization.isAuthorized).toHaveBeenCalledWith(
        { id: 'Intuit.iam.identity.accountv2' },
        { id: 'Intuit.sb.payroll.manage' },
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set hasPaytypeAccess to true when manage is authorized', async () => {
      const mockSandbox = createMockSandbox(false, true);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set hasPaytypeAccess to true when both are authorized', async () => {
      const mockSandbox = createMockSandbox(true, true);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set hasPaytypeAccess to false when neither is authorized', async () => {
      const mockSandbox = createMockSandbox(false, false);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle null authorization result gracefully', async () => {
      const mockSandbox = createMockSandbox(null, null);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle authorization errors gracefully', async () => {
      const mockSandbox = createMockSandbox(true, false, true);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
      expect(mockSandbox.logger.error).toHaveBeenCalled();
    });

    it('should log error with appropriate message when authorization fails', async () => {
      const mockSandbox = createMockSandbox(true, false, true);

      renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(mockSandbox.logger.error).toHaveBeenCalledWith(
          'Plugin=time-tracking-ui Error=PAYTYPE_ACCESS_CHECK_FAILED',
          expect.objectContaining({
            error: expect.any(String),
          }),
        );
      });
    });
  });

  describe('race condition handling', () => {
    it('should only make authorization calls once even with multiple renders', async () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result, rerender } = renderHook(() =>
        useHasPaytypeAccess(mockSandbox),
      );

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      (mockSandbox.authorization.isAuthorized as jest.Mock).mockClear();

      rerender();

      expect(mockSandbox.authorization.isAuthorized).not.toHaveBeenCalled();
    });

    it('should not update state after unmount', async () => {
      const mockIsAuthorized = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ isAuthorized: true }), 100);
          }),
      );

      const mockSandbox = {
        authorization: { isAuthorized: mockIsAuthorized },
        logger: { error: jest.fn(), log: jest.fn() },
      } as unknown as Sandbox;

      const { result, unmount } = renderHook(() =>
        useHasPaytypeAccess(mockSandbox),
      );

      unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
    });
  });

  describe('enabled option', () => {
    it('should perform check when enabled changes from false to true', async () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result, rerender } = renderHook(
        ({ enabled }) => useHasPaytypeAccess(mockSandbox, { enabled }),
        { initialProps: { enabled: false } },
      );

      expect(mockSandbox.authorization.isAuthorized).not.toHaveBeenCalled();
      expect(result.current.hasPaytypeAccess).toBe(false);

      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      expect(mockSandbox.authorization.isAuthorized).toHaveBeenCalledTimes(2);
    });

    it('should use default enabled value of true', async () => {
      const mockSandbox = createMockSandbox(true, false);

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.hasPaytypeAccess).toBe(true);
      });

      expect(mockSandbox.authorization.isAuthorized).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading state', () => {
    it('should set isLoading to true during authorization check', async () => {
      const resolvePromises: Array<(value: { isAuthorized: boolean }) => void> =
        [];
      const mockIsAuthorized = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromises.push(resolve);
          }),
      );

      const mockSandbox = {
        authorization: { isAuthorized: mockIsAuthorized },
        logger: { error: jest.fn(), log: jest.fn() },
      } as unknown as Sandbox;

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolvePromises.forEach((resolve) => resolve({ isAuthorized: true }));
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('sandbox edge cases', () => {
    it('should handle undefined authorization result', async () => {
      const mockSandbox = {
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue(undefined),
        },
        logger: { error: jest.fn(), log: jest.fn() },
      } as unknown as Sandbox;

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
    });

    it('should handle missing isAuthorized property in result', async () => {
      const mockSandbox = {
        authorization: {
          isAuthorized: jest.fn().mockResolvedValue({}),
        },
        logger: { error: jest.fn(), log: jest.fn() },
      } as unknown as Sandbox;

      const { result } = renderHook(() => useHasPaytypeAccess(mockSandbox));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasPaytypeAccess).toBe(false);
    });
  });
});
