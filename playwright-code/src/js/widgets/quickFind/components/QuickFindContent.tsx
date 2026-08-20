import React, { useMemo } from 'react';
import TeamMemberDropdownGraphQL from './TeamMemberDropdownGraphQL';
import CustomerDropdown from './CustomerDropdown';
import ServiceDropdown from './ServiceDropdown';
import ClassDropdown from './ClassDropdown';
import LocationDropdown from './LocationDropdown';
import {
  BaseDropdownProps,
  CustomerDropdownProps,
  ServiceDropdownProps,
  ClassDropdownProps,
  LocationDropdownProps,
} from '../types';

const QuickFindContent: React.FC<
  BaseDropdownProps &
    Partial<CustomerDropdownProps> &
    Partial<ServiceDropdownProps> &
    Partial<ClassDropdownProps> &
    Partial<LocationDropdownProps>
> = ({
  dropdownType = 'team-member',
  onChange,
  onReady,
  onError,
  label,
  placeholder,
  errorText,
  subTypes,
  onLoad,
  value,
  filters,
  width,
  addNew,
  disabled,
  timeForEntityId,
  customerId,
  projectId,
  assignmentFilters,
  labelPreference, // Add labelPreference
  preloadedServiceOptions,
  preloadedClassOptions,
  preloadedLocationOptions,
  onSearchService,
  onSearchClass,
  onSearchLocation,
  hasMoreService,
  loadMoreService,
  hasMoreClass,
  loadMoreClass,
  hasMoreLocation,
  loadMoreLocation,
  displayName,
  autoSelect,
  autoSelectKey,
}) => {
  // Determine assignment filters for customer based on worker selection
  // When worker is selected (timeForEntityId exists): filter to assigned customers only
  // When no worker selected: show all customers (no assignment filter)
  // useMemo prevents unnecessary re-renders and API calls
  const customerAssignmentFilters = useMemo(
    () => (timeForEntityId ? { assigned: true } : undefined),
    [timeForEntityId],
  );

  const handleChange = (value: string, item?: any) => {
    onChange?.(value, item);
  };

  const handleReady = () => {
    onReady?.();
  };

  const handleError = (error: Error | string) => {
    onError?.(error);
  };

  // Route to service dropdown if type is service
  if (dropdownType === 'service') {
    return (
      <div>
        <ServiceDropdown
          value={value}
          onChange={handleChange}
          onReady={handleReady}
          onError={handleError}
          label={label}
          placeholder={placeholder}
          errorText={errorText}
          onLoad={onLoad}
          width={width}
          addNew={addNew}
          disabled={disabled}
          timeForEntityId={timeForEntityId}
          customerId={customerId}
          projectId={projectId}
          assignmentFilters={assignmentFilters}
          preloadedOptions={preloadedServiceOptions}
          onSearchService={onSearchService}
          hasMoreService={hasMoreService}
          loadMoreService={loadMoreService}
          displayName={displayName}
          autoSelect={autoSelect}
          autoSelectKey={autoSelectKey}
        />
      </div>
    );
  }

  // Route to customer dropdown if type is customer
  if (dropdownType === 'customer') {
    return (
      <div>
        <CustomerDropdown
          value={value}
          onChange={handleChange}
          onReady={handleReady}
          onError={handleError}
          label={label}
          placeholder={placeholder}
          errorText={errorText}
          onLoad={onLoad}
          width={width}
          addNew={addNew}
          disabled={disabled}
          timeForEntityId={timeForEntityId}
          assignmentFilters={assignmentFilters || customerAssignmentFilters}
          displayName={displayName}
        />
      </div>
    );
  }

  // Route to class dropdown if type is class
  if (dropdownType === 'class') {
    return (
      <div>
        <ClassDropdown
          value={value}
          onChange={handleChange}
          onReady={handleReady}
          onError={handleError}
          label={label}
          placeholder={placeholder}
          errorText={errorText}
          onLoad={onLoad}
          width={width}
          addNew={addNew}
          disabled={disabled}
          timeForEntityId={timeForEntityId}
          customerId={customerId}
          projectId={projectId}
          assignmentFilters={assignmentFilters}
          preloadedOptions={preloadedClassOptions}
          onSearchClass={onSearchClass}
          hasMoreClass={hasMoreClass}
          loadMoreClass={loadMoreClass}
          displayName={displayName}
          autoSelect={autoSelect}
          autoSelectKey={autoSelectKey}
        />
      </div>
    );
  }

  // Route to location dropdown if type is location
  if (dropdownType === 'location') {
    return (
      <div>
        <LocationDropdown
          value={value}
          onChange={handleChange}
          onReady={handleReady}
          onError={handleError}
          label={label}
          placeholder={placeholder}
          errorText={errorText}
          onLoad={onLoad}
          width={width}
          addNew={addNew}
          disabled={disabled}
          timeForEntityId={timeForEntityId}
          customerId={customerId}
          projectId={projectId}
          assignmentFilters={assignmentFilters}
          labelPreference={labelPreference}
          preloadedOptions={preloadedLocationOptions}
          onSearchLocation={onSearchLocation}
          hasMoreLocation={hasMoreLocation}
          loadMoreLocation={loadMoreLocation}
          displayName={displayName}
          autoSelect={autoSelect}
          autoSelectKey={autoSelectKey}
        />
      </div>
    );
  }

  // Route to team member dropdown (default) — always GraphQL-backed with
  // infinite scroll.
  return (
    <div>
      <TeamMemberDropdownGraphQL
        value={value}
        onChange={handleChange}
        onReady={handleReady}
        onError={handleError}
        label={label}
        placeholder={placeholder}
        errorText={errorText}
        subTypes={subTypes as any}
        onLoad={onLoad}
        filters={filters}
        width={width}
        addNew={addNew}
        disabled={disabled}
        displayName={displayName}
      />
    </div>
  );
};

export default QuickFindContent;
