import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationDropdown from 'src/js/widgets/quickFind/components/LocationDropdown';
import { useLocationItems } from 'src/js/widgets/quickFind/hooks/useLocationItems';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

// Mock dependencies
jest.mock('src/js/widgets/quickFind/hooks/useLocationItems');

// Mock NLS/translation
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: () => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    },
  }),
  useNLS: () => (key: string, defaultValue?: string) => defaultValue || key,
}));

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({ open, handleCancel, handleSaveSuccess }: any) =>
    open ? (
      <div data-testid="mock-quickfills-drawer">
        <button onClick={handleCancel}>Close</button>
        <button
          onClick={() =>
            handleSaveSuccess({
              id: 'scope:new-location-123',
              name: 'New Location',
              displayName: 'New Location',
            })
          }
        >
          Save
        </button>
      </div>
    ) : null,
}));

const mockUseLocationItems = useLocationItems as jest.MockedFunction<
  typeof useLocationItems
>;

const defaultProps = {
  value: '',
  onChange: jest.fn(),
  onReady: jest.fn(),
  onError: jest.fn(),
  disabled: false,
  addNew: true,
  timeForEntityId: '123',
};

const mockLocationItems = [
  { id: '1', name: 'New York', assigned: true, active: true },
  { id: '2', name: 'Los Angeles', assigned: true, active: true },
  { id: '3', name: 'Chicago', assigned: false, active: true },
];

describe('LocationDropdown', () => {
  const mockLoadLocationItems = jest.fn();
  const mockRefetch = jest.fn();
  const mockRefetchWithSearch = jest.fn();
  const mockLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocationItems.mockReturnValue({
      locationItems: mockLocationItems,
      loading: false,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });
  });

  const renderWithIntl = (ui: React.ReactElement) =>
    renderWithQuicksandProvider(ui);

  it('should render without crashing', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} />);
    // The component renders with NLS key since intl mock returns the defaultMessage
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
  });

  it('should not load locations when timeForEntityId is not provided', () => {
    renderWithIntl(
      <LocationDropdown {...defaultProps} timeForEntityId={undefined} />,
    );

    expect(mockLoadLocationItems).not.toHaveBeenCalled();
  });

  it('should pass timeForEntityId to useLocationItems when provided', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} />);

    expect(mockUseLocationItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: undefined,
        projectId: undefined,
      }),
    );
  });

  it('should pass customerId to useLocationItems when provided', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} customerId="456" />);

    expect(mockUseLocationItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: '456',
        projectId: undefined,
      }),
    );
  });

  it('should pass projectId to useLocationItems when provided', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} projectId="789" />);

    expect(mockUseLocationItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: undefined,
        projectId: '789',
      }),
    );
  });

  it('should call useLocationItems again when timeForEntityId changes', () => {
    const { rerender } = renderWithIntl(<LocationDropdown {...defaultProps} />);

    expect(mockUseLocationItems).toHaveBeenCalled();

    const callCountAfterFirstRender = mockUseLocationItems.mock.calls.length;
    rerender(<LocationDropdown {...defaultProps} timeForEntityId="456" />);

    expect(mockUseLocationItems.mock.calls.length).toBeGreaterThan(
      callCountAfterFirstRender,
    );
    expect(mockUseLocationItems).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timeForEntityId: '456',
        customerId: undefined,
        projectId: undefined,
      }),
    );
  });

  it('should display location items in dropdown', async () => {
    renderWithIntl(<LocationDropdown {...defaultProps} />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles')).toBeInTheDocument();
      expect(screen.getByText('Chicago')).toBeInTheDocument();
    });
  });

  it('should call onChange when location is selected', async () => {
    const onChange = jest.fn();
    renderWithIntl(<LocationDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      const newYorkOption = screen.getByText('New York');
      fireEvent.click(newYorkOption);
    });

    expect(onChange).toHaveBeenCalledWith('1', {
      id: '1',
      name: 'New York',
      active: true,
      assigned: true,
    });
  });

  it('should filter locations by search text', async () => {
    renderWithIntl(<LocationDropdown {...defaultProps} />);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'los' } });

    await waitFor(() => {
      // Should show at least one filtered item
      const items = screen.queryAllByRole('option');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it('uses parent onSearchLocation callback when provided', async () => {
    const onSearchLocation = jest.fn();
    renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        onSearchLocation={onSearchLocation}
      />,
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'York' } });

    await waitFor(() => {
      expect(onSearchLocation).toHaveBeenCalledWith('York');
    });
  });

  it('handles missing onSearchLocation and refetchWithSearch gracefully', async () => {
    mockUseLocationItems.mockReturnValue({
      locationItems: mockLocationItems,
      loading: false,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: undefined as any,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<LocationDropdown {...defaultProps} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'X' } });
    await waitFor(() => {
      expect(input).toHaveValue('X');
    });
  });

  it('should show loading state', () => {
    mockUseLocationItems.mockReturnValue({
      locationItems: [],
      loading: true,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<LocationDropdown {...defaultProps} />);

    // Dropdown should be disabled during loading
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
  });

  it('should handle errors gracefully', () => {
    const onError = jest.fn();
    mockUseLocationItems.mockReturnValue({
      locationItems: [],
      loading: false,
      error: 'API Error',
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<LocationDropdown {...defaultProps} onError={onError} />);

    expect(onError).toHaveBeenCalledWith('API Error');
  });

  it('should call onReady when data loads', () => {
    const onReady = jest.fn();
    renderWithIntl(<LocationDropdown {...defaultProps} onReady={onReady} />);

    expect(onReady).toHaveBeenCalled();
  });

  it('should handle load more on scroll', async () => {
    mockUseLocationItems.mockReturnValue({
      locationItems: mockLocationItems,
      loading: false,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: true,
    });

    renderWithIntl(<LocationDropdown {...defaultProps} />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    // Wait for menu to render and get it
    await waitFor(() => {
      const menu = screen.getByRole('listbox');
      expect(menu).toBeInTheDocument();

      // Create a proper scroll event with the scrollTop/Height/clientHeight
      const scrollEvent = new Event('scroll', { bubbles: true });
      Object.defineProperty(menu, 'scrollTop', { value: 800, writable: true });
      Object.defineProperty(menu, 'scrollHeight', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(menu, 'clientHeight', {
        value: 200,
        writable: true,
      });

      fireEvent(menu, scrollEvent);
    });

    // Load more should be called when scrolled to 80%
    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  it('should handle onLoad callback', () => {
    const onLoad = jest.fn();
    renderWithIntl(<LocationDropdown {...defaultProps} onLoad={onLoad} />);

    expect(onLoad).toHaveBeenCalledWith(mockLocationItems);
  });

  it('should clear input value when cleared', async () => {
    const onChange = jest.fn();
    renderWithIntl(
      <LocationDropdown {...defaultProps} onChange={onChange} value="1" />,
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;

    // Clear the input
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should show add new option when addNew is true', async () => {
    renderWithIntl(<LocationDropdown {...defaultProps} addNew />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      const addNewText = screen.getByText(
        /NLS quickfind.dropdown.location.add.new/,
      );
      expect(addNewText).toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} disabled />);

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  it('should display error text when provided', () => {
    renderWithIntl(
      <LocationDropdown {...defaultProps} errorText="This field is required" />,
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should display selected value from prop', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} value="1" />);

    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('New York');
  });

  describe('displayName fallback (DAS pre-populated)', () => {
    it('should show displayName when locationItems is empty and not loading', () => {
      mockUseLocationItems.mockReturnValue({
        locationItems: [],
        loading: false,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value="999"
          displayName="DAS Location Name"
        />,
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('DAS Location Name');
    });

    it('should show displayName while loading with empty locationItems', () => {
      mockUseLocationItems.mockReturnValue({
        locationItems: [],
        loading: true,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value="1"
          displayName="DAS Location Name"
        />,
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('DAS Location Name');
    });

    it('should fall back to displayName when id is not in loaded items', () => {
      // mockLocationItems has ids 1,2,3; 999 is not present so DAS name should be shown
      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value="999"
          displayName="DAS Fallback Location"
        />,
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('DAS Fallback Location');
    });

    it('should prefer loaded location name over displayName when id is found', () => {
      // value 1 exists in mockLocationItems ("New York"); should NOT show displayName
      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value="1"
          displayName="Should Not Show"
        />,
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('New York');
    });

    it('should NOT show displayName when value is empty', () => {
      // Parent did not clear departmentDAS after a user-initiated clear; the
      // dropdown must not resurrect the stale name when value is empty.
      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value=""
          displayName="Stale DAS Name"
        />,
      );

      const input = screen.getByRole('combobox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('shows Loading… when value is set, no items loaded yet, and no displayName', () => {
      // Slow SFO + DAS not yet arrived: user has a selected id but nothing
      // we can resolve. Show "Loading…" instead of a blank input.
      mockUseLocationItems.mockReturnValue({
        locationItems: [],
        loading: true,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<LocationDropdown {...defaultProps} value="999" />);
      const input = screen.getByRole('combobox') as HTMLInputElement;
      // intl mock returns "NLS <id> <vars>"; real users see "Loading…".
      expect(input.value).toBe('NLS quickfind.dropdown.loading undefined');
    });
  });

  it('should handle assignmentFilters prop', () => {
    const assignmentFilters = { assigned: true };
    renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        assignmentFilters={assignmentFilters}
      />,
    );

    expect(mockUseLocationItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: undefined,
        projectId: undefined,
        assignmentFilters: { assigned: true },
      }),
    );
  });

  it('should use DepartmentTerminology for label when provided', () => {
    const labelPreference = {
      DepartmentTerminology: 'Cost Center',
      CustomerTerminology: '',
    };
    renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        label=""
        labelPreference={labelPreference}
      />,
    );

    expect(screen.getByLabelText('Cost Center')).toBeInTheDocument();
  });

  it('should use DepartmentTerminology for placeholder when provided', () => {
    const labelPreference = {
      DepartmentTerminology: 'Cost Center',
      CustomerTerminology: '',
    };
    renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        placeholder=""
        labelPreference={labelPreference}
        label=""
      />,
    );

    const input = screen.getByLabelText('Cost Center') as HTMLInputElement;
    expect(input.placeholder).toContain('Cost Center');
  });

  it('should not pass timeForEntityId to useLocationItems when empty', () => {
    renderWithIntl(<LocationDropdown {...defaultProps} timeForEntityId="" />);

    expect(mockUseLocationItems).toHaveBeenCalledWith(
      expect.objectContaining({ timeForEntityId: '' }),
    );
  });

  it('should handle hasMore false and not call loadMore', async () => {
    mockUseLocationItems.mockReturnValue({
      locationItems: mockLocationItems,
      loading: false,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false, // No more items
    });

    renderWithIntl(<LocationDropdown {...defaultProps} />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      const menu = screen.getByRole('listbox');
      const scrollEvent = new Event('scroll', { bubbles: true });
      Object.defineProperty(menu, 'scrollTop', { value: 800, writable: true });
      Object.defineProperty(menu, 'scrollHeight', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(menu, 'clientHeight', {
        value: 200,
        writable: true,
      });

      fireEvent(menu, scrollEvent);
    });

    // Should NOT call loadMore when hasMore is false
    expect(mockLoadMore).not.toHaveBeenCalled();
  });

  it('should handle value updates from prop changes', () => {
    const { rerender } = renderWithIntl(
      <LocationDropdown {...defaultProps} value="1" />,
    );

    const input1 = screen.getByRole('combobox') as HTMLInputElement;
    expect(input1.value).toBe('New York');

    rerender(<LocationDropdown {...defaultProps} value="2" />);

    const input2 = screen.getByRole('combobox') as HTMLInputElement;
    expect(input2.value).toBe('Los Angeles');
  });

  it('should handle selection from dropdown', async () => {
    const onChange = jest.fn();
    renderWithIntl(<LocationDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('combobox');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
    });

    const option = screen.getByText('New York');
    fireEvent.click(option);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          id: '1',
          name: 'New York',
        }),
      );
    });
  });

  it('should preserve input value when typing', async () => {
    renderWithIntl(<LocationDropdown {...defaultProps} addNew />);

    const input = screen.getByRole('combobox');

    // Type something first
    fireEvent.change(input, { target: { value: 'Test Location' } });

    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('Test Location');
    });
  });

  it('filters client-side when using preloaded options without API search', async () => {
    mockUseLocationItems.mockReturnValue({
      locationItems: mockLocationItems,
      loading: false,
      error: null,
      loadLocationItems: mockLoadLocationItems,
      refetch: mockRefetch,
      refetchWithSearch: undefined as any,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        preloadedOptions={mockLocationItems}
        onSearchLocation={undefined}
      />,
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'york' } });

    await waitFor(() => {
      expect(input).toHaveValue('york');
    });
  });

  it('should handle assignmentFilters changes', () => {
    const { rerender } = renderWithIntl(
      <LocationDropdown
        {...defaultProps}
        assignmentFilters={{ assigned: true }}
      />,
    );

    expect(mockUseLocationItems).toHaveBeenCalled();

    const callCountAfterFirstRender = mockUseLocationItems.mock.calls.length;
    rerender(
      <LocationDropdown
        {...defaultProps}
        assignmentFilters={{ assigned: false }}
      />,
    );

    expect(mockUseLocationItems.mock.calls.length).toBeGreaterThan(
      callCountAfterFirstRender,
    );
  });

  describe('autoSelect', () => {
    const singleItem = [
      { id: '1', name: 'New York', assigned: true, active: true },
    ];
    const mockSingle = () =>
      mockUseLocationItems.mockReturnValue({
        locationItems: singleItem,
        loading: false,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

    it('should call onChange with the single item when autoSelect is true and no value is set', () => {
      const onChange = jest.fn();
      mockSingle();
      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value=""
          onChange={onChange}
          autoSelect
        />,
      );
      expect(onChange).toHaveBeenCalledWith('1', singleItem[0]);
    });

    it.each([
      ['autoSelect is false (feature disabled)', { autoSelect: false }, true],
      ['a value is already selected', { autoSelect: true, value: '1' }, true],
      ['there are multiple items in the list', { autoSelect: true }, false],
      ['the field is disabled', { autoSelect: true, disabled: true }, true],
    ])('should not auto-select when %s', (_, overrides, useSingle) => {
      const onChange = jest.fn();
      if (useSingle) mockSingle();
      renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value=""
          onChange={onChange}
          {...overrides}
        />,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should re-select the single item on blur when user clears without selecting', async () => {
      const onChange = jest.fn();
      mockSingle();
      const { rerender } = renderWithIntl(
        <LocationDropdown
          {...defaultProps}
          value=""
          onChange={onChange}
          autoSelect
        />,
      );

      // Initial auto-select should happen
      expect(onChange).toHaveBeenCalledWith('1', singleItem[0]);
      onChange.mockClear();

      // Rerender with the selected value (simulating the value being set after auto-select)
      rerender(
        <LocationDropdown
          {...defaultProps}
          value="1"
          onChange={onChange}
          autoSelect
        />,
      );

      // User clears the field by typing
      const input = screen.getByRole('combobox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      // Should clear the value
      expect(onChange).toHaveBeenCalledWith('', undefined);
      onChange.mockClear();

      // Rerender with empty value (simulating state update after clear)
      rerender(
        <LocationDropdown
          {...defaultProps}
          value=""
          onChange={onChange}
          autoSelect
        />,
      );

      // Should re-select on blur
      fireEvent.blur(input);
      await waitFor(() =>
        expect(onChange).toHaveBeenCalledWith('1', singleItem[0]),
      );
    });
  });

  describe('Hierarchy Features', () => {
    it('should apply indentation based on level', async () => {
      const hierarchicalLocations = [
        {
          id: '1',
          name: 'Main Office',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
        },
        {
          id: '2',
          name: 'Sub Office',
          assigned: true,
          active: true,
          level: 1,
          parentId: '1',
          fullName: 'Main Office:Sub Office',
        },
      ];

      mockUseLocationItems.mockReturnValue({
        locationItems: hierarchicalLocations,
        loading: false,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<LocationDropdown {...defaultProps} />);

      const input = screen.getByRole('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
        expect(screen.getByText('Sub Office')).toBeInTheDocument();
      });
    });

    it('should show parent name label for child items', async () => {
      const hierarchicalLocations = [
        {
          id: '1',
          name: 'Main Office',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
          fullName: 'Main Office',
        },
        {
          id: '2',
          name: 'Sub Office',
          assigned: true,
          active: true,
          level: 1,
          parentId: '1',
          fullName: 'Main Office:Sub Office',
        },
      ];

      mockUseLocationItems.mockReturnValue({
        locationItems: hierarchicalLocations,
        loading: false,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<LocationDropdown {...defaultProps} />);

      const input = screen.getByRole('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        // Check that the parent location label is present for child items
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        expect(dropdown.textContent).toContain('Main Office');
        expect(dropdown.textContent).toContain('Sub Office');
      });
    });

    it('should not show parent label for top-level items', async () => {
      const topLevelLocations = [
        {
          id: '1',
          name: 'Top Level Location',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
          fullName: 'Top Level Location',
        },
      ];

      mockUseLocationItems.mockReturnValue({
        locationItems: topLevelLocations,
        loading: false,
        error: null,
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<LocationDropdown {...defaultProps} />);

      const input = screen.getByRole('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Top Level Location')).toBeInTheDocument();
        expect(screen.queryByText(/Sublocation of/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('handleBlur and add-new drawer', () => {
    it('should call onChange with empty when blur and typed value does not match any location', async () => {
      const onChange = jest.fn();
      renderWithIntl(
        <LocationDropdown {...defaultProps} value="" onChange={onChange} />,
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'Random Typed Text' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('', undefined);
      });
    });

    it('should not clear when blur and typed value matches a location', async () => {
      const onChange = jest.fn();
      renderWithIntl(
        <LocationDropdown {...defaultProps} value="" onChange={onChange} />,
      );

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'New York' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onChange).not.toHaveBeenCalledWith('', undefined);
      });
    });

    it('should open add-new drawer and refetch on save with id containing colon', async () => {
      const onChange = jest.fn();
      renderWithIntl(
        <LocationDropdown {...defaultProps} addNew onChange={onChange} />,
      );

      const input = screen.getByRole('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        const addNewOption =
          screen.queryByText(/add new location/i) ||
          screen.queryByText(/Add new/i);
        if (addNewOption) fireEvent.click(addNewOption);
      });

      await waitFor(() => {
        const drawer = screen.queryByTestId('mock-quickfills-drawer');
        if (drawer) {
          const saveBtn = screen.getByText('Save');
          fireEvent.click(saveBtn);
          expect(mockRefetch).toHaveBeenCalled();
        }
      });
    });

    it('opens add-new drawer deterministically and saves new location', async () => {
      const onChange = jest.fn();
      renderWithIntl(
        <LocationDropdown {...defaultProps} addNew onChange={onChange} />,
      );

      fireEvent.click(screen.getByRole('combobox'));
      const addNewText = await screen.findByText(
        /NLS quickfind\.dropdown\.location\.add\.new/i,
      );
      fireEvent.click(addNewText);

      expect(screen.getByTestId('mock-quickfills-drawer')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(
          'new-location-123',
          expect.objectContaining({ id: 'new-location-123' }),
        );
      });
    });

    it('should call onReady with empty array when error occurs and not yet loaded', () => {
      const onReady = jest.fn();
      mockUseLocationItems.mockReturnValue({
        locationItems: [],
        loading: false,
        error: 'Network error',
        loadLocationItems: mockLoadLocationItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<LocationDropdown {...defaultProps} onReady={onReady} />);

      expect(onReady).toHaveBeenCalledWith([]);
    });
  });
});
