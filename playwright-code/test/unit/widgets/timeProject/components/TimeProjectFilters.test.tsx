import React from 'react';
import { render, screen } from '@testing-library/react';
import TimeProjectFilters from 'src/js/widgets/timeProject/components/TimeProjectFilters';

const mockOnStatusChange = jest.fn();
const mockOnCustomerChange = jest.fn();
const mockOnSearchChange = jest.fn();
const mockOnProjectSelect = jest.fn();
const mockOnSearchSubmit = jest.fn();
const mockOnSearchClear = jest.fn();
const mockOnDueDateChange = jest.fn();

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useTracking: () => jest.fn(),
}));

jest.mock(
  'src/js/widgets/timeProject/components/StatusFilterDropdown',
  () =>
    ({ isWorkflowApiEnabled, isAccountant }: any) =>
      (
        <div
          data-testid="status-filter"
          data-workflow={String(isWorkflowApiEnabled)}
          data-accountant={String(isAccountant)}
        />
      ),
);

jest.mock(
  'src/js/widgets/timeProject/components/CustomerFilterDropdown',
  () => () => <div data-testid="customer-filter" />,
);

jest.mock(
  'src/js/widgets/timeProject/components/ProjectSearchInput',
  () => () => <div data-testid="project-search-input" />,
);

jest.mock(
  'src/js/widgets/timeProject/components/ProjectSearchTypeahead',
  () => () => <div data-testid="project-search-typeahead" />,
);

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectFilters.styled',
  () => ({
    FiltersContainer: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/timeProject/components/DueDateFilterDropdown',
  () => () => <div data-testid="due-date-filter" />,
);

jest.mock('src/js/widgets/timeProject/hooks/useProjectNameSearch', () => ({}));

const defaultProps = {
  statusFilter: 'ALL',
  customerFilter: '',
  searchText: '',
  isWorkflowApiEnabled: false,
  isAccountant: false,
  dueDateRange: null,
  onStatusChange: mockOnStatusChange,
  onCustomerChange: mockOnCustomerChange,
  onSearchChange: mockOnSearchChange,
  onProjectSelect: mockOnProjectSelect,
  onSearchSubmit: mockOnSearchSubmit,
  onSearchClear: mockOnSearchClear,
  onDueDateChange: mockOnDueDateChange,
};

describe('TimeProjectFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the filters container', () => {
    render(<TimeProjectFilters {...defaultProps} />);
    expect(screen.getByTestId('time-project-filters')).toBeInTheDocument();
  });

  it('renders StatusFilterDropdown, CustomerFilterDropdown and ProjectSearchInput when workflow is disabled', () => {
    render(
      <TimeProjectFilters {...defaultProps} isWorkflowApiEnabled={false} />,
    );
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    expect(screen.getByTestId('customer-filter')).toBeInTheDocument();
    expect(screen.getByTestId('project-search-input')).toBeInTheDocument();
    expect(
      screen.queryByTestId('project-search-typeahead'),
    ).not.toBeInTheDocument();
  });

  it('renders ProjectSearchTypeahead instead of ProjectSearchInput when workflow is enabled', () => {
    render(<TimeProjectFilters {...defaultProps} isWorkflowApiEnabled />);
    expect(screen.getByTestId('project-search-typeahead')).toBeInTheDocument();
    expect(
      screen.queryByTestId('project-search-input'),
    ).not.toBeInTheDocument();
  });

  it('passes isWorkflowApiEnabled=true to StatusFilterDropdown', () => {
    render(<TimeProjectFilters {...defaultProps} isWorkflowApiEnabled />);
    expect(screen.getByTestId('status-filter')).toHaveAttribute(
      'data-workflow',
      'true',
    );
  });

  it('passes isAccountant=true to StatusFilterDropdown for QBOA users', () => {
    render(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled
        isAccountant
      />,
    );
    expect(screen.getByTestId('status-filter')).toHaveAttribute(
      'data-accountant',
      'true',
    );
  });

  it('passes isAccountant=false to StatusFilterDropdown for QBO users', () => {
    render(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled
        isAccountant={false}
      />,
    );
    expect(screen.getByTestId('status-filter')).toHaveAttribute(
      'data-accountant',
      'false',
    );
  });

  it('renders DueDateFilterDropdown only when both isWorkflowApiEnabled and isAccountant are true', () => {
    const { rerender } = render(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled
        isAccountant
      />,
    );
    expect(screen.getByTestId('due-date-filter')).toBeInTheDocument();

    rerender(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled
        isAccountant={false}
      />,
    );
    expect(screen.queryByTestId('due-date-filter')).not.toBeInTheDocument();

    rerender(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled={false}
        isAccountant
      />,
    );
    expect(screen.queryByTestId('due-date-filter')).not.toBeInTheDocument();

    rerender(
      <TimeProjectFilters
        {...defaultProps}
        isWorkflowApiEnabled={false}
        isAccountant={false}
      />,
    );
    expect(screen.queryByTestId('due-date-filter')).not.toBeInTheDocument();
  });
});
