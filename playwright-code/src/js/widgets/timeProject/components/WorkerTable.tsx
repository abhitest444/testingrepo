import React from 'react';
import { Table } from '@ids-ts/table';
import { Pagination } from '@ids-ts/pagination';
import { Activity } from '@ids-ts/loader';
import { B3 } from '@ids-ts/typography';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { WorkerRow } from '../types';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { useDetailsPageTrackingPoints } from '../hooks/useDetailsPageTrackingPoints';

interface WorkerTableProps {
  workers: WorkerRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const StyledTable = styled(Table)`
  [role='columnheader'] {
    text-transform: none;
    font-size: 14px;
  }

  table {
    table-layout: fixed;
    width: 100%;
  }

  td,
  th {
    text-align: left;
    vertical-align: middle;
  }
`;

const HoursCell = styled.div`
  text-align: left;
`;

const HoursHeader = styled.div`
  text-align: left;
  width: 100%;
`;

const WorkerCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  border-radius: 50%;
  background-color: #d6e4f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #393a3d;
  flex-shrink: 0;
  line-height: 1;
  overflow: hidden;
`;

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const PaginationFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
`;

const NoData = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b6c72;
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
`;

const WorkerTable: React.FC<WorkerTableProps> = ({
  workers,
  loading,
  page,
  totalPages,
  onNextPage,
  onPrevPage,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const trackingPoints = useDetailsPageTrackingPoints();

  if (loading && workers.length === 0) {
    return (
      <LoaderContainer data-testid="worker-table-loader">
        <Activity shape="dots" size="large" />
      </LoaderContainer>
    );
  }

  if (!loading && workers.length === 0) {
    return (
      <NoData data-testid="worker-table-no-data">
        <B3>{text('timeProject.summary.workerTable.noData')}</B3>
      </NoData>
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < page) {
      track(trackingPoints.LEFT_PAGINATION_ARROW_USERS);
      onPrevPage();
    } else if (newPage > page) {
      track(trackingPoints.RIGHT_PAGINATION_ARROW_USERS);
      onNextPage();
    }
  };

  return (
    <div data-testid="worker-table-container">
      <StyledTable
        divider="horizontal"
        hover="row"
        density="roomy"
        summary={text('timeProject.summary.workerTable.summary')}
        data-testid="worker-table"
      >
        <Table.Header>
          <Table.Row>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.workerTable.workers')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <HoursHeader>
                <B3 weight="demi">
                  {text('timeProject.summary.workerTable.hoursWorked')}
                </B3>
              </HoursHeader>
            </Table.Cell>
          </Table.Row>
        </Table.Header>
        <tbody>
          {workers.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>
                <WorkerCell>
                  <Avatar>{getInitials(row.displayName)}</Avatar>
                  <B3>{row.displayName}</B3>
                </WorkerCell>
              </Table.Cell>
              <Table.Cell>
                <HoursCell>
                  <B3>{row.hoursWorked.toFixed(2)}</B3>
                </HoursCell>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </StyledTable>
      {totalPages > 1 && (
        <PaginationFooter data-testid="worker-table-pagination">
          <Pagination
            totalPages={totalPages}
            totalItems={totalPages * DEFAULT_PAGE_SIZE}
            pageSize={DEFAULT_PAGE_SIZE}
            activePage={page}
            preventPageJump
            labels={{
              summaryItems: text(
                'timeProject.summary.workerTable.paginationItems',
              ),
            }}
            onPageChange={handlePageChange}
          />
        </PaginationFooter>
      )}
    </div>
  );
};

export default WorkerTable;
