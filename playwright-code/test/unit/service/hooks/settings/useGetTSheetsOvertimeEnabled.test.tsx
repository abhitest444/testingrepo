// @ts-nocheck
import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { buildSandbox } from '@payroll/quicksand';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';
import {
  useGetTSheetsOvertimeEnabled,
  useOvertimeFeatureFlag,
} from 'src/js/service/hooks/settings/useGetTSheetsOvertimeEnabled';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { isIXPFeatureFlagEnabled } from 'src/js/service/utils/featureFlags';

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));

jest.mock('src/js/service/utils/featureFlags', () => ({
  isIXPFeatureFlagEnabled: jest.fn(),
}));

const mockGetApolloClientInstance =
  getApolloClientInstance as jest.MockedFunction<
    typeof getApolloClientInstance
  >;

const mockIsIXPFeatureFlagEnabled =
  isIXPFeatureFlagEnabled as jest.MockedFunction<
    typeof isIXPFeatureFlagEnabled
  >;

describe('useGetTSheetsOvertimeEnabled', () => {
  let sandbox: any;
  let mockApolloClient: any;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.clearAllMocks();

    mockApolloClient = {
      query: jest.fn(),
    };

    mockGetApolloClientInstance.mockReturnValue(mockApolloClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful query', () => {
    it('should fetch overtime enabled status and return true when enabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
              __typename: 'OvertimeSettings',
            },
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(true);
      expect(result.current.error).toBeUndefined();
      expect(mockApolloClient.query).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.any(Object),
          context: expect.objectContaining({
            clientName: ApolloClientNames.TSHEETS,
          }),
          fetchPolicy: 'cache-first',
        }),
      );
    });

    it('should return false when overtime is disabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
              __typename: 'OvertimeSettings',
            },
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle null overtimeSettings gracefully', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: null,
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle GraphQL errors returned in response', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
        errors: [{ message: 'GraphQL error' }],
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBe('GraphQL error');
    });

    it('should handle Apollo client not initialized error', async () => {
      mockGetApolloClientInstance.mockReturnValue(null);

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBe('Apollo client not initialized');
    });

    it('should handle query errors', async () => {
      const errorMessage = 'Network error';
      mockApolloClient.query.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle non-Error objects', async () => {
      mockApolloClient.query.mockRejectedValue('String error');

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);
      expect(result.current.error).toBe('Unknown error');
    });
  });

  describe('refetch functionality', () => {
    it('should allow refetching data', async () => {
      mockApolloClient.query
        .mockResolvedValueOnce({
          data: {
            timeTrackingSettings: {
              overtimeSettings: {
                addonEnabled: false,
                __typename: 'OvertimeSettings',
              },
              __typename: 'TimeTrackingSettings',
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            timeTrackingSettings: {
              overtimeSettings: {
                addonEnabled: true,
                __typename: 'OvertimeSettings',
              },
              __typename: 'TimeTrackingSettings',
            },
          },
        });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.overtimeEnabled).toBe(false);

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.overtimeEnabled).toBe(true);
      });

      expect(mockApolloClient.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading state', () => {
    it('should set loading to true initially and false after completion', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
              __typename: 'OvertimeSettings',
            },
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Apollo client configuration', () => {
    it('should use TSHEETS client name', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
              __typename: 'OvertimeSettings',
            },
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(mockApolloClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              clientName: ApolloClientNames.TSHEETS,
            }),
          }),
        );
      });
    });

    it('should use cache-first fetch policy', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
              __typename: 'OvertimeSettings',
            },
            __typename: 'TimeTrackingSettings',
          },
        },
      });

      renderHookWithQuicksandProvider(
        () => useGetTSheetsOvertimeEnabled(),
        sandbox,
      );

      await waitFor(() => {
        expect(mockApolloClient.query).toHaveBeenCalledWith(
          expect.objectContaining({
            fetchPolicy: 'cache-first',
          }),
        );
      });
    });
  });
});

describe('useOvertimeFeatureFlag', () => {
  let sandbox: any;
  let mockApolloClient: any;

  beforeEach(() => {
    sandbox = buildSandbox();
    jest.clearAllMocks();

    mockApolloClient = {
      query: jest.fn(),
    };

    mockGetApolloClientInstance.mockReturnValue(mockApolloClient);
    mockIsIXPFeatureFlagEnabled.mockResolvedValue(false);
  });

  describe('TSheets disabled scenarios', () => {
    it('should return disabled when TSheets overtime is disabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
            },
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();
    });

    it('should never call IXP when TSheets overtime is disabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
            },
          },
        },
      });

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Wait a bit longer to ensure IXP is never called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('TSheets enabled scenarios', () => {
    it('should return enabled when both TSheets and IXP are enabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    });

    it('should return disabled when TSheets is enabled but IXP is disabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(false);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    });

    it('should call IXP exactly once when TSheets is enabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledWith(
        sandbox,
        expect.any(String),
      );
    });
  });

  describe('hasCheckedIXP ref behavior', () => {
    it('should prevent duplicate IXP calls on re-renders', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result, rerender } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);

      // Force re-render
      rerender();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still only be called once
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    });

    it('should allow IXP to be called again if TSheets status changes', async () => {
      // Start with TSheets disabled
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result, unmount } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();

      unmount();

      // Now remount with TSheets enabled
      jest.clearAllMocks();
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });

      const { result: result2 } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      expect(result2.current.isEnabled).toBe(true);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    });
  });

  describe('IXP error handling', () => {
    it('should handle IXP errors gracefully and return disabled', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(new Error('IXP error'));

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error IXP rejections', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockRejectedValue('String error');

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should not throw when IXP fails', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockRejectedValue(new Error('IXP error'));

      expect(() => {
        renderHookWithQuicksandProvider(
          () => useOvertimeFeatureFlag(),
          sandbox,
        );
      }).not.toThrow();
    });
  });

  describe('loading states', () => {
    it('should start with isLoading true', () => {
      mockApolloClient.query.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    timeTrackingSettings: {
                      overtimeSettings: {
                        addonEnabled: true,
                      },
                    },
                  },
                }),
              100,
            ),
          ),
      );

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('should show loading during TSheets query', async () => {
      let resolveTSheets: any;
      const tsheetsPromise = new Promise((resolve) => {
        resolveTSheets = resolve;
      });

      mockApolloClient.query.mockReturnValue(tsheetsPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      expect(result.current.isLoading).toBe(true);

      resolveTSheets({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
            },
          },
        },
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should show loading during IXP query after TSheets completes', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });

      let resolveIXP: any;
      const ixpPromise = new Promise((resolve) => {
        resolveIXP = resolve;
      });
      mockIsIXPFeatureFlagEnabled.mockReturnValue(ixpPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      // Wait for TSheets to complete
      await waitFor(() => {
        expect(mockApolloClient.query).toHaveBeenCalled();
      });

      // Should still be loading while IXP is pending
      await waitFor(() => {
        expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalled();
      });

      expect(result.current.isLoading).toBe(true);

      resolveIXP(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should handle loading state transitions correctly', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isEnabled).toBe(false);

      // Wait for both queries to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
    });

    it('should maintain loading state through both TSheets and IXP checks', async () => {
      // Use slow resolving promises to track loading states
      let resolveTSheets: any;
      let resolveIXP: any;

      const tsheetsPromise = new Promise((resolve) => {
        resolveTSheets = resolve;
      });
      const ixpPromise = new Promise((resolve) => {
        resolveIXP = resolve;
      });

      mockApolloClient.query.mockReturnValue(tsheetsPromise);
      mockIsIXPFeatureFlagEnabled.mockReturnValue(ixpPromise);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Resolve TSheets with enabled
      resolveTSheets({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });

      // Wait for TSheets to complete
      await waitFor(() => {
        expect(mockApolloClient.query).toHaveBeenCalled();
      });

      // Should still be loading while IXP is in progress
      await waitFor(() => {
        expect(mockIsIXPFeatureFlagEnabled).toHaveBeenCalled();
      });

      // Loading should still be true
      expect(result.current.isLoading).toBe(true);

      // Now resolve IXP
      resolveIXP(true);

      // Wait for everything to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('combined TSheets and IXP states', () => {
    it('should return false when TSheets is true but IXP is false', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(false);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should return false when TSheets is false regardless of IXP', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: false,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(mockIsIXPFeatureFlagEnabled).not.toHaveBeenCalled();
    });

    it('should only return true when both TSheets and IXP are true', async () => {
      mockApolloClient.query.mockResolvedValue({
        data: {
          timeTrackingSettings: {
            overtimeSettings: {
              addonEnabled: true,
            },
          },
        },
      });
      mockIsIXPFeatureFlagEnabled.mockResolvedValue(true);

      const { result } = renderHookWithQuicksandProvider(
        () => useOvertimeFeatureFlag(),
        sandbox,
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isEnabled).toBe(true);
    });
  });
});
