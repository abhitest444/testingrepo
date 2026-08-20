// @ts-nocheck
import {
  TimeTracking_NotificationReminderMedium,
  TimeTracking_NotificationType,
} from 'src/__generated__/timeTracking/graphql';
import {
  formatScheduleRowViewValue,
  mapSubscriptionsToRowValues,
  buildScheduleNotificationsManageInput,
} from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/scheduleNotifications.utils';
import { SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS } from 'src/js/widgets/userSettings/components/cards/NotificationsCard/utils/scheduleNotifications.constants';

const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;
const { ShiftPublished, ShiftStartBefore, ShiftStartAfter, ShiftEndAfter } =
  TimeTracking_NotificationType;

const SETTINGS_FOR = { id: 'user-1' } as any;

const formatMessage = jest.fn((descriptor: { id: string }) => {
  const map: Record<string, string> = {
    'notifications.status.off': 'Off',
    'notifications.mobile': 'mobile',
    'notifications.email': 'email',
    'notifications.schedule.view.on-mobile-email': 'On, mobile, email',
    'notifications.schedule.view.on-with-channel': 'On, {{channel}}',
  };
  return map[descriptor.id] ?? descriptor.id;
});

const intl = {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, string>,
  ) => {
    if (
      descriptor.id === 'notifications.schedule.view.on-with-channel' &&
      values?.channel
    ) {
      return `On, ${values.channel}`;
    }
    return formatMessage(descriptor);
  },
};

beforeEach(() => formatMessage.mockClear());

// ---------------------------------------------------------------------------
// formatScheduleRowViewValue
// ---------------------------------------------------------------------------
describe('formatScheduleRowViewValue', () => {
  it('returns Off when distributionMethods is empty', () => {
    expect(formatScheduleRowViewValue(intl, [])).toBe('Off');
  });

  it('returns "On, mobile" when only PushNotification', () => {
    expect(formatScheduleRowViewValue(intl, [PushNotification])).toBe(
      'On, mobile',
    );
  });

  it('returns "On, email" when only Email', () => {
    expect(formatScheduleRowViewValue(intl, [Email])).toBe('On, email');
  });

  it('returns "On, mobile, email" when both channels present', () => {
    expect(formatScheduleRowViewValue(intl, [PushNotification, Email])).toBe(
      'On, mobile, email',
    );
  });

  it('returns "On, mobile, email" regardless of channel order', () => {
    expect(formatScheduleRowViewValue(intl, [Email, PushNotification])).toBe(
      'On, mobile, email',
    );
  });
});

// ---------------------------------------------------------------------------
// mapSubscriptionsToRowValues
// ---------------------------------------------------------------------------
describe('mapSubscriptionsToRowValues', () => {
  it('returns empty arrays for all row keys when subscriptions is empty', () => {
    const result = mapSubscriptionsToRowValues([]);
    SCHEDULE_NOTIFICATION_USER_SETTINGS_ROW_KEYS.forEach((key) => {
      expect(result[key]).toEqual([]);
    });
  });

  it('maps a subscription to the correct row key', () => {
    const result = mapSubscriptionsToRowValues([
      { notificationType: ShiftPublished, distributionMethods: [Email] },
    ]);
    expect(result.shiftPublishedOrChanged).toEqual([Email]);
  });

  it('maps all four row keys independently', () => {
    const subscriptions = [
      { notificationType: ShiftPublished, distributionMethods: [Email] },
      {
        notificationType: ShiftStartBefore,
        distributionMethods: [PushNotification],
      },
      {
        notificationType: ShiftStartAfter,
        distributionMethods: [Email, PushNotification],
      },
      { notificationType: ShiftEndAfter, distributionMethods: [] },
    ];
    const result = mapSubscriptionsToRowValues(subscriptions);
    expect(result.shiftPublishedOrChanged).toEqual([Email]);
    expect(result.oneHourBeforeShift).toEqual([PushNotification]);
    expect(result.forgotClockInAfterShiftStarted).toEqual([
      Email,
      PushNotification,
    ]);
    expect(result.forgotClockOutAfterShiftEnded).toEqual([]);
  });

  it('defaults to empty array for row keys absent from API response', () => {
    const result = mapSubscriptionsToRowValues([
      { notificationType: ShiftPublished, distributionMethods: [Email] },
    ]);
    expect(result.oneHourBeforeShift).toEqual([]);
    expect(result.forgotClockInAfterShiftStarted).toEqual([]);
    expect(result.forgotClockOutAfterShiftEnded).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildScheduleNotificationsManageInput
// ---------------------------------------------------------------------------
describe('buildScheduleNotificationsManageInput', () => {
  it('returns undefined when saved and draft are identical', () => {
    const subscriptions = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v1',
      },
    ];
    expect(
      buildScheduleNotificationsManageInput(
        SETTINGS_FOR,
        subscriptions,
        subscriptions,
      ),
    ).toBeUndefined();
  });

  it('returns undefined when both saved and draft are empty', () => {
    expect(
      buildScheduleNotificationsManageInput(SETTINGS_FOR, [], []),
    ).toBeUndefined();
  });

  it('returns an input with only the changed row', () => {
    const saved = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v1',
      },
      {
        notificationType: ShiftStartBefore,
        distributionMethods: [PushNotification],
        version: 'v2',
      },
    ];
    const draft = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email, PushNotification],
        version: 'v1',
      },
      {
        notificationType: ShiftStartBefore,
        distributionMethods: [PushNotification],
        version: 'v2',
      },
    ];
    const result = buildScheduleNotificationsManageInput(
      SETTINGS_FOR,
      saved,
      draft,
    );
    expect(result).not.toBeUndefined();
    expect(result.scheduleNotifications.subscriptions).toHaveLength(1);
    expect(result.scheduleNotifications.subscriptions[0]).toMatchObject({
      notificationType: ShiftPublished,
      distributionMethods: [Email, PushNotification],
      version: 'v1',
    });
  });

  it('omits version for first-time creates (row not in saved)', () => {
    const result = buildScheduleNotificationsManageInput(
      SETTINGS_FOR,
      [],
      [{ notificationType: ShiftPublished, distributionMethods: [Email] }],
    );
    expect(result.scheduleNotifications.subscriptions[0]).not.toHaveProperty(
      'version',
    );
  });

  it('includes version when row exists in saved', () => {
    const saved = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [],
        version: 'v3',
      },
    ];
    const draft = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v3',
      },
    ];
    const result = buildScheduleNotificationsManageInput(
      SETTINGS_FOR,
      saved,
      draft,
    );
    expect(result.scheduleNotifications.subscriptions[0].version).toBe('v3');
  });

  it('includes all changed rows when multiple rows differ', () => {
    const saved = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v1',
      },
      {
        notificationType: ShiftStartBefore,
        distributionMethods: [PushNotification],
        version: 'v2',
      },
    ];
    const draft = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [],
        version: 'v1',
      },
      {
        notificationType: ShiftStartBefore,
        distributionMethods: [Email],
        version: 'v2',
      },
    ];
    const result = buildScheduleNotificationsManageInput(
      SETTINGS_FOR,
      saved,
      draft,
    );
    expect(result.scheduleNotifications.subscriptions).toHaveLength(2);
  });

  it('detects channel removal as a change', () => {
    const saved = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email, PushNotification],
        version: 'v1',
      },
    ];
    const draft = [
      {
        notificationType: ShiftPublished,
        distributionMethods: [Email],
        version: 'v1',
      },
    ];
    const result = buildScheduleNotificationsManageInput(
      SETTINGS_FOR,
      saved,
      draft,
    );
    expect(result).not.toBeUndefined();
    expect(
      result.scheduleNotifications.subscriptions[0].distributionMethods,
    ).toEqual([Email]);
  });

  it('strips displayName from settingsFor, retaining only id and timeForType', () => {
    const settingsForWithDisplayName = {
      id: 'user-1',
      timeForType: 'EMPLOYEE',
      displayName: 'Alice',
    } as any;
    const draft = [
      { notificationType: ShiftPublished, distributionMethods: [Email] },
    ];
    const result = buildScheduleNotificationsManageInput(
      settingsForWithDisplayName,
      [],
      draft,
    );
    expect(result.settingsFor).toEqual({
      id: 'user-1',
      timeForType: 'EMPLOYEE',
    });
  });
});
