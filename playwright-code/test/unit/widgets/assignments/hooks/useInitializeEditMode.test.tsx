/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook } from '@testing-library/react-hooks';
import { act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { buildSandbox } from '@payroll/quicksand';
import React from 'react';
import { useInitializeEditMode } from 'src/js/widgets/assignments/hooks/useInitializeEditMode';
import { GroupDrawerView } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';

// Mock hooks
jest.mock('src/js/service/hooks/groups/useGetGroupManagers');
jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers');
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(),
}));

const { useSandbox } = require('@payroll/quicksand');
const {
  useGetGroupManagers,
} = require('src/js/service/hooks/groups/useGetGroupManagers');
const {
  useTimeTrackingWorkers,
} = require('src/js/service/hooks/groups/useTimeTrackingWorkers');

describe('useInitializeEditMode', () => {
  let store: ReturnType<typeof configureStore>;
  let mockSandbox: any;
  let mockLoadManagers: jest.Mock;
  let mockLoadWorkers: jest.Mock;
  let mockFetchMoreManagers: jest.Mock;

  const mockManagers = [
    {
      id: 'manager-1',
      displayName: 'Manager One',
      type: 'Employee',
      firstName: 'Manager',
      lastName: 'One',
      isActive: true,
    },
    {
      id: 'manager-2',
      displayName: 'Manager Two',
      type: 'Employee',
      firstName: 'Manager',
      lastName: 'Two',
      isActive: true,
    },
  ];

  const mockCompanyWorkers = [
    {
      id: 'worker-1',
      displayName: 'Worker One',
      type: 'Employee',
      firstName: 'Worker',
      lastName: 'One',
      isActive: true,
    },
    {
      id: 'worker-2',
      displayName: 'Worker Two',
      type: 'Vendor',
      firstName: 'Worker',
      lastName: 'Two',
      isActive: true,
    },
  ];

  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
      preloadedState: {
        workersGroupView: {
          currentGroupId: 'group-1',
          groups: [],
          groupsLoading: false,
          groupsError: null,
          drawerWorkers: {
            byId: {},
            allIds: [],
          },
          selectedMembers: {},
          initialMembers: {},
          currentMemberWorkers: [],
          selectedLeads: {},
          initialLeads: {},
          currentLeadWorkers: [],
        } as any,
      },
    });

    // Mock sandbox
    mockSandbox = buildSandbox();
    mockSandbox.logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    useSandbox.mockReturnValue(mockSandbox);

    // Mock functions
    mockLoadManagers = jest.fn();
    mockLoadWorkers = jest.fn();
    mockFetchMoreManagers = jest.fn();

    // Mock useGetGroupManagers hook
    useGetGroupManagers.mockReturnValue({
      loadManagers: mockLoadManagers,
      managers: [],
      pageInfo: { hasNextPage: false },
      fetchMore: mockFetchMoreManagers,
    });

    // Mock useTimeTrackingWorkers hook
    useTimeTrackingWorkers.mockReturnValue({
      loadWorkers: mockLoadWorkers,
      workers: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should not fetch on mount if mode is create', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'create',
            undefined,
            true,
            0,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      expect(mockLoadManagers).not.toHaveBeenCalled();
    });

    it('should not fetch on mount if drawer is closed', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            false,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      expect(mockLoadManagers).not.toHaveBeenCalled();
    });

    it('should not fetch if view is not AssignLeads', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      expect(mockLoadManagers).not.toHaveBeenCalled();
    });

    it('should not fetch if groupId is undefined', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            undefined,
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      expect(mockLoadManagers).not.toHaveBeenCalled();
    });

    it('should clear drawer data on mount in edit mode', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fresh component mount'),
        expect.any(Object),
      );
    });
  });

  describe('Manager Fetching', () => {
    it('should fetch managers when all conditions are met', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 5,
        });
      });
    });

    it('should fetch managers with string view value assign-leads', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () => useInitializeEditMode('edit', 'group-1', true, 5, 'assign-leads'),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 5,
        });
      });
    });

    it('should fetch default 100 managers when managerCount is not provided', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            undefined,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 100,
        });
      });
    });

    it('should dispatch empty array and load workers when managerCount is 0', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            0,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadManagers).not.toHaveBeenCalled();
        expect(mockLoadWorkers).toHaveBeenCalledWith({
          first: 100,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        });
      });
    });
  });

  describe('Manager Processing', () => {
    it('should process managers when loaded and call loadWorkers with isActive filter', async () => {
      // Setup managers to return data
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadWorkers).toHaveBeenCalledWith({
          first: 100,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        });
      });
    });

    it('should fetch more managers when hasNextPage and not all loaded', async () => {
      // Setup managers with pagination
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: [mockManagers[0]],
        pageInfo: { hasNextPage: true },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockFetchMoreManagers).toHaveBeenCalled();
      });
    });

    it('should stop fetching if manager count becomes stuck', async () => {
      // Simulate stuck count
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: [mockManagers[0]], // Only 1 manager
        pageInfo: { hasNextPage: true },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      // Render with expected count of 5
      const { rerender } = renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockFetchMoreManagers).toHaveBeenCalled();
      });
    });
  });

  describe('Company Workers Processing', () => {
    it('should filter out already-selected managers from company workers', async () => {
      // Setup with managers and company workers
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers: [...mockManagers, ...mockCompanyWorkers], // Includes managers
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      // Should load workers with isActive filter
      await waitFor(() => {
        expect(mockLoadWorkers).toHaveBeenCalledWith({
          first: 100,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        });
      });
    });
  });

  describe('Drawer Close/Reopen', () => {
    it('should reset initialization when drawer closes', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { rerender } = renderHook(
        ({ open }) =>
          useInitializeEditMode(
            'edit',
            'group-1',
            open,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper, initialProps: { open: true } },
      );

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalled();
      });

      // Close drawer
      rerender({ open: false });

      // Clear mocks
      mockLoadManagers.mockClear();

      // Reopen drawer
      rerender({ open: true });

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalled();
      });
    });
  });

  describe('Group ID Change Detection', () => {
    it('should reset fetch tracker when groupId changes', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      const { rerender } = renderHook(
        ({ groupId }) =>
          useInitializeEditMode(
            'edit',
            groupId,
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper, initialProps: { groupId: 'group-1' } },
      );

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalled();
      });

      // Clear mocks
      mockLoadManagers.mockClear();

      // Change to new group
      rerender({ groupId: 'group-2' });

      await waitFor(() => {
        expect(mockLoadManagers).toHaveBeenCalledWith({
          groupId: 'group-2',
          first: 5,
        });
      });
    });
  });

  describe('Redux State Updates', () => {
    it('should dispatch setSelectedLeads after managers are processed', async () => {
      // Setup managers
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(Object.keys(state.workersGroupView.selectedLeads)).toHaveLength(
          2,
        );
      });
    });

    it('should dispatch setInitialLeads for comparison', async () => {
      // Setup managers
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(Object.keys(state.workersGroupView.initialLeads)).toHaveLength(
          2,
        );
      });
    });

    it('should dispatch setCurrentLeadWorkers', async () => {
      // Setup managers
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(state.workersGroupView.currentLeadWorkers).toHaveLength(2);
      });
    });

    it('should dispatch addDrawerWorkers with managers marked as selected', async () => {
      // Setup managers
      useGetGroupManagers.mockReturnValue({
        loadManagers: mockLoadManagers,
        managers: mockManagers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreManagers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditMode(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        const drawerWorker =
          state.workersGroupView.drawerWorkers.byId['manager-1'];
        expect(drawerWorker).toBeDefined();
        expect(drawerWorker.isSelected).toBe(true);
      });
    });
  });
});
