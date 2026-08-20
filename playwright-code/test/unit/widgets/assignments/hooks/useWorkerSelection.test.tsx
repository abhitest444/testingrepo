/* eslint-disable camelcase */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useWorkerSelection } from 'src/js/widgets/assignments/hooks/useWorkerSelection';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import {
  TimeTracking_TimeForType,
  TimeTracking_TimeForInput,
} from 'src/__generated__/timeTracking/graphql';
import { WorkerSelectionMode } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

describe('useWorkerSelection', () => {
  const mockWorkers = [
    {
      id: 'worker1',
      type: TimeTracking_TimeForType.Employee,
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      isActive: true,
    },
    {
      id: 'worker2',
      type: TimeTracking_TimeForType.Employee,
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      isActive: true,
    },
    {
      id: 'worker3',
      type: TimeTracking_TimeForType.Employee,
      firstName: 'Bob',
      lastName: 'Johnson',
      displayName: 'Bob Johnson',
      isActive: true,
    },
  ];

  const createStore = (preloadedState?: any) =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
      preloadedState,
    });

  const wrapper = ({ children, store = createStore() }: any) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('EDIT Mode - Using drawerWorkers', () => {
    describe('isWorkerSelected', () => {
      test.each([
        {
          description: 'should return true for selected worker in edit mode',
          drawerWorkersById: {
            worker1: { id: 'worker1', isSelected: true },
            worker2: { id: 'worker2', isSelected: false },
          },
          workerId: 'worker1',
          expected: true,
        },
        {
          description: 'should return false for unselected worker in edit mode',
          drawerWorkersById: { worker1: { id: 'worker1', isSelected: false } },
          workerId: 'worker1',
          expected: false,
        },
        {
          description:
            'should return false for non-existent worker in edit mode',
          drawerWorkersById: {},
          workerId: 'nonExistent',
          expected: false,
        },
      ])('$description', ({ drawerWorkersById, workerId, expected }) => {
        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById,
              selectedEntities: {},
            }),
          { wrapper },
        );

        expect(result.current.isWorkerSelected(workerId)).toBe(expected);
      });
    });

    describe('updateWorkerSelection', () => {
      it('should toggle worker selection in edit mode', () => {
        const store = createStore({
          workersGroupView: {
            drawerWorkers: {
              byId: {
                worker1: { id: 'worker1', isSelected: false },
              },
              allIds: ['worker1'],
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById:
                store.getState().workersGroupView.drawerWorkers.byId,
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.updateWorkerSelection(
            'worker1',
            TimeTracking_TimeForType.Employee,
          );
        });

        const state = store.getState();
        expect(
          state.workersGroupView.drawerWorkers.byId.worker1?.isSelected,
        ).toBe(true);
      });
    });

    describe('handleSelectAll', () => {
      it('should select all workers on current page in edit mode', () => {
        const store = createStore({
          workersGroupView: {
            drawerWorkers: {
              byId: {
                worker1: { id: 'worker1', isSelected: false },
                worker2: { id: 'worker2', isSelected: false },
                worker3: { id: 'worker3', isSelected: false },
              },
              allIds: ['worker1', 'worker2', 'worker3'],
            },
          } as any,
        });

        const { result, rerender } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById:
                store.getState().workersGroupView.drawerWorkers.byId,
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(true);
        });

        rerender();

        const state = store.getState();
        expect(
          state.workersGroupView.drawerWorkers.byId.worker1?.isSelected,
        ).toBe(true);
        expect(
          state.workersGroupView.drawerWorkers.byId.worker2?.isSelected,
        ).toBe(true);
        expect(
          state.workersGroupView.drawerWorkers.byId.worker3?.isSelected,
        ).toBe(true);
      });

      it('should deselect all workers on current page in edit mode', () => {
        const store = createStore({
          workersGroupView: {
            drawerWorkers: {
              byId: {
                worker1: { id: 'worker1', isSelected: true },
                worker2: { id: 'worker2', isSelected: true },
                worker3: { id: 'worker3', isSelected: true },
              },
              allIds: ['worker1', 'worker2', 'worker3'],
            },
          } as any,
        });

        const { result, rerender } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById:
                store.getState().workersGroupView.drawerWorkers.byId,
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(false);
        });

        rerender();

        const state = store.getState();
        expect(
          state.workersGroupView.drawerWorkers.byId.worker1?.isSelected,
        ).toBe(false);
        expect(
          state.workersGroupView.drawerWorkers.byId.worker2?.isSelected,
        ).toBe(false);
        expect(
          state.workersGroupView.drawerWorkers.byId.worker3?.isSelected,
        ).toBe(false);
      });

      it('should not toggle already selected workers when selecting all', () => {
        const store = createStore({
          workersGroupView: {
            drawerWorkers: {
              byId: {
                worker1: { id: 'worker1', isSelected: true },
                worker2: { id: 'worker2', isSelected: false },
              },
              allIds: ['worker1', 'worker2'],
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers.slice(0, 2),
              drawerWorkersById:
                store.getState().workersGroupView.drawerWorkers.byId,
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(true);
        });

        const state = store.getState();
        // worker1 should remain selected
        expect(
          state.workersGroupView.drawerWorkers.byId.worker1?.isSelected,
        ).toBe(true);
        // worker2 should now be selected
        expect(
          state.workersGroupView.drawerWorkers.byId.worker2?.isSelected,
        ).toBe(true);
      });
    });
  });

  describe('CREATE Mode - Using selectedMembers/selectedLeads', () => {
    describe('isWorkerSelected', () => {
      it('should return true for selected worker in create mode', () => {
        const selectedEntities = {
          worker1: {
            id: 'worker1',
            timeForType: TimeTracking_TimeForType.Employee,
          },
        };

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities,
            }),
          { wrapper },
        );

        expect(result.current.isWorkerSelected('worker1')).toBe(true);
      });

      it('should return false for unselected worker in create mode', () => {
        const selectedEntities = {};

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities,
            }),
          { wrapper },
        );

        expect(result.current.isWorkerSelected('worker1')).toBe(false);
      });
    });

    describe('updateWorkerSelection - Workers Mode', () => {
      it('should toggle member selection in create mode', () => {
        const store = createStore({
          workersGroupView: {
            selectedMembers: {},
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.updateWorkerSelection(
            'worker1',
            TimeTracking_TimeForType.Employee,
          );
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker1',
        );
      });

      it('should remove member when toggling off', () => {
        const store = createStore({
          workersGroupView: {
            selectedMembers: {
              worker1: {
                id: 'worker1',
                timeForType: TimeTracking_TimeForType.Employee,
              },
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities:
                store.getState().workersGroupView.selectedMembers,
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.updateWorkerSelection(
            'worker1',
            TimeTracking_TimeForType.Employee,
          );
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedMembers).not.toHaveProperty(
          'worker1',
        );
      });
    });

    describe('updateWorkerSelection - Leads Mode', () => {
      it('should toggle lead selection in create mode', () => {
        const store = createStore({
          workersGroupView: {
            selectedLeads: {},
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Leads,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.updateWorkerSelection(
            'worker1',
            TimeTracking_TimeForType.Employee,
          );
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedLeads).toHaveProperty('worker1');
      });
    });

    describe('handleSelectAll - Workers Mode', () => {
      it('should select all workers on current page in create mode', () => {
        const store = createStore({
          workersGroupView: {
            selectedMembers: {},
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(true);
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker1',
        );
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker2',
        );
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker3',
        );
      });

      it('should merge with existing selections when selecting all', () => {
        const store = createStore({
          workersGroupView: {
            selectedMembers: {
              existingWorker: {
                id: 'existingWorker',
                timeForType: TimeTracking_TimeForType.Employee,
              },
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities:
                store.getState().workersGroupView.selectedMembers,
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(true);
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'existingWorker',
        );
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker1',
        );
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'worker2',
        );
      });

      it('should deselect only current page workers when deselecting all', () => {
        const store = createStore({
          workersGroupView: {
            selectedMembers: {
              worker1: {
                id: 'worker1',
                timeForType: TimeTracking_TimeForType.Employee,
              },
              worker2: {
                id: 'worker2',
                timeForType: TimeTracking_TimeForType.Employee,
              },
              otherPageWorker: {
                id: 'otherPageWorker',
                timeForType: TimeTracking_TimeForType.Employee,
              },
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Workers,
              workers: mockWorkers.slice(0, 2), // Only worker1 and worker2 on current page
              drawerWorkersById: {},
              selectedEntities:
                store.getState().workersGroupView.selectedMembers,
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(false);
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedMembers).not.toHaveProperty(
          'worker1',
        );
        expect(state.workersGroupView.selectedMembers).not.toHaveProperty(
          'worker2',
        );
        expect(state.workersGroupView.selectedMembers).toHaveProperty(
          'otherPageWorker',
        );
      });
    });

    describe('handleSelectAll - Leads Mode', () => {
      it('should select all leads on current page in create mode', () => {
        const store = createStore({
          workersGroupView: {
            selectedLeads: {},
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Leads,
              workers: mockWorkers,
              drawerWorkersById: {},
              selectedEntities: {},
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(true);
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedLeads).toHaveProperty('worker1');
        expect(state.workersGroupView.selectedLeads).toHaveProperty('worker2');
        expect(state.workersGroupView.selectedLeads).toHaveProperty('worker3');
      });

      it('should deselect all leads on current page in create mode', () => {
        const store = createStore({
          workersGroupView: {
            selectedLeads: {
              worker1: {
                id: 'worker1',
                timeForType: TimeTracking_TimeForType.Employee,
              },
              worker2: {
                id: 'worker2',
                timeForType: TimeTracking_TimeForType.Employee,
              },
            },
          } as any,
        });

        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: false,
              mode: WorkerSelectionMode.Leads,
              workers: mockWorkers.slice(0, 2),
              drawerWorkersById: {},
              selectedEntities: store.getState().workersGroupView.selectedLeads,
            }),
          {
            wrapper: ({ children }: any) => (
              <Provider store={store}>{children}</Provider>
            ),
          },
        );

        act(() => {
          result.current.handleSelectAll(false);
        });

        const state = store.getState();
        expect(state.workersGroupView.selectedLeads).not.toHaveProperty(
          'worker1',
        );
        expect(state.workersGroupView.selectedLeads).not.toHaveProperty(
          'worker2',
        );
      });
    });
  });

  describe('Selection State - allSelected and someSelected', () => {
    test.each([
      {
        description:
          'should return allSelected=true when all workers are selected',
        workers: mockWorkers,
        drawerWorkersById: {
          worker1: { id: 'worker1', isSelected: true },
          worker2: { id: 'worker2', isSelected: true },
          worker3: { id: 'worker3', isSelected: true },
        },
        expectedAllSelected: true,
        expectedSomeSelected: false,
      },
      {
        description:
          'should return someSelected=true when some workers are selected',
        workers: mockWorkers,
        drawerWorkersById: {
          worker1: { id: 'worker1', isSelected: true },
          worker2: { id: 'worker2', isSelected: false },
          worker3: { id: 'worker3', isSelected: false },
        },
        expectedAllSelected: false,
        expectedSomeSelected: true,
      },
      {
        description:
          'should return allSelected=false and someSelected=false when no workers selected',
        workers: mockWorkers,
        drawerWorkersById: {
          worker1: { id: 'worker1', isSelected: false },
          worker2: { id: 'worker2', isSelected: false },
          worker3: { id: 'worker3', isSelected: false },
        },
        expectedAllSelected: false,
        expectedSomeSelected: false,
      },
      {
        description:
          'should return allSelected=false when workers array is empty',
        workers: [] as typeof mockWorkers,
        drawerWorkersById: {},
        expectedAllSelected: false,
        expectedSomeSelected: false,
      },
    ])(
      '$description',
      ({
        workers,
        drawerWorkersById,
        expectedAllSelected,
        expectedSomeSelected,
      }) => {
        const { result } = renderHook(
          () =>
            useWorkerSelection({
              isEditMode: true,
              mode: WorkerSelectionMode.Workers,
              workers,
              drawerWorkersById,
              selectedEntities: {},
            }),
          { wrapper },
        );

        expect(result.current.allSelected).toBe(expectedAllSelected);
        expect(result.current.someSelected).toBe(expectedSomeSelected);
      },
    );
  });

  describe('Edge Cases', () => {
    it('should handle empty workers array', () => {
      const { result } = renderHook(
        () =>
          useWorkerSelection({
            isEditMode: true,
            mode: WorkerSelectionMode.Workers,
            workers: [],
            drawerWorkersById: {},
            selectedEntities: {},
          }),
        { wrapper },
      );

      expect(result.current.allSelected).toBe(false);
      expect(result.current.someSelected).toBe(false);
    });

    it('should handle empty drawerWorkersById', () => {
      const { result } = renderHook(
        () =>
          useWorkerSelection({
            isEditMode: true,
            mode: WorkerSelectionMode.Workers,
            workers: mockWorkers,
            drawerWorkersById: {},
            selectedEntities: {},
          }),
        { wrapper },
      );

      expect(result.current.isWorkerSelected('worker1')).toBe(false);
    });

    it('should handle empty selectedEntities', () => {
      const { result } = renderHook(
        () =>
          useWorkerSelection({
            isEditMode: false,
            mode: WorkerSelectionMode.Workers,
            workers: mockWorkers,
            drawerWorkersById: {},
            selectedEntities: {},
          }),
        { wrapper },
      );

      expect(result.current.isWorkerSelected('worker1')).toBe(false);
    });

    it('should handle switching between edit and create modes', () => {
      const { result, rerender } = renderHook(
        ({ isEditMode }) =>
          useWorkerSelection({
            isEditMode,
            mode: WorkerSelectionMode.Workers,
            workers: mockWorkers,
            drawerWorkersById: {
              worker1: { id: 'worker1', isSelected: true },
            },
            selectedEntities: {
              worker2: {
                id: 'worker2',
                timeForType: TimeTracking_TimeForType.Employee,
              },
            },
          }),
        { wrapper, initialProps: { isEditMode: true } },
      );

      // In edit mode, worker1 is selected via drawerWorkers
      expect(result.current.isWorkerSelected('worker1')).toBe(true);
      expect(result.current.isWorkerSelected('worker2')).toBe(false);

      // Switch to create mode
      rerender({ isEditMode: false });

      // In create mode, worker2 is selected via selectedEntities
      expect(result.current.isWorkerSelected('worker1')).toBe(false);
      expect(result.current.isWorkerSelected('worker2')).toBe(true);
    });
  });
});
