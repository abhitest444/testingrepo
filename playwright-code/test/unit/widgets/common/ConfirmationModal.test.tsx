import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithQuicksandProvider } from 'test/unit/testUtils';

import {
  ConfirmationModal,
  ConfirmationModalProps,
} from 'src/js/widgets/common/ConfirmationModal';

describe('ConfirmationModal', () => {
  let props: ConfirmationModalProps;

  beforeEach(() => {
    props = {
      title: 'mock title',
      open: true,
      onYesClick: jest.fn(),
      setOpen: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with correct content', () => {
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(
      screen.getAllByTestId('time-tracking-confirmation-modal'),
    ).toHaveLength(2);
    expect(screen.getByText(/mock.title/)).toBeInTheDocument();
    expect(screen.getByText(/no/)).toBeInTheDocument();
    expect(screen.getByText(/yes/)).toBeInTheDocument();
  });

  it('should call setOpen(false) when "No" button is clicked', () => {
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    fireEvent.click(screen.getByText(/no/));
    expect(props.setOpen).toHaveBeenCalledWith(false);
  });

  it('should call onYesClick when "Yes" button is clicked', () => {
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    fireEvent.click(screen.getByText(/yes/));
    expect(props.onYesClick).toHaveBeenCalled();
  });

  it('should call onNoClick if provided when "No" button is clicked', () => {
    props.onNoClick = jest.fn();
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    fireEvent.click(screen.getByText(/no/));
    expect(props.onNoClick).toHaveBeenCalled();
  });

  it('should render the Yes button with the yesButtonLable if provided', () => {
    props.yesButtonLabel = 'Yes Label';
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.getByText(/Yes Label/)).toBeInTheDocument();
  });

  it('should render the No button with the noButtonLabel if provided', () => {
    props.noButtonLabel = 'No Label';
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.getByText(/No Label/)).toBeInTheDocument();
  });

  it('should disable the No button if isLoading is true', () => {
    props.isLoading = true;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.getByRole('button', { name: /no/ })).toBeDisabled();
  });

  it('should not render No button when showNoButton is false', () => {
    props.showNoButton = false;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.queryByText(/no/)).not.toBeInTheDocument();
  });

  it('should not render Yes button when showYesButton is false', () => {
    props.showYesButton = false;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.queryByText(/yes/)).not.toBeInTheDocument();
  });

  it('should render image when image prop is provided', () => {
    const MockImage = () => <div data-testid="mock-image">Mock Image</div>;
    props.image = <MockImage />;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
  });

  it('should render children content when provided', () => {
    const MockContent = () => (
      <div data-testid="mock-content">Mock Content</div>
    );
    props.children = <MockContent />;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    expect(screen.getByTestId('mock-content')).toBeInTheDocument();
  });

  it('should not show section divider when showSectionDivider is false', () => {
    props.showSectionDivider = false;
    renderWithQuicksandProvider(<ConfirmationModal {...props} />);

    const modalActions = screen.getByRole('dialog').querySelector('hr');
    expect(modalActions).not.toBeInTheDocument();
  });
});
