import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';
import SingleTimeActivityTourAdapter from 'src/js/widgets/singleTimeTrowser/components/SingleTimeActivityTourAdapter';
import { SingleTimeActivityTourSteps } from 'src/js/common/tourSteps';
import {
  useUxPreferences,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { usePopoverInstrumentation } from 'src/js/common/usePopoverInstrumentation';

// Mock dependencies
jest.mock('src/js/common/tourSteps', () => ({
  SingleTimeActivityTourSteps: jest.fn(),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: jest.fn(),
  UxPreferenceKey: {
    SINGLE_TIME_ACTIVITY_TOUR_COMPLETED: 'single-time-activity-tour-completed',
  },
}));

jest.mock('src/js/common/usePopoverInstrumentation', () => ({
  usePopoverInstrumentation: jest.fn(),
}));

// Mock GeneralPopoverTour component
jest.mock(
  'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour',
  () =>
    function MockGeneralPopoverTour({
      open,
      steps,
      onClose,
      onFinish,
      onStepChange,
    }: any) {
      if (!open) return null;

      return (
        <div data-testid="general-popover-tour">
          <div data-testid="tour-steps-count">{steps.length}</div>
          <div data-testid="current-step-title">{steps[0]?.title}</div>
          <button
            data-testid="tour-close"
            onClick={() => {
              onClose?.();
            }}
          >
            Close
          </button>
          <button data-testid="tour-finish" onClick={onFinish}>
            Finish
          </button>
          <button
            data-testid="tour-next"
            onClick={() => onStepChange && onStepChange(1)}
          >
            Next
          </button>
        </div>
      );
    },
);

describe('SingleTimeActivityTourAdapter', () => {
  const mockSandbox = getDefaultSandbox();
  mockSandbox.logger.info = jest.fn();
  mockSandbox.logger.warn = jest.fn();
  mockSandbox.logger.error = jest.fn();

  const mockSetPreference = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnFinish = jest.fn();

  const mockSteps = [
    {
      id: 'single-time-activity-1',
      title: 'Single time activity1',
      description:
        "1. A little reorganization to smooth out how you enter a team member's time.",
      buttonText: '1. Got it',
      position: 'right',
      alignment: 'top',
      distance: 10,
      skidding: 20,
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="Select name"]',
      lottieData: {},
      arrowColor: '#D8FFDB',
    },
    {
      id: 'single-time-activity-2',
      title: 'Single time activity2',
      description:
        "2. A little reorganization to smooth out how you enter a team member's time.",
      buttonText: '2. Got it',
      position: 'right',
      alignment: 'top',
      distance: 10,
      skidding: 20,
      bgcolor: '#D8FFDB',
      targetSelector: '[aria-label="Select name"]',
      lottieData: {},
      arrowColor: '#D8FFDB',
    },
  ];

  const mockPopoverInstrumentation = {
    logPopoverOpen: jest.fn(),
    logPopoverClose: jest.fn(),
    logTourStepChange: jest.fn(),
    logTourComplete: jest.fn(),
    logPopoverError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SingleTimeActivityTourSteps
    (SingleTimeActivityTourSteps as jest.Mock).mockReturnValue(mockSteps);

    // Mock useUxPreferences
    (useUxPreferences as jest.Mock).mockReturnValue({
      setPreference: mockSetPreference,
    });

    // Mock usePopoverInstrumentation
    (usePopoverInstrumentation as jest.Mock).mockReturnValue(
      mockPopoverInstrumentation,
    );
  });

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onFinish: mockOnFinish,
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <SingleTimeActivityTourAdapter {...defaultProps} {...props} />,
      mockSandbox,
    );

  describe('Rendering', () => {
    it('should render when open is true', () => {
      renderComponent({ open: true });

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('2');
    });

    it('should not render when open is false', () => {
      renderComponent({ open: false });

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('should not render when no steps are available', () => {
      (SingleTimeActivityTourSteps as jest.Mock).mockReturnValue([]);

      renderComponent();

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Step Management', () => {
    it('should reset current step when tour opens', () => {
      const { rerender } = renderComponent({ open: false });

      // Open the tour
      rerender(<SingleTimeActivityTourAdapter {...defaultProps} open />);

      // Verify step is reset (this would be tested through internal state)
      expect(screen.getByTestId('current-step-title')).toHaveTextContent(
        'Single time activity1',
      );
    });

    it('should handle step changes', () => {
      renderComponent();

      const nextButton = screen.getByTestId('tour-next');
      fireEvent.click(nextButton);

      // Verify step change was logged
      expect(mockPopoverInstrumentation.logTourStepChange).toHaveBeenCalledWith(
        1,
        2,
        expect.objectContaining({
          stepHeading: 'Single time activity2',
          popoverHeading: 'Single time activity2',
        }),
      );
    });
  });

  describe('Tour Completion', () => {
    it('should handle successful tour completion', async () => {
      mockSetPreference.mockResolvedValue(undefined);

      renderComponent();

      const finishButton = screen.getByTestId('tour-finish');
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(mockSetPreference).toHaveBeenCalledWith(
          UxPreferenceKey.SINGLE_TIME_ACTIVITY_TOUR_COMPLETED,
          true,
        );
        expect(mockPopoverInstrumentation.logTourComplete).toHaveBeenCalled();
        expect(mockOnFinish).toHaveBeenCalled();
      });
    });

    it('should handle tour completion failure', async () => {
      const error = new Error('Preference save failed');
      mockSetPreference.mockRejectedValue(error);

      renderComponent();

      const finishButton = screen.getByTestId('tour-finish');
      fireEvent.click(finishButton);

      await waitFor(() => {
        expect(mockPopoverInstrumentation.logPopoverError).toHaveBeenCalledWith(
          'Error: Preference save failed',
          expect.objectContaining({
            stepHeading: 'Single time activity1',
            popoverHeading: 'Single time activity1',
          }),
        );
        expect(mockOnFinish).toHaveBeenCalled();
      });
    });
  });

  describe('Tour Closing', () => {
    it('should handle tour close', () => {
      const { rerender } = renderComponent();

      const closeButton = screen.getByTestId('tour-close');
      fireEvent.click(closeButton);

      // Verify onClose is called
      expect(mockOnClose).toHaveBeenCalled();

      // Simulate the component closing (open becomes false)
      rerender(
        <SingleTimeActivityTourAdapter {...defaultProps} open={false} />,
      );

      // Now logPopoverClose should be called
      expect(mockPopoverInstrumentation.logPopoverClose).toHaveBeenCalledWith(
        expect.objectContaining({
          stepHeading: 'Single time activity1',
          popoverHeading: 'Single time activity1',
        }),
      );
    });
  });

  describe('Element Selection', () => {
    it('should use provided targetElement when available', () => {
      const mockTargetElement = document.createElement('div');
      mockTargetElement.setAttribute('data-testid', 'target-element');

      renderComponent({ targetElement: mockTargetElement });

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should use stepTargetElement when targetElement is not provided', () => {
      const mockStepTargetElement = document.createElement('div');
      mockStepTargetElement.setAttribute('data-testid', 'step-target-element');

      renderComponent({ stepTargetElement: mockStepTargetElement });

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should use targetSelector to find elements when no anchor elements provided', () => {
      // Create a mock element that matches the targetSelector
      const mockElement = document.createElement('div');
      mockElement.setAttribute('aria-label', 'Select name');
      document.body.appendChild(mockElement);

      renderComponent();

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();

      // Cleanup
      document.body.removeChild(mockElement);
    });

    it('should use document.body as fallback when no elements found', () => {
      // Mock querySelector to return null
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockReturnValue(null);

      renderComponent();

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'No anchor element found, using document.body as fallback',
        ),
      );

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });
  });

  describe('Element Selection and Warnings', () => {
    it('should warn when target selector elements are not found', () => {
      // Mock querySelector to return null for targetSelector
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockImplementation((selector) => {
        if (selector === '[aria-label="Select name"]') {
          return null;
        }
        return originalQuerySelector.call(document, selector);
      });

      renderComponent();

      expect(mockSandbox.logger.warn).toHaveBeenCalledWith(
        'SingleTimeActivityTourAdapter - Could not find element with selector: [aria-label="Select name"]',
      );

      // Restore original querySelector
      document.querySelector = originalQuerySelector;
    });
  });

  describe('Popover Instrumentation', () => {
    it('should log popover open when tour opens', () => {
      renderComponent({ open: true });

      expect(mockPopoverInstrumentation.logPopoverOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          stepHeading: 'Single time activity1',
          popoverHeading: 'Single time activity1',
        }),
      );
    });

    it('should log popover close when tour closes', () => {
      const { rerender } = renderComponent({ open: true });

      rerender(
        <SingleTimeActivityTourAdapter {...defaultProps} open={false} />,
      );

      expect(mockPopoverInstrumentation.logPopoverClose).toHaveBeenCalledWith(
        expect.objectContaining({
          stepHeading: 'Single time activity1',
          popoverHeading: 'Single time activity1',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onFinish callback', () => {
      renderComponent({ onFinish: undefined });

      const finishButton = screen.getByTestId('tour-finish');
      fireEvent.click(finishButton);

      // Should not throw error when onFinish is undefined
      expect(mockSetPreference).toHaveBeenCalled();
    });

    it('should handle empty steps array', () => {
      (SingleTimeActivityTourSteps as jest.Mock).mockReturnValue([]);

      renderComponent();

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('should handle steps with missing properties', () => {
      const incompleteSteps = [
        {
          id: 'incomplete-step',
          title: 'Incomplete Step',
          // Missing other required properties
        },
      ];

      (SingleTimeActivityTourSteps as jest.Mock).mockReturnValue(
        incompleteSteps,
      );

      renderComponent();

      // Should still render but handle missing properties gracefully
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });
  });
});
