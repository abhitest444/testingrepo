import { renderHook } from '@testing-library/react-hooks';
import { useAssignWorkersTrackingPoints } from 'src/js/widgets/timeProject/hooks/useAssignWorkersTrackingPoints';
import {
  ASSIGN_WORKERS_TRACKING_POINTS,
  WFS_ASSIGN_WORKERS_TRACKING_POINTS,
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

describe('useAssignWorkersTrackingPoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return QBO tracking points when not in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    const { result } = renderHook(() => useAssignWorkersTrackingPoints());

    expect(result.current).toBe(ASSIGN_WORKERS_TRACKING_POINTS);
    expect(result.current.SAVE_ASSIGN_WORKER.scope_area).toBe('Time projects');
  });

  it('should return WFS tracking points when in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    const { result } = renderHook(() => useAssignWorkersTrackingPoints());

    expect(result.current).toBe(WFS_ASSIGN_WORKERS_TRACKING_POINTS);
    expect(result.current.SAVE_ASSIGN_WORKER.scope_area).toBe('workforce');
  });
});
