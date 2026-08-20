import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { WorkersTabHeader } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/WorkersTabHeader';
import { WorkerNameType } from 'src/js/widgets/assignments/types';

// Mock HeaderActions component
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/HeaderActions',
  () => ({
    HeaderActions: ({
      onManageFields,
      onAddWorker,
      onCreateGroup,
      setInviteWorkerType,
    }: {
      onManageFields?: () => void;
      onAddWorker?: () => void;
      onCreateGroup?: () => void;
      setInviteWorkerType?: (workerType: WorkerNameType) => void;
    }) => (
      <div data-testid="header-actions-mock">
        <button data-testid="mock-manage-fields-btn" onClick={onManageFields}>
          Manage Fields
        </button>
        <button data-testid="mock-add-worker-btn" onClick={onAddWorker}>
          Add Worker
        </button>
        <button data-testid="mock-create-group-btn" onClick={onCreateGroup}>
          Create Group
        </button>
        <button
          data-testid="mock-invite-employee-btn"
          onClick={() => setInviteWorkerType?.(WorkerNameType.EMPLOYEE)}
        >
          Invite Employee
        </button>
      </div>
    ),
  }),
);

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTabHeader.styled',
  () => ({
    WorkersTabHeaderContainer: ({ children }: any) => (
      <div data-testid="workers-tab-header-container">{children}</div>
    ),
  }),
);

describe('WorkersTabHeader', () => {
  let mockOnManageFields: jest.Mock;
  let mockOnAddWorker: jest.Mock;
  let mockOnCreateGroup: jest.Mock;
  let mockSetInviteWorkerType: jest.Mock;

  beforeEach(() => {
    mockOnManageFields = jest.fn();
    mockOnAddWorker = jest.fn();
    mockOnCreateGroup = jest.fn();
    mockSetInviteWorkerType = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render WorkersTabHeader container', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.getByTestId('workers-tab-header-container'),
      ).toBeInTheDocument();
    });

    it('should render HeaderActions component', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('header-actions-mock')).toBeInTheDocument();
    });

    it('should render all action buttons from HeaderActions', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('mock-manage-fields-btn')).toBeInTheDocument();
      expect(screen.getByTestId('mock-add-worker-btn')).toBeInTheDocument();
      expect(screen.getByTestId('mock-create-group-btn')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass onManageFields prop to HeaderActions', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-manage-fields-btn'));
      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
    });

    it('should pass onAddWorker prop to HeaderActions', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-add-worker-btn'));
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
    });

    it('should pass onCreateGroup prop to HeaderActions', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-create-group-btn'));
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });

    it('should pass setInviteWorkerType prop to HeaderActions', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-invite-employee-btn'));
      expect(mockSetInviteWorkerType).toHaveBeenCalledWith('employee');
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });

    it('should work when handlers are not provided', () => {
      render(<WorkersTabHeader />);

      expect(
        screen.getByTestId('workers-tab-header-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('header-actions-mock')).toBeInTheDocument();
    });
  });

  describe('Handler Interactions', () => {
    it('should call onManageFields handler multiple times', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const button = screen.getByTestId('mock-manage-fields-btn');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnManageFields).toHaveBeenCalledTimes(3);
    });

    it('should call onAddWorker handler multiple times', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const button = screen.getByTestId('mock-add-worker-btn');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnAddWorker).toHaveBeenCalledTimes(2);
    });

    it('should call onCreateGroup handler multiple times', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const button = screen.getByTestId('mock-create-group-btn');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnCreateGroup).toHaveBeenCalledTimes(4);
    });

    it('should call all handlers independently', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-manage-fields-btn'));
      fireEvent.click(screen.getByTestId('mock-add-worker-btn'));
      fireEvent.click(screen.getByTestId('mock-create-group-btn'));

      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Structure', () => {
    it('should maintain correct DOM hierarchy', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const container = screen.getByTestId('workers-tab-header-container');
      const headerActions = screen.getByTestId('header-actions-mock');

      expect(container).toContainElement(headerActions);
    });

    it('should only render HeaderActions as direct child', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const container = screen.getByTestId('workers-tab-header-container');

      // Container should have only one direct child (HeaderActions)
      expect(container.children).toHaveLength(1);
      expect(container.children[0]).toHaveAttribute(
        'data-testid',
        'header-actions-mock',
      );
    });
  });

  describe('Props Variations', () => {
    it('should work with only onManageFields provided', () => {
      render(<WorkersTabHeader onManageFields={mockOnManageFields} />);

      fireEvent.click(screen.getByTestId('mock-manage-fields-btn'));
      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
    });

    it('should work with only onAddWorker provided', () => {
      render(<WorkersTabHeader onAddWorker={mockOnAddWorker} />);

      fireEvent.click(screen.getByTestId('mock-add-worker-btn'));
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
    });

    it('should work with only onCreateGroup provided', () => {
      render(<WorkersTabHeader onCreateGroup={mockOnCreateGroup} />);

      fireEvent.click(screen.getByTestId('mock-create-group-btn'));
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });

    it('should work with any combination of props', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('mock-manage-fields-btn'));
      fireEvent.click(screen.getByTestId('mock-create-group-btn'));

      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
      expect(mockOnAddWorker).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should act as a container for HeaderActions component', () => {
      render(
        <WorkersTabHeader
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // Verify container renders
      expect(
        screen.getByTestId('workers-tab-header-container'),
      ).toBeInTheDocument();

      // Verify HeaderActions is inside the container
      expect(screen.getByTestId('header-actions-mock')).toBeInTheDocument();

      // Verify all buttons work
      fireEvent.click(screen.getByTestId('mock-manage-fields-btn'));
      fireEvent.click(screen.getByTestId('mock-add-worker-btn'));
      fireEvent.click(screen.getByTestId('mock-create-group-btn'));

      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });
  });
});
