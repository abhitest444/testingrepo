import { renderHook, act } from '@testing-library/react-hooks';
import { useSandbox } from '@payroll/quicksand';
import { useCreateGroup } from 'src/js/service/hooks/groups/useCreateGroup';
import { useAssignGroupMembers } from 'src/js/service/hooks/groups/useAssignGroupMembers';
import { useAssignGroupManagers } from 'src/js/service/hooks/groups/useAssignGroupManagers';
import { useGroupWithAssignments } from 'src/js/service/hooks/groups/useGroupWithAssignments';
import { CreateGroupWithAssignmentsInput } from 'src/js/service/types/groupOrchestrationTypes';
import { createCustomerInteraction } from 'src/js/common/CustomerInteraction';
import { ErrorSource } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

// Mock dependencies
jest.mock('@payroll/quicksand');
jest.mock('src/js/service/hooks/groups/useCreateGroup');
jest.mock('src/js/service/hooks/groups/useAssignGroupMembers');
jest.mock('src/js/service/hooks/groups/useAssignGroupManagers');
jest.mock('src/js/common/CustomerInteraction');

describe('useGroupWithAssignments', () => {
  const mockSandbox = {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  };

  const mockCreateGroupMutation = jest.fn();
  const mockAssignMembersMutation = jest.fn();
  const mockAssignManagersMutation = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    (createCustomerInteraction as jest.Mock).mockImplementation(() => {});
    (useCreateGroup as jest.Mock).mockReturnValue([
      mockCreateGroupMutation,
      { loading: false },
    ]);
    (useAssignGroupMembers as jest.Mock).mockReturnValue([
      mockAssignMembersMutation,
      { loading: false },
    ]);
    (useAssignGroupManagers as jest.Mock).mockReturnValue([
      mockAssignManagersMutation,
      { loading: false },
    ]);
  });

  describe('Group Creation Only (No Members or Managers)', () => {
    it('should create group without assignments successfully', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        version: 1,
      };

      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-123',
        groupName: 'Test Group',
      });
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockAssignMembersMutation).not.toHaveBeenCalled();
      expect(mockAssignManagersMutation).not.toHaveBeenCalled();
    });

    it('should handle group creation failure', async () => {
      const errorMsg = 'Group name already exists';

      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onError(errorMsg, 'GROUP_NAME_ALREADY_EXISTS');
          return null;
        },
        { loading: false },
      ]);

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Duplicate Group',
      };

      await result.current.createGroupWithAssignments(input);

      // Error callback should be called when group creation fails
      expect(mockOnError).toHaveBeenCalledWith(
        errorMsg,
        'GROUP_NAME_ALREADY_EXISTS',
        ErrorSource.CreateGroup,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockAssignMembersMutation).not.toHaveBeenCalled();
      expect(mockAssignManagersMutation).not.toHaveBeenCalled();
    });
  });

  describe('Group Creation With Members Only', () => {
    const mockGroup = {
      id: 'group-456',
      name: 'Team Alpha',
      version: 1,
    };

    it('should create group and assign all members successfully', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock successful member assignment
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          // Call onSuccess for logging
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 2,
            failedCount: 0,
            failures: [],
          });
          // Return proper GraphQL response structure
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'SUCCESS',
                assignmentResults: [
                  { worker: { id: 'worker-1' } },
                  { worker: { id: 'worker-2' } },
                ],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Alpha',
        members: [
          { id: 'worker-1', timeForType: 'EMPLOYEE' as any },
          { id: 'worker-2', timeForType: 'CONTRACTOR' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-456',
        groupName: 'Team Alpha',
        memberAssignments: {
          membersAssigned: 2,
          membersFailed: 0,
          partialSuccess: false,
          failures: [],
        },
        leadAssignments: undefined,
      });
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockAssignManagersMutation).not.toHaveBeenCalled();
    });

    it('should handle partial success when some members fail to assign', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock partial success member assignment
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: true,
            assignedCount: 1,
            failedCount: 1,
            failures: [
              {
                workerId: 'worker-2',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Worker is already in another group',
              },
            ],
          });
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'PARTIAL_SUCCESS',
                assignmentResults: [
                  { worker: { id: 'worker-1' } },
                  {
                    workerId: 'worker-2',
                    errorCode: 'ALREADY_IN_GROUP',
                    errorMessage: 'Worker is already in another group',
                  },
                ],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Alpha',
        members: [
          { id: 'worker-1', timeForType: 'EMPLOYEE' as any },
          { id: 'worker-2', timeForType: 'CONTRACTOR' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-456',
        groupName: 'Team Alpha',
        memberAssignments: {
          membersAssigned: 1,
          membersFailed: 1,
          partialSuccess: true,
          failures: [
            {
              workerId: 'worker-2',
              errorCode: 'ALREADY_IN_GROUP',
              errorMessage: 'Worker is already in another group',
            },
          ],
        },
        leadAssignments: undefined,
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle complete member assignment failure', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock member assignment failure
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onError('Failed to assign members', 'ASSIGNMENT_FAILED');
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                errorCode: 'ASSIGNMENT_FAILED',
                message: 'Failed to assign members',
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Alpha',
        members: [{ id: 'worker-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign members',
        'ASSIGNMENT_FAILED',
        ErrorSource.AssignMembers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Group Creation With Managers Only', () => {
    const mockGroup = {
      id: 'group-789',
      name: 'Team Beta',
      version: 1,
    };

    it('should create group and assign all managers successfully', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock successful manager assignment
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 2,
            failedCount: 0,
            failures: [],
          });
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                successCode: 'SUCCESS',
                assignmentResults: [
                  { worker: { id: 'manager-1' } },
                  { worker: { id: 'manager-2' } },
                ],
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Beta',
        leads: [
          { id: 'manager-1', timeForType: 'EMPLOYEE' as any },
          { id: 'manager-2', timeForType: 'EMPLOYEE' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-789',
        groupName: 'Team Beta',
        memberAssignments: undefined,
        leadAssignments: {
          leadsAssigned: 2,
          leadsFailed: 0,
          partialSuccess: false,
          failures: [],
        },
      });
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockAssignMembersMutation).not.toHaveBeenCalled();
      expect(mockAssignManagersMutation).toHaveBeenCalled();
    });

    it('should handle manager assignment failure', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock manager assignment failure
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onError('Failed to assign managers', 'ASSIGNMENT_FAILED');
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                errorCode: 'ASSIGNMENT_FAILED',
                message: 'Failed to assign managers',
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Beta',
        leads: [{ id: 'manager-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign managers',
        'ASSIGNMENT_FAILED',
        ErrorSource.AssignManagers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Group Creation With Members and Managers (Parallel Execution)', () => {
    const mockGroup = {
      id: 'group-999',
      name: 'Team Gamma',
      version: 1,
    };

    it('should create group and assign both members and managers in parallel', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock successful member assignment
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 3,
            failedCount: 0,
            failures: [],
          });
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'SUCCESS',
                assignmentResults: [
                  { worker: { id: 'worker-1' } },
                  { worker: { id: 'worker-2' } },
                  { worker: { id: 'worker-3' } },
                ],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      // Mock successful manager assignment
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 2,
            failedCount: 0,
            failures: [],
          });
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                successCode: 'SUCCESS',
                assignmentResults: [
                  { worker: { id: 'manager-1' } },
                  { worker: { id: 'manager-2' } },
                ],
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Gamma',
        members: [
          { id: 'worker-1', timeForType: 'EMPLOYEE' as any },
          { id: 'worker-2', timeForType: 'CONTRACTOR' as any },
          { id: 'worker-3', timeForType: 'EMPLOYEE' as any },
        ],
        leads: [
          { id: 'manager-1', timeForType: 'EMPLOYEE' as any },
          { id: 'manager-2', timeForType: 'EMPLOYEE' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-999',
        groupName: 'Team Gamma',
        memberAssignments: {
          membersAssigned: 3,
          membersFailed: 0,
          partialSuccess: false,
          failures: [],
        },
        leadAssignments: {
          leadsAssigned: 2,
          leadsFailed: 0,
          partialSuccess: false,
          failures: [],
        },
      });
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockAssignMembersMutation).toHaveBeenCalled();
      expect(mockAssignManagersMutation).toHaveBeenCalled();
    });

    it('should handle partial success in both members and managers', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock partial success member assignment
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: true,
            assignedCount: 2,
            failedCount: 1,
            failures: [
              {
                workerId: 'worker-3',
                errorCode: 'ALREADY_IN_GROUP',
                errorMessage: 'Worker is already in another group',
              },
            ],
          });
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'PARTIAL_SUCCESS',
                assignmentResults: [
                  { worker: { id: 'worker-1' } },
                  { worker: { id: 'worker-2' } },
                  {
                    workerId: 'worker-3',
                    errorCode: 'ALREADY_IN_GROUP',
                    errorMessage: 'Worker is already in another group',
                  },
                ],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      // Mock partial success manager assignment
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: true,
            assignedCount: 1,
            failedCount: 1,
            failures: [
              {
                workerId: 'manager-2',
                errorCode: 'INVALID_PERMISSIONS',
                errorMessage: 'Manager lacks required permissions',
              },
            ],
          });
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                successCode: 'PARTIAL_SUCCESS',
                assignmentResults: [
                  { worker: { id: 'manager-1' } },
                  {
                    workerId: 'manager-2',
                    errorCode: 'INVALID_PERMISSIONS',
                    errorMessage: 'Manager lacks required permissions',
                  },
                ],
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Gamma',
        members: [
          { id: 'worker-1', timeForType: 'EMPLOYEE' as any },
          { id: 'worker-2', timeForType: 'CONTRACTOR' as any },
          { id: 'worker-3', timeForType: 'EMPLOYEE' as any },
        ],
        leads: [
          { id: 'manager-1', timeForType: 'EMPLOYEE' as any },
          { id: 'manager-2', timeForType: 'EMPLOYEE' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-999',
        groupName: 'Team Gamma',
        memberAssignments: {
          membersAssigned: 2,
          membersFailed: 1,
          partialSuccess: true,
          failures: [
            {
              workerId: 'worker-3',
              errorCode: 'ALREADY_IN_GROUP',
              errorMessage: 'Worker is already in another group',
            },
          ],
        },
        leadAssignments: {
          leadsAssigned: 1,
          leadsFailed: 1,
          partialSuccess: true,
          failures: [
            {
              workerId: 'manager-2',
              errorCode: 'INVALID_PERMISSIONS',
              errorMessage: 'Manager lacks required permissions',
            },
          ],
        },
      });
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should handle member assignment failure in parallel execution', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock member assignment failure
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onError('Failed to assign members', 'ASSIGNMENT_FAILED');
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                errorCode: 'ASSIGNMENT_FAILED',
                message: 'Failed to assign members',
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      // Mock successful manager assignment (should still be called in parallel)
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 2,
            failedCount: 0,
            failures: [],
          });
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                successCode: 'SUCCESS',
                assignmentResults: [
                  { worker: { id: 'manager-1' } },
                  { worker: { id: 'manager-2' } },
                ],
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Gamma',
        members: [{ id: 'worker-1', timeForType: 'EMPLOYEE' as any }],
        leads: [{ id: 'manager-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      // Error should be called when member assignment fails
      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign members',
        'ASSIGNMENT_FAILED',
        ErrorSource.AssignMembers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle manager assignment failure in parallel execution', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock successful member assignment
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: false,
            assignedCount: 1,
            failedCount: 0,
            failures: [],
          });
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'SUCCESS',
                assignmentResults: [{ worker: { id: 'worker-1' } }],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      // Mock manager assignment failure
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          options.onError('Failed to assign managers', 'ASSIGNMENT_FAILED');
          return {
            data: {
              timeTrackingAssignGroupManagers: {
                errorCode: 'ASSIGNMENT_FAILED',
                message: 'Failed to assign managers',
              },
            },
          };
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Team Gamma',
        members: [{ id: 'worker-1', timeForType: 'EMPLOYEE' as any }],
        leads: [{ id: 'manager-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      // Error should be called when manager assignment fails
      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign managers',
        'ASSIGNMENT_FAILED',
        ErrorSource.AssignManagers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should return loading true when any operation is loading', () => {
      // Test group creation loading
      (useCreateGroup as jest.Mock).mockReturnValue([
        mockCreateGroupMutation,
        { loading: true },
      ]);

      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      expect(result1.current.loading).toBe(true);
      unmount1();

      // Test member assignment loading
      (useCreateGroup as jest.Mock).mockReturnValue([
        mockCreateGroupMutation,
        { loading: false },
      ]);
      (useAssignGroupMembers as jest.Mock).mockReturnValue([
        mockAssignMembersMutation,
        { loading: true },
      ]);

      const { result: result2, unmount: unmount2 } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      expect(result2.current.loading).toBe(true);
      unmount2();

      // Test manager assignment loading
      (useAssignGroupMembers as jest.Mock).mockReturnValue([
        mockAssignMembersMutation,
        { loading: false },
      ]);
      (useAssignGroupManagers as jest.Mock).mockReturnValue([
        mockAssignManagersMutation,
        { loading: true },
      ]);

      const { result: result3 } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      expect(result3.current.loading).toBe(true);
    });

    it('should return loading false when all operations are complete', () => {
      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors during execution', async () => {
      const unexpectedError = new Error('Unexpected error');

      (useCreateGroup as jest.Mock).mockImplementation(() => [
        async () => {
          throw unexpectedError;
        },
        { loading: false },
      ]);

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith('Unexpected error');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions during execution', async () => {
      const unexpectedValue = 'String error instead of Error object';

      (useCreateGroup as jest.Mock).mockImplementation(() => [
        async () => {
          throw unexpectedValue;
        },
        { loading: false },
      ]);

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith('An unexpected error occurred');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle member assignment promise rejection with Error', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        version: 1,
      };

      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock member assignment promise rejection (network error)
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          throw new Error('Network error');
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
        members: [{ id: 'worker-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Network error',
        undefined,
        ErrorSource.AssignMembers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle assignment promise rejection with non-Error', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        version: 1,
      };

      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock member assignment promise rejection with non-Error reason
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          const nonErrorValue = 'String error';
          throw nonErrorValue;
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
        members: [{ id: 'worker-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign members',
        undefined,
        ErrorSource.AssignMembers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle manager assignment promise rejection with Error', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        version: 1,
      };

      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock manager assignment promise rejection (network error)
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          throw new Error('Network error');
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
        leads: [{ id: 'manager-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Network error',
        undefined,
        ErrorSource.AssignManagers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should handle manager assignment promise rejection with non-Error', async () => {
      const mockGroup = {
        id: 'group-123',
        name: 'Test Group',
        version: 1,
      };

      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock manager assignment promise rejection with non-Error reason
      (useAssignGroupManagers as jest.Mock).mockImplementation((options) => {
        mockAssignManagersMutation.mockImplementation(async () => {
          const nonErrorValue = 'String error';
          throw nonErrorValue;
        });
        return [mockAssignManagersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
        leads: [{ id: 'manager-1', timeForType: 'EMPLOYEE' as any }],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to assign managers',
        undefined,
        ErrorSource.AssignManagers,
      );
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Failure Mapping', () => {
    const mockGroup = {
      id: 'group-test',
      name: 'Test Group',
      version: 1,
    };

    it('should handle failures with null errorCode and errorMessage', async () => {
      // Mock successful group creation
      (useCreateGroup as jest.Mock).mockImplementation((options) => [
        async () => {
          options.onSuccess(mockGroup);
          return { data: { group: mockGroup } };
        },
        { loading: false },
      ]);

      // Mock partial success with null error codes and messages
      (useAssignGroupMembers as jest.Mock).mockImplementation((options) => {
        mockAssignMembersMutation.mockImplementation(async () => {
          options.onSuccess({
            success: true,
            partialSuccess: true,
            assignedCount: 1,
            failedCount: 1,
            failures: [
              {
                workerId: 'worker-1',
                errorCode: null, // Explicitly null
                errorMessage: null, // Explicitly null
              },
            ],
          });
          return {
            data: {
              timeTrackingAssignGroupMembers: {
                successCode: 'PARTIAL_SUCCESS',
                assignmentResults: [
                  { worker: { id: 'worker-2' } },
                  {
                    workerId: 'worker-1',
                    errorCode: null,
                    errorMessage: null,
                  },
                ],
              },
            },
          };
        });
        return [mockAssignMembersMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      const input: CreateGroupWithAssignmentsInput = {
        groupName: 'Test Group',
        members: [
          { id: 'worker-1', timeForType: 'EMPLOYEE' as any },
          { id: 'worker-2', timeForType: 'EMPLOYEE' as any },
        ],
      };

      await result.current.createGroupWithAssignments(input);

      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        groupId: 'group-test',
        groupName: 'Test Group',
        memberAssignments: {
          membersAssigned: 1,
          membersFailed: 1,
          partialSuccess: true,
          failures: [
            {
              workerId: 'worker-1',
              errorCode: null,
              errorMessage: null,
            },
          ],
        },
        leadAssignments: undefined,
      });
    });
  });

  describe('Coverage gaps', () => {
    it('should handle null inputDataRef (line 130: || {} fallback) when handleGroupCreated fires before createGroupWithAssignments sets inputDataRef', async () => {
      const mockGroup = {
        id: 'group-null-ref',
        name: 'Null Ref Group',
        version: 1,
      };

      // Capture the onSuccess callback passed at hook-init time so we can
      // invoke it before createGroupWithAssignments ever sets inputDataRef.
      let capturedOnSuccess: ((group: any) => void) | null = null;
      (useCreateGroup as jest.Mock).mockImplementation((options) => {
        capturedOnSuccess = options.onSuccess;
        return [mockCreateGroupMutation, { loading: false }];
      });

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      // Trigger handleGroupCreated directly (before createGroupWithAssignments
      // has a chance to set inputDataRef.current), exercising the || {} fallback.
      await act(async () => {
        if (capturedOnSuccess) capturedOnSuccess(mockGroup);
      });

      // onSuccess is called with empty members/leads derived from inputDataRef.current || {}
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          groupId: 'group-null-ref',
        }),
      );
    });

    it('should use empty traceHeaders when createCustomerInteraction returns non-null object (line 307: ?. truthy path)', async () => {
      // Make createCustomerInteraction return an object with getTracePropagationHeaders
      // so the ?. path (calling getTracePropagationHeaders) is exercised.
      const mockTraceHeaders = { 'x-trace-id': 'abc123' };
      (createCustomerInteraction as jest.Mock).mockReturnValue({
        getTracePropagationHeaders: jest.fn().mockReturnValue(mockTraceHeaders),
      });

      mockCreateGroupMutation.mockResolvedValue({});

      const { result } = renderHook(() =>
        useGroupWithAssignments({
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      );

      await result.current.createGroupWithAssignments({
        groupName: 'Test Group',
      });

      expect(mockCreateGroupMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({ headers: mockTraceHeaders }),
        }),
      );
    });
  });
});
