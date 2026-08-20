import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProviderAndLogging,
} from 'test/unit/testUtils';
import TimeKioskSettingsHandle from 'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/TimeKioskSettingsHandle';

jest.mock('@payroll-shared-components/payroll-settings-section', () => ({
  __esModule: true,
  default: ({
    onEdit,
    title,
    viewContent,
    readonly,
  }: {
    onEdit?: () => void;
    title?: React.ReactNode;
    viewContent?: React.ReactNode;
    readonly?: boolean;
  }) => (
    <div data-testid="settings-section">
      <div data-testid="settings-title">{title}</div>
      <div data-testid="settings-content">{viewContent}</div>
      <button
        data-testid="edit-button"
        type="button"
        onClick={onEdit}
        disabled={readonly}
      >
        Edit
      </button>
    </div>
  ),
}));

// Stub the trowser (Redux-backed) — it has its own suite. We only need to
// verify the handle toggles it open, so render a lightweight placeholder.
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/TimeKioskManagementTrowser',
  () => ({
    __esModule: true,
    TimeKioskManagementTrowser: ({ open }: { open?: boolean }) =>
      open ? <div data-testid="time-kiosk-management-trowser" /> : null,
  }),
);

jest.mock('src/js/hooks/useRenderTitleWithBadge', () => ({
  useRenderTitleWithBadge: jest.fn((title) => title),
}));

describe('TimeKioskSettingsHandle', () => {
  const mockSandbox = getDefaultSandbox();

  beforeEach(() => {
    mockSandbox.pubsub.publish = jest.fn();
  });

  it('renders settings section and edit control', () => {
    renderWithQuicksandProviderAndLogging(
      <TimeKioskSettingsHandle />,
      mockSandbox,
    );

    expect(screen.getByTestId('settings-section')).toBeInTheDocument();
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
  });

  it('opens trowser when edit control is clicked', async () => {
    renderWithQuicksandProviderAndLogging(
      <TimeKioskSettingsHandle />,
      mockSandbox,
    );

    expect(
      screen.queryByTestId('time-kiosk-management-trowser'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-button'));

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-management-trowser'),
      ).toBeInTheDocument();
    });
  });

  it('disables edit control when not editable', () => {
    renderWithQuicksandProviderAndLogging(
      <TimeKioskSettingsHandle isEditable={false} />,
      mockSandbox,
    );

    expect(screen.getByTestId('edit-button')).toBeDisabled();
  });
});
