import { useCallback, useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { useLazyGetTSheetsWorkerById } from 'src/js/service/hooks/employee/useLazyGetTSheetsWorkerById';
import { useTimeProjectLogger } from '../utils/timeProjectLogging';

export interface CurrentWorker {
  workerId: string | null;
  // Uppercase worker type expected by the posts mutations ("EMPLOYEE" /
  // "VENDOR"). Not required for the read path, but resolved here so the
  // composer/reply stories can consume the same hook.
  workerType: string | null;
}

interface UseCurrentWorkerResult extends CurrentWorker {
  loading: boolean;
  ready: boolean;
}

/**
 * Resolves the logged-in user's worker id (and type) for the posts feature.
 *
 * The timeProject widget already receives a `workerId` prop from the host
 * shell, but it carries no worker type. We resolve the auth id from the
 * sandbox and call `timeTrackingWorkerById` to derive the type (and to fill
 * in the worker id when the prop is absent).
 *
 * This must resolve BEFORE the posts query runs — `timeTrackingPosts`
 * requires `input.workerId`.
 */
export const useCurrentWorker = (
  workerIdProp?: string | null,
): UseCurrentWorkerResult => {
  const sandbox = useSandbox();
  const logger = useTimeProjectLogger();
  const { query: getWorkerById } = useLazyGetTSheetsWorkerById();

  const [workerId, setWorkerId] = useState<string | null>(workerIdProp ?? null);
  const [workerType, setWorkerType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ready, setReady] = useState<boolean>(false);

  const resolve = useCallback(async () => {
    setLoading(true);
    try {
      const authId = sandbox.appContext.getUserAuthInfo()?.authId;
      if (!authId) {
        // No auth id to resolve against — fall back to the prop (id only,
        // no type) so the read path can still run when a workerId was
        // passed in.
        setWorkerId(workerIdProp ?? null);
        return;
      }

      const result = await getWorkerById({ variables: { id: authId } });
      const data = result?.data?.timeTrackingWorkerById;

      if (data) {
        let resolvedId: string | null = null;
        let resolvedType: string | null = null;

        if (data.isEmployee) {
          resolvedId = data.employeeId;
          resolvedType = 'EMPLOYEE';
        } else if (data.isVendor) {
          resolvedId = data.vendorId ?? data.employeeId;
          resolvedType = 'VENDOR';
        } else if (data.isQboUser) {
          resolvedId = data.profileId;
          resolvedType = 'LEGACY_QBO_USER';
        }

        setWorkerId(workerIdProp ?? resolvedId ?? null);
        setWorkerType(resolvedType);
      } else {
        setWorkerId(workerIdProp ?? null);
      }
    } catch (err) {
      logger.error('Component=useCurrentWorker Event=Resolve Worker Failed', {
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      // Keep whatever id we have from the prop so the read path isn't
      // fully blocked by a type-resolution failure.
      setWorkerId(workerIdProp ?? null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [sandbox, getWorkerById, workerIdProp, logger]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return { workerId, workerType, loading, ready };
};
