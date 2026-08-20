import React, { useMemo } from 'react';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import { useIntl, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { ProjectEstimateData } from '../types';
import { useDetailsPageTrackingPoints } from '../hooks/useDetailsPageTrackingPoints';

interface HoursEstimateTableProps {
  estimate: ProjectEstimateData;
  onViewWorkers?: () => void;
}

// Mirror the column proportions used by ServiceItemTable so the two tables
// look visually consistent when toggling between estimate types.
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

interface HoursMetrics {
  estimatedHours: number;
  hoursWorked: number;
  percentCompleted: number;
  hoursRemaining: number;
}

export const buildHoursMetrics = (
  estimate: ProjectEstimateData,
): HoursMetrics => {
  const estimatedHours = estimate.budgetHoursTotal ?? 0;
  const hoursWorked =
    Math.round(((estimate.elapsedSeconds ?? 0) / 3600) * 100) / 100;
  const percentCompleted =
    estimatedHours > 0
      ? Math.round((hoursWorked / estimatedHours) * 1000) / 10
      : 0;
  const rawRemaining = estimatedHours - hoursWorked;
  return {
    estimatedHours,
    hoursWorked,
    percentCompleted,
    hoursRemaining: Math.max(Math.round(rawRemaining * 100) / 100, 0),
  };
};

const HoursEstimateTable: React.FC<HoursEstimateTableProps> = ({
  estimate,
  onViewWorkers,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const trackingPoints = useDetailsPageTrackingPoints();

  const metrics = useMemo(() => buildHoursMetrics(estimate), [estimate]);

  return (
    <div data-testid="hours-estimate-table-container">
      <StyledTable
        divider="horizontal"
        hover="row"
        density="roomy"
        summary={text('timeProject.summary.hoursEstimateTable.summary')}
        data-testid="hours-estimate-table"
      >
        <Table.Header>
          <Table.Row>
            <Table.Cell>
              <B3 weight="demi">
                {text('timeProject.summary.hoursEstimateTable.totalHours')}
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
          <Table.Row data-testid="hours-estimate-row">
            <Table.Cell>
              <B3>
                {text('timeProject.summary.hoursEstimateTable.totalHours')}
              </B3>
            </Table.Cell>
            <Table.Cell>
              <B3>{metrics.estimatedHours.toFixed(2)}</B3>
            </Table.Cell>
            <Table.Cell>
              <B3>{metrics.hoursWorked.toFixed(2)}</B3>
            </Table.Cell>
            <Table.Cell>
              <PercentCell $value={metrics.percentCompleted}>
                <B3>{metrics.percentCompleted.toFixed(1)}%</B3>
              </PercentCell>
            </Table.Cell>
            <Table.Cell>
              <RemainingCell
                $overdue={metrics.percentCompleted > 100}
                data-testid="hours-estimate-remaining"
              >
                <B3>{metrics.hoursRemaining.toFixed(2)}</B3>
              </RemainingCell>
            </Table.Cell>
            <Table.Cell>
              <ViewWorkersLink
                data-testid="hours-estimate-view-workers"
                onClick={() => {
                  track(trackingPoints.VIEW_WORKERS);
                  onViewWorkers?.();
                }}
              >
                {text('timeProject.summary.serviceItemTable.viewWorkers')}
              </ViewWorkersLink>
            </Table.Cell>
          </Table.Row>
        </tbody>
      </StyledTable>
    </div>
  );
};

export default HoursEstimateTable;
