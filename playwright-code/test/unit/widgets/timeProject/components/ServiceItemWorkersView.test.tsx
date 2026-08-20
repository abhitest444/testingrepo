import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ServiceItemWorkersView from 'src/js/widgets/timeProject/components/ServiceItemWorkersView';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nlsMessages: Record<string, string> = require('src/nls/timeProject.json');

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, any>) => {
      let msg = nlsMessages[id] || id;
      if (values) {
        Object.entries(values).forEach(([key, val]) => {
          msg = msg.replace(`{${key}}`, String(val));
        });
      }
      return msg;
    },
  }),
}));

const mockFetchWorkerSummary = jest.fn();
const mockGoToNextPage = jest.fn();
const mockGoToPrevPage = jest.fn();
const mockUseWorkerTimeSummary = jest.fn();
let hookReturn: any = {
  workers: [],
  loading: false,
  error: false,
  page: 1,
  totalPages: 1,
  fetchWorkerSummary: mockFetchWorkerSummary,
  goToNextPage: mockGoToNextPage,
  goToPrevPage: mockGoToPrevPage,
};

jest.mock('src/js/widgets/timeProject/hooks/useWorkerTimeSummary', () => ({
  useWorkerTimeSummary: (...args: any[]) => mockUseWorkerTimeSummary(...args),
}));

jest.mock('src/js/widgets/timeProject/components/WorkerTable', () => {
  const Mock = ({ workers, loading }: any) => (
    <div data-testid="worker-table-mock">
      {loading ? 'loading' : `${workers.length} workers`}
    </div>
  );
  return { __esModule: true, default: Mock };
});

describe('ServiceItemWorkersView', () => {
  const defaultProps = {
    projectId: 'proj-1',
    customerId: 'cust-1',
    serviceItemId: 'si-2',
    serviceItemName: 'Painting',
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    hookReturn = {
      workers: [],
      loading: false,
      error: false,
      page: 1,
      totalPages: 1,
      fetchWorkerSummary: mockFetchWorkerSummary,
      goToNextPage: mockGoToNextPage,
      goToPrevPage: mockGoToPrevPage,
    };
    mockUseWorkerTimeSummary.mockImplementation(() => hookReturn);
  });

  it('should render the view container', () => {
    render(<ServiceItemWorkersView {...defaultProps} />);
    expect(screen.getByTestId('service-item-workers-view')).toBeInTheDocument();
  });

  it('should render back button with service item name', () => {
    render(<ServiceItemWorkersView {...defaultProps} />);
    const backBtn = screen.getByTestId('service-item-workers-back');
    expect(backBtn).toHaveTextContent('Back to Painting summary view');
  });

  it('should call onBack when back button is clicked', () => {
    const onBack = jest.fn();
    render(<ServiceItemWorkersView {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('service-item-workers-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should call fetchWorkerSummary with projectId, customerId and serviceItemId on mount', () => {
    render(<ServiceItemWorkersView {...defaultProps} />);
    expect(mockUseWorkerTimeSummary).toHaveBeenCalledWith(undefined);
    expect(mockFetchWorkerSummary).toHaveBeenCalledWith({
      projectId: 'proj-1',
      customerId: 'cust-1',
      serviceItemId: 'si-2',
    });
  });

  it('passes workerId into useWorkerTimeSummary when provided', () => {
    render(<ServiceItemWorkersView {...defaultProps} workerId="emp-local-1" />);
    expect(mockUseWorkerTimeSummary).toHaveBeenCalledWith('emp-local-1');
  });

  it('passes serviceItemId "-1" in the payload for Others bucket rows', () => {
    render(
      <ServiceItemWorkersView
        {...defaultProps}
        serviceItemId="-1"
        serviceItemName="Others"
      />,
    );
    expect(mockFetchWorkerSummary).toHaveBeenCalledWith({
      projectId: 'proj-1',
      customerId: 'cust-1',
      serviceItemId: '-1',
    });
  });

  it('should render the WorkerTable', () => {
    hookReturn = {
      ...hookReturn,
      workers: [
        { id: '1', displayName: 'Alice', hoursWorked: 10 },
        { id: '2', displayName: 'Bob', hoursWorked: 5 },
      ],
    };
    render(<ServiceItemWorkersView {...defaultProps} />);
    expect(screen.getByTestId('worker-table-mock')).toHaveTextContent(
      '2 workers',
    );
  });

  it('should show loading state in WorkerTable', () => {
    hookReturn = { ...hookReturn, loading: true };
    render(<ServiceItemWorkersView {...defaultProps} />);
    expect(screen.getByTestId('worker-table-mock')).toHaveTextContent(
      'loading',
    );
  });
});
