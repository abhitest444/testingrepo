import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';

interface TableHeaderProps {
  totalWorkers: number;
}

/**
 * TableHeader - Renders the table header with column titles
 */
export const TableHeader: React.FC<TableHeaderProps> = ({ totalWorkers }) => {
  const intl = useIntl();

  return (
    <Table.Header>
      <Table.Row>
        <Table.Cell>
          {intl.formatMessage({ id: 'workers.column.name' })} ({totalWorkers})
        </Table.Cell>
        <Table.Cell>
          {intl.formatMessage({ id: 'workers.column.customers' })}
        </Table.Cell>
        <Table.Cell>
          {intl.formatMessage({ id: 'workers.column.actions' })}
        </Table.Cell>
      </Table.Row>
    </Table.Header>
  );
};
