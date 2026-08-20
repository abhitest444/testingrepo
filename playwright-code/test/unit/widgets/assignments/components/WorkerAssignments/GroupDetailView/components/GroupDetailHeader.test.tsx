/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { GroupDetailHeader } from 'src/js/widgets/assignments/components/WorkerAssignments/GroupDetailView/components/GroupDetailHeader';
import { useAppSelector } from 'src/js/widgets/assignments/store/hooks';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id, defaultMessage }: any, values?: any) => {
      if (values?.count !== undefined) {
        const { count } = values;
        if (id === 'groups.detail.workerCountBadge') {
          return `${count} ${count === 1 ? 'worker' : 'workers'}`;
        }
        if (id === 'groups.detail.leadCountBadge') {
          return `${count} ${count === 1 ? 'group lead' : 'group leads'}`;
        }
      }
      if (values?.displayed !== undefined && values?.total !== undefined) {
        const { displayed, total } = values;
        if (id === 'groups.detail.workerCountBadge') {
          return `${displayed} of ${total} ${
            total === 1 ? 'worker' : 'workers'
          }`;
        }
      }
      return defaultMessage || id;
    },
  }),
}));

jest.mock('src/js/widgets/assignments/store/hooks', () => ({
  useAppSelector: jest.fn(),
}));

jest.mock('src/js/widgets/assignments/store/workersListSlice', () => ({
  selectWorkersListHeaderTotalCount: jest.fn(
    (state) => state.workersList.headerTotalCount,
  ),
}));

jest.mock('@design-systems/icons', () => ({
  ChevronLeft: () => <span data-testid="chevron-left-icon" />,
  PersonThree: () => <span data-testid="person-three-icon" />,
}));

jest.mock('@ids-ts/link', () => ({
  Link: ({ children, onClick, ...props }: any) => (
    <a onClick={onClick} data-testid="back-link" {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, size, ...props }: any) => (
    <div data-testid="icon-control" data-size={size} {...props}>
      {children}
    </div>
  ),
}));

describe('GroupDetailHeader', () => {
  const mockOnBack = jest.fn();
  const mockOnAssignWorkers = jest.fn();
  const mockOnAssignLeads = jest.fn();

  const defaultProps = {
    groupName: 'Engineering Team',
    memberCount: 5,
    managerCount: 2,
    onBack: mockOnBack,
    onAssignWorkers: mockOnAssignWorkers,
    onAssignLeads: mockOnAssignLeads,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppSelector as jest.Mock).mockReturnValue(150); // Default headerTotalCount
  });

  describe('Rendering', () => {
    it('should render all header elements', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByText('Groups')).toBeInTheDocument();
      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('5 of 150 workers')).toBeInTheDocument();
      expect(screen.getByText('2 group leads')).toBeInTheDocument();
    });

    it('should render back button with chevron icon', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      expect(screen.getByText('Groups')).toBeInTheDocument();
    });

    it('should render group name', () => {
      render(<GroupDetailHeader {...defaultProps} groupName="Test Group" />);

      expect(screen.getByText('Test Group')).toBeInTheDocument();
    });

    it('should render person icons for badges', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const personIcons = screen.getAllByTestId('person-three-icon');
      expect(personIcons).toHaveLength(2); // One for workers, one for leads
    });

    it('should render icon controls with correct size', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const iconControls = screen.getAllByTestId('icon-control');
      iconControls.forEach((control) => {
        expect(control).toHaveAttribute('data-size', 'small');
      });
    });
  });

  describe('Assign Workers/Leads Badge Functionality', () => {
    it('should call onAssignWorkers when workers badge is clicked', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const workersBadge = screen.getByText('5 of 150 workers');
      fireEvent.click(workersBadge);

      expect(mockOnAssignWorkers).toHaveBeenCalledTimes(1);
    });

    it('should call onAssignLeads when group leads badge is clicked', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const leadsBadge = screen.getByText('2 group leads');
      fireEvent.click(leadsBadge);

      expect(mockOnAssignLeads).toHaveBeenCalledTimes(1);
    });

    it('should have correct aria-labels on stat badges', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const workersBadge = screen.getByLabelText('Assign workers');
      const leadsBadge = screen.getByLabelText('Assign leads');

      expect(workersBadge).toBeInTheDocument();
      expect(leadsBadge).toBeInTheDocument();
    });
  });

  describe('Back Button Functionality', () => {
    it('should call onBack when back button is clicked', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple back button clicks', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups');

      fireEvent.click(backButton);
      fireEvent.click(backButton);
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(3);
    });

    it('should have correct aria-label on back button', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups').closest('button');
      expect(backButton).toHaveAttribute('aria-label', 'Back to Groups');
    });
  });

  describe('Member Count Badge', () => {
    it('should display correct member count with total', () => {
      render(<GroupDetailHeader {...defaultProps} memberCount={10} />);

      expect(screen.getByText('10 of 150 workers')).toBeInTheDocument();
    });

    it('should display singular form for 1 worker', () => {
      (useAppSelector as jest.Mock).mockReturnValue(1);
      render(<GroupDetailHeader {...defaultProps} memberCount={1} />);

      expect(screen.getByText('1 of 1 worker')).toBeInTheDocument();
    });

    it('should display plural form for 0 workers', () => {
      render(<GroupDetailHeader {...defaultProps} memberCount={0} />);

      expect(screen.getByText('0 of 150 workers')).toBeInTheDocument();
    });

    it('should display plural form for multiple workers', () => {
      render(<GroupDetailHeader {...defaultProps} memberCount={25} />);

      expect(screen.getByText('25 of 150 workers')).toBeInTheDocument();
    });

    it('should handle large member counts', () => {
      (useAppSelector as jest.Mock).mockReturnValue(10000);
      render(<GroupDetailHeader {...defaultProps} memberCount={9999} />);

      expect(screen.getByText('9999 of 10000 workers')).toBeInTheDocument();
    });

    it('should use headerTotalCount from Redux', () => {
      (useAppSelector as jest.Mock).mockReturnValue(200);
      render(<GroupDetailHeader {...defaultProps} memberCount={5} />);

      expect(screen.getByText('5 of 200 workers')).toBeInTheDocument();
    });
  });

  describe('Manager Count Badge', () => {
    it('should display correct manager count', () => {
      render(<GroupDetailHeader {...defaultProps} managerCount={3} />);

      expect(screen.getByText('3 group leads')).toBeInTheDocument();
    });

    it('should display singular form for 1 group lead', () => {
      render(<GroupDetailHeader {...defaultProps} managerCount={1} />);

      expect(screen.getByText('1 group lead')).toBeInTheDocument();
    });

    it('should display plural form for 0 group leads', () => {
      render(<GroupDetailHeader {...defaultProps} managerCount={0} />);

      expect(screen.getByText('0 group leads')).toBeInTheDocument();
    });

    it('should display plural form for multiple group leads', () => {
      render(<GroupDetailHeader {...defaultProps} managerCount={15} />);

      expect(screen.getByText('15 group leads')).toBeInTheDocument();
    });
  });

  describe('Group Name Display', () => {
    it('should display short group names', () => {
      render(<GroupDetailHeader {...defaultProps} groupName="Team A" />);

      expect(screen.getByText('Team A')).toBeInTheDocument();
    });

    it('should display long group names', () => {
      const longName = 'Engineering Team with a Very Long Name for Testing';
      render(<GroupDetailHeader {...defaultProps} groupName={longName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should display group names with special characters', () => {
      render(
        <GroupDetailHeader {...defaultProps} groupName="Team A & B (2024)" />,
      );

      expect(screen.getByText('Team A & B (2024)')).toBeInTheDocument();
    });

    it('should display group names with numbers', () => {
      render(<GroupDetailHeader {...defaultProps} groupName="Team 123" />);

      expect(screen.getByText('Team 123')).toBeInTheDocument();
    });

    it('should display empty group name', () => {
      render(<GroupDetailHeader {...defaultProps} groupName="" />);

      const groupTitle = screen.queryByText('Engineering Team');
      expect(groupTitle).not.toBeInTheDocument();
    });
  });

  describe('Props Integration', () => {
    it('should work with all props provided', () => {
      const props = {
        groupName: 'Full Team',
        memberCount: 100,
        managerCount: 10,
        onBack: mockOnBack,
        onAssignWorkers: mockOnAssignWorkers,
        onAssignLeads: mockOnAssignLeads,
      };

      render(<GroupDetailHeader {...props} />);

      expect(screen.getByText('Full Team')).toBeInTheDocument();
      expect(screen.getByText('100 of 150 workers')).toBeInTheDocument();
      expect(screen.getByText('10 group leads')).toBeInTheDocument();
    });

    it('should update when props change', () => {
      const { rerender } = render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('5 of 150 workers')).toBeInTheDocument();

      rerender(
        <GroupDetailHeader
          {...defaultProps}
          groupName="Updated Team"
          memberCount={10}
        />,
      );

      expect(screen.getByText('Updated Team')).toBeInTheDocument();
      expect(screen.getByText('10 of 150 workers')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render back button container', () => {
      const { container } = render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups').closest('button');
      expect(backButton).toBeInTheDocument();
    });

    it('should render group header with title and stats', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByText('Engineering Team')).toBeInTheDocument();
      expect(screen.getByText('5 of 150 workers')).toBeInTheDocument();
      expect(screen.getByText('2 group leads')).toBeInTheDocument();
    });

    it('should render stats badges together', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const workerBadge = screen.getByText('5 of 150 workers');
      const leadBadge = screen.getByText('2 group leads');

      expect(workerBadge).toBeInTheDocument();
      expect(leadBadge).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible back button', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups').closest('button');
      expect(backButton).toHaveAttribute('aria-label', 'Back to Groups');
    });

    it('should be keyboard navigable', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups').closest('button');
      expect(backButton).toBeInTheDocument();

      // Button should be focusable
      backButton?.focus();
      expect(document.activeElement).toBe(backButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero counts', () => {
      render(
        <GroupDetailHeader
          {...defaultProps}
          memberCount={0}
          managerCount={0}
        />,
      );

      expect(screen.getByText('0 of 150 workers')).toBeInTheDocument();
      expect(screen.getByText('0 group leads')).toBeInTheDocument();
    });

    it('should handle very large counts', () => {
      (useAppSelector as jest.Mock).mockReturnValue(1000000);
      render(
        <GroupDetailHeader
          {...defaultProps}
          memberCount={999999}
          managerCount={99999}
        />,
      );

      expect(screen.getByText('999999 of 1000000 workers')).toBeInTheDocument();
      expect(screen.getByText('99999 group leads')).toBeInTheDocument();
    });

    it('should handle rapid back button clicks', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const backButton = screen.getByText('Groups');

      for (let i = 0; i < 10; i += 1) {
        fireEvent.click(backButton);
      }

      expect(mockOnBack).toHaveBeenCalledTimes(10);
    });

    it('should handle group name with unicode characters', () => {
      render(
        <GroupDetailHeader {...defaultProps} groupName="Team 日本語 中文" />,
      );

      expect(screen.getByText('Team 日本語 中文')).toBeInTheDocument();
    });

    it('should handle group name with emojis', () => {
      render(<GroupDetailHeader {...defaultProps} groupName="Team 🚀 💻" />);

      expect(screen.getByText('Team 🚀 💻')).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render all required icons', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('person-three-icon')).toHaveLength(2);
      expect(screen.getAllByTestId('icon-control')).toHaveLength(2);
    });

    it('should render icons in correct order', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      const personIcons = screen.getAllByTestId('person-three-icon');
      const iconControls = screen.getAllByTestId('icon-control');

      expect(personIcons.length).toBe(2);
      expect(iconControls.length).toBe(2);
    });
  });

  describe('NTTF - shouldShowGroupLeads', () => {
    it('should hide leads badge when shouldShowGroupLeads is false', () => {
      render(
        <GroupDetailHeader {...defaultProps} shouldShowGroupLeads={false} />,
      );

      // Workers badge should still be visible
      expect(screen.getByText('5 of 150 workers')).toBeInTheDocument();

      // Leads badge should be hidden
      expect(screen.queryByText('2 group leads')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Assign leads')).not.toBeInTheDocument();
    });

    it('should render only one person icon when leads badge is hidden', () => {
      render(
        <GroupDetailHeader {...defaultProps} shouldShowGroupLeads={false} />,
      );

      const personIcons = screen.getAllByTestId('person-three-icon');
      expect(personIcons).toHaveLength(1); // Only workers badge icon
    });

    it('should show leads badge when shouldShowGroupLeads is true', () => {
      render(<GroupDetailHeader {...defaultProps} shouldShowGroupLeads />);

      expect(screen.getByText('2 group leads')).toBeInTheDocument();
      expect(screen.getByLabelText('Assign leads')).toBeInTheDocument();
    });

    it('should default to showing leads badge when shouldShowGroupLeads is not provided', () => {
      render(<GroupDetailHeader {...defaultProps} />);

      expect(screen.getByText('2 group leads')).toBeInTheDocument();
    });
  });
});
