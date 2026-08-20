import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import RecentTimeActivitiesModal, {
  RecentTimeActivitiesModalProps,
} from 'src/js/widgets/common/RecentTimeActivitiesModal';
import { useSearchTransactionTimeEntries } from 'src/js/service/hooks/timeEntries/useSearchTimeEntries';
import { TimeTracking_TimeEntryOrderOn } from 'src/__generated__/timeTracking/graphql';
import { useGetCustomerData } from 'src/js/service/hooks/customer/useGetCustomerData';
import {
  useCurrencyFormat,
  useSandboxNavigate,
} from 'src/js/service/utils/sandboxUtils';

jest.mock('src/js/service/hooks/timeEntries/useSearchTimeEntries', () => ({
  __esModule: true,
  ...jest.requireActual<
    typeof import('src/js/service/hooks/timeEntries/useSearchTimeEntries')
  >('src/js/service/hooks/timeEntries/useSearchTimeEntries'),
  useSearchTransactionTimeEntries: jest.fn(),
}));
jest.mock('src/js/service/hooks/customer/useGetCustomerData');
jest.mock('src/js/service/utils/sandboxUtils');

const renderComponent = (
  props: Partial<RecentTimeActivitiesModalProps> = {},
) => {
  const defaultProps: RecentTimeActivitiesModalProps = {
    open: true,
    onClose: jest.fn(),
    onSelect: jest.fn(),
  };

  return renderWithQuicksandProvider(
    <RecentTimeActivitiesModal {...defaultProps} {...props} />,
  );
};

describe('RecentTimeActivitiesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockCurrencyFormat = jest.fn((amount) => `$${amount.toFixed(2)}`);
    const mockNavigate = jest.fn();
    (useCurrencyFormat as jest.Mock).mockReturnValue((amount: number) =>
      mockCurrencyFormat(amount),
    );
    (useSandboxNavigate as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: '1',
          date: '2023-10-01',
          billableRate: 100,
          duration: 3600,
          isExported: true,
          timeAgainst: { customer: { id: 'customer1' } },
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [{ id: 'customer1', fullName: 'Customer One' }],
    });
  });

  it('should render all text elements correctly', () => {
    renderComponent();
    expect(
      screen.getByText(/history.recent.time.activites/),
    ).toBeInTheDocument();
    expect(screen.getByText(/time.charge/)).toBeInTheDocument();
    expect(screen.getByText(/history.view.more/)).toBeInTheDocument();
  });

  it('should render recent time activities', () => {
    renderComponent();
    expect(screen.getByText(/time.charge/)).toBeInTheDocument();
    expect(screen.getByText('2023-10-01')).toBeInTheDocument();
    expect(screen.getByText('Customer One')).toBeInTheDocument();
  });

  it('should render recent time activities only if data is available', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: null,
    });
    renderComponent();
    expect(screen.getByRole('table')).toBeEmptyDOMElement();
  });

  it('should call onSelect and onClose when "View More" button is clicked', () => {
    const handleOnClose = jest.fn();
    const handleOnSelect = jest.fn();
    renderComponent({ onClose: handleOnClose, onSelect: handleOnSelect });
    fireEvent.click(screen.getByText(/history.view.more/));
    expect(handleOnSelect).toHaveBeenCalledWith(undefined);
    expect(handleOnClose).toHaveBeenCalledWith(null);
  });

  it('should call onSelect with id when a table row is clicked', () => {
    const handleOnSelect = jest.fn();
    renderComponent({ onSelect: handleOnSelect });
    fireEvent.click(screen.getByText('Customer One'));
    expect(handleOnSelect).toHaveBeenCalledWith('1');
  });

  test.each([
    {
      description: 'renders "-" when customer does not have a full name',
      mockData: [{ id: 'customer1', fullName: '' }],
    },
    {
      description: 'renders "-" when customer is not found',
      mockData: [],
    },
  ])('should $description', ({ mockData }) => {
    (useGetCustomerData as jest.Mock).mockReturnValue({ data: mockData });
    renderComponent();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should render with isTimeActivity prop set to true', () => {
    renderComponent({ isTimeActivity: true });
    expect(
      screen.getByText(/history.recent.time.activites/),
    ).toBeInTheDocument();
  });

  it('should pass CreatedTime sort when time activity and primary data source flag are enabled', () => {
    renderComponent({
      isTimeActivity: true,
      isTimeEntryPrimaryDataSourceEnabled: true,
    });
    const searchArgs = (useSearchTransactionTimeEntries as jest.Mock).mock
      .calls[0][0];
    expect(searchArgs.input.orderBy[0].orderOn).toBe(
      TimeTracking_TimeEntryOrderOn.CreatedTime,
    );
  });

  it('should pass TimeEntryId sort when primary data source flag is off for time activity', () => {
    renderComponent({
      isTimeActivity: true,
      isTimeEntryPrimaryDataSourceEnabled: false,
    });
    const searchArgs = (useSearchTransactionTimeEntries as jest.Mock).mock
      .calls[0][0];
    expect(searchArgs.input.orderBy[0].orderOn).toBe(
      TimeTracking_TimeEntryOrderOn.TimeEntryId,
    );
  });

  it('should pass TimeEntryId sort when not time activity even if primary data source flag is on', () => {
    renderComponent({
      isTimeActivity: false,
      isTimeEntryPrimaryDataSourceEnabled: true,
    });
    const searchArgs = (useSearchTransactionTimeEntries as jest.Mock).mock
      .calls[0][0];
    expect(searchArgs.input.orderBy[0].orderOn).toBe(
      TimeTracking_TimeEntryOrderOn.TimeEntryId,
    );
  });

  it('should render with timeTrackingOnlyId prop', () => {
    renderComponent({ timeTrackingOnlyId: 'tracking-only-123' });
    expect(
      screen.getByText(/history.recent.time.activites/),
    ).toBeInTheDocument();
  });

  it('should handle transaction without customer in timeAgainst', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: '2',
          date: '2023-10-02',
          billableRate: 50,
          duration: 1800,
          isExported: false,
          timeAgainst: { customer: null },
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [],
    });
    renderComponent();
    expect(screen.getByText('2023-10-02')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should display time.entry for non-exported transactions', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: '3',
          date: '2023-10-03',
          billableRate: 75,
          duration: 7200,
          isExported: false,
          timeAgainst: { customer: { id: 'customer2' } },
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [{ id: 'customer2', fullName: 'Customer Two' }],
    });
    renderComponent();
    expect(screen.getByText(/time.entry/)).toBeInTheDocument();
  });

  it('should handle transaction with undefined id', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: undefined,
          date: '2023-10-04',
          billableRate: 100,
          duration: 3600,
          isExported: true,
          timeAgainst: { customer: { id: 'customer3' } },
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [{ id: 'customer3', fullName: 'Customer Three' }],
    });
    renderComponent();
    expect(screen.getByText('2023-10-04')).toBeInTheDocument();
  });

  it('should call onSelect with undefined when transaction has no id', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: null,
          date: '2023-10-05',
          billableRate: 100,
          duration: 3600,
          isExported: true,
          timeAgainst: { customer: { id: 'customer4' } },
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [{ id: 'customer4', fullName: 'Customer Four' }],
    });
    const handleOnSelect = jest.fn();
    renderComponent({ onSelect: handleOnSelect });
    fireEvent.click(screen.getByText('Customer Four'));
    expect(handleOnSelect).toHaveBeenCalledWith(undefined);
  });

  it('should filter out transactions without customer id in customerIds', () => {
    (useSearchTransactionTimeEntries as jest.Mock).mockReturnValue({
      data: [
        {
          id: '1',
          date: '2023-10-01',
          billableRate: 100,
          duration: 3600,
          isExported: true,
          timeAgainst: { customer: { id: 'customer1' } },
        },
        {
          id: '2',
          date: '2023-10-02',
          billableRate: 50,
          duration: 1800,
          isExported: false,
          timeAgainst: { customer: undefined },
        },
        {
          id: '3',
          date: '2023-10-03',
          billableRate: 75,
          duration: 2700,
          isExported: true,
          timeAgainst: {},
        },
      ],
    });
    (useGetCustomerData as jest.Mock).mockReturnValue({
      data: [{ id: 'customer1', fullName: 'Customer One' }],
    });
    renderComponent();
    expect(screen.getByText('Customer One')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });
});
