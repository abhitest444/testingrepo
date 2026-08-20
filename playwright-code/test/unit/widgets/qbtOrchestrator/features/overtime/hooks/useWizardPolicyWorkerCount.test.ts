/* eslint-disable react/no-children-prop */
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { useWizardPolicyWorkerCount } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useWizardPolicyWorkerCount';
import { createQbtOrchestratorStore } from 'test/unit/testUtils';
import {
  setPolicyMemberIds,
  setWizardEditMode,
  setAssignmentsDirty,
  updatePolicyFormData,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/store/overtimeSlice';

import { useOvertimePolicyWorkerCount } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicyWorkerCount';

// ── Mock useOvertimePolicyWorkerCount ─────────────────────────────────────────

const mockWorkerCountResult = {
  totalWorkerCount: 12,
  companyTotalWorkerCount: 50,
  isCompanyWide: false,
  hasNoAssignments: true,
  loading: false,
  error: null,
};

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/hooks/useOvertimePolicyWorkerCount',
  () => ({
    useOvertimePolicyWorkerCount: jest.fn(() => mockWorkerCountResult),
  }),
);
const mockUseWorkerCount = useOvertimePolicyWorkerCount as jest.Mock;

// ── Helpers ───────────────────────────────────────────────────────────────────

let store: ReturnType<typeof createQbtOrchestratorStore>;

const createWrapper = () => {
  const Wrapper = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(Provider, { store, children });
  return Wrapper;
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useWizardPolicyWorkerCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkerCount.mockReturnValue(mockWorkerCountResult);
    store = createQbtOrchestratorStore();
  });

  describe('create mode (wizardEditMode = false)', () => {
    it('returns count from policyMemberIds, not assignment-based hook', () => {
      store.dispatch(setPolicyMemberIds(['m-1', 'm-2', 'm-3']));

      const { result } = renderHook(() => useWizardPolicyWorkerCount(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(3);
      expect(result.current.isCompanyWide).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('returns 0 workers and hasNoAssignments=true when no members selected', () => {
      const { result } = renderHook(() => useWizardPolicyWorkerCount(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(0);
      expect(result.current.hasNoAssignments).toBe(true);
    });

    it('still provides companyTotalWorkerCount from inner hook', () => {
      mockUseWorkerCount.mockReturnValue({
        ...mockWorkerCountResult,
        companyTotalWorkerCount: 75,
      });

      const { result } = renderHook(() => useWizardPolicyWorkerCount(), {
        wrapper: createWrapper(),
      });

      expect(result.current.companyTotalWorkerCount).toBe(75);
    });
  });

  describe('edit mode (wizardEditMode = true)', () => {
    const groupAssignment = {
      id: 'a-1',
      entityType: 'group' as const,
      entityId: 'g-1',
      entityName: 'Group 1',
    };

    beforeEach(() => {
      store.dispatch(setWizardEditMode(true));
      store.dispatch(
        updatePolicyFormData({ policyAssignments: [groupAssignment] }),
      );
    });

    it('clean edit: delegates to assignment-based hook count', () => {
      mockUseWorkerCount.mockReturnValue({
        ...mockWorkerCountResult,
        totalWorkerCount: 12,
        hasNoAssignments: false,
      });

      const { result } = renderHook(() => useWizardPolicyWorkerCount(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(12);
      expect(result.current.isDirty).toBe(false);
    });

    it('dirty edit: uses policyMemberIds count', () => {
      store.dispatch(setAssignmentsDirty(true));
      store.dispatch(setPolicyMemberIds(['m-1', 'm-2']));

      const { result } = renderHook(() => useWizardPolicyWorkerCount(), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalWorkerCount).toBe(2);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('skip option', () => {
    it('returns loading=false when skip=true regardless of inner hook', () => {
      mockUseWorkerCount.mockReturnValue({
        ...mockWorkerCountResult,
        loading: true,
      });

      const { result } = renderHook(
        () => useWizardPolicyWorkerCount({ skip: true }),
        { wrapper: createWrapper() },
      );

      expect(result.current.loading).toBe(false);
    });
  });
});
