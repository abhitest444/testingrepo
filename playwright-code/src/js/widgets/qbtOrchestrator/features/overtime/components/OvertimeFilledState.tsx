import React, { useCallback, useMemo, useEffect } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import Button from '@ids-ts/button';
import { Pagination } from '@ids-ts/pagination';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setCurrentPage, selectCurrentPage } from '../store';
import { OvertimePolicy } from '../types/Overtime.types';
import {
  OVERTIME_TABLE_COLUMNS,
  OVERTIME_PAGINATION_CONFIG,
} from '../constants/overtimeTableConstants';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { MANAGE_OVERTIME_LANDING_TRACKING_POINTS } from '../constants/overtimeTrackingPoints';
import { OvertimePolicyRow } from './OvertimePolicyRow';
import DeletePolicyModal from './DeletePolicyModal';
import {
  Container,
  HeaderRow,
  StyledTable,
  ActionsHeaderCell,
  PaginationContainer,
} from '../styles/OvertimeFilledState.styled';
import { OVERTIME_POLICIES_PAGE_SIZE } from '../hooks/useOvertimePolicies';
import type { PoliciesPageInfo } from '../types/Overtime.types';

interface OvertimeFilledStateProps {
  policies: OvertimePolicy[];
  pageInfo: PoliciesPageInfo | null;
  onCreatePolicy: () => void;
  onEditPolicy?: (policyId: string) => void;
  onPageChange: (page: number) => void;
}

export const OvertimeFilledState: React.FC<OvertimeFilledStateProps> = ({
  policies,
  pageInfo,
  onCreatePolicy,
  onEditPolicy,
  onPageChange,
}) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const track = useTracking();
  const dispatch = useAppDispatch();

  // Redux state
  const currentPage = useAppSelector(selectCurrentPage);
  const pageSize = OVERTIME_POLICIES_PAGE_SIZE;

  // Calculate total pages from API's totalCount, not local array length
  const totalCount = pageInfo?.totalCount ?? policies.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Log component mount - intentionally fires once on initial render
  useEffect(() => {
    logger.info(OVERTIME_LOGGING.FILLED_STATE_MOUNTED, {
      policiesCount: policies.length,
      totalPages,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePolicy = useCallback(() => {
    track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CREATE_OVERTIME_POLICY);
    logger.info(OVERTIME_LOGGING.FILLED_STATE_CREATE_POLICY_CLICKED);
    onCreatePolicy();
  }, [logger, track, onCreatePolicy]);

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch(setCurrentPage(page));
      onPageChange(page);
    },
    [dispatch, onPageChange],
  );

  const columns = useMemo(
    () =>
      OVERTIME_TABLE_COLUMNS.map((column) => ({
        key: column.key,
        header: intl.formatMessage({
          id: column.translationId,
          defaultMessage: column.defaultMessage,
        }),
      })),
    [intl],
  );

  return (
    <Container>
      <HeaderRow>
        <Button
          priority="secondary"
          purpose="standard"
          size="medium"
          onClick={handleCreatePolicy}
          data-testid="create-overtime-policy-button"
        >
          {intl.formatMessage({
            id: 'overtime.landing.create.button',
            defaultMessage: 'Create overtime policy',
          })}
        </Button>
      </HeaderRow>

      <StyledTable
        hover="row"
        responsive="elevate"
        divider="horizontal"
        verticalDividerStyle="dotted"
        density="roomy"
      >
        <Table.Header>
          <Table.Row>
            {columns.map((column) =>
              column.key === 'actions' ? (
                <ActionsHeaderCell key={column.key}>
                  {column.header}
                </ActionsHeaderCell>
              ) : (
                <Table.Cell key={column.key}>{column.header}</Table.Cell>
              ),
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {policies.map((policy) => (
            <OvertimePolicyRow
              key={policy.id}
              policy={policy}
              onEditPolicy={onEditPolicy}
            />
          ))}
        </Table.Body>
      </StyledTable>

      <PaginationContainer>
        <Pagination
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          activePage={currentPage}
          onPageChange={handlePageChange}
          labels={{
            summaryItems: intl.formatMessage({
              id: OVERTIME_PAGINATION_CONFIG.LABEL_TRANSLATION_ID,
              defaultMessage: OVERTIME_PAGINATION_CONFIG.LABEL_DEFAULT_MESSAGE,
            }),
          }}
          preventPageJump
          data-testid="overtime-policies-pagination"
        />
      </PaginationContainer>

      {/* Delete Policy Confirmation Modal */}
      <DeletePolicyModal />
    </Container>
  );
};
