import dayjs from 'dayjs';
import {
  BreakEntry,
  BreakRule,
  BreakRuleInput,
  TeamMember,
  BREAK_TYPE_DISPLAY,
  BREAK_SETTINGS_FEATURE,
  BREAK_SETTINGS_FUNCTIONALITY,
  BREAK_ENTRIES_FEATURE,
  BREAK_ENTRIES_FUNCTIONALITY,
  BREAK_SELECTOR_QUICKFILL_FEATURE,
  BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY,
  BREAKS_WIDGET_FEATURE,
  BREAKS_WIDGET_FUNCTIONALITY,
  BreaksWidgetOptions,
} from 'src/js/widgets/breaks/types';
import { Payroll_Break } from 'src/__generated__/oigql/graphql';

describe('Break Types', () => {
  describe('BreakEntry interface', () => {
    it('should allow creating a valid BreakEntry object', () => {
      const breakEntry: BreakEntry = {
        name: 'Lunch Break',
        breakRule: 'break-1',
        startDate: dayjs(),
        endDate: dayjs(),
        startTime: dayjs('09:00', 'HH:mm'),
        endTime: dayjs('10:00', 'HH:mm'),
        description: 'Lunch break description',
        timezone: 'America/New_York',
        contact: {
          id: 'contact-1',
          name: 'John Doe',
          type: 'employee',
        },
        useStartEndTime: true,
        duration: 3600,
        currentlyWorking: false,
        selectedBreakRule: {
          id: 'break-1',
          breakName: 'Lunch Break',
          breakType: Payroll_Break.Paid,
          isActive: true,
          isDefaultPolicy: false,
          allowAuto: true,
          allowManual: true,
          breakDuration: 60,
          durationUnit: 'Minutes' as any,
          activeBreakAssignmentCount: 0,
          isDeleted: false,
          noSetDuration: false,
        },
        timeEntryId: 'time-entry-1',
        version: '1.0',
      };

      expect(breakEntry.name).toBe('Lunch Break');
      expect(breakEntry.breakRule).toBe('break-1');
      expect(breakEntry.startDate).toBeDefined();
      expect(breakEntry.endDate).toBeDefined();
      expect(breakEntry.startTime).toBeDefined();
      expect(breakEntry.endTime).toBeDefined();
      expect(breakEntry.description).toBe('Lunch break description');
      expect(breakEntry.timezone).toBe('America/New_York');
      expect(breakEntry.contact).toBeDefined();
      expect(breakEntry.useStartEndTime).toBe(true);
      expect(breakEntry.duration).toBe(3600);
      expect(breakEntry.currentlyWorking).toBe(false);
      expect(breakEntry.selectedBreakRule).toBeDefined();
      expect(breakEntry.timeEntryId).toBe('time-entry-1');
      expect(breakEntry.version).toBe('1.0');
    });

    it('should allow creating a minimal BreakEntry object', () => {
      const breakEntry: BreakEntry = {
        name: 'Coffee Break',
        breakRule: 'break-2',
        startDate: dayjs(),
      };

      expect(breakEntry.name).toBe('Coffee Break');
      expect(breakEntry.breakRule).toBe('break-2');
      expect(breakEntry.startDate).toBeDefined();
    });
  });

  describe('BreakRule interface', () => {
    it('should allow creating a valid BreakRule object', () => {
      const breakRule: BreakRule = {
        id: 'break-1',
        breakName: 'Lunch Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 60,
        durationUnit: 'Minutes' as any,
        activeBreakAssignmentCount: 5,
        isDeleted: false,
        noSetDuration: false,
      };

      expect(breakRule.id).toBe('break-1');
      expect(breakRule.breakName).toBe('Lunch Break');
      expect(breakRule.breakType).toBe(Payroll_Break.Paid);
      expect(breakRule.isActive).toBe(true);
      expect(breakRule.isDefaultPolicy).toBe(false);
      expect(breakRule.allowAuto).toBe(true);
      expect(breakRule.allowManual).toBe(true);
      expect(breakRule.breakDuration).toBe(60);
      expect(breakRule.durationUnit).toBe('Minutes');
      expect(breakRule.activeBreakAssignmentCount).toBe(5);
      expect(breakRule.isDeleted).toBe(false);
      expect(breakRule.noSetDuration).toBe(false);
    });
  });

  describe('BreakRuleInput interface', () => {
    it('should allow creating a valid BreakRuleInput object', () => {
      const breakRuleInput: BreakRuleInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Unpaid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: false,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      expect(breakRuleInput.breakName).toBe('New Break');
      expect(breakRuleInput.breakType).toBe(Payroll_Break.Unpaid);
      expect(breakRuleInput.isActive).toBe(true);
      expect(breakRuleInput.isDefaultPolicy).toBe(false);
      expect(breakRuleInput.allowAuto).toBe(false);
      expect(breakRuleInput.allowManual).toBe(true);
      expect(breakRuleInput.breakDuration).toBe(30);
      expect(breakRuleInput.durationUnit).toBe('Minutes');
      expect(breakRuleInput.noSetDuration).toBe(false);
    });
  });

  describe('TeamMember interface', () => {
    it('should allow creating a valid TeamMember object', () => {
      const teamMember: TeamMember = {
        id: 'member-1',
        name: 'John Doe',
        workerType: 'employee',
        isPrimary: true,
        isActive: true,
      };

      expect(teamMember.id).toBe('member-1');
      expect(teamMember.name).toBe('John Doe');
      expect(teamMember.workerType).toBe('employee');
      expect(teamMember.isPrimary).toBe(true);
      expect(teamMember.isActive).toBe(true);
    });

    it('should allow creating a minimal TeamMember object', () => {
      const teamMember: TeamMember = {
        id: 'member-2',
        name: 'Jane Smith',
        workerType: 'vendor',
      };

      expect(teamMember.id).toBe('member-2');
      expect(teamMember.name).toBe('Jane Smith');
      expect(teamMember.workerType).toBe('vendor');
    });
  });

  describe('BREAK_TYPE_DISPLAY constant', () => {
    it('should have correct values', () => {
      expect(BREAK_TYPE_DISPLAY.PAID).toBe('Paid');
      expect(BREAK_TYPE_DISPLAY.UNPAID).toBe('Unpaid');
    });
  });

  describe('Feature and Functionality types', () => {
    it('should have correct BREAK_SETTINGS_FEATURE value', () => {
      const feature: BREAK_SETTINGS_FEATURE = 'breaks-settings';
      expect(feature).toBe('breaks-settings');
    });

    it('should have correct BREAK_SETTINGS_FUNCTIONALITY values', () => {
      const functionality1: BREAK_SETTINGS_FUNCTIONALITY = 'settings-handle';
      const functionality2: BREAK_SETTINGS_FUNCTIONALITY = 'breaks-preferences';

      expect(functionality1).toBe('settings-handle');
      expect(functionality2).toBe('breaks-preferences');
    });

    it('should have correct BREAK_ENTRIES_FEATURE value', () => {
      const feature: BREAK_ENTRIES_FEATURE = 'break-entries';
      expect(feature).toBe('break-entries');
    });

    it('should have correct BREAK_ENTRIES_FUNCTIONALITY values', () => {
      const functionality1: BREAK_ENTRIES_FUNCTIONALITY = 'create-break-entry';
      const functionality2: BREAK_ENTRIES_FUNCTIONALITY = 'edit-break-entry';

      expect(functionality1).toBe('create-break-entry');
      expect(functionality2).toBe('edit-break-entry');
    });

    it('should have correct BREAK_SELECTOR_QUICKFILL_FEATURE value', () => {
      const feature: BREAK_SELECTOR_QUICKFILL_FEATURE = 'breaks-quickfills';
      expect(feature).toBe('breaks-quickfills');
    });

    it('should have correct BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY value', () => {
      const functionality: BREAK_SELECTOR_QUICKFILL_FUNCTIONALITY =
        'breaks-selector-quickfill';
      expect(functionality).toBe('breaks-selector-quickfill');
    });

    it('should have correct BREAKS_WIDGET_FEATURE values', () => {
      const feature1: BREAKS_WIDGET_FEATURE = 'breaks-settings';
      const feature2: BREAKS_WIDGET_FEATURE = 'break-entries';
      const feature3: BREAKS_WIDGET_FEATURE = 'breaks-quickfills';

      expect(feature1).toBe('breaks-settings');
      expect(feature2).toBe('break-entries');
      expect(feature3).toBe('breaks-quickfills');
    });

    it('should have correct BREAKS_WIDGET_FUNCTIONALITY values', () => {
      const functionality1: BREAKS_WIDGET_FUNCTIONALITY = 'settings-handle';
      const functionality2: BREAKS_WIDGET_FUNCTIONALITY = 'breaks-preferences';
      const functionality3: BREAKS_WIDGET_FUNCTIONALITY = 'create-break-entry';
      const functionality4: BREAKS_WIDGET_FUNCTIONALITY = 'edit-break-entry';
      const functionality5: BREAKS_WIDGET_FUNCTIONALITY =
        'breaks-selector-quickfill';

      expect(functionality1).toBe('settings-handle');
      expect(functionality2).toBe('breaks-preferences');
      expect(functionality3).toBe('create-break-entry');
      expect(functionality4).toBe('edit-break-entry');
      expect(functionality5).toBe('breaks-selector-quickfill');
    });
  });

  describe('BreaksWidgetOptions union type', () => {
    it('should allow creating break settings options', () => {
      const options: BreaksWidgetOptions = {
        feature: 'breaks-settings',
        functionality: 'settings-handle',
        isNewBadgeVisibleTillDate: '2024-12-31',
        isEditable: true,
        props: {
          open: true,
          onClose: jest.fn(),
        },
      };

      expect(options.feature).toBe('breaks-settings');
      expect(options.functionality).toBe('settings-handle');
      expect(options.isNewBadgeVisibleTillDate).toBe('2024-12-31');
      expect(options.isEditable).toBe(true);
      expect(options.props).toBeDefined();
    });

    it('should allow creating break entries options', () => {
      const options: BreaksWidgetOptions = {
        feature: 'break-entries',
        functionality: 'create-break-entry',
        props: {
          open: true,
          onSave: jest.fn(),
          onClose: jest.fn(),
        },
      };

      expect(options.feature).toBe('break-entries');
      expect(options.functionality).toBe('create-break-entry');
      expect(options.props).toBeDefined();
    });

    it('should allow creating break selector quickfill options', () => {
      const options: BreaksWidgetOptions = {
        feature: 'breaks-quickfills',
        functionality: 'breaks-selector-quickfill',
        props: {
          assigneeId: 'assignee-1',
          width: 300,
          onBreakSelected: jest.fn(),
          filter: {
            isActive: true,
            isDefaultPolicy: false,
            includeDeleted: false,
            allowAuto: true,
            allowManual: true,
            breakType: Payroll_Break.Paid,
          },
          errorText: 'This field is required',
          breakId: 'break-1',
        },
      };

      expect(options.feature).toBe('breaks-quickfills');
      expect(options.functionality).toBe('breaks-selector-quickfill');
      expect(options.props.assigneeId).toBe('assignee-1');
      expect(options.props.width).toBe(300);
      expect(options.props.onBreakSelected).toBeDefined();
      expect(options.props.filter).toBeDefined();
      expect(options.props.errorText).toBe('This field is required');
      expect(options.props.breakId).toBe('break-1');
    });
  });

  describe('Type compatibility', () => {
    it('should ensure BreakRule extends Payroll_EmployerBreak', () => {
      // This test verifies that BreakRule is compatible with Payroll_EmployerBreak
      const payrollBreak = {
        id: 'break-1',
        breakName: 'Lunch Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 60,
        durationUnit: 'Minutes' as any,
        activeBreakAssignmentCount: 0,
        isDeleted: false,
        noSetDuration: false,
      };

      const breakRule: BreakRule = payrollBreak;
      expect(breakRule).toBeDefined();
    });

    it('should ensure BreakRuleInput extends Payroll_EmployerBreakInput', () => {
      // This test verifies that BreakRuleInput is compatible with Payroll_EmployerBreakInput
      const payrollBreakInput = {
        breakName: 'New Break',
        breakType: Payroll_Break.Paid,
        isActive: true,
        isDefaultPolicy: false,
        allowAuto: true,
        allowManual: true,
        breakDuration: 30,
        durationUnit: 'Minutes' as any,
        noSetDuration: false,
      };

      const breakRuleInput: BreakRuleInput = payrollBreakInput;
      expect(breakRuleInput).toBeDefined();
    });
  });
});
