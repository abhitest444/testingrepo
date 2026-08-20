import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormValidationError } from 'src/js/widgets/breaks/features/breaks-settings/components/FormValidationError';

// Mock the IDS badge component
jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: ({ label, testId }: { label: string; testId?: string }) => (
    <div data-testid={testId || 'badge'}>{label}</div>
  ),
  ErrorBadgeIcon: () => <div data-testid="error-badge-icon">⚠️</div>,
}));

describe('FormValidationError', () => {
  it('renders error message with badge when message is provided', () => {
    const errorMessage = 'Select at least one day of the week';
    render(<FormValidationError message={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByTestId('form-validation-error')).toBeInTheDocument();
  });

  it('renders with custom test ID when provided', () => {
    const errorMessage = 'This field is required';
    const customTestId = 'custom-validation-error';
    render(
      <FormValidationError message={errorMessage} testId={customTestId} />,
    );

    expect(screen.getByTestId(customTestId)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not render when message is empty', () => {
    render(<FormValidationError message="" />);

    expect(
      screen.queryByTestId('form-validation-error'),
    ).not.toBeInTheDocument();
  });

  it('does not render when message is null', () => {
    render(<FormValidationError message={null as any} />);

    expect(
      screen.queryByTestId('form-validation-error'),
    ).not.toBeInTheDocument();
  });
});
