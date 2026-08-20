import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProviderAndLogging,
} from 'test/unit/testUtils';
import {
  FUNCTIONALITY_NAMES,
  ORCHESTRATOR_LOGGING,
} from 'src/js/widgets/qbtOrchestrator/constants';

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/timeKiosk/components/TimeKioskSettingsHandle',
  () => ({
    __esModule: true,
    default: ({ isEditable }: { isEditable?: boolean }) => (
      <div data-testid="time-kiosk-settings-handle-mock">
        <span data-testid="time-kiosk-handle-editable">
          {isEditable === undefined ? 'undefined' : String(isEditable)}
        </span>
      </div>
    ),
  }),
);

let TimeKioskFeature: React.ComponentType<{
  functionality?: string;
  isEditable?: boolean;
}>;

describe('TimeKioskFeature', () => {
  const mockSandbox = getDefaultSandbox();

  beforeAll(async () => {
    const module = await import(
      'src/js/widgets/qbtOrchestrator/features/timeKiosk/index'
    );
    TimeKioskFeature = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render kiosk settings handle by default', async () => {
    renderWithQuicksandProviderAndLogging(<TimeKioskFeature />, mockSandbox);

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-settings-handle-mock'),
      ).toBeInTheDocument();
    });
  });

  it('should pass isEditable to TimeKioskSettingsHandle', async () => {
    renderWithQuicksandProviderAndLogging(
      <TimeKioskFeature isEditable={false} />,
      mockSandbox,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('time-kiosk-handle-editable'),
      ).toHaveTextContent('false');
    });
  });

  it('should log FEATURE_LOADED on mount', async () => {
    renderWithQuicksandProviderAndLogging(<TimeKioskFeature />, mockSandbox);

    await waitFor(() => {
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(ORCHESTRATOR_LOGGING.FEATURE_LOADED),
        {
          feature: 'time-kiosk',
          functionality: FUNCTIONALITY_NAMES.KIOSK_SETTINGS_HANDLE,
        },
      );
    });
  });
});
