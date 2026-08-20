/**
 * Test suite for WorkersByGroupTableHeader
 * QUANTA-5011: Unit tests for table header component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableHeader } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersByGroupTableHeader';

// Mock the @payroll/quicksand useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

describe('WorkersByGroupTableHeader Component', () => {
  describe('Component Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );
      expect(container).toBeInTheDocument();
    });

    test('renders correct header structure', () => {
      render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const headers = screen.getAllByRole('cell');
      expect(headers).toHaveLength(3);
    });
  });

  describe('Column Headers', () => {
    test('renders Worker column header with correct i18n key', () => {
      render(
        <table>
          <TableHeader totalWorkers={5} />
        </table>,
      );

      expect(screen.getByText(/workers\.column\.name/)).toBeInTheDocument();
    });

    test('renders Customers column header with correct i18n key', () => {
      render(
        <table>
          <TableHeader totalWorkers={5} />
        </table>,
      );

      expect(screen.getByText('workers.column.customers')).toBeInTheDocument();
    });

    test('renders Actions column header with correct i18n key', () => {
      render(
        <table>
          <TableHeader totalWorkers={5} />
        </table>,
      );

      expect(screen.getByText('workers.column.actions')).toBeInTheDocument();
    });
  });

  describe('Worker Count Display', () => {
    test.each([
      {
        description: 'displays total worker count correctly for single worker',
        totalWorkers: 1,
        expectedContent: '(1)',
      },
      {
        description:
          'displays total worker count correctly for multiple workers',
        totalWorkers: 25,
        expectedContent: '(25)',
      },
      {
        description: 'displays zero count correctly',
        totalWorkers: 0,
        expectedContent: '(0)',
      },
      {
        description: 'displays large worker count correctly',
        totalWorkers: 1000,
        expectedContent: '(1000)',
      },
    ])('$description', ({ totalWorkers, expectedContent }) => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={totalWorkers} />
        </table>,
      );

      expect(container.textContent).toContain(expectedContent);
    });
  });

  describe('Props Handling', () => {
    test('accepts totalWorkers prop and displays it', () => {
      const { rerender, container } = render(
        <table>
          <TableHeader totalWorkers={5} />
        </table>,
      );
      expect(container.textContent).toContain('(5)');

      rerender(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );
      expect(container.textContent).toContain('(10)');
    });
  });

  describe('Accessibility', () => {
    test('table header has proper semantic structure', () => {
      render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const headers = screen.getAllByRole('cell');
      expect(headers).toHaveLength(3);

      headers.forEach((header) => {
        expect(header.tagName).toBe('TD');
      });
    });
  });

  describe('Component Structure', () => {
    test('renders with correct DOM hierarchy', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={5} />
        </table>,
      );

      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();

      const row = thead?.querySelector('tr');
      expect(row).toBeInTheDocument();

      const cells = row?.querySelectorAll('td');
      expect(cells).toHaveLength(3);
    });
  });
});
