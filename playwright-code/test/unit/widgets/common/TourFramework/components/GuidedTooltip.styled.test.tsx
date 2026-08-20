import React from 'react';
import { render } from '@testing-library/react';
import 'jest-styled-components';
import {
  HideTitleStyles,
  ImageSection,
  LottieSection,
  ProgressDots,
  ProgressDot,
  ContentSection,
  StepTitle,
  Description,
  ButtonFooter,
  SingleStepFooter,
} from 'src/js/widgets/common/TourFramework/components/GuidedTooltip/GuidedTooltip.styled';

describe('GuidedTooltip.styled', () => {
  describe('HideTitleStyles', () => {
    it('should render global styles component without crashing', () => {
      const { container } = render(<HideTitleStyles />);
      expect(container).toBeInTheDocument();
    });

    it('should be a styled component', () => {
      expect(HideTitleStyles).toBeDefined();
      expect(typeof HideTitleStyles).toBe('function');
    });
  });

  describe('ImageSection', () => {
    it('should render correctly', () => {
      const { container } = render(
        <ImageSection>
          <div>Image content</div>
        </ImageSection>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have position relative', () => {
      const { container } = render(<ImageSection />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveStyleRule('position', 'relative');
    });
  });

  describe('LottieSection', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <LottieSection>
          <div>Lottie animation</div>
        </LottieSection>,
      );
      expect(getByText('Lottie animation')).toBeInTheDocument();
    });

    it('should have correct dimensions and layout', () => {
      const { container } = render(<LottieSection />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('width', '100%');
      expect(element).toHaveStyleRule('height', '168px');
      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('justify-content', 'center');
      expect(element).toHaveStyleRule('margin', '0');
      expect(element).toHaveStyleRule('overflow', 'hidden');
    });

    it('should have proper img styles', () => {
      const { container } = render(
        <LottieSection>
          <img src="test.jpg" alt="test" />
        </LottieSection>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('width', '100%', {
        modifier: 'img',
      });
      expect(element).toHaveStyleRule('height', '100%', {
        modifier: 'img',
      });
      expect(element).toHaveStyleRule('object-fit', 'cover', {
        modifier: 'img',
      });
      expect(element).toHaveStyleRule('display', 'block', {
        modifier: 'img',
      });
    });
  });

  describe('ProgressDots', () => {
    it('should render multiple children', () => {
      const { container } = render(
        <ProgressDots>
          <div>Dot 1</div>
          <div>Dot 2</div>
          <div>Dot 3</div>
        </ProgressDots>,
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild?.childNodes.length).toBe(3);
    });

    it('should have correct flex layout', () => {
      const { container } = render(<ProgressDots />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('gap', '6px');
      expect(element).toHaveStyleRule('justify-content', 'center');
      expect(element).toHaveStyleRule('padding', '8px 0');
    });
  });

  describe('ProgressDot', () => {
    it.each([
      {
        description: 'should render active dot with correct color',
        active: true,
        expectedColor: '#2c6b2f',
      },
      {
        description: 'should render inactive dot with correct color',
        active: false,
        expectedColor: '#d1d1d1',
      },
    ])('$description', ({ active, expectedColor }) => {
      const { container } = render(<ProgressDot active={active} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('background-color', expectedColor);
    });

    it('should have correct dimensions and shape', () => {
      const { container } = render(<ProgressDot active />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('width', '8px');
      expect(element).toHaveStyleRule('height', '8px');
      expect(element).toHaveStyleRule('border-radius', '50%');
    });

    it('should have transition effect', () => {
      const { container } = render(<ProgressDot active />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule(
        'transition',
        'background-color 0.2s ease',
      );
    });

    it('should toggle between active and inactive states', () => {
      const { container, rerender } = render(<ProgressDot active={false} />);
      let element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('background-color', '#d1d1d1');

      rerender(<ProgressDot active />);
      element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('background-color', '#2c6b2f');
    });
  });

  describe('ContentSection', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ContentSection>
          <div>Content text</div>
        </ContentSection>,
      );
      expect(getByText('Content text')).toBeInTheDocument();
    });

    it('should have correct dimensions and layout', () => {
      const { container } = render(<ContentSection />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('width', '100%');
      expect(element).toHaveStyleRule('padding-right', '4px');
      expect(element).toHaveStyleRule('padding-left', '8px');
      expect(element).toHaveStyleRule('box-sizing', 'border-box');
      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('flex-direction', 'column');
      expect(element).toHaveStyleRule('overflow-y', 'visible');
    });
  });

  describe('StepTitle', () => {
    it('should render title text', () => {
      const { getByText } = render(<StepTitle>Step Title</StepTitle>);
      expect(getByText('Step Title')).toBeInTheDocument();
    });

    it('should have correct typography and spacing', () => {
      const { container } = render(<StepTitle>Title</StepTitle>);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('font-size', '14px');
      expect(element).toHaveStyleRule('font-weight', '600');
      expect(element).toHaveStyleRule('margin', '0 0 8px 0');
      expect(element).toHaveStyleRule('color', '#393a3d');
      expect(element).toHaveStyleRule('line-height', '1.3');
    });
  });

  describe('Description', () => {
    it('should render description text', () => {
      const { getByText } = render(
        <Description>This is a description</Description>,
      );
      expect(getByText('This is a description')).toBeInTheDocument();
    });

    it('should have correct typography and color', () => {
      const { container } = render(<Description>Text</Description>);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('font-size', '13px');
      expect(element).toHaveStyleRule('line-height', '1.5');
      expect(element).toHaveStyleRule('color', '#6b6c72');
    });
  });

  describe('Styled components integration', () => {
    it('should render complete tooltip structure', () => {
      const { getByText } = render(
        <>
          <HideTitleStyles />
          <ImageSection>
            <LottieSection>
              <div>Animation</div>
            </LottieSection>
            <ProgressDots>
              <ProgressDot active />
              <ProgressDot active={false} />
              <ProgressDot active={false} />
            </ProgressDots>
          </ImageSection>
          <ContentSection>
            <StepTitle>Welcome</StepTitle>
            <Description>This is the first step</Description>
          </ContentSection>
        </>,
      );

      expect(getByText('Animation')).toBeInTheDocument();
      expect(getByText('Welcome')).toBeInTheDocument();
      expect(getByText('This is the first step')).toBeInTheDocument();
    });

    it('should handle multiple progress dots with different states', () => {
      const { container } = render(
        <ProgressDots>
          <ProgressDot active />
          <ProgressDot active={false} />
          <ProgressDot active={false} />
        </ProgressDots>,
      );

      const progressDotsContainer = container.firstChild as HTMLElement;
      const dots = progressDotsContainer.children;
      expect(dots).toHaveLength(3);
    });
  });

  describe('ButtonFooter', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ButtonFooter>
          <button>Click me</button>
        </ButtonFooter>,
      );
      expect(getByText('Click me')).toBeInTheDocument();
    });

    it('should have correct layout and alignment', () => {
      const { container } = render(<ButtonFooter />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('justify-content', 'flex-end');
      expect(element).toHaveStyleRule('padding', '8px 16px 12px 20px');
      expect(element).toHaveStyleRule('background', 'white');
      expect(element).toHaveStyleRule('float', 'right');
    });

    it('should have button styles', () => {
      const { container } = render(
        <ButtonFooter>
          <button>Test</button>
        </ButtonFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('padding', '4px 12px !important', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('min-height', '26px !important', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('max-height', '26px !important', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('font-size', '12px !important', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('line-height', '1.2 !important', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('border-radius', '3px !important', {
        modifier: 'button',
      });
    });

    it('should have button span styles', () => {
      const { container } = render(
        <ButtonFooter>
          <button>Test</button>
        </ButtonFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('font-size', '12px !important', {
        modifier: 'button span',
      });
      expect(element).toHaveStyleRule('line-height', '1.2 !important', {
        modifier: 'button span',
      });
      expect(element).toHaveStyleRule('font-weight', '600 !important', {
        modifier: 'button span',
      });
    });
  });

  describe('SingleStepFooter', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <SingleStepFooter>
          <span>Step info</span>
          <button>Next</button>
        </SingleStepFooter>,
      );
      expect(getByText('Step info')).toBeInTheDocument();
      expect(getByText('Next')).toBeInTheDocument();
    });

    it('should have correct layout and styling', () => {
      const { container } = render(<SingleStepFooter />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('display', 'flex');
      expect(element).toHaveStyleRule('flex-direction', 'row');
      expect(element).toHaveStyleRule('align-items', 'center');
      expect(element).toHaveStyleRule('justify-content', 'space-between');
      expect(element).toHaveStyleRule('padding', '12px 16px');
      expect(element).toHaveStyleRule('border-top', '1px solid #e0e0e0');
    });

    it('should have span styles', () => {
      const { container } = render(
        <SingleStepFooter>
          <span>Text</span>
        </SingleStepFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('font-size', '13px', {
        modifier: 'span',
      });
      expect(element).toHaveStyleRule('color', '#6b6c72', {
        modifier: 'span',
      });
    });

    it('should have button base styles', () => {
      const { container } = render(
        <SingleStepFooter>
          <button>Test</button>
        </SingleStepFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('background-color', '#2ca01c', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('color', 'white', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('border', 'none', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('border-radius', '4px', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('padding', '6px 16px', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('font-size', '13px', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('font-weight', '500', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule('cursor', 'pointer', {
        modifier: 'button',
      });
      expect(element).toHaveStyleRule(
        'transition',
        'background-color 0.2s ease',
        {
          modifier: 'button',
        },
      );
    });

    it('should have button hover styles', () => {
      const { container } = render(
        <SingleStepFooter>
          <button>Test</button>
        </SingleStepFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('background-color', '#248a17', {
        modifier: 'button:hover',
      });
    });

    it('should have button focus styles', () => {
      const { container } = render(
        <SingleStepFooter>
          <button>Test</button>
        </SingleStepFooter>,
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveStyleRule('outline', '2px solid #2ca01c', {
        modifier: 'button:focus',
      });
      expect(element).toHaveStyleRule('outline-offset', '2px', {
        modifier: 'button:focus',
      });
    });
  });

  describe('Accessibility and edge cases', () => {
    it('should handle empty content gracefully', () => {
      const { container } = render(
        <>
          <ImageSection />
          <LottieSection />
          <ProgressDots />
          <ContentSection />
          <StepTitle />
          <Description />
          <ButtonFooter />
          <SingleStepFooter />
        </>,
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle long text content with overflow', () => {
      const longText = 'A'.repeat(500);
      const { getByText } = render(
        <ContentSection>
          <Description>{longText}</Description>
        </ContentSection>,
      );

      expect(getByText(longText)).toBeInTheDocument();
    });

    it('should support nested components', () => {
      const { getByText } = render(
        <ContentSection>
          <StepTitle>
            <span>Nested Title</span>
          </StepTitle>
          <Description>
            <div>Nested Description</div>
          </Description>
        </ContentSection>,
      );

      expect(getByText('Nested Title')).toBeInTheDocument();
      expect(getByText('Nested Description')).toBeInTheDocument();
    });
  });
});
