import { TIME_ENTRY_SETTINGS_CONFIG } from '../../../../src/js/widgets/timeTrackingSettings/config';
import { TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE } from '../../../../src/js/common/constants';
import { isPayrollFirstCompany } from '../../../../src/js/service/utils/sandboxUtils';

jest.mock('../../../../src/js/service/utils/sandboxUtils', () => ({
  isPayrollFirstCompany: jest.fn(),
}));

const buildSandbox = (isPayrollFirstFFEnabled = false) =>
  ({
    featureFlags: {
      isFeatureEnabled: jest.fn().mockReturnValue(isPayrollFirstFFEnabled),
    },
  } as any);

describe('TIME_ENTRY_SETTINGS_CONFIG', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GENERAL_TIME', () => {
    it('should have correct id', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.id).toBe('general-time');
    });

    it('should be enabled for non-payroll first companies', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(false);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(buildSandbox()),
      ).toBe(true);
    });

    it('should be disabled for payroll first companies when payroll first FF is disabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(buildSandbox(false)),
      ).toBe(false);
    });

    it('should be enabled for payroll first companies when payroll first FF is enabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.isEnabled(buildSandbox(true)),
      ).toBe(true);
    });

    it('should support all required lists', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.GENERAL_TIME.supportedLists).toEqual([
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
      ]);
    });
  });

  describe('MANAGE_KIOSK', () => {
    it('should have correct id', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.id).toBe('manage-kiosk');
    });

    it('should be always enabled', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.enabled).toBe(true);
    });

    it('should support all required lists', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.MANAGE_KIOSK.supportedLists).toEqual([
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
      ]);
    });
  });

  describe('TIMESHEET_FIELDS', () => {
    it('should have correct id', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.id).toBe(
        'timesheet-fields',
      );
    });

    it('should be enabled for non-payroll first companies', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(false);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(buildSandbox()),
      ).toBe(true);
    });

    it('should be disabled for payroll first companies when payroll first FF is disabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(
          buildSandbox(false),
        ),
      ).toBe(false);
    });

    it('should be enabled for payroll first companies when payroll first FF is enabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.isEnabled(
          buildSandbox(true),
        ),
      ).toBe(true);
    });

    it('should support all required lists', () => {
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.TIMESHEET_FIELDS.supportedLists,
      ).toEqual([
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
      ]);
    });
  });

  describe('CUSTOM_FIELDS', () => {
    it('should have correct id', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.id).toBe('custom-fields');
    });

    it('should be enabled for non-payroll first companies', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(false);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.isEnabled(buildSandbox()),
      ).toBe(true);
    });

    it('should be disabled for payroll first companies when payroll first FF is disabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.isEnabled(buildSandbox(false)),
      ).toBe(false);
    });

    it('should be enabled for payroll first companies when payroll first FF is enabled', () => {
      (isPayrollFirstCompany as jest.Mock).mockReturnValue(true);
      expect(
        TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.isEnabled(buildSandbox(true)),
      ).toBe(true);
    });

    it('should support all required lists including PAYROLL_FIRST', () => {
      expect(TIME_ENTRY_SETTINGS_CONFIG.CUSTOM_FIELDS.supportedLists).toEqual([
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.US,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.CA,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.UK,
        TIME_ENTRY_SETTINGS_CONTENT_LIST_TYPE.PAYROLL_FIRST,
      ]);
    });
  });
});
