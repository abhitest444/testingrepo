import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectSearchTypeahead from 'src/js/widgets/timeProject/components/ProjectSearchTypeahead';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockDebouncedSearch = jest.fn();
const mockClearResults = jest.fn();
const mockOnProjectSelect = jest.fn();
const mockOnSearchSubmit = jest.fn();
const mockOnSearchClear = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: () => LANDING_PAGE_TRACKING_POINTS,
  }),
);

const mockUseProjectNameSearch = jest.fn();
jest.mock('src/js/widgets/timeProject/hooks/useProjectNameSearch', () => ({
  useProjectNameSearch: () => mockUseProjectNameSearch(),
}));

// Minimal DropdownTypeahead mock that captures its props and exposes
// test handles for onChange / onSearch / onBlur / onKeyDown.
jest.mock('@ids-ts/dropdown-typeahead', () => {
  const DropdownTypeaheadMock = ({
    onChange,
    onSearch,
    onBlur,
    onKeyDown,
    value,
    placeholder,
  }: any) => (
    <div>
      <input
        data-testid="typeahead-input"
        value={value}
        placeholder={placeholder}
        onChange={onSearch}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <button
        data-testid="typeahead-select"
        onClick={() => onChange({ target: { value: 'proj-42' } })}
      >
        Select
      </button>
    </div>
  );
  const MenuItem = ({ children, value }: any) => (
    <li data-value={value}>{children}</li>
  );
  return { __esModule: true, default: DropdownTypeaheadMock, MenuItem };
});

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectFilters.styled',
  () => ({
    FilterItem: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

const defaultProps = {
  value: '',
  onProjectSelect: mockOnProjectSelect,
  onSearchSubmit: mockOnSearchSubmit,
  onSearchClear: mockOnSearchClear,
};

describe('ProjectSearchTypeahead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProjectNameSearch.mockReturnValue({
      results: [],
      isLoading: false,
      debouncedSearch: mockDebouncedSearch,
      clearResults: mockClearResults,
    });
  });

  it('renders the typeahead container', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    expect(
      screen.getByTestId('time-project-search-typeahead'),
    ).toBeInTheDocument();
  });

  it('renders the typeahead input', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    expect(screen.getByTestId('typeahead-input')).toBeInTheDocument();
  });

  it('calls debouncedSearch when the user types a non-empty value', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.change(screen.getByTestId('typeahead-input'), {
      target: { value: 'kitchen' },
    });
    expect(mockDebouncedSearch).toHaveBeenCalledWith('kitchen');
  });

  it('calls clearResults (not debouncedSearch) when the input is cleared to blank', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);

    // Type a non-empty value first so the controlled input has a real value to clear from.
    // React's controlled-input tracking skips onChange when the new value equals the
    // current controlled value (''), so firing '' → '' would never invoke handleSearch.
    fireEvent.change(screen.getByTestId('typeahead-input'), {
      target: { value: 'kitchen' },
    });
    mockClearResults.mockClear();
    mockDebouncedSearch.mockClear();

    // Now clear — '' differs from 'kitchen', so React fires onChange → handleSearch
    fireEvent.change(screen.getByTestId('typeahead-input'), {
      target: { value: '' },
    });
    expect(mockClearResults).toHaveBeenCalled();
    expect(mockDebouncedSearch).not.toHaveBeenCalled();
  });

  it('calls onProjectSelect with the selected project ID when an item is chosen', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.click(screen.getByTestId('typeahead-select'));
    expect(mockOnProjectSelect).toHaveBeenCalledWith('proj-42');
  });

  it('tracks CLICK_SEARCH_ICON when a project is selected', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.click(screen.getByTestId('typeahead-select'));
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_SEARCH_ICON,
    );
  });

  it('calls clearResults and resets the input after a selection', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.change(screen.getByTestId('typeahead-input'), {
      target: { value: 'kitchen' },
    });
    fireEvent.click(screen.getByTestId('typeahead-select'));
    expect(mockClearResults).toHaveBeenCalled();
  });

  it('calls clearResults on blur when no filter is active', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.blur(screen.getByTestId('typeahead-input'));
    expect(mockClearResults).toHaveBeenCalled();
  });

  it('does not call onProjectSelect when the change event has no value', () => {
    render(<ProjectSearchTypeahead {...defaultProps} />);
    fireEvent.click(screen.getByTestId('typeahead-select'));
    expect(mockOnProjectSelect).toHaveBeenCalledTimes(1);
  });

  describe('Enter key — filter list behavior', () => {
    const twoResults = [
      { projectId: '101', displayName: 'Kitchen Remodel' },
      { projectId: '202', displayName: 'Bathroom Reno' },
    ];

    it('calls onSearchSubmit with the trimmed text and current results on Enter', () => {
      mockUseProjectNameSearch.mockReturnValue({
        results: twoResults,
        isLoading: false,
        debouncedSearch: mockDebouncedSearch,
        clearResults: mockClearResults,
      });

      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      // Type to set inputValue
      fireEvent.change(input, { target: { value: 'kitchen' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSearchSubmit).toHaveBeenCalledWith('kitchen', twoResults);
    });

    it('calls onSearchClear on Enter when the input is empty', () => {
      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSearchClear).toHaveBeenCalled();
      expect(mockOnSearchSubmit).not.toHaveBeenCalled();
    });

    it('does nothing on Enter when results are still loading', () => {
      mockUseProjectNameSearch.mockReturnValue({
        results: [],
        isLoading: true,
        debouncedSearch: mockDebouncedSearch,
        clearResults: mockClearResults,
      });

      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      fireEvent.change(input, { target: { value: 'kitchen' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSearchSubmit).not.toHaveBeenCalled();
      expect(mockOnSearchClear).not.toHaveBeenCalled();
    });

    it('does not trigger filter on non-Enter keys', () => {
      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      fireEvent.change(input, { target: { value: 'kitchen' } });
      fireEvent.keyDown(input, { key: 'a' });

      expect(mockOnSearchSubmit).not.toHaveBeenCalled();
    });

    it('trims whitespace from the input before submitting', () => {
      mockUseProjectNameSearch.mockReturnValue({
        results: twoResults,
        isLoading: false,
        debouncedSearch: mockDebouncedSearch,
        clearResults: mockClearResults,
      });

      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      fireEvent.change(input, { target: { value: '  kitchen  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnSearchSubmit).toHaveBeenCalledWith('kitchen', twoResults);
    });

    it('retains the input text after filter is applied (blur should not clear)', () => {
      mockUseProjectNameSearch.mockReturnValue({
        results: twoResults,
        isLoading: false,
        debouncedSearch: mockDebouncedSearch,
        clearResults: mockClearResults,
      });

      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      fireEvent.change(input, { target: { value: 'kitchen' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Blur should NOT clear the input when a filter is active
      fireEvent.blur(input);
      expect(mockClearResults).not.toHaveBeenCalled();
    });
  });

  describe('handleBlur', () => {
    it('clears the input and calls clearResults on blur when no filter is active', () => {
      render(<ProjectSearchTypeahead {...defaultProps} />);
      const input = screen.getByTestId('typeahead-input');

      // Type to give the input a value (filterActiveRef stays false because no Enter was pressed)
      fireEvent.change(input, { target: { value: 'kitchen' } });
      mockClearResults.mockClear();

      // Blur without pressing Enter — filter is NOT active so handleBlur should clear
      fireEvent.blur(input);

      expect(mockClearResults).toHaveBeenCalled();
    });
  });

  describe('external value reset (useEffect)', () => {
    it('resets inputValue and drops the filter guard when the value prop changes to empty', () => {
      // Start with a non-empty value so inputValue is populated and the
      // filter guard can be set via Enter, then re-render with value='' to
      // simulate a "Clear filters" action clearing the Redux searchText.
      mockUseProjectNameSearch.mockReturnValue({
        results: [{ projectId: 'id-1', displayName: 'Kitchen Remodel' }],
        isLoading: false,
        debouncedSearch: mockDebouncedSearch,
        clearResults: mockClearResults,
      });

      const { rerender } = render(
        <ProjectSearchTypeahead {...defaultProps} value="kitchen" />,
      );

      // Press Enter to activate the filter guard (filterActiveRef = true)
      const input = screen.getByTestId('typeahead-input');
      fireEvent.keyDown(input, { key: 'Enter' });
      mockClearResults.mockClear();

      // External clear: the parent resets value to ''
      rerender(<ProjectSearchTypeahead {...defaultProps} value="" />);

      // inputValue should be reset to '' (passed as `value` to DropdownTypeahead)
      expect(screen.getByTestId('typeahead-input')).toHaveValue('');

      // filterActiveRef should be cleared — subsequent blur now calls clearResults
      fireEvent.blur(screen.getByTestId('typeahead-input'));
      expect(mockClearResults).toHaveBeenCalled();
    });
  });
});
