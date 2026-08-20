import { useSandbox } from '@payroll/quicksand';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QbTimeSdkFactory, QbTimeSdk } from '@work-timecapture/qbtime-sdk';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';

interface UseQbTimeSdkState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

interface UseQbTimeSdkResult<T, TArgs extends unknown[]>
  extends UseQbTimeSdkState<T> {
  execute: (...args: TArgs) => Promise<T | undefined>;
  reset: () => void;
}

export const useQbTimeSdk = <T, TArgs extends unknown[] = []>(
  sdkMethod: (sdk: QbTimeSdk) => (...args: TArgs) => Promise<T> | T,
  options?: {
    executeOnMount?: boolean;
    args?: TArgs;
  },
): UseQbTimeSdkResult<T, TArgs> => {
  const sandbox = useSandbox();
  const [state, setState] = useState<UseQbTimeSdkState<T>>({
    data: undefined,
    loading: false,
    error: undefined,
  });

  const sdk = useMemo(
    () => QbTimeSdkFactory.create(sandbox as QuickbooksOnlineSandbox),
    [sandbox],
  );

  const execute = useCallback(
    async (...args: TArgs): Promise<T | undefined> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: undefined }));
        const method = sdkMethod(sdk);
        const result = await method.call(sdk, ...args);
        setState({ data: result, loading: false, error: undefined });
        return result;
      } catch (err) {
        const error = err as Error;
        sandbox.logger.error('useQbTimeSdk: SDK method call failed', {
          error: error.message,
        });
        setState((prev) => ({ ...prev, loading: false, error }));
        return undefined;
      }
    },
    [sdk, sdkMethod],
  );

  const reset = useCallback(() => {
    setState({ data: undefined, loading: false, error: undefined });
  }, []);

  const executeRef = useRef(execute);
  executeRef.current = execute;

  useEffect(() => {
    if (options?.executeOnMount) {
      const args = (options.args ?? []) as TArgs;
      executeRef.current(...args).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
};

export default useQbTimeSdk;
