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
import { useClassItems } from '../hooks/useClassItems';
import { useAutoSelectSingle } from '../hooks/useAutoSelectSingle';
import { useDropdownInfiniteScroll } from '../hooks/useDropdownInfiniteScroll';
import { ClassDropdownProps, ClassItem } from '../types';
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

const ClassDropdown: React.FC<ClassDropdownProps> = ({
  timeForEntityId,
  customerId,
  projectId,
  assignmentFilters,
  preloadedOptions,
  onSearchClass,
  hasMoreClass,
  loadMoreClass,
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
  autoSelect = false,
  autoSelectKey,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  const intl = useIntl();
  const sandbox = useSandbox();
  const [inputValue, setInputValue] = useState<string>('');
  const [showAddClassDrawer, setShowAddClassDrawer] = useState(false);
  const [preservedInputValue, setPreservedInputValue] = useState('');
  const [isUserCleared, setIsUserCleared] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const dropdownRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    classItems,
    loading,
    error,
    loadClassItems,
    refetch,
    refetchWithSearch,
    loadMore,
    hasMore,
  } = useClassItems({
    pageSize: 100,
    enableLoadMore: true,
    preloadedOptions,
    hasMoreFromParent: hasMoreClass,
    loadMoreFromParent: loadMoreClass,
    timeForEntityId,
    customerId,
    projectId,
    assignmentFilters,
  });

  const debouncedOnSearchClass = useMemo(() => {
    if (onSearchClass)
      return debounce((text: string | null) => onSearchClass(text), 300);
    if (refetchWithSearch)
      return debounce((text: string | null) => refetchWithSearch(text), 300);
    return undefined;
  }, [onSearchClass, refetchWithSearch]);

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
      sandbox.logger.error('ClassDropdown: Error loading class items', {
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

  // When using API search (parent onSearchClass or hook's refetchWithSearch), list is already filtered; else filter client-side.
  const useApiSearch = Boolean(onSearchClass) || !preloadedOptions;
  const filteredClassItems = useMemo(() => {
    if (useApiSearch) return classItems;
    if (!inputValue.trim()) return classItems;
    const searchLower = inputValue.toLowerCase();
    return classItems.filter((item) =>
      item.name.toLowerCase().includes(searchLower),
    );
  }, [classItems, inputValue, useApiSearch]);

  // Call onLoad and onReady when data is available (even if empty)
  useEffect(() => {
    // Only call once when loading completes (whether data is empty or not)
    if (!isLoaded && !loading && classItems.length >= 0) {
      setIsLoaded(true);
      onLoad?.(classItems);
      onReady?.(classItems);
    }
  }, [isLoaded, loading, classItems, onLoad, onReady]);

  const triggerAutoSelect = useAutoSelectSingle({
    enabled: autoSelect,
    disabled,
    loading,
    value,
    items: classItems,
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
    if (filteredClassItems.length === 0 && loading) {
      return [];
    }

    return filteredClassItems.map((classItem) => {
      // Calculate indentation based on level (16px per level)
      const indentPixels = (classItem.level ?? 0) * 16;

      return {
        value: classItem.id,
        label: classItem.name,
        // Store level for custom rendering if needed
        level: classItem.level ?? 0,
        indentPixels,
      };
    });
  }, [filteredClassItems, loading]);

  // Handle dropdown change
  const handleChange = useCallback(
    (event: ReactEvent, infoObject?: OnChangeInfoType) => {
      const selectedId =
        infoObject?.selectedItem?.value ??
        (event.target as HTMLInputElement).value;

      if (onChange && selectedId) {
        const selectedClass = classItems.find(
          (classItem) => classItem.id === selectedId,
        );

        if (selectedClass) {
          setInputValue(selectedClass.name);

          // Reset user cleared state
          setIsUserCleared(false);

          // Call onChange with full class details
          onChange(selectedId, selectedClass);
        }
      }
    },
    [onChange, classItems],
  );

  // Handle search: when onSearchClass (SFO path), debounce and call API with searchText (null when no text)
  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = event.target.value;
      setInputValue(searchValue);
      setSelectedValue('');

      if (debouncedOnSearchClass) {
        debouncedOnSearchClass(searchValue.trim() || null);
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
    [value, onChange, debouncedOnSearchClass],
  );

  // Handle blur - only clear when user was typing and did not select; never clear when we already have a value
  const handleBlur = useCallback(() => {
    // First, try auto-selecting if there's only one option and field is empty (only when autoSelect is enabled)
    if (autoSelect && !value && !inputValue) {
      triggerAutoSelect();
    }

    // If user typed something but didn't select, validate it
    if (!value && inputValue && onChange) {
      const selectedClass = classItems.find(
        (classItem) =>
          classItem.name.toLowerCase() === inputValue.toLowerCase(),
      );
      if (!selectedClass) {
        onChange('', undefined);
        setIsUserCleared(true);
      }
    }
    setInputValue('');
  }, [autoSelect, value, inputValue, onChange, classItems, triggerAutoSelect]);

  const defaultLabel =
    label ||
    intl.formatMessage({
      id: 'drawer.form.class.label',
      defaultMessage: 'Class',
    });
  const defaultPlaceholder =
    placeholder ||
    intl.formatMessage({
      id: 'drawer.form.class.placeholder',
      defaultMessage: 'Select class',
    });

  const loadingLabel = intl.formatMessage({
    id: 'quickfind.dropdown.loading',
    defaultMessage: 'Loading...',
  });

  // Get display value for selected class
  const displayValue = useMemo(() => {
    // If user is typing, show what they're typing
    if (inputValue) {
      return inputValue;
    }

    // If user has explicitly cleared, show empty
    if (isUserCleared) {
      return '';
    }

    // Show selected class's name when present in the loaded page
    if (value && classItems.length > 0) {
      const selectedClass = classItems.find(
        (classItem) => classItem.id === value,
      );
      if (selectedClass) {
        return selectedClass.name;
      }
    }

    // Id not in current page (e.g. only first 100 fetched) or still loading
    // — fall back to DAS-provided name so the user sees something on load.
    // Gated on `value` so the stale DAS name does not reappear after a clear.
    if (value && displayName) return displayName;

    // Have a selected id but no name yet (slow SFO, fast DAS not yet arrived,
    // or both still pending). Show "Loading…" rather than a blank input so
    // the user knows the field is still resolving.
    if (value && loading) return loadingLabel;

    return '';
  }, [
    value,
    classItems,
    inputValue,
    isUserCleared,
    displayName,
    loading,
    loadingLabel,
  ]);

  const addNewItemProps = {
    onClick: () => {
      setPreservedInputValue(inputValue);
      setShowAddClassDrawer(true);
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
        isLoading={loading && classItems.length === 0}
        loadingAriaLabel={loadingLabel}
        aria-label={defaultLabel}
        width={(width as string) ?? 'auto'}
        addNew={addNew}
        addNewIndex={0}
        addNewItemProps={addNewItemProps}
        addNewText={intl.formatMessage({
          id: 'quickfind.dropdown.class.add.new',
          defaultValue: 'Add new class',
        })}
        renderItem={(item, index) => {
          const classItem = classItems.find((c) => c.id === item.value);
          if (!classItem) {
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
          const indentPixels = (classItem.level ?? 0) * 16;

          // Get parent name for sub-label
          let parentName = '';
          if (classItem.parentId && classItem.fullName) {
            // Extract parent name from fullName (e.g., "Class1:SubClass1" -> "Class1")
            const parts = classItem.fullName.split(':');
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
                        id: 'quickfind.dropdown.class.subclass.label',
                        defaultMessage: 'Subclass of {parentName}',
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
      {showAddClassDrawer && (
        <Widget
          widgetId="qbo-entity-drawer/classdrawer"
          type="klass"
          handleCancel={() => setShowAddClassDrawer(false)}
          handleSaveSuccess={(newClass: any) => {
            // Refetch data to show the newly added class
            refetch({
              timeForEntityId,
              customerId,
              projectId,
              assignmentFilters,
            });

            // Select the newly added class
            const actualId = newClass.id.includes(':')
              ? newClass.id.split(':')[1]
              : newClass.id;

            onChange?.(actualId, {
              id: actualId,
              name: newClass.displayName || newClass.name,
            });

            // Update input value
            setInputValue(newClass.displayName || newClass.name);

            // Reset state and close drawer
            setIsUserCleared(false);
            setShowAddClassDrawer(false);
          }}
        />
      )}
    </div>
  );
};

export default ClassDropdown;
