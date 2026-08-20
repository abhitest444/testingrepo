import gql from 'graphql-tag';

export const GET_UNIFIED_USER_SETTINGS = gql`
  query TimeTrackingUnifiedUserSettings(
    $input: TimeTracking_UnifiedUserSettingsInput!
  ) {
    timeTrackingUnifiedUserSettings(input: $input) {
      locationTracking {
        meta {
          createdBy
          updatedBy
          createdAt
          updatedAt
          version
        }
        value
        effectiveValue
      }
      scheduleNotifications {
        subscriptions {
          meta {
            version
          }
          notificationType
          distributionMethods
        }
      }
    }
  }
`;

export const TimeTrackingManageUnifiedUserSettingsDocument = gql`
  mutation timeTrackingManageUnifiedUserSettings(
    $input: TimeTracking_ManageUnifiedUserSettingsInput!
  ) {
    timeTrackingManageUnifiedUserSettings(input: $input) {
      ... on TimeTracking_ManageUnifiedUserSettingsPayload {
        successCode
        userSettings {
          locationTracking {
            value
            effectiveValue
            meta {
              version
            }
          }
        }
      }
      ... on TimeTracking_ManageUnifiedUserSettingsError {
        errorCode
        message
        details
      }
    }
  }
`;

export const GET_USER_OVERTIME_NOTIFICATIONS = gql`
  query GetUserOvertimeNotifications(
    $input: TimeTracking_UnifiedUserSettingsInput!
  ) {
    timeTrackingUnifiedUserSettings(input: $input) {
      overtimeNotifications {
        rules {
          id
          meta {
            version
            createdBy
            createdAt
            updatedBy
            updatedAt
          }
          threshold {
            hours
            minutes
            period
          }
          alertFrequency {
            totalAlerts
            intervalMinutes
          }
          recipients {
            admin
            groupManager
            employee
          }
          assignedTo {
            entityType
            entityIds
          }
        }
      }
    }
  }
`;

export const ManageUserOvertimeNotificationsDocument = gql`
  mutation ManageUserOvertimeNotifications(
    $input: TimeTracking_ManageUnifiedUserSettingsInput!
  ) {
    timeTrackingManageUnifiedUserSettings(input: $input) {
      ... on TimeTracking_ManageUnifiedUserSettingsPayload {
        successCode
        userSettings {
          overtimeNotifications {
            rules {
              id
              meta {
                version
                createdBy
                createdAt
                updatedBy
                updatedAt
              }
              threshold {
                hours
                minutes
                period
              }
              alertFrequency {
                totalAlerts
                intervalMinutes
              }
              recipients {
                admin
                groupManager
                employee
              }
              assignedTo {
                entityType
                entityIds
              }
            }
          }
        }
      }
      ... on TimeTracking_ManageUnifiedUserSettingsError {
        errorCode
        message
        details
      }
    }
  }
`;

export const GET_USER_SCHEDULE_NOTIFICATIONS = gql`
  query GetUserScheduleNotifications(
    $input: TimeTracking_UnifiedUserSettingsInput!
  ) {
    timeTrackingUnifiedUserSettings(input: $input) {
      scheduleNotifications {
        subscriptions {
          meta {
            version
          }
          notificationType
          distributionMethods
        }
      }
    }
  }
`;

export const ManageUserScheduleNotificationsDocument = gql`
  mutation ManageUserScheduleNotifications(
    $input: TimeTracking_ManageUnifiedUserSettingsInput!
  ) {
    timeTrackingManageUnifiedUserSettings(input: $input) {
      ... on TimeTracking_ManageUnifiedUserSettingsPayload {
        successCode
        userSettings {
          scheduleNotifications {
            subscriptions {
              meta {
                version
              }
              notificationType
              distributionMethods
            }
          }
        }
      }
      ... on TimeTracking_ManageUnifiedUserSettingsError {
        errorCode
        message
        details
      }
    }
  }
`;

export const GET_USER_SETTINGS = gql`
  query timeTrackingEffectiveUserSettings(
    $input: TimeTracking_UserSettingsInput!
  ) {
    timeTrackingEffectiveUserSettings(input: $input) {
      clockInSetting {
        reminderTime {
          meta {
            version
          }
          value
        }
        notificationMedium {
          meta {
            version
          }
          value
        }
      }
      clockOutSetting {
        reminderTime {
          meta {
            version
          }
          value
        }
        notificationMedium {
          meta {
            version
          }
          value
        }
      }
      notificationEnabledForDays {
        meta {
          version
        }
        value
      }
    }
  }
`;

export const UPDATE_USER_SETTINGS = gql`
  mutation timeTrackingManageUserSettings(
    $input: TimeTracking_ManageUserSettingsInput!
  ) {
    timeTrackingManageUserSettings(input: $input) {
      ... on TimeTracking_ManageUserSettingsPayload {
        successCode
        userSettings {
          clockInSetting {
            reminderTime {
              meta {
                version
              }
              value
            }
            notificationMedium {
              meta {
                version
              }
              value
            }
          }
          clockOutSetting {
            reminderTime {
              meta {
                version
              }
              value
            }
            notificationMedium {
              meta {
                version
              }
              value
            }
          }
          notificationEnabledForDays {
            meta {
              version
            }
            value
          }
        }
      }
      ... on TimeTracking_ManageUserSettingsError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;
