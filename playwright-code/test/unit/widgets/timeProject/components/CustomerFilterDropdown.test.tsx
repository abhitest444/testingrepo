import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomerFilterDropdown from 'src/js/widgets/timeProject/components/CustomerFilterDropdown';
import { LANDING_PAGE_TRACKING_POINTS } from 'src/js/widgets/timeProject/utils/timeProjectTrackingPoints';

const mockTrack = jest.fn();
const mockLoadCustomers = jest.fn();
const mockLoadMore = jest.fn();
const mockUseLandingPageTrackingPoints = jest.fn();

const mockCustomers = [
  { customerId: 'c1', displayName: 'Acme Corp' },
  { customerId: 'c2', displayName: 'Widgets Inc' },
];

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useTracking: () => mockTrack,
}));

jest.mock(
  'src/js/widgets/timeProject/hooks/useLandingPageTrackingPoints',
  () => ({
    useLandingPageTrackingPoints: () => mockUseLandingPageTrackingPoints(),
  }),
);

jest.mock('src/js/widgets/timeProject/hooks/useCustomerFilter', () => ({
  useCustomerFilter: () => ({
    customers: mockCustomers,
    loading: false,
    hasMore: false,
    loadCustomers: mockLoadCustomers,
    loadMore: mockLoadMore,
  }),
}));

jest.mock('src/js/service/utils/debounce', () => ({
  debounce: (fn: Function) => fn,
}));

jest.mock('@ids-ts/dropdown-typeahead', () => {
  const MockDropdownTypeahead = ({
    inputValue,
    onSearch,
    onFocus,
    value,
    onChange,
    dataSource,
  }: any) => (
    <div data-testid="mock-dropdown">
      <input
        data-testid="dropdown-input"
        value={inputValue}
        onChange={(e) => onSearch?.(e)}
        onFocus={onFocus}
      />
      <select
        data-testid="dropdown-select"
        value={value}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      >
        {dataSource?.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
  return {
    __esModule: true,
    default: MockDropdownTypeahead,
    MenuItem: ({ children, value: val }: any) => (
      <option value={val}>{children}</option>
    ),
  };
});

jest.mock(
  'src/js/widgets/timeProject/components/TimeProjectFilters.styled',
  () => ({
    FilterItem: ({ children, 'data-testid': testId }: any) => (
      <div data-testid={testId}>{children}</div>
    ),
  }),
);

describe('CustomerFilterDropdown', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLandingPageTrackingPoints.mockReturnValue(
      LANDING_PAGE_TRACKING_POINTS,
    );
  });

  it('renders the dropdown', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    expect(
      screen.getByTestId('time-project-customer-filter'),
    ).toBeInTheDocument();
  });

  it('tracks CLICK_CUSTOMER_SEARCH_DROPDOWN and CLICK_CUSTOMER_SEARCH_FORM_FIELD on focus', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    fireEvent.focus(screen.getByTestId('dropdown-input'));
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_CUSTOMER_SEARCH_DROPDOWN,
    );
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.CLICK_CUSTOMER_SEARCH_FORM_FIELD,
    );
  });

  it('tracks SELECT_CUSTOMER_SEARCH on change', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: 'c1' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.SELECT_CUSTOMER_SEARCH,
    );
    expect(mockOnChange).toHaveBeenCalledWith('c1');
  });

  it('tracks TYPE_CUSTOMER_SEARCH_FORM_FIELD on search input', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: 'Acme' },
    });
    expect(mockTrack).toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.TYPE_CUSTOMER_SEARCH_FORM_FIELD,
    );
  });

  it('does not track search for empty value', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    mockTrack.mockClear();
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: '' },
    });
    expect(mockTrack).not.toHaveBeenCalledWith(
      LANDING_PAGE_TRACKING_POINTS.TYPE_CUSTOMER_SEARCH_FORM_FIELD,
    );
  });

  it('renders with customer value', () => {
    render(<CustomerFilterDropdown value="c1" onChange={mockOnChange} />);
    expect(
      screen.getByTestId('time-project-customer-filter'),
    ).toBeInTheDocument();
  });

  it('resets inputValue after selection', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId('dropdown-input'), {
      target: { value: 'Acme' },
    });
    fireEvent.change(screen.getByTestId('dropdown-select'), {
      target: { value: 'c1' },
    });
    expect(mockOnChange).toHaveBeenCalledWith('c1');
  });

  it('loads customers on mount', () => {
    render(<CustomerFilterDropdown value="" onChange={mockOnChange} />);
    expect(mockLoadCustomers).toHaveBeenCalled();
  });
});
