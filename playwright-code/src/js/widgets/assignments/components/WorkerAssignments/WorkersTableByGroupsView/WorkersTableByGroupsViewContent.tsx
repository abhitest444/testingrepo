import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Activity } from '@ids-ts/loader';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import { Pagination } from '@ids-ts/pagination';
import { Table } from '@ids-ts/table';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import styled from 'styled-components';
import { AssignmentsEmptyState } from 'src/js/widgets/assignments/components/AssignmentsEmptyState';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import { ConfirmationModal } from 'src/js/widgets/common/ConfirmationModal';
import { useDeleteGroup } from 'src/js/service/hooks/groups/useDeleteGroup';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import {
  CREATE_GROUP_TRACKING_POINTS,
  GROUPS_LIST_TRACKING_POINTS,
} from 'src/js/widgets/assignments/utils/groupsTrackingPoints';
import {
  HeaderTable,
  CenteredContainer,
  PaginationContainer,
  TableContainer,
  LoadingRow,
  EmptyStateContainer,
  GroupsViewContainer,
} from 'src/js/widgets/assignments/components/styles/WorkersTableByGroupsView.styled';
import {
  useAppDispatch,
  useAppSelector,
} from 'src/js/widgets/assignments/store/hooks';
import {
  closeDeleteModal,
  openCreateGroupDrawer,
  openGroupDetailView,
} from 'src/js/widgets/assignments/store/workersGroupViewSlice';
import { TabPersistence } from 'src/js/widgets/assignments/utils/tabPersistence';
import { useNttfEligibility } from 'src/js/service/hooks/nttf/useNttfEligibility';
import { GroupRow } from './GroupRow';

const ModalMessage = styled.div`
  padding-top: 16px;
`;

interface WorkersTableByGroupsViewContentProps {
  groups: QueryGroupNode[];
  groupsCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  searchText?: string;
}

/**
 * Presentation component for Workers Table by Groups
 * Displays groups in a paginated table
 * Removed infinite scroll and nested workers - now uses pagination
 */
export const WorkersTableByGroupsViewContent: React.FC<
  WorkersTableByGroupsViewContentProps
> = ({
  groups,
  groupsCount,
  isLoading,
  error,
  refetch,
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  searchText = '',
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const dispatch = useAppDispatch();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // State for success toast notification
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const track = useTracking();
  const hasRestoredGroupDetail = useRef(false);
  const { isNttfEligible, loading } = useNttfEligibility();

  // Clear behavior: Show loading state until we have a definitive answer
  // Only calculate shouldShowGroupLeads when not loading
  const shouldShowGroupLeads = useMemo(() => {
    if (loading) return false; // Don't show leads during loading to avoid flicker
    return !isNttfEligible; // Show leads only when NOT NTTF eligible
  }, [isNttfEligible, loading]);

  // Get delete modal state from Redux
  const deleteModal = useAppSelector(
    (state) => state.workersGroupView.deleteModal,
  );

  const { deleteGroup, isDeleting } = useDeleteGroup({
    onSuccess: (group) => {
      dispatch(closeDeleteModal());
      setSuccessMessage(
        intl.formatMessage(
          {
            id: 'groups.delete.success.message',
            defaultMessage: 'Group "{name}" deleted successfully',
          },
          { name: group.name },
        ),
      );
      setShowSuccessToast(true);
      // Refetch groups list after successful delete
      refetch();
    },
    onError: (error, errorCode) => {
      sandbox.logger.error(
        'Component="WorkersTableByGroupsView" Event="Delete failed"',
        {
          error,
          errorCode,
        },
      );
      setDeleteError(error);
      dispatch(closeDeleteModal());
    },
  });

  // Restore group detail view from web storage
  // In case it was persisted before user settings navigation, and clear it
  // Only runs once when groups are loaded and conditions are met
  useEffect(() => {
    if (
      !hasRestoredGroupDetail.current &&
      !isLoading &&
      !error &&
      groups.length > 0
    ) {
      hasRestoredGroupDetail.current = true;

      const savedGroupDetail = TabPersistence.getGroupDetail(sandbox);
      if (savedGroupDetail) {
        sandbox.logger.info(
          'Component="WorkersTableByGroupsViewContent" Event="Restoring saved group detail view"',
          {
            groupId: savedGroupDetail.groupId,
            groupName: savedGroupDetail.groupName,
          },
        );
        dispatch(
          openGroupDetailView({
            groupId: savedGroupDetail.groupId,
            groupName: savedGroupDetail.groupName,
          }),
        );

        // Clear saved group detail state from web storage
        TabPersistence.clearGroupDetail(sandbox);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, groups.length]);

  const handleConfirmDelete = useCallback(() => {
    setDeleteError(null);
    if (deleteModal.groupId && deleteModal.version !== null) {
      deleteGroup({
        groupId: deleteModal.groupId,
        version: deleteModal.version,
      });
    }
  }, [deleteModal, deleteGroup]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeDeleteModal());
  }, [dispatch]);

  const handleCreateGroupClick = useCallback(() => {
    sandbox.logger.info(
      'Component="WorkersTableByGroupsViewContent" Event="Create group button clicked (empty state)"',
    );
    track(CREATE_GROUP_TRACKING_POINTS.START_CREATE_GROUP);
    dispatch(openCreateGroupDrawer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render group row
  const renderGroup = (group: QueryGroupNode): React.ReactNode => (
    <GroupRow
      key={group.id}
      group={group}
      shouldShowGroupLeads={shouldShowGroupLeads}
    />
  );

  const tableRows = groups.map((group) => renderGroup(group));

  // Loading state - Show loading if either groups are loading OR NTTF eligibility is loading
  if ((isLoading && groups.length === 0) || loading) {
    return (
      <CenteredContainer>
        <Activity shape="dots" size="large" />
      </CenteredContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageMessage
        type="error"
        title={intl.formatMessage({ id: 'groups.list.error.title' })}
        onActionClick={refetch}
      >
        {error}
      </PageMessage>
    );
  }

  // Empty state - reusable layout with GroupWorkers image and Create group CTA
  if (groups.length === 0) {
    const emptyTitleId = searchText
      ? 'groups.empty.noSearchResultsTitle'
      : 'groups.empty.title';
    return (
      <AssignmentsEmptyState
        title={intl.formatMessage(
          { id: emptyTitleId },
          searchText ? { searchText } : {},
        )}
        description={intl.formatMessage({
          id: 'groups.empty.description',
        })}
        action={
          <Button
            purpose="standard"
            priority="primary"
            onClick={handleCreateGroupClick}
            aria-label={intl.formatMessage({
              id: 'groups.header.createGroup',
              defaultMessage: 'Create group',
            })}
            data-testid="groups-empty-create-group-btn"
          >
            {intl.formatMessage({
              id: 'groups.header.createGroup',
              defaultMessage: 'Create group',
            })}
          </Button>
        }
      />
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <GroupsViewContainer>
        {deleteError && (
          <PageMessage
            type="error"
            title={intl.formatMessage({ id: 'groups.delete.error.title' })}
            onClose={() => setDeleteError(null)}
            dismissible
          >
            {deleteError}
          </PageMessage>
        )}

        {/* Success Toast Notification */}
        <SuccessToast
          message={successMessage}
          open={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />

        <TableContainer>
          <HeaderTable
            divider="horizontal"
            responsive="elevate"
            hover="row"
            summary="Groups list table"
            density="roomy"
            data-testid="groups-list-table"
            $shouldShowGroupLeads={shouldShowGroupLeads}
          >
            <Table.Header>
              <Table.Row>
                <Table.Cell>
                  {intl.formatMessage(
                    { id: 'groups.header.groups' },
                    { count: groupsCount },
                  )}
                </Table.Cell>
                <Table.Cell>
                  {intl.formatMessage({ id: 'groups.header.workers' })}
                </Table.Cell>
                {shouldShowGroupLeads && (
                  <Table.Cell>
                    {intl.formatMessage({ id: 'groups.header.groupLeads' })}
                  </Table.Cell>
                )}
                <Table.Cell>
                  {intl.formatMessage({ id: 'groups.header.actions' })}
                </Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <LoadingRow>
                  <Table.Cell colSpan={shouldShowGroupLeads ? 4 : 3}>
                    <EmptyStateContainer>
                      <Activity shape="dots" size="large" />
                      {intl.formatMessage({
                        id: 'groups.loading',
                        defaultMessage: 'Loading groups...',
                      })}
                    </EmptyStateContainer>
                  </Table.Cell>
                </LoadingRow>
              ) : (
                tableRows
              )}
            </Table.Body>
          </HeaderTable>
        </TableContainer>

        {/* Pagination - only show if more than 1 page */}
        {totalPages > 1 && (
          <PaginationContainer>
            <Pagination
              totalPages={totalPages}
              totalItems={totalCount}
              preventPageJump
              labels={{
                summaryItems: intl.formatMessage({
                  id: 'groups.list.pagination.groups',
                  defaultMessage: 'groups',
                }),
              }}
              pageSize={pageSize}
              activePage={currentPage}
              onPageChange={(newPage) => {
                sandbox.logger.info(
                  'Component="WorkersTableByGroupsViewContent" Event="Pagination clicked"',
                  { newPage },
                );
                track(GROUPS_LIST_TRACKING_POINTS.PAGINATION);
                onPageChange(newPage);
              }}
            />
          </PaginationContainer>
        )}
      </GroupsViewContainer>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModal.open}
        setOpen={handleCloseModal}
        title={intl.formatMessage({ id: 'groups.delete.modal.title' })}
        onYesClick={handleConfirmDelete}
        yesButtonLabel={intl.formatMessage({
          id: 'groups.delete.modal.delete',
        })}
        noButtonLabel={intl.formatMessage({ id: 'groups.delete.modal.back' })}
        isLoading={isDeleting}
        size="small"
        headerAlignment="center"
        contentAlignment="center"
        actionAlignment="center"
        showSectionDivider={false}
      >
        <ModalMessage>
          {intl.formatMessage({ id: 'groups.delete.modal.message' })}
        </ModalMessage>
      </ConfirmationModal>
    </>
  );
};
