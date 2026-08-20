import React from 'react';
import { render, screen } from '@testing-library/react';
import { FullPageError } from 'src/js/widgets/weeklyTimeEntry/components/errors/FullPageError';

// Mock NLS
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => {
      const messages: { [key: string]: string } = {
        'weekly.time.entry.error.boundary.title': 'Something went wrong',
        'weekly.time.entry.error.boundary.message':
          'We encountered an unexpected error while loading your time entries. Please try refreshing the page.',
      };
      return messages[id] || id;
    },
  }),
}));

// Mock the icon
jest.mock('@design-systems/icons', () => ({
  CircleAlertQuickbooks: () => <div data-testid="error-icon">⚠️</div>,
}));

describe('FullPageError', () => {
  it('renders with default title and message', () => {
    render(<FullPageError />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.refresh.page'),
    ).toBeInTheDocument();
  });

  it('renders with custom title and message', () => {
    const customTitle = 'Custom Error Title';
    const customMessage = 'Custom error message';

    render(<FullPageError title={customTitle} message={customMessage} />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders with custom title only', () => {
    const customTitle = 'Custom Error Title';

    render(<FullPageError title={customTitle} />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.refresh.page'),
    ).toBeInTheDocument();
  });

  it('renders with custom message only', () => {
    const customMessage = 'Custom error message';

    render(<FullPageError message={customMessage} />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders with default message from NLS', () => {
    render(<FullPageError />);

    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('weekly.time.entry.refresh.page'),
    ).toBeInTheDocument();
  });

  it('has proper styling classes', () => {
    render(<FullPageError />);

    const container = screen.getByTestId('error-icon').parentElement;
    expect(container).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      width: '100vw',
      textAlign: 'center',
    });
  });
});
