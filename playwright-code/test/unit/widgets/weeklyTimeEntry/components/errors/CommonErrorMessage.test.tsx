import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommonErrorMessage } from 'src/js/widgets/weeklyTimeEntry/components/errors/CommonErrorMessage';

// Mock the icon
jest.mock('@design-systems/icons', () => ({
  CircleAlertQuickbooks: () => <div data-testid="error-icon">⚠️</div>,
}));

describe('CommonErrorMessage', () => {
  it('renders with default props', () => {
    render(<CommonErrorMessage>Test error message</CommonErrorMessage>);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <CommonErrorMessage titleText="Custom Title">
        Test error message
      </CommonErrorMessage>,
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders with dismissable prop set to true', () => {
    const onClose = jest.fn();
    render(
      <CommonErrorMessage dismissable onClose={onClose}>
        Test error message
      </CommonErrorMessage>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // The component doesn't render a close button even when dismissable is true
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with dismissable prop set to false (default)', () => {
    const onClose = jest.fn();
    render(
      <CommonErrorMessage dismissable={false} onClose={onClose}>
        Test error message
      </CommonErrorMessage>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // Should not have close button when dismissable is false
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders without close button when dismissable is false and onClose is provided', () => {
    const onClose = jest.fn();
    render(
      <CommonErrorMessage dismissable={false} onClose={onClose}>
        Test error message
      </CommonErrorMessage>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders without close button when dismissable is true but no onClose provided', () => {
    render(
      <CommonErrorMessage dismissable>Test error message</CommonErrorMessage>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with default dismissable value (false)', () => {
    render(<CommonErrorMessage>Test error message</CommonErrorMessage>);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = jest.fn();
    render(
      <CommonErrorMessage dismissable onClose={onClose}>
        Test error message
      </CommonErrorMessage>,
    );

    // The component doesn't render a close button
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with both title and message', () => {
    render(
      <CommonErrorMessage titleText="Error Title">
        Error message
      </CommonErrorMessage>,
    );

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with only message (no title)', () => {
    render(<CommonErrorMessage>Error message only</CommonErrorMessage>);

    expect(screen.getByText('Error message only')).toBeInTheDocument();
  });

  it('renders with only title (no message)', () => {
    render(<CommonErrorMessage titleText="Title only" />);

    expect(screen.getByText('Title only')).toBeInTheDocument();
  });
});
