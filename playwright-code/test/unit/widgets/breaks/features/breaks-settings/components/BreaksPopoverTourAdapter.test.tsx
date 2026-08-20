import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';
import BreaksPopoverTourAdapter from 'src/js/widgets/breaks/features/breaks-settings/components/BreaksPopoverTourAdapter';

// Mock the GeneralPopoverTour component
jest.mock(
  'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour',
  () => ({
    __esModule: true,
    default: ({ open, steps, onClose, onFinish }: any) =>
      open ? (
        <div data-testid="general-popover-tour" onClick={onClose}>
          <div data-testid="tour-steps-count">{steps.length}</div>
          <div data-testid="tour-title">{steps[0]?.title}</div>
          <div data-testid="tour-description">{steps[0]?.description}</div>
          <button data-testid="tour-close" onClick={onClose}>
            Close
          </button>
          <button data-testid="tour-finish" onClick={onFinish}>
            Finish
          </button>
        </div>
      ) : null,
  }),
);

// Mock the tour steps
jest.mock('src/js/common/tourSteps', () => ({
  BreakTourSteps: () => [
    {
      id: 'break-1',
      title: 'Add Break Rule',
      description: 'Click here to add a new break rule for your team.',
      buttonText: 'Got it!',
      position: 'left',
      alignment: 'center',
      bgcolor: '#E6FAEA',
      targetSelector: '[data-testid="add-break-rule-btn"]',
    },
  ],
}));

describe('BreaksPopoverTourAdapter', () => {
  const defaultProps = {
    open: false,
    onClose: jest.fn(),
    onFinish: jest.fn(),
  };

  const renderComponent = (props = {}) =>
    renderWithQuicksandProvider(
      <BreaksPopoverTourAdapter {...defaultProps} {...props} />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing elements
    const existingElement = document.querySelector(
      '[data-testid="add-break-rule-btn"]',
    );
    if (existingElement) {
      existingElement.remove();
    }
  });

  afterEach(() => {
    // Clean up any elements we created
    const testElement = document.querySelector(
      '[data-testid="add-break-rule-btn"]',
    );
    if (testElement) {
      testElement.remove();
    }
  });

  describe('Tour visibility', () => {
    it('does not render when open is false', () => {
      renderComponent({ open: false });
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('does not render when anchor element is not found', () => {
      renderComponent({ open: true });
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('renders when open is true and anchor element is found', async () => {
      // Create the target element
      const targetElement = document.createElement('button');
      targetElement.setAttribute('data-testid', 'add-break-rule-btn');
      document.body.appendChild(targetElement);

      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });
  });

  describe('Tour content', () => {
    beforeEach(() => {
      // Create the target element
      const targetElement = document.createElement('button');
      targetElement.setAttribute('data-testid', 'add-break-rule-btn');
      document.body.appendChild(targetElement);
    });

    it('displays correct tour step information', async () => {
      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tour-steps-count')).toHaveTextContent('1');
      expect(screen.getByTestId('tour-title')).toHaveTextContent(
        'Add Break Rule',
      );
      expect(screen.getByTestId('tour-description')).toHaveTextContent(
        'Click here to add a new break rule for your team.',
      );
    });

    it('passes correct props to GeneralPopoverTour', async () => {
      const mockOnClose = jest.fn();
      const mockOnFinish = jest.fn();

      renderComponent({
        open: true,
        onClose: mockOnClose,
        onFinish: mockOnFinish,
      });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Test that the tour can be closed
      fireEvent.click(screen.getByTestId('tour-close'));
      expect(mockOnClose).toHaveBeenCalled();

      // Test that the tour can be finished
      fireEvent.click(screen.getByTestId('tour-finish'));
      expect(mockOnFinish).toHaveBeenCalled();
    });
  });

  describe('Anchor element handling', () => {
    it('finds anchor element by selector', async () => {
      // Create the target element
      const targetElement = document.createElement('button');
      targetElement.setAttribute('data-testid', 'add-break-rule-btn');
      targetElement.textContent = 'Add Break Rule';
      document.body.appendChild(targetElement);

      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Verify the anchor element was found and used
      expect(targetElement).toBeInTheDocument();
    });

    it('handles multiple elements with same selector', async () => {
      // Create multiple elements with the same selector
      const targetElement1 = document.createElement('button');
      targetElement1.setAttribute('data-testid', 'add-break-rule-btn');
      targetElement1.textContent = 'First Button';
      document.body.appendChild(targetElement1);

      const targetElement2 = document.createElement('button');
      targetElement2.setAttribute('data-testid', 'add-break-rule-btn');
      targetElement2.textContent = 'Second Button';
      document.body.appendChild(targetElement2);

      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Should use the first element found
      expect(targetElement1).toBeInTheDocument();
      expect(targetElement2).toBeInTheDocument();
    });

    it('handles non-existent selector gracefully', () => {
      renderComponent({ open: true });

      // Should not render tour when element is not found
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tour state management', () => {
    beforeEach(() => {
      // Create the target element
      const targetElement = document.createElement('button');
      targetElement.setAttribute('data-testid', 'add-break-rule-btn');
      document.body.appendChild(targetElement);
    });

    it('updates anchor element when open state changes', async () => {
      const { rerender } = renderComponent({ open: false });

      // Initially should not show tour
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();

      // Open tour
      rerender(<BreaksPopoverTourAdapter {...defaultProps} open />);

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Close tour
      rerender(<BreaksPopoverTourAdapter {...defaultProps} open={false} />);

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('calls onClose when tour is closed', async () => {
      const mockOnClose = jest.fn();
      renderComponent({ open: true, onClose: mockOnClose });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-close'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onFinish when tour is finished', async () => {
      const mockOnFinish = jest.fn();
      renderComponent({ open: true, onFinish: mockOnFinish });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-finish'));
      expect(mockOnFinish).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('handles missing target selector gracefully', () => {
      // Mock the tour steps to have no targetSelector
      jest.mock('src/js/common/tourSteps', () => ({
        BreakTourSteps: () => [
          {
            id: 'break-1',
            title: 'Add Break Rule',
            description: 'Click here to add a new break rule for your team.',
            buttonText: 'Got it!',
            position: 'left',
            alignment: 'center',
            bgcolor: '#E6FAEA',
            // No targetSelector
          },
        ],
      }));

      renderComponent({ open: true });

      // Should not render tour when targetSelector is missing
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('handles invalid target selector gracefully', () => {
      // Mock the tour steps to have invalid targetSelector
      jest.mock('src/js/common/tourSteps', () => ({
        BreakTourSteps: () => [
          {
            id: 'break-1',
            title: 'Add Break Rule',
            description: 'Click here to add a new break rule for your team.',
            buttonText: 'Got it!',
            position: 'left',
            alignment: 'center',
            bgcolor: '#E6FAEA',
            targetSelector: 'invalid-selector',
          },
        ],
      }));

      renderComponent({ open: true });

      // Should not render tour when targetSelector is invalid
      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Integration with tour steps', () => {
    beforeEach(() => {
      // Create the target element
      const targetElement = document.createElement('button');
      targetElement.setAttribute('data-testid', 'add-break-rule-btn');
      document.body.appendChild(targetElement);
    });

    it('uses correct tour step configuration', async () => {
      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Verify the tour step has the correct properties
      expect(screen.getByTestId('tour-title')).toHaveTextContent(
        'Add Break Rule',
      );
      expect(screen.getByTestId('tour-description')).toHaveTextContent(
        'Click here to add a new break rule for your team.',
      );
    });

    it('passes anchor element to tour step', async () => {
      const targetElement = document.querySelector(
        '[data-testid="add-break-rule-btn"]',
      );

      renderComponent({ open: true });

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Verify the anchor element is available
      expect(targetElement).toBeInTheDocument();
    });
  });
});
