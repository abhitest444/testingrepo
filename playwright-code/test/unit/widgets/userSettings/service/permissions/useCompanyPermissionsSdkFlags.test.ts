import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useSandbox } from '@payroll/quicksand';
import { QbTimeSdkFactory } from '@work-timecapture/qbtime-sdk';
import useCompanyPermissionsSdkFlags from 'src/js/widgets/userSettings/service/permissions/useCompanyPermissionsSdkFlags';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('@work-timecapture/qbtime-sdk', () => {
  const actual = jest.requireActual('@work-timecapture/qbtime-sdk');
  return {
    ...actual,
    QbTimeSdkFactory: { create: jest.fn() },
  };
});

const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
const mockCreate = QbTimeSdkFactory.create as jest.MockedFunction<
  typeof QbTimeSdkFactory.create
>;

describe('useCompanyPermissionsSdkFlags', () => {
  const mockSandbox = { logger: { error: jest.fn(), info: jest.fn() } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue(mockSandbox as any);
  });

  it('maps batchAuthorize decisions and reports loading until resolved', async () => {
    mockCreate.mockReturnValue({
      batchAuthorize: jest
        .fn()
        .mockResolvedValue([
          { isAuthorized: true },
          { isAuthorized: false },
          undefined,
        ]),
    } as any);

    const { result } = renderHook(() => useCompanyPermissionsSdkFlags());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.canUseCompanyMobile).toBe(false);
    expect(result.current.canCompanyManageMyTimesheets).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canUseCompanyMobile).toBe(true);
    expect(result.current.canCompanyManageMyTimesheets).toBe(false);
  });

  it('fails closed when sdk returns an error', async () => {
    mockCreate.mockReturnValue({
      batchAuthorize: jest.fn().mockRejectedValue(new Error('sdk down')),
    } as any);

    const { result } = renderHook(() => useCompanyPermissionsSdkFlags());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.canUseCompanyMobile).toBe(false);
    expect(result.current.canCompanyManageMyTimesheets).toBe(false);
  });
});
