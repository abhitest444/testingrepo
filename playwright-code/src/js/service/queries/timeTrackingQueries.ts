/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

const TIME_ENTRY_FRAGMENT = gql`
  fragment TimeEntryParts on TimeTracking_TimeEntry {
    id
    alternateIds {
      id
      nameSpace
    }
    timeForType
    timeFor {
      ... on WorkerManagement_Employee {
        id
      }
      ... on Commerce_Vendor {
        id
      }
      ... on TimeTracking_LegacyQboUser {
        id
      }
    }
    date
    startTime
    endTime
    v3StartTime
    v3EndTime
    duration
    v3DurationDetails {
      hours
      minutes
      seconds
    }
    v3BreakDuration
    v3BreakDurationDetails {
      hours
      minutes
      seconds
    }
    timeAgainst {
      project {
        id
      }
      customer {
        id
      }
    }
    class {
      id
    }
    serviceItem {
      id
    }
    payrollItem {
      id
    }
    department {
      id
    }
    billableRate
    costRate
    notes
    taxable
    billableStatus
    v3TransactionLocationType
    isOpen
    isSubmitted
    approvalStatus
    isExported
    isTimeOffEntry
    timeZone
    attachmentsCount
    locked
    lockedReason
    invoiceId
    timeZone
    meta {
      createdAt
      updatedAt
      createdBy
      version
    }
    legacyCustomFields {
      id
      name
      value
    }
    customExtensions {
      dimensions {
        definition {
          id
        }
        values
      }
    }
    timeBreakId
    distanceTracking {
      autoCalculatedMeters
      manualMeters
    }
    hasGeoLocationPoints
  }
`;

export const CREATE_TIME_ENTRY_MUTATION = gql`
  mutation createTimeEntry($input: TimeTracking_CreateTimeEntryInput!) {
    timeTrackingCreateTimeEntry(input: $input) {
      ... on TimeTracking_CreateTimeEntryPayload {
        successCode
        timeEntries {
          ...TimeEntryParts
        }
      }
      ... on TimeTracking_MutationError {
        errorCode
        message
        details
        subCode
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export const UPDATE_TIME_ENTRY_MUTATION = gql`
  mutation updateTimeEntry($input: TimeTracking_UpdateTimeEntryInput!) {
    timeTrackingUpdateTimeEntry(input: $input) {
      ... on TimeTracking_UpdateTimeEntryPayload {
        successCode
        timeEntries {
          ...TimeEntryParts
        }
      }
      ... on TimeTracking_UpdateTimeEntryError {
        errorCode
        message
        details
        subCode
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export const DELETE_TIME_ENTRY_MUTATION = gql`
  mutation deleteTimeEntry($input: TimeTracking_DeleteTimeEntryInput!) {
    timeTrackingDeleteTimeEntry(input: $input) {
      ... on TimeTracking_DeleteTimeEntryPayload {
        successCode
      }
      ... on TimeTracking_DeleteTimeEntryError {
        errorCode
        message
        details
        subCode
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export const GET_TIME_ENTRY_QUERY = gql`
  query getTimeEntry($input: TimeTracking_TimeEntryInput!) {
    timeTrackingTimeEntry(input: $input) {
      ...TimeEntryParts
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export const SEARCH_TIME_ENTRIES_QUERY = gql`
  query searchTimeEntries(
    $input: TimeTracking_TimeEntriesInput!
    $first: Int
    $after: String
    $offset: Int
  ) {
    timeTrackingTimeEntries(
      input: $input
      first: $first
      after: $after
      offset: $offset
    ) {
      edges {
        node {
          ...TimeEntryParts
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;

export const BATCH_SAVE_TIME_ENTRIES = gql`
  mutation batchSaveTimeEntries(
    $input: TimeTracking_BatchManageTimeEntriesInput!
  ) {
    timeTrackingBatchManageTimeEntries(input: $input) {
      ... on TimeTracking_BatchManageTimeEntriesPayload {
        successCode
        timeEntries {
          ...TimeEntryParts
        }
        deletes
      }
      ... on TimeTracking_BatchManageTimeEntriesError {
        __typename
        errorCode
        message
        details
        subCode
        element
      }
      ... on TimeTracking_PartialBatchManageTimeEntriesPayload {
        successCode
        timeEntries {
          ... on TimeTracking_TimeEntry {
            ...TimeEntryParts
          }
          ... on TimeTracking_UpdateTimeEntryError {
            __typename
            errorCode
            message
            details
            subCode
            element
          }
        }
        deletes
      }
    }
  }
  ${TIME_ENTRY_FRAGMENT}
`;
export const COMPANY_SETTINGS_QUERY = gql`
  query EmployerSetting($input: TimeTracking_EmployerSettingsInput) {
    timeTrackingEmployerSettings(input: $input) {
      billingForTimeEnabled {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      useItemForTime {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      transactionBillingForTimeEnabled {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      transactionTimeTrackingEnabled {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      timeTrackingEnabled {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      billingRateForTimeEnabled {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      timeTrackingSupported {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }
      startWorkWeek {
        meta {
          createdAt
          updatedAt
          createdBy
          updatedBy
          version
        }
        value
      }

      coreSettings {
        requireBillable {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
        classRequired {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
        locationRequired {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
        serviceItemRequired {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
      }
      dateTimeSettings {
        timeZone {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
        clockFormat {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
      }
      timesheetManagementSettings {
        notes {
          enabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          editEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          requiredEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
        timesheet {
          manageOwnTimesheetEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          editClockOutTimeEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          clockOutOverrideHours {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          splitAtMidnightEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          locationTracking {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          mileageTrackingEnabled {
            meta {
              ...MetaFields
            }
            value
          }
          mobileTimeTrackingEnabled {
            meta {
              ...MetaFields
            }
            value
          }
          signatureCaptureEnabled {
            meta {
              ...MetaFields
            }
            value
          }
        }
        customFields {
          customersEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          classEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          locationEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          customDimensions {
            dimensionDefinition {
              id
            }
            enabledForTimeTracking {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            required {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
          }
        }
      }
      notificationSettings {
        startShiftNotifications {
          reminderTime {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          notificationMedium {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
        endShiftNotifications {
          reminderTime {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          notificationMedium {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
        notificationEnabledForDays {
          meta {
            createdAt
            updatedAt
            createdBy
            updatedBy
            version
          }
          value
        }
        clockOutOverrideNotifications {
          adminEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          groupManagerEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
        timesheetEditNotifications {
          adminEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          groupManagerEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
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
        scheduleNotifications {
          publishShiftChangePreference {
            meta {
              version
            }
            value
          }
          subscriptions {
            meta {
              version
            }
            notificationType
            distributionMethods
          }
        }
      }
      clockRoundingSettings {
        startTimeRounding {
          direction {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          roundInMin {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
        endTimeRounding {
          direction {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          roundInMin {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
        }
      }
      geofenceSettings {
        geofenceEnabled {
          meta {
            version
          }
          value
        }
        geofenceReminderSettings {
          startTime {
            meta {
              version
            }
            value
          }
          endTime {
            meta {
              version
            }
            value
          }
          daysOfWeek {
            meta {
              version
            }
            value
          }
        }
      }
      scheduleSettings {
        manage {
          meta {
            version
          }
          value
        }
        view {
          meta {
            version
          }
          value
        }
      }
      kioskSettings {
        inactivityTimeout {
          meta {
            version
          }
          value
        }
      }
    }
  }
`;

export const UPDATE_COMPANY_SETTINGS_MUTATION = gql`
  mutation timeTrackingUpdateEmployerSettings(
    $input: TimeTracking_UpdateEmployerSettingsInput!
  ) {
    timeTrackingUpdateEmployerSettings(input: $input) {
      ... on TimeTracking_UpdateEmployerSettingsPayload {
        successCode
        employerSettings {
          billingForTimeEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          useItemForTime {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          transactionBillingForTimeEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          transactionTimeTrackingEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          timeTrackingEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          billingRateForTimeEnabled {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          timeTrackingSupported {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }
          startWorkWeek {
            meta {
              createdAt
              updatedAt
              createdBy
              updatedBy
              version
            }
            value
          }

          coreSettings {
            requireBillable {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            classRequired {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            locationRequired {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            serviceItemRequired {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
          }
          dateTimeSettings {
            timeZone {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            clockFormat {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
          }
          timesheetManagementSettings {
            notes {
              enabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              editEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              requiredEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
            timesheet {
              manageOwnTimesheetEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              editClockOutTimeEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              clockOutOverrideHours {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              splitAtMidnightEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              locationTracking {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              mileageTrackingEnabled {
                meta {
                  ...MetaFields
                }
                value
              }
              mobileTimeTrackingEnabled {
                meta {
                  ...MetaFields
                }
                value
              }
              signatureCaptureEnabled {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            customFields {
              customersEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              classEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              locationEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              customDimensions {
                dimensionDefinition {
                  id
                }
                enabledForTimeTracking {
                  meta {
                    createdAt
                    updatedAt
                    createdBy
                    updatedBy
                    version
                  }
                  value
                }
                required {
                  meta {
                    createdAt
                    updatedAt
                    createdBy
                    updatedBy
                    version
                  }
                  value
                }
              }
            }
          }
          notificationSettings {
            startShiftNotifications {
              reminderTime {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              notificationMedium {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
            endShiftNotifications {
              reminderTime {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              notificationMedium {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
            notificationEnabledForDays {
              meta {
                createdAt
                updatedAt
                createdBy
                updatedBy
                version
              }
              value
            }
            clockOutOverrideNotifications {
              adminEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              groupManagerEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
            timesheetEditNotifications {
              adminEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              groupManagerEnabled {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
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
            scheduleNotifications {
              publishShiftChangePreference {
                meta {
                  version
                }
                value
              }
              subscriptions {
                meta {
                  version
                }
                notificationType
                distributionMethods
              }
            }
          }
          clockRoundingSettings {
            startTimeRounding {
              direction {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              roundInMin {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
            endTimeRounding {
              direction {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
              roundInMin {
                meta {
                  createdAt
                  updatedAt
                  createdBy
                  updatedBy
                  version
                }
                value
              }
            }
          }
          geofenceSettings {
            geofenceEnabled {
              meta {
                ...MetaFields
              }
              value
            }
            geofenceReminderSettings {
              startTime {
                meta {
                  ...MetaFields
                }
                value
              }

              endTime {
                meta {
                  ...MetaFields
                }
                value
              }
              daysOfWeek {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
          scheduleSettings {
            manage {
              meta {
                version
              }
              value
            }
            view {
              meta {
                version
              }
              value
            }
          }
          kioskSettings {
            inactivityTimeout {
              meta {
                ...MetaFields
              }
              value
            }
          }
        }
      }
      ... on TimeTracking_UpdateEmployerSettingsError {
        errorCode
        message
        details
        subCode
      }
    }
  }
`;

// EMPLOYEE_TIME_SUMMARY_BY_TIME_WINDOW_QUERY
//
// Input: TimeTracking_TotalDurationByTimeWindowInput
// {
//   timeForEntityId: string; // unique ID of the user/entity to fetch time for
//   timeWindow: 'WEEK' | 'MONTH'; // the time window to fetch duration for
//   timeWindowOffset: number; // 0 = current, -1 = previous, 1 = next, etc.
// }
// Example:
// {
//   timeForEntityId: 'abc123',
//   timeWindow: 'WEEK',
//   timeWindowOffset: 0
// }
export const EMPLOYEE_TIME_SUMMARY_BY_TIME_WINDOW_QUERY = gql`
  query getTotalWorkDurationByTimeWindow(
    $input: TimeTracking_TotalDurationByTimeWindowInput!
  ) {
    timeTrackingTotalDurationByTimeWindow(input: $input) {
      totalDurationSeconds
    }
  }
`;

export const GET_TOTAL_DURATION_BY_DATE_QUERY = gql`
  query getTotalDurationByDate($input: TimeTracking_TotalDurationByDateInput) {
    timeTrackingTotalDurationByDate(input: $input) {
      edges {
        node {
          date
          totalDurationSeconds
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY = gql`
  query getTimeTrackingCustomFields(
    $filter: TimeTracking_CustomFieldsInputFilter!
  ) {
    timeTrackingCustomFields(filter: $filter) {
      totalCustomerCount
      totalWorkerCount
      edges {
        node {
          id
          name
          type
          deleted
          required
          customerAssignmentCount
          options {
            id
            name
            deleted
            workerAssignmentCount
            timeAgainstAssignmentCount
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

// Query to fetch only essential custom field metadata for assignments UI
// This is a lightweight version that fetches only id, name, type, deleted, required
// without the heavy options array and assignment counts
export const GET_TIME_TRACKING_CUSTOM_FIELDS_ASSIGNMENTS_QUERY = gql`
  query getTimeTrackingCustomFieldsAssignments(
    $filter: TimeTracking_CustomFieldsInputFilter!
  ) {
    timeTrackingCustomFields(filter: $filter) {
      edges {
        node {
          id
          name
          type
          deleted
          required
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const GET_TIME_TRACKING_CUSTOM_DIMENSIONS_QUERY = gql`
  query getTimeTrackingCustomDimensions(
    $first: PositiveInt!
    $after: String
    $filter: TimeTracking_CustomDimensionsFilter
  ) {
    timeTrackingCustomDimensions(
      first: $first
      after: $after
      filter: $filter
    ) {
      edges {
        node {
          customDimensionDefinition {
            id
          }
          label
          enabledForTimeTracking
          required
          active
          workerDefaultDimensionValue {
            id
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

export const MANAGE_CUSTOM_FIELDS_MUTATION = gql`
  mutation timeTrackingManageCustomFields(
    $input: TimeTracking_ManageCustomFieldsInput!
  ) {
    timeTrackingManageCustomFields(input: $input) {
      ... on TimeTracking_ManageCustomFieldsPayload {
        successCode
        customFields {
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          edges {
            node {
              id
              name
              type
              deleted
              required
              options {
                id
                name
                deleted
              }
            }
            cursor
          }
        }
      }
      ... on TimeTracking_ManageCustomFieldsError {
        errorCode
        message
        details
        subCode
        element
      }
    }
  }
`;

const META_FRAGMENT = gql`
  fragment MetaFields on TimeTracking_SettingMeta {
    createdAt
    updatedAt
    createdBy
    updatedBy
    version
  }
`;

export const APPROVAL_SETTINGS_QUERY = gql`
  query getApprovalSettings {
    timeTrackingApprovalSettings {
      employee {
        approvalEnabled {
          meta {
            ...MetaFields
          }
          value
        }
        partialWeekApprovalEnabled {
          meta {
            ...MetaFields
          }
          value
        }
        submissionRequired {
          meta {
            ...MetaFields
          }
          value
        }
        submitMessage {
          meta {
            ...MetaFields
          }
          value
        }
        reminders {
          reminderBasedOn {
            meta {
              ...MetaFields
            }
            value
          }
          daily {
            reminderForTimesheetDays {
              meta {
                ...MetaFields
              }
              value
            }
            firstReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            secondReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
          week {
            currentWeekReminder {
              daysOfWeek {
                meta {
                  ...MetaFields
                }
                value
              }
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            previousWeekReminder {
              daysOfWeek {
                meta {
                  ...MetaFields
                }
                value
              }
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
          payPeriod {
            currentPeriodReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              offsetDays {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            previousPeriodReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              offsetDays {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
        }
      }
      manager {
        reminders {
          reminderBasedOn {
            meta {
              ...MetaFields
            }
            value
          }
          week {
            currentWeekReminder {
              daysOfWeek {
                meta {
                  ...MetaFields
                }
                value
              }
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            previousWeekReminder {
              daysOfWeek {
                meta {
                  ...MetaFields
                }
                value
              }
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
          payPeriod {
            currentPeriodReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              offsetDays {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
            previousPeriodReminder {
              hour {
                meta {
                  ...MetaFields
                }
                value
              }
              offsetDays {
                meta {
                  ...MetaFields
                }
                value
              }
              reminderMedium {
                meta {
                  ...MetaFields
                }
                value
              }
            }
          }
        }
      }
      submissionNotifications {
        notifyManagerOnSubmit {
          meta {
            ...MetaFields
          }
          value
        }
        notifyManagerOnGroupSubmitted {
          meta {
            ...MetaFields
          }
          value
        }
      }
    }
  }
  ${META_FRAGMENT}
`;

export const STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY = gql`
  query timeTrackingStandardFieldAssignmentSummary(
    $first: PositiveInt!
    $after: String
  ) {
    timeTrackingStandardFieldAssignmentSummary(first: $first, after: $after) {
      edges {
        node {
          standardFieldLabel
          assignedTimeAgainstCount
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalTimeAgainstAssignments
    }
  }
`;

export const UPDATE_APPROVAL_SETTINGS_MUTATION = gql`
  mutation timeTrackingUpdateApprovalSettings(
    $input: TimeTracking_UpdateApprovalSettingsInput!
  ) {
    timeTrackingUpdateApprovalSettings(input: $input) {
      ... on TimeTracking_UpdateApprovalSettingsPayload {
        successCode
        approvalSettings {
          employee {
            approvalEnabled {
              meta {
                ...MetaFields
              }
              value
            }
            partialWeekApprovalEnabled {
              meta {
                ...MetaFields
              }
              value
            }
            submissionRequired {
              meta {
                ...MetaFields
              }
              value
            }
            submitMessage {
              meta {
                ...MetaFields
              }
              value
            }
            reminders {
              reminderBasedOn {
                meta {
                  ...MetaFields
                }
                value
              }
              daily {
                reminderForTimesheetDays {
                  meta {
                    ...MetaFields
                  }
                  value
                }
                firstReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
                secondReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
              }
              week {
                currentWeekReminder {
                  daysOfWeek {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
                previousWeekReminder {
                  daysOfWeek {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
              }
              payPeriod {
                currentPeriodReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  offsetDays {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
                previousPeriodReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  offsetDays {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
              }
            }
          }
          manager {
            reminders {
              reminderBasedOn {
                meta {
                  ...MetaFields
                }
                value
              }
              week {
                currentWeekReminder {
                  daysOfWeek {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
                previousWeekReminder {
                  daysOfWeek {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
              }
              payPeriod {
                currentPeriodReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  offsetDays {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
                previousPeriodReminder {
                  hour {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  offsetDays {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                  reminderMedium {
                    meta {
                      ...MetaFields
                    }
                    value
                  }
                }
              }
            }
          }
          submissionNotifications {
            notifyManagerOnSubmit {
              meta {
                ...MetaFields
              }
              value
            }
            notifyManagerOnGroupSubmitted {
              meta {
                ...MetaFields
              }
              value
            }
          }
        }
      }
      ... on TimeTracking_UpdateApprovalSettingsError {
        errorCode
        message
        details
        subCode
      }
    }
  }
  ${META_FRAGMENT}
`;
