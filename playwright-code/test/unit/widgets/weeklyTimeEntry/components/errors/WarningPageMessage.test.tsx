import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarningPageMessage } from 'src/js/widgets/weeklyTimeEntry/components/errors/WarningPageMessage';

// Mock the CommonErrorMessage component
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/errors/CommonErrorMessage',
  () => ({
    CommonErrorMessage: ({
      titleText,
      children,
      dismissable,
      onClose,
    }: any) => (
      <div data-testid="common-error-message">
        <div>Title: {titleText}</div>
        <div>Content: {children}</div>
        <div>Dismissable: {dismissable ? 'true' : 'false'}</div>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    ),
  }),
);

describe('WarningPageMessage', () => {
  it('renders with default props', () => {
    render(
      <WarningPageMessage title="Warning Title" message="Warning message" />,
    );

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText('Title: Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Content: Warning message')).toBeInTheDocument();
    expect(screen.getByText('Dismissable: false')).toBeInTheDocument();
  });

  it('renders with onClose prop', () => {
    const onClose = jest.fn();
    render(
      <WarningPageMessage
        title="Warning Title"
        message="Warning message"
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText('Title: Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Content: Warning message')).toBeInTheDocument();
    expect(screen.getByText('Dismissable: false')).toBeInTheDocument();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders without onClose prop', () => {
    render(
      <WarningPageMessage title="Warning Title" message="Warning message" />,
    );

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText('Title: Warning Title')).toBeInTheDocument();
    expect(screen.getByText('Content: Warning message')).toBeInTheDocument();
    expect(screen.getByText('Dismissable: false')).toBeInTheDocument();

    // Should not have close button when no onClose provided
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('handles close button click', () => {
    const onClose = jest.fn();
    render(
      <WarningPageMessage
        title="Warning Title"
        message="Warning message"
        onClose={onClose}
      />,
    );

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with different title and message', () => {
    render(
      <WarningPageMessage
        title="Custom Warning"
        message="Custom warning message"
      />,
    );

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText('Title: Custom Warning')).toBeInTheDocument();
    expect(
      screen.getByText('Content: Custom warning message'),
    ).toBeInTheDocument();
  });

  it('renders with empty title and message', () => {
    render(<WarningPageMessage title="" message="" />);

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText('Title:')).toBeInTheDocument();
    expect(screen.getByText('Content:')).toBeInTheDocument();
  });

  it('renders with long title and message', () => {
    const longTitle =
      'This is a very long warning title that should be displayed properly';
    const longMessage =
      'This is a very long warning message that should be displayed properly without any issues';

    render(<WarningPageMessage title={longTitle} message={longMessage} />);

    expect(screen.getByTestId('common-error-message')).toBeInTheDocument();
    expect(screen.getByText(`Title: ${longTitle}`)).toBeInTheDocument();
    expect(screen.getByText(`Content: ${longMessage}`)).toBeInTheDocument();
  });
});
