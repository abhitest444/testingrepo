import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyCustomerState from 'src/js/widgets/assignments/components/CustomerAssignments/components/EmptyCustomerState';

// Mock the SVG icon
jest.mock('src/assets/images/utility-checklist.svg', () => ({
  ReactComponent: () => <div data-testid="utility-checklist-icon">Icon</div>,
}));

// Mock useIntl from quicksand
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'assignments.empty.customers.title':
          'Assign customers and projects to team members, now in QuickBooks',
        'assignments.empty.customers.description':
          "Assign customers and projects to employees and contractors so everyone knows what to do. Pre-fill custom fields such as service item, class, department, or location in timesheets for each customer or project. Team members track time only against what they're assigned, which makes time tracking faster and more accurate.",
      };
      return messages[id] || id;
    },
  }),
}));

describe('EmptyCustomerState', () => {
  it('should render without crashing', () => {
    const { container } = render(<EmptyCustomerState />);
    expect(container).toBeTruthy();
  });

  it('should render the utility checklist icon', () => {
    render(<EmptyCustomerState />);
    const icon = screen.getByTestId('utility-checklist-icon');
    expect(icon).toBeInTheDocument();
  });

  it('should render the title text', () => {
    render(<EmptyCustomerState />);
    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent(
      'Assign customers and projects to team members, now in QuickBooks',
    );
  });

  it('should render the description text', () => {
    render(<EmptyCustomerState />);
    const description = screen.getByText(
      /Assign customers and projects to employees and contractors/i,
    );
    expect(description).toBeInTheDocument();
  });

  it('should call formatMessage with correct message IDs', () => {
    const mockFormatMessage = jest.fn(({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'assignments.empty.customers.title':
          'Assign customers and projects to team members, now in QuickBooks',
        'assignments.empty.customers.description':
          "Assign customers and projects to employees and contractors so everyone knows what to do. Pre-fill custom fields such as service item, class, department, or location in timesheets for each customer or project. Team members track time only against what they're assigned, which makes time tracking faster and more accurate.",
      };
      return messages[id] || id;
    });

    jest.resetModules();
    jest.doMock('@payroll/quicksand', () => ({
      ...jest.requireActual('@payroll/quicksand'),
      useIntl: () => ({
        formatMessage: mockFormatMessage,
      }),
    }));

    const {
      default: TestComponent,
    } = require('src/js/widgets/assignments/components/CustomerAssignments/components/EmptyCustomerState');
    render(<TestComponent />);

    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'assignments.empty.customers.title',
    });
    expect(mockFormatMessage).toHaveBeenCalledWith({
      id: 'assignments.empty.customers.description',
    });
  });

  it('should match snapshot', () => {
    const { container } = render(<EmptyCustomerState />);
    expect(container).toMatchSnapshot();
  });

  it('should have proper structure with title and description', () => {
    const { container } = render(<EmptyCustomerState />);
    const h2 = container.querySelector('h2');
    const p = container.querySelector('p');

    expect(h2).toBeInTheDocument();
    expect(p).toBeInTheDocument();
  });

  it('should render all elements in correct order', () => {
    const { container } = render(<EmptyCustomerState />);
    const elements = container.querySelectorAll('div, h2, p');

    // Check that icon comes first (wrapped in div), then h2, then p
    const h2Index = Array.from(elements).findIndex((el) => el.tagName === 'H2');
    const pIndex = Array.from(elements).findIndex((el) => el.tagName === 'P');

    expect(h2Index).toBeLessThan(pIndex);
  });
});
