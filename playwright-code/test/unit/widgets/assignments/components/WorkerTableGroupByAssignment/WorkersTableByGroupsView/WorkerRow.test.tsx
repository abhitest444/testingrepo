/**
 * Test suite for WorkerRow Component
 * QUANTA-5011: Unit tests for worker/member row rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkerRow } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkerRow';
import type { Worker } from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

// Mock @payroll/quicksand
const mockNavigate = jest.fn();
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    navigation: {
      navigate: mockNavigate,
    },
    logger: mockLogger,
  }),
  useTracking: () => jest.fn(),
}));

// Mock IDS components
jest.mock('@ids-ts/table', () => {
  const MockTable = ({ children }: any) => <table>{children}</table>;

  MockTable.Header = ({ children }: any) => <thead>{children}</thead>;
  MockTable.Body = ({ children }: any) => <tbody>{children}</tbody>;
  MockTable.Row = ({ children }: any) => <tr>{children}</tr>;
  MockTable.Cell = ({ children }: any) => <td>{children}</td>;

  return {
    Table: MockTable,
  };
});

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

describe('WorkerRow Component', () => {
  const mockEmployee: Worker = {
    id: 'worker1',
    name: 'John Doe',
    status: 'ACTIVE',
    role: TimeTracking_TimeForType.Employee,
  };

  const mockContractor: Worker = {
    id: 'contractor1',
    name: 'Jane Smith',
    status: 'ACTIVE',
    role: TimeTracking_TimeForType.Vendor,
  };

  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );
      expect(container).toBeInTheDocument();
    });

    test('renders worker name correctly', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('renders worker type correctly', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('workers.type.employee')).toBeInTheDocument();
    });
  });

  describe('Worker Type Display', () => {
    test('displays EMPLOYEE type correctly', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('workers.type.employee')).toBeInTheDocument();
    });

    test('displays VENDOR type correctly', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockContractor} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('workers.filter.vendor')).toBeInTheDocument();
    });

    test('handles different worker types', () => {
      const workerWithDifferentType: Worker = {
        ...mockEmployee,
        role: TimeTracking_TimeForType.LegacyQboUser,
      };

      render(
        <table>
          <tbody>
            <WorkerRow worker={workerWithDifferentType} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('workers.type.user')).toBeInTheDocument();
    });
  });

  describe('Actions Link', () => {
    test('renders View Settings link', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(screen.getByTestId('action-link-worker1')).toBeInTheDocument();
    });

    test('renders "View settings" link with correct i18n key', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(
        screen.getByText('workers.actions.viewSettings'),
      ).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders correct DOM structure', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const row = container.querySelector('tr');
      expect(row).toBeInTheDocument();

      const cells = row?.querySelectorAll('td');
      expect(cells).toHaveLength(3);
    });

    test('first cell contains worker name and type', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const firstCell = container.querySelector('tr td:first-child');
      expect(firstCell).toHaveTextContent('John Doe');
      expect(firstCell).toHaveTextContent('workers.type.employee');
    });

    test('middle cell is empty (for customers)', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const middleCell = container.querySelector('tr td:nth-child(2)');
      expect(middleCell).toBeEmptyDOMElement();
    });

    test('last cell contains actions', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const lastCell = container.querySelector('tr td:last-child');
      expect(lastCell).toContainElement(
        screen.getByTestId('action-link-worker1'),
      );
    });
  });

  describe('Accessibility', () => {
    test('row has proper table cell structure', () => {
      const { container } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const cells = container.querySelectorAll('td');
      cells.forEach((cell) => {
        expect(cell.tagName).toBe('TD');
      });
    });

    test('worker name is displayed as text', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      const nameElement = screen.getByText('John Doe');
      expect(nameElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty display name', () => {
      const workerWithEmptyName: Worker = {
        ...mockEmployee,
        name: '',
      };

      render(
        <table>
          <tbody>
            <WorkerRow worker={workerWithEmptyName} />
          </tbody>
        </table>,
      );

      // Should still render without crashing
      expect(screen.getByText('workers.type.employee')).toBeInTheDocument();
    });

    test('handles long worker name', () => {
      const workerWithLongName: Worker = {
        ...mockEmployee,
        name: 'Very Long Worker Name That Might Need Special Handling Or Truncation',
      };

      render(
        <table>
          <tbody>
            <WorkerRow worker={workerWithLongName} />
          </tbody>
        </table>,
      );

      expect(
        screen.getByText(
          'Very Long Worker Name That Might Need Special Handling Or Truncation',
        ),
      ).toBeInTheDocument();
    });

    test('handles worker with vendor flag true', () => {
      render(
        <table>
          <tbody>
            <WorkerRow worker={mockContractor} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('workers.filter.vendor')).toBeInTheDocument();
    });

    test('handles inactive worker', () => {
      const inactiveWorker: Worker = {
        ...mockEmployee,
        status: 'INACTIVE',
      };

      render(
        <table>
          <tbody>
            <WorkerRow worker={inactiveWorker} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('accepts and renders member prop correctly', () => {
      const { rerender } = render(
        <table>
          <tbody>
            <WorkerRow worker={mockEmployee} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();

      rerender(
        <table>
          <tbody>
            <WorkerRow worker={mockContractor} />
          </tbody>
        </table>,
      );

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });
});
