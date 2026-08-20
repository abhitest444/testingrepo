import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import WeeklyTimesheetPopoverTourAdapter from 'src/js/widgets/weeklyTimeEntry/components/weeklyTour/WeeklyTimesheetPopoverTourAdapter';

const mockHandleForwardStep1To2 = jest.fn();

// Mock dependencies
jest.mock(
  'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour',
  () => ({
    __esModule: true,
    default: ({
      open,
      steps,
      onClose,
      onFinish,
      onStepChange,
    }: {
      open: boolean;
      steps: Array<{
        id: string;
        targetSelector: string;
        anchorEl?: HTMLElement;
      }>;
      onClose: () => void;
      onFinish: () => void;
      onStepChange: (step: number) => void;
    }) => {
      if (!open) return null;
      return (
        <div data-testid="general-popover-tour">
          <div data-testid="tour-steps-count">{steps.length}</div>
          <div data-testid="current-step">{steps[0]?.id || 'no-step'}</div>
          <button
            onClick={() => onStepChange(1)}
            data-testid="tour-next-button"
          >
            Next
          </button>
          <button
            onClick={() => onStepChange(0)}
            data-testid="tour-back-button"
          >
            Back
          </button>
          <button onClick={onFinish} data-testid="tour-finish-button">
            Finish
          </button>
          <button onClick={onClose} data-testid="tour-close-button">
            Close
          </button>
        </div>
      );
    },
    GeneralPopoverTourStep: jest.fn(),
  }),
);

jest.mock('src/js/common/tourSteps', () => ({
  WeeklyTimesheetTourSteps: () => [
    { id: 'step-1', targetSelector: '[data-testid="team-member-dropdown"]' },
    { id: 'step-2', targetSelector: '[data-testid="time-category-selector"]' },
    { id: 'step-3', targetSelector: '[data-testid="details-panel"]' },
    { id: 'step-4', targetSelector: '[data-testid="save-button"]' },
  ],
}));

jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
    },
    performance: {
      createCustomerInteraction: jest.fn(() => ({
        endWithSuccess: jest.fn(),
        endWithFailure: jest.fn(),
      })),
    },
  }),
  useAppContext: jest.fn().mockReturnValue({
    realmId: 'test-realm-id',
    environment: 'test',
  }),
  useIntl: jest.fn().mockReturnValue({
    formatMessage: jest.fn((message) => message.defaultMessage || message.id),
  }),
}));

// Mock usePopoverInstrumentation
jest.mock('src/js/common/usePopoverInstrumentation', () => ({
  usePopoverInstrumentation: jest.fn(() => ({
    logPopoverOpen: jest.fn(),
    logPopoverClose: jest.fn(),
    logTourStepChange: jest.fn(),
    logTourComplete: jest.fn(),
    logPopoverError: jest.fn(),
  })),
}));

// Mock CustomerInteraction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(() => ({
    endWithSuccess: jest.fn(),
    endWithFailure: jest.fn(),
  })),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  TimeCustomerInteraction: {
    WEEKLY_TIMESHEET_TOUR_COMPLETE: 'WEEKLY_TIMESHEET_TOUR_COMPLETE',
  },
}));

// Mock useUxPreferences
jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: jest.fn(() => ({
    setPreference: jest.fn().mockResolvedValue(undefined),
    getPreference: jest.fn(),
    data: {},
    loading: false,
    error: null,
  })),
  UxPreferenceKey: {
    WEEKLY_TIMESHEET_TOUR_COMPLETED: 'WEEKLY_TIMESHEET_TOUR_COMPLETED',
  },
}));

// Mock the tour utility hooks
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourElementUtils',
  () => ({
    useTourElementUtils: () => ({
      findAnchorElement: jest.fn(
        (step, stepIndex, targetElement, stepTargetElement) => {
          if (stepIndex === 0 && stepTargetElement) return stepTargetElement;
          if (targetElement) return targetElement;
          return document.body;
        },
      ),
      createBaseSteps: jest.fn(
        (
          steps: any[],
          targetElement: HTMLElement | undefined,
          stepTargetElement: HTMLElement | undefined,
        ) =>
          steps.map((step: any, index: number) => ({
            ...step,
            anchorEl:
              index === 0 && stepTargetElement
                ? stepTargetElement
                : targetElement || document.body,
          })),
      ),
    }),
  }),
);

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourNavigationUtils',
  () => ({
    useTourNavigation: () => ({
      handleBackwardStep2To1: jest.fn((setDynamicSteps) => {
        setDynamicSteps([]);
      }),
      handleBackwardStep3To2: jest.fn(() => false),
      handleBackwardStep4To3: jest.fn((newStep, setCurrentStep) => {
        setCurrentStep(newStep);
      }),
      handleForwardStep1To2: mockHandleForwardStep1To2.mockImplementation(
        (
          newStep,
          steps,
          targetElement,
          stepTargetElement,
          setDynamicSteps,
          setCurrentStep,
          setupMenuObserver,
        ) => {
          setDynamicSteps(steps);
          setCurrentStep(newStep);
        },
      ),
      handleForwardStep2To3: jest.fn((newStep, setCurrentStep) => {
        setCurrentStep(newStep);
      }),
      handleForwardStep3To4: jest.fn((newStep, setCurrentStep) => {
        setCurrentStep(newStep);
      }),
    }),
  }),
);

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(() => false),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourObserverUtils',
  () => ({
    useTourObserverUtils: () => ({
      setupMenuObserver: jest.fn(),
    }),
  }),
);

// Mock react-redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useAppDispatch: jest.fn(() => jest.fn()),
  useAppSelector: jest.fn(() => [
    { rowId: 'row-1', name: 'John Doe' },
    { rowId: 'row-2', name: 'Jane Smith' },
  ]),
}));

// Mock the store actions
jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice', () => ({
  openContextMenu: jest.fn(),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/store/timeEntrySettingsSlice',
  () => ({
    setWeeklyTimesheetTourCompleted: jest.fn(),
  }),
);

interface WeeklyTimeEntryState {
  timeEntryGrid?: {
    selectedCell: any;
    rows: Array<{ rowId: string; name: string }>;
  };
  contextMenu?: {
    isOpen: boolean;
    x: number;
    y: number;
    rowId: string | null;
    dayIdx: number | null;
    menuType: string | null;
  };
}

describe('WeeklyTimesheetPopoverTourAdapter', () => {
  const createStore = (initialState = {}) =>
    configureStore({
      reducer: {
        weeklyTimeEntry: (state = initialState, action: any) => state,
      },
      preloadedState: { weeklyTimeEntry: initialState },
    });

  const renderComponent = (
    props: {
      open?: boolean;
      onClose?: () => void;
      onFinish?: () => void;
      targetElement?: HTMLElement;
      stepTargetElement?: HTMLElement;
    } = {},
  ) => {
    const store = createStore();
    const defaultProps = {
      open: true,
      onClose: jest.fn(),
      onFinish: jest.fn(),
      ...props,
    };

    return render(
      <Provider store={store}>
        <WeeklyTimesheetPopoverTourAdapter {...defaultProps} />
      </Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleForwardStep1To2.mockClear();

    // Mock DOM elements
    document.body.innerHTML = `
      <div data-testid="team-member-dropdown">Team Member Dropdown</div>
      <div data-testid="time-category-selector">Time Category Selector</div>
      <div data-testid="details-panel">Details Panel</div>
      <div data-testid="save-button">Save Button</div>
      <div data-testid="menu">Menu</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Component Rendering', () => {
    it('renders when open is true', () => {
      renderComponent({ open: true });
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      renderComponent({ open: false });
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('renders with correct number of steps', () => {
      renderComponent();
      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('4');
    });

    it('renders with correct initial step', () => {
      renderComponent();
      expect(screen.getByTestId('current-step')).toHaveTextContent('step-1');
    });

    it('starts from step 2 for WFS users', () => {
      (
        require('src/js/service/utils/sandboxUtils')
          .isWorkforceEnvironment as jest.Mock
      ).mockReturnValue(true);

      renderComponent();

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('3');
      expect(screen.getByTestId('current-step')).toHaveTextContent('step-2');
      expect(mockHandleForwardStep1To2).toHaveBeenCalled();
    });

    it('starts from step 1 for QBO users', () => {
      (
        require('src/js/service/utils/sandboxUtils')
          .isWorkforceEnvironment as jest.Mock
      ).mockReturnValue(false);

      renderComponent();

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('4');
      expect(screen.getByTestId('current-step')).toHaveTextContent('step-1');
    });

    it('does not render when steps array is empty', () => {
      // Mock empty steps by temporarily overriding the mock
      const originalMock =
        require('src/js/common/tourSteps').WeeklyTimesheetTourSteps;
      jest
        .spyOn(require('src/js/common/tourSteps'), 'WeeklyTimesheetTourSteps')
        .mockReturnValue([]);

      renderComponent();
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();

      // Restore original mock
      jest
        .spyOn(require('src/js/common/tourSteps'), 'WeeklyTimesheetTourSteps')
        .mockImplementation(originalMock);
    });
  });

  describe('Tour Navigation', () => {
    it('handles forward navigation from step 1 to step 2', async () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('tour-next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('handles backward navigation from step 2 to step 1', async () => {
      renderComponent();

      // First go to step 2
      fireEvent.click(screen.getByTestId('tour-next-button'));

      // Then go back to step 1
      fireEvent.click(screen.getByTestId('tour-back-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('handles step 1 to step 2 navigation with dynamic steps', async () => {
      renderComponent();

      fireEvent.click(screen.getByTestId('tour-next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('handles step 2 to step 3 navigation', async () => {
      renderComponent();

      // Navigate to step 2 first
      fireEvent.click(screen.getByTestId('tour-next-button'));

      // Then to step 3
      fireEvent.click(screen.getByTestId('tour-next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('handles step 3 to step 4 navigation', async () => {
      renderComponent();

      // Navigate through steps
      fireEvent.click(screen.getByTestId('tour-next-button')); // step 1 -> 2
      fireEvent.click(screen.getByTestId('tour-next-button')); // step 2 -> 3
      fireEvent.click(screen.getByTestId('tour-next-button')); // step 3 -> 4

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });
  });

  describe('Tour Completion', () => {
    it('calls onFinish when finish button is clicked', async () => {
      const onFinish = jest.fn();
      renderComponent({ onFinish });

      fireEvent.click(screen.getByTestId('tour-finish-button'));

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalled();
      });
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      renderComponent({ onClose });

      fireEvent.click(screen.getByTestId('tour-close-button'));

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onFinish when tour is completed', async () => {
      const onFinish = jest.fn();
      renderComponent({ onFinish });

      fireEvent.click(screen.getByTestId('tour-finish-button'));

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalled();
      });
    });
  });

  describe('Props Handling', () => {
    it('uses targetElement when provided', () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'custom-target');
      document.body.appendChild(targetElement);

      renderComponent({ targetElement });

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();

      document.body.removeChild(targetElement);
    });

    it('uses stepTargetElement when provided', () => {
      const stepTargetElement = document.createElement('div');
      stepTargetElement.setAttribute('data-testid', 'custom-step-target');
      document.body.appendChild(stepTargetElement);

      renderComponent({ stepTargetElement });

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();

      document.body.removeChild(stepTargetElement);
    });

    it('handles missing onFinish callback gracefully', () => {
      renderComponent({ onFinish: undefined });

      fireEvent.click(screen.getByTestId('tour-finish-button'));

      // Should not throw error
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing target elements gracefully', () => {
      // Remove all target elements
      document.body.innerHTML = '';

      renderComponent();

      // Should still render with fallback anchor elements
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('handles rapid step changes', async () => {
      renderComponent();

      // Rapidly click next button
      fireEvent.click(screen.getByTestId('tour-next-button'));
      fireEvent.click(screen.getByTestId('tour-next-button'));
      fireEvent.click(screen.getByTestId('tour-next-button'));

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('handles step changes when tour is closed', () => {
      renderComponent({ open: false });

      // Should not render even if step changes are triggered
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Redux Integration', () => {
    it('uses useAppDispatch hook', () => {
      const mockDispatch = jest.fn();
      jest
        .spyOn(require('react-redux'), 'useAppDispatch')
        .mockReturnValue(mockDispatch);

      renderComponent();

      // Component should render successfully with Redux dispatch
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles errors in tour completion gracefully', async () => {
      const onFinish = jest.fn();
      const mockSetPreference = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      // Mock useUxPreferences to return a rejected promise
      jest
        .spyOn(
          require('src/js/service/utils/useUXPreferences'),
          'useUxPreferences',
        )
        .mockReturnValue({
          setPreference: mockSetPreference,
          getPreference: jest.fn(),
          data: {},
          loading: false,
          error: null,
        });

      renderComponent({ onFinish });

      fireEvent.click(screen.getByTestId('tour-finish-button'));

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalled();
      });
    });

    it('handles missing onFinish callback gracefully', async () => {
      renderComponent({ onFinish: undefined });

      fireEvent.click(screen.getByTestId('tour-finish-button'));

      // Should not throw error and should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });
  });

  describe('Tour Step Validation', () => {
    it('does not render when tourSteps array is empty', () => {
      // Mock createBaseSteps to return empty array
      jest
        .spyOn(
          require('src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourElementUtils'),
          'useTourElementUtils',
        )
        .mockReturnValue({
          findAnchorElement: jest.fn(),
          createBaseSteps: jest.fn(() => []),
        });

      renderComponent();

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('logs popover open when component mounts with open=true', () => {
      const mockLogPopoverOpen = jest.fn();
      jest
        .spyOn(
          require('src/js/common/usePopoverInstrumentation'),
          'usePopoverInstrumentation',
        )
        .mockReturnValue({
          logPopoverOpen: mockLogPopoverOpen,
          logPopoverClose: jest.fn(),
          logTourStepChange: jest.fn(),
          logTourComplete: jest.fn(),
          logPopoverError: jest.fn(),
        });

      renderComponent({ open: true });

      expect(mockLogPopoverOpen).toHaveBeenCalled();
    });
  });
});
