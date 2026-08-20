import {
  MANAGE_OVERTIME_LANDING_TRACKING_POINTS,
  POLICY_LANDING_TRACKING_POINTS,
  SET_OVERTIME_POLICY_TRACKING_POINTS,
  OVERTIME_RULES_TRACKING_POINTS,
  OVERTIME_RULES_BASIC_TRACKING_POINTS,
  OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS,
  OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
  POLICY_MEMBERS_TRACKING_POINTS,
  REVIEW_OVERTIME_POLICY_TRACKING_POINTS,
  WIZARD_GLOBAL_NAV_TRACKING_POINTS,
  EDIT_OVERTIME_POLICY_TRACKING_POINTS,
} from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTrackingPoints';

const REQUIRED_BASE_FIELDS = [
  'org',
  'purpose',
  'scope',
  'scope_area',
  'screen',
  'object',
] as const;
const REQUIRED_ACTION_FIELDS = [
  'action',
  'ui_action',
  'ui_object',
  'ui_object_detail',
] as const;

const ALL_SECTION_EXPORTS = [
  {
    name: 'MANAGE_OVERTIME_LANDING_TRACKING_POINTS',
    points: MANAGE_OVERTIME_LANDING_TRACKING_POINTS,
  },
  {
    name: 'POLICY_LANDING_TRACKING_POINTS',
    points: POLICY_LANDING_TRACKING_POINTS,
  },
  {
    name: 'SET_OVERTIME_POLICY_TRACKING_POINTS',
    points: SET_OVERTIME_POLICY_TRACKING_POINTS,
  },
  {
    name: 'OVERTIME_RULES_TRACKING_POINTS',
    points: OVERTIME_RULES_TRACKING_POINTS,
  },
  {
    name: 'OVERTIME_RULES_BASIC_TRACKING_POINTS',
    points: OVERTIME_RULES_BASIC_TRACKING_POINTS,
  },
  {
    name: 'OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS',
    points: OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS,
  },
  {
    name: 'OVERTIME_RULES_CUSTOM_TRACKING_POINTS',
    points: OVERTIME_RULES_CUSTOM_TRACKING_POINTS,
  },
  {
    name: 'POLICY_MEMBERS_TRACKING_POINTS',
    points: POLICY_MEMBERS_TRACKING_POINTS,
  },
  {
    name: 'REVIEW_OVERTIME_POLICY_TRACKING_POINTS',
    points: REVIEW_OVERTIME_POLICY_TRACKING_POINTS,
  },
  {
    name: 'WIZARD_GLOBAL_NAV_TRACKING_POINTS',
    points: WIZARD_GLOBAL_NAV_TRACKING_POINTS,
  },
  {
    name: 'EDIT_OVERTIME_POLICY_TRACKING_POINTS',
    points: EDIT_OVERTIME_POLICY_TRACKING_POINTS,
  },
];

describe('Manage Overtime Landing Page tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = [
      'SETUP_OVERTIME_POLICY',
      'LEARN_MORE_ABOUT_OVERTIME',
      'CHECKOUT_OVERTIME_LAWS',
      'CLOSE_LANDING_PAGE',
      'CREATE_OVERTIME_POLICY',
      'EDIT_POLICY_MANAGE_OVERTIME',
      'EDIT_DROP_DOWN',
      'CLICK_VIEW_DETAILS',
      'CLICK_DELETE_POLICY',
      'CONFIRM_DELETE_POLICY',
      'CANCEL_DELETE_POLICY',
    ];
    expectedKeys.forEach((key) => {
      expect(MANAGE_OVERTIME_LANDING_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Set Overtime Policy (Step 1/4) tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = [
      'POLICY_NAME',
      'DEFAULT_POLICY_ON',
      'DEFAULT_POLICY_OFF',
      'OVERTIME_POLICY_NEXT',
      'OVERTIME_POLICY_CANCEL',
    ];
    expectedKeys.forEach((key) => {
      expect(SET_OVERTIME_POLICY_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Overtime Rules (Step 2/4) tracking points', () => {
  it('contains initial rule selection keys', () => {
    expect(OVERTIME_RULES_TRACKING_POINTS).toHaveProperty(
      'RULE_DROPDOWN_CLICK',
    );
    expect(OVERTIME_RULES_TRACKING_POINTS).toHaveProperty(
      'OVERTIME_RULES_SELECT',
    );
    expect(OVERTIME_RULES_TRACKING_POINTS).toHaveProperty(
      'OVERTIME_RULES_NEXT',
    );
  });

  it('contains basic rule keys', () => {
    const expectedKeys = [
      'BASIC_WEEKLY_HOURS',
      'BASIC_DAILY_ON',
      'BASIC_DAILY_OFF',
      'BASIC_DAILY_SELECT_DAYS_CLICK',
      'BASIC_DAILY_SELECT_DAYS',
      'BASIC_DAILY_HOURS',
      'BASIC_DOUBLE_DAILY_ON',
      'BASIC_DOUBLE_DAILY_OFF',
      'BASIC_DOUBLE_DAILY_SELECT_DAYS_CLICK',
      'BASIC_DOUBLE_DAILY_SELECT_DAYS',
      'BASIC_DOUBLE_DAILY_HOURS',
      'OVERTIME_RULES_BASIC_NEXT',
      'OVERTIME_RULES_BASIC_BACK',
    ];
    expectedKeys.forEach((key) => {
      expect(OVERTIME_RULES_BASIC_TRACKING_POINTS).toHaveProperty(key);
    });
  });

  it('contains california rule keys', () => {
    expect(OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS).toHaveProperty(
      'OVERTIME_RULES_CALIFORNIA_NEXT',
    );
    expect(OVERTIME_RULES_CALIFORNIA_TRACKING_POINTS).toHaveProperty(
      'OVERTIME_RULES_CALIFORNIA_BACK',
    );
  });

  it('contains custom rule keys', () => {
    const expectedKeys = [
      'OVERTIME_RULES_CUSTOM_NEXT',
      'OVERTIME_RULES_CUSTOM_BACK',
      'CUSTOM_WEEKLY_HOURS',
      'CUSTOM_DAILY_ON',
      'CUSTOM_DAILY_OFF',
      'CUSTOM_DAILY_SELECT_DAYS_CLICK',
      'CUSTOM_DAILY_SELECT_DAYS',
      'CUSTOM_DAILY_HOURS',
      'CUSTOM_DOUBLE_DAILY_ON',
      'CUSTOM_DOUBLE_DAILY_OFF',
      'CUSTOM_DOUBLE_DAILY_SELECT_DAYS_CLICK',
      'CUSTOM_DOUBLE_DAILY_SELECT_DAYS',
      'CUSTOM_DOUBLE_DAILY_HOURS',
      'CUSTOM_CONSECUTIVE_ON',
      'CUSTOM_CONSECUTIVE_OFF',
      'CUSTOM_CONSECUTIVE_HOURS',
      'CUSTOM_DOUBLE_CONSECUTIVE_ON',
      'CUSTOM_DOUBLE_CONSECUTIVE_OFF',
      'CUSTOM_DOUBLE_CONSECUTIVE_HOURS',
    ];
    expectedKeys.forEach((key) => {
      expect(OVERTIME_RULES_CUSTOM_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Policy Members (Step 3/4) tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = [
      'ALL_WORKER_ON',
      'ALL_WORKER_OFF',
      'FILTER_GROUP',
      'SELECT_GROUP',
      'POLICY_MEMBERS_SEARCH',
      'POLICY_MEMBERS_ASSIGN',
      'POLICY_MEMBERS_BACK',
    ];
    expectedKeys.forEach((key) => {
      expect(POLICY_MEMBERS_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Review Overtime Policy (Step 4/4) tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = [
      'EDIT_POLICY_DETAILS',
      'EDIT_OVERTIME_RULES',
      'EDIT_POLICY_MEMBERS',
      'CREATE_POLICY',
      'BACK_REVIEW_POLICY',
    ];
    expectedKeys.forEach((key) => {
      expect(REVIEW_OVERTIME_POLICY_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Wizard Global Navigation tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = ['CLICK_OVERTIME_POLICIES', 'CLICK_CLOSE'];
    expectedKeys.forEach((key) => {
      expect(WIZARD_GLOBAL_NAV_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('Edit Overtime Policy tracking points', () => {
  it('contains expected keys', () => {
    const expectedKeys = [
      'EDIT_POLICY_DETAILS',
      'EDIT_OVERTIME_RULES',
      'EDIT_POLICY_MEMBERS',
      'UPDATE_POLICY_NAME',
      'SAVE_POLICY_NAME',
      'CANCEL_EDIT',
      'DEFAULT_ON',
      'DEFAULT_OFF',
      'CLOSE_EDIT_POLICY',
      'BACK_EDIT_POLICY',
      'BASIC_RULES_SAVE',
      'BASIC_RULES_BACK',
      'CALIFORNIA_RULES_SAVE',
      'CALIFORNIA_RULES_BACK',
      'CUSTOM_RULES_SAVE',
      'CUSTOM_RULES_BACK',
      'EDIT_POLICY_MEMBERS_SAVE',
      'EDIT_POLICY_MEMBERS_BACK',
      'CLOSE_EDIT_REVIEW_PAGE',
    ];
    expectedKeys.forEach((key) => {
      expect(EDIT_OVERTIME_POLICY_TRACKING_POINTS).toHaveProperty(key);
    });
  });
});

describe('All section exports', () => {
  it.each(ALL_SECTION_EXPORTS)(
    '$name has valid tracking points with required fields',
    ({ points }) => {
      Object.entries(points).forEach(([key, point]) => {
        REQUIRED_BASE_FIELDS.forEach((field) => {
          expect({ key, hasField: field in point }).toEqual({
            key,
            hasField: true,
          });
        });
        REQUIRED_ACTION_FIELDS.forEach((field) => {
          expect({ key, hasField: field in point }).toEqual({
            key,
            hasField: true,
          });
        });
        expect(point.org).toBe('sbseg');
        expect(point.purpose).toBe('prod');
        expect(point.scope).toBe('time');
        expect(point.scope_area).toBe('overtime');
      });
    },
  );
});
