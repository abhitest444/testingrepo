import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { SearchField } from 'src/js/widgets/common/SearchField';
import { WorkerTypeFilter } from './WorkerTypeFilter';
import { ViewToggle } from './ViewToggle';
import {
  SearchFilterBarContainer,
  LeftSection,
  RightSection,
  FilterContainer,
  SearchContainer,
} from '../../styles/SearchFilterBar.styled';
import type { SearchFilterBarProps } from './types';

/**
 * SearchFilterBar Component
 *
 * Second layer of the Workers Tab UI structure
 * Contains three main elements in a horizontal layout:
 * 1. WorkerTypeFilter (Left) - Dropdown to filter by worker type
 * 2. SearchField (Left) - Collapsible search field to search workers
 * 3. ViewToggle (Right) - Toggle switch for "View by groups" mode
 *
 * Layout: [Filter Dropdown] [Search Field] -------- [View Toggle]
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchText,
  onSearchChange,
  workerType,
  onWorkerTypeChange,
  viewByGroups,
  onViewToggle,
}) => {
  const intl = useIntl();

  // Dynamic search label based on view mode
  const searchLabel = viewByGroups
    ? intl.formatMessage({
        id: 'groups.search',
        defaultMessage: 'Search groups',
      })
    : intl.formatMessage({
        id: 'assignments.search',
        defaultMessage: 'Search',
      });

  return (
    <SearchFilterBarContainer>
      <LeftSection>
        {/* Hide worker type filter in groups view */}
        {!viewByGroups && (
          <FilterContainer>
            <WorkerTypeFilter
              value={workerType}
              onChange={onWorkerTypeChange}
            />
          </FilterContainer>
        )}
        <SearchContainer>
          <SearchField
            value={searchText}
            onChange={onSearchChange}
            label={searchLabel}
          />
        </SearchContainer>
      </LeftSection>
      <RightSection>
        <ViewToggle checked={viewByGroups} onChange={onViewToggle} />
      </RightSection>
    </SearchFilterBarContainer>
  );
};
