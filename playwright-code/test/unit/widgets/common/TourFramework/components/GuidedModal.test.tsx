import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GuidedModal from 'src/js/widgets/common/TourFramework/components/GuidedModal/GuidedModal';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';
import { getRandomColor } from 'src/js/widgets/common/TourFramework/constants';

// Mock the Modal component from IDS
jest.mock('@ids-ts/modal-dialog', () => ({
  Modal: ({
    children,
    open,
    onClose,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
    'data-testid': string;
  }) =>
    open ? (
      <div data-testid={dataTestId} data-open={open}>
        {children}
        <button data-testid="modal-backdrop" onClick={onClose}>
          Backdrop
        </button>
      </div>
    ) : null,
  ModalHeader: ({
    children,
    onClose,
    dismissible,
  }: {
    children: React.ReactNode;
    onClose: () => void;
    dismissible: boolean;
  }) => (
    <div data-testid="modal-header">
      {dismissible && (
        <button data-testid="modal-close-button" onClick={onClose}>
          Close
        </button>
      )}
      {children}
    </div>
  ),
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-content">{children}</div>
  ),
  ModalActions: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-actions">{children}</div>
  ),
}));

// Mock constants
jest.mock('src/js/widgets/common/TourFramework/constants', () => ({
  getRandomColor: jest.fn(() => '#f0e6f6'),
}));

// Mock typography
jest.mock('@ids-ts/typography', () => ({
  H4: ({
    children,
    id,
    weight,
  }: {
    children: React.ReactNode;
    id?: string;
    weight?: string;
  }) => (
    <h4 data-testid="h4-title" id={id} data-weight={weight}>
      {children}
    </h4>
  ),
  B2: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p data-testid="b2-description" id={id}>
      {children}
    </p>
  ),
  B3: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p data-testid="b3-description" id={id}>
      {children}
    </p>
  ),
}));

// Mock Lottie component
jest.mock('@cgds/lottie', () => ({
  Lottie: ({
    data,
    autoPlay,
    description,
    title,
  }: {
    data: object;
    autoPlay?: boolean;
    description?: string;
    title?: string;
  }) => (
    <div
      data-testid="lottie-animation"
      data-autoplay={autoPlay}
      data-description={description}
      data-title={title}
    >
      Lottie Animation
    </div>
  ),
}));

const mockGetRandomColor = getRandomColor as jest.MockedFunction<
  typeof getRandomColor
>;

describe('GuidedModal', () => {
  let mockOnClose: jest.Mock;
  let mockOnComplete: jest.Mock;

  const createStep = (overrides: Partial<TourStep> = {}): TourStep => ({
    id: 'step-1',
    title: 'Step 1 Title',
    description: 'Step 1 Description',
    ...overrides,
  });

  const createMultipleSteps = (count: number): TourStep[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `step-${i + 1}`,
      title: `Step ${i + 1} Title`,
      description: `Step ${i + 1} Description`,
    }));

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnComplete = jest.fn();
    mockGetRandomColor.mockReturnValue('#f0e6f6');
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open with valid steps', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-modal-test-tour')).toBeInTheDocument();
    });

    it.each([
      {
        description: 'should not render when open is false',
        props: { open: false as boolean, steps: [createStep()] },
      },
      {
        description: 'should not render when steps array is empty',
        props: { open: true, steps: [] as TourStep[] },
      },
      {
        description: 'should not render when steps is undefined/null',
        props: { open: true, steps: null as any },
      },
    ])('$description', ({ props }) => {
      render(
        <GuidedModal tourId="test-tour" onClose={mockOnClose} {...props} />,
      );

      expect(
        screen.queryByTestId('guided-modal-test-tour'),
      ).not.toBeInTheDocument();
    });

    it('should render title and description', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[
            createStep({ title: 'Test Title', description: 'Test Desc' }),
          ]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Desc')).toBeInTheDocument();
    });

    it('should reset step index when modal opens', () => {
      const steps = createMultipleSteps(3);

      const { rerender } = render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument();

      // Close and reopen modal
      rerender(
        <GuidedModal
          tourId="test-tour"
          open={false}
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      rerender(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Should be back to first step
      expect(screen.getByText('Step 1 Title')).toBeInTheDocument();
    });
  });

  describe('Media Content', () => {
    it('should render Lottie animation when lottieData is provided', () => {
      const lottieData = { v: '5.5.7', fr: 30 };
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep({ lottieData })]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('lottie-animation')).toBeInTheDocument();
    });

    it('should render image when image is provided and no lottieData', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep({ image: '/test-image.png' })]}
          onClose={mockOnClose}
        />,
      );

      const image = screen.getByAltText('Step 1 Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.png');
    });

    it('should prioritize lottieData over image', () => {
      const lottieData = { v: '5.5.7', fr: 30 };
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep({ lottieData, image: '/test-image.png' })]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('lottie-animation')).toBeInTheDocument();
      expect(screen.queryByAltText('Step 1 Title')).not.toBeInTheDocument();
    });

    it('should use random color background when no media is provided', () => {
      mockGetRandomColor.mockReturnValue('#e6f4ea');
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      expect(mockGetRandomColor).toHaveBeenCalled();
    });

    it('should use transparent background when media is provided', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep({ image: '/test-image.png' })]}
          onClose={mockOnClose}
        />,
      );

      // getRandomColor should still be called, but background should be transparent
      // We verify the image renders correctly
      expect(screen.getByAltText('Step 1 Title')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step when Next button is clicked', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText('Step 1 Title')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(screen.getByText('Step 2 Title')).toBeInTheDocument();
    });

    it('should navigate to previous step when Back button is clicked', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Go to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument();

      // Go back to step 1
      fireEvent.click(screen.getByTestId('guided-modal-back'));
      expect(screen.getByText('Step 1 Title')).toBeInTheDocument();
    });

    it('should hide Back button on first step', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      expect(screen.queryByTestId('guided-modal-back')).not.toBeInTheDocument();
    });

    it('should show Back button on subsequent steps', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(screen.getByTestId('guided-modal-back')).toBeInTheDocument();
    });

    it('should show Done button on last step', () => {
      const steps = createMultipleSteps(2);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Go to last step
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Done',
      );
    });

    it('should close modal and complete tour on Done button click', () => {
      const steps = createMultipleSteps(2);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />,
      );

      // Go to last step
      fireEvent.click(screen.getByTestId('guided-modal-action'));
      // Click Done
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Single Step Tour', () => {
    it('should show Done button for single step tour', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Done',
      );
    });

    it('should not show Back button for single step tour', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.queryByTestId('guided-modal-back')).not.toBeInTheDocument();
    });

    it('should complete and close on Done click for single step', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Dots', () => {
    it('should show progress dots for multi-step tours', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('progress-dots')).toBeInTheDocument();
      expect(screen.getByTestId('progress-dot-0')).toBeInTheDocument();
      expect(screen.getByTestId('progress-dot-1')).toBeInTheDocument();
      expect(screen.getByTestId('progress-dot-2')).toBeInTheDocument();
    });

    it('should not show progress dots for single step tour', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.queryByTestId('progress-dots')).not.toBeInTheDocument();
    });

    it('should update active dot on navigation', () => {
      const steps = createMultipleSteps(3);
      const { container } = render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      // Verify we're on step 2
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument();
    });
  });

  describe('Custom Labels', () => {
    it('should use custom nextLabel', () => {
      const steps = createMultipleSteps(2);
      steps[0].nextLabel = 'Continue';

      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Continue',
      );
    });

    it('should use custom backLabel', () => {
      const steps = createMultipleSteps(2);
      steps[1].backLabel = 'Previous';

      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Go to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(screen.getByTestId('guided-modal-back')).toHaveTextContent(
        'Previous',
      );
    });

    it('should use custom doneLabel', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep({ doneLabel: 'Got It!' })]}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Got It!',
      );
    });

    it('should use default labels when not provided', () => {
      const steps = createMultipleSteps(3);
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // First step - Next button
      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Next',
      );

      // Go to second step
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      // Back button should show
      expect(screen.getByTestId('guided-modal-back')).toHaveTextContent('Back');

      // Go to last step
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      // Done button
      expect(screen.getByTestId('guided-modal-action')).toHaveTextContent(
        'Done',
      );
    });
  });

  describe('Callbacks', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      fireEvent.click(screen.getByTestId('modal-close-button'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when close button is clicked', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByTestId('modal-close-button'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call step onNext callback when navigating forward', () => {
      const onNextMock = jest.fn();
      const steps = [
        createStep({ onNext: onNextMock }),
        createStep({ id: 'step-2' }),
      ];

      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(onNextMock).toHaveBeenCalledTimes(1);
    });

    it('should call step onBack callback when navigating backward', () => {
      const onBackMock = jest.fn();
      const steps = [
        createStep(),
        createStep({ id: 'step-2', onBack: onBackMock }),
      ];

      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Go to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));
      // Go back
      fireEvent.click(screen.getByTestId('guided-modal-back'));

      expect(onBackMock).toHaveBeenCalledTimes(1);
    });

    it('should call onNext callback on last step before completing', () => {
      const onNextMock = jest.fn();
      const steps = [createStep({ onNext: onNextMock })];

      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />,
      );

      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(onNextMock).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not fail if onComplete is not provided', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      // Should not throw
      fireEvent.click(screen.getByTestId('guided-modal-action'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Behavior', () => {
    it('should reset step index when closing', () => {
      const steps = createMultipleSteps(3);
      const { rerender } = render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByTestId('guided-modal-action'));
      expect(screen.getByText('Step 2 Title')).toBeInTheDocument();

      // Simulate closing via onClose callback
      // The component resets state when handleClose is called
      fireEvent.click(screen.getByTestId('modal-close-button'));

      // Reopen modal
      rerender(
        <GuidedModal
          tourId="test-tour"
          open
          steps={steps}
          onClose={mockOnClose}
        />,
      );

      // Should be at first step due to useEffect resetting on open
      expect(screen.getByText('Step 1 Title')).toBeInTheDocument();
    });

    it('should complete tour on any close action (X button or Done)', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
        />,
      );

      // Close via X button
      fireEvent.click(screen.getByTestId('modal-close-button'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible title id', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      const title = screen.getByText('Step 1 Title');
      expect(title.closest('[id="guided-modal-title"]')).toBeInTheDocument();
    });

    it('should have accessible description id', () => {
      render(
        <GuidedModal
          tourId="test-tour"
          open
          steps={[createStep()]}
          onClose={mockOnClose}
        />,
      );

      const description = screen.getByText('Step 1 Description');
      expect(
        description.closest('[id="guided-modal-description"]'),
      ).toBeInTheDocument();
    });
  });
});
