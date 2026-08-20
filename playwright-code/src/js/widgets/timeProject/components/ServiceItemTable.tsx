import React, { useMemo, useState } from 'react';
import { Table } from '@ids-ts/table';
import { Pagination } from '@ids-ts/pagination';
import { B3 } from '@ids-ts/typography';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { EstimateItemData, ProjectEstimateData } from '../types';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { useDetailsPageTrackingPoints } from '../hooks/useDetailsPageTrackingPoints';

interface ServiceItemTableProps {
  estimate: ProjectEstimateData;
  onViewWorkers?: (serviceItemId: string, serviceItemName: string) => void;
}

export interface ServiceItemRow extends EstimateItemData {
  hoursWorked: number;
  percentCompleted: number;
  hoursRemaining: number;
  // True when the API returned `estimatedSeconds: -1` for this service item,
  // i.e. it appears on the project but has no per-item estimate yet. Such
  // rows still show their `hoursWorked`, but every estimate-derived column
  // (estimated, % completed, remaining) should render as a dash.
  isUnestimated: boolean;
}

const UNESTIMATED_PLACEHOLDER = '-';

const COLUMN_WIDTHS = {
  name: '25%',
  hoursEstimated: '15%',
  hoursWorked: '15%',
  percentCompleted: '15%',
  hoursRemaining: '15%',
  actions: '15%',
};

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

  thead tr th:nth-child(1),
  tbody tr td:nth-child(1) {
    width: ${COLUMN_WIDTHS.name};
  }

  thead tr th:nth-child(2),
  tbody tr td:nth-child(2) {
    width: ${COLUMN_WIDTHS.hoursEstimated};
  }

  thead tr th:nth-child(3),
  tbody tr td:nth-child(3) {
    width: ${COLUMN_WIDTHS.hoursWorked};
  }

  thead tr th:nth-child(4),
  tbody tr td:nth-child(4) {
    width: ${COLUMN_WIDTHS.percentCompleted};
  }

  thead tr th:nth-child(5),
  tbody tr td:nth-child(5) {
    width: ${COLUMN_WIDTHS.hoursRemaining};
  }

  thead tr th:last-child,
  tbody tr td:last-child {
    width: ${COLUMN_WIDTHS.actions};
    text-align: right;
  }
`;

const ActionsHeaderCell = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const ViewWorkersLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #0077c5;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const OVERDUE_COLOR = '#C25700';
const GREEN_COLOR = '#2CA01C';
const DEFAULT_COLOR = '#393a3d';

const getPercentColor = (value: number): string => {
  if (value <= 0) return DEFAULT_COLOR;
  if (value <= 100) return GREEN_COLOR;
  return OVERDUE_COLOR;
};

const PercentCell = styled.span<{ $value: number }>`
  color: ${({ $value }) => getPercentColor($value)};
`;

const RemainingCell = styled.span<{ $overdue: boolean }>`
  color: ${({ $overdue }) => ($overdue ? OVERDUE_COLOR : DEFAULT_COLOR)};
`;

const PaginationFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #e0e0e0;
`;

export const buildServiceItemRows = (
  estimate: ProjectEstimateData,
): ServiceItemRow[] => {
  const items = estimate.estimateItems ?? [];

  return items.map((item) => {
    const hoursWorked =
      Math.round(((item.elapsedSeconds ?? 0) / 3600) * 100) / 100;
    const { estimatedHours } = item;
    const isUnestimated = estimatedHours < 0;
    const percentCompleted =
      !isUnestimated && estimatedHours > 0
        ? Math.round((hoursWorked / estimatedHours) * 1000) / 10
        : 0;
    const rawRemaining = estimatedHours - hoursWorked;
    return {
      ...item,
      hoursWorked,
      percentCompleted,
      hoursRemaining: isUnestimated
        ? 0
        : Math.max(Math.round(rawRemaining * 100) / 100, 0),
      isUnestimated,
    };
  });
};

const ServiceItemTable: React.FC<ServiceItemTableProps> = ({
  estimate,
  onViewWorkers,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string, values?: Record<string, any>) =>
    intl.formatMessage({ id }, values);
  const trackingPoints = useDetailsPageTrackingPoints();

  const [page, setPage] = useState(1);

  const rows = useMemo(() => buildServiceItemRows(estimate), [estimate]);
  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / DEFAULT_PAGE_SIZE);
  const pagedRows = rows.slice(
    (page - 1) * DEFAULT_PAGE_SIZE,
    page * DEFAULT_PAGE_SIZE,
  );

  return (
    <div data-testid="service-item-table-container">
      <StyledTable
        divider="horizontal"
        hover="row"
        density="roomy"
        summary={text('timeProject.summary.serviceItemTable.summary')}
        data-testid="service-item-table"
      >
        <Table.Header>
          <Table.Row>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.serviceItemTable.serviceItems', {
                  count: totalItems,
                })}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.serviceItemTable.hoursEstimated')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.serviceItemTable.hoursWorked')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.serviceItemTable.percentCompleted')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.serviceItemTable.hoursRemaining')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <ActionsHeaderCell>
                <B3 weight="demi">
                  {text('timeProject.summary.serviceItemTable.actions')}
                </B3>
              </ActionsHeaderCell>
            </Table.Cell>
          </Table.Row>
        </Table.Header>
        <tbody>
          {pagedRows.map((row) => {
            // When fieldOptionId is '-1' the API signals an "others / uncategorised"
            // bucket: no real service-item DAS record exists, so we display a
            // localised "Others" label instead of the raw sentinel value.
            const displayName =
              row.fieldOptionId === '-1'
                ? text('timeProject.summary.serviceItemTable.others')
                : row.serviceItemName;
            return (
              <Table.Row key={row.fieldOptionId}>
                <Table.Cell>
                  <B3>{displayName}</B3>
                </Table.Cell>
                <Table.Cell
                  data-testid={`hours-estimated-${row.fieldOptionId}`}
                >
                  <B3>
                    {row.isUnestimated
                      ? UNESTIMATED_PLACEHOLDER
                      : row.estimatedHours.toFixed(2)}
                  </B3>
                </Table.Cell>
                <Table.Cell>
                  <B3>{row.hoursWorked.toFixed(2)}</B3>
                </Table.Cell>
                <Table.Cell data-testid={`percent-${row.fieldOptionId}`}>
                  {row.isUnestimated ? (
                    <B3>{UNESTIMATED_PLACEHOLDER}</B3>
                  ) : (
                    <PercentCell $value={row.percentCompleted}>
                      <B3>{row.percentCompleted.toFixed(1)}%</B3>
                    </PercentCell>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {row.isUnestimated ? (
                    <span data-testid={`remaining-${row.fieldOptionId}`}>
                      <B3>{UNESTIMATED_PLACEHOLDER}</B3>
                    </span>
                  ) : (
                    <RemainingCell
                      $overdue={row.percentCompleted > 100}
                      data-testid={`remaining-${row.fieldOptionId}`}
                    >
                      <B3>{row.hoursRemaining.toFixed(2)}</B3>
                    </RemainingCell>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <ViewWorkersLink
                    data-testid={`view-workers-${row.fieldOptionId}`}
                    onClick={() => {
                      track(trackingPoints.VIEW_WORKERS);
                      // Pass fieldOptionId ('-1' for the others bucket) so the
                      // worker-summary query receives the correct sentinel value.
                      onViewWorkers?.(row.fieldOptionId, displayName);
                    }}
                  >
                    {text('timeProject.summary.serviceItemTable.viewWorkers')}
                  </ViewWorkersLink>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </StyledTable>
      {totalPages > 1 && (
        <PaginationFooter data-testid="service-item-pagination">
          <Pagination
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={DEFAULT_PAGE_SIZE}
            activePage={page}
            preventPageJump
            labels={{
              summaryItems: text(
                'timeProject.summary.serviceItemTable.paginationItems',
              ),
            }}
            onPageChange={(newPage: number) => {
              if (newPage < page) {
                track(trackingPoints.LEFT_PAGINATION_ARROW_ESTIMATES);
              } else if (newPage > page) {
                track(trackingPoints.RIGHT_PAGINATION_ARROW_ESTIMATES);
              }
              setPage(newPage);
            }}
          />
        </PaginationFooter>
      )}
    </div>
  );
};

export default ServiceItemTable;
