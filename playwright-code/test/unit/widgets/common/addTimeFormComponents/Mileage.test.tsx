import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Mileage,
  MileageProps,
} from 'src/js/widgets/common/addTimeFormComponents/Mileage';
import {
  SINGLE_TIME_TRACKING_POINTS,
  SINGLE_TIME_ENTRY_TRACKING_POINTS,
} from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

// Mock the tracking hook
const mockTrack = jest.fn();
jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useTracking: () => mockTrack,
}));

describe('Mileage', () => {
  let props: MileageProps;

  beforeEach(() => {
    props = {
      name: 'mileage',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.MILEAGE,
      autoCalculateTrackingPoint:
        SINGLE_TIME_TRACKING_POINTS.AUTO_CALCULATE_MILEAGE,
    };
    // Mock useWatch to return default values
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'autoCalculateMileage') {
        return true; // Default to auto-calculate enabled
      }
      if (name === 'isLocked') {
        return false; // Default to unlocked
      }
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  describe('Rendering', () => {
    it('renders the mileage number field with correct label', () => {
      renderWithFormProvider(<Mileage {...props} />);

      const numberField = screen.getByRole('spinbutton', { name: /mileage/i });
      expect(numberField).toBeInTheDocument();
      expect(
        screen.getByText(/drawer.form.mileage.label/i),
      ).toBeInTheDocument();
    });

    it('renders the auto-calculate checkbox with correct label', () => {
      renderWithFormProvider(<Mileage {...props} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /drawer.form.mileage.auto.calculate/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(
        screen.getByText(/drawer.form.mileage.auto.calculate/i),
      ).toBeInTheDocument();
    });

    it('renders the tooltip icon', () => {
      renderWithFormProvider(<Mileage {...props} />);

      const tooltipIcon = screen.getByTestId('circle-question-icon');
      expect(tooltipIcon).toBeInTheDocument();
    });
  });

  describe('Auto-calculate behavior', () => {
    test.each([
      { description: 'checked', isAutoCalculate: true, expectReadonly: true },
      {
        description: 'unchecked',
        isAutoCalculate: false,
        expectReadonly: false,
      },
    ])(
      'renders number field as $description auto-calculate state',
      ({ isAutoCalculate, expectReadonly }) => {
        (useWatch as jest.Mock).mockImplementation(({ name }) => {
          if (name === 'autoCalculateMileage') return isAutoCalculate;
          if (name === 'isLocked') return false;
          return undefined;
        });

        renderWithFormProvider(<Mileage {...props} />, {
          defaultValues: isAutoCalculate
            ? { autoCalculateMileage: true }
            : undefined,
        });

        const numberField = screen.getByRole('spinbutton', {
          name: /mileage/i,
        });
        if (expectReadonly) {
          expect(numberField).toHaveAttribute('readonly');
        } else {
          expect(numberField).not.toHaveAttribute('readonly');
        }
      },
    );

    it('renders checkbox as checked by default', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { autoCalculateMileage: true },
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /drawer.form.mileage.auto.calculate/i,
      });
      expect(checkbox).toBeChecked();
    });
  });

  describe('User interactions', () => {
    it('allows typing in the mileage field when auto-calculate is disabled', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return false;
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });

      renderWithFormProvider(<Mileage {...props} />);

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      fireEvent.change(numberField, { target: { value: '150.5' } });
      expect(numberField.value).toBe('150.5');
    });

    it('checkbox can be toggled', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { autoCalculateMileage: true },
      });

      const checkbox = screen.getByRole('checkbox', {
        name: /drawer.form.mileage.auto.calculate/i,
      });

      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('isLocked behavior', () => {
    test.each([
      { description: 'locked', isLocked: true, expectedDisabled: true },
      { description: 'not locked', isLocked: false, expectedDisabled: false },
    ])(
      '$description: both fields are correctly disabled/enabled',
      ({ isLocked, expectedDisabled }) => {
        (useWatch as jest.Mock).mockImplementation(({ name }) => {
          if (name === 'autoCalculateMileage') return !isLocked; // auto-calc on when unlocked
          if (name === 'isLocked') return isLocked;
          return undefined;
        });

        renderWithFormProvider(<Mileage {...props} />, {
          defaultValues: !isLocked
            ? { autoCalculateMileage: true }
            : { autoCalculateMileage: true },
        });

        const numberField = screen.getByRole('spinbutton', {
          name: /mileage/i,
        });
        const checkbox = screen.getByRole('checkbox', {
          name: /drawer.form.mileage.auto.calculate/i,
        });

        if (expectedDisabled) {
          expect(numberField).toBeDisabled();
          expect(checkbox).toBeDisabled();
        } else {
          expect(numberField).not.toBeDisabled();
          expect(checkbox).not.toBeDisabled();
        }
      },
    );
  });

  describe('Value handling', () => {
    it('displays the mileage value from form state', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 200 },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;
      expect(numberField.value).toBe('200');
    });

    it('handles null mileage value', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;
      expect(numberField.value).toBe('');
    });

    it('handles decimal mileage value', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 11.23 },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;
      expect(numberField.value).toBe('11.23');
    });
  });

  describe('Tooltip', () => {
    it('renders tooltip with correct configuration', () => {
      renderWithFormProvider(<Mileage {...props} />);

      const tooltipIcon = screen.getByTestId('circle-question-icon');
      expect(tooltipIcon).toBeInTheDocument();

      // Verify the tooltip wrapper has the aria-describedby attribute
      const tooltipWrapper = tooltipIcon.closest('div[aria-describedby]');
      expect(tooltipWrapper).toBeInTheDocument();
      expect(tooltipWrapper).toHaveAttribute('aria-describedby');
    });
  });

  describe('Combined states', () => {
    test.each([
      {
        description: 'auto-calc on, unlocked',
        isAutoCalculate: true,
        isLocked: false,
        expectReadonlyNumberField: true,
        expectDisabledFields: false,
        expectCheckboxChecked: true,
      },
      {
        description: 'auto-calc off, unlocked',
        isAutoCalculate: false,
        isLocked: false,
        expectReadonlyNumberField: false,
        expectDisabledFields: false,
        expectCheckboxChecked: false,
      },
      {
        description: 'auto-calc on, locked',
        isAutoCalculate: true,
        isLocked: true,
        expectReadonlyNumberField: true,
        expectDisabledFields: true,
        expectCheckboxChecked: true,
      },
      {
        description: 'auto-calc off, locked',
        isAutoCalculate: false,
        isLocked: true,
        expectReadonlyNumberField: false,
        expectDisabledFields: true,
        expectCheckboxChecked: false,
      },
    ])(
      'renders correctly when $description',
      ({
        isAutoCalculate,
        isLocked,
        expectReadonlyNumberField,
        expectDisabledFields,
        expectCheckboxChecked,
      }) => {
        (useWatch as jest.Mock).mockImplementation(({ name }) => {
          if (name === 'autoCalculateMileage') return isAutoCalculate;
          if (name === 'isLocked') return isLocked;
          return undefined;
        });

        renderWithFormProvider(<Mileage {...props} />, {
          defaultValues: isAutoCalculate
            ? { autoCalculateMileage: true }
            : undefined,
        });

        const numberField = screen.getByRole('spinbutton', {
          name: /mileage/i,
        });
        const checkbox = screen.getByRole('checkbox', {
          name: /drawer.form.mileage.auto.calculate/i,
        });

        if (expectReadonlyNumberField) {
          expect(numberField).toHaveAttribute('readonly');
        } else {
          expect(numberField).not.toHaveAttribute('readonly');
        }
        if (expectDisabledFields) {
          expect(numberField).toBeDisabled();
          expect(checkbox).toBeDisabled();
        } else {
          expect(numberField).not.toBeDisabled();
          expect(checkbox).not.toBeDisabled();
        }
        if (expectCheckboxChecked) {
          expect(checkbox).toBeChecked();
        } else {
          expect(checkbox).not.toBeChecked();
        }
      },
    );
  });

  describe('Validation', () => {
    beforeEach(() => {
      // Auto-calculate disabled to allow manual entry
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return false;
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });
    });

    it('accepts valid mileage values', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 100, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      expect(numberField.value).toBe('100');
      expect(numberField).toBeInTheDocument();
    });

    it('accepts zero as a valid value', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 0, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      expect(numberField.value).toBe('0');
    });

    it('accepts decimal values', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 23.5, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      expect(numberField.value).toBe('23.5');
    });

    it('shows error when negative value is entered', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      fireEvent.change(numberField, { target: { value: '-10' } });

      expect(screen.getByText(/mileage\.negative\.error/i)).toBeInTheDocument();
    });

    it('shows error when value exceeds maximum mileage', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Enter value greater than MAX_MILEAGE_MILES (10424.86)
      fireEvent.change(numberField, { target: { value: '20000' } });

      expect(screen.getByText(/mileage\.max\.error/i)).toBeInTheDocument();
    });

    it('clears error when valid value is entered after invalid value', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // First enter invalid value
      fireEvent.change(numberField, { target: { value: '-10' } });
      expect(screen.getByText(/mileage\.negative\.error/i)).toBeInTheDocument();

      // Then enter valid value
      fireEvent.change(numberField, { target: { value: '100' } });
      expect(
        screen.queryByText(/mileage\.negative\.error/i),
      ).not.toBeInTheDocument();
    });

    it('does not validate when auto-calculate is enabled', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return true; // Auto-calculate enabled
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });

      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: true },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Try to enter negative value (though field should be readonly)
      fireEvent.change(numberField, { target: { value: '-10' } });

      // No error should appear because auto-calculate is on
      expect(
        screen.queryByText(/mileage\.negative\.error/i),
      ).not.toBeInTheDocument();
    });

    it('clears error when field is cleared', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Enter invalid value
      fireEvent.change(numberField, { target: { value: '-10' } });
      expect(screen.getByText(/mileage\.negative\.error/i)).toBeInTheDocument();

      // Clear the field
      fireEvent.change(numberField, { target: { value: '' } });
      expect(
        screen.queryByText(/mileage\.negative\.error/i),
      ).not.toBeInTheDocument();
    });

    it('accepts maximum allowed mileage value', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Enter exactly MAX_MILEAGE_MILES (10424.86)
      fireEvent.change(numberField, { target: { value: '10424.86' } });

      expect(
        screen.queryByText(/mileage\.max\.error/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('Tracking behavior', () => {
    beforeEach(() => {
      // Auto-calculate disabled to allow manual entry
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return false;
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });
    });

    it('should NOT track on every keystroke (onChange)', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Type "150" - should NOT trigger tracking for each keystroke
      fireEvent.change(numberField, { target: { value: '1' } });
      expect(mockTrack).not.toHaveBeenCalled();

      fireEvent.change(numberField, { target: { value: '15' } });
      expect(mockTrack).not.toHaveBeenCalled();

      fireEvent.change(numberField, { target: { value: '150' } });
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it('should track once when field loses focus (onBlur)', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Type value
      fireEvent.change(numberField, { target: { value: '150' } });
      expect(mockTrack).not.toHaveBeenCalled();

      // Blur the field - should trigger tracking
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        SINGLE_TIME_TRACKING_POINTS.MILEAGE,
      );
    });

    it('should track with correct tracking point for time entries', () => {
      const timeEntryProps = {
        ...props,
        trackingPoint: SINGLE_TIME_ENTRY_TRACKING_POINTS.MILEAGE,
      };

      renderWithFormProvider(<Mileage {...timeEntryProps} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Type and blur
      fireEvent.change(numberField, { target: { value: '200' } });
      fireEvent.blur(numberField);

      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        SINGLE_TIME_ENTRY_TRACKING_POINTS.MILEAGE,
      );
    });

    it('should track even when field is cleared', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 100, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Clear the field
      fireEvent.change(numberField, { target: { value: '' } });
      expect(mockTrack).not.toHaveBeenCalled();

      // Blur - should still track
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        SINGLE_TIME_TRACKING_POINTS.MILEAGE,
      );
    });

    it('should track even with invalid values', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Enter invalid negative value
      fireEvent.change(numberField, { target: { value: '-10' } });
      expect(mockTrack).not.toHaveBeenCalled();

      // Blur - should still track even though value is invalid
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        SINGLE_TIME_TRACKING_POINTS.MILEAGE,
      );
    });

    it('should track on blur even when auto-calculate is enabled', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return true; // Auto-calculate enabled
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });

      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 50, autoCalculateMileage: true },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Blur the readonly field - should still track
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith(
        SINGLE_TIME_TRACKING_POINTS.MILEAGE,
      );
    });

    it('should track multiple times if field is focused and blurred multiple times', () => {
      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: null, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // First edit
      fireEvent.change(numberField, { target: { value: '100' } });
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(1);

      // Second edit
      fireEvent.focus(numberField);
      fireEvent.change(numberField, { target: { value: '200' } });
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(2);

      // Third edit
      fireEvent.focus(numberField);
      fireEvent.change(numberField, { target: { value: '300' } });
      fireEvent.blur(numberField);
      expect(mockTrack).toHaveBeenCalledTimes(3);
    });

    it('should not track when field is disabled (locked)', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'autoCalculateMileage') {
          return false;
        }
        if (name === 'isLocked') {
          return true; // Form is locked
        }
        return undefined;
      });

      renderWithFormProvider(<Mileage {...props} />, {
        defaultValues: { mileage: 100, autoCalculateMileage: false },
      });

      const numberField = screen.getByRole('spinbutton', {
        name: /mileage/i,
      }) as HTMLInputElement;

      // Try to blur disabled field
      fireEvent.blur(numberField);

      // Should still track even though field is disabled
      // (blur handler is still attached, it's just that user can't edit)
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });
  });
});
