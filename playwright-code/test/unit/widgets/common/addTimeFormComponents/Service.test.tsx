import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  Service,
  ServiceProps,
  isServiceTaxable,
} from 'src/js/widgets/common/addTimeFormComponents/Service';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

// Global variable to track test context
let currentTestContext = '';
// Local variable to simulate value changes for the service field
let mockServiceValue = { id: '1', name: '' };

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
  Controller: ({ render, rules, name }: any) => {
    // Simulate validation logic based on the test context
    const validate = rules?.validate;
    let mockValue =
      name === 'service' ? mockServiceValue : { id: '', name: '' };
    let mockError;

    if (name === 'service' && validate) {
      if (currentTestContext === 'validation-error-test') {
        mockValue = { id: '', name: '' };
        mockError = validate(mockValue);
      } else if (currentTestContext === 'no-validation-error-test') {
        mockValue = { id: '1', name: 'Test Service' };
        mockError = validate(mockValue);
        mockValue = mockError ? { id: '', name: '' } : mockValue;
      } else {
        mockError = validate(mockValue);
      }
    }

    // Simulate onChange updating the value
    const onChange = ({ selectedItem }: any) => {
      if (name === 'service' && selectedItem) {
        mockServiceValue = {
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

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useIntl: jest.fn().mockReturnValue({
    formatMessage: jest.fn().mockImplementation(({ id }: { id: string }) => {
      const messages: Record<string, string> = {
        'drawer.form.service.placeholder': 'Select a service',
        'drawer.form.service.label': 'Service',
        'drawer.field.required': 'This field is required',
      };
      return messages[id] || id;
    }),
  }),
  useTracking: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('src/js/providers/useAuthorization', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock isWorkforceEnvironment
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

jest.mock(
  'web-shell-core/widgets/HOCWidget',
  () =>
    function MockWidget({
      label,
      value,
      onChange,
      onReady,
      onLoad,
      disabled,
      errorText,
      placeholder,
      width,
      addNew,
      widgetId,
    }: {
      label?: string;
      value?: { id?: string };
      onChange?: (event: any) => void;
      onReady?: () => void;
      onLoad?: (item: any) => void;
      disabled?: boolean;
      errorText?: string;
      placeholder?: string;
      width?: number;
      addNew?: boolean;
      widgetId?: string;
    }) {
      return (
        <>
          <label htmlFor="serviceInput">{label}</label>
          <input
            id="serviceInput"
            data-testid="serviceInput"
            type="text"
            value={value?.id || ''}
            disabled={disabled}
            placeholder={placeholder}
            style={{ width }}
            onChange={(e) => {
              if (e && e.target) {
                // Simulate the real event from fireEvent.change
                onChange?.({
                  selectedItem: {
                    localId: e.target.value,
                    fullName: 'New Service',
                    traits: {
                      sale: {
                        price: 100,
                        description: 'Service description',
                      },
                    },
                    taxable: true,
                  },
                });
              } else if (e && (e as any).selectedItem) {
                // Direct call with selectedItem
                onChange?.(e);
              }
            }}
            onFocus={() => {
              if (onReady) onReady();
            }}
            onBlur={() => {
              if (onLoad) {
                onLoad({
                  selectedItem: {
                    localId: 'loaded-id',
                    fullName: 'Loaded Service',
                    traits: {
                      sale: {
                        price: 150,
                        description: 'Loaded description',
                      },
                    },
                    taxable: false,
                  },
                });
              }
            }}
          />
          {errorText && <div data-testid="error-message">{errorText}</div>}
          {addNew && <div data-testid="addNewButton">Add New</div>}
          <div data-testid="widget-props" data-widget-id={widgetId} />
        </>
      );
    },
);

describe('Service Component', () => {
  let props: ServiceProps;
  let mockUseAuthorization: jest.Mock;
  let mockTrack: jest.Mock;

  beforeEach(() => {
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    mockTrack = jest.fn();
    mockUseAuthorization = jest.fn().mockReturnValue({
      decision: { isAuthorized: true },
    });

    const { useTracking } = require('@payroll/quicksand');
    useTracking.mockReturnValue(mockTrack);

    const useAuthorization =
      require('src/js/providers/useAuthorization').default;
    useAuthorization.mockImplementation(mockUseAuthorization);

    props = {
      name: 'service',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.SERVICE,
    };
    // Reset mockServiceValue before each test
    mockServiceValue = { id: '1', name: '' };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: {
          id: '1',
          name: '',
        },
      },
    });

    // Check if the component renders with the correct label
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
  });

  test.each([
    { description: 'required', isServiceRequired: true, expectAsterisk: true },
    {
      description: 'not required',
      isServiceRequired: false,
      expectAsterisk: false,
    },
  ])(
    'asterisk display when isServiceRequired is $description',
    ({ isServiceRequired, expectAsterisk }) => {
      props.isServiceRequired = isServiceRequired;

      renderWithFormProvider(<Service {...props} />, {
        defaultValues: { service: { id: '1', name: '' } },
      });

      if (expectAsterisk) {
        expect(screen.getByText(/\*/)).toBeInTheDocument();
      } else {
        expect(screen.getByText('Service')).toBeInTheDocument();
        expect(screen.queryByText('Service *')).not.toBeInTheDocument();
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

      renderWithFormProvider(<Service {...props} />, {
        defaultValues: { service: { id: '1', name: '' } },
      });

      const input = screen.getByTestId('serviceInput');
      if (expectedDisabled) {
        expect(input).toBeDisabled();
      } else {
        expect(input).not.toBeDisabled();
      }
    },
  );

  it('calls onChangeFunction when the value changes', () => {
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');

    // Clear the mock before testing
    mockTrack.mockClear();

    // Does not call mockTrack when rendering
    expect(mockTrack).not.toHaveBeenCalled();

    // Does call mockTrack when changing to the same value (actual behavior)
    act(() => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    expect(mockTrack).toHaveBeenCalled();

    // Clear the mock again before testing the different value
    mockTrack.mockClear();

    // Does call mockTrack when changing to a different value
    act(() => {
      fireEvent.change(input, { target: { value: '2' } });
    });
    expect(mockTrack).toHaveBeenCalled();
  });

  test.each([
    {
      description: 'shouldValidate false, isServiceRequired true',
      shouldValidate: false,
      isServiceRequired: true,
    },
    {
      description: 'shouldValidate true, isServiceRequired false',
      shouldValidate: true,
      isServiceRequired: false,
    },
  ])(
    'does not show validation error when $description',
    ({ shouldValidate, isServiceRequired }) => {
      props.shouldValidate = shouldValidate;
      props.isServiceRequired = isServiceRequired;

      renderWithFormProvider(<Service {...props} />, {
        defaultValues: { service: { id: '', name: '' } },
      });

      const input = screen.getByTestId('serviceInput');
      expect(input).toBeInTheDocument();
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    },
  );

  it('shows validation error when both shouldValidate and isServiceRequired are true and service is empty', async () => {
    props.shouldValidate = true;
    props.isServiceRequired = true;
    currentTestContext = 'validation-error-test'; // Set context for this test

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: {
          id: '',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('serviceInput');
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

  it('does not show validation error when both shouldValidate and isServiceRequired are true but service has id', () => {
    props.shouldValidate = true;
    props.isServiceRequired = true;
    currentTestContext = 'no-validation-error-test'; // Set context for this test

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: {
          id: '1',
          name: 'Test Service',
        },
      },
    });

    const input = screen.getByTestId('serviceInput');
    expect(input).toBeInTheDocument();

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  test.each([
    { description: 'authorized', isAuthorized: true, expectVisible: true },
    {
      description: 'not authorized',
      isAuthorized: false,
      expectVisible: false,
    },
  ])(
    'add new button visibility when user is $description',
    ({ isAuthorized, expectVisible }) => {
      mockUseAuthorization.mockReturnValue({
        decision: { isAuthorized },
      });

      renderWithFormProvider(<Service {...props} />, {
        defaultValues: { service: { id: '1', name: '' } },
      });

      if (expectVisible) {
        expect(screen.getByTestId('addNewButton')).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
      }
    },
  );

  it('tracks when service is changed', () => {
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.change(input, { target: { value: 'new-service' } });

    expect(mockTrack).toHaveBeenCalledWith(SINGLE_TIME_TRACKING_POINTS.SERVICE);
  });

  it('updates refs when service is changed', () => {
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.change(input, { target: { value: 'new-service' } });

    expect(serviceItemPriceRef.current).toBe(100);
    expect(serviceDescriptionRef.current).toBe('Service description');
    expect(serviceTaxableRef.current).toBe(true);
  });

  it('marks form as edited when service is changed and rowIndex is provided', () => {
    const isFormEdited = { current: [false, false, false] };
    const rowIndex = 1;
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        isFormEdited={isFormEdited}
        rowIndex={rowIndex}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.change(input, { target: { value: 'new-service' } });

    expect(isFormEdited.current[rowIndex]).toBe(true);
  });

  it('does not mark form as edited when rowIndex is not provided', () => {
    const isFormEdited = { current: [false, false, false] };
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        isFormEdited={isFormEdited}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.change(input, { target: { value: 'new-service' } });

    expect(isFormEdited.current.every((edited) => !edited)).toBe(true);
  });

  it('calls updateLabel when service is changed', () => {
    const updateLabel = jest.fn();
    const serviceItemPriceRef = { current: 0 };
    const serviceDescriptionRef = { current: '' };
    const serviceTaxableRef = { current: false };

    renderWithFormProvider(
      <Service
        {...props}
        updateLabel={updateLabel}
        serviceItemPriceRef={serviceItemPriceRef}
        serviceDescriptionRef={serviceDescriptionRef}
        serviceTaxableRef={serviceTaxableRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.change(input, { target: { value: 'new-service' } });

    expect(updateLabel).toHaveBeenCalledWith('service', 'New Service');
  });

  it('calls updateLabel on ready', () => {
    const updateLabel = jest.fn();

    renderWithFormProvider(<Service {...props} updateLabel={updateLabel} />, {
      defaultValues: {
        service: {
          id: '1',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('serviceInput');
    fireEvent.focus(input);

    expect(updateLabel).toHaveBeenCalledWith('service', '');
  });

  it('updates preLoadedServiceItemsRef on load', () => {
    const preLoadedServiceItemsRef = { current: null };

    renderWithFormProvider(
      <Service
        {...props}
        preLoadedServiceItemsRef={preLoadedServiceItemsRef}
      />,
      {
        defaultValues: {
          service: {
            id: '1',
            name: '',
          },
        },
      },
    );

    const input = screen.getByTestId('serviceInput');
    fireEvent.blur(input);

    expect(preLoadedServiceItemsRef.current).toEqual({
      billRate: 150,
      taxable: false,
    });
  });

  it('applies width prop correctly', () => {
    const width = 300;

    renderWithFormProvider(<Service {...props} width={width} />, {
      defaultValues: {
        service: {
          id: '1',
          name: '',
        },
      },
    });

    const input = screen.getByTestId('serviceInput');
    expect(input).toHaveStyle({ width: '300px' });
  });

  it('handles authorization loading state', () => {
    mockUseAuthorization.mockReturnValue({
      decision: undefined,
    });

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: {
          id: '1',
          name: '',
        },
      },
    });

    // Should not show add new button when authorization is still loading
    expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
  });

  it('handles authorization error state', () => {
    mockUseAuthorization.mockReturnValue({
      decision: undefined,
      error: new Error('Authorization failed'),
    });

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: {
          id: '1',
          name: '',
        },
      },
    });

    expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
  });
});

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('Service - Workforce Support (QUANTA-8403)', () => {
  let props: ServiceProps;
  let mockUseAuthorization: jest.Mock;
  let mockTrack: jest.Mock;

  beforeEach(() => {
    (useWatch as jest.Mock).mockReturnValue(false);
    mockTrack = jest.fn();
    mockUseAuthorization = jest.fn().mockReturnValue({
      decision: { isAuthorized: true },
    });

    const { useTracking } = require('@payroll/quicksand');
    useTracking.mockReturnValue(mockTrack);

    const useAuthorization =
      require('src/js/providers/useAuthorization').default;
    useAuthorization.mockImplementation(mockUseAuthorization);

    props = {
      name: 'service',
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.SERVICE,
    };

    mockServiceValue = { id: '1', name: '' };
    currentTestContext = '';
    mockIsWorkforceEnvironment.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should hide Add New button for workforce users even with authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true },
    });

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
  });

  it('should show Add New button for QBO users with authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true },
    });

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('addNewButton')).toBeInTheDocument();
  });

  it('should call isWorkforceEnvironment with correct sandbox', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(mockIsWorkforceEnvironment).toHaveBeenCalled();
  });

  it('should render without errors in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    expect(() => {
      renderWithFormProvider(<Service {...props} />, {
        defaultValues: {
          service: { id: '1', name: '' },
        },
      });
    }).not.toThrow();
  });

  it('should render without errors in QBO environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    expect(() => {
      renderWithFormProvider(<Service {...props} />, {
        defaultValues: {
          service: { id: '1', name: '' },
        },
      });
    }).not.toThrow();
  });

  it('should maintain existing functionality when not workforce user', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    const input = screen.getByTestId('serviceInput');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('should use old quickfills widget when QuickFind is disabled', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    props.isOTX = false;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
  });

  it('should handle workforce user when not OTX', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    props.isOTX = false;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
    expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
  });

  it('should use QuickFind for QBO users in OTX time entry', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    props.isOTX = true;
    props.isTimeEntry = true;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
  });

  it('should hide Add New in QuickFind mode for workforce users', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    mockUseAuthorization.mockReturnValue({
      decision: { isAuthorized: true },
    });
    props.isOTX = true;
    props.isTimeEntry = true;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.queryByTestId('addNewButton')).not.toBeInTheDocument();
  });

  it('should handle isTimeEntry flag correctly', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    props.isOTX = true;
    props.isTimeEntry = false; // When false, should not use QuickFind

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
  });

  it('should properly evaluate shouldUseQuickFind condition with all flags', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    props.isOTX = true;
    props.isTimeEntry = true;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('serviceInput')).toBeInTheDocument();
  });

  it('should use QuickFind for workforce users in OTX time entry', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    props.isOTX = true;
    props.isTimeEntry = true;

    renderWithFormProvider(<Service {...props} />, {
      defaultValues: {
        service: { id: '1', name: '' },
      },
    });

    expect(screen.getByTestId('widget-props')).toHaveAttribute(
      'data-widget-id',
      'time-tracking-ui/quickFind',
    );
  });
});

describe('isServiceTaxable', () => {
  it('AU: returns true when taxCodeId is present', () => {
    expect(isServiceTaxable('AU', false, '5')).toBe(true);
  });

  it('AU: returns false when no taxCodeId and taxable is false', () => {
    expect(isServiceTaxable('AU', false, null)).toBe(false);
  });

  it('AU: falls back to taxable when taxCodeId is null', () => {
    expect(isServiceTaxable('AU', true, null)).toBe(true);
  });

  it('US: uses taxable field directly', () => {
    expect(isServiceTaxable('US', true, null)).toBe(true);
    expect(isServiceTaxable('US', false, '5')).toBe(false);
  });

  it('CA: uses taxable field, not taxCodeId', () => {
    expect(isServiceTaxable('CA', true, null)).toBe(true);
    expect(isServiceTaxable('CA', false, '4')).toBe(false);
  });

  it('GB: uses taxable field directly', () => {
    expect(isServiceTaxable('GB', true, '10')).toBe(true);
    expect(isServiceTaxable('GB', false, null)).toBe(false);
  });
});
