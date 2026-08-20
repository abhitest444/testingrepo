import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableHeader } from 'src/js/widgets/assignments/components/WorkerAssignments/WorkersTableByGroupsView/WorkersByGroupTableHeader';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'workers.column.name': 'Name',
        'workers.column.customers': 'Customers',
        'workers.column.actions': 'Actions',
      };
      return messages[id] || id;
    },
  }),
}));

jest.mock('@ids-ts/table', () => {
  const MockTable = ({ children }: any) => <table>{children}</table>;
  MockTable.Header = ({ children }: any) => <thead>{children}</thead>;
  MockTable.Body = ({ children }: any) => <tbody>{children}</tbody>;
  MockTable.Row = ({ children }: any) => <tr>{children}</tr>;
  MockTable.Cell = ({ children }: any) => <th>{children}</th>;
  return { Table: MockTable };
});

describe('TableHeader Component', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      expect(container).toBeInTheDocument();
    });

    it('renders all column headers', () => {
      render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      expect(screen.getByText(/Name/)).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('displays total workers count in name column', () => {
      render(
        <table>
          <TableHeader totalWorkers={25} />
        </table>,
      );

      expect(screen.getByText(/Name \(25\)/)).toBeInTheDocument();
    });
  });

  describe('Worker Count Display', () => {
    it.each([
      {
        description: 'displays zero workers correctly',
        totalWorkers: 0,
        expectedText: /Name \(0\)/,
      },
      {
        description: 'displays single worker correctly',
        totalWorkers: 1,
        expectedText: /Name \(1\)/,
      },
      {
        description: 'displays large number of workers correctly',
        totalWorkers: 1000,
        expectedText: /Name \(1000\)/,
      },
    ])('$description', ({ totalWorkers, expectedText }) => {
      render(
        <table>
          <TableHeader totalWorkers={totalWorkers} />
        </table>,
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('updates worker count when prop changes', () => {
      const { rerender } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      expect(screen.getByText(/Name \(10\)/)).toBeInTheDocument();

      rerender(
        <table>
          <TableHeader totalWorkers={20} />
        </table>,
      );

      expect(screen.getByText(/Name \(20\)/)).toBeInTheDocument();
      expect(screen.queryByText(/Name \(10\)/)).not.toBeInTheDocument();
    });
  });

  describe('Table Structure', () => {
    it('renders correct number of column headers', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const headers = container.querySelectorAll('th');
      expect(headers).toHaveLength(3);
    });

    it('renders headers in correct order', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const headers = container.querySelectorAll('th');
      expect(headers[0]).toHaveTextContent(/Name/);
      expect(headers[1]).toHaveTextContent('Customers');
      expect(headers[2]).toHaveTextContent('Actions');
    });

    it('renders inside thead element', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();
      expect(thead?.querySelector('tr')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative worker count gracefully', () => {
      render(
        <table>
          <TableHeader totalWorkers={-1} />
        </table>,
      );

      expect(screen.getByText(/Name \(-1\)/)).toBeInTheDocument();
    });

    it('handles very large worker count', () => {
      render(
        <table>
          <TableHeader totalWorkers={999999} />
        </table>,
      );

      expect(screen.getByText(/Name \(999999\)/)).toBeInTheDocument();
    });

    it('handles decimal worker count', () => {
      render(
        <table>
          <TableHeader totalWorkers={10.5} />
        </table>,
      );

      expect(screen.getByText(/Name \(10.5\)/)).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('uses intl for column labels', () => {
      render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      // Verify that the mocked intl messages are being used
      expect(screen.getByText(/Name/)).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic table header structure', () => {
      const { container } = render(
        <table>
          <TableHeader totalWorkers={10} />
        </table>,
      );

      const thead = container.querySelector('thead');
      const row = thead?.querySelector('tr');
      const cells = row?.querySelectorAll('th');

      expect(thead).toBeInTheDocument();
      expect(row).toBeInTheDocument();
      expect(cells).toHaveLength(3);
    });
  });
});
