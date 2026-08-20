import { WizardStepId } from 'src/js/widgets/qbtOrchestrator/features/overtime/types/Overtime.types';
import {
  parseSectionParam,
  isValidSectionPath,
  isTrowserSection,
  isInlineEditSection,
  isViewOnlySection,
  sectionToFormType,
  sectionToElementId,
  getSubsectionElementId,
  buildBreaksWidgetOptions,
  buildOvertimeWidgetOptions,
  buildGeoLocationsOptions,
  SECTION_KEYS,
  NOTIFICATIONS_SUBSECTION_KEYS,
  BREAKS_VIEW_KEYS,
  OVERTIME_VIEW_KEYS,
  ParsedSectionPath,
} from 'src/js/widgets/timeTrackingSettings/sectionNavigation';
import { TimeEntriesFormType } from 'src/js/widgets/timeTrackingSettings/constants';

describe('sectionNavigation', () => {
  describe('parseSectionParam', () => {
    it.each([
      [
        null,
        {
          segments: [],
          section: null,
          subsection: null,
          entityId: null,
          extraParam: null,
        },
      ],
      [
        '',
        {
          segments: [],
          section: null,
          subsection: null,
          entityId: null,
          extraParam: null,
        },
      ],
      [
        'notifications',
        {
          segments: ['notifications'],
          section: 'notifications',
          subsection: null,
          entityId: null,
          extraParam: null,
        },
      ],
      [
        'notifications-overtime',
        {
          segments: ['notifications', 'overtime'],
          section: 'notifications',
          subsection: 'overtime',
          entityId: null,
          extraParam: null,
        },
      ],
      [
        'breaks-edit-abc123',
        {
          segments: ['breaks', 'edit', 'abc123'],
          section: 'breaks',
          subsection: 'edit',
          entityId: 'abc123',
          extraParam: null,
        },
      ],
      [
        'overtime-policysetup-3',
        {
          segments: ['overtime', 'policysetup', '3'],
          section: 'overtime',
          subsection: 'policysetup',
          entityId: '3',
          extraParam: null,
        },
      ],
      [
        'overtime-edit-policy1-2',
        {
          segments: ['overtime', 'edit', 'policy1', '2'],
          section: 'overtime',
          subsection: 'edit',
          entityId: 'policy1',
          extraParam: '2',
        },
      ],
      [
        'NOTIFICATIONS-OVERTIME',
        {
          segments: ['notifications', 'overtime'],
          section: 'notifications',
          subsection: 'overtime',
          entityId: null,
          extraParam: null,
        },
      ],
    ])('parseSectionParam(%s) returns correct structure', (input, expected) => {
      expect(parseSectionParam(input)).toEqual(expected);
    });
  });

  describe('isValidSectionPath', () => {
    const validPaths: [string, ParsedSectionPath][] = [
      ['simple section', parseSectionParam('notifications')],
      [
        'notifications with subsection',
        parseSectionParam('notifications-overtime'),
      ],
      ['breaks list', parseSectionParam('breaks')],
      ['breaks create', parseSectionParam('breaks-create')],
      ['breaks edit with id', parseSectionParam('breaks-edit-abc123')],
      ['overtime list', parseSectionParam('overtime')],
      [
        'overtime details with id',
        parseSectionParam('overtime-details-policy1'),
      ],
      ['overtime policysetup', parseSectionParam('overtime-policysetup')],
      [
        'overtime policysetup with step',
        parseSectionParam('overtime-policysetup-2'),
      ],
      ['geolocation', parseSectionParam('geolocation')],
      ['customfields', parseSectionParam('customfields')],
      ['timetracking', parseSectionParam('timetracking')],
      ['timesheet', parseSectionParam('timesheet')],
      ['approvals', parseSectionParam('approvals')],
      ['kiosk', parseSectionParam('kiosk')],
      ['timeoff', parseSectionParam('timeoff')],
    ];

    const invalidPaths: [string, ParsedSectionPath][] = [
      ['null section', parseSectionParam(null)],
      ['unknown section', parseSectionParam('unknown')],
      [
        'notifications invalid subsection',
        parseSectionParam('notifications-invalid'),
      ],
      ['breaks edit without id', parseSectionParam('breaks-edit')],
      ['breaks assign without id', parseSectionParam('breaks-assign')],
      ['overtime details without id', parseSectionParam('overtime-details')],
      ['overtime edit without id', parseSectionParam('overtime-edit')],
      ['overtime assign without id', parseSectionParam('overtime-assign')],
      [
        'timetracking with subsection',
        parseSectionParam('timetracking-something'),
      ],
    ];

    it.each(validPaths)('isValidSectionPath returns true for %s', (_, path) => {
      expect(isValidSectionPath(path)).toBe(true);
    });

    it.each(invalidPaths)(
      'isValidSectionPath returns false for %s',
      (_, path) => {
        expect(isValidSectionPath(path)).toBe(false);
      },
    );
  });

  describe('section type checks', () => {
    describe('isTrowserSection', () => {
      it.each([
        [SECTION_KEYS.BREAKS, true],
        [SECTION_KEYS.OVERTIME, true],
        [SECTION_KEYS.GEO_LOCATION, true],
        [SECTION_KEYS.CUSTOM_FIELDS, true],
        [SECTION_KEYS.NOTIFICATIONS, false],
        [SECTION_KEYS.TIMETRACKING, false],
        [SECTION_KEYS.KIOSK, false],
        [null, false],
      ])('isTrowserSection(%s) = %s', (section, expected) => {
        expect(isTrowserSection(section)).toBe(expected);
      });
    });

    describe('isInlineEditSection', () => {
      it.each([
        [SECTION_KEYS.TIMETRACKING, true],
        [SECTION_KEYS.TIMESHEET, true],
        [SECTION_KEYS.NOTIFICATIONS, true],
        [SECTION_KEYS.APPROVALS, true],
        [SECTION_KEYS.BREAKS, false],
        [SECTION_KEYS.KIOSK, false],
        [null, false],
      ])('isInlineEditSection(%s) = %s', (section, expected) => {
        expect(isInlineEditSection(section)).toBe(expected);
      });
    });

    describe('isViewOnlySection', () => {
      it.each([
        [SECTION_KEYS.SCHEDULES, true],
        [SECTION_KEYS.TIMEOFF, true],
        [SECTION_KEYS.KIOSK, true],
        [SECTION_KEYS.BREAKS, false],
        [SECTION_KEYS.NOTIFICATIONS, false],
        [null, false],
      ])('isViewOnlySection(%s) = %s', (section, expected) => {
        expect(isViewOnlySection(section)).toBe(expected);
      });
    });
  });

  describe('mapping functions', () => {
    describe('sectionToFormType', () => {
      it.each([
        [SECTION_KEYS.TIMETRACKING, TimeEntriesFormType.TIMETRACKING],
        [SECTION_KEYS.TIMESHEET, TimeEntriesFormType.TIMESHEET],
        [SECTION_KEYS.NOTIFICATIONS, TimeEntriesFormType.NOTIFICATION],
        [SECTION_KEYS.APPROVALS, TimeEntriesFormType.APPROVALS],
        [SECTION_KEYS.BREAKS, null],
        [null, null],
      ])('sectionToFormType(%s) = %s', (section, expected) => {
        expect(sectionToFormType(section)).toBe(expected);
      });
    });

    describe('sectionToElementId', () => {
      it.each([
        [SECTION_KEYS.TIMETRACKING, 'timetracking-settings'],
        [SECTION_KEYS.TIMESHEET, 'timeSheet-settings'],
        [SECTION_KEYS.NOTIFICATIONS, 'notifications-settings'],
        [SECTION_KEYS.APPROVALS, 'approvals-settings'],
        [SECTION_KEYS.TIMEOFF, 'timeoff-settings'],
        [SECTION_KEYS.KIOSK, 'kiosk-settings'],
        [SECTION_KEYS.BREAKS, null],
        [null, null],
      ])('sectionToElementId(%s) = %s', (section, expected) => {
        expect(sectionToElementId(section)).toBe(expected);
      });
    });

    describe('getSubsectionElementId', () => {
      it.each([
        [
          SECTION_KEYS.NOTIFICATIONS,
          NOTIFICATIONS_SUBSECTION_KEYS.TIMETRACKING,
          'notifications-settings',
        ],
        [
          SECTION_KEYS.NOTIFICATIONS,
          NOTIFICATIONS_SUBSECTION_KEYS.APPROVALS,
          'notifications-approvals-subsection',
        ],
        [
          SECTION_KEYS.NOTIFICATIONS,
          NOTIFICATIONS_SUBSECTION_KEYS.SUBMISSIONS,
          'notifications-submissions-subsection',
        ],
        [
          SECTION_KEYS.NOTIFICATIONS,
          NOTIFICATIONS_SUBSECTION_KEYS.GEOFENCE,
          'notifications-geofence-subsection',
        ],
        [
          SECTION_KEYS.NOTIFICATIONS,
          NOTIFICATIONS_SUBSECTION_KEYS.OVERTIME,
          'notifications-overtime-subsection',
        ],
        [SECTION_KEYS.NOTIFICATIONS, 'invalid', null],
        [SECTION_KEYS.TIMETRACKING, 'something', null],
        [null, null, null],
      ])(
        'getSubsectionElementId(%s, %s) = %s',
        (section, subsection, expected) => {
          expect(getSubsectionElementId(section, subsection)).toBe(expected);
        },
      );
    });
  });

  describe('widget options builders', () => {
    describe('buildBreaksWidgetOptions', () => {
      it.each([
        ['breaks', { view: 'list' }],
        ['breaks-list', { view: 'list' }],
        ['breaks-create', { view: 'create' }],
        ['breaks-edit-abc123', { view: 'edit', breakId: 'abc123' }],
        ['breaks-assign-xyz789', { view: 'assign', breakId: 'xyz789' }],
        ['breaks-edit', null], // missing id
        ['notifications', null], // wrong section
      ])('buildBreaksWidgetOptions(%s)', (param, expected) => {
        expect(buildBreaksWidgetOptions(parseSectionParam(param))).toEqual(
          expected,
        );
      });
    });

    describe('buildOvertimeWidgetOptions', () => {
      it.each([
        ['overtime', { view: 'list' }],
        ['overtime-list', { view: 'list' }],
        ['overtime-details-policy1', { view: 'details', policyId: 'policy1' }],
        ['overtime-policysetup', { view: 'wizard', wizardStep: undefined }],
        [
          'overtime-policysetup-1',
          { view: 'wizard', wizardStep: WizardStepId.POLICY_NAME },
        ],
        [
          'overtime-policysetup-2',
          { view: 'wizard', wizardStep: WizardStepId.OVERTIME_RULES },
        ],
        [
          'overtime-policysetup-3',
          { view: 'wizard', wizardStep: WizardStepId.POLICY_MEMBERS },
        ],
        [
          'overtime-policysetup-4',
          { view: 'wizard', wizardStep: WizardStepId.REVIEW },
        ],
        ['overtime-policysetup-99', { view: 'wizard', wizardStep: undefined }], // invalid step
        [
          'overtime-edit-policy1',
          { view: 'edit', policyId: 'policy1', wizardStep: undefined },
        ],
        [
          'overtime-edit-policy1-2',
          {
            view: 'edit',
            policyId: 'policy1',
            wizardStep: WizardStepId.OVERTIME_RULES,
          },
        ],
        [
          'overtime-assign-policy1',
          {
            view: 'assign',
            policyId: 'policy1',
            wizardStep: WizardStepId.POLICY_MEMBERS,
          },
        ],
        ['overtime-details', null], // missing id
        ['breaks', null], // wrong section
      ])('buildOvertimeWidgetOptions(%s)', (param, expected) => {
        expect(buildOvertimeWidgetOptions(parseSectionParam(param))).toEqual(
          expected,
        );
      });
    });

    describe('buildGeoLocationsOptions', () => {
      it.each([
        ['geolocation', { openTrowser: true }],
        ['breaks', null], // wrong section
      ])('buildGeoLocationsOptions(%s)', (param, expected) => {
        expect(buildGeoLocationsOptions(parseSectionParam(param))).toEqual(
          expected,
        );
      });
    });
  });
});
