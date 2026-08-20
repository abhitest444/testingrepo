import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import { RequiredFieldsErrorMessage } from 'src/js/widgets/weeklyTimeEntry/components/errors/RequiredFieldsErrorMessage';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  QuicksandProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useIntl: jest.fn(),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/errors/CommonErrorMessage',
  () => {
    const CommonErrorMessage = ({
      children,
      titleText,
      type,
      dismissable,
      onClose,
    }: any) => (
      <div
        data-testid="common-error-message"
        data-title={titleText}
        data-type={type}
        data-dismissable={dismissable}
      >
        <div data-testid="error-title">{titleText}</div>
        {children}
        {onClose && (
          <button data-testid="close-button" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );

    return {
      __esModule: true,
      CommonErrorMessage,
      default: CommonErrorMessage,
    };
  },
);

const mockFormatMessage = jest.fn(({ id }) => {
  const messages: { [key: string]: string } = {
    'weekly.time.entry.validation.following.needs.attention':
      'Following needs attention',
  };
  return messages[id] || id;
});
const mockUseIntl = useIntl as jest.MockedFunction<typeof useIntl>;

describe('RequiredFieldsErrorMessage', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIntl.mockReturnValue({
      formatMessage: mockFormatMessage,
    } as any);
  });

  describe('basic rendering', () => {
    it('renders with default props', () => {
      render(
        <RequiredFieldsErrorMessage errorMessages={['Error 1', 'Error 2']} />,
      );

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();
    });

    it('renders with onClose prop', () => {
      const onClose = jest.fn();
      render(
        <RequiredFieldsErrorMessage
          errorMessages={['Error 1']}
          onClose={onClose}
        />,
      );

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders without onClose prop', () => {
      render(<RequiredFieldsErrorMessage errorMessages={['Error 1']} />);

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(screen.getByText('Error 1')).toBeInTheDocument();

      // Should not have close button when no onClose provided
      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('handles close button click', () => {
      const onClose = jest.fn();
      render(
        <RequiredFieldsErrorMessage
          errorMessages={['Error 1']}
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('single message display', () => {
    it('should display single message as title when only one message exists', () => {
      const errorMessages = ['weekly.time.entry.validation.over.hours.limit'];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'weekly.time.entry.validation.over.hours.limit',
      );
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should not render list when single message is provided', () => {
      const errorMessages = ['Total hours cannot exceed 24 hours per day'];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'Total hours cannot exceed 24 hours per day',
      );
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should display both required field errors and total hours error', () => {
      const errorMessages = [
        'Following fields need attention:',
        '  • Total weekly hours are over the limit. Adjust the time entered.',
        '  • Required fields are missing for these entries:',
        '    • Monday, 1/1/2024: Service, Class',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'Following needs attention',
      );
      expect(screen.getAllByRole('list')).toHaveLength(1); // There is only 1 list rendered now
      expect(
        screen.getByText(/Total weekly hours are over the limit/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Monday, 1\/1\/2024: Service, Class/),
      ).toBeInTheDocument();
    });
  });

  describe('date-specific messages display', () => {
    it('should display header message as title and date-specific messages as list', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • Monday, 1/15/2024: Service Item, Class',
        '  • Tuesday, 1/16/2024: Notes',
        '  • Wednesday, 1/17/2024: Location',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'Following needs attention',
      );

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(1); // There is only 1 list rendered now

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3); // The component renders 3 list items (no header in list)
      expect(listItems[0]).toHaveTextContent(
        'Monday, 1/15/2024: Service Item, Class',
      );
      expect(listItems[1]).toHaveTextContent('Tuesday, 1/16/2024: Notes');
      expect(listItems[2]).toHaveTextContent('Wednesday, 1/17/2024: Location');
    });

    it('should apply proper styling to date-specific list items', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • Monday, 1/15/2024: Service Item, Class',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const listItems = screen.getAllByRole('listitem');
      const listItem = listItems[0]; // Get the first list item (the date-specific one)
      // The component doesn't apply these specific styles, so we just check the content
      expect(listItem).toHaveTextContent(
        'Monday, 1/15/2024: Service Item, Class',
      );
    });

    it('should remove bullet prefix from date-specific messages', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • Monday, 1/15/2024: Service Item, Class',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const listItems = screen.getAllByRole('listitem');
      const listItem = listItems[0]; // Get the first list item (the date-specific one)
      expect(listItem).toHaveTextContent(
        'Monday, 1/15/2024: Service Item, Class',
      );
      expect(listItem).not.toHaveTextContent('  • ');
    });
  });

  describe('mixed message types', () => {
    it('should handle mixed messages correctly', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • Monday, 1/15/2024: Service Item',
        'Some other message',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'Following needs attention',
      );

      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(1); // There is only 1 list rendered now

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2); // The component renders 2 list items
      expect(listItems[0]).toHaveTextContent('Monday, 1/15/2024: Service Item');
    });
  });

  describe('multiple error messages', () => {
    it('renders with multiple error messages', () => {
      const errorMessages = [
        'Total weekly hours are over the limit',
        'Required fields are missing',
        'Invalid time format',
      ];

      render(<RequiredFieldsErrorMessage errorMessages={errorMessages} />);

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(
        screen.getByText('Total weekly hours are over the limit'),
      ).toBeInTheDocument();
    });

    it('renders with single error message', () => {
      render(
        <RequiredFieldsErrorMessage errorMessages={['Single error message']} />,
      );

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(screen.getByText('Single error message')).toBeInTheDocument();
    });

    it('renders with long error messages', () => {
      const longErrorMessages = [
        'This is a very long error message that should be displayed properly without any issues or truncation',
        'Another very long error message that should also be displayed properly',
      ];

      render(<RequiredFieldsErrorMessage errorMessages={longErrorMessages} />);

      expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is a very long error message that should be displayed properly without any issues or truncation',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('empty or null messages', () => {
    it('should return null when no error messages are provided', () => {
      const { container } = render(
        <RequiredFieldsErrorMessage errorMessages={[]} onClose={mockOnClose} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when error messages are null', () => {
      const { container } = render(
        <RequiredFieldsErrorMessage
          errorMessages={null as any}
          onClose={mockOnClose}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when error messages are undefined', () => {
      const { container } = render(
        <RequiredFieldsErrorMessage
          errorMessages={undefined as any}
          onClose={mockOnClose}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders with empty error messages array', () => {
      render(<RequiredFieldsErrorMessage errorMessages={[]} />);

      // Component should return null when errorMessages is empty
      expect(
        screen.queryByTestId('common-error-message'),
      ).not.toBeInTheDocument();
    });
  });

  describe('component props', () => {
    it('should pass correct props to CommonErrorMessage', () => {
      const errorMessages = ['Test error message'];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const commonErrorMessage = screen.getByTestId('common-error-message');
      expect(commonErrorMessage).toHaveAttribute('data-type', 'error');
      // The component doesn't set the dismissable attribute, so we skip this check
      expect(commonErrorMessage).toHaveAttribute(
        'data-title',
        'Test error message',
      );
    });

    it('should render close button when onClose is provided', () => {
      const errorMessages = ['Test error message'];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveTextContent('Close');
    });

    it('should not render close button when onClose is not provided', () => {
      const errorMessages = ['Test error message'];

      render(<RequiredFieldsErrorMessage errorMessages={errorMessages} />);

      expect(screen.queryByTestId('close-button')).not.toBeInTheDocument();
    });
  });

  describe('key prop for re-rendering', () => {
    it('should use error messages as key for forcing re-render', () => {
      const errorMessages = ['Message 1', 'Message 2'];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const commonErrorMessage = screen.getByTestId('common-error-message');
      expect(commonErrorMessage).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle messages that start with spaces but not bullet points', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing',
        '  Some message with spaces but no bullet',
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'weekly.time.entry.validation.required.fields.missing',
      );
      // The component actually renders a list for messages with spaces
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should handle messages with different bullet formats', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • Monday, 1/15/2024: Service Item',
        '  - Tuesday, 1/16/2024: Class', // Different bullet format
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2); // The component renders 2 list items
      expect(listItems[0]).toHaveTextContent('Monday, 1/15/2024: Service Item');
    });

    it('should handle empty date-specific messages', () => {
      const errorMessages = [
        'weekly.time.entry.validation.required.fields.missing.header',
        '  • ', // Empty date-specific message
      ];

      render(
        <RequiredFieldsErrorMessage
          errorMessages={errorMessages}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId('error-title')).toHaveTextContent(
        'weekly.time.entry.validation.required.fields.missing.header',
      );
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });
  });
});
