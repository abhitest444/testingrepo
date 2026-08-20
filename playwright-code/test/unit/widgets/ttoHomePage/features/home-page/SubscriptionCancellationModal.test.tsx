import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import SubscriptionCancellationModal from 'src/js/widgets/ttoHomePage/features/home-page/SubscriptionCancellationModal';
import { NeoApiClient } from 'src/js/service/rest/NeoApiClient';
import {
  renderWithAllAppProviders,
  getDefaultSandbox,
} from 'test/unit/testUtils';

jest.mock('src/js/service/rest/NeoApiClient', () => ({
  NeoApiClient: jest.fn(),
}));

const mockLogger = { error: jest.fn() };

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: jest.fn().mockReturnValue({
    formatMessage: jest.fn((...args) => {
      const { id } = (args[0] || {}) as any;
      if (id === 'company_data_delete_message') {
        return 'Your company data will be deleted on 7/1/2024';
      }
      if (id === 'subscription_canceled') {
        return 'Subscription canceled';
      }
      if (id === 'company_data_no_change_message') {
        return 'No changes to your data.';
      }
      if (id === 'company_cancel_change_mind') {
        return 'Changed your mind?';
      }
      if (id === 'close') {
        return 'Close';
      }
      return id;
    }),
  }),
}));

describe('SubscriptionCancellationModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.clearAllMocks();
  });

  it('renders and opens modal when showCancelDialog is true', async () => {
    const mockData = {
      showCancelDialog: true,
      companyDeleteDate: '2024-07-01T00:00:00Z',
    };
    (NeoApiClient as jest.Mock).mockResolvedValueOnce(mockData);
    renderWithAllAppProviders(<SubscriptionCancellationModal />);
    await waitFor(() => {
      expect(
        screen.getByTestId('subscription-cancellation-modal-dialog'),
      ).toBeVisible();
    });
    expect(screen.getByText('Subscription canceled')).toBeInTheDocument();
    expect(
      screen.getByText('Your company data will be deleted on 7/1/2024'),
    ).toBeInTheDocument();
    expect(screen.getByText('No changes to your data.')).toBeInTheDocument();
    expect(screen.getByText('Changed your mind?')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('does not open modal when showCancelDialog is false', async () => {
    const mockData = { showCancelDialog: false };
    (NeoApiClient as jest.Mock).mockResolvedValueOnce(mockData);
    renderWithAllAppProviders(<SubscriptionCancellationModal />);
    await waitFor(() => {
      expect(
        screen.queryByTestId('subscription-cancellation-modal-dialog'),
      ).not.toBeInTheDocument();
    });
  });

  it('closes modal on button click', async () => {
    const mockData = { showCancelDialog: true };
    (NeoApiClient as jest.Mock).mockResolvedValueOnce(mockData);
    renderWithAllAppProviders(<SubscriptionCancellationModal />);
    await waitFor(() => {
      expect(
        screen.getByTestId('subscription-cancellation-modal-dialog'),
      ).toBeVisible();
    });
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('subscription-cancellation-modal-dialog'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('logs error if NeoApiClient fails', async () => {
    (NeoApiClient as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const sandbox = getDefaultSandbox();
    const errorSpy = jest.spyOn(sandbox.logger, 'error');
    renderWithAllAppProviders(
      <SubscriptionCancellationModal />,
      [],
      {},
      sandbox,
    );
    await waitFor(
      () => {
        expect(errorSpy).toHaveBeenCalledWith(
          '[timeTrackingOnly] Failed to fetch subscription info',
          expect.objectContaining({
            error: 'fail',
          }),
        );
      },
      { timeout: 3000 },
    );
  });
});
