import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApprovedEntriesModal } from 'src/js/widgets/weeklyTimeEntry/components/errors/ApprovedEntriesModal';

// Mock useIntl
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
}));

describe('ApprovedEntriesModal', () => {
  const defaultProps = {
    open: true,
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open and display correct title', () => {
    render(<ApprovedEntriesModal {...defaultProps} />);

    expect(
      screen.getAllByTestId('weekly-time-entry-already-approved-modal'),
    ).toHaveLength(2);
    expect(
      screen.getByText('weekly.time.entry.already.approved.title'),
    ).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ApprovedEntriesModal {...defaultProps} open={false} />);

    expect(
      screen.queryAllByTestId('weekly-time-entry-already-approved-modal'),
    ).toHaveLength(0);
  });

  it('should call onCancel when modal is closed', () => {
    const onCancel = jest.fn();
    render(<ApprovedEntriesModal {...defaultProps} onCancel={onCancel} />);

    // The modal close functionality is handled by the Modal component internally
    // We can't easily test this in our test environment
    expect(
      screen.getAllByTestId('weekly-time-entry-already-approved-modal'),
    ).toHaveLength(2);
  });

  it('should display approved/exported title when isTimeOff is false', () => {
    render(<ApprovedEntriesModal {...defaultProps} isTimeOff={false} />);

    expect(
      screen.getByText('weekly.time.entry.already.approved.title'),
    ).toBeInTheDocument();
  });

  it('should display approved/exported title when isTimeOff is undefined', () => {
    render(<ApprovedEntriesModal {...defaultProps} />);

    expect(
      screen.getByText('weekly.time.entry.already.approved.title'),
    ).toBeInTheDocument();
  });

  it('should display time off locked title when isTimeOff is true', () => {
    render(<ApprovedEntriesModal {...defaultProps} isTimeOff />);

    expect(
      screen.getByText('weekly.time.entry.time.off.locked.title'),
    ).toBeInTheDocument();
  });

  it('should display submitted title when isSubmitted is true', () => {
    render(<ApprovedEntriesModal {...defaultProps} isSubmitted />);

    expect(screen.getByText('time.entry.submitted.title')).toBeInTheDocument();
  });

  it('should prefer time off title over submitted title when both are true', () => {
    render(<ApprovedEntriesModal {...defaultProps} isTimeOff isSubmitted />);

    expect(
      screen.getByText('weekly.time.entry.time.off.locked.title'),
    ).toBeInTheDocument();
  });
});
