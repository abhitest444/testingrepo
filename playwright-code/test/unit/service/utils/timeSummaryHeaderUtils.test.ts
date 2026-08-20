import { SandboxLogger } from '@appfabric/sandbox-spec';
import {
  TIME_SUMMARY_API_OPERATION,
  TIME_SUMMARY_API_STATUS,
  TIME_TRACKING_HEADERS,
} from 'src/js/common/constants';
import {
  buildTimeSummaryTimeActivityHeaders,
  logTimeSummaryTimeActivityApiConsumption,
} from 'src/js/service/utils/timeSummaryHeaderUtils';
import { computeHasTSheets } from 'src/js/service/hooks/entitlements/useGetEntitlements';

jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  computeHasTSheets: jest.fn(),
}));

const mockComputeHasTSheets = computeHasTSheets as jest.MockedFunction<
  typeof computeHasTSheets
>;

const baseArgs = {
  isTimeEntryPrimaryDataSourceEnabled: true,
  isTimeActivityRequest: true,
  entitlementGrants: [] as Parameters<
    typeof buildTimeSummaryTimeActivityHeaders
  >[0]['entitlementGrants'],
  entitlementsReady: true,
};

describe('buildTimeSummaryTimeActivityHeaders', () => {
  beforeEach(() => {
    mockComputeHasTSheets.mockReturnValue(false);
  });

  it('returns empty object when isTimeEntryPrimaryDataSourceEnabled is false', () => {
    const result = buildTimeSummaryTimeActivityHeaders({
      ...baseArgs,
      isTimeEntryPrimaryDataSourceEnabled: false,
    });

    expect(result).toEqual({});
    expect(mockComputeHasTSheets).not.toHaveBeenCalled();
  });

  it('returns empty object when isTimeActivityRequest is false', () => {
    const result = buildTimeSummaryTimeActivityHeaders({
      ...baseArgs,
      isTimeActivityRequest: false,
    });

    expect(result).toEqual({});
    expect(mockComputeHasTSheets).not.toHaveBeenCalled();
  });

  it('returns empty object when entitlementsReady is false', () => {
    const result = buildTimeSummaryTimeActivityHeaders({
      ...baseArgs,
      entitlementsReady: false,
    });

    expect(result).toEqual({});
    expect(mockComputeHasTSheets).not.toHaveBeenCalled();
  });

  it('returns empty object when org has TSheets (computeHasTSheets true)', () => {
    mockComputeHasTSheets.mockReturnValue(true);
    const grants = baseArgs.entitlementGrants;

    const result = buildTimeSummaryTimeActivityHeaders({
      ...baseArgs,
      entitlementGrants: grants,
    });

    expect(result).toEqual({});
    expect(mockComputeHasTSheets).toHaveBeenCalledWith(grants);
  });

  it('returns time-activity header when FF on, time-activity request, entitlements ready, and not TSheets', () => {
    const grants = baseArgs.entitlementGrants;

    const result = buildTimeSummaryTimeActivityHeaders({
      ...baseArgs,
      entitlementGrants: grants,
    });

    expect(result).toEqual({
      [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
    });
    expect(mockComputeHasTSheets).toHaveBeenCalledWith(grants);
  });
});

describe('logTimeSummaryTimeActivityApiConsumption', () => {
  const timeActivityHeadersOn: Record<string, string> = {
    [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'true',
  };
  const timeActivityHeadersOff: Record<string, string> = {
    [TIME_TRACKING_HEADERS.TIME_SUMMARY_TIME_ACTIVITY_FLOW]: 'false',
  };

  let logger: Pick<SandboxLogger, 'info' | 'error'>;

  beforeEach(() => {
    logger = { info: jest.fn(), error: jest.fn() };
  });

  it('does not log when the time-activity flow header is not "true"', () => {
    logTimeSummaryTimeActivityApiConsumption(
      logger as SandboxLogger,
      timeActivityHeadersOff,
      {
        api: 'TEST_API',
        operation: TIME_SUMMARY_API_OPERATION.READ,
        status: TIME_SUMMARY_API_STATUS.SUCCESS,
      },
    );

    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs info for SUCCESS when the header is present', () => {
    logTimeSummaryTimeActivityApiConsumption(
      logger as SandboxLogger,
      timeActivityHeadersOn,
      {
        api: 'TEST_API',
        operation: TIME_SUMMARY_API_OPERATION.UPDATE,
        status: TIME_SUMMARY_API_STATUS.SUCCESS,
      },
    );

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'EVENT=TIME_SUMMARY_API_CALL API=TEST_API operation=UPDATE status=SUCCESS',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs error for FAILED without an error payload when errorMessage is omitted', () => {
    logTimeSummaryTimeActivityApiConsumption(
      logger as SandboxLogger,
      timeActivityHeadersOn,
      {
        api: 'TEST_API',
        operation: TIME_SUMMARY_API_OPERATION.CREATE,
        status: TIME_SUMMARY_API_STATUS.FAILED,
      },
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'EVENT=TIME_SUMMARY_API_CALL API=TEST_API operation=CREATE status=FAILED',
      undefined,
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs error for FAILED with { error } when errorMessage is provided', () => {
    logTimeSummaryTimeActivityApiConsumption(
      logger as SandboxLogger,
      timeActivityHeadersOn,
      {
        api: 'TEST_API',
        operation: TIME_SUMMARY_API_OPERATION.DELETE,
        status: TIME_SUMMARY_API_STATUS.FAILED,
        errorMessage: 'GraphQL failure',
      },
    );

    expect(logger.error).toHaveBeenCalledWith(
      'EVENT=TIME_SUMMARY_API_CALL API=TEST_API operation=DELETE status=FAILED',
      { error: 'GraphQL failure' },
    );
  });
});
