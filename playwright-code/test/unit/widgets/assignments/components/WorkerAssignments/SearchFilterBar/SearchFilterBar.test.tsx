import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilterBar } from '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/SearchFilterBar';
import { WorkerType } from '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';

// Mock tracking
const mockTrack = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage: string;
    }) => defaultMessage,
  }),
  useSandbox: () => ({ logger: mockLogger }),
  useTracking: () => mockTrack,
}));

// Mock IDS Dropdown
jest.mock('@ids-ts/dropdown', () => {
  const React = require('react');
  const Dropdown = ({
    value,
    onChange,
    label,
    children,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: any) => (
    <div>
      <label htmlFor="dropdown-select">{label}</label>
      <select
        id="dropdown-select"
        data-testid={dataTestId}
        aria-label={ariaLabel}
        role="combobox"
        value={value}
        onChange={(e) => onChange(e)}
      >
        {React.Children.map(children, (child: any) =>
          React.isValidElement(child) ? (
            <option key={child.props.value} value={child.props.value}>
              {child.props.children}
            </option>
          ) : null,
        )}
      </select>
    </div>
  );

  const MenuItem = ({ children, value }: any) => (
    <option value={value}>{children}</option>
  );

  return {
    __esModule: true,
    default: Dropdown,
    Dropdown,
    MenuItem,
  };
});

// Mock SearchField component
jest.mock('src/js/widgets/common/SearchField', () => ({
  SearchField: ({ value, onChange, label }: any) => (
    <input
      data-testid="worker-search-input"
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={label || 'Search'}
      aria-label={label || 'Search'}
    />
  ),
}));

// Mock ViewToggle component to match QBDS Toggle structure
jest.mock(
  '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/ViewToggle',
  () => ({
    ViewToggle: ({ checked, onChange }: any) => (
      <div data-testid="view-toggle">
        <input
          type="checkbox"
          data-testid="view-toggle-checkbox"
          checked={checked}
          onChange={(e: any) => onChange(e.target.checked)}
          aria-label="Toggle view by groups"
        />
      </div>
    ),
  }),
);

describe('SearchFilterBar', () => {
  const defaultProps = {
    searchText: '',
    onSearchChange: jest.fn(),
    workerType: WorkerType.ALL,
    onWorkerTypeChange: jest.fn(),
    viewByGroups: true,
    onViewToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
    mockLogger.info.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    it('should render search and toggle in groups view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups />);

      // Worker type filter should NOT be visible in groups view
      expect(
        screen.queryByTestId('worker-type-filter'),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('worker-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    });

    it('should render all three components in workers view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      // Worker type filter should be visible in workers view
      expect(screen.getByTestId('worker-type-filter')).toBeInTheDocument();
      expect(screen.getByTestId('worker-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    });

    it('should render WorkerTypeFilter with correct value in workers view', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          viewByGroups={false}
          workerType={WorkerType.EMPLOYEE}
        />,
      );

      const filter = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;
      expect(filter.value).toBe(WorkerType.EMPLOYEE);
    });

    it('should render SearchInput with correct value', () => {
      render(<SearchFilterBar {...defaultProps} searchText="John Doe" />);

      const input = screen.getByDisplayValue('John Doe');
      expect(input).toBeInTheDocument();
    });

    it('should render ViewToggle with correct checked state', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      const toggle = screen.getByTestId('view-toggle');
      const checkbox = toggle.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
    });
  });

  describe('Component Layout', () => {
    it('should render filter and search in left section in workers view', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} viewByGroups={false} />,
      );

      const filter = screen.getByTestId('worker-type-filter');
      const search = screen.getByTestId('worker-search-input');

      expect(filter).toBeInTheDocument();
      expect(search).toBeInTheDocument();
    });

    it('should render only search in left section in groups view', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} viewByGroups />,
      );

      const search = screen.getByTestId('worker-search-input');
      expect(search).toBeInTheDocument();
      expect(
        screen.queryByTestId('worker-type-filter'),
      ).not.toBeInTheDocument();
    });

    it('should render toggle in right section', () => {
      render(<SearchFilterBar {...defaultProps} />);

      const toggle = screen.getByTestId('view-toggle');
      expect(toggle).toBeInTheDocument();
    });

    it('should have proper spacing between components', () => {
      const { container } = render(<SearchFilterBar {...defaultProps} />);

      const searchFilterBarContainer = container.firstChild;
      expect(searchFilterBarContainer).toHaveStyle({ display: 'flex' });
    });
  });

  describe('Interactions - Search', () => {
    it('should call onSearchChange when search input changes', () => {
      render(<SearchFilterBar {...defaultProps} />);

      const input = screen.getByTestId('worker-search-input');
      fireEvent.change(input, { target: { value: 'Jane Smith' } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('Jane Smith');
      expect(defaultProps.onSearchChange).toHaveBeenCalledTimes(1);
    });

    it('should handle clearing search input', () => {
      render(<SearchFilterBar {...defaultProps} searchText="John" />);

      const input = screen.getByTestId('worker-search-input');
      fireEvent.change(input, { target: { value: '' } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Interactions - Filter', () => {
    it('should render filter with proper structure in workers view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      const filter = screen.getByTestId('worker-type-filter');
      expect(filter).toBeInTheDocument();
      expect(filter).toHaveAttribute('role', 'combobox');
    });

    it('should not render filter in groups view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups />);

      expect(
        screen.queryByTestId('worker-type-filter'),
      ).not.toBeInTheDocument();
    });

    it('should pass workerType prop to WorkerTypeFilter in workers view', () => {
      render(
        <SearchFilterBar
          {...defaultProps}
          viewByGroups={false}
          workerType={WorkerType.VENDOR}
        />,
      );

      const filter = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLInputElement;
      expect(filter.value).toBe(WorkerType.VENDOR);
    });
  });

  describe('Interactions - Toggle', () => {
    it('should call onViewToggle when toggle is clicked', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      const checkbox = screen.getByTestId('view-toggle-checkbox');

      fireEvent.click(checkbox);

      expect(defaultProps.onViewToggle).toHaveBeenCalledWith(true);
      expect(defaultProps.onViewToggle).toHaveBeenCalledTimes(1);
    });

    it('should handle toggling off', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups />);

      const checkbox = screen.getByTestId('view-toggle-checkbox');

      fireEvent.click(checkbox);

      expect(defaultProps.onViewToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Props Passing', () => {
    it('should pass all props correctly to child components', () => {
      const customProps = {
        searchText: 'Test Search',
        onSearchChange: jest.fn(),
        workerType: WorkerType.VENDOR,
        onWorkerTypeChange: jest.fn(),
        viewByGroups: false,
        onViewToggle: jest.fn(),
      };

      render(<SearchFilterBar {...customProps} />);

      expect(screen.getByDisplayValue('Test Search')).toBeInTheDocument();

      const filter = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLInputElement;
      expect(filter.value).toBe(WorkerType.VENDOR);

      const toggle = screen.getByTestId('view-toggle');
      const checkbox = toggle.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should render all components together', () => {
      const props = {
        searchText: 'Test',
        onSearchChange: jest.fn(),
        workerType: WorkerType.EMPLOYEE,
        onWorkerTypeChange: jest.fn(),
        viewByGroups: false,
        onViewToggle: jest.fn(),
      };

      render(<SearchFilterBar {...props} />);

      // Verify all components render with correct values
      const input = screen.getByDisplayValue('Test');
      expect(input).toBeInTheDocument();

      const filter = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLInputElement;
      expect(filter.value).toBe(WorkerType.EMPLOYEE);

      const toggle = screen.getByTestId('view-toggle');
      const checkbox = toggle.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
    });

    it('should handle search input changes', () => {
      const props = {
        searchText: '',
        onSearchChange: jest.fn(),
        workerType: WorkerType.ALL,
        onWorkerTypeChange: jest.fn(),
        viewByGroups: true,
        onViewToggle: jest.fn(),
      };

      render(<SearchFilterBar {...props} />);

      const input = screen.getByTestId('worker-search-input');
      fireEvent.change(input, { target: { value: 'Test' } });

      expect(props.onSearchChange).toHaveBeenCalledWith('Test');
    });

    it('should handle toggle interactions', () => {
      const props = {
        searchText: '',
        onSearchChange: jest.fn(),
        workerType: WorkerType.ALL,
        onWorkerTypeChange: jest.fn(),
        viewByGroups: true,
        onViewToggle: jest.fn(),
      };

      render(<SearchFilterBar {...props} />);

      const checkbox = screen.getByTestId('view-toggle-checkbox');

      fireEvent.click(checkbox);

      expect(props.onViewToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have all components keyboard accessible in workers view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      const input = screen.getByTestId('worker-search-input');
      const filter = screen.getByTestId('worker-type-filter');
      const toggleCheckbox = screen.getByTestId('view-toggle-checkbox');

      input.focus();
      expect(input).toHaveFocus();

      filter.focus();
      expect(filter).toHaveFocus();

      toggleCheckbox.focus();
      expect(toggleCheckbox).toHaveFocus();
    });

    it('should have search and toggle keyboard accessible in groups view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups />);

      const input = screen.getByTestId('worker-search-input');
      const toggleCheckbox = screen.getByTestId('view-toggle-checkbox');

      input.focus();
      expect(input).toHaveFocus();

      toggleCheckbox.focus();
      expect(toggleCheckbox).toHaveFocus();
    });

    it('should have proper ARIA labels in workers view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups={false} />);

      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Toggle view by groups'),
      ).toBeInTheDocument();
    });

    it('should have proper ARIA labels in groups view', () => {
      render(<SearchFilterBar {...defaultProps} viewByGroups />);

      expect(screen.getByLabelText('Search groups')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Toggle view by groups'),
      ).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should maintain proper component hierarchy in workers view', () => {
      const { container } = render(
        <SearchFilterBar {...defaultProps} viewByGroups={false} />,
      );

      const searchFilterBar = container.firstChild;
      expect(searchFilterBar).toBeInTheDocument();

      const filter = screen.getByTestId('worker-type-filter');
      const search = screen.getByTestId('worker-search-input');
      const toggle = screen.getByTestId('view-toggle');

      expect(filter).toBeInTheDocument();
      expect(search).toBeInTheDocument();
      expect(toggle).toBeInTheDocument();
    });
  });
});
