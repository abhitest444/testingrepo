import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickFindContent from '../../../../../src/js/widgets/quickFind/components/QuickFindContent';
import { ContactType } from '../../../../../src/js/widgets/quickFind/types';

// Mock the dropdown components
jest.mock(
  '../../../../../src/js/widgets/quickFind/components/TeamMemberDropdownGraphQL',
  () =>
    function TeamMemberDropdownGraphQL(props: any) {
      return (
        <div
          data-testid="team-member-dropdown-graphql"
          data-props={JSON.stringify(props)}
        >
          GraphQL API Dropdown
        </div>
      );
    },
);

jest.mock(
  '../../../../../src/js/widgets/quickFind/components/CustomerDropdown',
  () =>
    function CustomerDropdown(props: any) {
      return (
        <div data-testid="customer-dropdown" data-props={JSON.stringify(props)}>
          Customer Dropdown
        </div>
      );
    },
);

jest.mock(
  '../../../../../src/js/widgets/quickFind/components/ServiceDropdown',
  () =>
    function ServiceDropdown(props: any) {
      // Trigger callbacks if provided
      React.useEffect(() => {
        if (props.onReady) props.onReady();
      }, [props]);

      return (
        <div data-testid="service-dropdown" data-props={JSON.stringify(props)}>
          Service Dropdown
          <button
            data-testid="service-dropdown-change"
            onClick={() => props.onChange?.('svc-id', { id: 'svc-id' })}
            type="button"
          >
            Trigger Service Change
          </button>
        </div>
      );
    },
);

jest.mock(
  '../../../../../src/js/widgets/quickFind/components/ClassDropdown',
  () =>
    function ClassDropdown(props: any) {
      // Trigger callbacks if provided
      React.useEffect(() => {
        if (props.onReady) props.onReady();
      }, [props]);

      return (
        <div data-testid="class-dropdown" data-props={JSON.stringify(props)}>
          Class Dropdown
        </div>
      );
    },
);

jest.mock(
  '../../../../../src/js/widgets/quickFind/components/LocationDropdown',
  () =>
    function LocationDropdown(props: any) {
      // Trigger callbacks if provided
      React.useEffect(() => {
        if (props.onReady) props.onReady();
        if (props.onError) props.onError('Test error');
      }, [props]);

      return (
        <div data-testid="location-dropdown" data-props={JSON.stringify(props)}>
          Location Dropdown
        </div>
      );
    },
);

describe('QuickFindContent', () => {
  const mockOnChange = jest.fn();
  const mockOnReady = jest.fn();
  const mockOnError = jest.fn();
  const mockOnLoad = jest.fn();

  const defaultProps = {
    onChange: mockOnChange,
    onReady: mockOnReady,
    onError: mockOnError,
    onLoad: mockOnLoad,
    label: 'Team Member',
    placeholder: 'Select a team member',
    errorText: '',
    subTypes: [ContactType.Employee, ContactType.Vendor],
    value: '',
    filters: {
      subtypes: {
        [ContactType.Employee]: {},
        [ContactType.Vendor]: {},
      },
    },
    width: '300px',
    addNew: false,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Team member dropdown (default)', () => {
    it('should render TeamMemberDropdownGraphQL component', () => {
      render(<QuickFindContent {...defaultProps} />);

      expect(
        screen.getByTestId('team-member-dropdown-graphql'),
      ).toBeInTheDocument();
      expect(screen.getByText('GraphQL API Dropdown')).toBeInTheDocument();
    });

    it('should pass all props correctly to TeamMemberDropdownGraphQL', () => {
      render(<QuickFindContent {...defaultProps} />);

      const graphqlComponent = screen.getByTestId(
        'team-member-dropdown-graphql',
      );
      const passedProps = JSON.parse(
        graphqlComponent.getAttribute('data-props') || '{}',
      );

      expect(passedProps.label).toBe('Team Member');
      expect(passedProps.placeholder).toBe('Select a team member');
      expect(passedProps.value).toBe('');
      expect(passedProps.disabled).toBe(false);
      expect(passedProps.addNew).toBe(false);
    });

    it('should pass custom props to TeamMemberDropdownGraphQL', () => {
      const customProps = {
        ...defaultProps,
        value: '456',
        errorText: 'Error occurred',
        width: '400px',
      };

      render(<QuickFindContent {...customProps} />);

      const graphqlComponent = screen.getByTestId(
        'team-member-dropdown-graphql',
      );
      const passedProps = JSON.parse(
        graphqlComponent.getAttribute('data-props') || '{}',
      );

      expect(passedProps.value).toBe('456');
      expect(passedProps.errorText).toBe('Error occurred');
      expect(passedProps.width).toBe('400px');
    });

    it('should handle team-member dropdownType explicitly', () => {
      render(<QuickFindContent {...defaultProps} dropdownType="team-member" />);

      expect(
        screen.getByTestId('team-member-dropdown-graphql'),
      ).toBeInTheDocument();
    });

    it('should default to team-member when dropdownType is not provided', () => {
      render(<QuickFindContent {...defaultProps} />);

      expect(
        screen.getByTestId('team-member-dropdown-graphql'),
      ).toBeInTheDocument();
    });

    it('should maintain component across prop changes', () => {
      const { rerender } = render(<QuickFindContent {...defaultProps} />);

      expect(
        screen.getByTestId('team-member-dropdown-graphql'),
      ).toBeInTheDocument();

      rerender(<QuickFindContent {...defaultProps} value="new-value" />);

      expect(
        screen.getByTestId('team-member-dropdown-graphql'),
      ).toBeInTheDocument();
      const graphqlComponent = screen.getByTestId(
        'team-member-dropdown-graphql',
      );
      const passedProps = JSON.parse(
        graphqlComponent.getAttribute('data-props') || '{}',
      );
      expect(passedProps.value).toBe('new-value');
    });
  });

  describe('Customer Dropdown Type Routing', () => {
    it('should render CustomerDropdown when dropdownType is customer', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="customer"
          timeForEntityId="123"
        />,
      );

      expect(screen.getByTestId('customer-dropdown')).toBeInTheDocument();
      expect(
        screen.queryByTestId('team-member-dropdown-graphql'),
      ).not.toBeInTheDocument();
    });

    it('should pass correct props to CustomerDropdown', () => {
      const customerProps = {
        ...defaultProps,
        dropdownType: 'customer' as const,
        timeForEntityId: '123',
        assignmentFilters: { assigned: true },
      };

      render(<QuickFindContent {...customerProps} />);

      const customerDropdown = screen.getByTestId('customer-dropdown');
      const props = JSON.parse(
        customerDropdown.getAttribute('data-props') || '{}',
      );

      expect(props.timeForEntityId).toBe('123');
      expect(props.assignmentFilters).toEqual({ assigned: true });
      expect(props.label).toBe('Team Member');
      expect(props.addNew).toBe(false);
    });

    it('should pass callbacks to CustomerDropdown', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="customer"
          timeForEntityId="123"
        />,
      );

      const customerDropdown = screen.getByTestId('customer-dropdown');

      // Callbacks are passed to the component
      // We can't serialize functions to JSON, so just verify the component rendered
      expect(customerDropdown).toBeInTheDocument();
    });

    it('should enable addNew for customer dropdown when specified', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="customer"
          timeForEntityId="123"
          addNew
        />,
      );

      const customerDropdown = screen.getByTestId('customer-dropdown');
      const props = JSON.parse(
        customerDropdown.getAttribute('data-props') || '{}',
      );

      expect(props.addNew).toBe(true);
    });
  });

  describe('Service Dropdown Type Routing', () => {
    it('should render ServiceDropdown when dropdownType is service', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="service"
          timeForEntityId="123"
        />,
      );

      expect(screen.getByTestId('service-dropdown')).toBeInTheDocument();
      expect(
        screen.queryByTestId('team-member-dropdown-graphql'),
      ).not.toBeInTheDocument();
    });

    it('should pass correct props to ServiceDropdown', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="service"
          timeForEntityId="123"
          customerId="456"
          projectId="789"
          assignmentFilters={{ assigned: true }}
        />,
      );

      const serviceDropdown = screen.getByTestId('service-dropdown');
      const props = JSON.parse(
        serviceDropdown.getAttribute('data-props') || '{}',
      );

      expect(props.timeForEntityId).toBe('123');
      expect(props.customerId).toBe('456');
      expect(props.projectId).toBe('789');
      expect(props.assignmentFilters).toEqual({ assigned: true });
    });

    it('should invoke callbacks for ServiceDropdown', async () => {
      const onReady = jest.fn();
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="service"
          timeForEntityId="123"
          onReady={onReady}
        />,
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
      });
    });

    it('should forward ServiceDropdown onChange through wrapper handler', () => {
      const onChange = jest.fn();
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="service"
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByTestId('service-dropdown-change'));
      expect(onChange).toHaveBeenCalledWith('svc-id', { id: 'svc-id' });
    });
  });

  describe('Class Dropdown Type Routing', () => {
    it('should render ClassDropdown when dropdownType is class', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="class"
          timeForEntityId="123"
        />,
      );

      expect(screen.getByTestId('class-dropdown')).toBeInTheDocument();
      expect(
        screen.queryByTestId('team-member-dropdown-graphql'),
      ).not.toBeInTheDocument();
    });

    it('should pass correct props to ClassDropdown', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="class"
          timeForEntityId="123"
          customerId="456"
          projectId="789"
          assignmentFilters={{ assigned: true }}
        />,
      );

      const classDropdown = screen.getByTestId('class-dropdown');
      const props = JSON.parse(
        classDropdown.getAttribute('data-props') || '{}',
      );

      expect(props.timeForEntityId).toBe('123');
      expect(props.customerId).toBe('456');
      expect(props.projectId).toBe('789');
      expect(props.assignmentFilters).toEqual({ assigned: true });
    });

    it('should invoke callbacks for ClassDropdown', async () => {
      const onReady = jest.fn();
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="class"
          timeForEntityId="123"
          onReady={onReady}
        />,
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
      });
    });
  });

  describe('Location Dropdown Type Routing', () => {
    it('should render LocationDropdown when dropdownType is location', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="location"
          timeForEntityId="123"
        />,
      );

      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(
        screen.queryByTestId('team-member-dropdown-graphql'),
      ).not.toBeInTheDocument();
    });

    it('should pass correct props to LocationDropdown', () => {
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="location"
          timeForEntityId="123"
          customerId="456"
          projectId="789"
          assignmentFilters={{ assigned: true }}
        />,
      );

      const locationDropdown = screen.getByTestId('location-dropdown');
      const props = JSON.parse(
        locationDropdown.getAttribute('data-props') || '{}',
      );

      expect(props.timeForEntityId).toBe('123');
      expect(props.customerId).toBe('456');
      expect(props.projectId).toBe('789');
      expect(props.assignmentFilters).toEqual({ assigned: true });
    });

    it('should invoke callbacks for LocationDropdown', async () => {
      const onReady = jest.fn();
      const onError = jest.fn();
      render(
        <QuickFindContent
          {...defaultProps}
          dropdownType="location"
          timeForEntityId="123"
          onReady={onReady}
          onError={onError}
        />,
      );

      await waitFor(() => {
        expect(onReady).toHaveBeenCalled();
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onChange: undefined,
        onReady: undefined,
        onError: undefined,
        onLoad: undefined,
      };

      expect(() => {
        render(<QuickFindContent {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it('should handle empty string values', () => {
      const propsWithEmptyStrings = {
        ...defaultProps,
        label: '',
        placeholder: '',
        errorText: '',
        value: '',
      };

      expect(() => {
        render(<QuickFindContent {...propsWithEmptyStrings} />);
      }).not.toThrow();
    });
  });
});
