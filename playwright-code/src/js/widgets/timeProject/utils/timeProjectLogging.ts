import { SandboxLogger } from '@appfabric/sandbox-spec';
import { useSandbox } from '@payroll/quicksand';
import { Sandbox } from 'src/js/common/sandbox';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  setInteractionDegraded,
} from 'src/js/common/CustomerInteraction';

/**
 * Logging helpers for the timeProject widget.
 *
 * The platform Splunk pipeline already enriches every log line with
 * `companyId` / `realmId` / app-context data, so these helpers stay focused
 * on widget-specific structure:
 *   - `withLoggedOperation` wraps an async call in start/success/failure
 *     log lines plus a `durationMs` field so Splunk can compute TP99 latency
 *     directly from log events (`stats perc99(durationMs) by event`).
 *   - `logNavigationEvent` is a thin info-log helper for one-off UI events.
 *   - `useTimeProjectLogger` resolves the right logger and tolerates being
 *     rendered outside `LoggingConfigProvider` / `QuicksandProvider` (e.g.
 *     in unit tests) by falling back to a no-op logger.
 */

const safeError = (error: unknown): Record<string, unknown> => {
  if (!error) return {};
  if (error instanceof Error) {
    return { errorMessage: error.message, errorName: error.name };
  }
  if (typeof error === 'object') {
    const e = error as { message?: string; code?: string };
    return {
      errorMessage: e.message ?? String(error),
      errorCode: e.code,
    };
  }
  return { errorMessage: String(error) };
};

export interface LoggedOperationOptions<T> {
  /** Logger to emit the structured Splunk lines on. */
  logger: SandboxLogger;
  /** Friendly event tag added to every log line for the dashboard. */
  event: {
    start: string;
    success: string;
    failure: string;
  };
  /** Async work to perform. */
  run: () => Promise<T>;
  /**
   * Treats the resolved value as a failure when this returns a non-empty
   * reason string. Useful for GraphQL mutations that resolve with an
   * `errorCode` field instead of throwing.
   */
  isFailure?: (result: T) => string | null | undefined;
  /** Optional additional Splunk fields (e.g. projectId, pageSize). */
  extraProps?: Record<string, unknown>;
  /**
   * Optional Failed Customer Interaction (FCI) wiring. When BOTH `sandbox`
   * and `interactionName` are provided, the operation creates an FCI on
   * start, marks it `success` on a clean response, and ends it on any error
   * path — `fail` by default, or `degraded` when `degradeOnFailure` is set.
   */
  sandbox?: Sandbox;
  interactionName?: string;
  /**
   * When true, error paths mark the FCI `degraded` (then success) instead of
   * `failure`. Use for secondary, non-blocking reads where a failure doesn't
   * break the user's task (e.g. the unread-count badge, @-mention search).
   * Defaults to false (hard failure).
   */
  degradeOnFailure?: boolean;
}

/**
 * Wraps an async operation with structured Splunk log lines:
 *   1. Logs a `start` event with extraProps.
 *   2. Logs `success` (info) or `failure` (error) with `durationMs`.
 *   3. Re-throws thrown errors so callers retain control flow.
 *
 * The `durationMs` field is what Splunk uses to compute TP99 latency, e.g.
 * `index=... event="<success>" | stats perc99(durationMs)`.
 */
export const withLoggedOperation = async <T>({
  logger,
  event,
  run,
  isFailure,
  extraProps,
  sandbox,
  interactionName,
  degradeOnFailure = false,
}: LoggedOperationOptions<T>): Promise<T> => {
  const startedAt = Date.now();
  const baseProps = { ...(extraProps || {}) };

  // Kick off the FCI before doing the work so the duration captured by
  // performance covers the full operation. `createCustomerInteraction` uses
  // `returnExistingCI: true`, so concurrent callers reusing the same name
  // (e.g. paginated fetches) coalesce into a single interaction.
  const fciActive = !!(sandbox && interactionName);
  if (fciActive) {
    createCustomerInteraction(sandbox!, interactionName!);
  }

  // End the FCI on an error path — degraded (then success) for secondary reads,
  // otherwise a hard failure.
  const endFci = (reason: string, error?: unknown) => {
    if (!fciActive) return;
    if (degradeOnFailure) {
      setInteractionDegraded(sandbox!, interactionName!, reason);
    } else {
      endInteractionWithFailure(sandbox!, interactionName!, reason, error);
    }
  };

  logger.info(event.start, baseProps);

  try {
    const result = await run();
    const durationMs = Date.now() - startedAt;
    const failureReason = isFailure?.(result);

    if (failureReason) {
      logger.error(event.failure, {
        ...baseProps,
        result: degradeOnFailure ? 'degraded' : 'failure',
        durationMs,
        reason: failureReason,
      });
      endFci(failureReason);
      return result;
    }

    logger.info(event.success, {
      ...baseProps,
      result: 'success',
      durationMs,
    });
    if (fciActive) {
      endInteractionWithSuccess(sandbox!, interactionName!);
    }
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error(event.failure, {
      ...baseProps,
      result: degradeOnFailure ? 'degraded' : 'failure',
      durationMs,
      ...safeError(error),
    });
    endFci(error instanceof Error ? error.message : String(error), error);
    throw error;
  }
};

/**
 * Lightweight info-log helper for non-API events (navigation, drawer opened,
 * etc.) so call sites stay tidy.
 */
export const logNavigationEvent = (
  logger: SandboxLogger,
  message: string,
  props: Record<string, unknown> = {},
): void => {
  logger.info(message, props);
};

const NOOP_LOGGER: SandboxLogger = {
  debug: () => {},
  log: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  logException: () => {},
  isLevelDebug: () => false,
  isLevelLog: () => false,
  isLevelInfo: () => false,
  isLevelWarn: () => false,
  isLevelError: () => false,
  isLevelFatal: () => false,
  on: () => NOOP_LOGGER,
  off: () => NOOP_LOGGER,
} as unknown as SandboxLogger;

/**
 * Resolves the SandboxLogger for timeProject hooks. Tolerates being rendered
 * outside `QuicksandProvider` / `LoggingConfigProvider` (common in unit tests
 * that only wrap with Redux) by falling back to a no-op logger so the widget
 * never crashes when Splunk wiring is absent.
 *
 * NOTE on hook safety: both `useSandbox` and `useLoggingConfig` always call
 * `useContext` first and only `throw` afterwards on missing providers. The
 * try/catch wraps the post-hook throw, not the hook call itself, so hook
 * order is preserved across renders. The eslint-disable lines below silence
 * the purely-syntactic `rules-of-hooks` warning for that pattern.
 */
export const useTimeProjectLogger = (): SandboxLogger => {
  let sandbox: Sandbox | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- see note above
    sandbox = useSandbox() as unknown as Sandbox;
  } catch {
    sandbox = undefined;
  }

  let logger: SandboxLogger | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- see note above
    logger = useLoggingConfig();
  } catch {
    logger = sandbox?.logger;
  }

  // Tests sometimes provide a stub sandbox whose `logger` only implements a
  // subset of methods (e.g. only `error`). Fall back to NOOP whenever the
  // resolved logger does not look fully functional so the widget never crashes.
  if (!logger || typeof logger.info !== 'function') {
    logger = NOOP_LOGGER;
  }

  return logger;
};

/**
 * Returns the active Sandbox so timeProject hooks can drive Failed Customer
 * Interactions (FCIs) via `withLoggedOperation`. Mirrors the defensive
 * try/catch pattern used by `useTimeProjectLogger` so unit tests that don't
 * wrap with `QuicksandProvider` get `undefined` (which silently disables FCI
 * wiring) instead of throwing.
 */
export const useTimeProjectSandbox = (): Sandbox | undefined => {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- see useTimeProjectLogger note
    return useSandbox() as unknown as Sandbox;
  } catch {
    return undefined;
  }
};
