import {
  QuickFindProps,
  QuickFindDropdownType,
  ContactType,
  TeamMember,
  BaseDropdownProps,
  TeamMemberDropdownProps,
  ServiceDropdownProps,
  ClassDropdownProps,
} from '../../../../src/js/widgets/quickFind/types';

describe('QuickFind Types', () => {
  describe('QuickFindProps', () => {
    it('should allow all optional properties', () => {
      const props: QuickFindProps = {
        dropdownType: 'team-member',
        subTypes: [ContactType.Employee, ContactType.Vendor],
        label: 'Team Member',
        placeholder: 'Select a team member...',
        errorText: 'This field is required',
      };

      expect(props.dropdownType).toBe('team-member');
      expect(props.subTypes).toEqual([
        ContactType.Employee,
        ContactType.Vendor,
      ]);
      expect(props.label).toBe('Team Member');
      expect(props.placeholder).toBe('Select a team member...');
      expect(props.errorText).toBe('This field is required');
    });

    it('should allow partial properties', () => {
      const props: QuickFindProps = {
        dropdownType: 'service',
      };

      expect(props.dropdownType).toBe('service');
      expect(props.subTypes).toBeUndefined();
      expect(props.label).toBeUndefined();
    });

    it('should allow empty object', () => {
      const props: QuickFindProps = {};
      expect(props).toEqual({});
    });
  });

  describe('QuickFindDropdownType', () => {
    it('should allow team-member type', () => {
      const type: QuickFindDropdownType = 'team-member';
      expect(type).toBe('team-member');
    });

    it('should allow service type', () => {
      const type: QuickFindDropdownType = 'service';
      expect(type).toBe('service');
    });

    it('should allow class type', () => {
      const type: QuickFindDropdownType = 'class';
      expect(type).toBe('class');
    });
  });

  describe('ContactType', () => {
    it('should allow employee type', () => {
      const type: ContactType = ContactType.Employee;
      expect(type).toBe(ContactType.Employee);
    });

    it('should allow vendor type', () => {
      const type: ContactType = ContactType.Vendor;
      expect(type).toBe(ContactType.Vendor);
    });
  });

  describe('TeamMember', () => {
    it('should have correct structure for employee', () => {
      const teamMember: TeamMember = {
        id: 'emp1',
        name: 'John Employee',
        type: ContactType.Employee,
      };

      expect(teamMember.id).toBe('emp1');
      expect(teamMember.name).toBe('John Employee');
      expect(teamMember.type).toBe(ContactType.Employee);
    });

    it('should have correct structure for vendor', () => {
      const teamMember: TeamMember = {
        id: 'ven1',
        name: 'Bob Vendor',
        type: ContactType.Vendor,
      };

      expect(teamMember.id).toBe('ven1');
      expect(teamMember.name).toBe('Bob Vendor');
      expect(teamMember.type).toBe(ContactType.Vendor);
    });
  });

  describe('BaseDropdownProps', () => {
    it('should allow all optional properties', () => {
      const props: BaseDropdownProps = {
        value: 'test-value',
        onChange: jest.fn(),
        onReady: jest.fn(),
        onError: jest.fn(),
        label: 'Test Label',
        placeholder: 'Test Placeholder',
        errorText: 'Test Error',
        disabled: true,
        subTypes: [ContactType.Employee, ContactType.Vendor],
      };

      expect(props.value).toBe('test-value');
      expect(typeof props.onChange).toBe('function');
      expect(typeof props.onReady).toBe('function');
      expect(typeof props.onError).toBe('function');
      expect(props.label).toBe('Test Label');
      expect(props.placeholder).toBe('Test Placeholder');
      expect(props.errorText).toBe('Test Error');
      expect(props.disabled).toBe(true);
      expect(props.subTypes).toEqual([
        ContactType.Employee,
        ContactType.Vendor,
      ]);
    });

    it('should allow partial properties', () => {
      const props: BaseDropdownProps = {
        value: 'test-value',
      };

      expect(props.value).toBe('test-value');
      expect(props.onChange).toBeUndefined();
      expect(props.disabled).toBeUndefined();
    });
  });

  describe('TeamMemberDropdownProps', () => {
    it('should extend BaseDropdownProps and allow ContactType subTypes', () => {
      const props: TeamMemberDropdownProps = {
        value: 'emp1',
        onChange: jest.fn(),
        subTypes: [ContactType.Employee, ContactType.Vendor],
        label: 'Team Member',
        disabled: false,
      };

      expect(props.value).toBe('emp1');
      expect(typeof props.onChange).toBe('function');
      expect(props.subTypes).toEqual([
        ContactType.Employee,
        ContactType.Vendor,
      ]);
      expect(props.label).toBe('Team Member');
      expect(props.disabled).toBe(false);
    });

    it('should allow only employee subTypes', () => {
      const props: TeamMemberDropdownProps = {
        subTypes: [ContactType.Employee],
      };

      expect(props.subTypes).toEqual([ContactType.Employee]);
    });

    it('should allow only vendor subTypes', () => {
      const props: TeamMemberDropdownProps = {
        subTypes: [ContactType.Vendor],
      };

      expect(props.subTypes).toEqual([ContactType.Vendor]);
    });
  });

  describe('ServiceDropdownProps', () => {
    it('should extend BaseDropdownProps', () => {
      const props: ServiceDropdownProps = {
        value: 'service1',
        onChange: jest.fn(),
        label: 'Service',
        subTypes: [ContactType.Employee, ContactType.Vendor],
      };

      expect(props.value).toBe('service1');
      expect(typeof props.onChange).toBe('function');
      expect(props.label).toBe('Service');
      expect(props.subTypes).toEqual([
        ContactType.Employee,
        ContactType.Vendor,
      ]);
    });
  });

  describe('ClassDropdownProps', () => {
    it('should extend BaseDropdownProps', () => {
      const props: ClassDropdownProps = {
        value: 'class1',
        onChange: jest.fn(),
        label: 'Class',
        subTypes: [ContactType.Employee, ContactType.Vendor],
      };

      expect(props.value).toBe('class1');
      expect(typeof props.onChange).toBe('function');
      expect(props.label).toBe('Class');
      expect(props.subTypes).toEqual([
        ContactType.Employee,
        ContactType.Vendor,
      ]);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow BaseDropdownProps to be assigned to TeamMemberDropdownProps', () => {
      const baseProps: BaseDropdownProps = {
        value: 'test',
        onChange: jest.fn(),
        subTypes: [ContactType.Employee],
      };

      // This should compile without errors
      const teamMemberProps: TeamMemberDropdownProps =
        baseProps as TeamMemberDropdownProps;
      expect(teamMemberProps.value).toBe('test');
    });

    it('should allow BaseDropdownProps to be assigned to ServiceDropdownProps', () => {
      const baseProps: BaseDropdownProps = {
        value: 'test',
        onChange: jest.fn(),
        subTypes: [ContactType.Employee],
      };

      // This should compile without errors
      const serviceProps: ServiceDropdownProps = baseProps;
      expect(serviceProps.value).toBe('test');
    });

    it('should allow BaseDropdownProps to be assigned to ClassDropdownProps', () => {
      const baseProps: BaseDropdownProps = {
        value: 'test',
        onChange: jest.fn(),
        subTypes: [ContactType.Employee],
      };

      // This should compile without errors
      const classProps: ClassDropdownProps = baseProps;
      expect(classProps.value).toBe('test');
    });
  });
});
