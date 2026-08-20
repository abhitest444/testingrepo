import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { HeaderActions } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/HeaderActions';

// Mock useIXPFeatureFlag
const mockUseIXPFeatureFlag = jest.fn();
jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: (opts: any) => mockUseIXPFeatureFlag(opts),
}));

jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/WhosWorkingButton',
  () => ({
    WhosWorkingButton: () => <div data-testid="whos-working-btn" />,
  }),
);

// Mock IDS Button component
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    priority,
    purpose,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    priority?: string;
    purpose?: string;
    'data-testid'?: string;
    'aria-label'?: string;
  }) => (
    <button
      onClick={onClick}
      data-testid={dataTestId}
      data-priority={priority}
      data-purpose={purpose}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

// Mock IDS DropdownButton component
jest.mock('@ids-ts/dropdown-button', () => {
  const React = require('react');

  const mockDropdownButtonInstances = new Map();

  const MockDropdownButton = ({
    children,
    onSelect,
    label,
    buttonPriority,
    buttonPurpose,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: any) => {
    // Store the onSelect handler for this instance
    mockDropdownButtonInstances.set(dataTestId, onSelect);

    // Clone children to inject the parent dropdown id so MockMenuItem can route correctly
    const childrenWithParent = React.Children.map(children, (child: any) =>
      React.cloneElement(child, { 'data-parent-id': dataTestId }),
    );

    return React.createElement(
      'div',
      {
        'data-testid': dataTestId,
        'data-priority': buttonPriority,
        'data-purpose': buttonPurpose,
      },
      [
        React.createElement(
          'button',
          {
            key: 'btn',
            'aria-label': ariaLabel,
          },
          label,
        ),
        React.createElement(
          'div',
          { key: 'menu', 'data-testid': `dropdown-menu-${dataTestId}` },
          childrenWithParent,
        ),
      ],
    );
  };

  const MockMenuItem = ({
    children,
    value,
    onClick: customOnClick,
    'data-parent-id': parentId,
  }: any) => {
    const handleClick = () => {
      // If there's a custom onClick (from cloneElement), call it
      if (customOnClick) {
        customOnClick();
        return;
      }
      // Find the parent dropdown's onSelect by parentId and call it
      const onSelect = mockDropdownButtonInstances.get(parentId);
      if (onSelect) {
        onSelect({ target: { value } });
      }
    };

    return React.createElement(
      'button',
      {
        'data-testid': `menu-item-${parentId}-${value}`,
        'data-value': value,
        onClick: handleClick,
      },
      children,
    );
  };

  return {
    __esModule: true,
    default: MockDropdownButton,
    MenuItem: MockMenuItem,
  };
});

// Mock IDS icons
jest.mock('@design-systems/icons', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  Plus: () => <svg data-testid="plus-icon" />,
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/components/styles/HeaderActions.styled',
  () => ({
    HeaderActionsContainer: ({ children }: any) => (
      <div data-testid="header-actions-container">{children}</div>
    ),
  }),
);

// Mock the InviteTeamMembersButton so this suite doesn't pull in the remote
// HOCWidget / sandbox wiring — it's covered by its own test.
jest.mock(
  'src/js/widgets/assignments/components/WorkerAssignments/WorkersTabHeader/InviteTeamMembersButton',
  () => ({
    InviteTeamMembersButton: () => (
      <div data-testid="invite-team-members-btn" />
    ),
  }),
);

// Mock useIntl
const mockFormatMessage = jest.fn((descriptor) => {
  const messages: { [key: string]: string } = {
    'workers.header.manageFields': 'Manage time tracking fields',
    'workers.header.addWorker': 'Add worker',
    'workers.header.addEmployee': 'Add employee',
    'workers.header.addContractor': 'Add contractor',
    'workers.header.invite.to.track.time': 'Invite to track time',
    'workers.header.invite.employee': 'Invite employees',
    'workers.header.invite.contractor': 'Invite contractors',
    'groups.header.createGroup': 'Create group',
  };
  return messages[descriptor.id] || descriptor.defaultMessage;
});

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: mockFormatMessage,
  }),
  useSandbox: () => ({
    logger: { info: jest.fn(), error: jest.fn() },
  }),
}));

describe('HeaderActions', () => {
  let mockOnManageFields: jest.Mock;
  let mockOnAddWorker: jest.Mock;
  let mockOnCreateGroup: jest.Mock;

  beforeEach(() => {
    mockOnManageFields = jest.fn();
    mockOnAddWorker = jest.fn();
    mockOnCreateGroup = jest.fn();
    jest.clearAllMocks();
    mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => ({
      isEnabled: flagName !== 'SBSEG-QBO-Enable-Time-Tab-Team-Members',
      settled: true,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Who's working feature flag", () => {
    // Resolve each flag independently so we can toggle the team-members
    // (Who's working) flag without affecting the invite-worker flag.
    const setFlags = ({
      teamMembers = false,
      inviteWorker = true,
    }: {
      teamMembers?: boolean;
      inviteWorker?: boolean;
    }) => {
      mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => {
        if (flagName === 'SBSEG-QBO-Enable-Time-Tab-Team-Members') {
          return { isEnabled: teamMembers, settled: true };
        }
        if (flagName === 'SBSEG-QBO-workforce-time-tracking-invite-enabled') {
          return { isEnabled: inviteWorker, settled: true };
        }
        return { isEnabled: false, settled: true };
      });
    };

    it("renders the Who's working button when the team-members flag is enabled", () => {
      setFlags({ teamMembers: true });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('whos-working-btn')).toBeInTheDocument();
    });

    it("hides the Who's working button when the team-members flag is disabled", () => {
      setFlags({ teamMembers: false });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.queryByTestId('whos-working-btn')).not.toBeInTheDocument();
    });

    it("keeps the Who's working flag independent of the invite-worker flag", () => {
      setFlags({ teamMembers: true, inviteWorker: false });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('whos-working-btn')).toBeInTheDocument();
      expect(
        screen.queryByTestId('invite-worker-dropdown-btn'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Invite team members button', () => {
    it('renders the Invite team members button when the team-members flag is enabled', () => {
      mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => ({
        isEnabled: flagName === 'SBSEG-QBO-Enable-Time-Tab-Team-Members',
        settled: true,
      }));
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('invite-team-members-btn')).toBeInTheDocument();
    });

    it('hides the Invite team members button when the team-members flag is disabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        settled: true,
      });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.queryByTestId('invite-team-members-btn'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Feature Flag', () => {
    it('should not render invite dropdown when feature flag is disabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        settled: true,
      });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('manage-fields-btn')).toBeInTheDocument();
      expect(screen.getByTestId('add-worker-dropdown-btn')).toBeInTheDocument();
      expect(
        screen.queryByTestId('invite-worker-dropdown-btn'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('create-group-btn')).toBeInTheDocument();
    });

    it('should render invite dropdown when feature flag is enabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({ isEnabled: true, settled: true });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.getByTestId('invite-worker-dropdown-btn'),
      ).toBeInTheDocument();
    });
  });

  describe('Manage time tracking fields button', () => {
    // Resolve each flag independently so we can toggle the team-members
    // flag without affecting the invite-worker flag.
    const setFlags = ({
      teamMembers = false,
      inviteWorker = true,
    }: {
      teamMembers?: boolean;
      inviteWorker?: boolean;
    }) => {
      mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => {
        if (flagName === 'SBSEG-QBO-Enable-Time-Tab-Team-Members') {
          return { isEnabled: teamMembers, settled: true };
        }
        if (flagName === 'SBSEG-QBO-workforce-time-tracking-invite-enabled') {
          return { isEnabled: inviteWorker, settled: true };
        }
        return { isEnabled: false, settled: true };
      });
    };

    it('hides the Manage time tracking fields button when the team-members flag is enabled', () => {
      setFlags({ teamMembers: true });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.queryByTestId('manage-fields-btn')).not.toBeInTheDocument();
    });

    it('renders the Manage time tracking fields button when the team-members flag is disabled', () => {
      setFlags({ teamMembers: false });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('manage-fields-btn')).toBeInTheDocument();
    });
  });

  describe('Flag settlement (flicker prevention)', () => {
    it('renders nothing while the team-members flag has not settled', () => {
      mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => {
        if (flagName === 'SBSEG-QBO-Enable-Time-Tab-Team-Members') {
          return { isEnabled: false, settled: false };
        }
        return { isEnabled: true, settled: true };
      });

      const { container } = render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(container).toBeEmptyDOMElement();
      expect(
        screen.queryByTestId('header-actions-container'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('manage-fields-btn')).not.toBeInTheDocument();
    });

    it('renders the header actions once the team-members flag settles', () => {
      mockUseIXPFeatureFlag.mockImplementation(({ flagName }: any) => {
        if (flagName === 'SBSEG-QBO-Enable-Time-Tab-Team-Members') {
          return { isEnabled: false, settled: true };
        }
        return { isEnabled: true, settled: true };
      });

      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.getByTestId('header-actions-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('manage-fields-btn')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should render all four action buttons when flag is enabled', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.getByTestId('header-actions-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('manage-fields-btn')).toBeInTheDocument();
      expect(screen.getByTestId('add-worker-dropdown-btn')).toBeInTheDocument();
      expect(
        screen.getByTestId('invite-worker-dropdown-btn'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('create-group-btn')).toBeInTheDocument();
    });

    it('should render with correct button text', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(
        screen.getByText('Manage time tracking fields'),
      ).toBeInTheDocument();
      expect(screen.getByText('Add worker')).toBeInTheDocument();
      expect(screen.getByText('Invite to track time')).toBeInTheDocument();
      expect(screen.getByText('Create group')).toBeInTheDocument();
    });

    it('should render with correct button priorities', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      const addWorkerDropdown = screen.getByTestId('add-worker-dropdown-btn');
      const inviteDropdown = screen.getByTestId('invite-worker-dropdown-btn');
      const createGroupBtn = screen.getByTestId('create-group-btn');

      expect(manageFieldsBtn).toHaveAttribute('data-priority', 'secondary');
      expect(addWorkerDropdown).toHaveAttribute('data-priority', 'secondary');
      expect(inviteDropdown).toHaveAttribute('data-priority', 'secondary');
      expect(createGroupBtn).toHaveAttribute('data-priority', 'primary');
    });

    it('should render with correct button purpose', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      const addWorkerBtn = screen.getByTestId('add-worker-dropdown-btn');
      const inviteBtn = screen.getByTestId('invite-worker-dropdown-btn');
      const createGroupBtn = screen.getByTestId('create-group-btn');

      expect(manageFieldsBtn).toHaveAttribute('data-purpose', 'standard');
      expect(addWorkerBtn).toHaveAttribute('data-purpose', 'standard');
      expect(inviteBtn).toHaveAttribute('data-purpose', 'standard');
      expect(createGroupBtn).toHaveAttribute('data-purpose', 'standard');
    });

    it('should render Plus icon in Create group button', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onManageFields when Manage fields button is clicked', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('manage-fields-btn'));
      expect(mockOnManageFields).toHaveBeenCalledTimes(1);
    });

    it('should call onAddWorker with EMPLOYEE when Add employee menu item is clicked', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(
        screen.getByTestId('menu-item-add-worker-dropdown-btn-employee'),
      );

      expect(mockOnAddWorker).toHaveBeenCalledWith('employee');
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
    });

    it('should call onAddWorker with VENDOR when Add contractor menu item is clicked', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // WorkerNameType.CONTRACTOR is 'vendor' by design
      fireEvent.click(
        screen.getByTestId('menu-item-add-worker-dropdown-btn-vendor'),
      );

      expect(mockOnAddWorker).toHaveBeenCalledWith('vendor');
      expect(mockOnAddWorker).toHaveBeenCalledTimes(1);
    });

    it('should call setInviteWorkerType with EMPLOYEE when Invite employees menu item is clicked', () => {
      const mockSetInviteWorkerType = jest.fn();
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(
        screen.getByTestId('menu-item-invite-worker-dropdown-btn-employee'),
      );

      expect(mockSetInviteWorkerType).toHaveBeenCalledWith('employee');
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });

    // WorkerNameType.CONTRACTOR = 'vendor' — the testid uses the enum's
    // string value, not the enum key, hence "-vendor" for contractor invite.
    it('should call setInviteWorkerType with CONTRACTOR when Invite contractors menu item is clicked', () => {
      const mockSetInviteWorkerType = jest.fn();
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
          setInviteWorkerType={mockSetInviteWorkerType}
        />,
      );

      fireEvent.click(
        screen.getByTestId('menu-item-invite-worker-dropdown-btn-vendor'),
      );

      expect(mockSetInviteWorkerType).toHaveBeenCalledWith('vendor');
      expect(mockSetInviteWorkerType).toHaveBeenCalledTimes(1);
    });

    it('should call onCreateGroup when Create group button is clicked', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      fireEvent.click(screen.getByTestId('create-group-btn'));
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });

    it('should call handlers multiple times when clicked multiple times', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      const createGroupBtn = screen.getByTestId('create-group-btn');

      fireEvent.click(manageFieldsBtn);
      fireEvent.click(manageFieldsBtn);
      expect(mockOnManageFields).toHaveBeenCalledTimes(2);

      const employeeMenuItem = screen.getByTestId(
        'menu-item-add-worker-dropdown-btn-employee',
      );
      fireEvent.click(employeeMenuItem);
      fireEvent.click(employeeMenuItem);
      expect(mockOnAddWorker).toHaveBeenCalledTimes(2);

      fireEvent.click(createGroupBtn);
      expect(mockOnCreateGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Default Handlers', () => {
    it('should use default handler when onManageFields is not provided', () => {
      render(
        <HeaderActions
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // Should not throw error when clicking without handler
      expect(() => {
        fireEvent.click(screen.getByTestId('manage-fields-btn'));
      }).not.toThrow();
    });

    it('should use default handler when onAddWorker is not provided', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // Should not throw error when clicking without handler
      expect(() => {
        fireEvent.click(
          screen.getByTestId('menu-item-add-worker-dropdown-btn-employee'),
        );
      }).not.toThrow();
    });

    it('should use default handler when setInviteWorkerType is not provided', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(() => {
        fireEvent.click(
          screen.getByTestId('menu-item-invite-worker-dropdown-btn-employee'),
        );
      }).not.toThrow();
    });

    it('should use default handler when onCreateGroup is not provided', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
        />,
      );

      // Should not throw error when clicking without handler
      expect(() => {
        fireEvent.click(screen.getByTestId('create-group-btn'));
      }).not.toThrow();
    });

    it('should work with no handlers provided', () => {
      render(<HeaderActions />);

      // Should not throw error when clicking any button without handlers
      expect(() => {
        fireEvent.click(screen.getByTestId('manage-fields-btn'));
        fireEvent.click(
          screen.getByTestId('menu-item-add-worker-dropdown-btn-employee'),
        );
        fireEvent.click(
          screen.getByTestId('menu-item-invite-worker-dropdown-btn-employee'),
        );
        fireEvent.click(screen.getByTestId('create-group-btn'));
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-labels for all buttons', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      expect(screen.getByTestId('manage-fields-btn')).toHaveAttribute(
        'aria-label',
        'Manage time tracking fields',
      );

      const addWorkerDropdown = screen.getByTestId('add-worker-dropdown-btn');
      expect(addWorkerDropdown.querySelector('button')).toHaveAttribute(
        'aria-label',
        'Add worker',
      );

      const inviteDropdown = screen.getByTestId('invite-worker-dropdown-btn');
      expect(inviteDropdown.querySelector('button')).toHaveAttribute(
        'aria-label',
        'Invite to track time',
      );

      expect(screen.getByTestId('create-group-btn')).toHaveAttribute(
        'aria-label',
        'Create group',
      );
    });
  });

  describe('Internationalization', () => {
    it('should call formatMessage for all button labels', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // - Manage fields: 2 calls (text + aria-label)
      // - Add worker dropdown: 2 calls for button label/aria + 2 for menu items = 4
      // - Invite dropdown: 2 calls for button label/aria + 2 for menu items = 4
      // - Create group: 2 calls (text + aria-label)
      // Total: 12 calls
      expect(mockFormatMessage).toHaveBeenCalledTimes(12);

      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.manageFields' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.addWorker' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.addEmployee' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.addContractor' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.invite.to.track.time' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.invite.employee' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'workers.header.invite.contractor' }),
      );
      expect(mockFormatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'groups.header.createGroup' }),
      );
    });

    it('should call fewer formatMessage calls when flag is disabled', () => {
      mockUseIXPFeatureFlag.mockReturnValue({
        isEnabled: false,
        settled: true,
      });
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      // - Manage fields: 2, Add worker: 4, Create group: 2 = 8 (no invite dropdown)
      expect(mockFormatMessage).toHaveBeenCalledTimes(8);
    });
  });

  describe('Component Structure', () => {
    it('should maintain correct DOM hierarchy', () => {
      render(
        <HeaderActions
          onManageFields={mockOnManageFields}
          onAddWorker={mockOnAddWorker}
          onCreateGroup={mockOnCreateGroup}
        />,
      );

      const container = screen.getByTestId('header-actions-container');
      const manageFieldsBtn = screen.getByTestId('manage-fields-btn');
      const addWorkerDropdown = screen.getByTestId('add-worker-dropdown-btn');
      const inviteDropdown = screen.getByTestId('invite-worker-dropdown-btn');
      const createGroupBtn = screen.getByTestId('create-group-btn');

      expect(container).toContainElement(manageFieldsBtn);
      expect(container).toContainElement(addWorkerDropdown);
      expect(container).toContainElement(inviteDropdown);
      expect(container).toContainElement(createGroupBtn);
    });
  });
});
