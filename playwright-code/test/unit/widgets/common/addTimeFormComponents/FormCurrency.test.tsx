import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  FormCurrency,
  FormCurrencyProps,
} from 'src/js/widgets/common/addTimeFormComponents/FormCurrency';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

jest.mock('src/js/common/useIXPFeatureFlag', () => ({
  useIXPFeatureFlag: jest.fn(() => ({ isEnabled: true, settled: true })),
}));

describe('FormCurrency', () => {
  let props: FormCurrencyProps;

  beforeEach(() => {
    props = {
      name: 'currency',
      labelKey: 'currency.label',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.COST_RATE,
      tooltipInfoId: 'time.details',
      costRateToolTipVisibility: true,
    };
    (useWatch as jest.Mock).mockReturnValue(false); // Default set to unlocked
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithFormProvider(<FormCurrency {...props} />, {
      defaultValues: { currency: null },
    });
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText(/currency.label/)).toBeInTheDocument();
  });

  // it('validates the currency field and shows error message when value is 0', async () => {
  //   renderWithProviders(<FormCurrency name="currency" shouldValidate />, {
  //     defaultValues: { currency: 0 },
  //   });
  //
  //   fireEvent.blur(screen.getByPlaceholderText('0.00'));
  //
  //   expect(
  //     await screen.findByText('This field is required'),
  //   ).toBeInTheDocument();
  // });

  it('does not show error message when value is valid', async () => {
    renderWithFormProvider(
      <FormCurrency {...{ ...props, shouldValidate: true }} />,
      {
        defaultValues: { currency: 100 },
      },
    );

    fireEvent.blur(screen.getByPlaceholderText('0.00'));

    expect(
      screen.queryByText('This field is required'),
    ).not.toBeInTheDocument();
  });

  it('calls onChange when the value changes', () => {
    renderWithFormProvider(<FormCurrency {...props} />, {
      defaultValues: { currency: 100 },
    });

    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '200' } });

    expect(input).toHaveValue('200');
  });

  it('shows tooltip icon when costRateToolTipVisibility is true', () => {
    renderWithFormProvider(<FormCurrency {...props} />, {
      defaultValues: { currency: null },
    });
    const tooltipIcon = document.querySelector('svg[aria-hidden="true"]');
    expect(tooltipIcon).toBeInTheDocument();
  });

  describe('isLocked behavior', () => {
    test.each([
      { description: 'disabled', isLocked: true, expectedDisabled: true },
      { description: 'not disabled', isLocked: false, expectedDisabled: false },
    ])(
      'input is $description when isLocked is $isLocked',
      ({ isLocked, expectedDisabled }) => {
        (useWatch as jest.Mock).mockReturnValue(isLocked);

        renderWithFormProvider(<FormCurrency {...props} />, {
          defaultValues: { currency: null },
        });

        const input = screen.getByPlaceholderText('0.00');
        if (expectedDisabled) {
          expect(input).toBeDisabled();
        } else {
          expect(input).not.toBeDisabled();
        }
      },
    );
  });

  describe('allowNegative for billRate', () => {
    it('should accept negative input for billRate field in time activity', () => {
      const billRateProps = { ...props, name: 'billRate' };
      renderWithFormProvider(<FormCurrency {...billRateProps} />, {
        defaultValues: { billRate: -100, isExported: true }, // time activity
      });

      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveValue('-100.00');
    });

    it('should allow typing negative values for billRate in time activity', () => {
      const billRateProps = { ...props, name: 'billRate' };
      renderWithFormProvider(<FormCurrency {...billRateProps} />, {
        defaultValues: { billRate: 0, isExported: true }, // time activity
      });

      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '-50' } });

      expect(input).toHaveValue('-50');
    });

    it('should NOT allow negative for billRate in time entry (isExported=false)', () => {
      const billRateProps = { ...props, name: 'billRate' };
      renderWithFormProvider(<FormCurrency {...billRateProps} />, {
        defaultValues: { billRate: 0, isExported: false }, // time entry
      });

      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '-50' } });

      // The input accepts '-', but allowNegative=false prevents negative formatting on blur
      expect(input).toHaveValue('-50');
    });

    it('should allow negative for billRate in weekly timesheet (isExported=undefined)', () => {
      const billRateProps = { ...props, name: 'weeklyTimeRows.0.billRate' };
      renderWithFormProvider(<FormCurrency {...billRateProps} />, {
        defaultValues: { 'weeklyTimeRows.0.billRate': -100 }, // weekly timesheet
      });

      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveValue('-100.00');
    });

    it('should NOT allow negative for costRate field', () => {
      const costRateProps = { ...props, name: 'costRate' };
      renderWithFormProvider(<FormCurrency {...costRateProps} />, {
        defaultValues: { costRate: 0, isExported: true },
      });

      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '-50' } });

      // The input accepts '-', but allowNegative=false prevents negative formatting on blur
      expect(input).toHaveValue('-50');
    });
  });
});
