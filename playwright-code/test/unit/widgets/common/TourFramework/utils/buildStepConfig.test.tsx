import React from 'react';
import { render } from '@testing-library/react';
import { buildTooltipSteps } from 'src/js/widgets/common/TourFramework/utils/buildStepConfig';
import { TourStep } from 'src/js/widgets/common/TourFramework/types';

describe('buildStepConfig', () => {
  describe('buildTooltipSteps', () => {
    let mockOnStepChange: jest.Mock;
    let mockOnComplete: jest.Mock;
    let mockRenderTooltipContent: jest.Mock;
    let mockTargetRef1: React.RefObject<HTMLDivElement>;
    let mockTargetRef2: React.RefObject<HTMLDivElement>;
    let mockTargetRef3: React.RefObject<HTMLDivElement>;

    const createStep = (overrides: Partial<TourStep> = {}): TourStep => ({
      id: 'step-1',
      title: 'Step 1',
      description: 'Description 1',
      targetRef: mockTargetRef1,
      ...overrides,
    });

    beforeEach(() => {
      mockOnStepChange = jest.fn();
      mockOnComplete = jest.fn();
      mockRenderTooltipContent = jest.fn((step, index) => (
        <div data-testid={`content-${index}`}>
          {step.title}: {step.description}
        </div>
      ));

      mockTargetRef1 = { current: document.createElement('div') };
      mockTargetRef2 = { current: document.createElement('div') };
      mockTargetRef3 = { current: document.createElement('div') };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('Basic Functionality', () => {
      it('should build tooltip steps from tour steps', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];

        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result).toHaveLength(2);
        expect(mockRenderTooltipContent).toHaveBeenCalledTimes(2);
        expect(mockRenderTooltipContent).toHaveBeenCalledWith(steps[0], 0);
        expect(mockRenderTooltipContent).toHaveBeenCalledWith(steps[1], 1);
      });

      it('should return empty array for empty steps', () => {
        const result = buildTooltipSteps({
          steps: [],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result).toHaveLength(0);
        expect(mockRenderTooltipContent).not.toHaveBeenCalled();
      });

      it('should handle single step tour', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result).toHaveLength(1);
        expect(result[0].onClose).toBeDefined();
      });
    });

    describe('Target Element Handling', () => {
      it('should set targetElement from step targetRef', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result[0].targetElement).toBe(mockTargetRef1.current);
      });

      it.each([
        {
          description:
            'should set targetElement to null when targetRef is undefined',
          targetRef: undefined,
        },
        {
          description:
            'should set targetElement to null when targetRef.current is null',
          targetRef: { current: null } as React.RefObject<HTMLDivElement>,
        },
      ])('$description', ({ targetRef }) => {
        const result = buildTooltipSteps({
          steps: [createStep({ targetRef })],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result[0].targetElement).toBeNull();
      });
    });

    describe('Message Content', () => {
      it('should render message content using provided function', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const { container } = render(<>{result[0].message}</>);
        expect(
          container.querySelector('[data-testid="content-0"]'),
        ).toBeInTheDocument();
        expect(container.textContent).toContain('Step 1: Description 1');
      });

      it('should pass correct step and index to renderTooltipContent', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(mockRenderTooltipContent).toHaveBeenNthCalledWith(
          1,
          steps[0],
          0,
        );
        expect(mockRenderTooltipContent).toHaveBeenNthCalledWith(
          2,
          steps[1],
          1,
        );
      });
    });

    describe('Title Handling', () => {
      it('should set title to space to bypass IDS default', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result[0].title).toBe(' ');
      });

      it('should set className to hide-tooltip-title', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result[0].className).toBe('hide-tooltip-title');
      });
    });

    describe('Position and Alignment', () => {
      it('should use step position or default to bottom', () => {
        const steps = [
          createStep({ position: 'top' }),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].position).toBe('top');
        expect(result[1].position).toBe('bottom');
      });

      it('should use step alignment or default to left', () => {
        const steps = [
          createStep({ alignment: 'right' }),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].alignment).toBe('right');
        expect(result[1].alignment).toBe('left');
      });

      it('should handle all position values', () => {
        const steps = [
          createStep({ position: 'top' }),
          createStep({
            id: 'step-2',
            targetRef: mockTargetRef2,
            position: 'right',
          }),
          createStep({
            id: 'step-3',
            targetRef: mockTargetRef3,
            position: 'left',
          }),
        ];
        const result = buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].position).toBe('top');
        expect(result[1].position).toBe('right');
        expect(result[2].position).toBe('left');
      });
    });

    describe('Click Away Behavior', () => {
      it('should always set enableClickAway to true', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].enableClickAway).toBe(true);
        expect(result[1].enableClickAway).toBe(true);
      });
    });

    describe('Labels', () => {
      it('should use step labels when provided', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ nextLabel: 'Continue', backLabel: 'Previous' })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].nextLabel).toBe('Continue');
        expect(result[0].backLabel).toBe('Previous');
      });

      it('should use default labels when not provided', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].nextLabel).toBe('Next');
        expect(result[0].backLabel).toBe('Back');
      });
    });

    describe('Style Position', () => {
      it('should set stylePosition function that returns zIndex', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].stylePosition).toBeDefined();
        expect(typeof result[0].stylePosition).toBe('function');
        expect(result[0].stylePosition!({} as any)).toEqual({ zIndex: 999 });
      });

      it('should add CSS translate when tooltipOffset is provided', () => {
        // tooltipOffset uses the CSS `translate` property (not
        // `transform`) so it composes with IDS' positioning transform.
        // It also bumps zIndex above the drawer overlay so the offset
        // tooltip stays clickable.
        const result = buildTooltipSteps({
          steps: [createStep({ tooltipOffset: { x: 250, y: -10 } })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const style = result[0].stylePosition!(
          {} as any,
        ) as React.CSSProperties;
        expect(style).toEqual({ zIndex: 99999999, translate: '250px -10px' });
      });

      it('should default missing tooltipOffset axes to 0', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ tooltipOffset: { x: 100 } })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const style = result[0].stylePosition!(
          {} as any,
        ) as React.CSSProperties;
        expect(style.translate).toBe('100px 0px');
      });

      it('should omit stylePosition entirely when no offset and trowser-hide is disabled', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
          shouldHideUnderTrowser: false,
        });

        expect(result[0].stylePosition).toBeUndefined();
      });
    });

    describe('Step Navigation Callbacks', () => {
      it('should setup onNextClick to call onStepChange with next index', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[0].onNextClick!(0);
        expect(mockOnStepChange).toHaveBeenCalledWith(1);

        result[1].onNextClick!(1);
        expect(mockOnStepChange).toHaveBeenCalledWith(2);
      });

      it('should setup onBackClick to call onStepChange with previous index', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[1].onBackClick!(1);
        expect(mockOnStepChange).toHaveBeenCalledWith(0);

        result[0].onBackClick!(0);
        expect(mockOnStepChange).toHaveBeenCalledWith(-1);
      });

      it('should not setup navigation callbacks when onStepChange is not provided', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].onNextClick).toBeUndefined();
        expect(result[0].onBackClick).toBeUndefined();
      });

      it('should execute custom onNext callback when provided', () => {
        const mockOnNext = jest.fn();
        const steps = [createStep({ onNext: mockOnNext })];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[0].onNextClick!(0);
        expect(mockOnNext).toHaveBeenCalledTimes(1);
        expect(mockOnStepChange).toHaveBeenCalledWith(1);
      });

      it('should execute custom onBack callback when provided', () => {
        const mockOnBack = jest.fn();
        const steps = [
          createStep(),
          createStep({
            id: 'step-2',
            targetRef: mockTargetRef2,
            onBack: mockOnBack,
          }),
        ];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[1].onBackClick!(1);
        expect(mockOnBack).toHaveBeenCalledTimes(1);
        expect(mockOnStepChange).toHaveBeenCalledWith(0);
      });

      it('should call onStepChange even when no custom onNext callback', () => {
        const steps = [createStep()];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[0].onNextClick!(0);
        expect(mockOnStepChange).toHaveBeenCalledWith(1);
      });

      it('should call onStepChange even when no custom onBack callback', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[1].onBackClick!(1);
        expect(mockOnStepChange).toHaveBeenCalledWith(0);
      });
    });

    describe('Last Step Behavior', () => {
      it('should add onClose callback only to the last step', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
          createStep({ id: 'step-3', targetRef: mockTargetRef3 }),
        ];
        const result = buildTooltipSteps({
          steps,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].onClose).toBeUndefined();
        expect(result[1].onClose).toBeUndefined();
        expect(result[2].onClose).toBeDefined();
      });

      it('should call onComplete when onClose is triggered on last step', () => {
        const steps = [
          createStep(),
          createStep({ id: 'step-2', targetRef: mockTargetRef2 }),
        ];
        const result = buildTooltipSteps({
          steps,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        result[1].onClose!();
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      it('should add onClose callback even when onComplete is not provided', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].onClose).toBeDefined();
        expect(() => result[0].onClose!()).not.toThrow();
      });

      it('should handle single step as last step', () => {
        const result = buildTooltipSteps({
          steps: [createStep()],
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].onClose).toBeDefined();
        result[0].onClose!();
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    describe('Overlay and CoachMarks', () => {
      it.each([
        {
          description:
            'should not add renderCoachMarks when showOverlay is false',
          overrides: { showOverlay: false as const },
        },
        {
          description:
            'should not add renderCoachMarks when showOverlay is undefined',
          overrides: {} as Partial<
            typeof createStep extends (o: infer O) => any ? O : never
          >,
        },
      ])('$description', ({ overrides }) => {
        const result = buildTooltipSteps({
          steps: [createStep(overrides)],
          renderTooltipContent: mockRenderTooltipContent,
        });
        expect(result[0].renderCoachMarks).toBeUndefined();
      });

      it('should add renderCoachMarks when showOverlay is true', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ showOverlay: true })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].renderCoachMarks).toBeDefined();
        expect(typeof result[0].renderCoachMarks).toBe('function');
      });

      it('should render CoachMarks with correct props', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ showOverlay: true })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const mockChildren = <div>Test Child</div>;
        const coachMarksElement = result[0].renderCoachMarks!({
          open: true,
          children: mockChildren,
        } as any);

        expect(coachMarksElement).not.toBeNull();
        const { container } = render(<>{coachMarksElement}</>);
        expect(container).toBeInTheDocument();
      });

      it('should pass correct props to CoachMarks component', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ showOverlay: true })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const mockChildren = <div>Test Child</div>;
        const coachMarksElement = result[0].renderCoachMarks!({
          open: true,
          onClose: jest.fn(),
          children: mockChildren,
        } as any);

        expect(coachMarksElement).not.toBeNull();
        expect(coachMarksElement?.props.open).toBe(true);
        expect(coachMarksElement?.props.targetDomNode).toBe(
          mockTargetRef1.current,
        );
        expect(coachMarksElement?.props.borderRadius).toBe(8);
        expect(coachMarksElement?.props.padding).toBe(8);
      });

      it('should handle undefined open prop in CoachMarks', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ showOverlay: true })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        const mockChildren = <div>Test Child</div>;
        const coachMarksElement = result[0].renderCoachMarks!({
          children: mockChildren,
        } as any);

        expect(coachMarksElement?.props.open).toBe(false);
      });

      it('should conditionally add overlay to different steps', () => {
        const steps = [
          createStep({ showOverlay: true }),
          createStep({
            id: 'step-2',
            targetRef: mockTargetRef2,
            showOverlay: false,
          }),
          createStep({
            id: 'step-3',
            targetRef: mockTargetRef3,
            showOverlay: true,
          }),
        ];
        const result = buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].renderCoachMarks).toBeDefined();
        expect(result[1].renderCoachMarks).toBeUndefined();
        expect(result[2].renderCoachMarks).toBeDefined();
      });
    });

    describe('Integration Scenarios', () => {
      it('should build complete step config with all optional properties', () => {
        const result = buildTooltipSteps({
          steps: [
            createStep({
              position: 'top',
              alignment: 'center',
              showOverlay: true,
              image: 'image.png',
            }),
          ],
          onStepChange: mockOnStepChange,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0]).toMatchObject({
          targetElement: mockTargetRef1.current,
          position: 'top',
          alignment: 'center',
          enableClickAway: true,
          title: ' ',
          className: 'hide-tooltip-title',
          nextLabel: 'Next',
          backLabel: 'Back',
        });
        expect(result[0].stylePosition).toBeDefined();
        expect(result[0].onNextClick).toBeDefined();
        expect(result[0].onBackClick).toBeDefined();
        expect(result[0].onClose).toBeDefined();
        expect(result[0].renderCoachMarks).toBeDefined();
      });

      it('should build minimal step config with only required properties', () => {
        const result = buildTooltipSteps({
          steps: [createStep({ targetRef: undefined })],
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0]).toMatchObject({
          targetElement: null,
          position: 'bottom',
          alignment: 'left',
          enableClickAway: true,
          title: ' ',
          className: 'hide-tooltip-title',
          nextLabel: 'Next',
          backLabel: 'Back',
        });
        expect(result[0].stylePosition).toBeDefined();
        expect(result[0].onNextClick).toBeUndefined();
        expect(result[0].onBackClick).toBeUndefined();
        expect(result[0].onClose).toBeDefined();
        expect(result[0].renderCoachMarks).toBeUndefined();
      });

      it('should correctly handle multi-step tour with mixed configurations', () => {
        const steps = [
          createStep({ showOverlay: true }),
          createStep({
            id: 'step-2',
            targetRef: mockTargetRef2,
            position: 'right',
          }),
          createStep({
            id: 'step-3',
            targetRef: mockTargetRef3,
            alignment: 'right',
          }),
        ];
        const result = buildTooltipSteps({
          steps,
          onStepChange: mockOnStepChange,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result[0].renderCoachMarks).toBeDefined();
        expect(result[0].onClose).toBeUndefined();
        expect(result[1].position).toBe('right');
        expect(result[1].renderCoachMarks).toBeUndefined();
        expect(result[1].onClose).toBeUndefined();
        expect(result[2].alignment).toBe('right');
        expect(result[2].onClose).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle steps with null targetRef current', () => {
        expect(() => {
          buildTooltipSteps({
            steps: [createStep({ targetRef: { current: null } })],
            renderTooltipContent: mockRenderTooltipContent,
          });
        }).not.toThrow();
      });

      it('should handle renderTooltipContent returning null', () => {
        const nullRenderer = jest.fn(() => null);
        const result = buildTooltipSteps({
          steps: [createStep()],
          renderTooltipContent: nullRenderer,
        });

        expect(result[0].message).toBeNull();
      });

      it('should handle large number of steps', () => {
        const steps = Array.from({ length: 100 }, (_, i) => ({
          id: `step-${i + 1}`,
          title: `Step ${i + 1}`,
          description: `Description ${i + 1}`,
          targetRef: { current: document.createElement('div') },
        }));
        const result = buildTooltipSteps({
          steps,
          onComplete: mockOnComplete,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(result).toHaveLength(100);
        expect(result[0].onClose).toBeUndefined();
        expect(result[99].onClose).toBeDefined();
      });

      it('should preserve step order', () => {
        const steps = [
          { id: 'c', title: 'C', description: 'C' },
          { id: 'a', title: 'A', description: 'A' },
          { id: 'b', title: 'B', description: 'B' },
        ];
        buildTooltipSteps({
          steps,
          renderTooltipContent: mockRenderTooltipContent,
        });

        expect(mockRenderTooltipContent).toHaveBeenNthCalledWith(
          1,
          steps[0],
          0,
        );
        expect(mockRenderTooltipContent).toHaveBeenNthCalledWith(
          2,
          steps[1],
          1,
        );
        expect(mockRenderTooltipContent).toHaveBeenNthCalledWith(
          3,
          steps[2],
          2,
        );
      });
    });
  });
});
