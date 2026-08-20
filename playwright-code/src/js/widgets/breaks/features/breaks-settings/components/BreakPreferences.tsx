import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@ids-ts/button';
import { Switch } from '@ids-ts/switch';
import { IconControl } from '@ids-ts/icon-control';
import { Edit } from '@design-systems/icons';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { Pagination } from '@ids-ts/pagination';
import { BreakRule } from 'src/js/widgets/breaks/types';
import EmptyBreakRules from 'src/js/widgets/breaks/features/breaks-settings/components/EmptyBreakRules';
// import BreakEntryFormContainer from 'src/js/widgets/breaks/features/break-entries/BreakEntryFormContainer';
import {
  useBreaks,
  useAppSelector,
  useAppDispatch,
} from 'src/js/widgets/breaks/store/hooks';
import useBreaksCrud from 'src/js/widgets/breaks/hooks/useBreaksCrud';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { selectBreakRules } from 'src/js/widgets/breaks/store/breakRulesSlice';
import { selectTeamMembers } from 'src/js/widgets/breaks/store/workerSlice';
import {
  selectIsAddBreakRuleEnabled,
  setIsAssignmentEditorOpen,
  setBreakToEdit,
  setIsCreateBreakOpen,
  setIsEditBreakOpen,
  closeDrawer,
} from 'src/js/widgets/breaks/store/uiSlice';
import {
  BREAK_LOGGING_CONSTANTS,
  BREAK_PAGINATION_DEFAULTS,
  BREAK_SETTINGS_TRACKING_POINTS,
} from 'src/js/widgets/breaks/constants';
import {
  Container,
  HeaderContainer,
  Description,
  ButtonContainer,
  ActionButtons,
  ActionsHeaderCell,
  AssignedToText,
  DurationLine,
  PaginationContainer,
  StyledTable,
} from 'src/js/widgets/breaks/features/breaks-settings/styles/Breaks.styled';
import { formatBreakDuration } from 'src/js/widgets/breaks/utils';
import DeleteBreakPolicyController from 'src/js/widgets/breaks/features/breaks-settings/components/DeleteBreakPolicyController';
import AssignmentEditorContainer from 'src/js/widgets/breaks/components/AssignmentEditorContainer';
import {
  DYN_BREAKS_ACTIVATE_INACTIVATE_TOGGLE,
  DYN_BREAKS_SELECT_ASSIGNED_TO_CTA,
  DYN_BREAKS_SELECT_EDIT_BREAK_RULE,
  DYN_BREAKS_SELECT_TO_ADD_BREAK_RULE,
} from '../../../trackingMetadata';

const getAssignedToText = (
  assignedCount: number,
  teamMembersCount: number,
  text: Function,
  isDefaultPolicy?: boolean,
) => {
  // If it's a default policy, always show "All team members selected"
  if (isDefaultPolicy === true || assignedCount === teamMembersCount) {
    return text({ id: 'breaks.assignments.allTeamMembersSelected' });
  }

  // If not a default policy, use assignment count logic
  if (isDefaultPolicy === false) {
    if (assignedCount === 0) {
      return text({ id: 'breaks.assignments.noTeamMembers' });
    }

    // If assignedCount > teamMembersCount, show teamMembersCount, else show assignedCount
    const displayCount =
      assignedCount > teamMembersCount ? teamMembersCount : assignedCount;

    if (displayCount > 1) {
      return text(
        { id: 'breaks.assignments.teamMembers' },
        {
          count: displayCount.toString(),
        },
      );
    }

    return text(
      { id: 'breaks.assignments.teamMember' },
      {
        count: displayCount.toString(),
      },
    );
  }

  // Fallback to original logic if isDefaultPolicy is undefined
  if (assignedCount === 0) {
    return text({ id: 'breaks.assignments.noTeamMembers' });
  }

  if (assignedCount === teamMembersCount) {
    return text({ id: 'breaks.assignments.allTeamMembersSelected' });
  }

  // If assignedCount > teamMembersCount, show teamMembersCount, else show assignedCount
  const displayCount =
    assignedCount > teamMembersCount ? teamMembersCount : assignedCount;

  if (displayCount > 1) {
    return text(
      { id: 'breaks.assignments.teamMembers' },
      {
        count: displayCount.toString(),
      },
    );
  }

  return text(
    { id: 'breaks.assignments.teamMember' },
    {
      count: displayCount.toString(),
    },
  );
};

const BreakPreferences: React.FC = () => {
  const intl = useIntl();
  const track = useTracking();
  const dispatch = useAppDispatch();
  const logger = useLoggingConfig();
  const sandbox = useSandbox();
  const [selectedBreakPolicyId, setSelectedBreakPolicyId] = useState<
    string | null
  >(null);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(
    BREAK_PAGINATION_DEFAULTS.DEFAULT_PAGE,
  );
  const [pageSize, setPageSize] = useState(
    BREAK_PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
  );

  const rules = useAppSelector(selectBreakRules);
  const teamMembers = useAppSelector(selectTeamMembers);
  const { removeBreakRule } = useBreaks();
  const { updateBreaksPolicy } = useBreaksCrud();
  const isAddBreakRuleEnabled = useAppSelector(selectIsAddBreakRuleEnabled);

  // Use break rules directly without sorting (just pagination)
  const breakRules = useMemo(
    () => (Array.isArray(rules) ? rules : []),
    [rules],
  );

  // Calculate pagination values
  const totalPages = Math.ceil(breakRules.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBreakRules = breakRules.slice(startIndex, endIndex);

  const handleAddBreakRule = () => {
    logger.info(
      BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.ADD_BREAK_RULE_CLICKED,
    );
    track(BREAK_SETTINGS_TRACKING_POINTS.ADD_BREAK_RULE);
    sandbox.analytics.track({
      dynamic_id: DYN_BREAKS_SELECT_TO_ADD_BREAK_RULE,
    });
    dispatch(setIsCreateBreakOpen(true));
  };

  const handleEdit = useCallback(
    (id: string) => {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.EDIT_BREAK_RULE_CLICKED,
        {
          breakRuleId: id,
        },
      );
      track(BREAK_SETTINGS_TRACKING_POINTS.EDIT_BREAK_RULE);
      sandbox.analytics.track({
        dynamic_id: DYN_BREAKS_SELECT_EDIT_BREAK_RULE,
      });
      const rule = rules.find((r: BreakRule) => r.id === id);
      if (rule) {
        dispatch(setBreakToEdit(rule));
        dispatch(setIsEditBreakOpen(true));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, logger],
  );

  const handleDelete = useCallback(
    (id: string) => {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.DELETE_BREAK_RULE_CLICKED,
        {
          breakRuleId: id,
        },
      );
      removeBreakRule(id);
    },
    [removeBreakRule, logger],
  );

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.TOGGLE_BREAK_ACTIVE_CLICKED,
        {
          breakRuleId: id,
          isActive,
        },
      );
      track(
        isActive
          ? BREAK_SETTINGS_TRACKING_POINTS.ACTIVATE_TOGGLE
          : BREAK_SETTINGS_TRACKING_POINTS.INACTIVATE_TOGGLE,
      );
      sandbox.analytics.track({
        dynamic_id: DYN_BREAKS_ACTIVATE_INACTIVATE_TOGGLE,
        metadata: { toggleState: isActive },
      });
      const rule = rules.find((r: BreakRule) => r.id === id);
      if (rule) {
        updateBreaksPolicy(id, { isActive }, undefined);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, updateBreaksPolicy, logger],
  );

  const handleAssignedToClick = useCallback(
    (breakPolicyId: string) => {
      logger.info(
        BREAK_LOGGING_CONSTANTS.USER_INTERACTIONS.ASSIGN_TEAM_MEMBERS_CLICKED,
        {
          breakPolicyId,
        },
      );
      track(BREAK_SETTINGS_TRACKING_POINTS.ASSIGNED_TO_CTA);
      sandbox.analytics.track({
        dynamic_id: DYN_BREAKS_SELECT_ASSIGNED_TO_CTA,
      });
      setSelectedBreakPolicyId(breakPolicyId);
      dispatch(setIsAssignmentEditorOpen(true));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, logger],
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: intl.formatMessage({
          id: 'breaks.preferences.table.break.name',
        }),
        key: 'name',
      },
      {
        header: intl.formatMessage({ id: 'breaks.preferences.table.duration' }),
        key: 'duration',
      },
      {
        header: intl.formatMessage({ id: 'breaks.preferences.table.type' }),
        key: 'type',
      },
      {
        header: intl.formatMessage({
          id: 'breaks.preferences.table.auto.manual',
        }),
        key: 'autoManual',
      },
      {
        header: intl.formatMessage({
          id: 'breaks.preferences.table.assigned.to',
        }),
        key: 'assignedTo',
      },
      {
        header: intl.formatMessage({ id: 'breaks.preferences.table.status' }),
        key: 'status',
      },
      {
        header: intl.formatMessage({ id: 'breaks.preferences.table.actions' }),
        key: 'actions',
      },
    ],
    [intl],
  );
  useEffect(() => {
    track(BREAK_SETTINGS_TRACKING_POINTS.VIEW_MANAGE_BREAKS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderRow = useCallback(
    (item: BreakRule) => (
      <Table.Row key={item.id}>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.break.name',
          })}
        >
          {item.breakName}
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.duration',
          })}
        >
          {formatBreakDuration(item.breakDuration, item.durationUnit, intl) ===
          null ? (
            <DurationLine />
          ) : (
            formatBreakDuration(item.breakDuration, item.durationUnit, intl)
          )}
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.type',
          })}
        >
          {item.breakType === 'PAID'
            ? intl.formatMessage({ id: 'breaks.preferences.table.paid' })
            : intl.formatMessage({ id: 'breaks.preferences.table.unpaid' })}
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.auto.manual',
          })}
        >
          {(() => {
            if (item.allowAuto && item.allowManual) {
              return `${intl.formatMessage({
                id: 'breaks.preferences.table.auto',
              })}/${intl.formatMessage({
                id: 'breaks.preferences.table.manual',
              })}`;
            }
            if (item.allowAuto) {
              return intl.formatMessage({
                id: 'breaks.preferences.table.auto',
              });
            }
            return intl.formatMessage({
              id: 'breaks.preferences.table.manual',
            });
          })()}
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.assigned.to',
          })}
        >
          <AssignedToText
            onClick={() => handleAssignedToClick(item.id)}
            style={{ cursor: 'pointer' }}
            id={DYN_BREAKS_SELECT_ASSIGNED_TO_CTA}
          >
            {getAssignedToText(
              item.activeBreakAssignmentCount,
              teamMembers.length,
              intl.formatMessage,
              item.isDefaultPolicy,
            )}
          </AssignedToText>
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.status',
          })}
        >
          <Switch
            checked={item.isActive}
            onChange={() => handleToggleActive(item.id, !item.isActive)}
            aria-label={intl.formatMessage(
              { id: 'breaks.preferences.toggle.aria' },
              {
                '0': item.breakName,
              },
            )}
            id={DYN_BREAKS_ACTIVATE_INACTIVATE_TOGGLE}
          />
        </Table.Cell>
        <Table.Cell
          mobileLabel={intl.formatMessage({
            id: 'breaks.preferences.table.actions',
          })}
        >
          <ActionButtons>
            <IconControl
              onClick={() => handleEdit(item.id)}
              aria-label={intl.formatMessage({
                id: 'breaks.preferences.edit.aria',
              })}
              size="medium"
              id={DYN_BREAKS_SELECT_EDIT_BREAK_RULE}
            >
              <Edit />
            </IconControl>
            <DeleteBreakPolicyController item={item} />
          </ActionButtons>
        </Table.Cell>
      </Table.Row>
    ),
    [handleToggleActive, handleEdit, handleDelete],
  );

  return (
    <Container>
      <HeaderContainer>
        <h2>{intl.formatMessage({ id: 'breaks.preferences.title' })}</h2>
      </HeaderContainer>
      <Description>
        {intl.formatMessage({ id: 'breaks.preferences.description' })}
      </Description>
      <ButtonContainer>
        <Button
          priority="secondary"
          color="primary"
          onClick={handleAddBreakRule}
          disabled={!isAddBreakRuleEnabled}
          data-testid="add-break-rule-btn"
          aria-label="add-break-rule-btn"
          id={DYN_BREAKS_SELECT_TO_ADD_BREAK_RULE}
        >
          {intl.formatMessage({ id: 'breaks.preferences.add.button' })}
        </Button>
      </ButtonContainer>
      <StyledTable
        hover="row"
        responsive="elevate"
        divider="horizontal"
        verticalDividerStyle="dotted"
        density="roomy"
      >
        <Table.Header>
          <Table.Row>
            {columns.map((column) => {
              if (column.key === 'actions') {
                return (
                  <ActionsHeaderCell key={column.key}>
                    {column.header}
                  </ActionsHeaderCell>
                );
              }
              return <Table.Cell key={column.key}>{column.header}</Table.Cell>;
            })}
          </Table.Row>
        </Table.Header>
        <Table.Body>{paginatedBreakRules.map(renderRow)}</Table.Body>
      </StyledTable>
      {Array.isArray(rules) && rules.length === 0 && <EmptyBreakRules />}
      {Array.isArray(rules) && rules.length > 0 && (
        <PaginationContainer>
          <Pagination
            totalPages={totalPages}
            totalItems={breakRules.length}
            pageSize={pageSize}
            activePage={currentPage}
            onPageChange={handlePageChange}
            data-testid="breaks-pagination"
          />
        </PaginationContainer>
      )}
      {selectedBreakPolicyId && (
        <AssignmentEditorContainer
          breakPolicyId={selectedBreakPolicyId}
          onClose={() => {
            setSelectedBreakPolicyId(null);
            dispatch(closeDrawer());
          }}
        />
      )}
    </Container>
  );
};

export default BreakPreferences;
