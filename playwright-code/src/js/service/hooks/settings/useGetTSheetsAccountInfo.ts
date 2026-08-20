import { useCallback, useEffect, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { mapError } from 'src/js/service/utils/mapError';
import {
  getTSheetsAccountInfo,
  TSheetsAccountInfo,
} from 'src/js/service/rest/TSheetsApiClient';

/**
 * Result interface for useGetTSheetsAccountInfo hook
 */
export interface UseGetTSheetsAccountInfoResult {
  /**
   * Whether the API call is in progress
   */
  loading: boolean;

  /**
   * Error message if the API call failed
   */
  error?: string;

  /**
   * TSheets account information
   */
  data: TSheetsAccountInfo;

  /**
   * Function to manually refetch the account information
   */
  refetch: () => Promise<void>;
}

/**
 * Default/initial state for account info
 */
const DEFAULT_ACCOUNT_INFO: TSheetsAccountInfo = {
  hasTSheetsAccount: false,
  isFreedata: false,
  isOII: false,
  accountType: '',
  accountCreationDate: null,
};

/**
 * Custom hook to fetch TSheets account information
 *
 * This hook fetches information about the current TSheets account including:
 * - Whether a TSheets account exists
 * - Account type (freedata, regular, etc.)
 * - Whether it's an OII (Intuit Integration) account
 * - Account creation date
 *
 * @param options - Optional configuration
 * @param options.skip - If true, skips the automatic fetch on mount (default: false)
 * @returns Object containing account data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { data, loading, error, refetch } = useGetTSheetsAccountInfo();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   if (data.isFreedata) {
 *     return <FreedataFeatures />;
 *   }
 *
 *   return <StandardFeatures />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Skip automatic fetch for OTX STE users where the data isn't needed
 * const { data } = useGetTSheetsAccountInfo({ skip: isOTX && isSingleTimeEntry });
 * ```
 */
export const useGetTSheetsAccountInfo = (options?: {
  skip?: boolean;
}): UseGetTSheetsAccountInfoResult => {
  const { skip = false } = options || {};
  const sandbox = useSandbox();
  const intl = useIntl();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TSheetsAccountInfo>(DEFAULT_ACCOUNT_INFO);

  const handleSuccess = useCallback((result: TSheetsAccountInfo) => {
    setData(result);
    setError(undefined);
  }, []);

  const handleError = useCallback(
    (err: Error | string) => {
      const errorMessage = err instanceof Error ? err.message : err;
      const mappedError = mapError({
        sourceComponent: 'useGetTSheetsAccountInfo',
        sandbox,
        intl,
        error: errorMessage,
      });
      if (mappedError) {
        setError(mappedError);
      }
    },
    [intl, sandbox],
  );

  const fetchAccountInfo = useCallback(async () => {
    // Skip fetch if skip option is enabled
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      sandbox.logger.info(
        'Component=useGetTSheetsAccountInfo Event=Fetching account info',
      );

      const result = await getTSheetsAccountInfo(sandbox);

      sandbox.logger.info(
        'Component=useGetTSheetsAccountInfo Event=Account info fetched successfully',
        {
          hasTSheetsAccount: result.hasTSheetsAccount,
          isFreedata: result.isFreedata,
          accountType: result.accountType,
        },
      );

      handleSuccess(result);
    } catch (err) {
      sandbox.logger.error(
        'Component=useGetTSheetsAccountInfo Event=Failed to fetch account info',
        {
          error: err instanceof Error ? err.message : String(err),
        },
      );
      handleError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess, sandbox, skip]);

  useEffect(() => {
    fetchAccountInfo();
  }, [fetchAccountInfo]);

  return {
    loading,
    error,
    data,
    refetch: fetchAccountInfo,
  };
};

/**
 * Lazy version of useGetTSheetsAccountInfo that doesn't fetch automatically
 *
 * @returns Object containing query function, account data, loading state, and error
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { query, data, loading, error } = useGetTSheetsAccountInfoLazy();
 *
 *   const handleClick = async () => {
 *     await query();
 *     if (data.isFreedata) {
 *       // Do something
 *     }
 *   };
 *
 *   return <Button onClick={handleClick}>Check Account</Button>;
 * };
 * ```
 */
export const useGetTSheetsAccountInfoLazy = () => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TSheetsAccountInfo>(DEFAULT_ACCOUNT_INFO);

  const query = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await getTSheetsAccountInfo(sandbox);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const mappedError = mapError({
        sourceComponent: 'useGetTSheetsAccountInfoLazy',
        sandbox,
        intl,
        error: errorMessage,
      });
      if (mappedError) {
        setError(mappedError);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [intl, sandbox]);

  return {
    query,
    data,
    loading,
    error,
  };
};
