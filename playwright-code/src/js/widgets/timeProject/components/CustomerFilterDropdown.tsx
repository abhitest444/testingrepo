import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { useIntl, useTracking } from '@payroll/quicksand';
import { debounce } from 'src/js/service/utils/debounce';
import { useCustomerFilter } from '../hooks/useCustomerFilter';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';
import { FilterItem } from './TimeProjectFilters.styled';

interface CustomerFilterDropdownProps {
  value: string;
  onChange: (customerId: string) => void;
}

const CustomerFilterDropdown: React.FC<CustomerFilterDropdownProps> = ({
  value,
  onChange,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const [inputValue, setInputValue] = useState('');
  const [searchText, setSearchText] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const allCustomersLabel = text('timeProject.filter.allCustomers');
  const trackingPoints = useLandingPageTrackingPoints();

  const { customers, loading, hasMore, loadCustomers, loadMore } =
    useCustomerFilter();

  useEffect(() => {
    loadCustomers(searchText.trim() || undefined);
  }, [searchText, loadCustomers]);

  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearchText(val), 300),
    [],
  );

  const dataSource = useMemo(() => {
    const options = customers.map((c) => ({
      value: c.customerId,
      label: c.displayName,
    }));
    if (
      !inputValue ||
      allCustomersLabel.toLowerCase().includes(inputValue.toLowerCase())
    ) {
      return [{ value: '', label: allCustomersLabel }, ...options];
    }
    return options;
  }, [customers, inputValue, allCustomersLabel]);

  // Resolve the chosen customer's display name once so we can mirror it
  // into both `inputValue` (so it renders as filled / primary text)
  // when nothing else is being typed AND in the dropdown's selection
  // state. When no customer is selected we fall back to the literal
  // "All customers" label — same dark color, not the placeholder grey.
  const selectedLabel = useMemo(() => {
    if (!value) return allCustomersLabel;
    const customer = customers.find((c) => c.customerId === value);
    return customer?.displayName || allCustomersLabel;
  }, [value, customers, allCustomersLabel]);

  const displayValue = useMemo(() => {
    if (inputValue) return inputValue;
    return selectedLabel;
  }, [inputValue, selectedLabel]);

  const handleChange = useCallback(
    (event: any) => {
      const selected = event?.target?.value;
      if (selected !== undefined) {
        track(trackingPoints.SELECT_CUSTOMER_SEARCH);
        onChange(selected);
        setInputValue('');
        if (searchText) {
          setSearchText('');
        }
      }
    },
    [onChange, track, searchText, trackingPoints],
  );

  const handleSearch = useCallback(
    (event: any) => {
      const val = event?.target?.value || '';
      if (val) {
        track(trackingPoints.TYPE_CUSTOMER_SEARCH_FORM_FIELD);
      }
      setInputValue(val);
      debouncedSearch(val);
    },
    [track, debouncedSearch, trackingPoints],
  );

  const handleBlur = useCallback(() => {
    setSearchText('');
    setInputValue('');
  }, []);

  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage > 0.8 && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore],
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const menuElement = document.querySelector(
        '[data-testid="time-project-customer-filter"] [role="listbox"]',
      );
      if (menuElement && !menuRef.current) {
        menuRef.current = menuElement as HTMLDivElement;
        menuElement.addEventListener('scroll', handleScroll);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (menuRef.current) {
        menuRef.current.removeEventListener('scroll', handleScroll);
        menuRef.current = null;
      }
    };
  }, [handleScroll]);

  const renderItem = useCallback(
    (item: Record<string, any>, index?: number) => (
      <MenuItem key={`customer-${index}`} value={item.value}>
        {item.label}
      </MenuItem>
    ),
    [],
  );

  return (
    <FilterItem data-testid="time-project-customer-filter">
      <DropdownTypeahead
        label={text('timeProject.filter.customerLabel')}
        value={value || ''}
        inputValue={displayValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onBlur={handleBlur}
        onFocus={() => {
          track(trackingPoints.CLICK_CUSTOMER_SEARCH_DROPDOWN);
          track(trackingPoints.CLICK_CUSTOMER_SEARCH_FORM_FIELD);
        }}
        dataSource={dataSource}
        placeholder={allCustomersLabel}
        width="100%"
        renderItem={renderItem}
      />
    </FilterItem>
  );
};

export default CustomerFilterDropdown;
