import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import DropdownTypeahead from '@ids-ts/dropdown-typeahead';
import {
  ReactEvent,
  OnChangeInfoType,
} from '@ids-ts/dropdown-typeahead/dist/types';
import styled from 'styled-components';
import { Info } from '@design-systems/icons';
import Tooltip from '@ids-ts/tooltip';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { useQbTimeSdk } from 'src/js/service/hooks/useQbTimeSdk';
import { FullWidthMenuItem } from '../styles';
import { useCustomerProjects } from '../hooks/useCustomerProjects';
import { useDropdownInfiniteScroll } from '../hooks/useDropdownInfiniteScroll';
import { Customer, CustomerDropdownProps, CustomerType } from '../types';
import {
  highlightSearchText,
  buildHierarchy,
  flattenHierarchy,
  getParentNameFromFullName,
} from '../utils/dropdownHelpers';

const AssignmentLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const AssignmentIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;

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

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  timeForEntityId,
  assignmentFilters,
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
  width,
  displayName,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const intl = useIntl();
  const sandbox = useSandbox();
  // QuickFind is assignment by default; show info icon next to label
  const assignmentInfoTooltip = intl.formatMessage({
    id: 'customer.project.assignment.info.tooltip',
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showAddContactDrawer, setShowAddContactDrawer] = useState(false);
  const [preservedInputValue, setPreservedInputValue] = useState('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Customers added via the drawer, prepended to the local list immediately.
  // Mirrors quickfills: setData([mappedContact].concat(data)).
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);

  const { customers, loading, error, loadCustomers, loadMore, hasMore } =
    useCustomerProjects({
      pageSize: 100,
      enableLoadMore: true,
    });
  const customerSelectionRequiredSelector = useCallback(
    (sdk) => sdk.isCustomerSelectionRequired,
    [],
  );
  const {
    execute: checkCustomerSelectionRequired,
    data: isCustomerSelectionRequired,
  } = useQbTimeSdk<boolean, [number | undefined | null]>(
    customerSelectionRequiredSelector,
  );

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

  // Load data when search text or timeForEntityId changes
  useEffect(() => {
    if (!timeForEntityId) {
      sandbox.logger.warn(
        'CustomerDropdown: timeForEntityId is required but not provided',
      );
      return;
    }

    // Reset loaded state when worker changes to allow onReady to fire again
    setIsLoaded(false);
    // Clear pending customers on worker/filter change so a customer added for one
    // worker does not bleed into another worker's list.
    setPendingCustomers([]);

    loadCustomers({
      timeForEntityId,
      searchText: searchText.trim() || undefined,
      assignmentFilters,
    });
    // Note: sandbox is intentionally not in deps to avoid re-fetching on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeForEntityId, searchText, assignmentFilters, loadCustomers]);

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    },
    [],
  );

  // Handle errors - log but don't block UI
  useEffect(() => {
    if (error) {
      sandbox.logger.error('CustomerDropdown: Error loading customers', {
        error,
      });
      onError?.(error);

      // Call onReady even on error to unblock UI
      // Customer dropdown will fallback to showing no customers (empty state)
      if (!isLoaded) {
        setIsLoaded(true);
        onReady?.([]); // Empty array on error
      }
    }
  }, [error, onError, onReady, isLoaded, sandbox]);

  // Prepend pending customers to the server list (mirrors quickfills setData([new].concat(data)))
  const customerList = useMemo(() => {
    if (pendingCustomers.length === 0) return customers;
    const unconfirmed = pendingCustomers.filter(
      (pending) =>
        !customers.some((fetched) => String(fetched.id) === String(pending.id)),
    );
    return unconfirmed.length > 0 ? [...unconfirmed, ...customers] : customers;
  }, [customers, pendingCustomers]);

  // Build hierarchical structure from flat list
  const hierarchicalCustomers = useMemo(
    () => buildHierarchy(customerList),
    [customerList],
  );

  // Flatten hierarchy with depth information for rendering
  const flattenedCustomers = useMemo(
    () => flattenHierarchy(hierarchicalCustomers),
    [hierarchicalCustomers],
  );

  // When searching, reset depth to 0 to remove indentation
  const displayCustomers = useMemo(() => {
    if (searchText.trim()) {
      return flattenedCustomers.map((c) => ({
        ...c,
        depth: 0, // No indentation during search
      }));
    }
    return flattenedCustomers;
  }, [flattenedCustomers, searchText]);

  // Call onLoad and onReady when data is available (even if empty)
  useEffect(() => {
    // Only call once when loading completes (whether data is empty or not)
    if (!isLoaded && !loading && customers.length >= 0) {
      setIsLoaded(true);
      onLoad?.(displayCustomers);
      onReady?.(displayCustomers);
    }
  }, [isLoaded, loading, customers.length, displayCustomers, onLoad, onReady]);

  // Check if customer selection is required (workforce user with assigned customers).
  useEffect(() => {
    if (!searchText.trim()) {
      checkCustomerSelectionRequired(customers.length);
    }
  }, [customers.length, searchText, checkCustomerSelectionRequired]);

  // Sync internal state with the controlled `value`.
  // Only blank `inputValue` when `value` is cleared — preserves the typed/picked label otherwise so the next render shows the resolved label, not an empty input.
  // Reset isUserCleared only when value becomes non-empty so a user-initiated
  // clear (value -> '') is preserved.
  useEffect(() => {
    if (value != null && value !== '') {
      setIsUserCleared(false);
      setSelectedValue(String(value));
    } else {
      setSelectedValue('');
      setInputValue('');
    }
  }, [value]);

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    if (displayCustomers.length === 0 && loading) {
      return [];
    }

    return displayCustomers.map((customer) => ({
      value: customer.id,
      label: customer.displayName,
      fullName: customer.fullName,
      type: customer.type,
      depth: customer.depth,
    }));
  }, [displayCustomers, loading]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      // infoObject.selectedItem is populated for both click and Enter key selection
      const selectedId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;

      if (onChange && selectedId) {
        const selectedCustomer = displayCustomers.find(
          (customer) => customer.id === selectedId,
        );

        if (selectedCustomer) {
          setInputValue(selectedCustomer.displayName);

          // Donot clear `searchText` here as it is a dep of the load effect
          // clearing it here would refetch and replace `customers` before the new selection settles.
          // Cleared on blur instead so the next dropdown open shows a fresh list.

          // Reset user cleared state
          setIsUserCleared(false);

          // For projects, we need to pass both customer ID and project ID
          // When type is PROJECT: selectedId is the project ID, parentId is the customer ID
          const isProject = selectedCustomer.type === 'PROJECT';

          const changeData = {
            id: selectedId,
            name: selectedCustomer.displayName,
            fullName: selectedCustomer.fullName,
            type: selectedCustomer.type,
            parentId: selectedCustomer.parentId,
            // For projects, also include customerId for easier access
            ...(isProject && selectedCustomer.parentId
              ? {
                  customerId: selectedCustomer.parentId,
                  projectId: selectedId,
                }
              : {}),
          };

          // Call onChange with customer details
          onChange(selectedId, changeData);
        }
      }
    },
    [onChange, displayCustomers],
  );

  // Handle search with debouncing
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      debouncedSearch(searchValue);
      setSelectedValue('');

      // If user clears all text, clear the selection
      if (searchValue.trim() === '') {
        setIsUserCleared(true);
        if (value && onChange) {
          onChange('', undefined);
        }
      } else {
        setIsUserCleared(false);
      }
    },
    [debouncedSearch, value, onChange],
  );

  // Handle blur - clear search and input
  const handleBlur = useCallback(() => {
    // If there's a valid value (from prop), preserve it and don't validate
    // This handles the case when displayCustomers is empty during refetch after search
    if (value) {
      setSearchText('');
      return;
    }

    // If user was typing but didn't select anything, clear the selection
    if (inputValue && onChange) {
      const selectedCustomer = displayCustomers.find(
        (customer) =>
          customer.displayName.toLowerCase() === inputValue.toLowerCase() ||
          customer.fullName.toLowerCase() === inputValue.toLowerCase(),
      );

      // If no exact match found, clear the selection
      if (!selectedCustomer) {
        onChange('', undefined);
        setIsUserCleared(true);
      }
    }

    setSearchText('');
    setInputValue('');
  }, [value, inputValue, onChange, displayCustomers]);

  const defaultLabel = label || '';
  const displayLabel = isCustomerSelectionRequired
    ? `${defaultLabel} *`
    : defaultLabel;
  const defaultPlaceholder = placeholder || '';
  // Show label + info icon above typeahead; pass empty label to typeahead to avoid duplicate
  const effectiveLabel = displayLabel ? '' : displayLabel;

  const loadingLabel = intl.formatMessage({
    id: 'quickfind.dropdown.loading',
    defaultMessage: 'Loading...',
  });

  // Get display value for selected customer
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared, show empty
    if (isUserCleared) {
      return '';
    }

    // Show selected customer's full name when present in the loaded page
    // (compare as strings so id "44" matches option id 44).
    if (value != null && value !== '' && displayCustomers.length > 0) {
      const valueStr = String(value);
      const selectedCustomer = displayCustomers.find(
        (customer) => String(customer.id) === valueStr,
      );
      if (selectedCustomer) {
        return selectedCustomer.fullName || selectedCustomer.displayName;
      }
    }

    // Id not in current page (e.g. only first 100 fetched) or still loading
    // — fall back to DAS-provided name so the user sees something on load.
    // Gated on `value` so the stale DAS name does not reappear after a clear.
    if (value && displayName) return displayName;

    // Have a selected id but no name yet (slow assignments API). Show
    // "Loading…" rather than a blank input so the user knows the field is
    // still resolving.
    if (value && loading) return loadingLabel;

    return '';
  }, [
    value,
    displayCustomers,
    inputValue,
    isUserCleared,
    displayName,
    loading,
    loadingLabel,
  ]);

  const addNewItemProps = {
    onClick: () => {
      setPreservedInputValue(inputValue);
      setShowAddContactDrawer(true);
    },
  };

  /**
   * Get type label for customer/project.
   * For child items (sub-customers and projects) includes the parent name,
   * e.g. "Project of Customer 1" or "Sub-customer of Cus 2".
   */
  const getTypeLabel = useCallback(
    (customer: Customer) => {
      const isProject = customer.type === CustomerType.Project;

      // Extract parent name directly from fullName (colon-separated hierarchy).
      // e.g. "Kucher Companies:NK Project" → "Kucher Companies"
      // This works during search too, where the parent node may not be in displayCustomers.
      const parentName = getParentNameFromFullName(customer.fullName);

      if (parentName) {
        const baseLabel = isProject
          ? intl.formatMessage({
              id: 'quickfind.dropdown.customer.project.label',
              defaultValue: 'Project',
            })
          : intl.formatMessage({
              id: 'quickfind.dropdown.customer.sub.customer.label',
              defaultValue: 'Sub-customer',
            });

        const ofText = intl.formatMessage({
          id: 'quickfind.dropdown.customer.of.label',
          defaultValue: 'of',
        });
        return `${baseLabel} ${ofText} ${parentName}`;
      }

      if (isProject) {
        return intl.formatMessage({
          id: 'quickfind.dropdown.customer.project.label',
          defaultValue: 'Project',
        });
      }

      return intl.formatMessage({
        id: 'quickfind.dropdown.customer.customer.label',
        defaultValue: 'Customer',
      });
    },
    [intl],
  );

  return (
    <div ref={containerRef}>
      {displayLabel && assignmentInfoTooltip && (
        <AssignmentLabelRow>
          <span>
            {defaultLabel}
            {isCustomerSelectionRequired && <span aria-hidden="true"> *</span>}
          </span>
          <Tooltip message={assignmentInfoTooltip}>
            <AssignmentIconWrapper aria-label={assignmentInfoTooltip}>
              <Info size="small" aria-label={assignmentInfoTooltip} />
            </AssignmentIconWrapper>
          </Tooltip>
        </AssignmentLabelRow>
      )}
      <DropdownTypeahead
        value={selectedValue}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onBlur={handleBlur}
        dataSource={dataSource}
        label={effectiveLabel}
        placeholder={defaultPlaceholder}
        errorText={errorText}
        disabled={disabled}
        isLoading={loading && displayCustomers.length === 0}
        loadingAriaLabel={loadingLabel}
        aria-label={displayLabel || effectiveLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfind.dropdown.customer.add.new',
          defaultValue: 'Add new customer',
        })}
        renderItem={(item, index) => {
          const customer = displayCustomers.find((c) => c.id === item.value);
          if (!customer) {
            return (
              <FullWidthMenuItem
                key={`${index}`}
                value={item.value}
                className="quickfind-menu-item"
              >
                <MenuItemContent>
                  <MainLabel>{item.label}</MainLabel>
                </MenuItemContent>
              </FullWidthMenuItem>
            );
          }

          const isSelected = item.value === value;
          const depth = customer.depth || 0;

          return (
            <FullWidthMenuItem
              key={`${index}`}
              value={item.value}
              className="quickfind-menu-item"
              style={{
                paddingLeft: `${depth * 24 + 16}px`, // 24px per level + 16px base padding
              }}
            >
              <MenuItemContent>
                <MainLabel selected={isSelected}>
                  <RowTextLabel title={item.fullName || item.label}>
                    {highlightSearchText(item.label, inputValue || '')}
                  </RowTextLabel>
                </MainLabel>
                <SubLabel>{getTypeLabel(customer)}</SubLabel>
              </MenuItemContent>
            </FullWidthMenuItem>
          );
        }}
      />
      {showAddContactDrawer && (
        <Widget
          widgetId="qbo-contacts-v2/contact-drawer"
          open
          defaultName={preservedInputValue}
          onClose={() => setShowAddContactDrawer(false)}
          onSuccess={(newContact: any) => {
            const localId =
              (
                newContact.externalIds as
                  | Array<{ namespaceId: string; localId: string }>
                  | undefined
              )?.find((e) => e.namespaceId === 'intuit.qbo.name.id')?.localId ??
              '';

            if (!localId) return;

            // Prepend the new customer immediately so value→label resolves
            // before the API refetch completes (mirrors quickfills setData([new].concat(data))).
            setPendingCustomers((prev) => [
              {
                id: localId,
                displayName: newContact.displayName,
                fullName: newContact.displayName,
                type: CustomerType.Customer,
                depth: 0,
              },
              ...prev,
            ]);

            // Select the newly added customer
            onChange?.(localId, {
              id: localId,
              name: newContact.displayName,
              fullName: newContact.displayName,
              type: CustomerType.Customer,
            });

            setIsUserCleared(false);
            setShowAddContactDrawer(false);
          }}
        />
      )}
    </div>
  );
};

export default CustomerDropdown;
