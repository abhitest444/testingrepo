import { SandboxLogger } from '@appfabric/sandbox-spec';
import { Identity_EntitlementGrant } from 'src/__generated__/oigql/graphql';
import {
  TIME_SUMMARY_API_STATUS,
  TIME_TRACKING_HEADERS,
  type TimeSummaryApiOperation,
  type TimeSummaryApiStatus,
} from 'src/js/common/constants';
import { computeHasTSheets } from 'src/js/service/hooks/entitlements/useGetEntitlements';

export const TIME_SUMMARY_API_NAMES = {
  TIME_ACTIVITY_SEARCH: 'TIME_ACTIVITY_SEARCH',
  GET_TIME_ENTRY: 'GET_TIME_ENTRY',
  TIME_TRACKING_BATCH_MANAGE_TIME_ENTRIES:
    'TIME_TRACKING_BATCH_MANAGE_TIME_ENTRIES',
} as const;

/**
 * Emits a single-line log for dashboard aggregation when the time-summary TA header is present
 * (same conditions as {@link buildTimeSummaryTimeActivityHeaders}).
 * FAILED uses logger.error; optional errorMessage is passed as `{ error: errorMessage }`.
 */
export function logTimeSummaryTimeActivityApiConsumption(
  logger: SandboxLogger,
  timeActivityHeaders: Record<string, string>,
  args: {
    api: string;
    operation: TimeSummaryApiOperation;
    status: TimeSummaryApiStatus;
    errorMessage?: string;
  },
): void {
  if (
    timeActivityHeaders[
      TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW
    ] !== 'true'
  ) {
    return;
  }
  const line = `EVENT=TIME_SUMMARY_API_CALL API=${args.api} operation=${args.operation} status=${args.status}`;
  if (args.status === TIME_SUMMARY_API_STATUS.FAILED) {
    logger.error(
      line,
      args.errorMessage ? { error: args.errorMessage } : undefined,
    );
  } else {
    logger.info(line);
  }
}

export type BuildTimeSummaryTimeActivityHeadersArgs = {
  isTimeEntryPrimaryDataSourceEnabled: boolean;
  isTimeActivityRequest: boolean;
  entitlementGrants: Identity_EntitlementGrant[];
  entitlementsReady: boolean;
};

/**
 * Adds intuit-is-time-activity when the time summary FF is on, the request is for a time-activity,
 * entitlements have finished loading (`entitlementsReady`), and the org is not TSheets (computeHasTSheets).
 */
export function buildTimeSummaryTimeActivityHeaders({
  isTimeEntryPrimaryDataSourceEnabled,
  isTimeActivityRequest,
  entitlementGrants,
  entitlementsReady,
}: BuildTimeSummaryTimeActivityHeadersArgs): Record<string, string> {
  // If the time summary FF is not on or the request is not for a time-activity or entitlements are not ready, no header is needed
  if (
    !isTimeEntryPrimaryDataSourceEnabled ||
    !isTimeActivityRequest ||
    !entitlementsReady
  ) {
    return {};
  }
  // If the user is a TSheets user (paid data), no header is needed
  // we need the header only for free users (no time subscription)
  if (computeHasTSheets(entitlementGrants)) {
    return {};
  }
  // pass the header only when all the conditions are met
  return { [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true' };
}
