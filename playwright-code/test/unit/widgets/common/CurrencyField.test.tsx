import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  CurrencyField,
  CurrencyFieldProps,
} from 'src/js/widgets/common/CurrencyField';

describe('CurrencyField', () => {
  let props: CurrencyFieldProps;

  beforeEach(() => {
    props = {
      value: 0,
      onChange: jest.fn(),
      setError: jest.fn(),
      showTooltipIcon: false,
      tooltipInfoId: 'time.details',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render with initial value', () => {
    renderWithFormProvider(<CurrencyField {...props} value={123} />);
    expect(screen.getByPlaceholderText('0.00')).toHaveValue('123.00');
  });

  it('should call onChange with formatted value on blur', () => {
    renderWithFormProvider(<CurrencyField {...props} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1234' },
    });
    fireEvent.blur(screen.getByPlaceholderText('0.00'));

    expect(props.onChange).toHaveBeenCalledWith(1234);
  });

  it('should set error if invalid currency format on blur', () => {
    renderWithFormProvider(<CurrencyField {...props} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: 'MOCK_BAD_TEXT' },
    });
    fireEvent.blur(screen.getByPlaceholderText('0.00'));

    expect(props.setError).toHaveBeenCalledWith(
      'NLS billrate.format.error undefined',
    );
  });

  it('should clear error if valid currency format on blur', () => {
    renderWithFormProvider(<CurrencyField {...props} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1234' },
    });
    fireEvent.blur(screen.getByPlaceholderText('0.00'));

    expect(props.setError).toHaveBeenCalledWith(undefined);
  });

  it('should display error text when provided', () => {
    renderWithFormProvider(
      <CurrencyField {...{ ...props, errorText: 'Invalid format' }} />,
    );

    expect(screen.getByText('Invalid format')).toBeInTheDocument();
  });

  it('should handle blur when internalValue is empty', () => {
    renderWithFormProvider(<CurrencyField {...props} />);

    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '' },
    });
    fireEvent.blur(screen.getByPlaceholderText('0.00'));

    expect(props.setError).toHaveBeenCalledWith(undefined);
    expect(props.onChange).toHaveBeenCalledWith(null);
  });

  test.each([
    {
      showTooltipIcon: true as true,
      description: 'renders tooltip icon when showTooltipIcon is true',
      expectInDocument: true,
    },
    {
      showTooltipIcon: false as false,
      description:
        'does not render tooltip icon when showTooltipIcon is false (default)',
      expectInDocument: false,
    },
  ])('should $description', ({ showTooltipIcon, expectInDocument }) => {
    renderWithFormProvider(
      <CurrencyField {...props} showTooltipIcon={showTooltipIcon} />,
    );
    const tooltipIcon = document.querySelector('svg[aria-hidden="true"]');
    if (expectInDocument) {
      expect(tooltipIcon).toBeInTheDocument();
    } else {
      expect(tooltipIcon).not.toBeInTheDocument();
    }
  });

  it('should display tooltip message on hover', () => {
    renderWithFormProvider(<CurrencyField {...props} showTooltipIcon />);
    const tooltipIcon = document.querySelector('svg[aria-hidden="true"]');
    if (tooltipIcon) {
      fireEvent.mouseOver(tooltipIcon);
      expect(
        screen.getByText((content, element) =>
          content.includes('time.details'),
        ),
      ).toBeInTheDocument();
    } else {
      throw new Error('Tooltip icon not found');
    }
  });

  describe('allowNegative prop', () => {
    it('should accept negative values when allowNegative is true', () => {
      renderWithFormProvider(
        <CurrencyField {...props} allowNegative value={-123.45} />,
      );
      expect(screen.getByPlaceholderText('0.00')).toHaveValue('-123.45');
    });

    it('should call onChange with negative formatted value on blur when allowNegative is true', () => {
      renderWithFormProvider(<CurrencyField {...props} allowNegative />);

      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '-50' },
      });
      fireEvent.blur(screen.getByPlaceholderText('0.00'));

      expect(props.onChange).toHaveBeenCalledWith(-50);
    });
  });
});
