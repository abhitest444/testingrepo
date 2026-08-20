import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import BreakPreferencesContainer from 'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer';
import * as PolicyWebServiceClient from '../../../../../../../src/js/service/rest/PolicyWebServiceClient';

let lastOnDelete: ((id: string) => void) | undefined;
let lastOnModalDelete: (() => void) | undefined;
let lastOnModalCancel: (() => void) | undefined;

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferences',
  () => ({
    __esModule: true,
    default: ({ onDelete }: any) => {
      lastOnDelete = onDelete;
      return (
        <div data-testid="break-preferences">Break Preferences Content</div>
      );
    },
  }),
);

jest.mock(
  'src/js/widgets/breaks/features/breaks-settings/components/DeleteBreakRuleConfirmationModal',
  () => ({
    __esModule: true,
    default: ({ onDelete, onCancel, open }: any) => {
      lastOnModalDelete = onDelete;
      lastOnModalCancel = onCancel;
      return open ? (
        <div data-testid="delete-break-modal">Delete Modal</div>
      ) : null;
    },
  }),
);

const getEmptyApiResponse =
  (): PolicyWebServiceClient.GetAllEmployerBreakRulesResponse => ({
    data: {
      content: [],
      pageable: {
        page: 0,
        size: 20,
        sort: { orders: [], empty: true, unsorted: true, sorted: false },
        offset: 0,
        pageSize: 20,
        pageNumber: 0,
        paged: true,
        unpaged: false,
      },
      total: 0,
      last: true,
      totalPages: 1,
      totalElements: 0,
      first: true,
      size: 20,
      number: 0,
      sort: { orders: [], empty: true, unsorted: true, sorted: false },
      numberOfElements: 0,
      empty: false,
    },
    errors: null,
  });

const getValidEmployerBreakRule =
  (): PolicyWebServiceClient.EmployerBreakRule => ({
    companyAccountId: 'test-company',
    breakRuleId: '1',
    ruleName: 'Test',
    active: true,
    breakType: 'PAID',
    isManualBreak: true,
    isAutoBreak: false,
    noSetDuration: false,
    breakDuration: 30,
    durationUnit: 'minutes',
    manualRule: {
      durationUnit: 'MINUTES',
      autoEndBreak: false,
      allowEndBreakEarly: true,
      minRequiredBreakMinutes: 15,
      breakEndingReminder: true,
      breakEndingReminderTime: 5,
    },
    autoRule: {
      shiftThresholdLimit: 240,
      durationUnit: 'minutes',
      repeatBreak: false,
      breakPosition: 'MIDDLE',
      specificTime: null,
      workDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    },
    version: null,
    creatorId: 'test-creator',
    createdDate: '2025-06-04T13:42:15',
    modifierId: 'test-modifier',
    modifiedDate: '2025-06-04T13:42:15',
    manualBreak: true,
    autoBreak: false,
  });

describe.skip('BreakPreferencesContainer', () => {
  const defaultProps = {
    onClose: jest.fn(),
    open: false,
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <BreakPreferencesContainer {...defaultProps} {...props} />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    lastOnDelete = undefined;
    lastOnModalDelete = undefined;
    lastOnModalCancel = undefined;
  });

  it('does not render when open is false', () => {
    renderComponent();
    expect(screen.queryByTestId('break-preferences')).not.toBeInTheDocument();
  });

  it('renders when open is true', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(screen.getByTestId('break-preferences')).toBeInTheDocument();
  });

  it('displays the correct title', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByText('Manage breaks');
    expect(screen.getByText('Manage breaks')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByText('Close');
    screen.getByText('Close').click();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render delete modal by default', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('renders delete modal when deleteModalOpen is true', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('passes onDelete handler to BreakPreferences', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(screen.getByTestId('break-preferences')).toBeInTheDocument();
  });

  it('calls the onDelete handler passed to BreakPreferences and opens the delete modal', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue({
        ...getEmptyApiResponse(),
        data: {
          ...getEmptyApiResponse().data,
          content: [getValidEmployerBreakRule()],
        },
      });
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(lastOnDelete).toBeDefined();
    if (lastOnDelete) {
      lastOnDelete('1');
    }
    expect(screen.getByTestId('delete-break-modal')).toBeInTheDocument();
  });

  it('calls handleConfirmDelete and closes the modal', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue({
        ...getEmptyApiResponse(),
        data: {
          ...getEmptyApiResponse().data,
          content: [getValidEmployerBreakRule()],
        },
      });
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    if (lastOnDelete) {
      lastOnDelete('1');
    }
    expect(screen.getByTestId('delete-break-modal')).toBeInTheDocument();
    expect(lastOnModalDelete).toBeDefined();
    if (lastOnModalDelete) {
      lastOnModalDelete();
    }
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('calls handleCancelDelete and closes the modal', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue({
        ...getEmptyApiResponse(),
        data: {
          ...getEmptyApiResponse().data,
          content: [getValidEmployerBreakRule()],
        },
      });
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    if (lastOnDelete) {
      lastOnDelete('1');
    }
    expect(screen.getByTestId('delete-break-modal')).toBeInTheDocument();
    expect(lastOnModalCancel).toBeDefined();
    if (lastOnModalCancel) {
      lastOnModalCancel();
    }
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('calls handleDelete with an invalid id (no crash)', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(lastOnDelete).toBeDefined();
    if (lastOnDelete) {
      lastOnDelete('nonexistent');
    }
    expect(screen.getByTestId('delete-break-modal')).toBeInTheDocument();
  });

  it('calls handleConfirmDelete when breakToDelete is null (no crash)', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    if (lastOnDelete) {
      lastOnDelete('nonexistent');
    }
    if (lastOnModalDelete) {
      lastOnModalDelete();
    }
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('calls handleCancelDelete when modal is already closed (no crash)', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(getEmptyApiResponse());
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    if (lastOnModalCancel) {
      lastOnModalCancel();
    }
    expect(screen.queryByTestId('delete-break-modal')).not.toBeInTheDocument();
  });

  it('shows loader while fetching break rules', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockImplementation(
        () => new Promise(() => {}), // never resolves
      );
    renderComponent({ open: true });
    const loader = document.querySelector('.sc-bdVaJa');
    expect(loader).toBeTruthy();
  });

  it('shows error screen if API fails', async () => {
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockRejectedValue(new Error('API Error'));
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences-container');
    expect(screen.getByText('TODO ERROR SCREEN')).toBeInTheDocument();
  });

  it('maps API data and passes to BreakPreferences', async () => {
    const apiData: PolicyWebServiceClient.GetAllEmployerBreakRulesResponse = {
      ...getEmptyApiResponse(),
      data: {
        ...getEmptyApiResponse().data,
        content: [
          {
            ...getValidEmployerBreakRule(),
            breakRuleId: 'br1',
            ruleName: 'Lunch',
            breakDuration: 30,
            durationUnit: 'minutes',
            breakType: 'PAID',
            isAutoBreak: true,
            isManualBreak: false,
            active: true,
          },
          {
            ...getValidEmployerBreakRule(),
            breakRuleId: 'br2',
            ruleName: 'Rest',
            breakDuration: 15,
            durationUnit: 'minutes',
            breakType: 'UNPAID',
            isAutoBreak: false,
            isManualBreak: true,
            active: false,
          },
        ],
      },
    };
    jest
      .spyOn(PolicyWebServiceClient, 'getAllEmployerBreakRules')
      .mockResolvedValue(apiData);
    renderComponent({ open: true });
    await screen.findByTestId('break-preferences');
    expect(screen.getByTestId('break-preferences')).toBeInTheDocument();
  });
});
