import {
  APPROVAL_SETTINGS_TRACKING_FIELDS,
  TrackingPoint,
} from 'src/js/common/useClickTracking';
import {
  ReminderRole,
  ReminderPosition,
  ReminderFieldType,
  TRACKING_FIELD_MAPPING,
  ModeMapping,
  RoleMapping,
  PositionMapping,
  FieldTypeMapping,
  TrackingElementType,
} from '../constants';

export const getTrackingFieldName = (
  role: ReminderRole,
  mode: string,
  reminderPosition: ReminderPosition,
  fieldType: ReminderFieldType | 'checkbox',
): string => {
  try {
    const roleMapping: ModeMapping = (TRACKING_FIELD_MAPPING as RoleMapping)[
      role
    ];
    if (!roleMapping) return '';

    const modeMapping: PositionMapping | undefined = roleMapping[mode];
    if (!modeMapping) return '';

    const positionMapping: FieldTypeMapping = modeMapping[reminderPosition];

    return positionMapping[fieldType as keyof FieldTypeMapping] || '';
  } catch (error) {
    // Return empty string if mapping doesn't exist
    return '';
  }
};

/**
 * Generic function to build tracking data based on element type
 * @param elementType - The type of UI element (checkbox, time_dropdown, day_dropdown)
 * @param mode - The reminder mode
 * @param reminderPosition - Whether this is the first or second reminder
 * @param role - The role (MANAGER or EMPLOYEE)
 * @param objectDetail - The object detail (e.g., 'notifications_approvals' or 'notifications_submissions')
 * @param isEnabled - Whether the element is enabled (only for checkbox)
 * @returns The tracking point object
 */
export const buildNotificationTrackingData = (
  elementType: TrackingElementType,
  mode: string,
  reminderPosition: ReminderPosition,
  role: ReminderRole,
  objectDetail: string,
  isEnabled?: boolean,
): TrackingPoint => {
  let baseTrackingField: TrackingPoint;
  let fieldType: ReminderFieldType | 'checkbox';

  // Determine base tracking field and field type based on element type
  switch (elementType) {
    case TrackingElementType.CHECKBOX:
      baseTrackingField =
        APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_REMINDER_CHECKBOX;
      fieldType = 'checkbox';
      break;
    case TrackingElementType.TIME_DROPDOWN:
      baseTrackingField =
        APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_TIME_DROPDOWN;
      fieldType = ReminderFieldType.TIME;
      break;
    case TrackingElementType.DAY_DROPDOWN:
      baseTrackingField =
        APPROVAL_SETTINGS_TRACKING_FIELDS.NOTIFICATION_DAY_DROPDOWN;
      fieldType = ReminderFieldType.DAY;
      break;
    default:
      throw new Error(`Unknown element type: ${elementType}`);
  }

  const uiObjectDetail = getTrackingFieldName(
    role,
    mode,
    reminderPosition,
    fieldType,
  );

  const trackingData: TrackingPoint = {
    ...baseTrackingField,
    object_detail: objectDetail,
    ui_object_detail: uiObjectDetail,
  };

  // Add ui_action for checkboxes
  if (elementType === TrackingElementType.CHECKBOX && isEnabled !== undefined) {
    trackingData.ui_action = isEnabled ? 'enabled' : 'disabled';
  }

  return trackingData;
};
