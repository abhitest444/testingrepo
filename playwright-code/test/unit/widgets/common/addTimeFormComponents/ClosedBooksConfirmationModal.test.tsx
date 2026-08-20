import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  ClosedBooksConfirmationModal,
  ClosedBooksConfirmationModalProps,
} from 'src/js/widgets/common/ClosedBooksConfirmationModal';
import { SINGLE_TIME_TRACKING_POINTS } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

describe('ClosedBooksConfirmationModal', () => {
  let props: ClosedBooksConfirmationModalProps;

  beforeEach(() => {
    props = {
      open: true,
      setOpen: jest.fn(),
      onYesClick: jest.fn(),
      isCloseBookPasswordEnabled: false,
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CLOSED_BOOK_PASSWORD,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the closed books confirmation component without a password field', () => {
    renderWithFormProvider(<ClosedBooksConfirmationModal {...props} />);
    expect(screen.getByLabelText(/closed.books.title/)).toBeInTheDocument();
  });

  it('renders the closed books confirmation component with a password field', () => {
    props.isCloseBookPasswordEnabled = true;

    renderWithFormProvider(<ClosedBooksConfirmationModal {...props} />);
    expect(
      screen.getByLabelText(/closed.books.password.label/),
    ).toBeInTheDocument();
  });

  it('calls onYesClick when the yes button is clicked', () => {
    renderWithFormProvider(<ClosedBooksConfirmationModal {...props} />);
    screen.getByRole('button', { name: /yes/i }).click();

    expect(props.onYesClick).toHaveBeenCalledTimes(1);
  });

  it('calls onYesClick when the yes button is clicked with a password', () => {
    props.isCloseBookPasswordEnabled = true;

    renderWithFormProvider(<ClosedBooksConfirmationModal {...props} />);
    fireEvent.change(screen.getByLabelText(/closed.books.password.label/), {
      target: { value: 'password' },
    });
    screen.getByRole('button', { name: /yes/i }).click();

    expect(props.onYesClick).toHaveBeenCalledTimes(1);
  });

  it('show an error message when the yes button is clicked without a password', () => {
    props.isCloseBookPasswordEnabled = true;

    renderWithFormProvider(<ClosedBooksConfirmationModal {...props} />);
    screen.getByRole('button', { name: /yes/i }).click();

    expect(
      screen.getByText(/closed.books.password.required/),
    ).toBeInTheDocument();
  });
});
