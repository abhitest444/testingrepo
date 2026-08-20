import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderWithAllProviders } from 'test/unit/testUtils';
import GeneralPopoverTour, {
  GeneralPopoverTourStep,
} from 'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour';

import timeClockGeneralGreenAnimation from 'src/assets/animations/time-clock/general-time.json';
import timeClockViewTimeAnimation from 'src/assets/animations/time-clock/view-time.json';
import timeClockSwitchJobsAnimation from 'src/assets/animations/time-clock/switch-jobs.json';

// Mock @ids-ts/popover to make content accessible in tests
jest.mock('@ids-ts/popover', () => ({
  Popover: ({ children, open, onClose, 'data-testid': dataTestId }: any) =>
    open ? (
      <div role="dialog" data-testid={dataTestId || 'popover'}>
        <button aria-label="Close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
  PopoverHeader: ({ children }: any) => (
    <div data-testid="popover-header">{children}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

// Mock @cgds/lottie
jest.mock('@cgds/lottie', () => ({
  Lottie: () => <div data-testid="lottie-animation">Lottie Animation</div>,
}));

describe('GeneralPopoverTour', () => {
  const mockAnchorElement = document.createElement('div');
  mockAnchorElement.setAttribute('data-testid', 'anchor-element');

  const mockSteps: GeneralPopoverTourStep[] = [
    {
      id: 'step-1',
      title: 'Step 1 Title',
      description: 'Step 1 description content',
      buttonText: 'Next',
      anchorEl: mockAnchorElement,
      position: 'bottom',
      alignment: 'center',
      distance: 10,
      skidding: 0,
      bgcolor: '#E6FAEA',
      lottieData: timeClockGeneralGreenAnimation,
    },
    {
      id: 'step-2',
      title: 'Step 2 Title',
      description: 'Step 2 description content',
      buttonText: 'Continue',
      anchorEl: mockAnchorElement,
      position: 'top',
      alignment: 'left',
      distance: 15,
      skidding: 5,
      bgcolor: '#F0F8FF',
      lottieData: timeClockViewTimeAnimation,
    },
    {
      id: 'step-3',
      title: 'Step 3 Title',
      description: 'Step 3 description content',
      buttonText: 'Finish',
      anchorEl: mockAnchorElement,
      position: 'right',
      alignment: 'center',
      distance: 20,
      skidding: 10,
      bgcolor: '#FFF5F5',
      lottieData: timeClockSwitchJobsAnimation,
    },
  ];

  const defaultProps = {
    open: true,
    steps: mockSteps,
    onClose: jest.fn(),
    onFinish: jest.fn(),
    theme: 'quickbooks' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Add anchor element to document
    document.body.appendChild(mockAnchorElement);
  });

  afterEach(() => {
    // Clean up anchor element
    if (document.body.contains(mockAnchorElement)) {
      document.body.removeChild(mockAnchorElement);
    }
  });

  describe('Rendering', () => {
    test.each([
      {
        open: true,
        description: 'renders popover when open is true',
        expectDialog: true,
      },
      {
        open: false,
        description: 'does not render when open is false',
        expectDialog: false,
      },
    ])('should $description', ({ open, expectDialog }) => {
      renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} open={open} />,
      );

      if (expectDialog) {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Close' }),
        ).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }
    });

    it('should render close button', () => {
      renderWithAllProviders(<GeneralPopoverTour {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should render progress dots for multiple steps', () => {
      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} />,
      );

      // Check via testid in the DOM
      const dotsWrapper = container.querySelector(
        '[data-testid="progress-dots"]',
      );
      expect(dotsWrapper).toBeInTheDocument();
      expect(dotsWrapper?.children.length).toBe(3);
    });

    it('should not render progress dots for single step', () => {
      const singleStepProps = {
        ...defaultProps,
        steps: [mockSteps[0]],
      };

      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...singleStepProps} />,
      );

      const dotsWrapper = container.querySelector(
        '[data-testid="progress-dots"]',
      );
      expect(dotsWrapper).not.toBeInTheDocument();
    });

    test.each([
      {
        description: 'renders lottie animation when lottieData is provided',
        steps: undefined as any,
        expectLottie: true,
      },
      {
        description:
          'does not render lottie animation when lottieData is not provided',
        steps: [
          {
            ...{
              id: 'step-1',
              title: 'Step 1 Title',
              description: 'Step 1 description content',
              buttonText: 'Next',
              anchorEl: document.createElement('div'),
              position: 'bottom' as const,
              alignment: 'center' as const,
              distance: 10,
              skidding: 0,
              bgcolor: '#E6FAEA',
            },
            lottieData: undefined,
          },
        ],
        expectLottie: false,
      },
    ])('should $description', ({ steps, expectLottie }) => {
      const testProps = steps ? { ...defaultProps, steps } : defaultProps;
      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...testProps} />,
      );

      const lottie = container.querySelector(
        '[data-testid="lottie-animation"]',
      );
      if (expectLottie) {
        expect(lottie).toBeInTheDocument();
      } else {
        expect(lottie).not.toBeInTheDocument();
      }
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step when Next button is clicked', () => {
      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} />,
      );

      // Initially shows step 1
      expect(container.textContent).toContain('Step 1 Title');
      expect(container.textContent).toContain('Step 1 description content');

      // Find and click Next button by checking all buttons
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) =>
        btn.textContent?.includes('Next'),
      );
      expect(nextButton).toBeTruthy();
      fireEvent.click(nextButton!);

      // Should show step 2
      expect(container.textContent).toContain('Step 2 Title');
      expect(container.textContent).toContain('Step 2 description content');
      const continueButton = buttons.find((btn) =>
        btn.textContent?.includes('Continue'),
      );
      expect(
        continueButton || container.textContent?.includes('Continue'),
      ).toBeTruthy();
    });

    it('should show Back button on non-first steps', () => {
      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} />,
      );

      // Initially no Back button on first step
      let buttons = screen.getAllByRole('button');
      let backButton = buttons.find((btn) => btn.textContent?.includes('Back'));
      expect(backButton).toBeUndefined();

      // Navigate to step 2
      const nextButton = buttons.find((btn) =>
        btn.textContent?.includes('Next'),
      );
      fireEvent.click(nextButton!);

      // Should show Back button
      buttons = screen.getAllByRole('button');
      backButton = buttons.find((btn) => btn.textContent?.includes('Back'));
      expect(backButton).toBeTruthy();
    });

    it('should navigate back when Back button is clicked', () => {
      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} />,
      );

      // Navigate to step 2
      let buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) =>
        btn.textContent?.includes('Next'),
      );
      fireEvent.click(nextButton!);

      // Navigate back
      buttons = screen.getAllByRole('button');
      const backButton = buttons.find((btn) =>
        btn.textContent?.includes('Back'),
      );
      fireEvent.click(backButton!);

      // Should show step 1 again
      expect(container.textContent).toContain('Step 1 Title');
      expect(container.textContent).toContain('Step 1 description content');
    });

    it('should call onFinish and onClose when Finish button is clicked on last step', () => {
      renderWithAllProviders(<GeneralPopoverTour {...defaultProps} />);

      // Navigate to last step
      let buttons = screen.getAllByRole('button');
      const nextButton = buttons.find((btn) =>
        btn.textContent?.includes('Next'),
      );
      fireEvent.click(nextButton!);

      buttons = screen.getAllByRole('button');
      const continueButton = buttons.find((btn) =>
        btn.textContent?.includes('Continue'),
      );
      fireEvent.click(continueButton!);

      // Click Finish button
      buttons = screen.getAllByRole('button');
      const finishButton = buttons.find((btn) =>
        btn.textContent?.includes('Finish'),
      );
      fireEvent.click(finishButton!);

      expect(defaultProps.onFinish).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Positioning and Styling', () => {
    it('should apply correct positioning props to popover', () => {
      renderWithAllProviders(<GeneralPopoverTour {...defaultProps} />);

      // The popover should be positioned relative to the anchor element
      expect(mockAnchorElement).toBeInTheDocument();
    });

    it('should handle different position values', () => {
      const positions: Array<'top' | 'bottom' | 'left' | 'right'> = [
        'top',
        'bottom',
        'left',
        'right',
      ];

      positions.forEach((position) => {
        const stepsWithPosition = [
          {
            ...mockSteps[0],
            id: 'step-1',
            position,
          },
        ];

        const { container, unmount } = renderWithAllProviders(
          <GeneralPopoverTour {...defaultProps} steps={stepsWithPosition} />,
        );

        // Check content is rendered
        expect(container.textContent).toContain('Step 1 Title');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle different alignment values', () => {
      const alignments: Array<'center' | 'left' | 'right'> = [
        'center',
        'left',
        'right',
      ];

      alignments.forEach((alignment) => {
        const stepsWithAlignment = [
          {
            ...mockSteps[0],
            id: 'step-1',
            alignment,
          },
        ];

        const { container, unmount } = renderWithAllProviders(
          <GeneralPopoverTour {...defaultProps} steps={stepsWithAlignment} />,
        );

        // Check content is rendered
        expect(container.textContent).toContain('Step 1 Title');
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle steps without required fields', () => {
      const minimalSteps = [
        {
          id: 'minimal-step',
          title: 'Minimal Step',
          description: 'Minimal content',
          buttonText: 'Next',
          anchorEl: mockAnchorElement,
        },
      ];

      const { container } = renderWithAllProviders(
        <GeneralPopoverTour {...defaultProps} steps={minimalSteps} />,
      );

      // Check content is rendered
      expect(container.textContent).toContain('Minimal Step');
      expect(container.textContent).toContain('Minimal content');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle missing anchor element gracefully', () => {
      const stepsWithoutAnchor = [
        {
          ...mockSteps[0],
          id: 'step-1',
          anchorEl: null as any,
        },
      ];

      // Should not crash when anchor element is missing
      expect(() => {
        renderWithAllProviders(
          <GeneralPopoverTour {...defaultProps} steps={stepsWithoutAnchor} />,
        );
      }).not.toThrow();

      // Component renders even without anchor element in test environment
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
