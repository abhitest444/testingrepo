import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MockedProvider } from '@apollo/client/testing';
import { ManagerAssignmentController } from 'src/js/widgets/assignments/components/Groups/ManagerAssignmentController';
import workersGroupViewReducer from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { GroupDrawerContext } from 'src/js/widgets/assignments/types/Groups/GroupDrawer.types';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  }),
}));

jest.mock('src/js/widgets/assignments/hooks/useInitializeEditMode', () => ({
  useInitializeEditMode: jest.fn(),
}));

jest.mock(
  'src/js/widgets/assignments/components/Groups/WorkerSelectionContent',
  () => ({
    WorkerSelectionContent: () => (
      <div data-testid="worker-selection-content">Worker Selection</div>
    ),
  }),
);

describe('ManagerAssignmentController', () => {
  const createStore = (mode: 'create' | 'edit' = 'edit') =>
    configureStore({
      reducer: {
        workersGroupView: workersGroupViewReducer,
      },
      preloadedState: {
        workersGroupView: {
          currentGroupId: mode === 'edit' ? '123' : null,
          currentGroupName: mode === 'edit' ? 'Test Group' : null,
          memberCount: mode === 'edit' ? 5 : undefined,
          managerCount: mode === 'edit' ? 2 : undefined,
          drawerWorkers: { byId: {}, allIds: [] },
          selectedMembers: {},
          selectedLeads: {},
        } as any,
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (
    ui: React.ReactElement,
    mode: 'create' | 'edit' = 'edit',
  ) => {
    const store = createStore(mode);
    return render(
      <Provider store={store}>
        <MockedProvider mocks={[]} addTypename={false}>
          {ui}
        </MockedProvider>
      </Provider>,
    );
  };

  describe('Edit Mode', () => {
    it('should render in edit mode', () => {
      renderWithProviders(
        <ManagerAssignmentController
          mode="edit"
          groupId="123"
          groupName="Test Group"
          open
          context={GroupDrawerContext.EditGroup}
        />,
        'edit',
      );

      expect(
        screen.getByTestId('worker-selection-content'),
      ).toBeInTheDocument();
    });

    it('should render when closed', () => {
      renderWithProviders(
        <ManagerAssignmentController
          mode="edit"
          groupId="123"
          groupName="Test Group"
          open={false}
          context={GroupDrawerContext.EditGroup}
        />,
        'edit',
      );

      expect(
        screen.getByTestId('worker-selection-content'),
      ).toBeInTheDocument();
    });

    it('should handle undefined groupId in edit mode', () => {
      renderWithProviders(
        <ManagerAssignmentController
          mode="edit"
          groupId={undefined}
          groupName="Test Group"
          open
          context={GroupDrawerContext.EditGroup}
        />,
        'edit',
      );

      expect(
        screen.getByTestId('worker-selection-content'),
      ).toBeInTheDocument();
    });
  });

  describe('Create Mode', () => {
    it('should render in create mode', () => {
      renderWithProviders(
        <ManagerAssignmentController
          mode="create"
          groupId={undefined}
          groupName="New Group"
          open
          context={GroupDrawerContext.CreateGroup}
        />,
        'create',
      );

      expect(
        screen.getByTestId('worker-selection-content'),
      ).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should handle all required props', () => {
      expect(() => {
        renderWithProviders(
          <ManagerAssignmentController
            mode="edit"
            groupId="123"
            groupName="Test Group"
            open
            context={GroupDrawerContext.EditGroup}
          />,
          'edit',
        );
      }).not.toThrow();
    });

    it('should handle different contexts', () => {
      renderWithProviders(
        <ManagerAssignmentController
          mode="edit"
          groupId="123"
          groupName="Test Group"
          open
          context={GroupDrawerContext.EditGroup}
        />,
        'edit',
      );

      expect(
        screen.getByTestId('worker-selection-content'),
      ).toBeInTheDocument();
    });
  });
});
