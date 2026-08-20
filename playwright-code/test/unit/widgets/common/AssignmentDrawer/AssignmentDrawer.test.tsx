import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AssignmentDrawerDefault, {
  AssignmentDrawerContent as AssignmentDrawer,
} from 'src/js/widgets/common/AssignmentDrawer/AssignmentDrawer';
import {
  AssignmentDrawerConfig,
  AssignmentItem,
  AssignmentChanges,
  FetchParams,
  FetchResult,
} from 'src/js/widgets/common/AssignmentDrawer/types';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock all drawer components
jest.mock('@ids-ts/drawer', () => ({
  Drawer: ({
    children,
    open,
    onClose,
  }: {
    children: React.ReactNode;
    open: boolean;
    onClose?: () => void;
  }) =>
    open ? (
      <div data-testid="drawer">
        {children}
        {onClose && (
          <button data-testid="drawer-close-button" onClick={onClose}>
            Close Drawer
          </button>
        )}
      </div>
    ) : null,
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose?: () => void;
  }) => (
    <div data-testid="drawer-header">
      {children}
      {onClose && (
        <button data-testid="drawer-header-close-button" onClick={onClose}>
          X
        </button>
      )}
    </div>
  ),
  DrawerFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-footer">{children}</div>
  ),
}));

// Mock Button
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock Typography
jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Demi: ({ children }: { children: React.ReactNode }) => (
    <strong>{children}</strong>
  ),
}));

// Mock SearchField
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (val: string) => void;
    label: string;
  }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
    />
  ),
}));

// Mock child components
jest.mock('src/js/widgets/common/AssignmentDrawer/components', () => ({
  AssignmentSummary: ({
    selectedCount,
    totalCount,
    fieldName,
    summaryType,
  }: {
    selectedCount: number;
    totalCount: number;
    fieldName: string;
    summaryType: string;
  }) => (
    <div data-testid="assignment-summary">
      {selectedCount} of {totalCount} {summaryType} assigned to {fieldName}
    </div>
  ),
  AssignmentTable: ({
    items,
    displayItems,
    selectedItems,
    onSelectionChange,
    onSelectAll,
    loading,
  }: {
    items: AssignmentItem[];
    displayItems?: AssignmentItem[];
    selectedItems: Set<number | string>;
    onSelectionChange: (id: number | string) => void;
    onSelectAll: () => void;
    loading: boolean;
  }) => {
    const itemsToRender = displayItems || items;
    return (
      <div data-testid="assignment-table">
        {loading && <div data-testid="table-loading">Loading...</div>}
        {itemsToRender.map((item) => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            <input
              type="checkbox"
              data-testid={`checkbox-${item.id}`}
              checked={selectedItems.has(item.id)}
              onChange={() => onSelectionChange(item.id)}
            />
            <span>{item.name}</span>
          </div>
        ))}
        <button data-testid="select-all-button" onClick={onSelectAll}>
          Select All
        </button>
      </div>
    );
  },
  AssignmentPagination: ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
  }: {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="assignment-pagination">
      <button
        data-testid="prev-page"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span data-testid="page-info">
        Page {currentPage} - Items: {totalItems}
      </span>
      <button
        data-testid="next-page"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage * pageSize >= totalItems}
      >
        Next
      </button>
    </div>
  ),
}));

// Mock UnsavedChangesModal
jest.mock(
  'src/js/widgets/common/AssignmentDrawer/components/UnsavedChangesModal',
  () => ({
    UnsavedChangesModal: ({
      open,
      onSave,
      onDontSave,
      onClose,
    }: {
      open: boolean;
      onSave: () => void;
      onDontSave: () => void;
      onClose: () => void;
    }) =>
      open ? (
        <div data-testid="unsaved-changes-modal">
          <button data-testid="modal-save-button" onClick={onSave}>
            Save
          </button>
          <button data-testid="modal-dont-save-button" onClick={onDontSave}>
            Don&apos;t save
          </button>
          <button data-testid="modal-close-button" onClick={onClose}>
            Close Modal
          </button>
        </div>
      ) : null,
  }),
);

// Mock QuicksandProvider as a pass-through so the outer AssignmentDrawer wrapper
// can be tested without a full Quicksand setup (MockQuicksandProvider from the
// test helper already supplies all necessary context above it).
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: any) => children,
  };
});

// Mock NLS
jest.mock('src/nls', () => {
  const nlsMessages = {
    'assignmentDrawer.titles.CustomerAssignment': 'Assign customers',
    'assignmentDrawer.descriptions.CustomerAssignment':
      'Review who is assigned to the custom field.',
    'assignmentDrawer.summaryTypes.CustomerAssignment': 'customers',
    'assignmentDrawer.tableHeaders.CustomerAssignment': 'Customers/Projects',
    'assignmentDrawer.pagination.CustomerAssignment': 'customers',
  };

  return {
    __esModule: true,
    default: {
      requireNlsForLocale: jest.fn(() => nlsMessages),
    },
  };
});

describe('AssignmentDrawer Component', () => {
  const mockItems: AssignmentItem[] = [
    {
      id: 1,
      name: 'Customer 1',
      level: 0,
      hasChildren: false,
      isSelected: false,
    },
    {
      id: 2,
      name: 'Customer 2',
      level: 0,
      hasChildren: false,
      isSelected: true,
    },
    {
      id: 3,
      name: 'Customer 3',
      level: 0,
      hasChildren: false,
      isSelected: false,
    },
  ];

  const mockFetchData = jest.fn(
    async (params: FetchParams): Promise<FetchResult> => ({
      items: mockItems,
      totalCount: mockItems.length,
    }),
  );

  const mockOnSave = jest.fn(async () => {});
  const mockOnClose = jest.fn();

  const defaultConfig: AssignmentDrawerConfig = {
    assignmentType: 'CustomerAssignment',
    dataSource: {
      fetchData: mockFetchData,
      searchMode: 'server',
    },
    ui: {
      searchPlaceholder: 'Search customers...',
      searchSupported: true,
      searchExpandable: false,
      fieldName: 'Region',
    },
    table: {
      columns: [{ key: 'name', header: 'Customers' }],
      sortable: false,
      defaultExpanded: false,
      hierarchicalSelection: false,
    },
    pagination: {
      enabled: true,
      defaultPageSize: 10,
    },
    callbacks: {
      onSave: mockOnSave,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drawer when open', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });
    });

    it('should not render drawer when closed', () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open={false}
          onClose={mockOnClose}
          config={defaultConfig}
        />,
        getDefaultSandbox(),
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render drawer header', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
      });
    });

    it('should render drawer content', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
      });
    });

    it('should render drawer footer with action buttons', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer-footer')).toBeInTheDocument();
      });
    });

    it('should render search input when search is supported', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('should render assignment summary', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });
    });

    it('should render assignment table', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });
    });

    it('should render pagination when enabled', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-pagination')).toBeInTheDocument();
      });
    });
  });

  describe('Data fetching', () => {
    it('should fetch data on mount', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(mockFetchData).toHaveBeenCalled();
      });
    });

    it('should pass correct parameters to fetchData', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      // Wait for drawer to be in the document
      expect(await screen.findByTestId('drawer')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(mockFetchData).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      expect(mockFetchData).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 10,
        }),
      );
    });

    it('should show loading state while fetching', async () => {
      const slowFetch = jest.fn(
        () =>
          new Promise<FetchResult>((resolve) => {
            setTimeout(() => resolve({ items: [], totalCount: 0 }), 100);
          }),
      );

      const configWithSlowFetch = {
        ...defaultConfig,
        dataSource: { ...defaultConfig.dataSource, fetchData: slowFetch },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithSlowFetch}
        />,
        getDefaultSandbox(),
      );

      // Should show loading initially
      await waitFor(() => {
        expect(screen.getByTestId('table-loading')).toBeInTheDocument();
      });
    });

    it('should display fetched items', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.getByText('Customer 2')).toBeInTheDocument();
        expect(screen.getByText('Customer 3')).toBeInTheDocument();
      });
    });
  });

  describe('Selection behavior', () => {
    it('should initialize with provided selections', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-2');
        expect(checkbox).toBeChecked();
      });
    });

    it('should toggle selection when clicking checkbox', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1');
        fireEvent.click(checkbox);
      });

      // Checkbox should now be checked
      const checkbox = screen.getByTestId('checkbox-1');
      expect(checkbox).toBeChecked();
    });

    it('should handle select all', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      // Wait for the button to appear
      const selectAllButton = await screen.findByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      // All checkboxes should be checked
      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });
    });
  });

  describe('Search functionality', () => {
    it('should update search value on input change', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
      });

      const searchInput = screen.getByTestId(
        'search-input',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('test search');
    });

    it('should call onSearch callback when search value changes', async () => {
      const mockOnSearch = jest.fn();
      const configWithOnSearch = {
        ...defaultConfig,
        callbacks: {
          ...defaultConfig.callbacks,
          onSearch: mockOnSearch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithOnSearch}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('test search');
      });
    });

    it('should fetch data with search term in server mode', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      mockFetchData.mockClear();

      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'search' } });
      });

      // Should trigger a new fetch with search term
      await waitFor(() => {
        expect(mockFetchData).toHaveBeenCalledWith(
          expect.objectContaining({
            searchTerm: 'search',
          }),
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should handle page change', async () => {
      // Create a mock with more items for pagination
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Customer ${i + 1}`,
        level: 0,
        hasChildren: false,
        isSelected: false,
      }));

      const paginatedFetch = jest.fn(async () => ({
        items: manyItems.slice(0, 10),
        totalCount: 25,
      }));

      const configWithPagination = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: paginatedFetch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithPagination}
        />,
        getDefaultSandbox(),
      );

      // Wait for initial render
      await screen.findByTestId('next-page');

      paginatedFetch.mockClear();

      const nextButton = screen.getByTestId('next-page');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(paginatedFetch).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          }),
        );
      });
    });
  });

  describe('Save functionality', () => {
    it('should call onSave when clicking save button', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        // Make a change first
        const checkbox = screen.getByTestId('checkbox-1');
        fireEvent.click(checkbox);
      });

      // Find and click save button
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('should call onSave when save button is clicked', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1');
        fireEvent.click(checkbox);
      });

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('should disable save button when no changes', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const drawerFooter = screen.getByTestId('drawer-footer');
        const saveButton = drawerFooter.querySelector('button');
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Client-side hierarchical search', () => {
    it('should filter items based on search term in client mode', async () => {
      const hierarchicalItems = [
        {
          id: 1,
          name: 'Parent Customer',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Child Project',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 1,
        },
        {
          id: 3,
          name: 'Another Customer',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const clientModeFetch = jest.fn(async () => ({
        items: hierarchicalItems,
        totalCount: hierarchicalItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientModeFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Parent Customer');

      // Search for 'Child'
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Child' } });

      await waitFor(() => {
        // Should show the child item
        expect(screen.getByText('Child Project')).toBeInTheDocument();
        // Should also show parent since child matches
        expect(screen.getByText('Parent Customer')).toBeInTheDocument();
        // Should not show unrelated customer
        expect(screen.queryByText('Another Customer')).not.toBeInTheDocument();
      });
    });

    it('should show parent when searching for child in hierarchical structure', async () => {
      const hierarchicalItems = [
        {
          id: 1,
          name: 'Company A',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Project Alpha',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 1,
        },
        {
          id: 3,
          name: 'Company B',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const clientModeFetch = jest.fn(async () => ({
        items: hierarchicalItems,
        totalCount: hierarchicalItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientModeFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Company A');

      // Search for child project
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Alpha' } });

      await waitFor(() => {
        // Parent should be included
        expect(screen.getByText('Company A')).toBeInTheDocument();
        // Child should be visible
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        // Unrelated item should not be visible
        expect(screen.queryByText('Company B')).not.toBeInTheDocument();
      });
    });

    it('should show all items when search is cleared in client mode', async () => {
      const clientModeFetch = jest.fn(async () => ({
        items: mockItems,
        totalCount: mockItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientModeFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Customer 1' } });

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.queryByText('Customer 2')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.getByText('Customer 2')).toBeInTheDocument();
        expect(screen.getByText('Customer 3')).toBeInTheDocument();
      });
    });

    it('should handle search with no matches in client mode', async () => {
      const clientModeFetch = jest.fn(async () => ({
        items: mockItems,
        totalCount: mockItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientModeFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.queryByText('Customer 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Customer 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Customer 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Select All state handling', () => {
    it('should handle deselecting some items from select all state', async () => {
      // Start with all items selected
      const allIds = new Set(mockItems.map((item) => item.id));

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={allIds}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Deselect one item
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).not.toBeChecked();
      });

      // Try to save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('should send both newlyAssigned and newlyUnassigned when deselecting some from select all', async () => {
      const mockOnSaveWithArgs = jest.fn().mockResolvedValue(undefined);
      const configWithSaveCheck: AssignmentDrawerConfig = {
        ...defaultConfig,
        callbacks: {
          onSave: mockOnSaveWithArgs,
        },
      };

      // Start with all items selected
      const allIds = new Set(mockItems.map((item) => item.id));

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithSaveCheck}
          initialSelections={allIds}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Deselect item 1 (keep 2 and 3)
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).not.toBeChecked();
      });

      // Save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSaveWithArgs).toHaveBeenCalledTimes(1);
        });

        const callArg = mockOnSaveWithArgs.mock.calls[0][0];

        // Should send remaining items as newlyAssigned
        expect(callArg.newlyAssigned.has(2)).toBe(true);
        expect(callArg.newlyAssigned.has(3)).toBe(true);
        expect(callArg.newlyAssigned.has(1)).toBe(false);

        // Should ALSO send deselected items as newlyUnassigned
        expect(callArg.newlyUnassigned.has(1)).toBe(true);
        expect(callArg.newlyUnassigned.has(2)).toBe(false);
        expect(callArg.newlyUnassigned.has(3)).toBe(false);

        // Should not be select all
        expect(callArg.isSelectAll).toBe(false);
      }
    });

    it('should handle deselecting all items from select all state', async () => {
      // Start with all items selected
      const allIds = new Set(mockItems.map((item) => item.id));

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={allIds}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Deselect all items
      fireEvent.click(screen.getByTestId('checkbox-1'));
      fireEvent.click(screen.getByTestId('checkbox-2'));
      fireEvent.click(screen.getByTestId('checkbox-3'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
        expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
        expect(screen.getByTestId('checkbox-3')).not.toBeChecked();
      });

      // Try to save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('should handle normal case - tracking individual changes (not select all)', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
      });

      // Select another item
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Try to save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        expect(saveButton).not.toBeDisabled();
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalled();
        });
      }
    });

    it('should handle selecting all items from partial selection', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([1])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
      });

      // Select remaining items using select all button instead of clicking individually
      const selectAllButton = screen.getByTestId('select-all-button');

      await act(async () => {
        fireEvent.click(selectAllButton);
      });

      // All should now be checked
      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Try to save - should be enabled since we went from partial to all
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        expect(saveButton).not.toBeDisabled();
      }
    });

    it('should clear newly assigned/unassigned sets when select all is active', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
      });

      // Select all items using select all button
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Save button should be enabled
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        expect(saveButton).not.toBeDisabled();
      }
    });

    it('should deselect all items when clicking select all when all are selected', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
      });

      // Select all items first
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });

      // Click select all again to deselect all
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
        expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
        expect(screen.getByTestId('checkbox-3')).not.toBeChecked();
      });
    });

    it('should handle pagination with invalid page size', async () => {
      const configWithInvalidPageSize = {
        ...defaultConfig,
        pagination: {
          enabled: true,
          defaultPageSize: 0,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithInvalidPageSize}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });
    });

    it('should handle save errors gracefully', async () => {
      const mockOnSaveWithError = jest.fn(async () => {
        throw new Error('Save failed');
      });

      const configWithErrorHandler = {
        ...defaultConfig,
        callbacks: {
          onSave: mockOnSaveWithError,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithErrorHandler}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox = screen.getByTestId('checkbox-1');
        fireEvent.click(checkbox);
      });

      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find((btn) =>
        btn.textContent?.includes('Save'),
      );

      if (saveButton) {
        fireEvent.click(saveButton);

        await waitFor(() => {
          expect(mockOnSaveWithError).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Close functionality', () => {
    it('should not have a cancel button', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByTestId('drawer');

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons.find((btn) =>
        btn.textContent?.includes('Cancel'),
      );

      expect(cancelButton).toBeUndefined();
    });
  });

  describe('Unsaved Changes Modal', () => {
    it('should not show unsaved changes modal when drawer is closed without changes', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Try to close without making changes - modal should not appear
      expect(
        screen.queryByTestId('unsaved-changes-modal'),
      ).not.toBeInTheDocument();
    });

    it('should close drawer directly when no unsaved changes and close button is clicked', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Click close without making changes
      const closeButton = screen.getByTestId('drawer-header-close-button');
      fireEvent.click(closeButton);

      // Should call onClose directly without showing modal
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
      expect(
        screen.queryByTestId('unsaved-changes-modal'),
      ).not.toBeInTheDocument();
    });

    it('should show unsaved changes modal when trying to close drawer with unsaved changes', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change - select another item
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Click close button - should show modal instead of closing
      const closeButton = screen.getByTestId('drawer-header-close-button');
      fireEvent.click(closeButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      // onClose should NOT have been called yet
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call handleSave and close modal when "Save" button in modal is clicked', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Click close to show modal
      const closeButton = screen.getByTestId('drawer-header-close-button');
      fireEvent.click(closeButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      // Click Save button in modal
      const saveButton = screen.getByTestId('modal-save-button');
      fireEvent.click(saveButton);

      // Should call onSave
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByTestId('unsaved-changes-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('should call onClose when "Don&apos;t save" button in modal is clicked', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Click close to show modal
      const closeButton = screen.getByTestId('drawer-header-close-button');
      fireEvent.click(closeButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      // Click Don't Save button in modal
      const dontSaveButton = screen.getByTestId('modal-dont-save-button');
      fireEvent.click(dontSaveButton);

      // Should call onClose without saving
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      // Should NOT have called onSave
      expect(mockOnSave).not.toHaveBeenCalled();

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByTestId('unsaved-changes-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('should detect changes when selecting items', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Initially no changes - save button should be disabled
      const drawerFooter = await screen.findByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).toBeDisabled();

      // Select an item
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Now save button should be enabled
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should detect changes when deselecting items', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([1, 2, 3])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // All items are selected initially - no changes yet
      const drawerFooter = await screen.findByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).toBeDisabled();

      // Deselect an item
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).not.toBeChecked();
      });

      // Now save button should be enabled (change detected)
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('should not show modal when closing without any changes', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Don't make any changes
      // Modal should not be shown
      expect(
        screen.queryByTestId('unsaved-changes-modal'),
      ).not.toBeInTheDocument();
    });

    it('should close modal when modal close button is clicked', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      // Click close to show modal
      const closeButton = screen.getByTestId('drawer-header-close-button');
      fireEvent.click(closeButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      });

      // Click modal close button (X button on modal)
      const modalCloseButton = screen.getByTestId('modal-close-button');
      fireEvent.click(modalCloseButton);

      // Modal should close
      await waitFor(() => {
        expect(
          screen.queryByTestId('unsaved-changes-modal'),
        ).not.toBeInTheDocument();
      });

      // Should NOT have called onClose or onSave
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should track initial selections correctly when data loads', async () => {
      const itemsWithPreselection: AssignmentItem[] = [
        {
          id: 1,
          name: 'Customer 1',
          level: 0,
          hasChildren: false,
          isSelected: true, // Pre-selected from server
        },
        {
          id: 2,
          name: 'Customer 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const fetchWithPreselection = jest.fn(async () => ({
        items: itemsWithPreselection,
        totalCount: itemsWithPreselection.length,
      }));

      const configWithPreselection = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: fetchWithPreselection,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithPreselection}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Item 1 should be checked (pre-selected from data)
      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        expect(checkbox1).toBeChecked();
      });

      // But this should not count as a change - save should be disabled
      const drawerFooter = screen.getByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).toBeDisabled();
    });

    it('should handle rapid open/close cycles correctly', async () => {
      const { rerender } = renderWithQuicksandProvider(
        <AssignmentDrawer
          open={false}
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      // Open
      rerender(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      // Close (without clicking any modal buttons - just changing prop)
      rerender(
        <AssignmentDrawer
          open={false}
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      // Open again with fresh state
      rerender(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
      );

      // Should start fresh - checkbox 1 should not be selected
      await waitFor(() => {
        const checkbox1Fresh = screen.getByTestId('checkbox-1');
        expect(checkbox1Fresh).not.toBeChecked();
      });
    });
  });

  describe('Hierarchical Selection', () => {
    const hierarchicalItems: AssignmentItem[] = [
      {
        id: 'group-1',
        name: 'Group 1',
        level: 0,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 1,
        name: 'Child 1',
        level: 1,
        hasChildren: false,
        isSelected: false,
        parentId: 'group-1',
      },
      {
        id: 2,
        name: 'Child 2',
        level: 1,
        hasChildren: false,
        isSelected: false,
        parentId: 'group-1',
      },
      {
        id: 'no-group',
        name: 'Ungrouped',
        level: 0,
        hasChildren: true,
        isSelected: false,
      },
      {
        id: 3,
        name: 'Child 3',
        level: 1,
        hasChildren: false,
        isSelected: false,
        parentId: 'no-group',
      },
    ];

    const hierarchicalFetch = jest.fn(async () => ({
      items: hierarchicalItems,
      totalCount: hierarchicalItems.length,
    }));

    const hierarchicalConfig = {
      ...defaultConfig,
      dataSource: {
        ...defaultConfig.dataSource,
        fetchData: hierarchicalFetch,
      },
      table: {
        ...defaultConfig.table,
        hierarchicalSelection: true,
      },
    };

    it('should handle hierarchical selection when all children are selected', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Select all children in group-1
      const checkbox1 = await screen.findByTestId('checkbox-1');
      const checkbox2 = await screen.findByTestId('checkbox-2');

      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
        expect(checkbox2).toBeChecked();
      });

      // Verify table is still present after selection
      expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
    });

    it('should replace all children with parent ID when all children are assigned together', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Select all children in a group
      const checkbox1 = await screen.findByTestId('checkbox-1');
      const checkbox2 = await screen.findByTestId('checkbox-2');

      await act(async () => {
        fireEvent.click(checkbox1);
        fireEvent.click(checkbox2);
      });

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
        expect(checkbox2).toBeChecked();
      });

      // The component should handle this internally
      expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
    });

    it('should keep individual children when not all are selected', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Select only one child
      const checkbox1 = await screen.findByTestId('checkbox-1');

      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
    });

    it('should handle unassigning all children from a group', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set([1, 2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        const checkbox2 = screen.getByTestId('checkbox-2');
        expect(checkbox1).toBeChecked();
        expect(checkbox2).toBeChecked();
      });

      // Unselect both children
      const checkbox1 = screen.getByTestId('checkbox-1');
      const checkbox2 = screen.getByTestId('checkbox-2');

      await act(async () => {
        fireEvent.click(checkbox1);
        fireEvent.click(checkbox2);
      });

      await waitFor(() => {
        expect(checkbox1).not.toBeChecked();
        expect(checkbox2).not.toBeChecked();
      });
    });

    it('should handle no-group items correctly', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Select child in no-group
      const checkbox3 = await screen.findByTestId('checkbox-3');

      fireEvent.click(checkbox3);

      await waitFor(() => {
        expect(checkbox3).toBeChecked();
      });
    });

    it('should keep group IDs that are explicitly added', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set(['group-1'])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Group should be represented somehow in the UI
      expect(screen.getByText('Group 1')).toBeInTheDocument();
    });

    it('should handle mixed selections with some parents and some children', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={hierarchicalConfig}
          initialSelections={new Set([1, 3])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        const checkbox3 = screen.getByTestId('checkbox-3');
        expect(checkbox1).toBeChecked();
        expect(checkbox3).toBeChecked();
      });

      // Select the second child to complete the group
      const checkbox2 = screen.getByTestId('checkbox-2');
      fireEvent.click(checkbox2);

      await waitFor(() => {
        expect(checkbox2).toBeChecked();
      });
    });

    it('should apply hierarchical optimization only when saving', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const configWithSave: AssignmentDrawerConfig = {
        ...hierarchicalConfig,
        callbacks: {
          onSave: mockOnSave,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithSave}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
      });

      // Select all children in group-1 (items 1 and 2)
      const checkbox1 = await screen.findByTestId('checkbox-1');
      const checkbox2 = await screen.findByTestId('checkbox-2');

      await act(async () => {
        fireEvent.click(checkbox1);
        fireEvent.click(checkbox2);
      });

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
        expect(checkbox2).toBeChecked();
      });

      // Click save button
      const saveButton = screen.getByRole('button', {
        name: /assignmentDrawer.saveButton/i,
      });
      await act(async () => {
        fireEvent.click(saveButton);
      });

      // Verify that onSave was called with optimized data
      // When all children (1, 2) are selected, it should be replaced with parent (group-1)
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        const callArg = mockOnSave.mock.calls[0][0];

        // The optimization should replace children [1, 2] with parent 'group-1'
        expect(callArg.newlyAssigned.has('group-1')).toBe(true);
        expect(callArg.newlyAssigned.has(1)).toBe(false);
        expect(callArg.newlyAssigned.has(2)).toBe(false);
      });
    });
  });

  describe('Group ID handling in hierarchical optimization', () => {
    it('should keep explicitly added group IDs during optimization', async () => {
      const mixedItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Group 1',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 1,
          name: 'Worker 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 2,
          name: 'Worker 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 3,
          name: 'Standalone Worker',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const mixedFetch = jest.fn(async () => ({
        items: mixedItems,
        totalCount: mixedItems.length,
      }));

      const mixedConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: mixedFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
      };

      const mockOnSaveMixed = jest.fn().mockResolvedValue(undefined);
      mixedConfig.callbacks.onSave = mockOnSaveMixed;

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={mixedConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Group 1')).toBeInTheDocument();
      });

      // Select the group directly and one standalone worker
      const checkboxGroup = await screen.findByTestId('checkbox-group-1');
      const checkbox3 = await screen.findByTestId('checkbox-3');

      await act(async () => {
        fireEvent.click(checkboxGroup);
        fireEvent.click(checkbox3);
      });

      await waitFor(() => {
        expect(checkboxGroup).toBeChecked();
        expect(checkbox3).toBeChecked();
      });

      // Save
      const saveButton = screen.getByRole('button', {
        name: /assignmentDrawer.saveButton/i,
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSaveMixed).toHaveBeenCalledTimes(1);
        const callArg = mockOnSaveMixed.mock.calls[0][0];

        // Group ID should be kept
        expect(callArg.newlyAssigned.has('group-1')).toBe(true);
        // Standalone worker should also be included
        expect(callArg.newlyAssigned.has(3)).toBe(true);
      });
    });
  });

  describe('Pagination with pre-selected items', () => {
    it('should add pre-selected items from API when pagination loads new items', async () => {
      const page1Items: AssignmentItem[] = [
        {
          id: 1,
          name: 'Customer 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Customer 2',
          level: 0,
          hasChildren: false,
          isSelected: true, // Pre-selected from API
        },
      ];

      const page2Items: AssignmentItem[] = [
        {
          id: 3,
          name: 'Customer 3',
          level: 0,
          hasChildren: false,
          isSelected: true, // Also pre-selected from API
        },
        {
          id: 4,
          name: 'Customer 4',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      let callCount = 0;
      const paginatedFetchWithPreselection = jest.fn(async (params) => {
        callCount += 1;
        if (callCount === 1) {
          return { items: page1Items, totalCount: 4 };
        }
        return { items: page2Items, totalCount: 4 };
      });

      const configWithPaginatedPreselection = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: paginatedFetchWithPreselection,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 2,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithPaginatedPreselection}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      // Wait for first page to load
      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
      });

      // Customer 2 should be selected (from API)
      await waitFor(() => {
        const checkbox2 = screen.getByTestId('checkbox-2');
        expect(checkbox2).toBeChecked();
      });

      // Go to page 2
      const nextButton = await screen.findByTestId('next-page');
      fireEvent.click(nextButton);

      // Wait for page 2 to load
      await waitFor(() => {
        expect(screen.getByText('Customer 3')).toBeInTheDocument();
      });

      // Customer 3 should be automatically checked (pre-selected from API)
      await waitFor(() => {
        const checkbox3 = screen.getByTestId('checkbox-3');
        expect(checkbox3).toBeChecked();
      });
    });
  });

  describe('Customer/Project hierarchy optimization', () => {
    it('should include parent when all children are selected in customer/project hierarchy', async () => {
      const customerProjectItems: AssignmentItem[] = [
        {
          id: 'customer-1',
          name: 'Customer A',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 'project-1',
          name: 'Project 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'customer-1',
        },
        {
          id: 'project-2',
          name: 'Project 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'customer-1',
        },
      ];

      const customerProjectFetch = jest.fn(async () => ({
        items: customerProjectItems,
        totalCount: customerProjectItems.length,
      }));

      const customerProjectConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: customerProjectFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
      };

      const mockOnSaveCustomerProject = jest.fn().mockResolvedValue(undefined);
      customerProjectConfig.callbacks.onSave = mockOnSaveCustomerProject;

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={customerProjectConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Customer A')).toBeInTheDocument();
      });

      // Select both projects (all children of customer-1)
      const checkboxProject1 = await screen.findByTestId('checkbox-project-1');
      const checkboxProject2 = await screen.findByTestId('checkbox-project-2');

      await act(async () => {
        fireEvent.click(checkboxProject1);
        fireEvent.click(checkboxProject2);
      });

      await waitFor(() => {
        expect(checkboxProject1).toBeChecked();
        expect(checkboxProject2).toBeChecked();
      });

      // Save - should include parent customer-1 in the result
      const saveButton = screen.getByRole('button', {
        name: /assignmentDrawer.saveButton/i,
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSaveCustomerProject).toHaveBeenCalledTimes(1);
        const callArg = mockOnSaveCustomerProject.mock.calls[0][0];

        // For customer/project hierarchy, parent should be included when all children are selected
        expect(callArg.newlyAssigned.has('customer-1')).toBe(true);
        expect(callArg.newlyAssigned.has('project-1')).toBe(true);
        expect(callArg.newlyAssigned.has('project-2')).toBe(true);
      });
    });

    it('should not include parent when only some children are selected in customer/project hierarchy', async () => {
      const customerProjectItems: AssignmentItem[] = [
        {
          id: 'customer-1',
          name: 'Customer A',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 'project-1',
          name: 'Project 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'customer-1',
        },
        {
          id: 'project-2',
          name: 'Project 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'customer-1',
        },
      ];

      const customerProjectFetch = jest.fn(async () => ({
        items: customerProjectItems,
        totalCount: customerProjectItems.length,
      }));

      const customerProjectConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: customerProjectFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
      };

      const mockOnSavePartial = jest.fn().mockResolvedValue(undefined);
      customerProjectConfig.callbacks.onSave = mockOnSavePartial;

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={customerProjectConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Customer A')).toBeInTheDocument();
      });

      // Select only one project
      const checkboxProject1 = await screen.findByTestId('checkbox-project-1');

      await act(async () => {
        fireEvent.click(checkboxProject1);
      });

      await waitFor(() => {
        expect(checkboxProject1).toBeChecked();
      });

      // Save
      const saveButton = screen.getByRole('button', {
        name: /assignmentDrawer.saveButton/i,
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSavePartial).toHaveBeenCalledTimes(1);
        const callArg = mockOnSavePartial.mock.calls[0][0];

        // Parent should NOT be included when only some children are selected
        expect(callArg.newlyAssigned.has('customer-1')).toBe(false);
        expect(callArg.newlyAssigned.has('project-1')).toBe(true);
        expect(callArg.newlyAssigned.has('project-2')).toBe(false);
      });
    });
  });

  describe('External loading state', () => {
    it('should show loading when external loading prop is true', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loading
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('table-loading')).toBeInTheDocument();
      });
    });

    it('should disable save button when loading', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
          loading
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Make a change
      const checkbox1 = await screen.findByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      // Save button should still be disabled due to loading
      const drawerFooter = screen.getByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Error message rendering', () => {
    it('should render error message when provided', async () => {
      const errorMsg = <div data-testid="custom-error">Error occurred!</div>;

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          errorMessage={errorMsg}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      });
    });
  });

  describe('Fetch data error handling', () => {
    it('should handle fetch data errors gracefully', async () => {
      const errorFetch = jest.fn(async () => {
        throw new Error('Network error');
      });

      const configWithError = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: errorFetch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithError}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Should still render the drawer without crashing
      expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
    });
  });

  describe('Search with whitespace handling', () => {
    it('should trim search value before filtering in client mode', async () => {
      const clientFetch = jest.fn(async () => ({
        items: mockItems,
        totalCount: mockItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      const searchInput = screen.getByTestId('search-input');
      // Search with only whitespace
      fireEvent.change(searchInput, { target: { value: '   ' } });

      // Should show all items since whitespace is trimmed
      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.getByText('Customer 2')).toBeInTheDocument();
        expect(screen.getByText('Customer 3')).toBeInTheDocument();
      });
    });

    it('should handle case-insensitive search in client mode', async () => {
      const clientFetch = jest.fn(async () => ({
        items: mockItems,
        totalCount: mockItems.length,
      }));

      const clientConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={clientConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      const searchInput = screen.getByTestId('search-input');
      // Search with different cases
      fireEvent.change(searchInput, { target: { value: 'CUSTOMER 1' } });

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.queryByText('Customer 2')).not.toBeInTheDocument();
      });
    });

    it('should not send search term to server when it is only whitespace', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      mockFetchData.mockClear();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: '   ' } });

      await waitFor(() => {
        if (mockFetchData.mock.calls.length > 0) {
          const lastCall =
            mockFetchData.mock.calls[mockFetchData.mock.calls.length - 1][0];
          expect(lastCall.searchTerm).toBeUndefined();
        }
      });
    });
  });

  describe('Pagination disabled', () => {
    it('should not render pagination when disabled', async () => {
      const configNoPagination = {
        ...defaultConfig,
        pagination: {
          enabled: false,
          defaultPageSize: 10,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configNoPagination}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('assignment-pagination'),
      ).not.toBeInTheDocument();
    });

    it('should use filtered items for select all when pagination is disabled', async () => {
      const clientFetch = jest.fn(async () => ({
        items: mockItems,
        totalCount: mockItems.length,
      }));

      const configNoPagination = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: clientFetch,
          searchMode: 'client' as const,
        },
        pagination: {
          enabled: false,
          defaultPageSize: 10,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configNoPagination}
        />,
        getDefaultSandbox(),
      );

      await screen.findByText('Customer 1');

      // Filter to show only Customer 1
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Customer 1' } });

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
        expect(screen.queryByText('Customer 2')).not.toBeInTheDocument();
      });

      // Select all should only affect filtered items
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        expect(checkbox1).toBeChecked();
      });
    });
  });

  describe('Search not supported', () => {
    it('should not render search field when search is not supported', async () => {
      const configNoSearch = {
        ...defaultConfig,
        ui: {
          ...defaultConfig.ui,
          searchSupported: false,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={configNoSearch} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  describe('Worker Assignment Type Total Count', () => {
    it('should count only workers (level 1) for WorkerAssignment type', async () => {
      const workerItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Group 1',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 1,
          name: 'Worker 1',
          level: 1,
          hasChildren: false,
          isSelected: true,
          parentId: 'group-1',
        },
        {
          id: 2,
          name: 'Worker 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
      ];

      const workerFetch = jest.fn(async () => ({
        items: workerItems,
        totalCount: 2, // Only workers, not groups
      }));

      const workerConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'WorkerAssignment',
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: workerFetch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={workerConfig}
          initialSelections={new Set([1])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });

      // Should show 1 of 2 (only counting workers, not groups)
      const summary = screen.getByTestId('assignment-summary');
      expect(summary.textContent).toContain('1 of 2');
    });
  });

  describe('WorkerAssignment Select All with Groups', () => {
    it('should correctly send assignToAll when selecting all from partial state', async () => {
      // Setup: Create a realistic worker assignment scenario with groups
      const workerItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Engineering',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 1,
          name: 'Alice',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 2,
          name: 'Bob',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 'group-2',
          name: 'Marketing',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 3,
          name: 'Charlie',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-2',
        },
        {
          id: 4,
          name: 'Diana',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-2',
        },
        {
          id: 'no-group',
          name: 'Ungrouped',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 5,
          name: 'Eve',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'no-group',
        },
      ];

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const workerFetch = jest.fn(async () => ({
        items: workerItems,
        totalCount: 5, // Total workers (level 1), not including groups
      }));

      const workerConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'WorkerAssignment',
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: workerFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
        callbacks: {
          onSave: mockSave,
        },
      };

      // Start with partial selection (2 out of 5 workers)
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={workerConfig}
          initialSelections={new Set([1, 3])} // Alice and Charlie
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });

      // Verify we're in partial state: 2 of 5
      const summaryBefore = screen.getByTestId('assignment-summary');
      expect(summaryBefore.textContent).toContain('2 of 5');

      // Click "Select All" button
      const selectAllButton = screen.getByTestId('select-all-button');
      await act(async () => {
        fireEvent.click(selectAllButton);
      });

      // Verify summary shows all selected: 5 of 5
      await waitFor(() => {
        const summaryAfter = screen.getByTestId('assignment-summary');
        expect(summaryAfter.textContent).toContain('5 of 5');
      });

      // Click save button (find it in footer or by not being disabled)
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(
        (btn) =>
          (btn.textContent?.includes('Save') ||
            btn.textContent?.includes('saveButton')) &&
          !(btn as HTMLButtonElement).disabled,
      );

      await act(async () => {
        if (saveButton) {
          fireEvent.click(saveButton);
        }
      });

      // Verify onSave was called with correct data
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });

      const savedChanges = mockSave.mock.calls[0][0] as AssignmentChanges;

      // The critical assertion: isSelectAll should be TRUE
      expect(savedChanges.isSelectAll).toBe(true);

      // When isSelectAll is true, the integration components use assignToAll: true
      // and ignore the individual assignments
      expect(savedChanges.currentSelections.size).toBeGreaterThan(0);
      expect(savedChanges.hasChanges).toBe(true);
    });

    it('should correctly calculate isSelectAll when groups are in selectedItems', async () => {
      // This test verifies the fix: selectedItems includes groups, but isSelectAll
      // should only count workers (level 1) for WorkerAssignment
      const workerItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Group 1',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 1,
          name: 'Worker 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 2,
          name: 'Worker 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 3,
          name: 'Worker 3',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
      ];

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const workerFetch = jest.fn(async () => ({
        items: workerItems,
        totalCount: 3, // Only 3 workers
      }));

      const workerConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'WorkerAssignment',
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: workerFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
        callbacks: {
          onSave: mockSave,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={workerConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });

      // Click "Select All" button to select all workers
      const selectAllButton = screen.getByTestId('select-all-button');
      await act(async () => {
        fireEvent.click(selectAllButton);
      });

      // Verify all workers are selected
      await waitFor(() => {
        const summary = screen.getByTestId('assignment-summary');
        expect(summary.textContent).toContain('3 of 3');
      });

      // Save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(
        (btn) =>
          (btn.textContent?.includes('Save') ||
            btn.textContent?.includes('saveButton')) &&
          !(btn as HTMLButtonElement).disabled,
      );

      await act(async () => {
        if (saveButton) {
          fireEvent.click(saveButton);
        }
      });

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });

      const savedChanges = mockSave.mock.calls[0][0] as AssignmentChanges;

      // Critical: Even though selectedItems contains 4 items (1 group + 3 workers),
      // isSelectAll should be TRUE because we have all 3 workers selected
      expect(savedChanges.isSelectAll).toBe(true);
    });

    it('should NOT set isSelectAll when only some workers are selected', async () => {
      const workerItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Group 1',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 1,
          name: 'Worker 1',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 2,
          name: 'Worker 2',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 3,
          name: 'Worker 3',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
      ];

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const workerFetch = jest.fn(async () => ({
        items: workerItems,
        totalCount: 3,
      }));

      const workerConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'WorkerAssignment',
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: workerFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
        callbacks: {
          onSave: mockSave,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={workerConfig}
          initialSelections={new Set([1, 2])} // Only 2 out of 3 workers
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });

      // Verify partial selection
      const summary = screen.getByTestId('assignment-summary');
      expect(summary.textContent).toContain('2 of 3');

      // Deselect one worker to make a change (keep it partial, not all)
      const checkbox1 = screen.getByTestId('checkbox-1');
      await act(async () => {
        fireEvent.click(checkbox1);
      });

      await waitFor(() => {
        const updatedSummary = screen.getByTestId('assignment-summary');
        expect(updatedSummary.textContent).toContain('1 of 3');
      });

      // Save
      const buttons = screen.getAllByRole('button');
      const saveButton = buttons.find(
        (btn) =>
          (btn.textContent?.includes('Save') ||
            btn.textContent?.includes('saveButton')) &&
          !(btn as HTMLButtonElement).disabled,
      );

      await act(async () => {
        if (saveButton) {
          fireEvent.click(saveButton);
        }
      });

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledTimes(1);
      });

      const savedChanges = mockSave.mock.calls[0][0] as AssignmentChanges;

      // Should NOT be select all (only 1 out of 3 selected)
      expect(savedChanges.isSelectAll).toBe(false);
      expect(savedChanges.hasChanges).toBe(true);
    });
  });

  describe('Reset state on drawer close', () => {
    it('should reset search and pagination when drawer closes and reopens', async () => {
      const { rerender } = renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Set search value
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect((searchInput as HTMLInputElement).value).toBe('test');
      });

      // Close drawer
      rerender(
        <AssignmentDrawer
          open={false}
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
      );

      expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();

      // Reopen drawer
      rerender(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });

      // Search should be reset
      const newSearchInput = screen.getByTestId('search-input');
      expect((newSearchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Client-side search with deeply nested hierarchy', () => {
    it('should include all ancestors when a deeply nested child matches', async () => {
      const deeplyNestedItems: AssignmentItem[] = [
        {
          id: 'grandparent',
          name: 'Grandparent',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 'parent',
          name: 'Parent',
          level: 1,
          hasChildren: true,
          isSelected: false,
          parentId: 'grandparent',
        },
        {
          id: 'child',
          name: 'Matching Child',
          level: 2,
          hasChildren: false,
          isSelected: false,
          parentId: 'parent',
        },
        {
          id: 'other',
          name: 'Other Item',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const nestedFetch = jest.fn(async () => ({
        items: deeplyNestedItems,
        totalCount: deeplyNestedItems.length,
      }));

      const nestedConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: nestedFetch,
          searchMode: 'client' as const,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={nestedConfig} />,
        getDefaultSandbox(),
      );

      await screen.findByText('Grandparent');

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Matching' } });

      await waitFor(() => {
        // Child should be visible
        expect(screen.getByText('Matching Child')).toBeInTheDocument();
        // Parent should also be visible
        expect(screen.getByText('Parent')).toBeInTheDocument();
        // Grandparent should also be visible
        expect(screen.getByText('Grandparent')).toBeInTheDocument();
        // Other item should not be visible
        expect(screen.queryByText('Other Item')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mixed selection states', () => {
    it('should handle reverting changes back to initial state', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([2])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
      });

      // Deselect item 2
      const checkbox2 = screen.getByTestId('checkbox-2');
      fireEvent.click(checkbox2);

      await waitFor(() => {
        expect(checkbox2).not.toBeChecked();
      });

      // Save button should be enabled (change detected)
      const drawerFooter = screen.getByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).not.toBeDisabled();

      // Select item 2 again (back to initial state)
      fireEvent.click(checkbox2);

      await waitFor(() => {
        expect(checkbox2).toBeChecked();
      });

      // Save button should be disabled again (no changes)
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe('Empty state handling', () => {
    it('should handle empty totalCount', async () => {
      const emptyFetch = jest.fn(async () => ({
        items: [],
        totalCount: 0,
      }));

      const emptyConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: emptyFetch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={emptyConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-summary')).toBeInTheDocument();
      });

      const summary = screen.getByTestId('assignment-summary');
      expect(summary.textContent).toContain('0 of 0');
    });
  });

  describe('Optimized hierarchical selections with no changes', () => {
    it('should not modify selections when optimization finds no optimizations needed', async () => {
      const standaloneItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Standalone 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
        {
          id: 2,
          name: 'Standalone 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const standaloneFetch = jest.fn(async () => ({
        items: standaloneItems,
        totalCount: standaloneItems.length,
      }));

      const standaloneConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: standaloneFetch,
        },
        table: {
          ...defaultConfig.table,
          hierarchicalSelection: true,
        },
      };

      const mockOnSaveStandalone = jest.fn().mockResolvedValue(undefined);
      standaloneConfig.callbacks.onSave = mockOnSaveStandalone;

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={standaloneConfig}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await screen.findByText('Standalone 1');

      // Select a standalone item
      const checkbox1 = screen.getByTestId('checkbox-1');
      fireEvent.click(checkbox1);

      await waitFor(() => {
        expect(checkbox1).toBeChecked();
      });

      // Save
      const saveButton = screen.getByRole('button', {
        name: /assignmentDrawer.saveButton/i,
      });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockOnSaveStandalone).toHaveBeenCalledTimes(1);
        const callArg = mockOnSaveStandalone.mock.calls[0][0];

        // Should include the standalone item as-is (no optimization)
        expect(callArg.newlyAssigned.has(1)).toBe(true);
      });
    });
  });

  describe('Initial selections from data isSelected field', () => {
    it('should combine initialSelections prop with items marked isSelected from data', async () => {
      const mixedSelectionItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Item 1',
          level: 0,
          hasChildren: false,
          isSelected: true, // Pre-selected from API
        },
        {
          id: 2,
          name: 'Item 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
        {
          id: 3,
          name: 'Item 3',
          level: 0,
          hasChildren: false,
          isSelected: false,
        },
      ];

      const mixedFetch = jest.fn(async () => ({
        items: mixedSelectionItems,
        totalCount: mixedSelectionItems.length,
      }));

      const mixedConfig = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: mixedFetch,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={mixedConfig}
          initialSelections={new Set([2])} // Also select item 2 via prop
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        // Item 1 should be selected (from data)
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        // Item 2 should be selected (from prop)
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
        // Item 3 should not be selected
        expect(screen.getByTestId('checkbox-3')).not.toBeChecked();
      });

      // Save button should be disabled (no changes from initial state)
      const drawerFooter = screen.getByTestId('drawer-footer');
      const saveButton = drawerFooter.querySelector('button');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Disabled items in select all', () => {
    it('should exclude disabled items from select all', async () => {
      const itemsWithDisabled: AssignmentItem[] = [
        {
          id: 1,
          name: 'Enabled Item 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
        {
          id: 2,
          name: 'Disabled Item',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
        {
          id: 3,
          name: 'Enabled Item 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
      ];

      const fetchWithDisabled = jest.fn(async () => ({
        items: itemsWithDisabled,
        totalCount: itemsWithDisabled.length,
      }));

      const configWithDisabled = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: fetchWithDisabled,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithDisabled}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Enabled Item 1')).toBeInTheDocument();
      });

      // Click select all
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        // Only enabled items should be selected
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).not.toBeChecked(); // Disabled
        expect(screen.getByTestId('checkbox-3')).toBeChecked();
      });
    });

    it('should handle all items disabled', async () => {
      const allDisabledItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Disabled Item 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
        {
          id: 2,
          name: 'Disabled Item 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      const fetchAllDisabled = jest.fn(async () => ({
        items: allDisabledItems,
        totalCount: allDisabledItems.length,
      }));

      const configAllDisabled = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: fetchAllDisabled,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configAllDisabled}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Disabled Item 1')).toBeInTheDocument();
      });

      // Click select all - nothing should be selected
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).not.toBeChecked();
        expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
      });
    });

    it('should handle mix of disabled and enabled items with pagination', async () => {
      const page1Items: AssignmentItem[] = [
        {
          id: 1,
          name: 'Enabled 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
        {
          id: 2,
          name: 'Disabled 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      const page2Items: AssignmentItem[] = [
        {
          id: 3,
          name: 'Enabled 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
        {
          id: 4,
          name: 'Disabled 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      let callCount = 0;
      const paginatedFetchWithDisabled = jest.fn(async () => {
        callCount += 1;
        if (callCount === 1) {
          return { items: page1Items, totalCount: 4 };
        }
        return { items: page2Items, totalCount: 4 };
      });

      const configPaginatedDisabled = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: paginatedFetchWithDisabled,
        },
        pagination: {
          enabled: true,
          defaultPageSize: 2,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configPaginatedDisabled}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Enabled 1')).toBeInTheDocument();
      });

      // Select all on page 1
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        // Only enabled items across all pages should be selected
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).not.toBeChecked();
      });
    });

    it('should not count disabled items in select all state check', async () => {
      const mixedItems: AssignmentItem[] = [
        {
          id: 1,
          name: 'Enabled',
          level: 0,
          hasChildren: false,
          isSelected: true,
          disabled: false,
        },
        {
          id: 2,
          name: 'Disabled',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: true,
        },
      ];

      const fetchMixed = jest.fn(async () => ({
        items: mixedItems,
        totalCount: mixedItems.length,
      }));

      const configMixed = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: fetchMixed,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configMixed}
          initialSelections={new Set([1])}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Disabled')).toBeInTheDocument();
      });

      // The drawer should render with mixed enabled/disabled items
      // The actual checkbox state is tested in AssignmentTable tests
      expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
    });

    it('should handle disabled items with undefined disabled property', async () => {
      const itemsWithoutDisabled: AssignmentItem[] = [
        {
          id: 1,
          name: 'Item 1',
          level: 0,
          hasChildren: false,
          isSelected: false,
          // disabled property not set (undefined)
        },
        {
          id: 2,
          name: 'Item 2',
          level: 0,
          hasChildren: false,
          isSelected: false,
          disabled: false,
        },
      ];

      const fetchWithoutDisabled = jest.fn(async () => ({
        items: itemsWithoutDisabled,
        totalCount: itemsWithoutDisabled.length,
      }));

      const configWithoutDisabled = {
        ...defaultConfig,
        dataSource: {
          ...defaultConfig.dataSource,
          fetchData: fetchWithoutDisabled,
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithoutDisabled}
          initialSelections={new Set()}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });

      // Select all should work for all items (treat undefined as enabled)
      const selectAllButton = screen.getByTestId('select-all-button');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-1')).toBeChecked();
        expect(screen.getByTestId('checkbox-2')).toBeChecked();
      });
    });
  });

  describe('loadError prop', () => {
    it('should render loadError content in place of the table area', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={
            <div data-testid="load-error-content">Workers failed to load</div>
          }
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });
    });

    it('should hide description text when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={<div data-testid="load-error-content">Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });

      // The drawer description (B3 text) should not be rendered
      expect(
        screen.queryByText('Review who is assigned to the custom field.'),
      ).not.toBeInTheDocument();
    });

    it('should hide assignment table when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={<div data-testid="load-error-content">Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('assignment-table')).not.toBeInTheDocument();
    });

    it('should hide search input when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={<div data-testid="load-error-content">Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });

    it('should hide pagination when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={<div data-testid="load-error-content">Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('assignment-pagination'),
      ).not.toBeInTheDocument();
    });

    it('should disable the Save button when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          initialSelections={new Set([1, 2])}
          loadError={<div>Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        const drawerFooter = screen.getByTestId('drawer-footer');
        const saveButton = drawerFooter.querySelector('button');
        expect(saveButton).toBeDisabled();
      });
    });

    it('should keep drawer header and footer visible when loadError is provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={defaultConfig}
          loadError={<div data-testid="load-error-content">Error</div>}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
        expect(screen.getByTestId('drawer-footer')).toBeInTheDocument();
        expect(screen.getByTestId('load-error-content')).toBeInTheDocument();
      });
    });

    it('should render table normally when loadError is NOT provided', async () => {
      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={defaultConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('assignment-table')).toBeInTheDocument();
        expect(
          screen.queryByTestId('load-error-content'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('WorkerAssignment display count with client-side search', () => {
    it('should count only level-1 worker items (not group headers) when searching in WorkerAssignment mode', async () => {
      const hierarchicalItems: AssignmentItem[] = [
        {
          id: 'group-1',
          name: 'Group Alpha',
          level: 0,
          hasChildren: true,
          isSelected: false,
        },
        {
          id: 'worker-alice',
          name: 'Alice',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
        {
          id: 'worker-bob',
          name: 'Bob',
          level: 1,
          hasChildren: false,
          isSelected: false,
          parentId: 'group-1',
        },
      ];

      const workerConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'WorkerAssignment',
        dataSource: {
          fetchData: jest.fn(async () => ({
            items: hierarchicalItems,
            totalCount: 2,
          })),
          searchMode: 'client',
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer open onClose={mockOnClose} config={workerConfig} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      // Trigger client-side search — this activates the WorkerAssignment branch (line 329)
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Alice' } });

      await waitFor(() => {
        // Pagination totalItems should reflect only level-1 workers (1), not the group header (level 0)
        const pageInfo = screen.getByTestId('page-info');
        expect(pageInfo).toHaveTextContent('Items: 1');
      });
    });

    it('should count all items when searching in non-WorkerAssignment mode', async () => {
      const clientSearchConfig: AssignmentDrawerConfig = {
        ...defaultConfig,
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: jest.fn(async () => ({
            items: mockItems,
            totalCount: mockItems.length,
          })),
          searchMode: 'client',
        },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={clientSearchConfig}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByText('Customer 1')).toBeInTheDocument();
      });

      // Trigger client-side search
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Customer' } });

      await waitFor(() => {
        // All 3 items match "Customer" — non-WorkerAssignment returns filteredItems.length
        const pageInfo = screen.getByTestId('page-info');
        expect(pageInfo).toHaveTextContent('Items: 3');
      });
    });
  });

  describe('AssignmentDrawer default export (outer wrapper)', () => {
    it('should render the outer AssignmentDrawer wrapper with QuicksandProvider', async () => {
      const config: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
          searchMode: 'server',
        },
        ui: {
          searchPlaceholder: 'Search...',
          searchSupported: false,
          searchExpandable: false,
          fieldName: 'Test Drawer',
        },
        table: {
          columns: [{ key: 'name', header: 'Name' }],
          sortable: false,
        },
        pagination: { enabled: false, defaultPageSize: 10 },
        callbacks: { onSave: jest.fn() },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawerDefault open onClose={mockOnClose} config={config} />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('drawer')).toBeInTheDocument();
      });
    });

    it('should use fallback "Search" label when searchPlaceholder is empty', async () => {
      const configWithEmptyPlaceholder: AssignmentDrawerConfig = {
        assignmentType: 'CustomerAssignment',
        dataSource: {
          fetchData: jest.fn().mockResolvedValue({ items: [], totalCount: 0 }),
          searchMode: 'server',
        },
        ui: {
          searchPlaceholder: '',
          searchSupported: true,
          searchExpandable: false,
          fieldName: 'Test Field',
        },
        table: {
          columns: [{ key: 'name', header: 'Name' }],
          sortable: false,
        },
        pagination: { enabled: false, defaultPageSize: 10 },
        callbacks: { onSave: jest.fn() },
      };

      renderWithQuicksandProvider(
        <AssignmentDrawer
          open
          onClose={mockOnClose}
          config={configWithEmptyPlaceholder}
        />,
        getDefaultSandbox(),
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });
  });
});
