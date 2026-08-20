import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { EditScheduleNotificationSettings } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/notifications/EditScheduleNotificationSettings';
import {
  NotificationFieldKey,
  ScheduleNotificationSendMode,
} from 'src/js/widgets/timeTrackingSettings/constants';
import type { ITimeEntrySettingsFormState } from 'src/js/widgets/timeTrackingSettings/types';
import { TimeTracking_NotificationReminderMedium } from 'src/__generated__/timeTracking/graphql';

jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({ formatMessage: ({ id }: { id: string }) => id }),
  useTracking: jest.fn(() => jest.fn()),
}));

// Render the @ids-ts primitives as simple DOM so we can drive onChange directly.
jest.mock('@ids-ts/checkbox', () => ({
  Checkbox: ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="schedule-checkbox"
    />
  ),
}));

jest.mock('@ids-ts/radio', () => ({
  RadioGroup: ({
    value,
    disabled,
    onChange,
    options,
  }: {
    value: string;
    disabled: boolean;
    onChange: (e: { target: { value: string } }) => void;
    options: { value: string; label: string }[];
  }) => (
    <select
      data-testid="send-mode-radio"
      data-disabled={String(disabled)}
      value={value ?? ''}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

const { Email, PushNotification } = TimeTracking_NotificationReminderMedium;

// Channel field defaults: each row's enabled distributionMethods.
const defaultChannels: Partial<ITimeEntrySettingsFormState> = {
  shiftPublishedSendMode: ScheduleNotificationSendMode.ALWAYS_SEND,
  [NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS]: [
    Email,
    PushNotification,
  ],
  [NotificationFieldKey.SCHEDULE_ONE_HOUR_CHANNELS]: [Email],
  [NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_STARTED_CHANNELS]: [
    Email,
  ],
  [NotificationFieldKey.SCHEDULE_FORGOT_CLOCK_IN_AFTER_ENDED_CHANNELS]: [
    PushNotification,
  ],
  [NotificationFieldKey.SCHEDULE_LATE_CLOCK_IN_NOTIFY_MANAGER_CHANNELS]: [],
};

const Harness: React.FC<{
  defaultValues?: Partial<ITimeEntrySettingsFormState>;
}> = ({ defaultValues = defaultChannels }) => {
  const methods = useForm<ITimeEntrySettingsFormState>({
    defaultValues: defaultValues as ITimeEntrySettingsFormState,
  });
  return (
    <FormProvider {...methods}>
      <EditScheduleNotificationSettings />
    </FormProvider>
  );
};

describe('EditScheduleNotificationSettings', () => {
  it('renders the schedule edit section with all rows', () => {
    render(<Harness />);
    expect(screen.getByTestId('schedule-notifications-edit')).toBeTruthy();
    expect(screen.getByTestId('send-mode-radio')).toBeTruthy();
    // 5 channel rows × 2 checkboxes each = 10
    expect(screen.getAllByTestId('schedule-checkbox')).toHaveLength(10);
  });

  it('reflects the seeded channel values on the checkboxes', () => {
    render(<Harness />);
    const checkboxes = screen.getAllByTestId(
      'schedule-checkbox',
    ) as HTMLInputElement[];
    // Order: [shiftPublished E, M], [oneHour E, M], [started E, M],
    //        [ended E, M], [notifyManager E, M]
    expect(checkboxes.map((c) => c.checked)).toEqual([
      true, // shiftPublished email
      true, // shiftPublished mobile
      true, // oneHour email
      false, // oneHour mobile
      true, // started email
      false, // started mobile
      false, // ended email
      true, // ended mobile
      false, // notifyManager email
      false, // notifyManager mobile
    ]);
  });

  it('enables the send-mode radio when at least one shift-published channel is on', () => {
    render(<Harness />);
    expect(
      screen.getByTestId('send-mode-radio').getAttribute('data-disabled'),
    ).toBe('false');
  });

  it('disables the send-mode radio when both shift-published channels are off', () => {
    render(
      <Harness
        defaultValues={{
          ...defaultChannels,
          [NotificationFieldKey.SCHEDULE_SHIFT_PUBLISHED_CHANNELS]: [],
        }}
      />,
    );
    expect(
      screen.getByTestId('send-mode-radio').getAttribute('data-disabled'),
    ).toBe('true');
  });

  it('toggles a channel checkbox off when clicked', () => {
    render(<Harness />);
    const [shiftEmail] = screen.getAllByTestId(
      'schedule-checkbox',
    ) as HTMLInputElement[];
    expect(shiftEmail.checked).toBe(true);
    fireEvent.click(shiftEmail);
    expect(
      (screen.getAllByTestId('schedule-checkbox')[0] as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it('toggles a channel checkbox on when clicked from off', () => {
    render(<Harness />);
    // Index 9 = notifyManager mobile, seeded off.
    const mobile = screen.getAllByTestId(
      'schedule-checkbox',
    )[9] as HTMLInputElement;
    expect(mobile.checked).toBe(false);
    fireEvent.click(mobile);
    expect(
      (screen.getAllByTestId('schedule-checkbox')[9] as HTMLInputElement)
        .checked,
    ).toBe(true);
  });
});
