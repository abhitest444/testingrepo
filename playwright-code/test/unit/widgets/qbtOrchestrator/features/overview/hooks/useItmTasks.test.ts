import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { MockQuicksandProvider } from '@payroll/quicksand';
import { LoggingConfigProvider } from 'src/js/providers/LoggingConfigProvider';
import { useUpdateItmTask } from 'src/js/widgets/qbtOrchestrator/features/overview/hooks/useUpdateItmTask';
import { useGetItmTasks } from 'src/js/widgets/qbtOrchestrator/features/overview/hooks/useGetItmTasks';
import { storeManager } from 'src/js/widgets/qbtOrchestrator/store/storeManager';
import { overviewReducer } from 'src/js/widgets/qbtOrchestrator/features/overview/store';
import { getDefaultSandbox } from 'test/unit/testUtils';

// Mocks
const mockMutation = jest.fn();
const mockQuery = jest.fn();

jest.mock('src/__generated__/oigql/graphql', () => ({
  useTaskManagementUpdateTaskMutation: () => [mockMutation],
  useTaskManagementTasksLazyQuery: () => [mockQuery],
}));

jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
  TimeCustomerInteraction: {
    ITM_TASK_UPDATE: 'itm-task-update',
    ITM_TASKS_READ: 'itm-tasks-read',
  },
}));

// Setup
const sandbox = getDefaultSandbox();

const createWrapper = () => {
  /* eslint-disable react/no-children-prop */
  const Wrapper = ({ children }: { children?: React.ReactNode }) => {
    const loggingProvider = React.createElement(LoggingConfigProvider, {
      sandbox,
      prefix: 'test',
      children,
    });
    return React.createElement(MockQuicksandProvider, {
      sandbox,
      children: loggingProvider,
    });
  };
  /* eslint-enable react/no-children-prop */
  return Wrapper;
};

describe('ITM Tasks Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeManager.resetAsyncReducers();
    storeManager.inject('overview', overviewReducer);
  });

  describe('useUpdateItmTask', () => {
    it('returns success on successful mutation', async () => {
      mockMutation.mockResolvedValueOnce({
        data: {
          taskManagementUpdateTask: {
            success: true,
            message: 'Task updated',
            code: 'SUCCESS',
            task: { id: 123, name: 'Test Task' },
          },
        },
      });

      const { result } = renderHook(() => useUpdateItmTask(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateItmTask({
          id: 123,
          status: 'DoneYes',
        });
      });

      expect(response.success).toBe(true);
      expect(response.task).toEqual({ id: 123, name: 'Test Task' });
    });

    it('returns failure on mutation error', async () => {
      mockMutation.mockResolvedValueOnce({
        data: {
          taskManagementUpdateTask: {
            success: false,
            message: 'Update failed',
            code: 'ERROR',
          },
        },
      });

      const { result } = renderHook(() => useUpdateItmTask(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateItmTask({
          id: 123,
          status: 'DoneYes',
        });
      });

      expect(response.success).toBe(false);
      expect(response.message).toBe('Update failed');
    });

    it('handles exception gracefully', async () => {
      mockMutation.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUpdateItmTask(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.updateItmTask({
          id: 123,
          status: 'DoneYes',
        });
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('EXCEPTION');
    });
  });

  describe('useGetItmTasks', () => {
    it('fetches and stores tasks on success', async () => {
      mockQuery.mockResolvedValueOnce({
        data: {
          taskManagementTasks: {
            nodes: [
              {
                id: 1,
                name: 'Task 1',
                status: 'Open',
                type: 'time-lunch-breaks',
              },
              {
                id: 2,
                name: 'Task 2',
                status: 'DoneYes',
                type: 'time-assign-team',
              },
            ],
          },
        },
      });

      const { result } = renderHook(() => useGetItmTasks(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.getItmTasks();
      });

      expect(response.success).toBe(true);
      expect(response.tasks).toHaveLength(2);
      expect(result.current.tasks).toHaveLength(2);
    });

    it('handles fetch error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useGetItmTasks(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.getItmTasks();
      });

      expect(response.success).toBe(false);
      expect(response.tasks).toHaveLength(0);
    });

    it('handles empty response', async () => {
      mockQuery.mockResolvedValueOnce({
        data: { taskManagementTasks: { nodes: [] } },
      });

      const { result } = renderHook(() => useGetItmTasks(), {
        wrapper: createWrapper(),
      });

      let response: any;
      await act(async () => {
        response = await result.current.getItmTasks();
      });

      expect(response.success).toBe(true);
      expect(response.tasks).toHaveLength(0);
    });
  });
});
