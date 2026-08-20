import React from 'react';
import { screen } from '@testing-library/react';
import EmptyCustomFields from 'src/js/widgets/customField/components/EmptyCustomFields';
import { renderWithQuicksandProvider } from '../../../testUtils';

// Mock the SVG icon
jest.mock('src/assets/images/utility-checklist.svg', () => ({
  ReactComponent: () => (
    <div data-testid="utility-checklist-icon">Checklist Icon</div>
  ),
}));

// Mock QuicksandProvider and IntlProvider
jest.mock('@payroll/quicksand', () => {
  const actual = jest.requireActual('@payroll/quicksand');
  return {
    ...actual,
    QuicksandProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useIntl: () => ({
      formatMessage: ({ id }: { id: string }) => {
        const messages: Record<string, string> = {
          'customFields.emptyCustomFields.title': 'No Custom Fields',
          'customFields.emptyCustomFields.subtext.1':
            "You haven't created any custom fields yet.",
          'customFields.emptyCustomFields.subtext.2': 'to get started.',
          'customFields.add.button': 'Add Custom Fields',
        };
        return messages[id] || id;
      },
    }),
  };
});

describe('EmptyCustomFields', () => {
  const renderComponent = () =>
    renderWithQuicksandProvider(<EmptyCustomFields />);

  describe('rendering', () => {
    it('should render the component without crashing', () => {
      renderComponent();
      expect(screen.getByTestId('utility-checklist-icon')).toBeInTheDocument();
    });

    it('should display the correct title', () => {
      renderComponent();
      expect(screen.getByText('No Custom Fields')).toBeInTheDocument();
    });

    it('should display the correct subtext with proper formatting', () => {
      renderComponent();
      const subtext = screen.getByText(
        /You haven't created any custom fields yet./,
      );
      expect(subtext).toBeInTheDocument();

      // Check that the "Add Custom Fields" text is bold
      const boldText = screen.getByText('Add Custom Fields');
      expect(boldText).toBeInTheDocument();
      expect(boldText.tagName).toBe('B');

      // Check the complete subtext
      expect(screen.getByText(/to get started./)).toBeInTheDocument();
    });

    it('should render the checklist icon', () => {
      renderComponent();
      const icon = screen.getByTestId('utility-checklist-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.textContent).toBe('Checklist Icon');
    });
  });

  describe('structure and layout', () => {
    it('should have the correct container structure', () => {
      renderComponent();

      // The component should render a container with the icon, title, and subtext
      const title = screen.getByText('No Custom Fields');
      expect(title).toBeInTheDocument();

      // Check that all elements are present
      expect(screen.getByTestId('utility-checklist-icon')).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't created any custom fields yet./),
      ).toBeInTheDocument();
    });

    it('should have the icon properly rendered', () => {
      renderComponent();
      const icon = screen.getByTestId('utility-checklist-icon');
      expect(icon).toBeInTheDocument();
    });

    it('should have the title properly rendered', () => {
      renderComponent();
      const title = screen.getByText('No Custom Fields');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('DIV');
    });

    it('should have the subtext properly rendered', () => {
      renderComponent();
      const subtext = screen.getByText(
        /You haven't created any custom fields yet./,
      );
      expect(subtext).toBeInTheDocument();
      expect(subtext.tagName).toBe('DIV');
    });
  });

  describe('internationalization', () => {
    it('should display the correct translated text', () => {
      renderComponent();

      // Verify all translated text is present
      expect(screen.getByText('No Custom Fields')).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't created any custom fields yet./),
      ).toBeInTheDocument();
      expect(screen.getByText('Add Custom Fields')).toBeInTheDocument();
      expect(screen.getByText(/to get started./)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have semantic HTML structure', () => {
      renderComponent();

      // The component should use div elements for layout
      const title = screen.getByText('No Custom Fields');
      expect(title.tagName).toBe('DIV');

      // Subtext should be in a div
      const subtext = screen.getByText(
        /You haven't created any custom fields yet./,
      );
      expect(subtext.tagName).toBe('DIV');
    });

    it('should have the icon properly contained', () => {
      renderComponent();
      const icon = screen.getByTestId('utility-checklist-icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('content verification', () => {
    it('should display the complete empty state message', () => {
      renderComponent();

      // Verify all parts of the message are present
      expect(screen.getByText('No Custom Fields')).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't created any custom fields yet./),
      ).toBeInTheDocument();
      expect(screen.getByText('Add Custom Fields')).toBeInTheDocument();
      expect(screen.getByText(/to get started./)).toBeInTheDocument();
    });

    it('should format the subtext with bold "Add Custom Fields" text', () => {
      renderComponent();

      const boldText = screen.getByText('Add Custom Fields');
      expect(boldText.tagName).toBe('B');
    });
  });

  describe('component behavior', () => {
    it('should be a functional component', () => {
      expect(typeof EmptyCustomFields).toBe('function');
    });

    it('should render consistently across multiple renders', () => {
      const { rerender } = renderComponent();

      // First render
      expect(screen.getByText('No Custom Fields')).toBeInTheDocument();
      expect(screen.getByTestId('utility-checklist-icon')).toBeInTheDocument();

      // Re-render
      rerender(<EmptyCustomFields />);

      // Should still have the same content
      expect(screen.getByText('No Custom Fields')).toBeInTheDocument();
      expect(screen.getByTestId('utility-checklist-icon')).toBeInTheDocument();
    });
  });
});
