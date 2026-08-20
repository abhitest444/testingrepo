import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomFieldsWhatsNewButton from 'src/js/widgets/customField/components/CustomFieldsWhatsNewButton';

// Mock the design system components
jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, onClick, label, size }: any) => (
    <button
      onClick={onClick}
      aria-label={label}
      data-testid="icon-control"
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  MapSigns: () => <svg data-testid="map-signs-icon">MapSigns Icon</svg>,
}));

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'take.a.tour.action.label': 'Take a tour',
      };
      return messages[id] || id;
    },
  }),
}));

describe('CustomFieldsWhatsNewButton', () => {
  const mockOnClick = jest.fn();

  const renderComponent = () =>
    render(<CustomFieldsWhatsNewButton onClick={mockOnClick} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });

    it('should render IconControl with correct label', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      expect(button).toBeInTheDocument();
    });

    it('should render MapSigns icon', () => {
      renderComponent();
      const icon = screen.getByTestId('map-signs-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should render IconControl', () => {
      renderComponent();
      const button = screen.getByTestId('icon-control');
      expect(button).toBeInTheDocument();
    });

    it('should have correct wrapper styling structure', () => {
      const { container } = renderComponent();
      const wrapper = container.firstChild;
      expect(wrapper).toHaveStyle({
        position: 'absolute',
        top: '0px',
        right: '44px',
        'z-index': '1000',
      });
    });
  });

  describe('Interactions', () => {
    it('should call onClick when button is clicked', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick multiple times on multiple clicks', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should not call onClick when component is just rendered', () => {
      renderComponent();
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Internationalization', () => {
    it('should use intl to format the label', () => {
      renderComponent();

      const button = screen.getByRole('button', { name: 'Take a tour' });
      expect(button).toBeInTheDocument();
    });

    it('should call formatMessage with correct id', () => {
      renderComponent();

      // The component should render with the translated label
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Take a tour' }),
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      expect(button).toHaveAccessibleName('Take a tour');
    });

    it('should be keyboard accessible', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });

      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Component Props', () => {
    it('should accept and use onClick prop', () => {
      const customOnClick = jest.fn();
      render(<CustomFieldsWhatsNewButton onClick={customOnClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(customOnClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });

      for (let i = 0; i < 10; i += 1) {
        fireEvent.click(button);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(10);
    });

    it('should maintain functionality after re-render', () => {
      const { rerender } = renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<CustomFieldsWhatsNewButton onClick={mockOnClick} />);

      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });
});
