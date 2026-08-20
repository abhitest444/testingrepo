import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import TourModalCommon from 'src/js/widgets/common/TourModalCommon/TourModalCommon';

// Mock window.innerWidth for responsive testing
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('TourModalCommon', () => {
  const mockSteps = [
    {
      id: 'step-1',
      headline: 'Step 1 Headline',
      body: 'Step 1 body content',
      lottieData: { test: 'animation1' },
      bgcolor: '#E6FAEA',
      nextLabel: 'Next',
    },
    {
      id: 'step-2',
      headline: 'Step 2 Headline',
      body: 'Step 2 body content',
      lottieData: { test: 'animation2' },
      bgcolor: '#F0F8FF',
      nextLabel: 'Continue',
    },
    {
      id: 'step-3',
      headline: 'Step 3 Headline',
      body: 'Step 3 body content',
      lottieData: { test: 'animation3' },
      bgcolor: '#FFF5F5',
      nextLabel: 'Finish',
    },
  ];

  const defaultProps = {
    steps: mockSteps,
    onFinish: jest.fn(),
    theme: 'quickbooks' as const,
    open: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window width to desktop
    mockWindowWidth(1024);
  });

  afterEach(() => {
    // Clean up window width mock
    delete (window as any).innerWidth;
  });

  describe('Rendering', () => {
    test.each([
      {
        open: true,
        description: 'renders modal when open is true',
        expectContent: true,
      },
      {
        open: false,
        description: 'does not render when open is false',
        expectContent: false,
      },
    ])('should $description', ({ open, expectContent }) => {
      renderWithQuicksandProvider(
        <TourModalCommon {...defaultProps} open={open} />,
      );

      if (expectContent) {
        expect(screen.getByText('Step 1 Headline')).toBeInTheDocument();
        expect(screen.getByText('Step 1 body content')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Next' }),
        ).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Step 1 Headline')).not.toBeInTheDocument();
      }
    });

    it('should render close button', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      // close icon from IDS modal header has aria-label "Close"
      expect(
        screen.getByRole('button', { name: /close/i }),
      ).toBeInTheDocument();
    });

    it('should render progress dots for multiple steps', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      expect(screen.getByTestId('progress-dots')).toBeInTheDocument();
      // Should have 3 dots for 3 steps
      const dots = screen.getByTestId('progress-dots').children;
      expect(dots).toHaveLength(3);
    });

    it('should not render progress dots for single step', () => {
      const singleStepProps = {
        ...defaultProps,
        steps: [mockSteps[0]],
      };

      renderWithQuicksandProvider(<TourModalCommon {...singleStepProps} />);

      expect(screen.queryByTestId('progress-dots')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step when Next button is clicked', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      // Initially shows step 1
      expect(screen.getByText('Step 1 Headline')).toBeInTheDocument();
      expect(screen.getByText('Step 1 body content')).toBeInTheDocument();

      // Click Next button
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Should show step 2
      expect(screen.getByText('Step 2 Headline')).toBeInTheDocument();
      expect(screen.getByText('Step 2 body content')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Continue' }),
      ).toBeInTheDocument();
    });

    it('should show Back button on non-first steps', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      // Initially no Back button on first step
      expect(
        screen.queryByRole('button', { name: /back/i }),
      ).not.toBeInTheDocument();

      // Navigate to step 2
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Should show Back button (note: in test env it shows as "NLS tour.back undefined")
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should navigate back when Back button is clicked', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      // Navigate to step 2
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Navigate back
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      // Should show step 1 again
      expect(screen.getByText('Step 1 Headline')).toBeInTheDocument();
      expect(screen.getByText('Step 1 body content')).toBeInTheDocument();
    });

    it('should call onFinish when Done button is clicked on last step', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      // Navigate to last step
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

      // Click Done button (note: in test env it shows as "NLS tour.done undefined")
      fireEvent.click(screen.getByRole('button', { name: /done/i }));

      expect(defaultProps.onFinish).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish when close button is clicked', () => {
      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(defaultProps.onFinish).toHaveBeenCalledTimes(1);
    });

    it('should reset to first step when modal reopens', () => {
      const { rerender } = renderWithQuicksandProvider(
        <TourModalCommon {...defaultProps} />,
      );

      // Navigate to step 2
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      // Close modal
      rerender(<TourModalCommon {...defaultProps} open={false} />);

      // Reopen modal
      rerender(<TourModalCommon {...defaultProps} open />);

      // Should show first step
      expect(screen.getByText('Step 1 Headline')).toBeInTheDocument();
      expect(screen.getByText('Step 1 body content')).toBeInTheDocument();
    });
  });

  describe('Media Handling', () => {
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
            id: 'step-1',
            headline: 'Step 1 Headline',
            body: 'Step 1 body content',
            nextLabel: 'Next',
          },
        ],
        expectLottie: false,
      },
    ])('should $description', ({ steps, expectLottie }) => {
      const testProps = steps ? { ...defaultProps, steps } : defaultProps;
      renderWithQuicksandProvider(<TourModalCommon {...testProps} />);

      if (expectLottie) {
        const lottieAnimation = screen.getByTestId('lottie-animation');
        expect(lottieAnimation).toBeInTheDocument();
        expect(lottieAnimation).toHaveAttribute('data', '[object Object]');
      } else {
        expect(
          screen.queryByTestId('lottie-animation'),
        ).not.toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    test.each([
      { width: 480, description: 'adapts to mobile screen size (480px)' },
      { width: 768, description: 'adapts to tablet screen size (768px)' },
    ])('should $description', ({ width }) => {
      mockWindowWidth(width);

      renderWithQuicksandProvider(<TourModalCommon {...defaultProps} />);

      expect(screen.getByText('Step 1 Headline')).toBeInTheDocument();
      expect(screen.getByText('Step 1 body content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle steps without required fields', () => {
      const minimalSteps = [
        {
          id: 'minimal-step',
          headline: 'Minimal Step',
          body: 'Minimal content',
        },
      ];

      renderWithQuicksandProvider(
        <TourModalCommon {...defaultProps} steps={minimalSteps} />,
      );

      expect(screen.getByText('Minimal Step')).toBeInTheDocument();
      expect(screen.getByText('Minimal content')).toBeInTheDocument();
    });
  });
});
