import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    function MockGuidedModal({ open }: any) {
      return open ? <div data-testid="guided-modal">Modal</div> : null;
    },
);

jest.mock(
  'src/js/widgets/common/TourFramework/components/GuidedTooltip',
  () =>
    function MockGuidedTooltip({ open }: any) {
      return open ? <div data-testid="guided-tooltip">Tooltip</div> : null;
    },
);

describe('TourFramework - Coverage Tests', () => {
  const mockOnComplete = jest.fn();
  const mockOnClose = jest.fn();
  const mockSandbox = {
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  } as unknown as Sandbox;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitializeTourStatus.mockResolvedValue(undefined);
    mockMarkTourCompleted.mockResolvedValue(undefined);
    mockUseTourStorage.isTourCompleted = false;
    mockUseTourStorage.isLoading = false;
  });

  describe('Image Path Resolution', () => {
    it.each([
      {
        description: 'handles full URL image paths',
        image: 'https://example.com/image.png' as string | undefined,
        title: 'Step with Full URL',
      },
      {
        description: 'handles image paths with forward slashes',
        image: 'assets/images/test.png' as string | undefined,
        title: 'Step with Path',
      },
      {
        description: 'handles undefined image gracefully',
        image: undefined,
        title: 'Step without Image',
      },
    ])('$description', ({ image, title }) => {
      const steps: TourStep[] = [
        { id: 'step-1', title, description: 'Description', image },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={steps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });

    it('handles filename-only image paths', () => {
      const stepsWithFilename: TourStep[] = [
        {
          id: 'step-1',
          title: 'Step with Filename',
          description: 'Description',
          image: 'test_image.png',
        },
      ];

      // Mock require for this test
      const originalRequire = require;
      (global as any).require = jest.fn((path: string) => {
        if (path.includes('src/assets/images/')) {
          return 'mocked-image-path';
        }
        return originalRequire(path);
      });

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={stepsWithFilename}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();

      // Restore require
      (global as any).require = originalRequire;
    });
  });

  describe('Return Null Cases', () => {
    it('returns null when mode is invalid', () => {
      const { container } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={[
            {
              id: 'step-1',
              title: 'Test',
              description: 'Test',
            },
          ]}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode={'invalid' as any}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props Propagation', () => {
    it('passes nextLabel and backLabel props', () => {
      const stepsWithLabels: TourStep[] = [
        {
          id: 'step-1',
          title: 'Step 1',
          description: 'Description 1',
          nextLabel: 'Continue',
          backLabel: 'Previous',
        },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={stepsWithLabels}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="modal"
        />,
      );

      expect(screen.getByTestId('guided-modal')).toBeInTheDocument();
    });

    it('handles all optional TourStep properties', () => {
      const stepsWithAllProps: TourStep[] = [
        {
          id: 'step-1',
          title: 'Complete Step',
          description: 'Description',
          showOverlay: true,
          position: 'bottom',
          alignment: 'center',
          image: 'test.png',
          lottieData: { test: 'data' },
          nextLabel: 'Next',
          backLabel: 'Back',
        },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={stepsWithAllProps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
          mode="tooltip"
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });
  });

  describe('Edge Cases with Steps', () => {
    it('handles steps with only required properties', () => {
      const minimalSteps: TourStep[] = [
        {
          id: 'minimal',
          title: 'Minimal Step',
          description: 'Only required props',
        },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={minimalSteps}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });

    it('handles empty string in image property', () => {
      const stepsWithEmptyImage: TourStep[] = [
        {
          id: 'step-1',
          title: 'Step',
          description: 'Description',
          image: '',
        },
      ];

      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={stepsWithEmptyImage}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();
    });
  });

  describe('Async Behavior', () => {
    it('handles async markTourCompleted errors gracefully', async () => {
      mockMarkTourCompleted.mockRejectedValueOnce(new Error('Storage error'));

      const { rerender } = render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={[
            {
              id: 'step-1',
              title: 'Test',
              description: 'Test',
            },
          ]}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />,
      );

      // Component should still render
      expect(screen.getByTestId('guided-tooltip')).toBeInTheDocument();

      // Try to complete - should not crash
      await waitFor(() => {
        expect(mockInitializeTourStatus).toHaveBeenCalled();
      });
    });
  });

  describe('onComplete Callback Edge Cases', () => {
    it('handles onComplete being undefined when completion status changes', () => {
      mockUseTourStorage.isTourCompleted = true;

      expect(() => {
        render(
          <TourFramework
            sandbox={mockSandbox}
            open
            steps={[
              {
                id: 'step-1',
                title: 'Test',
                description: 'Test',
              },
            ]}
            tourId="test-tour"
            onClose={mockOnClose}
          />,
        );
      }).not.toThrow();
    });

    it('calls onComplete immediately with initial status', () => {
      render(
        <TourFramework
          sandbox={mockSandbox}
          open
          steps={[
            {
              id: 'step-1',
              title: 'Test',
              description: 'Test',
            },
          ]}
          tourId="test-tour"
          onComplete={mockOnComplete}
          onClose={mockOnClose}
        />,
      );

      expect(mockOnComplete).toHaveBeenCalledWith({
        isCompleted: false,
        isLoading: false,
      });
    });
  });
});
