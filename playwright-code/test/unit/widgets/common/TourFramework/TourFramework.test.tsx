import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import TourFramework from 'src/js/widgets/common/TourFramework/TourFramework';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import { Sandbox } from 'src/js/common/sandbox';

// Mock the useTourStorage hook
const mockInitializeTourStatus = jest.fn();
const mockMarkTourCompleted = jest.fn();
const mockUseTourStorage = {
  isTourCompleted: false,
  isLoading: false,
  error: null,
  initializeTourStatus: mockInitializeTourStatus,
  markTourCompleted: mockMarkTourCompleted,
};

jest.mock('src/js/widgets/common/TourFramework/hooks/useTourStorage', () => ({
  useTourStorage: jest.fn(() => mockUseTourStorage),
}));

// Mock the GuidedModal and GuidedTooltip components
jest.mock(
  'src/js/widgets/common/TourFramework/components/GuidedModal',
  () =>
    function MockGuidedModal({
      tourId,
      open,
      steps,
      onClose,
      onComplete,
    }: {
      tourId: string;
      open: boolean;
      steps: Array<{ id: string; title: string; description: string }>;
      onClose: () => void;
      onComplete?: () => void;
    }) {
      const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
      const prevOpenRef = React.useRef(open);

      React.useEffect(() => {
        // Reset to first step when modal opens (was closed and now open)
        if (open && !prevOpenRef.current) {
          setCurrentStepIndex(0);
        }
        prevOpenRef.current = open;
      }, [open]);

      if (!open || !steps || steps.length === 0) return null;

      const currentStep = steps[currentStepIndex];
      const totalSteps = steps.length;
      const isLastStep = currentStepIndex === totalSteps - 1;

      const handleNext = () => {
        if (isLastStep) {
          setCurrentStepIndex(0); // Reset after completion
          onComplete?.();
        } else {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      };

      const handlePrevious = () => {
        if (currentStepIndex > 0) {
          setCurrentStepIndex(currentStepIndex - 1);
        }
      };

      const handleComplete = () => {
        setCurrentStepIndex(0); // Reset after completion
        onComplete?.();
      };

      const handleClose = () => {
        setCurrentStepIndex(0); // Reset on close
        onClose();
      };

      return (
        <div data-testid={`guided-modal-${tourId}`}>
          <h2 data-testid="modal-title">{currentStep.title}</h2>
          <p data-testid="modal-description">{currentStep.description}</p>
          <span data-testid="step-counter">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <button onClick={handlePrevious} data-testid="modal-previous">
            Previous
          </button>
          <button onClick={handleNext} data-testid="modal-next">
            Next
          </button>
          <button onClick={handleClose} data-testid="modal-close">
            Close
          </button>
          <button onClick={handleComplete} data-testid="modal-complete">
            Complete
          </button>
        </div>
      );
    },
);

jest.mock(
  'src/js/widgets/common/TourFramework/components/GuidedTooltip',
  () =>
    function MockGuidedTooltip({
      open,
      steps,
      onClose,
      onComplete,
      onStepChange,
    }: {
      open: boolean;
      steps: Array<{ id: string; title: string; description: string }>;
      onClose: () => void;
      onComplete?: () => void;
      onStepChange?: (stepIndex: number) => void;
    }) {
      const [currentIndex, setCurrentIndex] = React.useState(0);

      if (!open || !steps || steps.length === 0) return null;

      const currentStep = steps[currentIndex];

      const handleNext = () => {
        if (currentIndex < steps.length - 1) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);
          onStepChange?.(newIndex);
        } else {
          onComplete?.();
        }
      };

      const handlePrevious = () => {
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
          onStepChange?.(newIndex);
        }
      };

      return (
        <div data-testid="guided-tooltip">
          <h2 data-testid="tooltip-title">{currentStep.title}</h2>
          <p data-testid="tooltip-description">{currentStep.description}</p>
          <span data-testid="step-counter">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <button onClick={handlePrevious} data-testid="tooltip-previous">
            Previous
          </button>
          <button onClick={handleNext} data-testid="tooltip-next">
            Next
          </button>
          <button onClick={onClose} data-testid="tooltip-close">
            Close
          </button>
          <button onClick={onComplete} data-testid="tooltip-complete">
            Complete
          </button>
        </div>
      );
    },
);

describe('TourFramework', () => {
  const mockOnComplete = jest.fn();
  const mockOnClose = jest.fn();
  const mockLoggerInfo = jest.fn();
  const mockLoggerError = jest.fn();
  const mockSandbox = {
    logger: {
      info: mockLoggerInfo,
      error: mockLoggerError,
    },
  } as unknown as Sandbox;

  const mockSteps: TourStep[] = [
    {
      id: 'step-1',
      title: 'Step 1 Title',
      description: 'Step 1 Description',
    },
    {
      id: 'step-2',
      title: 'Step 2 Title',
      description: 'Step 2 Description',
    },
    {
      id: 'step-3',
      title: 'Step 3 Title',
      description: 'Step 3 Description',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockInitializeTourStatus.mockResolvedValue(undefined);
    mockMarkTourCompleted.mockResolvedValue(undefined);
    mockUseTourStorage.isTourCompleted = false;
    mockUseTourStorage.isLoading = false;
    mockUseTourStorage.error = null;
  });

  describe('Rendering - Modal Mode', () => {
    it('renders GuidedModal when mode is modal', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('guided-modal-test-tour')).toBeInTheDocument();
      expect(screen.queryByTestId('guided-tooltip')).not.toBeInTheDocument();
    });

    it('renders first step by default in modal mode', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
      expect(screen.getByTestId('modal-description')).toHaveTextContent(
        'Step 1 Description',
      );
      expect(screen.getByTestId('step-counter')).toHaveTextContent(
        'Step 1 of 3',
      );
    });

    it('defaults to tooltip mode when mode prop is not provided', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });
  });

  describe('Rendering - Tooltip Mode', () => {
    it('renders GuidedTooltip when mode is tooltip', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
      expect(
        screen.queryByTestId('guided-modal-test-tour'),
      ).not.toBeInTheDocument();
    });

    it('renders first step by default in tooltip mode', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Step 1 Title',
      );
      expect(screen.getByTestId('tooltip-description')).toHaveTextContent(
        'Step 1 Description',
      );
      expect(screen.getByTestId('step-counter')).toHaveTextContent(
        'Step 1 of 3',
      );
    });
  });

  describe('Visibility Control', () => {
    it.each([
      {
        description: 'renders nothing when open is false',
        props: { open: false, steps: mockSteps },
      },
      {
        description: 'renders nothing when steps array is empty',
        props: { open: true, steps: [] as TourStep[] },
      },
      {
        description: 'renders nothing when steps is null',
        props: { open: true, steps: null as any },
      },
    ])('$description', ({ props }) => {
      const { container } = render(
        <TourFramework
          sandbox={mockSandbox}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
          {...props}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation - Modal Mode', () => {
    it('advances to next step when Next button is clicked', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );

      fireEvent.click(screen.getByTestId('modal-next'));

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );
      expect(screen.getByTestId('step-counter')).toHaveTextContent(
        'Step 2 of 3',
      );
    });

    it('goes to previous step when Previous button is clicked', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Go to step 2
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Go back to step 1
      fireEvent.click(screen.getByTestId('modal-previous'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });

    it('does not go back from first step', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );

      // Try to go to previous from first step
      fireEvent.click(screen.getByTestId('modal-previous'));

      // Should still be on step 1
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });

    it('marks tour as completed when Next is clicked on last step', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Navigate to last step
      fireEvent.click(screen.getByTestId('modal-next')); // Step 2
      fireEvent.click(screen.getByTestId('modal-next')); // Step 3

      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 3 Title',
      );

      // Click Next on last step
      fireEvent.click(screen.getByTestId('modal-next'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
      // onClose is NOT called automatically - user must explicitly close
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Navigation - Tooltip Mode', () => {
    it('advances to next step when Next button is clicked', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Step 1 Title',
      );

      fireEvent.click(screen.getByTestId('tooltip-next'));

      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Step 2 Title',
      );
    });

    it('goes to previous step when Previous button is clicked', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      fireEvent.click(screen.getByTestId('tooltip-next'));
      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Step 2 Title',
      );

      fireEvent.click(screen.getByTestId('tooltip-previous'));
      expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });
  });

  describe('Close Behavior', () => {
    it.each([
      {
        description: 'calls onClose when Close button is clicked in modal mode',
        mode: 'modal' as const,
        closeButtonTestId: 'modal-close',
      },
      {
        description:
          'calls onClose when Close button is clicked in tooltip mode',
        mode: 'tooltip' as const,
        closeButtonTestId: 'tooltip-close',
      },
    ])('$description', ({ mode, closeButtonTestId }) => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode={mode}
        />,
      );

      fireEvent.click(screen.getByTestId(closeButtonTestId));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('resets to first step after closing', () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Close the tour
      fireEvent.click(screen.getByTestId('modal-close'));

      // Reopen the tour
      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Should start from step 1 again
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });

    it('does not mark tour as completed when Close button is clicked', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      fireEvent.click(screen.getByTestId('modal-close'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockMarkTourCompleted).not.toHaveBeenCalled();
    });
  });

  describe('Complete Behavior', () => {
    it('calls markTourCompleted when Complete button is clicked', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      fireEvent.click(screen.getByTestId('modal-complete'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
      // onClose is NOT called automatically - user must explicitly close
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('resets to first step after completing', async () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Complete the tour
      fireEvent.click(screen.getByTestId('modal-complete'));

      // Wait for completion
      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalled();
      });

      // Reopen the tour
      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Should start from step 1 again
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });

    it('works when onComplete is not provided', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(() => {
        fireEvent.click(screen.getByTestId('modal-complete'));
      }).not.toThrow();

      // onClose is not called when complete is clicked
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Step Data', () => {
    it.each([
      {
        description: 'passes correct step data to modal component',
        mode: 'modal' as const,
        titleTestId: 'modal-title',
        descriptionTestId: 'modal-description',
      },
      {
        description: 'passes correct step data to tooltip component',
        mode: 'tooltip' as const,
        titleTestId: 'tooltip-title',
        descriptionTestId: 'tooltip-description',
      },
    ])('$description', ({ mode, titleTestId, descriptionTestId }) => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode={mode}
        />,
      );

      expect(screen.getByTestId(titleTestId)).toHaveTextContent('Step 1 Title');
      expect(screen.getByTestId(descriptionTestId)).toHaveTextContent(
        'Step 1 Description',
      );
    });

    it('handles single step tour', async () => {
      const singleStep = [mockSteps[0]];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={singleStep}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('step-counter')).toHaveTextContent(
        'Step 1 of 1',
      );

      // Clicking next on a single-step tour should complete it
      fireEvent.click(screen.getByTestId('modal-next'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
      // onClose is NOT called automatically
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles step with optional properties', () => {
      const stepsWithOptionals: TourStep[] = [
        {
          id: 'step-1',
          title: 'Step with Extras',
          description: 'Description',
          showOverlay: true,
          position: 'top',
          image: 'some-image.png' as string,
        },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={stepsWithOptionals}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });

    it('handles undefined sandbox', () => {
      render(
        <TourFramework
          sandbox={undefined as any}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('guided-modal-test-tour')).toBeInTheDocument();
    });

    it('navigates through all steps correctly', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Start at step 1
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );

      // Go to step 2
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Go to step 3
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 3 Title',
      );

      // Go back to step 2
      fireEvent.click(screen.getByTestId('modal-previous'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Go back to step 1
      fireEvent.click(screen.getByTestId('modal-previous'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });
  });

  describe('Props Validation', () => {
    it('requires open prop', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open={false}
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(
        screen.queryByTestId('guided-modal-test-tour'),
      ).not.toBeInTheDocument();
    });

    it('requires steps prop', () => {
      const { container } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={[]}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('accepts all valid mode values', () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('guided-modal-test-tour')).toBeInTheDocument();

      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });
  });

  describe('Tour Storage Integration', () => {
    it('initializes tour status on mount', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockInitializeTourStatus).toHaveBeenCalledTimes(1);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('Initializing tour status for: test-tour'),
      );
    });

    it('only initializes tour status once', () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockInitializeTourStatus).toHaveBeenCalledTimes(1);

      // Rerender should not call initialize again
      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockInitializeTourStatus).toHaveBeenCalledTimes(1);
    });

    it('logs component mount', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          'TourFramework component mounted for tour test-tour',
        ),
      );
    });

    it('calls onComplete with completion status when status changes', () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockOnComplete).toHaveBeenCalledWith({
        isCompleted: false,
        isLoading: false,
      });

      // Simulate completion status change
      mockUseTourStorage.isTourCompleted = true;

      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockOnComplete).toHaveBeenCalledWith({
        isCompleted: true,
        isLoading: false,
      });
    });

    it('calls onComplete when loading state changes', () => {
      mockUseTourStorage.isLoading = true;

      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockOnComplete).toHaveBeenCalledWith({
        isCompleted: false,
        isLoading: true,
      });

      // Simulate loading finished
      mockUseTourStorage.isLoading = false;

      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(mockOnComplete).toHaveBeenCalledWith({
        isCompleted: false,
        isLoading: false,
      });
    });

    it('works when onComplete is not provided', () => {
      expect(() => {
        render(
          <TourFramework
            sandbox={mockSandbox}
            open
            steps={mockSteps}
            tourId="test-tour"
            onClose={mockOnClose}
            mode="modal"
          />,
        );
      }).not.toThrow();
    });
  });

  describe('Tour Completion - Modal Mode', () => {
    it('marks tour as completed when Done button is clicked', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      fireEvent.click(screen.getByTestId('modal-complete'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
    });

    it('marks tour as completed when Next is clicked on last step', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Navigate to last step
      fireEvent.click(screen.getByTestId('modal-next')); // Step 2
      fireEvent.click(screen.getByTestId('modal-next')); // Step 3

      // Click Next on last step
      fireEvent.click(screen.getByTestId('modal-next'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
    });

    it('does not mark tour as completed when Close button is clicked', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Click Close on first step
      fireEvent.click(screen.getByTestId('modal-close'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      expect(mockMarkTourCompleted).not.toHaveBeenCalled();
    });

    it('resets step index after completion', async () => {
      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('modal-next'));
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 2 Title',
      );

      // Complete the tour
      fireEvent.click(screen.getByTestId('modal-complete'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalled();
      });

      // Reopen the tour
      rerender(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Should start from step 1
      expect(screen.getByTestId('modal-title')).toHaveTextContent(
        'Step 1 Title',
      );
    });
  });

  describe('Tour Completion - Tooltip Mode', () => {
    it('marks tour as completed when Done button is clicked', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      fireEvent.click(screen.getByTestId('tooltip-complete'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
    });

    it('marks tour as completed when Next is clicked on last step', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      // Navigate to last step
      fireEvent.click(screen.getByTestId('tooltip-next')); // Step 2
      fireEvent.click(screen.getByTestId('tooltip-next')); // Step 3

      // Click Next on last step
      fireEvent.click(screen.getByTestId('tooltip-next'));

      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
      });
    });

    it('does not mark tour as completed when Close button is clicked', async () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      // Click Close on first step
      fireEvent.click(screen.getByTestId('tooltip-close'));

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      expect(mockMarkTourCompleted).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('integrates useTourStorage hook correctly', async () => {
      // Clear mocks to ensure clean state
      jest.clearAllMocks();

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      // Verify initialization was called
      expect(mockInitializeTourStatus).toHaveBeenCalledTimes(1);

      // Complete the tour
      fireEvent.click(screen.getByTestId('modal-complete'));

      // Wait for async completion
      await waitFor(() => {
        expect(mockMarkTourCompleted).toHaveBeenCalled();
      });

      // Verify completion was persisted
      expect(mockMarkTourCompleted).toHaveBeenCalledTimes(1);
    });

    it('works without sandbox', () => {
      expect(() => {
        render(
          <TourFramework
            sandbox={undefined as any}
            open
            steps={mockSteps}
            tourId="test-tour"
            onComplete={mockOnComplete}
            onClose={mockOnClose}
            mode="modal"
          />,
        );
      }).not.toThrow();
    });
  });

  describe('doneLabel Prop', () => {
    it('passes doneLabel prop to GuidedTooltip', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={mockSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          doneLabel="Finish"
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });
  });
});
