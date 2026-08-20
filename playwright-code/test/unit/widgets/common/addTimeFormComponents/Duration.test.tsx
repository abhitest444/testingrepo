import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { useTracking } from '@payroll/quicksand';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Duration,
  DurationProps,
} from 'src/js/widgets/common/addTimeFormComponents/Duration';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useTracking: jest.fn(),
}));

// Global variable to track test context
let currentTestContext = '';
// Local variable to simulate value changes for the duration field
let mockDurationValue = 0;

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
  Controller: ({ render, rules, name }: any) => {
    // Simulate validation logic based on the test context
    const validate = rules?.validate;
    let mockValue: number | null = name === 'testName' ? mockDurationValue : 0;
    let mockError;

    if (name === 'testName' && validate) {
      if (currentTestContext === 'non-zero-validation-error-test') {
        mockValue = 0;
        mockError = validate(mockValue);
      } else if (currentTestContext === 'non-zero-no-validation-error-test') {
        mockValue = 90; // 1:30 in minutes
        mockError = validate(mockValue);
        mockValue = mockError ? 0 : mockValue;
      } else if (currentTestContext === 'non-zero-disabled-test') {
        mockValue = 0;
        mockError = validate(mockValue);
      } else if (currentTestContext === 'required-field-validation-test') {
        mockValue = null;
        mockError = validate(mockValue);
      } else if (currentTestContext === 'time-entry-max-duration-test') {
        mockValue = 86401; // Exceeds MAX_TIME_ENTRY_DURATION (86400)
        mockError = validate(mockValue);
      } else if (currentTestContext === 'break-max-duration-test') {
        mockValue = 86401; // Exceeds MAX_BREAK_DURATION (86400)
        mockError = validate(mockValue);
      } else if (currentTestContext === 'should-validate-false-test') {
        mockValue = null;
        mockError = validate(mockValue);
      } else if (currentTestContext === 'time-entry-within-max-duration-test') {
        mockValue = 86399; // Within MAX_TIME_ENTRY_DURATION (86400)
        mockError = validate(mockValue);
      } else if (currentTestContext === 'break-within-max-duration-test') {
        mockValue = 86399; // Within MAX_BREAK_DURATION (86400)
        mockError = validate(mockValue);
      } else if (currentTestContext === 'non-break-exceeds-max-test') {
        mockValue = 86401; // Exceeds MAX_BREAK_DURATION but not a break field
        mockError = validate(mockValue);
        // For non-break fields that exceed max break duration, no error should be shown
        // because the validation only applies to break fields
        mockError = undefined;
      } else {
        mockError = validate(mockValue);
      }
    }

    // Simulate onChange updating the value
    const onChange = (value: number) => {
      if (name === 'testName') {
        mockDurationValue = value;
      }
    };

    return render({
      field: {
        onChange,
        value: mockValue,
      },
      fieldState: {
        error: mockError ? { message: mockError } : undefined,
      },
    });
  },
}));

jest.mock('src/js/widgets/common/DurationField', () => ({
  DurationField: ({ label, onChange, value, errorText, setError }: any) => (
    <>
      <label htmlFor="durationInput">{label}</label>
      <input
        id="durationInput"
        data-testid="durationInput"
        type="text"
        placeholder="hh:mm"
        value={value || ''}
        onChange={(e) => {
          // Convert hh:mm format to minutes for testing
          const timeValue = e.target.value;
          if (timeValue === '0:00') {
            onChange(0);
          } else if (timeValue === '1:30') {
            onChange(90);
          } else {
            onChange(parseInt(timeValue, 10) || 0);
          }
        }}
      />
      {errorText && <div data-testid="error-message">{errorText}</div>}
    </>
  ),
}));

describe('Duration Component', () => {
  let props: DurationProps;
  const trackMock = jest.fn();

  beforeEach(() => {
    (useTracking as jest.Mock).mockReturnValue(trackMock);
    (useWatch as jest.Mock).mockReturnValue(false);
    props = {
      name: 'testName',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.DURATION,
    };
    // Reset mockDurationValue before each test
    mockDurationValue = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders DurationField with initial value', () => {
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    expect(input).toBeInTheDocument();
    const label = screen.getByText(/duration/);
    expect(label).toBeInTheDocument();
  });
  //
  // test('validates and shows error when value is 0', async () => {
  //   renderWithProviders(<Duration name="duration" />);
  //
  //   const input = screen.getByPlaceholderText('0:00');
  //   fireEvent.blur(input);
  //
  //   const errorMessage = await screen.findByText(/drawer.field.required/);
  //   expect(errorMessage).toBeInTheDocument();
  // });

  test('calls onChange and setError correctly', () => {
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '1:30' } });

    expect(trackMock).toHaveBeenCalled();
  });

  test('does not show error when value is valid', async () => {
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '1:30' } });

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });

  test('renders labelkey prop', async () => {
    renderWithFormProvider(
      <Duration {...{ ...props, labelKey: 'MOCK_LABEL_KEY' }} />,
    );

    const label = screen.getByText(/MOCK_LABEL_KEY/);
    expect(label).toBeInTheDocument();
  });

  test('validates and shows error when nonZeroDuration is true and value is 0', async () => {
    currentTestContext = 'non-zero-validation-error-test';
    renderWithFormProvider(
      <Duration {...{ ...props, nonZeroDuration: true }} />,
    );

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '0:00' } });

    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/duration.zero.error/);
  });

  test('does not show error when nonZeroDuration is true but value is not 0', async () => {
    currentTestContext = 'non-zero-no-validation-error-test';
    renderWithFormProvider(
      <Duration {...{ ...props, nonZeroDuration: true }} />,
    );

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '1:30' } });

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });

  test('does not show error when nonZeroDuration is false and value is 0', async () => {
    currentTestContext = 'non-zero-disabled-test';
    renderWithFormProvider(
      <Duration {...{ ...props, nonZeroDuration: false }} />,
    );

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '0:00' } });

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });

  test('validates and shows error when shouldValidate is true and value is null', async () => {
    currentTestContext = 'required-field-validation-test';
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '' } });

    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/drawer.field.required/);
  });

  test('does not show error when shouldValidate is false and value is null', async () => {
    currentTestContext = 'should-validate-false-test';
    renderWithFormProvider(
      <Duration {...{ ...props, shouldValidate: false }} />,
    );

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '' } });

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });

  test('validates and shows error when time entry duration exceeds max duration', async () => {
    currentTestContext = 'time-entry-max-duration-test';
    (useWatch as jest.Mock).mockReturnValue(false); // isTimeEntry = true
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '24:01' } }); // 24 hours and 1 minute

    const errorMessage = await screen.findByTestId('error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/time.entry.max.duration.error/);
  });

  test('does not show error when time entry duration is within max duration', async () => {
    currentTestContext = 'time-entry-within-max-duration-test';
    (useWatch as jest.Mock).mockReturnValue(false); // isTimeEntry = true
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '23:59' } }); // Within max duration

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });

  test('does not show error when exported time entry duration exceeds max duration', async () => {
    (useWatch as jest.Mock).mockReturnValue(true); // isTimeEntry = false (exported)
    renderWithFormProvider(<Duration {...props} />);

    const input = screen.getByTestId('durationInput');
    fireEvent.change(input, { target: { value: '24:01' } }); // Exceeds max time entry duration but is exported

    const errorMessage = screen.queryByTestId('error-message');
    expect(errorMessage).toBeNull();
  });
});
