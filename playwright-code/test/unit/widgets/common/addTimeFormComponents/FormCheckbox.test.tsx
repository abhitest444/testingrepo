import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  FormCheckbox,
  FormCheckboxProps,
} from 'src/js/widgets/common/addTimeFormComponents/FormCheckbox';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

describe('FormCheckbox', () => {
  let props: FormCheckboxProps;

  beforeEach(() => {
    props = {
      name: 'testCheckbox',
      labelKey: 'test.label',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CLASS_SETTING,
    };
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the checkbox with the correct label', () => {
    renderWithFormProvider(<FormCheckbox {...props} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(screen.getByText(/test.label/)).toBeInTheDocument();
  });

  it('calls onChange when the checkbox is clicked', () => {
    renderWithFormProvider(<FormCheckbox {...props} />, {
      defaultValues: { testCheckbox: true },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked(); // unchecked after click
  });

  it('calls onChange 2 times when the checkbox is clicked 2 times', () => {
    renderWithFormProvider(<FormCheckbox {...props} />, {
      defaultValues: { testCheckbox: false },
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox); // unchecked -> checked
    fireEvent.click(checkbox); // checked -> unchecked
    expect(checkbox).not.toBeChecked();
  });

  it('renders the checkbox with defaultChecked', () => {
    renderWithFormProvider(<FormCheckbox {...props} />, {
      defaultValues: { testCheckbox: true },
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders the checkbox unchecked when defaultChecked set to false', () => {
    props.defaultChecked = false;
    renderWithFormProvider(<FormCheckbox {...props} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  describe('onChange prop behavior', () => {
    test.each([
      {
        description: 'unchecked (calls onChange with true)',
        startChecked: false,
        defaultValues: undefined,
        expectedValue: true,
      },
      {
        description: 'checked (calls onChange with false)',
        startChecked: true,
        defaultValues: { testCheckbox: true as boolean | undefined },
        expectedValue: false,
      },
    ])(
      'calls onChange prop with correct value when starting from $description state',
      ({ startChecked, defaultValues, expectedValue }) => {
        const onChangeMock = jest.fn();
        props.onChange = onChangeMock;
        props.defaultChecked = startChecked;

        renderWithFormProvider(<FormCheckbox {...props} />, { defaultValues });

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(onChangeMock).toHaveBeenCalledWith(expectedValue);
      },
    );

    it('calls onChange prop multiple times when checkbox is toggled', () => {
      const onChangeMock = jest.fn();
      props.onChange = onChangeMock;
      props.defaultChecked = false; // Start unchecked

      renderWithFormProvider(<FormCheckbox {...props} />);

      const checkbox = screen.getByRole('checkbox');

      // First click - check the checkbox
      fireEvent.click(checkbox);
      expect(onChangeMock).toHaveBeenNthCalledWith(1, true);

      // Second click - uncheck the checkbox
      fireEvent.click(checkbox);
      expect(onChangeMock).toHaveBeenNthCalledWith(2, false);

      // Third click - check the checkbox again
      fireEvent.click(checkbox);
      expect(onChangeMock).toHaveBeenNthCalledWith(3, true);

      expect(onChangeMock).toHaveBeenCalledTimes(3);
    });

    it('does not call onChange prop when it is not provided', () => {
      // Ensure onChange is undefined
      delete props.onChange;
      props.defaultChecked = false;

      renderWithFormProvider(<FormCheckbox {...props} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should not throw any errors and checkbox should still work
      expect(checkbox).toBeChecked();
    });
  });

  describe('isLocked behavior', () => {
    test.each([
      { description: 'disabled', isLocked: true, expectedDisabled: true },
      { description: 'enabled', isLocked: false, expectedDisabled: false },
    ])(
      'checkbox is $description when isLocked is $isLocked',
      ({ isLocked, expectedDisabled }) => {
        (useWatch as jest.Mock).mockReturnValue(isLocked);

        renderWithFormProvider(<FormCheckbox {...props} />);

        const checkbox = screen.getByRole('checkbox');
        if (expectedDisabled) {
          expect(checkbox).toBeDisabled();
        } else {
          expect(checkbox).not.toBeDisabled();
        }
      },
    );
  });
});
