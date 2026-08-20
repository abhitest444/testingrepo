import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { useTracking } from '@payroll/quicksand';
import { renderWithFormProvider } from 'test/unit/testUtils';
import useAuthorization from 'src/js/providers/useAuthorization';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

import {
  Location,
  LocationProps,
} from 'src/js/widgets/common/addTimeFormComponents/Location';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useTracking: jest.fn(),
}));

jest.mock('src/js/providers/useAuthorization', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn(),
}));

// Global variable to track test context
let currentTestContext = '';
// Local variable to simulate value changes for the location field
let mockLocationValue = { id: '1', name: '' };

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
  Controller: ({ render, rules, name }: any) => {
    // Simulate validation logic based on the test context
    const validate = rules?.validate;
    let mockValue =
      name === 'location' ? mockLocationValue : { id: '', name: '' };
    let mockError;

    if (name === 'location' && validate) {
      if (currentTestContext === 'validation-error-test') {
        mockValue = { id: '', name: '' };
        mockError = validate(mockValue);
      } else if (currentTestContext === 'no-validation-error-test') {
        mockValue = { id: '1', name: 'Test Location' };
        mockError = validate(mockValue);
        mockValue = mockError ? { id: '', name: '' } : mockValue;
      } else {
        mockError = validate(mockValue);
      }
    }

    // Simulate onChange updating the value
    const onChange = ({ selectedItem }: any) => {
      if (name === 'location' && selectedItem) {
        mockLocationValue = {
          id: selectedItem.localId,
          name: selectedItem.fullName,
        };
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

jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    // @ts-ignore
    function MockWidget({
      label,
      value,
      onChange,
      disabled,
      errorText,
      addNew,
      widgetId,
    }: any) {
      return (
        <>
          <label htmlFor="locationInput">{label}</label>
          <input
            id="locationInput"
            data-testid="locationInput"
            type="text"
            value={value?.id || ''}
            disabled={disabled}
            onChange={(e) => {
              if (e && e.target) {
                // Simulate the real event from fireEvent.change
                onChange({
                  selectedItem: {
                    localId: e.target.value,
                    fullName: 'New Location',
                  },
                });
              } else if (e && (e as any).selectedItem) {
                // Direct call with selectedItem
                onChange(e);
              }
            }}
          />
          {errorText && <div data-testid="error-message">{errorText}</div>}
          <div
            data-testid="widget-props"
            data-add-new={String(addNew)}
            data-widget-id={widgetId}
          />
        </>
      );
    },
);

describe('Location Component', () => {
  let props: LocationProps;
  const trackMock = jest.fn();

  beforeEach(() => {
    (useTracking as jest.Mock).mockReturnValue(trackMock);
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    (useAuthorization as jest.Mock).mockReturnValue({
      decision: { isAuthorized: true },
    });
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    props = {
      name: 'location',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.LOCATION,
      labelPreference: {
        CustomerTerminology: 'Customer',
        DepartmentTerminology: 'Department',
      },
    };
    // Reset mockLocationValue before each test
    mockLocationValue = { id: '1', name: '' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    {
      description: 'Department',
      terminology: 'Department',
      expectedLabel: /Department/,
    },
    {
      description: 'Location',
      terminology: 'Location',
      expectedLabel: /Location/,
    },
  ])(
    'renders correctly with DepartmentTerminology as $description',
    ({ terminology, expectedLabel }) => {
      props.labelPreference.DepartmentTerminology = terminology;

      renderWithFormProvider(<Location {...props} />, {
        defaultValues: { location: { id: '1', name: '' } },
      });

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    },
  );

  test.each([
    { description: 'required', isLocationRequired: true, expectAsterisk: true },
    {
      description: 'not required',
      isLocationRequired: false,
      expectAsterisk: false,
    },
  ])(
    'asterisk display when isLocationRequired is $description',
    ({ isLocationRequired, expectAsterisk }) => {
      props.isLocationRequired = isLocationRequired;

      renderWithFormProvider(<Location {...props} />, {
        defaultValues: { location: { id: '1', name: '' } },
      });

      if (expectAsterisk) {
        expect(screen.getByText(/\*/)).toBeInTheDocument();
      } else {
        expect(screen.getByText(/Department/)).toBeInTheDocument();
        expect(screen.queryByText(/Department \*/)).not.toBeInTheDocument();
      }
    },
  );

  test.each([
    { description: 'locked', isLocked: true, expectedDisabled: true },
    { description: 'unlocked', isLocked: false, expectedDisabled: false },
  ])(
    'renders in $description state when isLocked is $isLocked',
    ({ isLocked, expectedDisabled }) => {
      (useWatch as jest.Mock).mockReturnValue(isLocked);

      renderWithFormProvider(<Location {...props} />, {
        defaultValues: { location: { id: '1', name: '' } },
      });

      const input = screen.getByTestId('locationInput');
      if (expectedDisabled) {
        expect(input).toBeDisabled();
      } else {
        expect(input).not.toBeDisabled();
      }
    },
  );

  it('calls onChangeFunction when the value changes', () => {
    renderWithFormProvider(<Location {...props} />, {
      defaultValues: {
        location: {
          id: '1',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('locationInput');

    // Clear the mock before testing
    trackMock.mockClear();

    // Does not call trackMock when rendering
    expect(trackMock).not.toHaveBeenCalled();

    // Does not call trackMock when changing to the same value
    act(() => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    expect(trackMock).not.toHaveBeenCalled();

    // Clear the mock again before testing the different value
    trackMock.mockClear();

    // Does call trackMock when changing to a different value
    act(() => {
      fireEvent.change(input, { target: { value: '2' } });
    });
    expect(trackMock).toHaveBeenCalled();
  });

  test.each([
    {
      description: 'shouldValidate false, isLocationRequired true',
      shouldValidate: false,
      isLocationRequired: true,
    },
    {
      description: 'shouldValidate true, isLocationRequired false',
      shouldValidate: true,
      isLocationRequired: false,
    },
  ])(
    'does not show validation error when $description',
    ({ shouldValidate, isLocationRequired }) => {
      props.shouldValidate = shouldValidate;
      props.isLocationRequired = isLocationRequired;

      renderWithFormProvider(<Location {...props} />, {
        defaultValues: { location: { id: '', name: '' } },
      });

      const input = screen.getByTestId('locationInput');
      expect(input).toBeInTheDocument();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    },
  );

  it('shows validation error when both shouldValidate and isLocationRequired are true and location is empty', async () => {
    props.shouldValidate = true;
    props.isLocationRequired = true;
    currentTestContext = 'validation-error-test'; // Set context for this test

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: {
        location: {
          id: '',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('locationInput');
    expect(input).toBeInTheDocument();

    // Trigger validation by changing the value
    act(() => {
      fireEvent.change(input, { target: { value: '' } });
    });

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('does not show validation error when both shouldValidate and isLocationRequired are true but location has id', () => {
    props.shouldValidate = true;
    props.isLocationRequired = true;
    currentTestContext = 'no-validation-error-test'; // Set context for this test

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: {
        location: {
          id: '1',
          name: 'Test Location',
        },
      },
    });

    const input = screen.getByTestId('locationInput');
    expect(input).toBeInTheDocument();

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('passes addNew true for authorized non-workforce user', () => {
    renderWithFormProvider(<Location {...props} />, {
      defaultValues: { location: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-add-new',
      'true',
    );
  });

  it('passes addNew false for workforce user', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: { location: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-add-new',
      'false',
    );
  });

  it('passes addNew false for unauthorized user', () => {
    (useAuthorization as jest.Mock).mockReturnValue({
      decision: { isAuthorized: false },
    });

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: { location: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-add-new',
      'false',
    );
  });

  it('uses QuickFind widget for workforce users in OTX time entry', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    props.isOTX = true;
    props.isTimeEntry = true;

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: { location: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-widget-id',
      'time-tracking-ui/quickFind',
    );
  });

  it('does not use QuickFind widget for workforce users when not in OTX flow', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);
    props.isOTX = false;
    props.isTimeEntry = true;

    renderWithFormProvider(<Location {...props} />, {
      defaultValues: { location: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-widget-id',
      'qbo-quickfills-ui/quickfills',
    );
  });
});
