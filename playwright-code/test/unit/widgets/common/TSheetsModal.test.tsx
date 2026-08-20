import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import {
  computeHasTSheets,
  useGetEntitlements,
} from 'src/js/service/hooks/entitlements/useGetEntitlements';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import {
  computeTimeTrackingOnlyUser,
  useTimeTrackingBatchAuthorization,
} from 'src/js/service/utils/useTimeTrackingAuthorization';

import { TSheetsModal } from 'src/js/widgets/common/TSheetsModal';

jest.mock('src/js/service/utils/useTimeTrackingAuthorization');
jest.mock('src/js/service/hooks/entitlements/useGetEntitlements');
jest.mock('src/js/service/utils/useUXPreferences');

describe('TSheetsModal Component', () => {
  const mockUseGetEntitlements = useGetEntitlements as jest.Mock;
  const mockComputeHasTSheets = computeHasTSheets as jest.Mock;
  const mockUseUxPreferences = useUxPreferences as jest.Mock;

  const mockGetPreference = jest.fn();
  const mockSetPreference = jest.fn();

  const mockComputeTimeTrackingOnlyUser =
    computeTimeTrackingOnlyUser as jest.Mock;
  const mockUseTimeTrackingBatchAuthorization =
    useTimeTrackingBatchAuthorization as jest.Mock;

  beforeEach(() => {
    mockComputeHasTSheets.mockReturnValue(true);
    mockUseUxPreferences.mockReturnValue({
      data: { [UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE]: false },
      loading: false,
      getPreference: mockGetPreference,
      setPreference: mockSetPreference,
    });
    mockUseGetEntitlements.mockReturnValue({
      data: [],
      loading: false,
    });
    mockComputeTimeTrackingOnlyUser.mockReturnValue(undefined);
    mockUseTimeTrackingBatchAuthorization.mockReturnValue({
      data: [],
      loading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render the modal when conditions are met', async () => {
    renderWithQuicksandProvider(<TSheetsModal />);
    await waitFor(() => {
      expect(
        screen.getAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(2);
    });
  });

  test('should not render the modal when showModal is false', async () => {
    renderWithQuicksandProvider(<TSheetsModal showModal={false} />);
    await waitFor(() => {
      expect(
        screen.queryAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(0);
    });
  });

  test('should not render the modal when time tracking only user', async () => {
    mockComputeTimeTrackingOnlyUser.mockReturnValue('1');
    renderWithQuicksandProvider(<TSheetsModal />);
    await waitFor(() => {
      expect(
        screen.queryAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(0);
    });
  });

  test('should close the modal when the close button is clicked', async () => {
    renderWithQuicksandProvider(<TSheetsModal />);
    await waitFor(() => {
      expect(
        screen.getAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByText(/trowser.cancel/));
    await waitFor(() => {
      expect(
        screen.queryAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(0);
    });
  });

  test('should open TSheets URL when the next button is clicked', async () => {
    window.open = jest.fn();
    renderWithQuicksandProvider(<TSheetsModal />);
    await waitFor(() => {
      expect(
        screen.getAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByText(/tsheets.modal.next.button.label/));
    expect(window.open).toHaveBeenCalledWith(
      'https://tsheets-e2e.intuit.com/login_oii?realm_id=123456',
      '_blank',
    );
  });

  test('should set preference when checkbox is checked and modal is closed', async () => {
    renderWithQuicksandProvider(<TSheetsModal />);
    await waitFor(() => {
      expect(
        screen.getAllByTestId('time-tracking-tsheets-variability-modal'),
      ).toHaveLength(2);
    });

    fireEvent.click(screen.getByLabelText(/tsheets.modal.checkbox.label/));
    fireEvent.click(screen.getByText(/trowser.cancel/));
    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith(
        UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE,
        true,
      );
    });

    fireEvent.click(screen.getByLabelText(/tsheets.modal.checkbox.label/));
    fireEvent.click(screen.getByText(/trowser.cancel/));
    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith(
        UxPreferenceKey.HIDE_MODAL_UX_PREFERENCE,
        true,
      );
    });
  });
});
