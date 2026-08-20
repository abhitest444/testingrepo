import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import OvertimeSettingsHandle from 'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeSettingsHandle';
import { OVERTIME_LOGGING } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeLoggingConstants';
import type { OvertimeState } from 'src/js/widgets/qbtOrchestrator/features/overtime/store';

// Test store state type for type-safe assertions
interface TestStoreState {
  overtime: OvertimeState;
  shared: unknown;
  ui: unknown;
}

// Capture Widget props for assertions
let capturedWidgetProps: any = null;

jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedWidgetProps = props;
    return <div data-testid="tour-widget" />;
  },
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/utils/overtimeTourSteps',
  () => ({
    useOvertimeTourSteps: () => [
      {
        id: 'step-1',
        title: 'Tour Title',
        description: 'Tour Desc',
        doneLabel: 'Got it',
      },
    ],
  }),
);

// Mock the dependencies
jest.mock('@payroll-shared-components/payroll-settings-section', () => ({
  __esModule: true,
  default: ({ onEdit, title, viewContent, mode, readonly }: any) => (
    <div data-testid="settings-section">
      <div data-testid="settings-title">{title}</div>
      <div data-testid="settings-content">{viewContent}</div>
      <button data-testid="edit-button" onClick={onEdit} disabled={readonly}>
        Edit
      </button>
    </div>
  ),
}));

jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimeLandingPageTrowserContainer',
  () => ({
    __esModule: true,
    default: ({ onClose }: any) => (
      <div data-testid="overtime-landing-page-trowser">
        <button data-testid="trowser-close" onClick={onClose}>
          Close
        </button>
      </div>
    ),
  }),
);

jest.mock('src/js/hooks/useRenderTitleWithBadge', () => ({
  useRenderTitleWithBadge: jest.fn((title, showBadge, date) => title),
}));

describe('OvertimeSettingsHandle', () => {
  const mockSandbox = getDefaultSandbox();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedWidgetProps = null;
    store = createQbtOrchestratorStore();
  });

  describe('Component Rendering', () => {
    it('should render the settings section', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle />,
        store,
        mockSandbox,
      );

      expect(screen.getByTestId('settings-section')).toBeInTheDocument();
    });

    it('should render with editable mode when isEditable is true', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      expect(editButton).not.toBeDisabled();
    });

    it('should render in readonly mode when isEditable is false', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable={false} />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      expect(editButton).toBeDisabled();
    });

    it('should render OvertimeLandingPageTrowserContainer', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle />,
        store,
        mockSandbox,
      );

      expect(
        screen.getByTestId('overtime-landing-page-trowser'),
      ).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should log SETTINGS_HANDLE_MOUNTED when component mounts', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.SETTINGS_HANDLE_MOUNTED),
          {
            isEditable: true,
            hasBadge: false,
          },
        );
      });
    });

    it('should log with hasBadge true when newBadgeVisibleTillDate is provided', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle
          isEditable
          newBadgeVisibleTillDate="2024-12-31"
        />,
        store,
        mockSandbox,
      );

      await waitFor(() => {
        expect(mockSandbox.logger.info).toHaveBeenCalledWith(
          expect.stringContaining(OVERTIME_LOGGING.SETTINGS_HANDLE_MOUNTED),
          {
            isEditable: true,
            hasBadge: true,
          },
        );
      });
    });
  });

  describe('User Interactions', () => {
    it('should log SETTINGS_HANDLE_EDIT_CLICKED when edit button is clicked', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.stringContaining(OVERTIME_LOGGING.SETTINGS_HANDLE_EDIT_CLICKED),
        undefined,
      );
    });

    it('should dispatch setShowLandingPage(true) when edit button is clicked', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showLandingPage).toBe(true);
      });
    });

    it('should dispatch setShowLandingPage(false) when trowser close is triggered', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      // First open the landing page
      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showLandingPage).toBe(true);
      });

      // Then close it
      const closeButton = screen.getByTestId('trowser-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        const state = store.getState() as any;
        expect(state.overtime.showLandingPage).toBe(false);
      });
    });

    it('should not log close event when trowser close is triggered', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      // Open the landing page
      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      // Clear previous calls
      jest.clearAllMocks();

      // Close the trowser
      const closeButton = screen.getByTestId('trowser-close');
      fireEvent.click(closeButton);

      // Should not log any additional close events
      expect(mockSandbox.logger.info).not.toHaveBeenCalled();
    });
  });

  describe('Guided Tour Widget', () => {
    it('should not render the tour widget when landing page is closed', () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      expect(screen.queryByTestId('tour-widget')).not.toBeInTheDocument();
    });

    it('should render the tour widget when landing page is open', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('tour-widget')).toBeInTheDocument();
      });
    });

    it('should pass correct props to the tour widget', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      expect(capturedWidgetProps.widgetId).toBe(
        'time-tracking-ui/TourFramework',
      );
      expect(capturedWidgetProps.tourId).toBe('overtime-settings-handle-tour');
      expect(capturedWidgetProps.mode).toBe('modal');
      expect(capturedWidgetProps.steps).toHaveLength(1);
      expect(capturedWidgetProps.steps[0].id).toBe('step-1');
    });

    it('should start with open=false until onComplete reports not completed', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      // Initially open is false (waiting for TourFramework to check storage)
      expect(capturedWidgetProps.open).toBe(false);
    });

    it('should set open=true when onComplete reports tour not completed', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      // Simulate TourFramework calling onComplete with not-completed status
      act(() => {
        capturedWidgetProps.onComplete({
          isCompleted: false,
          isLoading: false,
        });
      });

      await waitFor(() => {
        expect(capturedWidgetProps.open).toBe(true);
      });
    });

    it('should keep open=false when onComplete reports tour already completed', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      act(() => {
        capturedWidgetProps.onComplete({ isCompleted: true, isLoading: false });
      });

      await waitFor(() => {
        expect(capturedWidgetProps.open).toBe(false);
      });
    });

    it('should not change state when onComplete reports loading', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      act(() => {
        capturedWidgetProps.onComplete({ isCompleted: false, isLoading: true });
      });

      // Should still be false since loading was true
      expect(capturedWidgetProps.open).toBe(false);
    });

    it('should set open=false when onClose is called (user clicks Got it or X)', async () => {
      renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      fireEvent.click(screen.getByTestId('edit-button'));

      await waitFor(() => {
        expect(capturedWidgetProps).not.toBeNull();
      });

      // First open the tour
      act(() => {
        capturedWidgetProps.onComplete({
          isCompleted: false,
          isLoading: false,
        });
      });

      await waitFor(() => {
        expect(capturedWidgetProps.open).toBe(true);
      });

      // User dismisses the tour
      act(() => {
        capturedWidgetProps.onClose();
      });

      await waitFor(() => {
        expect(capturedWidgetProps.open).toBe(false);
      });
    });
  });

  describe('Component Unmount Cleanup', () => {
    it('should dispatch resetOvertimeState on unmount to reset all overtime state', async () => {
      const { unmount } = renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        const state = store.getState() as TestStoreState;
        expect(state.overtime.showLandingPage).toBe(true);
      });

      unmount();

      await waitFor(() => {
        const state = store.getState() as TestStoreState;
        // Verify full overtime state is reset to initial values
        expect(state.overtime.showLandingPage).toBe(false);
        expect(state.overtime.showPolicyDetails).toBe(false);
        expect(state.overtime.showWizard).toBe(false);
        expect(state.overtime.selectedPolicyId).toBe(null);
      });
    });

    it('should reset overtime state on unmount even when trowser was already closed', async () => {
      const { unmount } = renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const state = store.getState() as TestStoreState;
      expect(state.overtime.showLandingPage).toBe(false);

      unmount();

      await waitFor(() => {
        const stateAfterUnmount = store.getState() as TestStoreState;
        expect(stateAfterUnmount.overtime.showLandingPage).toBe(false);
      });
    });

    it('should reset full overtime state on unmount after user opens and closes trowser', async () => {
      const { unmount } = renderWithQuicksandReduxAndLogging(
        <OvertimeSettingsHandle isEditable />,
        store,
        mockSandbox,
      );

      const editButton = screen.getByTestId('edit-button');
      fireEvent.click(editButton);

      await waitFor(() => {
        const state = store.getState() as TestStoreState;
        expect(state.overtime.showLandingPage).toBe(true);
      });

      const closeButton = screen.getByTestId('trowser-close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        const state = store.getState() as TestStoreState;
        expect(state.overtime.showLandingPage).toBe(false);
      });

      unmount();

      await waitFor(() => {
        const stateAfterUnmount = store.getState() as TestStoreState;
        // Verify full overtime state is reset
        expect(stateAfterUnmount.overtime.showLandingPage).toBe(false);
        expect(stateAfterUnmount.overtime.showPolicyDetails).toBe(false);
        expect(stateAfterUnmount.overtime.showWizard).toBe(false);
      });
    });
  });
});
