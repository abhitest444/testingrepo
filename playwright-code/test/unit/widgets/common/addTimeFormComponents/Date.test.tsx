import React from 'react';
import { screen } from '@testing-library/react';
import dayjs from 'dayjs';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Date,
  DateProps,
} from 'src/js/widgets/common/addTimeFormComponents/Date';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

// Capture the props passed to the underlying picker so we can assert the
// submit-time lock wiring (startMinDate / disabled) precisely.
const mockDatePickerProps: { current: Record<string, any> | null } = {
  current: null,
};
jest.mock('src/js/widgets/common/FormattedDatePicker', () => ({
  FormattedDatePicker: (pickerProps: Record<string, any>) => {
    mockDatePickerProps.current = pickerProps;
    return require('react').createElement('input', { 'aria-label': 'date' });
  },
}));

const mockUseSubmitTimeDatesContext = jest.fn();
jest.mock(
  'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider',
  () => ({
    useSubmitTimeDatesContext: () => mockUseSubmitTimeDatesContext(),
  }),
);

describe('Date Component', () => {
  let props: DateProps;

  beforeEach(() => {
    props = {
      name: 'date',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.START_DATE,
    };
    mockDatePickerProps.current = null;
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithFormProvider(<Date {...props} />, {
      defaultValues: { date: dayjs() },
    });
    const input = screen.getByRole('textbox');

    expect(input).toBeInTheDocument();
  });

  test('uses minSelectableDate as the min when it is later than the minDate prop', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs('2026-06-10'),
    });

    renderWithFormProvider(
      <Date
        name="startDate"
        trackingPoint={props.trackingPoint}
        minDate={dayjs('2026-06-01')}
      />,
      { defaultValues: { startDate: dayjs('2026-06-20') } },
    );

    expect(mockDatePickerProps.current?.minDate?.format('YYYY-MM-DD')).toBe(
      '2026-06-10',
    );
    expect(mockDatePickerProps.current?.disabled).toBe(false);
  });

  test('disables the field when the lock covers the entire range (min after max)', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs('2026-07-01'),
    });

    renderWithFormProvider(
      <Date
        name="startDate"
        trackingPoint={props.trackingPoint}
        maxDate={dayjs('2026-06-30')}
      />,
      { defaultValues: { startDate: dayjs('2026-06-20') } },
    );

    expect(mockDatePickerProps.current?.disabled).toBe(true);
  });

  test('does not disable the field when the lock is before maxDate', () => {
    mockUseSubmitTimeDatesContext.mockReturnValue({
      minSelectableDate: dayjs('2026-06-01'),
    });

    renderWithFormProvider(
      <Date
        name="startDate"
        trackingPoint={props.trackingPoint}
        maxDate={dayjs('2026-06-30')}
      />,
      { defaultValues: { startDate: dayjs('2026-06-20') } },
    );

    expect(mockDatePickerProps.current?.disabled).toBe(false);
  });

  // test('displays error message when date is invalid', async () => {
  //   renderWithProviders(<Date name="testDate" />, {
  //     defaultValues: { testDate: dayjs() },
  //   });
  //   const input = screen.getByLabelText(/start date/i);
  //
  //   fireEvent.change(input, { target: { value: 'invalid date' } });
  //   fireEvent.blur(input);
  //
  //   expect(
  //     await screen.findByText(/this field is required/i),
  //   ).toBeInTheDocument();
  // });

  // test('calls onChange with valid date', async () => {
  //   const handleChange = jest.fn();
  //   renderWithProviders(<Date name="testDate" />, {
  //     defaultValues: { testDate: dayjs() },
  //   });
  //   const input = screen.getByRole('textbox');
  //
  //   fireEvent.change(input, {
  //     target: { value: dayjs().format('MM/DD/YYYY') },
  //   });
  //   fireEvent.blur(input);
  //
  //   expect(handleChange).toHaveBeenCalled();
  // });
  //
  // test('renders with custom width', () => {
  //   renderWithProviders(<Date name="testDate" width={300} />, {
  //     defaultValues: { testDate: dayjs() },
  //   });
  //   const input = screen.getByRole('textbox');
  //   expect(input).toHaveStyle('width: 300px');
  // });
});
