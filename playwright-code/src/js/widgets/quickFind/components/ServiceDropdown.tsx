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
import Widget from 'web-shell-core/widgets/HOCWidget';
import { debounce } from 'src/js/service/utils/debounce';
import { FullWidthMenuItem } from '../styles';
import { useServiceItems } from '../hooks/useServiceItems';
import { useAutoSelectSingle } from '../hooks/useAutoSelectSingle';
import { useDropdownInfiniteScroll } from '../hooks/useDropdownInfiniteScroll';
import { ServiceDropdownProps, ServiceItem } from '../types';
import { highlightSearchText } from '../utils/dropdownHelpers';

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

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 50%;
  flex-shrink: 0;
  min-width: 0;
`;

const SubLabel = styled.span`
  color: var(--color-text-primary);
  font-style: italic;
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: right;
`;

const CategoryLabel = styled.span`
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 0.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-align: right;
`;

const ServiceDropdown: React.FC<ServiceDropdownProps> = ({
  timeForEntityId,
  customerId,
  projectId,
  assignmentFilters,
  preloadedOptions,
  onSearchService,
  hasMoreService,
  loadMoreService,
  displayName,
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
  autoSelect = false,
  autoSelectKey,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const intl = useIntl();
  const sandbox = useSandbox();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [showAddServiceDrawer, setShowAddServiceDrawer] = useState(false);
  const [preservedInputValue, setPreservedInputValue] = useState('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    serviceItems,
    loading,
    error,
    loadServiceItems,
    refetch,
    refetchWithSearch,
    loadMore,
    hasMore,
  } = useServiceItems({
    pageSize: 100,
    enableLoadMore: true,
    preloadedOptions,
    hasMoreFromParent: hasMoreService,
    loadMoreFromParent: loadMoreService,
    timeForEntityId,
    customerId,
    projectId,
    assignmentFilters,
  });

  const debouncedOnSearchService = useMemo(() => {
    if (onSearchService)
      return debounce((text: string | null) => onSearchService(text), 300);
    if (refetchWithSearch)
      return debounce((text: string | null) => refetchWithSearch(text), 300);
    return undefined;
  }, [onSearchService, refetchWithSearch]);

  // Reset loaded state when context changes so onReady can fire again after new data loads
  useEffect(() => {
    if (preloadedOptions === undefined && timeForEntityId) {
      setIsLoaded(false);
    }
  }, [
    preloadedOptions,
    timeForEntityId,
    customerId,
    projectId,
    assignmentFilters,
  ]);

  // Wire infinite scroll via shared hook so STE and WTE behave identically.
  useDropdownInfiniteScroll({
    containerRef,
    hasMore,
    loading,
    loadMore,
  });

  // Handle errors - log but don't block UI
  useEffect(() => {
    if (error) {
      sandbox.logger.error('ServiceDropdown: Error loading service items', {
        error,
      });
      onError?.(error);

      // Call onReady even on error to unblock UI
      if (!isLoaded) {
        setIsLoaded(true);
        onReady?.([]); // Empty array on error
      }
    }
  }, [error, onError, onReady, isLoaded, sandbox]);

  // When using API search (parent onSearchService or hook's refetchWithSearch), list is already filtered; else filter client-side.
  // With hook, refetchWithSearch is always present; with preloadedOptions only we filter client-side when no onSearchService.
  const useApiSearch = Boolean(onSearchService) || !preloadedOptions;
  const filteredServiceItems = useMemo(() => {
    if (useApiSearch) return serviceItems;
    if (!searchText.trim()) return serviceItems;
    const searchLower = searchText.toLowerCase();
    return serviceItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower),
    );
  }, [serviceItems, searchText, useApiSearch]);

  // Call onLoad and onReady when data is available (even if empty)
  useEffect(() => {
    // Only call once when loading completes (whether data is empty or not)
    if (!isLoaded && !loading && serviceItems.length >= 0) {
      setIsLoaded(true);
      onLoad?.(serviceItems);
      onReady?.(serviceItems);
    }
  }, [isLoaded, loading, serviceItems, onLoad, onReady]);

  const triggerAutoSelect = useAutoSelectSingle({
    enabled: autoSelect,
    disabled,
    loading,
    value,
    items: serviceItems,
    onChange,
    autoSelectKey,
  });

  // Reset user cleared state and search when value prop changes — but only
  // reset isUserCleared when value becomes non-empty so a user-initiated
  // clear (value -> '') is preserved.
  useEffect(() => {
    if (value) {
      setIsUserCleared(false);
    } else {
      setSearchText('');
    }
    setSelectedValue(value || '');
  }, [value]);

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    if (filteredServiceItems.length === 0 && loading) {
      return [];
    }

    return filteredServiceItems.map((service) => {
      // Calculate indentation based on level (16px per level)
      const indentPixels = (service.level ?? 0) * 16;

      return {
        value: service.id,
        label: service.name,
        // Store level for custom rendering if needed
        level: service.level ?? 0,
        indentPixels,
      };
    });
  }, [filteredServiceItems, loading]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const selectedId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;

      if (onChange && selectedId) {
        const selectedService = serviceItems.find(
          (service) => service.id === selectedId,
        );

        if (selectedService) {
          setInputValue(selectedService.name);
          setSearchText(''); // Clear search so next open shows full list (same as team member dropdown)
          setIsUserCleared(false);

          onChange(selectedId, selectedService);
        }
      }
    },
    [onChange, serviceItems],
  );

  // Handle search: when onSearchService (SFO path), debounce and call API with searchText (null when no text)
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      setSearchText(searchValue);
      setSelectedValue('');

      if (debouncedOnSearchService) {
        debouncedOnSearchService(searchValue.trim() || null);
      }

      if (searchValue.trim() === '') {
        setIsUserCleared(true);
        if (value && onChange) {
          onChange('', undefined);
        }
      } else {
        setIsUserCleared(false);
      }
    },
    [value, onChange, debouncedOnSearchService],
  );

  // Handle blur - clear search so next open shows full list; validate typed text if no selection
  const handleBlur = useCallback(() => {
    // First, try auto-selecting if there's only one option and field is empty (only when autoSelect is enabled)
    if (autoSelect && !value && !inputValue) {
      triggerAutoSelect();
    }

    setSearchText('');

    // If user typed something but didn't select, validate it
    if (!value && inputValue && onChange) {
      const selectedService = serviceItems.find(
        (service) => service.name.toLowerCase() === inputValue.toLowerCase(),
      );
      if (!selectedService) {
        onChange('', undefined);
        setIsUserCleared(true);
      }
    }
    setInputValue('');
  }, [
    autoSelect,
    value,
    inputValue,
    onChange,
    serviceItems,
    triggerAutoSelect,
  ]);

  const defaultLabel =
    label ||
    intl.formatMessage({
      id: 'drawer.form.service.label',
      defaultMessage: 'Service',
    });
  const defaultPlaceholder =
    placeholder ||
    intl.formatMessage({
      id: 'drawer.form.service.placeholder',
      defaultMessage: 'Select service',
    });

  const loadingLabel = intl.formatMessage({
    id: 'quickfind.dropdown.loading',
    defaultMessage: 'Loading...',
  });

  // Get display value for selected service
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared, show empty
    if (isUserCleared) {
      return '';
    }

    // Show selected service's name when present in the loaded page
    if (value && serviceItems.length > 0) {
      const selectedService = serviceItems.find(
        (service) => service.id === value,
      );
      if (selectedService) {
        return selectedService.name;
      }
    }

    // Id not in current page (e.g. only first 100 fetched) or still loading
    // — fall back to DAS-provided name so the user sees something on load.
    // Gated on `value` so the stale DAS name does not reappear after a clear.
    if (value && displayName) return displayName;

    // Have a selected id but no name yet (slow SFO). Show "Loading…" rather
    // than a blank input so the user knows the field is still resolving.
    if (value && loading) return loadingLabel;

    return '';
  }, [
    value,
    serviceItems,
    displayName,
    inputValue,
    isUserCleared,
    loading,
    loadingLabel,
  ]);

  const addNewItemProps = {
    onClick: () => {
      setPreservedInputValue(inputValue);
      setShowAddServiceDrawer(true);
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
        isLoading={loading && serviceItems.length === 0}
        loadingAriaLabel={loadingLabel}
        aria-label={defaultLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfind.dropdown.service.add.new',
          defaultValue: 'Add new service item',
        })}
        renderItem={(item, index) => {
          const service = serviceItems.find((s) => s.id === item.value);
          if (!service) {
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
          // Calculate indentation: 16px per level
          const indentPixels = (service.level ?? 0) * 16;

          // Derive category from fullName (same logic as quickfills):
          // fullName uses ':' as separator, e.g. "Electronics:Phones:iPhone"
          // → category = "Electronics > Phones"
          let category: string | undefined;
          if (service.fullName && service.fullName.indexOf(':') !== -1) {
            const lastIndex = service.fullName.lastIndexOf(':');
            category = service.fullName
              .substring(0, lastIndex)
              .replace(':', ' > ');
          }

          const descriptionText = service.description?.trim();
          const hasRightContent = descriptionText || category;

          return (
            <FullWidthMenuItem
              key={`${index}`}
              value={item.value}
              className="quickfind-menu-item"
            >
              <MenuItemContent style={{ paddingLeft: `${indentPixels}px` }}>
                <MainLabel selected={isSelected}>
                  <RowTextLabel title={item.label}>
                    {highlightSearchText(item.label, searchText || '')}
                  </RowTextLabel>
                </MainLabel>
                {/* Right-side label - shows description and category if present */}
                {hasRightContent && (
                  <RightColumn>
                    {descriptionText && (
                      <SubLabel title={descriptionText}>
                        {descriptionText}
                      </SubLabel>
                    )}
                    {category && (
                      <CategoryLabel title={category}>{category}</CategoryLabel>
                    )}
                  </RightColumn>
                )}
              </MenuItemContent>
            </FullWidthMenuItem>
          );
        }}
      />
      {showAddServiceDrawer && (
        <Widget
          widgetId="qbo-ps-drawer-ui/product-service-drawer"
          type="productService"
          subTypes={['SERVICE', 'NONINVENTORY']}
          defaultName={preservedInputValue}
          defaultType="SERVICE"
          handleCancel={() => setShowAddServiceDrawer(false)}
          handleSaveSuccess={(newService: any) => {
            // Refetch data to show the newly added service
            refetch({
              timeForEntityId,
              customerId,
              projectId,
              assignmentFilters,
            });

            // Select the newly added service
            const actualId = newService.id.includes(':')
              ? newService.id.split(':')[1]
              : newService.id;

            onChange?.(actualId, {
              id: actualId,
              name: newService.displayName || newService.name,
            });

            // Update input value
            setInputValue(newService.displayName || newService.name);

            // Reset state and close drawer
            setIsUserCleared(false);
            setShowAddServiceDrawer(false);
          }}
        />
      )}
    </div>
  );
};

export default ServiceDropdown;
