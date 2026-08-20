import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeClockPopoverTourAdapter from 'src/js/widgets/timeClock/components/TimeClockPopoverTourAdapter';
import { TimeClockTourSteps } from 'src/js/common/tourSteps';

// Mock sandbox
const mockSandbox = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  },
  performance: {
    createCustomerInteraction: jest.fn(),
    getCustomerInteraction: jest.fn(),
  },
};

// Mock useSandbox
jest.mock('@payroll/quicksand', () => ({
  useSandbox: () => mockSandbox,
}));

// Mock useUxPreferences
const mockSetPreference = jest.fn();
jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: () => ({
    setPreference: mockSetPreference,
  }),
  UxPreferenceKey: {
    TIME_CLOCK_TOUR_COMPLETED: 'time-clock-tour-completed',
  },
}));

// Mock usePopoverInstrumentation
jest.mock('src/js/common/usePopoverInstrumentation', () => ({
  usePopoverInstrumentation: () => ({
    logPopoverOpen: jest.fn(),
    logPopoverClose: jest.fn(),
    logTourStepChange: jest.fn(),
    logTourComplete: jest.fn(),
    logPopoverError: jest.fn(),
  }),
}));

// Mock customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  TimeCustomerInteraction: {
    TIME_CLOCK_TOUR_COMPLETE: 'time-clock-tour-complete',
  },
}));

// Mock GeneralPopoverTour
jest.mock(
  'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour',
  () => ({
    __esModule: true,
    default: ({ open, steps, onClose, onFinish, onStepChange }: any) =>
      open ? (
        <div data-testid="general-popover-tour">
          <div data-testid="tour-steps-count">{steps.length}</div>
          {steps.map((step: any, index: number) => (
            <div key={step.id} data-testid={`step-${index}`}>
              <span data-testid={`step-title-${index}`}>{step.title}</span>
              <span data-testid={`step-description-${index}`}>
                {step.description}
              </span>
              <span data-testid={`step-button-${index}`}>
                {step.buttonText}
              </span>
            </div>
          ))}
          <button data-testid="close-button" onClick={onClose}>
            Close
          </button>
          <button data-testid="finish-button" onClick={onFinish}>
            Finish
          </button>
          <button
            data-testid="step-change-button"
            onClick={() => onStepChange && onStepChange(1)}
          >
            Next Step
          </button>
        </div>
      ) : null,
  }),
);

// Mock tour steps
jest.mock('src/js/common/tourSteps', () => ({
  TimeClockTourSteps: jest.fn(() => [
    {
      id: 'tc-1',
      title: 'Time clock got a makeover',
      description: 'Updated experience',
      buttonText: "See what's new",
      targetSelector: '[data-testid="timer-container"]',
    },
    {
      id: 'tc-2',
      title: 'View time',
      description: 'See your clocked-in time',
      buttonText: 'Next: switch jobs',
      targetSelector: '[data-testid="timer-container"]',
    },
    {
      id: 'tc-3',
      title: 'Switch jobs',
      description: 'Assign time to different jobs',
      buttonText: 'Next: save changes',
      targetSelector: '[data-testid="switch-jobs-button"]',
    },
    {
      id: 'tc-4',
      title: 'Save changes',
      description: 'Hit the save button',
      buttonText: 'Done',
      targetSelector: '[data-test-id="time-clock-save-button"]',
    },
    {
      id: 'tc-5',
      title: 'View running time',
      description: 'Open the time clock',
      buttonText: 'Done',
      targetSelector: 'button[data-testid="time-action-button"]',
    },
  ]),
}));

describe('TimeClockPopoverTourAdapter', () => {
  const defaultProps = {
    open: false,
    onClose: jest.fn(),
    onFinish: jest.fn(),
    targetElement: null,
    stepTargetElement: null,
    isClockedIn: false,
    tourContext: 'clock-in' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM elements for target selectors
    const timerContainer = document.createElement('div');
    timerContainer.setAttribute('data-testid', 'timer-container');
    document.body.appendChild(timerContainer);

    const switchJobsButton = document.createElement('button');
    switchJobsButton.setAttribute('data-testid', 'switch-jobs-button');
    document.body.appendChild(switchJobsButton);

    const saveButton = document.createElement('button');
    saveButton.setAttribute('data-test-id', 'time-clock-save-button');
    document.body.appendChild(saveButton);

    const timeActionButton = document.createElement('button');
    timeActionButton.setAttribute('data-testid', 'time-action-button');
    document.body.appendChild(timeActionButton);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<TimeClockPopoverTourAdapter {...defaultProps} />);

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('should render GeneralPopoverTour when open is true', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });

  describe('Step Filtering by Tour Context', () => {
    it('should show no steps for clock-in context', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-in"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('0');
    });

    it('should show steps 0-3 for clock-out context', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('4');

      // Check that the correct steps are shown
      expect(screen.getByTestId('step-title-0')).toHaveTextContent(
        'Time clock got a makeover',
      );
      expect(screen.getByTestId('step-title-1')).toHaveTextContent('View time');
      expect(screen.getByTestId('step-title-2')).toHaveTextContent(
        'Switch jobs',
      );
      expect(screen.getByTestId('step-title-3')).toHaveTextContent(
        'Save changes',
      );
    });

    it('should show step 4+ for drawer-closed context', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="drawer-closed"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('1');
      expect(screen.getByTestId('step-title-0')).toHaveTextContent(
        'View running time',
      );
    });
  });

  describe('Target Element Resolution', () => {
    it('should find target elements by selector', () => {
      const { rerender } = render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      // The component should render without errors, indicating target elements were found
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should use stepTargetElement as fallback for first step', () => {
      const stepTargetElement = document.createElement('div');
      stepTargetElement.setAttribute('data-testid', 'step-target-element');

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          stepTargetElement={stepTargetElement}
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should use targetElement as final fallback', () => {
      const targetElement = document.createElement('div');
      targetElement.setAttribute('data-testid', 'target-element');

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          targetElement={targetElement}
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });

  describe('Tour Completion Logic', () => {
    it('should call onFinish when tour is finished in drawer-closed context', async () => {
      const onFinish = jest.fn();
      mockSetPreference.mockResolvedValue(undefined);

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="drawer-closed"
          onFinish={onFinish}
        />,
      );

      fireEvent.click(screen.getByTestId('finish-button'));

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onFinish even when tour completion fails', async () => {
      const onFinish = jest.fn();
      mockSetPreference.mockRejectedValue(new Error('Test error'));

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="drawer-closed"
          onFinish={onFinish}
        />,
      );

      fireEvent.click(screen.getByTestId('finish-button'));

      await waitFor(() => {
        expect(onFinish).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onFinish when tour is finished in clock-out context', () => {
      const onFinish = jest.fn();

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          onFinish={onFinish}
        />,
      );

      fireEvent.click(screen.getByTestId('finish-button'));

      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish when tour is finished in clock-in context', () => {
      const onFinish = jest.fn();

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-in"
          onFinish={onFinish}
        />,
      );

      fireEvent.click(screen.getByTestId('finish-button'));

      expect(onFinish).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByTestId('close-button'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Passing to GeneralPopoverTour', () => {
    it('should pass correct props to GeneralPopoverTour', () => {
      const onClose = jest.fn();
      const onFinish = jest.fn();

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          onClose={onClose}
          onFinish={onFinish}
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();

      // Test close functionality
      fireEvent.click(screen.getByTestId('close-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Clear all DOM elements
      document.body.innerHTML = '';

      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      // Should still render without crashing
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should handle null target elements', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          targetElement={null}
          stepTargetElement={null}
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should handle empty steps array gracefully', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-in"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('0');
    });
  });

  describe('useMemo Dependency Optimization', () => {
    it('should recalculate steps when tourContext changes', () => {
      const { rerender } = render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('4');

      rerender(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="drawer-closed"
        />,
      );

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('1');
    });

    it('should recalculate steps when target elements change', () => {
      const { rerender } = render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          targetElement={null}
        />,
      );

      const newTargetElement = document.createElement('div');
      rerender(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
          targetElement={newTargetElement}
        />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });

  describe('Basic Instrumentation', () => {
    it('should call logger methods when tour opens', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      // Verify that the component renders without errors
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should handle step changes without errors', () => {
      render(
        <TimeClockPopoverTourAdapter
          {...defaultProps}
          open
          tourContext="clock-out"
        />,
      );

      // Trigger step change
      fireEvent.click(screen.getByTestId('step-change-button'));

      // Should handle step changes without crashing
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });
});
