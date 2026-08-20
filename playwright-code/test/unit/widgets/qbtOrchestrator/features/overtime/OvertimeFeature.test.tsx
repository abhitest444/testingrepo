import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandProviderAndLogging,
} from 'test/unit/testUtils';
import { OVERTIME_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeLoggingConstants';

// Mock the lazy-loaded components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeSettingsHandle',
  () => ({
    __esModule: true,
    default: ({ isEditable, newBadgeVisibleTillDate }: any) => (
      <div data-testid="overtime-settings-handle">
        Settings Handle - Editable: {isEditable ? 'true' : 'false'}
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeLandingPage',
  () => ({
    __esModule: true,
    default: ({ onClose }: any) => (
      <div data-testid="overtime-landing-page">
        Landing Page
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    ),
  }),
);

// Need to use dynamic import to test the component
let OvertimeFeature: any;

describe('OvertimeFeature', () => {
  const mockSandbox = getDefaultSandbox();

  beforeAll(async () => {
    // Import the component after mocks are set up
    const module = await import(
      'src/js/widgets/qbtOrchestrator/features/overtime/index'
    );
    OvertimeFeature = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render settings-handle functionality by default', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="settings-handle" />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('overtime-settings-handle'),
        ).toBeInTheDocument();
      });
    });

    it('should render landing-page functionality', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="landing-page" />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-landing-page')).toBeInTheDocument();
      });
    });

    it('should render setup-policy placeholder', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="setup-policy" />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Overtime Setup Policy (Coming Soon)'),
        ).toBeInTheDocument();
      });
    });

    it('should render policy-details placeholder', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="policy-details" />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Overtime Policy Details (Coming Soon)'),
        ).toBeInTheDocument();
      });
    });

    it('should render unknown functionality message', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="unknown" />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Unknown overtime functionality: unknown'),
        ).toBeInTheDocument();
      });
    });

    it('should pass isEditable prop to OvertimeSettingsHandle', async () => {
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="settings-handle" isEditable />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Settings Handle - Editable: true'),
        ).toBeInTheDocument();
      });
    });

    it('should pass onClose prop to OvertimeLandingPage', async () => {
      const onCloseMock = jest.fn();
      renderWithQuicksandProviderAndLogging(
        <OvertimeFeature functionality="landing-page" onClose={onCloseMock} />,
        mockSandbox,
      );

      await waitFor(() => {
        expect(screen.getByTestId('overtime-landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it.each([['settings-handle' as const], ['landing-page' as const]])(
      'should log FEATURE_MOUNTED for %s functionality',
      async (functionality) => {
        renderWithQuicksandProviderAndLogging(
          <OvertimeFeature functionality={functionality} />,
          mockSandbox,
        );

        await waitFor(() => {
          expect(mockSandbox.logger.info).toHaveBeenCalledWith(
            expect.stringContaining(OVERTIME_LOGGING.FEATURE_MOUNTED),
            { functionality },
          );
        });
      },
    );
  });
});
