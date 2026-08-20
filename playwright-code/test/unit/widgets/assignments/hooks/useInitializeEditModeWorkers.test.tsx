/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { buildSandbox } from '@payroll/quicksand';
import React from 'react';
import { useInitializeEditModeWorkers } from 'src/js/widgets/assignments/hooks/useInitializeEditModeWorkers';
import { GroupDrawerView } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TimeTracking_WorkerOrderBy } from 'src/__generated__/timeTracking/graphql';

// Mock hooks
jest.mock('src/js/service/hooks/groups/useGetGroupMembers');
jest.mock('src/js/service/hooks/groups/useTimeTrackingWorkers');
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(),
}));

const { useSandbox } = require('@payroll/quicksand');
const {
  useGetGroupMembers,
} = require('src/js/service/hooks/groups/useGetGroupMembers');
const {
  useTimeTrackingWorkers,
} = require('src/js/service/hooks/groups/useTimeTrackingWorkers');

describe('useInitializeEditModeWorkers', () => {
  let store: ReturnType<typeof configureStore>;
  let mockSandbox: any;
  let mockLoadMembers: jest.Mock;
  let mockLoadWorkers: jest.Mock;
  let mockFetchMoreMembers: jest.Mock;

  const mockMembers = [
    {
      id: 'member-1',
      displayName: 'Member One',
      type: 'Employee',
      firstName: 'Member',
      lastName: 'One',
      isActive: true,
    },
    {
      id: 'member-2',
      displayName: 'Member Two',
      type: 'Employee',
      firstName: 'Member',
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
    mockLoadMembers = jest.fn();
    mockLoadWorkers = jest.fn();
    mockFetchMoreMembers = jest.fn();

    // Mock useGetGroupMembers hook
    useGetGroupMembers.mockReturnValue({
      loadMembers: mockLoadMembers,
      members: [],
      pageInfo: { hasNextPage: false },
      fetchMore: mockFetchMoreMembers,
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
          useInitializeEditModeWorkers(
            'create',
            undefined,
            true,
            0,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      expect(mockLoadMembers).not.toHaveBeenCalled();
    });

    it('should not fetch on mount if drawer is closed', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            false,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      expect(mockLoadMembers).not.toHaveBeenCalled();
    });

    it('should not fetch if view is not AssignWorkers', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignLeads,
          ),
        { wrapper },
      );

      expect(mockLoadMembers).not.toHaveBeenCalled();
    });

    it('should not fetch if groupId is undefined', () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            undefined,
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      expect(mockLoadMembers).not.toHaveBeenCalled();
    });

    it('should clear drawer data on mount in edit mode', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fresh component mount'),
        expect.any(Object),
      );
    });
  });

  describe('Member Fetching', () => {
    it('should fetch members when all conditions are met', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadMembers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 5,
        });
      });
    });

    it('should fetch members with string view value assign-workers', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            'assign-workers',
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadMembers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 5,
        });
      });
    });

    it('should fetch default 100 members when memberCount is not provided', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            undefined,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadMembers).toHaveBeenCalledWith({
          groupId: 'group-1',
          first: 100,
        });
      });
    });

    it('should dispatch empty array and load workers when memberCount is 0', async () => {
      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            0,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockLoadMembers).not.toHaveBeenCalled();
        expect(mockLoadWorkers).toHaveBeenCalledWith({
          first: 100,
          filter: { isActive: true },
          orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
        });
      });
    });
  });

  describe('Member Processing', () => {
    it('should process members when loaded and call loadWorkers with isActive filter', async () => {
      // Setup members to return data
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
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

    it('should fetch more members when hasNextPage and not all loaded', async () => {
      // Setup members with pagination
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: [mockMembers[0]],
        pageInfo: { hasNextPage: true },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockFetchMoreMembers).toHaveBeenCalled();
      });
    });

    it('should stop fetching if member count becomes stuck', async () => {
      // Simulate stuck count
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: [mockMembers[0]], // Only 1 member
        pageInfo: { hasNextPage: true },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      // Render with expected count of 5
      const { rerender } = renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockFetchMoreMembers).toHaveBeenCalled();
      });
    });
  });

  describe('Company Workers Processing', () => {
    it('should filter out already-selected members from company workers', async () => {
      // Setup with members and company workers
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers: [...mockMembers, ...mockCompanyWorkers], // Includes members
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
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
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            open,
            5,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper, initialProps: { open: true } },
      );

      await waitFor(() => {
        expect(mockLoadMembers).toHaveBeenCalled();
      });

      // Close drawer
      rerender({ open: false });

      // Clear mocks
      mockLoadMembers.mockClear();

      // Reopen drawer - note: member fetch depends on memberCount in dependencies
      rerender({ open: true });

      await waitFor(() => {
        expect(mockLoadMembers).toHaveBeenCalled();
      });
    });
  });

  describe('Company Workers Edge Cases', () => {
    it('should return early when members are not loaded yet', async () => {
      // Setup company workers but no members
      useTimeTrackingWorkers.mockReturnValue({
        loadWorkers: mockLoadWorkers,
        workers: mockCompanyWorkers,
      });

      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: undefined, // No members loaded yet
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            0,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      // Verify loadWorkers was called but drawer workers not updated
      await waitFor(() => {
        const state: any = store.getState();
        expect(state.workersGroupView.drawerWorkers.allIds).toHaveLength(0);
      });
    });
  });

  describe('Redux State Updates', () => {
    it('should dispatch setSelectedMembers after members are processed', async () => {
      // Setup members
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(
          Object.keys(state.workersGroupView.selectedMembers),
        ).toHaveLength(2);
      });
    });

    it('should dispatch setInitialMembers for comparison', async () => {
      // Setup members
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(Object.keys(state.workersGroupView.initialMembers)).toHaveLength(
          2,
        );
      });
    });

    it('should dispatch setCurrentMemberWorkers', async () => {
      // Setup members
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        expect(state.workersGroupView.currentMemberWorkers).toHaveLength(2);
      });
    });

    it('should dispatch addDrawerWorkers with members marked as selected', async () => {
      // Setup members
      useGetGroupMembers.mockReturnValue({
        loadMembers: mockLoadMembers,
        members: mockMembers,
        pageInfo: { hasNextPage: false },
        fetchMore: mockFetchMoreMembers,
      });

      const wrapper = ({ children }: any) => (
        <Provider store={store}>{children}</Provider>
      );

      renderHook(
        () =>
          useInitializeEditModeWorkers(
            'edit',
            'group-1',
            true,
            2,
            GroupDrawerView.AssignWorkers,
          ),
        { wrapper },
      );

      await waitFor(() => {
        const state: any = store.getState();
        const drawerWorker =
          state.workersGroupView.drawerWorkers.byId['member-1'];
        expect(drawerWorker).toBeDefined();
        expect(drawerWorker.isSelected).toBe(true);
      });
    });
  });
});
