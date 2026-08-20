import React from 'react';
import StatusFilterDropdown from './StatusFilterDropdown';
import CustomerFilterDropdown from './CustomerFilterDropdown';
import DueDateFilterDropdown from './DueDateFilterDropdown';
import ProjectSearchInput from './ProjectSearchInput';
import ProjectSearchTypeahead from './ProjectSearchTypeahead';
import { FiltersContainer } from './TimeProjectFilters.styled';
import { ProjectNameSearchResult } from '../hooks/useProjectNameSearch';
import { DueDateRange } from '../types';

interface TimeProjectFiltersProps {
  statusFilter: string;
  customerFilter: string;
  searchText: string;
  isWorkflowApiEnabled: boolean;
  isAccountant: boolean;
  dueDateRange: DueDateRange | null;
  onStatusChange: (status: string) => void;
  onCustomerChange: (customerId: string) => void;
  onSearchChange: (text: string) => void;
  onProjectSelect: (projectId: string) => void;
  onSearchSubmit: (text: string, results: ProjectNameSearchResult[]) => void;
  onSearchClear: () => void;
  onDueDateChange: (range: DueDateRange) => void;
}

const TimeProjectFilters: React.FC<TimeProjectFiltersProps> = ({
  statusFilter,
  customerFilter,
  searchText,
  isWorkflowApiEnabled,
  isAccountant,
  dueDateRange,
  onStatusChange,
  onCustomerChange,
  onSearchChange,
  onProjectSelect,
  onSearchSubmit,
  onSearchClear,
  onDueDateChange,
}) => (
  <FiltersContainer data-testid="time-project-filters">
    <StatusFilterDropdown
      value={statusFilter}
      onChange={onStatusChange}
      isWorkflowApiEnabled={isWorkflowApiEnabled}
      isAccountant={isAccountant}
    />
    <CustomerFilterDropdown
      value={customerFilter}
      onChange={onCustomerChange}
    />
    {isWorkflowApiEnabled && isAccountant && (
      <DueDateFilterDropdown
        dueDateRange={dueDateRange}
        onChange={onDueDateChange}
      />
    )}
    {isWorkflowApiEnabled ? (
      <ProjectSearchTypeahead
        value={searchText}
        onProjectSelect={onProjectSelect}
        onSearchSubmit={onSearchSubmit}
        onSearchClear={onSearchClear}
      />
    ) : (
      <ProjectSearchInput value={searchText} onChange={onSearchChange} />
    )}
  </FiltersContainer>
);

export default TimeProjectFilters;
