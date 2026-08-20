import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from '@payroll/quicksand';
import DropdownTypeahead from '@ids-ts/dropdown-typeahead';
import {
  ReactEvent,
  OnChangeInfoType,
} from '@ids-ts/dropdown-typeahead/dist/types';
import styled from 'styled-components';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { FullWidthMenuItem } from 'src/js/widgets/quickFind/styles';
import {
  TimeTracking_WorkerOrderBy,
  TimeTracking_WorkersQueryFilter,
  TimeTracking_TimeForType,
} from 'src/__generated__/timeTracking/graphql';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { useTeamMemberLoadMore } from '../hooks/useTeamMemberLoadMore';
import { useDropdownInfiniteScroll } from '../hooks/useDropdownInfiniteScroll';
import { ContactType, TeamMemberDropdownProps } from '../types';

const MenuItemContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
`;

const MainLabel = styled.span<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  font-weight: ${({ selected }) => (selected ? 'bold' : 'normal')};
`;

const RowTextLabel = styled.span`
  display: flex;
  align-items: center;
`;

const SubLabel = styled.span`
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 0.9em;
  text-transform: capitalize;
`;

const TeamMemberDropdownGraphQL: React.FC<TeamMemberDropdownProps> = ({
  subTypes = [],
  value,
  onChange,
  onReady,
  onError,
  label,
  placeholder,
  errorText,
  onLoad,
  disabled = false,
  addNew = false,
  filters,
  width,
  displayName,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const intl = useIntl();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showAddEmployeeDrawer, setShowAddEmployeeDrawer] = useState(false);
  const [preservedInputValue, setPreservedInputValue] = useState('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    isEnabled: isLegacyQboUserEnabled,
    settled: isLegacyQboUserFlagSettled,
  } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });

  // Stable references for subTypes content to prevent unnecessary memo recalculations
  const hasVendor = subTypes.includes(ContactType.Vendor);
  const hasEmployee = subTypes.includes(ContactType.Employee);

  const vendorFilter = filters?.subtypes?.[ContactType.Vendor] || false;
  const employeeFilter = filters?.subtypes?.[ContactType.Employee] || false;

  // Create filter based on subTypes and search text
  const filter = useMemo(() => {
    const typeFilters: TimeTracking_TimeForType[] = [];

    // Add vendor condition if vendor is included in subTypes
    if (hasVendor) {
      typeFilters.push(TimeTracking_TimeForType.Vendor);
    }

    // Add employee condition if employee is included in subTypes
    if (hasEmployee) {
      typeFilters.push(TimeTracking_TimeForType.Employee);
      if (isLegacyQboUserEnabled) {
        typeFilters.push(TimeTracking_TimeForType.LegacyQboUser);
      }
    }

    const baseFilter: TimeTracking_WorkersQueryFilter = {
      isActive: true,
      ...(typeFilters.length > 0 && { types: typeFilters }),
    };

    // Add search filter if search text is provided
    // searchText searches across firstName, lastName, and displayName fields
    if (searchText.trim()) {
      return {
        ...baseFilter,
        searchText: searchText.trim(),
      };
    }

    return baseFilter;
  }, [hasVendor, hasEmployee, isLegacyQboUserEnabled, searchText]);

  // Use GraphQL hook with load more pagination
  const { workers, loading, loadWorkers, error, refetch, loadMore, hasMore } =
    useTeamMemberLoadMore({
      pageSize: 100,
      enableLoadMore: true,
      orderBy: [TimeTracking_WorkerOrderBy.DisplayNameAsc],
    });

  // Debounced search function
  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setSearchText(searchValue);
    }, 300); // 300ms debounce delay
  }, []);

  // Wire infinite scroll via shared hook so STE and WTE behave identically.
  useDropdownInfiniteScroll({
    containerRef,
    hasMore,
    loading,
    loadMore,
  });

  // Load data when filter changes
  // Use JSON.stringify for stable comparison of filter object
  const filterString = useMemo(() => JSON.stringify(filter), [filter]);

  useEffect(() => {
    if (!isLegacyQboUserFlagSettled) return;
    loadWorkers(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString, isLegacyQboUserFlagSettled]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
    [],
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Filter workers based on additional filters
  const filteredWorkers = useMemo(
    () =>
      workers.filter((worker) => {
        // Apply vendor filter if specified
        if (
          worker.type === TimeTracking_TimeForType.Vendor &&
          vendorFilter &&
          Object.keys(vendorFilter).length > 0
        ) {
          return Object.keys(vendorFilter).every(
            (key) => vendorFilter[key] === (worker as any)[key],
          );
        }

        // Apply employee filter if specified
        if (
          worker.type === TimeTracking_TimeForType.Employee &&
          employeeFilter &&
          Object.keys(employeeFilter).length > 0
        ) {
          return Object.keys(employeeFilter).every(
            (key) => employeeFilter[key] === (worker as any)[key],
          );
        }

        return true;
      }),
    [workers, vendorFilter, employeeFilter],
  );

  // Combine workers into a single list for the dropdown
  const allContacts = useMemo(
    () =>
      filteredWorkers.map((worker) => {
        let type: string;
        let typeLabel: string;
        if (worker.type === TimeTracking_TimeForType.Vendor) {
          type = 'vendor';
          typeLabel = intl.formatMessage({
            id: 'quickfind.dropdown.team.member.type.vendor',
          });
        } else if (
          isLegacyQboUserEnabled &&
          worker.type === TimeTracking_TimeForType.LegacyQboUser
        ) {
          type = 'legacy_qbo_user';
          typeLabel = intl.formatMessage({
            id: 'quickfind.dropdown.team.member.type.qbo.user',
          });
        } else {
          type = 'employee';
          typeLabel = intl.formatMessage({
            id: 'quickfind.dropdown.team.member.type.employee',
          });
        }
        return {
          id: worker.id,
          displayName:
            worker.displayName ||
            `${worker.firstName} ${worker.lastName}`.trim() ||
            '',
          type,
          typeLabel,
        };
      }),
    [filteredWorkers, isLegacyQboUserEnabled, intl],
  );

  useEffect(() => {
    if (!isLoaded && allContacts.length > 0) {
      setIsLoaded(true);
      onLoad?.(allContacts);
      // Call onReady when data is loaded
      onReady?.(allContacts);
    }
  }, [isLoaded, allContacts, onLoad, onReady]);

  // Reset user cleared state and update selectedValue when value prop changes
  // from outside — only when value becomes non-empty so a user-initiated clear
  // (value -> '') is preserved.
  useEffect(() => {
    if (value) {
      setIsUserCleared(false);
    }
    setSelectedValue(value || '');
  }, [value]);

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    // Don't show dropdown until data is ready
    if (allContacts.length === 0 && loading) {
      return [];
    }

    return allContacts.map((contact) => ({
      value: contact.id,
      label: contact.displayName,
      type: contact.type,
      typeLabel: contact.typeLabel,
    }));
  }, [allContacts, loading]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const selectedId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;

      // Handle dropdown selection change
      if (onChange && selectedId) {
        const selectedContact = allContacts.find(
          (contact) => contact.id === selectedId,
        );

        // Set input value to the selected contact's name to prevent text clearing
        if (selectedContact) {
          setInputValue(selectedContact.displayName);

          // Clear search text when selection is made (only if it has a value)
          if (searchText) {
            setSearchText('');
          }

          // Reset user cleared state when a new selection is made
          setIsUserCleared(false);

          // Call onChange with full contact details
          onChange(selectedId, {
            id: selectedId,
            name: selectedContact.displayName,
            type: selectedContact.type,
          });
        }
      }
    },
    [onChange, allContacts, searchText],
  );

  // Handle search with debouncing
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      debouncedSearch(searchValue);
      setSelectedValue('');
      // If user clears all text, clear the selection and mark as user cleared
      if (searchValue.trim() === '') {
        setIsUserCleared(true);
        if (value && onChange) {
          onChange('', undefined);
        }
      } else {
        // Reset user cleared state when user starts typing
        setIsUserCleared(false);
      }
    },
    [debouncedSearch, value, onChange],
  );

  // Handle blur - refetch without search filter
  const handleBlur = useCallback(() => {
    // If there's a valid value, preserve it and don't set input value to empty to prevent text clearing
    if (value) {
      setSearchText('');
      return;
    }

    // If user was typing but didn't select anything, clear the selection
    if (inputValue && onChange) {
      const selectedContact = allContacts.find(
        (contact) =>
          contact.displayName.toLowerCase() === inputValue.toLowerCase(),
      );

      // If the typed text doesn't match any contact exactly, clear the selection
      if (!selectedContact) {
        onChange('', undefined);
        setIsUserCleared(true);
      }
    }

    setSearchText('');
    setInputValue('');
  }, [value, inputValue, onChange, allContacts]);

  const defaultLabel = label || '';
  const defaultPlaceholder = placeholder || '';

  const loadingLabel = intl.formatMessage({
    id: 'quickfind.dropdown.loading',
    defaultMessage: 'Loading...',
  });

  // Get display value for selected contact
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared the input, show empty string
    if (isUserCleared) {
      return '';
    }

    // Show selected contact's name when present in the loaded page
    if (value && allContacts.length > 0) {
      const selectedContact = allContacts.find(
        (contact) => contact.id === value,
      );
      if (selectedContact) {
        return selectedContact.displayName;
      }
    }

    // Id not in current page (e.g. only first 100 fetched) or still loading
    // — fall back to caller-provided name. Gated on `value` so a stale name
    // does not reappear after a clear.
    if (value && displayName) return displayName;

    // Have a selected id but no name yet (slow workers API). Show "Loading…"
    // rather than a blank input so the user knows the field is still
    // resolving.
    if (value && loading) return loadingLabel;

    return '';
  }, [
    value,
    allContacts,
    inputValue,
    isUserCleared,
    displayName,
    loading,
    loadingLabel,
  ]);

  const addNewItemProps = {
    onClick: () => {
      setPreservedInputValue(inputValue);
      setShowAddEmployeeDrawer(true);
    },
  };

  return (
    <div ref={containerRef}>
      <DropdownTypeahead
        value={selectedValue}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onBlur={handleBlur}
        dataSource={dataSource}
        label={defaultLabel}
        placeholder={defaultPlaceholder}
        errorText={errorText}
        disabled={disabled}
        isLoading={loading && allContacts.length === 0}
        loadingAriaLabel={loadingLabel}
        aria-label={defaultLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfill.dropdown.team.member.add.new',
        })}
        renderItem={(item, index) => {
          const highlightText = (
            text: string | undefined,
            searchValue: string,
          ) => {
            if (!searchValue.trim() || !text) return text || '';

            // Use the same approach as quickfill: split with capture groups
            const regex = new RegExp(
              `(${searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
              'gi',
            );
            const parts = text.split(regex);

            return parts
              .filter((part) => part) // Filter out empty parts
              .map((part, i) =>
                regex.test(part) ? (
                  // eslint-disable-next-line react/no-array-index-key
                  <b key={`bold-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
                    {part}
                  </b>
                ) : (
                  // eslint-disable-next-line react/no-array-index-key
                  <span key={`span-${part}-${i}`} style={{ whiteSpace: 'pre' }}>
                    {part}
                  </span>
                ),
              );
          };

          const isSelected = item.value === value;

          return (
            <FullWidthMenuItem
              key={`${index}`}
              value={item.value}
              className="quickfind-menu-item"
            >
              <MenuItemContent>
                <MainLabel selected={isSelected}>
                  <RowTextLabel title={item.label}>
                    {highlightText(item.label, inputValue || '')}
                  </RowTextLabel>
                </MainLabel>
                <SubLabel>{item.typeLabel}</SubLabel>
              </MenuItemContent>
            </FullWidthMenuItem>
          );
        }}
      />
      {showAddEmployeeDrawer && (
        <Widget
          widgetId="qbo-contacts-v2/contact-drawer"
          nameTypes={['employee', 'vendor']}
          open
          defaultName={preservedInputValue}
          onClose={() => setShowAddEmployeeDrawer(false)}
          onSuccess={(newContact: any) => {
            // Refetch data to show the newly added contact

            refetch(filter);

            // Extract the actual ID from the compound string (e.g., "djQuMTo5MzQxNDUyNzk3MzQyNTg3OjlkNjk5ZTk2MDg:400000115" -> "400000115")
            const actualId = newContact.id.includes(':')
              ? newContact.id.split(':')[1]
              : newContact.id;

            onChange?.(actualId, {
              id: actualId,
              name: newContact.displayName,
              type:
                newContact.type ||
                (subTypes.includes(ContactType.Employee)
                  ? ContactType.Employee
                  : ContactType.Vendor),
            });

            // Update input value to show the new contact name
            setInputValue(newContact.displayName);

            // Reset search, user cleared state, and close drawer
            setSearchText('');
            setIsUserCleared(false);
            setShowAddEmployeeDrawer(false);
          }}
        />
      )}
    </div>
  );
};

export default TeamMemberDropdownGraphQL;
