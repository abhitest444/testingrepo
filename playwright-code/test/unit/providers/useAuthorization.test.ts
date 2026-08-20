import { Decision, DecisionType } from '@appfabric/sandbox-spec';
import { buildSandbox } from '@payroll/quicksand';
import { waitFor } from '@testing-library/dom';
import { act } from 'react-dom/test-utils';
import { useADS } from 'src/js/providers/ADSProvider';
import useAuthorization from 'src/js/providers/useAuthorization';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';

jest.mock('src/js/providers/ADSProvider', () => ({
  useADS: jest.fn().mockReturnValue({
    getADSDecision: jest.fn().mockResolvedValue({
      decision: DecisionType.PERMIT,
      isAuthorized: true,
    } as Decision),
  }),
}));

describe('useAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  // Returns decision, loading, and error states correctly
  test('should return correct decision, loading, and error states', async () => {
    const mockAuthzRequest = {
      resource: { id: 'irn' },
      action: { id: 'create' },
      subject: { id: 'subject' },
      environment: { id: 'environment' },
    };
    const mockDecision = {
      decision: DecisionType.PERMIT,
      isAuthorized: true,
    } as Decision;

    let res: any;

    act(() => {
      const { result } = renderHookWithQuicksandProvider(
        () => useAuthorization(mockAuthzRequest),
        buildSandbox(),
      );
      res = result;
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(res.current.loading).toBe(false);
      expect(res.current.decision).toEqual(mockDecision);
      expect(res.current.error).toBeUndefined();
    });
  });

  test('should handle error correctly', async () => {
    const mockAuthzRequest = {
      resource: { id: 'irn' },
      action: { id: 'create' },
      subject: { id: 'subject' },
      environment: { id: 'environment' },
    };
    const mockError = new Error('Test error');
    const getADSDecisionMock = jest.fn().mockRejectedValue(mockError);

    (useADS as jest.Mock).mockReturnValue({
      getADSDecision: getADSDecisionMock,
    });
    let res: any;
    act(() => {
      const { result } = renderHookWithQuicksandProvider(
        () => useAuthorization(mockAuthzRequest),
        buildSandbox(),
      );
      res = result;
    });

    await waitFor(() => {
      expect(res.current.loading).toBe(false);
      expect(res.current.error).toEqual(mockError);
    });
  });
});
