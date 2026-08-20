import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';

import { buildTooltipSteps } from 'src/js/widgets/common/TourFramework/utils/buildStepConfig';
import GuidedTooltip from 'src/js/widgets/common/TourFramework/components/GuidedTooltip/GuidedTooltip';
import { getRandomColor } from 'src/js/widgets/common/TourFramework/constants';

// Mock @design-systems/theme
jest.mock('@design-systems/theme', () => ({
  useTheme: jest.fn(() => ({
    currentTheme: 'quickbooks',
    currentColorScheme: 'light',
  })),
}));

// Mock dependencies (but NOT the component itself!)
jest.mock(
  '@ids-ts/guided-tour-tooltip',
  () =>
    function MockGuidedTourTooltip(props: any) {
      return props.open ? (
        <div
          data-testid="guided-tour-tooltip"
          data-open={props.open}
          data-done-label={props.doneLabel}
          data-theme={props.theme}
          data-color-scheme={props.colorScheme}
        >
          {props.steps?.map((step: any, idx: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={idx} data-testid={`step-${idx}`}>
              {step.message}
            </div>
          ))}
          <button data-testid="mock-close-button" onClick={props.onClose}>
            Close
          </button>
        </div>
      ) : null;
    },
);

jest.mock('src/js/widgets/common/TourFramework/utils/buildStepConfig');
jest.mock('src/js/widgets/common/TourFramework/constants', () => ({
  getRandomColor: jest.fn(() => '#f0e6f6'),
}));

const mockBuildTooltipSteps = buildTooltipSteps as jest.MockedFunction<
  typeof buildTooltipSteps
>;
const mockGetRandomColor = getRandomColor as jest.MockedFunction<
  typeof getRandomColor
>;

describe('GuidedTooltip', () => {
  let mockOnClose: jest.Mock;
  let mockOnStepChange: jest.Mock;
  let mockOnComplete: jest.Mock;
  let mockTargetRef: React.RefObject<HTMLDivElement>;

  const createStep = (overrides: any = {}): TourStep => ({
    id: 'step-1',
    title: 'Step 1',
    description: 'Description 1',
    targetRef: mockTargetRef,
    ...overrides,
  });

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnStepChange = jest.fn();
    mockOnComplete = jest.fn();
    mockTargetRef = { current: document.createElement('div') };

    // Default implementation that returns valid step config
    mockBuildTooltipSteps.mockImplementation(
      ({ steps, renderTooltipContent }) =>
        steps.map((step: any, index: number) => ({
          targetElement: step.targetRef?.current,
          message: renderTooltipContent ? (
            renderTooltipContent(step, index)
          ) : (
            <div>{step.title}</div>
          ),
        })) as any,
    );

    mockGetRandomColor.mockReturnValue('#f0e6f6');

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render GuidedTourTooltip when open with valid steps', async () => {
      render(
        <GuidedTooltip open steps={[createStep()]} onClose={mockOnClose} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('guided-tour-tooltip')).toBeInTheDocument();
      });
    });

    it.each([
      {
        description: 'should not render when open is false',
        renderTooltip: () => (
          <GuidedTooltip
            open={false}
            steps={[createStep()]}
            onClose={mockOnClose}
          />
        ),
      },
      {
        description: 'should not render when steps array is empty',
        renderTooltip: () => (
          <GuidedTooltip open steps={[]} onClose={mockOnClose} />
        ),
      },
      {
        description: 'should not render when all steps have invalid targetRef',
        renderTooltip: () => (
          <GuidedTooltip
            open
            steps={[createStep({ targetRef: { current: null } })]}
            onClose={mockOnClose}
          />
        ),
      },
    ])('$description', ({ renderTooltip }) => {
      render(renderTooltip());

      expect(
        screen.queryByTestId('guided-tour-tooltip'),
      ).not.toBeInTheDocument();
    });

    it('should pass all steps to buildTooltipSteps when at least one has valid targetRef', async () => {
      const validStep = createStep({ id: 'valid-step' });
      const invalidStep = createStep({
        id: 'invalid-step',
        targetRef: { current: null },
      });

      render(
        <GuidedTooltip
          open
          steps={[validStep, invalidStep]}
          onClose={mockOnClose}
        />,
      );

      await waitFor(() => {
        // Component passes all steps to buildTooltipSteps
        // The filtering of validSteps is only used to check if component should render
        expect(mockBuildTooltipSteps).toHaveBeenCalledWith(
          expect.objectContaining({
            steps: [validStep, invalidStep],
          }),
        );
      });
    });
  });

  describe('Props passing', () => {
    it('should pass correct props to GuidedTourTooltip', async () => {
      render(
        <GuidedTooltip
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          doneLabel="Finish"
        />,
      );

      await waitFor(() => {
        const tooltip = screen.getByTestId('guided-tour-tooltip');
        expect(tooltip).toHaveAttribute('data-done-label', 'Finish');
        expect(tooltip).toHaveAttribute('data-theme', 'quickbooks');
        expect(tooltip).toHaveAttribute('data-color-scheme', 'light');
        expect(tooltip).toHaveAttribute('data-open', 'true');
      });
    });

    it.each([
      {
        description: 'should use default doneLabel when not provided',
        doneLabel: undefined as string | undefined,
        expectedLabel: 'Done',
      },
      {
        description: 'should pass custom doneLabel to GuidedTourTooltip',
        doneLabel: 'Finish',
        expectedLabel: 'Finish',
      },
    ])('$description', async ({ doneLabel, expectedLabel }) => {
      render(
        <GuidedTooltip
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          doneLabel={doneLabel}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('guided-tour-tooltip')).toHaveAttribute(
          'data-done-label',
          expectedLabel,
        );
      });
    });

    it('should pass onStepChange and onComplete to buildTooltipSteps', async () => {
      render(
        <GuidedTooltip
          open
          steps={[createStep()]}
          onClose={mockOnClose}
          onStepChange={mockOnStepChange}
          onComplete={mockOnComplete}
        />,
      );

      await waitFor(() => {
        expect(mockBuildTooltipSteps).toHaveBeenCalledWith(
          expect.objectContaining({
            onStepChange: mockOnStepChange,
            onComplete: mockOnComplete,
          }),
        );
      });
    });
  });

  describe('Content rendering', () => {
    it('should render tooltip content with title and description', async () => {
      const step = createStep({
        title: 'Test Title',
        description: 'Test Description',
      });

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    it('should render progress dots for multiple steps', async () => {
      const step1 = createStep({ id: 'step-1' });
      const step2Ref = { current: document.createElement('div') };
      const step2 = createStep({ id: 'step-2', targetRef: step2Ref });

      render(
        <GuidedTooltip open steps={[step1, step2]} onClose={mockOnClose} />,
      );

      await waitFor(() => {
        // The progress dots are rendered within the tooltip content
        // We can verify buildTooltipSteps was called with renderTooltipContent
        expect(mockBuildTooltipSteps).toHaveBeenCalledWith(
          expect.objectContaining({
            renderTooltipContent: expect.any(Function),
          }),
        );
      });
    });

    it('should not render progress dots for single step tours', async () => {
      const step = createStep({ id: 'single-step' });

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByTestId('guided-tour-tooltip')).toBeInTheDocument();
      });

      // Progress dots should not be in the document for single step
      // The renderTooltipContent should not include ProgressDots when steps.length === 1
      expect(mockBuildTooltipSteps).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: [step],
        }),
      );
    });

    it('should call getRandomColor for each step', async () => {
      const step = createStep();

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        // getRandomColor is called during renderTooltipContent
        expect(mockGetRandomColor).toHaveBeenCalled();
      });
    });

    it('should skip the media block and the random color when hideMedia is true', async () => {
      const step = createStep({
        title: 'Text-only',
        description: 'No media here',
        hideMedia: true,
      });

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        // Text content is still rendered for screen readers / assistive
        // tech regardless of the visual media block.
        expect(screen.getByText('Text-only')).toBeInTheDocument();
        expect(screen.getByText('No media here')).toBeInTheDocument();
      });
      // The fallback colored placeholder is what `getRandomColor`
      // backs — when hideMedia is true the entire media section is
      // omitted, so the helper must NOT be called.
      expect(mockGetRandomColor).not.toHaveBeenCalled();
    });
  });

  describe('Single step tours', () => {
    it('should render ButtonFooter with Done button for single step', async () => {
      const step = createStep({ id: 'single-step' });

      render(
        <GuidedTooltip
          open
          steps={[step]}
          onClose={mockOnClose}
          doneLabel="Got It"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Got It')).toBeInTheDocument();
      });
    });

    it('should call onComplete and onClose when Done button is clicked', async () => {
      const step = createStep({ id: 'single-step' });

      render(
        <GuidedTooltip
          open
          steps={[step]}
          onClose={mockOnClose}
          onComplete={mockOnComplete}
          doneLabel="Done"
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Done'));

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Done button is clicked even if onComplete is not provided', async () => {
      const step = createStep({ id: 'single-step' });

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Done'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should use default doneLabel "Done" for ButtonFooter', async () => {
      const step = createStep({ id: 'single-step' });

      render(<GuidedTooltip open steps={[step]} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('should call buildTooltipSteps with all required parameters', async () => {
      const steps = [createStep()];

      render(
        <GuidedTooltip
          open
          steps={steps}
          onClose={mockOnClose}
          onStepChange={mockOnStepChange}
          onComplete={mockOnComplete}
        />,
      );

      await waitFor(() => {
        expect(mockBuildTooltipSteps).toHaveBeenCalledWith({
          steps,
          onStepChange: mockOnStepChange,
          onComplete: mockOnComplete,
          renderTooltipContent: expect.any(Function),
          shouldHideUnderTrowser: expect.any(Boolean),
        });
      });
    });

    it('should call onClose when GuidedTourTooltip triggers close', async () => {
      render(
        <GuidedTooltip open steps={[createStep()]} onClose={mockOnClose} />,
      );

      await waitFor(() => {
        const closeButton = screen.getByTestId('mock-close-button');
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
