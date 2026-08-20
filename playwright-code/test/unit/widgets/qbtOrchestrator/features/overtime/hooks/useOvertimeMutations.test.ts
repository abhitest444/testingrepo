/* eslint-disable react/no-children-prop */
import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { Provider } from 'react-redux';
import { useOvertimeMutations } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimeMutations';
import {
  createQbtOrchestratorStore,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import { createOvertimePolicy } from 'test/unit/fixtures/overtimeFixtures';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';

import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockMutate = jest.fn();
const mockClient = { mutate: mockMutate };

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => mockClient),
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  setInteractionDegraded: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    OVERTIME_POLICY_CREATE: 'overtime-policy-create',
    OVERTIME_POLICY_UPDATE: 'overtime-policy-update',
    OVERTIME_POLICY_DELETE: 'overtime-policy-delete',
    OVERTIME_POLICY_ASSIGNMENT_MANAGE: 'overtime-policy-assignment-manage',
  },
}));
const mockGetClient = getApolloClientInstance as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

const sandbox = getDefaultSandbox();
let store: ReturnType<typeof createQbtOrchestratorStore>;

const createWrapper = () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    const reduxProvider = React.createElement(Provider, { store, children });
    const loggingProvider = React.createElement(LoggingConfigProvider, {
      sandbox,
      prefix: 'test',
      children: reduxProvider,
    });
    return React.createElement(MockQuicksandProvider, {
      sandbox,
      children: loggingProvider,
    });
  };
  return Wrapper;
};

const mockPolicy = createOvertimePolicy({ id: 'p-1', name: 'Test Policy' });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useOvertimeMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClient.mockReturnValue(mockClient);
    store = createQbtOrchestratorStore();
  });

  describe('createOvertimePolicy', () => {
    const input = { name: 'New Policy', rules: [], setAsDefault: false };

    it('succeeds: closes wizard, returns success', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { createOvertimePolicy: { policy: mockPolicy } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPolicy);
      expect((store.getState() as any).overtime.showWizard).toBe(false);
    });

    it('fails: returns error and sets createPolicyError in store', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Server error');
      expect((store.getState() as any).overtime.createPolicyError).toBe(
        'Server error',
      );
      expect((store.getState() as any).overtime.isCreatingPolicy).toBe(false);
    });

    it('fails when Apollo client is not initialized', async () => {
      mockGetClient.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Apollo client not initialized');
    });
  });

  describe('updateOvertimePolicy – user override policy branch', () => {
    it('sends BASIC_POLICY_ID and sets userId in input when policyId is a user override', async () => {
      const updatedPolicy = { ...mockPolicy, name: 'Updated Policy' };
      store = createQbtOrchestratorStore({
        overtime: { policies: [mockPolicy] },
      });
      mockMutate.mockResolvedValueOnce({
        data: { updateOvertimePolicy: { policy: updatedPolicy } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy(
          'basic_policy_user99',
          { name: 'Updated Policy' },
        );
      });

      expect(response.success).toBe(true);
      // Mutation should have been called with id='basic' and input.userId='user99'
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            id: 'basic',
            input: expect.objectContaining({ userId: 'user99' }),
          }),
        }),
      );
    });
  });

  describe('updateOvertimePolicy', () => {
    const updatedPolicy = { ...mockPolicy, name: 'Updated Policy' };

    it('succeeds: closes wizard and returns success', async () => {
      // Seed store with original policy
      store = createQbtOrchestratorStore({
        overtime: { policies: [mockPolicy] },
      });
      mockMutate.mockResolvedValueOnce({
        data: { updateOvertimePolicy: { policy: updatedPolicy } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'Updated Policy',
        });
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(updatedPolicy);
      expect((store.getState() as any).overtime.showWizard).toBe(false);
    });

    it('fails: sets updatePolicyError', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect((store.getState() as any).overtime.updatePolicyError).toBe(
        'Update failed',
      );
    });
  });

  describe('deleteOvertimePolicy', () => {
    it('succeeds: removes policy from store and closes delete modal', async () => {
      store = createQbtOrchestratorStore({
        overtime: { policies: [mockPolicy], showDeleteModal: true },
      });
      mockMutate.mockResolvedValueOnce({
        data: { deleteOvertimePolicy: { deletedPolicyId: 'p-1' } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(true);
      expect(response.data).toBe('p-1');
      expect((store.getState() as any).overtime.policies).toHaveLength(0);
      expect((store.getState() as any).overtime.showDeleteModal).toBe(false);
      expect((store.getState() as any).overtime.refetchPolicies).toBe(true);
    });

    it('fails: sets deletePolicyError', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-bad');
      });

      expect(response.success).toBe(false);
      expect((store.getState() as any).overtime.deletePolicyError).toBe(
        'Delete failed',
      );
    });
  });

  describe('manageOvertimePolicyAssignments', () => {
    const policyWithAssignments = {
      ...mockPolicy,
      assignments: {
        values: [
          {
            id: 'a-1',
            entityType: 'user',
            entityId: 'u-1',
            entityName: 'User 1',
          },
        ],
      },
    };

    it('succeeds: dispatches updatePolicy with new assignments', async () => {
      store = createQbtOrchestratorStore({
        overtime: { policies: [mockPolicy] },
      });
      mockMutate.mockResolvedValueOnce({
        data: {
          manageOvertimePolicyAssignments: { policy: policyWithAssignments },
        },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: ['u-1'] },
        });
      });

      expect(response.success).toBe(true);
      expect(
        (store.getState() as any).overtime.policies[0].assignments?.values,
      ).toHaveLength(1);
      expect((store.getState() as any).overtime.isManagingAssignments).toBe(
        false,
      );
    });

    it('fails: sets assignmentsError', async () => {
      mockMutate.mockRejectedValueOnce(new Error('Assignment failed'));

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect((store.getState() as any).overtime.assignmentsError).toBe(
        'Assignment failed',
      );
    });
  });

  describe('exposed state', () => {
    it('reflects store mutation states correctly', () => {
      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isCreatingPolicy).toBe(false);
      expect(result.current.isUpdatingPolicy).toBe(false);
      expect(result.current.isDeletingPolicy).toBe(false);
      expect(result.current.isManagingAssignments).toBe(false);
      expect(result.current.createPolicyError).toBeNull();
      expect(result.current.showDeleteModal).toBe(false);
    });
  });

  describe('createOvertimePolicy – nullish rules branch', () => {
    it('logs rulesCount as 0 when input.rules is undefined', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { createOvertimePolicy: { policy: mockPolicy } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        // Pass input WITHOUT rules so input.rules?.length ?? 0 takes the ?? 0 branch
        response = await result.current.createOvertimePolicy({
          name: 'No Rules Policy',
        } as any);
      });

      expect(response.success).toBe(true);
    });
  });

  describe('createOvertimePolicy – error branches', () => {
    const input = { name: 'New Policy', rules: [], setAsDefault: false };

    it('throws when result contains a top-level errors array (GraphQL error)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {},
        errors: [{ message: 'GraphQL error from server' }],
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('GraphQL error from server');
      expect((store.getState() as any).overtime.createPolicyError).toBe(
        'GraphQL error from server',
      );
    });

    it('throws when mutation returns no policy', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { createOvertimePolicy: { policy: null } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });

    it('handles non-Error thrown value via String(err)', async () => {
      // Throw a plain string (not an Error instance) to exercise the String(err) branch
      mockMutate.mockRejectedValueOnce('plain string error');

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('plain string error');
    });

    it('handles null data response (response?.errors short-circuit)', async () => {
      // When result.data is null, response is null → response?.errors is undefined
      // This exercises the optional-chaining null branch on response?.errors
      mockMutate.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.createOvertimePolicy(input);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });
  });

  describe('updateOvertimePolicy – error branches', () => {
    it('fails when Apollo client is not initialized', async () => {
      mockGetClient.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Apollo client not initialized');
    });

    it('throws when result contains a top-level errors array (GraphQL error)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {},
        errors: [{ message: 'Update GraphQL error' }],
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Update GraphQL error');
      expect((store.getState() as any).overtime.updatePolicyError).toBe(
        'Update GraphQL error',
      );
    });

    it('throws when mutation returns no policy', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { updateOvertimePolicy: { policy: null } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });

    it('handles non-Error thrown value via String(err)', async () => {
      mockMutate.mockRejectedValueOnce('update plain string error');

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('update plain string error');
    });

    it('handles null data response (response?.errors short-circuit)', async () => {
      mockMutate.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateOvertimePolicy('p-1', {
          name: 'x',
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });
  });

  describe('deleteOvertimePolicy – error branches', () => {
    it('fails when Apollo client is not initialized', async () => {
      mockGetClient.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Apollo client not initialized');
    });

    it('throws when result contains a top-level errors array (GraphQL error)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {},
        errors: [{ message: 'Delete GraphQL error' }],
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Delete GraphQL error');
      expect((store.getState() as any).overtime.deletePolicyError).toBe(
        'Delete GraphQL error',
      );
    });

    it('throws when mutation returns no deletedPolicyId', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { deleteOvertimePolicy: { deletedPolicyId: null } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });

    it('handles non-Error thrown value via String(err)', async () => {
      mockMutate.mockRejectedValueOnce('delete plain string error');

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('delete plain string error');
    });

    it('handles null data response (response?.errors short-circuit)', async () => {
      mockMutate.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.deleteOvertimePolicy('p-1');
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });
  });

  describe('manageOvertimePolicyAssignments – error branches', () => {
    it('fails when Apollo client is not initialized', async () => {
      mockGetClient.mockReturnValueOnce(null);

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Apollo client not initialized');
    });

    it('throws when result contains a top-level errors array (GraphQL error)', async () => {
      mockMutate.mockResolvedValueOnce({
        data: {},
        errors: [{ message: 'Assignments GraphQL error' }],
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Assignments GraphQL error');
      expect((store.getState() as any).overtime.assignmentsError).toBe(
        'Assignments GraphQL error',
      );
    });

    it('throws when mutation returns no policy', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { manageOvertimePolicyAssignments: { policy: null } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });

    it('handles non-Error thrown value via String(err)', async () => {
      mockMutate.mockRejectedValueOnce('assignments plain string error');

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('assignments plain string error');
    });

    it('handles null data response (response?.errors short-circuit)', async () => {
      mockMutate.mockResolvedValueOnce({ data: null });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: [] },
        });
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('NLS overtime.api.error.generic undefined');
    });

    it('logs ?? 0 when assign/unassign fields are absent', async () => {
      mockMutate.mockResolvedValueOnce({
        data: { manageOvertimePolicyAssignments: { policy: mockPolicy } },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        // Pass empty input so assign/unassign are undefined → all ?? 0 branches fire
        response = await result.current.manageOvertimePolicyAssignments(
          'p-1',
          {} as any,
        );
      });

      expect(response.success).toBe(true);
    });

    it('logs non-zero counts when all assign/unassign arrays are provided', async () => {
      const policyNoAssignments = {
        ...mockPolicy,
        assignments: undefined,
      };
      mockMutate.mockResolvedValueOnce({
        data: {
          manageOvertimePolicyAssignments: { policy: policyNoAssignments },
        },
      });

      const { result } = renderHook(() => useOvertimeMutations(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        // Provide all groupId and unassign arrays so lines 337-339 take the non-nullish branch
        response = await result.current.manageOvertimePolicyAssignments('p-1', {
          assign: { userIds: ['u-1'], groupIds: ['g-1'] },
          unassign: { userIds: ['u-2'], groupIds: ['g-2'] },
        });
      });

      // policy.assignments is undefined → policy.assignments?.values?.length ?? 0 takes ?? 0
      expect(response.success).toBe(true);
    });
  });

  describe('degraded status code handling (statusCode 9463)', () => {
    const { setInteractionDegraded } = jest.requireMock(
      'src/js/common/CustomerInteraction',
    );
    const { endInteractionWithFailure } = jest.requireMock(
      'src/js/common/CustomerInteraction',
    );
    const EXPECTED_DEGRADED_MSG =
      'Create a "Double Overtime Pay" pay type before setting up an overtime policy.';

    describe('createOvertimePolicy – degraded', () => {
      const input = { name: 'New Policy', rules: [], setAsDefault: false };

      it('returns friendly error and marks interaction as degraded when statusCode is 9463 (string)', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            createOvertimePolicy: {
              policy: null,
              status: { statusCode: '9463', message: 'server msg' },
            },
          },
        });

        const { result } = renderHook(() => useOvertimeMutations(), {
          wrapper: createWrapper(),
        });

        let response: any;
        await act(async () => {
          response = await result.current.createOvertimePolicy(input);
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe(EXPECTED_DEGRADED_MSG);
        expect((store.getState() as any).overtime.createPolicyError).toBe(
          EXPECTED_DEGRADED_MSG,
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-create',
          '9463',
        );
        expect(endInteractionWithFailure).not.toHaveBeenCalled();
      });

      it('handles statusCode as a number (9463) from GraphQL', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            createOvertimePolicy: {
              policy: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        const { result } = renderHook(() => useOvertimeMutations(), {
          wrapper: createWrapper(),
        });

        let response: any;
        await act(async () => {
          response = await result.current.createOvertimePolicy(input);
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe(EXPECTED_DEGRADED_MSG);
        expect(setInteractionDegraded).toHaveBeenCalled();
      });

      it('does not treat an unknown status code as degraded', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            createOvertimePolicy: {
              policy: null,
              status: { statusCode: '9999', message: 'unknown error' },
            },
          },
        });

        const { result } = renderHook(() => useOvertimeMutations(), {
          wrapper: createWrapper(),
        });

        let response: any;
        await act(async () => {
          response = await result.current.createOvertimePolicy(input);
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe('NLS overtime.api.error.generic undefined');
        expect(setInteractionDegraded).not.toHaveBeenCalled();
      });
    });

    describe('updateOvertimePolicy – degraded', () => {
      it('returns friendly error and marks interaction as degraded when statusCode is 9463', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            updateOvertimePolicy: {
              policy: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        const { result } = renderHook(() => useOvertimeMutations(), {
          wrapper: createWrapper(),
        });

        let response: any;
        await act(async () => {
          response = await result.current.updateOvertimePolicy('p-1', {
            name: 'x',
          });
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe(EXPECTED_DEGRADED_MSG);
        expect((store.getState() as any).overtime.updatePolicyError).toBe(
          EXPECTED_DEGRADED_MSG,
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-update',
          '9463',
        );
        expect(endInteractionWithFailure).not.toHaveBeenCalled();
      });
    });

    describe('deleteOvertimePolicy – degraded', () => {
      it('returns friendly error and marks interaction as degraded when statusCode is 9463', async () => {
        mockMutate.mockResolvedValueOnce({
          data: {
            deleteOvertimePolicy: {
              deletedPolicyId: null,
              status: { statusCode: 9463, message: 'server msg' },
            },
          },
        });

        const { result } = renderHook(() => useOvertimeMutations(), {
          wrapper: createWrapper(),
        });

        let response: any;
        await act(async () => {
          response = await result.current.deleteOvertimePolicy('p-1');
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe(EXPECTED_DEGRADED_MSG);
        expect((store.getState() as any).overtime.deletePolicyError).toBe(
          EXPECTED_DEGRADED_MSG,
        );
        expect(setInteractionDegraded).toHaveBeenCalledWith(
          expect.anything(),
          'overtime-policy-delete',
          '9463',
        );
        expect(endInteractionWithFailure).not.toHaveBeenCalled();
      });
    });
  });
});
