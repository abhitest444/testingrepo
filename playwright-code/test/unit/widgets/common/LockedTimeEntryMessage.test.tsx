import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LockedTimeEntryMessage } from 'src/js/widgets/common/LockedTimeEntryMessage';

// Mock useIntl to return the id as the message
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

describe('LockedTimeEntryMessage', () => {
  it('renders approved message with correct title and content', () => {
    const { container } = render(<LockedTimeEntryMessage />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/time.entry.approved.title/i)).toBeInTheDocument();
    expect(
      screen.getByText(/time.entry.approved.message/i),
    ).toBeInTheDocument();
  });

  it('renders submitted message when submission lock is passed', () => {
    render(<LockedTimeEntryMessage isSubmitted />);

    expect(screen.getByText(/time.entry.submitted.title/i)).toBeInTheDocument();
    expect(
      screen.getByText(/time.entry.submitted.message/i),
    ).toBeInTheDocument();
  });

  it('renders the no-manage-permission message when the permission is missing', () => {
    render(<LockedTimeEntryMessage noManagePermission />);

    expect(
      screen.getByText(/time.entry.no.manage.permission.title/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/time.entry.no.manage.permission.message/i),
    ).toBeInTheDocument();
  });

  it('prioritizes the no-manage-permission message over submitted', () => {
    render(<LockedTimeEntryMessage noManagePermission isSubmitted />);

    expect(
      screen.getByText(/time.entry.no.manage.permission.title/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/time.entry.submitted.title/i),
    ).not.toBeInTheDocument();
  });

  it('dismisses the message when the close button is clicked', () => {
    render(<LockedTimeEntryMessage />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(
      screen.queryByText('time.entry.approved.message'),
    ).not.toBeInTheDocument();
  });

  it('invokes the onClose callback instead of self-dismissing when provided', () => {
    const onClose = jest.fn();
    render(<LockedTimeEntryMessage onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('time.entry.approved.message')).toBeInTheDocument();
  });
});
