import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Notes,
  NotesProps,
} from 'src/js/widgets/common/addTimeFormComponents/Notes';
import { SINGLE_TIME_TRACKING_POINTS } from 'src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

describe('Notes', () => {
  let props: NotesProps;

  beforeEach(() => {
    props = {
      name: 'notes',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.NOTES,
    };
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Notes component', () => {
    renderWithFormProvider(<Notes {...props} />);
    expect(
      screen.getByLabelText(/drawer.form.notes.label/),
    ).toBeInTheDocument();
  });

  // it('displays an error message when the input exceeds the maximum length', () => {
  //   render(<MockedFormComponent {...buildProps()} />);
  //   const textArea = screen.getByLabelText(/drawer.form.notes.label/);
  //   fireEvent.change(textArea, { target: { value: 'a'.repeat(4001) } });
  //   expect(screen.getByText('max.length.error')).toBeInTheDocument();
  // });

  it('does not display an error message when the input is within the maximum length', () => {
    renderWithFormProvider(<Notes {...props} />);
    const textArea = screen.getByLabelText(/drawer.form.notes.label/);
    fireEvent.change(textArea, { target: { value: 'a'.repeat(3999) } });
    expect(screen.queryByText('max.length.error')).not.toBeInTheDocument();
  });

  // it('renders with the correct width', () => {
  //   render(<MockedFormComponent {...buildProps({ width: 50 })} />);
  //   const textArea = screen.getByLabelText(/drawer.form.notes.label/);
  //   expect(textArea).toHaveStyle('width: 50px');
  // });

  describe('isLocked behavior', () => {
    test.each([
      { description: 'readOnly', isLocked: true, expectedReadonly: true },
      { description: 'not readOnly', isLocked: false, expectedReadonly: false },
    ])(
      'textarea is $description when isLocked is $isLocked',
      ({ isLocked, expectedReadonly }) => {
        (useWatch as jest.Mock).mockReturnValue(isLocked);

        renderWithFormProvider(<Notes {...props} />);

        const textArea = screen.getByLabelText(/drawer.form.notes.label/);
        if (expectedReadonly) {
          expect(textArea).toHaveAttribute('readonly');
        } else {
          expect(textArea).not.toHaveAttribute('readonly');
        }
      },
    );
  });

  describe('asterisk in label', () => {
    test.each([
      { description: 'required', isNotesRequired: true, expectAsterisk: true },
      {
        description: 'not required',
        isNotesRequired: false,
        expectAsterisk: false,
      },
    ])(
      'asterisk display when isNotesRequired is $description',
      ({ isNotesRequired, expectAsterisk }) => {
        props.isNotesRequired = isNotesRequired;

        renderWithFormProvider(<Notes {...props} />);

        if (expectAsterisk) {
          expect(screen.getByText(/\*/)).toBeInTheDocument();
        } else {
          expect(
            screen.getByText(/drawer.form.notes.label/),
          ).toBeInTheDocument();
          expect(screen.queryByText(/\*/)).not.toBeInTheDocument();
        }
      },
    );
  });
});
