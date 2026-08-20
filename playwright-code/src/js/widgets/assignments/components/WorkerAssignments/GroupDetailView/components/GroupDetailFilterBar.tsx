import React from 'react';
import DropdownButton, {
  MenuItem as DropdownMenuItem,
} from '@ids-ts/dropdown-button';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { SearchField } from 'src/js/widgets/common/SearchField';
import {
  FilterBar,
  LeftSection,
  DropdownWrapper,
  SearchWrapper,
  RightSection,
} from '../styles/GroupDetailView.styled';
import { WorkerType } from '../../SearchFilterBar/types';
import { GROUP_DETAILS_TRACKING_POINTS } from '../../../../utils/groupsTrackingPoints';

interface GroupDetailFilterBarProps {
  searchText: string;
  filterType: WorkerType;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: WorkerType) => void;
  onAssignWorkers: () => void;
  onAssignLeads: () => void;
  shouldShowGroupLeads?: boolean;
}

/**
 * GroupDetailFilterBar Component
 * Displays the filter dropdown, search field, and assign workers/leads button
 */
export const GroupDetailFilterBar: React.FC<GroupDetailFilterBarProps> = ({
  searchText,
  filterType,
  onSearchChange,
  onFilterChange,
  onAssignWorkers,
  onAssignLeads,
  shouldShowGroupLeads = true,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  /**
   * Handle dropdown button open (when user clicks to open menu)
   */
  const handleDropdownOpen = () => {
    // Track that the Assign dropdown was opened
    track(GROUP_DETAILS_TRACKING_POINTS.ASSIGN_DROPDOWN_CLICKED);
  };

  /**
   * Handle dropdown menu selection
   * Supports: assign-workers, assign-leads
   */
  const handleMenuSelect = (event: React.MouseEvent | React.KeyboardEvent) => {
    const value = (event.target as any)?.value;

    if (value === 'assign-workers') {
      // Track Assign workers option clicked
      track(GROUP_DETAILS_TRACKING_POINTS.ASSIGN_WORKERS_OPTION_CLICKED);
      onAssignWorkers();
    } else if (value === 'assign-leads') {
      // Track Assign leads option clicked
      track(GROUP_DETAILS_TRACKING_POINTS.ASSIGN_LEADS_OPTION_CLICKED);
      onAssignLeads();
    }
  };

  return (
    <FilterBar>
      <LeftSection>
        <DropdownWrapper>
          <Dropdown
            value={filterType}
            onChange={(e) =>
              onFilterChange(
                (e.target as HTMLSelectElement).value as WorkerType,
              )
            }
            label={intl.formatMessage({
              id: 'groups.detail.filterLabel',
              defaultMessage: 'Workers',
            })}
            aria-label={intl.formatMessage({
              id: 'groups.detail.filterLabel',
              defaultMessage: 'Workers',
            })}
          >
            <MenuItem value="ALL">
              {intl.formatMessage({
                id: 'groups.detail.filterAll',
                defaultMessage: 'All',
              })}
            </MenuItem>
            <MenuItem value="EMPLOYEE">
              {intl.formatMessage({
                id: 'groups.detail.filterEmployee',
                defaultMessage: 'Employee',
              })}
            </MenuItem>
            <MenuItem value="LEGACY_QBO_USER">
              {intl.formatMessage({
                id: 'workers.type.user',
                defaultMessage: 'User',
              })}
            </MenuItem>
            <MenuItem value="VENDOR">
              {intl.formatMessage({
                id: 'groups.detail.filterVendor',
                defaultMessage: 'Vendor',
              })}
            </MenuItem>
          </Dropdown>
        </DropdownWrapper>
        <SearchWrapper>
          <SearchField
            value={searchText}
            onChange={onSearchChange}
            label={intl.formatMessage({
              id: 'groups.detail.searchLabel',
              defaultMessage: 'Search',
            })}
          />
        </SearchWrapper>
      </LeftSection>
      <RightSection>
        {shouldShowGroupLeads ? (
          <DropdownButton
            automationId="assign-workers-dropdown"
            buttonPriority="secondary"
            buttonPurpose="standard"
            label={intl.formatMessage({
              id: 'groups.detail.assign',
              defaultMessage: 'Assign',
            })}
            onOpen={handleDropdownOpen}
            onSelect={handleMenuSelect}
            aria-label={intl.formatMessage({
              id: 'groups.detail.assignActions',
              defaultMessage: 'Assign workers or leads',
            })}
          >
            <DropdownMenuItem value="assign-workers">
              {intl.formatMessage({
                id: 'groups.detail.assignWorkers',
                defaultMessage: 'Assign workers',
              })}
            </DropdownMenuItem>
            <DropdownMenuItem value="assign-leads">
              {intl.formatMessage({
                id: 'groups.detail.assignLeads',
                defaultMessage: 'Assign leads',
              })}
            </DropdownMenuItem>
          </DropdownButton>
        ) : (
          <DropdownButton
            automationId="assign-workers-dropdown"
            buttonPriority="secondary"
            buttonPurpose="standard"
            label={intl.formatMessage({
              id: 'groups.detail.assign',
              defaultMessage: 'Assign',
            })}
            onOpen={handleDropdownOpen}
            onSelect={handleMenuSelect}
            aria-label={intl.formatMessage({
              id: 'groups.detail.assignActions',
              defaultMessage: 'Assign workers',
            })}
          >
            <DropdownMenuItem value="assign-workers">
              {intl.formatMessage({
                id: 'groups.detail.assignWorkers',
                defaultMessage: 'Assign workers',
              })}
            </DropdownMenuItem>
          </DropdownButton>
        )}
      </RightSection>
    </FilterBar>
  );
};
