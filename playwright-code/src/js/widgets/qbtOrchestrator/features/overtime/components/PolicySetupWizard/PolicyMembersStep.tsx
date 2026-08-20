import React, { useState, useCallback, useMemo } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import Typography from '@ids-ts/typography';
import { Card } from '@ids-ts/cards';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_WorkersQueryFilter,
} from 'src/__generated__/timeTracking/graphql';
import { SearchField } from 'src/js/widgets/common/SearchField';
import { GroupFilterDropdown } from 'src/js/widgets/assignments/components/Groups/GroupFilterDropdown';
import {
  WorkerSelectionTable,
  type WorkerSelectionTableLabels,
} from 'src/js/widgets/common/WorkerSelection';
import {
  usePolicyWorkerSelectionAdapter,
  useWizardMembersData,
} from '../../hooks';

import {
  PolicyCardWrapper,
  TitleSection,
  MembersCounterRow,
  MembersCounterText,
  MembersSearchRow,
  MembersDropdownWrap,
  MembersSearchWrap,
  StyledCardContent,
} from './styles/PolicySetupWizard.styled';
import { PolicyMembersStepProps } from './types';
import { POLICY_MEMBERS_TRACKING_POINTS } from '../../constants/overtimeTrackingPoints';

const GROUP_FILTER_ALL = 'ALL';
const GROUP_FILTER_NO_GROUP = 'NO_GROUP';

export const PolicyMembersStep: React.FC<PolicyMembersStepProps> = ({
  policyName,
  policyId,
  initialWorkerIds,
}) => {
  const intl = useIntl();
  const track = useTracking();

  // Local UI state for filters
  const [groupFilter, setGroupFilter] = useState<string>(GROUP_FILTER_ALL);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<TimeTracking_WorkerOrderBy>(
    TimeTracking_WorkerOrderBy.DisplayNameAsc,
  );

  // Build workers filter from local UI state
  const workersFilter = useMemo(():
    | TimeTracking_WorkersQueryFilter
    | undefined => {
    const base: TimeTracking_WorkersQueryFilter = {};
    if (searchTerm.trim()) base.searchText = searchTerm.trim();
    if (groupFilter === GROUP_FILTER_NO_GROUP) base.hasGroup = false;
    if (
      groupFilter &&
      groupFilter !== GROUP_FILTER_ALL &&
      groupFilter !== GROUP_FILTER_NO_GROUP
    ) {
      base.groupId = groupFilter;
    }
    return Object.keys(base).length ? base : undefined;
  }, [groupFilter, searchTerm]);

  // Use the wizard members data hook for all data fetching and caching
  const {
    groups,
    groupsLoading,
    workers,
    workersLoading,
    workersError,
    totalWorkerCount,
    pagination,
  } = useWizardMembersData({
    filter: workersFilter,
    sortOrder,
  });

  // Use the policy adapter hook for Redux integration
  const {
    selectedIds,
    allSelected,
    someSelected,
    onSelectionChange,
    onSelectAllChange: originalOnSelectAllChange,
    selectedCount,
  } = usePolicyWorkerSelectionAdapter({
    workers,
    policyId,
    initialWorkerIds,
  });

  const onSelectAllChange = useCallback(
    (selected: boolean) => {
      track(
        selected
          ? POLICY_MEMBERS_TRACKING_POINTS.ALL_WORKER_ON
          : POLICY_MEMBERS_TRACKING_POINTS.ALL_WORKER_OFF,
      );
      originalOnSelectAllChange(selected);
    },
    [track, originalOnSelectAllChange],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      track(POLICY_MEMBERS_TRACKING_POINTS.POLICY_MEMBERS_SEARCH);
      setSearchTerm(value);
    },
    [track],
  );

  const handleGroupFilterChange = useCallback(
    (value: string) => {
      track(POLICY_MEMBERS_TRACKING_POINTS.SELECT_GROUP);
      setGroupFilter(value);
    },
    [track],
  );

  const handleGroupFilterOpen = useCallback(() => {
    track(POLICY_MEMBERS_TRACKING_POINTS.FILTER_GROUP);
  }, [track]);

  const handleSortChange = useCallback((order: TimeTracking_WorkerOrderBy) => {
    setSortOrder(order);
  }, []);

  // i18n labels for WorkerSelectionTable
  const labels: WorkerSelectionTableLabels = useMemo(
    () => ({
      loadingMessage: intl.formatMessage({
        id: 'overtime.wizard.members.loading',
        defaultMessage: 'Loading workers...',
      }),
      emptyStateMessage: intl.formatMessage({
        id: 'overtime.wizard.members.no_results',
        defaultMessage: 'No workers found',
      }),
      selectAllLabel: intl.formatMessage({
        id: 'overtime.wizard.members.select_all',
        defaultMessage: 'Select all workers',
      }),
      nameColumnHeader: intl.formatMessage({
        id: 'overtime.wizard.members.column.worker',
        defaultMessage: 'Worker',
      }),
      groupColumnHeader: intl.formatMessage({
        id: 'overtime.wizard.members.column.group',
        defaultMessage: 'Group',
      }),
      noGroupText: intl.formatMessage({
        id: 'workers.filter.noGroup',
        defaultMessage: 'No group',
      }),
      selectWorkerLabel: (workerName: string) =>
        intl.formatMessage(
          {
            id: 'overtime.wizard.members.select_worker',
            defaultMessage: 'Select {workerName}',
          },
          { workerName },
        ),
      previousPageLabel: intl.formatMessage({
        id: 'overtime.wizard.members.pagination.previous',
        defaultMessage: 'Previous',
      }),
      nextPageLabel: intl.formatMessage({
        id: 'overtime.wizard.members.pagination.next',
        defaultMessage: 'Next',
      }),
    }),
    [intl],
  );

  const isLoading = workersLoading;

  return (
    <PolicyCardWrapper>
      <Card size="none">
        <StyledCardContent>
          <TitleSection>
            <Typography variant="headline-5" weight="medium">
              {intl.formatMessage({
                id: 'overtime.wizard.members.title',
                defaultMessage: 'Assign policy members',
              })}
            </Typography>
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage(
                {
                  id: 'overtime.wizard.members.subtitle',
                  defaultMessage: 'Who will get the {policyName} ?',
                },
                {
                  policyName,
                },
              )}
            </Typography>
          </TitleSection>

          <MembersCounterRow>
            <MembersCounterText>
              {intl.formatMessage(
                {
                  id: 'overtime.wizard.members.counter',
                  defaultMessage:
                    '{selected} of {total} workers to {policyName}',
                },
                {
                  selected: selectedCount,
                  total: totalWorkerCount,
                  policyName,
                },
              )}
            </MembersCounterText>
            <MembersSearchRow>
              <MembersDropdownWrap>
                <GroupFilterDropdown
                  groups={groups}
                  loading={groupsLoading}
                  value={groupFilter}
                  onOpen={handleGroupFilterOpen}
                  onChange={handleGroupFilterChange}
                  showLabel={false}
                  showCounts
                />
              </MembersDropdownWrap>
              <MembersSearchWrap>
                <SearchField
                  value={searchTerm}
                  onChange={handleSearchChange}
                  label=""
                  placeholder={intl.formatMessage({
                    id: 'overtime.wizard.members.search.placeholder',
                    defaultMessage: 'Search',
                  })}
                  alwaysExpanded
                  debounceMs={300}
                />
              </MembersSearchWrap>
            </MembersSearchRow>
          </MembersCounterRow>

          {workersError && (
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage({
                id: 'overtime.wizard.members.error',
                defaultMessage: 'Unable to load workers. Try again.',
              })}
            </Typography>
          )}

          <WorkerSelectionTable
            workers={workers}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            onSelectAllChange={onSelectAllChange}
            allSelected={allSelected}
            someSelected={someSelected}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            isLoading={isLoading}
            labels={labels}
            pagination={pagination}
            tableSummary={intl.formatMessage({
              id: 'overtime.wizard.members.table.summary',
              defaultMessage: 'Worker selection table for policy members',
            })}
            testIdPrefix="policy-members"
          />
        </StyledCardContent>
      </Card>
    </PolicyCardWrapper>
  );
};

export default PolicyMembersStep;
