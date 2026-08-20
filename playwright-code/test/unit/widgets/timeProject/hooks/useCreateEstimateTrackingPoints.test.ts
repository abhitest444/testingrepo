import { renderHook } from '@testing-library/react-hooks';
import { useCreateEstimateTrackingPoints } from 'src/js/widgets/timeProject/hooks/useCreateEstimateTrackingPoints';
import {
  CREATE_ESTIMATE_TRACKING_POINTS,
  WFS_CREATE_ESTIMATE_TRACKING_POINTS,
} from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('useCreateEstimateTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result } = renderHook(() => useCreateEstimateTrackingPoints());

    expect(result.current).toBe(CREATE_ESTIMATE_TRACKING_POINTS);
    expect(result.current.SAVE_ESTIMATE.scope_area).toBe('Time projects');
  });

  it('should return WFS tracking points when in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const { result } = renderHook(() => useCreateEstimateTrackingPoints());

    expect(result.current).toBe(WFS_CREATE_ESTIMATE_TRACKING_POINTS);
    expect(result.current.SAVE_ESTIMATE.scope_area).toBe('workforce');
  });
});
