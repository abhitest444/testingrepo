// Returns loading state as true initially
import { AuthorizationRequest, buildSandbox } from '@payroll/quicksand';
import { act } from 'react-dom/test-utils';
import { waitFor } from '@testing-library/dom';
import { Decision } from '@appfabric/sandbox-spec';
import { useADS } from 'src/js/providers/ADSProvider';
import useBatchAuthorization from 'src/js/providers/useBatchAuthorization';
import { renderHookWithQuicksandProvider } from 'test/unit/testUtils';

jest.mock('src/js/providers/ADSProvider', () => ({
  useADS: jest
    .fn()
    .mockReturnValue({ getBatchADSDecision: jest.fn().mockResolvedValue([]) }),
}));

describe('useBatchAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should resolve the decisions for batch authz', async () => {
    const mockAuthzRequests: AuthorizationRequest[] = [
      {
        resource: { id: 'irn' },
        action: { id: 'create' },
        subject: { id: 'subject' },
        environment: { id: 'environment' },
      },
      {
        resource: { id: 'irn2' },
        action: { id: 'read' },
        subject: { id: 'subject2' },
        environment: { id: 'environment2' },
      },
    ];
    let res: any;
    (useADS as jest.Mock).mockReturnValue({
      getBatchADSDecision: jest.fn().mockResolvedValueOnce([
        { decision: 'PERMIT', isAuthorized: true },
        { decision: 'DENY', isAuthorized: false },
      ] as Decision[]),
    });
    act(() => {
      const { result } = renderHookWithQuicksandProvider(
        () => useBatchAuthorization(mockAuthzRequests),
        buildSandbox(),
      );
      res = result;
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(res.current.loading).toBe(false);
      expect(res.current.decisions.length).toEqual(2);
      expect(res.current.decisions[0].decision).toEqual('PERMIT');
      expect(res.current.decisions[1].decision).toEqual('DENY');
      expect(res.current.error).toBeUndefined();
    });
  });

  test('should handle error in case 1 of the requests fails', async () => {
    const mockAuthzRequests: AuthorizationRequest[] = [
      {
        resource: { id: 'irn' },
        action: { id: 'create' },
        subject: { id: 'subject' },
        environment: { id: 'environment' },
      },
      {
        resource: { id: 'irn2' },
        action: { id: 'read' },
        subject: { id: 'subject2' },
        environment: { id: 'environment2' },
      },
    ];
    let res: any;
    (useADS as jest.Mock).mockReturnValue({
      getBatchADSDecision: jest
        .fn()
        .mockRejectedValueOnce(new Error('Test error')),
    });
    act(() => {
      const { result } = renderHookWithQuicksandProvider(
        () => useBatchAuthorization(mockAuthzRequests),
        buildSandbox(),
      );
      res = result;
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(res.current.loading).toBe(false);
      expect(res.current.decisions).toEqual([]);
      expect(res.current.error).toBeDefined();
      expect(res.current.error).toEqual(new Error('Test error'));
    });
  });
});
