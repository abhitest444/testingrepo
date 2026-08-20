/* eslint-disable react-hooks/rules-of-hooks */
import { Table } from '@ids-ts/table';
import React, { useMemo } from 'react';
import Button from '@ids-ts/button';
import { Activity } from '@ids-ts/loader';
import styled from 'styled-components';
import { useIntl } from '@payroll/quicksand';
import { Modal } from '@ids-ts/modal-dialog';
import { useCurrencyFormat } from 'src/js/service/utils/sandboxUtils';
import {
  getAllSearchTimeEntriesInput,
  useSearchTransactionTimeEntries,
} from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { RECENT_TIME_RECORDS_LIMIT } from 'src/js/common/constants';
import { useGetCustomerData } from 'src/js/service/hooks/customer/useGetCustomerData';

const StyledModal = styled(Modal)`
  position: fixed;
  top: 60px;
  left: 10px;
  width: 100%;
  padding: 20px 20px 10px 20px;
`;

const StyledContent = styled.div`
  width: 100%;
  padding-left: 5px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledHeader = styled.header`
  font-size: var(--font-size-component-medium);
  color: var(--color-text-primary);
  font-style: normal;
  font-weight: var(--font-weight-component-bold);
  padding: 10px 0 10px 10px;
`;

const StyledDivider = styled.div`
  height: 1px;
  margin-top: 15px;
  margin-bottom: 5px;
  margin-left: 5px;
  margin-right: 5px;

  background-color: var(--color-divider-tertiary);
`;

const StyledActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;
`;

const StyledButton = styled(Button)`
  margin-left: auto;
  font-size: var(--font-size-action-small);
`;

const StyledTableRow = styled(Table.Row)`
  padding: 5px 0 10px 10px;
  width: auto;
  &:hover {
    cursor: pointer;
    background-color: var(--color-container-background-tertiary);
  }
`;

const StyledTableCell = styled(Table.Cell)`
  display: table-cell;
  white-space: nowrap;
  width: auto;
  font-size: var(--font-size-component-small);
  font-weight: var(--font-weight-component);
  line-height: 20px;
  &:first-child {
    margin-right: 20px;
  }
`;

export interface RecentTimeActivitiesModalProps {
  open: boolean;
  onClose: (result: { success: boolean } | null) => void;
  isTimeActivity?: boolean;
  timeTrackingOnlyId?: string;
  onSelect: (id?: string) => void;
  isTimeEntryPrimaryDataSourceEnabled?: boolean;
}

export default function RecentTimeActivitiesModal({
  open,
  onClose,
  isTimeActivity = false,
  timeTrackingOnlyId,
  onSelect,
  isTimeEntryPrimaryDataSourceEnabled,
}: RecentTimeActivitiesModalProps): JSX.Element {
  const intl = useIntl();

  const handleOnClose = () => onClose(null);

  const handleSelect = (id?: string) => {
    onSelect(id);
    handleOnClose();
  };

  const renderPopoverHeader = () => (
    <StyledHeader>
      {intl.formatMessage({ id: 'history.recent.time.activites' })}
    </StyledHeader>
  );

  const { data: allTransactionsData } = useSearchTransactionTimeEntries({
    input: getAllSearchTimeEntriesInput(
      isTimeActivity,
      timeTrackingOnlyId,
      isTimeActivity && isTimeEntryPrimaryDataSourceEnabled, // to activate time summary flow
    ),
    first: RECENT_TIME_RECORDS_LIMIT,
  });

  const customerIds = useMemo(
    () =>
      allTransactionsData
        ?.map((transaction) => transaction.timeAgainst?.customer?.id)
        .filter((id): id is string => !!id) || [],
    [allTransactionsData],
  );

  const { data: customerData, loading: customerDataLoading } =
    useGetCustomerData({
      customerIds,
    });

  const formatCurrency = (billableRate: number, duration: number) =>
    useCurrencyFormat(
      parseFloat(((billableRate * duration) / 3600).toFixed(2)),
    );

  const timeChargeTitle = intl.formatMessage({ id: 'time.charge' });
  const timeEntryTitle = intl.formatMessage({ id: 'time.entry' });

  const renderRecentTimeActivities = () => (
    <StyledContent>
      <Table density="cozy">
        {allTransactionsData &&
          allTransactionsData.map((transaction: any) => {
            const customer = customerData.find(
              (c: any) =>
                transaction.timeAgainst.customer &&
                c.id === transaction.timeAgainst.customer.id,
            );
            return (
              <StyledTableRow
                key={transaction.id}
                onClick={() =>
                  handleSelect(
                    transaction.id ? String(transaction.id) : undefined,
                  )
                }
              >
                <StyledTableCell>
                  {transaction.isExported === true
                    ? timeChargeTitle
                    : timeEntryTitle}
                </StyledTableCell>
                <StyledTableCell>{transaction.date}</StyledTableCell>
                {!timeTrackingOnlyId && (
                  <StyledTableCell>
                    {formatCurrency(
                      transaction.billableRate,
                      transaction.duration,
                    )}
                  </StyledTableCell>
                )}
                <StyledTableCell>{customer?.fullName || '-'}</StyledTableCell>
              </StyledTableRow>
            );
          })}
      </Table>
    </StyledContent>
  );

  const navigateToTransactions = () => (
    <StyledActions>
      <StyledButton
        onClick={() => handleSelect()}
        loadingComponent={<Activity shape="dots" size="small" />}
        priority="tertiary"
        purpose="special"
        size="medium"
      >
        {intl.formatMessage({ id: 'history.view.more' })}
      </StyledButton>
    </StyledActions>
  );

  const renderHorizontalLineDivider = () => <StyledDivider />;

  return (
    <StyledModal open={open} onClose={handleOnClose}>
      <>
        <>
          {renderPopoverHeader()}
          {renderRecentTimeActivities()}
        </>
        {renderHorizontalLineDivider()}
        {navigateToTransactions()}
      </>
    </StyledModal>
  );
}
