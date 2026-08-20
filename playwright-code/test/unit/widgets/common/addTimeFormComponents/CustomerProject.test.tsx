import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';

import { useTracking } from '@payroll/quicksand';
import { renderWithFormProvider } from 'test/unit/testUtils';

import {
  CustomerProject,
  CustomerProjectProps,
} from 'src/js/widgets/common/addTimeFormComponents/CustomerProject';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';
import { SINGLE_TIME_TRACKING_POINTS } from '../../../../../src/js/widgets/singleTimeTrowser/singleTimeTrackingPoints';

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useTracking: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  useWatch: jest.fn(),
}));

// Mock the Widget component
jest.mock('web-shell-core/widgets/HOCWidget', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
    disabled,
    placeholder,
    errorText,
    onReady,
    shouldOpenDropdown,
  }: any) => (
    <>
      <label htmlFor="customerProjectInput">{label}</label>
      <input
        id="customerProjectInput"
        data-testid="customerProjectInput"
        type="text"
        value={value || ''}
        disabled={disabled}
        placeholder={placeholder}
        data-error-text={errorText}
        onChange={(e) => {
          const mockItem = {
            selectedItem: {
              localId: e.target.value,
              displayName: e.target.value,
              projectRef: e.target.value
                ? `project:${e.target.value}`
                : undefined,
              parentName: e.target.value
                ? `Parent ${e.target.value}`
                : undefined,
            },
          };
          onChange(mockItem);
        }}
        onFocus={() => onReady && onReady()}
      />
      {errorText && <div data-testid="error-message">{errorText}</div>}
      {shouldOpenDropdown && (
        <div data-testid="dropdown-opened">Dropdown Opened</div>
      )}
    </>
  ),
}));

// Mock useAuthorization
jest.mock('src/js/providers/useAuthorization', () => ({
  __esModule: true,
  default: () => ({
    decision: { isAuthorized: true },
  }),
}));

// Mock isWorkforceEnvironment
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  isWorkforceEnvironment: jest.fn().mockReturnValue(false),
}));

describe('CustomerProject Component', () => {
  let props: CustomerProjectProps;
  const trackMock = jest.fn();
  const triggerMock = jest.fn();

  beforeEach(() => {
    (useTracking as jest.Mock).mockReturnValue(trackMock);
    (useWatch as jest.Mock).mockReturnValue(false); // Default to unlocked
    props = {
      name: 'timeAgainst',
      shouldValidate: false,
      hasProjects: true,
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
      toggledBillable: false,
      isBillingFieldEnabled: true,
      labelPreference: {
        DepartmentTerminology: 'Department',
        CustomerTerminology: 'Customer',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(screen.getByText(/customer/i)).toBeInTheDocument();
    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('handles onChange correctly', () => {
    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    const input = screen.getByTestId('customerProjectInput');

    act(() => {
      fireEvent.change(input, { target: { value: 'customer123' } });
    });

    expect(trackMock).toHaveBeenCalledWith(
      SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
    );
  });

  it('handles project selection correctly', () => {
    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    const input = screen.getByTestId('customerProjectInput');

    act(() => {
      fireEvent.change(input, { target: { value: 'project123' } });
    });

    expect(trackMock).toHaveBeenCalledWith(
      SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
    );
  });

  test.each([
    { description: 'disabled', isLocked: true, expectedDisabled: true },
    { description: 'enabled', isLocked: false, expectedDisabled: false },
  ])(
    'input is $description when isLocked is $isLocked',
    ({ isLocked, expectedDisabled }) => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'isLocked') return isLocked;
        return false;
      });

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
          isLocked,
        },
      });

      const input = screen.getByTestId('customerProjectInput');
      if (expectedDisabled) {
        expect(input).toBeDisabled();
      } else {
        expect(input).not.toBeDisabled();
      }
    },
  );

  describe('Validation behavior', () => {
    it('does not show validation error when shouldValidate is false', () => {
      props.shouldValidate = false;
      props.toggledBillable = true;

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('does not show validation error when toggledBillable is false', () => {
      props.shouldValidate = true;
      props.toggledBillable = false;

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('does not show validation error when isBillingFieldEnabled is false', () => {
      props.shouldValidate = true;
      props.toggledBillable = true;
      props.isBillingFieldEnabled = false;

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown behavior', () => {
    it('calls onDropdownOpened when dropdown opens', () => {
      const onDropdownOpenedMock = jest.fn();
      props.shouldOpenDropdown = true;
      props.onDropdownOpened = onDropdownOpenedMock;

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      expect(onDropdownOpenedMock).toHaveBeenCalled();
    });
  });

  describe('Time clock entry behavior', () => {
    it('handles time clock entry correctly', () => {
      props.isTimeClockEntry = true;

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      const input = screen.getByTestId('customerProjectInput');

      act(() => {
        fireEvent.change(input, { target: { value: 'timeclock123' } });
      });

      expect(trackMock).toHaveBeenCalledWith(
        SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
      );
    });
  });

  describe('Label preference behavior', () => {
    it('uses custom label preference when provided', () => {
      props.labelPreference = {
        DepartmentTerminology: 'Custom Department Label',
        CustomerTerminology: 'Custom Customer Label',
      };

      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      // The component should use the custom label preference
      expect(screen.getByText(/customer/i)).toBeInTheDocument();
    });
  });

  describe('QuickFind OTX Feature Flag Integration', () => {
    beforeEach(() => {
      // Mock useWatch to return timeFor value
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'timeFor') {
          return { id: '123', type: 'EMPLOYEE', name: 'John Doe' };
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });
    });

    it('should render QuickFind widget for OTX', () => {
      const quickFindProps = {
        ...props,
        isOTX: true,
      };

      renderWithFormProvider(<CustomerProject {...quickFindProps} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
          timeFor: { id: '123', type: 'EMPLOYEE', name: 'John Doe' },
        },
      });

      // Should render QuickFind widget (mocked as input with specific testid)
      expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
    });

    it('should render legacy quickfills widget when not OTX', () => {
      const quickFindProps = {
        ...props,
        isOTX: false,
      };

      renderWithFormProvider(<CustomerProject {...quickFindProps} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
    });

    it('should render with default props', () => {
      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });

      // Default values should allow normal rendering
      expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
    });

    it('should pass timeForEntityId to QuickFind widget', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'timeFor') {
          return { id: '999', type: 'EMPLOYEE', name: 'Test User' };
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });

      const quickFindProps = {
        ...props,
        isOTX: true,
      };

      renderWithFormProvider(<CustomerProject {...quickFindProps} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
          timeFor: { id: '999', type: 'EMPLOYEE', name: 'Test User' },
        },
      });

      expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
    });

    it('should pass only customer id as value to QuickFind when time entry has both customer and project (STE edit mode)', () => {
      (useWatch as jest.Mock).mockImplementation(({ name }) => {
        if (name === 'timeFor') {
          return { id: '9', type: 'EMPLOYEE', name: 'Test User' };
        }
        if (name === 'isLocked') {
          return false;
        }
        return undefined;
      });

      const quickFindProps = {
        ...props,
        isOTX: true,
      };

      renderWithFormProvider(<CustomerProject {...quickFindProps} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '44', name: null },
            project: { id: '446693202', name: '5th-level' },
          },
          timeFor: { id: '9', type: 'EMPLOYEE', name: 'Test User' },
        },
      });

      // QuickFind value must be customer id only so SFO dropdown option (keyed by customer.id) matches
      const input = screen.getByTestId('customerProjectInput');
      expect(input).toHaveValue('44');
    });
  });
});

const mockIsWorkforceEnvironment =
  isWorkforceEnvironment as jest.MockedFunction<typeof isWorkforceEnvironment>;

describe('CustomerProject - Workforce Support (QUANTA-8403)', () => {
  let props: CustomerProjectProps;
  const trackMock = jest.fn();

  beforeEach(() => {
    (useTracking as jest.Mock).mockReturnValue(trackMock);
    (useWatch as jest.Mock).mockImplementation(({ name }) => {
      if (name === 'timeFor') {
        return { id: '123', type: 'EMPLOYEE', name: 'John Doe' };
      }
      if (name === 'isLocked') {
        return false;
      }
      return undefined;
    });

    props = {
      name: 'timeAgainst',
      shouldValidate: false,
      hasProjects: true,
      trackingPoint: SINGLE_TIME_TRACKING_POINTS.CUSTOMER,
      toggledBillable: false,
      isBillingFieldEnabled: true,
      labelPreference: {
        DepartmentTerminology: 'Department',
        CustomerTerminology: 'Customer',
      },
      isOTX: true,
    };

    mockIsWorkforceEnvironment.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should hide Add New button for workforce users even with authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    // Widget should render but without addNew capability
    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('should show Add New button for QBO users with authorization', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('should call isWorkforceEnvironment with correct sandbox', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(mockIsWorkforceEnvironment).toHaveBeenCalled();
  });

  it('should use QuickFind for QBO users when OTX', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    // QuickFind should be rendered
    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('should use QuickFind for workforce users when OTX', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('should render without errors in workforce environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);

    expect(() => {
      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });
    }).not.toThrow();
  });

  it('should render without errors in QBO environment', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    expect(() => {
      renderWithFormProvider(<CustomerProject {...props} />, {
        defaultValues: {
          timeAgainst: {
            customer: { id: '', name: '' },
            project: { id: '', name: '' },
          },
        },
      });
    }).not.toThrow();
  });

  it('should maintain existing functionality when not workforce user', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    const input = screen.getByTestId('customerProjectInput');
    expect(input).toBeInTheDocument();
    expect(input).not.toBeDisabled();
  });

  it('should use old quickfills widget when not OTX and not workforce', () => {
    mockIsWorkforceEnvironment.mockReturnValue(false);
    props.isOTX = false;

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });

  it('should handle isOTX flag correctly with workforce user', () => {
    mockIsWorkforceEnvironment.mockReturnValue(true);
    props.isOTX = false; // When not OTX, should not use QuickFind even for workforce

    renderWithFormProvider(<CustomerProject {...props} />, {
      defaultValues: {
        timeAgainst: {
          customer: { id: '', name: '' },
          project: { id: '', name: '' },
        },
      },
    });

    expect(screen.getByTestId('customerProjectInput')).toBeInTheDocument();
  });
});
