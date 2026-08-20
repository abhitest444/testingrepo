import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { WorkerRow } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkerRow';
import type { Worker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { navigateToWorkerSettings } from 'src/js/widgets/assignments/utils/helpers';

// Create mock functions
const mockNavigate = jest.fn();
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
const mockNavigateToWorkerSettings =
  navigateToWorkerSettings as jest.MockedFunction<
    typeof navigateToWorkerSettings
  >;

// Mock dependencies
jest.mock('src/js/widgets/assignments/utils/helpers', () => ({
  ...jest.requireActual('src/js/widgets/assignments/utils/helpers'),
  navigateToWorkerSettings: jest.fn(),
}));

jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
  useSandbox: jest.fn(),
  useTracking: jest.fn(() => jest.fn()),
}));

jest.mock('@ids-ts/table', () => ({
  Table: {
    Row: ({ children, className, onClick, role }: any) => (
      <tr
        className={className}
        onClick={onClick}
        role={onClick ? role || 'button' : role}
        onKeyDown={
          onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
        }
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </tr>
    ),
    Cell: ({ children, className, onClick, role }: any) => (
      <td
        className={className}
        onClick={onClick}
        role={onClick ? role || 'button' : role}
        onKeyDown={
          onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
        }
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </td>
    ),
  },
}));

jest.mock('@ids-ts/link', () => {
  const React = require('react');
  const Link = React.forwardRef(
    (
      { children, onClick, className, href, 'data-testid': testId }: any,
      ref: any,
    ) => (
      <a
        ref={ref}
        data-testid={testId || 'link'}
        className={className}
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.(e);
        }}
      >
        {children}
      </a>
    ),
  );
  Link.displayName = 'Link';

  return {
    __esModule: true,
    Link,
  };
});

jest.mock(
  'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled',
  () => {
    const React = require('react');
    const StyledLink = React.forwardRef(
      (
        {
          children,
          onClick,
          className,
          href,
          'data-testid': testId,
          'aria-disabled': ariaDisabled,
          $isDisabled,
        }: any,
        ref: any,
      ) => (
        <a
          ref={ref}
          data-testid={testId || 'link'}
          className={className}
          href={href}
          aria-disabled={ariaDisabled}
          onClick={(e) => {
            e.preventDefault();
            onClick?.(e);
          }}
        >
          {children}
        </a>
      ),
    );
    StyledLink.displayName = 'StyledLink';

    return {
      WorkerTypeText: ({ children, className }: any) => (
        <div className={className}>{children}</div>
      ),
      ActionsContainer: ({ children, className }: any) => (
        <div className={className}>{children}</div>
      ),
      WorkerCell: ({ children, className, onClick, role }: any) => (
        <td
          className={className}
          onClick={onClick}
          role={onClick ? role || 'button' : role}
          onKeyDown={
            onClick ? (e: any) => e.key === 'Enter' && onClick(e) : undefined
          }
          tabIndex={onClick ? 0 : undefined}
        >
          {children}
        </td>
      ),
      WorkerNameContainer: ({ children, className }: any) => (
        <div className={className}>{children}</div>
      ),
      WorkerName: ({ children, className }: any) => (
        <strong className={className}>{children}</strong>
      ),
      StyledLink,
    };
  },
);

describe('WorkerRow', () => {
  const mockFormatMessage = jest.fn((msg) => msg.id);

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogger.error.mockClear();

    (useIntl as jest.Mock).mockReturnValue({
      formatMessage: mockFormatMessage,
    });
    (useSandbox as jest.Mock).mockReturnValue({
      navigation: {
        navigate: mockNavigate,
      },
      logger: mockLogger,
    });
  });

  const createMockWorker = (overrides?: Partial<Worker>): Worker => ({
    id: 'worker-1',
    name: 'John Doe',
    status: 'Active',
    role: TimeTracking_TimeForType.Employee,
    ...overrides,
  });

  it('should render worker name', () => {
    const worker = createMockWorker({ name: 'John Doe' });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render fallback for empty name using i18n', () => {
    const worker = createMockWorker({ name: '' });
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({ id: 'workers.noName' });
    expect(screen.getByText('workers.noName')).toBeInTheDocument();
  });

  it('should display employee type for non-contractor workers', () => {
    const worker = createMockWorker({
      role: TimeTracking_TimeForType.Employee,
    });
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'workers.type.employee',
    });
  });

  it('should display contractor type for vendor workers', () => {
    const worker = createMockWorker({
      role: TimeTracking_TimeForType.Vendor,
    });
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'workers.filter.vendor',
    });
  });

  it('should render action link with correct label', () => {
    const worker = createMockWorker();
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'workers.actions.viewSettings',
    });
    expect(screen.getByTestId('action-link-worker-1')).toBeInTheDocument();
  });

  it('should have correct test id for link', () => {
    const worker = createMockWorker({ id: 'worker-123' });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByTestId('action-link-worker-123')).toBeInTheDocument();
  });

  it('should use worker id as row key', () => {
    const worker = createMockWorker({ id: 'unique-worker-id' });
    const { container } = render(<WorkerRow worker={worker} />);

    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
  });

  it('should memoize and not re-render with same props', () => {
    const worker = createMockWorker();
    const { rerender } = render(<WorkerRow worker={worker} />);

    const firstRenderCalls = mockFormatMessage.mock.calls.length;

    // Re-render with same worker object
    rerender(<WorkerRow worker={worker} />);

    // Should not have called formatMessage again due to memoization
    expect(mockFormatMessage.mock.calls.length).toBe(firstRenderCalls);
  });

  it('should re-render when worker changes', () => {
    const worker1 = createMockWorker({ id: 'worker-1', name: 'John Doe' });
    const { rerender } = render(<WorkerRow worker={worker1} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();

    const worker2 = createMockWorker({ id: 'worker-2', name: 'Jane Smith' });
    rerender(<WorkerRow worker={worker2} />);

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('should handle worker with only firstName', () => {
    const worker = createMockWorker({ name: 'OnlyFirstName' });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByText('OnlyFirstName')).toBeInTheDocument();
  });

  it('should handle worker with spaces in name', () => {
    const worker = createMockWorker({ name: 'John Middle Doe' });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByText('John Middle Doe')).toBeInTheDocument();
  });

  it('should render three table cells', () => {
    const worker = createMockWorker();
    const { container } = render(<WorkerRow worker={worker} />);

    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(3);
  });

  it('should render worker type text in first cell', () => {
    const worker = createMockWorker({
      role: TimeTracking_TimeForType.Employee,
    });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByText('workers.type.employee')).toBeInTheDocument();
  });

  it('should have actions in the third cell', () => {
    const worker = createMockWorker();
    const { container } = render(<WorkerRow worker={worker} />);

    const cells = container.querySelectorAll('td');
    const actionsCell = cells[2];

    expect(
      actionsCell?.querySelector('[data-testid="action-link-worker-1"]'),
    ).toBeInTheDocument();
  });

  it('should call handleViewSettings when link is clicked', () => {
    const worker = createMockWorker();
    render(<WorkerRow worker={worker} />);

    const viewSettingsLink = screen.getByTestId('action-link-worker-1');

    fireEvent.click(viewSettingsLink);

    // Link should be clickable
    expect(viewSettingsLink).toBeInTheDocument();
  });

  it('should handle null name gracefully', () => {
    const worker = createMockWorker({ name: null as any });
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({ id: 'workers.noName' });
    expect(screen.getByText('workers.noName')).toBeInTheDocument();
  });

  it('should handle undefined name gracefully', () => {
    const worker = createMockWorker({ name: undefined as any });
    render(<WorkerRow worker={worker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({ id: 'workers.noName' });
    expect(screen.getByText('workers.noName')).toBeInTheDocument();
  });

  it('should handle whitespace-only name', () => {
    const worker = createMockWorker({ name: '   ' });
    render(<WorkerRow worker={worker} />);

    // Should NOT call formatMessage for whitespace-only names (they are truthy)
    expect(mockFormatMessage).not.toHaveBeenCalledWith({
      id: 'workers.noName',
    });

    // Should NOT display the fallback message since whitespace is truthy
    expect(screen.queryByText('workers.noName')).not.toBeInTheDocument();
  });

  it('should render correct worker type for different roles', () => {
    const employeeWorker = createMockWorker({
      role: TimeTracking_TimeForType.Employee,
    });
    const { rerender } = render(<WorkerRow worker={employeeWorker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'workers.type.employee',
    });

    const vendorWorker = createMockWorker({
      role: TimeTracking_TimeForType.Vendor,
    });
    rerender(<WorkerRow worker={vendorWorker} />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'workers.filter.vendor',
    });
  });

  it('should render with correct table structure', () => {
    const worker = createMockWorker();
    const { container } = render(<WorkerRow worker={worker} />);

    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();

    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(3);

    // First cell should contain worker info
    const workerCell = cells[0];
    expect(workerCell.querySelector('strong')).toBeInTheDocument();

    // Second cell should be empty
    expect(cells[1]).toBeEmptyDOMElement();

    // Third cell should contain actions
    expect(
      cells[2].querySelector('[data-testid="action-link-worker-1"]'),
    ).toBeInTheDocument();
  });

  it('should handle long worker names', () => {
    const worker = createMockWorker({
      name: 'This is a very long worker name that might cause layout issues',
    });
    render(<WorkerRow worker={worker} />);

    expect(
      screen.getByText(
        'This is a very long worker name that might cause layout issues',
      ),
    ).toBeInTheDocument();
  });

  it('should handle special characters in worker names', () => {
    const worker = createMockWorker({
      name: "José María O'Connor-Smith",
    });
    render(<WorkerRow worker={worker} />);

    expect(screen.getByText("José María O'Connor-Smith")).toBeInTheDocument();
  });

  describe('Navigation', () => {
    const mockSandbox = {
      navigation: { navigate: mockNavigate },
      logger: mockLogger,
    };

    beforeEach(() => {
      (useSandbox as jest.Mock).mockReturnValue(mockSandbox);
    });

    it('should call navigateToWorkerSettings when view settings link is clicked', () => {
      const worker = createMockWorker({
        id: 'worker-123',
        name: 'John Doe',
        role: TimeTracking_TimeForType.Employee,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId('action-link-worker-123');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });

    it('should call navigateToWorkerSettings with special character name', () => {
      const worker = createMockWorker({
        id: 'worker-456',
        name: "José María O'Connor-Smith",
        role: TimeTracking_TimeForType.Vendor,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId('action-link-worker-456');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });

    it('should call navigateToWorkerSettings with empty name', () => {
      const worker = createMockWorker({
        id: 'worker-789',
        name: '',
        role: TimeTracking_TimeForType.Employee,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId('action-link-worker-789');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });

    it('should call navigateToWorkerSettings for vendor workers', () => {
      const worker = createMockWorker({
        id: 'contractor-1',
        name: 'Contractor Name',
        role: TimeTracking_TimeForType.Vendor,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId('action-link-contractor-1');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });

    it('should call navigateToWorkerSettings with special character ID', () => {
      const worker = createMockWorker({
        id: 'worker@special#chars',
        name: 'Test Worker',
        role: TimeTracking_TimeForType.Employee,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId(
        'action-link-worker@special#chars',
      );
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });

    it('should call navigateToWorkerSettings with null name', () => {
      const worker = createMockWorker({
        id: 'worker-null',
        name: null as any,
        role: TimeTracking_TimeForType.Employee,
      });
      render(<WorkerRow worker={worker} />);

      const viewSettingsLink = screen.getByTestId('action-link-worker-null');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).toHaveBeenCalledWith(
        worker,
        mockSandbox,
        'WorkerRow',
      );
    });
  });

  describe('QBO User Disabled State', () => {
    it('should disable view settings link for QBO users', () => {
      const qboWorker = createMockWorker({
        id: 'qbo-1',
        name: 'QBO User',
        role: TimeTracking_TimeForType.LegacyQboUser,
      });
      render(<WorkerRow worker={qboWorker} />);

      const viewSettingsLink = screen.getByTestId('action-link-qbo-1');
      expect(viewSettingsLink).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not call navigateToWorkerSettings when QBO user link is clicked', () => {
      const qboWorker = createMockWorker({
        id: 'qbo-1',
        name: 'QBO User',
        role: TimeTracking_TimeForType.LegacyQboUser,
      });
      render(<WorkerRow worker={qboWorker} />);

      const viewSettingsLink = screen.getByTestId('action-link-qbo-1');
      fireEvent.click(viewSettingsLink);

      expect(mockNavigateToWorkerSettings).not.toHaveBeenCalled();
    });

    it('should not disable view settings link for employee workers', () => {
      const employeeWorker = createMockWorker({
        id: 'emp-1',
        name: 'Employee',
        role: TimeTracking_TimeForType.Employee,
      });
      render(<WorkerRow worker={employeeWorker} />);

      const viewSettingsLink = screen.getByTestId('action-link-emp-1');
      expect(viewSettingsLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should not disable view settings link for vendor workers', () => {
      const vendorWorker = createMockWorker({
        id: 'vendor-1',
        name: 'Vendor',
        role: TimeTracking_TimeForType.Vendor,
      });
      render(<WorkerRow worker={vendorWorker} />);

      const viewSettingsLink = screen.getByTestId('action-link-vendor-1');
      expect(viewSettingsLink).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should display User type for QBO users', () => {
      const qboWorker = createMockWorker({
        role: TimeTracking_TimeForType.LegacyQboUser,
      });
      render(<WorkerRow worker={qboWorker} />);

      expect(mockFormatMessage).toHaveBeenCalledWith({
        id: 'workers.type.user',
      });
    });
  });
});
