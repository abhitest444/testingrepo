import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { usePolicyWorkerSelectionAdapter } from 'src/js/widgets/qbtOrchestrator/features/overtime/hooks/usePolicyWorkerSelectionAdapter';
import { createQbtOrchestratorStore } from 'test/unit/testUtils';
import type { SelectableWorker } from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable.types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

describe('usePolicyWorkerSelectionAdapter', () => {
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  const createMockWorker = (id: string): SelectableWorker => ({
    id,
    type: TimeTracking_TimeForType.Employee,
    isActive: true,
    firstName: `First-${id}`,
    lastName: `Last-${id}`,
    displayName: `Worker ${id}`,
    memberOfGroup: null,
  });

  const mockWorkers: SelectableWorker[] = [
    createMockWorker('worker-1'),
    createMockWorker('worker-2'),
    createMockWorker('worker-3'),
  ];

  const createWrapper = () => {
    const Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    return Wrapper;
  };

  beforeEach(() => {
    store = createQbtOrchestratorStore();
  });

  describe('create mode (no policyId)', () => {
    it('initializes with empty selection in create mode', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.isEditMode).toBe(false);
    });

    it('updates selection when onSelectionChange is called', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionChange('worker-1', true);
      });

      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });

    it('removes worker when onSelectionChange is called with false', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionChange('worker-1', true);
        result.current.onSelectionChange('worker-2', true);
      });

      act(() => {
        result.current.onSelectionChange('worker-1', false);
      });

      expect(result.current.selectedIds.has('worker-1')).toBe(false);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedCount).toBe(1);
    });
  });

  describe('edit mode (with policyId)', () => {
    it('indicates edit mode when policyId is provided', () => {
      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isEditMode).toBe(true);
    });

    it('syncs initial worker IDs from initialWorkerIds prop in edit mode', () => {
      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
            initialWorkerIds: ['worker-1', 'worker-2'],
          }),
        { wrapper: createWrapper() },
      );

      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedCount).toBe(2);
    });

    it('only syncs initial IDs once to prevent loops', () => {
      const { result, rerender } = renderHook(
        (props: {
          workers: SelectableWorker[];
          policyId: string;
          initialWorkerIds: string[];
        }) => usePolicyWorkerSelectionAdapter(props),
        {
          wrapper: createWrapper(),
          initialProps: {
            workers: mockWorkers,
            policyId: 'policy-123',
            initialWorkerIds: ['worker-1'],
          },
        },
      );

      // Initially synced
      expect(result.current.selectedCount).toBe(1);

      // Add another worker manually
      act(() => {
        result.current.onSelectionChange('worker-2', true);
      });

      expect(result.current.selectedCount).toBe(2);

      // Re-render with same initialWorkerIds - should NOT reset selection
      rerender({
        workers: mockWorkers,
        policyId: 'policy-123',
        initialWorkerIds: ['worker-1'],
      });

      expect(result.current.selectedCount).toBe(2); // Should stay at 2
    });
  });

  describe('selection state', () => {
    it('returns allSelected true when all visible workers are selected', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(true);
      });

      expect(result.current.allSelected).toBe(true);
      expect(result.current.someSelected).toBe(false);
    });

    it('returns someSelected true when some (but not all) workers are selected', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionChange('worker-1', true);
        result.current.onSelectionChange('worker-2', true);
      });

      // 2 out of 3 workers selected
      expect(result.current.allSelected).toBe(false);
      expect(result.current.someSelected).toBe(true);
    });

    it('returns both false when no workers are selected', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      expect(result.current.allSelected).toBe(false);
      expect(result.current.someSelected).toBe(false);
    });
  });

  describe('onSelectAllChange', () => {
    it('selects all workers when called with true', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(true);
      });

      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedIds.has('worker-3')).toBe(true);
      expect(result.current.selectedCount).toBe(3);
    });

    it('deselects all workers on current page when called with false', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      // First select all
      act(() => {
        result.current.onSelectAllChange(true);
      });

      // Then deselect all
      act(() => {
        result.current.onSelectAllChange(false);
      });

      expect(result.current.selectedCount).toBe(0);
    });

    it('preserves selections from other pages when selecting all on current page', () => {
      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
            initialWorkerIds: ['other-page-worker'],
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(true);
      });

      // Should have all 3 current workers + 1 from other page
      expect(result.current.selectedCount).toBe(4);
      expect(result.current.selectedIds.has('other-page-worker')).toBe(true);
    });

    it('preserves selections from other pages when deselecting all on current page', () => {
      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
            initialWorkerIds: ['other-page-worker', 'worker-1', 'worker-2'],
          }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(false);
      });

      // Should only have the other page worker remaining
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.selectedIds.has('other-page-worker')).toBe(true);
      expect(result.current.selectedIds.has('worker-1')).toBe(false);
    });
  });

  describe('dispatches Redux actions', () => {
    it('dispatches setPolicyMemberIds when selection changes', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionChange('worker-1', true);
      });

      // Verify Redux state was updated
      const state = store.getState() as any;
      expect(state.overtime.policyFormData.policyMemberIds).toContain(
        'worker-1',
      );
    });

    it('dispatches setPolicyMemberIds when selectAll is called', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(true);
      });

      // Verify Redux state was updated
      const state = store.getState() as any;
      expect(state.overtime.policyFormData.policyMemberIds.length).toBe(3);
    });

    it('dispatches setAssignmentsDirty when selection changes', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectionChange('worker-1', true);
      });

      // Verify assignmentsDirty was set to true
      const state = store.getState() as any;
      expect(state.overtime.policyFormData.assignmentsDirty).toBe(true);
    });

    it('dispatches setAssignmentsDirty when selectAll is called', () => {
      const { result } = renderHook(
        () => usePolicyWorkerSelectionAdapter({ workers: mockWorkers }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.onSelectAllChange(true);
      });

      // Verify assignmentsDirty was set to true
      const state = store.getState() as any;
      expect(state.overtime.policyFormData.assignmentsDirty).toBe(true);
    });
  });

  describe('group and all assignment resolution', () => {
    const createWorkerWithGroup = (
      id: string,
      groupId: string,
    ): SelectableWorker => ({
      ...createMockWorker(id),
      memberOfGroup: { id: groupId, name: `Group ${groupId}`, isActive: true },
    });

    it('also updates initialMemberIds in Redux when resolving group assignments', () => {
      const workersWithGroups = [
        createWorkerWithGroup('worker-1', 'group-abc'),
        createWorkerWithGroup('worker-2', 'group-abc'),
        createMockWorker('worker-3'),
      ];

      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'group',
                entityId: 'group-abc',
                entityName: 'Group ABC',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: workersWithGroups,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // initialMemberIds should be updated to include the resolved group workers
      const state = store.getState() as any;
      expect(state.overtime.initialMemberIds).toContain('worker-1');
      expect(state.overtime.initialMemberIds).toContain('worker-2');
      expect(state.overtime.initialMemberIds).not.toContain('worker-3');
    });

    it('also updates initialMemberIds in Redux when resolving all-type assignments', () => {
      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'all',
                entityId: 'all',
                entityName: 'All Workers',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // All workers should appear in initialMemberIds
      const state = store.getState() as any;
      expect(state.overtime.initialMemberIds).toEqual(
        expect.arrayContaining(['worker-1', 'worker-2', 'worker-3']),
      );
    });

    it('resolves group assignments to worker IDs when workers are loaded', () => {
      const workersWithGroups = [
        createWorkerWithGroup('worker-1', 'group-abc'),
        createWorkerWithGroup('worker-2', 'group-abc'),
        createMockWorker('worker-3'), // no group
      ];

      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'group',
                entityId: 'group-abc',
                entityName: 'Group ABC',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: workersWithGroups,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // Workers belonging to group-abc should be selected
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      // Worker without the group should not be selected
      expect(result.current.selectedIds.has('worker-3')).toBe(false);
    });

    it('resolves all-type assignments to select all workers', () => {
      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'all',
                entityId: 'all',
                entityName: 'All Workers',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // All workers should be selected
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedIds.has('worker-3')).toBe(true);
      expect(result.current.selectedCount).toBe(3);
    });

    it('does not re-resolve group assignments after resolving once', () => {
      const workersWithGroups = [
        createWorkerWithGroup('worker-1', 'group-abc'),
        createWorkerWithGroup('worker-2', 'group-abc'),
      ];

      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'group',
                entityId: 'group-abc',
                entityName: 'Group ABC',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result, rerender } = renderHook(
        (props: { workers: SelectableWorker[]; policyId: string }) =>
          usePolicyWorkerSelectionAdapter(props),
        {
          wrapper: createWrapper(),
          initialProps: { workers: workersWithGroups, policyId: 'policy-123' },
        },
      );

      // Initial resolution done
      expect(result.current.selectedCount).toBe(2);

      // Deselect worker-1 manually
      act(() => {
        result.current.onSelectionChange('worker-1', false);
      });

      expect(result.current.selectedCount).toBe(1);

      // Re-render - should not re-resolve assignments (hasResolvedAssignments stays true)
      rerender({ workers: workersWithGroups, policyId: 'policy-123' });

      expect(result.current.selectedCount).toBe(1);
    });

    it('skips resolution when only user-type assignments exist', () => {
      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'user',
                entityId: 'worker-1',
                entityName: 'Worker 1',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: mockWorkers,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // Only user assignments - no dispatch from group/all resolution
      // worker-1 should NOT be selected since group/all resolution is skipped for user-only assignments
      expect(result.current.selectedCount).toBe(0);
    });

    it('merges resolved group worker IDs with existing Redux selections', () => {
      const workersWithGroups = [
        createWorkerWithGroup('worker-1', 'group-abc'),
        createWorkerWithGroup('worker-2', 'group-abc'),
        createMockWorker('worker-3'),
      ];

      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            // worker-3 already selected in Redux
            policyMemberIds: ['worker-3'],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'group',
                entityId: 'group-abc',
                entityName: 'Group ABC',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: workersWithGroups,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // All three should be selected: group resolved (1, 2) + existing (3)
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedIds.has('worker-3')).toBe(true);
    });

    it('does not add User Not Found user assignments when resolving mixed group+user policies', () => {
      const workersWithGroups = [
        createWorkerWithGroup('worker-1', 'group-abc'),
        createWorkerWithGroup('worker-2', 'group-abc'),
        createMockWorker('worker-3'),
      ];

      store = createQbtOrchestratorStore({
        overtime: {
          policyFormData: {
            id: 'policy-123',
            description: '',
            name: '',
            isDefault: false,
            overtimeRuleType: '',
            rules: [],
            policyMemberIds: [],
            policyAssignments: [
              {
                id: 'a1',
                entityType: 'group',
                entityId: 'group-abc',
                entityName: 'Group ABC',
              },
              {
                id: 'a2',
                entityType: 'user',
                entityId: 'user-orphan',
                entityName: 'User Not Found',
              },
            ],
            assignmentsDirty: false,
          },
        },
      });

      const { result } = renderHook(
        () =>
          usePolicyWorkerSelectionAdapter({
            workers: workersWithGroups,
            policyId: 'policy-123',
          }),
        { wrapper: createWrapper() },
      );

      // Group workers should be resolved and selected
      expect(result.current.selectedIds.has('worker-1')).toBe(true);
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      // Orphan user ID must NOT be added to the selection
      expect(result.current.selectedIds.has('user-orphan')).toBe(false);
      // Confirm selectedCount only counts valid resolved workers
      expect(result.current.selectedCount).toBe(2);
    });
  });

  describe('policyId change resets sync state', () => {
    it('re-syncs initial worker IDs when policyId changes to a new policy', () => {
      const { result, rerender } = renderHook(
        (props: {
          workers: SelectableWorker[];
          policyId: string;
          initialWorkerIds: string[];
        }) => usePolicyWorkerSelectionAdapter(props),
        {
          wrapper: createWrapper(),
          initialProps: {
            workers: mockWorkers,
            policyId: 'policy-A',
            initialWorkerIds: ['worker-1'],
          },
        },
      );

      // policy-A synced
      expect(result.current.selectedCount).toBe(1);
      expect(result.current.selectedIds.has('worker-1')).toBe(true);

      // Switch to a different policy
      rerender({
        workers: mockWorkers,
        policyId: 'policy-B',
        initialWorkerIds: ['worker-2', 'worker-3'],
      });

      // policy-B should now have worker-2 and worker-3 (plus worker-1 still in redux)
      expect(result.current.selectedIds.has('worker-2')).toBe(true);
      expect(result.current.selectedIds.has('worker-3')).toBe(true);
    });
  });
});
