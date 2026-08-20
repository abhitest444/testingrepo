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
import { useLocationItems } from '../hooks/useLocationItems';
import { useAutoSelectSingle } from '../hooks/useAutoSelectSingle';
import { useDropdownInfiniteScroll } from '../hooks/useDropdownInfiniteScroll';
import { LocationDropdownProps, LocationItem } from '../types';
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

const SubLabel = styled.span`
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 0.9em;
  text-transform: capitalize;
`;

const LocationDropdown: React.FC<LocationDropdownProps> = ({
  timeForEntityId,
  customerId,
  projectId,
  assignmentFilters,
  preloadedOptions,
  onSearchLocation,
  hasMoreLocation,
  loadMoreLocation,
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
  labelPreference,
  displayName,
  autoSelect = false,
  autoSelectKey,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const intl = useIntl();
  const sandbox = useSandbox();
  const [inputValue, setInputValue] = useState<string>('');
  const [showAddLocationDrawer, setShowAddLocationDrawer] = useState(false);
  const [preservedInputValue, setPreservedInputValue] = useState('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const dropdownRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    locationItems,
    loading,
    error,
    loadLocationItems,
    refetch,
    refetchWithSearch,
    loadMore,
    hasMore,
  } = useLocationItems({
    pageSize: 100,
    enableLoadMore: true,
    preloadedOptions,
    hasMoreFromParent: hasMoreLocation,
    loadMoreFromParent: loadMoreLocation,
    timeForEntityId,
    customerId,
    projectId,
    assignmentFilters,
  });

  const debouncedOnSearchLocation = useMemo(() => {
    if (onSearchLocation)
      return debounce((text: string | null) => onSearchLocation(text), 300);
    if (refetchWithSearch)
      return debounce((text: string | null) => refetchWithSearch(text), 300);
    return undefined;
  }, [onSearchLocation, refetchWithSearch]);

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
      sandbox.logger.error('LocationDropdown: Error loading location items', {
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

  // When using API search (parent onSearchLocation or hook's refetchWithSearch), list is already filtered; else filter client-side.
  const useApiSearch = Boolean(onSearchLocation) || !preloadedOptions;
  const filteredLocationItems = useMemo(() => {
    if (useApiSearch) return locationItems;
    if (!inputValue.trim()) return locationItems;
    const searchLower = inputValue.toLowerCase();
    return locationItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower),
    );
  }, [locationItems, inputValue, useApiSearch]);

  // Call onLoad and onReady when data is available (even if empty)
  useEffect(() => {
    // Only call once when loading completes (whether data is empty or not)
    if (!isLoaded && !loading && locationItems.length >= 0) {
      setIsLoaded(true);
      onLoad?.(locationItems);
      onReady?.(locationItems);
    }
  }, [isLoaded, loading, locationItems, onLoad, onReady]);

  const triggerAutoSelect = useAutoSelectSingle({
    enabled: autoSelect,
    disabled,
    loading,
    value,
    items: locationItems,
    onChange,
    autoSelectKey,
  });

  // Reset user cleared state when value prop changes — but only when value
  // becomes non-empty, so a user-initiated clear (value -> '') is preserved.
  useEffect(() => {
    if (value) {
      setIsUserCleared(false);
    }
    setSelectedValue(value || '');
  }, [value]);

  // Generate data source for DropdownTypeahead
  const dataSource = useMemo(() => {
    if (filteredLocationItems.length === 0 && loading) {
      return [];
    }

    return filteredLocationItems.map((locationItem) => {
      // Calculate indentation based on level (16px per level)
      const indentPixels = (locationItem.level ?? 0) * 16;

      return {
        value: locationItem.id,
        label: locationItem.name,
        // Store level for custom rendering if needed
        level: locationItem.level ?? 0,
        indentPixels,
      };
    });
  }, [filteredLocationItems, loading]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const selectedId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;

      if (onChange && selectedId) {
        const selectedLocation = locationItems.find(
          (locationItem) => locationItem.id === selectedId,
        );

        if (selectedLocation) {
          setInputValue(selectedLocation.name);

          // Reset user cleared state
          setIsUserCleared(false);

          // Call onChange with location details
          onChange(selectedId, selectedLocation);
        }
      }
    },
    [onChange, locationItems],
  );

  // Handle search: when onSearchLocation (SFO path), debounce and call API with searchText (null when no text)
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      setSelectedValue('');

      if (debouncedOnSearchLocation) {
        debouncedOnSearchLocation(searchValue.trim() || null);
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
    [value, onChange, debouncedOnSearchLocation],
  );

  // Handle blur - only clear when user was typing and did not select; never clear when we already have a value
  const handleBlur = useCallback(() => {
    // First, try auto-selecting if there's only one option and field is empty (only when autoSelect is enabled)
    if (autoSelect && !value && !inputValue) {
      triggerAutoSelect();
    }

    // If user typed something but didn't select, validate it
    if (!value && inputValue && onChange) {
      const selectedLocation = locationItems.find(
        (locationItem) =>
          locationItem.name.toLowerCase() === inputValue.toLowerCase(),
      );
      if (!selectedLocation) {
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
    locationItems,
    triggerAutoSelect,
  ]);

  const defaultLabel =
    label ||
    labelPreference?.DepartmentTerminology ||
    intl.formatMessage({
      id: 'drawer.form.location.label',
      defaultMessage: 'Department',
    });
  const defaultPlaceholder =
    placeholder ||
    (labelPreference?.DepartmentTerminology
      ? intl.formatMessage(
          {
            id: 'drawer.form.location.placeholder.with.terminology',
            defaultMessage: 'Select {terminology}',
          },
          { terminology: labelPreference.DepartmentTerminology },
        )
      : intl.formatMessage({
          id: 'drawer.form.location.placeholder',
          defaultMessage: 'Select department',
        }));

  const loadingLabel = intl.formatMessage({
    id: 'quickfind.dropdown.loading',
    defaultMessage: 'Loading...',
  });

  // Get display value for selected location
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared, show empty
    if (isUserCleared) {
      return '';
    }

    // Show selected location's name when present in the loaded page
    if (value && locationItems.length > 0) {
      const selectedLocation = locationItems.find(
        (locationItem) => locationItem.id === value,
      );
      if (selectedLocation) {
        return selectedLocation.name;
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
    locationItems,
    inputValue,
    isUserCleared,
    displayName,
    loading,
    loadingLabel,
  ]);

  const addNewItemProps = {
    onClick: () => {
      setPreservedInputValue(inputValue);
      setShowAddLocationDrawer(true);
    },
  };

  return (
    <div ref={containerRef}>
      <DropdownTypeahead
        ref={dropdownRef}
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
        isLoading={loading && locationItems.length === 0}
        loadingAriaLabel={loadingLabel}
        aria-label={defaultLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfind.dropdown.location.add.new',
          defaultValue: 'Add new location',
        })}
        renderItem={(item, index) => {
          const locationItem = locationItems.find((l) => l.id === item.value);
          if (!locationItem) {
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
          const indentPixels = (locationItem.level ?? 0) * 16;

          // Get parent name for sub-label
          let parentName = '';
          if (locationItem.parentId && locationItem.fullName) {
            // Extract parent name from fullName (e.g., "Location1:SubLocation1" -> "Location1")
            const parts = locationItem.fullName.split(':');
            if (parts.length > 1) {
              parentName = parts[parts.length - 2]; // Get immediate parent
            }
          }

          return (
            <FullWidthMenuItem
              key={`${index}`}
              value={item.value}
              className="quickfind-menu-item"
            >
              <MenuItemContent style={{ paddingLeft: `${indentPixels}px` }}>
                <MainLabel selected={isSelected}>
                  <RowTextLabel title={item.label}>
                    {highlightSearchText(item.label, inputValue || '')}
                  </RowTextLabel>
                </MainLabel>
                {parentName && (
                  <SubLabel>
                    {intl.formatMessage(
                      {
                        id: 'quickfind.dropdown.location.sublocation.label',
                        defaultMessage: 'Sublocation of {parentName}',
                      },
                      { parentName },
                    )}
                  </SubLabel>
                )}
              </MenuItemContent>
            </FullWidthMenuItem>
          );
        }}
      />
      {showAddLocationDrawer && (
        <Widget
          widgetId="qbo-location-drawer/locationdrawer"
          type="locationV2"
          open
          handleCancel={() => setShowAddLocationDrawer(false)}
          handleSaveSuccess={(newLocation: any) => {
            // Refetch data to show the newly added location
            refetch({
              timeForEntityId,
              customerId,
              projectId,
              assignmentFilters,
            });

            // Select the newly added location
            const actualId = newLocation.id.includes(':')
              ? newLocation.id.split(':')[1]
              : newLocation.id;

            onChange?.(actualId, {
              id: actualId,
              name: newLocation.displayName || newLocation.name,
            });

            // Update input value
            setInputValue(newLocation.displayName || newLocation.name);

            // Reset state and close drawer
            setIsUserCleared(false);
            setShowAddLocationDrawer(false);
          }}
        />
      )}
    </div>
  );
};

export default LocationDropdown;
