import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AssignmentSection } from 'src/js/widgets/assignments/components/Groups/AssignmentSection';
import {
  renderWithQuicksandProvider,
  getDefaultSandbox,
} from 'test/unit/testUtils';

// Mock IDS components
jest.mock('@ids-ts/button', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    'data-testid'?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid={dataTestId}>
      {children}
    </button>
  ),
}));

jest.mock('@ids-ts/icon-control', () => ({
  IconControl: ({ children, label, 'data-testid': dataTestId }: any) => (
    <div data-testid={dataTestId}>
      {children}
      <span data-testid={`${dataTestId}-label`}>{label}</span>
    </div>
  ),
}));

jest.mock('@ids-ts/typography', () => ({
  B3: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="b3-typography">{children}</div>
  ),
}));

jest.mock('@design-systems/icons', () => ({
  PersonThree: () => <div data-testid="person-three-icon">Person Icon</div>,
}));

// Mock styled components
jest.mock(
  'src/js/widgets/assignments/styles/Groups/GroupDrawer.styled',
  () => ({
    SectionContainer: ({ children }: any) => (
      <div data-testid="section-container">{children}</div>
    ),
    SectionTitle: ({ children }: any) => (
      <h3 data-testid="section-title">{children}</h3>
    ),
    SectionDescription: ({ children }: any) => (
      <div data-testid="section-description">{children}</div>
    ),
    WorkerAssignmentRow: ({ children }: any) => (
      <div data-testid="worker-assignment-row">{children}</div>
    ),
  }),
);

describe('AssignmentSection', () => {
  let sandbox: any;
  let mockOnButtonClick: jest.Mock;

  beforeEach(() => {
    sandbox = getDefaultSandbox();
    mockOnButtonClick = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with all required props', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('section-container')).toBeInTheDocument();
      expect(screen.getByTestId('section-title')).toHaveTextContent(
        'Test Section',
      );
      expect(screen.getByText('5 items')).toBeInTheDocument();
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          description="This is a description"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('section-description')).toBeInTheDocument();
      expect(screen.getByTestId('b3-typography')).toHaveTextContent(
        'This is a description',
      );
    });

    it('should not render description when not provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(
        screen.queryByTestId('section-description'),
      ).not.toBeInTheDocument();
    });

    it('should render PersonThree icon', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('person-three-icon')).toBeInTheDocument();
    });

    it('should render WorkerAssignmentRow with IconControl and Button', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('worker-assignment-row')).toBeInTheDocument();
    });
  });

  describe('Button Interaction', () => {
    it('should call onButtonClick when button is clicked', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Click Me"
          onButtonClick={mockOnButtonClick}
          buttonTestId="test-button"
        />,
        sandbox,
      );

      const button = screen.getByTestId('test-button');
      fireEvent.click(button);

      expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
    });

    it('should call onButtonClick multiple times when clicked multiple times', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Click Me"
          onButtonClick={mockOnButtonClick}
          buttonTestId="test-button"
        />,
        sandbox,
      );

      const button = screen.getByTestId('test-button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnButtonClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Disabled State', () => {
    it.each([
      {
        description: 'renders button as enabled by default',
        disabled: undefined as boolean | undefined,
        expectDisabled: false,
      },
      {
        description: 'renders button as disabled when disabled prop is true',
        disabled: true,
        expectDisabled: true,
      },
    ])('$description', ({ disabled, expectDisabled }) => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
          disabled={disabled}
          buttonTestId="test-button"
        />,
        sandbox,
      );

      const button = screen.getByTestId('test-button');
      if (expectDisabled) {
        expect(button).toBeDisabled();
      } else {
        expect(button).not.toBeDisabled();
      }
    });

    it('should not call onButtonClick when button is disabled', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
          disabled
          buttonTestId="test-button"
        />,
        sandbox,
      );

      const button = screen.getByTestId('test-button');
      fireEvent.click(button);

      expect(mockOnButtonClick).not.toHaveBeenCalled();
    });
  });

  describe('Test IDs', () => {
    it('should apply custom buttonTestId when provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
          buttonTestId="custom-button-id"
        />,
        sandbox,
      );

      expect(screen.getByTestId('custom-button-id')).toBeInTheDocument();
    });

    it('should apply custom countTestId when provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
          countTestId="custom-count-id"
        />,
        sandbox,
      );

      expect(screen.getByTestId('custom-count-id')).toBeInTheDocument();
    });

    it('should render without custom testIds when not provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('section-container')).toBeInTheDocument();
      expect(screen.getByTestId('section-title')).toBeInTheDocument();
    });
  });

  describe('Props Variations', () => {
    it('should render with workers-specific content', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Who is a part of this group?"
          countLabel="10 of 50 workers"
          buttonLabel="Assign workers"
          onButtonClick={mockOnButtonClick}
          buttonTestId="assign-workers-btn"
          countTestId="workers-count"
        />,
        sandbox,
      );

      expect(
        screen.getByText('Who is a part of this group?'),
      ).toBeInTheDocument();
      expect(screen.getByText('10 of 50 workers')).toBeInTheDocument();
      expect(screen.getByText('Assign workers')).toBeInTheDocument();
    });

    it('should render with leads-specific content and description', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Who leads this group?"
          description="They can manage timesheets and run reports"
          countLabel="3 group leads"
          buttonLabel="Assign leads"
          onButtonClick={mockOnButtonClick}
          buttonTestId="assign-leads-btn"
          countTestId="leads-count"
        />,
        sandbox,
      );

      expect(screen.getByText('Who leads this group?')).toBeInTheDocument();
      expect(
        screen.getByText('They can manage timesheets and run reports'),
      ).toBeInTheDocument();
      expect(screen.getByText('3 group leads')).toBeInTheDocument();
      expect(screen.getByText('Assign leads')).toBeInTheDocument();
    });

    it('should handle empty strings for title and labels', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title=""
          countLabel=""
          buttonLabel=""
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('section-title')).toHaveTextContent('');
    });

    it('should handle long titles and labels', () => {
      const longTitle = 'A'.repeat(100);
      const longLabel = 'B'.repeat(100);

      renderWithQuicksandProvider(
        <AssignmentSection
          title={longTitle}
          countLabel={longLabel}
          buttonLabel="Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      expect(screen.getByTestId('section-title')).toHaveTextContent(longTitle);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should maintain correct DOM hierarchy', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      const container = screen.getByTestId('section-container');
      const title = screen.getByTestId('section-title');
      const row = screen.getByTestId('worker-assignment-row');

      expect(container).toContainElement(title);
      expect(container).toContainElement(row);
    });

    it('should render description between title and assignment row when provided', () => {
      renderWithQuicksandProvider(
        <AssignmentSection
          title="Test Section"
          description="Test Description"
          countLabel="5 items"
          buttonLabel="Test Button"
          onButtonClick={mockOnButtonClick}
        />,
        sandbox,
      );

      const container = screen.getByTestId('section-container');
      const description = screen.getByTestId('section-description');

      expect(container).toContainElement(description);
    });
  });
});
