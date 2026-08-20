import React, { useCallback, memo } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import Badge from '@ids-ts/badge';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  OvertimePolicy,
  OvertimePolicyAssignment,
} from '../types/Overtime.types';
import { filterEnabledRules } from '../utils/overtimeMutationUtils';
import { USER_NOT_FOUND_ENTITY_NAME } from '../../../constants';
import { OVERTIME_TABLE_ACTIONS } from '../constants/overtimeTableConstants';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { MANAGE_OVERTIME_LANDING_TRACKING_POINTS } from '../constants/overtimeTrackingPoints';
import {
  ActionsCell,
  ActionsContainer,
  PolicyNameCell,
} from '../styles/OvertimeFilledState.styled';
import { useAppDispatch } from '../../../store/hooks';
import { setPolicyToDelete, setShowDeleteModal } from '../store';

interface OvertimePolicyRowProps {
  policy: OvertimePolicy;
  onEditPolicy?: (policyId: string) => void;
}

export const OvertimePolicyRow: React.FC<OvertimePolicyRowProps> = memo(
  ({ policy, onEditPolicy }) => {
    const intl = useIntl();
    const logger = useLoggingConfig();
    const track = useTracking();
    const dispatch = useAppDispatch();

    const handleRowClick = useCallback(() => {
      track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CLICK_VIEW_DETAILS);
      logger.info(OVERTIME_LOGGING.FILLED_STATE_EDIT_POLICY_CLICKED, {
        policyId: policy.id,
      });
      if (onEditPolicy) {
        onEditPolicy(policy.id);
      }
    }, [logger, track, onEditPolicy, policy.id]);

    const handleEdit = useCallback(
      (event: React.MouseEvent | React.KeyboardEvent) => {
        event.stopPropagation(); // Prevent row click when clicking action button
        handleRowClick();
      },
      [handleRowClick],
    );

    const handleDelete = useCallback(() => {
      track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.CLICK_DELETE_POLICY);
      logger.info(OVERTIME_LOGGING.DELETE_MENU_ITEM_CLICKED, {
        policyId: policy.id,
        policyName: policy.name,
      });
      dispatch(setPolicyToDelete(policy));
      dispatch(setShowDeleteModal(true));
    }, [logger, track, policy, dispatch]);

    const handleMenuSelect = useCallback(
      (event: React.SyntheticEvent) => {
        event.stopPropagation(); // Prevent row click when using menu
        track(MANAGE_OVERTIME_LANDING_TRACKING_POINTS.EDIT_DROP_DOWN);
        logger.info(OVERTIME_LOGGING.FILLED_STATE_MENU_OPENED, {
          policyId: policy.id,
        });
        const value = (event.target as any)?.value;
        if (value === OVERTIME_TABLE_ACTIONS.EDIT) {
          handleRowClick();
        } else if (value === OVERTIME_TABLE_ACTIONS.DELETE) {
          handleDelete();
        }
      },
      [logger, track, handleRowClick, handleDelete, policy.id],
    );

    // Calculate workers display text from assignments
    const getWorkersDisplay = useCallback(() => {
      const assignments = policy.assignments?.values || [];

      // Check if there's a company-wide assignment
      const hasCompanyWide = assignments.some(
        (assignment: OvertimePolicyAssignment) =>
          assignment.entityType === 'all',
      );

      // Company-wide assignment or default policy shows "All"
      if (hasCompanyWide || policy.isDefault) {
        return intl.formatMessage({
          id: 'overtime.table.workers.all',
          defaultMessage: 'Company',
        });
      }

      if (assignments.length === 0) {
        return intl.formatMessage({
          id: 'overtime.table.workers.none',
          defaultMessage: 'None',
        });
      }

      // Count group and user assignments
      const groupCount = assignments.filter(
        (assignment: OvertimePolicyAssignment) =>
          assignment.entityType === 'group',
      ).length;
      const userCount = assignments.filter(
        (assignment: OvertimePolicyAssignment) =>
          assignment.entityType === 'user' &&
          assignment.entityName !== USER_NOT_FOUND_ENTITY_NAME,
      ).length;

      const parts: string[] = [];
      if (groupCount > 0) {
        parts.push(
          intl.formatMessage(
            {
              id: 'overtime.table.workers.groups',
              defaultMessage:
                '{count} {count, plural, one {group} other {groups}}',
            },
            { count: groupCount },
          ),
        );
      }
      if (userCount > 0) {
        parts.push(
          intl.formatMessage(
            {
              id: 'overtime.table.workers.users',
              defaultMessage:
                '{count} {count, plural, one {user} other {users}}',
            },
            { count: userCount },
          ),
        );
      }

      return parts.join(', ');
    }, [policy.assignments, policy.isDefault, intl]);

    const rulesCount = filterEnabledRules(policy.rules?.values || []).length;

    return (
      <Table.Row
        key={policy.id}
        onClick={handleRowClick}
        style={{ cursor: 'pointer' }}
        data-testid={`overtime-policy-row-${policy.id}`}
      >
        <Table.Cell>
          <PolicyNameCell>
            {policy.name}
            {policy.isDefault && (
              <Badge
                status="info"
                priority="secondary"
                capitalization="sentence"
                aria-label={intl.formatMessage({
                  id: 'overtime.table.default.badge',
                  defaultMessage: 'Default',
                })}
              >
                {intl.formatMessage({
                  id: 'overtime.table.default.badge',
                  defaultMessage: 'Default',
                })}
              </Badge>
            )}
          </PolicyNameCell>
        </Table.Cell>
        <Table.Cell>{getWorkersDisplay()}</Table.Cell>
        <Table.Cell>{rulesCount}</Table.Cell>
        <ActionsCell>
          <ActionsContainer>
            <ComboLink
              label={intl.formatMessage({
                id: 'overtime.table.action.edit',
                defaultMessage: 'Edit',
              })}
              size="mini"
              onClick={handleEdit}
              onSelect={handleMenuSelect}
              data-testid={`overtime-policy-actions-${policy.id}`}
            >
              <MenuItem value={OVERTIME_TABLE_ACTIONS.EDIT}>
                {intl.formatMessage({
                  id: 'overtime.table.action.edit',
                  defaultMessage: 'Edit',
                })}
              </MenuItem>
              <MenuItem value={OVERTIME_TABLE_ACTIONS.DELETE}>
                {intl.formatMessage({
                  id: 'overtime.table.action.delete',
                  defaultMessage: 'Delete',
                })}
              </MenuItem>
            </ComboLink>
          </ActionsContainer>
        </ActionsCell>
      </Table.Row>
    );
  },
);

OvertimePolicyRow.displayName = 'OvertimePolicyRow';
