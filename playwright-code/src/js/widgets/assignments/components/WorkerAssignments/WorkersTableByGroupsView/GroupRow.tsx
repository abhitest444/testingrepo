import React, { useState } from 'react';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import type { GetTimeTrackingGroupsQuery_timeTrackingGroups_TimeTracking_GroupConnection_edges_TimeTracking_GroupEdge_node_TimeTracking_Group as QueryGroupNode } from 'src/__generated__/timeTracking/graphql';
import { getAssignmentDisplayText } from 'src/js/widgets/common/assignment/assignmentUtils';
import {
  ActionsContainer,
  ActionsWrapper,
  GroupName,
} from '../../styles/WorkersTableByGroupsView.styled';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setDrawerContext,
  setSelectedMembers,
  setInitialMembers,
  openQuickActionDrawer,
  openDeleteModal,
  openGroupDetailView,
} from '../../../store/workersGroupViewSlice';
import {
  GroupDrawerContext,
  GroupDrawerView,
} from '../../../types/Groups/GroupDrawer.types';
import { GROUP_ACTIONS_TRACKING_POINTS } from '../../../utils/groupsTrackingPoints';
import { selectWorkersListHeaderTotalCount } from '../../../store/workersListSlice';

interface GroupRowProps {
  group: QueryGroupNode;
  shouldShowGroupLeads?: boolean;
}

/**
 * GroupRow - Renders a single group row with actions (pagination view)
 * Removed expand/collapse functionality - workers shown in separate view
 */
const GroupRowComponent: React.FC<GroupRowProps> = ({
  group,
  shouldShowGroupLeads = true,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const sandbox = useSandbox();
  const track = useTracking();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Get total workers count from Redux store
  const totalWorkers = useAppSelector(selectWorkersListHeaderTotalCount);

  /**
   * Handle edit group action - opens edit drawer
   */
  const handleEditGroup = () => {
    // Track edit group action
    sandbox.logger.info('Component="GroupRow" Event="Edit group clicked"');
    track(GROUP_ACTIONS_TRACKING_POINTS.EDIT_GROUP);

    sandbox.logger.info('GroupRow: Edit group clicked', {
      groupId: group.id,
      groupName: group.name,
      managerCount: group.stats.managerCount,
    });

    // Set drawer context for Edit flow
    dispatch(
      setDrawerContext({
        groupId: group.id,
        groupName: group.name,
        context: GroupDrawerContext.EditGroup,
        initialMembers: {},
        initialLeads: {},
        managerCount: group.stats.managerCount, // Pass manager count
        memberCount: group.stats.memberCount, // Pass member count
      }),
    );

    // Open drawer via Redux action (defaults to Details view)
    dispatch(openQuickActionDrawer({ view: GroupDrawerView.Details }));

    sandbox.logger.info('GroupRow: Opened edit group drawer', {
      groupId: group.id,
      groupName: group.name,
      managerCount: group.stats.managerCount,
      memberCount: group.stats.memberCount,
    });
  };

  /**
   * Handle assign workers action from ComboLink
   * Opens drawer with QuickAction context and pre-loads existing members
   */
  const handleAssignWorkers = async () => {
    // Track assign workers menu action
    sandbox.logger.info(
      'Component="GroupRow" Event="Assign workers menu clicked"',
    );
    track(GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_WORKERS_MENU);

    sandbox.logger.info('GroupRow: Assign workers clicked (Quick Action)', {
      groupId: group.id,
      memberCount: group.stats.memberCount,
    });

    setLoadingAction('assign-workers');

    try {
      const membersRecord = {};

      // Set drawer context for Quick Action flow
      dispatch(
        setDrawerContext({
          groupId: group.id,
          groupName: group.name,
          context: GroupDrawerContext.QuickAction,
          initialMembers: membersRecord,
          initialLeads: {}, // Not relevant for workers view
          memberCount: group.stats.memberCount, // Pass member count for optimization
        }),
      );

      // Pre-populate selections with existing members
      dispatch(setSelectedMembers(membersRecord));
      dispatch(setInitialMembers(membersRecord));

      // Open drawer via Redux action
      dispatch(openQuickActionDrawer({ view: GroupDrawerView.AssignWorkers }));

      sandbox.logger.info('GroupRow: Opened assign workers drawer', {
        groupId: group.id,
        memberCount: group.stats.memberCount,
      });
    } catch (error) {
      sandbox.logger.error('GroupRow: Failed to open assign workers drawer', {
        groupId: group.id,
        error,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * Handle assign leads action from ComboLink
   * Opens drawer with QuickAction context
   * Note: Loading is handled inside the drawer by useInitializeEditMode
   */
  const handleAssignLeads = () => {
    // Track assign lead menu action
    sandbox.logger.info(
      'Component="GroupRow" Event="Assign lead menu clicked"',
    );
    track(GROUP_ACTIONS_TRACKING_POINTS.ASSIGN_LEAD_MENU);

    sandbox.logger.info('GroupRow: Assign leads clicked (Quick Action)', {
      groupId: group.id,
      managerCount: group.stats.managerCount,
    });

    // Set drawer context for Quick Action flow
    dispatch(
      setDrawerContext({
        groupId: group.id,
        groupName: group.name,
        context: GroupDrawerContext.QuickAction,
        initialMembers: {}, // Not relevant for leads view
        initialLeads: {}, // Empty - useInitializeEditMode will populate
        managerCount: group.stats.managerCount, // ✅ Pass manager count for optimization
      }),
    );

    // Open drawer via Redux action
    dispatch(openQuickActionDrawer({ view: GroupDrawerView.AssignLeads }));

    sandbox.logger.info('GroupRow: Opened assign leads drawer', {
      groupId: group.id,
      managerCount: group.stats.managerCount,
    });
  };

  /**
   * Handle view group action - opens drill-down detail view
   */
  const handleViewGroup = () => {
    // Track View CTA click
    track(GROUP_ACTIONS_TRACKING_POINTS.VIEW_GROUP_CTA);

    sandbox.logger.info('GroupRow: View group clicked', {
      groupId: group.id,
      groupName: group.name,
    });
    dispatch(
      openGroupDetailView({
        groupId: group.id,
        groupName: group.name,
      }),
    );
  };

  /**
   * Handle delete group action from ComboLink - opens Redux modal
   */
  const handleDeleteGroup = () => {
    // Track delete group action
    sandbox.logger.info('Component="GroupRow" Event="Delete group clicked"');
    track(GROUP_ACTIONS_TRACKING_POINTS.DELETE_GROUP);

    sandbox.logger.info('GroupRow: Delete group clicked', {
      groupId: group.id,
    });
    dispatch(
      openDeleteModal({
        groupId: group.id,
        groupName: group.name,
        version: group.meta.version,
      }),
    );
  };

  /**
   * Handle ComboLink Menu select - prevent event propagation to row click handler
   */
  const handleMenuSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    const value = (event.target as any)?.value;

    // Track menu item click (fires for any menu item interaction)
    sandbox.logger.info(
      'Component="GroupRow" Event="Group action menu clicked"',
    );
    track(GROUP_ACTIONS_TRACKING_POINTS.OPEN_GROUP_MENU);

    sandbox.logger.info('GroupRow: Menu item selected', {
      value,
      groupId: group.id,
    });

    switch (value) {
      case 'view-group':
        handleViewGroup();
        break;
      case 'edit-group':
        handleEditGroup();
        break;
      case 'assign-workers':
        handleAssignWorkers();
        break;
      case 'assign-group-lead':
        if (shouldShowGroupLeads) handleAssignLeads();
        break;
      case 'delete-group':
        sandbox.logger.info('GroupRow: Calling handleDeleteGroup');
        handleDeleteGroup();
        break;
      default:
        sandbox.logger.warn('GroupRow: Unknown menu action', { value });
    }
  };

  return (
    <Table.Row key={group.id} onClick={handleViewGroup}>
      {/* Group Name Cell */}
      <Table.Cell>
        <GroupName title={group.name}>{group.name}</GroupName>
      </Table.Cell>
      {/* Workers Count Cell */}
      <Table.Cell>
        {
          getAssignmentDisplayText(group.stats.memberCount, totalWorkers, intl)
            .text
        }
      </Table.Cell>
      {/* Group Leads Cell */}
      {shouldShowGroupLeads && (
        <Table.Cell>{group.stats.managerCount}</Table.Cell>
      )}
      {/* Actions Cell */}
      <Table.Cell>
        <ActionsWrapper>
          <ActionsContainer>
            <span>
              {shouldShowGroupLeads ? (
                <ComboLink
                  label={intl.formatMessage({ id: 'workers.actions.view' })}
                  size="mini"
                  onClick={handleViewGroup}
                  onSelect={handleMenuSelect}
                  data-testid={`action-combo-link-${group.id}`}
                >
                  <MenuItem value="edit-group">
                    {intl.formatMessage({ id: 'workers.actions.editGroup' })}
                  </MenuItem>
                  <MenuItem
                    value="assign-workers"
                    disabled={loadingAction === 'assign-workers'}
                  >
                    {loadingAction === 'assign-workers'
                      ? intl.formatMessage({ id: 'workers.actions.loading' })
                      : intl.formatMessage({
                          id: 'workers.actions.assignWorkers',
                        })}
                  </MenuItem>
                  <MenuItem value="assign-group-lead">
                    {intl.formatMessage({
                      id: 'workers.actions.assignGroupLead',
                    })}
                  </MenuItem>
                  <MenuItem value="delete-group">
                    {intl.formatMessage({ id: 'workers.actions.deleteGroup' })}
                  </MenuItem>
                </ComboLink>
              ) : (
                <ComboLink
                  label={intl.formatMessage({ id: 'workers.actions.view' })}
                  size="mini"
                  onClick={handleViewGroup}
                  onSelect={handleMenuSelect}
                  data-testid={`action-combo-link-${group.id}`}
                >
                  <MenuItem value="edit-group">
                    {intl.formatMessage({ id: 'workers.actions.editGroup' })}
                  </MenuItem>
                  <MenuItem
                    value="assign-workers"
                    disabled={loadingAction === 'assign-workers'}
                  >
                    {loadingAction === 'assign-workers'
                      ? intl.formatMessage({ id: 'workers.actions.loading' })
                      : intl.formatMessage({
                          id: 'workers.actions.assignWorkers',
                        })}
                  </MenuItem>
                  <MenuItem value="delete-group">
                    {intl.formatMessage({ id: 'workers.actions.deleteGroup' })}
                  </MenuItem>
                </ComboLink>
              )}
            </span>
          </ActionsContainer>
        </ActionsWrapper>
      </Table.Cell>
    </Table.Row>
  );
};

// Memoize with custom comparison - only re-render if group data changes
export const GroupRow = React.memo(
  GroupRowComponent,
  (prevProps, nextProps) =>
    prevProps.group.id === nextProps.group.id &&
    prevProps.group.name === nextProps.group.name &&
    prevProps.group.stats.memberCount === nextProps.group.stats.memberCount &&
    prevProps.group.stats.managerCount === nextProps.group.stats.managerCount &&
    prevProps.shouldShowGroupLeads === nextProps.shouldShowGroupLeads,
);
