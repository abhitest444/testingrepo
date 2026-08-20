import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BreaksWhatsNewButton from 'src/js/widgets/breaks/features/breaks-settings/components/BreaksWhatsNewButton';

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

describe('BreaksWhatsNewButton', () => {
  const mockOnClick = jest.fn();

  const renderComponent = (props = {}) =>
    render(<BreaksWhatsNewButton onClick={mockOnClick} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('icon-control')).toBeInTheDocument();
    });

    it('should render IconControl with the take a tour label', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      expect(button).toBeInTheDocument();
    });

    it('should render the MapSigns icon', () => {
      renderComponent();
      expect(screen.getByTestId('map-signs-icon')).toBeInTheDocument();
    });

    it('should render IconControl with medium size', () => {
      renderComponent();
      const button = screen.getByTestId('icon-control');
      expect(button).toHaveAttribute('data-size', 'medium');
    });
  });

  describe('Click Functionality', () => {
    it('calls onClick when button is clicked', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls custom onClick handler when provided', () => {
      const customOnClick = jest.fn();
      renderComponent({ onClick: customOnClick });
      const button = screen.getByRole('button', { name: 'Take a tour' });
      fireEvent.click(button);
      expect(customOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('handles multiple clicks correctly', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: 'Take a tour' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(3);
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
});
