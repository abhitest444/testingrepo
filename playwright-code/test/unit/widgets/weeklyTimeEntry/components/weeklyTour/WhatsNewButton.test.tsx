import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsNewButton } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTour/WhatsNewButton';

// Mock the dependencies
const mockTrack = jest.fn();
const mockUseSandbox = jest.fn();
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) =>
      id === 'take.a.tour.action.label' ? 'Take a tour' : id,
  }),
  useTracking: () => mockTrack,
  useSandbox: () => mockUseSandbox(),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, label, size }: any) => (
    <button
      onClick={onClick}
      data-testid="icon-control"
      data-size={size}
      aria-label={label}
    >
      {children}
    </button>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  MapSigns: () => <span data-testid="map-signs-icon">MapSigns</span>,
}));

jest.mock('src/js/common/useClickTracking', () => ({
  getWeeklyTimeTrackingPoints: jest.fn(() => ({
    SEE_WHATS_NEW: 'SEE_WHATS_NEW',
  })),
  WEEKLY_TIME_TRACKING_TIME_ENTRY: {
    SEE_WHATS_NEW: 'SEE_WHATS_NEW',
  },
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(() => false),
}));

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode, container: HTMLElement) =>
    // For testing, we'll render the children directly
    children as React.ReactElement,
}));

describe('WhatsNewButton', () => {
  let mockOnTourReset: jest.Mock;
  let mockHeaderElement: HTMLElement;

  beforeEach(() => {
    mockOnTourReset = jest.fn();
    mockTrack.mockClear();
    mockUseSandbox.mockReturnValue({
      realmId: 'test-realm',
      offering: 'qbo',
    });

    // Create a mock header element
    mockHeaderElement = document.createElement('div');
    mockHeaderElement.className = 'TrowserHeader-headerRight';
    mockHeaderElement.appendChild(document.createElement('div')); // firstChild

    // Mock insertBefore method
    mockHeaderElement.insertBefore = jest.fn();

    // Mock document.querySelector
    jest.spyOn(document, 'querySelector').mockReturnValue(mockHeaderElement);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Portal Setup', () => {
    it('should create portal and insert into header when header element is found', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        expect(document.querySelector).toHaveBeenCalledWith(
          '[class*="TrowserHeader-headerRight"]',
        );
        expect(mockHeaderElement.insertBefore).toHaveBeenCalled();
      });
    });

    it('should not render when header element is not found', () => {
      jest.spyOn(document, 'querySelector').mockReturnValue(null);

      const { container } = render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render initially until portal is ready', () => {
      // Mock document.querySelector to return null initially
      jest.spyOn(document, 'querySelector').mockReturnValue(null);

      const { container } = render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      // Initially should not render anything
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering', () => {
    it('should render the button with correct props when portal is ready', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('data-size', 'medium');
        expect(button).toHaveAttribute('aria-label', 'Take a tour');
      });
    });

    it('should render the MapSigns icon', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const icon = screen.getByTestId('map-signs-icon');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveTextContent('MapSigns');
      });
    });

    it('should render the wrapper with correct styling classes', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const wrapper = screen.getByTestId('icon-control').closest('div');
        expect(wrapper).toHaveStyle({
          display: 'flex',
          gap: '20px',
          padding: '10px',
          justifyContent: 'flex-end',
          height: '56px',
          zIndex: '1000',
        });
      });
    });
  });

  describe('Click Handling', () => {
    it('should call tracking function when button is clicked', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        fireEvent.click(button);
      });

      expect(mockTrack).toHaveBeenCalledWith('SEE_WHATS_NEW');
    });

    it('should call onTourReset when button is clicked and onTourReset is provided', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        fireEvent.click(button);
      });

      expect(mockOnTourReset).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when onTourReset is not provided', async () => {
      render(<WhatsNewButton trowserId="test-trowser" />);

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        expect(() => fireEvent.click(button)).not.toThrow();
      });

      expect(mockTrack).toHaveBeenCalledWith('SEE_WHATS_NEW');
    });
  });

  describe('Props', () => {
    it('should accept and use trowserId prop', () => {
      render(
        <WhatsNewButton
          trowserId="custom-trowser-id"
          onTourReset={mockOnTourReset}
        />,
      );

      // The trowserId is used internally but not directly rendered
      // We can verify the component renders without errors
      expect(document.querySelector).toHaveBeenCalled();
    });

    it('should work without onTourReset prop', async () => {
      render(<WhatsNewButton trowserId="test-trowser" />);

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization', () => {
    it('should use intl.formatMessage for button label', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        expect(button).toHaveAttribute('aria-label', 'Take a tour');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing firstChild gracefully', async () => {
      // Mock header element without firstChild
      const headerWithoutFirstChild = document.createElement('div');
      headerWithoutFirstChild.className = 'TrowserHeader-headerRight';
      // Mock insertBefore to handle the missing firstChild case
      headerWithoutFirstChild.insertBefore = jest.fn();
      jest
        .spyOn(document, 'querySelector')
        .mockReturnValue(headerWithoutFirstChild);

      const { container } = render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      // The component should handle missing firstChild gracefully and render normally
      // since insertBefore can handle null firstChild
      await waitFor(() => {
        expect(screen.getByTestId('icon-control')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        expect(button).toHaveAttribute('aria-label', 'Take a tour');
      });
    });

    it('should be keyboard accessible', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        // The button element is inherently accessible, so we check it's focusable
        expect(button).toBeInTheDocument();
        expect(button.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Integration', () => {
    it('should integrate properly with tracking system', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        fireEvent.click(button);
      });

      expect(mockTrack).toHaveBeenCalledWith('SEE_WHATS_NEW');
    });

    it('should integrate properly with tour reset functionality', async () => {
      render(
        <WhatsNewButton
          trowserId="test-trowser"
          onTourReset={mockOnTourReset}
        />,
      );

      await waitFor(() => {
        const button = screen.getByTestId('icon-control');
        fireEvent.click(button);
      });

      expect(mockOnTourReset).toHaveBeenCalledTimes(1);
    });
  });
});
