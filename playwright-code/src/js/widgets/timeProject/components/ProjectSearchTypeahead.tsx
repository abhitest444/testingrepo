import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { useIntl, useTracking } from '@payroll/quicksand';
import {
  useProjectNameSearch,
  ProjectNameSearchResult,
} from '../hooks/useProjectNameSearch';
import { useLandingPageTrackingPoints } from '../hooks/useLandingPageTrackingPoints';
import { FilterItem } from './TimeProjectFilters.styled';

interface ProjectSearchTypeaheadProps {
  value: string;
  onProjectSelect: (projectId: string) => void;
  onSearchSubmit: (text: string, results: ProjectNameSearchResult[]) => void;
  onSearchClear: () => void;
}

const ProjectSearchTypeahead: React.FC<ProjectSearchTypeaheadProps> = ({
  value,
  onProjectSelect,
  onSearchSubmit,
  onSearchClear,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string) => intl.formatMessage({ id });
  const trackingPoints = useLandingPageTrackingPoints();
  // Initialise from Redux searchText so the input is restored when the
  // component remounts after navigating to a project summary and back.
  const [inputValue, setInputValue] = useState(value);
  const { results, isLoading, debouncedSearch, clearResults } =
    useProjectNameSearch();

  const dataSource = useMemo(
    () => results.map((r) => ({ value: r.projectId, label: r.displayName })),
    [results],
  );

  // When filters are cleared externally (e.g. "Clear filters" button),
  // searchText resets to '' — mirror that into the local input and
  // drop the active-filter guard so blur can clear as normal.
  useEffect(() => {
    if (!value) {
      setInputValue('');
      filterActiveRef.current = false;
    }
  }, [value]);

  // Set to true immediately when a dropdown suggestion is selected so the
  // onKeyDown Enter handler can skip list-filter logic (the item click already
  // handled the action).
  const justSelectedRef = useRef(false);

  // Set to true when the user presses Enter to filter the list. Prevents
  // handleBlur from clearing the displayed search text while a filter is active.
  const filterActiveRef = useRef(false);

  const handleChange = useCallback(
    (event: any) => {
      const selected = event?.target?.value;
      if (selected) {
        justSelectedRef.current = true;
        track(trackingPoints.CLICK_SEARCH_ICON);
        onProjectSelect(selected);
        setInputValue('');
        filterActiveRef.current = false;
        clearResults();
      }
    },
    [onProjectSelect, track, clearResults, trackingPoints],
  );

  const handleSearch = useCallback(
    (event: any) => {
      const val = event?.target?.value || '';
      setInputValue(val);
      // Any new keystroke invalidates a previously active filter.
      filterActiveRef.current = false;
      if (val.trim()) {
        debouncedSearch(val);
      } else {
        clearResults();
        // Input was cleared (backspace to empty or × button) — reset the
        // Redux searchProjectIds and re-fetch the full list so projects
        // are visible again without requiring an explicit Enter press.
        onSearchClear();
      }
    },
    [debouncedSearch, clearResults, onSearchClear],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<Element>) => {
      if (e.key !== 'Enter') return;

      // A suggestion was just selected via the dropdown Enter — let the
      // `handleChange` path handle it; skip list-filter logic entirely.
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }

      const trimmed = inputValue.trim();

      if (!trimmed) {
        filterActiveRef.current = false;
        onSearchClear();
        return;
      }

      // Still waiting for the debounced contacts search to complete.
      // Do nothing — user can press Enter again once suggestions appear.
      if (isLoading) return;

      filterActiveRef.current = true;
      onSearchSubmit(trimmed, results);
    },
    [inputValue, isLoading, results, onSearchSubmit, onSearchClear],
  );

  const handleBlur = useCallback(() => {
    // Keep the input text when a filter is active so users can see what
    // they searched for while browsing the filtered project list.
    if (filterActiveRef.current) return;
    setInputValue('');
    clearResults();
  }, [clearResults]);

  const renderItem = useCallback(
    (item: Record<string, any>, index?: number) => (
      <MenuItem key={`project-search-${index}`} value={item.value}>
        {item.label}
      </MenuItem>
    ),
    [],
  );

  return (
    <FilterItem data-testid="time-project-search-typeahead">
      <DropdownTypeahead
        value={inputValue}
        label={text('timeProject.filter.searchLabel')}
        inputValue={inputValue}
        onChange={handleChange}
        onSearch={handleSearch}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        dataSource={dataSource}
        placeholder={text('timeProject.filter.searchPlaceholder')}
        width="100%"
        renderItem={renderItem}
      />
    </FilterItem>
  );
};

export default ProjectSearchTypeahead;
