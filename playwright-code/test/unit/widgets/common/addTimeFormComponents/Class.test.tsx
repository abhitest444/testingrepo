import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { useTracking } from '@payroll/quicksand';
import { renderWithFormProvider } from 'test/unit/testUtils';
import useAuthorization from 'src/js/providers/useAuthorization';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

import {
  Class,
  ClassProps,
} from 'src/js/widgets/common/addTimeFormComponents/Class';
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
// Local variable to simulate value changes for the class field
let mockClassValue = { id: '1', name: '' };

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
  Controller: ({ render, rules, name }: any) => {
    // Simulate validation logic based on the test context
    const validate = rules?.validate;
    let mockValue = name === 'class' ? mockClassValue : { id: '', name: '' };
    let mockError;

    if (name === 'class' && validate) {
      if (currentTestContext === 'validation-error-test') {
        mockValue = { id: '', name: '' };
        mockError = validate(mockValue);
      } else if (currentTestContext === 'no-validation-error-test') {
        mockValue = { id: '1', name: 'Test Class' };
        mockError = validate(mockValue);
        mockValue = mockError ? { id: '', name: '' } : mockValue;
      } else {
        mockError = validate(mockValue);
      }
    }

    // Simulate onChange updating the value
    const onChange = ({ selectedItem }: any) => {
      if (name === 'class' && selectedItem) {
        mockClassValue = {
          id: selectedItem.id,
          name: selectedItem.displayName,
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
          <label htmlFor="classInput">{label}</label>
          <input
            id="classInput"
            data-testid="classInput"
            type="text"
            value={value?.id || ''}
            disabled={disabled}
            onChange={(e) => {
              if (e && e.target) {
                // Simulate the real event from fireEvent.change
                onChange({
                  selectedItem: {
                    id: e.target.value,
                    displayName: 'New Class',
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

describe('Class Component', () => {
  let props: ClassProps;
  const trackMock = jest.fn();

  beforeEach(() => {
    (useTracking as jest.Mock).mockReturnValue(trackMock);
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    (useAuthorization as jest.Mock).mockReturnValue({
      decision: { isAuthorized: true },
    });
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(false);
    props = {
      name: 'class',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CLASS,
    };
    // Reset mockClassValue before each test
    mockClassValue = { id: '1', name: '' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<Class {...props} />, {
      defaultValues: {
        class: {
          id: '',
          name: '',
        },
      },
    });

    // Check if the component renders with the correct label
    expect(screen.getByText(/class/)).toBeInTheDocument();
  });

  test.each([
    { description: 'required', isClassRequired: true, expectAsterisk: true },
    {
      description: 'not required',
      isClassRequired: false,
      expectAsterisk: false,
    },
  ])(
    'asterisk display when isClassRequired is $description',
    ({ isClassRequired, expectAsterisk }) => {
      props.isClassRequired = isClassRequired;

      renderWithFormProvider(<Class {...props} />, {
        defaultValues: { class: { id: '', name: '' } },
      });

      if (expectAsterisk) {
        expect(
          screen.getByText(/NLS drawer.form.class.label undefined \*/),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.getByText(/NLS drawer.form.class.label undefined/),
        ).toBeInTheDocument();
        expect(
          screen.queryByText(/NLS drawer.form.class.label undefined \*/),
        ).not.toBeInTheDocument();
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

      renderWithFormProvider(<Class {...props} />, {
        defaultValues: { class: { id: '', name: '' } },
      });

      const input = screen.getByTestId('classInput');
      if (expectedDisabled) {
        expect(input).toBeDisabled();
      } else {
        expect(input).not.toBeDisabled();
      }
    },
  );

  it('calls onChangeFunction when the value changes', () => {
    renderWithFormProvider(<Class {...props} />, {
      defaultValues: {
        class: {
          id: '1',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('classInput');

    // Clear the mock before testing
    trackMock.mockClear();

    // Does not call trackMock when rendering
    expect(trackMock).not.toHaveBeenCalled();

    // Does call trackMock when changing to the same value (actual behavior)
    act(() => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    expect(trackMock).toHaveBeenCalled();

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
      description: 'shouldValidate false, isClassRequired true',
      shouldValidate: false,
      isClassRequired: true,
    },
    {
      description: 'shouldValidate true, isClassRequired false',
      shouldValidate: true,
      isClassRequired: false,
    },
  ])(
    'does not show validation error when $description',
    ({ shouldValidate, isClassRequired }) => {
      props.shouldValidate = shouldValidate;
      props.isClassRequired = isClassRequired;

      renderWithFormProvider(<Class {...props} />, {
        defaultValues: { class: { id: '', name: '' } },
      });

      const input = screen.getByTestId('classInput');
      expect(input).toBeInTheDocument();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    },
  );

  it('shows validation error when both shouldValidate and isClassRequired are true and class is empty', async () => {
    props.shouldValidate = true;
    props.isClassRequired = true;
    currentTestContext = 'validation-error-test'; // Set context for this test

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: {
        class: {
          id: '',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('classInput');
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

  it('does not show validation error when both shouldValidate and isClassRequired are true but class has id', () => {
    props.shouldValidate = true;
    props.isClassRequired = true;
    currentTestContext = 'no-validation-error-test'; // Set context for this test

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: {
        class: {
          id: '1',
          name: 'Test Class',
        },
      },
    });

    const input = screen.getByTestId('classInput');
    expect(input).toBeInTheDocument();

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  it('passes addNew true for authorized non-workforce user', () => {
    renderWithFormProvider(<Class {...props} />, {
      defaultValues: { class: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-add-new',
      'true',
    );
  });

  it('passes addNew false for workforce user', () => {
    (isWorkforceEnvironment as jest.Mock).mockReturnValue(true);

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: { class: { id: '', name: '' } },
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

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: { class: { id: '', name: '' } },
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

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: { class: { id: '', name: '' } },
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

    renderWithFormProvider(<Class {...props} />, {
      defaultValues: { class: { id: '', name: '' } },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-widget-id',
      'qbo-quickfills-ui/quickfills',
    );
  });
});
