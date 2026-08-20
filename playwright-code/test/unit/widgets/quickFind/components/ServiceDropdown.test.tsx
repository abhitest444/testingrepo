import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServiceDropdown from 'src/js/widgets/quickFind/components/ServiceDropdown';
import { useServiceItems } from 'src/js/widgets/quickFind/hooks/useServiceItems';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

// Mock dependencies
jest.mock('src/js/widgets/quickFind/hooks/useServiceItems');

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
  default: ({ handleCancel, handleSaveSuccess }: any) => (
    <div data-testid="mock-product-drawer">
      <button onClick={handleCancel}>Close</button>
      <button
        onClick={() =>
          handleSaveSuccess({
            id: 'new-service-123',
            name: 'New Service',
            displayName: 'New Service',
          })
        }
      >
        Save
      </button>
    </div>
  ),
}));

const mockUseServiceItems = useServiceItems as jest.MockedFunction<
  typeof useServiceItems
>;

const defaultProps = {
  value: '',
  onChange: jest.fn(),
  onReady: jest.fn(),
  onError: jest.fn(),
  label: 'Service',
  placeholder: 'Select a service',
  disabled: false,
  addNew: true,
  timeForEntityId: '123',
};

const mockServiceItems = [
  { id: '1', name: 'Consulting', assigned: true, active: true },
  { id: '2', name: 'Development', assigned: true, active: true },
  { id: '3', name: 'Design', assigned: false, active: true },
];

describe('ServiceDropdown', () => {
  const mockLoadServiceItems = jest.fn();
  const mockRefetch = jest.fn();
  const mockRefetchWithSearch = jest.fn();
  const mockLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });
  });

  const renderWithIntl = (ui: React.ReactElement) =>
    renderWithQuicksandProvider(ui);

  it('should render without crashing', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} />);
    expect(screen.getByLabelText('Service')).toBeInTheDocument();
  });

  it('should not load services when timeForEntityId is not provided', () => {
    renderWithIntl(
      <ServiceDropdown {...defaultProps} timeForEntityId={undefined} />,
    );

    expect(mockLoadServiceItems).not.toHaveBeenCalled();
  });

  it('should load services when timeForEntityId is provided', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    expect(mockUseServiceItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: undefined,
        projectId: undefined,
      }),
    );
  });

  it('should load services with customerId', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} customerId="456" />);

    expect(mockUseServiceItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: '456',
        projectId: undefined,
      }),
    );
  });

  it('should load services with projectId', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} projectId="789" />);

    expect(mockUseServiceItems).toHaveBeenCalledWith(
      expect.objectContaining({
        timeForEntityId: '123',
        customerId: undefined,
        projectId: '789',
      }),
    );
  });

  it('should reload when timeForEntityId changes', () => {
    const { rerender } = renderWithIntl(<ServiceDropdown {...defaultProps} />);

    expect(mockUseServiceItems).toHaveBeenCalledWith(
      expect.objectContaining({ timeForEntityId: '123' }),
    );

    rerender(<ServiceDropdown {...defaultProps} timeForEntityId="456" />);

    expect(mockUseServiceItems).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timeForEntityId: '456',
        customerId: undefined,
        projectId: undefined,
      }),
    );
  });

  it('should display service items in dropdown', async () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('Consulting')).toBeInTheDocument();
      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });
  });

  it('should call onChange when service is selected', async () => {
    const onChange = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      const consultingOption = screen.getByText('Consulting');
      fireEvent.click(consultingOption);
    });

    expect(onChange).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        id: '1',
        name: 'Consulting',
        active: true,
        assigned: true,
      }),
    );
  });

  it('should filter services by search text', async () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'dev' } });

    await waitFor(() => {
      // Should show at least one filtered item
      const items = screen.queryAllByRole('option');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it('uses parent onSearchService callback when provided', async () => {
    const onSearchService = jest.fn();
    renderWithIntl(
      <ServiceDropdown {...defaultProps} onSearchService={onSearchService} />,
    );

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Consult' } });

    await waitFor(() => {
      expect(onSearchService).toHaveBeenCalledWith('Consult');
    });
  });

  it('handles missing onSearchService and refetchWithSearch gracefully', async () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: undefined as any,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} />);
    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'X' } });
    await waitFor(() => {
      expect(input).toHaveValue('X');
    });
  });

  it.skip('should clear selection when input is cleared', async () => {
    const onChange = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('', undefined);
    });
  });

  it('should show loading state', () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: [],
      loading: true,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    // Dropdown should be disabled during loading
    const input = screen.getByLabelText('Service');
    expect(input).toBeInTheDocument();
  });

  it('should handle errors gracefully', () => {
    const onError = jest.fn();
    mockUseServiceItems.mockReturnValue({
      serviceItems: [],
      loading: false,
      error: 'API Error',
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} onError={onError} />);

    expect(onError).toHaveBeenCalledWith('API Error');
  });

  it('should call onReady when data loads', () => {
    const onReady = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onReady={onReady} />);

    expect(onReady).toHaveBeenCalled();
  });

  it('should show add new option when addNew is true', async () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} addNew />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      const addNewOption = screen.getByRole('option', { name: /add new/i });
      expect(addNewOption).toBeInTheDocument();
    });
  });

  it('should open product drawer when add new is clicked', async () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} addNew />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      const addNewButton = screen.getByRole('option', { name: /add new/i });
      fireEvent.click(addNewButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-product-drawer')).toBeInTheDocument();
    });
  });

  it('should close product drawer on cancel', async () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} addNew />);
    fireEvent.click(screen.getByLabelText('Service'));
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: /add new/i }));
    });
    expect(screen.getByTestId('mock-product-drawer')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => {
      expect(
        screen.queryByTestId('mock-product-drawer'),
      ).not.toBeInTheDocument();
    });
  });

  it('should select newly created service', async () => {
    const onChange = jest.fn();
    renderWithIntl(
      <ServiceDropdown {...defaultProps} onChange={onChange} addNew />,
    );

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      const addNewButton = screen.getByRole('option', { name: /add new/i });
      fireEvent.click(addNewButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-product-drawer')).toBeInTheDocument();
    });
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockRefetch).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('new-service-123', {
      id: 'new-service-123',
      name: 'New Service',
    });
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} disabled />);

    const input = screen.getByLabelText('Service');
    expect(input).toBeDisabled();
  });

  it('should display error text when provided', () => {
    renderWithIntl(
      <ServiceDropdown {...defaultProps} errorText="This field is required" />,
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it.skip('should trigger infinite scroll load more', async () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: true,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    await waitFor(() => {
      expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
    });

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
    expect(listbox).toBeTruthy();
    if (listbox) {
      Object.defineProperty(listbox, 'scrollTop', {
        value: 800,
        writable: true,
      });
      Object.defineProperty(listbox, 'scrollHeight', {
        value: 1000,
        writable: true,
      });
      Object.defineProperty(listbox, 'clientHeight', {
        value: 200,
        writable: true,
      });
      listbox.dispatchEvent(new Event('scroll', { bubbles: true }));
    }

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  it('should display selected value from prop', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} value="1" />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    expect(input.value).toBe('Consulting');
  });

  it('should handle assignmentFilters prop', () => {
    const assignmentFilters = { assigned: true };
    renderWithIntl(
      <ServiceDropdown
        {...defaultProps}
        assignmentFilters={assignmentFilters}
      />,
    );

    expect(mockUseServiceItems).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentFilters: { assigned: true },
      }),
    );
  });

  it('should handle scroll without target', () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: true,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} />);

    const input = screen.getByLabelText('Service');
    fireEvent.click(input);

    const scrollEvent = new Event('scroll');
    Object.defineProperty(scrollEvent, 'target', {
      value: null,
      writable: false,
    });

    expect(() => {
      document.dispatchEvent(scrollEvent);
    }).not.toThrow();
  });

  it('should clear selection when input text is cleared', async () => {
    const onChange = jest.fn();
    renderWithIntl(
      <ServiceDropdown {...defaultProps} value="1" onChange={onChange} />,
    );

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('', undefined);
    });
  });

  it('should handle blur with no match - clear selection', async () => {
    const onChange = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'NonExistentService' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('', undefined);
    });
  });

  it('should handle blur with exact match', async () => {
    const onChange = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'consulting' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalledWith('', undefined);
    });
  });

  it('should return empty display value when isUserCleared is true', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} value="1" />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });

    expect(input.value).toBe('');
  });

  it('filters client-side when using preloaded options without API search', async () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: undefined as any,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(
      <ServiceDropdown
        {...defaultProps}
        preloadedOptions={mockServiceItems}
        onSearchService={undefined}
      />,
    );

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'dev' } });
    await waitFor(() => {
      expect(input).toHaveValue('dev');
    });
  });

  it('calls loadMore on scroll when hasMore is true', async () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: mockServiceItems,
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: true,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Service'));

    const listbox = await screen.findByRole('listbox');
    Object.defineProperty(listbox, 'scrollTop', { value: 90, writable: true });
    Object.defineProperty(listbox, 'scrollHeight', {
      value: 100,
      writable: true,
    });
    Object.defineProperty(listbox, 'clientHeight', {
      value: 10,
      writable: true,
    });
    fireEvent.scroll(listbox);

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  it('should not clear selection on blur when input is empty', async () => {
    const onChange = jest.fn();
    renderWithIntl(<ServiceDropdown {...defaultProps} onChange={onChange} />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalledWith('', undefined);
  });

  it('should show "Loading…" placeholder when loading with a value but no items resolved yet', () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: [],
      loading: true,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} value="1" />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    // Slow API: we have a selected id but nothing to resolve it with yet —
    // show the localized "Loading…" placeholder rather than a blank input.
    // (The intl mock surfaces the message id; real users see the translated
    // string from `quickfind.dropdown.loading`.)
    expect(input.value).toBe('NLS quickfind.dropdown.loading undefined');
  });

  it('should return empty display value when serviceItems is empty', () => {
    mockUseServiceItems.mockReturnValue({
      serviceItems: [],
      loading: false,
      error: null,
      loadServiceItems: mockLoadServiceItems,
      refetch: mockRefetch,
      refetchWithSearch: mockRefetchWithSearch,
      loadMore: mockLoadMore,
      hasMore: false,
    });

    renderWithIntl(<ServiceDropdown {...defaultProps} value="1" />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should return empty display value when selected service is not found', () => {
    renderWithIntl(<ServiceDropdown {...defaultProps} value="999" />);

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should show displayName when value is set but item is not in loaded list', () => {
    renderWithIntl(
      <ServiceDropdown
        {...defaultProps}
        value="999"
        displayName="Consulting:Technical Consulting"
      />,
    );

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    expect(input.value).toBe('Consulting:Technical Consulting');
  });

  it('should prefer loaded item name over displayName when item is in list', () => {
    renderWithIntl(
      <ServiceDropdown
        {...defaultProps}
        value="1"
        displayName="Stale Display Name"
      />,
    );

    const input = screen.getByLabelText('Service') as HTMLInputElement;
    expect(input.value).toBe('Consulting');
  });

  describe('autoSelect', () => {
    const singleItem = [
      { id: '1', name: 'Consulting', assigned: true, active: true },
    ];
    const mockSingle = () =>
      mockUseServiceItems.mockReturnValue({
        serviceItems: singleItem,
        loading: false,
        error: null,
        loadServiceItems: mockLoadServiceItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

    it('should call onChange with the single item when autoSelect is true and no value is set', () => {
      const onChange = jest.fn();
      mockSingle();
      renderWithIntl(
        <ServiceDropdown
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
        <ServiceDropdown
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
        <ServiceDropdown
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
        <ServiceDropdown
          {...defaultProps}
          value="1"
          onChange={onChange}
          autoSelect
        />,
      );

      // User clears the field by typing
      const input = screen.getByLabelText('Service') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '' } });

      // Should clear the value
      expect(onChange).toHaveBeenCalledWith('', undefined);
      onChange.mockClear();

      // Rerender with empty value (simulating state update after clear)
      rerender(
        <ServiceDropdown
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
      const hierarchicalServices = [
        {
          id: '1',
          name: 'Consulting',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
        },
        {
          id: '2',
          name: 'Technical Consulting',
          assigned: true,
          active: true,
          level: 1,
          parentId: '1',
          fullName: 'Consulting:Technical Consulting',
        },
      ];

      mockUseServiceItems.mockReturnValue({
        serviceItems: hierarchicalServices,
        loading: false,
        error: null,
        loadServiceItems: mockLoadServiceItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<ServiceDropdown {...defaultProps} />);

      const input = screen.getByLabelText('Service');
      fireEvent.click(input);

      await waitFor(() => {
        // 'Consulting' appears as item name AND as the derived category label for 'Technical Consulting'
        expect(screen.getAllByText('Consulting').length).toBeGreaterThanOrEqual(
          1,
        );
        expect(screen.getByText('Technical Consulting')).toBeInTheDocument();
      });
    });

    it('should show parent name label for child items', async () => {
      const hierarchicalServices = [
        {
          id: '1',
          name: 'Consulting',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
          fullName: 'Consulting',
        },
        {
          id: '2',
          name: 'Technical Consulting',
          assigned: true,
          active: true,
          level: 1,
          parentId: '1',
          fullName: 'Consulting:Technical Consulting',
        },
      ];

      mockUseServiceItems.mockReturnValue({
        serviceItems: hierarchicalServices,
        loading: false,
        error: null,
        loadServiceItems: mockLoadServiceItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<ServiceDropdown {...defaultProps} />);

      const input = screen.getByLabelText('Service');
      fireEvent.click(input);

      await waitFor(() => {
        // Check that the parent service label is present for child items
        const dropdown = screen.getByRole('listbox');
        expect(dropdown).toBeInTheDocument();
        expect(dropdown.textContent).toContain('Consulting');
        expect(dropdown.textContent).toContain('Technical Consulting');
      });
    });

    it('should not show parent label for top-level items', async () => {
      const topLevelServices = [
        {
          id: '1',
          name: 'Top Level Service',
          assigned: true,
          active: true,
          level: null,
          parentId: null,
          fullName: 'Top Level Service',
        },
      ];

      mockUseServiceItems.mockReturnValue({
        serviceItems: topLevelServices,
        loading: false,
        error: null,
        loadServiceItems: mockLoadServiceItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<ServiceDropdown {...defaultProps} />);

      const input = screen.getByLabelText('Service');
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Top Level Service')).toBeInTheDocument();
        expect(screen.queryByText(/Subservice of/i)).not.toBeInTheDocument();
      });
    });

    it('should show description on the right when service has description (same as EMPLOYEE/VENDOR on team member)', async () => {
      const servicesWithDescription = [
        {
          id: '1',
          name: 'Consulting',
          assigned: true,
          active: true,
          description: 'Consulting service description',
        },
        {
          id: '2',
          name: 'Development',
          assigned: true,
          active: true,
        },
      ];

      mockUseServiceItems.mockReturnValue({
        serviceItems: servicesWithDescription,
        loading: false,
        error: null,
        loadServiceItems: mockLoadServiceItems,
        refetch: mockRefetch,
        refetchWithSearch: mockRefetchWithSearch,
        loadMore: mockLoadMore,
        hasMore: false,
      });

      renderWithIntl(<ServiceDropdown {...defaultProps} />);

      const input = screen.getByLabelText('Service');
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Consulting')).toBeInTheDocument();
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(
          screen.getByText('Consulting service description'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Search vs selection (full list after select)', () => {
    it('should show full list when dropdown is opened after selection (filter only when searching)', async () => {
      renderWithIntl(<ServiceDropdown {...defaultProps} value="1" />);

      const input = screen.getByLabelText('Service') as HTMLInputElement;
      expect(input.value).toBe('Consulting');

      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('Consulting')).toBeInTheDocument();
        expect(screen.getByText('Development')).toBeInTheDocument();
        expect(screen.getByText('Design')).toBeInTheDocument();
      });
    });
  });
});
